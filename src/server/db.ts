import fs from 'fs';
import path from 'path';

// Storage directory & DB file
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'tu_database.json');

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
  kode_klasifikasi: string; // e.g., KP.01.02
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
  struktur: {
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
  tanggal_mulai: string; // YYYY-MM-DD
  tanggal_selesai: string; // YYYY-MM-DD
  jam_mulai: string; // HH:mm
  jam_selesai: string; // HH:mm
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
    ruangan_diminta?: NamaRuangan | string;
    tanggal_diminta?: string;
    tanggal_selesai_diminta?: string;
    jam_diminta?: string;
    jam_selesai_diminta?: string;
    narasumber_diminta?: string;
    ringkasan_permohonan?: string;
    permohonan_tambahan?: string;
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
  nomor_surat_text: string; // B-____/BLSDM.35/KU.01.02/10/2026
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

export interface DatabaseSchema {
  users: User[];
  kategori: KategoriSurat[];
  templates: TemplateSurat[];
  fasilitas: FasilitasBooking[];
  surat_masuk: SuratMasuk[];
  draft_balasan: DraftBalasan[];
  contoh_revisi: ContohRevisi[];
  usulan_pembaruan: UsulanPembaruan[];
  agent_runs: AgentRun[];
  agent_steps: AgentStep[];
  audit_logs: AuditLog[];
  pengaturan: Pengaturan;
}

// Initial Seed Data Factory
export const getInitialData = (): DatabaseSchema => ({
  users: [
    {
      id: 'usr-001',
      nama: 'Siti Nurhaliza, S.AP',
      email: 'nurrahmatullisa31@gmail.com',
      role: 'Staf Tata Usaha',
      aktif: true,
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-002',
      nama: 'Ahmad Fauzi, A.Md',
      email: 'ahmad.fauzi@blsdm.go.id',
      role: 'Staf Tata Usaha',
      aktif: true,
    },
  ],
  kategori: [
    {
      id: 'kat-001',
      nama: 'Permohonan Magang / Praktik Kerja Lapangan',
      kode_klasifikasi: 'KP.01.02',
      template_id: 'tmpl-001',
      deskripsi: 'Balasan persetujuan pelaksanaan magang mahasiswa atau siswa SMK di lingkungan BLSDM.',
      aktif: true,
      created_at: '2026-01-10T08:00:00Z',
    },
    {
      id: 'kat-002',
      nama: 'Permohonan Peminjaman Ruangan & Fasilitas',
      kode_klasifikasi: 'HM.02.01',
      template_id: 'tmpl-002',
      deskripsi: 'Balasan izin penggunaan fasilitas ruangan: Aula, Lab 1, atau Lab 2.',
      aktif: true,
      created_at: '2026-01-10T08:00:00Z',
    },
    {
      id: 'kat-003',
      nama: 'Permohonan Fasilitasi Pelatihan Teknis',
      kode_klasifikasi: 'DL.01.01',
      template_id: 'tmpl-003',
      deskripsi: 'Balasan kesediaan penyelenggaraan pelatihan kompetensi teknis.',
      aktif: true,
      created_at: '2026-01-10T08:00:00Z',
    },
    {
      id: 'kat-004',
      nama: 'Permohonan Narasumber & Pengajar',
      kode_klasifikasi: 'KP.04.01',
      template_id: 'tmpl-004',
      deskripsi: 'Balasan kesediaan pejabat atau widyaiswara menjadi narasumber/pemateri seminar.',
      aktif: true,
      created_at: '2026-01-15T09:00:00Z',
    },
    {
      id: 'kat-005',
      nama: 'Permohonan Kunjungan Lapangan & Studi Banding',
      kode_klasifikasi: 'HM.01.03',
      template_id: 'tmpl-004',
      deskripsi: 'Balasan penerimaan studi tiru instansi lain ke BLSDM.',
      aktif: true,
      created_at: '2026-02-01T10:00:00Z',
    },
  ],
  templates: [
    {
      id: 'tmpl-001',
      nama: 'Template Surat Balasan Magang Mahasiswa (Resmi)',
      tipe: 'balasan_magang',
      versi: 2,
      aktif: true,
      disetujui_oleh: 'Dr. Ir. Bambang Soeprapto, M.M.',
      path_file: '/templates/balasan_magang_v2.docx',
      struktur: {
        ada_kop: true,
        format_nomor: 'B-____/BLSDM.35/KP.01.02/{bulan}/{tahun}',
        paragraf_pembuka: 'Menindaklanjuti surat Saudara Nomor {nomor_surat_asal} tanggal {tanggal_surat_asal} perihal Permohonan Izin Magang/Praktik Kerja Lapangan bagi mahasiswa {instansi_pengirim}, dengan hormat kami sampaikan bahwa Balai Latihan Sumber Daya Manusia (BLSDM) pada prinsipnya menyambut baik dan menyetujui permohonan tersebut.',
        paragraf_isi: 'Pelaksanaan magang disetujui untuk {jumlah_peserta} orang mahasiswa, terhitung mulai tanggal {tanggal_diminta} sampai dengan {tanggal_selesai_diminta}, dan akan ditempatkan pada unit kerja yang relevan.',
        paragraf_penutup: 'Demikian surat persetujuan ini disampaikan untuk dapat dipergunakan sebagaimana mestinya. Atas perhatian dan kerja sama Saudara, kami ucapkan terima kasih.',
        blok_ttd: {
          jabatan: 'Kepala Balai Latihan Sumber Daya Manusia',
          nama: 'Dr. Ir. Bambang Soeprapto, M.M.',
          nip: '19740512 199903 1 002',
        },
      },
      created_at: '2026-01-10T08:00:00Z',
    },
    {
      id: 'tmpl-002',
      nama: 'Template Surat Izin Peminjaman Ruangan (Aula / Lab)',
      tipe: 'balasan_pinjam_tempat',
      versi: 1,
      aktif: true,
      disetujui_oleh: 'Dr. Ir. Bambang Soeprapto, M.M.',
      path_file: '/templates/balasan_pinjam_tempat_v1.docx',
      struktur: {
        ada_kop: true,
        format_nomor: 'B-____/BLSDM.35/HM.02.01/{bulan}/{tahun}',
        paragraf_pembuka: 'Sehubungan dengan surat Saudara Nomor {nomor_surat_asal} tanggal {tanggal_surat_asal} hal Permohonan Peminjaman Fasilitas {ruangan_diminta} untuk kegiatan {nama_kegiatan}, dengan ini kami beritahukan bahwa permohonan tersebut dapat kami setujui.',
        paragraf_isi: 'Penggunaan sarana {ruangan_diminta} disetujui pada hari dan tanggal yang telah disepakati bersama, dengan ketentuan senantiasa menjaga kebersihan, ketertiban, dan keutuhan fasilitas gedung.',
        paragraf_penutup: 'Demikian untuk menjadi maklum dan dapat dipedomani dalam pelaksanaannya. Atas kerja samanya disampaikan terima kasih.',
        blok_ttd: {
          jabatan: 'Kepala Balai Latihan Sumber Daya Manusia',
          nama: 'Dr. Ir. Bambang Soeprapto, M.M.',
          nip: '19740512 199903 1 002',
        },
      },
      created_at: '2026-01-10T08:00:00Z',
    },
    {
      id: 'tmpl-003',
      nama: 'Template Surat Balasan Fasilitasi Pelatihan',
      tipe: 'balasan_pelatihan',
      versi: 1,
      aktif: true,
      disetujui_oleh: 'Dr. Ir. Bambang Soeprapto, M.M.',
      path_file: '/templates/balasan_pelatihan_v1.docx',
      struktur: {
        ada_kop: true,
        format_nomor: 'B-____/BLSDM.35/DL.01.01/{bulan}/{tahun}',
        paragraf_pembuka: 'Merujuk surat Saudara Nomor {nomor_surat_asal} perihal permohonan kerja sama pelatihan kompetensi aparatur, kami informasikan bahwa BLSDM siap memfasilitasi program dimaksud.',
        paragraf_isi: 'Koordinasi teknis kurikulum dan jadwal pelaksanaan akan dipandu oleh tim penjamin mutu pelatihan BLSDM.',
        paragraf_penutup: 'Demikian penyampaian kami. Atas sinergi dan kepercayaan yang diberikan, kami ucapkan terima kasih.',
        blok_ttd: {
          jabatan: 'Kepala Balai Latihan Sumber Daya Manusia',
          nama: 'Dr. Ir. Bambang Soeprapto, M.M.',
          nip: '19740512 199903 1 002',
        },
      },
      created_at: '2026-01-12T08:00:00Z',
    },
    {
      id: 'tmpl-004',
      nama: 'Template Dasar Surat Dinas Resmi BLSDM (Standar)',
      tipe: 'template_dasar',
      versi: 1,
      aktif: true,
      disetujui_oleh: 'Dr. Ir. Bambang Soeprapto, M.M.',
      path_file: '/templates/kop_dasar_blsdm.docx',
      struktur: {
        ada_kop: true,
        format_nomor: 'B-____/BLSDM.35/{kode}/{bulan}/{tahun}',
        paragraf_pembuka: 'Memperhatikan surat Saudara Nomor {nomor_surat_asal} tanggal {tanggal_surat_asal} perihal {perihal}, dengan hormat kami sampaikan hal-hal sebagai berikut.',
        paragraf_isi: 'Balai Latihan Sumber Daya Manusia (BLSDM) menyetujui permohonan tersebut dengan ketentuan yang berlaku di lingkungan instansi kami.',
        paragraf_penutup: 'Demikian surat ini kami sampaikan. Atas perhatian dan kerja sama Saudara, kami ucapkan terima kasih.',
        blok_ttd: {
          jabatan: 'Kepala Balai Latihan Sumber Daya Manusia',
          nama: 'Dr. Ir. Bambang Soeprapto, M.M.',
          nip: '19740512 199903 1 002',
        },
      },
      created_at: '2026-01-05T08:00:00Z',
    },
  ],
  fasilitas: [
    {
      id: 'fas-001',
      ruangan: 'Aula',
      nama_kegiatan: 'Pelatihan Kepemimpinan Pengawas (PKP) Angkatan IV',
      peminjam: 'Bidang Diklat Kepemimpinan',
      tanggal_mulai: '2026-05-18',
      tanggal_selesai: '2026-05-22',
      jam_mulai: '08:00',
      jam_selesai: '16:00',
      jumlah_peserta: 40,
      status: 'disetujui',
    },
    {
      id: 'fas-002',
      ruangan: 'Lab 1',
      nama_kegiatan: 'Bimtek Pengelolaan Arsip Dinamis & Srikandi',
      peminjam: 'Subbag Kepegawaian & TU',
      tanggal_mulai: '2026-06-02',
      tanggal_selesai: '2026-06-04',
      jam_mulai: '08:30',
      jam_selesai: '15:30',
      jumlah_peserta: 25,
      status: 'disetujui',
    },
    {
      id: 'fas-003',
      ruangan: 'Lab 2',
      nama_kegiatan: 'Simulasi Uji Kompetensi Pemrograman Web ASN',
      peminjam: 'Seksi Teknologi Informasi',
      tanggal_mulai: '2026-06-08',
      tanggal_selesai: '2026-06-09',
      jam_mulai: '09:00',
      jam_selesai: '14:00',
      jumlah_peserta: 20,
      status: 'disetujui',
    },
  ],
  surat_masuk: [
    {
      id: 'sm-2026-001',
      nomor_agenda: 'AGD/2026/05/012',
      file_name: 'Surat_Permohonan_Magang_UNY_FIP.pdf',
      file_type: 'pdf',
      kategori_id: 'kat-001',
      pengirim: 'Prof. Dr. Sujarwo, M.Pd (Wakil Dekan I)',
      instansi_pengirim: 'Fakultas Ilmu Pendidikan Universitas Negeri Yogyakarta',
      perihal: 'Permohonan Praktik Kerja Lapangan / Magang Mahasiswa',
      nomor_surat_asal: '412/UN34.11/PKL/V/2026',
      tanggal_surat_asal: '2026-05-02',
      tanggal_diterima: '2026-05-04',
      status: 'draft',
      teks_hasil_baca: 'KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI\nUNIVERSITAS NEGERI YOGYAKARTA\nFAKULTAS ILMU PENDIDIKAN DAN PSIKOLOGI\n\nNomor : 412/UN34.11/PKL/V/2026\nHal : Permohonan Izin Magang / PKL Mahasiswa\n\nKepada Yth.\nKepala Balai Latihan Sumber Daya Manusia (BLSDM)\ndi Yogyakarta\n\nDengan hormat,\nDalam rangka pelaksanaan kurikulum Merdeka Belajar Kampus Merdeka (MBKM), kami mengajukan permohonan izin magang bagi 3 (tiga) orang mahasiswa Program Studi Manajemen Pendidikan untuk melaksanakan magang di lingkungan BLSDM terhitung mulai tanggal 1 Juli 2026 s.d. 31 Agustus 2026.\n\nAdapun nama-nama mahasiswa terlampir pada proposal kegiatan.\nBesar harapan kami Bapak Kepala berkenan memberikan izin.\n\nDemikian kami sampaikan, atas kerja samanya diucapkan terima kasih.',
      data_ekstraksi: {
        nama_pemohon: 'Prof. Dr. Sujarwo, M.Pd',
        jabatan_pemohon: 'Wakil Dekan I Bidang Akademik',
        jumlah_peserta: 3,
        nama_kegiatan: 'Magang / PKL MBKM Mahasiswa Manajemen Pendidikan',
        tanggal_diminta: '2026-07-01',
        tanggal_selesai_diminta: '2026-08-31',
        ringkasan_permohonan: 'Permohonan izin magang 3 mahasiswa UNY FIP selama 2 bulan (Juli-Agustus 2026).',
      },
      diupload_oleh: 'usr-001',
      created_at: '2026-05-04T09:15:00Z',
    },
    {
      id: 'sm-2026-002',
      nomor_agenda: 'AGD/2026/05/015',
      file_name: 'Surat_BKD_DIY_Pinjam_Aula.pdf',
      file_type: 'pdf',
      kategori_id: 'kat-002',
      pengirim: 'Drs. Amin Purwanto, M.Si (Sekretaris Badan)',
      instansi_pengirim: 'Badan Kepegawaian Daerah (BKD) DIY',
      perihal: 'Permohonan Peminjaman Aula BLSDM',
      nomor_surat_asal: '005/1892/BKD/V/2026',
      tanggal_surat_asal: '2026-05-08',
      tanggal_diterima: '2026-05-09',
      status: 'bentrok',
      teks_hasil_baca: 'PEMERINTAH DAERAH DAERAH ISTIMEWA YOGYAKARTA\nBADAN KEPEGAWAIAN DAERAH\n\nNomor : 005/1892/BKD/V/2026\nHal : Permohonan Peminjaman Aula BLSDM\n\nKepada Yth.\nKepala Balai Latihan Sumber Daya Manusia (BLSDM)\ndi Yogyakarta\n\nDengan hormat,\nSehubungan dengan rencana pelaksanaan Uji Kompetensi Teknis ASN Pemda DIY, kami bermaksud meminjam fasilitas Aula BLSDM pada:\nHari/Tanggal : Rabu, 20 Mei 2026\nWaktu : Pukul 08.00 s.d. 15.00 WIB\nPeserta : 120 orang ASN\n\nMohon kiranya permohonan peminjaman ruangan ini dapat difasilitasi.\nDemikian disampaikan, atas perhatiannya kami haturkan terima kasih.',
      data_ekstraksi: {
        nama_pemohon: 'Drs. Amin Purwanto, M.Si',
        jabatan_pemohon: 'Sekretaris Badan Kepegawaian Daerah',
        jumlah_peserta: 120,
        nama_kegiatan: 'Uji Kompetensi Teknis ASN Pemda DIY',
        ruangan_diminta: 'Aula',
        tanggal_diminta: '2026-05-20',
        jam_diminta: '08:00',
        jam_selesai_diminta: '15:00',
        ringkasan_permohonan: 'Peminjaman Aula untuk 120 orang pada 20 Mei 2026 jam 08.00-15.00 WIB.',
      },
      diupload_oleh: 'usr-001',
      created_at: '2026-05-09T10:30:00Z',
    },
    {
      id: 'sm-2026-003',
      nomor_agenda: 'AGD/2026/05/019',
      file_name: 'Surat_Permohonan_Narasumber_Diskominfo.pdf',
      file_type: 'pdf',
      kategori_id: 'kat-004',
      pengirim: 'Hari Sutanto, S.Kom, M.Eng (Kepala Dinas)',
      instansi_pengirim: 'Dinas Komunikasi dan Informatika DIY',
      perihal: 'Permohonan Narasumber Workshop Digital Governance & AI',
      nomor_surat_asal: '090/441/Kominfo/V/2026',
      tanggal_surat_asal: '2026-05-11',
      tanggal_diterima: '2026-05-12',
      status: 'diterima',
      teks_hasil_baca: 'PEMERINTAH DAERAH DAERAH ISTIMEWA YOGYAKARTA\nDINAS KOMUNIKASI DAN INFORMATIKA\n\nNomor : 090/441/Kominfo/V/2026\nHal : Permohonan Narasumber Workshop Digital Governance & AI\n\nKepada Yth.\nKepala Balai Latihan Sumber Daya Manusia (BLSDM)\ndi Yogyakarta\n\nDengan hormat,\nDalam rangka peningkatan literasi transformasi digital dan etika kecerdasan artifisial bagi ASN pengelola kepegawaian, kami bermaksud mengundang Widyaiswara Ahli Madya BLSDM untuk hadir sebagai Narasumber pada:\nHari/Tanggal : Selasa, 26 Mei 2026\nWaktu : 09.00 - 12.00 WIB\nTempat : Grand Ballroom Hotel Santika Premiere Yogyakarta\nTema : "Implementasi AI Agent dalam Efisiensi Tata Kelola Administrasi Pemerintahan"\n\nDemikian permohonan ini kami sampaikan, atas kerja sama dan perkenan Saudara kami ucapkan terima kasih.',
      data_ekstraksi: {
        nama_pemohon: 'Hari Sutanto, S.Kom, M.Eng',
        jabatan_pemohon: 'Kepala Dinas Kominfo',
        nama_kegiatan: 'Workshop Digital Governance & AI',
        tanggal_diminta: '2026-05-26',
        jam_diminta: '09:00',
        jam_selesai_diminta: '12:00',
        narasumber_diminta: 'Widyaiswara Ahli Madya BLSDM',
        ringkasan_permohonan: 'Permohonan Widyaiswara BLSDM sebagai narasumber workshop AI pada 26 Mei 2026.',
      },
      diupload_oleh: 'usr-001',
      created_at: '2026-05-12T08:20:00Z',
    },
  ],
  draft_balasan: [
    {
      id: 'drf-001',
      surat_masuk_id: 'sm-2026-001',
      kategori_id: 'kat-001',
      template_id: 'tmpl-001',
      nomor_surat_text: 'B-____/BLSDM.35/KP.01.02/05/2026',
      kode_klasifikasi: 'KP.01.02',
      bulan: '05',
      tahun: '2026',
      sifat: 'Biasa',
      lampiran: '-',
      perihal: 'Persetujuan Izin Magang / Praktik Kerja Lapangan',
      tujuan_surat: 'Wakil Dekan I Bidang Akademik\nFakultas Ilmu Pendidikan dan Psikologi\nUniversitas Negeri Yogyakarta',
      lokasi_tujuan: 'Yogyakarta',
      teks_surat: {
        pembuka: 'Menindaklanjuti surat Saudara Nomor 412/UN34.11/PKL/V/2026 tanggal 2 Mei 2026 perihal Permohonan Izin Magang / Praktik Kerja Lapangan bagi mahasiswa Universitas Negeri Yogyakarta, dengan hormat kami sampaikan bahwa Balai Latihan Sumber Daya Manusia (BLSDM) pada prinsipnya menyambut baik dan menyetujui permohonan tersebut.',
        isi: 'Pelaksanaan magang disetujui untuk 3 (tiga) orang mahasiswa Program Studi Manajemen Pendidikan, terhitung mulai tanggal 1 Juli 2026 sampai dengan 31 Agustus 2026, dan akan ditempatkan pada Subbagian Tata Usaha serta Seksi Penyelenggaraan Pelatihan BLSDM.',
        rincian_kegiatan: [
          { label: 'Jumlah Mahasiswa', value: '3 (tiga) orang' },
          { label: 'Periode Pelaksanaan', value: '1 Juli 2026 s.d. 31 Agustus 2026' },
          { label: 'Jam Kerja Magang', value: 'Senin - Jumat, Pukul 07.30 - 16.00 WIB' },
          { label: 'Ketentuan Pakaian', value: 'Kemeja putih dan celana/rok hitam formal bersepatu' },
          { label: 'Penempatan Unit', value: 'Subbagian Tata Usaha & Seksi Pelatihan' },
        ],
        penutup: 'Selama menjalani kegiatan magang, mahasiswa diwajibkan mematuhi seluruh tata tertib kedinasan yang berlaku di lingkungan Balai Latihan Sumber Daya Manusia. Demikian surat persetujuan ini disampaikan untuk dapat dipergunakan sebagaimana mestinya. Atas perhatian dan kerja sama Saudara, kami ucapkan terima kasih.',
      },
      catatan_keputusan: [
        {
          topik: 'Penempatan Unit Kerja',
          keputusan: 'Ditempatkan di Subbagian Tata Usaha dan Seksi Penyelenggaraan Pelatihan.',
          alasan: 'Surat asal memohon bidang manajemen pendidikan; unit TU dan Pelatihan paling relevan untuk kompetensi administrasi kedinasan.',
        },
        {
          topik: 'Jam Kerja & Aturan Busana',
          keputusan: 'Jam kerja 07.30-16.00 WIB, seragam kemeja putih bawahan hitam formal.',
          alasan: 'Tidak tertulis di surat masuk; agent menerapkan standar operasional kerja magang BLSDM.',
        },
      ],
      hasil_periksa_mandiri: {
        status_pemeriksaan: 'lolos',
        putaran_ke: 2,
        temuan: [
          { aspek: 'Kesesuaian Identitas Pemohon', status: 'sesuai', catatan: 'Nama Dekan dan nomor surat asal 412/UN34.11/PKL/V/2026 100% cocok.' },
          { aspek: 'Format Nomor Surat Dinas', status: 'sesuai', catatan: 'Format B-____/BLSDM.35/KP.01.02/05/2026 valid, kode klasifikasi KP.01.02 sesuai kategori magang.' },
          { aspek: 'Kop Surat & Tempat TTD', status: 'sesuai', catatan: 'Kop dinas lengkap dan TTD Kepala BLSDM terpasang benar.' },
          { aspek: 'Pengecekan Bentrok Fasilitas', status: 'sesuai', catatan: 'Fasilitas kerja dan kapasitas mencukupi pada periode Juli-Agustus 2026.' },
        ],
      },
      jumlah_putaran: 2,
      dibuat_oleh: 'TU Smart Agent (Gemini 2.5 Flash)',
      created_at: '2026-05-04T09:18:22Z',
      updated_at: '2026-05-04T09:18:22Z',
    },
  ],
  contoh_revisi: [
    {
      id: 'rev-001',
      draft_id: 'drf-001',
      kategori_id: 'kat-001',
      teks_sebelum: 'kami menyambut baik dan menerima permohonan tersebut.',
      teks_sesudah: 'kami sampaikan bahwa Balai Latihan Sumber Daya Manusia (BLSDM) pada prinsipnya menyambut baik dan menyetujui permohonan tersebut.',
      alasan_perubahan: 'Penyesuaian gaya bahasa resmi khas instansi BLSDM sesuai pedoman tata naskah dinas.',
      created_at: '2026-05-04T10:00:00Z',
    },
  ],
  usulan_pembaruan: [
    {
      id: 'usl-001',
      kategori_id: 'kat-001',
      jenis: 'gaya_bahasa',
      judul: 'Penyelarasan Kalimat Pembuka Persetujuan Magang',
      isi_usulan: 'Gunakan frasa baku "pada prinsipnya menyambut baik dan menyetujui permohonan tersebut" menggantikan kata "menerima permohonan".',
      sumber_revisi_count: 3,
      status: 'menunggu',
      created_at: '2026-05-04T10:05:00Z',
    },
  ],
  agent_runs: [
    {
      id: 'run-001',
      surat_masuk_id: 'sm-2026-001',
      status: 'sukses',
      jumlah_langkah: 7,
      batas_langkah: 15,
      mulai: '2026-05-04T09:16:10Z',
      selesai: '2026-05-04T09:18:22Z',
      ringkasan_keputusan: 'Surat magang UNY diproses aman, tidak bentrok, draf selesai dan diverifikasi mandiri 2 putaran.',
    },
  ],
  agent_steps: [
    {
      id: 'stp-001',
      run_id: 'run-001',
      urutan: 1,
      tool: 'baca_surat',
      pemikiran: 'Membaca berkas surat masuk Surat_Permohonan_Magang_UNY_FIP.pdf dan mengekstrak teks serta metadata surat asal.',
      input: { file_name: 'Surat_Permohonan_Magang_UNY_FIP.pdf' },
      output: { status: 'sukses', teks_length: 642, pengirim: 'Prof. Dr. Sujarwo, M.Pd' },
      created_at: '2026-05-04T09:16:15Z',
    },
  ],
  audit_logs: [
    {
      id: 'aud-001',
      user_id: 'usr-001',
      user_name: 'Siti Nurhaliza, S.AP',
      aksi: 'UPLOAD_SURAT',
      entitas: 'surat_masuk',
      entitas_id: 'sm-2026-001',
      detail: { file: 'Surat_Permohonan_Magang_UNY_FIP.pdf', instansi: 'UNY' },
      created_at: '2026-05-04T09:15:00Z',
    },
  ],
  pengaturan: {
    kode_unit: 'BLSDM.35',
    nama_instansi: 'Balai Latihan Sumber Daya Manusia (BLSDM)',
    nama_kepala: 'Dr. Ir. Bambang Soeprapto, M.M.',
    nip_kepala: '19740512 199903 1 002',
    jabatan_penandatangan: 'Kepala Balai Latihan Sumber Daya Manusia',
    alamat_instansi: 'Jl. Kenari No. 56, Muja Muju, Kec. Umbulharjo, Kota Yogyakarta, D.I. Yogyakarta 55165',
    telepon_instansi: '(0274) 548902 / Faks: (0274) 548903',
    email_instansi: 'tatausaha@blsdm.go.id',
    website_instansi: 'blsdm.jogjaprov.go.id',
    kota_surat: 'Yogyakarta',
    batas_langkah: 15,
    batas_putaran_periksa: 3,
  },
});

// Database Singleton Helper
class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.data = this.load();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): DatabaseSchema {
    const seed = getInitialData();
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        const merged: DatabaseSchema = {
          ...seed,
          ...parsed,
          fasilitas: Array.isArray(parsed.fasilitas) && parsed.fasilitas.length > 0 ? parsed.fasilitas : seed.fasilitas,
        };
        this.save(merged);
        return merged;
      }
    } catch (e) {
      console.error('Error loading DB file, fallback to seed:', e);
    }
    this.save(seed);
    return seed;
  }

  public save(newData?: DatabaseSchema) {
    if (newData) this.data = newData;
    this.ensureDirectory();
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  public get<K extends keyof DatabaseSchema>(table: K): DatabaseSchema[K] {
    if (!this.data[table]) {
      const seed = getInitialData();
      this.data[table] = seed[table];
      this.save();
    }
    return this.data[table];
  }

  public set<K extends keyof DatabaseSchema>(table: K, value: DatabaseSchema[K]) {
    this.data[table] = value;
    this.save();
  }

  public appendAuditLog(userId: string, userName: string, aksi: string, entitas: string, entitasId: string, detail: Record<string, unknown>) {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: userId,
      user_name: userName,
      aksi,
      entitas,
      entitas_id: entitasId,
      detail,
      created_at: new Date().toISOString(),
    };
    this.data.audit_logs.unshift(newLog);
    this.save();
    return newLog;
  }

  public resetToSeed() {
    this.data = getInitialData();
    this.save();
    return this.data;
  }
}

export const db = new Database();
