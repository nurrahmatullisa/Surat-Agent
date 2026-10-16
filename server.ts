import express, { Request, Response } from 'express';
import path from 'path';
import multer from 'multer';
import mammoth from 'mammoth';
import { db, SuratMasuk, KategoriSurat, FasilitasBooking, TemplateSurat } from './src/server/db.js';
import { executeAgentLoop } from './src/server/agent-engine.js';
import { generateDocxBuffer } from './src/server/docx-generator.js';
import {
  toolDaftarSuratTertunda,
  toolSimpanContohRevisi,
  parseUploadedDocument,
} from './src/server/agent-tools.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Setup multer for upload handling (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'TU Smart Agent API', timestamp: new Date().toISOString() });
});

// Auth
app.get('/api/auth/me', (req, res) => {
  const users = db.get('users');
  res.json(users[0]);
});

app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  const users = db.get('users');
  const user = users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase()) || users[0];
  res.json({ success: true, user, token: 'mock-jwt-token-tu-blsdm' });
});

// Dashboard Summary & Proactive Reminders
app.get('/api/dashboard-summary', (req, res) => {
  const suratList = db.get('surat_masuk');
  const drafts = db.get('draft_balasan');
  const usulan = db.get('usulan_pembaruan');
  const fasilitas = db.get('fasilitas');

  const counts = {
    total_surat: suratList.length,
    surat_baru: suratList.filter((s) => s.status === 'diterima').length,
    sedang_diproses: suratList.filter((s) => s.status === 'diproses').length,
    bentrok: suratList.filter((s) => s.status === 'bentrok').length,
    draft_siap: suratList.filter((s) => s.status === 'draft').length,
    selesai: suratList.filter((s) => s.status === 'selesai').length,
    usulan_menunggu: usulan.filter((u) => u.status === 'menunggu').length,
    fasilitas_booking_count: fasilitas.length,
  };

  const proaktif = toolDaftarSuratTertunda();

  res.json({
    counts,
    pengingat_tertunda: proaktif.surat_tertunda,
    konflik_potensial_antar_surat: proaktif.konflik_potensial_antar_surat,
    usulan_terbaru: usulan.filter((u) => u.status === 'menunggu'),
    surat_terbaru: suratList.slice(0, 5),
    draft_terbaru: drafts.slice(0, 5),
  });
});

// Surat Masuk CRUD & Processing
app.get('/api/surat-masuk', (req, res) => {
  const { status, search } = req.query;
  let list = db.get('surat_masuk');

  if (status && status !== 'semua') {
    list = list.filter((s) => s.status === status);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(
      (s) =>
        s.pengirim.toLowerCase().includes(q) ||
        s.instansi_pengirim.toLowerCase().includes(q) ||
        s.perihal.toLowerCase().includes(q) ||
        s.nomor_surat_asal.toLowerCase().includes(q)
    );
  }
  res.json(list);
});

app.get('/api/surat-masuk/:id', (req, res) => {
  const surat = db.get('surat_masuk').find((s) => s.id === req.params.id);
  if (!surat) return res.status(404).json({ error: 'Surat masuk tidak ditemukan' });

  const drafts = db.get('draft_balasan').filter((d) => d.surat_masuk_id === surat.id);
  const runs = db.get('agent_runs').filter((r) => r.surat_masuk_id === surat.id);
  const steps = runs.length > 0 ? db.get('agent_steps').filter((st) => st.run_id === runs[0].id) : [];

  res.json({
    surat,
    draft: drafts[0] || null,
    latest_run: runs[0] || null,
    steps,
  });
});

// Parse preview endpoint for uploaded file
app.post('/api/surat-masuk/parse-preview', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Tidak ada berkas yang diunggah' });
  }

  try {
    const parsed = await parseUploadedDocument(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );
    res.json({ success: true, parsed });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// Upload Surat Masuk (Supports PDF, DOCX, & Image files)
app.post('/api/surat-masuk/upload', upload.single('file'), async (req, res) => {
  const {
    pengirim,
    instansi_pengirim,
    perihal,
    nomor_surat_asal,
    tanggal_surat_asal,
    teks_manual,
    tanggal_diminta,
    ruangan_diminta,
    jumlah_peserta,
    auto_process,
  } = req.body;

  let parsedData = {
    teks: teks_manual || '',
    pengirim,
    instansi_pengirim,
    perihal,
    nomor_surat_asal,
    tanggal_surat_asal,
    tanggal_diminta,
    ruangan_diminta,
    jumlah_peserta: jumlah_peserta ? parseInt(jumlah_peserta, 10) : undefined,
  };

  // If a real file was uploaded, parse it with Mammoth/PDF-parse/Gemini
  if (req.file) {
    try {
      const fileParsed = await parseUploadedDocument(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );
      parsedData.teks = fileParsed.teks || parsedData.teks;
      if (!parsedData.pengirim && fileParsed.pengirim) parsedData.pengirim = fileParsed.pengirim;
      if (!parsedData.instansi_pengirim && fileParsed.instansi_pengirim) parsedData.instansi_pengirim = fileParsed.instansi_pengirim;
      if (!parsedData.perihal && fileParsed.perihal) parsedData.perihal = fileParsed.perihal;
      if (!parsedData.nomor_surat_asal && fileParsed.nomor_surat_asal) parsedData.nomor_surat_asal = fileParsed.nomor_surat_asal;
      if (!parsedData.ruangan_diminta && fileParsed.ruangan_diminta) parsedData.ruangan_diminta = fileParsed.ruangan_diminta;
    } catch (e) {
      console.warn('File parsing error, using form fields:', e);
    }
  }

  const suratList = db.get('surat_masuk');
  const count = suratList.length + 1;
  const now = new Date();
  const pad = count < 10 ? `00${count}` : count < 100 ? `0${count}` : `${count}`;

  const fileName = req.file ? req.file.originalname : `Surat_Masuk_${pad}.pdf`;
  const fileExt = fileName.split('.').pop()?.toLowerCase();
  const fileType: SuratMasuk['file_type'] = fileExt === 'docx' ? 'docx' : fileExt === 'png' || fileExt === 'jpg' || fileExt === 'jpeg' ? 'image' : 'pdf';

  const newSurat: SuratMasuk = {
    id: `sm-2026-${pad}`,
    nomor_agenda: `AGD/${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${pad}`,
    file_name: fileName,
    file_type: fileType,
    pengirim: parsedData.pengirim || 'Pemohon Dinas',
    instansi_pengirim: parsedData.instansi_pengirim || 'Instansi Terkait',
    perihal: parsedData.perihal || 'Permohonan Kerjasama',
    nomor_surat_asal: parsedData.nomor_surat_asal || `01/${pad}/V/2026`,
    tanggal_surat_asal: parsedData.tanggal_surat_asal || now.toISOString().split('T')[0],
    tanggal_diterima: now.toISOString().split('T')[0],
    status: 'diterima',
    teks_hasil_baca: parsedData.teks || `Surat Masuk dari ${parsedData.instansi_pengirim || 'Pemohon'}. Perihal: ${parsedData.perihal}`,
    data_ekstraksi: {
      nama_pemohon: parsedData.pengirim,
      jumlah_peserta: parsedData.jumlah_peserta,
      nama_kegiatan: parsedData.perihal,
      ruangan_diminta: parsedData.ruangan_diminta,
      tanggal_diminta: parsedData.tanggal_diminta,
    },
    diupload_oleh: 'usr-001',
    created_at: now.toISOString(),
  };

  suratList.unshift(newSurat);
  db.set('surat_masuk', suratList);

  db.appendAuditLog('usr-001', 'Siti Nurhaliza, S.AP', 'UPLOAD_SURAT', 'surat_masuk', newSurat.id, {
    file_name: fileName,
    perihal: newSurat.perihal,
  });

  if (auto_process === 'true' || auto_process === true) {
    try {
      const agentResult = await executeAgentLoop({ surat_masuk_id: newSurat.id });
      return res.json({
        success: true,
        surat: agentResult.surat,
        agent_run: agentResult.run,
        draft_id: agentResult.draft_id,
        bentrok_detected: agentResult.bentrok_detected,
        alternatif_jadwal: agentResult.alternatif_jadwal,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: msg, surat: newSurat });
    }
  }

  res.json({ success: true, surat: newSurat });
});

// Run Agent Loop for a Surat Masuk
app.post('/api/surat-masuk/:id/process-agent', async (req, res) => {
  try {
    const result = await executeAgentLoop({ surat_masuk_id: req.params.id });
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// Resolve Conflict by choosing alternative schedule/room and re-processing agent
app.post('/api/surat-masuk/:id/resolve-conflict', async (req, res) => {
  const { alternatif_tanggal, alternatif_ruangan } = req.body;
  try {
    const result = await executeAgentLoop({
      surat_masuk_id: req.params.id,
      override_tanggal: alternatif_tanggal,
      override_ruangan: alternatif_ruangan,
    });
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// Drafts
app.get('/api/drafts', (req, res) => {
  res.json(db.get('draft_balasan'));
});

app.get('/api/drafts/:id', (req, res) => {
  const draft = db.get('draft_balasan').find((d) => d.id === req.params.id);
  if (!draft) return res.status(404).json({ error: 'Draft tidak ditemukan' });

  const surat = db.get('surat_masuk').find((s) => s.id === draft.surat_masuk_id);
  res.json({ draft, surat });
});

// Staff modifies draft: triggers learning from staff revision
app.put('/api/drafts/:id', (req, res) => {
  const drafts = db.get('draft_balasan');
  const index = drafts.findIndex((d) => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Draft tidak ditemukan' });

  const currentDraft = drafts[index];
  const { teks_surat, nomor_manual, catatan_alasan_revisi } = req.body;

  const teksSebelum = `${currentDraft.teks_surat.pembuka} ${currentDraft.teks_surat.isi}`;
  const teksSesudah = `${teks_surat?.pembuka || currentDraft.teks_surat.pembuka} ${teks_surat?.isi || currentDraft.teks_surat.isi}`;

  let usulanResult = null;
  if (teksSebelum !== teksSesudah) {
    usulanResult = toolSimpanContohRevisi({
      draft_id: currentDraft.id,
      teks_sebelum: teksSebelum,
      teks_sesudah: teksSesudah,
      alasan: catatan_alasan_revisi || 'Koreksi editorial oleh staf TU',
      user_id: 'usr-001',
    });
  }

  if (teks_surat) {
    currentDraft.teks_surat = {
      ...currentDraft.teks_surat,
      ...teks_surat,
    };
  }
  if (nomor_manual) {
    currentDraft.nomor_surat_text = nomor_manual;
  }
  currentDraft.updated_at = new Date().toISOString();
  db.save();

  db.appendAuditLog('usr-001', 'Siti Nurhaliza, S.AP', 'UPDATE_DRAFT', 'draft_balasan', currentDraft.id, {
    nomor: currentDraft.nomor_surat_text,
    usulan_dibuat: !!usulanResult,
  });

  res.json({ success: true, draft: currentDraft, usulan: usulanResult });
});

// Download Genuine Word (.docx) Document
app.get('/api/drafts/:id/download-docx', async (req, res) => {
  const draft = db.get('draft_balasan').find((d) => d.id === req.params.id);
  if (!draft) return res.status(404).json({ error: 'Draft tidak ditemukan' });

  try {
    const buffer = await generateDocxBuffer(draft);
    const sanitizedNomor = draft.nomor_surat_text.replace(/[/\\?%*:|"<>]/g, '_');
    const filename = `Draft_Balasan_${sanitizedNomor}.docx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err: unknown) {
    console.error('Error generating DOCX:', err);
    res.status(500).json({ error: 'Gagal membuat file dokumen Word .docx' });
  }
});

// -------------------------------------------------------------
// KATEGORI CRUD (View, Edit, Delete, Buat Baru)
// -------------------------------------------------------------
app.get('/api/kategori', (req, res) => {
  res.json(db.get('kategori'));
});

app.post('/api/kategori', (req, res) => {
  const { nama, kode_klasifikasi, template_id, deskripsi } = req.body;
  if (!nama || !kode_klasifikasi) {
    return res.status(400).json({ error: 'Nama dan kode klasifikasi wajib diisi' });
  }
  const kategoriList = db.get('kategori');
  const newKat: KategoriSurat = {
    id: `kat-${Date.now()}`,
    nama,
    kode_klasifikasi,
    template_id: template_id || 'tmpl-004',
    deskripsi: deskripsi || '',
    aktif: true,
    created_at: new Date().toISOString(),
  };
  kategoriList.push(newKat);
  db.set('kategori', kategoriList);

  db.appendAuditLog('usr-001', 'Siti Nurhaliza, S.AP', 'CREATE_KATEGORI', 'kategori', newKat.id, {
    nama: newKat.nama,
    kode: newKat.kode_klasifikasi,
  });

  res.json(newKat);
});

app.put('/api/kategori/:id', (req, res) => {
  const kategoriList = db.get('kategori');
  const index = kategoriList.findIndex((k) => k.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Kategori tidak ditemukan' });

  const { nama, kode_klasifikasi, template_id, deskripsi, aktif } = req.body;
  kategoriList[index] = {
    ...kategoriList[index],
    nama: nama || kategoriList[index].nama,
    kode_klasifikasi: kode_klasifikasi || kategoriList[index].kode_klasifikasi,
    template_id: template_id !== undefined ? template_id : kategoriList[index].template_id,
    deskripsi: deskripsi !== undefined ? deskripsi : kategoriList[index].deskripsi,
    aktif: aktif !== undefined ? aktif : kategoriList[index].aktif,
  };
  db.set('kategori', kategoriList);

  db.appendAuditLog('usr-001', 'Siti Nurhaliza, S.AP', 'UPDATE_KATEGORI', 'kategori', req.params.id, {
    nama: kategoriList[index].nama,
  });

  res.json(kategoriList[index]);
});

app.delete('/api/kategori/:id', (req, res) => {
  const kategoriList = db.get('kategori');
  const index = kategoriList.findIndex((k) => k.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Kategori tidak ditemukan' });

  const deleted = kategoriList.splice(index, 1)[0];
  db.set('kategori', kategoriList);

  db.appendAuditLog('usr-001', 'Siti Nurhaliza, S.AP', 'DELETE_KATEGORI', 'kategori', req.params.id, {
    nama: deleted.nama,
  });

  res.json({ success: true, message: 'Kategori berhasil dihapus' });
});

// -------------------------------------------------------------
// TEMPLATE CRUD (View, Edit, Delete, Buat Baru + UPLOAD WORD .DOCX)
// -------------------------------------------------------------
app.get('/api/templates', (req, res) => {
  res.json(db.get('templates'));
});

// Create Template (Manual or via Word .docx upload)
app.post('/api/templates', upload.single('word_file'), async (req, res) => {
  const { nama, tipe, paragraf_pembuka, paragraf_isi, paragraf_penutup, nama_penandatangan, jabatan_penandatangan, nip_penandatangan } = req.body;

  let pembuka = paragraf_pembuka || 'Menindaklanjuti permohonan Saudara, dengan hormat kami sampaikan hal-hal sebagai berikut.';
  let isi = paragraf_isi || 'Permohonan tersebut disetujui sesuai dengan ketentuan teknis yang berlaku di lingkungan BLSDM.';
  let penutup = paragraf_penutup || 'Demikian surat persetujuan ini disampaikan untuk dipedomani. Atas kerja samanya diucapkan terima kasih.';
  let templateName = nama || 'Template Baru BLSDM';

  // If user uploaded a real Word document (.docx), extract text structure using Mammoth
  if (req.file) {
    try {
      const parsed = await mammoth.extractRawText({ buffer: req.file.buffer });
      const rawText = parsed.value || '';
      if (rawText.length > 50) {
        const paragraphs = rawText.split('\n\n').map((p) => p.trim()).filter(Boolean);
        if (paragraphs.length >= 3) {
          pembuka = paragraphs[0];
          isi = paragraphs[1];
          penutup = paragraphs[2];
        } else if (paragraphs.length >= 1) {
          isi = paragraphs[0];
        }
      }
      if (!nama) {
        templateName = req.file.originalname.replace(/\.[^/.]+$/, '');
      }
    } catch (e) {
      console.warn('Error reading uploaded template docx:', e);
    }
  }

  const templatesList = db.get('templates');
  const newTmpl: TemplateSurat = {
    id: `tmpl-${Date.now()}`,
    nama: templateName,
    tipe: (tipe as any) || 'template_dasar',
    versi: 1,
    aktif: true,
    disetujui_oleh: nama_penandatangan || 'Dr. Ir. Bambang Soeprapto, M.M.',
    path_file: req.file ? `/templates/${req.file.originalname}` : '/templates/custom_template.docx',
    struktur: {
      ada_kop: true,
      format_nomor: 'B-____/BLSDM.35/{kode}/{bulan}/{tahun}',
      paragraf_pembuka: pembuka,
      paragraf_isi: isi,
      paragraf_penutup: penutup,
      blok_ttd: {
        jabatan: jabatan_penandatangan || 'Kepala Balai Latihan Sumber Daya Manusia',
        nama: nama_penandatangan || 'Dr. Ir. Bambang Soeprapto, M.M.',
        nip: nip_penandatangan || '19740512 199903 1 002',
      },
    },
    created_at: new Date().toISOString(),
  };

  templatesList.push(newTmpl);
  db.set('templates', templatesList);

  db.appendAuditLog('usr-001', 'Siti Nurhaliza, S.AP', 'CREATE_TEMPLATE', 'template', newTmpl.id, {
    nama: newTmpl.nama,
    uploaded_docx: !!req.file,
  });

  res.json(newTmpl);
});

// Update Template
app.put('/api/templates/:id', upload.single('word_file'), async (req, res) => {
  const templatesList = db.get('templates');
  const index = templatesList.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Template tidak ditemukan' });

  const { nama, tipe, paragraf_pembuka, paragraf_isi, paragraf_penutup, nama_penandatangan, jabatan_penandatangan, nip_penandatangan, aktif } = req.body;
  const current = templatesList[index];

  let pembuka = paragraf_pembuka || current.struktur.paragraf_pembuka;
  let isi = paragraf_isi || current.struktur.paragraf_isi;
  let penutup = paragraf_penutup || current.struktur.paragraf_penutup;
  let pathFile = current.path_file;

  if (req.file) {
    try {
      const parsed = await mammoth.extractRawText({ buffer: req.file.buffer });
      const rawText = parsed.value || '';
      if (rawText.length > 30) {
        const paragraphs = rawText.split('\n\n').map((p) => p.trim()).filter(Boolean);
        if (paragraphs.length >= 3) {
          pembuka = paragraphs[0];
          isi = paragraphs[1];
          penutup = paragraphs[2];
        } else if (paragraphs.length >= 1) {
          isi = paragraphs[0];
        }
      }
      pathFile = `/templates/${req.file.originalname}`;
    } catch (e) {
      console.warn('Error reading edited template docx:', e);
    }
  }

  templatesList[index] = {
    ...current,
    nama: nama || current.nama,
    tipe: tipe || current.tipe,
    versi: current.versi + 1, // Auto versioning
    aktif: aktif !== undefined ? (aktif === 'true' || aktif === true) : current.aktif,
    path_file: pathFile,
    struktur: {
      ...current.struktur,
      paragraf_pembuka: pembuka,
      paragraf_isi: isi,
      paragraf_penutup: penutup,
      blok_ttd: {
        jabatan: jabatan_penandatangan || current.struktur.blok_ttd.jabatan,
        nama: nama_penandatangan || current.struktur.blok_ttd.nama,
        nip: nip_penandatangan || current.struktur.blok_ttd.nip,
      },
    },
  };

  db.set('templates', templatesList);

  db.appendAuditLog('usr-001', 'Siti Nurhaliza, S.AP', 'UPDATE_TEMPLATE', 'template', req.params.id, {
    nama: templatesList[index].nama,
    versi_baru: templatesList[index].versi,
  });

  res.json(templatesList[index]);
});

// Delete Template (Soft-Delete)
app.delete('/api/templates/:id', (req, res) => {
  const templatesList = db.get('templates');
  const index = templatesList.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Template tidak ditemukan' });

  const deleted = templatesList.splice(index, 1)[0];
  db.set('templates', templatesList);

  db.appendAuditLog('usr-001', 'Siti Nurhaliza, S.AP', 'DELETE_TEMPLATE', 'template', req.params.id, {
    nama: deleted.nama,
  });

  res.json({ success: true, message: 'Template berhasil dihapus' });
});

// -------------------------------------------------------------
// FASILITAS (AULA, LAB 1, LAB 2) CRUD
// -------------------------------------------------------------
app.get('/api/fasilitas', (req, res) => {
  res.json(db.get('fasilitas'));
});

app.post('/api/fasilitas', (req, res) => {
  const { ruangan, nama_kegiatan, peminjam, tanggal_mulai, tanggal_selesai, jam_mulai, jam_selesai, jumlah_peserta } = req.body;
  if (!ruangan || !nama_kegiatan || !tanggal_mulai) {
    return res.status(400).json({ error: 'Ruangan, nama kegiatan, dan tanggal wajib diisi' });
  }

  const fasilitasList = db.get('fasilitas');
  const newBooking: FasilitasBooking = {
    id: `fas-${Date.now()}`,
    ruangan: ruangan as any,
    nama_kegiatan,
    peminjam: peminjam || 'Internal BLSDM',
    tanggal_mulai,
    tanggal_selesai: tanggal_selesai || tanggal_mulai,
    jam_mulai: jam_mulai || '08:00',
    jam_selesai: jam_selesai || '15:00',
    jumlah_peserta: jumlah_peserta ? parseInt(jumlah_peserta, 10) : undefined,
    status: 'disetujui',
  };

  fasilitasList.push(newBooking);
  db.set('fasilitas', fasilitasList);
  res.json(newBooking);
});

app.delete('/api/fasilitas/:id', (req, res) => {
  const fasilitasList = db.get('fasilitas');
  const idx = fasilitasList.findIndex((f) => f.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Booking fasilitas tidak ditemukan' });

  fasilitasList.splice(idx, 1);
  db.set('fasilitas', fasilitasList);
  res.json({ success: true });
});

// Pembelajaran Agent
app.get('/api/pembelajaran', (req, res) => {
  res.json({
    contoh_revisi: db.get('contoh_revisi'),
    usulan_pembaruan: db.get('usulan_pembaruan'),
  });
});

app.post('/api/pembelajaran/usulan/:id/decide', (req, res) => {
  const { status } = req.body;
  const usulanList = db.get('usulan_pembaruan');
  const usulan = usulanList.find((u) => u.id === req.params.id);
  if (!usulan) return res.status(404).json({ error: 'Usulan tidak ditemukan' });

  usulan.status = status;
  usulan.diputuskan_oleh = 'Siti Nurhaliza, S.AP';
  db.save();

  db.appendAuditLog('usr-001', 'Siti Nurhaliza, S.AP', 'DECIDE_PROPOSAL', 'usulan_pembaruan', usulan.id, {
    keputusan: status,
    judul: usulan.judul,
  });

  res.json({ success: true, usulan });
});

// Pengaturan
app.get('/api/pengaturan', (req, res) => {
  res.json(db.get('pengaturan'));
});

app.put('/api/pengaturan', (req, res) => {
  const current = db.get('pengaturan');
  const updated = { ...current, ...req.body };
  db.set('pengaturan', updated);
  res.json({ success: true, pengaturan: updated });
});

// Audit Logs & Agent Runs
app.get('/api/audit-logs', (req, res) => {
  res.json(db.get('audit_logs'));
});

app.get('/api/agent-runs', (req, res) => {
  res.json(db.get('agent_runs'));
});

app.get('/api/agent-steps/:runId', (req, res) => {
  const steps = db.get('agent_steps').filter((s) => s.run_id === req.params.runId);
  res.json(steps);
});

// Reset database to initial seed for clean demo
app.post('/api/db/reset', (req, res) => {
  const fresh = db.resetToSeed();
  res.json({ success: true, message: 'Database berhasil di-reset ke data awal seed.', data: fresh });
});

// -------------------------------------------------------------
// VITE INTEGRATION OR STATIC SERVE
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TU Smart Agent] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
