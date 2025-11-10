// User Dropdown Menu - JavaScript Functionality

(function() {
    'use strict';
    
    // Wait for DOM to load
    document.addEventListener('DOMContentLoaded', function() {
        initializeUserDropdown();
        loadUserInfo();
        // Booking status display removed - bookings only appear in Active Booking tab
        // updateBookingStatus();
        
        // Update booking status every minute
        // setInterval(updateBookingStatus, 60000);
    });
    
    // Initialize dropdown functionality
    function initializeUserDropdown() {
        const menuButton = document.getElementById('userMenuButton');
        const dropdownMenu = document.getElementById('userDropdownMenu');
        
        if (!menuButton || !dropdownMenu) {
            console.warn('[UserDropdown] Menu elements not found');
            return;
        }
        
        // Toggle dropdown on button click
        menuButton.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleDropdown();
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!menuButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
                closeDropdown();
            }
        });
        
        // Keyboard navigation
        menuButton.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleDropdown();
            } else if (e.key === 'Escape') {
                closeDropdown();
                menuButton.focus();
            }
        });
        
        // Handle dropdown item keyboard navigation
        const dropdownItems = dropdownMenu.querySelectorAll('.dropdown-item');
        dropdownItems.forEach((item, index) => {
            item.addEventListener('keydown', function(e) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextItem = dropdownItems[index + 1];
                    if (nextItem) nextItem.focus();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevItem = dropdownItems[index - 1];
                    if (prevItem) {
                        prevItem.focus();
                    } else {
                        menuButton.focus();
                    }
                } else if (e.key === 'Escape') {
                    closeDropdown();
                    menuButton.focus();
                }
            });
        });
        
        console.log('[UserDropdown] Initialized successfully');
    }
    
    // Toggle dropdown
    function toggleDropdown() {
        const menuButton = document.getElementById('userMenuButton');
        const dropdownMenu = document.getElementById('userDropdownMenu');
        
        const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
        
        if (isExpanded) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }
    
    // Open dropdown
    function openDropdown() {
        const menuButton = document.getElementById('userMenuButton');
        const dropdownMenu = document.getElementById('userDropdownMenu');
        
        menuButton.setAttribute('aria-expanded', 'true');
        dropdownMenu.setAttribute('aria-hidden', 'false');
        dropdownMenu.classList.add('active');
        
        // Focus first item
        setTimeout(() => {
            const firstItem = dropdownMenu.querySelector('.dropdown-item');
            if (firstItem) firstItem.focus();
        }, 100);
    }
    
    // Close dropdown
    function closeDropdown() {
        const menuButton = document.getElementById('userMenuButton');
        const dropdownMenu = document.getElementById('userDropdownMenu');
        
        if (menuButton && dropdownMenu) {
            menuButton.setAttribute('aria-expanded', 'false');
            dropdownMenu.setAttribute('aria-hidden', 'true');
            dropdownMenu.classList.remove('active');
        }
    }
    
    // Load user info from localStorage
    function loadUserInfo() {
        try {
            let currentUserData = localStorage.getItem('currentUser') || localStorage.getItem('tempUserData');
            
            if (!currentUserData) {
                console.warn('[UserDropdown] No user data found');
                return;
            }
            
            let currentUser;
            try {
                currentUser = JSON.parse(currentUserData);
            } catch (e) {
                // Old format - email string
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                currentUser = users.find(u => u.email === currentUserData);
            }
            
            if (!currentUser) {
                console.warn('[UserDropdown] Could not parse user data');
                return;
            }
            
            // Get initials
            const fullName = currentUser.fullName || currentUser.email || 'Member';
            const initials = getInitials(fullName);
            
            // Update all user elements
            const userName = document.getElementById('userName');
            const userInitials = document.getElementById('userInitials');
            const dropdownInitials = document.getElementById('dropdownInitials');
            const dropdownUserName = document.getElementById('dropdownUserName');
            const dropdownUserEmail = document.getElementById('dropdownUserEmail');
            
            if (userName) userName.textContent = fullName;
            if (userInitials) userInitials.textContent = initials;
            if (dropdownInitials) dropdownInitials.textContent = initials;
            if (dropdownUserName) dropdownUserName.textContent = fullName;
            if (dropdownUserEmail) dropdownUserEmail.textContent = currentUser.email;
            
            // Load and apply profile image if it exists
            if (currentUser.profileImage) {
                applyProfileImage(currentUser.profileImage);
            }
            
            console.log('[UserDropdown] User info loaded:', fullName);
            
        } catch (error) {
            console.error('[UserDropdown] Error loading user info:', error);
        }
    }
    
    // Get initials from name
    function getInitials(name) {
        if (!name) return 'M';
        
        // If it's an email, use first letter
        if (name.includes('@')) {
            return name.charAt(0).toUpperCase();
        }
        
        // Get first letters of first and last name
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        }
        
        // Single name - use first two letters
        return name.substring(0, 2).toUpperCase();
    }
    
    // Apply profile image to all avatar elements
    function applyProfileImage(imageData) {
        if (!imageData) return;
        
        // Update header avatar
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            userAvatar.style.backgroundImage = `url(${imageData})`;
            userAvatar.style.backgroundSize = 'cover';
            userAvatar.style.backgroundPosition = 'center';
            const initialsSpan = userAvatar.querySelector('span');
            if (initialsSpan) {
                initialsSpan.style.display = 'none';
            }
        }
        
        // Update dropdown avatar
        const dropdownAvatar = document.getElementById('dropdownAvatar');
        if (dropdownAvatar) {
            dropdownAvatar.style.backgroundImage = `url(${imageData})`;
            dropdownAvatar.style.backgroundSize = 'cover';
            dropdownAvatar.style.backgroundPosition = 'center';
            const dropdownInitialsSpan = dropdownAvatar.querySelector('span');
            if (dropdownInitialsSpan) {
                dropdownInitialsSpan.style.display = 'none';
            }
        }
        
        // Update profile page avatar (large avatar on profile.html)
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar) {
            profileAvatar.style.backgroundImage = `url(${imageData})`;
            profileAvatar.style.backgroundSize = 'cover';
            profileAvatar.style.backgroundPosition = 'center';
            const profileInitialsSpan = profileAvatar.querySelector('span');
            if (profileInitialsSpan) {
                profileInitialsSpan.style.display = 'none';
            }
        }
        
        console.log('[UserDropdown] Profile image applied to all avatars');
    }
    
    // Update booking status in dropdown
    function updateBookingStatus() {
        const statusContainer = document.getElementById('dropdownBookingStatus');
        const statusDetails = document.getElementById('bookingStatusDetails');
        
        if (!statusContainer || !statusDetails) {
            return;
        }
        
        try {
            // Get current user
            const currentUserData = localStorage.getItem('currentUser');
            if (!currentUserData) {
                statusContainer.style.display = 'none';
                return;
            }
            
            const currentUser = JSON.parse(currentUserData);
            if (!currentUser || !currentUser.email) {
                statusContainer.style.display = 'none';
                return;
            }
            
            // Check for active booking
            let booking = null;
            
            // Try UTC system first
            if (window.ActiveBookingSystem && window.ActiveBookingSystem.getActiveBooking) {
                booking = window.ActiveBookingSystem.getActiveBooking(currentUser.email);
                
                // Clear if expired
                if (booking && window.ActiveBookingSystem.clearIfExpired) {
                    window.ActiveBookingSystem.clearIfExpired(currentUser.email);
                    booking = window.ActiveBookingSystem.getActiveBooking(currentUser.email);
                }
            }
            
            // Try simple system if no booking found
            if (!booking) {
                const raw = localStorage.getItem('activeBooking');
                if (raw) {
                    try {
                        booking = JSON.parse(raw);
                        // Check if expired
                        const created = new Date(booking.createdAt);
                        const now = new Date();
                        const twentyFourHoursLater = new Date(created.getTime() + 24 * 60 * 60 * 1000);
                        if (now > twentyFourHoursLater) {
                            booking = null;
                        }
                    } catch (e) {
                        booking = null;
                    }
                }
            }
            
            // Update UI based on booking status with full booking card
            if (booking) {
                // Format the booking details
                const lakeName = booking.lakeName || booking.lake || 'Unknown Lake';
                let dateText = '';
                let timeText = '';
                let statusEmoji = '🎣';
                let statusText = 'Active';
                
                if (booking.startUtc) {
                    // UTC format
                    const startDate = new Date(booking.startUtc);
                    const endDate = new Date(booking.endUtc);
                    const now = Date.now();
                    
                    dateText = startDate.toLocaleDateString('en-GB', { 
                        weekday: 'short',
                        day: 'numeric', 
                        month: 'short',
                        year: 'numeric',
                        timeZone: 'UTC'
                    });
                    timeText = startDate.toLocaleTimeString('en-GB', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        timeZone: 'UTC'
                    });
                    
                    // Determine status
                    if (now < booking.startUtc) {
                        statusEmoji = '📅';
                        statusText = 'Upcoming';
                    } else if (now >= booking.startUtc && now < booking.endUtc) {
                        statusEmoji = '🎣';
                        statusText = 'Active Now';
                    } else {
                        statusEmoji = '✅';
                        statusText = 'Completed';
                    }
                } else if (booking.date) {
                    // Simple format
                    const date = new Date(booking.date);
                    dateText = date.toLocaleDateString('en-GB', { 
                        weekday: 'short',
                        day: 'numeric', 
                        month: 'short' 
                    });
                    timeText = '00:00';
                } else {
                    dateText = 'Unknown Date';
                    timeText = '--:--';
                }
                
                // Create rich HTML for booking card in dropdown
                const bookingHTML = `
                    <div class="booking-mini-card">
                        <div class="booking-mini-header">
                            <div class="booking-mini-logo">
                                <img src="carp-logo.png" alt="Bignor Park" style="width: 32px; height: 32px; border-radius: 50%;">
                            </div>
                            <div class="booking-mini-status">
                                <span class="status-emoji">${statusEmoji}</span>
                                <span class="status-text">${statusText}</span>
                            </div>
                        </div>
                        <div class="booking-mini-details">
                            <div class="booking-mini-lake">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                <strong>${lakeName}</strong>
                            </div>
                            <div class="booking-mini-datetime">
                                <div class="booking-mini-date">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    <span>${dateText}</span>
                                </div>
                                <div class="booking-mini-time">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    <span>${timeText} UTC</span>
                                </div>
                            </div>
                        </div>
                        <div class="booking-mini-footer">
                            <small>Click to view full details</small>
                        </div>
                    </div>
                `;
                
                statusDetails.innerHTML = bookingHTML;
                statusContainer.style.display = 'block';
                
                // Add click handler to navigate to bookings page
                statusContainer.onclick = function() {
                    window.location.href = 'my-bookings.html';
                };
            } else {
                statusContainer.style.display = 'none';
            }
            
        } catch (error) {
            console.error('[UserDropdown] Error updating booking status:', error);
            statusContainer.style.display = 'none';
        }
    }
    
    // Export for external access
    window.UserDropdown = {
        updateBookingStatus: updateBookingStatus
    };
    
    // Note: Modal functions are now defined in user-modals.js
    // These will be available globally when that script is loaded
    
    console.log('[UserDropdown] Module loaded');
})();

