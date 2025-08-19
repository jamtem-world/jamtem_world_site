// Cart Management System
class CartManager {
    constructor() {
        this.cart = this.loadCart();
        this.shopDomain = null;
        this.init();
    }

    async init() {
        await this.loadConfig();
        this.setupCartModal();
        this.updateCartDisplay();
    }

    async loadConfig() {
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            this.shopDomain = config.shopDomain;
        } catch (error) {
            console.error('Error loading config:', error);
        }
    }

    loadCart() {
        try {
            const savedCart = localStorage.getItem('jamtem_cart');
            return savedCart ? JSON.parse(savedCart) : { items: [], total: 0 };
        } catch (error) {
            console.error('Error loading cart from localStorage:', error);
            return { items: [], total: 0 };
        }
    }

    saveCart() {
        try {
            localStorage.setItem('jamtem_cart', JSON.stringify(this.cart));
        } catch (error) {
            console.error('Error saving cart to localStorage:', error);
        }
    }

    addToCart(product, variant, quantity = 1) {
        const variantId = variant.id.split('/').pop();
        const existingItemIndex = this.cart.items.findIndex(item => item.variantId === variantId);
        
        const price = parseFloat(variant.priceV2.amount);
        const item = {
            variantId: variantId,
            productId: product.id,
            productTitle: product.title,
            variantTitle: variant.title,
            price: price,
            quantity: quantity,
            image: product.images.edges[0]?.node.url || null,
            selectedOptions: variant.selectedOptions
        };

        if (existingItemIndex > -1) {
            // Update existing item quantity
            this.cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            this.cart.items.push(item);
        }

        this.updateCartTotal();
        this.saveCart();
        this.updateCartDisplay();
    }

    removeFromCart(variantId) {
        this.cart.items = this.cart.items.filter(item => item.variantId !== variantId);
        this.updateCartTotal();
        this.saveCart();
        this.updateCartDisplay();
    }

    updateQuantity(variantId, newQuantity) {
        const item = this.cart.items.find(item => item.variantId === variantId);
        if (item) {
            if (newQuantity <= 0) {
                this.removeFromCart(variantId);
            } else {
                item.quantity = newQuantity;
                this.updateCartTotal();
                this.saveCart();
                this.updateCartDisplay();
            }
        }
    }

    updateCartTotal() {
        this.cart.total = this.cart.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    clearCart() {
        this.cart = { items: [], total: 0 };
        this.saveCart();
        this.updateCartDisplay();
    }

    getItemCount() {
        return this.cart.items.reduce((count, item) => count + item.quantity, 0);
    }

    setupCartModal() {
        // Check if modal already exists
        if (document.getElementById('cart-modal')) {
            return;
        }

        // Create cart modal HTML
        const cartModalHTML = `
            <div class="cart-modal-overlay" id="cart-modal" style="display: none;">
                <div class="cart-modal-container">
                    <div class="cart-modal-header">
                        <h2>Shopping Cart</h2>
                        <button class="cart-modal-close" id="cart-modal-close" aria-label="Close cart">&times;</button>
                    </div>
                    
                    <div class="cart-modal-content">
                        <div class="cart-items" id="cart-items">
                            <!-- Cart items will be populated here -->
                        </div>
                        
                        <div class="cart-empty" id="cart-empty" style="display: none;">
                            <p>Your cart is empty</p>
                            <button class="btn btn-primary" onclick="cartManager.closeCart()">Continue Shopping</button>
                        </div>
                    </div>
                    
                    <div class="cart-modal-footer" id="cart-footer">
                        <div class="cart-total">
                            <div class="cart-total-label">Total: <span id="cart-total-amount">$0.00</span></div>
                        </div>
                        <div class="cart-actions">
                            <button class="btn btn-secondary" onclick="cartManager.clearCart()">Clear Cart</button>
                            <button class="btn btn-primary" id="checkout-btn" onclick="cartManager.proceedToCheckout()">Checkout</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add cart modal to body
        document.body.insertAdjacentHTML('beforeend', cartModalHTML);


        // Setup event listeners
        this.setupCartEventListeners();
    }

    setupCartEventListeners() {
        const modal = document.getElementById('cart-modal');
        const closeBtn = document.getElementById('cart-modal-close');

        // Close modal events
        closeBtn.addEventListener('click', () => this.closeCart());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeCart();
            }
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                this.closeCart();
            }
        });

        // Cart icon click event
        const cartIcon = document.getElementById('cart-icon');
        if (cartIcon) {
            cartIcon.addEventListener('click', () => this.openCart());
        }
    }

    openCart() {
        const modal = document.getElementById('cart-modal');
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
        this.renderCartItems();
    }

    closeCart() {
        const modal = document.getElementById('cart-modal');
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }

    renderCartItems() {
        const cartItemsContainer = document.getElementById('cart-items');
        const cartEmpty = document.getElementById('cart-empty');
        const cartFooter = document.getElementById('cart-footer');

        if (this.cart.items.length === 0) {
            cartItemsContainer.style.display = 'none';
            cartEmpty.style.display = 'block';
            cartFooter.style.display = 'none';
            return;
        }

        cartItemsContainer.style.display = 'block';
        cartEmpty.style.display = 'none';
        cartFooter.style.display = 'block';

        cartItemsContainer.innerHTML = '';

        this.cart.items.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-image">
                    ${item.image ? 
                        `<img src="${item.image}" alt="${item.productTitle}" loading="lazy">` : 
                        '<div class="cart-item-placeholder">No Image</div>'
                    }
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-title">${this.escapeHtml(item.productTitle)}</div>
                    ${item.variantTitle !== 'Default Title' ? 
                        `<div class="cart-item-variant">${this.escapeHtml(item.variantTitle)}</div>` : 
                        ''
                    }
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                </div>
                <div class="cart-item-controls">
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="cartManager.updateQuantity('${item.variantId}', ${item.quantity - 1})">-</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn" onclick="cartManager.updateQuantity('${item.variantId}', ${item.quantity + 1})">+</button>
                    </div>
                    <button class="cart-item-remove" onclick="cartManager.removeFromCart('${item.variantId}')" aria-label="Remove item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItem);
        });

        // Update total
        document.getElementById('cart-total-amount').textContent = `$${this.cart.total.toFixed(2)}`;
    }

    updateCartDisplay() {
        const cartBadge = document.getElementById('cart-badge');
        const itemCount = this.getItemCount();
        
        if (cartBadge) {
            cartBadge.textContent = itemCount;
            if (itemCount > 0) {
                cartBadge.style.display = 'flex';
                // Add bounce animation when items are added
                cartBadge.classList.add('animate');
                setTimeout(() => cartBadge.classList.remove('animate'), 300);
            } else {
                cartBadge.style.display = 'none';
            }
        }
        
        // Update cart modal if it's open
        const modal = document.getElementById('cart-modal');
        if (modal && modal.style.display === 'flex') {
            this.renderCartItems();
        }
    }


    proceedToCheckout() {
        if (this.cart.items.length === 0) {
            alert('Your cart is empty');
            return;
        }

        if (!this.shopDomain) {
            alert('Shop configuration error. Please try again later.');
            return;
        }

        // Create checkout URL with all cart items
        const cartItems = this.cart.items.map(item => `${item.variantId}:${item.quantity}`).join(',');
        const checkoutUrl = `https://${this.shopDomain}/cart/${cartItems}`;
        
        // Open checkout in new tab
        window.open(checkoutUrl, '_blank');
        
        // Optionally clear cart after checkout
        // this.clearCart();
        
        // Close cart modal
        this.closeCart();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Method for quick buy (bypass cart)
    quickBuy(product, variant, quantity = 1) {
        if (!this.shopDomain) {
            alert('Shop configuration error. Please try again later.');
            return;
        }

        const variantId = variant.id.split('/').pop();
        const checkoutUrl = `https://${this.shopDomain}/cart/${variantId}:${quantity}`;
        
        // Open checkout in new tab
        window.open(checkoutUrl, '_blank');
    }
}

// Initialize cart manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cartManager = new CartManager();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CartManager;
}
