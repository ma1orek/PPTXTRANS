import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  
  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './components'),
      '@/services': path.resolve(__dirname, './services'),
      '@/hooks': path.resolve(__dirname, './hooks'),
      '@/styles': path.resolve(__dirname, './styles'),
    },
  },

  // CSS configuration
  css: {
    postcss: './postcss.config.js',
  },

  // Build configuration
  build: {
    // Output directory
    outDir: 'dist',
    
    // Clean output directory before build
    emptyOutDir: true,
    
    // Generate source maps for debugging
    sourcemap: false,
    
    // Optimize build
    minify: 'terser',
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    
    // Rollup options
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // React core
          'react-core': ['react', 'react-dom'],
          
          // UI components
          'ui-components': [
            '@radix-ui/react-select',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover'
          ],
          
          // Icons
          'icons': ['lucide-react'],
        }
      }
    },
    
    // Terser options for minification
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },

  // Development server
  server: {
    host: true,
    port: 5173,
    open: true,
    cors: true,
  },

  // Preview server (for testing builds)
  preview: {
    host: true,
    port: 4173,
    open: true,
  },

  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },

  // Optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'lucide-react',
      '@radix-ui/react-select',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu'
    ],
    exclude: [
      // Exclude heavy optional dependencies from optimization
      'googleapis',
      'jszip', 
      'pptxgenjs',
      'xml2js'
    ]
  },

  // Base path (useful for GitHub Pages or subdirectory deployments)
  base: './',
})