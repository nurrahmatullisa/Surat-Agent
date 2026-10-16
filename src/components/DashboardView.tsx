import React from 'react';
import {
  Inbox,
  Clock,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  UploadCloud,
  Calendar,
  AlertOctagon,
  Eye,
  Play,
} from 'lucide-react';
import { SuratMasuk, DraftBalasan, UsulanPembaruan } from '../types';

interface DashboardViewProps {
  counts: {
    total_surat: number;
    surat_baru: number;
    sedang_diproses: number;
    bentrok: number;
    draft_siap: number;
    selesai: number;
    usulan_menunggu: number;
    agenda_aktif: number;
  };
  reminders: Array<{ surat: SuratMasuk; lama_hari: number }>;
  collisions: Array<{ surat_a: SuratMasuk; surat_b: SuratMasuk; alasan: string }>;
  usulanList: UsulanPembaruan[];
  recentSurat: SuratMasuk[];
  recentDrafts: DraftBalasan[];
  onNavigate: (tab: any) => void;
  onSelectSurat: (id: string) => void;
  onSelectDraft: (id: string) => void;
  onProcessAgent: (id: string) => void;
  onResolveUsulan: (id: string, status: 'disetujui' | 'ditolak') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  counts,
  reminders,
  collisions,
  usulanList,
  recentSurat,
  recentDrafts,
  onNavigate,
  onSelectSurat,
  onSelectDraft,
  onProcessAgent,
  onResolveUsulan,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
              Sistem Otomasi TU BLSDM
            </span>
            <span className="text-xs text-slate-500">· Kode Unit: BLSDM.35</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Ringkasan Tata Usaha & Pengingat Proaktif
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            AI Agent membaca surat masuk, memeriksa bentrok agenda ruangan/narasumber, dan menyusun draft surat balasan dinas Word (.docx).
          </p>
        </div>

        <button
          onClick={() => onNavigate('upload')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B2A4A] text-white text-xs font-semibold hover:bg-[#123B66] transition-colors shadow-xs shrink-0"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Surat Masuk Baru</span>
        </button>
      </div>

      {/* KPI Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div
          onClick={() => onNavigate('surat-masuk')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 cursor-pointer transition-all shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Surat Baru</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-mono tabular-nums">{counts.surat_baru}</p>
          <span className="text-[11px] text-blue-600 font-medium">Menunggu diproses</span>
        </div>

        <div
          onClick={() => onNavigate('bentrok')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-red-300 cursor-pointer transition-all shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Bentrok Agenda</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2 font-mono tabular-nums">{counts.bentrok}</p>
          <span className="text-[11px] text-red-600 font-medium">Perlu jadwal alternatif</span>
        </div>

        <div
          onClick={() => onNavigate('drafts')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-300 cursor-pointer transition-all shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Draft Siap Periksa</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-mono tabular-nums">{counts.draft_siap}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Siap review staf</span>
        </div>

        <div
          onClick={() => onNavigate('pembelajaran')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-amber-300 cursor-pointer transition-all shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Usulan Belajar AI</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-mono tabular-nums">{counts.usulan_menunggu}</p>
          <span className="text-[11px] text-amber-600 font-medium">Usulan gaya/template</span>
        </div>

        <div
          onClick={() => onNavigate('agenda')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-purple-300 cursor-pointer transition-all shadow-2xs col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Agenda Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-mono tabular-nums">{counts.agenda_aktif}</p>
          <span className="text-[11px] text-purple-600 font-medium">Ruang & Diklat</span>
        </div>
      </div>

      {/* Proactive Reminders & Preemptive Collision Section (FR13) */}
      {(reminders.length > 0 || collisions.length > 0) && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-amber-950">
                Peringatan Proaktif Agent (FR13)
              </h3>
            </div>
            <span className="text-xs text-amber-800 font-medium">
              Otomatis mendeteksi keterlambatan & perebutan sarana
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {collisions.map((col, idx) => (
              <div key={idx} className="bg-white p-3.5 rounded-lg border border-red-200 shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-red-800">
                      Konflik Sarana Antar-Surat Masuk
                    </span>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">{col.alasan}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => onSelectSurat(col.surat_a.id)}
                        className="text-[11px] text-teal-700 font-medium hover:underline"
                      >
                        Buka {col.surat_a.nomor_agenda} →
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={() => onSelectSurat(col.surat_b.id)}
                        className="text-[11px] text-teal-700 font-medium hover:underline"
                      >
                        Buka {col.surat_b.nomor_agenda} →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {reminders.map((rem, idx) => (
              <div key={idx} className="bg-white p-3.5 rounded-lg border border-amber-200 shadow-2xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      Belum Dibalas {rem.lama_hari} Hari
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
                      {rem.surat.perihal}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{rem.surat.instansi_pengirim}</p>
                  </div>
                  <button
                    onClick={() => onSelectSurat(rem.surat.id)}
                    className="px-2.5 py-1.5 rounded-md bg-[#0B2A4A] text-white text-[11px] font-medium hover:bg-[#123B66] shrink-0"
                  >
                    Buka
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Surat Masuk Menunggu & Terkini */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-[#0B2A4A]" />
              <h3 className="font-bold text-sm text-slate-900">Surat Masuk Terkini</h3>
            </div>
            <button
              onClick={() => onNavigate('surat-masuk')}
              className="text-xs text-teal-700 font-medium hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentSurat.map((surat) => (
              <div
                key={surat.id}
                className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-mono font-medium text-slate-700">{surat.nomor_agenda}</span>
                      <span>·</span>
                      <span>{surat.tanggal_diterima}</span>
                      <span>·</span>
                      <span className="font-mono">{surat.file_type.toUpperCase()}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">{surat.perihal}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">{surat.instansi_pengirim}</p>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
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

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    Pemohon: {surat.pengirim}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectSurat(surat.id)}
                      className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Detail</span>
                    </button>
                    {surat.status === 'diterima' && (
                      <button
                        onClick={() => onProcessAgent(surat.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded flex items-center gap-1 shadow-2xs"
                      >
                        <Play className="w-3 h-3" />
                        <span>Proses Agent</span>
                      </button>
                    )}
                    {surat.status === 'bentrok' && (
                      <button
                        onClick={() => onNavigate('bentrok')}
                        className="px-2.5 py-1 text-[11px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded flex items-center gap-1"
                      >
                        <AlertOctagon className="w-3 h-3" />
                        <span>Pilih Alternatif</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Draft Balasan Siap & Usulan Pembaruan */}
        <div className="space-y-6">
          {/* Draft Siap Review */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Draft Balasan Word (.docx) Siap</h3>
              </div>
              <button
                onClick={() => onNavigate('drafts')}
                className="text-xs text-teal-700 font-medium hover:underline flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {recentDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="p-3.5 rounded-lg border border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {draft.nomor_surat_text}
                        </span>
                        <span>·</span>
                        <span className="text-emerald-700 font-medium">
                          {draft.jumlah_putaran} putaran periksa mandiri
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                          ✓ Berhasil Dibuat
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1.5">{draft.perihal}</h4>
                      <p className="text-xs text-slate-600 mt-0.5 whitespace-pre-line line-clamp-2">
                        Kepada: {draft.tujuan_surat.split('\n')[0]}
                      </p>
                    </div>

                    <button
                      onClick={() => onSelectDraft(draft.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#0B2A4A] text-white text-xs font-medium hover:bg-[#123B66] shrink-0"
                    >
                      Buka & Unduh
                    </button>
                  </div>

                  {draft.catatan_keputusan && draft.catatan_keputusan.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-emerald-200/60 text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-700">Keputusan Agent: </span>
                      <span>{draft.catatan_keputusan[0].topik} ({draft.catatan_keputusan[0].keputusan})</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Usulan Pembaruan Gaya (FR12) */}
          {usulanList.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-sm text-slate-900">
                    Usulan Pembaruan Gaya dari Staf (FR12)
                  </h3>
                </div>
                <span className="text-xs font-medium text-amber-700">Menunggu persetujuan</span>
              </div>

              <div className="space-y-2.5">
                {usulanList.map((usl) => (
                  <div key={usl.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <h5 className="font-bold text-slate-900">{usl.judul}</h5>
                    <p className="text-slate-600 mt-1 italic">"{usl.isi_usulan}"</p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        {usl.sumber_revisi_count} contoh revisi staf
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onResolveUsulan(usl.id, 'ditolak')}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-200 rounded"
                        >
                          Tolak
                        </button>
                        <button
                          onClick={() => onResolveUsulan(usl.id, 'disetujui')}
                          className="px-2.5 py-1 text-[11px] font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded"
                        >
                          Setujui Usulan
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
