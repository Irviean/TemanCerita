/**
 * charts.js — Semua grafik interaktif untuk index.html
 * TemanCerita / RICE Asesmen
 *
 * STRUKTUR:
 *   1. DATA DEFAULT  — fallback statis jika API belum tersedia
 *   2. CHART FUNCTIONS — satu fungsi per grafik, menerima objek data
 *   3. UTILITY FUNCTIONS — counter animasi, progress bar, dll.
 *   4. INIT — panggil semua fungsi, atau fetch dari API lebih dulu
 *
 * INTEGRASI BACKEND:
 *   Aktifkan blok `fetchDanRender()` di bagian INIT, lalu sesuaikan
 *   endpoint URL-nya. Setiap fungsi grafik menerima satu argumen
 *   objek data sehingga mudah ditukar dengan respons API.
 */

/* =============================================
   1. DATA DEFAULT (fallback / mock)
   ============================================= */

/** Grafik bar kepuasan 6 bulan — why-section */
const DATA_KEPUASAN = {
  labels : ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN'],
  values : [55, 62, 70, 85, 90, 98],
  rating : '4.9',
  persen : 98,
};

/** Stats banner — angka responden & 4 angka kecil */
const DATA_STATS = {
  totalResponden  : 1846,
  ratingLayanan   : 4.8,
  tingkatKepuasan : 98,   // persen
  layananKonselor : 92,   // persen
  pengalamanUser  : 95,   // persen
};

/** Bar horizontal — interaktifitas TemanCerita */
const DATA_INTERAKTIFITAS = [
  { label: 'Sangat Puas (5)', persen: 84 },
  { label: 'Puas (4)',        persen: 28 },
  { label: 'Cukup (3)',       persen: 6  },
  { label: 'Lainnya',         persen: 2, muted: true },
];

/** Bar horizontal — performa pelayanan konselor */
const DATA_PERFORMA = [
  { label: 'Ramah & Sopan',               persen: 92 },
  { label: 'Mendengarkan & Memahami',      persen: 88 },
  { label: 'Solusi Membantu',              persen: 85 },
  { label: 'Kepuasan Layanan',             persen: 95 },
];

/** Bar vertikal — evaluasi antarmuka & tata letak */
const DATA_EVALUASI = [
  { label: 'Desain\nMenarik',         persen: 70, muted: false },
  { label: 'Tampilan\nKeseluruhan',   persen: 55, muted: true  },
  { label: 'Tata Letak\nMenu',        persen: 85, muted: false },
  { label: 'Kemudahan\nNavigasi',     persen: 60, muted: true  },
];

/** Donut — pengalaman penggunaan */
const DATA_DONUT = {
  persen : 95,
  deskripsi: 'Sebagian besar mahasiswa menyatakan pengalaman menggunakan TemanCerita <strong>memuaskan</strong> dan mendorong mereka untuk <strong>merekomendasikan</strong> layanan ini kepada rekan sesama mahasiswa yang membutuhkan dukungan akademik.',
};


/* =============================================
   2. CHART FUNCTIONS
   ============================================= */

/**
 * Chart bar kepuasan (why-section, background hijau).
 * Menggunakan Chart.js.
 * @param {typeof DATA_KEPUASAN} data
 */
function buatChartKepuasan(data) {
  const canvas = document.getElementById('kepuasanChart');
  if (!canvas) { console.warn('[charts] #kepuasanChart tidak ditemukan'); return; }

  // Update label badge & rating
  const elPersen = document.getElementById('kepuasanPersen');
  const elRating = document.getElementById('kepuasanRating');
  if (elPersen) elPersen.textContent = data.persen + '%';
  if (elRating) elRating.textContent = data.rating + '/5';

  const maxVal    = Math.max(...data.values);
  const bgColors  = data.values.map(v => v === maxVal ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)');
  const hovColors = data.values.map(_ => 'rgba(255,255,255,0.55)');

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        data                : data.values,
        backgroundColor     : bgColors,
        hoverBackgroundColor: hovColors,
        borderRadius        : 6,
        borderSkipped       : false,
        barPercentage       : 0.55,
        categoryPercentage  : 0.75,
      }],
    },
    options: {
      responsive         : true,
      maintainAspectRatio: false,
      animation: { duration: 900, easing: 'easeOutQuart' },
      plugins: {
        legend : { display: false },
        tooltip: {
          backgroundColor: 'rgba(255,255,255,0.96)',
          titleColor     : '#1A1A1A',
          bodyColor      : '#2A7E6C',
          borderColor    : 'rgba(0,0,0,0.06)',
          borderWidth    : 1,
          padding        : 10,
          cornerRadius   : 10,
          callbacks: {
            title : i => i[0].label,
            label : i => '  Kepuasan: ' + i.raw + '%',
          },
        },
      },
      scales: {
        x: {
          grid  : { display: false },
          border: { display: false },
          ticks : {
            color      : 'rgba(255,255,255,0.65)',
            font       : { size: 9, weight: '700', family: 'Plus Jakarta Sans, sans-serif' },
            maxRotation: 0,
          },
        },
        y: { display: false, min: 0, max: 120 },
      },
    },
  });
}

/**
 * Counter animasi untuk angka besar (stats banner).
 * Menggunakan IntersectionObserver — hanya jalan sekali saat elemen masuk viewport.
 * @param {typeof DATA_STATS} data
 */
function buatStatsCounter(data) {
  const el = document.getElementById('counterNum');
  if (!el) { console.warn('[charts] #counterNum tidak ditemukan'); return; }

  // Update 4 stat kecil
  const map = {
    statRating   : data.ratingLayanan,
    statKepuasan : data.tingkatKepuasan + '%',
    statLayanan  : data.layananKonselor + '%',
    statPengalaman: data.pengalamanUser + '%',
  };
  Object.entries(map).forEach(([id, val]) => {
    const node = document.getElementById(id);
    if (node) node.textContent = val;
  });

  // Animasi counter utama
  const target = data.totalResponden;
  let started = false;

  function runCounter(startTs) {
    const duration = 1800;
    return function step(ts) {
      const progress = Math.min((ts - startTs) / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString('id-ID');
      if (progress < 1) requestAnimationFrame(step);
    };
  }

  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !started) {
      started = true;
      requestAnimationFrame(ts => requestAnimationFrame(runCounter(ts)));
      observer.disconnect();
    }
  }, { threshold: 0.3 });
  observer.observe(el);
}

/**
 * Bar horizontal — Interaktifitas TemanCerita.
 * Render DOM dinamis ke dalam #cardInteraktifitas.
 * @param {typeof DATA_INTERAKTIFITAS} rows
 */
function buatChartInteraktifitas(rows) {
  const container = document.getElementById('cardInteraktifitas');
  if (!container) { console.warn('[charts] #cardInteraktifitas tidak ditemukan'); return; }

  const html = rows.map(row => `
    <div class="interak-item">
      <div class="interak-label-row">
        <span>${row.label}</span>
        <span style="color:${row.muted ? 'var(--text-light)' : 'var(--primary)'};font-weight:700;">${row.persen}%</span>
      </div>
      <div class="interak-bar-bg">
        <div class="interak-bar-fill"
             style="width:0%; ${row.muted ? 'background:var(--border)' : ''}"
             data-target="${row.persen}"></div>
      </div>
    </div>
  `).join('');

  container.innerHTML = html;

  // Animasi bar masuk viewport
  const fills = container.querySelectorAll('.interak-bar-fill');
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      fills.forEach(fill => {
        fill.style.transition = 'width 1s ease';
        fill.style.width = fill.dataset.target + '%';
      });
      observer.disconnect();
    }
  }, { threshold: 0.2 });
  observer.observe(container);
}

/**
 * Bar horizontal — Performa Pelayanan Konselor.
 * Render DOM dinamis ke dalam #cardPerforma.
 * @param {typeof DATA_PERFORMA} rows
 */
function buatChartPerforma(rows) {
  const container = document.getElementById('cardPerforma');
  if (!container) { console.warn('[charts] #cardPerforma tidak ditemukan'); return; }

  const html = rows.map(row => `
    <div class="performa-row">
      <div class="performa-name">${row.label}</div>
      <div class="performa-bar-bg">
        <div class="performa-bar-fill" style="width:0%" data-target="${row.persen}"></div>
      </div>
    </div>
  `).join('');

  container.innerHTML = html;

  const fills = container.querySelectorAll('.performa-bar-fill');
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      fills.forEach(fill => {
        fill.style.transition = 'width 1s ease';
        fill.style.width = fill.dataset.target + '%';
      });
      observer.disconnect();
    }
  }, { threshold: 0.2 });
  observer.observe(container);
}

/**
 * Bar vertikal — Evaluasi Antarmuka & Tata Letak.
 * Menggunakan Chart.js di canvas #evalChart.
 * @param {typeof DATA_EVALUASI} cols
 */
function buatChartEvaluasi(cols) {
  const canvas = document.getElementById('evalChart');
  if (!canvas) { console.warn('[charts] #evalChart tidak ditemukan'); return; }

  const labels = cols.map(c => c.label.split('\n'));
  const values = cols.map(c => c.persen);
  const colors = cols.map(c => c.muted ? 'rgba(42,126,108,0.25)' : 'rgba(42,126,108,0.85)');
  const hovColors = cols.map(c => c.muted ? 'rgba(42,126,108,0.40)' : 'rgba(42,126,108,1)');

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data                : values,
        backgroundColor     : colors,
        hoverBackgroundColor: hovColors,
        borderRadius        : 8,
        borderSkipped       : false,
        barPercentage       : 0.6,
        categoryPercentage  : 0.75,
      }],
    },
    options: {
      responsive         : true,
      maintainAspectRatio: false,
      animation: { duration: 900, easing: 'easeOutQuart' },
      plugins: {
        legend : { display: false },
        tooltip: {
          backgroundColor: 'rgba(255,255,255,0.96)',
          titleColor     : '#1A1A1A',
          bodyColor      : '#2A7E6C',
          borderColor    : 'rgba(0,0,0,0.06)',
          borderWidth    : 1,
          padding        : 10,
          cornerRadius   : 10,
          callbacks: {
            title : i => i[0].label,
            label : i => '  Skor: ' + i.raw + '%',
          },
        },
      },
      scales: {
        x: {
          grid  : { display: false },
          border: { display: false },
          ticks : {
            color : '#8A8A8A',
            font  : { size: 10, weight: '600', family: 'Plus Jakarta Sans, sans-serif' },
            maxRotation: 0,
          },
        },
        y: { display: false, min: 0, max: 110 },
      },
    },
  });
}

/**
 * Donut chart — Pengalaman Penggunaan.
 * Menggunakan Chart.js di canvas #donutChart.
 * @param {typeof DATA_DONUT} data
 */
function buatChartDonut(data) {
  const canvas = document.getElementById('donutChart');
  if (!canvas) { console.warn('[charts] #donutChart tidak ditemukan'); return; }

  // Update label tengah & deskripsi
  const elLabel = document.getElementById('donutLabel');
  const elDesc  = document.getElementById('donutDesc');
  if (elLabel) elLabel.textContent = data.persen + '%';
  if (elDesc)  elDesc.innerHTML = data.deskripsi;

  new Chart(canvas, {
    type: 'doughnut',
    data: {
      datasets: [{
        data           : [data.persen, 100 - data.persen],
        backgroundColor: ['#2A7E6C', '#E8F5F2'],
        borderWidth    : 0,
        hoverOffset    : 4,
      }],
    },
    options: {
      responsive         : false,
      cutout             : '72%',
      animation: { duration: 900, easing: 'easeOutQuart' },
      plugins: {
        legend : { display: false },
        tooltip: {
          backgroundColor: 'rgba(255,255,255,0.96)',
          titleColor     : '#1A1A1A',
          bodyColor      : '#2A7E6C',
          borderColor    : 'rgba(0,0,0,0.06)',
          borderWidth    : 1,
          padding        : 10,
          cornerRadius   : 10,
          callbacks: {
            label: i => (i.dataIndex === 0 ? '  Puas: ' : '  Lainnya: ') + i.raw + '%',
          },
        },
      },
    },
  });
}


/* =============================================
   3. UTILITY
   ============================================= */

/** Scroll effect navbar */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}


/* =============================================
   4. INIT
   ============================================= */

/**
 * Render semua chart dengan data lokal (fallback).
 */
function renderSemua(dataKepuasan, dataStats, dataInteraktifitas, dataPerforma, dataEvaluasi, dataDonut) {
  buatChartKepuasan(dataKepuasan);
  buatStatsCounter(dataStats);
  buatChartInteraktifitas(dataInteraktifitas);
  buatChartPerforma(dataPerforma);
  buatChartEvaluasi(dataEvaluasi);
  buatChartDonut(dataDonut);
}

/**
 * ─── AKTIFKAN SAAT BACKEND SIAP ─────────────────────────────────────────────
 *
 * Hapus komentar blok di bawah dan sesuaikan URL endpoint-nya.
 * API diharapkan mengembalikan satu objek JSON dengan key:
 *   { kepuasan, stats, interaktifitas, performa, evaluasi, donut }
 */
async function fetchDanRender() {
  try {
    const res  = await fetch('http://localhost:5000/api/statistik');
    const json = await res.json();
    renderSemua(
      json.kepuasan       ?? DATA_KEPUASAN,
      json.stats          ?? DATA_STATS,
      json.interaktifitas ?? DATA_INTERAKTIFITAS,
      json.performa       ?? DATA_PERFORMA,
      json.evaluasi       ?? DATA_EVALUASI,
      json.donut          ?? DATA_DONUT,
    );
  } catch (err) {
    console.warn('[charts] API gagal, menggunakan data statis sebagai cadangan.', err);
    renderSemua(DATA_KEPUASAN, DATA_STATS, DATA_INTERAKTIFITAS, DATA_PERFORMA, DATA_EVALUASI, DATA_DONUT);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  initNavbar();

  /* Sekarang memanggil data dari API backend */
  fetchDanRender();
});