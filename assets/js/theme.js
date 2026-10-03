class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.initializeTheme();
        this.setupEventListeners();
    }

    initializeTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        this.updateThemeIcon();
    }

    setupEventListeners() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addListener((e) => {
            this.theme = e.matches ? 'dark' : 'light';
            this.initializeTheme();
        });
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.initializeTheme();
    }

    updateThemeIcon() {
        const icon = document.querySelector('#theme-toggle i');
        if (icon) {
            icon.className = this.theme === 'light' 
                ? 'fas fa-moon' 
                : 'fas fa-sun';
        }
    }
}

class GamificationSystem {
    constructor() {
        this.points = parseInt(localStorage.getItem('points')) || 0;
        this.badges = JSON.parse(localStorage.getItem('badges')) || [];
        this.initializeUI();
    }

    initializeUI() {
        this.updatePointsDisplay();
        this.renderBadges();
        this.setupProgressTracking();
    }

    updatePointsDisplay() {
        const pointsElement = document.getElementById('user-points');
        if (pointsElement) {
            pointsElement.textContent = this.points.toLocaleString();
        }
    }

    renderBadges() {
        const badgesContainer = document.getElementById('user-badges');
        if (badgesContainer && this.badges.length > 0) {
            badgesContainer.innerHTML = this.badges.map(badge => `
                <div class="badge-achievement" data-bs-toggle="tooltip" title="${badge.description}">
                    <i class="${badge.icon}"></i>
                    ${badge.name}
                </div>
            `).join('');
            
            // Initialize tooltips
            const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
            tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));
        }
    }

    setupProgressTracking() {
        // Track scroll depth
        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                if (maxScroll >= 75) {
                    this.awardBadge('explorer', 'Explorer', 'Explored 75% of the content', 'fas fa-compass');
                }
            }
        });

        // Track interactions
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn, .card, .nav-link')) {
                this.addPoints(5);
            }
        });
    }

    addPoints(amount) {
        this.points += amount;
        localStorage.setItem('points', this.points);
        this.updatePointsDisplay();
        this.checkLevelUp();
    }

    awardBadge(id, name, description, icon) {
        if (!this.badges.find(b => b.id === id)) {
            this.badges.push({ id, name, description, icon });
            localStorage.setItem('badges', JSON.stringify(this.badges));
            this.renderBadges();
            this.showBadgeNotification(name);
        }
    }

    checkLevelUp() {
        const level = Math.floor(this.points / 100);
        if (level > (parseInt(localStorage.getItem('level')) || 0)) {
            localStorage.setItem('level', level);
            this.showLevelUpNotification(level);
        }
    }

    showBadgeNotification(badgeName) {
        const toast = new bootstrap.Toast(createToast('New Badge!', `You earned the ${badgeName} badge!`));
        toast.show();
    }

    showLevelUpNotification(level) {
        const toast = new bootstrap.Toast(createToast('Level Up!', `You reached level ${level}!`));
        toast.show();
    }
}

// Initialize systems
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
    window.gamification = new GamificationSystem();
});

// Helper function to create toast notifications
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