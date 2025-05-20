$(document).ready(function() {
    const API_BASE = 'http://192.168.2.204:5215';
    const SIGNUP_API = `${API_BASE}/api/Customer/register`;

    // Form submission handler
    $('#customerForm').on('submit', function(e) {
        e.preventDefault();
        clearErrors();

        // Get form values
        const name = $('#customer_name').val().trim();
        const email = $('#customer_email').val().trim();
        const password = $('#customer_password').val().trim();
        const contact = $('#customer_contact').val().trim();

        // Client-side validation
        let isValid = true;

        if (!name) {
            showError('customer_name', 'Full name is required');
            isValid = false;
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError('customer_email', 'Valid email is required');
            isValid = false;
        }

        if (!password || password.length < 6) {
            showError('customer_password', 'Password must be at least 6 characters');
            isValid = false;
        }

        if (!contact || !/^\d{10}$/.test(contact)) {
            showError('customer_contact', 'Valid 10-digit phone number is required');
            isValid = false;
        }

        if (!isValid) return;

        // Prepare data for API
        const data = {
            customerName: name,
            email: email,
            password: password,
            contactNumber: contact
        };

        // Submit to API
        $('.submit-btn').addClass('loading').prop('disabled', true);
        $.ajax({
            url: SIGNUP_API,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                // Store token
                localStorage.setItem('token', response.token);
                
                // Show success message
                $('#customerForm').hide();
                $('#successMessage').removeClass('hidden');
                
                // Redirect to homepage after 2 seconds
                setTimeout(() => {
                    window.location.href = '../homepage1/homepage1.html';
                }, 2000);
            },
            error: function(xhr, status, error) {
                let errorMsg;
                try {
                    const errorData = xhr.responseJSON;
                    errorMsg = errorData?.message || JSON.stringify(errorData);
                } catch {
                    errorMsg = 'Failed to create account. Please try again.';
                }
                showError('customer_email', errorMsg);
                $('.submit-btn').removeClass('loading').prop('disabled', false);
            }
        });
    });

    // Clear error messages
    function clearErrors() {
        $('.error-message').text('');
    }

    // Show error message for specific field
    function showError(fieldId, message) {
        $(`#${fieldId}-error`).text(message);
    }
});