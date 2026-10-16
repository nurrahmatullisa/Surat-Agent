import React from 'react';
import { GraduationCap, Sparkles, Check, X, ShieldAlert, History, ArrowRight } from 'lucide-react';
import { ContohRevisi, UsulanPembaruan } from '../types';

interface PembelajaranViewProps {
  contohRevisi: ContohRevisi[];
  usulanList: UsulanPembaruan[];
  onResolveUsulan: (id: string, status: 'disetujui' | 'ditolak') => void;
}

export const PembelajaranView: React.FC<PembelajaranViewProps> = ({
  contohRevisi,
  usulanList,
  onResolveUsulan,
}) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-teal-600" />
          <span>Pembelajaran Agent dari Revisi Staf (FR12)</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Perubahan staf pada draft disimpan sebagai contoh gaya bahasa. Agent hanya <strong>MENGUSULKAN</strong> pembaruan template/gaya bahasa; usulan baru berlaku setelah disetujui staf.
        </p>
      </div>

      {/* Guardrail Callout */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 shadow-2xs">
        <ShieldAlert className="w-5 h-5 text-teal-700 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-700 space-y-1">
          <p className="font-bold text-slate-900">GUARDRAIL PEMBELAJARAN (Aturan Bisnis 8):</p>
          <p className="text-[11px] leading-relaxed text-slate-600">
            Agent tidak berhak menerapkan pelajaran dari revisi staf secara sepihak ke template asli. Seluruh penyempurnaan hanya berbentuk usulan dan menunggu keputusan resmi staf TU.
          </p>
        </div>
      </div>

      {/* Grid: Usulan Pembaruan vs Contoh Revisi */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: Usulan Menunggu Persetujuan */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900">
                  Usulan Pembaruan Menunggu Persetujuan
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                {usulanList.filter((u) => u.status === 'menunggu').length} Usulan
              </span>
            </div>

            <div className="space-y-3">
              {usulanList.map((usl) => (
                <div
                  key={usl.id}
                  className={`p-4 rounded-xl border transition-all text-xs space-y-2.5 ${
                    usl.status === 'menunggu'
                      ? 'border-amber-200 bg-amber-50/30'
                      : usl.status === 'disetujui'
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-slate-200 bg-slate-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          usl.status === 'menunggu'
                            ? 'bg-amber-100 text-amber-800'
                            : usl.status === 'disetujui'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {usl.status.toUpperCase()}
                      </span>
                      <h4 className="font-bold text-slate-900 mt-1">{usl.judul}</h4>
                    </div>
                  </div>

                  <p className="text-slate-700 bg-white p-2.5 rounded border border-slate-200 italic leading-relaxed">
                    "{usl.isi_usulan}"
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">
                      Berdasarkan {usl.sumber_revisi_count} contoh koreksi staf
                    </span>

                    {usl.status === 'menunggu' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onResolveUsulan(usl.id, 'ditolak')}
                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded font-semibold text-[11px] flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                        <button
                          onClick={() => onResolveUsulan(usl.id, 'disetujui')}
                          className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Setujui Usulan</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-500">
                        Diputuskan oleh: {usl.diputuskan_oleh || 'Staf TU'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 6 Cols: Riwayat Contoh Revisi Staf */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#0B2A4A]" />
                <h3 className="font-bold text-sm text-slate-900">
                  Arsip Contoh Revisi Staf TU
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {contohRevisi.length} Data
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Setiap kali staf menyunting teks draft di editor, sistem menyimpan pasangan teks sebelum vs sesudah sebagai basis penyesuaian gaya bahasa otomatis:
            </p>

            <div className="space-y-3">
              {contohRevisi.map((rev) => (
                <div key={rev.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs space-y-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                      Teks Semula (Draft Awal Agent)
                    </span>
                    <p className="text-slate-700 p-2 bg-white rounded border border-red-100 text-[11px] line-through decoration-red-400">
                      "{rev.teks_sebelum}"
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      Teks Disunting Staf TU (Baku & Disukai)
                    </span>
                    <p className="text-slate-900 p-2 bg-white rounded border border-emerald-100 text-[11px] font-medium">
                      "{rev.teks_sesudah}"
                    </p>
                  </div>

                  {rev.alasan_perubahan && (
                    <p className="text-[10px] text-slate-500 italic pt-1">
                      Catatan staf: {rev.alasan_perubahan}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
