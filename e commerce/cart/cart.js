const API_BASE = 'http://192.168.2.204:5215';
const CART_API = `${API_BASE}/api/Cart/customer`;
const CART_ADD_API = `${API_BASE}/api/Cart/add`;
const CART_REMOVE_API = `${API_BASE}/api/Cart/remove`;
const CUSTOMER_API = `${API_BASE}/api/Customer`;
const ADDRESS_API = `${API_BASE}/api/CustomerAddress`;
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
    localStorage.setItem('pendingAction', 'cart');
    setTimeout(() => {
        window.location.href = '../login/login.html';
    }, 2000);
}

function showToast(message, type = 'info') {
    console.log(`Creating toast: message="${message}", type="${type}"`);
    const toast = $(`<div class="toast ${type}">${message}</div>`);
    const $container = $('#toastContainer').length ? $('#toastContainer') : $('body');
    $container.append(toast);
    toast.fadeIn(300);
    setTimeout(() => {
        toast.fadeOut(300, () => {
            toast.remove();
            console.log(`Toast removed: message="${message}"`);
        });
    }, type === 'error' ? 5000 : 3000);
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

let cartItemsCount = 0;
let cartQuantities = {};

function updateCartCount(count) {
    cartItemsCount = count !== undefined ? count : cartItemsCount;
    $('.cart-count').text(cartItemsCount);
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
            let errorText = await response.text();
            console.error(`Profile fetch error: ${response.status} - ${errorText}`);
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

async function loadCart() {
    try {
        console.log(`Fetching cart for customer ${customerId}`);
        const response = await fetch(`${CART_API}/${customerId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            let errorText = await response.text();
            console.error(`Cart fetch error: ${response.status} - ${errorText}`);
            throw new Error(`Failed to fetch cart: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        console.log('Cart API response:', data);
        const items = Array.isArray(data) ? data : data.items || [];
        $('#cart-items').empty();
        cartQuantities = {};
        if (items.length === 0) {
            $('#cart-items').html('<p class="empty-cart">Your cart is empty. <a href="../homepage1/homepage1.html">Shop now</a></p>');
            $('#cart-total').text('0.00');
            updateCartCount(0);
            return;
        }
        let total = 0;
        items.forEach(item => {
            const productId = item.productID || item.productId;
            const quantity = item.quantity;
            const cartId = item.cartID || item.cartId || item.CartID || item.id; // Support multiple casings
            console.log('Cart item details:', { productId, cartId, quantity });
            if (!cartId) {
                console.warn('Missing cartId for item:', item);
            }
            cartQuantities[productId] = quantity;
            const subtotal = quantity * item.price;
            total += subtotal;
            $('#cart-items').append(`
                <div class="cart-item" data-id="${cartId || ''}" data-product-id="${productId}">
                    <img src="${item.imagePath || 'https://via.placeholder.com/150'}" alt="${item.productName}">
                    <div class="cart-item-details">
                        <h4>${item.productName || 'Unknown'}</h4>
                        <p>Price: $${item.price ? item.price.toFixed(2) : '0.00'}</p>
                        <div class="quantity-selector">
                            <button class="quantity-btn minus" data-product-id="${productId}">-</button>
                            <input type="number" class="quantity-input" value="${quantity}" min="1" data-product-id="${productId}">
                            <button class="quantity-btn plus" data-product-id="${productId}">+</button>
                        </div>
                        <p>Subtotal: $${subtotal.toFixed(2)}</p>
                    </div>
                    <button class="remove-btn" ${cartId ? `onclick="removeFromCart('${cartId}')"` : 'disabled'}>Remove</button>
                </div>
            `);
        });
        $('#cart-total').text(total.toFixed(2));
        updateCartCount(items.length);
    } catch (err) {
        console.error('Error loading cart:', err);
        showToast('Failed to load cart. Please try again.', 'error');
        $('#cart-items').html('<p class="empty-cart">Unable to load cart. <button onclick="loadCart()">Retry</button></p>');
        $('#cart-total').text('0.00');
        updateCartCount(0);
    }
}

async function addToCart(productId, quantity) {
    if (!isLoggedIn) {
        localStorage.setItem('pendingCartItem', JSON.stringify({ productId, quantity }));
        localStorage.setItem('pendingAction', 'addToCart');
        showToast('Please log in to add to cart.', 'error');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 2000);
        return;
    }
    try {
        console.log(`Adding to cart: productId=${productId}, quantity=${quantity}`);
        const response = await fetch(CART_ADD_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ customerId, productID: productId, quantity })
        });
        if (!response.ok) {
            let errorMessage = await response.text();
            console.error(`Cart add error: ${response.status} - ${errorMessage}`);
            showToast(`Failed to add to cart: ${errorMessage}`, 'error');
            throw new Error(`Failed to add to cart: ${response.status} - ${errorMessage}`);
        }
        console.log('Cart updated successfully');
        await loadCart();
        showToast('Cart updated!', 'success');
        $(document).trigger('cartUpdated');
    } catch (err) {
        console.error('Error adding to cart:', err);
        showToast('Failed to update cart. Please try again.', 'error');
    }
}

async function openAddressModal(cartItems) {
    if (!isLoggedIn) {
        localStorage.setItem('pendingAction', 'checkout');
        showToast('Please log in to proceed to checkout.', 'error');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 2000);
        return;
    }
    if (!customerId || !token) {
        console.error('Missing customerId or token');
        showToast('Authentication error. Please log in again.', 'error');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 2000);
        return;
    }
    try {
        console.log(`Fetching addresses for customer ${customerId}`);
        const response = await fetch(`${ADDRESS_API}/customer/${customerId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            let errorText = await response.text();
            console.error(`Address fetch error: ${response.status} - ${errorText}`);
            throw new Error(`Failed to fetch addresses: ${response.status} - ${errorText}`);
        }
        const addresses = await response.json();
        if (!addresses) {
            console.error('No addresses returned from API');
            $('#addressList').html('<p>No addresses found. Please add an address.</p>');
            $('#addressModal').fadeIn();
            $('body').css('overflow', 'hidden');
            return;
        }
        console.log('Addresses:', addresses);
        $('#addressList').empty();
        if (addresses.length === 0) {
            $('#addressList').html('<p>No addresses found. Please add an address.</p>');
            $('#addressModal').fadeIn();
            $('body').css('overflow', 'hidden');
            return;
        }
        const normalizedCartItems = cartItems.map(item => ({
            productId: item.productID || item.productId,
            dealerId: item.dealerId || item.dealerID || 1,
            quantity: cartQuantities[item.productID || item.productId] || item.quantity,
            cartId: item.cartID || item.cartId || item.CartID || item.id
        })).filter(item => item.productId && item.quantity > 0);
        if (normalizedCartItems.length === 0) {
            showToast('No valid cart items.', 'error');
            return;
        }
        console.log('Normalized cart items:', normalizedCartItems);
        addresses.forEach(addr => {
            $('#addressList').append(`
                <div class="address-item" data-id="${addr.addressId}" data-cart-items='${JSON.stringify(normalizedCartItems)}'>
                    <p><strong>Name:</strong> ${addr.name || '-'}</p>
                    <p><strong>Phone:</strong> ${addr.phoneNumber || '-'}</p>
                    <p><strong>Address:</strong> ${addr.address || '-'}</p>
                </div>
            `);
        });
        $('#addressModal').fadeIn();
        $('body').css('overflow', 'hidden');
    } catch (err) {
        console.error('Error loading addresses:', err);
        showToast('Failed to load addresses. Please try again.', 'error');
    }
}

async function selectAddress(addressId, cartItems) {
    console.log('Selecting address:', { addressId, cartItems });
    if (!addressId || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        showToast('Invalid checkout data.', 'error');
        return;
    }
    let failedItems = 0;
    const orderIds = JSON.parse(localStorage.getItem(`orders_${customerId}`) || '[]');
    const cartIdsToRemove = cartItems.map(item => item.cartId).filter(id => id);

    for (const item of cartItems) {
        if (!item.productId || !item.quantity || item.quantity < 1) {
            console.error('Invalid cart item:', item);
            failedItems++;
            continue;
        }
        try {
            await placeOrder(item.productId, item.dealerId, item.quantity, addressId);
        } catch (err) {
            console.error(`Failed to place order for product ${item.productId}:`, err);
            failedItems++;
        }
    }

    // Check if cart is already empty before attempting to clear
    if (failedItems === 0 && cartIdsToRemove.length > 0) {
        try {
            const cartResponse = await fetch(`${CART_API}/${customerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!cartResponse.ok) {
                console.error(`Cart check error: ${cartResponse.status}`);
                throw new Error('Failed to check cart state');
            }
            const cartData = await cartResponse.json();
            const cartItems = Array.isArray(cartData) ? cartData : cartData.items || [];
            if (cartItems.length === 0) {
                console.log('Cart is already empty, skipping removal');
            } else {
                console.log('Clearing cart items:', cartIdsToRemove);
                for (const cartId of cartIdsToRemove) {
                    await removeFromCart(cartId, false);
                }
                console.log('Cart cleared successfully');
            }
        } catch (err) {
            console.error('Error clearing cart:', err);
            showToast('Failed to clear some cart items.', 'error');
        }
    } else if (failedItems === 0 && cartIdsToRemove.length === 0) {
        console.warn('No cart IDs found to remove');
    }

    $('#addressModal').fadeOut();
    $('body').css('overflow', 'auto');
    cartQuantities = {};
    await loadCart();
    if (failedItems === 0) {
        showToast('Order placed successfully! Check your orders page.', 'success');
    } else if (failedItems === cartItems.length) {
        showToast(`Failed to place order for all items.`, 'error');
    } else {
        showToast(`Order placed for ${cartItems.length - failedItems} of ${cartItems.length} items.`, 'info');
    }
}

async function placeOrder(productId, dealerId, quantity, addressId) {
    try {
        console.log(`Placing order: productId=${productId}, dealerId=${dealerId}, quantity=${quantity}, addressId=${addressId}`);
        const response = await fetch(ORDERS_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ customerId, productID: productId, dealerId: dealerId || 1, quantity, addressId })
        });
        console.log('Order API response status:', response.status);
        if (!response.ok) {
            let errorMessage = await response.text();
            console.error(`Order error: ${response.status} - ${errorMessage}`);
            showToast(`Failed to place order: ${errorMessage}`, 'error');
            throw new Error(`Failed to place order: ${response.status} - ${errorMessage}`);
        }
        const result = await response.json();
        console.log('Order result:', result);
        const orderIds = JSON.parse(localStorage.getItem(`orders_${customerId}`) || '[]');
        if (result.orderID && !orderIds.includes(result.orderID)) {
            orderIds.push(result.orderID);
            localStorage.setItem(`orders_${customerId}`, JSON.stringify(orderIds));
            console.log(`Stored orderID ${result.orderID} in localStorage`);
        }
    } catch (err) {
        throw err;
    }
}

window.removeFromCart = async function(cartId, showConfirmation = true) {
    if (showConfirmation && !confirm('Are you sure you want to remove this item?')) return;
    if (!cartId) {
        console.error('Invalid cartId:', cartId);
        showToast('Invalid cart item ID.', 'error');
        return;
    }
    try {
        console.log(`Removing cart item ${cartId}`);
        const response = await fetch(`${CART_REMOVE_API}/${cartId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            let errorMessage = 'Unknown error';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || `HTTP ${response.status} error`;
            } catch {
                errorMessage = `HTTP ${response.status} error`;
            }
            if (response.status === 404) {
                console.warn(`Cart item ${cartId} not found in backend, refreshing cart`);
                showToast(`Cart item not found: ${errorMessage}`, 'info');
                await loadCart();
                return;
            }
            console.error(`Remove item error: ${response.status} - ${errorMessage}`);
            showToast(`Failed to remove item: ${errorMessage}`, 'error');
            throw new Error(`Failed to remove item: ${response.status} - ${errorMessage}`);
        }
        console.log('Item removed successfully');
        await loadCart();
        if (showConfirmation) {
            showToast('Item removed from cart!', 'success');
        }
        $(document).trigger('cartUpdated');
    } catch (err) {
        console.error('Error removing item:', err);
        if (!showConfirmation) {
            throw err; // Rethrow for selectAddress to handle
        }
    }
};

$(document).ready(function() {
    console.log('Cart page loaded, isLoggedIn:', isLoggedIn);
    updateAccountLink();
    loadUserProfile();
    loadCart();

    $('#checkout-btn').off('click').on('click', async function() {
        if (cartItemsCount === 0) {
            showToast('Your cart is empty.', 'error');
            return;
        }
        try {
            console.log(`Fetching cart for checkout: ${CART_API}/${customerId}`);
            const response = await fetch(`${CART_API}/${customerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                let errorMessage = await response.text();
                console.error(`Cart fetch error: ${response.status} - ${errorMessage}`);
                showToast(`Failed to fetch cart: ${errorMessage}`, 'error');
                throw new Error(`Failed to fetch cart: ${response.status} - ${errorMessage}`);
            }
            const cart = await response.json();
            const items = Array.isArray(cart) ? cart : cart.items || [];
            if (items.length === 0) {
                showToast('Your cart is empty.', 'error');
                return;
            }
            console.log('Cart items for checkout:', items);
            await openAddressModal(items);
        } catch (err) {
            console.error('Error fetching cart for checkout:', err);
            showToast('Failed to proceed to checkout. Please try again.', 'error');
        }
    });

    $(document).on('click', '#addressList .address-item', function(e) {
        e.stopPropagation();
        const addressId = $(this).data('id');
        const cartItems = $(this).data('cart-items') || [];
        console.log('Address clicked:', { addressId, cartItems });
        if (!addressId || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            showToast('Invalid address selection.', 'error');
            return;
        }
        selectAddress(addressId, cartItems);
    });

    $(document).on('click', '.quantity-btn.plus', function() {
        const productId = $(this).data('product-id');
        const input = $(this).siblings('.quantity-input');
        const currentValue = parseInt(input.val()) || 1;
        const newValue = currentValue + 1;
        console.log(`Increasing quantity: productId=${productId}, newValue=${newValue}`);
        input.val(newValue);
        cartQuantities[productId] = newValue;
        updateSubtotal(productId, newValue);
    });

    $(document).on('click', '.quantity-btn.minus', function() {
        const productId = $(this).data('product-id');
        const input = $(this).siblings('.quantity-input');
        const currentValue = parseInt(input.val()) || 1;
        const newValue = Math.max(1, currentValue - 1);
        console.log(`Decreasing quantity: productId=${productId}, newValue=${newValue}`);
        input.val(newValue);
        cartQuantities[productId] = newValue;
        updateSubtotal(productId, newValue);
    });

    $(document).on('input', '.quantity-input', function() {
        const productId = $(this).data('product-id');
        const value = parseInt(this.value);
        console.log(`Quantity input: productId=${productId}, value=${value}`);
        if (isNaN(value) || value < 1) {
            this.value = 1;
            cartQuantities[productId] = 1;
        } else {
            this.value = value;
            cartQuantities[productId] = value;
        }
        updateSubtotal(productId, cartQuantities[productId]);
    });

    function updateSubtotal(productId, quantity) {
        const item = $(`.cart-item[data-product-id="${productId}"]`);
        const price = parseFloat(item.find('.cart-item-details p').eq(0).text().replace('Price: $', '')) || 0;
        const subtotal = (quantity * price).toFixed(2);
        item.find('.cart-item-details p').eq(1).text(`Subtotal: $${subtotal}`);
        updateCartTotal();
    }

    function updateCartTotal() {
        let total = 0;
        $('.cart-item').each(function() {
            const subtotal = parseFloat($(this).find('.cart-item-details p').eq(1).text().replace('Subtotal: $', '')) || 0;
            total += subtotal;
        });
        $('#cart-total').text(total.toFixed(2));
    }

    $('#addressModal .close').on('click', function() {
        $('#addressModal').fadeOut();
        $('body').css('overflow', 'auto');
        console.log('Address modal closed');
    });

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
        localStorage.removeItem('pendingCartItem');
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
        loadCart();
    });

    const pendingAction = localStorage.getItem('pendingAction');
    if (pendingAction === 'cart' && isLoggedIn) {
        localStorage.removeItem('pendingAction');
        loadCart();
    }
});