// Collage Desktop Interface JavaScript
class CollageDesktopInterface {
    constructor() {
        this.openWindows = new Set();
        this.collageManager = null;
        this.init();
    }
    
    init() {
        this.setupDesktopIcons();
        this.setupWindowControls();
        this.setupClock();
        this.setupStartMenu();
        this.setupDesktopContextMenu();
        
        // Initialize collage manager when available
        if (typeof window.collageManager !== 'undefined') {
            this.collageManager = window.collageManager;
        }
    }
    
    // Setup desktop icons
    setupDesktopIcons() {
        const desktopIcons = document.querySelectorAll('.desktop-icon');
        
        desktopIcons.forEach(icon => {
            let touchStartTime = 0;
            
            // Touch events for mobile
            icon.addEventListener('touchstart', (e) => {
                touchStartTime = Date.now();
                icon.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            });
            
            icon.addEventListener('touchend', (e) => {
                e.preventDefault();
                const touchDuration = Date.now() - touchStartTime;
                
                // Reset background
                setTimeout(() => {
                    if (!icon.classList.contains('selected')) {
                        icon.style.backgroundColor = '';
                    }
                }, 100);
                
                // Only trigger if it was a quick tap
                if (touchDuration < 500) {
                    this.handleIconActivation(icon, desktopIcons);
                }
            });
            
            // Mouse events for desktop
            icon.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleIconActivation(icon, desktopIcons);
            });
            
            // Hover effects (desktop only)
            icon.addEventListener('mouseenter', () => {
                if (!icon.classList.contains('selected')) {
                    icon.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }
            });
            
            icon.addEventListener('mouseleave', () => {
                if (!icon.classList.contains('selected')) {
                    icon.style.backgroundColor = '';
                }
            });
        });
    }
    
    // Handle icon activation
    handleIconActivation(icon, allIcons) {
        // Remove selection from other icons
        allIcons.forEach(otherIcon => {
            otherIcon.classList.remove('selected');
        });
        
        // Add selection to clicked icon
        icon.classList.add('selected');
        
        // Get app name and open window
        const appName = icon.getAttribute('data-app');
        if (appName) {
            setTimeout(() => {
                this.openApp(appName + '-window');
                icon.classList.remove('selected');
            }, 200);
        }
    }
    
    // Open application window
    openApp(windowId) {
        const window = document.getElementById(windowId);
        if (window) {
            window.style.display = 'block';
            window.classList.add('opening');
            this.openWindows.add(windowId);
            
            // Remove opening animation class after animation completes
            setTimeout(() => {
                window.classList.remove('opening');
            }, 200);
            
            // Initialize specific app functionality
            this.initializeApp(windowId);
        }
    }
    
    // Initialize specific app functionality
    initializeApp(windowId) {
        switch (windowId) {
            case 'community-browser-window':
                this.initializeCommunityBrowser();
                break;
            case '3d-viewer-window':
                this.initialize3DViewer();
                break;
            case 'member-search-window':
                this.initializeMemberSearch();
                break;
            case 'community-stats-window':
                this.initializeCommunityStats();
                break;
        }
    }
    
    // Initialize community browser
    initializeCommunityBrowser() {
        // Load community members if collage manager is available
        if (this.collageManager && typeof this.collageManager.loadMembers === 'function') {
            this.collageManager.loadMembers();
        } else {
            // Fallback: show loading state
            this.showLoadingState();
        }
        
        // Setup toolbar buttons
        const gridViewBtn = document.getElementById('grid-view-btn');
        const listViewBtn = document.getElementById('list-view-btn');
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('member-search-input');
        
        if (gridViewBtn) {
            gridViewBtn.addEventListener('click', () => {
                this.switchToGridView();
                gridViewBtn.classList.add('active');
                listViewBtn.classList.remove('active');
            });
        }
        
        if (listViewBtn) {
            listViewBtn.addEventListener('click', () => {
                this.switchToListView();
                listViewBtn.classList.add('active');
                gridViewBtn.classList.remove('active');
            });
        }
        
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => {
                this.performQuickSearch(searchInput.value);
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performQuickSearch(searchInput.value);
                }
            });
        }
        
        // Set grid view as default
        if (gridViewBtn) {
            gridViewBtn.classList.add('active');
        }
    }
    
    // Initialize 3D viewer
    initialize3DViewer() {
        // Initialize 3D sphere if available
        if (typeof window.init3DSphere === 'function') {
            window.init3DSphere();
        } else {
            // Show placeholder
            const canvas = document.getElementById('sphere-canvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#333333';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#ffffff';
                ctx.font = '16px MS Sans Serif';
                ctx.textAlign = 'center';
                ctx.fillText('3D Viewer Loading...', canvas.width / 2, canvas.height / 2);
            }
        }
    }
    
    // Initialize member search
    initializeMemberSearch() {
        const searchBtn = document.querySelector('#member-search-window .btn-primary');
        const clearBtn = document.querySelector('#member-search-window .btn-secondary');
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performAdvancedSearch();
            });
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAdvancedSearch();
            });
        }
    }
    
    // Initialize community stats
    initializeCommunityStats() {
        this.loadCommunityStats();
    }
    
    // Show loading state
    showLoadingState() {
        const loading = document.getElementById('loading');
        const grid = document.getElementById('collage-grid');
        const error = document.getElementById('error');
        const noMembers = document.getElementById('no-members');
        
        if (loading) loading.style.display = 'flex';
        if (grid) grid.style.display = 'none';
        if (error) error.style.display = 'none';
        if (noMembers) noMembers.style.display = 'none';
    }
    
    // Switch to grid view
    switchToGridView() {
        const grid = document.getElementById('collage-grid');
        if (grid) {
            grid.className = 'community-grid';
        }
    }
    
    // Switch to list view
    switchToListView() {
        const grid = document.getElementById('collage-grid');
        if (grid) {
            grid.className = 'community-grid list-view';
        }
    }
    
    // Perform quick search
    performQuickSearch(query) {
        if (!query.trim()) return;
        
        console.log('Performing quick search for:', query);
        // Implement search functionality here
        // This would filter the existing community grid
    }
    
    // Perform advanced search
    performAdvancedSearch() {
        const name = document.getElementById('search-name')?.value || '';
        const craft = document.getElementById('search-craft')?.value || '';
        const location = document.getElementById('search-location')?.value || '';
        
        console.log('Advanced search:', { name, craft, location });
        
        const results = document.getElementById('search-results');
        if (results) {
            results.innerHTML = '<p>Search functionality will be implemented here.</p>';
        }
    }
    
    // Clear advanced search
    clearAdvancedSearch() {
        const inputs = document.querySelectorAll('#member-search-window input, #member-search-window select');
        inputs.forEach(input => {
            input.value = '';
        });
        
        const results = document.getElementById('search-results');
        if (results) {
            results.innerHTML = '';
        }
    }
    
    // Load community stats
    loadCommunityStats() {
        // Mock data for demonstration
        const stats = {
            totalMembers: 42,
            totalCrafts: 12,
            totalCountries: 8,
            newestMember: 'Alex'
        };
        
        document.getElementById('total-members').textContent = stats.totalMembers;
        document.getElementById('total-crafts').textContent = stats.totalCrafts;
        document.getElementById('total-countries').textContent = stats.totalCountries;
        document.getElementById('newest-member').textContent = stats.newestMember;
        
        // Simple craft chart
        const chart = document.getElementById('craft-chart');
        if (chart) {
            chart.innerHTML = 'Photography: 25% | Music: 20% | Art: 18% | Writing: 15% | Other: 22%';
        }
    }
    
    // Setup window controls
    setupWindowControls() {
        // Close buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close') && e.target.hasAttribute('data-window')) {
                const windowId = e.target.getAttribute('data-window');
                this.closeWindow(windowId);
            }
        });
        
        // Minimize buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('minimize')) {
                const window = e.target.closest('.app-window');
                if (window) {
                    this.minimizeWindow(window.id);
                }
            }
        });
        
        // Maximize buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('maximize')) {
                const window = e.target.closest('.app-window');
                if (window) {
                    this.toggleMaximizeWindow(window.id);
                }
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Close the topmost window
                const openWindowIds = Array.from(this.openWindows);
                if (openWindowIds.length > 0) {
                    this.closeWindow(openWindowIds[openWindowIds.length - 1]);
                }
            }
        });
    }
    
    // Close window
    closeWindow(windowId) {
        const window = document.getElementById(windowId);
        if (window) {
            window.style.display = 'none';
            this.openWindows.delete(windowId);
        }
    }
    
    // Minimize window
    minimizeWindow(windowId) {
        const window = document.getElementById(windowId);
        if (window) {
            window.style.display = 'none';
            // In a real implementation, you'd add it to taskbar
        }
    }
    
    // Toggle maximize window
    toggleMaximizeWindow(windowId) {
        const window = document.getElementById(windowId);
        if (window) {
            if (window.classList.contains('maximized')) {
                window.classList.remove('maximized');
                window.style.top = '';
                window.style.left = '';
                window.style.width = '';
                window.style.height = '';
                window.style.transform = '';
            } else {
                window.classList.add('maximized');
                window.style.top = '0';
                window.style.left = '0';
                window.style.width = '100vw';
                window.style.height = 'calc(100vh - 40px)';
                window.style.transform = 'none';
            }
        }
    }
    
    // Setup clock
    setupClock() {
        const clockElement = document.getElementById('time');
        
        const updateClock = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            if (clockElement) {
                clockElement.textContent = timeString;
            }
        };
        
        updateClock();
        setInterval(updateClock, 1000);
    }
    
    // Setup start menu
    setupStartMenu() {
        const startButton = document.querySelector('.start-button');
        
        if (startButton) {
            startButton.addEventListener('click', () => {
                this.showStartMenu();
            });
        }
    }
    
    // Show start menu
    showStartMenu() {
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
                    alert('Collage Desktop Properties\n\nJamtem World Community Collage\nEarly 2000s Theme\nVersion 1.0');
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
    
    // Setup desktop context menu
    setupDesktopContextMenu() {
        const desktop = document.querySelector('.desktop');
        
        if (desktop) {
            desktop.addEventListener('contextmenu', (e) => {
                // Allow browser context menu when Ctrl is held
                if (e.ctrlKey) {
                    return;
                }
                
                e.preventDefault();
                
                const contextMenu = document.createElement('div');
                contextMenu.className = 'context-menu';
                contextMenu.style.cssText = `
                    position: fixed;
                    top: ${e.clientY}px;
                    left: ${e.clientX}px;
                    background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                    border: 2px outset #d4d0c8;
                    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.5);
                    z-index: 1001;
                    min-width: 150px;
                    font-family: 'MS Sans Serif', Tahoma, Arial, sans-serif;
                    font-size: 11px;
                `;
                
                const menuItems = ['Refresh', 'View Community', 'Properties'];
                
                menuItems.forEach(item => {
                    const menuItem = document.createElement('div');
                    menuItem.textContent = item;
                    menuItem.style.cssText = `
                        padding: 4px 12px;
                        cursor: pointer;
                        border-bottom: 1px solid #d6d3ce;
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
                        contextMenu.remove();
                        
                        if (item === 'Refresh') {
                            location.reload();
                        } else if (item === 'View Community') {
                            this.openApp('community-browser-window');
                        } else if (item === 'Properties') {
                            alert('Desktop Properties\n\nJamtem World Collage Desktop\nEarly 2000s Theme\nVersion 1.0');
                        }
                    });
                    
                    contextMenu.appendChild(menuItem);
                });
                
                document.body.appendChild(contextMenu);
                
                // Close menu when clicking elsewhere
                setTimeout(() => {
                    document.addEventListener('click', function closeContextMenu() {
                        contextMenu.remove();
                        document.removeEventListener('click', closeContextMenu);
                    });
                }, 100);
            });
        }
    }
}

// Initialize desktop interface when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Load taskbar component first
    const loader = new ComponentLoader();
    await loader.loadComponent('taskbar', '#taskbar-placeholder');
    
    // Then initialize desktop interface
    window.collageDesktop = new CollageDesktopInterface();
});

// Global function to open apps (for use in HTML onclick attributes)
window.openApp = function(windowId) {
    if (window.collageDesktop) {
        window.collageDesktop.openApp(windowId);
    }
};

// Global search functions
window.performSearch = function() {
    if (window.collageDesktop) {
        window.collageDesktop.performAdvancedSearch();
    }
};

window.clearSearch = function() {
    if (window.collageDesktop) {
        window.collageDesktop.clearAdvancedSearch();
    }
};
