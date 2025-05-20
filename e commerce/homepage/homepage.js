const API_URL = 'http://192.168.2.204:5154/api/Products/all';
const IMAGE_BASE_URL = 'http://192.168.2.204:5154/Images/';

$.ajax({
    url: API_URL,
    type: 'GET',
    dataType: 'json',
    success: function(data) {
        if (Array.isArray(data) && data.length > 0) {
            renderProducts(data);
        } else {
            $('#products-container').html('<p>No products available.</p>');
        }
    },
    error: function(xhr, status, error) {
        console.error('Error fetching products:', error);
        $('#products-container').html('<p>Failed to load products.</p>');
    }
});

function renderProducts(products) {
    const container = $('#products-container');
    container.empty();

    products.forEach(product => {
        let imageUrl = product.imagePath;

        // If the imagePath is not a full URL, prepend the IMAGE_BASE_URL
        if (!imageUrl.startsWith('http')) {
            imageUrl = IMAGE_BASE_URL + imageUrl;
        }

        const productHTML = `
            <div class="product-card">
                <img src="${imageUrl}" alt="${product.productName}">
                <h3>${product.productName}</h3>
                <p><strong>Price:</strong> ₹${product.price}</p>
                <p><strong>Stock:</strong> ${product.stock}</p>
                <p>${product.description}</p>
            </div>
        `;
        container.append(productHTML);
    });
}
