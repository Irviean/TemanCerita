// ============================================
// TemanCerita – Main JavaScript
// ============================================

// --- Navbar scroll effect ---
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
}

// --- Filter tags (konselor page) ---
document.querySelectorAll('.filter-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
    tag.classList.add('active');

    const filter = tag.dataset.filter;
    document.querySelectorAll('.konselor-card').forEach(card => {
      if (filter === 'semua') {
        card.style.display = '';
      } else {
        const tags = card.dataset.tags || '';
        card.style.display = tags.includes(filter) ? '' : 'none';
      }
    });
  });
});

// --- Search input (konselor page) ---
const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.konselor-card').forEach(card => {
      const name = card.querySelector('.konselor-name')?.textContent.toLowerCase() || '';
      const tags = card.querySelector('.konselor-tags')?.textContent.toLowerCase() || '';
      card.style.display = (!q || name.includes(q) || tags.includes(q)) ? '' : 'none';
    });
  });
}

// --- Smooth fade-in on scroll ---
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.article-card, .feature-card, .konselor-card, .nilai-card, .kontak-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

// ============================================
// API INTEGRATION NOTES (untuk tim backend)
// ============================================
//
// Semua endpoint berikut perlu diintegrasikan:
//
// AUTH
//   POST /api/auth/login           → login mahasiswa/konselor
//   POST /api/auth/logout          → logout
//   GET  /api/auth/me              → get current user
//
// KONSELOR
//   GET  /api/konselor             → list semua konselor (filter: spesialisasi, status)
//   GET  /api/konselor/:id         → detail konselor
//   GET  /api/konselor/:id/ulasan  → ulasan mahasiswa untuk konselor
//
// BOOKING
//   GET  /api/booking/available?konselor_id=&tanggal= → slot waktu tersedia
//   POST /api/booking              → buat booking baru
//   GET  /api/booking/:id          → detail booking
//
// SESI
//   GET  /api/sesi?user_id=        → riwayat sesi mahasiswa
//   GET  /api/sesi/aktif           → sesi yang sedang berlangsung
//   POST /api/sesi/:id/mulai       → konselor mulai sesi
//   POST /api/sesi/:id/selesai     → akhiri sesi, simpan catatan
//
// CHAT
//   GET  /api/chat/:sesi_id        → history pesan sesi
//   POST /api/chat/:sesi_id/pesan  → kirim pesan (atau gunakan WebSocket)
//   WebSocket: ws://api/chat/:sesi_id
//
// JADWAL KONSELOR
//   GET  /api/jadwal/:konselor_id  → ketersediaan konselor
//   PUT  /api/jadwal/:konselor_id  → update ketersediaan
//
// PROFIL
//   GET  /api/profil               → profil user yang login
//   PUT  /api/profil               → update profil
//   POST /api/profil/foto          → upload foto profil
//
// NOTIFIKASI
//   GET  /api/notifikasi           → list notifikasi
//   PUT  /api/notifikasi/:id/baca  → tandai sudah dibaca
//
// ARTIKEL
//   GET  /api/artikel              → list artikel
//   POST /api/artikel              → buat artikel baru (konselor)
//   PUT  /api/artikel/:id          → edit artikel
//
// LAPORAN
//   GET  /api/laporan/:sesi_id     → download PDF laporan sesi
//
// ============================================
