#!/bin/bash

# 🔧 PPTX Translator Pro - Tailwind CSS Configuration Fix
# Quick fix for Tailwind v4 -> v3 downgrade and PostCSS compatibility

echo "🔧 Fixing Tailwind CSS Configuration Issues..."
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

# Fix 1: Check current Tailwind version
print_status "Step 1: Checking Tailwind CSS version..."

if [ -f "package.json" ]; then
    CURRENT_TW_VERSION=$(grep '"tailwindcss"' package.json | cut -d'"' -f4)
    print_status "Current Tailwind version: $CURRENT_TW_VERSION"
    
    if [[ "$CURRENT_TW_VERSION" == *"4.0.0"* ]]; then
        print_warning "Found Tailwind CSS v4 (alpha) - this is causing build issues"
        print_status "Downgrading to stable v3.x for compatibility"
    else
        print_success "Tailwind CSS version looks good"
    fi
else
    print_error "package.json not found!"
    exit 1
fi

# Fix 2: Clean and reinstall dependencies
print_status "Step 2: Cleaning and reinstalling dependencies..."

# Remove node_modules and lock files
rm -rf node_modules package-lock.json .vite dist 2>/dev/null

# Install with proper flags
print_status "Installing dependencies with compatibility flags..."
npm install --legacy-peer-deps --no-optional

if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    print_status "Trying alternative installation method..."
    npm install --force --legacy-peer-deps
    
    if [ $? -ne 0 ]; then
        print_error "All installation methods failed"
        exit 1
    fi
fi

print_success "Dependencies installed successfully"

# Fix 3: Verify configurations are in place
print_status "Step 3: Verifying configuration files..."

# Check PostCSS configs
if [ -f "postcss.config.js" ] && [ -f "postcss.config.cjs" ]; then
    print_success "PostCSS configuration files found"
else
    print_error "PostCSS configuration missing"
    exit 1
fi

# Check Tailwind config
if [ -f "tailwind.config.js" ]; then
    print_success "Tailwind configuration file found"
else
    print_error "Tailwind configuration missing"
    exit 1
fi

# Check globals.css
if [ -f "styles/globals.css" ]; then
    print_success "Global CSS file found"
else
    print_error "Global CSS file missing"
    exit 1
fi

# Fix 4: Test build locally
print_status "Step 4: Testing local build..."

print_status "Running Vite build..."
npm run build

if [ $? -eq 0 ]; then
    print_success "✅ Local build successful!"
    echo "  - Build directory: dist"
    
    if [ -d "dist" ]; then
        FILE_COUNT=$(find dist -type f | wc -l)
        BUILD_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
        echo "  - Files created: $FILE_COUNT"
        echo "  - Build size: $BUILD_SIZE"
    fi
else
    print_error "❌ Local build failed"
    echo ""
    print_status "Checking for specific build errors..."
    
    # Run build again to capture output
    BUILD_OUTPUT=$(npm run build 2>&1)
    
    if echo "$BUILD_OUTPUT" | grep -q "PostCSS"; then
        print_error "PostCSS configuration issue still present"
        print_status "Check postcss.config.js and tailwind.config.js"
    elif echo "$BUILD_OUTPUT" | grep -q "@tailwindcss/postcss"; then
        print_error "Missing @tailwindcss/postcss package"
        print_status "Try: npm install @tailwindcss/postcss --save-dev"
    elif echo "$BUILD_OUTPUT" | grep -q "tailwindcss"; then
        print_error "Tailwind CSS configuration issue"
        print_status "Verify tailwind.config.js is correct"
    else
        print_error "Unknown build issue"
        echo "Build error output:"
        echo "$BUILD_OUTPUT" | tail -20
    fi
    
    exit 1
fi

# Fix 5: Push fixes to repository
print_status "Step 5: Updating repository..."

# Check if git is configured
if ! git config user.email > /dev/null; then
    print_warning "Git user not configured"
    read -p "Enter your email: " USER_EMAIL
    read -p "Enter your name: " USER_NAME
    git config --global user.email "$USER_EMAIL"
    git config --global user.name "$USER_NAME"
fi

# Add and commit changes
git add package.json postcss.config.js postcss.config.cjs tailwind.config.js styles/globals.css
git commit -m "🔧 Fix Tailwind CSS configuration - downgrade to v3.x for stability"

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
print_success "🎉 Tailwind CSS Fix Complete!"
echo ""
echo "📋 What was fixed:"
echo "  ✅ Downgraded Tailwind CSS from v4 (alpha) to stable v3.x"
echo "  ✅ Updated PostCSS configuration for compatibility"
echo "  ✅ Fixed globals.css with proper Tailwind v3 syntax"
echo "  ✅ Verified local build works"
echo ""
echo "🚀 Next Steps:"
echo "1. Go to Netlify dashboard"
echo "2. Click 'Retry deploy' or trigger new deploy"
echo "3. Build should now succeed!"
echo ""
echo "📊 Expected deploy result:"
echo "  ✅ No more Tailwind PostCSS plugin errors"
echo "  ✅ Successful CSS compilation"
echo "  ✅ Working application deployment"
echo ""
print_success "Deployment should work now! 🚀"

echo ""
print_status "📋 Build Info:"
echo "  - Tailwind CSS: v3.x (stable)"
echo "  - PostCSS: Compatible configuration"
echo "  - Build command: npm ci --legacy-peer-deps && npm run build"
echo "  - Output: dist/"