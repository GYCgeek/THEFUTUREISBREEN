// Map initialization and configuration
class JourneyMap {
    constructor() {
        this.token = 'pk.eyJ1Ijoib213dG9jb3AiLCJhIjoiY204ZXYyMmhyMDVsczJrb3Y3amhmZGVzbyJ9.EwtKgipjYgHt6onUWyU32w';
        this.debugElement = document.getElementById('map-debug');
        this.mapElement = document.getElementById('journey-map');
        this.route = [
            [-9.1427, 38.7223],  // Lisbon
            [-14.4301, 35.8989], // Waypoint 1
            [-20.8000, 32.0000], // Waypoint 2
            [-25.9500, 25.0000], // Waypoint 3
            [-35.0000, 15.0000], // Mid-Atlantic
            [-42.0000, 5.0000],  // Near Equator
            [-48.5000, -1.4558]  // Belém
        ];
    }

    debug(message, isError = false) {
        const timestamp = new Date().toLocaleTimeString();
        console[isError ? 'error' : 'log'](`[${timestamp}] ${message}`);
        if (this.debugElement) {
            this.debugElement.innerHTML += `<div style="color: ${isError ? 'red' : 'blue'}">[${timestamp}] ${message}</div>`;
        }
    }

    async init() {
        try {
            // Check if mapboxgl is loaded
            if (typeof mapboxgl === 'undefined') {
                throw new Error('Mapbox GL JS is not loaded');
            }

            // Set access token
            mapboxgl.accessToken = this.token;

            // Initialize map
            const map = new mapboxgl.Map({
                container: 'journey-map',
                style: 'mapbox://styles/mapbox/navigation-night-v1',
                center: [-30, 20],
                zoom: 3,
                projection: 'mercator'
            });

            // Add navigation control
            map.addControl(new mapboxgl.NavigationControl(), 'top-right');

            // Wait for map to load
            map.on('load', () => {
                this.debug('Map loaded successfully');
                this.addRoute(map);
            });

            // Handle errors
            map.on('error', (e) => {
                this.debug(`Map error: ${e.error.message}`, true);
            });

        } catch (error) {
            this.debug(`Initialization error: ${error.message}`, true);
        }
    }

    addRoute(map) {
        try {
            map.addSource('route', {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'properties': {},
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': this.route
                    }
                }
            });

            map.addLayer({
                'id': 'route',
                'type': 'line',
                'source': 'route',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#FF1D65',
                    'line-width': 3,
                    'line-opacity': 0.8
                }
            });

            this.debug('Route added successfully');
        } catch (error) {
            this.debug(`Route error: ${error.message}`, true);
        }
    }
}

// Initialize map when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const journeyMap = new JourneyMap();
    journeyMap.init();
}); 