// Amar Ghor Online - Progressive Web App Service Worker
const CACHE_NAME = 'amar-ghor-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.png',
  '/logo.png'
];

// Install Event - Pre-cache core shell assets & activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Core precache partial failure:', err);
      });
    })
  );
});

// Activate Event - Clean old caches & claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Fulfills PWA installability criteria on Chromium/Android
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Bypass non-GET requests and API calls
  if (request.method !== 'GET' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) {
    return;
  }

  // Bypass Google Analytics, Cloudinary or other 3rd party dynamic endpoints
  if (url.origin !== self.location.origin && !url.hostname.includes('fonts.g')) {
    return;
  }

  // Network-First with Cache-Fallback for navigation (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match('/index.html') || caches.match('/');
          });
        })
    );
    return;
  }

  // Stale-While-Revalidate for images, icons, manifest, and static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

// ----------------- FIREBASE CLOUD MESSAGING (PUSH NOTIFICATIONS) ----------------- //
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    const rawText = event.data ? event.data.text() : '';
    data = { notification: { title: 'আমার ঘর Online', body: rawText } };
  }

  const notification = data.notification || {};
  const customData = data.data || {};

  const title = notification.title || customData.title || '🛒 নতুন অর্ডার গ্রহণ করা হয়েছে!';
  const body = notification.body || customData.body || 'আমার ঘর Online-এ একটি নতুন অর্ডার এসেছে। বিস্তারিত দেখতে ট্যাপ করুন।';

  const options = {
    body,
    icon: notification.icon || customData.icon || '/pwa-192x192.png',
    badge: '/favicon.png',
    data: {
      url: customData.url || '/?admin=true&tab=orders',
      orderId: customData.orderId || '',
      orderNumber: customData.orderNumber || ''
    },
    vibrate: [200, 100, 200, 100, 200],
    tag: customData.orderId ? `order-${customData.orderId}` : 'amarghor-admin-alert',
    renotify: true,
    requireInteraction: true
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/?admin=true&tab=orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

