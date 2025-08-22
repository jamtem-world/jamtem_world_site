// Desktop OS Interface JavaScript
class DesktopInterface {
    constructor() {
        this.videoWindow = document.getElementById('video-window');
        this.desktopVideo = document.getElementById('desktop-video');
        this.windowTitleText = document.getElementById('window-title-text');
        this.closeButton = document.getElementById('close-video-window');
        this.notification = document.getElementById('desktop-notification');
        this.notificationTimeout = null;
        
        this.init();
    }
    
    init() {
        this.setupClock();
        this.setupDesktopIcons();
        this.setupVideoWindow();
        this.setupTaskbarButtons();
        this.setupWindowControls();
        this.setupNotification();
    }
    
    // Clock functionality
    setupClock() {
        const updateClock = () => {
            const clockElement = document.getElementById('time');
            if (clockElement) {
                const now = new Date();
                const timeString = now.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
                clockElement.textContent = timeString;
            }
        };
        
        // Update immediately and then every second
        updateClock();
        setInterval(updateClock, 1000);
    }
    
    // Desktop icon interactions
    setupDesktopIcons() {
        const desktopIcons = document.querySelectorAll('.desktop-icon-live');
        
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
                
                // Only trigger if it was a quick tap (not a long press)
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
    
    // Handle icon activation (both touch and click)
    handleIconActivation(icon, allIcons) {
        console.log('Icon clicked:', icon);
        
        // Remove selection from other icons
        allIcons.forEach(otherIcon => {
            otherIcon.classList.remove('selected');
        });
        
        // Add selection to clicked icon
        icon.classList.add('selected');
        
        // Get app name and open appropriate window
        const appName = icon.getAttribute('data-app');
        console.log('App name:', appName);
        
        if (appName) {
            const windowId = appName + '-window';
            console.log('Opening window:', windowId);
            
            setTimeout(() => {
                this.openApp(windowId);
                icon.classList.remove('selected');
            }, 200);
        } else {
            console.error('No data-app attribute found on icon');
        }
    }
    
    // Open application window
    openApp(windowId) {
        const window = document.getElementById(windowId);
        if (window) {
            window.style.display = 'block';
            window.classList.add('opening');
            
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
            case 'vignettes-window':
                this.initializeVignettes();
                break;
            case 'products-window':
                this.initializeProducts();
                break;
            case 'collage-window':
                this.initializeCollage();
                break;
            case 'join-window':
                this.initializeJoin();
                break;
        }
    }
    
    // Initialize vignettes window
    initializeVignettes() {
        const vignetteIcons = document.querySelectorAll('.vignette-icon');
        
        vignetteIcons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.preventDefault();
                this.openVideoWindow(icon);
            });
        });
    }
    
    // Initialize products window
    initializeProducts() {
        // Load products if products manager is available
        if (typeof window.loadProducts === 'function') {
            window.loadProducts();
        } else {
            // Show loading state
            const loading = document.getElementById('products-loading');
            if (loading) {
                loading.style.display = 'flex';
            }
        }
    }
    
    // Initialize collage window
    initializeCollage() {
        // Wait for CollageManager to be available
        if (typeof window.collageManager !== 'undefined') {
            // CollageManager is already initialized, just trigger loading
            console.log('CollageManager found, loading members...');
            window.collageManager.loadMembers();
            // Switch to 3D view after a short delay to allow members to load
            setTimeout(() => {
                if (window.collageManager.members && window.collageManager.members.length > 0) {
                    window.collageManager.switchTo3D();
                }
            }, 500);
        } else {
            // Wait a bit for CollageManager to initialize
            setTimeout(() => {
                if (typeof window.collageManager !== 'undefined') {
                    console.log('CollageManager found after delay, loading members...');
                    window.collageManager.loadMembers();
                    // Switch to 3D view after members are loaded
                    setTimeout(() => {
                        if (window.collageManager.members && window.collageManager.members.length > 0) {
                            window.collageManager.switchTo3D();
                        }
                    }, 500);
                } else {
                    console.warn('CollageManager not found, showing loading state');
                    const loading = document.getElementById('collage-loading');
                    if (loading) {
                        loading.style.display = 'flex';
                    }
                }
            }, 100);
        }
        
        // Setup toolbar button event listeners
        this.setupCollageToolbar();
    }
    
    // Setup collage toolbar buttons
    setupCollageToolbar() {
        const gridViewBtn = document.getElementById('grid-view-btn');
        const threeDViewBtn = document.getElementById('3d-view-btn');
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('member-search-input');
        
        if (gridViewBtn) {
            gridViewBtn.addEventListener('click', () => {
                if (window.collageManager) {
                    window.collageManager.switchTo2D();
                    gridViewBtn.classList.add('active');
                    if (threeDViewBtn) threeDViewBtn.classList.remove('active');
                }
            });
        }
        
        if (threeDViewBtn) {
            threeDViewBtn.addEventListener('click', () => {
                if (window.collageManager) {
                    window.collageManager.switchTo3D();
                    threeDViewBtn.classList.add('active');
                    if (gridViewBtn) gridViewBtn.classList.remove('active');
                }
            });
        }
        
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => {
                this.searchMembers(searchInput.value);
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchMembers(searchInput.value);
                }
            });
        }
    }
    
    // Initialize join window
    initializeJoin() {
        this.setupJoinForm();
    }
    
    // Show collage grid
    showCollageGrid() {
        const grid = document.getElementById('collage-grid');
        const sphere = document.getElementById('sphere-container');
        const loading = document.getElementById('collage-loading');
        
        if (grid) grid.style.display = 'grid';
        if (sphere) sphere.style.display = 'none';
        if (loading) loading.style.display = 'none';
    }
    
    // Show 3D sphere
    show3DSphere() {
        const grid = document.getElementById('collage-grid');
        const sphere = document.getElementById('sphere-container');
        const loading = document.getElementById('collage-loading');
        
        if (grid) grid.style.display = 'none';
        if (sphere) sphere.style.display = 'flex';
        if (loading) loading.style.display = 'none';
        
        // Initialize 3D sphere if available
        if (typeof window.init3DSphere === 'function') {
            window.init3DSphere();
        }
    }
    
    // Search members
    searchMembers(query) {
        console.log('Searching members for:', query);
        if (window.collageManager && typeof window.collageManager.searchMembers === 'function') {
            window.collageManager.searchMembers(query);
            
            // If in 3D mode, also update the 3D view with filtered results
            if (window.collageManager.is3DMode && window.collageManager.sphereManager) {
                // Get filtered members
                const searchTerm = query.toLowerCase().trim();
                let filteredMembers = window.collageManager.members;
                
                if (searchTerm) {
                    filteredMembers = window.collageManager.members.filter(member => {
                        const name = (member.name || '').toString().toLowerCase();
                        const bio = (member.bio || '').toString().toLowerCase();
                        const instagram = (member.instagram || '').toString().toLowerCase();
                        
                        // Handle craft field - it might be a string or array
                        let craftText = '';
                        if (Array.isArray(member.craft)) {
                            craftText = member.craft.join(' ').toLowerCase();
                        } else {
                            craftText = (member.craft || '').toString().toLowerCase();
                        }
                        
                        return name.includes(searchTerm) || 
                               craftText.includes(searchTerm) || 
                               bio.includes(searchTerm) ||
                               instagram.includes(searchTerm);
                    });
                }
                
                // Update 3D sphere with filtered members
                this.update3DViewWithFilteredMembers(filteredMembers);
            }
        } else {
            console.warn('CollageManager not available for search');
        }
    }
    
    // Update 3D view with filtered members
    async update3DViewWithFilteredMembers(filteredMembers) {
        if (window.collageManager && window.collageManager.sphereManager) {
            try {
                // Dispose current 3D scene
                window.collageManager.sphereManager.dispose();
                
                // Reinitialize with filtered members
                const canvas = document.getElementById('sphere-canvas');
                if (canvas && filteredMembers) {
                    const success = await window.collageManager.sphereManager.init(canvas, filteredMembers);
                    if (!success) {
                        console.warn('Failed to update 3D view with filtered results');
                    }
                }
            } catch (error) {
                console.error('Error updating 3D view with filtered results:', error);
            }
        }
    }
    
    // Setup join form
    setupJoinForm() {
        // Bio character counter
        const bioTextarea = document.getElementById('bio');
        const bioCounter = document.getElementById('bio-counter');
        
        if (bioTextarea && bioCounter) {
            bioTextarea.addEventListener('input', () => {
                const length = bioTextarea.value.length;
                bioCounter.textContent = `${length}/500`;
                
                if (length > 500) {
                    bioCounter.style.color = '#ff0000';
                } else {
                    bioCounter.style.color = '#666666';
                }
            });
        }
        
        // File upload functionality
        this.setupFileUpload();
        
        // Form submission
        const joinForm = document.getElementById('join-form');
        if (joinForm) {
            joinForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitJoinForm();
            });
        }
    }
    
    // Setup file upload
    setupFileUpload() {
        const fileInput = document.getElementById('image');
        const uploadArea = document.getElementById('file-upload-area');
        const preview = document.getElementById('image-preview');
        const removeBtn = document.getElementById('remove-image');
        
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleFileUpload(file);
                }
            });
        }
        
        if (uploadArea) {
            uploadArea.addEventListener('click', () => {
                if (fileInput) fileInput.click();
            });
        }
        
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.removeImage();
            });
        }
    }
    
    // Handle file upload
    handleFileUpload(file) {
        const uploadArea = document.getElementById('file-upload-area');
        const preview = document.getElementById('image-preview');
        const previewImage = document.getElementById('preview-image');
        const imageName = document.getElementById('image-name');
        const imageSize = document.getElementById('image-size');
        
        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert('File size must be less than 10MB.');
            return;
        }
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            if (previewImage) previewImage.src = e.target.result;
            if (imageName) imageName.textContent = file.name;
            if (imageSize) imageSize.textContent = this.formatFileSize(file.size);
            
            if (uploadArea) uploadArea.style.display = 'none';
            if (preview) preview.style.display = 'grid';
        };
        reader.readAsDataURL(file);
    }
    
    // Remove uploaded image
    removeImage() {
        const fileInput = document.getElementById('image');
        const uploadArea = document.getElementById('file-upload-area');
        const preview = document.getElementById('image-preview');
        const previewImage = document.getElementById('preview-image');
        
        if (fileInput) fileInput.value = '';
        if (previewImage) previewImage.src = '';
        if (uploadArea) uploadArea.style.display = 'block';
        if (preview) preview.style.display = 'none';
    }
    
    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Submit join form
    submitJoinForm() {
        // Basic validation
        const name = document.getElementById('name')?.value;
        const email = document.getElementById('email')?.value;
        const craft = document.getElementById('craft')?.value;
        const bio = document.getElementById('bio')?.value;
        const image = document.getElementById('image')?.files[0];
        
        if (!name || !email || !craft || !bio || !image) {
            alert('Please fill in all required fields and upload an image.');
            return;
        }
        
        // Simulate successful submission - removed alert, now handled by join.js
        // alert('Welcome to JAMTEM!\n\nThank you for joining our community of passionate creators. We\'re excited to have you on board!');
        
        // Don't close join window - let join.js handle the success message display
        // this.closeWindow('join-window');
    }
    
    // Close any window
    closeWindow(windowId) {
        const window = document.getElementById(windowId);
        if (window) {
            window.style.display = 'none';
        }
    }
    
    // Setup window controls for all app windows
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
                // Close the topmost visible window
                const visibleWindows = document.querySelectorAll('.app-window[style*="display: block"], .app-window:not([style*="display: none"])');
                if (visibleWindows.length > 0) {
                    const topWindow = visibleWindows[visibleWindows.length - 1];
                    this.closeWindow(topWindow.id);
                }
            }
        });
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
    
    // Video window functionality
    setupVideoWindow() {
        // Close button
        this.closeButton.addEventListener('click', () => {
            this.closeVideoWindow();
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.videoWindow.style.display !== 'none') {
                this.closeVideoWindow();
            }
        });
        
        // Close when clicking outside the window
        this.videoWindow.addEventListener('click', (e) => {
            if (e.target === this.videoWindow) {
                this.closeVideoWindow();
            }
        });
        
        // Window control buttons
        const minimizeBtn = document.querySelector('.window-control.minimize');
        const maximizeBtn = document.querySelector('.window-control.maximize');
        
        minimizeBtn.addEventListener('click', () => {
            // Simulate minimize (just hide for now)
            this.videoWindow.style.display = 'none';
        });
        
        maximizeBtn.addEventListener('click', () => {
            // Toggle maximize state
            if (this.videoWindow.classList.contains('maximized')) {
                this.videoWindow.classList.remove('maximized');
                this.videoWindow.style.top = '50%';
                this.videoWindow.style.left = '50%';
                this.videoWindow.style.transform = 'translate(-50%, -50%)';
            } else {
                this.videoWindow.classList.add('maximized');
                this.videoWindow.style.top = '2.5vh';
                this.videoWindow.style.left = '1vw';
                this.videoWindow.style.transform = 'none';
            }
        });
    }
    
    // Open video window
    openVideoWindow(iconElement) {
        const videoUrl = iconElement.getAttribute('data-video');
        const iconLabel = iconElement.querySelector('.icon-label, .vignette-label').textContent;
        
        if (videoUrl) {
            // Set video source
            this.desktopVideo.src = videoUrl;
            
            // Set window title
            this.windowTitleText.textContent = `${iconLabel} - Jamtem Video`;
            
            // Show window with animation
            this.videoWindow.style.display = 'block';
            this.videoWindow.style.opacity = '0';
            this.videoWindow.style.transform = 'translate(-50%, -50%) scale(0.8)';
            
            // Animate in
            setTimeout(() => {
                this.videoWindow.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                this.videoWindow.style.opacity = '1';
                this.videoWindow.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 10);
            
            // Auto-play video
            this.desktopVideo.play().catch(e => {
                console.log('Auto-play prevented:', e);
            });
        }
    }
    
    // Close video window
    closeVideoWindow() {
        // Animate out
        this.videoWindow.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        this.videoWindow.style.opacity = '0';
        this.videoWindow.style.transform = 'translate(-50%, -50%) scale(0.8)';
        
        setTimeout(() => {
            this.videoWindow.style.display = 'none';
            this.videoWindow.style.transition = '';
            
            // Stop and reset video
            this.desktopVideo.pause();
            this.desktopVideo.currentTime = 0;
            
            // Remove maximized state
            this.videoWindow.classList.remove('maximized');
            this.videoWindow.style.top = '50%';
            this.videoWindow.style.left = '50%';
            this.videoWindow.style.transform = 'translate(-50%, -50%)';
            
            // Clear selection from icons
            document.querySelectorAll('.desktop-icon').forEach(icon => {
                icon.classList.remove('selected');
            });
        }, 200);
    }
    
    // Taskbar button functionality
    setupTaskbarButtons() {
        const startButton = document.querySelector('.start-button');
        
        // Only set up if start button exists (taskbar loaded successfully)
        if (startButton) {
            // Start button click (could open a start menu in the future)
            startButton.addEventListener('click', () => {
                // For now, just show a simple alert
                this.showStartMenu();
            });
        }
        
        // Add click sound effect (optional)
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
    
    // Start menu with navigation links
    showStartMenu() {
        const startMenuItems = [
            { label: 'Home', url: '/', icon: '🏠' },
            { label: 'Products', url: '/products', icon: '🛍️' },
            { label: 'Collage', url: '/collage', icon: '🎨' },
            { label: 'Join Community', url: '/join', icon: '👥' },
            { label: '---', url: null, icon: '' }, // Separator
            { label: 'Refresh', url: null, icon: '🔄' },
            { label: 'Properties', url: null, icon: '⚙️' }
        ];
        
        // Create a simple context menu-style start menu
        const existingMenu = document.querySelector('.start-menu');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }
        
        const startMenu = document.createElement('div');
        startMenu.className = 'start-menu';
        
        // Adjust position for mobile
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
                // Add separator
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
            
            // Add touch events for mobile
            menuItem.addEventListener('touchstart', () => {
                menuItem.style.background = '#316ac5';
                menuItem.style.color = 'white';
            });
            
            menuItem.addEventListener('click', () => {
                startMenu.remove();
                
                // Handle menu item clicks
                if (item.url) {
                    window.location.href = item.url;
                } else if (item.label === 'Refresh') {
                    location.reload();
                } else if (item.label === 'Properties') {
                    alert('Desktop Properties\n\nJamtem World Desktop\nEarly 2000s Theme\nVersion 1.0');
                }
                
                console.log(`Clicked: ${item.label}`);
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
            
            // Also close on touch outside (mobile)
            document.addEventListener('touchstart', function closeTouchMenu(e) {
                if (!startMenu.contains(e.target) && !e.target.closest('.start-button')) {
                    startMenu.remove();
                    document.removeEventListener('touchstart', closeTouchMenu);
                }
            });
        }, 100);
    }
    
    // Setup desktop notification
    setupNotification() {
        if (!this.notification) return;
        
        // Setup close button
        const closeBtn = document.getElementById('notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideNotification();
            });
        }
        
        // Close notification when clicking on it (optional)
        this.notification.addEventListener('click', (e) => {
            // Don't close if clicking the close button (handled above)
            if (!e.target.classList.contains('notification-close')) {
                this.hideNotification();
                // Optionally open the join window when notification is clicked
                this.openApp('join-window');
            }
        });
        
        // Show notification 5 seconds after desktop loads
        setTimeout(() => {
            this.showNotification();
        }, 5000);
    }
    
    // Show notification
    showNotification() {
        if (!this.notification) return;
        
        console.log('Showing desktop notification');
        
        // Make notification visible
        this.notification.style.display = 'block';
        
        // Trigger slide-in animation
        setTimeout(() => {
            this.notification.classList.add('show');
        }, 10);
        
        // Auto-hide after 10 seconds
        this.notificationTimeout = setTimeout(() => {
            this.hideNotification();
        }, 10000);
    }
    
    // Hide notification
    hideNotification() {
        if (!this.notification) return;
        
        console.log('Hiding desktop notification');
        
        // Clear auto-hide timeout
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
            this.notificationTimeout = null;
        }
        
        // Trigger slide-out animation
        this.notification.classList.remove('show');
        this.notification.classList.add('hide');
        
        // Hide completely after animation
        setTimeout(() => {
            this.notification.style.display = 'none';
            this.notification.classList.remove('hide');
        }, 300);
    }
    
    // Add desktop right-click context menu with Ctrl+Right-Click bypass
    setupDesktopContextMenu() {
        const desktop = document.querySelector('.desktop');
        
        desktop.addEventListener('contextmenu', (e) => {
            // Allow browser context menu when Ctrl is held (for inspect mode)
            if (e.ctrlKey) {
                return; // Don't prevent default, allow browser context menu
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
            
            const menuItems = ['Refresh', 'Paste', 'Properties'];
            
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
                    // Handle menu item clicks here
                    if (item === 'Refresh') {
                        location.reload();
                    }
                    console.log(`Clicked: ${item}`);
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

// Initialize desktop interface when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Show loading overlay and initialize after 2 seconds
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // Ensure loading overlay is visible
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
        
        // After 2 seconds, fade out loading and initialize desktop
        setTimeout(async () => {
            // Start fade out animation
            loadingOverlay.classList.add('fade-out');
            
            // Wait for fade animation to complete, then hide completely
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 500);
            
            // Load taskbar component
            const loader = new ComponentLoader();
            await loader.loadComponent('taskbar', '#taskbar-placeholder');
            
            // Initialize desktop interface
            window.desktop = new DesktopInterface();
            window.desktop.setupDesktopContextMenu();
        }, 3000);
    } else {
        // Fallback if loading overlay not found
        const loader = new ComponentLoader();
        await loader.loadComponent('taskbar', '#taskbar-placeholder');
        
        window.desktop = new DesktopInterface();
        window.desktop.setupDesktopContextMenu();
    }
});

// Global function to open apps (for debugging and external access)
window.openApp = function(windowId) {
    if (window.desktop) {
        window.desktop.openApp(windowId);
    } else {
        console.error('Desktop interface not initialized');
    }
};

// Add some classic Windows sound effects (optional)
class WindowsSounds {
    static playStartup() {
        // Could add actual sound files here
        console.log('Windows startup sound');
    }
    
    static playClick() {
        // Could add click sound
        console.log('Click sound');
    }
    
    static playError() {
        // Could add error sound
        console.log('Error sound');
    }
}

// Add some Easter eggs for authenticity
document.addEventListener('keydown', (e) => {
    // Ctrl+Alt+Del simulation
    if (e.ctrlKey && e.altKey && e.key === 'Delete') {
        e.preventDefault();
        alert('Press Ctrl+Alt+Del to restart your computer.\n\nThis is a simulation - your computer is fine! 😄');
    }
    
    // Windows key simulation
    if (e.key === 'Meta' || e.key === 'OS') {
        e.preventDefault();
        const startButton = document.querySelector('.start-button');
        if (startButton) {
            startButton.click();
        }
    }
});
