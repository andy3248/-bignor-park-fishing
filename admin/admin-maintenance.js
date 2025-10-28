// Admin Maintenance Reports Management

// Load and display maintenance reports
function loadMaintenanceReports() {
    try {
        const reports = JSON.parse(localStorage.getItem('maintenanceReports') || '[]');
        const container = document.getElementById('maintenanceReportsContainer');
        
        if (reports.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 40px; color: #6c757d;">No maintenance reports yet.</p>';
            return;
        }
        
        // Sort by date descending
        reports.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        container.innerHTML = reports.map(report => createMaintenanceCard(report)).join('');
        
    } catch (error) {
        console.error('Error loading maintenance reports:', error);
    }
}

// Create maintenance report card HTML
function createMaintenanceCard(report) {
    const date = new Date(report.date);
    const formattedDate = date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    
    const statusClass = report.status || 'completed';
    const statusText = statusClass.charAt(0).toUpperCase() + statusClass.slice(1).replace('-', ' ');
    
    return `
        <div class="maintenance-report-card ${statusClass}">
            <div class="report-header">
                <div class="report-date">${formattedDate}</div>
                <div class="report-status ${statusClass}">${statusText}</div>
            </div>
            <h3 class="report-title">${report.lake} - ${report.title}</h3>
            <p class="report-description">${report.description}</p>
            <div class="report-actions">
                <button class="report-action-btn edit" onclick="editMaintenanceReport('${report.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit
                </button>
                <button class="report-action-btn delete" onclick="deleteMaintenanceReport('${report.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Delete
                </button>
            </div>
        </div>
    `;
}

// Open add maintenance modal
function openAddMaintenanceModal() {
    document.getElementById('maintenanceForm').reset();
    document.getElementById('maintenanceDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('addMaintenanceModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Close add maintenance modal
function closeAddMaintenanceModal() {
    document.getElementById('addMaintenanceModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Submit maintenance report
function submitMaintenanceReport(event) {
    event.preventDefault();
    
    try {
        const date = document.getElementById('maintenanceDate').value;
        const lake = document.getElementById('maintenanceLake').value;
        const title = document.getElementById('maintenanceTitle').value;
        const description = document.getElementById('maintenanceDescription').value;
        const status = document.getElementById('maintenanceStatus').value;
        
        const report = {
            id: Date.now().toString(),
            date: date,
            lake: lake,
            title: title,
            description: description,
            status: status,
            createdAt: new Date().toISOString()
        };
        
        // Get existing reports
        const reports = JSON.parse(localStorage.getItem('maintenanceReports') || '[]');
        
        // Add new report
        reports.push(report);
        
        // Save back to localStorage
        localStorage.setItem('maintenanceReports', JSON.stringify(reports));
        
        // Close modal and reload reports
        closeAddMaintenanceModal();
        loadMaintenanceReports();
        
        alert('Maintenance report added successfully!');
        
    } catch (error) {
        console.error('Error adding maintenance report:', error);
        alert('Error adding maintenance report. Please try again.');
    }
}

// Edit maintenance report
function editMaintenanceReport(reportId) {
    try {
        const reports = JSON.parse(localStorage.getItem('maintenanceReports') || '[]');
        const report = reports.find(r => r.id === reportId);
        
        if (!report) {
            alert('Report not found.');
            return;
        }
        
        // Populate form with existing data
        document.getElementById('maintenanceDate').value = report.date;
        document.getElementById('maintenanceLake').value = report.lake;
        document.getElementById('maintenanceTitle').value = report.title;
        document.getElementById('maintenanceDescription').value = report.description;
        document.getElementById('maintenanceStatus').value = report.status;
        
        // Change form submit to update mode
        const form = document.getElementById('maintenanceForm');
        form.onsubmit = function(e) {
            e.preventDefault();
            updateMaintenanceReport(reportId);
        };
        
        // Update modal title
        document.querySelector('#addMaintenanceModal .admin-modal-header h2').textContent = 'Edit Maintenance Report';
        
        // Open modal
        document.getElementById('addMaintenanceModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Error editing maintenance report:', error);
        alert('Error loading report. Please try again.');
    }
}

// Update maintenance report
function updateMaintenanceReport(reportId) {
    try {
        const date = document.getElementById('maintenanceDate').value;
        const lake = document.getElementById('maintenanceLake').value;
        const title = document.getElementById('maintenanceTitle').value;
        const description = document.getElementById('maintenanceDescription').value;
        const status = document.getElementById('maintenanceStatus').value;
        
        // Get existing reports
        let reports = JSON.parse(localStorage.getItem('maintenanceReports') || '[]');
        
        // Find and update report
        const index = reports.findIndex(r => r.id === reportId);
        if (index !== -1) {
            reports[index] = {
                ...reports[index],
                date: date,
                lake: lake,
                title: title,
                description: description,
                status: status,
                updatedAt: new Date().toISOString()
            };
            
            // Save back to localStorage
            localStorage.setItem('maintenanceReports', JSON.stringify(reports));
            
            // Reset form and close modal
            const form = document.getElementById('maintenanceForm');
            form.onsubmit = submitMaintenanceReport;
            document.querySelector('#addMaintenanceModal .admin-modal-header h2').textContent = 'Add Maintenance Report';
            closeAddMaintenanceModal();
            loadMaintenanceReports();
            
            alert('Maintenance report updated successfully!');
        } else {
            alert('Report not found.');
        }
        
    } catch (error) {
        console.error('Error updating maintenance report:', error);
        alert('Error updating report. Please try again.');
    }
}

// Delete maintenance report
function deleteMaintenanceReport(reportId) {
    if (!confirm('Are you sure you want to delete this maintenance report? This action cannot be undone.')) {
        return;
    }
    
    try {
        let reports = JSON.parse(localStorage.getItem('maintenanceReports') || '[]');
        reports = reports.filter(r => r.id !== reportId);
        localStorage.setItem('maintenanceReports', JSON.stringify(reports));
        
        loadMaintenanceReports();
        alert('Maintenance report deleted successfully!');
        
    } catch (error) {
        console.error('Error deleting maintenance report:', error);
        alert('Error deleting report. Please try again.');
    }
}

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('addMaintenanceModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeAddMaintenanceModal();
            }
        });
    }
});

