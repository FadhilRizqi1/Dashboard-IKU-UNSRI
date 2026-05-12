# Dashboard IKU Universitas Sriwijaya

Dashboard ini dibuat untuk memvisualisasikan capaian 11 Indikator Kinerja Utama (IKU) Universitas Sriwijaya berbasis data dummy yang terstruktur, masuk akal, dan dapat dijalankan secara lokal. Proyek ini mendukung tampilan ringkasan, halaman detail per IKU, chart interaktif, tabel data pendukung, filter tahun, filter fakultas, serta API lokal berbasis PHP dan MySQL/MariaDB Laragon.

> Catatan: dataset di proyek ini adalah data dummy/simulasi untuk kebutuhan visualisasi data dan dokumentasi laporan, bukan data resmi Universitas Sriwijaya.

## Tujuan Proyek

- Menyediakan dashboard IKU yang ringkas, jelas, dan mudah dipakai untuk monitoring capaian akademik dan tata kelola.
- Menampilkan 11 IKU dalam halaman ringkasan dan halaman detail.
- Menghubungkan dashboard ke database lokal agar data tidak hanya hardcoded di frontend.
- Membuat dataset dummy yang konsisten, berpola, dan dapat diekspor ke CSV/XLSX.
- Menyediakan tabel data di website agar pengguna dapat melihat data pendukung di balik visualisasi.
- Mendokumentasikan alasan pemilihan chart berdasarkan kebutuhan pengguna.

## Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Visualisasi | Chart.js |
| Backend API | PHP native dengan PDO |
| Database lokal | MySQL/MariaDB via Laragon |
| Dataset generator | Python |
| Export data | CSV dan XLSX |
| Dokumentasi | Markdown |

Pemilihan stack dibuat sederhana agar mudah dijalankan secara lokal, cocok dengan Laragon, dan tidak membutuhkan framework besar.

## Fitur Utama

### Dashboard Ringkasan

Halaman `index.html` menampilkan kartu ringkasan 11 IKU, nilai capaian, target, satuan, progress bar, dan status capaian.

### Halaman Detail IKU

Setiap IKU memiliki halaman sendiri:

| Halaman | Indikator |
|---------|-----------|
| `iku1.html` | Angka Efisiensi Edukasi |
| `iku2.html` | Lulusan Berdampak |
| `iku3.html` | Mahasiswa di Luar Kampus |
| `iku4.html` | Dosen Rekognisi Internasional |
| `iku5.html` | Rasio Luaran Kerjasama |
| `iku6.html` | Publikasi Bereputasi |
| `iku7.html` | Keterlibatan SDGs |
| `iku8.html` | Dosen dalam Kebijakan Publik |
| `iku9.html` | Pendapatan Non-Pendidikan |
| `iku10.html` | Zona Integritas |
| `iku11.html` | Integritas & Akuntabilitas |

### Navigasi IKU Berkelompok

Navbar kiri mengelompokkan IKU menjadi:

| Kelompok | IKU |
|----------|-----|
| Talenta | IKU 1-4 |
| Inovasi | IKU 5-6 |
| Kontribusi Masyarakat | IKU 7-8 |
| Tata Kelola | IKU 9-11 |

Setiap kelompok dapat dibuka/tutup melalui dropdown di sidebar.

### Filter

Dashboard menyediakan filter:

- Tahun: `2020` sampai `2024`
- Fakultas: `Semua Fakultas`, `FKIP`, `Teknik`, `Ekonomi`, `Hukum`, `Kedokteran`, `FASILKOM`, `Pertanian`, `MIPA`, `FISIP`, `Kesmas`

Filter fakultas sudah terhubung ke API melalui parameter `unit`. Filter prodi sengaja tidak ditampilkan karena dataset saat ini belum memiliki dimensi program studi yang kuat.

### Tabel Data

Setiap halaman memiliki panel **Data Tabel** yang tampil otomatis. Tabel dapat disembunyikan melalui tombol **Sembunyikan Tabel**.

Fitur tabel:

- Mengambil data dari database melalui API.
- Menampilkan 100 baris per halaman.
- Memiliki pagination `Sebelumnya`, nomor halaman, dan `Berikutnya`.
- Mengikuti filter tahun dan fakultas.

### Dark Mode

Dashboard memiliki tombol mode gelap/terang di sidebar. Pilihan tema disimpan di `localStorage`.

## Struktur Folder

```text
.
├── dashboard/
│   ├── api/
│   │   ├── config.php
│   │   ├── data.php
│   │   ├── db.php
│   │   ├── table.php
│   │   └── README.md
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js
│   │   ├── data.js
│   │   ├── data-api.js
│   │   └── nav.js
│   ├── index.html
│   └── iku1.html ... iku11.html
├── directives/
│   └── build_iku_dashboard_data.md
├── docs/
│   └── dashboard_chart_rationale.md
├── execution/
│   ├── extract_pdf_text.py
│   ├── generate_iku_dataset.py
│   └── utils.py
├── .tmp/
│   └── iku_dataset/
│       ├── csv/
│       ├── iku_dummy_dataset.xlsx
│       ├── iku_dummy_seed.sql
│       └── data_dictionary.md
├── requirements.txt
└── README.md
```

## Dataset Dummy

Dataset dibuat menggunakan script:

```powershell
.\.venv\Scripts\python.exe execution\generate_iku_dataset.py
```

Output dataset:

| Output | Fungsi |
|--------|--------|
| `.tmp/iku_dataset/csv/*.csv` | Data per tabel dalam format CSV |
| `.tmp/iku_dataset/iku_dummy_dataset.xlsx` | Workbook Excel untuk dokumentasi |
| `.tmp/iku_dataset/iku_dummy_seed.sql` | SQL seed untuk database Laragon |
| `.tmp/iku_dataset/data_dictionary.md` | Kamus data |

Dataset dibuat agar tidak terlalu acak. Nilai memiliki tren tahunan, variasi antar fakultas, numerator/denominator, dan hubungan yang masih masuk akal untuk divisualisasikan.

## Database

Database default:

```text
dashboard_iku_unsri
```

Konfigurasi API berada di:

```text
dashboard/api/config.php
```

Default koneksi:

| Konfigurasi | Nilai |
|-------------|-------|
| Host | `127.0.0.1` |
| Port | `3306` |
| Database | `dashboard_iku_unsri` |
| User | `root` |
| Password | kosong |

Konfigurasi juga dapat diatur melalui environment variable:

| Env var | Fungsi |
|---------|--------|
| `IKU_DB_HOST` | Host database |
| `IKU_DB_PORT` | Port database |
| `IKU_DB_NAME` | Nama database |
| `IKU_DB_USER` | Username database |
| `IKU_DB_PASS` | Password database |

## Cara Menjalankan Lokal

### 1. Aktifkan Laragon

Pastikan Apache/PHP dan MySQL/MariaDB Laragon aktif.

### 2. Install Dependency Python

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Jika environment memakai path MSYS/Git Bash, gunakan path Python yang sesuai dengan environment lokal.

### 3. Generate Dataset

```powershell
.\.venv\Scripts\python.exe execution\generate_iku_dataset.py
```

### 4. Import Database

```powershell
php -r "`$pdo=new PDO('mysql:host=127.0.0.1;port=3306;charset=utf8mb4','root','',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]); `$pdo->exec(file_get_contents('.tmp/iku_dataset/iku_dummy_seed.sql'));"
```

Perintah ini membaca file SQL seed dan membuat database `dashboard_iku_unsri`.

### 5. Jalankan Server Lokal

```powershell
php -S 127.0.0.1:8011 -t dashboard
```

### 6. Buka Dashboard

```text
http://127.0.0.1:8011/index.html
```

## API Endpoint

### Data Chart dan Statistik

```text
api/data.php?year=2024
api/data.php?year=2024&unit=fasilkom
```

Parameter:

| Parameter | Contoh | Keterangan |
|-----------|--------|------------|
| `year` | `2024` | Tahun laporan |
| `unit` | `all`, `fasilkom`, `teknik` | Filter fakultas |

### Data Tabel

```text
api/table.php?iku=iku5&year=2024
api/table.php?iku=iku5&year=2024&unit=fasilkom
```

Parameter:

| Parameter | Contoh | Keterangan |
|-----------|--------|------------|
| `iku` | `beranda`, `iku1`, `iku5` | Halaman/indikator yang diminta |
| `year` | `2024` | Tahun laporan |
| `unit` | `all`, `fasilkom`, `teknik` | Filter fakultas |

Nilai `unit` yang didukung:

```text
all, fkip, teknik, ekonomi, hukum, kedokteran, fasilkom, pertanian, mipa, fisip, kesmas
```

## Sumber Data dan Panduan

Dokumen yang digunakan sebagai dasar konsep:

- `SOSIALISASI PANDUAN IKU DIKTISAINTEK BERDAMPAK.pdf`
- `Panduan Project Akhir Visualisasi Data.docx.pdf`
- `IKU UNSRI 2024.pdf`

Catatan interpretasi:

- Panduan Diktisaintek Berdampak digunakan sebagai sumber utama karena dashboard memakai model 11 IKU.
- Dokumen IKU UNSRI 2024 dipakai sebagai konteks historis karena masih mengikuti framework lama 8 IKU.
- Dataset final tetap dummy/simulasi agar aman digunakan untuk tugas visualisasi.

## Alasan Pemilihan Chart

Dokumentasi alasan pemilihan chart tersedia di:

```text
docs/dashboard_chart_rationale.md
```

Ringkasan pendek:

| IKU | Chart Utama | Alasan |
|-----|-------------|--------|
| IKU 1 | Line chart dan horizontal bar | Melihat tren efisiensi dan membandingkan fakultas |
| IKU 2 | Stacked bar | Menunjukkan komposisi status lulusan |
| IKU 3 | Stacked bar | Menampilkan peserta program MBKM per semester |
| IKU 4 | Horizontal bar dan line chart | Membandingkan negara tujuan dan tren rekognisi |
| IKU 5 | Line chart | Menghindari tabrakan dual-axis dan fokus pada tren rasio |
| IKU 6 | Stacked bar | Menampilkan komposisi publikasi per kuartil |
| IKU 7 | Stacked horizontal bar | Cocok untuk banyak kategori SDGs |
| IKU 8 | Stacked bar | Menampilkan peran dosen/SDM dalam kebijakan |
| IKU 9 | Stacked bar | Menunjukkan struktur pendapatan non-pendidikan |
| IKU 10 | Bar chart dengan garis target | Membandingkan nilai ZI per unit |
| IKU 11 | Horizontal bar dan tabel | Menggabungkan skor audit dengan catatan auditor |

## Catatan Perhitungan

Sebagian besar nilai IKU dihitung dari tabel pendukung, bukan ditulis manual di frontend.

Contoh:

- IKU 2 dihitung dari data tracer outcome.
- IKU 3 dihitung dari jumlah peserta kegiatan luar prodi dibanding mahasiswa aktif.
- IKU 5 dihitung dari jumlah luaran kerja sama dibanding total dosen.
- IKU 6 dihitung dari skor publikasi berbobot dibanding total publikasi.
- IKU 7 dihitung dari jumlah program SDGs dibanding total program unit.
- IKU 8 dihitung dari jumlah SDM terlibat dibanding total SDM.

Untuk IKU yang tidak memiliki dimensi fakultas pada dataset saat ini, seperti IKU 9 dan IKU 11, data tetap ditampilkan sebagai agregat universitas.

## Validasi

Perintah validasi yang dapat digunakan:

```powershell
php -l dashboard/api/data.php
php -l dashboard/api/table.php
node --check dashboard/js/app.js
node --check dashboard/js/nav.js
node --check dashboard/js/data-api.js
```

Tes endpoint:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8011/api/data.php?year=2024&unit=fasilkom"
Invoke-RestMethod -Uri "http://127.0.0.1:8011/api/table.php?iku=iku7&year=2024&unit=fasilkom"
```

## Troubleshooting

| Masalah | Penyebab Umum | Solusi |
|---------|---------------|--------|
| Dashboard masih menampilkan data lama | Browser cache | Hard refresh dengan `Ctrl + F5` |
| API gagal diakses | Server PHP belum berjalan | Jalankan `php -S 127.0.0.1:8011 -t dashboard` |
| API database error | Laragon/MySQL belum aktif | Aktifkan MySQL/MariaDB di Laragon |
| Tabel kosong | Database belum diimport | Import `.tmp/iku_dataset/iku_dummy_seed.sql` |
| Filter fakultas tidak berubah | JS lama masih tersimpan di browser | Hard refresh, lalu cek endpoint `api/data.php?year=2024&unit=fasilkom` |
| Python gagal import `openpyxl` | Dependency belum terinstall | Jalankan `.\.venv\Scripts\python.exe -m pip install -r requirements.txt` |

## Batasan

- Dataset masih dummy/simulasi.
- Filter prodi belum tersedia karena dataset belum memiliki dimensi program studi.
- Beberapa IKU tetap agregat universitas karena data pendukungnya tidak berbasis fakultas.
- Dashboard ditujukan untuk penggunaan lokal, bukan deployment produksi.
- Autentikasi pengguna belum diterapkan.
