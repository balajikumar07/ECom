document.addEventListener('DOMContentLoaded', function() {
    // API Configuration
    const API_URL = 'http://192.168.2.12:5154/api/Products/all';
    
    // DOM Elements
    const productsContainer = document.getElementById('productsContainer');
    const cartIcon = document.getElementById('cartIcon');
    const cartCount = document.querySelector('.cart-count');
    const userIcon = document.getElementById('userIcon');
    const accountLink = document.getElementById('accountLink');
    const productModal = document.getElementById('productModal');
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');
    const modalAddToCart = document.getElementById('modalAddToCart');
    
    // State
    let cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    let products = [];
    
    // Initialize
    updateCartCount();
    checkLoginStatus();
    fetchProducts();
    
    // Event Listeners
    cartIcon.addEventListener('click', handleCartClick);
    userIcon.addEventListener('click', handleUserClick);
    accountLink.addEventListener('click', handleUserClick);
    showSignup.addEventListener('click', showSignupModal);
    showLogin.addEventListener('click', showLoginModal);
    
    // Fetch Products from API
    async function fetchProducts() {
        try {
            const response = await fetch(API_URL);
            
            if (!response.ok) {
                throw new Error(`Server returned status: ${response.status}`);
            }
            
            products = await response.json();
            
            if (!products || products.length === 0) {
                throw new Error('No products found in response');
            }
            
            renderProducts(products);
        } catch (error) {
            console.error('Error fetching products:', error);
            productsContainer.innerHTML = `<p class="error">Error loading products: ${error.message}</p>`;
        }
    }
    
    // Render Products
    function renderProducts(products) {
        productsContainer.innerHTML = products.map(product => `
            <div class="product-card" data-id="${product.id}">
                <img src="${product.image || 'default-product.jpg'}" 
                     alt="${product.name || 'Product image'}"
                     class="product-image"
                     onerror="this.src='default-product.jpg'">
                <div class="product-info">
                    <h3>${product.name || 'No name available'}</h3>
                    <p class="price">$${(product.price || 0).toFixed(2)}</p>
                    <div class="product-actions">
                        <button class="view-btn" data-id="${product.id}">VIEW</button>
                        <button class="add-to-cart-btn" data-id="${product.id}">ADD TO CART</button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add event listeners to all view and add to cart buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.getAttribute('data-id');
                showProductModal(productId);
            });
        });
        
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.getAttribute('data-id');
                addToCart(productId);
            });
        });
    }
    
    // Show Product Modal
    function showProductModal(productId) {
        const product = products.find(p => p.id == productId);
        if (!product) return;
        
        // Set modal content
        document.getElementById('modalProductName').textContent = product.name;
        document.getElementById('modalProductPrice').textContent = `$${product.price.toFixed(2)}`;
        document.getElementById('modalProductDescription').textContent = product.description || 'No description available';
        document.getElementById('modalProductStock').textContent = `In Stock: ${product.stock || 0}`;
        document.getElementById('modalMainImage').src = product.image || 'default-product.jpg';
        
        // Clear and set thumbnails (for demo, using same image)
        const thumbnailsContainer = document.querySelector('.thumbnail-images');
        thumbnailsContainer.innerHTML = '';
        
        // Add 3 thumbnails (in real app, these would be different product images)
        for (let i = 0; i < 3; i++) {
            const thumbImg = document.createElement('img');
            thumbImg.src = product.image || 'default-product.jpg';
            thumbImg.alt = `${product.name} thumbnail ${i+1}`;
            thumbImg.addEventListener('click', () => {
                document.getElementById('modalMainImage').src = thumbImg.src;
            });
            thumbnailsContainer.appendChild(thumbImg);
        }
        
        // Set up add to cart button in modal
        modalAddToCart.setAttribute('data-id', product.id);
        
        // Show modal
        productModal.style.display = 'block';
    }
    
    // Add to Cart
    function addToCart(productId) {
        if (!isLoggedIn) {
            showLoginModal();
            return;
        }
        
        const product = products.find(p => p.id == productId);
        if (!product) return;
        
        // Check if product already in cart
        const existingItem = cartItems.find(item => item.id == productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cartItems.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        }
        
        // Update cart in localStorage
        localStorage.setItem('cart', JSON.stringify(cartItems));
        updateCartCount();
        
        // Change button text if in modal
        if (modalAddToCart.getAttribute('data-id') == productId) {
            modalAddToCart.textContent = 'GO TO CART';
            modalAddToCart.classList.add('go-to-cart');
        }
        
        // Find the button in the grid and update it
        const gridBtn = document.querySelector(`.add-to-cart-btn[data-id="${productId}"]`);
        if (gridBtn) {
            gridBtn.textContent = 'IN CART';
            gridBtn.classList.add('in-cart');
        }
    }
    
    // Update Cart Count
    function updateCartCount() {
        const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
    
    // Handle Cart Click
    function handleCartClick(e) {
        e.preventDefault();
        if (!isLoggedIn) {
            showLoginModal();
        } else {
            // In a full implementation, this would open the cart page/modal
            alert('Cart page would open here');
        }
    }
    
    // Handle User Click
    function handleUserClick(e) {
        e.preventDefault();
        if (isLoggedIn) {
            // In a full implementation, this would open the account page
            alert('Account page would open here');
        } else {
            showLoginModal();
        }
    }
    
    // Check Login Status
    function checkLoginStatus() {
        if (isLoggedIn) {
            userIcon.innerHTML = '<i class="fas fa-user-check"></i>';
            accountLink.textContent = 'My Account';
        } else {
            userIcon.innerHTML = '<i class="fas fa-user"></i>';
            accountLink.textContent = 'Login/Signup';
        }
    }
    
    // Show Login Modal
    function showLoginModal() {
        loginModal.style.display = 'block';
        signupModal.style.display = 'none';
    }
    
    // Show Signup Modal
    function showSignupModal(e) {
        e.preventDefault();
        loginModal.style.display = 'none';
        signupModal.style.display = 'block';
    }
    
    // Close Modals when clicking X
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            productModal.style.display = 'none';
            loginModal.style.display = 'none';
            signupModal.style.display = 'none';
        });
    });
    
    // Close Modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === productModal) productModal.style.display = 'none';
        if (e.target === loginModal) loginModal.style.display = 'none';
        if (e.target === signupModal) signupModal.style.display = 'none';
    });
    
    // Login Form Submission
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        // In a real app, you would validate credentials with the server
        isLoggedIn = true;
        localStorage.setItem('isLoggedIn', 'true');
        checkLoginStatus();
        loginModal.style.display = 'none';
    });
    
    // Signup Form Submission
    document.getElementById('signupForm').addEventListener('submit', (e) => {
        e.preventDefault();
        // In a real app, you would send signup data to the server
        isLoggedIn = true;
        localStorage.setItem('isLoggedIn', 'true');
        checkLoginStatus();
        signupModal.style.display = 'none';
    });
    
    // Modal Add to Cart Button
    modalAddToCart.addEventListener('click', () => {
        const productId = modalAddToCart.getAttribute('data-id');
        if (modalAddToCart.classList.contains('go-to-cart')) {
            // In a full implementation, this would redirect to cart page
            alert('Would redirect to cart page');
        } else {
            addToCart(productId);
        }
    });
});