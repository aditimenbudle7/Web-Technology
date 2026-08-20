<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Electricity Bill Result</title>

    <link rel="stylesheet" href="css/style.css">
</head>

<body>

<div class="container">

    <div class="card result-card">

        <div class="header">
            <div class="icon">⚡</div>
            <h1>Electricity Bill</h1>
            <p>Bill calculation successful</p>
        </div>

        <div class="bill-details">

            <div class="detail-row">
                <span>Customer Name</span>
                <strong>${customerName}</strong>
            </div>

            <div class="detail-row">
                <span>Consumer Number</span>
                <strong>${consumerNumber}</strong>
            </div>

            <div class="detail-row">
                <span>Units Consumed</span>
                <strong>${units}</strong>
            </div>

            <hr>

            <div class="amount-row">
                <span>Total Electricity Bill</span>
                <strong>&#8377;${billAmount}</strong>
            </div>

        </div>

        <a href="index.jsp" class="back-button">
            Calculate Another Bill
        </a>

    </div>

</div>

</body>
</html>