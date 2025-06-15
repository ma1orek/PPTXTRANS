#!/bin/bash

# ⚡ INSTANT FIX ALL VERSIONED IMPORTS - NO DELAYS
# This fixes EVERYTHING immediately and deploys

echo "⚡ INSTANT FIX ALL VERSIONED IMPORTS - NATYCHMIAST!"
echo "🎯 scroll-area.tsx + WSZYSTKIE inne versioned imports"
echo ""

# Immediate priority fixes
echo "🔧 PRIORITY FIXES:"

# 1. scroll-area.tsx (current error)
sed -i 's/@radix-ui\/react-scroll-area@[^"]*/@radix-ui\/react-scroll-area/g' "components/ui/scroll-area.tsx"
echo "✅ scroll-area.tsx"

# 2. checkbox.tsx
sed -i 's/@radix-ui\/react-checkbox@[^"]*/@radix-ui\/react-checkbox/g' "components/ui/checkbox.tsx"
sed -i 's/lucide-react@[^"]*//lucide-react/g' "components/ui/checkbox.tsx"
echo "✅ checkbox.tsx"

# 3. badge.tsx
sed -i 's/@radix-ui\/react-slot@[^"]*/@radix-ui\/react-slot/g' "components/ui/badge.tsx"
sed -i 's/class-variance-authority@[^"]*//class-variance-authority/g' "components/ui/badge.tsx"
echo "✅ badge.tsx"

echo ""
echo "🔍 SCANNING ALL UI COMPONENTS..."

# Find and fix ALL components with versioned imports
for file in components/ui/*.tsx; do
    if [ -f "$file" ] && grep -q "@.*@[0-9]" "$file" 2>/dev/null; then
        echo "🔧 Fixing: $file"
        
        # Apply all known patterns
        sed -i 's/@radix-ui\/react-[a-z-]*@[^"]*/@radix-ui\/react-TEMP/g' "$file"
        
        # Fix each specific Radix package
        sed -i 's/@radix-ui\/react-TEMP/@radix-ui\/react-accordion/g' "$file"
        sed -i 's/@radix-ui\/react-accordion@[^"]*/@radix-ui\/react-accordion/g' "$file"
        sed -i 's/@radix-ui\/react-alert-dialog@[^"]*/@radix-ui\/react-alert-dialog/g' "$file"
        sed -i 's/@radix-ui\/react-avatar@[^"]*/@radix-ui\/react-avatar/g' "$file"
        sed -i 's/@radix-ui\/react-checkbox@[^"]*/@radix-ui\/react-checkbox/g' "$file"
        sed -i 's/@radix-ui\/react-dialog@[^"]*/@radix-ui\/react-dialog/g' "$file"
        sed -i 's/@radix-ui\/react-dropdown-menu@[^"]*/@radix-ui\/react-dropdown-menu/g' "$file"
        sed -i 's/@radix-ui\/react-hover-card@[^"]*/@radix-ui\/react-hover-card/g' "$file"
        sed -i 's/@radix-ui\/react-label@[^"]*/@radix-ui\/react-label/g' "$file"
        sed -i 's/@radix-ui\/react-popover@[^"]*/@radix-ui\/react-popover/g' "$file"
        sed -i 's/@radix-ui\/react-progress@[^"]*/@radix-ui\/react-progress/g' "$file"
        sed -i 's/@radix-ui\/react-scroll-area@[^"]*/@radix-ui\/react-scroll-area/g' "$file"
        sed -i 's/@radix-ui\/react-select@[^"]*/@radix-ui\/react-select/g' "$file"
        sed -i 's/@radix-ui\/react-separator@[^"]*/@radix-ui\/react-separator/g' "$file"
        sed -i 's/@radix-ui\/react-slider@[^"]*/@radix-ui\/react-slider/g' "$file"
        sed -i 's/@radix-ui\/react-slot@[^"]*/@radix-ui\/react-slot/g' "$file"
        sed -i 's/@radix-ui\/react-switch@[^"]*/@radix-ui\/react-switch/g' "$file"
        sed -i 's/@radix-ui\/react-tabs@[^"]*/@radix-ui\/react-tabs/g' "$file"
        sed -i 's/@radix-ui\/react-toast@[^"]*/@radix-ui\/react-toast/g' "$file"
        sed -i 's/@radix-ui\/react-toggle@[^"]*/@radix-ui\/react-toggle/g' "$file"
        sed -i 's/@radix-ui\/react-tooltip@[^"]*/@radix-ui\/react-tooltip/g' "$file"
        
        # Other packages
        sed -i 's/lucide-react@[^"]*//lucide-react/g' "$file"
        sed -i 's/class-variance-authority@[^"]*//class-variance-authority/g' "$file"
        sed -i 's/clsx@[^"]*//clsx/g' "$file"
        sed -i 's/tailwind-merge@[^"]*//tailwind-merge/g' "$file"
        
        # Generic cleanup
        sed -i 's/@\([^@"]*\)@[0-9][^"]*/@\1/g' "$file"
        
        echo "✅ $file"
    fi
done

echo ""
echo "🧪 BUILD TEST..."

if npm run build > /dev/null 2>&1; then
    echo "✅ BUILD SUCCESS!"
    
    echo ""
    echo "🚀 IMMEDIATE DEPLOYMENT..."
    
    git add components/
    git commit -m "⚡ INSTANT FIX: scroll-area.tsx + all UI versioned imports"
    
    if git push origin main; then
        echo ""
        echo "🎉 DEPLOYMENT TRIGGERED!"
        echo ""
        echo "📊 FIXES APPLIED:"
        echo "  ✅ scroll-area.tsx (@1.2.3 → standard)"
        echo "  ✅ checkbox.tsx (all versioned imports)"
        echo "  ✅ badge.tsx (all versioned imports)"
        echo "  ✅ All other UI components scanned and fixed"
        echo ""
        echo "🎯 RESULT: NO MORE VERSIONED IMPORT ERRORS!"
        echo "⏱️  Deployment time: 3-4 minutes"
        echo "🚀 Netlify build starting with clean imports!"
        
    else
        echo "⚠️  Push failed - try manual: git push origin main"
    fi
    
else
    echo "❌ BUILD FAILED"
    echo ""
    echo "🔍 Checking for remaining versioned imports..."
    grep -r "@.*@[0-9]" components/ 2>/dev/null | head -3
    
    echo ""
    echo "💥 NUCLEAR OPTION..."
    
    # Nuclear cleanup
    find components -name "*.tsx" -exec sed -i 's/@\([^@"]*\)@[0-9][^"]*/@\1/g' {} \;
    
    if npm run build > /dev/null 2>&1; then
        echo "✅ NUCLEAR FIX WORKED!"
        git add components/
        git commit -m "☢️ NUCLEAR: All versioned imports eliminated"
        git push origin main
        echo "🚀 NUCLEAR DEPLOYMENT TRIGGERED!"
    else
        echo "❌ Even nuclear fix failed"
    fi
fi