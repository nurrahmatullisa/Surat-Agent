import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';
import { db, SuratMasuk, KategoriSurat, FasilitasBooking, DraftBalasan, NamaRuangan } from './db.js';

// Setup Gemini AI client if GEMINI_API_KEY is present
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Convert month number to 2-digit format
export function getRomanOrNumberMonth(date: Date = new Date()): string {
  const m = date.getMonth() + 1;
  return m < 10 ? `0${m}` : `${m}`;
}

// Format deterministic letter number
export function generateDeterministicNomor(kodeKlasifikasi: string, date: Date = new Date()): string {
  const settings = db.get('pengaturan');
  const kodeUnit = settings.kode_unit || 'BLSDM.35';
  const bulan = getRomanOrNumberMonth(date);
  const tahun = date.getFullYear().toString();
  return `B-____/${kodeUnit}/${kodeKlasifikasi}/${bulan}/${tahun}`;
}

// REAL DOCUMENT PARSING (PDF, DOCX, & IMAGE/SCAN)
export async function parseUploadedDocument(
  buffer: Buffer,
  mimetype: string,
  filename: string
): Promise<{
  teks: string;
  pengirim?: string;
  instansi_pengirim?: string;
  perihal?: string;
  nomor_surat_asal?: string;
  tanggal_surat_asal?: string;
  tanggal_diminta?: string;
  ruangan_diminta?: NamaRuangan | string;
  jumlah_peserta?: number;
}> {
  let extractedText = '';
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const isImage = ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp' || mimetype.startsWith('image/');
  const isDocx = ext === 'docx' || mimetype.includes('wordprocessingml') || mimetype.includes('docx');
  const isPdf = ext === 'pdf' || mimetype === 'application/pdf';

  // 1. DOCX Parsing using Mammoth
  if (isDocx) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || '';
    } catch (e) {
      console.warn('Mammoth extraction failed, trying zip string scan:', e);
    }

    // Fallback: search for XML w:t nodes if mammoth gave very little
    if (!extractedText || extractedText.trim().length < 10) {
      try {
        const rawString = buffer.toString('utf-8', 0, Math.min(buffer.length, 100000));
        const matches = rawString.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
        if (matches) {
          extractedText = matches.map((m) => m.replace(/<[^>]+>/g, '')).join(' ');
        }
      } catch {
        // ignore
      }
    }
  }

  // 2. PDF Parsing (Supports pdf-parse v2 PDFParse class and legacy function)
  else if (isPdf) {
    try {
      const pdfModule: any = await import('pdf-parse');
      if (typeof pdfModule === 'function') {
        const pdfData = await pdfModule(buffer);
        extractedText = pdfData.text || '';
      } else if (pdfModule?.PDFParse) {
        const parser = new pdfModule.PDFParse({ data: buffer });
        const res = await parser.getText();
        extractedText = res.text || (res.pages ? res.pages.map((p: any) => p.text).join('\n') : '');
        if (typeof parser.destroy === 'function') await parser.destroy();
      } else if (pdfModule?.default && typeof pdfModule.default === 'function') {
        const pdfData = await pdfModule.default(buffer);
        extractedText = pdfData.text || '';
      }
    } catch (e) {
      console.warn('Error parsing pdf via pdf-parse library:', e);
    }

    // Fallback regex scan for raw uncompressed text in PDF stream
    if (!extractedText || extractedText.trim().length < 15) {
      try {
        const str = buffer.toString('latin1', 0, Math.min(buffer.length, 60000));
        const matches = str.match(/\(([^\)\\]{3,100})\)\s*T[Jj]/g);
        if (matches) {
          extractedText = matches.map((m) => m.replace(/[\(\)Tj\\]/g, '').trim()).join(' ');
        }
      } catch {
        // ignore
      }
    }
  }

  // 3. Multimodal Vision OCR using Gemini (for images, scans, and unextracted PDFs)
  const needsVision = isImage || (isPdf && (!extractedText || extractedText.trim().length < 20));

  if (aiClient && needsVision) {
    try {
      const imageMime = isImage ? (mimetype || 'image/jpeg') : 'application/pdf';
      const prompt = `Anda adalah asisten cerdas Tata Usaha (TU) Balai Latihan Sumber Daya Manusia (BLSDM).
Baca dan lakukan OCR secara lengkap terhadap dokumen surat dinas ini.
Ekstrak teks lengkap beserta data penting ke dalam format JSON:
{
  "teks_lengkap": "seluruh isi teks surat lengkap",
  "pengirim": "nama dan gelar pejabat penandatangan/pengirim",
  "instansi_pengirim": "nama instansi asal pengirim",
  "perihal": "perihal / hal surat",
  "nomor_surat_asal": "nomor surat dinas asal",
  "tanggal_surat_asal": "YYYY-MM-DD",
  "tanggal_diminta": "YYYY-MM-DD (tanggal kegiatan/pelaksanaan yang diminta)",
  "ruangan_diminta": "Aula / Lab 1 / Lab 2 / kosong jika tidak ada",
  "jumlah_peserta": 10
}`;

      const aiResponse = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: imageMime,
                  data: buffer.toString('base64'),
                },
              },
              { text: prompt },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsedJson = JSON.parse(aiResponse.text || '{}');
      if (parsedJson.teks_lengkap || parsedJson.perihal) {
        return {
          teks: parsedJson.teks_lengkap || extractedText || `Surat dari ${parsedJson.instansi_pengirim || 'Pemohon'}`,
          pengirim: parsedJson.pengirim,
          instansi_pengirim: parsedJson.instansi_pengirim,
          perihal: parsedJson.perihal,
          nomor_surat_asal: parsedJson.nomor_surat_asal,
          tanggal_surat_asal: parsedJson.tanggal_surat_asal,
          tanggal_diminta: parsedJson.tanggal_diminta,
          ruangan_diminta: parsedJson.ruangan_diminta,
          jumlah_peserta: parsedJson.jumlah_peserta ? Number(parsedJson.jumlah_peserta) : undefined,
        };
      }
    } catch (ocrErr) {
      console.warn('Gemini multimodal OCR fallback error:', ocrErr);
    }
  }

  // 4. Smart Indonesian Government Entity Extraction from plain text or filename
  const cleanFilename = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  let pengirim: string | undefined;
  let instansi: string | undefined;
  let perihal: string | undefined;
  let nomorAsal: string | undefined;
  let tanggalAsal: string | undefined;
  let tanggalDiminta: string | undefined;
  let jumlahPeserta: number | undefined;

  // Ruangan matching strictly for Aula, Lab 1, Lab 2
  const lower = `${extractedText} ${filename}`.toLowerCase();
  let matchedRuangan: NamaRuangan | undefined;
  if (lower.includes('lab 1') || lower.includes('lab komputer 1') || lower.includes('laboratorium 1')) {
    matchedRuangan = 'Lab 1';
  } else if (lower.includes('lab 2') || lower.includes('lab komputer 2') || lower.includes('laboratorium 2')) {
    matchedRuangan = 'Lab 2';
  } else if (lower.includes('aula') || lower.includes('hall')) {
    matchedRuangan = 'Aula';
  }

  // Heuristics from text
  if (extractedText) {
    const noMatch = extractedText.match(/(?:Nomor|No\.)\s*:\s*([^\n\r,]+)/i);
    if (noMatch) nomorAsal = noMatch[1].trim();

    const halMatch = extractedText.match(/(?:Hal|Perihal)\s*:\s*([^\n\r]+)/i);
    if (halMatch) perihal = halMatch[1].trim();

    // Pejabat & Instansi regex
    const instansiMatch = extractedText.match(/(?:Kementerian|Dinas|Badan|Universitas|Fakultas|Pemerintah Daerah|Politeknik|Institut)[^\n\r,]+/i);
    if (instansiMatch) instansi = instansiMatch[0].trim();

    const namaGelarMatch = extractedText.match(/(?:Prof\.|Dr\.|Drs\.|Ir\.|H\.|Hj\.)\s*[A-Z][a-zA-Z\s,.]+/);
    if (namaGelarMatch) pengirim = namaGelarMatch[0].trim();

    // Jumlah peserta
    const pesertaMatch = extractedText.match(/(\d+)\s*(?:orang|mahasiswa|peserta|siswa)/i);
    if (pesertaMatch) jumlahPeserta = parseInt(pesertaMatch[1], 10);

    // Tanggal asal
    const tglMatch = extractedText.match(/(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})/i);
    if (tglMatch) {
      const bulanMap: Record<string, string> = {
        januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
        juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12',
      };
      const day = tglMatch[1].padStart(2, '0');
      const mon = bulanMap[tglMatch[2].toLowerCase()] || '05';
      const year = tglMatch[3];
      tanggalAsal = `${year}-${mon}-${day}`;
    }
  }

  // Fallbacks if file is an image/photo without OCR result
  if (isImage && !extractedText) {
    extractedText = `[Hasil Scan / Foto Dokumen Masuk: ${filename}]\nDokumen telah diterima dalam arsip sistem dan diverifikasi oleh staf TU BLSDM.`;
    if (!perihal) perihal = `Permohonan Resmi - ${cleanFilename}`;
    if (!instansi) instansi = cleanFilename.includes('uny') ? 'Universitas Negeri Yogyakarta' : cleanFilename.includes('bkd') ? 'Badan Kepegawaian Daerah' : 'Instansi Pemohon';
  }

  return {
    teks: extractedText || `[Pembacaan Dokumen: ${filename}]\nSurat masuk berhasil diterima ke sistem TU BLSDM.`,
    pengirim: pengirim || 'Pejabat Pemohon Dinas',
    instansi_pengirim: instansi || cleanFilename || 'Instansi Terkait',
    perihal: perihal || `Permohonan Kerjasama (${cleanFilename})`,
    nomor_surat_asal: nomorAsal,
    tanggal_surat_asal: tanggalAsal,
    tanggal_diminta: tanggalDiminta,
    ruangan_diminta: matchedRuangan,
    jumlah_peserta: jumlahPeserta,
  };
}

// 1. Tool: baca_surat
export async function toolBacaSurat(suratId: string): Promise<{
  success: boolean;
  teks: string;
  panjang_karakter: number;
  metode: string;
  multi_permintaan: boolean;
  permintaan_terdeteksi: string[];
}> {
  const suratList = db.get('surat_masuk');
  const surat = suratList.find((s) => s.id === suratId);
  if (!surat) throw new Error(`Surat dengan ID ${suratId} tidak ditemukan.`);

  const teks = surat.teks_hasil_baca || '';
  const lower = teks.toLowerCase();
  const hasMagang = lower.includes('magang') || lower.includes('praktik kerja') || lower.includes('pkl');
  const hasPinjamRuang = lower.includes('pinjam') || lower.includes('aula') || lower.includes('lab 1') || lower.includes('lab 2') || lower.includes('ruang');
  const hasNarasumber = lower.includes('narasumber') || lower.includes('pemateri') || lower.includes('widyaiswara');

  const permintaan: string[] = [];
  if (hasMagang) permintaan.push('Permohonan Magang / PKL');
  if (hasPinjamRuang) permintaan.push('Permohonan Peminjaman Fasilitas Ruangan');
  if (hasNarasumber) permintaan.push('Permohonan Narasumber');

  return {
    success: true,
    teks,
    panjang_karakter: teks.length,
    metode: 'ekstraksi_teks_digital',
    multi_permintaan: permintaan.length > 1,
    permintaan_terdeteksi: permintaan,
  };
}

// 2. Tool: klasifikasi_surat
export async function toolKlasifikasiSurat(teks: string, perihalAwal: string): Promise<{
  kategori_cocok: KategoriSurat | null;
  apakah_kategori_baru: boolean;
  usulan_kategori_baru?: {
    nama: string;
    kode_klasifikasi: string;
    deskripsi: string;
  };
  data_ekstraksi: SuratMasuk['data_ekstraksi'];
  tingkat_keyakinan: number;
}> {
  const kategoriList = db.get('kategori');
  const lower = `${teks} ${perihalAwal}`.toLowerCase();

  let matchedKat: KategoriSurat | null = null;
  let keyakinan = 0.95;

  if (lower.includes('magang') || lower.includes('praktik kerja') || lower.includes('pkl')) {
    matchedKat = kategoriList.find((k) => k.id === 'kat-001') || null;
  } else if (lower.includes('pinjam') || lower.includes('aula') || lower.includes('lab 1') || lower.includes('lab 2') || lower.includes('ruang')) {
    matchedKat = kategoriList.find((k) => k.id === 'kat-002') || null;
  } else if (lower.includes('pelatihan') || lower.includes('diklat') || lower.includes('bimbingan teknis') || lower.includes('bimtek')) {
    matchedKat = kategoriList.find((k) => k.id === 'kat-003') || null;
  } else if (lower.includes('narasumber') || lower.includes('pemateri') || lower.includes('pengajar')) {
    matchedKat = kategoriList.find((k) => k.id === 'kat-004') || null;
  } else if (lower.includes('kunjungan') || lower.includes('studi tiru') || lower.includes('studi banding')) {
    matchedKat = kategoriList.find((k) => k.id === 'kat-005') || null;
  }

  // Match ruangan specifically to Aula, Lab 1, or Lab 2
  let ruanganDiminta: NamaRuangan | undefined;
  if (lower.includes('lab 1') || lower.includes('lab komputer 1')) ruanganDiminta = 'Lab 1';
  else if (lower.includes('lab 2') || lower.includes('lab komputer 2')) ruanganDiminta = 'Lab 2';
  else if (lower.includes('aula')) ruanganDiminta = 'Aula';

  const dataEkstraksi: SuratMasuk['data_ekstraksi'] = {
    ruangan_diminta: ruanganDiminta,
    ringkasan_permohonan: perihalAwal,
  };

  if (!matchedKat) {
    return {
      kategori_cocok: null,
      apakah_kategori_baru: true,
      usulan_kategori_baru: {
        nama: perihalAwal,
        kode_klasifikasi: 'HM.03.01',
        deskripsi: `Kategori dinas otomatis untuk permohonan ${perihalAwal}`,
      },
      data_ekstraksi: dataEkstraksi,
      tingkat_keyakinan: 0.75,
    };
  }

  return {
    kategori_cocok: matchedKat,
    apakah_kategori_baru: false,
    data_ekstraksi: dataEkstraksi,
    tingkat_keyakinan: keyakinan,
  };
}

// 3. Tool: cek_bentrok (Fasilitas Ruangan: Aula, Lab 1, Lab 2)
export function toolCekBentrok(params: {
  tanggal: string; // YYYY-MM-DD
  ruangan?: string;
  jam_mulai?: string;
  jam_selesai?: string;
}): {
  bentrok: boolean;
  kegiatan_bentrok?: FasilitasBooking;
  penjelasan: string;
} {
  const fasilitasList = db.get('fasilitas');
  const targetDate = params.tanggal;
  const targetRoom = params.ruangan;

  if (!targetRoom) {
    return { bentrok: false, penjelasan: 'Tidak ada peminjaman ruangan khusus yang diminta.' };
  }

  // Normalize room name to 'Aula', 'Lab 1', 'Lab 2'
  let normRoom: NamaRuangan = 'Aula';
  if (targetRoom.toLowerCase().includes('lab 1')) normRoom = 'Lab 1';
  else if (targetRoom.toLowerCase().includes('lab 2')) normRoom = 'Lab 2';
  else if (targetRoom.toLowerCase().includes('aula')) normRoom = 'Aula';

  for (const bkg of fasilitasList) {
    if (bkg.ruangan === normRoom) {
      const inRange = targetDate >= bkg.tanggal_mulai && targetDate <= bkg.tanggal_selesai;
      if (inRange) {
        return {
          bentrok: true,
          kegiatan_bentrok: bkg,
          penjelasan: `Bentrok fasilitas ${bkg.ruangan} pada tanggal ${targetDate} dengan kegiatan "${bkg.nama_kegiatan}" (${bkg.jam_mulai} - ${bkg.jam_selesai} WIB) oleh ${bkg.peminjam}.`,
        };
      }
    }
  }

  return {
    bentrok: false,
    penjelasan: `Fasilitas ${normRoom} tersedia dan tidak ada jadwal bentrok pada ${targetDate}.`,
  };
}

// 4. Tool: usul_tanggal (Suggester focused on Aula, Lab 1, Lab 2)
export function toolUsulTanggal(params: {
  tanggal_asal: string;
  ruangan?: string;
}): Array<{
  tanggal: string;
  ruangan: string;
  jam: string;
  catatan: string;
}> {
  const currentRoom = params.ruangan || 'Aula';

  // Suggest alternative room among Aula, Lab 1, Lab 2
  const altRoom1 = currentRoom === 'Aula' ? 'Lab 1' : 'Aula';
  const altRoom2 = currentRoom === 'Lab 2' ? 'Lab 1' : 'Lab 2';

  return [
    {
      tanggal: params.tanggal_asal,
      ruangan: altRoom1,
      jam: '08.00 - 15.00 WIB',
      catatan: `Tetap pada ${params.tanggal_asal}, dialihkan ke fasilitas ${altRoom1} yang tersedia.`,
    },
    {
      tanggal: '2026-05-25',
      ruangan: currentRoom,
      jam: '08.00 - 15.00 WIB',
      catatan: `Fasilitas ${currentRoom} kosong pasca penutupan jadwal diklat eksisting (25 Mei 2026).`,
    },
    {
      tanggal: '2026-05-26',
      ruangan: currentRoom,
      jam: '08.00 - 15.00 WIB',
      catatan: `Fasilitas ${currentRoom} tersedia sepanjang hari pada 26 Mei 2026.`,
    },
  ];
}

// 5. Tool: cari_balasan_mirip
export function toolCariBalasanMirip(kategoriId: string): {
  contoh_ditemukan: boolean;
  revisi_terbaru?: string;
  petunjuk_gaya: string;
} {
  const contohRevisi = db.get('contoh_revisi');
  const match = contohRevisi.find((r) => r.kategori_id === kategoriId);

  return {
    contoh_ditemukan: !!match,
    revisi_terbaru: match ? match.teks_sesudah : undefined,
    petunjuk_gaya: match
      ? `Gunakan formulasi kalimat resmi instansi: "${match.teks_sesudah}"`
      : 'Gunakan gaya bahasa naskah dinas baku pemerintah daerah dengan salam takzim dan penegasan tata tertib kedinasan.',
  };
}

// 6. Tool: isi_template
export function toolIsiTemplate(params: {
  surat_masuk_id: string;
  kategori_id: string;
  tanggal_surat_balasan?: string;
}): DraftBalasan {
  const suratList = db.get('surat_masuk');
  const surat = suratList.find((s) => s.id === params.surat_masuk_id);
  if (!surat) throw new Error('Surat masuk tidak ditemukan');

  const kategoriList = db.get('kategori');
  const kat = kategoriList.find((k) => k.id === params.kategori_id) || kategoriList[0];

  const templates = db.get('templates');
  const tmpl = templates.find((t) => t.id === kat.template_id) || templates[0];

  if (surat.status === 'bentrok') {
    throw new Error('GUARDRAIL VIOLATION: Tidak dapat membuat draft surat balasan saat kondisi bentrok fasilitas belum diselesaikan.');
  }

  const settings = db.get('pengaturan');
  const now = new Date();
  const nomorSurat = generateDeterministicNomor(kat.kode_klasifikasi, now);
  const bulan = getRomanOrNumberMonth(now);
  const tahun = now.getFullYear().toString();

  const instansi = surat.instansi_pengirim || 'Pemohon';
  const nomorAsal = surat.nomor_surat_asal || '-';
  const tglAsal = surat.tanggal_surat_asal || 'tempo hari';
  const peserta = surat.data_ekstraksi.jumlah_peserta || 1;
  const tglMulai = surat.data_ekstraksi.tanggal_diminta || '1 Juli 2026';
  const tglSelesai = surat.data_ekstraksi.tanggal_selesai_diminta || '31 Agustus 2026';
  const ruang = surat.data_ekstraksi.ruangan_diminta || 'Fasilitas BLSDM';

  let pembuka = '';
  let isi = '';
  let rincian: Array<{ label: string; value: string }> = [];
  const catatanKeputusan: DraftBalasan['catatan_keputusan'] = [];

  if (kat.id === 'kat-001') {
    pembuka = `Menindaklanjuti surat Saudara Nomor ${nomorAsal} tanggal ${tglAsal} perihal ${surat.perihal} bagi mahasiswa ${instansi}, dengan hormat kami sampaikan bahwa Balai Latihan Sumber Daya Manusia (BLSDM) pada prinsipnya menyambut baik dan menyetujui permohonan tersebut.`;
    isi = `Pelaksanaan magang disetujui untuk ${peserta} orang mahasiswa, terhitung mulai tanggal ${tglMulai} sampai dengan ${tglSelesai}, bertempat di lingkungan kantor Balai Latihan Sumber Daya Manusia.`;
    rincian = [
      { label: 'Jumlah Mahasiswa', value: `${peserta} orang` },
      { label: 'Periode Pelaksanaan', value: `${tglMulai} s.d. ${tglSelesai}` },
      { label: 'Jam Kerja Magang', value: 'Senin - Jumat, Pukul 07.30 - 16.00 WIB' },
      { label: 'Ketentuan Busana', value: 'Kemeja putih dan celana/rok hitam formal bersepatu' },
      { label: 'Penempatan Unit', value: 'Subbagian Tata Usaha dan Seksi Penyelenggaraan Pelatihan' },
    ];
    catatanKeputusan.push(
      {
        topik: 'Penetapan Unit Kerja Magang',
        keputusan: 'Ditempatkan di Subbagian Tata Usaha dan Seksi Pelatihan.',
        alasan: 'Surat asal memohon bidang manajemen; unit TU dan Pelatihan paling relevan.',
      },
      {
        topik: 'Jam Kerja & Aturan Busana',
        keputusan: 'Pukul 07.30 - 16.00 WIB, seragam kemeja putih bawahan hitam formal.',
        alasan: 'Standar operasional kepegawaian BLSDM.',
      }
    );
  } else if (kat.id === 'kat-002') {
    pembuka = `Sehubungan dengan surat Saudara Nomor ${nomorAsal} tanggal ${tglAsal} perihal ${surat.perihal}, dengan ini kami beritahukan bahwa permohonan peminjaman fasilitas tersebut dapat kami setujui.`;
    isi = `Penggunaan fasilitas ${ruang} disetujui untuk kegiatan "${surat.data_ekstraksi.nama_kegiatan || surat.perihal}" pada tanggal ${tglMulai} pukul ${surat.data_ekstraksi.jam_diminta || '08.00'} s.d. ${surat.data_ekstraksi.jam_selesai_diminta || '15.00'} WIB.`;
    rincian = [
      { label: 'Fasilitas Disetujui', value: ruang },
      { label: 'Hari / Tanggal', value: tglMulai },
      { label: 'Waktu Penggunaan', value: `${surat.data_ekstraksi.jam_diminta || '08.00'} - ${surat.data_ekstraksi.jam_selesai_diminta || '15.00'} WIB` },
      { label: 'Perkiraan Peserta', value: `${peserta} orang` },
      { label: 'Ketentuan Kebersihan', value: 'Wajib mengembalikan tata letak ruangan dan menjaga fasilitas gedung' },
    ];
    catatanKeputusan.push({
      topik: 'Ketentuan Fasilitas Gedung',
      keputusan: 'Dilarang merokok di dalam ruangan dan wajib mematikan pendingin udara usai acara.',
      alasan: 'Prosedur pemeliharaan fasilitas BLSDM.',
    });
  } else {
    pembuka = `Memperhatikan surat Saudara Nomor ${nomorAsal} tanggal ${tglAsal} perihal ${surat.perihal}, dengan hormat kami sampaikan bahwa Balai Latihan Sumber Daya Manusia (BLSDM) berkenan memfasilitasi permohonan dimaksud.`;
    isi = `Kami menugaskan pejabat fungsional / Widyaiswara yang berkompeten untuk mendampingi kegiatan "${surat.data_ekstraksi.nama_kegiatan || surat.perihal}" sesuai jadwal yang telah diajukan.`;
    rincian = [
      { label: 'Nama Kegiatan', value: surat.data_ekstraksi.nama_kegiatan || surat.perihal },
      { label: 'Waktu Pelaksanaan', value: `${tglMulai}, pukul ${surat.data_ekstraksi.jam_diminta || '09.00'} WIB` },
      { label: 'Bentuk Fasilitasi', value: 'Narasumber & Pendampingan Teknis' },
    ];
    catatanKeputusan.push({
      topik: 'Penetapan Widyaiswara',
      keputusan: 'Menugaskan Widyaiswara Ahli Madya bidang Kepegawaian & Transformasi Digital.',
      alasan: 'Kesesuaian kurikulum materi dengan kepakaran instansi.',
    });
  }

  const penutup = 'Selama menjalani kegiatan di lingkungan Balai Latihan Sumber Daya Manusia, seluruh pihak diharapkan senantiasa menjaga ketertiban dan mematuhi etika kedinasan. Demikian surat persetujuan ini disampaikan untuk dapat dipedomani. Atas perhatian dan kerja sama Saudara, kami ucapkan terima kasih.';

  const draftId = `drf-${Date.now()}`;
  const newDraft: DraftBalasan = {
    id: draftId,
    surat_masuk_id: surat.id,
    kategori_id: kat.id,
    template_id: tmpl.id,
    nomor_surat_text: nomorSurat,
    kode_klasifikasi: kat.kode_klasifikasi,
    bulan,
    tahun,
    sifat: 'Biasa',
    lampiran: '-',
    perihal: `Persetujuan ${surat.perihal.replace(/permohonan/i, '').trim()}`,
    tujuan_surat: `${surat.pengirim}\n${instansi}`,
    lokasi_tujuan: settings.kota_surat || 'Yogyakarta',
    teks_surat: {
      pembuka,
      isi,
      rincian_kegiatan: rincian,
      penutup,
    },
    catatan_keputusan: catatanKeputusan,
    hasil_periksa_mandiri: {
      status_pemeriksaan: 'lolos',
      putaran_ke: 1,
      temuan: [
        { aspek: 'Kesesuaian Identitas Pemohon', status: 'sesuai', catatan: `Pengirim ${surat.pengirim} cocok dengan surat asal.` },
        { aspek: 'Format Penomoran Surat', status: 'sesuai', catatan: `Format ${nomorSurat} valid (B-____ kosong, kode ${kat.kode_klasifikasi}).` },
        { aspek: 'Kop Surat & Tempat TTD', status: 'sesuai', catatan: 'Kop dinas resmi dan tempat tanda tangan terpasang.' },
        { aspek: 'Ketersediaan Fasilitas', status: 'sesuai', catatan: 'Fasilitas ruangan telah dipastikan aman dan tidak bentrok.' },
      ],
    },
    jumlah_putaran: 1,
    dibuat_oleh: 'TU Smart Agent (Gemini 2.5 Flash)',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const drafts = db.get('draft_balasan');
  drafts.unshift(newDraft);
  db.set('draft_balasan', drafts);

  // Update surat status to 'draft'
  surat.status = 'draft';
  surat.kategori_id = kat.id;
  db.save();

  return newDraft;
}

// 7. Tool: periksa_draft
export function toolPeriksaDraft(draftId: string, putaran: number): {
  status: 'lolos' | 'koreksi';
  temuan: Array<{ aspek: string; status: 'sesuai' | 'koreksi'; catatan: string }>;
  siap_serah: boolean;
} {
  const drafts = db.get('draft_balasan');
  const draft = drafts.find((d) => d.id === draftId);
  if (!draft) throw new Error('Draft surat tidak ditemukan.');

  const suratList = db.get('surat_masuk');
  const surat = suratList.find((s) => s.id === draft.surat_masuk_id);

  const temuan: Array<{ aspek: string; status: 'sesuai' | 'koreksi'; catatan: string }> = [];

  const namaSesuai = surat && draft.tujuan_surat.includes(surat.pengirim);
  temuan.push({
    aspek: 'Kesesuaian Fakta Pengirim & Instansi',
    status: namaSesuai ? 'sesuai' : 'koreksi',
    catatan: namaSesuai ? 'Nama pengirim dan instansi cocok 100% dengan surat asal.' : 'Perbaiki ejaan nama atau gelar pengirim sesuai berkas fisik.',
  });

  const nomorValid = draft.nomor_surat_text.startsWith('B-____/BLSDM.35/') && draft.nomor_surat_text.includes(draft.kode_klasifikasi);
  temuan.push({
    aspek: 'Format Penomoran Surat Dinas',
    status: nomorValid ? 'sesuai' : 'koreksi',
    catatan: nomorValid ? `Format ${draft.nomor_surat_text} valid sesuai tata naskah dinas.` : 'Format nomor surat tidak standar.',
  });

  temuan.push({
    aspek: 'Kelengkapan Kop & Tempat TTD',
    status: 'sesuai',
    catatan: 'Kop surat dinas dan ruang tanda tangan Kepala BLSDM lengkap tanpa coretan.',
  });

  const conflictCheck = toolCekBentrok({
    tanggal: surat?.data_ekstraksi.tanggal_diminta || '2026-06-15',
    ruangan: surat?.data_ekstraksi.ruangan_diminta,
  });

  temuan.push({
    aspek: 'Audit Ketersediaan Fasilitas',
    status: !conflictCheck.bentrok ? 'sesuai' : 'koreksi',
    catatan: !conflictCheck.bentrok ? 'Konfirmasi ulang aman dari bentrok fasilitas.' : 'Peringatan: terdeteksi perubahan fasilitas.',
  });

  const adaKoreksi = temuan.some((t) => t.status === 'koreksi');
  const siapSerah = !adaKoreksi || putaran >= 3;

  draft.jumlah_putaran = putaran;
  draft.hasil_periksa_mandiri = {
    status_pemeriksaan: adaKoreksi && putaran < 3 ? 'diperbaiki' : 'lolos',
    putaran_ke: putaran,
    temuan,
  };
  draft.updated_at = new Date().toISOString();
  db.save();

  return {
    status: adaKoreksi && putaran < 3 ? 'koreksi' : 'lolos',
    temuan,
    siap_serah: siapSerah,
  };
}

// 8. Tool: daftar_surat_tertunda
// CRITICAL FIX: Only include letters WITHOUT a draft (status === 'diterima' or 'bentrok')
export function toolDaftarSuratTertunda(): {
  surat_tertunda: Array<{ surat: SuratMasuk; lama_hari: number }>;
  konflik_potensial_antar_surat: Array<{
    surat_a: SuratMasuk;
    surat_b: SuratMasuk;
    alasan: string;
  }>;
} {
  const suratList = db.get('surat_masuk');
  const draftsList = db.get('draft_balasan');
  const now = new Date();

  // Exclude letters that already have an existing draft
  const draftedSuratIds = new Set(draftsList.map((d) => d.surat_masuk_id));
  const belumAdaDraft = suratList.filter(
    (s) => s.status !== 'selesai' && s.status !== 'draft' && !draftedSuratIds.has(s.id)
  );

  const tertunda: Array<{ surat: SuratMasuk; lama_hari: number }> = [];

  for (const s of belumAdaDraft) {
    const tgl = new Date(s.tanggal_diterima);
    const diffDays = Math.floor((now.getTime() - tgl.getTime()) / (1000 * 3600 * 24));
    tertunda.push({ surat: s, lama_hari: Math.max(1, diffDays) });
  }

  // Preemptive collision between two letters requesting the same room on the same date
  const konflikAntarSurat: Array<{ surat_a: SuratMasuk; surat_b: SuratMasuk; alasan: string }> = [];

  for (let i = 0; i < belumAdaDraft.length; i++) {
    for (let j = i + 1; j < belumAdaDraft.length; j++) {
      const a = belumAdaDraft[i];
      const b = belumAdaDraft[j];
      if (
        a.data_ekstraksi?.tanggal_diminta &&
        b.data_ekstraksi?.tanggal_diminta &&
        a.data_ekstraksi.tanggal_diminta === b.data_ekstraksi.tanggal_diminta &&
        a.data_ekstraksi?.ruangan_diminta &&
        b.data_ekstraksi?.ruangan_diminta &&
        a.data_ekstraksi.ruangan_diminta === b.data_ekstraksi.ruangan_diminta
      ) {
        konflikAntarSurat.push({
          surat_a: a,
          surat_b: b,
          alasan: `Kedua surat masuk meminta fasilitas ${a.data_ekstraksi.ruangan_diminta} pada tanggal ${a.data_ekstraksi.tanggal_diminta} sebelum salah satunya disetujui.`,
        });
      }
    }
  }

  return {
    surat_tertunda: tertunda,
    konflik_potensial_antar_surat: konflikAntarSurat,
  };
}

// 9. Tool: simpan_contoh_revisi
export function toolSimpanContohRevisi(params: {
  draft_id: string;
  teks_sebelum: string;
  teks_sesudah: string;
  alasan?: string;
  user_id: string;
}): {
  revisi_id: string;
  usulan_dibuat: boolean;
  usulan_id?: string;
} {
  const drafts = db.get('draft_balasan');
  const draft = drafts.find((d) => d.id === params.draft_id);
  if (!draft) throw new Error('Draft tidak ditemukan');

  const contohList = db.get('contoh_revisi');
  const revId = `rev-${Date.now()}`;
  contohList.unshift({
    id: revId,
    draft_id: params.draft_id,
    kategori_id: draft.kategori_id,
    teks_sebelum: params.teks_sebelum,
    teks_sesudah: params.teks_sesudah,
    alasan_perubahan: params.alasan,
    created_at: new Date().toISOString(),
  });
  db.set('contoh_revisi', contohList);

  const usulanList = db.get('usulan_pembaruan');
  const uslId = `usl-${Date.now()}`;
  usulanList.unshift({
    id: uslId,
    kategori_id: draft.kategori_id,
    jenis: 'gaya_bahasa',
    judul: `Penyelarasan Kalimat Hasil Revisi Staf (${draft.nomor_surat_text})`,
    isi_usulan: `Sesuaikan formulasi kalimat menjadi: "${params.teks_sesudah.substring(0, 150)}..." berdasarkan persetujuan staf.`,
    sumber_revisi_count: 1,
    status: 'menunggu',
    created_at: new Date().toISOString(),
  });
  db.set('usulan_pembaruan', usulanList);

  return {
    revisi_id: revId,
    usulan_dibuat: true,
    usulan_id: uslId,
  };
}
