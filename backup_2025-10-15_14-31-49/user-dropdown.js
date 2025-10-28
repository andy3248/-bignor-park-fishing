// User Dropdown Menu - JavaScript Functionality

(function() {
    'use strict';
    
    // Wait for DOM to load
    document.addEventListener('DOMContentLoaded', function() {
        initializeUserDropdown();
        loadUserInfo();
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
    
    // Note: Modal functions are now defined in user-modals.js
    // These will be available globally when that script is loaded
    
    console.log('[UserDropdown] Module loaded');
})();

