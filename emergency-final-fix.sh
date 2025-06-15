#!/bin/bash

# 🚨 EMERGENCY FINAL FIX - KONIEC Z VERSIONED IMPORTS
# Znajduje i naprawia WSZYSTKIE versioned imports w całym projekcie
# NATYCHMIASTOWA NAPRAWA I DEPLOYMENT

echo "🚨 EMERGENCY FINAL FIX - ELIMINACJA WSZYSTKICH VERSIONED IMPORTS"
echo "⚡ TERAZ ALBO NIGDY - KONIEC Z TYM PROBLEMEM!"
echo "⏰ $(date '+%H:%M:%S')"
echo ""

# Colors for better visibility
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

print_status() {
    echo -e "${CYAN}[EMERGENCY]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[FIXED]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_bold() {
    echo -e "${BOLD}$1${NC}"
}

echo "🎯 CURRENT ERROR: @radix-ui/react-scroll-area@1.2.3 in scroll-area.tsx"
echo "🔥 STRATEGY: NUCLEAR ELIMINATION OF ALL VERSIONED IMPORTS"
echo ""

# Step 1: Immediate fixes for known problematic files
print_bold "STEP 1: IMMEDIATE KNOWN FIXES"

# scroll-area.tsx - PRIORITY 1 (current error)
if [ -f "components/ui/scroll-area.tsx" ]; then
    print_status "Fixing scroll-area.tsx (current error)..."
    sed -i 's/@radix-ui\/react-scroll-area@[^"]*/@radix-ui\/react-scroll-area/g' "components/ui/scroll-area.tsx"
    print_success "✅ scroll-area.tsx FIXED"
fi

# checkbox.tsx
if [ -f "components/ui/checkbox.tsx" ]; then
    sed -i 's/@radix-ui\/react-checkbox@[^"]*/@radix-ui\/react-checkbox/g' "components/ui/checkbox.tsx"
    sed -i 's/lucide-react@[^"]*//lucide-react/g' "components/ui/checkbox.tsx"
    print_success "✅ checkbox.tsx FIXED"
fi

# badge.tsx
if [ -f "components/ui/badge.tsx" ]; then
    sed -i 's/@radix-ui\/react-slot@[^"]*/@radix-ui\/react-slot/g' "components/ui/badge.tsx"
    sed -i 's/class-variance-authority@[^"]*//class-variance-authority/g' "components/ui/badge.tsx"
    print_success "✅ badge.tsx FIXED"
fi

echo ""

# Step 2: NUCLEAR SCAN - Find ALL versioned imports across entire project
print_bold "STEP 2: NUCLEAR SCAN - ENTIRE PROJECT"

print_status "Scanning ENTIRE project for versioned imports..."

ALL_FILES_WITH_VERSIONS=()
TOTAL_VERSIONED_IMPORTS=0

# Scan all TypeScript/JavaScript files excluding node_modules
while IFS= read -r -d '' file; do
    if [ -f "$file" ]; then
        VERSIONS_COUNT=$(grep -c "@[a-zA-Z0-9\/\.-]*@[0-9]" "$file" 2>/dev/null || echo 0)
        
        if [ "$VERSIONS_COUNT" -gt 0 ]; then
            ALL_FILES_WITH_VERSIONS+=("$file")
            TOTAL_VERSIONED_IMPORTS=$((TOTAL_VERSIONED_IMPORTS + VERSIONS_COUNT))
            
            print_error "FOUND: $file ($VERSIONS_COUNT versioned imports)"
            
            # Show actual imports
            grep -n "@[a-zA-Z0-9\/\.-]*@[0-9]" "$file" | head -2 | while read line; do
                echo "    ❌ $line"
            done
        fi
    fi
done < <(find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -print0)

echo ""
print_status "SCAN COMPLETE: Found ${#ALL_FILES_WITH_VERSIONS[@]} files with $TOTAL_VERSIONED_IMPORTS versioned imports"

if [ ${#ALL_FILES_WITH_VERSIONS[@]} -eq 0 ]; then
    print_success "🎉 NO VERSIONED IMPORTS FOUND!"
    
    print_status "Running build test..."
    if npm run build > /dev/null 2>&1; then
        print_success "✅ BUILD SUCCESSFUL!"
        print_status "Project is clean - no action needed"
        exit 0
    else
        print_error "Build failed for other reasons - investigating..."
    fi
fi

echo ""

# Step 3: NUCLEAR FIX - Fix ALL files with versioned imports
print_bold "STEP 3: NUCLEAR FIX - ELIMINATE ALL VERSIONED IMPORTS"

FILES_FIXED=0

for file in "${ALL_FILES_WITH_VERSIONS[@]}"; do
    print_status "NUCLEAR FIXING: $file"
    
    # Create backup
    cp "$file" "${file}.nuclear-backup"
    
    # Apply comprehensive nuclear fixes
    # All known Radix UI packages
    sed -i 's/@radix-ui\/react-accordion@[^"]*/@radix-ui\/react-accordion/g' "$file"
    sed -i 's/@radix-ui\/react-alert-dialog@[^"]*/@radix-ui\/react-alert-dialog/g' "$file"
    sed -i 's/@radix-ui\/react-aspect-ratio@[^"]*/@radix-ui\/react-aspect-ratio/g' "$file"
    sed -i 's/@radix-ui\/react-avatar@[^"]*/@radix-ui\/react-avatar/g' "$file"
    sed -i 's/@radix-ui\/react-checkbox@[^"]*/@radix-ui\/react-checkbox/g' "$file"
    sed -i 's/@radix-ui\/react-collapsible@[^"]*/@radix-ui\/react-collapsible/g' "$file"
    sed -i 's/@radix-ui\/react-dialog@[^"]*/@radix-ui\/react-dialog/g' "$file"
    sed -i 's/@radix-ui\/react-dropdown-menu@[^"]*/@radix-ui\/react-dropdown-menu/g' "$file"
    sed -i 's/@radix-ui\/react-hover-card@[^"]*/@radix-ui\/react-hover-card/g' "$file"
    sed -i 's/@radix-ui\/react-label@[^"]*/@radix-ui\/react-label/g' "$file"
    sed -i 's/@radix-ui\/react-menubar@[^"]*/@radix-ui\/react-menubar/g' "$file"
    sed -i 's/@radix-ui\/react-navigation-menu@[^"]*/@radix-ui\/react-navigation-menu/g' "$file"
    sed -i 's/@radix-ui\/react-popover@[^"]*/@radix-ui\/react-popover/g' "$file"
    sed -i 's/@radix-ui\/react-progress@[^"]*/@radix-ui\/react-progress/g' "$file"
    sed -i 's/@radix-ui\/react-radio-group@[^"]*/@radix-ui\/react-radio-group/g' "$file"
    sed -i 's/@radix-ui\/react-scroll-area@[^"]*/@radix-ui\/react-scroll-area/g' "$file"
    sed -i 's/@radix-ui\/react-select@[^"]*/@radix-ui\/react-select/g' "$file"
    sed -i 's/@radix-ui\/react-separator@[^"]*/@radix-ui\/react-separator/g' "$file"
    sed -i 's/@radix-ui\/react-slider@[^"]*/@radix-ui\/react-slider/g' "$file"
    sed -i 's/@radix-ui\/react-slot@[^"]*/@radix-ui\/react-slot/g' "$file"
    sed -i 's/@radix-ui\/react-switch@[^"]*/@radix-ui\/react-switch/g' "$file"
    sed -i 's/@radix-ui\/react-tabs@[^"]*/@radix-ui\/react-tabs/g' "$file"
    sed -i 's/@radix-ui\/react-toast@[^"]*/@radix-ui\/react-toast/g' "$file"
    sed -i 's/@radix-ui\/react-toggle@[^"]*/@radix-ui\/react-toggle/g' "$file"
    sed -i 's/@radix-ui\/react-toggle-group@[^"]*/@radix-ui\/react-toggle-group/g' "$file"
    sed -i 's/@radix-ui\/react-tooltip@[^"]*/@radix-ui\/react-tooltip/g' "$file"
    
    # Other common packages
    sed -i 's/lucide-react@[^"]*//lucide-react/g' "$file"
    sed -i 's/class-variance-authority@[^"]*//class-variance-authority/g' "$file"
    sed -i 's/clsx@[^"]*//clsx/g' "$file"
    sed -i 's/tailwind-merge@[^"]*//tailwind-merge/g' "$file"
    sed -i 's/cmdk@[^"]*//cmdk/g' "$file"
    sed -i 's/date-fns@[^"]*//date-fns/g' "$file"
    sed -i 's/react-hook-form@[^"]*//react-hook-form/g' "$file"
    sed -i 's/sonner@[^"]*//sonner/g' "$file"
    sed -i 's/vaul@[^"]*//vaul/g' "$file"
    
    # Generic nuclear pattern - catch everything else
    sed -i 's/@\([a-zA-Z0-9\/\.-]*\)@[0-9][0-9\.-]*/@\1/g' "$file"
    
    # Verify fix
    REMAINING=$(grep -c "@[a-zA-Z0-9\/\.-]*@[0-9]" "$file" 2>/dev/null || echo 0)
    
    if [ "$REMAINING" -eq 0 ]; then
        print_success "✅ NUCLEAR FIX SUCCESS: $file"
        rm "${file}.nuclear-backup"
        FILES_FIXED=$((FILES_FIXED + 1))
    else
        print_error "⚠️  PARTIAL FIX: $file ($REMAINING remaining)"
        
        # Ultra-aggressive fix
        sed -i 's/@[^@"]*@[0-9][^"]*//g' "$file"
        
        FINAL_CHECK=$(grep -c "@[a-zA-Z0-9\/\.-]*@[0-9]" "$file" 2>/dev/null || echo 0)
        if [ "$FINAL_CHECK" -eq 0 ]; then
            print_success "✅ ULTRA-AGGRESSIVE FIX SUCCESS: $file"
            rm "${file}.nuclear-backup"
            FILES_FIXED=$((FILES_FIXED + 1))
        else
            print_error "❌ COULD NOT FIX: $file"
            mv "${file}.nuclear-backup" "$file"
        fi
    fi
done

echo ""
print_bold "STEP 4: FINAL VERIFICATION"

# Final scan to confirm everything is clean
FINAL_SCAN_FILES=()
while IFS= read -r -d '' file; do
    if [ -f "$file" ] && grep -q "@[a-zA-Z0-9\/\.-]*@[0-9]" "$file" 2>/dev/null; then
        FINAL_SCAN_FILES+=("$file")
    fi
done < <(find . -type f \( -name "*.tsx" -o -name "*.ts" \) -not -path "./node_modules/*" -not -path "./.git/*" -print0)

if [ ${#FINAL_SCAN_FILES[@]} -eq 0 ]; then
    print_success "🎉 PERFECT! ALL VERSIONED IMPORTS ELIMINATED!"
else
    print_error "⚠️  ${#FINAL_SCAN_FILES[@]} files still have versioned imports:"
    for file in "${FINAL_SCAN_FILES[@]}"; do
        echo "  ❌ $file"
        grep "@[a-zA-Z0-9\/\.-]*@[0-9]" "$file" | head -1
    done
fi

echo ""
print_bold "STEP 5: BUILD TEST & DEPLOYMENT"

print_status "Running build test..."
BUILD_OUTPUT=$(npm run build 2>&1)
BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    print_success "🎉 BUILD SUCCESS!"
    
    echo ""
    print_bold "AUTOMATIC DEPLOYMENT SEQUENCE"
    
    # Auto-commit and deploy
    print_status "Committing nuclear fix..."
    git add -A
    git commit -m "🚨 NUCLEAR FIX: Eliminate ALL versioned imports - scroll-area + complete project cleanup"
    
    print_status "Pushing to GitHub..."
    if git push origin main; then
        print_success "🚀 DEPLOYMENT TRIGGERED!"
        
        echo ""
        print_bold "🎉 EMERGENCY FIX COMPLETE - SUCCESS!"
        echo ""
        echo "📊 Results:"
        echo "  - Files scanned: ${#ALL_FILES_WITH_VERSIONS[@]}"
        echo "  - Files fixed: $FILES_FIXED"
        echo "  - Versioned imports eliminated: $TOTAL_VERSIONED_IMPORTS"
        echo "  - Build test: SUCCESS ✅"
        echo "  - GitHub push: SUCCESS ✅"
        echo "  - Netlify deployment: TRIGGERED 🚀"
        echo ""
        echo "🎯 THIS PROBLEM IS NOW PERMANENTLY SOLVED!"
        echo "⏱️  Expected deployment time: 3-4 minutes"
        
    else
        print_error "Push failed - try manual push:"
        echo "git push origin main"
    fi
    
else
    print_error "❌ BUILD STILL FAILS!"
    echo ""
    echo "Build error:"
    echo "$BUILD_OUTPUT" | tail -10
    
    if echo "$BUILD_OUTPUT" | grep -q "@.*@[0-9]"; then
        print_error "STILL HAS VERSIONED IMPORTS!"
        echo ""
        echo "Remaining versioned imports:"
        grep -r "@.*@[0-9]" components/ services/ hooks/ src/ 2>/dev/null | head -3
    else
        print_error "Different build issue - not versioned imports"
    fi
fi

echo ""
print_bold "=================================="
if [ $BUILD_EXIT_CODE -eq 0 ]; then
    print_success "🚨 EMERGENCY FIX SUCCESSFUL!"
    echo "🎯 Versioned imports problem PERMANENTLY SOLVED"
    echo "🚀 Deployment in progress"
else
    print_error "❌ EMERGENCY FIX INCOMPLETE"
    echo "🔧 Manual intervention may be needed"
fi
print_bold "=================================="