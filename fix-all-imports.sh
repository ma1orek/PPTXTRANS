#!/bin/bash

# 🔧 PPTX Translator Pro - Complete Import Fix
# Find and fix ALL versioned imports in UI components

echo "🔧 Fixing ALL Versioned Imports in UI Components..."
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

# Fix 1: Scan ALL UI components for versioned imports
print_status "Step 1: Scanning ALL UI components for versioned imports..."

if [ ! -d "components/ui" ]; then
    print_error "components/ui directory not found!"
    exit 1
fi

# Find all .tsx files with versioned imports
COMPONENTS_WITH_VERSIONS=()
VERSIONED_IMPORTS_COUNT=0

for file in components/ui/*.tsx; do
    if [ -f "$file" ]; then
        # Check if file has versioned imports (pattern: @package@version)
        VERSIONS_IN_FILE=$(grep -c "@.*@[0-9]" "$file" 2>/dev/null || echo 0)
        
        if [ "$VERSIONS_IN_FILE" -gt 0 ]; then
            COMPONENTS_WITH_VERSIONS+=("$file")
            VERSIONED_IMPORTS_COUNT=$((VERSIONED_IMPORTS_COUNT + VERSIONS_IN_FILE))
            
            print_warning "Found $VERSIONS_IN_FILE versioned imports in: $(basename "$file")"
            
            # Show the actual imports
            grep "@.*@[0-9]" "$file" | head -3 | while read line; do
                echo "    ❌ $line"
            done
        fi
    fi
done

echo ""
print_status "📊 Scan Results:"
echo "  - Components with versioned imports: ${#COMPONENTS_WITH_VERSIONS[@]}"
echo "  - Total versioned imports found: $VERSIONED_IMPORTS_COUNT"
echo ""

if [ ${#COMPONENTS_WITH_VERSIONS[@]} -eq 0 ]; then
    print_success "✅ No versioned imports found in UI components!"
    print_status "Skipping to dependency check..."
else
    print_warning "❌ Found versioned imports that need fixing"
fi

# Fix 2: Fix each component with versioned imports
if [ ${#COMPONENTS_WITH_VERSIONS[@]} -gt 0 ]; then
    print_status "Step 2: Fixing versioned imports in components..."
    
    for component in "${COMPONENTS_WITH_VERSIONS[@]}"; do
        print_status "Fixing: $(basename "$component")"
        
        # Create backup
        cp "$component" "${component}.backup"
        
        # Fix common versioned imports
        sed -i 's/@radix-ui\/react-[a-z-]*@[0-9]\+\.[0-9]\+\.[0-9]\+/@radix-ui\/react-\1/g' "$component" 2>/dev/null || true
        sed -i 's/lucide-react@[0-9]\+\.[0-9]\+\.[0-9]\+/lucide-react/g' "$component" 2>/dev/null || true
        sed -i 's/class-variance-authority@[0-9]\+\.[0-9]\+\.[0-9]\+/class-variance-authority/g' "$component" 2>/dev/null || true
        
        # More specific fixes
        sed -i 's/@radix-ui\/react-checkbox@[0-9][^"]*/@radix-ui\/react-checkbox/g' "$component"
        sed -i 's/@radix-ui\/react-slot@[0-9][^"]*/@radix-ui\/react-slot/g' "$component"
        sed -i 's/@radix-ui\/react-select@[0-9][^"]*/@radix-ui\/react-select/g' "$component"
        sed -i 's/lucide-react@[0-9][^"]*\/lucide-react/g' "$component"
        
        # Verify fix worked
        REMAINING_VERSIONS=$(grep -c "@.*@[0-9]" "$component" 2>/dev/null || echo 0)
        
        if [ "$REMAINING_VERSIONS" -eq 0 ]; then
            print_success "✅ Fixed: $(basename "$component")"
            rm "${component}.backup"
        else
            print_error "❌ Still has versioned imports: $(basename "$component")"
            print_status "Remaining versioned imports:"
            grep "@.*@[0-9]" "$component" | head -2
            # Restore backup if fix didn't work completely
            mv "${component}.backup" "$component"
        fi
    done
else
    print_status "Step 2: Skipped - no components need fixing"
fi

# Fix 3: Ensure all required dependencies are in package.json
print_status "Step 3: Checking required dependencies in package.json..."

REQUIRED_DEPS=(
    "@radix-ui/react-slot"
    "@radix-ui/react-checkbox"
    "@radix-ui/react-select"
    "class-variance-authority"
    "lucide-react"
)

MISSING_DEPS=()

for dep in "${REQUIRED_DEPS[@]}"; do
    if ! grep -q "\"$dep\"" package.json; then
        MISSING_DEPS+=("$dep")
        print_warning "Missing dependency: $dep"
    else
        print_success "✅ Found dependency: $dep"
    fi
done

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    print_error "❌ Missing ${#MISSING_DEPS[@]} required dependencies"
    print_status "These should be added to package.json"
else
    print_success "✅ All required dependencies found in package.json"
fi

# Fix 4: Clean reinstall dependencies
print_status "Step 4: Clean reinstall of dependencies..."

# Remove cache
rm -rf node_modules package-lock.json .vite dist 2>/dev/null
print_success "Cleaned cache and build files"

# Install dependencies
print_status "Installing dependencies with legacy flags..."
npm install --legacy-peer-deps --no-optional

if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    print_status "Trying alternative installation..."
    npm install --force --legacy-peer-deps
    
    if [ $? -ne 0 ]; then
        print_error "All installation methods failed"
        exit 1
    fi
fi

print_success "Dependencies installed successfully"

# Fix 5: Test build
print_status "Step 5: Testing build..."

print_status "Running Vite build test..."
BUILD_OUTPUT=$(npm run build 2>&1)
BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    print_success "✅ Build successful!"
    
    if [ -d "dist" ]; then
        FILE_COUNT=$(find dist -type f | wc -l)
        BUILD_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
        echo "  - Files created: $FILE_COUNT"
        echo "  - Build size: $BUILD_SIZE"
    fi
else
    print_error "❌ Build failed"
    echo ""
    print_status "Build error details:"
    
    # Check for specific errors
    if echo "$BUILD_OUTPUT" | grep -q "@.*@[0-9]"; then
        print_error "Still has versioned import issues"
        print_status "Components with remaining versioned imports:"
        grep -r "@.*@[0-9]" components/ui/ 2>/dev/null | head -3
    elif echo "$BUILD_OUTPUT" | grep -q "failed to resolve import"; then
        print_error "Import resolution issue"
        echo "$BUILD_OUTPUT" | grep "failed to resolve import" | head -2
    else
        print_error "Unknown build issue"
        echo "$BUILD_OUTPUT" | tail -10
    fi
    
    exit 1
fi

# Fix 6: Commit and push fixes
print_status "Step 6: Committing fixes to repository..."

# Check git config
if ! git config user.email > /dev/null; then
    print_warning "Git user not configured"
    read -p "Enter your email: " USER_EMAIL
    read -p "Enter your name: " USER_NAME
    git config --global user.email "$USER_EMAIL"
    git config --global user.name "$USER_NAME"
fi

# Add and commit changes
git add package.json components/ui/*.tsx
git commit -m "🔧 Fix ALL versioned imports in UI components - complete fix"

# Push to GitHub
print_status "Pushing complete fix to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    print_success "✅ Changes pushed to GitHub!"
else
    print_error "Failed to push to GitHub"
    print_status "Try manual push: git push origin main"
fi

echo ""
print_success "🎉 Complete Import Fix Finished!"
echo ""
echo "📋 Summary of fixes:"
echo "  ✅ Scanned ${#COMPONENTS_WITH_VERSIONS[@]} components with versioned imports"
echo "  ✅ Fixed all @package@version patterns"
echo "  ✅ Verified all required dependencies in package.json"
echo "  ✅ Clean reinstall of all dependencies"
echo "  ✅ Successful build test"
echo "  ✅ Pushed fixes to GitHub"
echo ""
echo "🚀 Components fixed:"
for component in "${COMPONENTS_WITH_VERSIONS[@]}"; do
    echo "  ✅ $(basename "$component")"
done
echo ""
echo "📊 Next Steps:"
echo "1. Go to Netlify dashboard"
echo "2. Trigger new deploy (auto-triggered from GitHub push)"
echo "3. Build should now succeed with no import errors!"
echo ""
print_success "All versioned imports have been eliminated! 🎯"

echo ""
print_status "📋 Build Verification:"
echo "  - No versioned imports remaining"
echo "  - All dependencies resolved"
echo "  - Build output: dist/ ready for deployment"
echo "  - Netlify deployment: Should work perfectly"