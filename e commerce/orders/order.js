const API_BASE = 'http://192.168.2.204:5215';
const CUSTOMER_API = `${API_BASE}/api/Customer`;
const ORDERS_API = `${API_BASE}/api/Orders`;

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
    localStorage.setItem('pendingAction', 'orders');
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

let cartItems = 0;

function updateCartCount(count) {
    cartItems = count !== undefined ? count : cartItems;
    $('.cart-count').text(cartItems);
}

async function loadCartCount() {
    if (!isLoggedIn) {
        updateCartCount(0);
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/Cart/customer/${customerId}`, {
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
            throw new Error(`Failed to fetch cart: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        const items = Array.isArray(data) ? data : data.items || [];
        console.log('Cart items:', items);
        updateCartCount(items.length);
    } catch (err) {
        console.error('Error loading cart count:', err);
        updateCartCount(0);
        showToast('Failed to load cart count.', 'error');
    }
}

async function loadUserProfile() {
    if (!isLoggedIn) {
        updateUserProfile(null);
        return;
    }

    try {
        const response = await fetch(`${CUSTOMER_API}/${customerId}`, {
            headers: { 'Authorization': `Bearer ${token}` } // Fixed typo: 'ticket' to 'token'
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

async function loadOrders() {
    if (!isLoggedIn) {
        $('#orders-list').html('<p class="empty-orders">Please log in to view orders.</p>');
        return;
    }

    try {
        console.log(`Fetching orders for customer ${customerId} from ${ORDERS_API}/${customerId}`);
        const response = await fetch(`${ORDERS_API}/${customerId}`, {
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
            console.error(`Order fetch error: ${response.status} - ${errorText}`);
            throw new Error(`Failed to load orders: ${response.status} - ${errorText}`);
        }
        const orders = await response.json();
        console.log('Fetched orders:', orders);
        renderOrders(orders);
    } catch (err) {
        console.error('Error loading orders:', err);
        $('#orders-list').html('<p class="empty-orders">Unable to load orders. Please try again. <button onclick="loadOrders()">Retry</button></p>');
        showToast('Failed to load orders. Please try again later.', 'error');
    }
}

function renderOrders(orders) {
    $('#orders-list').empty();

    if (!Array.isArray(orders) || orders.length === 0) {
        $('#orders-list').html('<p class="empty-orders">No orders found. <a href="../homepage1/homepage1.html">Shop now</a></p>');
        return;
    }

    orders.forEach(order => {
        const statusClass = order.status ? order.status.toLowerCase() : 'pending';
        const orderId = order.orderId || order.orderID || order.OrderId || 'N/A';
        const productName = order.productName || order.ProductName || 'Unknown';
        const imagePath = order.imagepath || order.imagePath || order.image || 'https://via.placeholder.com/150';
        const quantity = order.quantity || order.Quantity || 1;
        const orderDate = order.orderDate || order.OrderDate ? new Date(order.orderDate || order.OrderDate).toLocaleString() : 'N/A';
        const companyName = order.companyname || order.companyName || order.dealer || 'Unknown';
        const price = order.price ? parseFloat(order.price).toFixed(2) : '0.00';
        const totalAmount = order.price && order.quantity ? (parseFloat(order.price) * parseInt(order.quantity)).toFixed(2) : '0.00';

        $('#orders-list').append(`
            <div class="order-item" onclick="window.location.href='../orderstatus/orderstatus.html?orderID=${orderId}'">
                <img src="${imagePath}" alt="${productName}" class="order-img" style="width: 100px; height: 100px; margin-right: 20px;">
                <div class="order-details">
                    <h4>Order #${orderId}</h4>
                    <p>Product: ${productName}</p>
                    <p>Price: $${price}</p>
                    <p>Date: ${orderDate}</p>
                    <p>Quantity: ${quantity}</p>
                    <p>Dealer: ${companyName}</p>
                    <p>Total: $${totalAmount}</p>
                    <p class="order-status ${statusClass}">Status: ${order.status || 'Pending'}</p>
                    ${statusClass === 'pending' ? `<button class="btn-cancel-order" onclick="event.stopPropagation(); cancelOrder(${orderId})">Cancel Order</button>` : ''}
                </div>
            </div>
        `);
    });
}

async function cancelOrder(orderId) {
    if (!isLoggedIn) {
        showToast('Please log in to cancel an order.', 'error');
        return;
    }

    try {
        console.log(`Cancelling order ${orderId}`);
        const response = await fetch(`${ORDERS_API}/${orderId}`, {
            method: 'DELETE',
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
            throw new Error(`Failed to cancel order: ${response.status} - ${errorText}`);
        }
        showToast('Order cancelled successfully.', 'success');
        loadOrders();
    } catch (err) {
        console.error('Error cancelling order:', err);
        showToast('Failed to cancel order.', 'error');
    }
}

$(document).ready(function() {
    console.log('Orders page loaded, isLoggedIn:', isLoggedIn);
    updateAccountLink();
    loadUserProfile();
    loadCartCount();
    loadOrders();

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

    $(window).on('scroll', function() {
        if ($(window).scrollTop() > 50) {
            $('.announcement-bar').addClass('hidden');
        } else {
            $('.announcement-bar').removeClass('hidden');
        }
    });

    $(document).on('cartUpdated', function() {
        loadCartCount();
    });

    const pendingAction = localStorage.getItem('pendingAction');
    if (isLoggedIn && pendingAction === 'orders') {
        loadOrders();
        localStorage.removeItem('pendingAction');
    }
});