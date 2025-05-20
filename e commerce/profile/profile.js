const API_BASE = 'http://192.168.2.204:5215';
const CUSTOMER_API = `${API_BASE}/api/Customer`;
const ADDRESS_API = `${API_BASE}/api/CustomerAddress`;

const JWTUtils = {
    decode: function (token) {
        try {
            const payload = token.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            return decoded;
        } catch (e) {
            console.error("JWT decode error:", e);
            return null;
        }
    },
    getCustomerId: function () {
        const token = localStorage.getItem("token");
        if (!token) return null;
        const decoded = this.decode(token);
        return decoded?.customerId || decoded?.CustomerID || null;
    },
    isExpired: function (decodedToken) {
        if (!decodedToken || !decodedToken.exp) return true;
        const now = Math.floor(Date.now() / 1000);
        return decodedToken.exp < now;
    }
};

const token = localStorage.getItem('token');
const decodedToken = token ? JWTUtils.decode(token) : null;
const isLoggedIn = token && decodedToken && !JWTUtils.isExpired(decodedToken);
const customerId = isLoggedIn ? JWTUtils.getCustomerId() : null;

if (!isLoggedIn) {
    showToast('Your session has expired. Please log in again.', 'error');
    localStorage.removeItem("token");
    localStorage.setItem('pendingAction', 'profile');
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

function goBack() {
    window.location.href = '../homepage1/homepage1.html';
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('pendingCartItem');
    localStorage.removeItem('pendingAction');
    window.location.href = '../homepage1/homepage1.html';
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
        updateUserProfile({
            name: data.customerName || 'Unknown',
            photo: data.image ? `${API_BASE}${data.image.trim()}` : null
        });

        $('#profile-info').html(`
            <div class="info-item"><i class="fas fa-user"></i><span>Name:</span><p>${data.customerName || '-'}</p></div>
            <div class="info-item"><i class="fas fa-envelope"></i><span>Email:</span><p>${data.customerEmail || '-'}</p></div>
            <div class="info-item"><i class="fas fa-phone-alt"></i><span>Contact:</span><p>${data.contactNumber || '-'}</p></div>
        `);

        const imageUrl = data.image ? `${API_BASE}${data.image.trim()}` : "https://cdn-icons-png.flaticon.com/512/847/847969.png";
        $('#profile-pic').attr('src', imageUrl);
    } catch (err) {
        console.error('Error loading profile:', err);
        updateUserProfile(null);
        $('#profile-info').text('Error loading profile.');
        showToast('Failed to load profile.', 'error');
    }
}

async function uploadImage() {
    const fileInput = $('#imageUpload');
    const file = fileInput[0]?.files[0];

    if (!file || !token) {
        showToast('Missing file or credentials.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`${CUSTOMER_API}/${customerId}/UploadImage`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (!response.ok) {
            let errorText;
            try {
                const errorData = await response.json();
                errorText = errorData.message || JSON.stringify(errorData);
            } catch {
                errorText = await response.text();
            }
            throw new Error(`Upload failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        const imageUrl = result.imageUrl || result.image || (result.data?.image ? `${API_BASE}${result.data.image.trim()}` : null);
        if (imageUrl) {
            $('#profile-pic').attr('src', imageUrl);
            showToast('Image updated!', 'success');
            loadUserProfile();
        } else {
            throw new Error('No valid image URL returned from server.');
        }
    } catch (err) {
        console.error('Error uploading image:', err);
        showToast('Error uploading image.', 'error');
    }
}

async function loadAddresses() {
    if (!isLoggedIn) {
        showToast('Please log in to view addresses.', 'error');
        window.location.href = '../login/login.html';
        return;
    }

    const container = $('#address-list');
    container.html('Loading...');

    try {
        const response = await fetch(`${ADDRESS_API}/customer/${customerId}`, {
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
            throw new Error(`Failed to fetch addresses: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        container.empty();

        if (!data.length) {
            container.html('<p style="text-align:center;">No address found.</p>');
            return;
        }

        data.forEach(addr => {
            container.append(`
                <div class="address-item" data-id="${addr.addressId}">
                    <p><strong>Name:</strong> ${addr.name || '-'}</p>
                    <p><strong>Phone:</strong> ${addr.phoneNumber || '-'}</p>
                    <p><strong>Address:</strong> ${addr.address || '-'}</p>
                    <button class="edit-address-btn" style="margin-right:10px;">Edit</button>
                    <button class="delete-address-btn">Delete</button>
                </div>
            `);
        });
    } catch (err) {
        container.html('Error loading addresses.');
        console.error('Error loading addresses:', err);
        showToast('Error loading addresses.', 'error');
    }
}

async function openAddressModal() {
    if (!isLoggedIn) {
        showToast('Please log in to add an address.', 'error');
        window.location.href = '../login/login.html';
        return;
    }

    try {
        const response = await fetch(`${ADDRESS_API}/customer/${customerId}`, {
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
            throw new Error(`Failed to fetch addresses: ${response.status} - ${errorText}`);
        }

        const addresses = await response.json();
        if (addresses.length >= 3) {
            showToast('Maximum address limit (3) reached. Please edit or delete an existing address.', 'error');
            window.location.href = './profile.html';
            return;
        }

        clearAddressForm();
        $('#addressModal').css('display', 'flex');
    } catch (err) {
        console.error('Error checking address limit:', err);
        showToast('Error checking address limit.', 'error');
    }
}

function closeAddressModal() {
    $('#addressModal').hide();
}

function clearAddressForm() {
    $('#addressId').val('');
    $('#addrName').val('');
    $('#addrPhone').val('');
    $('#addrAddress').val('');
}

function editAddress(addr) {
    $('#addressId').val(addr.addressId || '');
    $('#addrName').val(addr.name || '');
    $('#addrPhone').val(addr.phoneNumber || '');
    $('#addrAddress').val(addr.address || '');
    $('#addressModal').css('display', 'flex');
}

async function saveAddress() {
    if (!isLoggedIn) {
        showToast('Please log in to save an address.', 'error');
        window.location.href = '../login/login.html';
        return;
    }

    const addressId = $('#addressId').val();
    const name = $('#addrName').val().trim();
    const phone = $('#addrPhone').val().trim();
    const address = $('#addrAddress').val().trim();

    if (!name || !phone || !address) {
        showToast('Please fill all fields.', 'error');
        return;
    }

    const method = addressId ? 'PUT' : 'POST';
    const url = addressId ? `${ADDRESS_API}/${addressId}` : `${ADDRESS_API}`;

    const payload = {
        customerId: customerId,
        name: name,
        phoneNumber: phone,
        address: address
    };

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            let errorText;
            try {
                const errorData = await response.json();
                errorText = errorData.message || JSON.stringify(errorData);
            } catch {
                errorText = await response.text();
            }
            throw new Error(`Failed to save address: ${response.status} - ${errorText}`);
        }

        closeAddressModal();
        loadAddresses();
        showToast('Address saved!', 'success');
    } catch (err) {
        console.error('Error saving address:', err);
        showToast('Error saving address.', 'error');
    }
}

async function deleteAddress(addressId) {
    if (!isLoggedIn) {
        showToast('Please log in to delete an address.', 'error');
        window.location.href = '../login/login.html';
        return;
    }

    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
        const response = await fetch(`${ADDRESS_API}/${addressId}`, {
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
            throw new Error(`Failed to delete address: ${response.status} - ${errorText}`);
        }

        loadAddresses();
        showToast('Address deleted!', 'success');
    } catch (err) {
        console.error('Error deleting address:', err);
        if (err.message.includes('REFERENCE constraint')) {
            showToast('Cannot delete address because it is used in an order.', 'error');
        } else {
            showToast('Error deleting address.', 'error');
        }
    }
}

$(document).ready(function() {
    updateAccountLink();
    loadUserProfile();
    loadAddresses();

    $('#imageUpload').on('change', uploadImage);

    $('#userIcon').on('click', (e) => {
        e.preventDefault();
        window.location.href = './profile.html';
    });

    $('#logoutBtn').on('click', function (e) {
        e.preventDefault();
        logout();
    });

    $('#address-list').on('click', '.edit-address-btn', function() {
        const addressItem = $(this).closest('.address-item');
        const addr = {
            addressId: addressItem.data('id'),
            name: addressItem.find('p').eq(0).text().replace('Name: ', ''),
            phoneNumber: addressItem.find('p').eq(1).text().replace('Phone: ', ''),
            address: addressItem.find('p').eq(2).text().replace('Address: ', '')
        };
        editAddress(addr);
    });

    $('#address-list').on('click', '.delete-address-btn', function() {
        const addressId = $(this).closest('.address-item').data('id');
        deleteAddress(addressId);
    });

    $(window).on('scroll', function() {
        if ($(window).scrollTop() > 50) {
            $('.announcement-bar').addClass('hidden');
        } else {
            $('.announcement-bar').removeClass('hidden');
        }
    });

    $(document).on('cartUpdated', function() {
        // No cart count update needed on profile page, but included for consistency
    });
});