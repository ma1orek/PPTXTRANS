#!/bin/bash

# INSTANT TAILWIND V4 + NETLIFY DEPLOY
# Szybka naprawa i wdrożenie z Tailwind CSS v4

echo "⚡ INSTANT TAILWIND V4 + NETLIFY DEPLOY"
echo "====================================="

# Kolorowe echo
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Quick checks
if [ ! -f "package.json" ]; then
    print_error "Nie znaleziono package.json!"
    exit 1
fi

print_status "Uruchamianie naprawy Tailwind v4..."

# Make fix script executable and run it
chmod +x fix-tailwind-v4-netlify.sh
./fix-tailwind-v4-netlify.sh

if [ $? -eq 0 ]; then
    print_status "Naprawa Tailwind v4 zakończona pomyślnie!"
    
    print_info "Commitowanie zmian do Git..."
    
    # Git operations
    git add .
    git status
    
    echo ""
    read -p "Czy chcesz scommitować zmiany? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git commit -m "Fix: Tailwind v4 + PostCSS configuration for Netlify deployment

- Updated PostCSS config for Tailwind v4
- Added @tailwindcss/postcss dependency  
- Fixed duplicate config files
- Optimized for Netlify deployment
- Fixed CSS build process"
        
        if [ $? -eq 0 ]; then
            print_status "Changes committed successfully!"
            
            echo ""
            read -p "Czy chcesz push'nąć do repozytorium? (y/n): " -n 1 -r
            echo
            
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                git push
                
                if [ $? -eq 0 ]; then
                    print_status "🎉 SUCCESS! Changes pushed to repository!"
                    print_info "Netlify powinno automatycznie zbudować projekt z Tailwind v4"
                    print_info "Sprawdź status deploy na: https://app.netlify.com"
                else
                    print_error "Git push failed"
                fi
            else
                print_info "Manual push required: git push"
            fi
        else
            print_error "Git commit failed"
        fi
    else
        print_info "Manual commit required:"
        print_info "git add . && git commit -m 'Fix: Tailwind v4 PostCSS config'"
    fi
    
else
    print_error "Naprawa Tailwind v4 nie powiodła się!"
    print_info "Sprawdź błędy powyżej i spróbuj ponownie"
    exit 1
fi

echo ""
print_status "INSTANT TAILWIND V4 DEPLOY - COMPLETED! ⚡"