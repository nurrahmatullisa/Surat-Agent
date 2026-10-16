import React, { useState, useEffect } from 'react';
import {
  Download,
  Save,
  CheckCircle,
  FileCheck2,
  Sparkles,
  Edit3,
  RotateCcw,
  ShieldAlert,
  BadgeCheck,
} from 'lucide-react';
import { DraftBalasan, SuratMasuk } from '../types';

interface DraftEditorViewProps {
  draftId: string;
  onBack: () => void;
  onRefreshData: () => void;
}

export const DraftEditorView: React.FC<DraftEditorViewProps> = ({
  draftId,
  onBack,
  onRefreshData,
}) => {
  const [draft, setDraft] = useState<DraftBalasan | null>(null);
  const [surat, setSurat] = useState<SuratMasuk | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [manualNomor, setManualNomor] = useState('');

  // Editable fields
  const [pembuka, setPembuka] = useState('');
  const [isi, setIsi] = useState('');
  const [penutup, setPenutup] = useState('');
  const [alasanRevisi, setAlasanRevisi] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchDraft();
  }, [draftId]);

  const fetchDraft = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/drafts/${draftId}`);
      if (!res.ok) throw new Error('Gagal mengambil draft');
      const data = await res.json();
      setDraft(data.draft);
      setSurat(data.surat);
      setPembuka(data.draft.teks_surat.pembuka);
      setIsi(data.draft.teks_surat.isi);
      setPenutup(data.draft.teks_surat.penutup);
      setManualNomor(data.draft.nomor_surat_text);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`/api/drafts/${draftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teks_surat: {
            pembuka,
            isi,
            penutup,
          },
          nomor_manual: manualNomor,
          catatan_alasan_revisi: alasanRevisi || 'Penyesuaian teks dinas oleh staf TU',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');
      setDraft(data.draft);
      setIsEditing(false);
      setSaveMessage('Perubahan berhasil disimpan! Riwayat revisi dicatat untuk pembelajaran agent (FR12).');
      onRefreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadDocx = () => {
    setDownloading(true);
    window.location.href = `/api/drafts/${draftId}/download-docx`;
    setTimeout(() => setDownloading(false), 2000);
  };

  if (loading || !draft) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
        <RotateCcw className="w-8 h-8 animate-spin text-teal-600" />
        <span className="text-sm font-medium text-slate-600">Memuat berkas draft surat balasan...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* SUCCESS CONFIRMATION BANNER */}
      <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <BadgeCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                Draft Surat Balasan Berhasil Dibuat
              </span>
              <span className="text-[11px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded font-mono font-bold">
                {draft.nomor_surat_text}
              </span>
            </div>
            <p className="text-xs text-emerald-800 mt-0.5">
              Status surat telah diperbarui menjadi draft. Pengingat proaktif telah otomatis diselesaikan dan hilang dari notifikasi.
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadDocx}
          disabled={downloading}
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B2A4A] hover:bg-[#123B66] text-white text-xs font-bold shadow-xs transition-colors shrink-0"
        >
          <Download className="w-4 h-4 text-teal-300" />
          <span>{downloading ? 'Mengunduh...' : 'Unduh .docx'}</span>
        </button>
      </div>

      {/* Top Action Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
              Draft Balasan Siap Review
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Audit Mandiri: {draft.jumlah_putaran} / 3 Putaran
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            {draft.perihal}
          </h1>
          <p className="text-xs text-slate-600">
            Surat Asal: {surat?.nomor_surat_asal || '-'} ({surat?.instansi_pengirim})
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Batal Edit' : 'Edit Redaksi'}</span>
          </button>

          <button
            onClick={handleDownloadDocx}
            disabled={downloading}
            className="px-4 py-2 rounded-lg bg-[#0B2A4A] hover:bg-[#123B66] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors shrink-0"
          >
            <Download className="w-4 h-4 text-teal-300" />
            <span>{downloading ? 'Mengunduh...' : 'Unduh Dokumen (.docx)'}</span>
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Main Grid: Document Visualizer vs Decision Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Visual Government Document Preview */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-300 p-8 sm:p-12 shadow-sm font-serif text-slate-900 space-y-6">
          {/* Official Letterhead (KOP SURAT) */}
          <div className="text-center space-y-1 pb-4 border-b-4 border-double border-slate-900 font-sans">
            <h3 className="text-xs sm:text-sm font-bold tracking-wide text-slate-800">
              PEMERINTAH DAERAH DAERAH ISTIMEWA YOGYAKARTA
            </h3>
            <h2 className="text-xs sm:text-sm font-bold tracking-wide text-slate-900">
              DINAS PENDIDIKAN, PEMUDA, DAN OLAHRAGA
            </h2>
            <h1 className="text-sm sm:text-base font-extrabold tracking-wider text-slate-950 uppercase">
              BALAI LATIHAN SUMBER DAYA MANUSIA (BLSDM)
            </h1>
            <p className="text-[10px] text-slate-600 leading-tight">
              Jl. Kenari No. 56, Muja Muju, Kec. Umbulharjo, Kota Yogyakarta 55165 · Telp/Faks: (0274) 548902
              <br />
              Laman: blsdm.jogjaprov.go.id · Pos-el: tatausaha@blsdm.go.id
            </p>
          </div>

          {/* Date & Location */}
          <div className="text-right text-xs font-sans">
            Yogyakarta, {new Date(draft.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>

          {/* Metadata Block: Nomor, Sifat, Hal & Kepada Yth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
            <div className="space-y-1">
              <div className="flex">
                <span className="w-20 text-slate-600">Nomor</span>
                <span className="w-3">:</span>
                <div className="font-mono font-bold text-slate-900">
                  {isEditing ? (
                    <input
                      type="text"
                      value={manualNomor}
                      onChange={(e) => setManualNomor(e.target.value)}
                      className="px-1.5 py-0.5 border border-amber-400 bg-amber-50 rounded text-xs font-mono font-bold"
                    />
                  ) : (
                    <span className="bg-amber-100/70 border border-amber-300 px-1.5 py-0.5 rounded text-slate-900">
                      {draft.nomor_surat_text}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex">
                <span className="w-20 text-slate-600">Sifat</span>
                <span className="w-3">:</span>
                <span>{draft.sifat || 'Biasa'}</span>
              </div>
              <div className="flex">
                <span className="w-20 text-slate-600">Lampiran</span>
                <span className="w-3">:</span>
                <span>{draft.lampiran || '-'}</span>
              </div>
              <div className="flex">
                <span className="w-20 text-slate-600">Hal</span>
                <span className="w-3">:</span>
                <span className="font-bold">{draft.perihal}</span>
              </div>
            </div>

            <div className="text-xs space-y-1 sm:pl-4">
              <p className="text-slate-600">Kepada Yth.</p>
              {draft.tujuan_surat.split('\n').map((line, i) => (
                <p key={i} className="font-bold text-slate-900">
                  {line}
                </p>
              ))}
              <p className="text-slate-800">di {draft.lokasi_tujuan || 'Yogyakarta'}</p>
            </div>
          </div>

          {/* Letter Body */}
          <div className="space-y-4 text-xs sm:text-[13px] leading-relaxed text-justify text-slate-800">
            {isEditing ? (
              <div className="space-y-3 font-sans">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700">Paragraf Pembuka:</label>
                  <textarea
                    rows={4}
                    value={pembuka}
                    onChange={(e) => setPembuka(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs leading-relaxed"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700">Paragraf Isi:</label>
                  <textarea
                    rows={4}
                    value={isi}
                    onChange={(e) => setIsi(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs leading-relaxed"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700">Paragraf Penutup:</label>
                  <textarea
                    rows={3}
                    value={penutup}
                    onChange={(e) => setPenutup(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs leading-relaxed"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700">Alasan Perubahan (Untuk Pembelajaran AI):</label>
                  <input
                    type="text"
                    value={alasanRevisi}
                    onChange={(e) => setAlasanRevisi(e.target.value)}
                    placeholder="Contoh: Menyesuaikan tata bahasa dinas agar lebih formal"
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-bold flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Menyimpan...' : 'Simpan Revisi Staf'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="indent-8">{draft.teks_surat.pembuka}</p>
                <p className="indent-8">{draft.teks_surat.isi}</p>

                {/* Table of Details */}
                {draft.teks_surat.rincian_kegiatan && draft.teks_surat.rincian_kegiatan.length > 0 && (
                  <div className="my-3 pl-8 font-sans">
                    <table className="w-full text-xs">
                      <tbody>
                        {draft.teks_surat.rincian_kegiatan.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-100">
                            <td className="py-1 w-44 font-medium text-slate-700">• {item.label}</td>
                            <td className="py-1 w-4 text-slate-500">:</td>
                            <td className="py-1 font-semibold text-slate-900">{item.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <p className="indent-8">{draft.teks_surat.penutup}</p>
              </>
            )}
          </div>

          {/* Signature Block */}
          <div className="pt-6 font-sans">
            <div className="flex justify-end">
              <div className="w-64 text-center space-y-1">
                <p className="text-xs font-bold text-slate-900">
                  Kepala Balai Latihan Sumber Daya Manusia
                </p>

                {/* Space for official signature in Srikandi */}
                <div className="h-20 flex items-center justify-center">
                  <span className="text-[10px] text-slate-400 border border-dashed border-slate-300 px-3 py-1 rounded">
                    [Tanda tangan resmi via Srikandi]
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-900 underline">
                  Dr. Ir. Bambang Soeprapto, M.M.
                </p>
                <p className="text-[11px] text-slate-600 font-mono">
                  NIP. 19740512 199903 1 002
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Decision Panel & Self-Reflection Audit Findings */}
        <div className="lg:col-span-4 space-y-5">
          {/* PANEL CATATAN KEPUTUSAN AGENT (FR14) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Panel Catatan Keputusan (FR14)
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Hal-hal yang tidak tertulis eksplisit di surat asal diputuskan secara mandiri oleh agent dan dicatat di panel ini, bukan di dalam badan surat:
            </p>

            <div className="space-y-2.5">
              {draft.catatan_keputusan && draft.catatan_keputusan.length > 0 ? (
                draft.catatan_keputusan.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-teal-50/60 border border-teal-100 text-xs">
                    <span className="font-bold text-teal-950 block">{item.topik}</span>
                    <p className="text-teal-900 mt-1 font-medium">{item.keputusan}</p>
                    <p className="text-[10px] text-slate-500 mt-1 italic">
                      Dasar pertimbangan: {item.alasan}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">
                  Seluruh klausul bersumber langsung dari surat asal.
                </div>
              )}
            </div>
          </div>

          {/* HASIL PEMERIKSAAN MANDIRI (FR11) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                  Hasil Periksa Mandiri (FR11)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                {draft.hasil_periksa_mandiri?.status_pemeriksaan.toUpperCase()}
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              Sebelum diserahkan ke staf, agent memverifikasi draft dengan surat asal (maks 3 putaran):
            </p>

            <div className="space-y-2">
              {draft.hasil_periksa_mandiri?.temuan.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{item.aspek}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        item.status === 'sesuai' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">{item.catatan}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Manual Staff Task Note */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Satu-satunya Tugas Manual Staf TU:</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Mengisi <strong>nomor urut surat</strong> (bagian <code>B-____</code>) dari buku register dinas, lalu melakukan penandatanganan elektronik resmi di <strong>Srikandi</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
