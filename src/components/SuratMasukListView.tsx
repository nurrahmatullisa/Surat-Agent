import React, { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  Play,
  FileText,
  AlertOctagon,
  Clock,
  Plus,
} from 'lucide-react';
import { SuratMasuk } from '../types';

interface SuratMasukListViewProps {
  suratList: SuratMasuk[];
  onSelectSurat: (id: string) => void;
  onProcessAgent: (id: string) => void;
  onSelectDraft: (draftId: string) => void;
  onNavigateUpload: () => void;
  onNavigateBentrok: () => void;
}

export const SuratMasukListView: React.FC<SuratMasukListViewProps> = ({
  suratList,
  onSelectSurat,
  onProcessAgent,
  onSelectDraft,
  onNavigateUpload,
  onNavigateBentrok,
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('semua');

  const filtered = suratList.filter((s) => {
    const matchStatus = filterStatus === 'semua' || s.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch =
      s.perihal.toLowerCase().includes(q) ||
      s.pengirim.toLowerCase().includes(q) ||
      s.instansi_pengirim.toLowerCase().includes(q) ||
      s.nomor_surat_asal.toLowerCase().includes(q) ||
      s.nomor_agenda.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Daftar Surat Masuk Dinas
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Pengelolaan berkas permohonan dinas, ekstraksi entitas, dan status pemrosesan draft balasan.
          </p>
        </div>

        <button
          onClick={onNavigateUpload}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B2A4A] hover:bg-[#123B66] text-white text-xs font-bold transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah / Upload Surat</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari perihal, nomor surat, pengirim, atau instansi..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Segmented Status Filters */}
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 rounded-lg shrink-0">
            {[
              { id: 'semua', label: 'Semua' },
              { id: 'diterima', label: 'Diterima' },
              { id: 'diproses', label: 'Diproses' },
              { id: 'bentrok', label: 'Bentrok' },
              { id: 'draft', label: 'Draft Siap' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  filterStatus === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">No. Agenda</th>
                <th className="py-3 px-4">Surat Asal & Pengirim</th>
                <th className="py-3 px-4">Perihal & Permohonan</th>
                <th className="py-3 px-4">Tgl Terima</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((surat) => (
                  <tr key={surat.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {surat.nomor_agenda}
                      <span className="block text-[10px] font-normal text-slate-400 font-sans mt-0.5">
                        {surat.file_type.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-bold text-slate-900">{surat.pengirim}</p>
                      <p className="text-slate-600 text-[11px] mt-0.5">{surat.instansi_pengirim}</p>
                      <p className="font-mono text-[10px] text-slate-400 mt-1">No: {surat.nomor_surat_asal}</p>
                    </td>

                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="font-semibold text-slate-900 line-clamp-2">{surat.perihal}</p>
                      {surat.data_ekstraksi.tanggal_diminta && (
                        <p className="text-[11px] text-teal-800 mt-1 font-mono">
                          Tgl Diminta: {surat.data_ekstraksi.tanggal_diminta}
                          {surat.data_ekstraksi.ruangan_diminta ? ` (${surat.data_ekstraksi.ruangan_diminta})` : ''}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-mono">
                      {surat.tanggal_diterima}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                          surat.status === 'diterima'
                            ? 'bg-blue-100 text-blue-800'
                            : surat.status === 'bentrok'
                            ? 'bg-red-100 text-red-800'
                            : surat.status === 'draft'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {surat.status === 'draft' ? '✓ DRAFT BERHASIL DIBUAT' : surat.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectSurat(surat.id)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>

                        {surat.status === 'diterima' && (
                          <button
                            onClick={() => onProcessAgent(surat.id)}
                            className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Proses</span>
                          </button>
                        )}

                        {surat.status === 'bentrok' && (
                          <button
                            onClick={onNavigateBentrok}
                            className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1"
                          >
                            <AlertOctagon className="w-3.5 h-3.5" />
                            <span>Alternatif</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada surat masuk yang sesuai dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
