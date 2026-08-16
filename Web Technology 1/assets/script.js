/*
|--------------------------------------------------------------------------
| PowerBill JavaScript
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Download / Print Bill
|--------------------------------------------------------------------------
*/

function downloadBill() {

    window.print();

}


/*
|--------------------------------------------------------------------------
| Auto-hide Messages
|--------------------------------------------------------------------------
*/

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const messages =
            document.querySelectorAll(
                ".success-message, .error-message"
            );


        messages.forEach(function (message) {

            setTimeout(function () {

                message.style.opacity = "0";

                setTimeout(function () {

                    message.remove();

                }, 500);

            }, 5000);

        });

    }
);