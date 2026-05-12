<?php

declare(strict_types=1);

require __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

try {
    $pdo = iku_pdo();
    $year = isset($_GET['year']) ? (int) $_GET['year'] : 2024;
    $unit = sanitize_unit($pdo, $_GET['unit'] ?? 'all');
    $years = array_map('intval', array_column(iku_rows($pdo, 'SELECT year FROM periods ORDER BY year'), 'year'));
    if (!in_array($year, $years, true)) {
        $year = max($years);
    }

    $data = build_dashboard_data($pdo, $year, $years, $unit);
    echo json_encode([
        'ok' => true,
        'source' => 'database',
        'year' => $year,
        'data' => $data,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => $error->getMessage(),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function build_dashboard_data(PDO $pdo, int $year, array $years, string $unit): array
{
    $measurements = iku_rows($pdo, 'SELECT * FROM iku_measurements ORDER BY indicator_id, year');
    $measurementByIkuYear = [];
    foreach ($measurements as $row) {
        $measurementByIkuYear[$row['indicator_id']][(int) $row['year']] = $row;
    }

    $indicators = iku_rows($pdo, 'SELECT * FROM iku_indicators ORDER BY indicator_no');
    $labels = array_map('strval', $years);
    $data = [
        'iku1' => build_iku1($pdo, $year, $years, $labels, $measurementByIkuYear, $unit),
        'iku2' => build_iku2($pdo, $year, $years, $labels, $measurementByIkuYear, $unit),
        'iku3' => build_iku3($pdo, $year, $years, $measurementByIkuYear, $unit),
        'iku4' => build_iku4($pdo, $year, $years, $labels, $measurementByIkuYear, $unit),
        'iku5' => build_iku5($pdo, $year, $years, $labels, $measurementByIkuYear, $unit),
        'iku6' => build_iku6($pdo, $year, $years, $labels, $measurementByIkuYear, $unit),
        'iku7' => build_iku7($pdo, $year, $measurementByIkuYear, $unit),
        'iku8' => build_iku8($pdo, $year, $years, $labels, $measurementByIkuYear, $unit),
        'iku9' => build_iku9($pdo, $year, $years, $labels, $measurementByIkuYear),
        'iku10' => build_iku10($pdo, $year, $measurementByIkuYear, $unit),
        'iku11' => build_iku11($pdo, $year, $measurementByIkuYear),
    ];
    $data['kpiCards'] = kpi_cards_from_pages($indicators, $data);
    return $data;
}

function build_iku1(PDO $pdo, int $year, array $years, array $labels, array $m, string $unit): array
{
    $trend = [];
    foreach ($years as $itemYear) {
        if ($unit === 'all') {
            $trend[] = number_value($m['iku1'][$itemYear]['value'] ?? 0);
            continue;
        }
        $trendRow = iku_one($pdo, 'SELECT ROUND(AVG(achievement_percent), 2) value FROM aee_by_level_unit_year WHERE year = :year AND unit_id = :unit', [
            'year' => $itemYear,
            'unit' => $unit,
        ]);
        $trend[] = number_value($trendRow['value'] ?? 0);
    }
    $graduatedRows = iku_rows($pdo, 'SELECT year, SUM(graduated_on_time) total FROM aee_by_level_unit_year WHERE 1=1' . unit_clause($unit) . ' GROUP BY year ORDER BY year', unit_params([], $unit));
    $graduatedByYear = key_values($graduatedRows, 'year', 'total');
    $facultyRows = iku_rows($pdo, "SELECT u.unit_name label, ROUND(AVG(a.achievement_percent), 2) value
        FROM aee_by_level_unit_year a JOIN units u ON u.unit_id = a.unit_id
        WHERE a.year = :year" . unit_clause($unit, 'a') . " GROUP BY u.unit_name ORDER BY value DESC", unit_params(['year' => $year], $unit));
    $best = $facultyRows[0] ?? ['label' => '-', 'value' => 0];
    $current = $trend[array_search($year, $years, true)] ?? number_value($m['iku1'][$year]['value'] ?? 0);
    $previous = $trend[array_search($year - 1, $years, true)] ?? $current;

    return [
        'summary' => metric_summary($current, 85, '%'),
        'stats' => [
            kpi_stat('Capaian AEE ' . $year, percent_text($current), 'Target >= 85% pencapaian ideal'),
            kpi_stat('Lulus Tepat Waktu', int_text($graduatedByYear[$year] ?? 0), 'Seluruh jenjang'),
            kpi_stat('Tren', signed_text($current - $previous, ' pp'), 'vs ' . ($year - 1)),
            kpi_stat('Fakultas Terbaik', $best['label'], percent_text((float) $best['value']) . ' pencapaian'),
        ],
        'tren' => [
            'labels' => $labels,
            'efisiensi' => $trend,
            'lulus' => array_map(fn ($itemYear) => (int) ($graduatedByYear[$itemYear] ?? 0), $years),
        ],
        'perFakultas' => [
            'labels' => array_column($facultyRows, 'label'),
            'nilai' => array_map(fn ($row) => number_value($row['value']), $facultyRows),
        ],
    ];
}

function build_iku2(PDO $pdo, int $year, array $years, array $labels, array $m, string $unit): array
{
    $outcomes = ['Bekerja formal', 'Wirausaha', 'Studi lanjut', 'Bekerja informal'];
    $datasets = [];
    foreach ($outcomes as $outcome) {
        $values = [];
        foreach ($years as $itemYear) {
            $row = iku_one($pdo, 'SELECT SUM(respondents) respondents, MAX(total_respondents) total_respondents
                FROM tracer_outcomes WHERE year = :year AND outcome = :outcome' . unit_clause($unit), unit_params(['year' => $itemYear, 'outcome' => $outcome], $unit));
            $totalRow = iku_one($pdo, 'SELECT SUM(total_respondents) total FROM (SELECT DISTINCT unit_id, total_respondents FROM tracer_outcomes WHERE year = :year' . unit_clause($unit) . ') x', unit_params(['year' => $itemYear], $unit));
            $values[] = pct_value((float) ($row['respondents'] ?? 0), (float) ($totalRow['total'] ?? 0));
        }
        $datasets[] = ['label' => $outcome, 'data' => $values];
    }

    $formal = dataset_latest($datasets, 'Bekerja formal');
    $wirausaha = dataset_latest($datasets, 'Wirausaha');
    $studi = dataset_latest($datasets, 'Studi lanjut');
    $current = $formal + $wirausaha + $studi;

    return [
        'summary' => metric_summary($current, 80, '%'),
        'stats' => [
            kpi_stat('Lulusan Berdampak ' . $year, percent_text($current), 'Target >= 80%'),
            kpi_stat('Bekerja Formal', percent_text($formal), 'Tracer study'),
            kpi_stat('Wirausaha', percent_text($wirausaha), 'Tracer study'),
            kpi_stat('Studi Lanjut', percent_text($studi), 'Tracer study'),
        ],
        'status' => ['labels' => $labels, 'datasets' => $datasets],
    ];
}

function build_iku3(PDO $pdo, int $year, array $years, array $m, string $unit): array
{
    $activityTypes = array_column(iku_rows($pdo, 'SELECT DISTINCT activity_type FROM student_activities ORDER BY activity_type'), 'activity_type');
    $selectedYears = array_slice($years, -3);
    $labels = [];
    foreach ($selectedYears as $itemYear) {
        $labels[] = 'Gasal ' . substr((string) $itemYear, -2);
        $labels[] = 'Genap ' . substr((string) $itemYear, -2);
    }
    $datasets = [];
    foreach ($activityTypes as $activityType) {
        $values = [];
        foreach ($selectedYears as $itemYear) {
            foreach (['Gasal', 'Genap'] as $semester) {
                $row = iku_one($pdo, 'SELECT SUM(participants) total FROM student_activities WHERE year = :year AND semester = :semester AND activity_type = :activity' . unit_clause($unit),
                    unit_params(['year' => $itemYear, 'semester' => $semester, 'activity' => $activityType], $unit));
                $values[] = (int) ($row['total'] ?? 0);
            }
        }
        $datasets[] = ['label' => $activityType, 'data' => $values];
    }
    $participantsRow = iku_one($pdo, 'SELECT SUM(participants) total FROM student_activities WHERE year = :year' . unit_clause($unit), unit_params(['year' => $year], $unit));
    $activeRow = iku_one($pdo, 'SELECT SUM(total_active_students) total FROM (SELECT DISTINCT unit_id, total_active_students FROM student_activities WHERE year = :year' . unit_clause($unit) . ') x', unit_params(['year' => $year], $unit));
    $participants = number_value($participantsRow['total'] ?? 0);
    $current = pct_value($participants, (float) ($activeRow['total'] ?? 0));
    $top = top_activity($datasets);

    return [
        'summary' => metric_summary($current, 30, '%'),
        'stats' => [
            kpi_stat('Mahasiswa Luar Prodi ' . $year, percent_text($current), 'Target >= 30%'),
            kpi_stat('Total Peserta', int_text($participants), 'Gasal + Genap'),
            kpi_stat('Program Terpopuler', $top['label'], int_text($top['value']) . ' peserta'),
            kpi_stat('Program Aktif', count($activityTypes) . ' program', 'Kategori kegiatan'),
        ],
        'mbkm' => ['labels' => $labels, 'datasets' => $datasets],
    ];
}

function build_iku4(PDO $pdo, int $year, array $years, array $labels, array $m, string $unit): array
{
    $countryRows = iku_rows($pdo, 'SELECT country label, SUM(lecturer_count) value FROM lecturer_recognition WHERE year = :year' . unit_clause($unit) . ' GROUP BY country ORDER BY value DESC LIMIT 10', unit_params(['year' => $year], $unit));
    $trend = [];
    foreach ($years as $itemYear) {
        $row = iku_one($pdo, 'SELECT SUM(lecturer_count) total FROM lecturer_recognition WHERE year = :year' . unit_clause($unit), unit_params(['year' => $itemYear], $unit));
        $trend[] = (int) ($row['total'] ?? 0);
    }
    $countries = count(array_filter(array_column($countryRows, 'label')));
    $current = end($trend) ?: 0;
    $previous = $trend[count($trend) - 2] ?? $current;

    return [
        'summary' => metric_summary((float) $current, 20, 'dosen'),
        'stats' => [
            kpi_stat('Dosen Rekognisi ' . $year, int_text($m['iku4'][$year]['value'] ?? 0), 'Target >= 20 dosen'),
            kpi_stat('Negara Tujuan', $countries . ' negara', 'Top negara tampil di chart'),
            kpi_stat('Tren', signed_text($current - $previous, ' dosen'), 'vs ' . ($year - 1)),
            kpi_stat('Status', status_label($m['iku4'][$year]['status'] ?? 'good'), 'Capaian indikator'),
        ],
        'negara' => ['labels' => array_column($countryRows, 'label'), 'data' => array_map(fn ($row) => (int) $row['value'], $countryRows)],
        'tren' => ['labels' => $labels, 'data' => $trend],
    ];
}

function build_iku5(PDO $pdo, int $year, array $years, array $labels, array $m, string $unit): array
{
    $outputs = [];
    $contracts = [];
    $ratios = [];
    foreach ($years as $itemYear) {
        $row = iku_one($pdo, 'SELECT SUM(output_count) outputs, SUM(contract_value_billion) contracts FROM collaboration_outputs WHERE year = :year' . unit_clause($unit), unit_params(['year' => $itemYear], $unit));
        $outputs[] = (int) ($row['outputs'] ?? 0);
        $contracts[] = number_value($row['contracts'] ?? 0);
        $lecturerRow = iku_one($pdo, 'SELECT SUM(total_lecturers) total FROM (SELECT DISTINCT unit_id, total_lecturers FROM collaboration_outputs WHERE year = :year' . unit_clause($unit) . ') x', unit_params(['year' => $itemYear], $unit));
        $ratios[] = pct_value((float) ($row['outputs'] ?? 0), (float) ($lecturerRow['total'] ?? 0));
    }
    $current = $ratios[array_search($year, $years, true)] ?? 0;
    return [
        'summary' => metric_summary($current, 25, '%'),
        'stats' => [
            kpi_stat('Rasio Luaran ' . $year, percent_text($current), 'Target >= 25%'),
            kpi_stat('Jumlah Luaran', int_text($outputs[count($outputs) - 1] ?? 0), 'Produk kerja sama'),
            kpi_stat('Nilai Kontrak', 'Rp ' . number_text($contracts[count($contracts) - 1] ?? 0) . ' M', 'Tahun ' . $year),
            kpi_stat('Mitra Aktif', 'simulasi', 'Startup/industri/lembaga'),
        ],
        'data' => ['labels' => $labels, 'luaran' => $outputs, 'kontrak' => $contracts],
        'trenRasio' => $ratios,
    ];
}

function build_iku6(PDO $pdo, int $year, array $years, array $labels, array $m, string $unit): array
{
    $categories = iku_rows($pdo, 'SELECT DISTINCT quartile FROM publications ORDER BY quartile');
    $datasets = [];
    foreach ($categories as $category) {
        $quartile = $category['quartile'];
        $values = [];
        foreach ($years as $itemYear) {
            $row = iku_one($pdo, 'SELECT SUM(publication_count) total FROM publications WHERE year = :year AND quartile = :quartile' . unit_clause($unit), unit_params(['year' => $itemYear, 'quartile' => $quartile], $unit));
            $values[] = (int) ($row['total'] ?? 0);
        }
        $datasets[] = ['label' => $quartile, 'data' => $values];
    }
    $q1 = dataset_latest($datasets, 'Q1');
    $total = array_sum(array_map(fn ($dataset) => (int) end($dataset['data']), $datasets));
    $scoreRow = iku_one($pdo, 'SELECT SUM(weighted_score) score FROM publications WHERE year = :year' . unit_clause($unit), unit_params(['year' => $year], $unit));
    $publicationBase = iku_one($pdo, 'SELECT SUM(total_publications) total FROM (SELECT DISTINCT unit_id, total_publications FROM publications WHERE year = :year' . unit_clause($unit) . ') x', unit_params(['year' => $year], $unit));
    $current = pct_value((float) ($scoreRow['score'] ?? 0), (float) ($publicationBase['total'] ?? 0));
    return [
        'summary' => metric_summary($current, 50, '%'),
        'stats' => [
            kpi_stat('Skor Publikasi ' . $year, percent_text($current), 'Berbobot Scopus/WoS'),
            kpi_stat('Total Publikasi', int_text($total), 'Kategori bereputasi'),
            kpi_stat('Q1', int_text($q1), 'Kuartil terbaik'),
            kpi_stat('Target', percent_text($m['iku6'][$year]['target_value'] ?? 50), 'Rasio berbobot'),
        ],
        'kuartil' => ['labels' => $labels, 'datasets' => $datasets],
    ];
}

function build_iku7(PDO $pdo, int $year, array $m, string $unit): array
{
    $activityTypes = ['Pendidikan', 'Penelitian', 'Pengabdian', 'Kerja Sama'];
    $sdgRows = iku_rows($pdo, 'SELECT sdg FROM sdg_programs WHERE year = :year' . unit_clause($unit) . ' GROUP BY sdg ORDER BY sdg', unit_params(['year' => $year], $unit));
    $labels = array_column($sdgRows, 'sdg');
    $datasets = [];
    foreach ($activityTypes as $activityType) {
        $values = [];
        foreach ($labels as $sdg) {
            $row = iku_one($pdo, 'SELECT SUM(program_count) total FROM sdg_programs WHERE year = :year AND sdg = :sdg AND activity_type = :activity' . unit_clause($unit),
                unit_params(['year' => $year, 'sdg' => $sdg, 'activity' => $activityType], $unit));
            $values[] = (int) ($row['total'] ?? 0);
        }
        $datasets[] = ['label' => $activityType, 'data' => $values];
    }
    $totalRow = iku_one($pdo, 'SELECT SUM(program_count) total FROM sdg_programs WHERE year = :year' . unit_clause($unit), unit_params(['year' => $year], $unit));
    $denomRow = iku_one($pdo, 'SELECT SUM(total_programs) total FROM (SELECT DISTINCT unit_id, total_programs FROM sdg_programs WHERE year = :year' . unit_clause($unit) . ') x', unit_params(['year' => $year], $unit));
    $total = (int) ($totalRow['total'] ?? 0);
    $current = pct_value((float) $total, (float) ($denomRow['total'] ?? 0));
    $top = top_activity($datasets);
    return [
        'summary' => metric_summary($current, 60, '%'),
        'stats' => [
            kpi_stat('Keterlibatan SDG ' . $year, percent_text($m['iku7'][$year]['value'] ?? 0), 'Target >= 60%'),
            kpi_stat('Program Prioritas', int_text($total), 'SDG wajib + pilihan'),
            kpi_stat('Aktivitas Dominan', $top['label'], int_text($top['value']) . ' program'),
            kpi_stat('SDG Terpantau', count($labels) . ' SDG', 'Seluruh kategori'),
        ],
        'sdg' => ['labels' => $labels, 'datasets' => $datasets],
    ];
}

function build_iku8(PDO $pdo, int $year, array $years, array $labels, array $m, string $unit): array
{
    $roles = array_column(iku_rows($pdo, 'SELECT DISTINCT role FROM policy_involvement ORDER BY role'), 'role');
    $datasets = [];
    foreach ($roles as $role) {
        $values = [];
        foreach ($years as $itemYear) {
            $row = iku_one($pdo, 'SELECT SUM(involved_sdm) total FROM policy_involvement WHERE year = :year AND role = :role' . unit_clause($unit), unit_params(['year' => $itemYear, 'role' => $role], $unit));
            $values[] = (int) ($row['total'] ?? 0);
        }
        $datasets[] = ['label' => $role, 'data' => $values];
    }
    $top = top_latest($datasets);
    $involvedRow = iku_one($pdo, 'SELECT SUM(involved_sdm) total FROM policy_involvement WHERE year = :year' . unit_clause($unit), unit_params(['year' => $year], $unit));
    $sdmRow = iku_one($pdo, 'SELECT SUM(total_sdm) total FROM (SELECT DISTINCT unit_id, total_sdm FROM policy_involvement WHERE year = :year' . unit_clause($unit) . ') x', unit_params(['year' => $year], $unit));
    $involved = (float) ($involvedRow['total'] ?? 0);
    $current = pct_value($involved, (float) ($sdmRow['total'] ?? 0));
    return [
        'summary' => metric_summary($current, 10, '%'),
        'stats' => [
            kpi_stat('SDM Terlibat ' . $year, percent_text($current), 'Target >= 10%'),
            kpi_stat('Jumlah SDM', int_text($involved), 'Aktif di kebijakan'),
            kpi_stat('Peran Terbanyak', $top['label'], int_text($top['value']) . ' SDM'),
            kpi_stat('Cakupan', 'Nasional/Daerah', 'Termasuk industri'),
        ],
        'peran' => ['labels' => $labels, 'datasets' => $datasets],
    ];
}

function build_iku9(PDO $pdo, int $year, array $years, array $labels, array $m): array
{
    $sources = array_column(iku_rows($pdo, 'SELECT DISTINCT source FROM revenue ORDER BY source'), 'source');
    $datasets = [];
    foreach ($sources as $source) {
        $values = [];
        foreach ($years as $itemYear) {
            $row = iku_one($pdo, 'SELECT amount_billion FROM revenue WHERE year = :year AND source = :source', ['year' => $itemYear, 'source' => $source]);
            $values[] = number_value($row['amount_billion'] ?? 0);
        }
        $datasets[] = ['label' => $source, 'data' => $values];
    }
    $top = top_latest($datasets);
    return [
        'summary' => summary($m, 'iku9', $year),
        'stats' => [
            kpi_stat('Proporsi Non-Pendidikan', percent_text($m['iku9'][$year]['value'] ?? 0), 'Target >= 16%'),
            kpi_stat('Total Non-Pendidikan', 'Rp ' . number_text($m['iku9'][$year]['numerator'] ?? 0) . ' M', 'Tahun ' . $year),
            kpi_stat('Sumber Terbesar', $top['label'], 'Rp ' . number_text($top['value']) . ' M'),
            kpi_stat('Total Pendapatan', 'Rp ' . number_text($m['iku9'][$year]['denominator'] ?? 0) . ' M', 'Simulasi'),
        ],
        'pendapatan' => ['labels' => $labels, 'datasets' => $datasets],
    ];
}

function build_iku10(PDO $pdo, int $year, array $m, string $unit): array
{
    $rows = iku_rows($pdo, "SELECT u.unit_name label, z.zi_score value FROM integrity_zones z JOIN units u ON u.unit_id = z.unit_id WHERE z.year = :year" . unit_clause($unit, 'z') . " ORDER BY z.zi_score DESC", unit_params(['year' => $year], $unit));
    $scores = array_map(fn ($row) => number_value($row['value']), $rows);
    $average = count($scores) ? array_sum($scores) / count($scores) : 0;
    $unitCount = count($scores);
    return [
        'summary' => metric_summary((float) $unitCount, 2, 'unit'),
        'stats' => [
            kpi_stat('Usulan ZI ' . $year, int_text($unitCount), 'Target >= 2 unit'),
            kpi_stat('Rata-rata Skor', number_text($average), 'Kesiapan ZI'),
            kpi_stat('Unit >= 75', count(array_filter($scores, fn ($score) => $score >= 75)) . ' / ' . count($scores), 'Passing grade simulasi'),
            kpi_stat('Predikat Fokus', 'WBK/WBBM', 'Zona Integritas'),
        ],
        'unit' => ['labels' => array_column($rows, 'label'), 'nilai' => $scores, 'target' => 75],
    ];
}

function build_iku11(PDO $pdo, int $year, array $m): array
{
    $rows = iku_rows($pdo, 'SELECT component, score, status, note FROM audit_components WHERE year = :year ORDER BY score DESC', ['year' => $year]);
    return [
        'summary' => summary($m, 'iku11', $year),
        'stats' => [
            kpi_stat('Opini Audit ' . $year, 'WTP', 'Wajar Tanpa Pengecualian'),
            kpi_stat('Nilai Tertinggi', number_text(max(array_column($rows, 'score') ?: [0])), 'Komponen audit'),
            kpi_stat('Nilai Terendah', number_text(min(array_column($rows, 'score') ?: [0])), 'Komponen audit'),
            kpi_stat('Perlu Perhatian', count(array_filter($rows, fn ($row) => $row['status'] !== 'Baik')), 'Komponen'),
        ],
        'komponen' => ['labels' => array_column($rows, 'component'), 'nilai' => array_map(fn ($row) => number_value($row['score']), $rows)],
        'catatan' => array_map(fn ($row) => ['komponen' => $row['component'], 'status' => $row['status'], 'catatan' => $row['note']], $rows),
    ];
}

function short_name(int $number): string
{
    $names = [
        1 => 'Angka Efisiensi Edukasi',
        2 => 'Lulusan Berdampak',
        3 => 'Mahasiswa di Luar Kampus',
        4 => 'Dosen Rekognisi Internasional',
        5 => 'Rasio Luaran Kerjasama',
        6 => 'Publikasi Bereputasi',
        7 => 'Keterlibatan SDGs',
        8 => 'Dosen dalam Kebijakan Publik',
        9 => 'Pendapatan Non-Pendidikan',
        10 => 'Zona Integritas',
        11 => 'Integritas & Akuntabilitas',
    ];
    return $names[$number] ?? 'IKU';
}

function sanitize_unit(PDO $pdo, string $unit): string
{
    if ($unit === 'all') {
        return 'all';
    }
    $row = iku_one($pdo, 'SELECT unit_id FROM units WHERE unit_id = :unit AND unit_type = :type', [
        'unit' => $unit,
        'type' => 'Fakultas',
    ]);
    return $row ? $unit : 'all';
}

function unit_clause(string $unit, string $alias = ''): string
{
    if ($unit === 'all') {
        return '';
    }
    $prefix = $alias !== '' ? $alias . '.' : '';
    return " AND {$prefix}unit_id = :unit";
}

function unit_params(array $params, string $unit): array
{
    if ($unit !== 'all') {
        $params['unit'] = $unit;
    }
    return $params;
}

function metric_summary(float|int|string $value, float|int|string $target, string $unit): array
{
    $numericValue = is_numeric($value) ? (float) $value : 0.0;
    $numericTarget = is_numeric($target) ? (float) $target : 0.0;
    return [
        'nilai' => value_cast($value),
        'target' => value_cast($target),
        'satuan' => $unit,
        'status' => $numericValue >= $numericTarget ? 'good' : ($numericValue >= $numericTarget * 0.85 ? 'warning' : 'danger'),
    ];
}

function kpi_cards_from_pages(array $indicators, array $pages): array
{
    $cards = [];
    foreach ($indicators as $indicator) {
        $id = $indicator['indicator_id'];
        $summary = $pages[$id]['summary'] ?? null;
        if (!$summary) {
            continue;
        }
        $cards[] = [
            'id' => $id,
            'no' => 'IKU ' . $indicator['indicator_no'],
            'nama' => short_name((int) $indicator['indicator_no']),
            'nilai' => $summary['nilai'],
            'target' => $summary['target'],
            'satuan' => $summary['satuan'],
            'status' => $summary['status'],
        ];
    }
    return $cards;
}

function summary(array $measurements, string $id, int $year): array
{
    $row = $measurements[$id][$year] ?? ['value' => 0, 'target_value' => 0, 'unit' => '', 'status' => 'warning'];
    return [
        'nilai' => value_cast($row['value']),
        'target' => value_cast($row['target_value']),
        'satuan' => $row['unit'],
        'status' => $row['status'],
    ];
}

function kpi_stat(string $label, mixed $value, string $sub): array
{
    return ['label' => $label, 'value' => (string) $value, 'sub' => $sub];
}

function value_cast(mixed $value): mixed
{
    if (is_numeric($value)) {
        return str_contains((string) $value, '.') ? (float) $value : (int) $value;
    }
    return $value;
}

function number_value(mixed $value): float
{
    return is_numeric($value) ? round((float) $value, 2) : 0.0;
}

function pct_value(float $numerator, float $denominator): float
{
    return $denominator > 0 ? round($numerator / $denominator * 100, 2) : 0.0;
}

function key_values(array $rows, string $key, string $value): array
{
    $result = [];
    foreach ($rows as $row) {
        $result[(int) $row[$key]] = (float) $row[$value];
    }
    return $result;
}

function int_text(mixed $value): string
{
    return number_format((float) $value, 0, ',', '.');
}

function number_text(mixed $value): string
{
    return number_format((float) $value, 1, ',', '.');
}

function percent_text(mixed $value): string
{
    return number_format((float) $value, 1, ',', '.') . '%';
}

function signed_text(float $value, string $suffix): string
{
    $prefix = $value >= 0 ? '+' : '';
    return $prefix . number_format($value, 1, ',', '.') . $suffix;
}

function status_label(string $status): string
{
    return match ($status) {
        'good' => 'Tercapai',
        'warning' => 'Perlu Perhatian',
        default => 'Di Bawah Target',
    };
}

function dataset_latest(array $datasets, string $label): float
{
    foreach ($datasets as $dataset) {
        if ($dataset['label'] === $label) {
            $data = $dataset['data'];
            return (float) end($data);
        }
    }
    return 0.0;
}

function top_activity(array $datasets): array
{
    $top = ['label' => '-', 'value' => 0];
    foreach ($datasets as $dataset) {
        $sum = array_sum(array_map('floatval', $dataset['data']));
        if ($sum > $top['value']) {
            $top = ['label' => $dataset['label'], 'value' => $sum];
        }
    }
    return $top;
}

function top_latest(array $datasets): array
{
    $top = ['label' => '-', 'value' => 0];
    foreach ($datasets as $dataset) {
        $data = $dataset['data'];
        $value = (float) end($data);
        if ($value > $top['value']) {
            $top = ['label' => $dataset['label'], 'value' => $value];
        }
    }
    return $top;
}
