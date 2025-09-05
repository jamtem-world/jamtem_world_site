// Collage Manager - Handles dynamic grid and member data
class CollageManager {
    constructor() {
        this.members = [];
        this.currentMember = null;
        this.gridContainer = null;
        this.sphereContainer = null;
        this.sphereCanvas = null;
        this.modal = null;
        this.isLoading = false;
        this.sphereManager = null;
        this.is3DMode = false;
        this.webGLSupported = this.checkWebGLSupport();
        
        this.init();
    }

    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            return !!gl;
        } catch (e) {
            return false;
        }
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupElements());
        } else {
            this.setupElements();
        }
    }

    setupElements() {
        this.gridContainer = document.getElementById('collage-grid');
        this.sphereContainer = document.getElementById('sphere-container');
        this.sphereCanvas = document.getElementById('sphere-canvas');
        this.modal = document.getElementById('member-modal');
        
        if (!this.gridContainer) {
            console.error('Collage grid container not found');
            return;
        }

        this.setupModalEvents();
        this.setupViewToggleEvents();
        this.setupSearchEvents();
        this.loadMembers();
    }

    setupViewToggleEvents() {
        const gridViewBtn = document.getElementById('grid-view-btn');
        const view3DBtn = document.getElementById('3d-view-btn');

        if (gridViewBtn) {
            gridViewBtn.addEventListener('click', () => {
                this.switchTo2D();
                // Update button states
                gridViewBtn.classList.add('active');
                if (view3DBtn) view3DBtn.classList.remove('active');
            });
        }

        if (view3DBtn) {
            view3DBtn.addEventListener('click', () => {
                this.switchTo3D();
                // Update button states
                view3DBtn.classList.add('active');
                if (gridViewBtn) gridViewBtn.classList.remove('active');
            });
        }

        // Hide 3D toggle if WebGL is not supported
        if (!this.webGLSupported && view3DBtn) {
            view3DBtn.style.display = 'none';
            if (gridViewBtn) gridViewBtn.classList.add('active');
        }
    }

    setupSearchEvents() {
        const searchInput = document.getElementById('member-search-input');
        const searchBtn = document.getElementById('search-btn');
        
        if (!searchInput) return;

        // Debounce timer for real-time search
        let searchTimeout;
        
        // Real-time search with debouncing
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.performSearch(e.target.value);
            }, 300); // 300ms delay for debouncing
        });

        // Search button click
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch(searchInput.value);
            });
        }

        // Enter key press
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                this.performSearch(searchInput.value);
            }
        });

        // Clear search when input is cleared
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                this.performSearch('');
            }
        });
    }

    // Unified search method that handles both 2D and 3D views
    async performSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        console.log('Performing search for:', searchTerm);

        // Get filtered members
        let filteredMembers = this.members;
        
        if (searchTerm) {
            filteredMembers = this.members.filter(member => {
                const name = (member.first_name || '').toString().toLowerCase();
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

        console.log(`Found ${filteredMembers.length} members matching "${searchTerm}"`);

        // Update the appropriate view
        if (this.is3DMode) {
            await this.update3DViewWithFilteredMembers(filteredMembers);
        } else {
            this.renderFilteredGrid(filteredMembers, searchTerm);
        }
    }

    // Update 3D view with filtered members
    async update3DViewWithFilteredMembers(filteredMembers) {
        if (!this.sphereManager || !this.sphereCanvas) return;

        try {
            // Dispose current 3D scene
            this.sphereManager.dispose();
            
            // Reinitialize with filtered members
            if (filteredMembers.length > 0) {
                const success = await this.sphereManager.init(this.sphereCanvas, filteredMembers);
                if (!success) {
                    console.warn('Failed to update 3D view with filtered results');
                    // Fallback to showing no results message
                    this.show3DNoResults();
                }
            } else {
                // Show no results in 3D view
                this.show3DNoResults();
            }
        } catch (error) {
            console.error('Error updating 3D view with filtered results:', error);
            this.show3DNoResults();
        }
    }

    // Show no results message in 3D view
    show3DNoResults() {
        this.hideAllStates();
        if (this.sphereContainer) {
            this.sphereContainer.style.display = 'flex';
            this.sphereContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #000; text-align: center; padding: 40px;">
                    <h3>No Results Found</h3>
                    <p>No community members found matching your search</p>
                    <button onclick="document.getElementById('member-search-input').value = ''; window.collageManager.performSearch('');" 
                            style="margin-top: 10px; padding: 8px 16px; background: #0078d4; color: white; border: none; cursor: pointer; border-radius: 4px;">
                        Clear Search
                    </button>
                </div>
                <canvas id="sphere-canvas" class="sphere-canvas" style="display: none;"></canvas>
            `;
            // Update canvas reference since we recreated the container
            this.sphereCanvas = document.getElementById('sphere-canvas');
        }
    }

    setupModalEvents() {
        if (!this.modal) return;

        const closeBtn = document.getElementById('modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display !== 'none') {
                this.closeModal();
            }
        });
    }

    async loadMembers() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();

        try {
            const response = await fetch('/api/collage');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success && data.members) {
                this.members = data.members;
                this.renderGrid();
            } else {
                throw new Error(data.error || 'Failed to load members');
            }
        } catch (error) {
            console.error('Error loading members:', error);
            this.showError();
        } finally {
            this.isLoading = false;
        }
    }

    calculateGridDimensions(memberCount) {
        if (memberCount === 0) return { cols: 2, rows: 2 };
        if (memberCount <= 4) return { cols: 2, rows: 2 };
        if (memberCount <= 9) return { cols: 3, rows: 3 };
        if (memberCount <= 16) return { cols: 4, rows: 4 };
        if (memberCount <= 25) return { cols: 5, rows: 5 };
        if (memberCount <= 36) return { cols: 6, rows: 6 };
        if (memberCount <= 49) return { cols: 7, rows: 7 };
        if (memberCount <= 64) return { cols: 8, rows: 8 };
        if (memberCount <= 81) return { cols: 9, rows: 9 };
        if (memberCount <= 100) return { cols: 10, rows: 10 };
        if (memberCount <= 121) return { cols: 11, rows: 11 };
        if (memberCount <= 144) return { cols: 12, rows: 12 };
        if (memberCount <= 169) return { cols: 13, rows: 13 };
        if (memberCount <= 196) return { cols: 14, rows: 14 };
        if (memberCount <= 225) return { cols: 15, rows: 15 };
        if (memberCount <= 256) return { cols: 16, rows: 16 };
        if (memberCount <= 289) return { cols: 17, rows: 17 };
        if (memberCount <= 324) return { cols: 18, rows: 18 };
        if (memberCount <= 361) return { cols: 19, rows: 19 };
        if (memberCount <= 400) return { cols: 20, rows: 20 };
        
        // For very large numbers, calculate square root and round up
        const cols = Math.min(Math.ceil(Math.sqrt(memberCount)), 50);
        return { cols, rows: cols };
    }

    renderGrid() {
        if (!this.gridContainer) return;

        const memberCount = this.members.length;
        
        if (memberCount === 0) {
            this.showNoMembers();
            return;
        }

        const { cols, rows } = this.calculateGridDimensions(memberCount);
        const totalSlots = cols * rows;

        // Clear existing grid classes but preserve base classes
        this.gridContainer.className = this.gridContainer.className.includes('community-grid') ? 'community-grid' : 'collage-grid';
        
        // Add appropriate grid class
        this.gridContainer.classList.add(`grid-${cols}x${rows}`);

        // Clear existing content
        this.gridContainer.innerHTML = '';

        // Create grid items
        for (let i = 0; i < totalSlots; i++) {
            const gridItem = document.createElement('div');
            gridItem.className = 'collage-item';
            
            if (i < memberCount) {
                const member = this.members[i];
                this.createMemberItem(gridItem, member);
            } else {
                // Create placeholder for empty slots
                gridItem.classList.add('placeholder');
            }
            
            this.gridContainer.appendChild(gridItem);
        }

        this.showGrid();
    }

    createMemberItem(gridItem, member) {
        gridItem.setAttribute('data-member-id', member.id);
        gridItem.setAttribute('tabindex', '0');
        gridItem.setAttribute('role', 'button');
        gridItem.setAttribute('aria-label', `View ${member.first_name}'s profile`);

        if (member.imageUrl) {
            const img = document.createElement('img');
            img.src = member.imageUrl;
            img.alt = `${member.name} - ${member.craft}`;
            img.loading = 'lazy';
            
            // Handle image load errors
            img.onerror = () => {
                gridItem.classList.add('placeholder');
                gridItem.innerHTML = '<span>Image not available</span>';
            };
            
            gridItem.appendChild(img);
        } else {
            gridItem.classList.add('placeholder');
            gridItem.innerHTML = '<span>No image</span>';
        }

        // Add click and keyboard event listeners
        const openModal = () => this.openModal(member);
        gridItem.addEventListener('click', openModal);
        gridItem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModal();
            }
        });
    }

    openModal(member) {
        if (!this.modal) return;

        this.currentMember = member;

        // Update modal content
        const modalImage = document.getElementById('modal-member-image');
        const modalImagePlaceholder = document.getElementById('modal-image-placeholder');
        const modalName = document.getElementById('modal-member-name');
        const modalCraft = document.getElementById('modal-member-craft');
        const modalInstagram = document.getElementById('modal-member-instagram');
        const modalInstagramSection = document.getElementById('modal-instagram-section');
        const modalBio = document.getElementById('modal-member-bio');
        const modalContainer = document.querySelector('.modal-container');

        // Set background image for modal container with dark overlay
        if (member.backgroundImageUrl && modalContainer) {
            modalContainer.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${member.backgroundImageUrl})`;
            modalContainer.style.backgroundSize = 'cover';
            modalContainer.style.backgroundPosition = 'center';
            modalContainer.style.backgroundRepeat = 'no-repeat';
        } else if (member.imageUrl && modalContainer) {
            // Use profile image as background if no background image is provided
            modalContainer.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${member.imageUrl})`;
            modalContainer.style.backgroundSize = 'cover';
            modalContainer.style.backgroundPosition = 'center';
            modalContainer.style.backgroundRepeat = 'no-repeat';
        } else if (modalContainer) {
            // Clear background image if no images are available
            modalContainer.style.backgroundImage = '';
            modalContainer.style.backgroundSize = '';
            modalContainer.style.backgroundPosition = '';
            modalContainer.style.backgroundRepeat = '';
        }

        // Set image with ELMNT video hover functionality
        if (member.imageUrl && modalImage) {
            modalImage.src = member.imageUrl;
            modalImage.alt = `${member.name} - ${member.craft}`;
            modalImage.style.display = 'block';
            if (modalImagePlaceholder) {
                modalImagePlaceholder.style.display = 'none';
            }

            // Add ELMNT video hover functionality if video exists
            this.setupElmntVideoHover(modalImage, member);
        } else {
            if (modalImage) modalImage.style.display = 'none';
            if (modalImagePlaceholder) modalImagePlaceholder.style.display = 'flex';
        }

        // Set text content
        if (modalName) modalName.textContent = member.first_name || 'Unknown';
        
        // Handle craft field - format properly if it's an array
        if (modalCraft) {
            let craftText = 'Creator';
            if (member.craft) {
                if (Array.isArray(member.craft)) {
                    // Join array elements with commas and spaces
                    craftText = member.craft.join(', ');
                } else {
                    craftText = member.craft.toString();
                }
            }
            modalCraft.textContent = craftText;
        }
        
        if (modalBio) modalBio.textContent = member.bio || 'No bio available';

        // Handle Location
        const modalLocation = document.getElementById('modal-member-location');
        const modalLocationSection = document.getElementById('modal-location-section');
        if (member.location && member.location.trim() && modalLocation && modalLocationSection) {
            modalLocation.textContent = member.location;
            modalLocationSection.style.display = 'flex';
        } else if (modalLocationSection) {
            modalLocationSection.style.display = 'none';
        }

        // Handle Instagram
        if (member.instagram && member.instagram.trim() && modalInstagram && modalInstagramSection) {
            modalInstagram.textContent = member.instagram;
            modalInstagramSection.style.display = 'flex';
        } else if (modalInstagramSection) {
            modalInstagramSection.style.display = 'none';
        }

        // Show modal
        this.modal.style.display = 'flex';
        document.body.classList.add('modal-open');

        // Focus management for accessibility
        const closeBtn = document.getElementById('modal-close');
        if (closeBtn) {
            closeBtn.focus();
        }
    }

    closeModal() {
        if (!this.modal) return;

        // Clean up any existing ELMNT hover overlays
        const existingOverlays = this.modal.querySelectorAll('.elmnt-hover-overlay');
        existingOverlays.forEach(overlay => {
            overlay.remove();
        });

        this.modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        
        // Store current member for focus return before clearing
        const memberToFocus = this.currentMember;
        this.currentMember = null;
        
        // Clear hover time to prevent accidental video modal triggers
        this.lastHoverTime = null;

        // Return focus to the grid item that was clicked
        if (memberToFocus) {
            const gridItem = document.querySelector(`[data-member-id="${memberToFocus.id}"]`);
            if (gridItem) {
                gridItem.focus();
            }
        }
    }

    showLoading() {
        this.hideAllStates();
        // Try both possible loading element IDs
        const loading = document.getElementById('loading') || document.getElementById('collage-loading');
        if (loading) loading.style.display = 'flex';
    }

    showError() {
        this.hideAllStates();
        // Try both possible error element IDs
        const error = document.getElementById('error') || document.getElementById('collage-error');
        if (error) {
            error.style.display = 'block';
        } else {
            // If no error element, show error in grid
            const grid = this.gridContainer;
            if (grid) {
                grid.style.display = 'flex';
                grid.innerHTML = '<div style="text-align: center; padding: 40px; color: #000;"><h3>Unable to Load Community</h3><p>Please try again later.</p><button onclick="window.collageManager.retry()" style="margin-top: 10px; padding: 8px 16px; background: #0078d4; color: white; border: none; cursor: pointer;">Retry</button></div>';
            }
        }
    }

    showGrid() {
        this.hideAllStates();
        // Try both possible container IDs, fallback to direct grid
        const container = document.getElementById('collage-container');
        if (container) {
            container.style.display = 'block';
        } else if (this.gridContainer) {
            this.gridContainer.style.display = 'grid';
        }
    }
    
    // Show grid without hiding desktop sphere (for desktop context)
    showGridPreservingSphere() {
        // Hide only collage-specific states, not the desktop sphere
        const states = [
            'loading', 'collage-loading',
            'error', 'collage-error', 
            'collage-container', 
            'no-members'
        ];
        states.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
        
        // Show the grid without affecting sphere-container
        if (this.gridContainer) {
            this.gridContainer.style.display = 'grid';
        }
        
        console.log('Showing grid while preserving desktop sphere');
    }

    showNoMembers() {
        this.hideAllStates();
        // Try both possible no-members element IDs
        const noMembers = document.getElementById('no-members');
        if (noMembers) {
            noMembers.style.display = 'block';
        } else {
            // If no no-members element, show message in grid
            const grid = this.gridContainer;
            if (grid) {
                grid.style.display = 'flex';
                grid.innerHTML = '<div style="text-align: center; padding: 40px; color: #000;"><h3>No Community Members Yet</h3><p>Be the first to join our creative community!</p></div>';
            }
        }
    }

    hideAllStates() {
        // Hide all possible state elements (both collage.html and desktop.html versions)
        const states = [
            'loading', 'collage-loading',
            'error', 'collage-error', 
            'collage-container', 
            'no-members'
            // Note: sphere-container is NEVER included here because it's used as desktop background
        ];
        states.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
        
        // Also ensure grid is hidden when switching states
        if (this.gridContainer) {
            this.gridContainer.style.display = 'none';
        }
        
        // IMPORTANT: Never hide sphere-container as it's the desktop background sphere
        // The desktop sphere should remain visible at all times regardless of collage window state
    }

    async switchTo3D() {
        console.log('switchTo3D called');
        console.log('WebGL supported:', this.webGLSupported);
        console.log('Sphere canvas:', this.sphereCanvas);
        console.log('Members count:', this.members.length);
        console.log('Sphere container:', this.sphereContainer);

        if (!this.webGLSupported) {
            console.warn('Cannot switch to 3D: WebGL not supported');
            alert('WebGL is not supported on this device. 3D view is not available.');
            return;
        }

        if (!this.sphereCanvas) {
            console.warn('Cannot switch to 3D: Sphere canvas not found');
            alert('3D canvas element not found. Please refresh the page.');
            return;
        }

        if (this.members.length === 0) {
            console.warn('Cannot switch to 3D: No members loaded');
            alert('No community members loaded. Please wait for data to load.');
            return;
        }

        try {
            // CRITICAL FIX: Always dispose existing sphere manager first to prevent duplicates
            if (this.sphereManager) {
                console.log('Disposing existing sphere manager to prevent duplicates...');
                this.sphereManager.dispose();
                this.sphereManager = null;
            }

            // First show the 3D container to ensure canvas gets proper dimensions
            this.show3D();
            
            // Wait a moment for the container to be fully visible and laid out
            await new Promise(resolve => setTimeout(resolve, 100));
            
            console.log('Attempting to import 3D module...');
            // Dynamically import the 3D module
            const { default: SphereCollageManager } = await import('./collage-3d.js');
            console.log('3D module imported successfully');
            
            // Always create a fresh sphere manager to prevent duplicates
            console.log('Creating new SphereCollageManager...');
            this.sphereManager = new SphereCollageManager();

            // Check if there's an active search and use filtered members
            const searchInput = document.getElementById('member-search-input');
            const currentSearch = searchInput ? searchInput.value.trim() : '';
            let membersToShow = this.members;
            
            if (currentSearch) {
                const searchTerm = currentSearch.toLowerCase();
                membersToShow = this.members.filter(member => {
                    const name = (member.first_name || '').toString().toLowerCase();
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
                console.log(`Switching to 3D with ${membersToShow.length} filtered members (search: "${currentSearch}")`);
            }

            console.log('Initializing 3D sphere...');
            const success = await this.sphereManager.init(this.sphereCanvas, membersToShow);
            console.log('3D sphere initialization result:', success);
            
            if (success) {
                this.is3DMode = true;
                console.log('Successfully switched to 3D sphere view');
            } else {
                throw new Error('Failed to initialize 3D sphere');
            }
        } catch (error) {
            console.error('Error switching to 3D:', error);
            alert(`Failed to load 3D view: ${error.message}`);
            // Fallback to 2D
            this.showGrid();
        }
    }

    switchTo2D() {
        if (this.sphereManager) {
            this.sphereManager.dispose();
        }
        this.is3DMode = false;
        
        // Check if there's an active search and apply it to grid view
        const searchInput = document.getElementById('member-search-input');
        const currentSearch = searchInput ? searchInput.value.trim() : '';
        
        if (currentSearch) {
            // Apply current search to grid view
            this.performSearch(currentSearch);
        } else {
            // Show all members in grid view
            this.renderGrid();
        }
        
        console.log('Switched to 2D grid view');
    }

    show3D() {
        this.hideAllStates();
        if (this.sphereContainer) {
            this.sphereContainer.style.display = 'flex';
        }
    }

    // Search functionality (legacy method for backward compatibility)
    searchMembers(query) {
        this.performSearch(query);
    }
    
    renderFilteredGrid(filteredMembers, searchTerm) {
        if (!this.gridContainer) return;

        const memberCount = filteredMembers.length;
        
        if (memberCount === 0) {
            this.showNoSearchResults(searchTerm);
            return;
        }

        const { cols, rows } = this.calculateGridDimensions(memberCount);
        const totalSlots = cols * rows;

        // Clear existing grid classes but preserve base classes
        this.gridContainer.className = this.gridContainer.className.includes('community-grid') ? 'community-grid' : 'collage-grid';
        
        // Add appropriate grid class
        this.gridContainer.classList.add(`grid-${cols}x${rows}`);

        // Clear existing content
        this.gridContainer.innerHTML = '';

        // Create grid items for filtered results
        for (let i = 0; i < totalSlots; i++) {
            const gridItem = document.createElement('div');
            gridItem.className = 'collage-item';
            
            if (i < memberCount) {
                const member = filteredMembers[i];
                this.createMemberItem(gridItem, member);
            } else {
                // Create placeholder for empty slots
                gridItem.classList.add('placeholder');
            }
            
            this.gridContainer.appendChild(gridItem);
        }

        this.showGrid();
    }
    
    showNoSearchResults(searchTerm) {
        this.hideAllStates();
        const grid = this.gridContainer;
        if (grid) {
            grid.style.display = 'flex';
            grid.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #000;">
                    <h3>No Results Found</h3>
                    <p>No community members found matching "${searchTerm}"</p>
                    <button onclick="document.getElementById('member-search-input').value = ''; window.collageManager.performSearch('');" 
                            style="margin-top: 10px; padding: 8px 16px; background: #0078d4; color: white; border: none; cursor: pointer;">
                        Clear Search
                    </button>
                </div>
            `;
        }
    }

    // Setup ELMNT video hover functionality
    setupElmntVideoHover(imageElement, member) {
        // Only set up hover functionality if member actually has an ELMNT video
        if (!member.elmntVideoUrl || member.elmntVideoUrl.trim() === '') {
            console.log('No ELMNT video for member:', member.name);
            return;
        }
        
        console.log('Setting up ELMNT video hover for:', member.name, 'Video URL:', member.elmntVideoUrl);

        // Detect if device is mobile/touch
        const isMobile = this.isMobileDevice();

        // Make image container relative positioned
        const imageContainer = imageElement.parentElement;
        if (!imageContainer) return;
        
        imageContainer.style.position = 'relative';

        if (isMobile) {
            // Mobile: Add persistent tap indicator
            this.setupMobileElmntIndicator(imageContainer, member);
        } else {
            // Desktop: Use existing hover functionality
            this.setupDesktopElmntHover(imageContainer, member);
        }
    }

    // Check if device is mobile/touch
    isMobileDevice() {
        return (
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            ('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0)
        );
    }

    // Setup mobile tap indicator
    setupMobileElmntIndicator(imageContainer, member) {
        // Create tap indicator with icon
        const tapIndicator = document.createElement('div');
        tapIndicator.className = 'elmnt-tap-indicator';
        tapIndicator.innerHTML = 'Tap'; // Clear tap instruction
        tapIndicator.style.cssText = `
            position: absolute;
            bottom: 8px;
            right: 8px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            font-size: 12px;
            font-weight: bold;
            font-family: 'MS Sans Serif', monospace;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            z-index: 15;
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
            opacity: 0;
            transform: scale(0.5);
            transition: all 0.3s ease;
        `;

        imageContainer.appendChild(tapIndicator);

        // Animation to show the indicator periodically
        let animationInterval;
        let isVisible = false;

        const showIndicator = () => {
            if (!isVisible) {
                isVisible = true;
                tapIndicator.style.opacity = '1';
                tapIndicator.style.transform = 'scale(1)';
                
                // Hide after 2 seconds
                setTimeout(() => {
                    if (isVisible) {
                        tapIndicator.style.opacity = '0';
                        tapIndicator.style.transform = 'scale(0.5)';
                        isVisible = false;
                    }
                }, 2000);
            }
        };

        // Show indicator initially after a short delay
        setTimeout(showIndicator, 1000);

        // Show indicator periodically (every 8 seconds)
        animationInterval = setInterval(showIndicator, 8000);

        // Add touch event listeners
        let touchStartTime = 0;
        
        imageContainer.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            // Show indicator and add visual feedback
            tapIndicator.style.opacity = '1';
            tapIndicator.style.transform = 'scale(0.9)';
            tapIndicator.style.background = 'rgba(0, 120, 212, 0.9)';
            isVisible = true;
        });

        imageContainer.addEventListener('touchend', (e) => {
            const touchDuration = Date.now() - touchStartTime;
            
            // Reset visual feedback
            setTimeout(() => {
                tapIndicator.style.background = 'rgba(0, 0, 0, 0.8)';
                tapIndicator.style.transform = 'scale(1)';
                // Hide indicator after touch
                setTimeout(() => {
                    tapIndicator.style.opacity = '0';
                    tapIndicator.style.transform = 'scale(0.5)';
                    isVisible = false;
                }, 500);
            }, 150);
            
            // Only trigger if it was a quick tap (not a long press or scroll)
            if (touchDuration < 500) {
                e.preventDefault();
                e.stopPropagation();
                this.lastHoverTime = Date.now(); // Set for safety check
                this.openElmntVideoModal(member);
            }
        });

        // Handle touch move (scrolling)
        imageContainer.addEventListener('touchmove', (e) => {
            // Reset visual feedback if user starts scrolling
            tapIndicator.style.background = 'rgba(0, 0, 0, 0.8)';
            tapIndicator.style.transform = 'scale(1)';
        });

        // Clean up interval when modal is closed
        const originalCloseModal = this.closeModal.bind(this);
        this.closeModal = () => {
            if (animationInterval) {
                clearInterval(animationInterval);
            }
            originalCloseModal();
        };
    }

    // Setup desktop hover functionality (existing behavior)
    setupDesktopElmntHover(imageContainer, member) {
        // Create hover overlay container
        const hoverOverlay = document.createElement('div');
        hoverOverlay.className = 'elmnt-hover-overlay';
        hoverOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: none;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            cursor: pointer;
            transition: opacity 0.3s ease;
            z-index: 10;
            opacity: 0;
        `;

        // Create play button
        const playButton = document.createElement('div');
        playButton.className = 'elmnt-play-button';
        playButton.innerHTML = '▶';
        playButton.style.cssText = `
            font-size: 48px;
            color: white;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        `;

        // Create text
        const hoverText = document.createElement('div');
        hoverText.className = 'elmnt-hover-text';
        hoverText.textContent = 'Watch Them In Their ELMNT';
        hoverText.style.cssText = `
            color: white;
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
            letter-spacing: 1px;
        `;

        hoverOverlay.appendChild(playButton);
        hoverOverlay.appendChild(hoverText);

        // Add a small delay before attaching the overlay to prevent immediate triggers
        setTimeout(() => {
            imageContainer.appendChild(hoverOverlay);
            
            let hoverTimeout;
            let isHovering = false;
            
            // Add hover event listeners with delay to prevent accidental triggers
            imageContainer.addEventListener('mouseenter', (e) => {
                // Only show overlay if mouse is actually over the image container
                if (e.target === imageContainer || imageContainer.contains(e.target)) {
                    isHovering = true;
                    // Track hover time for safety check
                    this.lastHoverTime = Date.now();
                    
                    // Add a small delay to prevent accidental hovers
                    hoverTimeout = setTimeout(() => {
                        if (isHovering) {
                            hoverOverlay.style.display = 'flex';
                            // Fade in animation
                            setTimeout(() => {
                                if (isHovering) {
                                    hoverOverlay.style.opacity = '1';
                                }
                            }, 10);
                        }
                    }, 200); // 200ms delay before showing overlay
                }
            });

            imageContainer.addEventListener('mouseleave', (e) => {
                isHovering = false;
                clearTimeout(hoverTimeout);
                
                // Fade out animation
                hoverOverlay.style.opacity = '0';
                setTimeout(() => {
                    if (!isHovering) {
                        hoverOverlay.style.display = 'none';
                    }
                }, 300);
            });

            // Add click event listener to open video modal - ONLY when overlay is visible
            hoverOverlay.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent opening member modal
                e.stopImmediatePropagation(); // Prevent any other event handlers
                
                // Only open video modal if overlay is actually visible
                if (hoverOverlay.style.display === 'flex' && hoverOverlay.style.opacity === '1') {
                    this.openElmntVideoModal(member);
                }
            });
            
            // Prevent any accidental clicks on the image itself from triggering video modal
            imageElement.addEventListener('click', (e) => {
                // If the overlay is not visible, don't interfere with normal modal opening
                if (hoverOverlay.style.display !== 'flex' || hoverOverlay.style.opacity !== '1') {
                    // Let the normal member modal open
                    return;
                }
            });
            
        }, 100); // Small delay before setting up hover functionality
    }

    // Open ELMNT video modal
    openElmntVideoModal(member) {
        if (!member.elmntVideoUrl) {
            console.warn('No ELMNT video URL found for member:', member.name);
            return;
        }

        console.log('Opening ELMNT video modal for:', member.name);

        // Additional safety check - ensure this is being called intentionally
        const currentTime = Date.now();
        if (!this.lastHoverTime || (currentTime - this.lastHoverTime) > 5000) {
            console.warn('ELMNT video modal blocked - no recent hover interaction detected');
            return;
        }

        // Create video modal if it doesn't exist
        let videoModal = document.getElementById('elmnt-video-modal');
        if (!videoModal) {
            videoModal = this.createElmntVideoModal();
        }

        // Update modal content
        const modalTitle = videoModal.querySelector('.elmnt-modal-title');
        const modalVideo = videoModal.querySelector('.elmnt-modal-video');

        if (modalTitle) {
            modalTitle.textContent = `${member.name} - In Their ELMNT`;
        }

        if (modalVideo) {
            modalVideo.src = member.elmntVideoUrl;
            modalVideo.load(); // Reload the video element
        }

        // Show modal
        videoModal.style.display = 'flex';
        document.body.classList.add('modal-open');

        // Auto-play video if possible
        if (modalVideo) {
            modalVideo.play().catch(error => {
                console.log('Auto-play prevented:', error);
                // Auto-play was prevented, user will need to click play
            });
        }
    }

    // Create ELMNT video modal
    createElmntVideoModal() {
        const modal = document.createElement('div');
        modal.id = 'elmnt-video-modal';
        modal.className = 'elmnt-video-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            padding: 20px;
            box-sizing: border-box;
        `;

        const modalContent = document.createElement('div');
        modalContent.className = 'elmnt-modal-content';
        modalContent.style.cssText = `
            background: #000;
            border-radius: 8px;
            padding: 20px;
            max-width: 90vw;
            max-height: 90vh;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
        `;

        const closeButton = document.createElement('button');
        closeButton.className = 'elmnt-modal-close';
        closeButton.innerHTML = '×';
        closeButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 15px;
            background: none;
            border: none;
            color: white;
            font-size: 30px;
            cursor: pointer;
            z-index: 1001;
            padding: 0;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const title = document.createElement('h3');
        title.className = 'elmnt-modal-title';
        title.style.cssText = `
            color: white;
            margin: 0 0 20px 0;
            text-align: center;
            font-size: 24px;
        `;

        const video = document.createElement('video');
        video.className = 'elmnt-modal-video';
        video.controls = true;
        video.style.cssText = `
            max-width: 100%;
            max-height: 70vh;
            border-radius: 4px;
        `;

        modalContent.appendChild(closeButton);
        modalContent.appendChild(title);
        modalContent.appendChild(video);
        modal.appendChild(modalContent);

        // Add event listeners
        closeButton.addEventListener('click', () => this.closeElmntVideoModal());
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeElmntVideoModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                this.closeElmntVideoModal();
            }
        });

        // Append to body
        document.body.appendChild(modal);
        return modal;
    }

    // Close ELMNT video modal
    closeElmntVideoModal() {
        const videoModal = document.getElementById('elmnt-video-modal');
        if (!videoModal) return;

        const video = videoModal.querySelector('.elmnt-modal-video');
        if (video) {
            video.pause();
            video.currentTime = 0;
        }

        videoModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }

    // Public method to retry loading (called from retry button)
    retry() {
        this.loadMembers();
    }
}

// Initialize the collage manager
const collageManager = new CollageManager();

// Make collageManager globally accessible for 3D module
window.collageManager = collageManager;

// Export for potential use in other scripts or debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CollageManager;
}
