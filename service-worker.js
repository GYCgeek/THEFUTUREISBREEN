const CACHE_NAME = 'gyc-site-v3';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/assets/css/bootstrap.min.css',
    '/assets/css/all.min.css',
    '/assets/css/style.css?v=20260428',
    '/assets/js/jquery-3.2.1.min.js',
    '/assets/js/popper.min.js',
    '/assets/js/bootstrap.min.js',
    '/assets/js/script.js?v=20260428'
];

// Install Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            await Promise.allSettled(
                ASSETS_TO_CACHE.map(asset => cache.add(new Request(asset, { cache: 'reload' })))
            );
            await self.skipWaiting();
        })
    );
});

// Activate and clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch with network-first strategy
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
                return response;
            })
            .catch(async () => {
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }

                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }

                return Response.error();
            })
    );
}); 