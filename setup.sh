#!/bin/bash

# 🚀 PPTX Translator Pro - Automatic Setup Script
# Bartosz Idzik Enterprise Ecosystem

echo "🚀 PPTX Translator Pro - Setup Started"
echo "⏰ Current Time: $(date '+%H:%M')"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
print_status "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed!"
    echo "Please install Node.js from: https://nodejs.org/"
    echo "Recommended version: 18.x or higher"
    exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js found: $NODE_VERSION"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed!"
    exit 1
fi

NPM_VERSION=$(npm --version)
print_success "npm found: $NPM_VERSION"

# Clean previous installations
print_status "Cleaning previous installations..."
rm -rf node_modules
rm -f package-lock.json

# Install dependencies with specific flags to avoid conflicts
print_status "Installing dependencies..."
print_warning "This may take 2-3 minutes..."

# Use --legacy-peer-deps to avoid dependency conflicts
npm install --legacy-peer-deps --no-optional

if [ $? -eq 0 ]; then
    print_success "✅ Dependencies installed successfully!"
else
    print_error "❌ Failed to install dependencies"
    echo ""
    print_status "Trying alternative installation method..."
    
    # Try with yarn if available
    if command -v yarn &> /dev/null; then
        print_status "Using Yarn as fallback..."
        yarn install --ignore-engines
    else
        # Try with --force flag
        print_status "Retrying with --force flag..."
        npm install --force --legacy-peer-deps
    fi
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating .env file..."
    cat > .env << EOL
# PPTX Translator Pro Environment Variables
VITE_APP_NAME="PPTX Translator Pro"
VITE_APP_VERSION="1.0.0"
VITE_GOOGLE_API_ENABLED=false
VITE_MOCK_MODE=true
EOL
    print_success ".env file created"
fi

# Check if build works
print_status "Testing build process..."
npm run build

if [ $? -eq 0 ]; then
    print_success "✅ Build test successful!"
else
    print_warning "⚠️ Build test failed, but app should still work in development"
fi

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Start development server: ${GREEN}npm run dev${NC}"
echo "2. Open browser to: ${BLUE}http://localhost:5173${NC}"
echo "3. For deployment: ${YELLOW}npm run deploy${NC}"
echo ""
echo "📚 Deployment Options:"
echo "• Netlify: Push to GitHub → Connect → Deploy"
echo "• Vercel: Import GitHub repo → Auto-deploy"
echo "• Manual: npm run build → upload 'dist' folder"
echo ""
echo "🆘 Troubleshooting:"
echo "• If dependencies fail: ${YELLOW}npm install --force --legacy-peer-deps${NC}"
echo "• If build fails: ${YELLOW}npm run build -- --emptyOutDir${NC}"
echo "• For help: Check README.md"
echo ""
print_success "Ready to go! 🚀"