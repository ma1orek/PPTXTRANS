import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './components'),
      '@/hooks': path.resolve(__dirname, './hooks'),  
      '@/services': path.resolve(__dirname, './services'),
      '@/styles': path.resolve(__dirname, './styles')
    }
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react'],
          'jszip-vendor': ['jszip']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['jszip', 'react', 'react-dom']
  },
  server: {
    port: 3000,
    host: true
  },
  define: {
    // Ensure process.env is available if needed
    'process.env': {}
  }
})