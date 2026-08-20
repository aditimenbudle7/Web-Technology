<?php

session_start();

require_once "config/database.php";


/*
|--------------------------------------------------------------------------
| Determine Action
|--------------------------------------------------------------------------
*/

$action = $_POST['action'] ?? $_GET['action'] ?? '';


/*
|--------------------------------------------------------------------------
| SIGN UP
|--------------------------------------------------------------------------
*/

if ($action === 'signup') {

    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';


    // Validate input

    if ($name === '' || $email === '' || $password === '') {

        header("Location: index.php?error=empty_fields");
        exit;
    }


    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {

        header("Location: index.php?error=invalid_email");
        exit;
    }


    if (strlen($password) < 6) {

        header("Location: index.php?error=short_password");
        exit;
    }


    /*
    |--------------------------------------------------------------------------
    | Check if email already exists
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare(
        "SELECT id FROM users WHERE email = ?"
    );

    $stmt->execute([$email]);

    if ($stmt->fetch()) {

        header("Location: index.php?error=email_exists");
        exit;
    }


    /*
    |--------------------------------------------------------------------------
    | Hash Password
    |--------------------------------------------------------------------------
    */

    $hashedPassword = password_hash(
        $password,
        PASSWORD_DEFAULT
    );


    /*
    |--------------------------------------------------------------------------
    | Insert User
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare(
        "INSERT INTO users
        (name, email, password)
        VALUES (?, ?, ?)"
    );

    $stmt->execute([
        $name,
        $email,
        $hashedPassword
    ]);


    header("Location: index.php?signup=success");
    exit;
}


/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

if ($action === 'login') {

    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';


    $stmt = $pdo->prepare(
        "SELECT *
         FROM users
         WHERE email = ?"
    );

    $stmt->execute([$email]);

    $user = $stmt->fetch();


    /*
    |--------------------------------------------------------------------------
    | Verify Password
    |--------------------------------------------------------------------------
    */

    if ($user && password_verify($password, $user['password'])) {

        session_regenerate_id(true);

        $_SESSION['user_id'] = $user['id'];

        $_SESSION['user_name'] = $user['name'];

        $_SESSION['user_email'] = $user['email'];


        header("Location: dashboard.php");
        exit;
    }


    header("Location: index.php?error=invalid_login");
    exit;
}


/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

if ($action === 'logout') {

    $_SESSION = [];

    session_destroy();

    header("Location: index.php");
    exit;
}


header("Location: index.php");
exit;

?>