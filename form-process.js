document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('.form-box');

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const email_to = "faaayabd@gmail.com";
        const email_subject = "You've got a new submission";

        function problem(error) {
            console.log("Oh looks like there is some problem with your form data: \n\n" + error + "\n\nPlease fix those to proceed.\n\n");
            // You can customize the error handling as needed
            // For example, display an error message on the webpage or redirect the user to an error page.
            // To keep it simple, we'll log the error to the console.
            // Replace the console.log statement with your desired error handling.
            return;
        }

        const firstName = form.querySelector('[name="FirstName"]').value.trim();
        const lastName = form.querySelector('[name="Last Name"]').value.trim();
        const email = form.querySelector('[name="Email"]').value.trim();
        const phoneNumber = form.querySelector('[name="PhoneNumber"]').value.trim();
        const message = form.querySelector('[name="Message"]').value.trim();

        let error_message = "";
        const email_exp = /^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
        const string_exp = /^[A-Za-z .'-]+$/;

        if (!string_exp.test(firstName)) {
            error_message += 'First Name does not seem valid.\n';
        }

        if (!string_exp.test(lastName)) {
            error_message += 'Last Name does not seem valid.\n';
        }

        if (!email_exp.test(email)) {
            error_message += 'Email address does not seem valid.\n';
        }

        // Add additional validation as needed for phoneNumber and message

        if (error_message.length > 0) {
            problem(error_message);
        }

        const email_message = "Form details following:\n\n";
        email_message += "First Name: " + firstName + "\n";
        email_message += "Last Name: " + lastName + "\n";
        email_message += "Email: " + email + "\n";
        email_message += "Phone Number: " + phoneNumber + "\n";
        email_message += "Message: " + message + "\n";

        const headers = new Headers({
            'Content-Type': 'application/json'
        });

        const requestOptions = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ email_to, email_subject, email_message }),
        };

        fetch('/submit-form', requestOptions)
            .then(response => response.json())
            .then(data => {
                // Handle success, e.g., show a success message to the user
                console.log(data);
            })
            .catch(error => {
                // Handle error, e.g., show an error message to the user
                console.error(error);
            });

        // Replace the following line with your success message or redirection logic.
        console.log("Thanks for contacting us, we will get back to you as soon as possible.");
    });
});
