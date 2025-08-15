// Desktop OS Interface JavaScript
class DesktopInterface {
    constructor() {
        this.videoWindow = document.getElementById('video-window');
        this.desktopVideo = document.getElementById('desktop-video');
        this.windowTitleText = document.getElementById('window-title-text');
        this.closeButton = document.getElementById('close-video-window');
        
        this.init();
    }
    
    init() {
        this.setupClock();
        this.setupDesktopIcons();
        this.setupVideoWindow();
        this.setupTaskbarButtons();
    }
    
    // Clock functionality
    setupClock() {
        const clockElement = document.getElementById('time');
        
        const updateClock = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            clockElement.textContent = timeString;
        };
        
        // Update immediately and then every second
        updateClock();
        setInterval(updateClock, 1000);
    }
    
    // Desktop icon interactions
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
        // Remove selection from other icons
        allIcons.forEach(otherIcon => {
            otherIcon.classList.remove('selected');
        });
        
        // Add selection to clicked icon
        icon.classList.add('selected');
        
        // Open video after short delay (simulating double-click)
        setTimeout(() => {
            this.openVideoWindow(icon);
        }, 200);
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
                this.videoWindow.style.width = '900px';
                this.videoWindow.style.height = 'auto';
                this.videoWindow.style.top = '50%';
                this.videoWindow.style.left = '50%';
                this.videoWindow.style.transform = 'translate(-50%, -50%)';
            } else {
                this.videoWindow.classList.add('maximized');
                this.videoWindow.style.width = '98vw';
                this.videoWindow.style.height = '95vh';
                this.videoWindow.style.top = '2.5vh';
                this.videoWindow.style.left = '1vw';
                this.videoWindow.style.transform = 'none';
            }
        });
    }
    
    // Open video window
    openVideoWindow(iconElement) {
        const videoUrl = iconElement.getAttribute('data-video');
        const iconLabel = iconElement.querySelector('.icon-label').textContent;
        
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
            this.videoWindow.style.width = '900px';
            this.videoWindow.style.height = 'auto';
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
        
        // Start button click (could open a start menu in the future)
        startButton.addEventListener('click', () => {
            // For now, just show a simple alert
            this.showStartMenu();
        });
        
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
document.addEventListener('DOMContentLoaded', () => {
    const desktop = new DesktopInterface();
    desktop.setupDesktopContextMenu();
});

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
        document.querySelector('.start-button').click();
    }
});
