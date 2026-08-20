<?php

/*
|--------------------------------------------------------------------------
| Database Configuration
|--------------------------------------------------------------------------
| Reads database credentials from the .env file.
| The actual .env file is excluded from Git using .gitignore.
|--------------------------------------------------------------------------
*/

$envFile = __DIR__ . '/../.env';

if (!file_exists($envFile)) {
    die("Error: .env file not found.");
}


/*
|--------------------------------------------------------------------------
| Read .env
|--------------------------------------------------------------------------
*/

$lines = file(
    $envFile,
    FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES
);

foreach ($lines as $line) {

    $line = trim($line);

    // Ignore comments
    if ($line === '' || str_starts_with($line, '#')) {
        continue;
    }

    // Split KEY=VALUE
    if (strpos($line, '=') !== false) {

        [$key, $value] = explode('=', $line, 2);

        $key = trim($key);
        $value = trim($value);

        $_ENV[$key] = $value;
    }
}


/*
|--------------------------------------------------------------------------
| Database Credentials
|--------------------------------------------------------------------------
*/

$host = $_ENV['DB_HOST'] ?? 'localhost';
$port = $_ENV['DB_PORT'] ?? '3306';
$db   = $_ENV['DB_NAME'] ?? 'electricity_billing';
$user = $_ENV['DB_USER'] ?? 'root';
$pass = $_ENV['DB_PASSWORD'] ?? '';


/*
|--------------------------------------------------------------------------
| Create PDO Connection
|--------------------------------------------------------------------------
*/

try {

    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4",
        $user,
        $pass
    );

    $pdo->setAttribute(
        PDO::ATTR_ERRMODE,
        PDO::ERRMODE_EXCEPTION
    );

    $pdo->setAttribute(
        PDO::ATTR_DEFAULT_FETCH_MODE,
        PDO::FETCH_ASSOC
    );

} catch (PDOException $e) {

    // Don't expose database credentials/errors to users.
    die("Unable to connect to the database.");
}
?>