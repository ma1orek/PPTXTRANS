// Service Worker for PPTX Translator Pro - Cache Busting v2024.12.16.18.00
const CACHE_NAME = 'pptx-translator-v2024.12.16.18.00';
const urlsToCache = [];

// Install event - clear all old caches
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing - Cache Busting Active');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Delete all existing caches
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('🗑️ Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Skip waiting and immediately activate
      return self.skipWaiting();
    })
  );
});

// Activate event - claim all clients immediately
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated - Fresh content guaranteed');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          console.log('🗑️ Cleaning up cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - always fetch fresh content, never cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Always bypass cache for HTML, JS, CSS files
  if (url.pathname.endsWith('.html') || 
      url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.css') || 
      url.pathname === '/' ||
      url.pathname.includes('index')) {
    
    console.log('🔄 Force fresh fetch:', url.pathname);
    
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }).catch(() => {
        // Fallback for offline - but still try to avoid cache
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // For other requests, try network first
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .catch(() => caches.match(event.request))
  );
});

// Message event - force refresh when requested
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('🔄 Force refresh requested');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('🗑️ Manual cache clear requested');
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      console.log('✅ All caches cleared');
      // Notify all clients to refresh
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'CACHE_CLEARED',
            message: 'Cache cleared, page will refresh'
          });
        });
      });
    });
  }
});