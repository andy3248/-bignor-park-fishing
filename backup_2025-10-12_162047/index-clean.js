// Simple clean JavaScript

// Check if user is logged in and display their name
window.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const userNameElement = document.getElementById('userName');
    
    if (currentUser && userNameElement) {
        userNameElement.textContent = currentUser.fullName || 'Member';
    }
});

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Slideshow
let slideIndex = 0;
const slides = document.querySelectorAll('.slide');

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

if (slides.length > 0) {
    setInterval(nextSlide, 5000);
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

