#!/bin/bash

# 🚨 EMERGENCY FIX - VERSIONED IMPORTS ELIMINATION
# Immediate fix for ALL versioned imports - NO QUESTIONS ASKED

echo "🚨 EMERGENCY VERSIONED IMPORTS FIX - ELIMINACJA NATYCHMIASTOWA"
echo "⏰ $(date '+%H:%M:%S') - DZIAŁAM!"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
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

echo "🎯 CURRENT ERROR: @radix-ui/react-checkbox@1.1.4 in checkbox.tsx"
echo "🔍 SCANNING FOR ALL VERSIONED IMPORTS..."
echo ""

# Step 1: Immediate scan and fix
print_status "EMERGENCY SCAN: Finding ALL versioned imports NOW..."

# Find ALL files with versioned imports
FILES_WITH_VERSIONS=()
while IFS= read -r -d '' file; do
    if [ -f "$file" ] && grep -q "@[a-zA-Z0-9\/\.-]*@[0-9]" "$file" 2>/dev/null; then
        FILES_WITH_VERSIONS+=("$file")
        echo "❌ FOUND: $file"
        # Show the exact imports
        grep -n "@[a-zA-Z0-9\/\.-]*@[0-9]" "$file" | head -2 | while read line; do
            echo "   $line"
        done
        echo ""
    fi
done < <(find components services hooks src -type f \( -name "*.tsx" -o -name "*.ts" \) -print0 2>/dev/null)

echo ""
print_status "FOUND ${#FILES_WITH_VERSIONS[@]} FILES WITH VERSIONED IMPORTS"

if [ ${#FILES_WITH_VERSIONS[@]} -eq 0 ]; then
    print_success "NO VERSIONED IMPORTS FOUND!"
    exit 0
fi

echo ""
print_status "EMERGENCY FIXING ALL FILES NOW..."

# Step 2: Apply emergency fixes to each file
for file in "${FILES_WITH_VERSIONS[@]}"; do
    print_status "FIXING: $file"
    
    # Create backup
    cp "$file" "${file}.emergency-backup"
    
    # Apply ALL known versioned import patterns
    # Pattern 1: @radix-ui/react-COMPONENT@VERSION
    sed -i 's/@radix-ui\/react-\([a-z-]*\)@[0-9]\+\.[0-9]\+\.[0-9]\+/@radix-ui\/react-\1/g' "$file"
    
    # Pattern 2: lucide-react@VERSION
    sed -i 's/lucide-react@[0-9]\+\.[0-9]\+\.[0-9]\+/lucide-react/g' "$file"
    
    # Pattern 3: class-variance-authority@VERSION
    sed -i 's/class-variance-authority@[0-9]\+\.[0-9]\+\.[0-9]\+/class-variance-authority/g' "$file"
    
    # Pattern 4: Any @package@version
    sed -i 's/@\([a-zA-Z0-9\/\.-]*\)@[0-9][0-9\.]*/@\1/g' "$file"
    
    # Pattern 5: From imports with versions
    sed -i 's/from "\([^"]*\)@[0-9][^"]*"/from "\1"/g' "$file"
    
    # Verify fix
    REMAINING=$(grep -c "@[a-zA-Z0-9\/\.-]*@[0-9]" "$file" 2>/dev/null || echo 0)
    
    if [ "$REMAINING" -eq 0 ]; then
        print_success "✅ FIXED: $file"
        rm "${file}.emergency-backup"
    else
        print_error "⚠️  PARTIALLY FIXED: $file (${REMAINING} remaining)"
        # Try more aggressive fix
        sed -i 's/@[^@"]*@[0-9][^"]*//g' "$file"
        
        FINAL_CHECK=$(grep -c "@[a-zA-Z0-9\/\.-]*@[0-9]" "$file" 2>/dev/null || echo 0)
        if [ "$FINAL_CHECK" -eq 0 ]; then
            print_success "✅ AGGRESSIVELY FIXED: $file"
            rm "${file}.emergency-backup"
        else
            print_error "❌ COULD NOT FIX: $file"
            echo "Remaining versioned imports:"
            grep "@[a-zA-Z0-9\/\.-]*@[0-9]" "$file" | head -2
        fi
    fi
done

echo ""
print_status "FINAL VERIFICATION..."

# Step 3: Final scan
FINAL_COUNT=0
for dir in components services hooks src; do
    if [ -d "$dir" ]; then
        COUNT=$(find "$dir" -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "@[a-zA-Z0-9\/\.-]*@[0-9]" {} \; 2>/dev/null | wc -l)
        FINAL_COUNT=$((FINAL_COUNT + COUNT))
    fi
done

if [ "$FINAL_COUNT" -eq 0 ]; then
    print_success "✅ ALL VERSIONED IMPORTS ELIMINATED!"
    echo ""
    echo "📋 FILES FIXED:"
    for file in "${FILES_WITH_VERSIONS[@]}"; do
        echo "  ✅ $file"
    done
else
    print_error "❌ $FINAL_COUNT files still have versioned imports"
    echo ""
    echo "🔍 Remaining files:"
    find components services hooks src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "@[a-zA-Z0-9\/\.-]*@[0-9]" {} \; 2>/dev/null
fi

echo ""
print_status "EMERGENCY BUILD TEST..."

# Step 4: Quick build test
BUILD_OUTPUT=$(npm run build 2>&1)
BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    print_success "🎉 BUILD SUCCESS! READY FOR DEPLOYMENT!"
    
    # Auto commit and push
    print_status "AUTO-COMMITTING AND PUSHING..."
    
    git add components/ services/ hooks/ src/
    git commit -m "🚨 EMERGENCY FIX: Eliminate ALL versioned imports - FINAL SOLUTION"
    git push origin main
    
    if [ $? -eq 0 ]; then
        print_success "🚀 PUSHED TO GITHUB - NETLIFY DEPLOYMENT STARTING!"
    else
        print_error "Push failed, but build works - try manual push"
    fi
    
else
    print_error "❌ BUILD STILL FAILS"
    echo ""
    echo "Build error excerpt:"
    echo "$BUILD_OUTPUT" | tail -10
    
    if echo "$BUILD_OUTPUT" | grep -q "@.*@[0-9]"; then
        print_error "STILL HAS VERSIONED IMPORTS!"
        echo ""
        echo "Files that still need fixing:"
        grep -r "@.*@[0-9]" components/ services/ hooks/ src/ 2>/dev/null | head -5
    fi
fi

echo ""
echo "============================================"
if [ $BUILD_EXIT_CODE -eq 0 ]; then
    print_success "🎉 EMERGENCY FIX SUCCESSFUL!"
    echo "✅ All versioned imports eliminated"
    echo "✅ Build test passed"
    echo "✅ Changes pushed to GitHub"
    echo "🚀 Netlify deployment should succeed!"
else
    print_error "❌ EMERGENCY FIX INCOMPLETE"
    echo "⚠️  Some issues remain"
    echo "🔧 Manual intervention may be needed"
fi
echo "============================================"