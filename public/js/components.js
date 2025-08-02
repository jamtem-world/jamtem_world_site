// Component loader for header and footer
class ComponentLoader {
    constructor() {
        this.components = {
            header: '/components/header.html',
            footer: '/components/footer.html'
        };
    }

    async loadComponent(componentName, targetSelector) {
        try {
            const response = await fetch(this.components[componentName]);
            if (!response.ok) {
                throw new Error(`Failed to load ${componentName}: ${response.status}`);
            }
            
            const html = await response.text();
            const targetElement = document.querySelector(targetSelector);
            
            if (targetElement) {
                targetElement.innerHTML = html;
                
                // If it's the header, set up navigation active states and mobile menu
                if (componentName === 'header') {
                    this.setActiveNavigation();
                    this.setupMobileMenu();
                }
            } else {
                console.warn(`Target element ${targetSelector} not found for ${componentName}`);
            }
        } catch (error) {
            console.error(`Error loading ${componentName}:`, error);
            // Fallback: show a basic version if component fails to load
            this.showFallback(componentName, targetSelector);
        }
    }

    setActiveNavigation() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            
            // Determine which page we're on and set active state
            if (currentPath === '/' || currentPath === '/index' || currentPath === '/index.html') {
                if (link.getAttribute('data-page') === 'index') {
                    link.classList.add('active');
                }
            } else if (currentPath === '/join' || currentPath === '/join.html') {
                if (link.getAttribute('data-page') === 'join') {
                    link.classList.add('active');
                }
            } else if (currentPath === '/products' || currentPath === '/products.html') {
                if (link.getAttribute('data-page') === 'products') {
                    link.classList.add('active');
                }
            }
            // Add more conditions here for other pages as needed
        });
    }

    setupMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileNavDropdown = document.getElementById('mobile-nav-dropdown');
        
        if (!mobileMenuToggle || !mobileNavDropdown) {
            return; // Mobile menu elements not found
        }

        // Toggle mobile menu
        mobileMenuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isActive = mobileNavDropdown.classList.contains('active');
            
            if (isActive) {
                this.closeMobileMenu();
            } else {
                this.openMobileMenu();
            }
        });

        // Close mobile menu when clicking on a link
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileMenuToggle.contains(e.target) && !mobileNavDropdown.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Close mobile menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
            }
        });
    }

    openMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileNavDropdown = document.getElementById('mobile-nav-dropdown');
        
        if (mobileMenuToggle && mobileNavDropdown) {
            mobileMenuToggle.classList.add('active');
            mobileNavDropdown.classList.add('active');
        }
    }

    closeMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileNavDropdown = document.getElementById('mobile-nav-dropdown');
        
        if (mobileMenuToggle && mobileNavDropdown) {
            mobileMenuToggle.classList.remove('active');
            mobileNavDropdown.classList.remove('active');
        }
    }

    showFallback(componentName, targetSelector) {
        const targetElement = document.querySelector(targetSelector);
        if (!targetElement) return;

        if (componentName === 'header') {
            targetElement.innerHTML = `
                <header class="header">
                    <div class="container">
                        <h1 class="logo">
                            <a href="/" style="text-decoration: none; color: inherit;">Jamtem World</a>
                        </h1>
                        <nav class="nav">
                            <a href="/products" class="nav-link" data-page="products">Products</a>
                            <a href="/join" class="nav-link" data-page="join">Join Community</a>
                        </nav>
                    </div>
                </header>
            `;
        } else if (componentName === 'footer') {
            targetElement.innerHTML = `
                <footer class="footer">
                    <div class="container">
                        <p>&copy; 2025 Jamtem World. All rights reserved.</p>
                    </div>
                </footer>
            `;
        }
    }

    async loadAllComponents() {
        await Promise.all([
            this.loadComponent('header', '#header-placeholder'),
            this.loadComponent('footer', '#footer-placeholder')
        ]);
    }
}

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const loader = new ComponentLoader();
    loader.loadAllComponents();
});

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentLoader;
}
