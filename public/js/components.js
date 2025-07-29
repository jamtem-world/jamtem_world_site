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
                
                // If it's the header, set up navigation active states
                if (componentName === 'header') {
                    this.setActiveNavigation();
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
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            
            // Determine which page we're on and set active state
            if (currentPath === '/' || currentPath === '/index.html') {
                if (link.getAttribute('data-page') === 'index') {
                    link.classList.add('active');
                }
            } else if (currentPath.includes('join.html')) {
                if (link.getAttribute('data-page') === 'join') {
                    link.classList.add('active');
                }
            }
            // Add more conditions here for other pages as needed
        });
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
                            <a href="/" class="nav-link">Products</a>
                            <a href="/join.html" class="nav-link">Join Community</a>
                            <a href="#" class="nav-link">About</a>
                            <a href="#" class="nav-link">Contact</a>
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
