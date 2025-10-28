// User Modals - JavaScript Functionality

/* ========================================
   CHANGE PASSWORD MODAL
   ======================================== */

let currentImageData = null;
let currentImageZoom = 100;

// Open Change Password Modal
function openChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Reset form
        document.getElementById('changePasswordForm').reset();
        clearPasswordErrors();
        
        // Close dropdown if open
        const dropdown = document.getElementById('userDropdownMenu');
        if (dropdown) dropdown.classList.remove('active');
    }
}

// Close Change Password Modal
function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('changePasswordForm').reset();
        clearPasswordErrors();
    }
}

// Clear password errors
function clearPasswordErrors() {
    document.getElementById('currentPasswordError').textContent = '';
    document.getElementById('confirmPasswordError').textContent = '';
    document.getElementById('passwordStrength').innerHTML = '';
}

// Toggle password visibility
function togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    const btn = field.nextElementSibling;
    
    if (field.type === 'password') {
        field.type = 'text';
        btn.querySelector('svg').innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        `;
    } else {
        field.type = 'password';
        btn.querySelector('svg').innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        `;
    }
}

// Check password strength
document.addEventListener('DOMContentLoaded', function() {
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            const password = this.value;
            const strengthDiv = document.getElementById('passwordStrength');
            
            if (password.length === 0) {
                strengthDiv.innerHTML = '';
                return;
            }
            
            let strength = 0;
            if (password.length >= 8) strength++;
            if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
            if (password.match(/[0-9]/)) strength++;
            if (password.match(/[^a-zA-Z0-9]/)) strength++;
            
            let className = '';
            let label = '';
            
            if (strength <= 1) {
                className = 'strength-weak';
                label = 'Weak';
            } else if (strength <= 2) {
                className = 'strength-medium';
                label = 'Medium';
            } else {
                className = 'strength-strong';
                label = 'Strong';
            }
            
            strengthDiv.innerHTML = `<div class="password-strength-bar ${className}"></div>`;
        });
    }
});

// Submit password change
function submitPasswordChange(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Clear previous errors
    clearPasswordErrors();
    
    // Validate
    if (newPassword.length < 8) {
        document.getElementById('confirmPasswordError').textContent = 'Password must be at least 8 characters';
        return;
    }
    
    if (newPassword !== confirmPassword) {
        document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
        return;
    }
    
    try {
        // Get current user
        let currentUserData = localStorage.getItem('currentUser') || localStorage.getItem('tempUserData');
        let currentUser = JSON.parse(currentUserData);
        
        // Verify current password
        if (currentUser.password !== currentPassword) {
            document.getElementById('currentPasswordError').textContent = 'Current password is incorrect';
            return;
        }
        
        // Update password
        currentUser.password = newPassword;
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update in users array
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        if (userIndex !== -1) {
            users[userIndex].password = newPassword;
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        // Close modal
        closeChangePasswordModal();
        
        // Show success toast
        showToast('Password updated successfully!', 'success');
        
    } catch (error) {
        console.error('Error changing password:', error);
        showToast('Error updating password. Please try again.', 'error');
    }
}

/* ========================================
   CHANGE PROFILE IMAGE MODAL
   ======================================== */

// Open Change Image Modal
function openChangeImageModal() {
    const modal = document.getElementById('changeImageModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Reset
        currentImageData = null;
        currentImageZoom = 100;
        document.getElementById('imagePreviewSection').style.display = 'none';
        document.getElementById('uploadArea').style.display = 'block';
        document.getElementById('saveImageBtn').disabled = true;
        
        // Close dropdown if open
        const dropdown = document.getElementById('userDropdownMenu');
        if (dropdown) dropdown.classList.remove('active');
    }
}

// Close Change Image Modal
function closeChangeImageModal() {
    const modal = document.getElementById('changeImageModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Handle image upload
function handleImageUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image must be less than 5MB', 'error');
        return;
    }
    
    // Read file
    const reader = new FileReader();
    reader.onload = function(e) {
        currentImageData = e.target.result;
        
        // Show preview
        document.getElementById('imagePreview').src = currentImageData;
        document.getElementById('uploadArea').style.display = 'none';
        document.getElementById('imagePreviewSection').style.display = 'block';
        document.getElementById('saveImageBtn').disabled = false;
        
        // Reset zoom
        document.getElementById('imageZoom').value = 100;
        adjustImageZoom(100);
    };
    reader.readAsDataURL(file);
}

// Adjust image zoom
function adjustImageZoom(value) {
    currentImageZoom = value;
    const img = document.getElementById('imagePreview');
    img.style.transform = `scale(${value / 100})`;
}

// Save profile image
function saveProfileImage() {
    if (!currentImageData) return;
    
    try {
        // Get current user
        let currentUserData = localStorage.getItem('currentUser') || localStorage.getItem('tempUserData');
        let currentUser = JSON.parse(currentUserData);
        
        // Save image
        currentUser.profileImage = currentImageData;
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update in users array
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        if (userIndex !== -1) {
            users[userIndex].profileImage = currentImageData;
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        // Update all avatars on page
        updateAllAvatars(currentImageData);
        
        // Close modal
        closeChangeImageModal();
        
        // Show success toast
        showToast('Profile image updated successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving profile image:', error);
        showToast('Error saving image. Please try again.', 'error');
    }
}

// Update all avatar elements
function updateAllAvatars(imageData) {
    // Update header avatar
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) {
        userAvatar.style.backgroundImage = `url(${imageData})`;
        userAvatar.style.backgroundSize = 'cover';
        userAvatar.querySelector('span').style.display = 'none';
    }
    
    // Update dropdown avatar
    const dropdownAvatar = document.getElementById('dropdownAvatar');
    if (dropdownAvatar) {
        dropdownAvatar.style.backgroundImage = `url(${imageData})`;
        dropdownAvatar.style.backgroundSize = 'cover';
        dropdownAvatar.querySelector('span').style.display = 'none';
    }
    
    // Update profile page avatar
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileAvatar) {
        profileAvatar.style.backgroundImage = `url(${imageData})`;
        profileAvatar.style.backgroundSize = 'cover';
        profileAvatar.querySelector('span').style.display = 'none';
    }
}

/* ========================================
   DEACTIVATE ACCOUNT MODAL
   ======================================== */

// Open Deactivate Modal
function openDeactivateModal() {
    const modal = document.getElementById('deactivateAccountModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Reset form
        document.getElementById('deactivateForm').reset();
        document.getElementById('deactivateBtn').disabled = true;
        document.getElementById('deactivateError').textContent = '';
        
        // Close dropdown if open
        const dropdown = document.getElementById('userDropdownMenu');
        if (dropdown) dropdown.classList.remove('active');
    }
}

// Close Deactivate Modal
function closeDeactivateModal() {
    const modal = document.getElementById('deactivateAccountModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('deactivateForm').reset();
    }
}

// Validate deactivation input
function validateDeactivation() {
    const input = document.getElementById('deactivateConfirm').value;
    const btn = document.getElementById('deactivateBtn');
    const error = document.getElementById('deactivateError');
    
    if (input === 'DELETE') {
        btn.disabled = false;
        error.textContent = '';
    } else {
        btn.disabled = true;
        if (input.length > 0) {
            error.textContent = 'Must type DELETE exactly';
        } else {
            error.textContent = '';
        }
    }
}

// Submit deactivation
function submitDeactivation(event) {
    event.preventDefault();
    
    const confirm = document.getElementById('deactivateConfirm').value;
    const reason = document.getElementById('deactivateReason').value;
    
    if (confirm !== 'DELETE') {
        document.getElementById('deactivateError').textContent = 'Must type DELETE to confirm';
        return;
    }
    
    try {
        // Get current user
        let currentUserData = localStorage.getItem('currentUser') || localStorage.getItem('tempUserData');
        let currentUser = JSON.parse(currentUserData);
        
        // Log deactivation (in real app, would send to server)
        console.log('Account deactivated:', {
            email: currentUser.email,
            reason: reason,
            timestamp: new Date().toISOString()
        });
        
        // Remove user from users array
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = users.filter(u => u.email !== currentUser.email);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        // Remove user bookings
        const bookings = JSON.parse(localStorage.getItem('bignor_park_bookings') || '[]');
        const updatedBookings = bookings.filter(b => b.userId !== currentUser.email);
        localStorage.setItem('bignor_park_bookings', JSON.stringify(updatedBookings));
        
        // Clear user session
        localStorage.removeItem('currentUser');
        localStorage.removeItem('tempUserData');
        localStorage.removeItem(`lastBookingTime_${currentUser.email}`);
        
        // Close modal
        closeDeactivateModal();
        
        // Show final message
        alert('Your account has been deactivated.\n\nAll your data has been removed.\n\nThank you for being part of Bignor Park Carp Fishery.\n\nYou will now be redirected to the home page.');
        
        // Redirect to home
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Error deactivating account:', error);
        showToast('Error deactivating account. Please try again.', 'error');
    }
}

/* ========================================
   TOAST NOTIFICATIONS
   ======================================== */

function showToast(message, type = 'success') {
    const toastId = type === 'success' ? 'successToast' : 'errorToast';
    const messageId = type === 'success' ? 'toastMessage' : 'errorToastMessage';
    
    const toast = document.getElementById(toastId);
    const messageEl = document.getElementById(messageId);
    
    if (toast && messageEl) {
        messageEl.textContent = message;
        toast.style.display = 'flex';
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
}

/* ========================================
   DRAG AND DROP FOR IMAGE UPLOAD
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    
    if (uploadArea) {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });
        
        // Highlight drop area when dragging over
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, unhighlight, false);
        });
        
        // Handle dropped files
        uploadArea.addEventListener('drop', handleDrop, false);
    }
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e) {
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.style.borderColor = '#48d1cc';
    uploadArea.style.background = '#f0fffe';
}

function unhighlight(e) {
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.style.borderColor = '#d0d0d0';
    uploadArea.style.background = '#f8f9fa';
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        const input = document.getElementById('imageUpload');
        input.files = files;
        handleImageUpload({ target: input });
    }
}

/* ========================================
   CLOSE MODALS ON ESC KEY
   ======================================== */

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeChangePasswordModal();
        closeChangeImageModal();
        closeDeactivateModal();
    }
});

/* ========================================
   CLOSE MODALS ON OUTSIDE CLICK
   ======================================== */

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        closeChangePasswordModal();
        closeChangeImageModal();
        closeDeactivateModal();
    }
});

console.log('[UserModals] Module loaded successfully');






