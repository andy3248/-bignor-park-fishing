// Landing Page JavaScript

// Hero Slideshow
let currentSlide = 0;
const slides = document.querySelectorAll('.lake-hero');
const slideInterval = 5000; // 5 seconds

function showSlide(index) {
    slides.forEach((slide, i) => {
        slide.classList.remove('active');
        if (i === index) {
            slide.classList.add('active');
        }
    });
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
}

// Auto-advance slideshow
if (slides.length > 1) {
    setInterval(nextSlide, slideInterval);
}

// Modal Functions
function showLakesInfo() {
    document.getElementById('lakesModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function showRules() {
    document.getElementById('rulesModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function showLiveFeed() {
    document.getElementById('liveFeedModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function showContact() {
    document.getElementById('contactModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('lakesModal').style.display = 'none';
    document.getElementById('rulesModal').style.display = 'none';
    document.getElementById('liveFeedModal').style.display = 'none';
    document.getElementById('contactModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close modal on outside click
document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
});

// Close modal on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 90;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Navbar scroll effect
const header = document.querySelector('.page-header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
        header.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    } else {
        header.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    }
    
    lastScroll = currentScroll;
});

// Fade-in animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards and sections for animation
document.addEventListener('DOMContentLoaded', () => {
    // Start slideshow
    showSlide(0);
    
    // Add fade-in animations
    const elementsToAnimate = document.querySelectorAll('.lake-showcase-card, .catch-card, .contact-card');
    elementsToAnimate.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    // Page load animation
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// Handle mobile menu responsiveness
let mobileMenuOpen = false;

window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && mobileMenuOpen) {
        mobileMenuOpen = false;
    }
});

// Gallery image click handler (for future lightbox implementation)
document.querySelectorAll('.catch-image img').forEach(img => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', function() {
        // Future: Could implement a lightbox/modal here
        console.log('Gallery image clicked:', this.alt);
    });
});

// Prevent background scroll when modal is open
function toggleBodyScroll(disable) {
    if (disable) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
}

// Add loading state to buttons
document.querySelectorAll('button[onclick*="location"]').forEach(btn => {
    btn.addEventListener('click', function() {
        this.style.opacity = '0.7';
        this.style.pointerEvents = 'none';
    });
});

