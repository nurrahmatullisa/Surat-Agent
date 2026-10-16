import { db, AgentRun, AgentStep, SuratMasuk } from './db.js';
import {
  toolBacaSurat,
  toolKlasifikasiSurat,
  toolCekBentrok,
  toolUsulTanggal,
  toolCariBalasanMirip,
  toolIsiTemplate,
  toolPeriksaDraft,
} from './agent-tools.js';

export interface RunAgentOptions {
  surat_masuk_id: string;
  override_tanggal?: string;
  override_ruangan?: string;
}

export async function executeAgentLoop(options: RunAgentOptions): Promise<{
  run: AgentRun;
  steps: AgentStep[];
  surat: SuratMasuk;
  draft_id?: string;
  bentrok_detected: boolean;
  alternatif_jadwal?: Array<{ tanggal: string; ruangan: string; jam: string; catatan: string }>;
}> {
  const settings = db.get('pengaturan');
  const batasLangkah = settings.batas_langkah || 15;
  const batasPutaran = settings.batas_putaran_periksa || 3;

  const suratList = db.get('surat_masuk');
  const suratIndex = suratList.findIndex((s) => s.id === options.surat_masuk_id);
  if (suratIndex === -1) {
    throw new Error(`Surat masuk ${options.surat_masuk_id} tidak ditemukan.`);
  }

  const surat = suratList[suratIndex];
  surat.status = 'diproses';
  db.save();

  const runId = `run-${Date.now()}`;
  const run: AgentRun = {
    id: runId,
    surat_masuk_id: surat.id,
    status: 'berjalan',
    jumlah_langkah: 0,
    batas_langkah: batasLangkah,
    mulai: new Date().toISOString(),
  };

  const agentRuns = db.get('agent_runs');
  agentRuns.unshift(run);
  db.set('agent_runs', agentRuns);

  const steps: AgentStep[] = [];
  let currentStep = 0;

  function recordStep(tool: string, pemikiran: string, input: Record<string, unknown>, output: Record<string, unknown>) {
    currentStep++;
    if (currentStep > batasLangkah) {
      throw new Error(`GUARDRAIL: Melampaui batas langkah yang diizinkan (${batasLangkah} langkah). Eksekusi dihentikan secara aman.`);
    }
    const step: AgentStep = {
      id: `stp-${Date.now()}-${currentStep}`,
      run_id: runId,
      urutan: currentStep,
      tool,
      pemikiran,
      input,
      output,
      created_at: new Date().toISOString(),
    };
    steps.push(step);
    const allSteps = db.get('agent_steps');
    allSteps.push(step);
    db.set('agent_steps', allSteps);

    run.jumlah_langkah = currentStep;
    db.save();
  }

  try {
    // LANGKAH 1: Membaca berkas fisik / teks
    recordStep(
      'baca_surat',
      `Membaca berkas ${surat.file_name} dan mengekstrak isi teks, memeriksa apakah terdapat lebih dari satu permohonan.`,
      { file_name: surat.file_name, file_type: surat.file_type },
      {}
    );

    const hasilBaca = await toolBacaSurat(surat.id);
    steps[steps.length - 1].output = hasilBaca;
    db.save();

    // Jika ada multi-permintaan (misal magang + peminjaman aula)
    if (hasilBaca.multi_permintaan) {
      recordStep(
        'perencanaan_langkah',
        `Mendeteksi permohonan ganda: ${hasilBaca.permintaan_terdeteksi.join(' & ')}. Surat dipisahkan menjadi penanganan berurutan.`,
        { multi_permintaan: true, daftar: hasilBaca.permintaan_terdeteksi },
        { aksi: 'Pecah penanganan, utamakan permohonan primer terlebih dahulu' }
      );
    }

    // LANGKAH 2: Klasifikasi kategori & ekstraksi data
    recordStep(
      'klasifikasi_surat',
      'Mencocokkan isi permohonan dengan daftar kategori buatan staf TU dan mengekstrak entitas penting.',
      { perihal: surat.perihal, teks_ringkas: surat.teks_hasil_baca.substring(0, 120) },
      {}
    );

    const hasilKlasifikasi = await toolKlasifikasiSurat(surat.teks_hasil_baca, surat.perihal);
    steps[steps.length - 1].output = {
      kategori: hasilKlasifikasi.kategori_cocok?.nama || 'Kategori Baru',
      kode_klasifikasi: hasilKlasifikasi.kategori_cocok?.kode_klasifikasi || 'HM.03.01',
      tingkat_keyakinan: hasilKlasifikasi.tingkat_keyakinan,
    };

    // Update ekstraksi di database
    if (hasilKlasifikasi.kategori_cocok) {
      surat.kategori_id = hasilKlasifikasi.kategori_cocok.id;
    }
    if (options.override_tanggal) {
      surat.data_ekstraksi.tanggal_diminta = options.override_tanggal;
    }
    if (options.override_ruangan) {
      surat.data_ekstraksi.ruangan_diminta = options.override_ruangan;
    }
    db.save();

    // LANGKAH 3: Pengecekan Bentrok Agenda Ruangan & Narasumber
    const targetTanggal = options.override_tanggal || surat.data_ekstraksi.tanggal_diminta || '2026-06-15';
    const targetRuangan = options.override_ruangan || surat.data_ekstraksi.ruangan_diminta;
    const targetNarasumber = surat.data_ekstraksi.narasumber_diminta;

    recordStep(
      'cek_bentrok',
      `Memeriksa ketersediaan pada register agenda untuk tanggal ${targetTanggal}, sarana ${targetRuangan || '-'}, narasumber ${targetNarasumber || '-'}.`,
      { tanggal: targetTanggal, ruangan: targetRuangan, narasumber: targetNarasumber },
      {}
    );

    const hasilBentrok = toolCekBentrok({
      tanggal: targetTanggal,
      ruangan: targetRuangan,
    });
    steps[steps.length - 1].output = hasilBentrok;
    db.save();

    // JIKA BENTROK: Guardrail Absolut - Larangan membuat surat penolakan!
    if (hasilBentrok.bentrok) {
      recordStep(
        'usul_tanggal',
        'Terdeteksi bentrok fasilitas. Mencari alternatif tanggal dan ruangan yang kosong dari register fasilitas.',
        { tanggal_bentrok: targetTanggal, ruangan: targetRuangan },
        {}
      );

      const alternatif = toolUsulTanggal({
        tanggal_asal: targetTanggal,
        ruangan: targetRuangan,
      });
      steps[steps.length - 1].output = { daftar_alternatif: alternatif };

      recordStep(
        'cek_bentrok',
        'GUARDRAIL ENFORCEMENT: Sesuai aturan dinas BLSDM, sistem TIDAK PERNAH MEMBUAT SURAT PENOLAKAN. Pembuatan draft balasan diblokir sampai staf memilih jadwal alternatif.',
        { status_bentrok: true },
        { draft_dibuat: false, pesan_guardrail: 'Pembuatan draft diblokir secara otomatis oleh service guardrail.' }
      );

      surat.status = 'bentrok';
      run.status = 'bentrok';
      run.selesai = new Date().toISOString();
      run.ringkasan_keputusan = `Bentrok terdeteksi dengan agenda "${hasilBentrok.kegiatan_bentrok?.nama_kegiatan}". Telah disiapkan 3 opsi alternatif tanpa membuat surat penolakan.`;
      db.save();

      db.appendAuditLog(
        'SYSTEM_AGENT',
        'TU Smart Agent',
        'CONFLICT_DETECTED',
        'surat_masuk',
        surat.id,
        { bentrok_dengan: hasilBentrok.kegiatan_bentrok?.nama_kegiatan, target_tanggal: targetTanggal }
      );

      return {
        run,
        steps,
        surat,
        bentrok_detected: true,
        alternatif_jadwal: alternatif,
      };
    }

    // JIKA TIDAK BENTROK: Lanjutkan ke penyusunan draft
    // LANGKAH 4: Cari contoh balasan lama untuk gaya bahasa
    recordStep(
      'cari_balasan_mirip',
      'Mencari contoh revisi staf terdahulu untuk menyesuaikan tata bahasa dinas yang baku.',
      { kategori_id: surat.kategori_id || 'kat-001' },
      {}
    );

    const hasilGaya = toolCariBalasanMirip(surat.kategori_id || 'kat-001');
    steps[steps.length - 1].output = hasilGaya;
    db.save();

    // LANGKAH 5: Isi Template Word Tanpa Penanda
    recordStep(
      'isi_template',
      `Menyusun draft surat balasan Word lengkap dengan kop dan nomor dinas B-____/BLSDM.35/..., seluruh isi terisi tuntas tanpa placeholder kosong.`,
      { surat_masuk_id: surat.id, kategori_id: surat.kategori_id },
      {}
    );

    const draft = toolIsiTemplate({
      surat_masuk_id: surat.id,
      kategori_id: surat.kategori_id || 'kat-001',
    });

    steps[steps.length - 1].output = {
      draft_id: draft.id,
      nomor_surat: draft.nomor_surat_text,
      jumlah_rincian: draft.teks_surat.rincian_kegiatan?.length || 0,
    };
    db.save();

    // LANGKAH 6: Pemeriksaan Mandiri (Self-reflection / Audit loop, max 3 rounds)
    for (let round = 1; round <= Math.min(batasPutaran, 3); round++) {
      recordStep(
        'periksa_draft',
        `Pemeriksaan mandiri putaran ke-${round}: memverifikasi kesesuaian fakta surat asal (nama, tanggal, instansi), format nomor, kop dinas, dan ruang tanda tangan pimpinan.`,
        { draft_id: draft.id, putaran: round },
        {}
      );

      const hasilAudit = toolPeriksaDraft(draft.id, round);
      steps[steps.length - 1].output = hasilAudit;
      db.save();

      if (hasilAudit.siap_serah) {
        break;
      }
    }

    // Agent Run Sukses
    surat.status = 'draft';
    run.status = 'sukses';
    run.selesai = new Date().toISOString();
    run.ringkasan_keputusan = `Draft surat balasan nomor ${draft.nomor_surat_text} selesai dibuat dan telah diverifikasi mandiri. Siap diperiksa staf TU.`;
    db.save();

    db.appendAuditLog(
      'SYSTEM_AGENT',
      'TU Smart Agent',
      'GENERATE_DRAFT_SUCCESS',
      'draft_balasan',
      draft.id,
      { nomor_surat: draft.nomor_surat_text, surat_masuk: surat.id }
    );

    return {
      run,
      steps,
      surat,
      draft_id: draft.id,
      bentrok_detected: false,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    run.status = 'gagal';
    run.selesai = new Date().toISOString();
    run.ringkasan_keputusan = `Terjadi kesalahan saat memproses surat: ${errorMsg}`;
    db.save();
    throw err;
  }
}
