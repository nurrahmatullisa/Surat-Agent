import React, { useState, useEffect } from 'react';
import {
  FileText,
  Play,
  RotateCcw,
  CheckCircle,
  AlertOctagon,
  ArrowLeft,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { SuratMasuk, DraftBalasan, AgentRun, AgentStep } from '../types';

interface DetailSuratViewProps {
  suratId: string;
  onBack: () => void;
  onProcessAgent: (id: string) => void;
  onNavigateToDraft: (draftId: string) => void;
  onNavigateToBentrok: () => void;
}

export const DetailSuratView: React.FC<DetailSuratViewProps> = ({
  suratId,
  onBack,
  onProcessAgent,
  onNavigateToDraft,
  onNavigateToBentrok,
}) => {
  const [surat, setSurat] = useState<SuratMasuk | null>(null);
  const [draft, setDraft] = useState<DraftBalasan | null>(null);
  const [run, setRun] = useState<AgentRun | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetail();
  }, [suratId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/surat-masuk/${suratId}`);
      if (!res.ok) throw new Error('Gagal memuat detail surat');
      const data = await res.json();
      setSurat(data.surat);
      setDraft(data.draft);
      setRun(data.latest_run);
      setSteps(data.steps || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !surat) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-2 text-slate-500">
        <RotateCcw className="w-6 h-6 animate-spin text-teal-600" />
        <span className="text-xs">Memuat detail surat masuk...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700"
            title="Kembali"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                {surat.nomor_agenda}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  surat.status === 'diterima'
                    ? 'bg-blue-100 text-blue-800'
                    : surat.status === 'bentrok'
                    ? 'bg-red-100 text-red-800'
                    : surat.status === 'draft'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {surat.status.toUpperCase()}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">{surat.perihal}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {surat.status === 'diterima' && (
            <button
              onClick={() => onProcessAgent(surat.id)}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs"
            >
              <Play className="w-4 h-4" />
              <span>Jalankan Siklus Agent TU</span>
            </button>
          )}

          {draft && (
            <button
              onClick={() => onNavigateToDraft(draft.id)}
              className="px-4 py-2 rounded-lg bg-[#0B2A4A] hover:bg-[#123B66] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs"
            >
              <FileText className="w-4 h-4 text-teal-300" />
              <span>Buka Draft Balasan ({draft.nomor_surat_text})</span>
            </button>
          )}

          {surat.status === 'bentrok' && (
            <button
              onClick={onNavigateToBentrok}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Lihat Alternatif Bentrok</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Info Surat & Extracted Data vs Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Surat Metadata & OCR Text */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Data Fisik & Ekstraksi Entitas
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-500">Nama Pejabat Pengirim</span>
                <p className="font-bold text-slate-800 mt-0.5">{surat.pengirim}</p>
              </div>

              <div>
                <span className="text-[11px] text-slate-500">Instansi Pengirim</span>
                <p className="font-bold text-slate-800 mt-0.5">{surat.instansi_pengirim}</p>
              </div>

              <div>
                <span className="text-[11px] text-slate-500">Nomor Surat Asal</span>
                <p className="font-mono font-bold text-slate-800 mt-0.5">{surat.nomor_surat_asal}</p>
              </div>

              <div>
                <span className="text-[11px] text-slate-500">Tanggal Surat Asal</span>
                <p className="font-mono text-slate-800 mt-0.5">{surat.tanggal_surat_asal}</p>
              </div>

              <div>
                <span className="text-[11px] text-slate-500">Tanggal Diminta</span>
                <p className="font-mono text-teal-800 font-bold mt-0.5">
                  {surat.data_ekstraksi.tanggal_diminta || '-'}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-500">Ruangan Diminta</span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {surat.data_ekstraksi.ruangan_diminta || 'Tidak Spesifik'}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-500">Jumlah Peserta</span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {surat.data_ekstraksi.jumlah_peserta ? `${surat.data_ekstraksi.jumlah_peserta} orang` : '-'}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-500">Tipe Berkas</span>
                <p className="font-mono text-slate-800 mt-0.5 uppercase">{surat.file_type}</p>
              </div>
            </div>
          </div>

          {/* OCR / Read Text Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Teks Hasil Baca / OCR Berkas Asal
            </h3>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
              {surat.teks_hasil_baca}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Execution History & Step Timeline */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0B2A4A]" />
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                  Linimasa Langkah Agent
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {steps.length} Langkah
              </span>
            </div>

            {run && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="font-bold text-slate-800">Status Run: {run.status.toUpperCase()}</span>
                  <span>{run.mulai.split('T')[1].substring(0, 8)}</span>
                </div>
                {run.ringkasan_keputusan && (
                  <p className="text-[11px] text-slate-600 mt-1 italic leading-relaxed">
                    "{run.ringkasan_keputusan}"
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {steps.length > 0 ? (
                steps.map((st, i) => (
                  <div key={i} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold text-[#0B2A4A]">Langkah {st.urutan}: {st.tool}</span>
                      <span className="text-slate-400">{st.created_at.split('T')[1].substring(0, 8)}</span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed">{st.pemikiran}</p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada catatan langkah agent untuk surat ini.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
