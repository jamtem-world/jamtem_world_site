// Products JavaScript - Shopify API Integration
class ProductsManager {
    constructor() {
        this.products = [];
        this.shopDomain = null;
        this.loading = document.getElementById('loading');
        this.errorMessage = document.getElementById('error-message');
        this.errorDetails = document.getElementById('error-details');
        this.productsGrid = document.getElementById('products-grid');
        this.noProducts = document.getElementById('no-products');
        
        this.init();
    }

    async init() {
        await this.loadConfig();
        await this.loadProducts();
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

    async loadProducts() {
        try {
            this.showLoading();
            
            const response = await fetch('/api/products');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            if (data.errors) {
                throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
            }

            this.products = data.data.products.edges.map(edge => edge.node);
            this.renderProducts();
            
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError(error.message);
        }
    }

    showLoading() {
        this.loading.style.display = 'flex';
        this.errorMessage.style.display = 'none';
        this.productsGrid.style.display = 'none';
        this.noProducts.style.display = 'none';
    }

    showError(message) {
        this.loading.style.display = 'none';
        this.errorMessage.style.display = 'block';
        this.errorDetails.textContent = message;
        this.productsGrid.style.display = 'none';
        this.noProducts.style.display = 'none';
    }

    showProducts() {
        this.loading.style.display = 'none';
        this.errorMessage.style.display = 'none';
        this.productsGrid.style.display = 'grid';
        this.noProducts.style.display = 'none';
    }

    showNoProducts() {
        this.loading.style.display = 'none';
        this.errorMessage.style.display = 'none';
        this.productsGrid.style.display = 'none';
        this.noProducts.style.display = 'block';
    }

    renderProducts() {
        if (!this.products || this.products.length === 0) {
            this.showNoProducts();
            return;
        }

        this.productsGrid.innerHTML = '';
        
        this.products.forEach(product => {
            const productCard = this.createProductCard(product);
            this.productsGrid.appendChild(productCard);
        });

        this.showProducts();
    }

    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.setAttribute('data-product-id', product.id);

        // Get the first image or use placeholder
        const firstImage = product.images.edges[0]?.node;
        const imageUrl = firstImage?.url || '';
        const imageAlt = firstImage?.altText || product.title;

        // Format price
        const minPrice = parseFloat(product.priceRange.minVariantPrice.amount);
        const maxPrice = parseFloat(product.priceRange.maxVariantPrice.amount);
        const currency = product.priceRange.minVariantPrice.currencyCode;
        
        let priceDisplay = '';
        let priceRangeDisplay = '';
        
        if (minPrice === maxPrice) {
            priceDisplay = this.formatPrice(minPrice, currency);
        } else {
            priceDisplay = `${this.formatPrice(minPrice, currency)} - ${this.formatPrice(maxPrice, currency)}`;
            priceRangeDisplay = `<div class="product-price-range">Price varies by variant</div>`;
        }

        // Clean and truncate description
        const description = this.cleanDescription(product.description);
        
        // Availability status
        const availabilityClass = product.availableForSale ? 'available' : 'unavailable';
        const availabilityText = product.availableForSale ? 'In Stock' : 'Out of Stock';

        // Tags (limit to first 3)
        const tags = product.tags.slice(0, 3);
        const tagsHtml = tags.length > 0 ? 
            `<div class="product-tags">
                ${tags.map(tag => `<span class="product-tag">${this.escapeHtml(tag)}</span>`).join('')}
            </div>` : '';

        // Vendor info
        const vendorHtml = product.vendor ? 
            `<div class="product-vendor">by ${this.escapeHtml(product.vendor)}</div>` : '';

        card.innerHTML = `
            <div class="product-image">
                ${imageUrl ? 
                    `<img src="${imageUrl}" alt="${this.escapeHtml(imageAlt)}" loading="lazy" onerror="this.parentElement.innerHTML='<span>No Image Available</span>'">` :
                    '<span>No Image Available</span>'
                }
            </div>
            <div class="product-info">
                <h3 class="product-title">${this.escapeHtml(product.title)}</h3>
                ${description ? `<p class="product-description">${description}</p>` : ''}
                <div class="product-meta">
                    <div class="product-price">${priceDisplay}</div>
                    ${priceRangeDisplay}
                    <span class="product-availability ${availabilityClass}">${availabilityText}</span>
                    ${vendorHtml}
                    ${tagsHtml}
                </div>
            </div>
        `;

        // Add click event for future product detail functionality
        card.addEventListener('click', () => {
            this.handleProductClick(product);
        });

        return card;
    }

    formatPrice(amount, currency) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(amount);
    }

    cleanDescription(description) {
        if (!description) return '';
        
        // Remove HTML tags and decode entities
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = description;
        const cleanText = tempDiv.textContent || tempDiv.innerText || '';
        
        // Truncate to reasonable length
        return cleanText.length > 150 ? 
            cleanText.substring(0, 150) + '...' : 
            cleanText;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    handleProductClick(product) {
        this.openProductModal(product);
    }

    openProductModal(product) {
        const modal = document.getElementById('product-modal');
        const overlay = modal;
        
        // Populate modal with product data
        this.populateModal(product);
        
        // Show modal
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
        
        // Focus management for accessibility
        const closeButton = document.getElementById('modal-close');
        closeButton.focus();
        
        // Set up event listeners
        this.setupModalEventListeners(product);
    }

    populateModal(product) {
        // Basic product info
        document.getElementById('modal-product-title').textContent = product.title;
        document.getElementById('modal-product-vendor').textContent = product.vendor ? `by ${product.vendor}` : '';
        
        // Description
        const description = this.cleanDescription(product.description, 500); // Longer description for modal
        document.getElementById('modal-product-description').textContent = description || 'No description available.';
        
        // Images
        this.setupModalImages(product);
        
        // Price and availability
        this.updateModalPrice(product);
        
        // Variants
        this.setupModalVariants(product);
        
        // Tags
        this.setupModalTags(product);
        
        // Reset quantity
        document.getElementById('modal-quantity-input').value = 1;
        
        // Store product data for later use
        this.currentModalProduct = product;
        this.selectedVariant = product.variants.edges[0]?.node || null;
    }

    setupModalImages(product) {
        const mainImage = document.getElementById('modal-product-image');
        const placeholder = document.getElementById('modal-image-placeholder');
        const thumbnailsContainer = document.getElementById('modal-thumbnails');
        
        const images = product.images.edges.map(edge => edge.node);
        
        if (images.length > 0) {
            // Set main image
            mainImage.src = images[0].url;
            mainImage.alt = images[0].altText || product.title;
            mainImage.style.display = 'block';
            placeholder.style.display = 'none';
            
            // Setup thumbnails if multiple images
            if (images.length > 1) {
                thumbnailsContainer.innerHTML = '';
                images.forEach((image, index) => {
                    const thumbnail = document.createElement('div');
                    thumbnail.className = `modal-thumbnail ${index === 0 ? 'active' : ''}`;
                    thumbnail.innerHTML = `<img src="${image.url}" alt="${image.altText || product.title}">`;
                    
                    thumbnail.addEventListener('click', () => {
                        mainImage.src = image.url;
                        mainImage.alt = image.altText || product.title;
                        
                        // Update active thumbnail
                        document.querySelectorAll('.modal-thumbnail').forEach(t => t.classList.remove('active'));
                        thumbnail.classList.add('active');
                    });
                    
                    thumbnailsContainer.appendChild(thumbnail);
                });
                thumbnailsContainer.style.display = 'flex';
            } else {
                thumbnailsContainer.style.display = 'none';
            }
        } else {
            mainImage.style.display = 'none';
            placeholder.style.display = 'flex';
            thumbnailsContainer.style.display = 'none';
        }
    }

    updateModalPrice(product, selectedVariant = null) {
        const priceElement = document.getElementById('modal-product-price');
        const availabilityElement = document.getElementById('modal-product-availability');
        
        if (selectedVariant) {
            // Show specific variant price
            const price = parseFloat(selectedVariant.priceV2.amount);
            const currency = selectedVariant.priceV2.currencyCode;
            priceElement.textContent = this.formatPrice(price, currency);
            
            // Update availability based on variant
            const isAvailable = selectedVariant.availableForSale;
            availabilityElement.textContent = isAvailable ? 'In Stock' : 'Out of Stock';
            availabilityElement.className = `modal-product-availability ${isAvailable ? 'available' : 'unavailable'}`;
        } else {
            // Show price range
            const minPrice = parseFloat(product.priceRange.minVariantPrice.amount);
            const maxPrice = parseFloat(product.priceRange.maxVariantPrice.amount);
            const currency = product.priceRange.minVariantPrice.currencyCode;
            
            if (minPrice === maxPrice) {
                priceElement.textContent = this.formatPrice(minPrice, currency);
            } else {
                priceElement.textContent = `${this.formatPrice(minPrice, currency)} - ${this.formatPrice(maxPrice, currency)}`;
            }
            
            // General availability
            const isAvailable = product.availableForSale;
            availabilityElement.textContent = isAvailable ? 'In Stock' : 'Out of Stock';
            availabilityElement.className = `modal-product-availability ${isAvailable ? 'available' : 'unavailable'}`;
        }
    }

    setupModalVariants(product) {
        const variantsContainer = document.getElementById('modal-variants');
        const variants = product.variants.edges.map(edge => edge.node);
        
        if (variants.length <= 1) {
            variantsContainer.style.display = 'none';
            return;
        }
        
        variantsContainer.style.display = 'block';
        variantsContainer.innerHTML = '';
        
        // Group variants by option name (e.g., Size, Color)
        const optionGroups = {};
        
        variants.forEach(variant => {
            variant.selectedOptions.forEach(option => {
                if (!optionGroups[option.name]) {
                    optionGroups[option.name] = new Set();
                }
                optionGroups[option.name].add(option.value);
            });
        });
        
        // Create variant selection UI
        Object.entries(optionGroups).forEach(([optionName, values]) => {
            const group = document.createElement('div');
            group.className = 'variant-group';
            
            const label = document.createElement('div');
            label.className = 'variant-label';
            label.textContent = optionName + ':';
            group.appendChild(label);
            
            const options = document.createElement('div');
            options.className = 'variant-options';
            
            Array.from(values).forEach(value => {
                const option = document.createElement('button');
                option.className = 'variant-option';
                option.textContent = value;
                option.setAttribute('data-option-name', optionName);
                option.setAttribute('data-option-value', value);
                
                // Check if this option is available
                const availableVariant = variants.find(v => 
                    v.selectedOptions.some(opt => opt.name === optionName && opt.value === value) &&
                    v.availableForSale
                );
                
                if (!availableVariant) {
                    option.classList.add('unavailable');
                    option.disabled = true;
                }
                
                option.addEventListener('click', () => {
                    if (!option.disabled) {
                        // Update selection
                        options.querySelectorAll('.variant-option').forEach(opt => opt.classList.remove('selected'));
                        option.classList.add('selected');
                        
                        // Find matching variant
                        this.updateSelectedVariant(product);
                    }
                });
                
                options.appendChild(option);
            });
            
            group.appendChild(options);
            variantsContainer.appendChild(group);
        });
        
        // Select first available variant by default
        const firstAvailableVariant = variants.find(v => v.availableForSale);
        if (firstAvailableVariant) {
            firstAvailableVariant.selectedOptions.forEach(option => {
                const optionButton = variantsContainer.querySelector(
                    `[data-option-name="${option.name}"][data-option-value="${option.value}"]`
                );
                if (optionButton) {
                    optionButton.classList.add('selected');
                }
            });
            this.selectedVariant = firstAvailableVariant;
            this.updateModalPrice(product, firstAvailableVariant);
        }
    }

    updateSelectedVariant(product) {
        const selectedOptions = {};
        document.querySelectorAll('.variant-option.selected').forEach(option => {
            const name = option.getAttribute('data-option-name');
            const value = option.getAttribute('data-option-value');
            selectedOptions[name] = value;
        });
        
        // Find matching variant
        const matchingVariant = product.variants.edges.find(edge => {
            const variant = edge.node;
            return variant.selectedOptions.every(option => 
                selectedOptions[option.name] === option.value
            );
        });
        
        if (matchingVariant) {
            this.selectedVariant = matchingVariant.node;
            this.updateModalPrice(product, this.selectedVariant);
            
            // Update button states
            const buyButton = document.getElementById('modal-buy-now');
            const cartButton = document.getElementById('modal-add-cart');
            
            if (this.selectedVariant.availableForSale) {
                buyButton.disabled = false;
                cartButton.disabled = false;
            } else {
                buyButton.disabled = true;
                cartButton.disabled = true;
            }
        }
    }

    setupModalTags(product) {
        const tagsContainer = document.getElementById('modal-tags');
        
        if (product.tags && product.tags.length > 0) {
            tagsContainer.innerHTML = '';
            product.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'modal-tag';
                tagElement.textContent = tag;
                tagsContainer.appendChild(tagElement);
            });
            tagsContainer.style.display = 'flex';
        } else {
            tagsContainer.style.display = 'none';
        }
    }

    setupModalEventListeners(product) {
        const modal = document.getElementById('product-modal');
        const closeButton = document.getElementById('modal-close');
        const buyButton = document.getElementById('modal-buy-now');
        const cartButton = document.getElementById('modal-add-cart');
        const quantityInput = document.getElementById('modal-quantity-input');
        const decreaseBtn = document.getElementById('quantity-decrease');
        const increaseBtn = document.getElementById('quantity-increase');
        
        // Remove existing listeners to prevent duplicates
        const newModal = modal.cloneNode(true);
        modal.parentNode.replaceChild(newModal, modal);
        
        // Close modal events
        const newCloseButton = document.getElementById('modal-close');
        newCloseButton.addEventListener('click', () => this.closeModal());
        
        newModal.addEventListener('click', (e) => {
            if (e.target === newModal) {
                this.closeModal();
            }
        });
        
        // Keyboard events
        document.addEventListener('keydown', this.handleModalKeydown.bind(this));
        
        // Quantity controls
        const newDecreaseBtn = document.getElementById('quantity-decrease');
        const newIncreaseBtn = document.getElementById('quantity-increase');
        const newQuantityInput = document.getElementById('modal-quantity-input');
        
        newDecreaseBtn.addEventListener('click', () => {
            const current = parseInt(newQuantityInput.value);
            if (current > 1) {
                newQuantityInput.value = current - 1;
            }
        });
        
        newIncreaseBtn.addEventListener('click', () => {
            const current = parseInt(newQuantityInput.value);
            if (current < 10) {
                newQuantityInput.value = current + 1;
            }
        });
        
        // Buy Now button
        const newBuyButton = document.getElementById('modal-buy-now');
        newBuyButton.addEventListener('click', () => this.handleBuyNow());
        
        // Add to Cart button
        const newCartButton = document.getElementById('modal-add-cart');
        newCartButton.addEventListener('click', () => this.handleAddToCart());
    }

    handleModalKeydown(e) {
        if (e.key === 'Escape') {
            this.closeModal();
        }
    }

    closeModal() {
        const modal = document.getElementById('product-modal');
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        
        // Remove keyboard listener
        document.removeEventListener('keydown', this.handleModalKeydown);
        
        // Clear stored data
        this.currentModalProduct = null;
        this.selectedVariant = null;
    }

    handleBuyNow() {
        if (!this.selectedVariant || !this.selectedVariant.availableForSale) {
            alert('This product variant is not available for purchase.');
            return;
        }
        
        const quantity = parseInt(document.getElementById('modal-quantity-input').value);
        const shopDomain = this.getShopDomain();
        
        if (!shopDomain) {
            alert('Shop configuration error. Please try again later.');
            return;
        }
        
        // Create Shopify checkout URL
        const checkoutUrl = `https://${shopDomain}/cart/${this.selectedVariant.id.split('/').pop()}:${quantity}`;
        
        // Open checkout in new tab
        window.open(checkoutUrl, '_blank');
        
        // Close modal
        this.closeModal();
    }

    handleAddToCart() {
        if (!this.selectedVariant || !this.selectedVariant.availableForSale) {
            alert('This product variant is not available.');
            return;
        }
        
        const quantity = parseInt(document.getElementById('modal-quantity-input').value);
        const shopDomain = this.getShopDomain();
        
        if (!shopDomain) {
            alert('Shop configuration error. Please try again later.');
            return;
        }
        
        // Create add to cart URL
        const addToCartUrl = `https://${shopDomain}/cart/add?id=${this.selectedVariant.id.split('/').pop()}&quantity=${quantity}`;
        
        // Open in new tab
        window.open(addToCartUrl, '_blank');
        
        // Show success message
        alert(`Added ${quantity} ${this.currentModalProduct.title} to cart!`);
    }

    getShopDomain() {
        return this.shopDomain;
    }

    cleanDescription(description, maxLength = 150) {
        if (!description) return '';
        
        // Remove HTML tags and decode entities
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = description;
        const cleanText = tempDiv.textContent || tempDiv.innerText || '';
        
        // Truncate to reasonable length
        return cleanText.length > maxLength ? 
            cleanText.substring(0, maxLength) + '...' : 
            cleanText;
    }

    // Method to refresh products (called by retry button)
    async refresh() {
        await this.loadProducts();
    }

    // Method to filter products (for future enhancement)
    filterProducts(criteria) {
        // Future enhancement: implement filtering by price, availability, tags, etc.
        console.log('Filter criteria:', criteria);
    }

    // Method to sort products (for future enhancement)
    sortProducts(sortBy) {
        // Future enhancement: implement sorting by price, name, date, etc.
        console.log('Sort by:', sortBy);
    }
}

// Utility functions for global access
function loadProducts() {
    if (window.productsManager) {
        window.productsManager.refresh();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productsManager = new ProductsManager();
});

// Handle page visibility changes to refresh data when user returns
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.productsManager) {
        // Refresh products when user returns to tab (debounced)
        clearTimeout(window.refreshTimeout);
        window.refreshTimeout = setTimeout(() => {
            window.productsManager.refresh();
        }, 1000);
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    console.log('Connection restored');
    if (window.productsManager) {
        window.productsManager.refresh();
    }
});

window.addEventListener('offline', () => {
    console.log('Connection lost');
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductsManager;
}
