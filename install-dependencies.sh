#!/bin/bash

# PPTX Translator Pro - Dependency Installation Script
echo "🚀 Installing PPTX Translator Pro Dependencies..."
echo "================================================"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

echo "📦 Installing required dependencies..."

# Core dependencies
echo "Installing core React dependencies..."
npm install react@^18.2.0 react-dom@^18.2.0

# UI and styling dependencies  
echo "Installing UI components..."
npm install lucide-react@^0.263.1 clsx@^2.0.0 class-variance-authority@^0.7.0 tailwind-merge@^1.14.0

# Radix UI components
echo "Installing Radix UI components..."
npm install @radix-ui/react-accordion@^1.1.2 @radix-ui/react-alert-dialog@^1.0.4 @radix-ui/react-aspect-ratio@^1.0.3 @radix-ui/react-avatar@^1.0.3 @radix-ui/react-checkbox@^1.0.4 @radix-ui/react-collapsible@^1.0.3 @radix-ui/react-dialog@^1.0.4 @radix-ui/react-dropdown-menu@^2.0.5 @radix-ui/react-hover-card@^1.0.6 @radix-ui/react-label@^2.0.2 @radix-ui/react-menubar@^1.0.3 @radix-ui/react-navigation-menu@^1.1.3 @radix-ui/react-popover@^1.0.6 @radix-ui/react-progress@^1.0.3 @radix-ui/react-radio-group@^1.1.3 @radix-ui/react-scroll-area@^1.0.4 @radix-ui/react-select@^1.2.2 @radix-ui/react-separator@^1.0.3 @radix-ui/react-slider@^1.1.2 @radix-ui/react-switch@^1.0.3 @radix-ui/react-tabs@^1.0.4 @radix-ui/react-toast@^1.1.4 @radix-ui/react-toggle@^1.0.3 @radix-ui/react-toggle-group@^1.0.4 @radix-ui/react-tooltip@^1.0.6

# Additional UI dependencies
echo "Installing additional UI libraries..."
npm install cmdk@^0.2.0 date-fns@^2.30.0 embla-carousel-react@^8.0.0 input-otp@^1.2.4 react-day-picker@^8.8.0 react-hook-form@^7.45.4 react-resizable-panels@^0.0.55 recharts@^2.7.2 sonner@^1.0.3 vaul@^0.7.0

# Form handling
echo "Installing form libraries..."
npm install @hookform/resolvers@^3.3.1 zod@^3.22.2

# CRITICAL: PPTX Processing Dependencies
echo "🔥 Installing PPTX processing libraries (REQUIRED FOR FUNCTIONALITY)..."
npm install googleapis@^126.0.1 jszip@^3.10.1 xml2js@^0.6.2 pptxgenjs@^3.12.0

# Development dependencies
echo "Installing development dependencies..."
npm install --save-dev @types/react@^18.2.0 @types/react-dom@^18.2.0 @types/xml2js@^0.4.14 @vitejs/plugin-react@^4.0.0 typescript@^5.0.0 vite@^4.4.0

# Tailwind CSS v4
echo "Installing Tailwind CSS v4..."
npm install --save-dev tailwindcss@^4.0.0-alpha.1 @tailwindcss/vite@^4.0.0-alpha.1

echo ""
echo "✅ All dependencies installed successfully!"
echo ""
echo "🔧 Next steps:"
echo "1. Run 'npm run dev' to start the development server"
echo "2. Open your browser to the development URL"
echo "3. Upload a PPTX file and select target languages"
echo "4. The app will process your presentation and provide translated versions"
echo ""
echo "📝 Note: The app will work in mock mode if Google APIs are not properly configured."
echo "   For production use, ensure your Google Cloud project has the required APIs enabled."
echo ""
echo "🌟 PPTX Translator Pro is ready to use!"