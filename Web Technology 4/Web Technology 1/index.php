<?php

session_start();

if (isset($_SESSION['user_id'])) {

    header("Location: dashboard.php");

    exit;
}

?>

<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

    <title>PowerBill | Electricity Billing</title>

    <link rel="stylesheet"
          href="assets/style.css">

</head>

<body>

<header class="navbar">

    <div class="logo">
        ⚡ PowerBill
    </div>

    <div class="nav-text">
        Electricity Billing System
    </div>

</header>


<main class="landing">


    <!-- HERO -->

    <section class="hero">

        <div>

            <span class="badge">
                SMART ELECTRICITY MANAGEMENT
            </span>

            <h1>
                Your electricity bill,
                <span>simplified.</span>
            </h1>

            <p>
                Calculate your monthly electricity bill,
                track your usage, view bill history and
                manage payments from one dashboard.
            </p>

        </div>

    </section>


    <!-- FEATURES -->

    <section class="features">

        <div class="feature-card">

            <div class="feature-icon">⚡</div>

            <h3>Instant Calculation</h3>

            <p>
                Calculate your bill using the
                official slab-based tariff.
            </p>

        </div>


        <div class="feature-card">

            <div class="feature-icon">📊</div>

            <h3>Track Usage</h3>

            <p>
                View monthly bills and calculate
                average electricity costs.
            </p>

        </div>


        <div class="feature-card">

            <div class="feature-icon">🔒</div>

            <h3>Secure Account</h3>

            <p>
                Your account information is protected
                using password hashing.
            </p>

        </div>

    </section>


    <!-- AUTH -->

    <section class="auth-section">


        <!-- LOGIN -->

        <div class="auth-card">

            <h2>Welcome Back</h2>

            <p class="form-subtitle">
                Login to your account
            </p>


            <?php if (isset($_GET['error'])): ?>

                <div class="error-message">

                    <?php

                    $error = $_GET['error'];

                    if ($error === 'invalid_login') {
                        echo "Invalid email or password.";
                    }

                    elseif ($error === 'email_exists') {
                        echo "An account with this email already exists.";
                    }

                    elseif ($error === 'empty_fields') {
                        echo "Please fill in all fields.";
                    }

                    elseif ($error === 'invalid_email') {
                        echo "Please enter a valid email.";
                    }

                    elseif ($error === 'short_password') {
                        echo "Password must contain at least 6 characters.";
                    }

                    ?>

                </div>

            <?php endif; ?>


            <?php if (isset($_GET['signup'])): ?>

                <div class="success-message">

                    Account created successfully.
                    You can now login.

                </div>

            <?php endif; ?>


            <form
                action="auth.php"
                method="POST"
                class="auth-form"
            >

                <input
                    type="hidden"
                    name="action"
                    value="login"
                >


                <label>Email</label>

                <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                >


                <label>Password</label>

                <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    required
                >


                <button
                    type="submit"
                    class="primary-button"
                >
                    Login
                </button>

            </form>

        </div>


        <!-- SIGNUP -->

        <div class="auth-card">

            <h2>Create Account</h2>

            <p class="form-subtitle">
                Start managing your electricity bills
            </p>


            <form
                action="auth.php"
                method="POST"
                class="auth-form"
            >

                <input
                    type="hidden"
                    name="action"
                    value="signup"
                >


                <label>Full Name</label>

                <input
                    type="text"
                    name="name"
                    placeholder="Your name"
                    required
                >


                <label>Email</label>

                <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                >


                <label>Password</label>

                <input
                    type="password"
                    name="password"
                    placeholder="Minimum 6 characters"
                    minlength="6"
                    required
                >


                <button
                    type="submit"
                    class="primary-button"
                >
                    Create Account
                </button>

            </form>

        </div>

    </section>


    <!-- TARIFF -->

    <section class="tariff-section">

        <h2>Electricity Tariff</h2>

        <p>
            Your bill is calculated using these
            unit-based slabs.
        </p>


        <div class="tariff-grid">

            <div>
                <strong>₹3.50</strong>
                <span>First 50 units</span>
            </div>

            <div>
                <strong>₹4.00</strong>
                <span>Next 100 units</span>
            </div>

            <div>
                <strong>₹5.20</strong>
                <span>Next 100 units</span>
            </div>

            <div>
                <strong>₹6.50</strong>
                <span>Above 250 units</span>
            </div>

        </div>

    </section>

</main>


<footer>

    <p>
        PowerBill — Web Technology 1 Project
    </p>

</footer>


<script src="assets/script.js"></script>

</body>

</html>