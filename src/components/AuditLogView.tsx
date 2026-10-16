import React, { useState } from 'react';
import { History, ShieldCheck, Search, Filter } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditLogViewProps {
  logs: AuditLog[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [search, setSearch] = useState('');
  const [filterAksi, setFilterAksi] = useState('semua');

  const filtered = logs.filter((log) => {
    const matchAksi = filterAksi === 'semua' || log.aksi === filterAksi;
    const q = search.toLowerCase();
    const matchSearch =
      log.aksi.toLowerCase().includes(q) ||
      log.user_name.toLowerCase().includes(q) ||
      log.entitas.toLowerCase().includes(q) ||
      log.entitas_id.toLowerCase().includes(q) ||
      JSON.stringify(log.detail).toLowerCase().includes(q);
    return matchAksi && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-[#0B2A4A]" />
            <span>Audit Trail & Log Aktivitas (Append-Only)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Seluruh tindakan staf dan eksekusi agent dicatat secara permanen dan tidak dapat diubah maupun dihapus lewat antarmuka.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Integritas Log Terjamin</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari aksi, pengguna, ID entitas, atau rincian..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Filter:</span>
            <select
              value={filterAksi}
              onChange={(e) => setFilterAksi(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
            >
              <option value="semua">Semua Aksi</option>
              <option value="UPLOAD_SURAT">UPLOAD_SURAT</option>
              <option value="GENERATE_DRAFT">GENERATE_DRAFT</option>
              <option value="CONFLICT_DETECTED">CONFLICT_DETECTED</option>
              <option value="UPDATE_DRAFT">UPDATE_DRAFT</option>
              <option value="DECIDE_PROPOSAL">DECIDE_PROPOSAL</option>
            </select>
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Pengguna / Agen</th>
                <th className="py-3 px-4">Aksi</th>
                <th className="py-3 px-4">Entitas & ID</th>
                <th className="py-3 px-4">Rincian Perubahan (JSON)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 font-sans font-bold text-slate-800 whitespace-nowrap">
                    {log.user_name}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.aksi.includes('CONFLICT')
                          ? 'bg-red-100 text-red-800'
                          : log.aksi.includes('GENERATE')
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {log.aksi}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                    <span className="font-semibold text-slate-900">{log.entitas}</span>
                    <span className="block text-[10px] text-slate-400">{log.entitas_id}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-md font-sans text-[11px] truncate">
                    {JSON.stringify(log.detail)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
