import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Users,
  Clock,
  CheckCircle,
  Calendar,
  Trash2,
  Edit2,
  Filter,
  Monitor,
  Presentation,
  ShieldCheck,
  AlertCircle,
  X,
} from 'lucide-react';
import { FasilitasBooking, NamaRuangan } from '../types';

interface FasilitasViewProps {
  fasilitasList: FasilitasBooking[];
  onRefresh: () => void;
}

export const FasilitasView: React.FC<FasilitasViewProps> = ({ fasilitasList, onRefresh }) => {
  const [selectedRuanganFilter, setSelectedRuanganFilter] = useState<'semua' | NamaRuangan>('semua');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<FasilitasBooking | null>(null);

  // Form states
  const [formRuangan, setFormRuangan] = useState<NamaRuangan>('Aula');
  const [formNamaKegiatan, setFormNamaKegiatan] = useState('');
  const [formPeminjam, setFormPeminjam] = useState('');
  const [formTglMulai, setFormTglMulai] = useState('2026-05-25');
  const [formTglSelesai, setFormTglSelesai] = useState('2026-05-25');
  const [formJamMulai, setFormJamMulai] = useState('08:00');
  const [formJamSelesai, setFormJamSelesai] = useState('15:00');
  const [formJumlahPeserta, setFormJumlahPeserta] = useState('30');
  const [saving, setSaving] = useState(false);

  // Check if a room is occupied today or near future
  const getRoomOccupancy = (roomName: NamaRuangan) => {
    const today = new Date().toISOString().split('T')[0];
    const active = fasilitasList.filter(
      (f) => f.ruangan === roomName && f.tanggal_mulai <= today && f.tanggal_selesai >= today
    );
    const totalBookings = fasilitasList.filter((f) => f.ruangan === roomName).length;
    return {
      isOccupiedNow: active.length > 0,
      activeBooking: active[0] || null,
      totalBookings,
    };
  };

  const aulaStatus = getRoomOccupancy('Aula');
  const lab1Status = getRoomOccupancy('Lab 1');
  const lab2Status = getRoomOccupancy('Lab 2');

  const filteredList = fasilitasList.filter((item) => {
    if (selectedRuanganFilter !== 'semua' && item.ruangan !== selectedRuanganFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.nama_kegiatan.toLowerCase().includes(q) ||
        item.peminjam.toLowerCase().includes(q) ||
        item.ruangan.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openAddModal = () => {
    setEditingBooking(null);
    setFormRuangan('Aula');
    setFormNamaKegiatan('');
    setFormPeminjam('');
    setFormTglMulai(new Date().toISOString().split('T')[0]);
    setFormTglSelesai(new Date().toISOString().split('T')[0]);
    setFormJamMulai('08:00');
    setFormJamSelesai('15:00');
    setFormJumlahPeserta('30');
    setShowAddModal(true);
  };

  const openEditModal = (booking: FasilitasBooking) => {
    setEditingBooking(booking);
    setFormRuangan(booking.ruangan);
    setFormNamaKegiatan(booking.nama_kegiatan);
    setFormPeminjam(booking.peminjam);
    setFormTglMulai(booking.tanggal_mulai);
    setFormTglSelesai(booking.tanggal_selesai);
    setFormJamMulai(booking.jam_mulai);
    setFormJamSelesai(booking.jam_selesai);
    setFormJumlahPeserta(booking.jumlah_peserta ? booking.jumlah_peserta.toString() : '');
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaKegiatan || !formTglMulai) return;
    setSaving(true);

    try {
      if (editingBooking) {
        // Delete then re-create or update
        await fetch(`/api/fasilitas/${editingBooking.id}`, { method: 'DELETE' });
      }

      const res = await fetch('/api/fasilitas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruangan: formRuangan,
          nama_kegiatan: formNamaKegiatan,
          peminjam: formPeminjam,
          tanggal_mulai: formTglMulai,
          tanggal_selesai: formTglSelesai || formTglMulai,
          jam_mulai: formJamMulai,
          jam_selesai: formJamSelesai,
          jumlah_peserta: formJumlahPeserta,
        }),
      });

      if (!res.ok) throw new Error('Gagal menyimpan jadwal fasilitas');
      setShowAddModal(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan jadwal fasilitas.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus peminjaman fasilitas "${name}"?`)) return;
    try {
      const res = await fetch(`/api/fasilitas/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus peminjaman fasilitas');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#0B2A4A]" />
            <span>Ketersediaan Fasilitas Ruangan BLSDM</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Pemantauan ketersediaan dan jadwal pemakaian fasilitas ruangan utama: <strong>Aula</strong>, <strong>Lab 1</strong>, dan <strong>Lab 2</strong>.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#0B2A4A] hover:bg-[#123B66] text-white text-xs font-bold transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Jadwal Pemakaian</span>
        </button>
      </div>

      {/* 3 Facility Cards: Aula, Lab 1, Lab 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Aula */}
        <div
          onClick={() => setSelectedRuanganFilter(selectedRuanganFilter === 'Aula' ? 'semua' : 'Aula')}
          className={`cursor-pointer bg-white rounded-xl border p-5 shadow-2xs transition-all hover:shadow-md relative overflow-hidden ${
            selectedRuanganFilter === 'Aula' ? 'border-[#0B2A4A] ring-2 ring-[#0B2A4A]/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0B2A4A] flex items-center justify-center font-bold">
                <Presentation className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Aula Utama BLSDM</h3>
                <p className="text-[11px] text-slate-500">Gedung Utama Lantai 1</p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                aulaStatus.isOccupiedNow
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {aulaStatus.isOccupiedNow ? 'Sedang Terpakai' : 'Tersedia'}
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Kapasitas:</span>
              </span>
              <span className="font-semibold text-slate-800">200 Orang</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Total Agenda:</span>
              </span>
              <span className="font-semibold text-slate-800">{aulaStatus.totalBookings} Jadwal</span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Fasilitas: Sound system, podium, 2 proyektor, AC sentral, kursi banquet.
            </p>
          </div>
        </div>

        {/* Card 2: Lab 1 */}
        <div
          onClick={() => setSelectedRuanganFilter(selectedRuanganFilter === 'Lab 1' ? 'semua' : 'Lab 1')}
          className={`cursor-pointer bg-white rounded-xl border p-5 shadow-2xs transition-all hover:shadow-md relative overflow-hidden ${
            selectedRuanganFilter === 'Lab 1' ? 'border-[#0B2A4A] ring-2 ring-[#0B2A4A]/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Lab 1 (Lab Komputer 1)</h3>
                <p className="text-[11px] text-slate-500">Gedung Diklat Lantai 2</p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                lab1Status.isOccupiedNow
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {lab1Status.isOccupiedNow ? 'Sedang Terpakai' : 'Tersedia'}
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Kapasitas:</span>
              </span>
              <span className="font-semibold text-slate-800">35 PC / Peserta</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Total Agenda:</span>
              </span>
              <span className="font-semibold text-slate-800">{lab1Status.totalBookings} Jadwal</span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Fasilitas: 35 PC Core i7, LAN Gigabit, Smart TV interaktif, AC split.
            </p>
          </div>
        </div>

        {/* Card 3: Lab 2 */}
        <div
          onClick={() => setSelectedRuanganFilter(selectedRuanganFilter === 'Lab 2' ? 'semua' : 'Lab 2')}
          className={`cursor-pointer bg-white rounded-xl border p-5 shadow-2xs transition-all hover:shadow-md relative overflow-hidden ${
            selectedRuanganFilter === 'Lab 2' ? 'border-[#0B2A4A] ring-2 ring-[#0B2A4A]/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-800 flex items-center justify-center font-bold">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Lab 2 (Lab Komputer 2)</h3>
                <p className="text-[11px] text-slate-500">Gedung Diklat Lantai 2</p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                lab2Status.isOccupiedNow
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {lab2Status.isOccupiedNow ? 'Sedang Terpakai' : 'Tersedia'}
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Kapasitas:</span>
              </span>
              <span className="font-semibold text-slate-800">30 PC / Peserta</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Total Agenda:</span>
              </span>
              <span className="font-semibold text-slate-800">{lab2Status.totalBookings} Jadwal</span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Fasilitas: 30 PC Core i5, server simulasi ujian CAT, proyektor HDMI, AC split.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-xs font-semibold text-slate-700">Filter Ruangan:</span>
          <div className="flex items-center gap-1.5">
            {(['semua', 'Aula', 'Lab 1', 'Lab 2'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRuanganFilter(r)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  selectedRuanganFilter === r
                    ? 'bg-[#0B2A4A] text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r === 'semua' ? 'Semua Ruangan' : r}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kegiatan atau peminjam..."
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0B2A4A]" />
            <h3 className="font-bold text-sm text-slate-900">
              Jadwal Pemakaian Ruangan ({filteredList.length} Agenda Terdaftar)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Aula, Lab 1, Lab 2
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Ruangan</th>
                <th className="py-3 px-4">Nama Kegiatan</th>
                <th className="py-3 px-4">Peminjam / Instansi</th>
                <th className="py-3 px-4">Tanggal Pelaksanaan</th>
                <th className="py-3 px-4">Jam</th>
                <th className="py-3 px-4">Peserta</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length > 0 ? (
                filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-xs font-bold ${
                          item.ruangan === 'Aula'
                            ? 'bg-blue-100 text-blue-900'
                            : item.ruangan === 'Lab 1'
                            ? 'bg-teal-100 text-teal-900'
                            : 'bg-indigo-100 text-indigo-900'
                        }`}
                      >
                        {item.ruangan}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{item.nama_kegiatan}</td>
                    <td className="py-3 px-4 text-slate-700">{item.peminjam}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {item.tanggal_mulai === item.tanggal_selesai
                        ? item.tanggal_mulai
                        : `${item.tanggal_mulai} s.d ${item.tanggal_selesai}`}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {item.jam_mulai} - {item.jam_selesai}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.jumlah_peserta ? `${item.jumlah_peserta} org` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.nama_kegiatan)}
                          className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    Tidak ada jadwal pemakaian untuk filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                {editingBooking ? 'Edit Jadwal Pemakaian Fasilitas' : 'Tambah Pemakaian Fasilitas Ruangan'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Pilih Ruangan Fasilitas</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Aula', 'Lab 1', 'Lab 2'] as const).map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setFormRuangan(r)}
                      className={`p-2 rounded-lg border text-center font-bold transition-colors ${
                        formRuangan === r
                          ? 'border-[#0B2A4A] bg-[#0B2A4A] text-white shadow-xs'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Kegiatan</label>
                <input
                  type="text"
                  required
                  value={formNamaKegiatan}
                  onChange={(e) => setFormNamaKegiatan(e.target.value)}
                  placeholder="Misal: Uji Kompetensi ASN / Pelatihan IT"
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Peminjam / Instansi</label>
                <input
                  type="text"
                  required
                  value={formPeminjam}
                  onChange={(e) => setFormPeminjam(e.target.value)}
                  placeholder="Misal: BKD DIY / Seksi Penjamin Mutu"
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={formTglMulai}
                    onChange={(e) => setFormTglMulai(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={formTglSelesai}
                    onChange={(e) => setFormTglSelesai(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Jam Mulai</label>
                  <input
                    type="text"
                    value={formJamMulai}
                    onChange={(e) => setFormJamMulai(e.target.value)}
                    placeholder="08:00"
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Jam Selesai</label>
                  <input
                    type="text"
                    value={formJamSelesai}
                    onChange={(e) => setFormJamSelesai(e.target.value)}
                    placeholder="15:00"
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Jumlah Peserta</label>
                  <input
                    type="number"
                    value={formJumlahPeserta}
                    onChange={(e) => setFormJumlahPeserta(e.target.value)}
                    placeholder="25"
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded bg-[#0B2A4A] hover:bg-[#123B66] text-white font-bold shadow-xs"
                >
                  {saving ? 'Menyimpan...' : editingBooking ? 'Perbarui Jadwal' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
