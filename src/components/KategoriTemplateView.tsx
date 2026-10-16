import React, { useState } from 'react';
import {
  Bookmark,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  UploadCloud,
  X,
  FileCode,
  ShieldCheck,
  Download,
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { KategoriSurat, TemplateSurat } from '../types';

interface KategoriTemplateViewProps {
  kategoriList: KategoriSurat[];
  templates: TemplateSurat[];
  onRefresh: () => void;
}

export const KategoriTemplateView: React.FC<KategoriTemplateViewProps> = ({
  kategoriList,
  templates,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'kategori' | 'templates'>('kategori');

  // Kategori Modals
  const [showAddKatModal, setShowAddKatModal] = useState(false);
  const [viewingKat, setViewingKat] = useState<KategoriSurat | null>(null);
  const [editingKat, setEditingKat] = useState<KategoriSurat | null>(null);

  // Kategori Form state
  const [katNama, setKatNama] = useState('');
  const [katKode, setKatKode] = useState('');
  const [katDeskripsi, setKatDeskripsi] = useState('');
  const [katTemplateId, setKatTemplateId] = useState('');
  const [savingKat, setSavingKat] = useState(false);

  // Template Modals
  const [showAddTmplModal, setShowAddTmplModal] = useState(false);
  const [viewingTmpl, setViewingTmpl] = useState<TemplateSurat | null>(null);
  const [editingTmpl, setEditingTmpl] = useState<TemplateSurat | null>(null);

  // Template Form state
  const [tmplNama, setTmplNama] = useState('');
  const [tmplTipe, setTmplTipe] = useState<TemplateSurat['tipe']>('template_dasar');
  const [tmplPembuka, setTmplPembuka] = useState('');
  const [tmplIsi, setTmplIsi] = useState('');
  const [tmplPenutup, setTmplPenutup] = useState('');
  const [tmplPenandatangan, setTmplPenandatangan] = useState('Dr. Ir. Bambang Soeprapto, M.M.');
  const [tmplJabatan, setTmplJabatan] = useState('Kepala Balai Latihan Sumber Daya Manusia');
  const [tmplNip, setTmplNip] = useState('19740512 199903 1 002');
  const [tmplFile, setTmplFile] = useState<File | null>(null);
  const [readingFile, setReadingFile] = useState(false);
  const [savingTmpl, setSavingTmpl] = useState(false);

  // -------------------------------------------------------------
  // KATEGORI ACTIONS
  // -------------------------------------------------------------
  const openAddKat = () => {
    setEditingKat(null);
    setKatNama('');
    setKatKode('');
    setKatDeskripsi('');
    setKatTemplateId(templates[0]?.id || '');
    setShowAddKatModal(true);
  };

  const openEditKat = (kat: KategoriSurat) => {
    setEditingKat(kat);
    setKatNama(kat.nama);
    setKatKode(kat.kode_klasifikasi);
    setKatDeskripsi(kat.deskripsi || '');
    setKatTemplateId(kat.template_id || '');
    setShowAddKatModal(true);
  };

  const handleSaveKat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!katNama || !katKode) return;
    setSavingKat(true);

    try {
      const url = editingKat ? `/api/kategori/${editingKat.id}` : '/api/kategori';
      const method = editingKat ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: katNama,
          kode_klasifikasi: katKode,
          deskripsi: katDeskripsi,
          template_id: katTemplateId || undefined,
        }),
      });

      if (!res.ok) throw new Error('Gagal menyimpan kategori');
      setShowAddKatModal(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan kategori.');
    } finally {
      setSavingKat(false);
    }
  };

  const handleDeleteKat = async (kat: KategoriSurat) => {
    if (!confirm(`Hapus kategori "${kat.nama}" (${kat.kode_klasifikasi})?`)) return;
    try {
      const res = await fetch(`/api/kategori/${kat.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus kategori');
    }
  };

  // -------------------------------------------------------------
  // TEMPLATE ACTIONS
  // -------------------------------------------------------------
  const openAddTmpl = () => {
    setEditingTmpl(null);
    setTmplNama('');
    setTmplTipe('template_dasar');
    setTmplPembuka('Menindaklanjuti surat Saudara Nomor {nomor_surat_asal} tanggal {tanggal_surat_asal} perihal {perihal}, dengan hormat kami sampaikan hal-hal sebagai berikut.');
    setTmplIsi('Balai Latihan Sumber Daya Manusia (BLSDM) pada prinsipnya menyetujui permohonan tersebut dengan ketentuan yang berlaku.');
    setTmplPenutup('Demikian surat persetujuan ini disampaikan untuk dapat dipedomani. Atas kerja samanya, diucapkan terima kasih.');
    setTmplPenandatangan('Dr. Ir. Bambang Soeprapto, M.M.');
    setTmplJabatan('Kepala Balai Latihan Sumber Daya Manusia');
    setTmplNip('19740512 199903 1 002');
    setTmplFile(null);
    setShowAddTmplModal(true);
  };

  const openEditTmpl = (tmpl: TemplateSurat) => {
    setEditingTmpl(tmpl);
    setTmplNama(tmpl.nama);
    setTmplTipe(tmpl.tipe);
    setTmplPembuka(tmpl.struktur?.paragraf_pembuka || '');
    setTmplIsi(tmpl.struktur?.paragraf_isi || '');
    setTmplPenutup(tmpl.struktur?.paragraf_penutup || '');
    setTmplPenandatangan(tmpl.struktur?.blok_ttd?.nama || tmpl.disetujui_oleh || 'Dr. Ir. Bambang Soeprapto, M.M.');
    setTmplJabatan(tmpl.struktur?.blok_ttd?.jabatan || 'Kepala Balai Latihan Sumber Daya Manusia');
    setTmplNip(tmpl.struktur?.blok_ttd?.nip || '19740512 199903 1 002');
    setTmplFile(null);
    setShowAddTmplModal(true);
  };

  // Handle Word docx upload to extract template paragraphs
  const handleTemplateWordChosen = async (file: File) => {
    setTmplFile(file);
    if (!tmplNama) {
      setTmplNama(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }

    setReadingFile(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/surat-masuk/parse-preview', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const extracted = data.parsed?.teks || '';
        if (extracted.length > 30) {
          const parts = extracted.split('\n\n').map((p: string) => p.trim()).filter(Boolean);
          if (parts.length >= 3) {
            setTmplPembuka(parts[0]);
            setTmplIsi(parts[1]);
            setTmplPenutup(parts[2]);
          } else if (parts.length >= 1) {
            setTmplIsi(parts[0]);
          }
        }
      }
    } catch (e) {
      console.warn('Gagal membaca dokumen Word secara instan:', e);
    } finally {
      setReadingFile(false);
    }
  };

  const handleSaveTmpl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmplNama) return;
    setSavingTmpl(true);

    try {
      const formData = new FormData();
      formData.append('nama', tmplNama);
      formData.append('tipe', tmplTipe);
      formData.append('paragraf_pembuka', tmplPembuka);
      formData.append('paragraf_isi', tmplIsi);
      formData.append('paragraf_penutup', tmplPenutup);
      formData.append('nama_penandatangan', tmplPenandatangan);
      formData.append('jabatan_penandatangan', tmplJabatan);
      formData.append('nip_penandatangan', tmplNip);

      if (tmplFile) {
        formData.append('word_file', tmplFile);
      }

      const url = editingTmpl ? `/api/templates/${editingTmpl.id}` : '/api/templates';
      const method = editingTmpl ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (!res.ok) throw new Error('Gagal menyimpan template');
      setShowAddTmplModal(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan template.');
    } finally {
      setSavingTmpl(false);
    }
  };

  const handleDeleteTmpl = async (tmpl: TemplateSurat) => {
    if (!confirm(`Hapus template "${tmpl.nama}"? Arsip template tidak pernah ditimpa.`)) return;
    try {
      const res = await fetch(`/api/templates/${tmpl.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus template');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Kategori Surat & Template Word (.docx)
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Pengelolaan lengkap kategori klasifikasi arsip dinas dan template surat Word. Staf dapat melihat, mengedit, menghapus, serta membuat baru (termasuk upload file Word .docx).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'kategori' ? (
            <button
              onClick={openAddKat}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#0B2A4A] hover:bg-[#123B66] text-white text-xs font-bold transition-colors shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kategori Baru</span>
            </button>
          ) : (
            <button
              onClick={openAddTmpl}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-colors shadow-xs shrink-0"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Buat & Upload Template Word</span>
            </button>
          )}
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('kategori')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'kategori'
              ? 'border-[#0B2A4A] text-[#0B2A4A]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Daftar Kategori Surat Dinas ({kategoriList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'templates'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Template Word Resmi BLSDM ({templates.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: KATEGORI SURAT */}
      {/* ========================================================= */}
      {activeTab === 'kategori' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#0B2A4A]" />
                <h3 className="font-bold text-sm text-slate-900">
                  Kategori Buatan Staf & Kode Klasifikasi Penomoran Otomatis (FR05)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {kategoriList.length} Kategori Aktif
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Nama Kategori</th>
                    <th className="py-3 px-4">Kode Klasifikasi</th>
                    <th className="py-3 px-4">Template Terkait</th>
                    <th className="py-3 px-4">Deskripsi Peruntukan</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Aksi (View / Edit / Delete)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {kategoriList.map((kat) => {
                    const tmpl = templates.find((t) => t.id === kat.template_id);
                    return (
                      <tr key={kat.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-bold text-slate-900">{kat.nama}</td>
                        <td className="py-3 px-4 font-mono font-bold text-teal-800">
                          {kat.kode_klasifikasi}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {tmpl ? tmpl.nama : 'Template Dasar BLSDM'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs">{kat.deskripsi}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            AKTIF
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setViewingKat(kat)}
                              className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                              title="Lihat Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditKat(kat)}
                              className="p-1 rounded text-teal-700 hover:text-teal-900 hover:bg-teal-50"
                              title="Edit Kategori"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteKat(kat)}
                              className="p-1 rounded text-red-600 hover:text-red-800 hover:bg-red-50"
                              title="Hapus Kategori"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: TEMPLATE SURAT WORD (.DOCX) */}
      {/* ========================================================= */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-shadow space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                      Versi {tmpl.versi}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{tmpl.nama}</h4>
                  </div>
                  <span className="text-emerald-700 flex items-center gap-1 text-xs font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Aktif</span>
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-mono text-[11px] text-slate-500 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-teal-600" />
                    <span>{tmpl.path_file}</span>
                  </p>
                  <p className="line-clamp-2 text-slate-600 pt-1">
                    <strong>Paragraf Pembuka:</strong> {tmpl.struktur?.paragraf_pembuka || '-'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    <span>Penandatangan: {tmpl.struktur?.blok_ttd?.nama || tmpl.disetujui_oleh}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewingTmpl(tmpl)}
                      className="px-2.5 py-1 rounded text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat</span>
                    </button>
                    <button
                      onClick={() => openEditTmpl(tmpl)}
                      className="px-2.5 py-1 rounded text-xs font-medium bg-teal-50 hover:bg-teal-100 text-teal-800 flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteTmpl(tmpl)}
                      className="p-1 rounded text-red-600 hover:bg-red-50"
                      title="Hapus Template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT KATEGORI */}
      {/* ========================================================= */}
      {showAddKatModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                {editingKat ? 'Edit Kategori Surat Dinas' : 'Tambah Kategori Surat Baru'}
              </h3>
              <button
                onClick={() => setShowAddKatModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKat} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Kategori</label>
                <input
                  type="text"
                  required
                  value={katNama}
                  onChange={(e) => setKatNama(e.target.value)}
                  placeholder="Misal: Permohonan Uji Kompetensi Kejuruan"
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Kode Klasifikasi Arsip (untuk nomor surat B-____/BLSDM.35/...)
                </label>
                <input
                  type="text"
                  required
                  value={katKode}
                  onChange={(e) => setKatKode(e.target.value)}
                  placeholder="Misal: DL.02.01"
                  className="w-full p-2 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-teal-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Template Word Terkait</label>
                <select
                  value={katTemplateId}
                  onChange={(e) => setKatTemplateId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white"
                >
                  <option value="">-- Gunakan Template Dasar Resmi BLSDM --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nama} (Versi {t.versi})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Deskripsi Peruntukan</label>
                <textarea
                  rows={3}
                  value={katDeskripsi}
                  onChange={(e) => setKatDeskripsi(e.target.value)}
                  placeholder="Keterangan jenis permohonan yang ditangani oleh kategori ini..."
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddKatModal(false)}
                  className="px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingKat}
                  className="px-4 py-2 rounded bg-[#0B2A4A] hover:bg-[#123B66] text-white font-bold shadow-xs"
                >
                  {savingKat ? 'Menyimpan...' : editingKat ? 'Perbarui Kategori' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: VIEW KATEGORI DETAIL */}
      {/* ========================================================= */}
      {viewingKat && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#0B2A4A]" />
                <span>Detail Kategori Surat Dinas</span>
              </h3>
              <button onClick={() => setViewingKat(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Nama Kategori:</span>
                <p className="font-bold text-sm text-slate-900">{viewingKat.nama}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-teal-50 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-teal-800">Kode Klasifikasi:</span>
                  <p className="font-mono font-bold text-teal-900 text-sm mt-0.5">
                    {viewingKat.kode_klasifikasi}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Status:</span>
                  <p className="font-bold text-emerald-700 text-sm mt-0.5">Aktif Digunakan</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Template Word Terhubung:</span>
                <p className="font-semibold text-slate-800">
                  {templates.find((t) => t.id === viewingKat.template_id)?.nama || 'Template Dasar Resmi BLSDM'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Deskripsi:</span>
                <p className="text-slate-700 leading-relaxed">{viewingKat.deskripsi || '-'}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  const kat = viewingKat;
                  setViewingKat(null);
                  openEditKat(kat);
                }}
                className="px-3 py-1.5 rounded bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Kategori Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT TEMPLATE WITH WORD (.DOCX) UPLOAD */}
      {/* ========================================================= */}
      {showAddTmplModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-700" />
                <span>
                  {editingTmpl ? 'Edit Template Word (.docx)' : 'Buat Template Baru & Upload File Word (.docx)'}
                </span>
              </h3>
              <button
                onClick={() => setShowAddTmplModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTmpl} className="space-y-4 text-xs">
              {/* Upload File Word (.docx) Area */}
              <div className="border-2 border-dashed border-teal-300 bg-teal-50/40 rounded-xl p-4 text-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center">
                    {readingFile ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">
                      {tmplFile ? tmplFile.name : 'Upload Berkas Template Word (.docx / .doc)'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {readingFile
                        ? 'Sedang membaca teks & struktur paragraf template...'
                        : 'Agent akan mengekstrak struktur paragraf secara otomatis'}
                    </p>
                  </div>
                  <label className="mt-1 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold cursor-pointer text-xs shadow-xs">
                    <span>{tmplFile ? 'Ganti File Word' : 'Pilih File Word (.docx)'}</span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".docx,.doc"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleTemplateWordChosen(e.target.files[0]);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nama Template</label>
                  <input
                    type="text"
                    required
                    value={tmplNama}
                    onChange={(e) => setTmplNama(e.target.value)}
                    placeholder="Misal: Template Surat Izin Pinjam Aula"
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tipe / Klasifikasi Template</label>
                  <select
                    value={tmplTipe}
                    onChange={(e) => setTmplTipe(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="template_dasar">Template Dasar Standar</option>
                    <option value="balasan_magang">Balasan Magang / PKL</option>
                    <option value="balasan_pinjam_tempat">Izin Peminjaman Ruangan</option>
                    <option value="balasan_pelatihan">Fasilitasi Pelatihan</option>
                  </select>
                </div>
              </div>

              {/* Paragraf Pembuka */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Paragraf Pembuka Surat (Gunakan penanda {'{nomor_surat_asal}'}, {'{tanggal_surat_asal}'}, {'{perihal}'})
                </label>
                <textarea
                  rows={2}
                  required
                  value={tmplPembuka}
                  onChange={(e) => setTmplPembuka(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 leading-relaxed font-sans"
                />
              </div>

              {/* Paragraf Isi */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Paragraf Isi / Persetujuan
                </label>
                <textarea
                  rows={3}
                  required
                  value={tmplIsi}
                  onChange={(e) => setTmplIsi(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 leading-relaxed font-sans"
                />
              </div>

              {/* Paragraf Penutup */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Paragraf Penutup Surat
                </label>
                <textarea
                  rows={2}
                  required
                  value={tmplPenutup}
                  onChange={(e) => setTmplPenutup(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 leading-relaxed font-sans"
                />
              </div>

              {/* Signatory Block */}
              <div className="p-3 bg-slate-50 rounded-lg space-y-2 border border-slate-200">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                  Blok Tanda Tangan Pejabat (Kop & TTD Resmi)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-600 text-[11px]">Jabatan</label>
                    <input
                      type="text"
                      value={tmplJabatan}
                      onChange={(e) => setTmplJabatan(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-[11px]">Nama Pejabat</label>
                    <input
                      type="text"
                      value={tmplPenandatangan}
                      onChange={(e) => setTmplPenandatangan(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-[11px]">NIP</label>
                    <input
                      type="text"
                      value={tmplNip}
                      onChange={(e) => setTmplNip(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTmplModal(false)}
                  className="px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingTmpl || readingFile}
                  className="px-4 py-2 rounded bg-teal-700 hover:bg-teal-800 text-white font-bold shadow-xs"
                >
                  {savingTmpl ? 'Menyimpan Template...' : editingTmpl ? 'Perbarui Template' : 'Simpan & Daftarkan Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: VIEW TEMPLATE DETAIL */}
      {/* ========================================================= */}
      {viewingTmpl && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-700" />
                <span>Detail Template Word Resmi: {viewingTmpl.nama}</span>
              </h3>
              <button onClick={() => setViewingTmpl(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Versi Dokumen:</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">Versi {viewingTmpl.versi}</p>
                </div>
                <div className="p-3 bg-teal-50 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-teal-800">Tipe Surat:</span>
                  <p className="font-semibold text-teal-950 text-xs mt-0.5">{viewingTmpl.tipe}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Kop Resmi:</span>
                  <p className="font-bold text-emerald-700 text-xs mt-0.5">Kop BLSDM Aktif</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Paragraf Pembuka:</span>
                <p className="text-slate-800 leading-relaxed italic bg-white p-2.5 rounded border border-slate-200">
                  "{viewingTmpl.struktur?.paragraf_pembuka || '-'}"
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Paragraf Isi:</span>
                <p className="text-slate-800 leading-relaxed italic bg-white p-2.5 rounded border border-slate-200">
                  "{viewingTmpl.struktur?.paragraf_isi || '-'}"
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Paragraf Penutup:</span>
                <p className="text-slate-800 leading-relaxed italic bg-white p-2.5 rounded border border-slate-200">
                  "{viewingTmpl.struktur?.paragraf_penutup || '-'}"
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Penandatangan Resmi:</span>
                <p className="font-bold text-slate-900">
                  {viewingTmpl.struktur?.blok_ttd?.nama || viewingTmpl.disetujui_oleh}
                </p>
                <p className="text-slate-600 text-[11px]">
                  {viewingTmpl.struktur?.blok_ttd?.jabatan || 'Kepala Balai Latihan Sumber Daya Manusia'} · NIP {viewingTmpl.struktur?.blok_ttd?.nip || '-'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  const tmpl = viewingTmpl;
                  setViewingTmpl(null);
                  openEditTmpl(tmpl);
                }}
                className="px-3 py-1.5 rounded bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Template Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
