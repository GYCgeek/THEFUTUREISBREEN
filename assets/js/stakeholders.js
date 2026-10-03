const stakeholderInfo = {
    policy: {
        title: "Government & Cities Zone",
        subtitle: "Lead the transition to sustainable development",
        headerClass: "bg-primary",
        icon: "fas fa-landmark",
        primaryAction: "Pledge Government Support",
        primaryActionUrl: "/pledge-support",
        actions: [
            "Align national policies with Framework pillars",
            "Dedicate funding or create policy incentives",
            "Report annual progress for transparency"
        ],
        features: [
            {
                icon: "fas fa-file-signature",
                title: "Commitment Portal",
                description: "Register your government's commitment",
                link: "/commit"
            },
            {
                icon: "fas fa-book",
                title: "Case Studies",
                description: "Learn from successful implementations",
                link: "/case-studies"
            },
            {
                icon: "fas fa-scroll",
                title: "Policy Resources",
                description: "Access policy guides and templates",
                link: "/resources"
            },
            {
                icon: "fas fa-chart-line",
                title: "Progress Reporting",
                description: "Submit and track annual progress",
                link: "/reporting"
            }
        ]
    },
    corporate: {
        title: "Corporate & Private Sector Zone",
        subtitle: "Drive sustainable business transformation",
        headerClass: "bg-success",
        icon: "fas fa-building",
        primaryAction: "Register Corporate Commitment",
        primaryActionUrl: "/corporate-pledge",
        actions: [
            "Implement measurable ESG actions",
            "Support Nature-Based Solutions",
            "Ensure just clean energy transition"
        ],
        features: [
            {
                icon: "fas fa-chart-bar",
                title: "ESG Dashboard",
                description: "Track your sustainability metrics",
                link: "/esg-tracking"
            },
            {
                icon: "fas fa-trophy",
                title: "Corporate Leaderboard",
                description: "Recognition for top performers",
                link: "/leaderboard"
            },
            {
                icon: "fas fa-road",
                title: "ESG Roadmap",
                description: "Custom sustainability planning",
                link: "/roadmap"
            },
            {
                icon: "fas fa-hand-holding-usd",
                title: "Funding Options",
                description: "Climate finance opportunities",
                link: "/funding"
            }
        ]
    },
    individual: {
        title: "Individual & Grassroots Zone",
        subtitle: "Take action in your community",
        headerClass: "bg-info",
        icon: "fas fa-users",
        primaryAction: "Join the Movement",
        primaryActionUrl: "/join",
        actions: [
            "Engage in advocacy and education",
            "Mobilize networks for change",
            "Support local solutions"
        ],
        features: [
            {
                icon: "fas fa-tasks",
                title: "Climate Challenges",
                description: "Complete actions, earn rewards",
                link: "/challenges"
            },
            {
                icon: "fas fa-hands-helping",
                title: "Volunteer Hub",
                description: "Find local opportunities",
                link: "/volunteer"
            },
            {
                icon: "fas fa-bullhorn",
                title: "Advocacy Tools",
                description: "Resources for action",
                link: "/advocacy"
            },
            {
                icon: "fas fa-comments",
                title: "Community Forum",
                description: "Share your impact story",
                link: "/forum"
            }
        ]
    },
    natural: {
        title: "Natural Areas Zone",
        subtitle: "Protect and preserve ecosystems",
        headerClass: "bg-success",
        icon: "fas fa-tree",
        primaryAction: "Access Conservation Support",
        primaryActionUrl: "/conservation",
        actions: [
            "Recognize nature as a stakeholder",
            "Establish protection frameworks",
            "Ensure sustainable stewardship"
        ],
        features: [
            {
                icon: "fas fa-balance-scale",
                title: "Legal Resources",
                description: "Nature's rights framework",
                link: "/legal"
            },
            {
                icon: "fas fa-map-marked-alt",
                title: "Protected Areas Map",
                description: "View conservation projects",
                link: "/map"
            },
            {
                icon: "fas fa-hand-holding-usd",
                title: "Conservation Funding",
                description: "Access financial support",
                link: "/funding"
            },
            {
                icon: "fas fa-shield-alt",
                title: "Protection Tools",
                description: "Conservation resources",
                link: "/protection"
            }
        ]
    }
};

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap carousel with specific options
    const carousel = new bootstrap.Carousel(document.getElementById('stakeholderCarousel'), {
        interval: false, // Don't auto-rotate
        touch: true,    // Enable touch swiping
        wrap: true      // Enable continuous loop
    });

    // Handle stakeholder selection for all cards
    document.querySelectorAll('.select-stakeholder').forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.stakeholder-card');
            const type = card.dataset.stakeholder;
            showStakeholderInfo(type);
        });
    });

    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            carousel.prev();
        } else if (e.key === 'ArrowRight') {
            carousel.next();
        }
    });

    // Add swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    const carouselElement = document.getElementById('stakeholderCarousel');
    
    carouselElement.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    });
    
    carouselElement.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].clientX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchEndX - touchStartX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                carousel.prev();
            } else {
                carousel.next();
            }
        }
    }
});

function showStakeholderInfo(type) {
    const info = stakeholderInfo[type];
    if (!info) return;

    // Update header
    document.getElementById('stakeholder-title').textContent = info.title;
    document.getElementById('stakeholder-subtitle').textContent = info.subtitle;
    document.querySelector('.stakeholder-header').className = 
        `stakeholder-header p-4 text-white ${info.headerClass}`;

    // Update actions
    const actionsList = info.actions.map(action => 
        `<div class="d-flex align-items-center mb-3">
            <i class="fas fa-check-circle text-success me-2"></i>
            <span>${action}</span>
        </div>`
    ).join('');
    document.getElementById('stakeholder-actions').innerHTML = actionsList;

    // Update primary action button
    const actionBtn = document.getElementById('stakeholder-primary-action');
    actionBtn.textContent = info.primaryAction;
    actionBtn.onclick = () => window.location.href = info.primaryActionUrl;

    // Update features
    const featuresHtml = info.features.map(feature => `
        <div class="col-md-6">
            <div class="feature-card p-3 h-100 border rounded">
                <div class="d-flex align-items-center mb-2">
                    <i class="${feature.icon} text-success me-2"></i>
                    <h5 class="mb-0">${feature.title}</h5>
                </div>
                <p class="mb-2 small">${feature.description}</p>
                <a href="${feature.link}" class="btn btn-sm btn-outline-success">Access</a>
            </div>
        </div>
    `).join('');
    document.getElementById('stakeholder-features').innerHTML = featuresHtml;

    // Show the info section
    document.getElementById('stakeholder-info').classList.remove('d-none');
    document.getElementById('stakeholder-info').scrollIntoView({ behavior: 'smooth' });
}

function resetStakeholderSelection() {
    const infoElement = document.getElementById('stakeholder-info');
    if (infoElement) {
        infoElement.classList.add('d-none');
    }
}

function joinAsStakeholder() {
    alert('Join process will be implemented here');
    // Implement actual joining process
} 