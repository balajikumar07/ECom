// API base URLs
const API_BASE = 'http://192.168.2.204:5215';
const PRODUCTS_API = `${API_BASE}/api/Products/all`;
const SEARCH_API = `${API_BASE}/api/productsearch`;
const CART_API = `${API_BASE}/api/Cart/customer`;
const PROFILE_API = `${API_BASE}/api/Customer`;
const ORDERS_API = `${API_BASE}/api/Orders`;
const ADDRESS_API = `${API_BASE}/api/CustomerAddress`;
const PRODUCT_IMAGES_API = `${API_BASE}/api/productimages`;

// Utility for JWT handling
const JWTUtils = {
    decode(token) {
        try {
            const payload = token.split('.')[1];
            return JSON.parse(atob(payload));
        } catch (e) {
            console.error('JWT decode error:', e);
            return null;
        }
    },
    getCustomerId() {
        const token = localStorage.getItem('token');
        if (!token) return null;
        const decoded = this.decode(token);
        return decoded?.customerId || decoded?.CustomerID || decoded?.CustomerId || null;
    },
    isExpired(decodedToken) {
        if (!decodedToken || !decodedToken.exp) return true;
        return decodedToken.exp < Math.floor(Date.now() / 1000);
    }
};

// Authentication state
const token = localStorage.getItem('token');
const decodedToken = token ? JWTUtils.decode(token) : null;
const isLoggedIn = token && decodedToken && !JWTUtils.isExpired(decodedToken);
const customerId = isLoggedIn ? JWTUtils.getCustomerId() : null;

// Redirect to login if session expired
if (!isLoggedIn && token) {
    showToast('Your session has expired. Please log in again.', 'error');
    localStorage.removeItem('token');
    setTimeout(() => window.location.href = '../login/login.html', 2000);
}

// DOM elements
const accountLink = document.getElementById('loginSignupDropdown');
const cartIcon = document.getElementById('cartIcon');
const cartCount = document.querySelector('.cart-count');
const searchInput = document.getElementById('searchInput');
const searchSuggestions = document.getElementById('searchSuggestions');

// Global products array
let products = [];

// Utility: Show toast notification
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

// Navigation: Go to cart
function goToCart() {
    console.log('Cart link clicked, isLoggedIn:', isLoggedIn);
    if (!isLoggedIn) {
        showToast('Please log in to view your cart.', 'error');
        localStorage.setItem('pendingAction', 'cart');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 2000);
        return;
    }
    window.location.href = '../cart/cart.html';
}

// Navigation: Go to orders
function goToOrders() {
    console.log('Orders link clicked, isLoggedIn:', isLoggedIn);
    if (!isLoggedIn) {
        console.log('User not logged in, redirecting to login');
        showToast('Please log in to view your orders.', 'error');
        localStorage.setItem('pendingAction', 'orders');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 2000);
        return;
    }
    window.location.href = '../orders/orders.html';
}

// Navigation: Go to profile
function goToProfile() {
    console.log('Profile link clicked, isLoggedIn:', isLoggedIn);
    if (!isLoggedIn) {
        showToast('Please log in to view your profile.', 'error');
        localStorage.setItem('pendingAction', 'profile');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 2000);
        return;
    }
    window.location.href = '../profile/profile.html';
}

// Update account link text based on login status
function updateAccountLink() {
    accountLink.textContent = isLoggedIn ? 'My Account' : 'Login/Signup';
}

// Update user profile UI
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

// Load user profile from API
async function loadUserProfile() {
    if (!isLoggedIn) {
        updateUserProfile(null);
        return;
    }
    try {
        const response = await fetch(`${PROFILE_API}/${customerId}`, {
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

// Update cart count in UI
function updateCartCount(count) {
    cartCount.textContent = count !== undefined ? count : 0;
}

// Load cart count from API
async function loadCartCount() {
    if (!isLoggedIn) {
        updateCartCount(0);
        return;
    }
    try {
        const response = await fetch(`${CART_API}/${customerId}`, {
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
        updateCartCount(items.length);
    } catch (err) {
        console.error('Error loading cart count:', err);
        updateCartCount(0);
        showToast('Failed to load cart count.', 'error');
    }
}

// Add product to cart
async function addToCart(productId, quantity = 1) {
    console.log('addToCart called with:', { productId, quantity, isLoggedIn, customerId });
    if (!isLoggedIn) {
        console.log('User not logged in, prompting login');
        localStorage.setItem('pendingCartItem', JSON.stringify({ productId, quantity }));
        localStorage.setItem('pendingAction', 'addToCart');
        showToast('Please log in to add to cart. Redirecting...', 'error');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 3000);
        return;
    }
    try {
        console.log('Sending POST request to:', `${API_BASE}/api/Cart/add`);
        console.log('Request payload:', JSON.stringify({ customerId, productID: productId, quantity }));
        const response = await fetch(`${API_BASE}/api/Cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ customerId, productID: productId, quantity })
        });
        console.log('Cart API response:', { status: response.status, statusText: response.statusText });
        if (!response.ok) {
            let errorText;
            try {
                const errorData = await response.json();
                errorText = errorData.message || JSON.stringify(errorData);
            } catch {
                errorText = await response.text();
            }
            console.error('Cart API error:', errorText);
            throw new Error(`Failed to add to cart: ${response.status} - ${errorText}`);
        }
        const result = await response.json();
        console.log('Cart API success:', result);
        await loadCartCount();
        showToast('Product added to cart!', 'success');
        $(document).trigger('cartUpdated');
    } catch (err) {
        console.error('Error in addToCart:', err);
        showToast(`Failed to add to cart: ${err.message}`, 'error');
    }
}

// Open address modal for buy now
async function openAddressModal(productId, dealerId, quantity) {
    console.log('openAddressModal called with:', { productId, dealerId, quantity, customerId });
    if (!isLoggedIn) {
        console.log('User not logged in, prompting login');
        localStorage.setItem('pendingOrder', JSON.stringify({ productId, dealerId, quantity }));
        localStorage.setItem('pendingAction', 'buyNow');
        showToast('Please log in to place an order. Redirecting...', 'error');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 3000);
        return;
    }
    if (!customerId) {
        console.error('Customer ID is missing');
        showToast('User authentication error. Please log in again.', 'error');
        return;
    }
    try {
        console.log('Fetching addresses from:', `${ADDRESS_API}/customer/${customerId}`);
        const response = await fetch(`${ADDRESS_API}/customer/${customerId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Address API response:', { status: response.status, statusText: response.statusText });
        if (!response.ok) {
            let errorText;
            try {
                const errorData = await response.json();
                errorText = errorData.message || JSON.stringify(errorData);
            } catch {
                errorText = await response.text();
            }
            console.error('Address API error:', errorText);
            throw new Error(`Failed to fetch addresses: ${response.status} - ${errorText}`);
        }
        const addresses = await response.json();
        console.log('Addresses fetched:', addresses);
        $('#addressList').empty();
        if (!addresses || addresses.length === 0) {
            console.log('No addresses found');
            $('#addressList').html('<p>No addresses found. Please add an address.</p>');
            $('#addressModal').fadeIn();
            $('body').css('overflow', 'hidden');
            return;
        }
        addresses.forEach(addr => {
            console.log('Appending address:', addr);
            $('#addressList').append(`
                <div class="address-item" data-id="${addr.addressId}" data-product-id="${productId}" data-dealer-id="${dealerId}" data-quantity="${quantity}">
                    <p><strong>Name:</strong> ${addr.name || '-'}</p>
                    <p><strong>Phone:</strong> ${addr.phoneNumber || '-'}</p>
                    <p><strong>Address:</strong> ${addr.address || '-'}</p>
                </div>
            `);
        });
        console.log('Address modal HTML:', $('#addressList').html());
        $('#addressModal').fadeIn();
        $('body').css('overflow', 'hidden');
    } catch (err) {
        console.error('Error in openAddressModal:', err);
        showToast(`Failed to load addresses: ${err.message}`, 'error');
    }
}

// Select address and place order
async function selectAddress(addressId, productId, dealerId, quantity) {
    console.log('Selecting address:', { addressId, productId, dealerId, quantity });
    if (!productId || !dealerId || !quantity || !addressId) {
        console.error('Missing order details:', { productId, dealerId, quantity, addressId });
        showToast('Missing order details.', 'error');
        return;
    }
    try {
        await placeOrder(productId, dealerId, quantity, addressId);
        $('#addressModal').fadeOut();
        $('#productModel').fadeOut();
        $('body').css('overflow', 'auto');
    } catch (err) {
        setTimeout(() => {
            $('#addressModal').fadeOut();
            $('#productModel').fadeOut();
            $('body').css('overflow', 'auto');
        }, 5000);
    }
}

// Place order via API
async function placeOrder(productId, dealerId, quantity, addressId) {
    console.log('Placing order:', { customerId, productId, dealerId, quantity, addressId });
    try {
        const response = await fetch(ORDERS_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ customerId, productID: productId, dealerId, quantity, addressId })
        });
        console.log('Order API response status:', response.status);
        if (!response.ok) {
            let errorMessage = 'Failed to place order.';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
            } catch {
                errorMessage = await response.text();
            }
            console.error('Order API error response:', errorMessage);
            showToast(errorMessage, 'error');
            throw new Error(`Failed to place order: ${response.status} - ${errorMessage}`);
        }
        const result = await response.json();
        console.log('Order placed successfully:', result);
        const orderIds = JSON.parse(localStorage.getItem(`orders_${customerId}`) || '[]');
        if (result.orderID && !orderIds.includes(result.orderID)) {
            orderIds.push(result.orderID);
            localStorage.setItem(`orders_${customerId}`, JSON.stringify(orderIds));
        }
        showToast('Order placed successfully!', 'success');
    } catch (err) {
        throw err;
    }
}

// Calculate discount percentage
function calculateDiscount(originalPrice, salePrice) {
    if (!originalPrice || originalPrice <= salePrice) return 0;
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

// Load products from API
function loadProducts() {
    $.ajax({
        url: PRODUCTS_API,
        method: 'GET',
        beforeSend() {
            $('#productContainer').html('<div class="loading">Loading products...</div>');
        },
        success(response) {
            products = response;
            $('#productContainer').empty();
            if (products.length === 0) {
                $('#productContainer').html('<p class="no-products">No products available.</p>');
                return;
            }
            products.forEach(product => {
                const discount = calculateDiscount(product.originalPrice, product.price);
                $('#productContainer').append(`
                    <div class="product-card" 
                         data-id="${product.productID}" 
                         data-title="${product.productName}" 
                         data-price="${product.price}" 
                         data-original-price="${product.originalPrice || product.price}"
                         data-description="${product.description}"
                         data-image="${product.imagePath}">
                        ${discount > 0 ? `<span class="product-badge">${discount}% OFF</span>` : ''}
                        <img src="${product.imagePath}" alt="${product.productName}" class="product-img">
                        <h4>${product.productName}</h4>
                        <div class="price-container">
                            ${product.originalPrice > product.price ? 
                                `<span class="original-price">$${product.originalPrice.toFixed(2)}</span>` : ''}
                            <span class="current-price">$${product.price.toFixed(2)}</span>
                            ${discount > 0 ? `<span class="discount-badge">Save $${(product.originalPrice - product.price).toFixed(2)}</span>` : ''}
                        </div>
                        <div class="product-actions">
                            <button class="btn-add-cart" data-id="${product.productID}" data-dealer-id="${product.dealerId || 1}">
                                <i class="fas fa-shopping-cart"></i> Add to Cart
                            </button>
                            <button class="btn-buy-now" data-id="${product.productID}" data-dealer-id="${product.dealerId || 1}">
                                <i class="fas fa-bolt"></i> Buy Now
                            </button>
                        </div>
                    </div>
                `);
            });
        },
        error(xhr, status, error) {
            console.error('Error fetching products:', status, error);
            $('#productContainer').html('<p class="error">Failed to load products. Please try again later.</p>');
        }
    });
}

// Open product modal with image slider
async function openProductModal(productId) {
    console.log('Opening product modal for product ID:', productId);
    try {
        const response = await fetch(`${API_BASE}/api/Products/${productId}`);
        if (!response.ok) {
            let errorText;
            try {
                const errorData = await response.json();
                errorText = errorData.message || JSON.stringify(errorData);
            } catch {
                errorText = await response.text();
            }
            throw new Error(`Failed to fetch product: ${response.status} - ${errorText}`);
        }
        const product = await response.json();
        console.log('Product fetched:', product);

        let additionalImages = [];
        try {
            const imagesResponse = await fetch(`${PRODUCT_IMAGES_API}/${productId}`);
            if (imagesResponse.ok) {
                additionalImages = await imagesResponse.json();
                console.log('Additional images fetched:', additionalImages);
            } else {
                console.warn('Failed to fetch additional images:', imagesResponse.status);
            }
        } catch (err) {
            console.error('Error fetching additional images:', err);
        }

        const images = [
            product.imagePath || 'https://via.placeholder.com/150',
            ...(Array.isArray(additionalImages) ? additionalImages.map(img => img.imagePath || 'https://via.placeholder.com/150') : [])
        ].filter(img => img && img !== '');

        if (!images || images.length === 0) {
            console.warn('No valid images found, using placeholder');
            images.push('https://via.placeholder.com/150');
        }

        const discount = calculateDiscount(product.originalPrice, product.price);
        $('#modelTitle').text(product.productName || 'Unknown Product');
        $('#modelPrice').text(`$${product.price?.toFixed(2) || 'N/A'}`);
        $('#modelOriginalPrice').text(product.originalPrice > product.price ? `$${product.originalPrice.toFixed(2)}` : '');
        $('#modelDescription').text(product.description || 'No description available.');
        const specs = product.specifications || [];
        $('#modelSpecs').html(specs.length ? specs.map(spec => `<li>${spec}</li>`).join('') : '<li>No specifications available.</li>');
        $('#modelReviews').html('<p>No reviews available.</p>');

        // Initialize slider
        $('#thumbnailContainer').html(`
            <div class="slider-wrapper">
                <button class="slider-prev" ${images.length <= 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>
                <div class="slider-track" style="width: ${images.length * 100}%">
                    ${images.map((img, index) => `
                        <div class="slide" style="width: ${100/images.length}%">
                            <img src="${img}" alt="product-image-${index}" class="product-image">
                        </div>
                    `).join('')}
                </div>
                <button class="slider-next" ${images.length <= 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div class="slider-dots">
                ${images.map((_, index) => `
                    <span class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></span>
                `).join('')}
            </div>
        `).data('current-index', 0);

        console.log('Slider initialized:', { images, currentIndex: 0 });

        $('#modelDiscountBadge').text(discount > 0 ? `${discount}% OFF` : '').toggle(discount > 0);
        $('#productModel').data('id', product.productID).data('dealer-id', product.dealerId || 1);
        $('#quantity').val(1);
        $('#productModel').fadeIn();
        $('body').css('overflow', 'hidden');
    } catch (err) {
        console.error('Error opening product modal:', err);
        showToast('Failed to load product details.', 'error');
    }
}

// Debounce utility for search
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Document ready
$(document).ready(function () {
    // Initialize modals
    $('#productModel').hide();
    $('#addressModal').hide();

    // Hero banner background rotation
    const banner = document.querySelector('.hero-banner');
    const images = [
        'https://images.unsplash.com/photo-1655358954448-cd25d99cc1bd?q=80&w=2126&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1739138053507-0f312a938451?q=80&w=2086&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1678911820864-e2c567c655d7?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    ];
    let currentImage = 0;
    function changeBackground() {
        currentImage = (currentImage + 1) % images.length;
        banner.style.backgroundImage = `url(${images[currentImage]})`;
    }
    setInterval(changeBackground, 5000);

    // Announcement bar scroll behavior
    $(window).on('scroll', function () {
        $('.announcement-bar').toggleClass('hidden', $(window).scrollTop() > 50);
    });

    // Event: Cart icon click
    cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        goToCart();
    });

    // Event: Orders link click
    $('.nav-link[href="../orders/orders.html"]').on('click', function (e) {
        e.preventDefault();
        goToOrders();
    });

    // Event: User icon click
    $('#userIcon').on('click', (e) => {
        e.preventDefault();
        goToProfile();
    });

    // Event: Logout button
    $('#logoutBtn').on('click', function (e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('pendingCartItem');
        localStorage.removeItem('pendingOrder');
        localStorage.removeItem('pendingAction');
        showToast('Logged out successfully.', 'info');
        window.location.reload();
    });

    // Event: Product card click (open modal)
    $(document).on('click', '.product-card', function (e) {
        if ($(e.target).closest('.product-actions, .btn-add-cart, .btn-buy-now').length) {
            console.log('Click on buttons or product-actions container, ignoring product card click');
            return;
        }
        const productId = $(this).data('id');
        console.log('Product card clicked, opening modal for product ID:', productId);
        openProductModal(productId);
    });

    // Event: Add to cart/Buy now buttons (product card)
    $(document).on('click', '.btn-add-cart, .btn-buy-now', function (e) {
        e.stopPropagation();
        e.preventDefault();
        const productId = $(this).data('id');
        const dealerId = $(this).data('dealer-id') || 1;
        console.log($(this).hasClass('btn-add-cart') ? 'Add to Cart button clicked' : 'Buy Now button clicked', { productId, dealerId });

        if (!productId) {
            console.error('Product ID missing');
            showToast('Product ID missing.', 'error');
            return;
        }

        if ($(this).hasClass('btn-add-cart')) {
            console.log('Triggering addToCart for product ID:', productId);
            addToCart(productId, 1);
        } else {
            console.log('Triggering openAddressModal for product ID:', productId);
            openAddressModal(productId, dealerId, 1);
        }
    });

    // Event: Close product modal
    $('#closeModel').click(function () {
        $('#productModel').fadeOut();
        $('body').css('overflow', 'auto');
    });

    // Event: Close address modal
    $('#addressModal .close').click(function () {
        $('#addressModal').fadeOut();
        $('body').css('overflow', 'auto');
    });

    // Prevent modal content clicks from closing modal
    $('.product-model-content').click(function (e) {
        e.stopPropagation();
    });

    // Event: Quantity increase
    $('.quantity-btn.plus').click(function () {
        const input = $('#quantity');
        const newValue = parseInt(input.val()) + 1;
        input.val(newValue);
    });

    // Event: Quantity decrease
    $('.quantity-btn.minus').click(function () {
        const input = $('#quantity');
        const newValue = Math.max(1, parseInt(input.val()) - 1);
        input.val(newValue);
    });

    // Event: Manual quantity input
    $('#quantity').on('input', function () {
        const value = parseInt(this.value);
        if (isNaN(value) || value < 1) {
            this.value = 1;
        }
    });

    // Event: Add to cart button (modal)
    $('#modelAddCart').on('click', function (e) {
        e.stopPropagation();
        const productId = $('#productModel').data('id');
        const quantity = parseInt($('#quantity').val()) || 1;
        if (!productId) {
            showToast('Product ID missing.', 'error');
            return;
        }
        if (quantity < 1) {
            showToast('Quantity must be at least 1.', 'error');
            return;
        }
        addToCart(productId, quantity);
    });

    // Event: Buy now button (modal)
    $('#modelBuyNow').on('click', function (e) {
        e.stopPropagation();
        const productId = $('#productModel').data('id');
        const dealerId = $('#productModel').data('dealer-id') || 1;
        const quantity = parseInt($('#quantity').val()) || 1;
        console.log('Buy Now clicked (modal):', { productId, dealerId, quantity });
        if (!productId) {
            showToast('Product ID missing.', 'error');
            return;
        }
        if (quantity < 1) {
            showToast('Quantity must be at least 1.', 'error');
            return;
        }
        openAddressModal(productId, dealerId, quantity);
    });

    // Event: Address selection
    $('#addressList').on('click', '.address-item', function (e) {
        e.stopPropagation();
        const addressId = $(this).data('id');
        const productId = $(this).data('product-id');
        const dealerId = $(this).data('dealer-id');
        const quantity = parseInt($(this).data('quantity'));
        console.log('Address item clicked:', { addressId, productId, dealerId, quantity });
        if (!addressId || !productId || !dealerId || isNaN(quantity)) {
            console.error('Invalid address selection data:', { addressId, productId, dealerId, quantity });
            showToast('Invalid address selection.', 'error');
            return;
        }
        selectAddress(addressId, productId, dealerId, quantity);
    });

    // Event: Slider navigation
    $(document).on('click', '.slider-prev:not(:disabled)', function () {
        const $container = $(this).siblings('.slider-track');
        const $wrapper = $(this).parent();
        const currentIndex = $wrapper.data('current-index') || 0;
        const images = $wrapper.find('.slide').length;
        if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            $wrapper.data('current-index', newIndex);
            $container.css('transform', `translateX(-${newIndex * (100 / images)}%)`);
            updateSliderControls($wrapper, newIndex, images);
        }
    });

    $(document).on('click', '.slider-next:not(:disabled)', function () {
        const $container = $(this).siblings('.slider-track');
        const $wrapper = $(this).parent();
        const currentIndex = $wrapper.data('current-index') || 0;
        const images = $wrapper.find('.slide').length;
        if (currentIndex < images - 1) {
            const newIndex = currentIndex + 1;
            $wrapper.data('current-index', newIndex);
            $container.css('transform', `translateX(-${newIndex * (100 / images)}%)`);
            updateSliderControls($wrapper, newIndex, images);
        }
    });

    $(document).on('click', '.dot', function () {
        const index = $(this).data('index');
        const $wrapper = $(this).closest('.slider-wrapper');
        const $container = $wrapper.find('.slider-track');
        const images = $wrapper.find('.slide').length;
        $wrapper.data('current-index', index);
        $container.css('transform', `translateX(-${index * (100 / images)}%)`);
        updateSliderControls($wrapper, index, images);
    });

    function updateSliderControls($wrapper, currentIndex, totalImages) {
        $wrapper.find('.dot').removeClass('active').eq(currentIndex).addClass('active');
        $wrapper.find('.slider-prev').prop('disabled', currentIndex === 0);
        $wrapper.find('.slider-next').prop('disabled', currentIndex === totalImages - 1);
    }

    // Search functionality
    searchInput.addEventListener('input', debounce(function () {
        const query = this.value.trim();
        if (query.length < 1) {
            $('#searchSuggestions').empty().hide();
            return;
        }
        $.ajax({
            url: `${API_BASE}/api/Products/search?query=${encodeURIComponent(query)}`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success(response) {
                $('#searchSuggestions').empty();
                if (!response || response.length === 0) {
                    $('#searchSuggestions').append('<div class="suggestion-item">No products found</div>').show();
                    return;
                }
                response.forEach(product => {
                    const imageSrc = product.imagePath ? `${API_BASE}${product.imagePath.trim()}` : 'https://via.placeholder.com/50';
                    $('#searchSuggestions').append(`
                        <div class="suggestion-item" data-id="${product.productID}">
                            <img src="${imageSrc}" alt="${product.productName || 'Product'}" class="suggestion-img">
                            <span>${product.productName || 'Unnamed Product'} - $${product.price?.toFixed(2) || 'N/A'}</span>
                        </div>
                    `);
                });
                $('#searchSuggestions').show();
            },
            error(xhr, status, error) {
                console.error('Error fetching search results:', status, error);
                $('#searchSuggestions').empty().append('<div class="suggestion-item">Error fetching products</div>').show();
            }
        });
    }, 300));

    // Event: Search icon click
    $('.search-icon').on('click', function () {
        const query = $('#searchInput').val().trim();
        if (query.length === 0) {
            showToast('Please enter a search term.', 'info');
            return;
        }
        $('#searchInput').trigger('input');
    });

    // Event: Hide suggestions on outside click
    $(document).on('click', function (e) {
        if (!$(e.target).closest('#searchInput, #searchSuggestions, .search-icon').length) {
            $('#searchSuggestions').hide();
        }
    });

    // Event: Suggestion item click
    $(document).on('click', '.suggestion-item', function () {
        const productId = $(this).data('id');
        if (productId) {
            openProductModal(productId);
            $('#searchSuggestions').hide();
            $('#searchInput').val('');
        }
    });

    // Initialize page
    updateAccountLink();
    loadUserProfile();
    loadCartCount();
    loadProducts();

    // Handle pending actions after login
    const pendingAction = localStorage.getItem('pendingAction');
    if (isLoggedIn && pendingAction) {
        console.log('Handling pending action:', pendingAction);
        if (pendingAction === 'addToCart') {
            const pendingCartItem = JSON.parse(localStorage.getItem('pendingCartItem') || '{}');
            if (pendingCartItem.productId && pendingCartItem.quantity) {
                console.log('Executing pending addToCart:', pendingCartItem);
                addToCart(pendingCartItem.productId, pendingCartItem.quantity);
            }
        } else if (pendingAction === 'buyNow') {
            const pendingOrder = JSON.parse(localStorage.getItem('pendingOrder') || '{}');
            if (pendingOrder.productId && pendingOrder.quantity && pendingOrder.dealerId) {
                console.log('Executing pending buyNow:', pendingOrder);
                openAddressModal(pendingOrder.productId, pendingOrder.dealerId, pendingOrder.quantity);
            }
        }
        localStorage.removeItem('pendingAction');
        localStorage.removeItem('pendingCartItem');
        localStorage.removeItem('pendingOrder');
    }
});