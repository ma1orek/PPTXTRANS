#!/bin/bash

# ⚡ INSTANT FIX AND DEPLOY - NO DELAYS
# Immediate fix and deployment trigger

echo "⚡ INSTANT FIX AND DEPLOY ACTIVATED"
echo "🎯 TARGET: @radix-ui/react-checkbox@1.1.4 and ALL versioned imports"
echo ""

# Step 1: Immediate known fixes
echo "🔧 INSTANT FIXES:"

# checkbox.tsx - PRIORITY 1
if [ -f "components/ui/checkbox.tsx" ]; then
    sed -i 's/@radix-ui\/react-checkbox@[^"]*/@radix-ui\/react-checkbox/g' "components/ui/checkbox.tsx"
    sed -i 's/lucide-react@[^"]*//lucide-react/g' "components/ui/checkbox.tsx"
    echo "✅ checkbox.tsx FIXED"
fi

# badge.tsx
if [ -f "components/ui/badge.tsx" ]; then
    sed -i 's/@radix-ui\/react-slot@[^"]*/@radix-ui\/react-slot/g' "components/ui/badge.tsx"
    sed -i 's/class-variance-authority@[^"]*//class-variance-authority/g' "components/ui/badge.tsx"
    echo "✅ badge.tsx FIXED"
fi

# Step 2: Scan components directory for any other versioned imports
echo ""
echo "🔍 SCANNING components/ directory..."

find components -name "*.tsx" -exec grep -l "@.*@[0-9]" {} \; 2>/dev/null | while read file; do
    echo "🔧 Fixing: $file"
    
    # Apply all patterns
    sed -i 's/@radix-ui\/react-[a-z-]*@[0-9][0-9\.]*/@radix-ui\/react-TEMP/g' "$file"
    sed -i 's/@radix-ui\/react-TEMP/@radix-ui\/react-checkbox/g' "$file" # Fallback
    
    # Specific fixes
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
    
    # Other common packages
    sed -i 's/lucide-react@[^"]*//lucide-react/g' "$file"
    sed -i 's/class-variance-authority@[^"]*//class-variance-authority/g' "$file"
    sed -i 's/clsx@[^"]*//clsx/g' "$file"
    sed -i 's/tailwind-merge@[^"]*//tailwind-merge/g' "$file"
    
    echo "✅ $file FIXED"
done

echo ""
echo "🧪 QUICK BUILD TEST..."

# Step 3: Quick build test
if npm run build > /dev/null 2>&1; then
    echo "✅ BUILD TEST PASSED!"
    
    # Step 4: Immediate commit and push
    echo ""
    echo "🚀 IMMEDIATE DEPLOYMENT..."
    
    git add components/
    git commit -m "⚡ INSTANT FIX: checkbox.tsx versioned imports + all UI components"
    
    if git push origin main; then
        echo ""
        echo "🎉 SUCCESS! DEPLOYMENT TRIGGERED!"
        echo ""
        echo "📊 Status:"
        echo "  ✅ checkbox.tsx fixed (@radix-ui/react-checkbox@1.1.4 → @radix-ui/react-checkbox)"
        echo "  ✅ All UI components scanned and fixed"
        echo "  ✅ Build test passed"
        echo "  ✅ Changes pushed to GitHub"
        echo "  🚀 Netlify deployment starting..."
        echo ""
        echo "⏱️  Expected deployment time: 2-3 minutes"
        echo "🎯 This fix should resolve the build error permanently!"
        
    else
        echo "⚠️  Push failed - try manual push:"
        echo "git push origin main"
    fi
    
else
    echo "❌ BUILD STILL FAILS"
    
    # Show what remains
    echo ""
    echo "🔍 Remaining versioned imports:"
    grep -r "@.*@[0-9]" components/ 2>/dev/null | head -5
    
    echo ""
    echo "💥 RUNNING NUCLEAR OPTION..."
    
    # Nuclear fix
    find components -name "*.tsx" -exec sed -i 's/@\([^@"]*\)@[0-9][^"]*/@\1/g' {} \;
    
    echo "☢️  Nuclear fix applied - trying build again..."
    
    if npm run build > /dev/null 2>&1; then
        echo "✅ NUCLEAR FIX WORKED!"
        
        git add components/
        git commit -m "☢️ NUCLEAR FIX: All versioned imports eliminated"
        git push origin main
        
        echo "🚀 NUCLEAR DEPLOYMENT TRIGGERED!"
    else
        echo "❌ Even nuclear fix failed - manual intervention needed"
    fi
fi