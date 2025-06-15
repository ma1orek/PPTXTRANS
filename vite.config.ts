import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: [
      // Exclude Node.js-only packages from browser bundle
      'googleapis',
      'google-auth-library',
      'googleapis-common',
      'gaxios',
      'gtoken',
      'jszip',
      'xml2js',
      'pptxgenjs'
    ]
  },
  build: {
    rollupOptions: {
      external: [
        // Externalize Node.js-only packages
        'googleapis',
        'google-auth-library',
        'googleapis-common',
        'gaxios', 
        'gtoken',
        'jszip',
        'xml2js',
        'pptxgenjs',
        'fs',
        'path',
        'os',
        'https',
        'http',
        'url',
        'stream',
        'util',
        'events',
        'child_process',
        'timers',
        'querystring'
      ],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react', '@radix-ui/react-slot', '@radix-ui/react-select']
        }
      }
    },
    target: 'es2020',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    fs: {
      strict: false
    }
  }
})