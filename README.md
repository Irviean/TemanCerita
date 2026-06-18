# 🌿 TemanCerita – Ruang Aman Mahasiswa

![Status Proyek](https://img.shields.io/badge/Status-Development-emerald?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Web_Frontend-3d6b67?style=for-the-badge)
![Kampus](https://img.shields.io/badge/Polimedia-Jakarta-blue?style=for-the-badge)

**TemanCerita** adalah platform bimbingan konseling sebaya (*peer counseling*) berbasis web yang dirancang khusus untuk mahasiswa Politeknik Negeri Media Kreatif (Polimedia). Platform ini menjadi ruang aman (*safe space*) digital untuk membantu mahasiswa mengatasi stres akademik, kecemasan, maupun masalah personal secara anonim atau tatap muka.

Proyek ini terintegrasi sebagai bagian dari ekosistem **RICE Asesmen** (Layanan Kesehatan Mental & Layanan Konseling Polimedia 2026).

---

## ✨ Fitur Utama

### 👥 Sisi Mahasiswa
* **Konseling Fleksibel:** Pilihan mode konseling secara **Online Video/Chat** maupun **Offline (Tatap Muka)** di Gedung E Polimedia.
* **Sistem Booking Adaptif:** Kalender interaktif untuk memilih tanggal, slot waktu yang tersedia, dan memilih konselor sebaya yang relevan.
* **Ruang Tunggu (*Waiting Room*):** Dilengkapi dengan fitur hitung mundur (*countdown timer*) presisi sebelum sesi dimulai dan integrasi peta lokasi untuk sesi *offline*.
* **Konseling Anonim:** Opsi menjaga privasi identitas mahasiswa secara penuh demi kenyamanan bercerita.
* **Eksplorasi Artikel:** Akses artikel kesehatan mental yang dikurasi langsung oleh para konselor.

### 💼 Sisi Konselor (Dashboard & Manajemen)
* **Bento Grid Dashboard:** Antarmuka modern untuk memantau performa bulanan, jumlah sesi terlaksana, dan rating kepuasan.
* **Statistik Interaktif (Chart.js):** Visualisasi data tingkat kepuasan berkala dan grafik performa konselor dengan tampilan minimalis.
* **Manajemen Jadwal & Riwayat Sesi:** Atur slot ketersediaan waktu aktif/non-aktif mingguan serta kelola rekam medis/catatan konseling mahasiswa.
* **Sistem Persetujuan Sesi:** Terima atau tolak permintaan *booking* masuk dari mahasiswa secara *real-time*.
* **Penerbitan Artikel:** Pembuatan konten edukatif menggunakan editor teks bawaan dengan fitur *auto-save*.

---

## 🎨 Desain & Estetika

Aplikasi ini mengusung konsep **High-End Minimalist Monochrome & Glassmorphism** dengan palet warna alam yang menenangkan:
* **Primary Teal:** `#3d6b67` (Mencerminkan ketenangan dan ruang tumbuh)
* **Background Soft:** `#F4F5F0` (Nyaman di mata untuk durasi penggunaan yang lama)
* **Typography:** Menggunakan kombinasi font modern *Plus Jakarta Sans* untuk keterbacaan tinggi dan *DM Serif Display* untuk aksen tajuk (*headings*) yang elegan.

---

## 📂 Struktur Repositori

```text
├── assets/                  # Aset gambar, ikon, dan poster (misal: image_6d1391.png)
├── css/
│   └── styles.css           # Global stylesheet & variabel CSS bento grid
├── js/
│   ├── main.js              # Efek scroll, filter tag, pencarian, & routing API mockup
│   ├── chart-kepuasan.js    # Konfigurasi Chart.js tingkat kepuasan (index.html)
│   └── chart-performa.js    # Konfigurasi Chart.js performa konselor (konselor.html)
│
├── 📑 Halaman Mahasiswa:
│   ├── index.html           # Beranda utama & statistik kepuasan
│   ├── konselor.html        # Daftar konselor sebaya & filter keahlian
│   ├── detail-konselor.html # Profil mendalam konselor & testimoni
│   ├── booking.html         # Sistem pemilihan jadwal & mode konseling
│   ├── waiting-room.html    # Ruang tunggu sesi online (dengan countdown)
│   ├── waiting-room-offline.html # Ruang tunggu sesi tatap muka & petunjuk lokasi
│   ├── room-chat.html       # Antarmuka ruang obrolan konseling (simulasi bot)
│   ├── more-artikel.html    # Daftar artikel edukasi kesehatan mental
│   └── Login.html           # Gerbang masuk mahasiswa & konselor
│
└── 📑 Halaman Konselor (Dashboard):
    ├── Register.html        # Form pendaftaran konselor baru RICE Asesmen
    ├── dashboard-konselor.html # Beranda manajemen konselor
    ├── jadwal-konselor.html # Pengaturan slot waktu aktif mingguan
    ├── riwayat-konselor.html # Arsip dokumen konseling & unduh laporan PDF
    ├── buat-artikel.html    # Rich-text editor pembuat artikel (+ auto-save)
    ├── detail-mahasiswa-booking.html # Halaman persetujuan reservasi masuk
    ├── detail-mahasiswa.html # Detail data rekam medis sesi aktif (Online)
    ├── detail-mahasiswa-offline.html # Detail instruksi persiapan ruang (Offline)
    ├── detail-mahasiswa-anon.html    # Mode rekam medis terenkripsi (Anonim)
    ├── room-chat-konselor.html # Ruang chat konselor + template respon cepat
    └── profil-konselor.html # Ringkasan performa individu & edit berkas
