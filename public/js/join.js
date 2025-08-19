// Join Form JavaScript - JAMTEM Community
class JoinFormManager {
    constructor() {
        this.form = document.getElementById('join-form');
        this.submitBtn = document.getElementById('submit-btn');
        this.successMessage = document.getElementById('success-message');
        this.errorMessage = document.getElementById('error-message');
        this.imageInput = document.getElementById('image');
        this.imagePreview = document.getElementById('image-preview');
        this.previewImage = document.getElementById('preview-image');
        this.removeImageBtn = document.getElementById('remove-image');
        this.fileUploadArea = document.getElementById('file-upload-area');
        this.bioTextarea = document.getElementById('bio');
        this.bioCounter = document.getElementById('bio-counter');
        
        this.isSubmitting = false;
        this.selectedFile = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFormValidation();
        this.setupFileUpload();
        this.setupCharacterCounter();
    }

    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Image removal
        this.removeImageBtn.addEventListener('click', () => this.removeImage());
        
        // Real-time validation
        const inputs = this.form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });

        // Instagram field formatting
        const instagramInput = document.getElementById('instagram');
        instagramInput.addEventListener('input', (e) => this.formatInstagramHandle(e));
    }

    setupFormValidation() {
        // Custom validation messages
        const emailInput = document.getElementById('email');
        emailInput.addEventListener('invalid', (e) => {
            e.target.setCustomValidity('Please enter a valid email address');
        });
        emailInput.addEventListener('input', (e) => {
            e.target.setCustomValidity('');
        });

        const websiteInput = document.getElementById('website');
        websiteInput.addEventListener('invalid', (e) => {
            e.target.setCustomValidity('Please enter a valid URL (e.g., https://example.com)');
        });
        websiteInput.addEventListener('input', (e) => {
            e.target.setCustomValidity('');
        });
    }

    setupFileUpload() {
        // File input change
        this.imageInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop
        this.fileUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.fileUploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.fileUploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Click to upload
        this.fileUploadArea.addEventListener('click', () => this.imageInput.click());
    }

    setupCharacterCounter() {
        this.bioTextarea.addEventListener('input', () => this.updateCharacterCounter());
        this.updateCharacterCounter(); // Initial count
    }

    handleSubmit(e) {
        e.preventDefault();
        
        if (this.isSubmitting) return;
        
        // Validate form
        if (!this.validateForm()) {
            return;
        }
        
        this.submitForm();
    }

    async submitForm() {
        this.isSubmitting = true;
        this.setLoadingState(true);
        
        try {
            const formData = new FormData();
            
            // Add form fields
            formData.append('name', document.getElementById('name').value.trim());
            formData.append('email', document.getElementById('email').value.trim());
            formData.append('craft', document.getElementById('craft').value.trim());
            formData.append('location', document.getElementById('location').value.trim());
            formData.append('bio', document.getElementById('bio').value.trim());
            formData.append('website', document.getElementById('website').value.trim());
            formData.append('instagram', document.getElementById('instagram').value.trim());
            
            // Add image file
            if (this.selectedFile) {
                formData.append('image', this.selectedFile);
            }
            
            const response = await fetch('/api/join', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showSuccess();
            } else {
                throw new Error(result.error || 'Submission failed');
            }
            
        } catch (error) {
            console.error('Submission error:', error);
            this.showError(error.message);
        } finally {
            this.isSubmitting = false;
            this.setLoadingState(false);
        }
    }

    validateForm() {
        let isValid = true;
        
        // Required fields
        const requiredFields = ['name', 'email', 'craft', 'bio'];
        requiredFields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        // Image validation
        if (!this.selectedFile) {
            this.setFieldError('image', 'Please upload a showcase image');
            isValid = false;
        }
        
        // Email validation
        const email = document.getElementById('email').value.trim();
        if (email && !this.isValidEmail(email)) {
            this.setFieldError('email', 'Please enter a valid email address');
            isValid = false;
        }
        
        // Website validation
        const website = document.getElementById('website').value.trim();
        if (website && !this.isValidUrl(website)) {
            this.setFieldError('website', 'Please enter a valid URL (e.g., https://example.com)');
            isValid = false;
        }
        
        // Bio length validation - removed minimum character requirement
        // const bio = document.getElementById('bio').value.trim();
        // if (bio.length < 50) {
        //     this.setFieldError('bio', 'Bio must be at least 50 characters long');
        //     isValid = false;
        // }
        
        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        
        // Clear previous error
        this.clearFieldError(field);
        
        // Required field validation
        if (field.required && !value) {
            this.setFieldError(fieldName, 'This field is required');
            return false;
        }
        
        // Specific field validations
        switch (fieldName) {
            case 'email':
                if (value && !this.isValidEmail(value)) {
                    this.setFieldError(fieldName, 'Please enter a valid email address');
                    return false;
                }
                break;
                
            case 'website':
                if (value && !this.isValidUrl(value)) {
                    this.setFieldError(fieldName, 'Please enter a valid URL');
                    return false;
                }
                break;
                
            case 'bio':
                // Removed minimum character requirement for bio field
                break;
        }
        
        // Mark field as valid
        this.setFieldSuccess(field);
        return true;
    }

    setFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        const fieldGroup = document.querySelector(`#${fieldName}`).closest('.form-group');
        
        if (errorElement) {
            errorElement.textContent = message;
        }
        
        if (fieldGroup) {
            fieldGroup.classList.add('error');
            fieldGroup.classList.remove('success');
        }
    }

    clearFieldError(field) {
        const fieldName = field.name;
        const errorElement = document.getElementById(`${fieldName}-error`);
        const fieldGroup = field.closest('.form-group');
        
        if (errorElement) {
            errorElement.textContent = '';
        }
        
        if (fieldGroup) {
            fieldGroup.classList.remove('error');
        }
    }

    setFieldSuccess(field) {
        const fieldGroup = field.closest('.form-group');
        if (fieldGroup && field.value.trim()) {
            fieldGroup.classList.add('success');
            fieldGroup.classList.remove('error');
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        this.processFile(file);
    }

    handleDragOver(e) {
        e.preventDefault();
        this.fileUploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.fileUploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.fileUploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    processFile(file) {
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.setFieldError('image', 'Please select an image file');
            return;
        }
        
        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            this.setFieldError('image', 'Image must be smaller than 10MB');
            return;
        }
        
        this.selectedFile = file;
        this.showImagePreview(file);
        this.clearFieldError(this.imageInput);
    }

    showImagePreview(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            this.previewImage.src = e.target.result;
            this.imagePreview.style.display = 'block';
            this.fileUploadArea.style.display = 'none';
        };
        
        reader.readAsDataURL(file);
    }

    removeImage() {
        this.selectedFile = null;
        this.imageInput.value = '';
        this.imagePreview.style.display = 'none';
        this.fileUploadArea.style.display = 'block';
        this.previewImage.src = '';
    }

    updateCharacterCounter() {
        const current = this.bioTextarea.value.length;
        const max = 500;
        
        this.bioCounter.textContent = `${current}/${max}`;
        
        // Update counter color based on usage
        this.bioCounter.classList.remove('warning', 'danger');
        if (current > max * 0.8) {
            this.bioCounter.classList.add('warning');
        }
        if (current > max * 0.95) {
            this.bioCounter.classList.add('danger');
        }
    }

    formatInstagramHandle(e) {
        let value = e.target.value;
        
        // Remove @ if user types it
        if (value.startsWith('@')) {
            value = value.substring(1);
        }
        
        // Remove spaces and special characters except underscore and period
        value = value.replace(/[^a-zA-Z0-9_.]/g, '');
        
        e.target.value = value;
    }

    setLoadingState(loading) {
        const btnText = this.submitBtn.querySelector('.btn-text');
        const btnLoading = this.submitBtn.querySelector('.btn-loading');
        
        if (loading) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'flex';
            this.submitBtn.disabled = true;
            this.form.classList.add('loading');
        } else {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            this.submitBtn.disabled = false;
            this.form.classList.remove('loading');
        }
    }

    showSuccess() {
        this.form.style.display = 'none';
        this.successMessage.style.display = 'block';
        this.errorMessage.style.display = 'none';
        
        // Scroll to success message
        this.successMessage.scrollIntoView({ behavior: 'smooth' });
    }

    showError(message) {
        const errorDetails = document.getElementById('error-details');
        errorDetails.textContent = message;
        
        this.errorMessage.style.display = 'block';
        this.successMessage.style.display = 'none';
        
        // Scroll to error message
        this.errorMessage.scrollIntoView({ behavior: 'smooth' });
    }

    // Utility functions
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // Public methods for global access
    reset() {
        this.form.reset();
        this.removeImage();
        this.updateCharacterCounter();
        this.form.style.display = 'block';
        this.successMessage.style.display = 'none';
        this.errorMessage.style.display = 'none';
        
        // Clear all field states
        const fieldGroups = this.form.querySelectorAll('.form-group');
        fieldGroups.forEach(group => {
            group.classList.remove('success', 'error');
        });
        
        // Clear all error messages
        const errorElements = this.form.querySelectorAll('.form-error');
        errorElements.forEach(element => {
            element.textContent = '';
        });
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }
}

// Global functions for HTML onclick handlers
function resetForm() {
    if (window.joinFormManager) {
        window.joinFormManager.reset();
    }
}

function hideError() {
    if (window.joinFormManager) {
        window.joinFormManager.hideError();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.joinFormManager = new JoinFormManager();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Reset any temporary states when user returns to page
        if (window.joinFormManager && !window.joinFormManager.isSubmitting) {
            // Could add logic here to refresh or validate state
        }
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    console.log('Connection restored');
    // Could add logic to retry failed submissions
});

window.addEventListener('offline', () => {
    console.log('Connection lost');
    if (window.joinFormManager) {
        window.joinFormManager.showError('No internet connection. Please check your connection and try again.');
    }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JoinFormManager;
}
