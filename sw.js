const CACHE_NAME = 'pibes-app-v1';
const APP_SHELL = [
    './',
    './index.html',
    './qr-imprimir.html',
    './manifest.json',
    './assets/logos/pibesdebarrio-transparent.png',
    './assets/pwa/icon-192.png',
    './assets/pwa/icon-512.png'
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(APP_SHELL);
        })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.filter(function (key) {
                    return key !== CACHE_NAME;
                }).map(function (key) {
                    return caches.delete(key);
                })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

self.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', function (event) {
    if (event.request.method !== 'GET') {
        return;
    }

    const requestUrl = new URL(event.request.url);

    if (requestUrl.origin !== self.location.origin) {
        return;
    }

    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).then(function (response) {
                const copy = response.clone();

                caches.open(CACHE_NAME).then(function (cache) {
                    cache.put('./index.html', copy);
                });

                return response;
            }).catch(function () {
                return caches.match(event.request).then(function (cachedPage) {
                    return cachedPage || caches.match('./index.html');
                });
            })
        );

        return;
    }

    event.respondWith(
        caches.match(event.request).then(function (cachedResponse) {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then(function (response) {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const copy = response.clone();

                caches.open(CACHE_NAME).then(function (cache) {
                    cache.put(event.request, copy);
                });

                return response;
            });
        })
    );
});