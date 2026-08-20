import java.io.IOException;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class BillServlet extends HttpServlet {

    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        // Get customer details
        String customerName = request.getParameter("name");
        String consumerNumber = request.getParameter("consumerNumber");

        // Get units
        int units = Integer.parseInt(
                request.getParameter("units")
        );

        double billAmount = 0;

        // Electricity tariff calculation

        if (units <= 50) {

            billAmount = units * 3.50;

        } else if (units <= 150) {

            billAmount =
                    (50 * 3.50)
                    + ((units - 50) * 4.00);

        } else if (units <= 250) {

            billAmount =
                    (50 * 3.50)
                    + (100 * 4.00)
                    + ((units - 150) * 5.20);

        } else {

            billAmount =
                    (50 * 3.50)
                    + (100 * 4.00)
                    + (100 * 5.20)
                    + ((units - 250) * 6.50);
        }

        // Send data to result.jsp

        request.setAttribute(
                "customerName",
                customerName
        );

        request.setAttribute(
                "consumerNumber",
                consumerNumber
        );

        request.setAttribute(
                "units",
                units
        );

        request.setAttribute(
                "billAmount",
                String.format("%.2f", billAmount)
        );

        RequestDispatcher dispatcher =
                request.getRequestDispatcher("result.jsp");

        dispatcher.forward(request, response);
    }
}