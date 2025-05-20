const API_BASE = 'http://192.168.2.204:5215';
const ORDER_STATUS_API = `${API_BASE}/api/orderstatus`;
const CUSTOMER_API = `${API_BASE}/api/Customer`;

const JWTUtils = {
    decode: function (token) {
        try {
            const payload = token.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            console.log('Decoded token:', decoded);
            return decoded;
        } catch (e) {
            console.error("JWT decode error:", e);
            return null;
        }
    },
    getCustomerId: function () {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No token found in localStorage");
            return null;
        }
        const decoded = this.decode(token);
        const customerId = decoded?.customerId || decoded?.CustomerID || decoded?.CustomerId || null;
        console.log('Customer ID:', customerId);
        return customerId;
    },
    isExpired: function (decodedToken) {
        if (!decodedToken || !decodedToken.exp) {
            console.warn("No expiration in token or invalid token");
            return true;
        }
        const now = Math.floor(Date.now() / 1000);
        const isExpired = decodedToken.exp < now;
        console.log('Token expiration check:', { exp: decodedToken.exp, now, isExpired });
        return isExpired;
    }
};

const token = localStorage.getItem('token');
const decodedToken = token ? JWTUtils.decode(token) : null;
const isLoggedIn = token && decodedToken && !JWTUtils.isExpired(decodedToken);
const customerId = isLoggedIn ? JWTUtils.getCustomerId() : null;

if (!isLoggedIn) {
    showToast('Your session has expired. Please log in again.', 'error');
    localStorage.setItem('pendingAction', 'orderstatus');
    setTimeout(() => {
        window.location.href = '../login/login.html';
    }, 2000);
}

function showToast(message, type = 'info') {
    const toast = $(`<div class="toast ${type}">${message}</div>`);
    $('body').append(toast);
    toast.fadeIn();
    setTimeout(() => toast.fadeOut(() => toast.remove()), 3000);
}

function updateAccountLink() {
    const accountLink = document.getElementById('accountLink');
    if (accountLink) {
        accountLink.textContent = isLoggedIn ? 'My Account' : 'Login/Signup';
    }
}

function updateUserProfile(user) {
    if (user && user.name) {
        $('#userName').text(user.name).show();
        $('#defaultUserIcon').hide();
        $('#userPhoto').attr('src', user.photo || 'https://cdn-icons-png.flaticon.com/512/847/847969.png').show();
        $('#loginSignupDropdown').hide();
        $('#viewProfile').show();
        $('#logoutBtn').show();
    } else {
        $('#userName').hide();
        $('#userPhoto').hide();
        $('#defaultUserIcon').show();
        $('#loginSignupDropdown').show();
        $('#viewProfile').hide();
        $('#logoutBtn').hide();
    }
}

async function loadUserProfile() {
    if (!isLoggedIn) {
        updateUserProfile(null);
        return;
    }

    try {
        const response = await fetch(`${CUSTOMER_API}/${customerId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            let errorText;
            try {
                const errorData = await response.json();
                errorText = errorData.message || JSON.stringify(errorData);
            } catch {
                errorText = await response.text();
            }
            throw new Error(`Failed to fetch profile: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        console.log('Profile data:', data);
        updateUserProfile({
            name: data.customerName || 'Unknown',
            photo: data.image ? `${API_BASE}${data.image.trim()}` : null
        });
    } catch (err) {
        console.error('Error loading profile:', err);
        updateUserProfile(null);
        showToast('Failed to load profile.', 'error');
    }
}

async function loadOrderStatus() {
    if (!isLoggedIn) {
        $('#order-status-details').html('<p class="empty-status">Please log in to view order status.</p>');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderID');

    if (!orderId) {
        $('#order-status-details').html('<p class="empty-status">Invalid order ID.</p>');
        return;
    }

    try {
        console.log(`Fetching order status for order ${orderId} from ${ORDER_STATUS_API}/${orderId}`);
        const response = await fetch(`${ORDER_STATUS_API}/${orderId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            let errorText;
            try {
                const errorData = await response.json();
                errorText = errorData.message || JSON.stringify(errorData);
            } catch {
                errorText = await response.text();
            }
            console.error(`Order status fetch error: ${response.status} - ${errorText}`);
            throw new Error(`Failed to load order status: ${response.status} - ${errorText}`);
        }

        const order = await response.json();
        console.log('Fetched order status:', order);
        renderOrderStatus(order);
    } catch (err) {
        console.error('Error loading order status:', err);
        $('#order-status-details').html('<p class="empty-status">Unable to load order status. Please try again. <button onclick="loadOrderStatus()">Retry</button></p>');
        showToast('Failed to load order status.', 'error');
    }
}

function renderOrderStatus(order) {
    $('#order-status-details').empty();

    if (!order) {
        $('#order-status-details').html('<p class="empty-status">No order details found.</p>');
        return;
    }

    const orderId = order.orderID || 'N/A';
    const productName = order.product?.productName || 'Unknown';
    const imagePath = order.product?.imagePath || 'https://via.placeholder.com/150';
    const quantity = order.quantity || 1;
    const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A';
    const companyName = order.dealerID || 'Unknown';
    const price = order.product?.price ? parseFloat(order.product.price).toFixed(2) : '0.00';
    const totalAmount = order.product?.price && order.quantity 
        ? (parseFloat(order.product.price) * parseInt(order.quantity)).toFixed(2) 
        : '0.00';
    const status = order.orderStatus?.status || 'Pending';
    const statusClass = status ? status.toLowerCase().replace(/\s/g, '-') : 'pending';

    $('#order-status-details').append(`
        <div class="order-status-item">
            <img src="${imagePath}" alt="${productName}" class="order-img" style="width: 150px; height: 150px; margin-bottom: 20px;">
            <div class="order-status-details">
                <h3>Order #${orderId}</h3>
                <p>Product: ${productName}</p>
                <p>Price: $${price}</p>
                <p>Date: ${orderDate}</p>
                <p>Quantity: ${quantity}</p>
                <p>Dealer: ${companyName}</p>
                <p>Total: $${totalAmount}</p>
                <p class="order-status ${statusClass}">Status: ${status}</p>
            </div>
        </div>
    `);
}

$(document).ready(function() {
    console.log('Order status page loaded, isLoggedIn:', isLoggedIn);
    updateAccountLink();
    loadUserProfile();
    loadOrderStatus();

    $('#userIcon').on('click', (e) => {
        e.preventDefault();
        if (isLoggedIn) {
            window.location.href = '../profile/profile.html';
        } else {
            window.location.href = '../login/login.html';
        }
    });

    $('#logoutBtn').on('click', function (e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('pendingAction');
        showToast('Logged out successfully.', 'info');
        window.location.href = '../homepage1/homepage1.html';
    });
});