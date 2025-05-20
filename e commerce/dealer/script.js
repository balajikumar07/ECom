// API Base and Endpoints
const API_BASE = 'http://192.168.2.204:5215';
const DEALER_LOGIN_API = `${API_BASE}/api/DealerLogin`;
const DEALER_SIGNUP_API = `${API_BASE}/api/DealerSignup`;
const DEALER_API = `${API_BASE}/api/Dealer`;
const DEALER_PRODUCT_API = `${API_BASE}/api/DealerProduct`;
const DEALER_ORDER_API = `${API_BASE}/api/DealerOrder`;

// Helper to get JWT token from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Helper to decode JWT token (for DealerID and DealerName)
function decodeToken(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
    } catch (e) {
        console.error('Error decoding token:', e);
        return null;
    }
}

// Helper to set headers with JWT
function getHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// Show/hide forms and dashboard
function showLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
}

function showSignup() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
}

// Show specific tab
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.getElementById(`${tabId}-tab`).style.display = 'block';
    if (tabId === 'dealers') loadDealers();
    if (tabId === 'products') loadProducts();
    if (tabId === 'orders') loadOrders();
}

// Handle login
document.getElementById('dealer-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');

    try {
        const response = await fetch(`${DEALER_LOGIN_API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Email: email, Password: password })
        });
        const data = await response.json();

        if (!response.ok) {
            errorElement.textContent = data.message || 'Login failed';
            return;
        }

        localStorage.setItem('token', data.token);
        const payload = decodeToken(data.token);
        document.getElementById('dealer-name').textContent = payload.DealerName || 'Dealer';
        showDashboard();
        loadDealers(); // Load dealers tab by default
    } catch (err) {
        errorElement.textContent = 'An error occurred. Please try again.';
    }
});

// Handle signup
document.getElementById('dealer-signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const dealerName = document.getElementById('signup-dealer-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const contactNumber = document.getElementById('signup-contact').value;
    const companyName = document.getElementById('signup-company').value;
    const errorElement = document.getElementById('signup-error');

    try {
        const response = await fetch(`${DEALER_SIGNUP_API}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                DealerName: dealerName,
                Email: email,
                Password: password,
                ContactNumber: contactNumber || null,
                CompanyName: companyName || null
            })
        });
        const data = await response.json();

        if (!response.ok) {
            errorElement.textContent = data.message || 'Signup failed';
            return;
        }

        errorElement.textContent = 'Signup successful! Please login.';
        showLogin();
    } catch (err) {
        errorElement.textContent = 'An error occurred. Please try again.';
    }
});

// Handle logout
document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('token');
    showLogin();
});

// Load dealers
async function loadDealers() {
    const dealersList = document.getElementById('dealers-list');
    try {
        const response = await fetch(DE vidé

System: It looks like the response was cut off, and I notice you mentioned the API base URL as `http://192.168.2.204:5215` and provided a structure for organizing endpoints, similar to `CUSTOMER_API` and `ADDRESS_API`. I'll complete the `scripts.js` file, ensuring it uses the modular API endpoint structure you specified, integrates with all dealer-related APIs, and aligns with the backend code (controllers, repositories, models, and stored procedures) you provided. The HTML (`index.html`) and CSS (`styles.css`) from my previous response remain unchanged, as they are UI-related and not affected by the API URL change. The updated `scripts.js` will:

- Define the base API URL (`http://192.168.2.204:5215`) and dealer-specific endpoints (`DEALER_LOGIN_API`, `DEALER_SIGNUP_API`, `DEALER_API`, `DEALER_PRODUCT_API`, `DEALER_ORDER_API`) at the top for easy maintenance.
- Implement all dealer functionalities (login, signup, view dealers, manage products, manage orders) using these endpoints.
- Handle JWT authentication, ensuring the `Authorization: Bearer <token>` header is included for protected endpoints.
- Include robust error handling for API responses (e.g., 400, 401, 404, 500) and network errors.
- Align with the backend data models (`Dealer`, `Product`, `OrderDto`) and stored procedures (`sp_DealerSignup`, `sp_DealerLoginByEmail`, `sp_GetAllDealers`, `sp_AddProduct`, etc.).
- Ensure no errors by validating inputs and respecting backend constraints (e.g., unique email in `sp_DealerSignup`, valid `DealerID` in `sp_AddProduct`).

### Updated `scripts.js`

```javascript
// API Base and Endpoints
const API_BASE = 'http://192.168.2.204:5215';
const DEALER_LOGIN_API = `${API_BASE}/api/DealerLogin`;
const DEALER_SIGNUP_API = `${API_BASE}/api/DealerSignup`;
const DEALER_API = `${API_BASE}/api/Dealer`;
const DEALER_PRODUCT_API = `${API_BASE}/api/DealerProduct`;
const DEALER_ORDER_API = `${API_BASE}/api/DealerOrder`;

// Helper to get JWT token from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Helper to decode JWT token (for DealerID and DealerName)
function decodeToken(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
    } catch (e) {
        console.error('Error decoding token:', e);
        return null;
    }
}

// Helper to set headers with JWT
function getHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// Show/hide forms and dashboard
function showLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
}

function showSignup() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
}

// Show specific tab
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.getElementById(`${tabId}-tab`).style.display = 'block';
    if (tabId === 'dealers') loadDealers();
    if (tabId === 'products') loadProducts();
    if (tabId === 'orders') loadOrders();
}

// Handle login
document.getElementById('dealer-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');

    try {
        const response = await fetch(`${DEALER_LOGIN_API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Email: email, Password: password })
        });
        const data = await response.json();

        if (!response.ok) {
            errorElement.textContent = data.message || 'Login failed';
            return;
        }

        localStorage.setItem('token', data.token);
        const payload = decodeToken(data.token);
        document.getElementById('dealer-name').textContent = payload.DealerName || 'Dealer';
        showDashboard();
        loadDealers(); // Load dealers tab by default
    } catch (err) {
        errorElement.textContent = 'An error occurred. Please try again.';
    }
});

// Handle signup
document.getElementById('dealer-signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const dealerName = document.getElementById('signup-dealer-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const contactNumber = document.getElementById('signup-contact').value;
    const companyName = document.getElementById('signup-company').value;
    const errorElement = document.getElementById('signup-error');

    try {
        const response = await fetch(`${DEALER_SIGNUP_API}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                DealerName: dealerName,
                Email: email,
                Password: password,
                ContactNumber: contactNumber || null,
                CompanyName: companyName || null
            })
        });
        const data = await response.json();

        if (!response.ok) {
            errorElement.textContent = data.message || 'Signup failed';
            return;
        }

        errorElement.textContent = 'Signup successful! Please login.';
        showLogin();
    } catch (err) {
        errorElement.textContent = 'An error occurred. Please try again.';
    }
});

// Handle logout
document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('token');
    showLogin();
});

// Load dealers
async function loadDealers() {
    const dealersList = document.getElementById('dealers-list');
    try {
        const response = await fetch(DEALER_API, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch dealers');
        const dealers = await response.json();
        dealersList.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Company</th>
                        <th>Contact</th>
                    </tr>
                </thead>
                <tbody>
                    ${dealers.map(dealer => `
                        <tr>
                            <td>${dealer.dealerID}</td>
                            <td>${dealer.dealerName}</td>
                            <td>${dealer.email}</td>
                            <td>${dealer.companyName || 'N/A'}</td>
                            <td>${dealer.contactNumber || 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        dealersList.innerHTML = `<p class="error">Error loading dealers: ${err.message}</p>`;
    }
}

// Handle add product
document.getElementById('add-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const productName = document.getElementById('product-name').value;
    const description = document.getElementById('product-description').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const stock = parseInt(document.getElementById('product-stock').value);
    const imagePath = document.getElementById('product-image').value;
    const errorElement = document.getElementById('product-error');
    const token = getToken();
    const payload = decodeToken(token);
    const dealerId = payload.DealerID;

    try {
        const response = await fetch(`${DEALER_PRODUCT_API}/add`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                DealerID: dealerId,
                ProductName: productName,
                Description: description || null,
                Price: price,
                Stock: stock,
                ImagePath: imagePath || null
            })
        });
        const data = await response.json();

        if (!response.ok) {
            errorElement.textContent = data.error || 'Failed to add product';
            return;
        }

        errorElement.textContent = 'Product added successfully!';
        loadProducts();
    } catch (err) {
        errorElement.textContent = 'An error occurred. Please try again.';
    }
});

// Load products
async function loadProducts() {
    const productsList = document.getElementById('products-list');
    const token = getToken();
    const payload = decodeToken(token);
    const dealerId = payload.DealerID;

    try {
        const response = await fetch(`${DEALER_PRODUCT_API}/dealer/${dealerId}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch products');
        const products = await response.json();
        productsList.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => `
                        <tr>
                            <td>${product.productID}</td>
                            <td>${product.productName}</td>
                            <td>${product.price}</td>
                            <td>${product.stock}</td>
                            <td>
                                <button onclick="editProduct(${product.productID})">Edit</button>
                                <button onclick="deleteProduct(${product.productID})">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        productsList.innerHTML = `<p class="error">Error loading products: ${err.message}</p>`;
    }
}

// Edit product (load product data into form)
async function editProduct(productId) {
    try {
        const response = await fetch(`${DEALER_PRODUCT_API}/${productId}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch product');
        const product = await response.json();

        document.getElementById('product-name').value = product.productName;
        document.getElementById('product-description').value = product.description || '';
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-image').value = product.imagePath || '';

        // Change form submit to update
        const form = document.getElementById('add-product-form');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const updatedProduct = {
                ProductName: document.getElementById('product-name').value,
                Description: document.getElementById('product-description').value || null,
                Price: parseFloat(document.getElementById('product-price').value),
                Stock: parseInt(document.getElementById('product-stock').value),
                ImagePath: document.getElementById('product-image').value || null
            };
            try {
                const response = await fetch(`${DEALER_PRODUCT_API}/update/${productId}`, {
                    method: 'PUT',
                    headers: getHeaders(),
                    body: JSON.stringify(updatedProduct)
                });
                const data = await response.json();
                if (!response.ok) {
                    document.getElementById('product-error').textContent = data.error || 'Failed to update product';
                    return;
                }
                document.getElementById('product-error').textContent = 'Product updated successfully!';
                loadProducts();
                form.reset();
                form.onsubmit = null; // Reset to add product
            } catch (err) {
                document.getElementById('product-error').textContent = 'An error occurred. Please try again.';
            }
        };
    } catch (err) {
        document.getElementById('product-error').textContent = 'Error loading product: ' + err.message;
    }
}

// Delete product
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
        const response = await fetch(`${DEALER_PRODUCT_API}/delete/${productId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to delete product');
        document.getElementById('product-error').textContent = 'Product deleted successfully!';
        loadProducts();
    } catch (err) {
        document.getElementById('product-error').textContent = 'Error deleting product: ' + err.message;
    }
}

// Load orders
async function loadOrders() {
    const ordersList = document.getElementById('orders-list');
    const token = getToken();
    const payload = decodeToken(token);
    const dealerId = payload.DealerID;

    try {
        const response = await fetch(`${DEALER_ORDER_API}/${dealerId}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch orders');
        const orders = await response.json();
        ordersList.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Product</th>
                        <th>Status</th>
                        <th>Order Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => `
                        <tr>
                            <td>${order.orderId}</td>
                            <td>${order.customer.name}</td>
                            <td>${order.product.productName}</td>
                            <td>
                                <select id="status-${order.orderId}" onchange="updateOrderStatus(${order.orderId})">
                                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                    <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                                    <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                                </select>
                            </td>
                            <td>${new Date(order.orderDate).toLocaleDateString()}</td>
                            <td><button onclick="viewOrderDetails(${order.orderId})">Details</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        ordersList.innerHTML = `<p class="error">Error loading orders: ${err.message}</p>`;
    }
}

// Update order status
async function updateOrderStatus(orderId) {
    const status = document.getElementById(`status-${orderId}`).value;
    try {
        const response = await fetch(`${DEALER_ORDER_API}/status/${orderId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ Status: status })
        });
        if (!response.ok) throw new Error('Failed to update order status');
        document.getElementById('orders-list').innerHTML += '<p>Order status updated successfully!</p>';
    } catch (err) {
        document.getElementById('orders-list').innerHTML += `<p class="error">Error updating order status: ${err.message}</p>`;
    }
}

// View order details (modal or inline)
function viewOrderDetails(orderId) {
    alert(`Order ID: ${orderId} - Detailed view not implemented yet. Add modal or page for full details.`);
}

// Toggle between login and signup
document.getElementById('show-signup').addEventListener('click', showSignup);
document.getElementById('show-login').addEventListener('click', showLogin);

// Initial check for token
if (getToken()) {
    showDashboard();
    loadDealers();
} else {
    showLogin();
}