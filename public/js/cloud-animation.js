// Cloud Animation and Interactive Logo System
class CloudAnimationSystem {
    constructor() {
        this.logoEffects = ['bounce', 'rotate', 'scale', 'glow', 'wobble', 'float', 'spiral', 'pulse', 'flip'];
        this.isMobile = this.detectMobile();
        this.logoPeriodicInterval = null;
        this.mobileTooltipTimeouts = [];
        this.init();
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth <= 768;
    }

    init() {
        this.setupCloudInteractions();
        this.setupLogoEffects();
        this.setupVideoModal();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.isMobile = this.detectMobile();
        });
    }

    setupCloudInteractions() {
        const clouds = document.querySelectorAll('.cloud-img');
        
        // Ensure tooltip element exists, create if it doesn't
        let tooltip = document.getElementById('cloud-tooltip');
        if (!tooltip) {
            console.warn('Cloud tooltip element not found, creating it...');
            tooltip = document.createElement('div');
            tooltip.id = 'cloud-tooltip';
            tooltip.className = 'cloud-tooltip';
            tooltip.innerHTML = '<span>click me</span>';
            
            // Apply inline styles matching the CSS exactly
            tooltip.style.cssText = `
                position: fixed;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 15px 20px;
                border-radius: 50px;
                font-size: 1.5rem;
                font-weight: bold;
                white-space: nowrap;
                z-index: 100000;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s ease, transform 0.3s ease;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.8);
                font-family: inherit;
                display: block;
                transform: translateY(-10px);
            `;
            
            document.body.appendChild(tooltip);
        }
        
        clouds.forEach(cloud => {
            let hoverTimeout;
            
            // Desktop hover events
            cloud.addEventListener('mouseenter', (e) => {
                // Only show tooltip on desktop (non-touch devices)
                if (!('ontouchstart' in window) && tooltip) {
                    // Clear any existing timeout
                    if (hoverTimeout) {
                        clearTimeout(hoverTimeout);
                    }
                    
                    // Add a small delay to prevent flickering
                    hoverTimeout = setTimeout(() => {
                        this.pauseCloudAnimation(e.target);
                        this.showCloudTooltip(e, tooltip);
                    }, 50);
                }
            });

            cloud.addEventListener('mousemove', (e) => {
                // Update tooltip position on mouse move
                if (!('ontouchstart' in window) && tooltip && tooltip.classList.contains('visible')) {
                    this.updateTooltipPosition(e, tooltip);
                }
            });

            cloud.addEventListener('mouseleave', (e) => {
                // Clear any existing timeout
                if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                }
                
                this.resumeCloudAnimation(e.target);
                if (tooltip) {
                    this.hideCloudTooltip(tooltip);
                }
            });

            // Click event for all devices
            cloud.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const videoSrc = e.target.getAttribute('data-video');
                this.openVideoModal(videoSrc);
            });
        });
    }

    showCloudTooltip(event, tooltip) {
        tooltip.classList.add('visible');
        this.updateTooltipPosition(event, tooltip);
    }

    hideCloudTooltip(tooltip) {
        tooltip.classList.remove('visible');
    }

    updateTooltipPosition(event, tooltip) {
        const offsetX = 15; // Fixed offset from cursor
        const offsetY = -40; // Position above cursor
        
        let x = event.clientX + offsetX;
        let y = event.clientY + offsetY;
        
        // Prevent tooltip from going off-screen
        const tooltipRect = tooltip.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        if (x + tooltipRect.width > windowWidth) {
            x = event.clientX - tooltipRect.width - offsetX;
        }
        
        if (y < 0) {
            y = event.clientY - offsetY + 20;
        }
        
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
    }

    pauseCloudAnimation(cloud) {
        cloud.style.animationPlayState = 'paused';
        // Add a class to ensure stable hover state
        cloud.classList.add('cloud-paused');
    }

    resumeCloudAnimation(cloud) {
        cloud.style.animationPlayState = 'running';
        // Remove the paused class
        cloud.classList.remove('cloud-paused');
    }

    setupLogoEffects() {
        const logo = document.querySelector('.interactive-logo');
        if (!logo) return;

        if (this.isMobile) {
            // Mobile: Periodic random effects
            this.startLogoPeriodicEffects(logo);
        } else {
            // Desktop: Hover effects
            logo.addEventListener('mouseenter', () => {
                this.applyRandomLogoEffect(logo);
            });

            logo.addEventListener('animationend', () => {
                this.clearLogoEffects(logo);
            });
        }
    }

    startLogoPeriodicEffects(logo) {
        // Clear any existing interval
        if (this.logoPeriodicInterval) {
            clearInterval(this.logoPeriodicInterval);
        }

        // Start periodic effects every 4-7 seconds
        this.logoPeriodicInterval = setInterval(() => {
            this.applyRandomLogoEffect(logo);
        }, this.getRandomInterval(4000, 7000));
    }

    applyRandomLogoEffect(logo) {
        // Clear any existing effects
        this.clearLogoEffects(logo);
        
        // Apply random effect
        const randomEffect = this.logoEffects[Math.floor(Math.random() * this.logoEffects.length)];
        logo.classList.add(`logo-${randomEffect}`);

        // Remove effect after animation completes
        setTimeout(() => {
            this.clearLogoEffects(logo);
        }, 2000);
    }

    clearLogoEffects(logo) {
        this.logoEffects.forEach(effect => {
            logo.classList.remove(`logo-${effect}`);
        });
    }

    setupMobileTooltips() {
        if (!this.isMobile) return;

        // Clear existing timeouts
        this.mobileTooltipTimeouts.forEach(timeout => clearTimeout(timeout));
        this.mobileTooltipTimeouts = [];

        const clouds = document.querySelectorAll('.cloud-img');
        
        clouds.forEach((cloud, index) => {
            // Create tooltip element if it doesn't exist
            let tooltip = cloud.nextElementSibling;
            if (!tooltip || !tooltip.classList.contains('mobile-tooltip')) {
                tooltip = document.createElement('div');
                tooltip.className = 'mobile-tooltip';
                tooltip.textContent = 'click me';
                cloud.parentNode.insertBefore(tooltip, cloud.nextSibling);
            }

            // Schedule periodic tooltip appearances
            const showTooltip = () => {
                const cloudRect = cloud.getBoundingClientRect();
                const containerRect = cloud.parentElement.getBoundingClientRect();
                
                // Position tooltip relative to cloud
                tooltip.style.left = `${cloud.offsetLeft + (cloud.offsetWidth / 2)}px`;
                tooltip.style.top = `${cloud.offsetTop - 30}px`;
                tooltip.classList.add('show');

                // Hide tooltip after 2 seconds
                setTimeout(() => {
                    tooltip.classList.remove('show');
                }, 2000);

                // Schedule next appearance
                const nextTimeout = setTimeout(showTooltip, this.getRandomInterval(8000, 15000));
                this.mobileTooltipTimeouts.push(nextTimeout);
            };

            // Start with random initial delay
            const initialTimeout = setTimeout(showTooltip, this.getRandomInterval(2000, 8000));
            this.mobileTooltipTimeouts.push(initialTimeout);
        });
    }

    getRandomInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    setupVideoModal() {
        const modal = document.getElementById('video-modal');
        const video = document.getElementById('modal-video');
        const closeBtn = document.getElementById('video-modal-close');

        if (!modal || !video || !closeBtn) return;

        // Close button click
        closeBtn.addEventListener('click', () => {
            this.closeVideoModal();
        });

        // Click outside modal to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeVideoModal();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display !== 'none') {
                this.closeVideoModal();
            }
        });

        // Video ended event
        video.addEventListener('ended', () => {
            // Optionally auto-close when video ends
            // this.closeVideoModal();
        });
    }

    openVideoModal(videoSrc) {
        const modal = document.getElementById('video-modal');
        const video = document.getElementById('modal-video');
        const source = video.querySelector('source');
        
        if (!modal || !video || !source) return;

        // Update video source if provided
        if (videoSrc) {
            source.src = videoSrc;
            video.load(); // Reload the video with new source
        }

        // Show modal
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');

        // Reset and play video
        video.currentTime = 0;
        video.play().catch(e => {
            console.log('Video autoplay prevented:', e);
        });

        // Pause cloud animations while modal is open
        this.pauseAllCloudAnimations();
    }

    closeVideoModal() {
        const modal = document.getElementById('video-modal');
        const video = document.getElementById('modal-video');
        
        if (!modal || !video) return;

        // Hide modal
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');

        // Pause and reset video
        video.pause();
        video.currentTime = 0;

        // Resume cloud animations
        this.resumeAllCloudAnimations();
    }

    pauseAllCloudAnimations() {
        const clouds = document.querySelectorAll('.cloud-img');
        clouds.forEach(cloud => {
            cloud.style.animationPlayState = 'paused';
        });
    }

    resumeAllCloudAnimations() {
        const clouds = document.querySelectorAll('.cloud-img');
        clouds.forEach(cloud => {
            cloud.style.animationPlayState = 'running';
        });
    }

    // Cleanup method
    destroy() {
        if (this.logoPeriodicInterval) {
            clearInterval(this.logoPeriodicInterval);
        }
        
        this.mobileTooltipTimeouts.forEach(timeout => clearTimeout(timeout));
        this.mobileTooltipTimeouts = [];
    }
}

// Initialize the cloud animation system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const cloudSystem = new CloudAnimationSystem();
    
    // Store reference globally for potential cleanup
    window.cloudAnimationSystem = cloudSystem;
});

// Handle page visibility changes (pause animations when tab is not active)
document.addEventListener('visibilitychange', () => {
    const clouds = document.querySelectorAll('.cloud-img');
    
    if (document.hidden) {
        // Page is hidden, pause animations to save resources
        clouds.forEach(cloud => {
            cloud.style.animationPlayState = 'paused';
        });
    } else {
        // Page is visible, resume animations
        clouds.forEach(cloud => {
            cloud.style.animationPlayState = 'running';
        });
    }
});

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CloudAnimationSystem;
}
