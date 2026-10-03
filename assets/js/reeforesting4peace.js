// Video Modal Functionality
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('videoModal');
    const videoFrame = document.getElementById('videoFrame');
    const modalTitle = document.getElementById('modalVideoTitle');
    const modalDescription = document.getElementById('modalVideoDescription');
    const closeModal = document.querySelector('.close-modal');
    
    // Function to open modal with specific video
    function openVideoModal(videoId, title, description) {
        videoFrame.src = `https://www.youtube.com/embed/${videoId}`;
        modalTitle.textContent = title;
        modalDescription.textContent = description;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
    
    // Close modal
    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
        videoFrame.src = '';
        document.body.style.overflow = 'auto'; // Re-enable scrolling
    });
    
    // Close modal when clicking outside content
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            videoFrame.src = '';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Add click event to all video cards
    const videoCards = document.querySelectorAll('.video-card');
    videoCards.forEach(card => {
        card.addEventListener('click', function() {
            const videoId = this.getAttribute('data-video-id');
            const title = this.querySelector('h4').textContent;
            const description = this.querySelector('p').textContent;
            openVideoModal(videoId, title, description);
        });
    });
    
    // Language selector functionality
    const languageOptions = document.querySelectorAll('.language-option');
    languageOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            languageOptions.forEach(opt => opt.classList.remove('active'));
            // Add active class to clicked option
            this.classList.add('active');
            
            // Get selected language
            const language = this.getAttribute('data-language');
            // Update video content based on language
            updateVideosByLanguage(language);
        });
    });
    
    // Function to update videos based on selected language
    function updateVideosByLanguage(language) {
        // This would be implemented to change video sources based on language
        console.log(`Changing videos to ${language}`);
        // In a real implementation, you would update the video sources
    }
}); 