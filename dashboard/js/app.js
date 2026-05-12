'use strict';
/* app.js — chart functions + native mousemove tooltip */

/* ── PALETTE & UTILS ─────────────────────────────── */
const C = ['#0067B8','#80B3DC','#F59E0B','#10B981','#EF4444','#8B5CF6','#F97316'];
const alpha = (hex, op) => {
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${op})`;
};
const condColor = (v, good, warn) => v >= good ? C[3] : v >= warn ? C[2] : C[4];
const cv = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const BORDER = '#D0DFEE';
const TXTCLR = '#5A6B7D';
let ACTIVE_CHARTS = [];
const TABLE_PAGE_SIZE = 100;
let TABLE_PAYLOAD = null;
let TABLE_PAGE = 1;

/* ── CHART.JS GLOBALS ────────────────────────────── */
Chart.defaults.font.family = "'Plus Jakarta Sans', Arial, sans-serif";
Chart.defaults.font.size   = 12;
Chart.defaults.animation   = { duration: 600, easing: 'easeInOutQuart' };
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.boxWidth      = 8;
Chart.defaults.plugins.legend.labels.padding       = 18;
Chart.defaults.plugins.tooltip.enabled             = false; /* we use custom HTML tooltip */

/* ── NATIVE HTML TOOLTIP ─────────────────────────── */
function mkTT() {
  let el = document.getElementById('iku-tt');
  if (!el) {
    el = document.createElement('div');
    el.id = 'iku-tt';
    document.body.appendChild(el);
  }
  return el;
}

function attachTooltip(chart) {
  ACTIVE_CHARTS.push(chart);
  const canvas = chart.canvas;
  const tt = mkTT();

  canvas.addEventListener('mousemove', function(e) {
    // nearest + intersect:true → only the bar/point the cursor is directly on
    const items = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);

    if (!items.length) { tt.style.opacity = '0'; return; }

    const item = items[0];
    const ds   = chart.data.datasets[item.datasetIndex];
    const idx  = item.index;
    const raw  = ds.data[idx];
    if (raw === null || raw === undefined) { tt.style.opacity = '0'; return; }

    const val      = typeof raw === 'number' ? raw.toLocaleString('id-ID') : String(raw);
    const catLabel = String(chart.data.labels?.[idx] ?? '');
    const dsLabel  = ds.label || '';
    const bg = Array.isArray(ds.backgroundColor)
      ? ds.backgroundColor[idx]
      : (ds.borderColor || ds.backgroundColor || C[item.datasetIndex % C.length]);

    // Single-element tooltip: category on top, color+name+value below
    tt.innerHTML = `
      <div class="tt-cat">${catLabel}</div>
      <div class="tt-row">
        <span class="tt-dot" style="background:${bg}"></span>
        <span class="tt-label">${dsLabel}</span>
        <strong class="tt-val">${val}</strong>
      </div>`;

    // Use chart element pixel coords for precise alignment
    const meta = chart.getDatasetMeta(item.datasetIndex);
    const elPx = meta.data[idx];
    const rect  = canvas.getBoundingClientRect();
    const isH   = chart.options.indexAxis === 'y';  // horizontal bar chart

    let x, y;
    if (isH) {
      // Align tooltip to the RIGHT of the bar end, centered on that bar row
      x = rect.left + elPx.x + 14;
      y = rect.top  + elPx.y - 20;
    } else {
      // Align tooltip ABOVE and slightly right of the bar/point
      x = rect.left + elPx.x + 10;
      y = rect.top  + elPx.y - tt.offsetHeight - 8;
    }

    // Clamp to viewport edges
    const ttW = 240;
    if (x + ttW > window.innerWidth) x = (isH ? rect.left + elPx.x - ttW - 4 : rect.left + elPx.x - ttW - 10);
    if (y < 4) y = rect.top + elPx.y + 10;

    tt.style.cssText = `opacity:1;left:${x}px;top:${y}px;`;
  });

  canvas.addEventListener('mouseleave', () => { tt.style.opacity = '0'; });
  return chart;
}

function destroyCharts() {
  ACTIVE_CHARTS.forEach(chart => chart.destroy());
  ACTIVE_CHARTS = [];
}

function ensureTablePanel() {
  const content = document.querySelector('.content');
  if (!content || document.getElementById('data-panel')) return;
  content.insertAdjacentHTML('beforeend', `
    <section class="data-panel" id="data-panel">
      <div class="data-panel-head">
        <div>
          <h3 class="data-panel-title">Data Tabel</h3>
          <p class="data-panel-sub">Lihat data pendukung sesuai tahun yang dipilih.</p>
        </div>
        <button class="data-toggle-btn" id="dataToggle" type="button">Sembunyikan Tabel</button>
      </div>
      <div class="data-panel-body" id="dataPanelBody">
        <div class="data-state">Memuat data tabel...</div>
      </div>
    </section>`);

  document.getElementById('dataToggle').addEventListener('click', () => toggleDataTable());
}

async function toggleDataTable(forceReload=false) {
  const body = document.getElementById('dataPanelBody');
  const btn = document.getElementById('dataToggle');
  if (!body || !btn) return;

  const opening = body.hidden || forceReload;
  body.hidden = !opening;
  btn.textContent = opening ? 'Sembunyikan Tabel' : 'Tampilkan Tabel';
  if (!opening) return;
  TABLE_PAGE = 1;

  const page = document.body.dataset.page || 'summary';
  const year = localStorage.getItem('iku-year') || '2024';
  const unit = localStorage.getItem('iku-unit') || 'all';
  body.innerHTML = '<div class="data-state">Memuat data tabel...</div>';

  try {
    const res = await fetch(`api/table.php?iku=${encodeURIComponent(page)}&year=${encodeURIComponent(year)}&unit=${encodeURIComponent(unit)}`, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const payload = await res.json();
    if (!payload.ok) throw new Error(payload.error || 'Gagal memuat tabel');
    TABLE_PAYLOAD = payload;
    renderDataTable(payload);
  } catch (err) {
    body.innerHTML = `<div class="data-state data-state--error">Data tabel belum bisa dimuat: ${err.message}</div>`;
  }
}

function renderDataTable(payload, page=TABLE_PAGE) {
  const body = document.getElementById('dataPanelBody');
  if (!body) return;
  const columns = payload.columns || [];
  const rows = payload.rows || [];
  const totalPages = Math.max(1, Math.ceil(rows.length / TABLE_PAGE_SIZE));
  TABLE_PAGE = Math.min(Math.max(1, page), totalPages);
  const start = (TABLE_PAGE - 1) * TABLE_PAGE_SIZE;
  const visibleRows = rows.slice(start, start + TABLE_PAGE_SIZE);
  const head = columns.map(col => `<th>${col}</th>`).join('');
  const tableRows = visibleRows.map(row => `
    <tr>${columns.map(col => `<td>${formatCell(row[col], col)}</td>`).join('')}</tr>
  `).join('');
  const pager = totalPages > 1 ? `
    <div class="data-pagination" aria-label="Navigasi halaman tabel">
      <button class="data-page-btn" type="button" data-page="${TABLE_PAGE - 1}" ${TABLE_PAGE === 1 ? 'disabled' : ''}>Sebelumnya</button>
      <div class="data-page-list">
        ${Array.from({ length: totalPages }, (_, idx) => {
          const pageNo = idx + 1;
          return `<button class="data-page-btn ${pageNo === TABLE_PAGE ? 'active' : ''}" type="button" data-page="${pageNo}">${pageNo}</button>`;
        }).join('')}
      </div>
      <button class="data-page-btn" type="button" data-page="${TABLE_PAGE + 1}" ${TABLE_PAGE === totalPages ? 'disabled' : ''}>Berikutnya</button>
    </div>` : '';

  body.innerHTML = `
    <div class="data-table-meta">
      <strong>${payload.title || 'Data Tabel'}</strong>
      <span>${rows.length.toLocaleString('id-ID')} baris · Tahun ${payload.year}</span>
    </div>
    <div class="table-wrap data-table-scroll">
      <table class="data-table">
        <thead><tr>${head}</tr></thead>
        <tbody>${tableRows || `<tr><td colspan="${Math.max(columns.length,1)}">Tidak ada data.</td></tr>`}</tbody>
      </table>
    </div>
    ${pager}`;

  const metaSpan = body.querySelector('.data-table-meta span');
  if (metaSpan) metaSpan.textContent = `${rows.length.toLocaleString('id-ID')} baris - Tahun ${payload.year}`;

  body.querySelectorAll('.data-page-btn[data-page]').forEach(button => {
    button.addEventListener('click', () => {
      if (button.disabled || !TABLE_PAYLOAD) return;
      renderDataTable(TABLE_PAYLOAD, Number(button.dataset.page));
    });
  });
}

function formatCell(value, column='') {
  if (value === null || value === undefined || value === '') return '-';
  const col = String(column).toLowerCase();
  if (col.includes('tahun') && !Number.isNaN(Number(value))) return String(Number(value));
  if (typeof value === 'number') return value.toLocaleString('id-ID');
  if (!Number.isNaN(Number(value)) && String(value).trim() !== '') {
    const num = Number(value);
    return Number.isInteger(num) ? num.toLocaleString('id-ID') : num.toLocaleString('id-ID', { maximumFractionDigits: 2 });
  }
  return String(value);
}

/* ── SCALE HELPERS ───────────────────────────────── */
const scaleX = () => ({ grid:{color:cv('--color-border')||BORDER,drawTicks:false}, border:{display:false}, ticks:{color:cv('--color-text-secondary')||TXTCLR,padding:6} });
const scaleY = () => ({ grid:{color:cv('--color-border')||BORDER,drawTicks:false}, border:{display:false}, ticks:{color:cv('--color-text-secondary')||TXTCLR,padding:6} });
const legendColor = () => cv('--color-text-secondary') || TXTCLR;

const base = () => ({
  responsive:true, maintainAspectRatio:false,
  plugins: { legend:{ labels:{ color:legendColor() } } },
  scales: { x:scaleX(), y:scaleY() }
});
const noXGrid = () => ({
  responsive:true, maintainAspectRatio:false,
  plugins: { legend:{ labels:{ color:legendColor() } } },
  scales: { x:{...scaleX(), grid:{display:false}}, y:scaleY() }
});

/* ── DATASET HELPERS ─────────────────────────────── */
function stats(items) {
  const el = document.getElementById('stats-row');
  if (!el) return;
  el.innerHTML = items.map(s=>`
    <div class="stat-card">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}</div>
      ${s.sub?`<div class="stat-sub">${s.sub}</div>`:''}
    </div>`).join('');
}
const pageStats = (pageData, fallback) => stats(pageData.stats || fallback);
const lineDS = (label, data, color, fill=false) => ({
  type:'line', label, data, borderColor:color, borderWidth:3,
  backgroundColor: fill ? alpha(color,0.12) : 'transparent',
  fill, tension:0.4, pointRadius:5, pointHoverRadius:8,
  pointBackgroundColor:color, pointBorderColor:'#fff', pointBorderWidth:2,
});
const targetDS = (label, count, val, color=C[2]) => ({
  type:'line', label, data:Array(count).fill(val),
  borderColor:color, borderDash:[6,4], borderWidth:2,
  backgroundColor:'transparent', fill:false, pointRadius:0, tension:0,
});
const stackedDS = (ds, i) => ({ ...ds, backgroundColor:C[i%C.length], borderRadius:0 });
const stackedBarDS = (ds, i) => ({ ...ds, backgroundColor:C[i%C.length], borderRadius:4, borderSkipped:false });

/* ── KPI GRID (index.html) ───────────────────────── */
function buildKpiGrid() {
  const grid = document.getElementById('kpiGrid');
  if (!grid) return;
  grid.innerHTML = '';
  DATA.kpiCards.forEach(card => {
    const isNum = typeof card.nilai === 'number';
    const pct   = isNum && typeof card.target==='number' ? Math.min(100,Math.round(card.nilai/card.target*100)) : 100;
    const cls   = card.status==='good'?'good':card.status==='warning'?'warning':'danger';
    const lbl   = card.status==='good'?'✓ Tercapai':card.status==='warning'?'⚠ Perlu Perhatian':'✗ Di Bawah Target';
    const el    = document.createElement('div');
    el.className = 'kpi-card';
    el.innerHTML = `
      <div class="kpi-num">${card.no}</div>
      <div class="kpi-name">${card.nama}</div>
      <div class="kpi-values">
        <span class="kpi-value">${isNum?card.nilai.toLocaleString('id-ID'):card.nilai}</span>
        <span class="kpi-unit">${card.satuan}</span>
      </div>
      <div class="kpi-target">Target: ${typeof card.target==='number'?card.target.toLocaleString('id-ID'):card.target}${card.satuan?' '+card.satuan:''}</div>
      <div class="progress-bar"><div class="progress-fill ${cls}" style="width:${pct}%"></div></div>
      <span class="kpi-status ${cls}">${lbl}</span>`;
    el.addEventListener('click', () => { window.location.href = card.id+'.html'; });
    grid.appendChild(el);
  });
}

/* ── IKU PAGES ───────────────────────────────────── */
function pageIKU1() {
  const d = DATA.iku1;
  pageStats(d, [
    {label:'Efisiensi 2024',   value:'43,2%',     sub:'Target ≥ 40%'},
    {label:'Jumlah Lulusan',   value:'4.102',     sub:'Tahun 2024'},
    {label:'Tren',             value:'+2,0 pp',   sub:'vs 2023'},
    {label:'Fakultas Terbaik', value:'Kedokteran',sub:'62% efisiensi'},
  ]);
  attachTooltip(new Chart(document.getElementById('chart-a'), {
    type:'line', data:{ labels:d.tren.labels, datasets:[
      lineDS('Efisiensi (%)', d.tren.efisiensi, C[0], true),
      targetDS(`Target (${d.summary?.target ?? 85}%)`, d.tren.labels.length, d.summary?.target ?? 85),
    ]}, options:{...base()}
  }));
  attachTooltip(new Chart(document.getElementById('chart-b'), {
    type:'bar', data:{ labels:d.perFakultas.labels, datasets:[{
      label:'Efisiensi (%)', data:d.perFakultas.nilai,
      backgroundColor:d.perFakultas.nilai.map(v=>condColor(v,d.summary?.target ?? 85,(d.summary?.target ?? 85)*0.85)), borderRadius:6,
    }]},
    options:{...noXGrid(), indexAxis:'y',
      plugins:{...base().plugins, legend:{display:false}},
      scales:{ x:{...scaleX(), max:120}, y:{...scaleY(), grid:{display:false}} }
    }
  }));
}

function pageIKU2() {
  const page = DATA.iku2;
  const d = page.status;
  pageStats(page, [
    {label:'Lulusan Berdampak 2024', value:'82,4%', sub:'Target ≥ 80%'},
    {label:'Bekerja Formal',         value:'60,1%', sub:'Tahun 2024'},
    {label:'Wirausaha',              value:'12,8%', sub:'Tahun 2024'},
    {label:'Studi Lanjut',           value:'9,5%',  sub:'Tahun 2024'},
  ]);
  attachTooltip(new Chart(document.getElementById('chart-a'), {
    type:'bar', data:{ labels:d.labels, datasets:d.datasets.map(stackedDS) },
    options:{...noXGrid(), scales:{
      x:{...scaleX(), grid:{display:false}, stacked:true},
      y:{...scaleY(), stacked:true, max:100}
    }}
  }));
}

function pageIKU3() {
  const page = DATA.iku3;
  const d = page.mbkm;
  pageStats(page, [
    {label:'Mahasiswa MBKM 2024', value:'31,7%',     sub:'Target ≥ 30%'},
    {label:'Total Peserta',       value:'7.614',     sub:'Gasal + Genap 2024'},
    {label:'Program Terpopuler',  value:'Magang',    sub:'1.200 peserta'},
    {label:'Program Aktif',       value:'7 program', sub:'MBKM'},
  ]);
  attachTooltip(new Chart(document.getElementById('chart-a'), {
    type:'bar', data:{ labels:d.labels, datasets:d.datasets.map(stackedDS) },
    options:{...noXGrid(), scales:{
      x:{...scaleX(), grid:{display:false}, stacked:true},
      y:{...scaleY(), stacked:true}
    }}
  }));
}

function pageIKU4() {
  const d = DATA.iku4;
  pageStats(d, [
    {label:'Dosen Rekognisi 2024', value:'18,3%',     sub:'Target ≥ 20%'},
    {label:'Jumlah Dosen',         value:'189',       sub:'dari ~1.032 total'},
    {label:'Negara Tujuan',        value:'24 negara', sub:'5 benua'},
    {label:'Tren',                 value:'+1,5 pp',   sub:'vs 2023'},
  ]);
  const na=d.negara, tr=d.tren;
  attachTooltip(new Chart(document.getElementById('chart-a'), {
    type:'bar', data:{ labels:na.labels, datasets:[{
      label:'Dosen', data:na.data,
      backgroundColor:na.data.map((_,i)=>C[i%C.length]), borderRadius:6,
    }]},
    options:{...noXGrid(), indexAxis:'y',
      plugins:{...base().plugins, legend:{display:false}},
      scales:{ x:scaleX(), y:{...scaleY(), grid:{display:false}} }
    }
  }));
  attachTooltip(new Chart(document.getElementById('chart-b'), {
    type:'line', data:{ labels:tr.labels, datasets:[
      lineDS('Dosen Rekognisi', tr.data, C[0], true),
      targetDS(`Target (${d.summary?.target ?? 20})`, tr.labels.length, d.summary?.target ?? 20),
    ]}, options:{...base()}
  }));
}

function pageIKU5() {
  const page = DATA.iku5;
  const d = page.data;
  pageStats(page, [
    {label:'Rasio Luaran 2024', value:'27,8%',    sub:'Target ≥ 25%'},
    {label:'Jumlah Luaran',     value:'97',       sub:'Produk kerjasama 2024'},
    {label:'Nilai Kontrak',     value:'Rp 11,6 M',sub:'Tahun 2024'},
    {label:'Mitra Aktif',       value:'43',       sub:'Industri & lembaga'},
  ]);
  attachTooltip(new Chart(document.getElementById('chart-a'), {
    type:'line',
    data:{ labels:d.labels, datasets:[{
      label:'Rasio Capaian (%)',
      data:DATA.iku5.trenRasio || d.luaran.map((_, i) => DATA.iku5.summary?.nilai ?? null),
      borderColor:C[3],
      backgroundColor:alpha(C[3],0.12),
      fill:true,
      borderWidth:3,
      tension:0.4,
      pointRadius:5,
      pointHoverRadius:8,
      pointBackgroundColor:C[3],
      pointBorderColor:'#fff',
      pointBorderWidth:2,
    },
    targetDS(`Target (${page.summary?.target ?? 25}%)`, d.labels.length, page.summary?.target ?? 25),
    ]},
    options:{...base(),
      plugins:{ legend:{ labels:{ color:legendColor() } } },
      scales:{
        x:{...scaleX(), grid:{display:false}},
        y:{...scaleY(), beginAtZero:true, title:{display:true, text:'Rasio (%)', color:cv('--color-text-secondary')||TXTCLR, font:{size:11}}}
      }
    }
  }));
  attachTooltip(new Chart(document.getElementById('chart-b'), {
    type:'line',
    data:{ labels:d.labels, datasets:[ lineDS('Nilai Kontrak (M Rp)', d.kontrak, C[2], true) ]},
    options:{...base(),
      plugins:{ legend:{display:false} },
      scales:{
        x:{...scaleX(), grid:{display:false}},
        y:{...scaleY(), beginAtZero:true, title:{display:true, text:'Miliar Rp', color:cv('--color-text-secondary')||TXTCLR, font:{size:11}}}
      }
    }
  }));
}

function pageIKU6() {
  const page = DATA.iku6;
  const d = page.kuartil;
  pageStats(page, [
    {label:'Total Publikasi 2024', value:'847',   sub:'Target ≥ 700 artikel'},
    {label:'Scopus Q1',            value:'142',   sub:'Kuartil terbaik'},
    {label:'WoS',                  value:'52',    sub:'Web of Science 2024'},
    {label:'Pertumbuhan',          value:'+9,7%', sub:'vs 2023'},
  ]);
  attachTooltip(new Chart(document.getElementById('chart-a'), {
    type:'bar',
    data:{ labels:d.labels, datasets:d.datasets.map(stackedBarDS) },
    options:{...noXGrid(),
      scales:{
        x:{...scaleX(), grid:{display:false}, stacked:true},
        y:{...scaleY(), stacked:true, beginAtZero:true, title:{display:true, text:'Jumlah Publikasi', color:cv('--color-text-secondary')||TXTCLR, font:{size:11}}}
      }
    }
  }));
}

function pageIKU7() {
  const page = DATA.iku7;
  const d = page.sdg;
  pageStats(page, [
    {label:'SDG Aktif 2024',  value:'14 SDG',  sub:'Target ≥ 12 SDG'},
    {label:'Total Program',   value:'412',     sub:'Penelitian + Pengabdian + Kerjasama'},
    {label:'SDG Dominan',     value:'SDG 4',   sub:'49 program'},
    {label:'SDG Baru',        value:'SDG 14',  sub:'Ekosistem Lautan'},
  ]);
  attachTooltip(new Chart(document.getElementById('chart-a'), {
    type:'bar', data:{ labels:d.labels, datasets:d.datasets.map(stackedDS) },
    options:{...base(), indexAxis:'y', scales:{
      x:{...scaleX(), stacked:true},
      y:{...scaleY(), stacked:true, grid:{display:false}, ticks:{color:legendColor(),font:{size:11},padding:6}},
    }}
  }));
}

function pageIKU8() {
  const page = DATA.iku8;
  const d = page.peran;
  pageStats(page, [
    {label:'Dosen Terlibat 2024', value:'12,1%',      sub:'Target ≥ 10%'},
    {label:'Jumlah Dosen',        value:'125',        sub:'Aktif kebijakan publik'},
    {label:'Peran Terbanyak',     value:'Narasumber', sub:'80 dosen'},
    {label:'Tingkat',             value:'Nasional',   sub:'60% kegiatan'},
  ]);
  attachTooltip(new Chart(document.getElementById('chart-a'), {
    type:'bar', data:{ labels:d.labels, datasets:d.datasets.map(stackedDS) },
    options:{...noXGrid(), scales:{
      x:{...scaleX(), grid:{display:false}, stacked:true},
      y:{...scaleY(), stacked:true}
    }}
  }));
}

function pageIKU9() {
  const page = DATA.iku9;
  const d = page.pendapatan;
  pageStats(page, [
    {label:'Proporsi Non-Pendidikan', value:'18,4%',      sub:'Target ≥ 16%'},
    {label:'Total Pendapatan',        value:'Rp 38,9 M',  sub:'Non-pendidikan 2024'},
    {label:'Sumber Terbesar',         value:'Penelitian',  sub:'Rp 15,8 M'},
    {label:'Pertumbuhan',             value:'+10,2%',      sub:'vs 2023'},
  ]);
  attachTooltip(new Chart(document.getElementById('chart-a'), {
    type:'bar', data:{ labels:d.labels, datasets:d.datasets.map(stackedDS) },
    options:{...noXGrid(), scales:{
      x:{...scaleX(), grid:{display:false}, stacked:true},
      y:{...scaleY(), stacked:true}
    }}
  }));
}

function pageIKU10() {
  const page = DATA.iku10;
  const d = page.unit;
  pageStats(page, [
    {label:'Rata-rata Nilai 2024', value:'79,4',       sub:'Target ≥ 75'},
    {label:'Unit Terbaik',         value:'Kedokteran', sub:'Nilai 88'},
    {label:'Unit ≥ Target',        value:'10 / 12',   sub:'unit kerja'},
    {label:'Predikat',             value:'WBK',        sub:'Wilayah Bebas Korupsi'},
  ]);
  attachTooltip(new Chart(document.getElementById('chart-a'), {
    type:'bar', data:{ labels:d.labels, datasets:[
      {type:'bar', label:'Nilai ZI', data:d.nilai,
       backgroundColor:d.nilai.map(v=>condColor(v,75,65)), borderRadius:6, order:2},
      targetDS(`Target (${d.target})`, d.labels.length, d.target),
    ]},
    options:{...base(), scales:{
      x:{...scaleX(), grid:{display:false}},
      y:{...scaleY(), min:60, max:100}
    }}
  }));
}

function pageIKU11() {
  const page = DATA.iku11;
  const d = page.komponen;
  pageStats(page, [
    {label:'Opini Audit 2024', value:'WTP', sub:'Wajar Tanpa Pengecualian'},
    {label:'Nilai Tertinggi',  value:'92',  sub:'Laporan Keuangan'},
    {label:'Nilai Terendah',   value:'78',  sub:'Pengendalian Intern'},
    {label:'Temuan Minor',     value:'5',   sub:'Sedang ditindaklanjuti'},
  ]);
  attachTooltip(new Chart(document.getElementById('chart-a'), {
    type:'bar', data:{ labels:d.labels, datasets:[{
      label:'Nilai Komponen',
      data:d.nilai, backgroundColor:d.nilai.map(v=>v>=85?C[3]:v>=75?C[0]:C[2]), borderRadius:6,
    }]},
    options:{...noXGrid(), indexAxis:'y',
      plugins:{legend:{display:false}},
      scales:{ x:{...scaleX(), min:0, max:100}, y:{...scaleY(), grid:{display:false}} }
    }
  }));
  const rows = page.catatan.map(r=>{
    const cls = r.status==='Baik'?'badge-green':'badge-yellow';
    return `<tr><td>${r.komponen}</td><td><span class="badge ${cls}">${r.status}</span></td><td>${r.catatan}</td></tr>`;
  }).join('');
  const tbl = document.getElementById('table-audit');
  if (tbl) tbl.innerHTML=`
    <table class="data-table">
      <thead><tr><th>Komponen</th><th>Status</th><th>Catatan Auditor</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/* ── PAGE AUTO-INIT ──────────────────────────────── */
const PAGE_FN = {
  beranda:buildKpiGrid, iku1:pageIKU1, iku2:pageIKU2, iku3:pageIKU3,
  iku4:pageIKU4, iku5:pageIKU5, iku6:pageIKU6, iku7:pageIKU7,
  iku8:pageIKU8, iku9:pageIKU9, iku10:pageIKU10, iku11:pageIKU11,
};

async function renderCurrentPage() {
  const page = document.body.dataset.page || 'beranda';
  if (window.IKUDataApi) await window.IKUDataApi.load();
  destroyCharts();
  if (PAGE_FN[page]) PAGE_FN[page]();
  ensureTablePanel();
  const body = document.getElementById('dataPanelBody');
  if (body) await toggleDataTable(true);
}

document.addEventListener('DOMContentLoaded', () => {
  renderCurrentPage();
});

window.addEventListener('iku:filtersChanged', () => {
  renderCurrentPage();
});
