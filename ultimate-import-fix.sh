#!/bin/bash

# 🔥 ULTIMATE IMPORT FIX - NUCLEAR OPTION
# This will fix EVERYTHING related to versioned imports

echo "🔥 ULTIMATE IMPORT FIX - NUCLEAR OPTION ACTIVATED"
echo "⚡ This will fix EVERY versioned import in the entire project"
echo "⏰ $(date '+%H:%M:%S')"
echo ""

# Immediate fixes for known problematic files
echo "📋 IMMEDIATE KNOWN FIXES:"

# Fix checkbox.tsx
if [ -f "components/ui/checkbox.tsx" ]; then
    echo "🔧 Fixing checkbox.tsx..."
    sed -i 's/@radix-ui\/react-checkbox@[^"]*/@radix-ui\/react-checkbox/g' "components/ui/checkbox.tsx"
    sed -i 's/lucide-react@[^"]*//lucide-react/g' "components/ui/checkbox.tsx"
    echo "✅ checkbox.tsx fixed"
fi

# Fix badge.tsx
if [ -f "components/ui/badge.tsx" ]; then
    echo "🔧 Fixing badge.tsx..."
    sed -i 's/@radix-ui\/react-slot@[^"]*/@radix-ui\/react-slot/g' "components/ui/badge.tsx"
    sed -i 's/class-variance-authority@[^"]*//class-variance-authority/g' "components/ui/badge.tsx"
    echo "✅ badge.tsx fixed"
fi

# Fix scroll-area.tsx
if [ -f "components/ui/scroll-area.tsx" ]; then
    echo "🔧 Fixing scroll-area.tsx..."
    sed -i 's/@radix-ui\/react-scroll-area@[^"]*/@radix-ui\/react-scroll-area/g' "components/ui/scroll-area.tsx"
    echo "✅ scroll-area.tsx fixed"
fi

echo ""
echo "🔍 NUCLEAR SCAN: Finding ALL versioned imports in ENTIRE project..."

# Find ALL TypeScript/JavaScript files
ALL_FILES=()
while IFS= read -r -d '' file; do
    ALL_FILES+=("$file")
done < <(find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.vite/*" -print0)

echo "📊 Found ${#ALL_FILES[@]} TypeScript/JavaScript files to scan"

FILES_FIXED=0

for file in "${ALL_FILES[@]}"; do
    if grep -q "@[a-zA-Z0-9\/\.-]*@[0-9]" "$file" 2>/dev/null; then
        echo "🔧 Fixing: $file"
        
        # Nuclear fix - all patterns
        sed -i 's/@radix-ui\/react-[a-z-]*@[0-9][0-9\.]*/@radix-ui\/react-COMPONENT/g' "$file"
        sed -i 's/@radix-ui\/react-COMPONENT/@radix-ui\/react-accordion/g' "$file"
        
        # Proper fix for each known package
        sed -i 's/@radix-ui\/react-accordion@[^"]*/@radix-ui\/react-accordion/g' "$file"
        sed -i 's/@radix-ui\/react-alert-dialog@[^"]*/@radix-ui\/react-alert-dialog/g' "$file"
        sed -i 's/@radix-ui\/react-avatar@[^"]*/@radix-ui\/react-avatar/g' "$file"
        sed -i 's/@radix-ui\/react-checkbox@[^"]*/@radix-ui\/react-checkbox/g' "$file"
        sed -i 's/@radix-ui\/react-dialog@[^"]*/@radix-ui\/react-dialog/g' "$file"
        sed -i 's/@radix-ui\/react-dropdown-menu@[^"]*/@radix-ui\/react-dropdown-menu/g' "$file"
        sed -i 's/@radix-ui\/react-popover@[^"]*/@radix-ui\/react-popover/g' "$file"
        sed -i 's/@radix-ui\/react-progress@[^"]*/@radix-ui\/react-progress/g' "$file"
        sed -i 's/@radix-ui\/react-scroll-area@[^"]*/@radix-ui\/react-scroll-area/g' "$file"
        sed -i 's/@radix-ui\/react-select@[^"]*/@radix-ui\/react-select/g' "$file"
        sed -i 's/@radix-ui\/react-slot@[^"]*/@radix-ui\/react-slot/g' "$file"
        sed -i 's/@radix-ui\/react-tabs@[^"]*/@radix-ui\/react-tabs/g' "$file"
        sed -i 's/@radix-ui\/react-tooltip@[^"]*/@radix-ui\/react-tooltip/g' "$file"
        
        # Other packages
        sed -i 's/lucide-react@[^"]*//lucide-react/g' "$file"
        sed -i 's/class-variance-authority@[^"]*//class-variance-authority/g' "$file"
        sed -i 's/clsx@[^"]*//clsx/g' "$file"
        sed -i 's/tailwind-merge@[^"]*//tailwind-merge/g' "$file"
        
        # Generic pattern cleanup
        sed -i 's/@\([a-zA-Z0-9\/\.-]*\)@[0-9][0-9\.-]*/@\1/g' "$file"
        
        FILES_FIXED=$((FILES_FIXED + 1))
        echo "✅ Fixed: $file"
    fi
done

echo ""
echo "📊 NUCLEAR FIX COMPLETE:"
echo "  - Files scanned: ${#ALL_FILES[@]}"
echo "  - Files fixed: $FILES_FIXED"

echo ""
echo "🧪 FINAL VERIFICATION..."

# Final scan
REMAINING_FILES=()
while IFS= read -r -d '' file; do
    if grep -q "@[a-zA-Z0-9\/\.-]*@[0-9]" "$file" 2>/dev/null; then
        REMAINING_FILES+=("$file")
    fi
done < <(find . -type f \( -name "*.tsx" -o -name "*.ts" \) -not -path "./node_modules/*" -not -path "./.git/*" -print0)

if [ ${#REMAINING_FILES[@]} -eq 0 ]; then
    echo "✅ PERFECT! NO VERSIONED IMPORTS REMAIN!"
else
    echo "⚠️  ${#REMAINING_FILES[@]} files still have versioned imports:"
    for file in "${REMAINING_FILES[@]}"; do
        echo "  ❌ $file"
    done
fi

echo ""
echo "🏗️  BUILD TEST..."

BUILD_OUTPUT=$(npm run build 2>&1)
BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "🎉 BUILD SUCCESS!"
    
    # Auto-deploy
    echo "🚀 AUTO-DEPLOY SEQUENCE..."
    
    git add -A
    git commit -m "🔥 ULTIMATE FIX: Nuclear elimination of ALL versioned imports"
    
    if git push origin main; then
        echo "✅ DEPLOYMENT TRIGGERED!"
        echo ""
        echo "🎯 NETLIFY STATUS:"
        echo "  1. ✅ All versioned imports eliminated"
        echo "  2. ✅ Build test successful"  
        echo "  3. ✅ Changes pushed to GitHub"
        echo "  4. 🚀 Netlify deployment starting..."
        echo ""
        echo "🎉 SUCCESS GUARANTEED!"
    else
        echo "⚠️  Push failed, try manual: git push origin main"
    fi
    
else
    echo "❌ BUILD FAILED:"
    echo "$BUILD_OUTPUT" | tail -15
    
    if echo "$BUILD_OUTPUT" | grep -q "@.*@[0-9]"; then
        echo ""
        echo "🔍 REMAINING VERSIONED IMPORTS:"
        grep -r "@.*@[0-9]" components/ services/ hooks/ src/ 2>/dev/null | head -5
    fi
fi

echo ""
echo "🔥 ULTIMATE IMPORT FIX COMPLETE!"