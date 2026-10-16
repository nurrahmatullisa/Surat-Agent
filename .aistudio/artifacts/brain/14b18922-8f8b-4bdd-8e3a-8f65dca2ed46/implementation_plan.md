# TU Smart Agent – Draft Surat Balasan (BLSDM)

Aplikasi web internal cerdas untuk staf Tata Usaha (TU) Balai Latihan Sumber Daya Manusia (BLSDM) yang mengotomasi pembacaan surat masuk, klasifikasi kategori arsip, deteksi bentrok agenda ruangan/narasumber, dan pembuatan draft surat balasan dinas berformat Word (.docx) dengan siklus agentik mandiri (berpikir → panggil tool → verifikasi mandiri → catatan keputusan).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Keputusan dan preferensi arsitektur yang telah dikonfirmasi:
> - **AI Model Engine**: Menggunakan Gemini 2.5 Flash (`gemini-2.5-flash` / `gemini-3.8-flash`) dengan dukungan multimodal vision untuk membaca scan/foto/PDF, serta tool calling terstruktur via `@google/genai` di server.
> - **Strategi Penyimpanan**: SQLite embedded database dengan inisialisasi schema otomatis, tabel relasional lengkap, indeks performa, dan proteksi append-only log.
> - **Data Seed & Sampel Bawaan**: Langsung memuat sampel realistis surat dinas Indonesia:
>   1. Permohonan Magang Mahasiswa UNY (langsung terproses aman).
>   2. Permohonan Pinjam Aula 20 Mei 2026 (memicu deteksi bentrok agenda Pelatihan Kepemimpinan, blokir draft penolakan, usul alternatif).
>   3. Permohonan Narasumber AI Workshop (kategori baru tanpa template, penyusunan ke template dasar kop dinas).
>   4. Surat multi-permintaan (magang + pinjam lab komputer) yang dipecah otomatis.
> - **Guardrail Absolut di Kode**: Tidak pernah membuat surat penolakan; nomor urut `B-____` selalu dikosongkan untuk diisi manual staf; batas langkah maksimal 15 dan maksimal 3 putaran perbaikan mandiri.

---

## 1. Overview & Core Concept

### Masalah yang Diselesaikan
Staf TU setiap hari membaca puluhan surat permohonan dinas, mencari kode klasifikasi arsip, memeriksa agenda bentrok secara manual, lalu mengetik surat balasan dari nol. Proses ini rentan salah kode surat, bentrok jadwal terlewat, dan memakan waktu.

### Solusi & Batasan Otonomi
TU Smart Agent bertindak sebagai asisten cerdas yang:
1. Membaca berkas surat (teks atau scan/foto OCR multimodal).
2. Memecah surat bila memuat lebih dari satu permohonan.
3. Mencocokkan dengan kategori dan memeriksa bentrok register agenda 100%.
4. Menyusun draft .docx utuh dengan kop resmi, format rapi, dan nomor dinas `B-____/BLSDM.35/[kode]/[bulan]/[tahun]`.
5. Melakukan pemeriksaan mandiri (maks. 3 putaran) sebelum diserahkan ke staf.
6. Mencatat hal yang diputuskan sendiri pada **Panel Catatan Keputusan** (bukan di dalam surat).
7. Belajar dari revisi staf dengan hanya mengusulkan pembaruan gaya/template (memerlukan persetujuan staf).
8. **Out of Scope (Di Luar Sistem)**: Tanda tangan pimpinan (dilakukan di Srikandi), pengiriman surat dinas, surat penolakan, dan pengisian nomor urut surat.

---

## 2. User Experience & Visual Design

### Palet Warna & Identitas Visual Instansi Pemerintah
- **Biru Tua Primer (`#0B2A4A`)**: Memberikan wibawa resmi dinas pada Sidebar, Navbar Header, dan Tombol Tindakan Utama. Hover di `#123B66`.
- **Kanvas Bersih & Kartu (`#FFFFFF` & `#F4F7FA`)**: Latar belakang abu-abu sangat muda dengan permukaan kartu putih bersih bergaris batas halus 1px (`border-slate-200`).
- **Teal Aksen (`#14B8A6` & Gelap `#0F766E`)**: Aksen modern untuk status aktif, tab navigasi interaktif, fokus input, dan tombol aksi sekunder.
- **Warna Status Berbasis Teks & Ikon (WCAG AA)**:
  - Hijau (`#16A34A`): Selesai / Disetujui / Draft Siap
  - Biru (`#2563EB`): Sedang Diproses / Membaca Berkas
  - Amber (`#D97706`): Perlu Konfirmasi / Pengingat Surat Tertunda / Usulan Baru
  - Merah Lembut (`#DC2626`): Bentrok Agenda Terdeteksi

### Tipografi & Disiplin Tampilan
- **Display & UI**: `Plus Jakarta Sans` untuk judul dan kontrol antarmuka dinas.
- **Angka & Kode Surat**: Tabular figures monospace (`JetBrains Mono` / `font-mono tabular-nums`) untuk nomor surat `B-____/BLSDM.35/...`, tanggal, jam agenda, dan penghitung langkah.
- **Zero-Pill Discipline**: Metadata disajikan bersih dengan pemisah tipografis (`·`, `/`). Tab dan filter menggunakan segmented buttons fungsional.

### Peta Layar & Alur Pengguna (11 Tampilan Terintegrasi)
```
┌────────────────────────────────────────────────────────────────────────┐
│                        TOP BAR & BREADCRUMBS                           │
│  TU Smart Agent · BLSDM                [Notifikasi Pengingat (2)] [TU] │
├──────────────┬─────────────────────────────────────────────────────────┤
│ SIDEBAR      │ MAIN CONTENT VIEWPORT                                   │
│              │                                                         │
│ • Dashboard  │ [Statistik Surat] [Peringatan Bentrok] [Usulan Baru]    │
│ • Upload     │ ─────────────────────────────────────────────────────── │
│ • Surat Masuk│ • Daftar Pengingat Proaktif:                            │
│ • Draft Surat│   - 2 surat belum dibalas > 3 hari                      │
│ • Cek Bentrok│   - Konflik potensi Aula Utama antara Surat #102 & #105 │
│ • Register   │ ─────────────────────────────────────────────────────── │
│ • Kategori   │ • Tabel Surat Masuk Terbaru (Filter Status & Kategori)  │
│ • Template   │ • Alur Cepat: Upload Surat Masuk (PDF/Word/Foto Scan)   │
│ • Belajar AI │                                                         │
│ • Audit Log  │                                                         │
│ • Pengaturan │                                                         │
└──────────────┴─────────────────────────────────────────────────────────┘
```

1. **Dashboard & Pengingat Proaktif**: Ringkasan surat baru, bentrok aktif, draft menunggu review, peringatan surat berebut ruang atau belum dibalas > 3 hari, serta usulan pembaruan gaya.
2. **Upload Surat Masuk**: Area drag-and-drop berkas, indikator tipe berkas (PDF, DOCX, PNG/JPG), tombol kamera untuk ponsel, dan bar progres membaca/OCR.
3. **Detail Surat & Ekstraksi**: Penampil teks hasil ekstraksi/OCR, pemilihan kategori otomatis/manual, data entitas yang dapat diedit (pengirim, perihal, nomor asal, tanggal, ruangan, peserta), serta linimasa langkah agent.
4. **Hasil Cek Bentrok & Rekomendasi Jadwal**: Kartu peringatan merah jelas yang merinci kegiatan yang berbenturan di register agenda, 3 usulan jadwal/ruangan alternatif yang kosong, dan tombol "Pilih Alternatif & Proses Ulang". Pembuatan draft diblokir total hingga alternatif dipilih.
5. **Pratinjau & Editor Draft Balasan**:
   - Bagian Kiri/Atas: Dokumen visual surat balasan lengkap dengan Kop BLSDM, blok nomor dengan kotak jelas untuk isian manual `B-____`, isi baku surat, dan blok tempat tanda tangan. Tombol **Unduh .docx**.
   - Bagian Kanan/Bawah: **PANEL CATATAN KEPUTUSAN** yang menampilkan hal-hal yang diputuskan mandiri oleh agent (misalnya pakaian pelatihan, kelengkapan berkas, batasan jam penggunaan), serta hasil log pemeriksaan mandiri (3 putaran).
6. **Surat Kategori Baru**: Tampilan penyusunan surat dinas untuk permohonan yang belum ada kategorinya, rekomendasi nama kategori & kode klasifikasi arsip, serta opsi "Simpan sebagai Template Baru".
7. **Pengelolaan Kategori & Template**: Tabel kategori dinas, kode klasifikasi (misal `KP.01.01`, `HM.02.01`, `PL.02.03`), riwayat versi template Word, serta tombol upload template pengganti (arsip soft-delete, tidak menimpa file lama).
8. **Register Agenda**: Kalender interaktif dan tabel agenda ruangan, kegiatan pelatihan, serta narasumber.
9. **Pembelajaran Agent**: Daftar perbedaan (diff) antara draft awal vs revisi staf, serta daftar usulan pembaruan gaya bahasa yang dapat disetujui atau ditolak oleh staf.
10. **Audit Log & Linimasa Langkah**: Riwayat eksekusi agent yang append-only untuk transparansi penuh.
11. **Pengaturan Sistem**: Kode unit organisasi (default: `BLSDM.35`), batas langkah (default: 15), batas putaran perbaikan (default: 3), dan pengaturan retensi data.

---

## 3. Key Product Decisions & Guardrails

### Guardrail 1: Larangan Pembuatan Surat Penolakan
- *Keputusan*: Jika terdeteksi bentrok ruangan/jadwal, sistem mengembalikan status `bentrok` dan **menolak memanggil tool `isi_template`**. Sistem hanya menampilkan kartu rekomendasi alternatif.
- *Alasan*: Kebijakan instansi BLSDM mengutamakan koordinasi penjadwalan ulang daripada surat penolakan resmi.

### Guardrail 2: Penomoran Surat Deterministik
- *Format*: `B-____/BLSDM.35/[KODE_KLASIFIKASI]/[BULAN_ROMAWI_ATAU_ANGKA]/[TAHUN]`
- *Implementasi*: Dihitung 100% oleh fungsi TypeScript di server:
  - `B-____` selalu dibiarkan garis bawah kosong untuk staf TU.
  - `BLSDM.35` diambil dari tabel `pengaturan`.
  - `[KODE_KLASIFIKASI]` ditarik dari relasi kategori terdaftar.
  - Bulan (2 digit / romawi) dan Tahun diambil dari waktu pembuatan server.

### Guardrail 3: Tidak Pernah Mengisi Placeholder Kosong di Surat
- *Keputusan*: Seluruh paragraf dan rincian acara pada surat terisi tuntas. Apabila surat asal tidak merinci ketentuan teknis (misal pakaian, jam istirahat), agent menetapkan nilai default standar dinas BLSDM dan mencatatnya ke dalam **Panel Catatan Keputusan**.

### Guardrail 4: Loop Agent Berbatas Langkah & Putaran
- *Batas Langkah*: Maksimal 15 langkah per siklus surat.
- *Pemeriksaan Mandiri*: Maksimal 3 putaran perbaikan. Agent membandingkan kesesuaian nama pengirim, tanggal, nomor surat asal, format nomor, dan bentrok.
- *Log Append-Only*: Setiap langkah disimpan di tabel `agent_step` tanpa opsi edit/hapus.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                  │
│   Next.js / React 19 Client · Tailwind CSS · Lucide Icons · Motion     │
│   - Responsive Layout (Sidebar Desktop / Drawer Mobile)                │
│   - Document Viewer & Word .docx Exporter                              │
│   - Real-time Agent Step Stepper & Conflict Banner                     │
│   - Decision Notes Panel & Self-Reflection Diff View                   │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ JSON API Requests / Polling
┌────────────────────────────────────▼───────────────────────────────────┐
│                           BACKEND & API                                │
│   Express / Next.js Server Routing (`/api/*`)                          │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                     AGENT CORE ENGINE                          │   │
│   │  • Agent Loop (Think → Tool Call → Observation → Decide)       │   │
│   │  • Step Counter Guard (Max 15) & Round Limit (Max 3)           │   │
│   │  • Deterministic Guardrails (Anti-Rejection, Numbering Engine) │   │
│   │  • Gemini 2.5 Flash Multimodal Document Reader                 │   │
│   └────────────────────────────────┬───────────────────────────────┘   │
│                                    │                                   │
│   ┌────────────────────────────────┴───────────────────────────────┐   │
│   │                        AGENT TOOLS                             │   │
│   │  1. `baca_surat` (PDF / DOCX / Image OCR)                      │   │
│   │  2. `klasifikasi_surat` (Match Category / Propose New)         │   │
│   │  3. `cek_bentrok` (Query Agenda Room & Time Ranges)            │   │
│   │  4. `usul_tanggal` (Search Available Slots in Agenda)          │   │
│   │  5. `isi_template` (Inject Data into Official DOCX Layout)     │   │
│   │  6. `buat_surat_baru` (Generate Formal Draft on Base Layout)   │   │
│   │  7. `periksa_draft` (Self-Audit Against Source Letter)         │   │
│   │  8. `cari_balasan_mirip` (Retrieve Historical Phrasing)        │   │
│   │  9. `simpan_contoh_revisi` (Capture Staff Modifications)       │   │
│   │ 10. `daftar_surat_tertunda` (Identify Stale & Colliding Items) │   │
│   └────────────────────────────────┬───────────────────────────────┘   │
│                                    │                                   │
│   ┌────────────────────────────────▼───────────────────────────────┐   │
│   │                LOCAL SQLITE STORAGE & ASSETS                   │   │
│   │  • `surat_masuk`, `kategori`, `template`, `agenda`, `draft`   │   │
│   │  • `agent_run`, `agent_step` (Append-Only), `pengaturan`       │   │
│   │  • /templates, /surat_masuk, /output_drafts                    │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Skema Database Entitas Utama (SQLite)
1. `users`: Autentikasi staf TU (nama, email, role, sandi hash).
2. `surat_masuk`: Berkas surat, pengirim, perihal, nomor asal, tanggal asal, status (`diterima`, `diproses`, `bentrok`, `draft`, `selesai`), teks OCR, data ekstraksi JSON, `parent_surat_id` (untuk pemecahan multi-permintaan).
3. `kategori`: Nama kategori, kode klasifikasi arsip dinas, `template_id`.
4. `template`: Nama template, tipe, versi, status aktif, tanggal dibuat.
5. `agenda`: Jadwal peminjaman ruangan, pelatihan, narasumber (tanggal mulai/selesai, jam mulai/selesai, nama kegiatan).
6. `draft_balasan`: ID surat masuk, teks nomor surat, path .docx, isi draft teks, `catatan_keputusan` JSON, `hasil_periksa_mandiri` JSON, putaran perbaikan.
7. `contoh_revisi`: Teks sebelum diedit vs setelah diedit staf untuk pembelajaran gaya bahasa.
8. `usulan_pembaruan`: Usulan perbaikan gaya/template hasil belajar yang menunggu persetujuan staf.
9. `agent_run` & `agent_step`: Log eksekusi urutan tool, parameter input, dan hasil pengamatan (append-only).
10. `pengaturan`: Konfigurasi kode instansi (`BLSDM.35`), batas langkah (15), batas putaran (3).

---

## 5. Verification Checklist & Testing Strategy

- [ ] **Unit Test Penomoran Surat**: Verifikasi format `B-____/BLSDM.35/KU.01.02/10/2026` dengan `B-____` selalu kosong dan kode ditarik dari kategori.
- [ ] **Guardrail Bentrok 100%**: Uji peminjaman Aula Utama pada 20 Mei 2026 yang bentrok dengan jadwal pelatihan. Pastikan:
  - Sistem mendeteksi bentrok 100%.
  - Tidak ada draft penolakan yang dibuat.
  - Menghasilkan 3 alternatif waktu/ruangan.
- [ ] **Uji Ekstraksi Multimodal**: Uji surat PDF teks murni, scan gambar JPG, dan DOCX.
- [ ] **Uji Pemecahan Multi-Permintaan**: Surat permohonan magang sekaligus pinjam ruangan dipecah menjadi 2 entitas turunan.
- [ ] **Pemeriksaan Mandiri (Max 3 Putaran)**: Verifikasi siklus auto-koreksi ketika nama atau tanggal surat asal sengaja tidak cocok di draft awal.
- [ ] **Panel Catatan Keputusan**: Verifikasi bahwa rincian yang tidak tercantum di surat masuk muncul rapi di panel terpisah, bukan dalam bentuk teks placeholder di surat.
- [ ] **Responsivitas Layar Ponsel & Desktop**: Uji navigasi di layar ponsel (< 640px) dan desktop (1440px) dengan target sentuh ≥ 44px.
