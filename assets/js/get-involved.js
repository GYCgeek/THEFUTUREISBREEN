document.addEventListener('DOMContentLoaded', function() {
    initializeModals();
    initializeFormValidation();
});

function initializeModals() {
    // Handle volunteer modal
    const volunteerModal = document.getElementById('volunteerModal');
    if (volunteerModal) {
        volunteerModal.addEventListener('show.bs.modal', function(event) {
            const button = event.relatedTarget;
            const role = button.getAttribute('data-role');
            updateVolunteerForm(role);
        });
    }

    // Handle other modals similarly
}

function updateVolunteerForm(role) {
    const form = document.getElementById('volunteerForm');
    const roleSpecificFields = getVolunteerFields(role);
    form.innerHTML = `
        <div class="mb-3">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-control" required>
        </div>
        <div class="mb-3">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" required>
        </div>
        ${roleSpecificFields}
        <div class="mb-3">
            <label class="form-label">Why do you want to volunteer?</label>
            <textarea class="form-control" rows="3" required></textarea>
        </div>
        <button type="submit" class="btn btn-success w-100">Submit Application</button>
    `;
}

function getVolunteerFields(role) {
    switch(role) {
        case 'digital-advocate':
            return `
                <div class="mb-3">
                    <label class="form-label">Social Media Experience</label>
                    <select class="form-select" required>
                        <option value="">Select experience level</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="expert">Expert</option>
                    </select>
                </div>
            `;
        case 'coordinator':
            return `
                <div class="mb-3">
                    <label class="form-label">Location</label>
                    <input type="text" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Previous Project Experience</label>
                    <textarea class="form-control" rows="2" required></textarea>
                </div>
            `;
        default:
            return '';
    }
}

function initializeFormValidation() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
    });
}

function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    
    if (!form.checkValidity()) {
        event.stopPropagation();
        form.classList.add('was-validated');
        return;
    }

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Submitting...';

    // Simulate form submission
    setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        
        // Show success message
        showSuccessMessage(form);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(form.closest('.modal'));
        if (modal) {
            modal.hide();
        }
    }, 1500);
}

function showSuccessMessage(form) {
    const toast = new bootstrap.Toast(createToast('Success', 'Your application has been submitted successfully!'));
    toast.show();
}

function createToast(title, message) {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toastContainer.innerHTML = `
        <div class="toast" role="alert">
            <div class="toast-header">
                <strong class="me-auto">${title}</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">${message}</div>
        </div>
    `;
    document.body.appendChild(toastContainer);
    return toastContainer.querySelector('.toast');
} 