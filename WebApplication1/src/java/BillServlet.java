import java.io.IOException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/BillServlet")
public class BillServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        // Retrieve parameters from form
        String name = request.getParameter("name");
        String month = request.getParameter("month");
        String category = request.getParameter("category");
        int units = Integer.parseInt(request.getParameter("units"));
        double prevBill = Double.parseDouble(request.getParameter("prevBill"));

        // Slab-wise calculation breakdown trackers
        double slab1Cost = 0; // First 50 units @ 3.50
        double slab2Cost = 0; // Next 100 units @ 4.00
        double slab3Cost = 0; // Next 100 units @ 5.20
        double slab4Cost = 0; // Above 250 units @ 6.50
        
        double energyBill = 0;

        if (units <= 50) {
            slab1Cost = units * 3.50;
            energyBill = slab1Cost;
        } else if (units <= 150) {
            slab1Cost = 50 * 3.50;
            slab2Cost = (units - 50) * 4.00;
            energyBill = slab1Cost + slab2Cost;
        } else if (units <= 250) {
            slab1Cost = 50 * 3.50;
            slab2Cost = 100 * 4.00;
            slab3Cost = (units - 150) * 5.20;
            energyBill = slab1Cost + slab2Cost + slab3Cost;
        } else {
            slab1Cost = 50 * 3.50;
            slab2Cost = 100 * 4.00;
            slab3Cost = 100 * 5.20;
            slab4Cost = (units - 250) * 6.50;
            energyBill = slab1Cost + slab2Cost + slab3Cost + slab4Cost;
        }

        // Fixed Service Charges & Commercial Surcharge multiplier if applicable
        double fixedCharges = category.equals("Commercial") ? 150.00 : 50.00;

        // Subtotal before tax
        double subTotal = energyBill + fixedCharges;

        // GST / Tax Calculation (e.g., 5% standard utility tax)
        double gstTax = subTotal * 0.05;

        // Final Total Bill
        double totalBill = subTotal + gstTax;

        // Previous bill difference analysis
        double billDifference = totalBill - prevBill;
        String comparisonText = "";
        String comparisonClass = "";
        if (billDifference > 0) {
            comparisonText = String.format("Rs. %.2f higher than last month", billDifference);
            comparisonClass = "trend-up";
        } else if (billDifference < 0) {
            comparisonText = String.format("Rs. %.2f lower than last month", Math.abs(billDifference));
            comparisonClass = "trend-down";
        } else {
            comparisonText = "Equal to last month's bill";
            comparisonClass = "trend-equal";
        }

        // Set attributes for JSP result page binding
        request.setAttribute("name", name);
        request.setAttribute("month", month);
        request.setAttribute("category", category);
        request.setAttribute("units", units);
        request.setAttribute("prevBill", String.format("%.2f", prevBill));
        
        request.setAttribute("slab1", String.format("%.2f", slab1Cost));
        request.setAttribute("slab2", String.format("%.2f", slab2Cost));
        request.setAttribute("slab3", String.format("%.2f", slab3Cost));
        request.setAttribute("slab4", String.format("%.2f", slab4Cost));
        
        request.setAttribute("energyBill", String.format("%.2f", energyBill));
        request.setAttribute("fixedCharges", String.format("%.2f", fixedCharges));
        request.setAttribute("gstTax", String.format("%.2f", gstTax));
        request.setAttribute("totalBill", String.format("%.2f", totalBill));
        
        request.setAttribute("comparisonText", comparisonText);
        request.setAttribute("comparisonClass", comparisonClass);

        // Forward request processing flow to result JSP view
        request.getRequestDispatcher("result.jsp").forward(request, response);
    }
}