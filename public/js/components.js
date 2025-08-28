// Component loader for header and footer
class ComponentLoader {
    constructor() {
        this.components = {
            header: '/components/header.html',
            footer: '/components/footer.html',
            taskbar: '/components/taskbaR.html'
        };
    }

    async loadComponent(componentName, targetSelector) {
        try {
            console.log(`Attempting to load component: '${componentName}'`);
            console.log(`Available components:`, Object.keys(this.components));
            
            const componentPath = this.components[componentName];
            if (!componentPath) {
                throw new Error(`Component '${componentName}' not found in components registry`);
            }
            
            console.log(`Loading component: ${componentName} from ${componentPath}`);
            const response = await fetch(componentPath);
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
                
                // If it's the taskbar, set up active states and functionality
                if (componentName === 'taskbar') {
                    this.setActiveTaskbarNavigation();
                    this.setupTaskbarFunctionality();
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

    // showFallback(componentName, targetSelector) {
    //     const targetElement = document.querySelector(targetSelector);
    //     if (!targetElement) return;

    //     if (componentName === 'header') {
    //         targetElement.innerHTML = `
    //             <header class="header">
    //                 <div class="container">
    //                     <h1 class="logo">
    //                         <a href="/" style="text-decoration: none; color: inherit;">Jamtem World</a>
    //                     </h1>
    //                     <nav class="nav">
    //                         <a href="/products" class="nav-link" data-page="products">Products</a>
    //                         <a href="/join" class="nav-link" data-page="join">Join Community</a>
    //                     </nav>
    //                 </div>
    //             </header>
    //         `;
    //     } else if (componentName === 'footer') {
    //         targetElement.innerHTML = `
    //             <footer class="footer">
    //                 <div class="container">
    //                     <p>&copy; 2025 Jamtem World. All rights reserved.</p>
    //                 </div>
    //             </footer>
    //         `;
    //     } else if (componentName === 'taskbar') {
    //         targetElement.innerHTML = `
    //             <div class="taskbar">
    //                 <div class="taskbar-left">
    //                     <button class="start-button">
    //                         <img src="/media/images/logo.png" alt="Start" class="start-icon">
    //                         <span>Start</span>
    //                     </button>
    //                 </div>
                    
    //                 <div class="taskbar-center">
    //                     <button class="taskbar-button" onclick="window.location.href='/desktop'">
    //                         <span>Home</span>
    //                     </button>
    //                     <button class="taskbar-button" onclick="window.location.href='/products'">
    //                         <span>Products</span>
    //                     </button>
    //                     <button class="taskbar-button" onclick="window.location.href='/collage-desktop'">
    //                         <span>Collage</span>
    //                     </button>
    //                     <button class="taskbar-button" onclick="window.location.href='/join-desktop'">
    //                         <span>Join</span>
    //                     </button>
    //                 </div>
                    
    //                 <div class="taskbar-right">
    //                     <div class="system-tray">
    //                         <div class="tray-icons">
    //                             <span class="tray-icon">🔊</span>
    //                             <span class="tray-icon">📶</span>
    //                         </div>
    //                         <div class="clock" id="clock">
    //                             <span id="time">12:00 PM</span>
    //                         </div>
    //                     </div>
    //                 </div>
    //             </div>
    //         `;
            
    //         // Set up taskbar functionality after fallback is loaded
    //         this.setActiveTaskbarNavigation();
    //         this.setupTaskbarFunctionality();
    //     }
    // }

    setActiveTaskbarNavigation() {
        const currentPath = window.location.pathname;
        const taskbarButtons = document.querySelectorAll('.taskbar-button');
        
        taskbarButtons.forEach(button => {
            button.classList.remove('active');
            
            // Determine which page we're on and set active state
            if (currentPath === '/desktop' || currentPath === '/desktop.html') {
                if (button.textContent.trim() === 'Home') {
                    button.classList.add('active');
                }
            } else if (currentPath === '/products' || currentPath === '/products.html') {
                if (button.textContent.trim() === 'Products') {
                    button.classList.add('active');
                }
            } else if (currentPath === '/collage-desktop' || currentPath === '/collage-desktop.html') {
                if (button.textContent.trim() === 'Collage') {
                    button.classList.add('active');
                }
            } else if (currentPath === '/join-desktop' || currentPath === '/join-desktop.html') {
                if (button.textContent.trim() === 'Join') {
                    button.classList.add('active');
                }
            }
        });
    }
    
    setupTaskbarFunctionality() {
        // Setup clock
        this.setupTaskbarClock();
        
        // Setup start button
        this.setupTaskbarStartButton();
        
        // Add click animations to taskbar buttons
        const taskbarButtons = document.querySelectorAll('.taskbar-button, .start-button');
        taskbarButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Add click animation
                button.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    button.style.transform = '';
                }, 100);
            });
        });
    }
    
    setupTaskbarClock() {
        const clockElement = document.getElementById('time');
        
        if (clockElement) {
            const updateClock = () => {
                const now = new Date();
                const timeString = now.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
                clockElement.textContent = timeString;
            };
            
            updateClock();
            setInterval(updateClock, 1000);
        }
    }
    
    setupTaskbarStartButton() {
        const startButton = document.querySelector('.start-button');
        
        if (startButton) {
            startButton.addEventListener('click', () => {
                this.showTaskbarStartMenu();
            });
        }
    }
    
    showTaskbarStartMenu() {
        const startMenuItems = [
            { label: 'Home', url: '/desktop', icon: '🏠' },
            { label: 'Products', url: '/products', icon: '🛍️' },
            { label: 'Collage', url: '/collage-desktop', icon: '🎨' },
            { label: 'Join Community', url: '/join-desktop', icon: '👥' },
            { label: '---', url: null, icon: '' },
            { label: 'Refresh', url: null, icon: '🔄' },
            { label: 'Properties', url: null, icon: '⚙️' }
        ];
        
        const existingMenu = document.querySelector('.start-menu');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }
        
        const startMenu = document.createElement('div');
        startMenu.className = 'start-menu';
        
        const isMobile = window.innerWidth <= 768;
        const taskbarHeight = isMobile ? (window.innerWidth <= 480 ? 52 : 48) : 40;
        
        startMenu.style.cssText = `
            position: fixed;
            bottom: ${taskbarHeight}px;
            left: 4px;
            background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
            border: 2px outset #d4d0c8;
            box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.5);
            z-index: 1001;
            min-width: ${isMobile ? '250px' : '200px'};
            font-family: 'MS Sans Serif', Tahoma, Arial, sans-serif;
            font-size: ${isMobile ? '13px' : '11px'};
        `;
        
        startMenuItems.forEach(item => {
            if (item.label === '---') {
                const separator = document.createElement('div');
                separator.style.cssText = `
                    height: 1px;
                    background: #9c9c9c;
                    margin: 2px 0;
                    border-top: 1px solid #ffffff;
                `;
                startMenu.appendChild(separator);
                return;
            }
            
            const menuItem = document.createElement('div');
            menuItem.innerHTML = `${item.icon} ${item.label}`;
            menuItem.style.cssText = `
                padding: ${isMobile ? '8px 12px' : '4px 12px'};
                cursor: pointer;
                border-bottom: 1px solid rgba(214, 211, 206, 0.3);
                display: flex;
                align-items: center;
                gap: 8px;
                min-height: ${isMobile ? '36px' : '24px'};
            `;
            
            menuItem.addEventListener('mouseenter', () => {
                menuItem.style.background = '#316ac5';
                menuItem.style.color = 'white';
            });
            
            menuItem.addEventListener('mouseleave', () => {
                menuItem.style.background = '';
                menuItem.style.color = '';
            });
            
            menuItem.addEventListener('click', () => {
                startMenu.remove();
                
                if (item.url) {
                    window.location.href = item.url;
                } else if (item.label === 'Refresh') {
                    location.reload();
                } else if (item.label === 'Properties') {
                    const currentPage = window.location.pathname;
                    alert(`Desktop Properties\n\nJamtem World Desktop\nCurrent Page: ${currentPage}\nEarly 2000s Theme\nVersion 1.0`);
                }
            });
            
            startMenu.appendChild(menuItem);
        });
        
        document.body.appendChild(startMenu);
        
        // Close menu when clicking elsewhere
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!startMenu.contains(e.target) && !e.target.closest('.start-button')) {
                    startMenu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }

    async loadAllComponents() {
        const promises = [];
        
        // Only load header if placeholder exists
        if (document.querySelector('#header-placeholder')) {
            promises.push(this.loadComponent('header', '#header-placeholder'));
        }
        
        // Only load footer if placeholder exists
        if (document.querySelector('#footer-placeholder')) {
            promises.push(this.loadComponent('footer', '#footer-placeholder'));
        }
        
        await Promise.all(promises);
    }
    
    async loadDesktopComponents() {
        // Only load taskbar for desktop pages
        await this.loadComponent('taskbar', '#taskbar-placeholder');
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
