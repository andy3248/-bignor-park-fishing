// Simple clean JavaScript

// Check if user is logged in and display their name
window.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const userNameElement = document.getElementById('userName');

    if (currentUser && userNameElement) {
        userNameElement.textContent = currentUser.fullName || 'Member';
    }

    // Show admin link if user is admin
    showAdminLinkIfAdmin();
    
    // Initialize slideshow
    initializeSlideshow();
});

// Show admin navigation link for admin users
function showAdminLinkIfAdmin() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const mainNav = document.querySelector('.main-nav');

    if (currentUser && currentUser.role === 'admin' && mainNav) {
        // Check if admin link already exists
        if (!document.getElementById('adminNavLink')) {
            const adminLink = document.createElement('a');
            adminLink.id = 'adminNavLink';
            adminLink.href = 'admin/dashboard.html';
            adminLink.textContent = 'Admin';
            adminLink.style.color = '#2c3e50';
            adminLink.style.fontWeight = '600';
            adminLink.style.transition = 'color 0.3s ease';

            // Insert before user menu if it exists, otherwise append
            const userMenu = mainNav.querySelector('.user-menu-container');
            if (userMenu) {
                mainNav.insertBefore(adminLink, userMenu);
            } else {
                mainNav.appendChild(adminLink);
            }
        }
    }
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Slideshow - Initialize after DOM is ready
let slideIndex = 0;
let slides = [];

function initializeSlideshow() {
    slides = document.querySelectorAll('.slide');
    if (slides.length > 0) {
        showSlide(0);
        setInterval(nextSlide, 5000);
    }
}

function showSlide(n) {
    slides.forEach((slide, i) => {
        slide.classList.remove('active');
        if (i === n) {
            slide.classList.add('active');
        }
    });
}

function nextSlide() {
    slideIndex = (slideIndex + 1) % slides.length;
    showSlide(slideIndex);
}

// Modal functions
function showModal(id) {
    document.getElementById(id).classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
    document.body.style.overflow = 'auto';
}

// Close on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
});

// Close on escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

