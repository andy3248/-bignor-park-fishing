// Members Approval JavaScript

// Helper function to get user initials for avatar
function getUserInitials(fullName) {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return fullName.charAt(0).toUpperCase();
}

// Render pending members as cards
function renderPendingMembers() {
    const container = document.getElementById('pendingMembersContainer');
    const countBadge = document.getElementById('pendingCount');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const pendingUsers = users.filter(u => u.status === 'pending' && u.approved === false);
    
    // Update count badge
    countBadge.textContent = pendingUsers.length;
    
    if (pendingUsers.length === 0) {
        container.innerHTML = `
            <div class="no-members">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <h3>No Pending Approvals</h3>
                <p>All signups have been reviewed</p>
            </div>
        `;
        return;
    }
    
    // Sort by created date (newest first)
    const sortedUsers = [...pendingUsers].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    let cardsHTML = '';
    
    sortedUsers.forEach(user => {
        const createdDate = new Date(user.createdAt);
        const formattedDate = createdDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const initials = getUserInitials(user.fullName);
        const phone = user.phone || 'Not provided';
        
        // Check for profile image
        const hasProfileImage = user.profileImage && user.profileImage.trim() !== '';
        const avatarStyle = hasProfileImage 
            ? `style="background-image: url(${user.profileImage}); background-size: cover; background-position: center;"` 
            : '';
        const initialsDisplay = hasProfileImage ? 'style="display: none;"' : '';
        
        cardsHTML += `
            <div class="member-card">
                <div class="member-card-header">
                    <div class="member-avatar" ${avatarStyle}>
                        <span ${initialsDisplay}>${initials}</span>
                    </div>
                    <div class="member-info">
                        <h3 class="member-name">${user.fullName || 'Unknown'}</h3>
                        <p class="member-email">${user.email}</p>
                    </div>
                </div>
                <div class="member-card-details">
                    <div class="detail-row">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        <span><strong>Phone:</strong> ${phone}</span>
                    </div>
                    <div class="detail-row">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span><strong>Signed up:</strong> ${formattedDate}</span>
                    </div>
                </div>
                <div class="member-card-actions">
                    <button class="btn-approve" onclick="approveMember('${user.id}')">
                        Approve
                    </button>
                    <button class="btn-reject" onclick="rejectMember('${user.id}')">
                        Reject
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = cardsHTML;
}

// Render approved members as cards
function renderApprovedMembers() {
    const container = document.getElementById('approvedMembersContainer');
    const countBadge = document.getElementById('approvedCount');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Get approved users (backward compatible with old users)
    const approvedUsers = users.filter(u => {
        // Old users without status field are considered approved
        if (!u.status) return true;
        // New users with approved status
        return u.status === 'approved' || u.approved === true;
    });
    
    // Update count badge
    countBadge.textContent = approvedUsers.length;
    
    if (approvedUsers.length === 0) {
        container.innerHTML = `
            <div class="no-members">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                </svg>
                <h3>No Members Found</h3>
                <p>No approved members yet</p>
            </div>
        `;
        return;
    }
    
    // Sort by created date (newest first)
    const sortedUsers = [...approvedUsers].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    let cardsHTML = '';
    
    sortedUsers.forEach(user => {
        const createdDate = new Date(user.createdAt);
        const formattedDate = createdDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        const initials = getUserInitials(user.fullName);
        const phone = user.phone || 'Not provided';
        const approvedBy = user.approvedBy || 'System';
        
        // Determine if legacy user
        const isLegacy = !user.status;
        const statusText = isLegacy ? 'Legacy Member' : 'Approved';
        
        // Check for profile image
        const hasProfileImage = user.profileImage && user.profileImage.trim() !== '';
        const avatarStyle = hasProfileImage 
            ? `style="background-image: url(${user.profileImage}); background-size: cover; background-position: center;"` 
            : '';
        const initialsDisplay = hasProfileImage ? 'style="display: none;"' : '';
        
        cardsHTML += `
            <div class="member-card">
                <div class="member-card-header">
                    <div class="member-avatar" ${avatarStyle}>
                        <span ${initialsDisplay}>${initials}</span>
                    </div>
                    <div class="member-info">
                        <h3 class="member-name">${user.fullName || 'Unknown'}</h3>
                        <p class="member-email">${user.email}</p>
                    </div>
                </div>
                <div class="member-card-details">
                    <div class="detail-row">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        <span><strong>Phone:</strong> ${phone}</span>
                    </div>
                    <div class="detail-row">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span><strong>Joined:</strong> ${formattedDate}</span>
                    </div>
                </div>
                <div class="approved-info">
                    <strong>${statusText}</strong> ${isLegacy ? '' : `by ${approvedBy}`}
                </div>
                <button class="btn-remove" onclick="removeMember('${user.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    Remove Member
                </button>
            </div>
        `;
    });
    
    container.innerHTML = cardsHTML;
}

// Approve member
function approveMember(userId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        alert('User not found.');
        return;
    }
    
    const user = users[userIndex];
    
    if (!confirm(`Approve ${user.fullName}?\n\nEmail: ${user.email}\n\nThey will be able to log in immediately after approval.`)) {
        return;
    }
    
    // Update user status
    users[userIndex].status = 'approved';
    users[userIndex].approved = true;
    users[userIndex].approvedBy = getCurrentAdmin()?.fullName || 'Admin';
    users[userIndex].approvedAt = new Date().toISOString();
    
    // Save to localStorage
    localStorage.setItem('users', JSON.stringify(users));
    
    // Log the action
    const logs = JSON.parse(localStorage.getItem('adminLoginLogs') || '[]');
    logs.unshift({
        timestamp: new Date().toISOString(),
        admin: getCurrentAdmin()?.fullName || 'Admin',
        action: 'Member Approval',
        success: true,
        message: `Approved member: ${user.fullName} (${user.email})`
    });
    localStorage.setItem('adminLoginLogs', JSON.stringify(logs.slice(0, 100)));
    
    // Refresh displays
    renderPendingMembers();
    renderApprovedMembers();
    
    alert(`${user.fullName} has been approved!\n\nThey can now log in to the system.`);
}

// Reject member
function rejectMember(userId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        alert('User not found.');
        return;
    }
    
    const user = users[userIndex];
    
    if (!confirm(`WARNING: Reject ${user.fullName}?\n\nEmail: ${user.email}\n\nThis will DELETE their account permanently. They will need to sign up again if they wish to reapply.`)) {
        return;
    }
    
    // Log the action before deletion
    const logs = JSON.parse(localStorage.getItem('adminLoginLogs') || '[]');
    logs.unshift({
        timestamp: new Date().toISOString(),
        admin: getCurrentAdmin()?.fullName || 'Admin',
        action: 'Member Rejection',
        success: true,
        message: `Rejected and deleted member: ${user.fullName} (${user.email})`
    });
    localStorage.setItem('adminLoginLogs', JSON.stringify(logs.slice(0, 100)));
    
    // Remove user from array
    users.splice(userIndex, 1);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Refresh displays
    renderPendingMembers();
    renderApprovedMembers();
    
    alert(`${user.fullName} has been rejected and removed from the system.`);
}

// Remove approved member
function removeMember(userId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        alert('User not found.');
        return;
    }
    
    const user = users[userIndex];
    
    if (!confirm(`WARNING: Remove ${user.fullName}?\n\nEmail: ${user.email}\n\nThis will:\n- DELETE their account permanently\n- Cancel all their bookings\n- Prevent them from logging in\n\nThey will need to sign up again if they wish to rejoin.`)) {
        return;
    }
    
    // Remove all bookings for this user
    try {
        // Remove from bignor_park_bookings
        const bookings = JSON.parse(localStorage.getItem('bignor_park_bookings') || '[]');
        const updatedBookings = bookings.filter(b => b.userId !== user.email);
        localStorage.setItem('bignor_park_bookings', JSON.stringify(updatedBookings));
        
        // Remove from allBookings
        const allBookings = JSON.parse(localStorage.getItem('allBookings') || '[]');
        const updatedAllBookings = allBookings.filter(b => b.userId !== user.email);
        localStorage.setItem('allBookings', JSON.stringify(updatedAllBookings));
        
        // Remove active booking
        localStorage.removeItem(`activeBooking_${user.email}`);
        
        console.log(`[Admin] Removed ${updatedBookings.length - bookings.length} bookings for ${user.email}`);
    } catch (error) {
        console.error('[Admin] Error removing user bookings:', error);
    }
    
    // Log the action before deletion
    const logs = JSON.parse(localStorage.getItem('adminLoginLogs') || '[]');
    logs.unshift({
        timestamp: new Date().toISOString(),
        admin: getCurrentAdmin()?.fullName || 'Admin',
        action: 'Member Removal',
        success: true,
        message: `Removed approved member: ${user.fullName} (${user.email})`
    });
    localStorage.setItem('adminLoginLogs', JSON.stringify(logs.slice(0, 100)));
    
    // Remove user from array
    users.splice(userIndex, 1);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Refresh displays
    renderPendingMembers();
    renderApprovedMembers();
    
    alert(`${user.fullName} has been removed from the system.\n\nTheir account and all bookings have been deleted.`);
}

// Expose functions to window
window.approveMember = approveMember;
window.rejectMember = rejectMember;
window.removeMember = removeMember;
window.renderPendingMembers = renderPendingMembers;
window.renderApprovedMembers = renderApprovedMembers;

