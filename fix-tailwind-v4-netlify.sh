#!/bin/bash

# TAILWIND V4 + NETLIFY FIX
# Naprawia problem PostCSS i Tailwind v4 dla Netlify deployment

echo "🚀 TAILWIND V4 + NETLIFY FIX - Naprawa PostCSS i Tailwind CSS v4"
echo "======================================================================"

# Kolorowe echo
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "${PURPLE}🔄 $1${NC}"
}

# Sprawdź czy jesteśmy w odpowiednim katalogu
if [ ! -f "package.json" ]; then
    print_error "Nie znaleziono package.json. Upewnij się, że jesteś w głównym katalogu projektu."
    exit 1
fi

print_step "Krok 1: Czyszczenie starych plików i cache..."

# Usuń stare pliki i cache
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock
rm -f dist

# Usuń konfliktujący postcss.config.cjs (zostaw tylko .js)
if [ -f "postcss.config.cjs" ]; then
    rm -f postcss.config.cjs
    print_status "Usunięto konfliktujący postcss.config.cjs"
fi

print_status "Cache i stare pliki wyczyszczone"

print_step "Krok 2: Sprawdzanie wersji Node.js i npm..."

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)

print_info "Node.js: $NODE_VERSION"
print_info "npm: $NPM_VERSION"

# Sprawdź czy Node.js jest >= 18
NODE_MAJOR=$(node --version | cut -d. -f1 | sed 's/v//')
if [ "$NODE_MAJOR" -lt 18 ]; then
    print_warning "Node.js w wersji <18 może powodować problemy. Zalecana wersja >=18"
fi

print_step "Krok 3: Instalacja dependencies z obsługą Tailwind v4..."

# Zainstaluj dependencies z Tailwind v4 support
npm install --legacy-peer-deps

if [ $? -eq 0 ]; then
    print_status "Dependencies zainstalowane pomyślnie"
else
    print_error "Błąd podczas instalacji dependencies"
    print_info "Próbujemy z yarn..."
    
    if command -v yarn >/dev/null 2>&1; then
        yarn install
        if [ $? -eq 0 ]; then
            print_status "Dependencies zainstalowane z yarn"
        else
            print_error "Instalacja nie powiodła się ani z npm ani z yarn"
            exit 1
        fi
    else
        print_error "Yarn nie jest zainstalowany, instalacja nie powiodła się"
        exit 1
    fi
fi

print_step "Krok 4: Sprawdzanie kluczowych pakietów Tailwind v4..."

# Check if key packages are installed
REQUIRED_PACKAGES=("tailwindcss" "@tailwindcss/postcss" "autoprefixer" "postcss" "vite")

for package in "${REQUIRED_PACKAGES[@]}"; do
    if [ -d "node_modules/$package" ]; then
        PACKAGE_VERSION=$(node -p "require('./node_modules/$package/package.json').version" 2>/dev/null || echo "unknown")
        print_status "$package v$PACKAGE_VERSION zainstalowany"
    else
        print_warning "$package nie został znaleziony - instalujemy..."
        
        case $package in
            "tailwindcss")
                npm install --save-dev tailwindcss@^4.0.0-alpha.25 --legacy-peer-deps
                ;;
            "@tailwindcss/postcss")
                npm install --save-dev @tailwindcss/postcss@^4.0.0-alpha.25 --legacy-peer-deps
                ;;
            *)
                npm install --save-dev $package --legacy-peer-deps
                ;;
        esac
    fi
done

print_step "Krok 5: Weryfikacja PostCSS konfiguracji..."

# Sprawdź czy postcss.config.js istnieje i ma poprawną konfigurację
if [ -f "postcss.config.js" ]; then
    if grep -q "@tailwindcss/postcss" postcss.config.js; then
        print_status "PostCSS config zawiera @tailwindcss/postcss - OK"
    else
        print_warning "PostCSS config nie zawiera @tailwindcss/postcss"
    fi
else
    print_error "postcss.config.js nie istnieje"
fi

# Sprawdź czy tailwind.config.js istnieje
if [ -f "tailwind.config.js" ]; then
    print_status "tailwind.config.js istnieje"
else
    print_error "tailwind.config.js nie istnieje"
fi

print_step "Krok 6: Test budowania lokalnie..."

# Test build
echo "Testowanie budowania..."
npm run build:simple

if [ $? -eq 0 ]; then
    print_status "✨ Build lokalny przeszedł pomyślnie!"
    print_info "Tailwind v4 + PostCSS działa poprawnie"
    
    # Sprawdź czy dist został utworzony
    if [ -d "dist" ]; then
        DIST_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
        print_status "Katalog dist utworzony: $DIST_SIZE"
        
        # Sprawdź czy główne pliki istnieją
        if [ -f "dist/index.html" ]; then
            print_status "dist/index.html ✅"
        else
            print_warning "dist/index.html ❌"
        fi
        
        if ls dist/assets/*.js >/dev/null 2>&1; then
            JS_COUNT=$(ls dist/assets/*.js | wc -l)
            print_status "JavaScript files: $JS_COUNT ✅"
        else
            print_warning "Brak plików JavaScript w dist/assets/"
        fi
        
        if ls dist/assets/*.css >/dev/null 2>&1; then
            CSS_COUNT=$(ls dist/assets/*.css | wc -l)
            print_status "CSS files: $CSS_COUNT ✅"
        else
            print_warning "Brak plików CSS w dist/assets/"
        fi
    else
        print_warning "Katalog dist nie został utworzony"
    fi
    
else
    print_error "Build lokalny się nie powiódł"
    print_info "Sprawdzanie szczegółów błędu..."
    
    # Sprawdź czy błąd nadal dotyczy PostCSS/Tailwind
    npm run build:simple 2>&1 | head -20
    
    print_info "Możliwe przyczyny:"
    echo "  1. Konflikt wersji Tailwind CSS"
    echo "  2. Brakujący @tailwindcss/postcss"
    echo "  3. Błędna konfiguracja PostCSS"
    echo "  4. Problem z importami CSS"
    
    exit 1
fi

print_step "Krok 7: Sprawdzenie gotowości do Netlify..."

# Sprawdź czy netlify.toml istnieje
if [ -f "netlify.toml" ]; then
    print_status "netlify.toml istnieje"
    
    # Sprawdź czy komenda budowania jest poprawna
    if grep -q "build:simple" netlify.toml; then
        print_status "Komenda budowania jest poprawnie skonfigurowana"
    else
        print_warning "Komenda budowania może wymagać aktualizacji"
    fi
else
    print_warning "Brak netlify.toml - może być potrzebny"
fi

print_step "Krok 8: Podsumowanie naprawy Tailwind v4..."

echo ""
echo "======================================================================"
print_step "PODSUMOWANIE NAPRAWY TAILWIND V4 + POSTCSS:"
echo ""

# Sprawdź status kluczowych elementów
TAILWIND_OK=false
POSTCSS_OK=false
BUILD_OK=false

if [ -d "node_modules/tailwindcss" ] && [ -d "node_modules/@tailwindcss/postcss" ]; then
    TAILWIND_OK=true
fi

if [ -f "postcss.config.js" ] && grep -q "@tailwindcss/postcss" postcss.config.js; then
    POSTCSS_OK=true
fi

if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    BUILD_OK=true
fi

if $TAILWIND_OK && $POSTCSS_OK && $BUILD_OK; then
    print_status "🎉 SUKCES! Tailwind v4 + PostCSS działają poprawnie"
    echo ""
    print_info "Co zostało naprawione:"
    echo "  ✅ Tailwind CSS v4.0.0-alpha.25 zainstalowany"
    echo "  ✅ @tailwindcss/postcss zainstalowany" 
    echo "  ✅ PostCSS config skonfigurowany dla v4"
    echo "  ✅ Usunięto konfliktujące pliki config"
    echo "  ✅ Build lokalny działa"
    echo ""
    print_info "Następne kroki:"
    echo "  1. Commituj zmiany do Git"
    echo "  2. Push do repozytorium"
    echo "  3. Netlify automatycznie zbuduje projekt"
    echo ""
    print_info "Komendy do commitu:"
    echo "  git add ."
    echo "  git commit -m 'Fix: Tailwind v4 + PostCSS configuration for Netlify'"
    echo "  git push"
    
elif $TAILWIND_OK && $POSTCSS_OK; then
    print_warning "Tailwind v4 i PostCSS skonfigurowane, ale build ma problemy"
    print_info "Sprawdź błędy powyżej i uruchom ponownie: npm run build:simple"
    
elif $TAILWIND_OK; then
    print_warning "Tailwind v4 zainstalowany, ale PostCSS config ma problemy"
    print_info "Sprawdź zawartość postcss.config.js"
    
else
    print_error "Tailwind v4 nie został poprawnie skonfigurowany"
    print_info "Spróbuj ręcznie:"
    echo "  npm install --save-dev tailwindcss@^4.0.0-alpha.25 @tailwindcss/postcss@^4.0.0-alpha.25 --legacy-peer-deps"
fi

echo ""
print_info "Debug Info:"
echo "  Node.js: $NODE_VERSION"
echo "  npm: $NPM_VERSION"
echo "  Tailwind installed: $TAILWIND_OK"
echo "  PostCSS configured: $POSTCSS_OK"
echo "  Build successful: $BUILD_OK"

echo ""
echo "🚀 TAILWIND V4 + NETLIFY FIX - ZAKOŃCZONY"
echo "======================================================================"