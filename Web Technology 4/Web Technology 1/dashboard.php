<?php

session_start();

if (!isset($_SESSION['user_id'])) {

    header("Location: index.php");

    exit;
}

require_once "config/database.php";


$userId = $_SESSION['user_id'];


/*
|--------------------------------------------------------------------------
| Month Filter
|--------------------------------------------------------------------------
*/

$fromMonth = $_GET['from'] ?? '';
$toMonth = $_GET['to'] ?? '';


/*
|--------------------------------------------------------------------------
| Fetch Bills
|--------------------------------------------------------------------------
*/

if ($fromMonth !== '' && $toMonth !== '') {

    $startDate = $fromMonth . '-01';

    $endDate = date(
        'Y-m-t',
        strtotime($toMonth . '-01')
    );


    $stmt = $pdo->prepare(
        "SELECT *
         FROM bills
         WHERE user_id = ?
         AND month BETWEEN ? AND ?
         ORDER BY month DESC"
    );

    $stmt->execute([
        $userId,
        $startDate,
        $endDate
    ]);

} else {

    $stmt = $pdo->prepare(
        "SELECT *
         FROM bills
         WHERE user_id = ?
         ORDER BY month DESC"
    );

    $stmt->execute([$userId]);
}


$bills = $stmt->fetchAll();


/*
|--------------------------------------------------------------------------
| Statistics
|--------------------------------------------------------------------------
*/

$totalBills = count($bills);

$totalAmount = 0;

foreach ($bills as $bill) {

    $totalAmount += $bill['amount'];
}


$averageBill = $totalBills > 0
    ? $totalAmount / $totalBills
    : 0;


/*
|--------------------------------------------------------------------------
| Latest Bill
|--------------------------------------------------------------------------
*/

$latestBill = $bills[0] ?? null;

?>

<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<title>Dashboard | PowerBill</title>

<link rel="stylesheet"
      href="assets/style.css">

</head>


<body>


<header class="navbar">

    <div class="logo">
        ⚡ PowerBill
    </div>


    <div class="user-nav">

        <span>
            Welcome,
            <strong>
                <?= htmlspecialchars($_SESSION['user_name']) ?>
            </strong>
        </span>


        <a
            href="auth.php?action=logout"
            class="logout-button"
        >
            Logout
        </a>

    </div>

</header>


<main class="dashboard">


    <!-- HEADER -->

    <section class="dashboard-header">

        <div>

            <span class="badge">
                DASHBOARD
            </span>

            <h1>
                Electricity Overview
            </h1>

            <p>
                Manage your monthly electricity
                consumption and bills.
            </p>

        </div>


        <a
            href="bill.php"
            class="primary-button"
        >
            + Calculate New Bill
        </a>

    </section>


    <!-- STATISTICS -->

    <section class="stats-grid">


        <div class="stat-card">

            <span class="stat-icon">
                ⚡
            </span>

            <p>Latest Bill</p>

            <h2>

                <?php if ($latestBill): ?>

                    ₹<?= number_format(
                        $latestBill['amount'],
                        2
                    ) ?>

                <?php else: ?>

                    ₹0.00

                <?php endif; ?>

            </h2>

        </div>


        <div class="stat-card">

            <span class="stat-icon">
                📊
            </span>

            <p>Average Bill</p>

            <h2>
                ₹<?= number_format(
                    $averageBill,
                    2
                ) ?>
            </h2>

        </div>


        <div class="stat-card">

            <span class="stat-icon">
                📄
            </span>

            <p>Total Bills</p>

            <h2>
                <?= $totalBills ?>
            </h2>

        </div>


        <div class="stat-card">

            <span class="stat-icon">
                💰
            </span>

            <p>Total Amount</p>

            <h2>
                ₹<?= number_format(
                    $totalAmount,
                    2
                ) ?>
            </h2>

        </div>

    </section>


    <!-- AVERAGE FILTER -->

    <section class="filter-card">

        <div>

            <h2>
                Average for Selected Months
            </h2>

            <p>
                Select a period to calculate your
                average electricity bill.
            </p>

        </div>


        <form method="GET" class="filter-form">

            <div>

                <label>From</label>

                <input
                    type="month"
                    name="from"
                    value="<?= htmlspecialchars($fromMonth) ?>"
                    required
                >

            </div>


            <div>

                <label>To</label>

                <input
                    type="month"
                    name="to"
                    value="<?= htmlspecialchars($toMonth) ?>"
                    required
                >

            </div>


            <button
                type="submit"
                class="primary-button"
            >
                Calculate Average
            </button>


            <a
                href="dashboard.php"
                class="secondary-button"
            >
                Reset
            </a>

        </form>

    </section>


    <!-- BILL HISTORY -->

    <section class="history-section">

        <div class="section-title">

            <div>

                <h2>
                    Bill History
                </h2>

                <p>
                    Your monthly electricity bills
                </p>

            </div>

        </div>


        <?php if ($totalBills > 0): ?>

        <div class="table-container">

            <table>

                <thead>

                    <tr>

                        <th>Month</th>

                        <th>Units</th>

                        <th>Amount</th>

                        <th>Status</th>

                        <th>Action</th>

                    </tr>

                </thead>


                <tbody>

                <?php foreach ($bills as $bill): ?>

                    <tr>

                        <td>

                            <?= date(
                                'F Y',
                                strtotime($bill['month'])
                            ) ?>

                        </td>


                        <td>

                            <?= number_format(
                                $bill['units'],
                                2
                            ) ?>

                            units

                        </td>


                        <td>

                            <strong>

                                ₹<?= number_format(
                                    $bill['amount'],
                                    2
                                ) ?>

                            </strong>

                        </td>


                        <td>

                            <?php if (
                                $bill['payment_status']
                                === 'Paid'
                            ): ?>

                                <span class="status paid">
                                    Paid
                                </span>

                            <?php else: ?>

                                <span class="status unpaid">
                                    Unpaid
                                </span>

                            <?php endif; ?>

                        </td>


                        <td>

                            <a
                                href="bill.php?id=<?= $bill['id'] ?>"
                                class="view-button"
                            >
                                View Bill
                            </a>

                        </td>

                    </tr>

                <?php endforeach; ?>

                </tbody>

            </table>

        </div>


        <?php else: ?>


            <div class="empty-state">

                <div>📄</div>

                <h3>
                    No bills found
                </h3>

                <p>
                    Calculate your first electricity
                    bill to see it here.
                </p>

                <a
                    href="bill.php"
                    class="primary-button"
                >
                    Calculate Bill
                </a>

            </div>


        <?php endif; ?>

    </section>

</main>


<script src="assets/script.js"></script>

</body>

</html>