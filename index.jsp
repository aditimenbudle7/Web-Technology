<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Electricity Bill Calculator</title>

    <link rel="stylesheet" href="css/style.css">
</head>

<body>

<div class="container">

    <div class="card">

        <div class="header">
            <div class="icon">⚡</div>
            <h1>Electricity Bill Calculator</h1>
            <p>Calculate your electricity bill instantly</p>
        </div>

        <form action="calculateBill" method="post">

            <div class="form-group">
                <label for="name">Customer Name</label>
                <input type="text"
                       id="name"
                       name="name"
                       placeholder="Enter your name"
                       required>
            </div>

            <div class="form-group">
                <label for="consumerNumber">Consumer Number</label>
                <input type="text"
                       id="consumerNumber"
                       name="consumerNumber"
                       placeholder="Enter consumer number"
                       required>
            </div>

            <div class="form-group">
                <label for="units">Units Consumed</label>
                <input type="number"
                       id="units"
                       name="units"
                       placeholder="Enter units consumed"
                       min="0"
                       required>
            </div>

            <button type="submit">
                Calculate Bill
            </button>

        </form>

        <div class="tariff-row">
    <span>First 50 units</span>
    <span>&#8377;3.50/unit</span>
</div>

<div class="tariff-row">
    <span>Next 100 units</span>
    <span>&#8377;4.00/unit</span>
</div>

<div class="tariff-row">
    <span>Next 100 units</span>
    <span>&#8377;5.20/unit</span>
</div>

<div class="tariff-row">
    <span>Above 250 units</span>
    <span>&#8377;6.50/unit</span>
</div>

    </div>

</div>

</body>
</html>