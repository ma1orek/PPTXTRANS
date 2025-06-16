#!/bin/bash

# INSTANT TAILWIND V4 CSS FIX - Naprawa @import w globals.css
# Szybka naprawa błędu: Missing "./base" specifier in "tailwindcss" package

echo "⚡ INSTANT TAILWIND V4 CSS FIX - Naprawa importów w globals.css"
echo "=============================================================="

# Kolorowe echo
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_step() { echo -e "${PURPLE}🔄 $1${NC}"; }

# Quick checks
if [ ! -f "package.json" ]; then
    print_error "Nie znaleziono package.json!"
    exit 1
fi

if [ ! -f "styles/globals.css" ]; then
    print_error "Nie znaleziono styles/globals.css!"
    exit 1
fi

print_step "Krok 1: Sprawdzanie problemu z globals.css..."

# Sprawdź czy mamy stare @import w globals.css
if grep -q "@import 'tailwindcss/" styles/globals.css; then
    print_warning "Znaleziono stare @import 'tailwindcss/base' w globals.css"
    OLD_IMPORTS=true
else
    print_info "globals.css już używa nowych @tailwind directives"
    OLD_IMPORTS=false
fi

print_step "Krok 2: Czyszczenie konfliktujących plików..."

# Usuń conflicting postcss.config.cjs (zostaw tylko .js)
if [ -f "postcss.config.cjs" ]; then
    rm -f postcss.config.cjs
    print_status "Usunięto konfliktujący postcss.config.cjs"
fi

# Usuń stare cache files
rm -rf node_modules/.vite 2>/dev/null
rm -rf dist 2>/dev/null
print_info "Wyczyszczono cache files"

print_step "Krok 3: Sprawdzanie i naprawa globals.css..."

if $OLD_IMPORTS; then
    print_warning "Naprawianie starych @import w globals.css..."
    
    # Backup obecnego pliku
    cp styles/globals.css styles/globals.css.backup
    print_info "Backup utworzony: styles/globals.css.backup"
    
    # Automatyczna naprawa: zamień stare @import na nowe @tailwind
    sed -i.bak "s/@import 'tailwindcss\/base';/@tailwind base;/g" styles/globals.css
    sed -i.bak "s/@import 'tailwindcss\/components';/@tailwind components;/g" styles/globals.css
    sed -i.bak "s/@import 'tailwindcss\/utilities';/@tailwind utilities;/g" styles/globals.css
    
    # Usuń backup file
    rm -f styles/globals.css.bak
    
    print_status "globals.css naprawiony - używa teraz @tailwind directives"
else
    print_status "globals.css jest już poprawny"
fi

print_step "Krok 4: Sprawdzanie PostCSS konfiguracji..."

if [ -f "postcss.config.js" ]; then
    if grep -q "@tailwindcss/postcss" postcss.config.js; then
        print_status "PostCSS config zawiera @tailwindcss/postcss - OK"
    else
        print_warning "PostCSS config może wymagać aktualizacji"
    fi
else
    print_error "Brak postcss.config.js"
fi

print_step "Krok 5: Test budowania lokalnie..."

# Test build
echo "Testowanie budowania z naprawionym CSS..."
npm run build:simple

if [ $? -eq 0 ]; then
    print_status "✨ Build przeszedł pomyślnie!"
    print_info "Tailwind v4 CSS imports zostały naprawione"
    
    # Sprawdź czy dist został utworzony
    if [ -d "dist" ]; then
        DIST_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
        print_status "Katalog dist utworzony: $DIST_SIZE"
        
        # Sprawdź czy CSS jest obecny
        if ls dist/assets/*.css >/dev/null 2>&1; then
            CSS_COUNT=$(ls dist/assets/*.css | wc -l)
            print_status "CSS files: $CSS_COUNT ✅"
        else
            print_warning "Brak plików CSS w dist/assets/"
        fi
        
        if [ -f "dist/index.html" ]; then
            print_status "dist/index.html ✅"
        else
            print_warning "dist/index.html ❌"
        fi
    else
        print_warning "Katalog dist nie został utworzony"
    fi
    
else
    print_error "Build się nie powiódł"
    
    # Sprawdź szczegóły błędu
    print_info "Sprawdzanie szczegółów błędu..."
    npm run build:simple 2>&1 | grep -E "(error|Error)" | head -5
    
    # Sprawdź czy błąd nadal dotyczy CSS
    if npm run build:simple 2>&1 | grep -q "Missing.*specifier"; then
        print_error "Błąd 'Missing specifier' nadal występuje"
        print_info "Możliwe przyczyny:"
        echo "  1. Problem z Tailwind v4 dependencies"
        echo "  2. Konflikt między plikami config"
        echo "  3. Błędna konfiguracja PostCSS"
    fi
    
    exit 1
fi

print_step "Krok 6: Podsumowanie naprawy..."

echo ""
echo "=============================================================="
print_step "PODSUMOWANIE NAPRAWY TAILWIND V4 CSS:"
echo ""

# Sprawdź status kluczowych elementów
CSS_OK=false
POSTCSS_OK=false
BUILD_OK=false

if [ -f "styles/globals.css" ] && grep -q "@tailwind base" styles/globals.css; then
    CSS_OK=true
fi

if [ -f "postcss.config.js" ] && grep -q "@tailwindcss/postcss" postcss.config.js; then
    POSTCSS_OK=true
fi

if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    BUILD_OK=true
fi

if $CSS_OK && $POSTCSS_OK && $BUILD_OK; then
    print_status "🎉 SUKCES! Tailwind v4 CSS imports naprawione"
    echo ""
    print_info "Co zostało naprawione:"
    echo "  ✅ Zamieniono @import 'tailwindcss/base' na @tailwind base"
    echo "  ✅ Zamieniono @import 'tailwindcss/components' na @tailwind components"
    echo "  ✅ Zamieniono @import 'tailwindcss/utilities' na @tailwind utilities"
    echo "  ✅ Usunięto konfliktujący postcss.config.cjs"
    echo "  ✅ Build lokalny działa"
    echo ""
    print_info "Następne kroki:"
    echo "  1. Commituj zmiany do Git"
    echo "  2. Push do repozytorium"
    echo "  3. Netlify automatycznie zbuduje projekt"
    echo ""
    print_info "Komendy do commitu:"
    echo "  git add ."
    echo "  git commit -m 'Fix: Tailwind v4 CSS imports - replace @import with @tailwind directives'"
    echo "  git push"
    
elif $CSS_OK && $POSTCSS_OK; then
    print_warning "CSS i PostCSS skonfigurowane, ale build ma problemy"
    print_info "Sprawdź błędy powyżej i uruchom ponownie: npm run build:simple"
    
elif $CSS_OK; then
    print_warning "CSS naprawiony, ale PostCSS config ma problemy"
    print_info "Sprawdź zawartość postcss.config.js"
    
else
    print_error "CSS nie został poprawnie naprawiony"
    print_info "Sprawdź zawartość styles/globals.css"
fi

echo ""
print_info "Debug Info:"
echo "  CSS fixed: $CSS_OK"
echo "  PostCSS configured: $POSTCSS_OK"
echo "  Build successful: $BUILD_OK"

echo ""
echo "⚡ INSTANT TAILWIND V4 CSS FIX - ZAKOŃCZONY"
echo "=============================================================="

# Auto-commit jeśli wszystko OK
if $CSS_OK && $POSTCSS_OK && $BUILD_OK; then
    echo ""
    read -p "Czy chcesz automatycznie scommitować naprawę? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "Fix: Tailwind v4 CSS imports - replace @import with @tailwind directives

- Fixed globals.css: @import 'tailwindcss/base' → @tailwind base
- Fixed globals.css: @import 'tailwindcss/components' → @tailwind components  
- Fixed globals.css: @import 'tailwindcss/utilities' → @tailwind utilities
- Removed conflicting postcss.config.cjs
- Build tested and working
- Ready for Netlify deployment"
        
        if [ $? -eq 0 ]; then
            print_status "Changes committed successfully!"
            
            echo ""
            read -p "Czy chcesz push'nąć do repozytorium? (y/n): " -n 1 -r
            echo
            
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                git push
                
                if [ $? -eq 0 ]; then
                    print_status "🎉 SUCCESS! Changes pushed to repository!"
                    print_info "Netlify powinno automatycznie zbudować projekt z naprawionymi CSS imports"
                    print_info "Sprawdź deploy na: https://app.netlify.com"
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
        print_info "Manual commit required - see commands above"
    fi
fi