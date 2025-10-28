// Dashboard JavaScript

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    loadLiveSessions();
    startImageSlideshow();
    
    // Set up modal functionality
    window.showLakesInfo = showLakesInfo;
    window.showRules = showRules;
    window.showLiveFeed = showLiveFeed;
    window.closeModal = closeModal;
});

// Image Slideshow Functionality
function startImageSlideshow() {
    const slides = [
        { id: 'slide1', src: 'HCRU2383.JPG' },
        { id: 'slide2', src: 'wood-pool-1.jpg' },
        { id: 'slide3', src: 'WhatsApp Image 2025-06-14 at 09.54.49_24b1de56.jpg' },
        { id: 'slide4', src: 'WhatsApp Image 2025-06-14 at 09.54.33_09f05893.jpg' }
    ];
    
    let currentSlide = 0;
    
    function nextSlide() {
        // Hide current slide
        const currentSlideElement = document.getElementById(slides[currentSlide].id);
        if (currentSlideElement) {
            currentSlideElement.classList.remove('active');
        }
        
        // Move to next slide
        currentSlide = (currentSlide + 1) % slides.length;
        
        // Show new slide
        const nextSlideElement = document.getElementById(slides[currentSlide].id);
        if (nextSlideElement) {
            nextSlideElement.classList.add('active');
        }
    }
    
    // Start the slideshow - change every 10 seconds
    setInterval(nextSlide, 10000);
}

// Load user data
function loadUserData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    // Update user display
    document.getElementById('userNameDisplay').textContent = currentUser.fullName || 'Member';
}

// Modal Functions
function showLakesInfo() {
    document.getElementById('lakesModal').style.display = 'flex';
}

function showRules() {
    document.getElementById('rulesModal').style.display = 'flex';
}

function showLiveFeed() {
    document.getElementById('liveFeedModal').style.display = 'flex';
    loadLiveSessions();
}

function closeModal() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// Load live sessions
function loadLiveSessions() {
    const liveSessions = document.getElementById('liveSessions');
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    
    if (!liveSessions) return;
    
    // Check for today's sessions
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = bookings.filter(b => 
        b.date === today && b.status === 'upcoming'
    );
    
    if (todaySessions.length > 0) {
        liveSessions.innerHTML = todaySessions.map(session => {
            const lakeName = session.lakeName || (session.lake === 'bignor' ? 'Bignor Main Lake' : 'Wood Pool');
            return `
                <div class="session-card">
                    <div class="session-avatar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>
                    <div class="session-info">
                        <h4>${session.userName}</h4>
                        <p>
                            <svg class="fishing-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M2 20a2.4 2.4 0 002 1 2.4 2.4 0 002-1 2.4 2.4 0 012-1 2.4 2.4 0 012 1 2.4 2.4 0 002 1 2.4 2.4 0 002-1 2.4 2.4 0 012-1 2.4 2.4 0 012 1 2.4 2.4 0 002 1 2.4 2.4 0 002-1"></path>
                            </svg>
                            ${lakeName}
                        </p>
                        <p>24h fishing session</p>
                    </div>
                    <span class="session-status">LIVE</span>
                </div>
            `;
        }).join('');
    } else {
        liveSessions.innerHTML = `
            <div class="no-sessions">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"></path>
                </svg>
                <p>No active sessions at the moment</p>
            </div>
        `;
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal-overlay')) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});





