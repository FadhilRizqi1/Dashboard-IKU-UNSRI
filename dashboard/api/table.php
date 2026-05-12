<?php

declare(strict_types=1);

require __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

try {
    $pdo = iku_pdo();
    $iku = $_GET['iku'] ?? 'summary';
    $year = isset($_GET['year']) ? (int) $_GET['year'] : 2024;
    $unit = sanitize_unit($pdo, $_GET['unit'] ?? 'all');

    $payload = match ($iku) {
        'beranda', 'summary' => summary_table($pdo, $year),
        'iku1' => query_table($pdo, 'Data AEE per Jenjang dan Fakultas', "
            SELECT a.year AS Tahun, u.unit_name AS Unit, a.education_level AS Jenjang,
                   a.cohort_in AS `Mahasiswa Masuk`, a.graduated_on_time AS `Lulus Tepat Waktu`,
                   a.aee_percent AS `AEE (%)`, a.ideal_aee_percent AS `AEE Ideal (%)`,
                   a.achievement_percent AS `Pencapaian (%)`
            FROM aee_by_level_unit_year a
            JOIN units u ON u.unit_id = a.unit_id
            WHERE a.year = :year" . unit_clause($unit, 'a') . "
            ORDER BY u.unit_name, a.education_level
        ", unit_params(['year' => $year], $unit)),
        'iku2' => query_table($pdo, 'Data Tracer Study Lulusan', "
            SELECT t.year AS Tahun, u.unit_name AS Unit, t.outcome AS `Status Lulusan`,
                   t.graduates AS Lulusan, t.respondents AS Responden,
                   t.weighted_qualified AS `Responden Berbobot`, t.total_respondents AS `Total Responden`
            FROM tracer_outcomes t
            JOIN units u ON u.unit_id = t.unit_id
            WHERE t.year = :year" . unit_clause($unit, 't') . "
            ORDER BY u.unit_name, t.outcome
        ", unit_params(['year' => $year], $unit)),
        'iku3' => query_table($pdo, 'Data Kegiatan Mahasiswa di Luar Prodi', "
            SELECT s.year AS Tahun, s.semester AS Semester, u.unit_name AS Unit,
                   s.activity_type AS Kegiatan, s.participants AS Peserta,
                   s.recognized_sks AS `SKS Diakui`, s.total_active_students AS `Mahasiswa Aktif`
            FROM student_activities s
            JOIN units u ON u.unit_id = s.unit_id
            WHERE s.year = :year" . unit_clause($unit, 's') . "
            ORDER BY s.semester, u.unit_name, s.activity_type
        ", unit_params(['year' => $year], $unit)),
        'iku4' => query_table($pdo, 'Data Rekognisi Internasional Dosen', "
            SELECT r.year AS Tahun, u.unit_name AS Unit, r.country AS Negara,
                   r.recognition_type AS `Jenis Rekognisi`, r.lecturer_count AS `Jumlah Dosen`,
                   r.total_lecturers AS `Total Dosen`
            FROM lecturer_recognition r
            JOIN units u ON u.unit_id = r.unit_id
            WHERE r.year = :year" . unit_clause($unit, 'r') . "
            ORDER BY r.lecturer_count DESC, u.unit_name
        ", unit_params(['year' => $year], $unit)),
        'iku5' => query_table($pdo, 'Data Luaran dan Kontrak Kerja Sama', "
            SELECT c.year AS Tahun, u.unit_name AS Unit, c.output_type AS `Jenis Luaran`,
                   c.output_count AS `Jumlah Luaran`, c.total_lecturers AS `Total Dosen`,
                   c.contract_value_billion AS `Nilai Kontrak (Miliar Rp)`
            FROM collaboration_outputs c
            JOIN units u ON u.unit_id = c.unit_id
            WHERE c.year = :year" . unit_clause($unit, 'c') . "
            ORDER BY u.unit_name, c.output_type
        ", unit_params(['year' => $year], $unit)),
        'iku6' => query_table($pdo, 'Data Publikasi Bereputasi', "
            SELECT p.year AS Tahun, u.unit_name AS Unit, p.publication_type AS `Jenis Publikasi`,
                   p.quartile AS Kuartil, p.publication_count AS `Jumlah Publikasi`,
                   p.international_collab_count AS `Kolaborasi Internasional`,
                   p.weighted_score AS `Skor Berbobot`, p.total_publications AS `Total Publikasi`
            FROM publications p
            JOIN units u ON u.unit_id = p.unit_id
            WHERE p.year = :year" . unit_clause($unit, 'p') . "
            ORDER BY u.unit_name, p.quartile
        ", unit_params(['year' => $year], $unit)),
        'iku7' => query_table($pdo, 'Data Program SDGs', "
            SELECT s.year AS Tahun, u.unit_name AS Unit, s.sdg AS SDG,
                   s.activity_type AS `Jenis Aktivitas`, s.program_count AS `Jumlah Program`,
                   s.total_programs AS `Total Program Unit`
            FROM sdg_programs s
            JOIN units u ON u.unit_id = s.unit_id
            WHERE s.year = :year" . unit_clause($unit, 's') . "
            ORDER BY s.sdg, u.unit_name, s.activity_type
        ", unit_params(['year' => $year], $unit)),
        'iku8' => query_table($pdo, 'Data Keterlibatan SDM dalam Kebijakan', "
            SELECT p.year AS Tahun, u.unit_name AS Unit, p.role AS Peran,
                   p.involved_sdm AS `SDM Terlibat`, p.total_sdm AS `Total SDM`
            FROM policy_involvement p
            JOIN units u ON u.unit_id = p.unit_id
            WHERE p.year = :year" . unit_clause($unit, 'p') . "
            ORDER BY u.unit_name, p.role
        ", unit_params(['year' => $year], $unit)),
        'iku9' => query_table($pdo, 'Data Pendapatan Non-Pendidikan', "
            SELECT year AS Tahun, source AS `Sumber Pendapatan`,
                   amount_billion AS `Nominal (Miliar Rp)`,
                   total_revenue_billion AS `Total Pendapatan (Miliar Rp)`
            FROM revenue
            WHERE year = :year
            ORDER BY amount_billion DESC
        ", ['year' => $year]),
        'iku10' => query_table($pdo, 'Data Zona Integritas', "
            SELECT z.year AS Tahun, u.unit_name AS Unit, z.proposal_type AS `Jenis Usulan`,
                   z.submission_status AS Status, z.zi_score AS `Skor ZI`
            FROM integrity_zones z
            JOIN units u ON u.unit_id = z.unit_id
            WHERE z.year = :year" . unit_clause($unit, 'z') . "
            ORDER BY z.zi_score DESC
        ", unit_params(['year' => $year], $unit)),
        'iku11' => query_table($pdo, 'Data Komponen Audit dan Akuntabilitas', "
            SELECT year AS Tahun, component AS Komponen, score AS Skor,
                   status AS Status, note AS Catatan
            FROM audit_components
            WHERE year = :year
            ORDER BY score DESC
        ", ['year' => $year]),
        default => throw new InvalidArgumentException('Unknown IKU table: ' . $iku),
    };

    echo json_encode(['ok' => true, 'year' => $year] + $payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $error->getMessage()], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function summary_table(PDO $pdo, int $year): array
{
    return query_table($pdo, 'Ringkasan Capaian IKU', "
        SELECT i.indicator_no AS No, i.name AS Indikator, i.pillar AS Pilar,
               m.value AS Nilai, m.target_value AS Target, m.unit AS Satuan,
               m.status AS Status, m.notes AS Catatan
        FROM iku_measurements m
        JOIN iku_indicators i ON i.indicator_id = m.indicator_id
        WHERE m.year = :year
        ORDER BY i.indicator_no
    ", ['year' => $year]);
}

function query_table(PDO $pdo, string $title, string $sql, array $params): array
{
    $rows = iku_rows($pdo, $sql, $params);
    $columns = $rows ? array_keys($rows[0]) : [];
    return [
        'title' => $title,
        'columns' => $columns,
        'rows' => $rows,
    ];
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

function unit_clause(string $unit, string $alias): string
{
    return $unit === 'all' ? '' : " AND {$alias}.unit_id = :unit";
}

function unit_params(array $params, string $unit): array
{
    if ($unit !== 'all') {
        $params['unit'] = $unit;
    }
    return $params;
}
