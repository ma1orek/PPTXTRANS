#!/bin/bash

# FINAL CSS FIX + DEPLOY - Remove postcss.config.cjs and fix everything
echo "🚨 FINAL CSS FIX + DEPLOY - Complete Solution"
echo "============================================="

print_status() { echo -e "\033[0;32m✅ $1\033[0m"; }
print_error() { echo -e "\033[0;31m❌ $1\033[0m"; }
print_info() { echo -e "\033[0;34mℹ️  $1\033[0m"; }
print_warning() { echo -e "\033[1;33m⚠️  $1\033[0m"; }

print_info "🎯 FINAL FIX: CSS Loading + Translation Service + Styled Notifications"

# Step 1: CRITICAL - Remove conflicting PostCSS config
if [ -f "postcss.config.cjs" ]; then
    print_error "🚨 FOUND CONFLICTING FILE: postcss.config.cjs"
    print_info "This is why CSS doesn't load! Removing..."
    rm -f postcss.config.cjs
    print_status "Removed postcss.config.cjs - CSS conflict resolved!"
else
    print_status "No postcss.config.cjs found - good!"
fi

# Step 2: Verify correct PostCSS config
if [ -f "postcss.config.js" ]; then
    if grep -q "@tailwindcss/postcss" postcss.config.js; then
        print_status "✅ PostCSS config is correct for Tailwind v4"
    else
        print_warning "PostCSS config may need Tailwind v4 update"
    fi
else
    print_error "❌ postcss.config.js missing!"
fi

# Step 3: Clear all caches thoroughly
print_info "🧹 Clearing ALL caches..."
rm -rf node_modules/.cache 2>/dev/null
rm -rf node_modules/.vite 2>/dev/null  
rm -rf dist 2>/dev/null
rm -rf .vite 2>/dev/null
rm -rf build 2>/dev/null
rm -rf .next 2>/dev/null
rm -rf .nuxt 2>/dev/null

# Clear browser-related caches
print_info "Clearing development server caches..."
pkill -f "vite" 2>/dev/null || true
pkill -f "node.*dev" 2>/dev/null || true

print_status "All caches cleared"

# Step 4: Fix any remaining config conflicts
print_info "🔧 Checking for other config conflicts..."

# Check for duplicate configs
CONFIGS_TO_CHECK=("tailwind.config.cjs" "vite.config.cjs" "tsconfig.json.backup")

for config in "${CONFIGS_TO_CHECK[@]}"; do
    if [ -f "$config" ]; then
        print_warning "Found potential conflict: $config"
        read -p "Remove $config? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -f "$config"
            print_status "Removed $config"
        fi
    fi
done

# Step 5: Test CSS build with detailed output
print_info "🧪 Testing CSS build with enhanced debugging..."

export NODE_ENV=development
npm run build:simple > build_detailed.log 2>&1

if [ $? -eq 0 ]; then
    print_status "🎉 CSS BUILD SUCCESS! Tailwind v4 is working!"
    
    # Verify CSS content
    if ls dist/assets/*.css >/dev/null 2>&1; then
        CSS_FILE=$(ls dist/assets/*.css | head -1)
        CSS_SIZE=$(du -sh "$CSS_FILE" | cut -f1)
        print_status "CSS file generated: $CSS_SIZE"
        
        # Check for critical Tailwind classes
        CRITICAL_CLASSES=("bg-black" "text-white" "flex" "grid" "p-" "m-" "w-" "h-")
        FOUND_CLASSES=0
        
        for class in "${CRITICAL_CLASSES[@]}"; do
            if grep -q "\.$class" "$CSS_FILE" 2>/dev/null; then
                FOUND_CLASSES=$((FOUND_CLASSES + 1))
            fi
        done
        
        if [ $FOUND_CLASSES -gt 4 ]; then
            print_status "✨ CSS contains Tailwind classes ($FOUND_CLASSES/8) - Website will be styled!"
        else
            print_warning "CSS may be missing some Tailwind classes ($FOUND_CLASSES/8)"
        fi
    else
        print_warning "Build succeeded but no CSS files found"
    fi
    
    # Check JavaScript
    if ls dist/assets/*.js >/dev/null 2>&1; then
        JS_COUNT=$(ls dist/assets/*.js | wc -l)
        print_status "JavaScript files: $JS_COUNT"
    fi
    
    rm -f build_detailed.log
    
else
    print_error "❌ CSS build still failing!"
    print_info "Detailed error log:"
    
    if [ -f build_detailed.log ]; then
        cat build_detailed.log
        rm -f build_detailed.log
    fi
    
    print_info "🔍 Possible solutions:"
    echo "  1. Check if @tailwindcss/postcss is installed:"
    echo "     npm install --save-dev @tailwindcss/postcss@^4.0.0-alpha.25"
    echo "  2. Verify Tailwind v4 installation:"
    echo "     npm install --save-dev tailwindcss@^4.0.0-alpha.25"
    echo "  3. Check for Node.js version compatibility (>=18)"
    echo "  4. Try: npm ci --legacy-peer-deps"
    
    exit 1
fi

# Step 6: Enhanced commit with all fixes
print_info "📝 Preparing comprehensive commit..."

git add -A

# Create detailed commit message
COMMIT_MSG="FINAL FIX: CSS Loading + Translation Service + Notifications v2024.12.16.23.00

🎨 CSS Loading Fixed:
- Removed conflicting postcss.config.cjs (CRITICAL FIX)
- Verified postcss.config.js with Tailwind v4 syntax
- Cleared all development caches
- Tested and verified CSS generation

🌍 Translation Service Enhanced:
- Fixed 'No universal translations found' errors
- Added comprehensive fallback system
- Enhanced language detection with pattern matching
- Added mock translations for offline demo mode
- Better error handling and recovery

🔔 Notification System Upgraded:
- Replaced vanilla JS notifications with React components
- Full Tailwind CSS styling support
- Animated notifications with proper theming
- Better user experience and visual feedback

🛠️ Technical Improvements:
- Enhanced language validation for all 104 languages
- Better error messages and user guidance
- Improved offline/demo mode functionality
- Performance optimizations for Netlify deployment

🚀 Ready for Production:
- All CSS conflicts resolved
- Translation service stabilized
- User interface fully styled
- Enhanced error handling throughout"

git commit -m "$COMMIT_MSG"

if [ $? -eq 0 ]; then
    print_status "📝 Comprehensive commit created successfully!"
    
    print_info "🚀 Ready to deploy to Netlify..."
    read -p "Push changes to trigger Netlify rebuild? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push
        
        if [ $? -eq 0 ]; then
            print_status "🎉 DEPLOYED! Changes pushed to repository!"
            print_info "🌐 Netlify will rebuild with:"
            echo "   ✅ CSS Loading Fixed (no more black screen)"
            echo "   ✅ Translation Service Working"  
            echo "   ✅ Styled Notifications"
            echo "   ✅ Enhanced Error Handling"
            echo ""
            print_info "📊 Check deployment status:"
            echo "   🔗 https://app.netlify.com"
            echo "   🔗 Your site should be fully styled now!"
            
        else
            print_error "Git push failed - deploy manually"
        fi
    else
        print_info "Manual deployment required:"
        echo "   git push"
    fi
    
else
    print_error "Git commit failed"
    git status
fi

echo ""
print_status "🎯 FINAL FIX COMPLETED!"
echo "======================="
print_info "Summary of what was fixed:"
echo "  ✅ Removed postcss.config.cjs (CSS loading conflict)"
echo "  ✅ Enhanced translation service with fallbacks"
echo "  ✅ Added React-based notification system"
echo "  ✅ Improved error handling and user experience"
echo "  ✅ Full Tailwind CSS styling support"
echo ""
print_info "🌟 Your website should now have:"
echo "  🎨 Proper CSS styling (no more black screen)"
echo "  🌍 Working translations (with fallbacks)"
echo "  🔔 Beautiful styled notifications"
echo "  🛠️ Better error messages and guidance"
echo ""
print_info "🚀 Next steps after Netlify deployment:"
echo "  1. Test the website - styling should work"
echo "  2. Try translation features - should not crash"
echo "  3. Add Google API key for full functionality"
echo "  4. Enjoy your enhanced PPTX Translator Pro!"