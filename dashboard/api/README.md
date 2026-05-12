# Dashboard IKU API

API ini membaca dataset IKU dari MySQL/MariaDB Laragon dan mengembalikan struktur JSON yang kompatibel dengan dashboard Chart.js.

## Setup Lokal

1. Pastikan MySQL/MariaDB Laragon aktif.
2. Import seed:
   ```powershell
   php -r "`$pdo=new PDO('mysql:host=127.0.0.1;port=3306;charset=utf8mb4','root','',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]); `$pdo->exec(file_get_contents('.tmp/iku_dataset/iku_dummy_seed.sql'));"
   ```
3. Jalankan server dashboard:
   ```powershell
   php -S 127.0.0.1:8011 -t dashboard
   ```
4. Buka:
   - `http://127.0.0.1:8011/index.html`
   - `http://127.0.0.1:8011/api/data.php?year=2024`
   - `http://127.0.0.1:8011/api/table.php?iku=iku5&year=2024`
   - `http://127.0.0.1:8011/api/data.php?year=2024&unit=fasilkom`

## Konfigurasi Database

Default konfigurasi ada di `config.php`:

| Env var | Default |
|---------|---------|
| `IKU_DB_HOST` | `127.0.0.1` |
| `IKU_DB_PORT` | `3306` |
| `IKU_DB_NAME` | `dashboard_iku_unsri` |
| `IKU_DB_USER` | `root` |
| `IKU_DB_PASS` | kosong |

Jika API tidak bisa terhubung ke database, `dashboard/js/data-api.js` akan memakai fallback dari `dashboard/js/data.js`.

## Endpoint

| Endpoint | Fungsi |
|----------|--------|
| `api/data.php?year=2024` | Mengembalikan data ringkasan dan struktur chart seluruh IKU. |
| `api/data.php?year=2024&unit=fasilkom` | Mengembalikan data chart/statistik yang difilter ke fakultas tertentu. Gunakan `unit=all` untuk agregat universitas. |
| `api/table.php?iku=iku5&year=2024` | Mengembalikan data tabel pendukung untuk halaman tertentu. Gunakan `iku=beranda` untuk tabel ringkasan. |
| `api/table.php?iku=iku5&year=2024&unit=fasilkom` | Mengembalikan tabel detail yang difilter ke fakultas tertentu jika tabel IKU tersebut memiliki kolom unit/fakultas. |

Nilai `unit` yang didukung: `all`, `fkip`, `teknik`, `ekonomi`, `hukum`, `kedokteran`, `fasilkom`, `pertanian`, `mipa`, `fisip`, `kesmas`.
