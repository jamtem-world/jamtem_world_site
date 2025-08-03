// Collage Manager - Handles dynamic grid and member data
class CollageManager {
    constructor() {
        this.members = [];
        this.currentMember = null;
        this.gridContainer = null;
        this.modal = null;
        this.isLoading = false;
        
        this.init();
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
        this.modal = document.getElementById('member-modal');
        
        if (!this.gridContainer) {
            console.error('Collage grid container not found');
            return;
        }

        this.setupModalEvents();
        this.loadMembers();
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

        // Clear existing grid classes
        this.gridContainer.className = 'collage-grid';
        
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
        gridItem.setAttribute('aria-label', `View ${member.name}'s profile`);

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

        // Set image
        if (member.imageUrl && modalImage) {
            modalImage.src = member.imageUrl;
            modalImage.alt = `${member.name} - ${member.craft}`;
            modalImage.style.display = 'block';
            if (modalImagePlaceholder) {
                modalImagePlaceholder.style.display = 'none';
            }
        } else {
            if (modalImage) modalImage.style.display = 'none';
            if (modalImagePlaceholder) modalImagePlaceholder.style.display = 'flex';
        }

        // Set text content
        if (modalName) modalName.textContent = member.name || 'Unknown';
        if (modalCraft) modalCraft.textContent = member.craft || 'Creator';
        if (modalBio) modalBio.textContent = member.bio || 'No bio available';

        // Handle Instagram
        if (member.instagram && member.instagram.trim() && modalInstagram && modalInstagramSection) {
            modalInstagram.textContent = member.instagram;
            modalInstagramSection.style.display = 'block';
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

        this.modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        this.currentMember = null;

        // Return focus to the grid item that was clicked
        if (this.currentMember) {
            const gridItem = document.querySelector(`[data-member-id="${this.currentMember.id}"]`);
            if (gridItem) {
                gridItem.focus();
            }
        }
    }

    showLoading() {
        this.hideAllStates();
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'block';
    }

    showError() {
        this.hideAllStates();
        const error = document.getElementById('error');
        if (error) error.style.display = 'block';
    }

    showGrid() {
        this.hideAllStates();
        const container = document.getElementById('collage-container');
        if (container) container.style.display = 'block';
    }

    showNoMembers() {
        this.hideAllStates();
        const noMembers = document.getElementById('no-members');
        if (noMembers) noMembers.style.display = 'block';
    }

    hideAllStates() {
        const states = ['loading', 'error', 'collage-container', 'no-members'];
        states.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
    }

    // Public method to retry loading (called from retry button)
    retry() {
        this.loadMembers();
    }
}

// Initialize the collage manager
const collageManager = new CollageManager();

// Export for potential use in other scripts or debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CollageManager;
}
