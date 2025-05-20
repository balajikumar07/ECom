
const API_BASE = 'http://192.168.2.204:5215';
const LOGIN_API = `${API_BASE}/api/CustomerLogin/login`;


document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("identifier");
    const passwordInput = document.getElementById("password");
    const togglePassword = document.querySelector(".toggle-password");
    const messageEl = document.getElementById('loginMessage');

 
    togglePassword.addEventListener("click", function () {
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
        passwordInput.setAttribute("type", type);
        this.classList.toggle("fa-eye-slash");
    });

    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        
      
        messageEl.style.display = 'none';
        messageEl.textContent = '';

        if (!emailInput.value || !passwordInput.value) {
            messageEl.textContent = "Please enter both email and password";
            messageEl.style.display = 'block';
            messageEl.style.backgroundColor = '#f8d7da';
            messageEl.style.color = '#721c24';
            return;
        }

        try {
            const loginBtn = document.querySelector("#loginForm button[type='submit']");
            if (loginBtn) {
                loginBtn.disabled = true;
                loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            }

            const response = await fetch(LOGIN_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: emailInput.value,
                    password: passwordInput.value
                }),
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                let errorText;
                try {
                    const errorData = await response.json();
                    errorText = errorData.message || JSON.stringify(errorData);
                } catch {
                    errorText = await response.text();
                }
                throw new Error(errorText || 'Login failed');
            }

            const data = await response.json();
            localStorage.setItem("token", data.token);

            // Show success message
            messageEl.textContent = "Login successful! Redirecting...";
            messageEl.style.display = 'block';
            messageEl.style.backgroundColor = '#d4edda';
            messageEl.style.color = '#155724';
            
            // Check for pending actions
            const pendingAction = localStorage.getItem('pendingAction');
            const pendingCartItem = localStorage.getItem('pendingCartItem');
            
            if (pendingCartItem) {
                window.location.href = "../homepage1/homepage1.html";
            } else if (pendingAction === 'cart') {
                window.location.href = "../cart/cart.html";
            } else if (pendingAction === 'orders') {
                window.location.href = "../orders/orders.html";
            } else if (pendingAction === 'profile') {
                window.location.href = "../profile/profile.html";
            } else {
                window.location.href = "../homepage1/homepage1.html";
            }

        } catch (error) {
            let errorMessage = error.message;
            if (error.name === 'AbortError') {
                errorMessage = "Connection timed out. Please check your network.";
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = "Could not connect to the server. Please try again later.";
            }

            messageEl.textContent = errorMessage;
            messageEl.style.display = 'block';
            messageEl.style.backgroundColor = '#f8d7da';
            messageEl.style.color = '#721c24';
            
        } finally {
            const loginBtn = document.querySelector("#loginForm button[type='submit']");
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Login';
            }
        }
    });
});