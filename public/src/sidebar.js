import { isMobileDevice } from './dpad.js';
import { secureApi } from './zoom.js';
import { unzoom } from './zoom.js';

export const objectInfo = {
    "Cube043": { productId: 617 },
    "Cube042": { productId: 600 },
    "Cube041": { productId: 252 },
    "Cube040": { productId: 252 },
    "Pattern2D_8750002_1": { productId: 352185 },
    "Pattern2D_8750007_1_1": { productId: 352185 },
    "Pattern2D_8750007_1_2": { productId: 352185 }
};

// Cart system using localStorage
let cartItems = JSON.parse(localStorage.getItem('cart')) || [];
let currentProduct = null;

// Initialize cart UI
updateCartCount();

// Hide hamburger icon during loading (on mobile)
document.addEventListener('DOMContentLoaded', () => {
    if (isMobileDevice()) {
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.style.display = 'none';
        }
    }
});

// When loading is complete (call this from your loading complete logic)
function onLoadingComplete() {
    if (isMobileDevice()) {
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.style.display = 'block';
        }
    }
}

// Modified close-sidebar click event to trigger unzoom.
document.getElementById('close-sidebar')?.addEventListener('click', () => {
    const sidebar = document.getElementById('product-sidebar');
    sidebar.classList.remove('active');
    unzoom();
    // Re-display the hamburger icon on mobile.
    if (isMobileDevice()) {
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.style.display = 'block';
        }
    }
});

// For desktop: clicking outside the sidebar hides it.
if (!isMobileDevice()) {
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('product-sidebar');
        if (sidebar && !sidebar.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
}

// Sidebar toggle listener for mobile.
const sidebarToggle = document.getElementById('sidebar-toggle');
if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        const sidebar = document.getElementById('product-sidebar');
        sidebar.classList.toggle('active');
        if (isMobileDevice()) {
            if (sidebar.classList.contains('active')) {
                sidebarToggle.style.display = 'none';
            } else {
                sidebarToggle.style.display = 'block';
            }
        }
    });
}

document.getElementById('add-to-cart')?.addEventListener('click', () => {
    if (!currentProduct) {
        showCartNotification('No product selected', true);
        return;
    }

    const productToAdd = {
        id: currentProduct.selectedVariation?.id || currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.selectedVariation?.price || currentProduct.price,
        variation: currentProduct.selectedVariation
    };

    const existingItem = cartItems.find(item =>
        item.product_id === productToAdd.id &&
        JSON.stringify(item.variation) === JSON.stringify(productToAdd.variation)
    );
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartItems.push({
            product_id: productToAdd.id,
            quantity: 1,
            name: productToAdd.name,
            price: productToAdd.price,
            variation: productToAdd.variation
        });
    }

    localStorage.setItem('cart', JSON.stringify(cartItems));
    updateCartCount();
    showCartNotification(`${productToAdd.name} added to cart`);
});

// Checkout handler.
document.getElementById('checkout-button')?.addEventListener('click', async () => {
    const emailInput = document.getElementById('customer-email');
    
    if (!emailInput.checkValidity()) {
        showCartNotification('Please enter valid email', true);
        return;
    }

    if (cartItems.length === 0) {
        showCartNotification('Your cart is empty', true);
        return;
    }

    const checkoutBtn = document.getElementById('checkout-button');
    try {
        checkoutBtn.disabled = true;
        const originalText = checkoutBtn.textContent;
        checkoutBtn.textContent = 'Processing...';

        const order = await secureApi.createOrder(
            cartItems.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity
            })),
            emailInput.value
        );

        // Clear cart after successful order creation.
        cartItems = [];
        localStorage.removeItem('cart');
        updateCartCount();
        
        window.location.href = order.payment_url;
    } catch (error) {
        showCartNotification(`Checkout failed: ${error.message}`, true);
    } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = `Checkout (${cartItems.length})`;
    }
});

export function updateCartCount() {
    const countElement = document.getElementById('cart-count');
    if (countElement) {
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        countElement.textContent = totalItems;
        
        // Update checkout button text while preserving the span.
        const checkoutButton = document.getElementById('checkout-button');
        if (checkoutButton) {
            checkoutButton.innerHTML = `Proceed to Checkout (<span id="cart-count">${totalItems}</span>)`;
        }
    }
}

export function showProductSidebar(productDetails) {
    if (!productDetails) return;

    currentProduct = productDetails;
    const elements = {
        sidebar: document.getElementById('product-sidebar'),
        title: document.getElementById('product-title'),
        image: document.getElementById('product-image'),
        description: document.getElementById('product-description'),
        price: document.getElementById('product-price'),
        attributes: document.getElementById('product-attributes')
    };

    if (elements.sidebar) {
        elements.sidebar.addEventListener('click', function(event) {
            event.stopPropagation();
        });
    }

    // Validate that all required elements exist.
    if (Object.values(elements).some(el => !el)) {
        console.error('Missing sidebar elements');
        return;
    }

    console.log(productDetails);

    // Clear previous content.
    elements.title.textContent = productDetails.name || 'Product Name';
    elements.price.innerHTML = productDetails.price_html || 'Price Not Available';
    elements.description.innerHTML = productDetails.short_description || 'No Description';
    elements.attributes.innerHTML = '';

    // Handle product images.
    elements.image.innerHTML = productDetails.images?.length
        ? `<img src="${productDetails.images[0].src}" alt="${productDetails.name}" class="product-main-image">`
        : 'No Image Available';

    // Handle product attributes with multiple options.
    if (productDetails.attributes?.length) {
        productDetails.attributes.forEach(attr => {
            if (!attr.options || attr.options.length < 2) return;
            const wrapper = document.createElement('div');
            wrapper.className = 'attribute-selector';
            wrapper.innerHTML = `
                <label>${attr.name}</label>
                <select class="attribute-dropdown" data-attribute="${attr.slug}">
                    ${attr.options.map(option => `<option value="${option}">${option}</option>`).join('')}
                </select>
            `;
            elements.attributes.appendChild(wrapper);
        });

        if (elements.attributes.children.length > 0) {
            elements.attributes.querySelectorAll('.attribute-dropdown').forEach(select => {
                select.addEventListener('change', () => updateVariationPrice());
            });
        }
    }

    // Activate sidebar based on device.
    if (isMobileDevice()) {
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.textContent = productDetails.name;
            sidebarToggle.style.display = 'none';
        }
        elements.sidebar.classList.add('active');
    } else {
        elements.sidebar.classList.add('active');
    }

    const updateVariationPrice = () => {
        const selectedAttributes = {};
        elements.attributes.querySelectorAll('.attribute-dropdown').forEach(select => {
            selectedAttributes[select.dataset.attribute] = select.value;
        });

        productDetails.attributes?.forEach(attr => {
            if (attr.options?.length === 1) {
                selectedAttributes[attr.slug] = attr.options[0];
            }
        });

        let matchedVariation = null;
        if (productDetails.variations?.length) {
            matchedVariation = productDetails.variations.find(v => {
                if (!v.attributes) return false;
                return Object.entries(selectedAttributes).every(([attrSlug, selectedValue]) => {
                    const variationValue = v.attributes[attrSlug] ||
                                           v.attributes[attrSlug.replace('pa_', '')] ||
                                           v.attributes[attrSlug.replace(/^attribute_/, '')];
                    return variationValue === selectedValue;
                });
            });
        }

        elements.price.innerHTML = matchedVariation?.price_html || productDetails.price_html;
        currentProduct.selectedVariation = matchedVariation || null;
        console.log('Selected Attributes:', selectedAttributes);
        console.log('Matched Variation:', matchedVariation);
    };

    updateVariationPrice();
}

export function showCartNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = `cart-notification${isError ? ' error' : ''}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('visible'), 10);
    
    setTimeout(() => {
        notification.classList.remove('visible');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
