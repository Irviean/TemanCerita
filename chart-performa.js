/**
 * chart-performa.js — Performa Konselor Bulan Ini (konselor.html)
 */

const PERFORMA_DATA = {
  konselor: [
    { nama: 'Irviean Yoga',  sesi: 85, rating: 4.9 },
    { nama: 'Janna',          sesi: 62, rating: 4.8 },
    { nama: 'Dimas Pratama',  sesi: 78, rating: 5.0 },
    { nama: 'Siti Aminah',    sesi: 54, rating: 4.7 },
  ],
};

function buatChartPerforma(data) {
  const canvas = document.getElementById('performaChart');
  if (!canvas) { console.warn('[chart-performa] #performaChart tidak ditemukan'); return; }

  const labels     = data.konselor.map(k => k.nama);
  const sesiData   = data.konselor.map(k => k.sesi);
  const ratingData = data.konselor.map(k => parseFloat((k.rating * 20).toFixed(1)));
  const ratingRaw  = data.konselor.map(k => k.rating);

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label               : 'Jumlah Sesi Terlaksana',
          data                : sesiData,
          backgroundColor     : '#A8D5CB',
          hoverBackgroundColor: '#7EC4B8',
          borderRadius        : 6,
          borderSkipped       : false,
          barPercentage       : 0.4,
          categoryPercentage  : 0.65,
        },
        {
          label               : 'Rata-rata Rating',
          data                : ratingData,
          backgroundColor     : '#4AA090',
          hoverBackgroundColor: '#2A7E6C',
          borderRadius        : 6,
          borderSkipped       : false,
          barPercentage       : 0.4,
          categoryPercentage  : 0.65,
          rawRatings          : ratingRaw,
        },
      ],
    },
    options: {
      responsive          : true,
      maintainAspectRatio : false,
      animation: { duration: 800, easing: 'easeOutQuart' },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display  : true,
          position : 'bottom',
          labels   : {
            usePointStyle : true,
            pointStyle    : 'rectRounded',
            padding       : 24,
            font          : { size: 13, family: 'Plus Jakarta Sans, sans-serif' },
            color         : '#4A4A4A',
          },
        },
        tooltip: {
          backgroundColor : '#fff',
          titleColor      : '#1A1A1A',
          bodyColor       : '#4A4A4A',
          borderColor     : '#E2E2DC',
          borderWidth     : 1,
          padding         : 12,
          cornerRadius    : 12,
          callbacks: {
            title : i => i[0].label,
            label : i => {
              if (i.datasetIndex === 0) return '  Sesi: ' + i.raw + ' sesi';
              const raw = i.dataset.rawRatings?.[i.dataIndex] ?? (i.raw / 20).toFixed(1);
              return '  Rating: ★ ' + raw;
            },
          },
        },
      },
      scales: {
        x: {
          grid  : { display: false },
          border: { color: '#E2E2DC' },
          ticks : {
            font        : { size: 12, weight: '600', family: 'Plus Jakarta Sans, sans-serif' },
            color       : '#4A4A4A',
            maxRotation : 0,
          },
        },
        y: {
          min   : 0,
          max   : 110,
          grid  : { color: '#E2E2DC' },
          border: { display: false },
          ticks : {
            stepSize : 25,
            font     : { size: 11, family: 'Plus Jakarta Sans, sans-serif' },
            color    : '#8A8A8A',
          },
        },
      },
    },
    plugins: [{
      id: 'labelAtasBar',
      afterDatasetsDraw(chart) {
        const { ctx: c } = chart;
        chart.data.datasets.forEach((ds, di) => {
          chart.getDatasetMeta(di).data.forEach((bar, i) => {
            const val  = di === 0 ? ds.data[i] : (ds.rawRatings?.[i] ?? (ds.data[i] / 20).toFixed(1));
            const text = di === 0 ? String(val) : '★ ' + val;
            c.save();
            c.font         = '700 11px Plus Jakarta Sans, sans-serif';
            c.fillStyle    = '#2A7E6C';
            c.textAlign    = 'center';
            c.textBaseline = 'bottom';
            c.fillText(text, bar.x, bar.y - 4);
            c.restore();
          });
        });
      },
    }],
  });
}

async function ambilDataPerforma(bulan) {
  try {
    const res = await fetch(`http://localhost:5000/api/statistik?bulan=${bulan}`);
    const data = await res.json();
    // Jika struktur JSON dari backend berbeda, sesuaikan di sini
    return data.performa_konselor || data;
  } catch (err) {
    console.warn('API error, pakai data statis:', err);
    return PERFORMA_DATA;
  }
}

document.addEventListener('DOMContentLoaded', async function () {
  const data = await ambilDataPerforma('2024-10');
  buatChartPerforma(data);

  const select = document.getElementById('performaBulan');
  if (select) {
    select.addEventListener('change', async function () {
      const existing = Chart.getChart('performaChart');
      if (existing) existing.destroy();
      const newData = await ambilDataPerforma(this.value);
      buatChartPerforma(newData);
    });
  }
});