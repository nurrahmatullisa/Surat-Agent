export interface User {
  id: string;
  nama: string;
  email: string;
  role: string;
  aktif: boolean;
  avatar_url?: string;
}

export interface KategoriSurat {
  id: string;
  nama: string;
  kode_klasifikasi: string;
  template_id?: string;
  deskripsi: string;
  aktif: boolean;
  created_at: string;
}

export interface TemplateSurat {
  id: string;
  nama: string;
  tipe: 'balasan_magang' | 'balasan_pelatihan' | 'balasan_pinjam_tempat' | 'template_dasar';
  versi: number;
  aktif: boolean;
  disetujui_oleh: string;
  path_file: string;
  struktur?: {
    ada_kop: boolean;
    format_nomor: string;
    paragraf_pembuka: string;
    paragraf_isi: string;
    paragraf_penutup: string;
    blok_ttd: {
      jabatan: string;
      nama: string;
      nip: string;
    };
  };
  created_at: string;
}

export type NamaRuangan = 'Aula' | 'Lab 1' | 'Lab 2';

export interface FasilitasBooking {
  id: string;
  ruangan: NamaRuangan;
  nama_kegiatan: string;
  peminjam: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  jam_mulai: string;
  jam_selesai: string;
  jumlah_peserta?: number;
  status: 'disetujui' | 'berlangsung' | 'selesai';
}

export interface SuratMasuk {
  id: string;
  nomor_agenda: string;
  file_name: string;
  file_type: 'pdf' | 'docx' | 'image';
  kategori_id?: string;
  pengirim: string;
  instansi_pengirim: string;
  perihal: string;
  nomor_surat_asal: string;
  tanggal_surat_asal: string;
  tanggal_diterima: string;
  status: 'diterima' | 'diproses' | 'bentrok' | 'draft' | 'selesai';
  teks_hasil_baca: string;
  data_ekstraksi: {
    nama_pemohon?: string;
    jabatan_pemohon?: string;
    jumlah_peserta?: number;
    nama_kegiatan?: string;
    ruangan_diminta?: string;
    tanggal_diminta?: string;
    tanggal_selesai_diminta?: string;
    jam_diminta?: string;
    jam_selesai_diminta?: string;
    narasumber_diminta?: string;
    ringkasan_permohonan?: string;
  };
  parent_surat_id?: string;
  diupload_oleh: string;
  created_at: string;
}

export interface DraftBalasan {
  id: string;
  surat_masuk_id: string;
  kategori_id: string;
  template_id: string;
  nomor_surat_text: string;
  kode_klasifikasi: string;
  bulan: string;
  tahun: string;
  sifat: string;
  lampiran: string;
  perihal: string;
  tujuan_surat: string;
  lokasi_tujuan: string;
  teks_surat: {
    pembuka: string;
    isi: string;
    rincian_kegiatan?: Array<{ label: string; value: string }>;
    penutup: string;
  };
  catatan_keputusan: Array<{
    topik: string;
    keputusan: string;
    alasan: string;
  }>;
  hasil_periksa_mandiri: {
    status_pemeriksaan: 'lolos' | 'diperbaiki' | 'peringatan';
    putaran_ke: number;
    temuan: Array<{ aspek: string; status: 'sesuai' | 'koreksi'; catatan: string }>;
  };
  jumlah_putaran: number;
  dibuat_oleh: string;
  created_at: string;
  updated_at: string;
}

export interface ContohRevisi {
  id: string;
  draft_id: string;
  kategori_id: string;
  teks_sebelum: string;
  teks_sesudah: string;
  alasan_perubahan?: string;
  created_at: string;
}

export interface UsulanPembaruan {
  id: string;
  kategori_id: string;
  jenis: 'gaya_bahasa' | 'template';
  judul: string;
  isi_usulan: string;
  sumber_revisi_count: number;
  status: 'menunggu' | 'disetujui' | 'ditolak';
  diputuskan_oleh?: string;
  created_at: string;
}

export interface AgentStep {
  id: string;
  run_id: string;
  urutan: number;
  tool: string;
  pemikiran: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  created_at: string;
}

export interface AgentRun {
  id: string;
  surat_masuk_id: string;
  status: 'berjalan' | 'sukses' | 'bentrok' | 'gagal';
  jumlah_langkah: number;
  batas_langkah: number;
  mulai: string;
  selesai?: string;
  ringkasan_keputusan?: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  aksi: string;
  entitas: string;
  entitas_id: string;
  detail: Record<string, unknown>;
  created_at: string;
}

export interface Pengaturan {
  kode_unit: string;
  nama_instansi: string;
  nama_kepala: string;
  nip_kepala: string;
  jabatan_penandatangan: string;
  alamat_instansi: string;
  telepon_instansi: string;
  email_instansi: string;
  website_instansi: string;
  kota_surat: string;
  batas_langkah: number;
  batas_putaran_periksa: number;
}
