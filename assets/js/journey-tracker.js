document.addEventListener('DOMContentLoaded', function() {
    initJourneyMap();
    initLiveUpdates();
    initEventRSVP();
    initSponsorship();
});

function initJourneyMap() {
    // Initialize MapLibre GL JS map
    const map = new maplibregl.Map({
        container: 'journey-map',
        style: 'https://api.maptiler.com/maps/streets/style.json?key=YOUR_KEY',
        center: [-30.5, 0], // Atlantic Ocean
        zoom: 3
    });

    // Add ship location and route
    map.on('load', () => {
        // Add the route line
        map.addSource('route', {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [-8.6500, 41.1500], // Porto
                        [-14.4167, 28.0000], // Mid-Atlantic
                        [-30.5000, 0.0000],  // Current Location
                        [-43.2000, -22.9000] // Rio de Janeiro
                    ]
                }
            }
        });

        map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#4CAF50',
                'line-width': 3,
                'line-dasharray': [2, 1]
            }
        });

        // Add the ship marker
        const el = document.createElement('div');
        el.className = 'ship-marker';
        el.innerHTML = '<i class="fas fa-ship"></i>';

        new maplibregl.Marker(el)
            .setLngLat([-30.5, 0])
            .addTo(map);
    });
}

function initLiveUpdates() {
    // Simulate real-time updates
    setInterval(() => {
        fetchLatestUpdates();
    }, 30000);
}

function fetchLatestUpdates() {
    // Simulate API call for updates
    const updates = [
        {
            time: '2 hours ago',
            content: 'Spotted a pod of dolphins! Nature reminds us why we\'re on this journey. 🐬',
            image: 'assets/images/journey/update-1.jpg',
            likes: 245,
            comments: 18
        }
        // More updates
    ];

    updateFeed(updates);
}

function updateFeed(updates) {
    const feed = document.querySelector('.updates-feed');
    // Update feed content
}

function initEventRSVP() {
    document.querySelectorAll('.event-item .btn').forEach(btn => {
        btn.addEventListener('click', handleRSVP);
    });
}

function handleRSVP(e) {
    const btn = e.target;
    const eventTitle = btn.closest('.event-item').querySelector('h6').textContent;
    
    // Show RSVP modal or form
    showRSVPModal(eventTitle);
}

function initSponsorship() {
    document.querySelectorAll('.sponsorship-item .btn').forEach(btn => {
        btn.addEventListener('click', handleSponsorship);
    });
}

function handleSponsorship(e) {
    const btn = e.target;
    const item = btn.closest('.sponsorship-item');
    const title = item.querySelector('h6').textContent;
    
    // Show sponsorship modal or form
    showSponsorshipModal(title);
}

function showRSVPModal(eventTitle) {
    // Implement RSVP modal
}

function showSponsorshipModal(sponsorshipTitle) {
    // Implement sponsorship modal
} 