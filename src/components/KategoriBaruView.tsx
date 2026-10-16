import React, { useState } from 'react';
import { Sparkles, Save, CheckCircle, ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import { SuratMasuk, KategoriSurat } from '../types';

interface KategoriBaruViewProps {
  suratList: SuratMasuk[];
  kategoriList: KategoriSurat[];
  onRefresh: () => void;
  onNavigateToDraft: (draftId: string) => void;
}

export const KategoriBaruView: React.FC<KategoriBaruViewProps> = ({
  suratList,
  kategoriList,
  onRefresh,
  onNavigateToDraft,
}) => {
  const [namaKategoriBaru, setNamaKategoriBaru] = useState('Permohonan Narasumber & Fasilitator Khusus');
  const [kodeKlasifikasi, setKodeKlasifikasi] = useState('KP.04.02');
  const [deskripsi, setDeskripsi] = useState('Persetujuan kesediaan pejabat fungsional atau widyaiswara untuk menjadi narasumber/pengajar eksternal.');
  const [paragrafPembuka, setParagrafPembuka] = useState(
    'Memperhatikan surat Saudara perihal permohonan narasumber, dengan hormat kami sampaikan bahwa Balai Latihan Sumber Daya Manusia (BLSDM) menyambut baik dan menugaskan pejabat terkait.'
  );
  const [paragrafIsi, setParagrafIsi] = useState(
    'Pelaksanaan kegiatan disetujui sesuai waktu yang disepakati bersama, dengan materi yang diselaraskan pada kurikulum kedinasan.'
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSimpanSebagaiTemplateBaru = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/kategori', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: namaKategoriBaru,
          kode_klasifikasi: kodeKlasifikasi,
          deskripsi,
          template_id: 'tmpl-004',
        }),
      });

      if (!res.ok) throw new Error('Gagal menyimpan kategori baru');
      setSaved(true);
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan template baru');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-teal-600" />
          <span>Penyusunan Surat Kategori Baru (FR06)</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Jika surat masuk memuat permohonan yang belum memiliki kategori khusus, agent menyusun surat dinas berbahasa baku menggunakan <strong>Template Dasar BLSDM</strong> (kop, blok nomor, dan tempat TTD resmi).
        </p>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="font-bold">Kategori & Template Baru Berhasil Disimpan!</p>
              <p className="text-emerald-700">Kode klasifikasi {kodeKlasifikasi} kini aktif dan dapat dipakai agent secara otomatis.</p>
            </div>
          </div>
          <button
            onClick={() => setSaved(false)}
            className="px-3 py-1 bg-emerald-700 text-white rounded text-xs font-semibold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Composition Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-5">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0B2A4A]" />
            <h3 className="font-bold text-sm text-slate-900">
              Formulir Penetapan Kategori & Template Baru
            </h3>
          </div>
          <span className="text-[11px] font-mono bg-teal-50 text-teal-800 px-2 py-0.5 rounded">
            Template Dasar: Kop Resmi BLSDM
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700">Nama Kategori Baru Diusulkan</label>
            <input
              type="text"
              value={namaKategoriBaru}
              onChange={(e) => setNamaKategoriBaru(e.target.value)}
              className="mt-1 w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700">Kode Klasifikasi Arsip (Ditetapkan Staf)</label>
            <input
              type="text"
              value={kodeKlasifikasi}
              onChange={(e) => setKodeKlasifikasi(e.target.value)}
              className="mt-1 w-full p-2 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700">Deskripsi / Ruang Lingkup</label>
            <input
              type="text"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="mt-1 w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700">Redaksi Pembuka Standar</label>
            <textarea
              rows={3}
              value={paragrafPembuka}
              onChange={(e) => setParagrafPembuka(e.target.value)}
              className="mt-1 w-full p-2 border border-slate-300 rounded text-xs font-mono"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700">Redaksi Isi Standar</label>
            <textarea
              rows={3}
              value={paragrafIsi}
              onChange={(e) => setParagrafIsi(e.target.value)}
              className="mt-1 w-full p-2 border border-slate-300 rounded text-xs font-mono"
            />
          </div>
        </div>

        {/* Guardrail Note */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
          <p className="text-[11px] leading-relaxed">
            Template baru hanya tersimpan ke sistem setelah diverifikasi dan disetujui staf. Agent tidak memiliki wewenang menimpa template yang ada.
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSimpanSebagaiTemplateBaru}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-[#0B2A4A] hover:bg-[#123B66] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4 text-teal-300" />
            <span>{saving ? 'Menyimpan...' : 'Setujui & Simpan Sebagai Template Baru'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
