<%@ page contentType="text/html;charset=UTF-8" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Electricity Bill Statement</title>
    <link rel="stylesheet" href="style.css">
    <!-- Include html2pdf library for client-side PDF generation -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
</head>
<body>

    <!-- Responsive Navigation Bar -->
    <nav class="navbar">
        <div class="nav-brand">⚡ ElectroCalc</div>
        <div class="nav-links">
            <a href="index.html">New Calculation</a>
            <button id="theme-toggle" class="theme-btn">🌙</button>
        </div>
    </nav>

    <!-- Printable & Downloadable Invoice Card Wrapper -->
    <div class="container result-container animate-fade-in" id="bill-invoice">
        <h1>Official Statement</h1>
        <div class="badge-container">
            <span class="badge">${month}</span>
            <span class="badge category-badge">${category}</span>
        </div>

        <div class="result-card">
            <table class="bill-table">
                <tr>
                    <td><b>Consumer Name</b></td>
                    <td>${name}</td>
                </tr>
                <tr>
                    <td><b>Units Consumed</b></td>
                    <td>${units} kWh</td>
                </tr>
                <tr>
                    <td><b>Energy Consumption Charge</b></td>
                    <td>Rs. ${energyBill}</td>
                </tr>
                <tr>
                    <td><b>Fixed Service Charge</b></td>
                    <td>Rs. ${fixedCharges}</td>
                </tr>
                <tr>
                    <td><b>GST / Utility Tax (5%)</b></td>
                    <td>Rs. ${gstTax}</td>
                </tr>
                <tr class="total-row">
                    <td><b>Total Payable Amount</b></td>
                    <td>Rs. ${totalBill}</td>
                </tr>
            </table>

            <!-- Slab-Wise Breakdown Section -->
            <div class="breakdown-section">
                <h3>Slab-Wise Cost Breakdown</h3>
                <ul class="breakdown-list">
                    <li><span>First 50 Units (@ Rs. 3.50):</span> <b>Rs. ${slab1}</b></li>
                    <li><span>Next 100 Units (@ Rs. 4.00):</span> <b>Rs. ${slab2}</b></li>
                    <li><span>Next 100 Units (@ Rs. 5.20):</span> <b>Rs. ${slab3}</b></li>
                    <li><span>Units Above 250 (@ Rs. 6.50):</span> <b>Rs. ${slab4}</b></li>
                </ul>
            </div>

            <!-- Previous Bill Comparison Section -->
            <div class="comparison-box">
                <span class="comp-title">Previous Month Comparison:</span>
                <span class="${comparisonClass}"><b>${comparisonText}</b></span>
            </div>
        </div>

        <!-- Action Tools: PDF Download & Print Controls -->
        <div class="action-buttons">
            <button onclick="downloadPDF()" class="btn-action btn-pdf">📥 Download PDF</button>
            <button onclick="window.print()" class="btn-action btn-print">🖨️ Print Bill</button>
        </div>

        <div style="margin-top: 20px;">
            <a href="index.html" class="btn-link">
                <button class="btn-submit">Calculate Another Bill</button>
            </a>
        </div>
    </div>

    <!-- Footer Section -->
    <footer class="footer">
        <p>&copy; 2026 ElectroCalc Systems. All rights reserved.</p>
    </footer>

    <script>
        // PDF Generator Function using html2pdf.js
        function downloadPDF() {
            const element = document.getElementById('bill-invoice');
            const options = {
                margin:       10,
                filename:     'Electricity_Bill_${name}.pdf',
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().from(element).set(options).save();
        }

        // Theme Toggle Functionality
        const toggleBtn = document.getElementById('theme-toggle');
        const currentTheme = localStorage.getItem('theme') || 'light';
        if (currentTheme === 'dark') {
            document.body.classList.add('dark-mode');
            toggleBtn.textContent = '☀️';
        }
        toggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            let theme = 'light';
            if (document.body.classList.contains('dark-mode')) {
                theme = 'dark';
                toggleBtn.textContent = '☀️';
            } else {
                toggleBtn.textContent = '🌙';
            }
            localStorage.setItem('theme', theme);
        });
    </script>
</body>
</html>