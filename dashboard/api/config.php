<?php

declare(strict_types=1);

return [
    'host' => getenv('IKU_DB_HOST') ?: '127.0.0.1',
    'port' => getenv('IKU_DB_PORT') ?: '3306',
    'database' => getenv('IKU_DB_NAME') ?: 'dashboard_iku_unsri',
    'username' => getenv('IKU_DB_USER') ?: 'root',
    'password' => getenv('IKU_DB_PASS') ?: '',
    'charset' => 'utf8mb4',
];
