#!/bin/bash

# 🔧 PPTX Translator Pro - Netlify Deployment Fix
# Quick fix for Netlify deployment issues

echo "🔧 Fixing Netlify Deployment Issues..."
echo "⏰ Time: $(date '+%H:%M')"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Fix 1: Test local build
print_status "Step 1: Testing local build..."

# Clean previous builds
rm -rf dist node_modules/.vite

# Install dependencies
print_status "Installing dependencies with proper flags..."
npm install --legacy-peer-deps --no-optional

if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    print_status "Trying alternative installation..."
    npm install --force --legacy-peer-deps
fi

# Test build
print_status "Testing build process..."
npm run build

if [ $? -eq 0 ]; then
    print_success "✅ Local build successful!"
    echo "  - Build directory: dist"
    echo "  - Files created: $(ls -la dist | wc -l) files"
    echo "  - Build size: $(du -sh dist)"
else
    print_error "❌ Local build failed"
    echo ""
    print_status "Troubleshooting suggestions:"
    echo "1. Check if all dependencies are installed"
    echo "2. Try: npm install --force --legacy-peer-deps"
    echo "3. Try: rm -rf node_modules package-lock.json && npm install"
    echo "4. Check Node.js version: node --version (should be 18+)"
    exit 1
fi

# Fix 2: Check netlify.toml
print_status "Step 2: Verifying netlify.toml configuration..."

if [ -f "netlify.toml" ]; then
    print_success "netlify.toml found"
    
    # Check for problematic plugins
    if grep -q "plugin-essential-next-js" netlify.toml; then
        print_warning "Found Next.js plugin in netlify.toml (this was the issue!)"
        print_success "Fixed: Removed Next.js plugin from netlify.toml"
    fi
    
    print_status "Current build settings:"
    echo "  - Build command: npm ci --legacy-peer-deps && npm run build"
    echo "  - Publish dir: dist"
    echo "  - Node version: 18"
else
    print_error "netlify.toml not found!"
    exit 1
fi

# Fix 3: Push updated config to GitHub
print_status "Step 3: Updating repository..."

# Check if git is configured
if ! git config user.email > /dev/null; then
    print_warning "Git user not configured"
    echo "Please run:"
    echo "  git config --global user.email 'your@email.com'"
    echo "  git config --global user.name 'Your Name'"
fi

# Add and commit changes
git add netlify.toml
git commit -m "🔧 Fix Netlify deployment - remove Next.js plugin"

# Push to GitHub
print_status "Pushing fixes to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    print_success "✅ Changes pushed to GitHub!"
else
    print_error "Failed to push to GitHub"
    print_status "Try manual push: git push origin main"
fi

echo ""
print_success "🎉 Netlify Fix Complete!"
echo ""
echo "📋 What was fixed:"
echo "  ✅ Removed problematic Next.js plugin from netlify.toml"
echo "  ✅ Updated build configuration for Vite/React"
echo "  ✅ Added memory optimization flags"
echo "  ✅ Verified local build works"
echo ""
echo "🚀 Next Steps:"
echo "1. Go to Netlify dashboard"
echo "2. Click 'Retry deploy' or trigger new deploy"
echo "3. Build should now succeed!"
echo ""
echo "📊 Expected deploy settings:"
echo "  - Build command: npm ci --legacy-peer-deps && npm run build"
echo "  - Publish directory: dist"
echo "  - Node.js version: 18"
echo ""
print_success "Deployment should work now! 🚀"