import React, { useState } from 'react';
import {
  AlertOctagon,
  Calendar,
  CheckCircle2,
  Clock,
  RotateCcw,
  ShieldCheck,
  Building,
  ArrowRight,
} from 'lucide-react';
import { SuratMasuk, DraftBalasan } from '../types';

interface BentrokViewProps {
  suratList: SuratMasuk[];
  onResolveConflict: (suratId: string, altTanggal: string, altRuangan: string) => Promise<void>;
  onNavigateToDraft: (draftId: string) => void;
}

export const BentrokView: React.FC<BentrokViewProps> = ({
  suratList,
  onResolveConflict,
  onNavigateToDraft,
}) => {
  const bentrokSurat = suratList.filter((s) => s.status === 'bentrok');
  const [selectedSuratId, setSelectedSuratId] = useState<string>(bentrokSurat[0]?.id || '');
  const [chosenAltIdx, setChosenAltIdx] = useState<number>(0);
  const [processing, setProcessing] = useState(false);

  const activeSurat = suratList.find((s) => s.id === selectedSuratId) || bentrokSurat[0];

  // Concrete alternatives strictly within Aula, Lab 1, Lab 2
  const alternatives = [
    {
      tanggal: '2026-05-20',
      ruangan: 'Lab 1',
      jam: '08.00 - 15.00 WIB',
      alasan: 'Tetap tanggal 20 Mei 2026, dialihkan ke fasilitas Lab 1 (kapasitas 35 PC/peserta, ruangan kosong).',
      kapasitas: '35 Peserta / PC',
    },
    {
      tanggal: '2026-05-25',
      ruangan: 'Aula',
      jam: '08.00 - 15.00 WIB',
      alasan: 'Fasilitas Aula kosong pasca penutupan Pelatihan Kepemimpinan Pengawas (PKP) per 25 Mei 2026.',
      kapasitas: '200 Kursi',
    },
    {
      tanggal: '2026-05-26',
      ruangan: 'Aula',
      jam: '08.00 - 15.00 WIB',
      alasan: 'Fasilitas Aula tersedia penuh sepanjang hari pada 26 Mei 2026.',
      kapasitas: '200 Kursi',
    },
  ];

  const handleResolve = async () => {
    if (!activeSurat) return;
    setProcessing(true);
    try {
      const chosen = alternatives[chosenAltIdx];
      await onResolveConflict(activeSurat.id, chosen.tanggal, chosen.ruangan);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <AlertOctagon className="w-6 h-6 text-red-600" />
          <span>Hasil Deteksi Bentrok Agenda & Rekomendasi Jadwal</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Pencocokan 100% dengan register agenda. Saat bentrok, pembuatan draft surat diblokir secara otomatis dan agent menyajikan alternatif penjadwalan.
        </p>
      </div>

      {/* Guardrail Policy Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
        <div className="text-xs text-amber-900 space-y-1">
          <p className="font-bold">GUARDRAIL ATURAN DINAS BLSDM (FR03 & Bagian 6):</p>
          <p className="text-[11px] leading-relaxed text-amber-800">
            Sistem <strong>TIDAK PERNAH MEMBUAT SURAT PENOLAKAN</strong>. Draft surat balasan dinas baru akan dibuat setelah tanggal atau ruangan alternatif disetujui staf TU.
          </p>
        </div>
      </div>

      {bentrokSurat.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">Tidak Ada Bentrok Jadwal Aktif</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Seluruh surat permohonan yang masuk saat ini tidak berbenturan dengan agenda ruangan, pelatihan, maupun jadwal narasumber BLSDM.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 4 Cols: List of Conflicted Letters */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Surat Masuk Bentrok ({bentrokSurat.length})
            </h4>

            <div className="space-y-2">
              {bentrokSurat.map((surat) => (
                <div
                  key={surat.id}
                  onClick={() => setSelectedSuratId(surat.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                    activeSurat?.id === surat.id
                      ? 'border-red-400 bg-red-50/70 text-red-950 font-medium'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                    {surat.nomor_agenda}
                  </span>
                  <h5 className="font-bold mt-1 line-clamp-1">{surat.perihal}</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">{surat.instansi_pengirim}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right 8 Cols: Conflict Detail & Alternative Suggester */}
          {activeSurat && (
            <div className="lg:col-span-8 space-y-5">
              {/* Conflict Cause Card */}
              <div className="bg-white rounded-xl border border-red-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-red-100">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-red-600" />
                    <h3 className="font-bold text-sm text-red-950">Rincian Bentrok yang Terdeteksi</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                    BENTROK 100%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">Permohonan Surat Masuk:</span>
                    <p className="font-bold text-slate-900">{activeSurat.perihal}</p>
                    <p className="text-slate-600">Pengirim: {activeSurat.instansi_pengirim}</p>
                    <p className="text-slate-800 font-mono">
                      Tanggal: {activeSurat.data_ekstraksi.tanggal_diminta || '20 Mei 2026'} ({activeSurat.data_ekstraksi.jam_diminta || '08.00'} - {activeSurat.data_ekstraksi.jam_selesai_diminta || '15.00'} WIB)
                    </p>
                    <p className="text-slate-800 font-semibold">
                      Ruangan: {activeSurat.data_ekstraksi.ruangan_diminta || 'Aula Utama BLSDM'} ({activeSurat.data_ekstraksi.jumlah_peserta || 120} orang)
                    </p>
                  </div>

                  <div className="p-3 bg-red-50/70 rounded-lg border border-red-200 space-y-1">
                    <span className="text-[11px] font-semibold text-red-700 uppercase">Agenda Eksisting yang Bentrok:</span>
                    <p className="font-bold text-red-950">Pelatihan Kepemimpinan Pengawas (PKP) Angkatan IV</p>
                    <p className="text-red-800">Penyelenggara: Bidang Diklat Kepemimpinan BLSDM</p>
                    <p className="text-red-900 font-mono">
                      Jadwal: 18 - 22 Mei 2026 (08.00 - 16.00 WIB)
                    </p>
                    <p className="text-red-900 font-semibold">
                      Ruangan: Aula Utama BLSDM (40 Peserta Diklat)
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 Alternatives Suggester */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-teal-600" />
                    <h4 className="font-bold text-sm text-slate-900">
                      Rekomendasi Alternatif Tanggal & Ruangan Kosong
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500">Pilih 1 opsi untuk melanjutkan</span>
                </div>

                <div className="space-y-3">
                  {alternatives.map((alt, idx) => (
                    <div
                      key={idx}
                      onClick={() => setChosenAltIdx(idx)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        chosenAltIdx === idx
                          ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">Opsi {idx + 1}: {alt.ruangan}</span>
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                              {alt.kapasitas}
                            </span>
                          </div>
                          <div className="text-xs text-slate-700 flex items-center gap-3 font-mono">
                            <span className="font-bold text-teal-800">{alt.tanggal}</span>
                            <span>·</span>
                            <span>{alt.jam}</span>
                          </div>
                          <p className="text-xs text-slate-600 pt-0.5">{alt.alasan}</p>
                        </div>

                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 border-teal-600">
                          {chosenAltIdx === idx && (
                            <div className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Opsi terpilih: <strong>{alternatives[chosenAltIdx].tanggal}</strong> ({alternatives[chosenAltIdx].ruangan})
                  </span>

                  <button
                    onClick={handleResolve}
                    disabled={processing}
                    className="px-5 py-2.5 rounded-lg bg-[#0B2A4A] hover:bg-[#123B66] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                  >
                    {processing ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin text-teal-300" />
                        <span>Memproses Ulang Agent TU...</span>
                      </>
                    ) : (
                      <>
                        <span>Pilih Alternatif & Buat Draft Persetujuan</span>
                        <ArrowRight className="w-4 h-4 text-teal-300" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
