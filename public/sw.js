// PPTX Translator Pro - Service Worker
// Provides offline functionality and caching

const CACHE_NAME = 'pptx-translator-pro-v1.0.0'
const CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles/globals.css',
  // Add other static assets as needed
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching app shell')
        return cache.addAll(CACHE_URLS)
      })
      .then(() => {
        console.log('✅ App shell cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('❌ Caching failed:', error)
      })
  )
})

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('✅ Service Worker activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }
  
  // Skip external requests (Google APIs, etc)
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('📦 Serving from cache:', event.request.url)
          return cachedResponse
        }
        
        // Otherwise fetch from network
        console.log('🌐 Fetching from network:', event.request.url)
        return fetch(event.request)
          .then((response) => {
            // Check if response is valid
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }
            
            // Clone response for caching
            const responseToCache = response.clone()
            
            // Cache the response
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
              })
            
            return response
          })
          .catch((error) => {
            console.error('❌ Network fetch failed:', error)
            
            // Return offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('/index.html')
            }
            
            throw error
          })
      })
  )
})

// Background sync for file uploads (when online)
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag)
  
  if (event.tag === 'translation-upload') {
    event.waitUntil(
      // Handle queued translation requests
      handleQueuedTranslations()
    )
  }
})

// Push notifications (future feature)
self.addEventListener('push', (event) => {
  console.log('📢 Push notification received')
  
  const options = {
    body: event.data ? event.data.text() : 'Translation completed!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Results',
        icon: '/action-explore.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/action-close.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('PPTX Translator Pro', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action)
  
  event.notification.close()
  
  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Handle queued translations (placeholder)
async function handleQueuedTranslations() {
  console.log('🔄 Processing queued translations...')
  
  try {
    // Get queued requests from IndexedDB or localStorage
    // Process them when network is available
    
    console.log('✅ Queued translations processed')
  } catch (error) {
    console.error('❌ Failed to process queued translations:', error)
  }
}

// Periodic background sync (future feature)
self.addEventListener('periodicsync', (event) => {
  console.log('⏰ Periodic sync:', event.tag)
  
  if (event.tag === 'check-translations') {
    event.waitUntil(
      // Check for completed translations
      checkTranslationStatus()
    )
  }
})

async function checkTranslationStatus() {
  console.log('🔍 Checking translation status...')
  // Implementation for checking translation progress
}

// Message handling from main app
self.addEventListener('message', (event) => {
  console.log('💬 Message received:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})

console.log('🚀 PPTX Translator Pro Service Worker loaded')