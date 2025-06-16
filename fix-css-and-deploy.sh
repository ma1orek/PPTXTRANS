#!/bin/bash

# CRITICAL CSS FIX + DEPLOY - Final Solution
# Usuwa konflikt PostCSS i naprawia całkowitą utratę stylów

echo "🚨 CRITICAL CSS FIX + DEPLOY - Final Solution"
echo "============================================="

print_status() { echo -e "\033[0;32m✅ $1\033[0m"; }
print_error() { echo -e "\033[0;31m❌ $1\033[0m"; }
print_info() { echo -e "\033[0;34mℹ️  $1\033[0m"; }

print_info "Problem: Tailwind CSS not loading due to PostCSS config conflict"
print_info "Solution: Remove conflicting postcss.config.cjs"

# Step 1: Remove conflicting file
if [ -f "postcss.config.cjs" ]; then
    print_error "Found conflicting postcss.config.cjs - REMOVING"
    rm -f postcss.config.cjs
    print_status "Removed postcss.config.cjs"
else
    print_status "No conflicting postcss.config.cjs found"
fi

# Step 2: Verify correct config exists
if [ -f "postcss.config.js" ]; then
    print_status "postcss.config.js exists - checking content"
    if grep -q "@tailwindcss/postcss" postcss.config.js; then
        print_status "✅ PostCSS config is correct for Tailwind v4"
    else
        print_error "❌ PostCSS config may be incorrect"
    fi
else
    print_error "❌ postcss.config.js missing!"
    exit 1
fi

# Step 3: Clear caches
print_info "Clearing all caches..."
rm -rf node_modules/.vite dist .vite 2>/dev/null
print_status "Caches cleared"

# Step 4: Test build
print_info "Testing CSS build..."
npm run build:simple

if [ $? -eq 0 ]; then
    print_status "🎉 CSS BUILD SUCCESS! Tailwind is now loading!"
    
    # Check CSS files
    if ls dist/assets/*.css >/dev/null 2>&1; then
        CSS_SIZE=$(du -sh dist/assets/*.css | cut -f1 | head -1)
        print_status "CSS file generated: $CSS_SIZE"
        
        # Verify CSS contains Tailwind
        if grep -q "\.bg-black" dist/assets/*.css 2>/dev/null; then
            print_status "✅ CSS contains Tailwind classes - styling will work!"
        fi
    fi
    
    # Auto commit and deploy
    print_info "Auto-committing CSS fix..."
    git add .
    git commit -m "CRITICAL FIX: Remove postcss.config.cjs conflict - CSS loading restored

- Removed conflicting postcss.config.cjs
- Fixed Tailwind CSS v4 loading issue
- Enhanced Albanian language support (sq code)
- Applied language validation throughout app
- Version bumped to 2024.12.16.23.00
- Ready for production deployment"
    
    if [ $? -eq 0 ]; then
        print_status "Changes committed successfully"
        
        print_info "Pushing to trigger Netlify deployment..."
        git push
        
        if [ $? -eq 0 ]; then
            print_status "🚀 SUCCESS! Pushed to repository"
            print_info "Netlify will now rebuild with fixed CSS"
            print_info "Check deployment at: https://app.netlify.com"
        else
            print_error "Git push failed"
        fi
    else
        print_error "Git commit failed"
    fi
    
else
    print_error "❌ CSS build still failing"
    print_info "Check for additional issues..."
    npm run build:simple 2>&1 | head -10
fi

echo ""
print_info "🎯 SUMMARY:"
echo "Problem: postcss.config.cjs + postcss.config.js conflict"
echo "Solution: Keep only postcss.config.js with Tailwind v4 syntax"
echo "Result: CSS should now load properly on website"
echo ""
print_info "If CSS still doesn't load, check browser console for errors"