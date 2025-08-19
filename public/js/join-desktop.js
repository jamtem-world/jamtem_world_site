// Join Desktop Interface JavaScript
class JoinDesktopInterface {
    constructor() {
        this.openWindows = new Set();
        this.currentTab = 0;
        this.tabs = ['personal', 'craft', 'showcase'];
        this.init();
    }
    
    init() {
        this.setupDesktopIcons();
        this.setupWindowControls();
        this.setupClock();
        this.setupStartMenu();
        this.setupDesktopContextMenu();
        this.setupFormTabs();
        this.setupFormNavigation();
        this.setupFileUpload();
        this.setupFormValidation();
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
            case 'join-form-window':
                this.initializeJoinForm();
                break;
            case 'community-benefits-window':
                this.initializeBenefits();
                break;
            case 'help-guide-window':
                this.initializeHelp();
                break;
            case 'file-manager-window':
                this.initializeFileManager();
                break;
        }
    }
    
    // Initialize join form
    initializeJoinForm() {
        // Reset form to first tab
        this.currentTab = 0;
        this.showTab(this.currentTab);
        this.updateNavigation();
    }
    
    // Initialize benefits window
    initializeBenefits() {
        // Benefits window is static, no special initialization needed
    }
    
    // Initialize help window
    initializeHelp() {
        // Help window is static, no special initialization needed
    }
    
    // Initialize file manager
    initializeFileManager() {
        // File manager is static for demo purposes
    }
    
    // Setup form tabs
    setupFormTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        
        tabButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                this.currentTab = index;
                this.showTab(this.currentTab);
                this.updateTabButtons();
            });
        });
    }
    
    // Show specific tab
    showTab(tabIndex) {
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabContents.forEach((content, index) => {
            if (index === tabIndex) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
        
        this.updateTabButtons();
        this.updateNavigation();
    }
    
    // Update tab button states
    updateTabButtons() {
        const tabButtons = document.querySelectorAll('.tab-button');
        
        tabButtons.forEach((button, index) => {
            if (index === this.currentTab) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
    
    // Setup form navigation
    setupFormNavigation() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const submitBtn = document.getElementById('submit-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.previousTab();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.nextTab();
            });
        }
        
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.submitForm();
            });
        }
    }
    
    // Navigate to previous tab
    previousTab() {
        if (this.currentTab > 0) {
            this.currentTab--;
            this.showTab(this.currentTab);
        }
    }
    
    // Navigate to next tab
    nextTab() {
        if (this.validateCurrentTab()) {
            if (this.currentTab < this.tabs.length - 1) {
                this.currentTab++;
                this.showTab(this.currentTab);
            }
        }
    }
    
    // Update navigation buttons
    updateNavigation() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const submitBtn = document.getElementById('submit-btn');
        
        // Show/hide previous button
        if (prevBtn) {
            prevBtn.style.display = this.currentTab > 0 ? 'block' : 'none';
        }
        
        // Show/hide next/submit buttons
        if (this.currentTab === this.tabs.length - 1) {
            if (nextBtn) nextBtn.style.display = 'none';
            if (submitBtn) submitBtn.style.display = 'block';
        } else {
            if (nextBtn) nextBtn.style.display = 'block';
            if (submitBtn) submitBtn.style.display = 'none';
        }
    }
    
    // Setup file upload
    setupFileUpload() {
        const fileInput = document.getElementById('image');
        const uploadArea = document.getElementById('file-upload-area');
        const preview = document.getElementById('image-preview');
        const previewImage = document.getElementById('preview-image');
        const imageName = document.getElementById('image-name');
        const imageSize = document.getElementById('image-size');
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
            
            // Drag and drop functionality
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.backgroundColor = '#e0e0e0';
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.style.backgroundColor = '#f8f8f8';
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.backgroundColor = '#f8f8f8';
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    const file = files[0];
                    if (file.type.startsWith('image/')) {
                        this.handleFileUpload(file);
                        if (fileInput) {
                            fileInput.files = files;
                        }
                    }
                }
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
            this.showError('Please select a valid image file.');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            this.showError('File size must be less than 10MB.');
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
    
    // Setup form validation
    setupFormValidation() {
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
        
        // Real-time validation
        const inputs = document.querySelectorAll('.form-input, .form-textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });
    }
    
    // Validate current tab
    validateCurrentTab() {
        const currentTabElement = document.getElementById(`${this.tabs[this.currentTab]}-tab`);
        if (!currentTabElement) return true;
        
        const requiredFields = currentTabElement.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    // Validate individual field
    validateField(field) {
        const errorElement = document.getElementById(field.id + '-error');
        let isValid = true;
        let errorMessage = '';
        
        // Check if required field is empty
        if (field.hasAttribute('required') && !field.value.trim()) {
            isValid = false;
            errorMessage = 'This field is required.';
        }
        
        // Email validation
        if (field.type === 'email' && field.value.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address.';
            }
        }
        
        // URL validation
        if (field.type === 'url' && field.value.trim()) {
            try {
                new URL(field.value);
            } catch {
                isValid = false;
                errorMessage = 'Please enter a valid URL.';
            }
        }
        
        // Bio length validation
        if (field.id === 'bio' && field.value.length > 500) {
            isValid = false;
            errorMessage = 'Bio must be 500 characters or less.';
        }
        
        // Display error
        if (errorElement) {
            errorElement.textContent = errorMessage;
        }
        
        return isValid;
    }
    
    // Submit form
    submitForm() {
        if (!this.validateCurrentTab()) {
            return;
        }
        
        // Check if image is uploaded
        const fileInput = document.getElementById('image');
        if (!fileInput || !fileInput.files.length) {
            this.showError('Please upload a showcase image.');
            return;
        }
        
        // Simulate form submission
        this.showDialog('success-dialog');
        this.closeWindow('join-form-window');
    }
    
    // Show error message
    showError(message) {
        const errorText = document.getElementById('error-message-text');
        if (errorText) {
            errorText.textContent = message;
        }
        this.showDialog('error-dialog');
    }
    
    // Show dialog
    showDialog(dialogId) {
        const dialog = document.getElementById(dialogId);
        if (dialog) {
            dialog.style.display = 'block';
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
                    alert('Join Desktop Properties\n\nJamtem World Community Registration\nEarly 2000s Theme\nVersion 1.0');
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
                
                const menuItems = ['Refresh', 'Join Community', 'Properties'];
                
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
                        } else if (item === 'Join Community') {
                            this.openApp('join-form-window');
                        } else if (item === 'Properties') {
                            alert('Desktop Properties\n\nJamtem World Join Desktop\nEarly 2000s Theme\nVersion 1.0');
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
    window.joinDesktop = new JoinDesktopInterface();
});

// Global function to open apps (for use in HTML onclick attributes)
window.openApp = function(windowId) {
    if (window.joinDesktop) {
        window.joinDesktop.openApp(windowId);
    }
};

// Global function to close dialogs
window.closeDialog = function(dialogId) {
    const dialog = document.getElementById(dialogId);
    if (dialog) {
        dialog.style.display = 'none';
    }
};
