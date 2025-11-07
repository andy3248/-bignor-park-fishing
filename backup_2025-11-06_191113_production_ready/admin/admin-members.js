// Admin Members Management

let allMembers = [];
let filteredMembers = [];

document.addEventListener('DOMContentLoaded', function() {
    loadAllMembers();
});

function loadAllMembers() {
    const stored = localStorage.getItem('users');
    allMembers = stored ? JSON.parse(stored) : [];
    filteredMembers = [...allMembers];
    renderMembersTable();
}

function filterMembers() {
    const search = document.getElementById('searchMember').value.toLowerCase();
    const status = document.getElementById('filterMemberStatus').value;

    filteredMembers = allMembers.filter(member => {
        const nameMatch = (member.fullName || '').toLowerCase().includes(search);
        const emailMatch = (member.email || '').toLowerCase().includes(search);
        const searchMatch = nameMatch || emailMatch;

        const statusMatch = status === 'all' ||
            (status === 'active' && member.status !== 'suspended') ||
            (status === 'suspended' && member.status === 'suspended');

        return searchMatch && statusMatch;
    });

    renderMembersTable();
}

function renderMembersTable() {
    const tableBody = document.getElementById('membersTableBody');
    const countSpan = document.getElementById('membersCount');

    countSpan.textContent = filteredMembers.length;

    if (filteredMembers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #6c757d;">No members found</td></tr>';
        return;
    }

    const bookings = JSON.parse(localStorage.getItem('bignor_park_bookings') || '[]');

    tableBody.innerHTML = filteredMembers.map(member => {
        const memberBookings = bookings.filter(b => b.userId === member.email).length;
        const status = member.status || 'active';
        const statusBadge = status === 'suspended' ?
            '<span class="admin-badge danger">Suspended</span>' :
            '<span class="admin-badge success">Active</span>';

        const joinedDate = member.createdAt ?
            new Date(member.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) :
            'Unknown';

        return `
            <tr>
                <td><code>${member.email.substring(0, 8)}</code></td>
                <td style="font-weight: 600;">${member.fullName || 'Unknown'}</td>
                <td>${member.email}</td>
                <td>${statusBadge}</td>
                <td>${joinedDate}</td>
                <td>${memberBookings}</td>
                <td>
                    <button onclick="viewMemberDetails('${member.email}')" class="admin-action-btn primary">
                        View
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function viewMemberDetails(email) {
    const member = allMembers.find(m => m.email === email);
    if (!member) {
        alert('Member not found');
        return;
    }

    const bookings = JSON.parse(localStorage.getItem('bignor_park_bookings') || '[]');
    const memberBookings = bookings.filter(b => b.userId === email);

    const details = `
Member: ${member.fullName || 'Unknown'}
Email: ${member.email}
Status: ${member.status || 'active'}

Total Bookings: ${memberBookings.length}
Upcoming: ${memberBookings.filter(b => b.status === 'upcoming').length}
Completed: ${memberBookings.filter(b => b.status === 'completed').length}
Cancelled: ${memberBookings.filter(b => b.status === 'cancelled').length}
    `.trim();

    alert(details);
}

function openAddMemberModal() {
    alert('Add member functionality - In production, this would open a modal to add a new member.');
}

window.filterMembers = filterMembers;
window.viewMemberDetails = viewMemberDetails;
window.openAddMemberModal = openAddMemberModal;
