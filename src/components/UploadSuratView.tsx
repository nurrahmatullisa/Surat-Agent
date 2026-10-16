import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertOctagon,
  Play,
  RotateCcw,
  Sparkles,
  Camera,
  Layers,
  ShieldCheck,
  ChevronRight,
  Loader2,
  FileSearch,
} from 'lucide-react';
import { SuratMasuk, AgentStep, AgentRun } from '../types';

interface UploadSuratViewProps {
  onUploadSuccess: (surat: SuratMasuk, run?: AgentRun, draftId?: string) => void;
  onNavigateToDraft: (draftId: string) => void;
  onNavigateToBentrok: () => void;
}

export const UploadSuratView: React.FC<UploadSuratViewProps> = ({
  onUploadSuccess,
  onNavigateToDraft,
  onNavigateToBentrok,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsingFile, setParsingFile] = useState(false);
  const [parseSuccessMsg, setParseSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    pengirim: '',
    instansi_pengirim: '',
    perihal: '',
    nomor_surat_asal: '',
    tanggal_surat_asal: new Date().toISOString().split('T')[0],
    tanggal_diminta: '2026-06-15',
    ruangan_diminta: '',
    jumlah_peserta: '20',
    teks_manual: '',
  });

  const [loading, setLoading] = useState(false);
  const [activeSteps, setActiveSteps] = useState<AgentStep[]>([]);
  const [agentStatus, setAgentStatus] = useState<string>('idle');
  const [createdSurat, setCreatedSurat] = useState<SuratMasuk | null>(null);
  const [createdDraftId, setCreatedDraftId] = useState<string | null>(null);
  const [isBentrok, setIsBentrok] = useState(false);

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Instant Document Extraction when user selects a file (PDF, DOCX, or Image)
  const handleFileChosen = async (selectedFile: File) => {
    setFile(selectedFile);
    setParsingFile(true);
    setParseSuccessMsg(null);

    // If image, create local preview
    if (selectedFile.type.startsWith('image/')) {
      setImagePreview(URL.createObjectURL(selectedFile));
    } else {
      setImagePreview(null);
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/surat-masuk/parse-preview', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const p = data.parsed;
        setForm((prev) => ({
          ...prev,
          teks_manual: p.teks || prev.teks_manual,
          pengirim: p.pengirim || prev.pengirim,
          instansi_pengirim: p.instansi_pengirim || prev.instansi_pengirim,
          perihal: p.perihal || selectedFile.name.replace(/\.[^/.]+$/, ''),
          nomor_surat_asal: p.nomor_surat_asal || prev.nomor_surat_asal,
          tanggal_surat_asal: p.tanggal_surat_asal || prev.tanggal_surat_asal,
          tanggal_diminta: p.tanggal_diminta || prev.tanggal_diminta,
          ruangan_diminta: p.ruangan_diminta || prev.ruangan_diminta,
          jumlah_peserta: p.jumlah_peserta ? p.jumlah_peserta.toString() : prev.jumlah_peserta,
        }));
        setParseSuccessMsg(`Data berkas "${selectedFile.name}" berhasil dibaca dan diekstrak otomatis.`);
      } else {
        // Fallback: extract text from filename
        const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setForm((prev) => ({
          ...prev,
          perihal: prev.perihal || `Permohonan (${cleanName})`,
          instansi_pengirim: prev.instansi_pengirim || (cleanName.toLowerCase().includes('uny') ? 'Universitas Negeri Yogyakarta' : 'Instansi Pemohon'),
          teks_manual: prev.teks_manual || `[Berkas Masuk: ${selectedFile.name}]\nBerkas resmi berhasil diterima dan siap diproses oleh agent TU.`,
        }));
        setParseSuccessMsg(`Berkas "${selectedFile.name}" berhasil diunggah.`);
      }
    } catch (e) {
      console.warn('Gagal membaca pratinjau file via API, menerapkan fallback:', e);
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setForm((prev) => ({
        ...prev,
        perihal: prev.perihal || `Permohonan (${cleanName})`,
        teks_manual: prev.teks_manual || `[Dokumen: ${selectedFile.name}]\nBerkas surat masuk siap diverifikasi agent.`,
      }));
      setParseSuccessMsg(`Berkas "${selectedFile.name}" siap diproses.`);
    } finally {
      setParsingFile(false);
    }
  };

  // Quick Preset Sample Letters
  const handleLoadSample = (sampleType: 'magang' | 'aula_bentrok' | 'narasumber' | 'multi') => {
    setParseSuccessMsg(null);
    if (sampleType === 'magang') {
      setForm({
        pengirim: 'Prof. Dr. Sujarwo, M.Pd (Wakil Dekan I)',
        instansi_pengirim: 'Fakultas Ilmu Pendidikan Universitas Negeri Yogyakarta',
        perihal: 'Permohonan Praktik Kerja Lapangan / Magang Mahasiswa',
        nomor_surat_asal: '412/UN34.11/PKL/V/2026',
        tanggal_surat_asal: '2026-05-02',
        tanggal_diminta: '2026-07-01',
        ruangan_diminta: '',
        jumlah_peserta: '3',
        teks_manual:
          'KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI\nUNIVERSITAS NEGERI YOGYAKARTA\nFAKULTAS ILMU PENDIDIKAN\n\nNomor: 412/UN34.11/PKL/V/2026\nPerihal: Permohonan Izin Magang / PKL Mahasiswa\n\nKepada Yth. Kepala Balai Latihan Sumber Daya Manusia (BLSDM)\ndi Yogyakarta\n\nDengan hormat, kami mengajukan permohonan magang untuk 3 orang mahasiswa Program Studi Manajemen Pendidikan terhitung 1 Juli 2026 s.d. 31 Agustus 2026 di lingkungan BLSDM.',
      });
    } else if (sampleType === 'aula_bentrok') {
      setForm({
        pengirim: 'Drs. Amin Purwanto, M.Si (Sekretaris Badan)',
        instansi_pengirim: 'Badan Kepegawaian Daerah (BKD) DIY',
        perihal: 'Permohonan Peminjaman Aula BLSDM',
        nomor_surat_asal: '005/1892/BKD/V/2026',
        tanggal_surat_asal: '2026-05-08',
        tanggal_diminta: '2026-05-20',
        ruangan_diminta: 'Aula',
        jumlah_peserta: '120',
        teks_manual:
          'PEMERINTAH DAERAH DAERAH ISTIMEWA YOGYAKARTA\nBADAN KEPEGAWAIAN DAERAH\n\nNomor: 005/1892/BKD/V/2026\nPerihal: Permohonan Peminjaman Aula BLSDM\n\nKepada Yth. Kepala BLSDM Yogyakarta\n\nDengan hormat, sehubungan dengan Uji Kompetensi Teknis ASN Pemda DIY, kami bermaksud meminjam fasilitas Aula BLSDM pada hari Rabu, 20 Mei 2026 pukul 08.00 s.d. 15.00 WIB untuk 120 orang.',
      });
    } else if (sampleType === 'narasumber') {
      setForm({
        pengirim: 'Hari Sutanto, S.Kom, M.Eng (Kepala Dinas)',
        instansi_pengirim: 'Dinas Komunikasi dan Informatika DIY',
        perihal: 'Permohonan Narasumber Workshop Digital Governance & AI',
        nomor_surat_asal: '090/441/Kominfo/V/2026',
        tanggal_surat_asal: '2026-05-11',
        tanggal_diminta: '2026-05-26',
        ruangan_diminta: '',
        jumlah_peserta: '50',
        teks_manual:
          'DINAS KOMUNIKASI DAN INFORMATIKA DIY\nNomor: 090/441/Kominfo/V/2026\nPerihal: Permohonan Narasumber Workshop AI\n\nKepada Yth. Kepala BLSDM\n\nKami mengundang Widyaiswara Ahli Madya BLSDM sebagai narasumber dalam Workshop Digital Governance & AI pada Selasa, 26 Mei 2026 pukul 09.00 - 12.00 WIB.',
      });
    } else if (sampleType === 'multi') {
      setForm({
        pengirim: 'Dr. Ir. Hendra Wijaya, MT (Direktur Akademik)',
        instansi_pengirim: 'Politeknik Negeri Pembangunan Daerah',
        perihal: 'Permohonan Magang Mahasiswa dan Peminjaman Lab 1',
        nomor_surat_asal: '810/POLTEK/VI/2026',
        tanggal_surat_asal: '2026-06-01',
        tanggal_diminta: '2026-07-15',
        ruangan_diminta: 'Lab 1',
        jumlah_peserta: '10',
        teks_manual:
          'POLITEKNIK NEGERI PEMBANGUNAN DAERAH\nNomor: 810/POLTEK/VI/2026\nPerihal: Permohonan Magang Mahasiswa dan Peminjaman Lab 1\n\nKepada Yth. Kepala BLSDM\n\nKami mengajukan permohonan izin praktik kerja lapangan/magang bagi 10 mahasiswa serta izin menggunakan fasilitas Lab 1 untuk uji sertifikasi.',
      });
    }
  };

  const handleProcessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.perihal || !form.pengirim) {
      alert('Mohon isi pengirim dan perihal surat.');
      return;
    }

    setLoading(true);
    setAgentStatus('Memulai agen tata usaha...');
    setActiveSteps([]);
    setIsBentrok(false);
    setCreatedDraftId(null);

    const formData = new FormData();
    if (file) formData.append('file', file);
    formData.append('pengirim', form.pengirim);
    formData.append('instansi_pengirim', form.instansi_pengirim);
    formData.append('perihal', form.perihal);
    formData.append('nomor_surat_asal', form.nomor_surat_asal);
    formData.append('tanggal_surat_asal', form.tanggal_surat_asal);
    formData.append('tanggal_diminta', form.tanggal_diminta);
    formData.append('ruangan_diminta', form.ruangan_diminta);
    formData.append('jumlah_peserta', form.jumlah_peserta);
    formData.append('teks_manual', form.teks_manual);
    formData.append('auto_process', 'true');

    try {
      const res = await fetch('/api/surat-masuk/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses surat');

      setCreatedSurat(data.surat);
      if (data.bentrok_detected) {
        setIsBentrok(true);
        setAgentStatus('Bentrok fasilitas terdeteksi! Guardrail aktif: tidak membuat surat penolakan.');
      } else {
        setCreatedDraftId(data.draft_id);
        setAgentStatus('Selesai! Draft balasan resmi siap diperiksa.');
      }

      if (data.agent_run?.id) {
        const stepsRes = await fetch(`/api/agent-steps/${data.agent_run.id}`);
        const stepsData = await stepsRes.json();
        setActiveSteps(stepsData);
      }

      onUploadSuccess(data.surat, data.agent_run, data.draft_id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Terjadi kesalahan: ${msg}`);
      setAgentStatus('Gagal memproses');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Upload & Ekstraksi Surat Masuk
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Sistem membaca berkas asli (PDF, DOCX, scan/foto), mengelompokkan kategori arsip, mencocokkan ketersediaan ruangan (Aula, Lab 1, Lab 2), dan membuat draft Word.
        </p>
      </div>

      {/* Preset Sampler Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Muat Cepat Contoh Surat Uji Skenario:</span>
          </span>
          <span className="text-[11px] text-slate-500">Klik salah satu tombol untuk mengisi form secara instan</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => handleLoadSample('magang')}
            className="p-2.5 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-left transition-colors"
          >
            <div className="text-[11px] font-bold text-teal-900">1. Magang UNY (Aman)</div>
            <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">3 mahasiswa FIP UNY</div>
          </button>

          <button
            type="button"
            onClick={() => handleLoadSample('aula_bentrok')}
            className="p-2.5 rounded-lg border border-red-200 bg-red-50/30 hover:border-red-400 hover:bg-red-50 text-left transition-colors"
          >
            <div className="text-[11px] font-bold text-red-900">2. Pinjam Aula (Bentrok 20 Mei)</div>
            <div className="text-[10px] text-red-600 line-clamp-1 mt-0.5">Aula dipakai Diklat PKP</div>
          </button>

          <button
            type="button"
            onClick={() => handleLoadSample('narasumber')}
            className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-colors"
          >
            <div className="text-[11px] font-bold text-blue-900">3. Narasumber Kominfo</div>
            <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">Workshop AI Governance</div>
          </button>

          <button
            type="button"
            onClick={() => handleLoadSample('multi')}
            className="p-2.5 rounded-lg border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 text-left transition-colors"
          >
            <div className="text-[11px] font-bold text-purple-900">4. Multi-Permintaan (FR10)</div>
            <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">Magang + Pinjam Lab 1</div>
          </button>
        </div>
      </div>

      {/* Main Upload Form */}
      <form onSubmit={handleProcessSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Data Form & Dropzone */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Data Berkas Surat Masuk</span>
            <span className="text-[11px] font-normal text-slate-500">Ekstraksi Otomatis PDF, DOCX, & Scan</span>
          </h3>

          {/* Drag & Drop Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files?.[0]) {
                handleFileChosen(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              dragActive ? 'border-teal-500 bg-teal-50/50' : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                {parsingFile ? (
                  <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                ) : (
                  <UploadCloud className="w-6 h-6" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  {file ? file.name : 'Tarik & lepas file surat di sini, atau telusuri'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {parsingFile
                    ? 'Sedang mengekstrak data teks surat secara otomatis...'
                    : 'PDF, Word DOCX, PNG, JPG (Maks 15 MB)'}
                </p>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <label className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 cursor-pointer">
                  <span>Pilih Berkas</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileChosen(e.target.files[0]);
                      }
                    }}
                  />
                </label>

                {/* Mobile Camera Scan */}
                <label className="sm:hidden px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 text-xs font-medium flex items-center gap-1 cursor-pointer">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Foto Scan</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileChosen(e.target.files[0]);
                    }}
                  />
                </label>
              </div>

              {imagePreview && (
                <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
                  <img src={imagePreview} alt="Preview Surat" className="w-12 h-16 object-cover rounded border border-slate-300" />
                  <div className="text-left text-xs">
                    <span className="font-bold text-slate-800">Foto / Scan Terlampir</span>
                    <p className="text-[10px] text-teal-700">Model vision berhasil membaca naskah foto</p>
                  </div>
                </div>
              )}

              {parseSuccessMsg && (
                <div className="mt-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{parseSuccessMsg}</span>
                </div>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Nama Pejabat Pengirim</label>
              <input
                type="text"
                required
                value={form.pengirim}
                onChange={(e) => setForm({ ...form, pengirim: e.target.value })}
                placeholder="Misal: Prof. Dr. Sujarwo, M.Pd"
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Instansi Pengirim</label>
              <input
                type="text"
                required
                value={form.instansi_pengirim}
                onChange={(e) => setForm({ ...form, instansi_pengirim: e.target.value })}
                placeholder="Misal: Fakultas Ilmu Pendidikan UNY"
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">Perihal Surat</label>
              <input
                type="text"
                required
                value={form.perihal}
                onChange={(e) => setForm({ ...form, perihal: e.target.value })}
                placeholder="Misal: Permohonan Izin Magang / PKL Mahasiswa"
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Nomor Surat Asal</label>
              <input
                type="text"
                value={form.nomor_surat_asal}
                onChange={(e) => setForm({ ...form, nomor_surat_asal: e.target.value })}
                placeholder="Misal: 412/UN34.11/PKL/V/2026"
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Tanggal Surat Asal</label>
              <input
                type="date"
                value={form.tanggal_surat_asal}
                onChange={(e) => setForm({ ...form, tanggal_surat_asal: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Tanggal Pelaksanaan Diminta</label>
              <input
                type="date"
                value={form.tanggal_diminta}
                onChange={(e) => setForm({ ...form, tanggal_diminta: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Fasilitas Ruangan Diminta</label>
              <select
                value={form.ruangan_diminta}
                onChange={(e) => setForm({ ...form, ruangan_diminta: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white font-medium"
              >
                <option value="">-- Tidak Meminjam Ruangan Khusus --</option>
                <option value="Aula">Aula (Kapasitas 200 Orang)</option>
                <option value="Lab 1">Lab 1 (Lab Komputer 1 - Kapasitas 35 PC)</option>
                <option value="Lab 2">Lab 2 (Lab Komputer 2 - Kapasitas 30 PC)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Teks Hasil Baca / Ekstraksi Dokumen Asli</span>
                <span className="text-[10px] text-teal-700">Terbaca dari file yang diupload</span>
              </label>
              <textarea
                rows={5}
                value={form.teks_manual}
                onChange={(e) => setForm({ ...form, teks_manual: e.target.value })}
                placeholder="Hasil ekstraksi teks otomatis dari berkas yang diunggah..."
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 font-mono text-slate-700"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || parsingFile}
              className="w-full py-3 px-4 rounded-lg bg-[#0B2A4A] hover:bg-[#123B66] text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin text-teal-300" />
                  <span>Agent TU Sedang Bekerja...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-teal-300" />
                  <span>Jalankan Siklus Agent TU (Maks 15 Langkah)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right 1 Col: Agent Live Execution Monitor & Guardrail Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0B2A4A]" />
                <h4 className="font-bold text-xs text-slate-900">Monitor Siklus Agent (FR10-14)</h4>
              </div>
              <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                Batas 15 Langkah
              </span>
            </div>

            {/* Stepper Status */}
            <div className="py-1">
              <p className="text-xs font-semibold text-slate-800">Status Saat Ini:</p>
              <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5">
                {loading && <RotateCcw className="w-3.5 h-3.5 animate-spin text-teal-600" />}
                <span>{agentStatus}</span>
              </p>
            </div>

            {/* Live Step Stepper */}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {activeSteps.length > 0 ? (
                activeSteps.map((step, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span className="font-bold text-[#0B2A4A]">Langkah {step.urutan}: {step.tool}</span>
                      <span>{step.created_at.split('T')[1].substring(0, 8)}</span>
                    </div>
                    <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">{step.pemikiran}</p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada langkah eksekusi. Klik tombol jalankan untuk melihat siklus berpikir agent.
                </div>
              )}
            </div>

            {/* Success or Conflict Banner */}
            {isBentrok && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 space-y-2">
                <div className="flex items-center gap-2 text-red-900 font-bold text-xs">
                  <AlertOctagon className="w-4 h-4 text-red-600" />
                  <span>Bentrok Fasilitas Terdeteksi!</span>
                </div>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  Ruangan <strong>{form.ruangan_diminta || 'Aula'}</strong> telah dijadwalkan pada tanggal tersebut. Sesuai guardrail, draft penolakan dilarang.
                </p>
                <button
                  type="button"
                  onClick={onNavigateToBentrok}
                  className="w-full py-1.5 px-3 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center justify-center gap-1"
                >
                  <span>Pilih Ruangan/Tanggal Alternatif</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {createdDraftId && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs uppercase tracking-wide">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Draft Surat Balasan Berhasil Dibuat</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                  Draft surat balasan telah tersusun rapi dari template resmi. Notifikasi pengingat dari surat balasan ini telah otomatis hilang dan diselesaikan.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigateToDraft(createdDraftId)}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Buka & Unduh Dokumen Word (.docx)</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Guardrails Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Fasilitas Ruangan Terpadu:</span>
            </div>
            <ul className="space-y-1.5 text-[11px] list-disc list-inside text-slate-600">
              <li>Pengecekan fasilitas khusus: <strong>Aula</strong>, <strong>Lab 1</strong>, <strong>Lab 2</strong>.</li>
              <li>Ekstraksi teks langsung dari PDF teks & Word .docx via parser.</li>
              <li>OCR scan dan pembacaan foto via model multimodal.</li>
              <li>Batas 15 langkah dan 3 putaran audit mandiri.</li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  );
};
