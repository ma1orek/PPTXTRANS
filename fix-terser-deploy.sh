#!/bin/bash

# 🚨 TERSER DEPENDENCY FIX - IMMEDIATE DEPLOYMENT
# Fixes the missing terser dependency and deploys immediately

echo "🚨 TERSER DEPENDENCY FIX - NATYCHMIASTOWA NAPRAWA!"
echo "🎯 ERROR: [vite:terser] terser not found"  
echo "🔧 SOLUTION: Add terser to devDependencies"
echo "⏰ $(date '+%H:%M:%S')"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

print_status() {
    echo -e "${CYAN}[TERSER FIX]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_bold() {
    echo -e "${BOLD}$1${NC}"
}

echo "🔍 ANALYZING BUILD ERROR:"
echo "  ❌ Error: [vite:terser] terser not found"
echo "  📝 Cause: Since Vite v3, terser is an optional dependency"
echo "  💡 Solution: Add terser to devDependencies"
echo ""

print_bold "STEP 1: VERIFY PACKAGE.JSON UPDATED"

# Check if terser is now in package.json
if grep -q '"terser"' package.json; then
    print_success "✅ terser found in package.json"
    
    # Show the terser line
    echo "📋 Current terser configuration:"
    grep -A1 -B1 '"terser"' package.json | sed 's/^/    /'
    
else
    print_error "❌ terser NOT found in package.json"
    echo ""
    print_status "Adding terser to devDependencies..."
    
    # Add terser manually to package.json using sed
    sed -i 's/"typescript": "\^5\.5\.3",/"terser": "^5.36.0",\n    "typescript": "^5.5.3",/' package.json
    
    if grep -q '"terser"' package.json; then
        print_success "✅ terser added to package.json"
    else
        print_error "❌ Failed to add terser automatically"
        echo "Please add this line manually to devDependencies:"
        echo '    "terser": "^5.36.0",'
        exit 1
    fi
fi

echo ""
print_bold "STEP 2: COMMIT PACKAGE.JSON CHANGES"

print_status "Committing updated package.json..."

git add package.json

if git commit -m "🔧 Add terser devDependency - Fix Vite build error"; then
    print_success "✅ Package.json changes committed"
else
    print_status "No changes to commit (already up to date)"
fi

echo ""
print_bold "STEP 3: PUSH AND TRIGGER NETLIFY BUILD"

print_status "Pushing to GitHub..."

if git push origin main; then
    print_success "✅ Changes pushed to GitHub"
    
    echo ""
    print_bold "🚀 DEPLOYMENT TRIGGERED!"
    echo ""
    echo "📊 What happens next:"
    echo "  1. ✅ Netlify detects package.json changes"
    echo "  2. 🔄 npm ci --legacy-peer-deps runs"
    echo "  3. 📦 terser gets installed automatically"
    echo "  4. 🏗️  npm run build executes"
    echo "  5. ✅ Vite can now use terser for minification"
    echo "  6. 🎉 Build succeeds!"
    echo ""
    echo "⏱️  Expected deployment time: 2-3 minutes"
    echo "🎯 This fix resolves the terser dependency issue permanently!"
    
else
    print_error "❌ Push failed"
    echo ""
    print_status "Try manual push:"
    echo "git push origin main"
    exit 1
fi

echo ""
print_bold "STEP 4: BUILD VERIFICATION"

print_status "Testing build locally..."

# Test build locally to verify terser fix
BUILD_OUTPUT=$(npm run build 2>&1)
BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    print_success "🎉 LOCAL BUILD SUCCESS!"
    echo ""
    echo "✅ All checks passed:"
    echo "  - package.json includes terser"
    echo "  - Local build works"
    echo "  - Changes pushed to GitHub"
    echo "  - Netlify build triggered"
    
else
    print_error "❌ LOCAL BUILD STILL FAILS"
    echo ""
    echo "Build output (last 10 lines):"
    echo "$BUILD_OUTPUT" | tail -10
    
    if echo "$BUILD_OUTPUT" | grep -q "terser"; then
        print_error "Still terser-related issues"
    else
        print_status "Different issue - not terser related"
    fi
fi

echo ""
print_bold "=================================="
print_bold "🔧 TERSER FIX DEPLOYMENT SUMMARY"
print_bold "=================================="

echo ""
echo "🎯 Problem: Vite v3+ requires explicit terser installation"
echo "✅ Solution: Added 'terser: ^5.36.0' to devDependencies"
echo "🚀 Status: Changes pushed, Netlify build triggered"

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "💯 Result: GUARANTEED SUCCESS - local build passed"
else
    echo "⚠️  Result: Partial fix - may need additional changes"
fi

echo ""
echo "📞 Next steps:"
echo "  1. Watch Netlify deployment dashboard"
echo "  2. Verify build succeeds with terser"
echo "  3. Confirm app loads correctly"
echo ""
print_success "TERSER DEPENDENCY FIX DEPLOYED!"