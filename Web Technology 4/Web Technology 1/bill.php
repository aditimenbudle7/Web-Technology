<?php

session_start();

if (!isset($_SESSION['user_id'])) {

    header("Location: index.php");

    exit;
}

require_once "config/database.php";


/*
|--------------------------------------------------------------------------
| BILL CALCULATION FUNCTION
|--------------------------------------------------------------------------
*/

function calculateBill(float $units): float
{
    $amount = 0;


    // First 50 units

    if ($units <= 50) {

        return $units * 3.50;
    }


    $amount += 50 * 3.50;


    // Next 100 units

    if ($units <= 150) {

        $amount += ($units - 50) * 4.00;

        return $amount;
    }


    $amount += 100 * 4.00;


    // Next 100 units

    if ($units <= 250) {

        $amount += ($units - 150) * 5.20;

        return $amount;
    }


    $amount += 100 * 5.20;


    // Above 250 units

    $amount += ($units - 250) * 6.50;


    return $amount;
}


/*
|--------------------------------------------------------------------------
| GENERATE NEW BILL
|--------------------------------------------------------------------------
*/

if ($_SERVER['REQUEST_METHOD'] === 'POST'
    && isset($_POST['calculate'])) {


    $month = $_POST['month'] ?? '';

    $units = floatval(
        $_POST['units'] ?? 0
    );


    if ($month === '' || $units < 0) {

        die("Invalid bill information.");
    }


    /*
    |--------------------------------------------------------------------------
    | Convert month to date
    |--------------------------------------------------------------------------
    */

    $monthDate = $month . '-01';


    /*
    |--------------------------------------------------------------------------
    | Calculate amount
    |--------------------------------------------------------------------------
    */

    $amount = calculateBill($units);


    /*
    |--------------------------------------------------------------------------
    | Insert Bill
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare(
        "INSERT INTO bills
        (user_id, month, units, amount)
        VALUES (?, ?, ?, ?)"
    );


    $stmt->execute([

        $_SESSION['user_id'],

        $monthDate,

        $units,

        $amount

    ]);


    $billId = $pdo->lastInsertId();


    header(
        "Location: bill.php?id=" . $billId
    );

    exit;
}


/*
|--------------------------------------------------------------------------
| PAYMENT DEMONSTRATION
|--------------------------------------------------------------------------
*/

if ($_SERVER['REQUEST_METHOD'] === 'POST'
    && isset($_POST['pay'])) {


    $billId = intval(
        $_POST['bill_id']
    );


    $stmt = $pdo->prepare(
        "UPDATE bills
         SET payment_status = 'Paid'
         WHERE id = ?
         AND user_id = ?"
    );


    $stmt->execute([

        $billId,

        $_SESSION['user_id']

    ]);


    header(
        "Location: bill.php?id="
        . $billId
        . "&paid=1"
    );

    exit;
}


/*
|--------------------------------------------------------------------------
| VIEW EXISTING BILL
|--------------------------------------------------------------------------
*/

$bill = null;


if (isset($_GET['id'])) {

    $billId = intval($_GET['id']);


    $stmt = $pdo->prepare(
        "SELECT *
         FROM bills
         WHERE id = ?
         AND user_id = ?"
    );


    $stmt->execute([

        $billId,

        $_SESSION['user_id']

    ]);


    $bill = $stmt->fetch();
}

?>

<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<title>
    <?= $bill
        ? 'Electricity Bill'
        : 'Calculate Bill'
    ?>
    | PowerBill
</title>

<link rel="stylesheet"
      href="assets/style.css">

</head>


<body>


<header class="navbar">

    <div class="logo">
        ⚡ PowerBill
    </div>


    <div>

        <a href="dashboard.php">
            Dashboard
        </a>

    </div>

</header>


<main class="bill-page">


<?php if (!$bill): ?>


    <!-- =================================
         BILL CALCULATOR
         ================================= -->

    <section class="calculator-card">

        <span class="badge">
            BILL CALCULATOR
        </span>


        <h1>
            Calculate Electricity Bill
        </h1>


        <p>
            Enter your monthly electricity
            consumption below.
        </p>


        <form
            method="POST"
            class="bill-form"
        >

            <input
                type="hidden"
                name="calculate"
                value="1"
            >


            <label>
                Billing Month
            </label>


            <input
                type="month"
                name="month"
                required
            >


            <label>
                Units Consumed
            </label>


            <input
                type="number"
                name="units"
                min="0"
                step="0.01"
                placeholder="Example: 250"
                required
            >


            <button
                type="submit"
                class="primary-button"
            >
                Calculate Bill
            </button>

        </form>

    </section>


    <!-- TARIFF -->

    <section class="tariff-card">

        <h2>
            Current Tariff
        </h2>


        <div class="tariff-row">

            <span>
                First 50 units
            </span>

            <strong>
                ₹3.50 / unit
            </strong>

        </div>


        <div class="tariff-row">

            <span>
                Next 100 units
            </span>

            <strong>
                ₹4.00 / unit
            </strong>

        </div>


        <div class="tariff-row">

            <span>
                Next 100 units
            </span>

            <strong>
                ₹5.20 / unit
            </strong>

        </div>


        <div class="tariff-row">

            <span>
                Above 250 units
            </span>

            <strong>
                ₹6.50 / unit
            </strong>

        </div>

    </section>


<?php else: ?>


    <!-- =================================
         GENERATED BILL
         ================================= -->

    <section
        class="generated-bill"
        id="printableBill"
    >


        <div class="bill-header">

            <div>

                <span class="badge">
                    ELECTRICITY BILL
                </span>

                <h1>
                    PowerBill
                </h1>

            </div>


            <div class="bill-number">

                Bill #<?= $bill['id'] ?>

            </div>

        </div>


        <hr>


        <div class="bill-details">

            <div>

                <span>
                    Customer
                </span>

                <strong>
                    <?= htmlspecialchars(
                        $_SESSION['user_name']
                    ) ?>
                </strong>

            </div>


            <div>

                <span>
                    Billing Month
                </span>

                <strong>

                    <?= date(
                        'F Y',
                        strtotime($bill['month'])
                    ) ?>

                </strong>

            </div>


            <div>

                <span>
                    Units Consumed
                </span>

                <strong>

                    <?= number_format(
                        $bill['units'],
                        2
                    ) ?>

                    units

                </strong>

            </div>

        </div>


        <!-- AMOUNT -->

        <div class="total-box">

            <span>
                Total Amount
            </span>

            <strong>

                ₹<?= number_format(
                    $bill['amount'],
                    2
                ) ?>

            </strong>

        </div>


        <!-- PAYMENT -->

        <?php if (
            $bill['payment_status'] === 'Unpaid'
        ): ?>


            <div class="payment-section">

                <h2>
                    Scan & Pay
                </h2>


                <p>
                    Scan the QR code using a
                    payment application.
                </p>


                <div class="qr-code">

                    <div class="qr-pattern">

                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>

                    </div>

                </div>


                <p class="demo-label">

                    DEMONSTRATION PAYMENT QR

                </p>


                <form method="POST">

                    <input
                        type="hidden"
                        name="bill_id"
                        value="<?= $bill['id'] ?>"
                    >


                    <button
                        type="submit"
                        name="pay"
                        class="primary-button"
                    >

                        Simulate Payment

                    </button>

                </form>

            </div>


        <?php else: ?>


            <div class="payment-success">

                <div class="success-icon">
                    ✓
                </div>


                <h2>
                    Payment Successful
                </h2>


                <p>
                    This bill has been marked as paid.
                </p>

            </div>


        <?php endif; ?>


        <!-- ACTIONS -->

        <div class="bill-actions">

            <button
                onclick="downloadBill()"
                class="secondary-button"
            >
                Download / Print Bill
            </button>


            <a
                href="dashboard.php"
                class="secondary-button"
            >
                Back to Dashboard
            </a>

        </div>


    </section>


<?php endif; ?>


</main>


<script src="assets/script.js"></script>

</body>

</html>