import React, { useState } from 'react';
import { Settings, Save, CheckCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import { Pengaturan } from '../types';

interface PengaturanViewProps {
  pengaturan: Pengaturan;
  onRefresh: () => void;
  onResetSeed: () => void;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  pengaturan,
  onRefresh,
  onResetSeed,
}) => {
  const [form, setForm] = useState<Pengaturan>({ ...pengaturan });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/pengaturan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Gagal memperbarui pengaturan');
      setSaved(true);
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Gagal memperbarui pengaturan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#0B2A4A]" />
            <span>Pengaturan Sistem & Parameter Tata Naskah Dinas</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Konfigurasi kode unit surat, batas langkah otonomi agent, batas putaran perbaikan, dan identitas resmi pimpinan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (confirm('Reset seluruh database ke kondisi seed awal?')) {
              onResetSeed();
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Database Demo</span>
        </button>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Pengaturan berhasil diperbarui dan langsung dipedomani oleh agent!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
        {/* Section 1: Aturan Penomoran Surat (FR05) */}
        <div className="space-y-4">
          <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Format Penomoran Surat Dinas (FR05)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700">Kode Unit Organisasi (BLSDM)</label>
              <input
                type="text"
                required
                value={form.kode_unit}
                onChange={(e) => setForm({ ...form, kode_unit: e.target.value })}
                className="mt-1 w-full p-2 border border-slate-300 rounded font-mono font-bold"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Pola dinas: <code>B-____/{form.kode_unit}/[KODE]/[BLN]/[THN]</code>
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700">Kota Penanggalan Surat</label>
              <input
                type="text"
                required
                value={form.kota_surat}
                onChange={(e) => setForm({ ...form, kota_surat: e.target.value })}
                className="mt-1 w-full p-2 border border-slate-300 rounded"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Dicantumkan di kanan atas surat resmi
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Parameter Batas Otonomi Agent (FR14 & Guardrails) */}
        <div className="space-y-4">
          <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Batas Otonomi & Keandalan Agent (FR14)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700">Batas Maksimal Langkah per Surat</label>
              <input
                type="number"
                min={5}
                max={30}
                value={form.batas_langkah}
                onChange={(e) => setForm({ ...form, batas_langkah: parseInt(e.target.value, 10) || 15 })}
                className="mt-1 w-full p-2 border border-slate-300 rounded font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Default: 15 langkah. Agent berhenti jika batas tercapai.
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700">Batas Maksimal Putaran Periksa Mandiri</label>
              <input
                type="number"
                min={1}
                max={5}
                value={form.batas_putaran_periksa}
                onChange={(e) => setForm({ ...form, batas_putaran_periksa: parseInt(e.target.value, 10) || 3 })}
                className="mt-1 w-full p-2 border border-slate-300 rounded font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Default: 3 putaran (FR11).
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Data Pejabat Penandatangan (Kop & Tanda Tangan) */}
        <div className="space-y-4">
          <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Identitas Pejabat Penandatangan Resmi (Srikandi)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700">Jabatan Penandatangan</label>
              <input
                type="text"
                value={form.jabatan_penandatangan}
                onChange={(e) => setForm({ ...form, jabatan_penandatangan: e.target.value })}
                className="mt-1 w-full p-2 border border-slate-300 rounded"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700">Nama Lengkap & Gelar</label>
              <input
                type="text"
                value={form.nama_kepala}
                onChange={(e) => setForm({ ...form, nama_kepala: e.target.value })}
                className="mt-1 w-full p-2 border border-slate-300 rounded font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700">NIP Pejabat</label>
              <input
                type="text"
                value={form.nip_kepala}
                onChange={(e) => setForm({ ...form, nip_kepala: e.target.value })}
                className="mt-1 w-full p-2 border border-slate-300 rounded font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Alamat & Kontak Instansi */}
        <div className="space-y-4">
          <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Alamat & Kontak Kop Surat BLSDM
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700">Alamat Lengkap</label>
              <input
                type="text"
                value={form.alamat_instansi}
                onChange={(e) => setForm({ ...form, alamat_instansi: e.target.value })}
                className="mt-1 w-full p-2 border border-slate-300 rounded"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700">Nomor Telepon / Faks</label>
              <input
                type="text"
                value={form.telepon_instansi}
                onChange={(e) => setForm({ ...form, telepon_instansi: e.target.value })}
                className="mt-1 w-full p-2 border border-slate-300 rounded"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700">Email Kedinasan</label>
              <input
                type="email"
                value={form.email_instansi}
                onChange={(e) => setForm({ ...form, email_instansi: e.target.value })}
                className="mt-1 w-full p-2 border border-slate-300 rounded"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#0B2A4A] hover:bg-[#123B66] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-teal-300" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan Pengaturan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
