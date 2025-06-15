import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../App.tsx'
import '../styles/globals.css'

// Development mode detection
const isDevelopment = import.meta.env.DEV

// Service Worker registration for PWA
if ('serviceWorker' in navigator && !isDevelopment) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('❌ SW registration failed: ', registrationError)
      })
  })
}

// Global error handling
window.addEventListener('error', (event) => {
  console.error('🚨 Global error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason)
})

// App initialization
console.log('🚀 PPTX Translator Pro initializing...')
console.log('📍 Environment:', isDevelopment ? 'Development' : 'Production')
console.log('🌐 URL:', window.location.href)

// React 18 Root API
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Development helpers
if (isDevelopment) {
  console.log('🔧 Development mode active')
  console.log('💡 Press F12 to open DevTools')
  console.log('🎯 Enable debug mode: localStorage.setItem("debug", "true")')
}

// Production optimizations
if (!isDevelopment) {
  console.log('🚀 Production mode active')
  // Disable console.log in production (optional)
  // console.log = () => {}
}