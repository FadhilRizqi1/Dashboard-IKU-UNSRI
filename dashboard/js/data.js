/* js/data.js — Mock data for all 11 IKU */

const TAHUN = ['2020','2021','2022','2023','2024'];
const FAKULTAS = ['FKIP','Teknik','Ekonomi','Hukum','Kedokteran','FASILKOM','Pertanian','MIPA','FISIP','Kesmas'];

const DATA = {

  /* ── IKU 1: Angka Efisiensi Edukasi ─── */
  iku1: {
    summary: { nilai: 43.2, target: 40, satuan: '%', status: 'good' },
    tren: {
      labels: TAHUN,
      efisiensi: [34.1, 36.8, 38.5, 41.2, 43.2],
      lulus: [3241, 3480, 3612, 3890, 4102],
    },
    perFakultas: {
      labels: FAKULTAS,
      nilai: [47, 52, 38, 55, 62, 44, 36, 41, 39, 48],
    }
  },

  /* ── IKU 2: Lulusan Berdampak ────────── */
  iku2: {
    summary: { nilai: 82.4, target: 80, satuan: '%', status: 'good' },
    status: {
      labels: TAHUN,
      datasets: [
        { label: 'Bekerja Formal',   data: [52, 54, 56, 58, 60] },
        { label: 'Wirausaha',        data: [10, 11, 12, 13, 13] },
        { label: 'Studi Lanjut',     data: [7,  8,  8,  9,  9]  },
        { label: 'Bekerja Informal', data: [8,  7,  6,  5,  5]  },
      ]
    }
  },

  /* ── IKU 3: Mahasiswa di Luar Kampus ── */
  iku3: {
    summary: { nilai: 31.7, target: 30, satuan: '%', status: 'good' },
    mbkm: {
      labels: ['Gasal 22','Genap 22','Gasal 23','Genap 23','Gasal 24','Genap 24'],
      datasets: [
        { label: 'Magang Industri',       data: [420,390,510,480,620,580] },
        { label: 'Asistensi Mengajar',     data: [180,160,220,200,260,240] },
        { label: 'KKN Tematik',           data: [310,290,360,340,410,390] },
        { label: 'Penelitian',            data: [90, 80, 110,100,130,120] },
        { label: 'Studi Independen',      data: [60, 55, 80, 70, 100,90]  },
        { label: 'Pertukaran Pelajar',    data: [45, 40, 55, 50, 70, 65]  },
        { label: 'Wirausaha Merdeka',     data: [30, 25, 40, 35, 55, 50]  },
      ]
    }
  },

  /* ── IKU 4: Dosen Rekognisi Internasional */
  iku4: {
    summary: { nilai: 18.3, target: 20, satuan: '%', status: 'warning' },
    negara: {
      labels: ['Australia','Malaysia','Jepang','Amerika Serikat','Jerman','Belanda','Inggris','Korea Selatan','Prancis','Kanada'],
      data:   [38, 31, 28, 22, 18, 15, 12, 10, 8, 7],
    },
    tren: {
      labels: TAHUN,
      data:   [11.2, 13.4, 15.1, 16.8, 18.3],
    }
  },

  /* ── IKU 5: Rasio Luaran Kerjasama ───── */
  iku5: {
    summary: { nilai: 27.8, target: 25, satuan: '%', status: 'good' },
    data: {
      labels: TAHUN,
      luaran:  [42, 55, 68, 82, 97],
      kontrak: [4.2, 5.8, 7.1, 9.3, 11.6], // miliar Rp
    }
  },

  /* ── IKU 6: Publikasi Bereputasi ──────── */
  iku6: {
    summary: { nilai: 847, target: 700, satuan: 'artikel', status: 'good' },
    kuartil: {
      labels: TAHUN,
      datasets: [
        { label: 'Q1 Scopus', data: [58, 74, 95, 118, 142] },
        { label: 'Q2 Scopus', data: [112,138,165,189,218] },
        { label: 'Q3 Scopus', data: [89, 105,128,147,168] },
        { label: 'Q4 Scopus', data: [44,  55, 63,  71,  82] },
        { label: 'WoS',       data: [21,  28, 35,  43,  52] },
      ]
    }
  },

  /* ── IKU 7: Keterlibatan SDGs ─────────── */
  iku7: {
    summary: { nilai: 14, target: 12, satuan: 'SDG aktif', status: 'good' },
    sdg: {
      labels: [
        'SDG 1 Tanpa Kemiskinan','SDG 2 Tanpa Kelaparan','SDG 3 Kesehatan',
        'SDG 4 Pendidikan Berkualitas','SDG 5 Kesetaraan Gender','SDG 6 Air Bersih',
        'SDG 7 Energi Bersih','SDG 8 Pekerjaan Layak','SDG 9 Industri & Inovasi',
        'SDG 10 Berkurangnya Kesenjangan','SDG 11 Kota Berkelanjutan',
        'SDG 12 Konsumsi Bertanggung Jawab','SDG 13 Penanganan Iklim',
        'SDG 14 Ekosistem Lautan','SDG 15 Ekosistem Darat',
        'SDG 16 Perdamaian','SDG 17 Kemitraan',
      ],
      datasets: [
        { label: 'Penelitian', data: [8,12,22,18,9,7,11,14,19,6,10,5,8,4,7,5,12] },
        { label: 'Pengabdian', data: [14,18,16,25,12,9,8,11,7,10,8,6,5,3,6,8,9]  },
        { label: 'Kerjasama',  data: [3, 4, 8, 6, 4, 3, 5, 6, 9,3, 4,2, 3,2, 3,2, 5]  },
      ]
    }
  },

  /* ── IKU 8: Dosen dalam Kebijakan Publik */
  iku8: {
    summary: { nilai: 12.1, target: 10, satuan: '%', status: 'good' },
    peran: {
      labels: ['Gasal 22','Genap 22','Gasal 23','Genap 23','Gasal 24','Genap 24'],
      datasets: [
        { label: 'Narasumber',      data: [28,25,34,31,42,38] },
        { label: 'Tim Ahli',        data: [12,10,15,14,19,17] },
        { label: 'Konsultan',       data: [8, 7, 10, 9, 13,12] },
        { label: 'Reviewer Kebijakan', data: [5, 4, 7,  6,  9, 8]  },
        { label: 'Anggota Dewan',   data: [3, 3,  4,  4,  5, 5]  },
      ]
    }
  },

  /* ── IKU 9: Pendapatan Non-Pendidikan ─── */
  iku9: {
    summary: { nilai: 18.4, target: 16, satuan: '%', status: 'good' },
    pendapatan: {
      labels: TAHUN,
      datasets: [
        { label: 'Penelitian',       data: [8.2,  9.4, 11.1, 13.2, 15.8] },
        { label: 'Kerjasama Industri', data: [3.1, 3.8,  4.6,  5.9,  7.2] },
        { label: 'Hibah Kompetisi',  data: [5.4,  6.1,  7.3,  8.8, 10.4] },
        { label: 'Sewa & Fasilitas', data: [1.8,  2.1,  2.4,  2.8,  3.2] },
        { label: 'Jasa Konsultansi', data: [0.9,  1.1,  1.4,  1.8,  2.3] },
      ]
    }
  },

  /* ── IKU 10: Zona Integritas ─────────── */
  iku10: {
    summary: { nilai: 79.4, target: 75, satuan: 'poin', status: 'good' },
    unit: {
      labels: ['Rektorat','FKIP','Teknik','Kedokteran','Ekonomi','Hukum','FASILKOM','Pertanian','MIPA','FISIP','Kesmas','LPPM'],
      nilai:  [85, 78, 82, 88, 76, 79, 83, 71, 77, 73, 80, 84],
      target: 75,
    }
  },

  /* ── IKU 11: Integritas & Akuntabilitas  */
  iku11: {
    summary: { nilai: 'WTP', target: 'WTP', satuan: '', status: 'good' },
    komponen: {
      labels: ['Laporan Keuangan','Pengelolaan BMN','Sistem Pengendalian Intern','Kepatuhan Perundangan','Pengelolaan SDM','Pengadaan Barang/Jasa'],
      nilai:  [92, 85, 78, 88, 82, 79],
    },
    catatan: [
      { komponen: 'Laporan Keuangan',            status: 'Baik',           catatan: 'Opini WTP tanpa catatan material.' },
      { komponen: 'Pengelolaan BMN',             status: 'Baik',           catatan: 'Inventarisasi aset selesai 100%.' },
      { komponen: 'Sistem Pengendalian Intern',  status: 'Perlu Perhatian', catatan: 'Terdapat 3 temuan minor SPI yang sedang ditindaklanjuti.' },
      { komponen: 'Kepatuhan Perundangan',       status: 'Baik',           catatan: 'Seluruh regulasi telah dipatuhi.' },
      { komponen: 'Pengelolaan SDM',             status: 'Baik',           catatan: 'Dokumen kepegawaian lengkap dan tertib.' },
      { komponen: 'Pengadaan Barang/Jasa',       status: 'Perlu Perhatian', catatan: 'Dua paket pengadaan perlu penyesuaian dokumentasi.' },
    ]
  },

  /* ── KPI Overview cards ──────────────── */
  kpiCards: [
    { id:'iku1',  no:'IKU 1',  nama:'Angka Efisiensi Edukasi',          nilai:43.2, target:40,  satuan:'%',       status:'good'    },
    { id:'iku2',  no:'IKU 2',  nama:'Lulusan Berdampak',                 nilai:82.4, target:80,  satuan:'%',       status:'good'    },
    { id:'iku3',  no:'IKU 3',  nama:'Mahasiswa di Luar Kampus',          nilai:31.7, target:30,  satuan:'%',       status:'good'    },
    { id:'iku4',  no:'IKU 4',  nama:'Dosen Rekognisi Internasional',     nilai:18.3, target:20,  satuan:'%',       status:'warning' },
    { id:'iku5',  no:'IKU 5',  nama:'Rasio Luaran Kerjasama',            nilai:27.8, target:25,  satuan:'%',       status:'good'    },
    { id:'iku6',  no:'IKU 6',  nama:'Publikasi Bereputasi',              nilai:847,  target:700, satuan:'artikel', status:'good'    },
    { id:'iku7',  no:'IKU 7',  nama:'Keterlibatan SDGs',                 nilai:14,   target:12,  satuan:'SDG',     status:'good'    },
    { id:'iku8',  no:'IKU 8',  nama:'Dosen dalam Kebijakan Publik',      nilai:12.1, target:10,  satuan:'%',       status:'good'    },
    { id:'iku9',  no:'IKU 9',  nama:'Pendapatan Non-Pendidikan',         nilai:18.4, target:16,  satuan:'%',       status:'good'    },
    { id:'iku10', no:'IKU 10', nama:'Zona Integritas',                   nilai:79.4, target:75,  satuan:'poin',    status:'good'    },
    { id:'iku11', no:'IKU 11', nama:'Integritas & Akuntabilitas',        nilai:'WTP',target:'WTP',satuan:'',       status:'good'    },
  ]
};
