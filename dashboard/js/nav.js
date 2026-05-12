'use strict';
/* nav.js - injects sidebar + header into every page, handles shared UI */

const NAV_PAGES = {
  beranda: { title:'Ringkasan IKU', file:'index.html', badge:null },
  iku1:    { title:'IKU 1 - Angka Efisiensi Edukasi', file:'iku1.html', badge:'1' },
  iku2:    { title:'IKU 2 - Lulusan Berdampak', file:'iku2.html', badge:'2' },
  iku3:    { title:'IKU 3 - Mahasiswa di Luar Kampus', file:'iku3.html', badge:'3' },
  iku4:    { title:'IKU 4 - Dosen Rekognisi Internasional', file:'iku4.html', badge:'4' },
  iku5:    { title:'IKU 5 - Rasio Luaran Kerjasama', file:'iku5.html', badge:'5' },
  iku6:    { title:'IKU 6 - Publikasi Bereputasi', file:'iku6.html', badge:'6' },
  iku7:    { title:'IKU 7 - Keterlibatan SDGs', file:'iku7.html', badge:'7' },
  iku8:    { title:'IKU 8 - Dosen dalam Kebijakan Publik', file:'iku8.html', badge:'8' },
  iku9:    { title:'IKU 9 - Pendapatan Non-Pendidikan', file:'iku9.html', badge:'9' },
  iku10:   { title:'IKU 10 - Zona Integritas', file:'iku10.html', badge:'10' },
  iku11:   { title:'IKU 11 - Integritas & Akuntabilitas', file:'iku11.html', badge:'11' },
};

const NAV_GROUPS = [
  { title:'Talenta', pages:['iku1','iku2','iku3','iku4'] },
  { title:'Inovasi', pages:['iku5','iku6'] },
  { title:'Kontribusi Masyarakat', pages:['iku7','iku8'] },
  { title:'Tata Kelola', pages:['iku9','iku10','iku11'] },
];

function navLabel(page) {
  return page.title.split(' - ')[1]?.trim() ?? page.title;
}

function buildSidebarHTML(activePage) {
  const ikuItems = NAV_GROUPS.map((group, index) => {
    const open = group.pages.includes(activePage) || activePage === 'beranda';
    const links = group.pages.map(key => {
      const page = NAV_PAGES[key];
      return `
        <a class="nav-item nav-subitem${activePage===key?' active':''}" href="${page.file}">
          <span class="nav-badge">${page.badge}</span>
          <span class="nav-label">${navLabel(page)}</span>
        </a>`;
    }).join('');
    return `
      <div class="nav-group${open?' open':''}">
        <button class="nav-group-toggle" type="button" data-group="${index}" aria-expanded="${open?'true':'false'}">
          <span class="nav-group-title">${group.title}</span>
          <span class="nav-group-chevron">›</span>
        </button>
        <div class="nav-group-items">${links}</div>
      </div>`;
  }).join('');

  return `
    <div class="sidebar-header">
      <div class="logo-wrap">
        <img src="https://unsri.ac.id/.safeline/static/favicon.png" alt="Unsri" class="logo-img"
             onerror="this.style.display='none';document.getElementById('lf').style.display='flex'">
        <div id="lf" class="logo-fallback">U</div>
        <div class="logo-info"><span class="logo-name">UNSRI</span><span class="logo-sub">Dashboard IKU</span></div>
      </div>
      <button id="sidebarToggle" class="icon-btn" aria-label="Toggle sidebar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
    </div>
    <nav class="sidebar-nav">
      <a class="nav-item${activePage==='beranda'?' active':''}" href="index.html">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
        <span class="nav-label">Ringkasan</span>
      </a>
      <div class="nav-divider">IKU</div>
      ${ikuItems}
    </nav>
    <div class="sidebar-footer">
      <button id="themeToggle" class="theme-btn">
        <svg class="theme-icon moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        <svg class="theme-icon sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
        <span class="theme-label">Mode Gelap</span>
      </button>
    </div>`;
}

function buildHeaderHTML(activePage) {
  const page = NAV_PAGES[activePage] || NAV_PAGES.beranda;
  const savedYear = localStorage.getItem('iku-year') || '2024';
  const savedUnit = localStorage.getItem('iku-unit') || 'all';
  return `
    <div class="header-left">
      <h1 class="page-title">${page.title}</h1>
      <p class="page-subtitle">Universitas Sriwijaya · <span id="headerYear">${savedYear}</span></p>
    </div>
    <div class="header-filters">
      <select id="filterTahun" class="filter-select">
        <option value="2024"${savedYear==='2024'?' selected':''}>2024</option>
        <option value="2023"${savedYear==='2023'?' selected':''}>2023</option>
        <option value="2022"${savedYear==='2022'?' selected':''}>2022</option>
        <option value="2021"${savedYear==='2021'?' selected':''}>2021</option>
        <option value="2020"${savedYear==='2020'?' selected':''}>2020</option>
      </select>
      <select id="filterFakultas" class="filter-select">
        <option value="all"${savedUnit==='all'?' selected':''}>Semua Fakultas</option>
        <option value="fkip"${savedUnit==='fkip'?' selected':''}>FKIP</option>
        <option value="teknik"${savedUnit==='teknik'?' selected':''}>Teknik</option>
        <option value="ekonomi"${savedUnit==='ekonomi'?' selected':''}>Ekonomi</option>
        <option value="hukum"${savedUnit==='hukum'?' selected':''}>Hukum</option>
        <option value="kedokteran"${savedUnit==='kedokteran'?' selected':''}>Kedokteran</option>
        <option value="fasilkom"${savedUnit==='fasilkom'?' selected':''}>FASILKOM</option>
        <option value="pertanian"${savedUnit==='pertanian'?' selected':''}>Pertanian</option>
        <option value="mipa"${savedUnit==='mipa'?' selected':''}>MIPA</option>
        <option value="fisip"${savedUnit==='fisip'?' selected':''}>FISIP</option>
        <option value="kesmas"${savedUnit==='kesmas'?' selected':''}>Kesmas</option>
      </select>
    </div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page || 'beranda';

  document.getElementById('sidebar').innerHTML = buildSidebarHTML(page);
  document.getElementById('topHeader').innerHTML = buildHeaderHTML(page);

  const dark = localStorage.getItem('iku-theme') === 'dark';
  if (dark) applyTheme(true);

  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
    document.getElementById('mainWrap').classList.toggle('expanded');
  });

  document.querySelectorAll('.nav-group-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.nav-group');
      const open = !group.classList.contains('open');
      group.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  document.getElementById('themeToggle').addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme !== 'dark');
  });

  document.getElementById('filterTahun').addEventListener('change', e => {
    localStorage.setItem('iku-year', e.target.value);
    document.getElementById('headerYear').textContent = e.target.value;
    window.dispatchEvent(new CustomEvent('iku:filtersChanged', { detail: { year: e.target.value } }));
  });

  document.getElementById('filterFakultas').addEventListener('change', e => {
    localStorage.setItem('iku-unit', e.target.value);
    window.dispatchEvent(new CustomEvent('iku:filtersChanged', { detail: { unit: e.target.value } }));
  });
});

function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  const lbl = document.querySelector('.theme-label');
  if (lbl) lbl.textContent = dark ? 'Mode Terang' : 'Mode Gelap';
  localStorage.setItem('iku-theme', dark ? 'dark' : 'light');
}
