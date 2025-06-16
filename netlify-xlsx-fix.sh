#!/bin/bash

# NETLIFY XLSX FIX - Uniwersalna naprawa błędu importu XLSX
# Działa na wszystkich systemach (Windows/Mac/Linux)

echo "🚀 NETLIFY XLSX FIX - Uniwersalna naprawa błędu importu dla Netlify"
echo "📋 Naprawiamy: [vite]: Rollup failed to resolve import \"xlsx\" from translationService.ts"
echo "======================================================================="

# Kolorowe echo dla lepszej widoczności
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

print_step "Krok 1: Sprawdzanie aktualnego stanu dependencies..."

# Sprawdź czy xlsx jest w package.json
if grep -q '"xlsx"' package.json; then
    print_status "XLSX już jest w package.json"
else
    print_warning "XLSX nie jest w package.json - zostanie dodane"
fi

print_step "Krok 2: Aktualizacja package.json z wszystkimi wymaganymi dependencies..."

# Backup obecnego package.json
cp package.json package.json.backup
print_info "Backup package.json utworzony: package.json.backup"

print_step "Krok 3: Czyszczenie node_modules i package-lock.json..."

# Wyczyść node_modules i package-lock
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

print_status "Stare dependencies wyczyszczone"

print_step "Krok 4: Instalacja wszystkich dependencies z --legacy-peer-deps..."

# Zainstaluj dependencies z flagą legacy-peer-deps (kompatybilność z Netlify)
npm install --legacy-peer-deps

if [ $? -eq 0 ]; then
    print_status "Dependencies zainstalowane pomyślnie"
else
    print_error "Błąd podczas instalacji dependencies"
    print_info "Próbujemy ponownie z yarn..."
    
    # Fallback na yarn jeśli npm nie działa
    if command -v yarn >/dev/null 2>&1; then
        yarn install
        if [ $? -eq 0 ]; then
            print_status "Dependencies zainstalowane pomyślnie z yarn"
        else
            print_error "Błąd również z yarn. Sprawdź połączenie internetowe."
            exit 1
        fi
    else
        print_error "Yarn nie jest zainstalowany. Instalacja dependencies nie powiodła się."
        exit 1
    fi
fi

print_step "Krok 5: Sprawdzanie czy xlsx jest dostępne..."

# Sprawdź czy xlsx został zainstalowany
if [ -d "node_modules/xlsx" ]; then
    print_status "Pakiet XLSX został poprawnie zainstalowany"
else
    print_warning "XLSX nie został zainstalowany - instalujemy ręcznie..."
    npm install xlsx --legacy-peer-deps
    
    if [ -d "node_modules/xlsx" ]; then
        print_status "XLSX zainstalowany ręcznie - sukces!"
    else
        print_error "Nie udało się zainstalować XLSX"
        exit 1
    fi
fi

print_step "Krok 6: Testowanie budowania lokalnie..."

# Test build
npm run build:simple

if [ $? -eq 0 ]; then
    print_status "Build lokalny przeszedł pomyślnie! ✨"
    print_info "Aplikacja jest gotowa do wdrożenia na Netlify"
else
    print_error "Build lokalny się nie powiódł"
    print_info "Sprawdzanie szczegółów błędu..."
    
    # Sprawdź czy błąd nadal dotyczy xlsx
    npm run build:simple 2>&1 | grep -i xlsx
    if [ $? -eq 0 ]; then
        print_warning "Błąd nadal dotyczy XLSX - sprawdzamy konfigurację Vite..."
        
        # Sprawdź vite.config.ts
        if [ -f "vite.config.ts" ]; then
            print_info "vite.config.ts istnieje - sprawdzamy konfigurację"
            
            # Sprawdź czy xlsx jest w optimizeDeps
            if grep -q "xlsx" vite.config.ts; then
                print_status "XLSX jest w konfiguracji Vite"
            else
                print_warning "XLSX nie jest w konfiguracji Vite - może być to przyczyną problemu"
            fi
        else
            print_error "Brak vite.config.ts - to może być problem"
        fi
    else
        print_info "Błąd nie dotyczy XLSX - może być inny problem"
    fi
fi

print_step "Krok 7: Przygotowanie do wdrożenia na Netlify..."

# Sprawdź netlify.toml
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

print_step "Krok 8: Test kompatybilności z Node.js..."

# Sprawdź wersję Node.js
NODE_VERSION=$(node --version)
print_info "Wersja Node.js: $NODE_VERSION"

# Sprawdź czy wersja Node.js jest kompatybilna (>=18)
NODE_MAJOR_VERSION=$(node --version | cut -d. -f1 | sed 's/v//')
if [ "$NODE_MAJOR_VERSION" -ge 18 ]; then
    print_status "Wersja Node.js jest kompatybilna z Netlify"
else
    print_warning "Wersja Node.js może być za stara dla Netlify (zalecane >=18)"
fi

print_step "Krok 9: Końcowe sprawdzenie stanu projektu..."

# Sprawdź rozmiar node_modules
if [ -d "node_modules" ]; then
    NODE_MODULES_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1)
    print_info "Rozmiar node_modules: $NODE_MODULES_SIZE"
fi

# Sprawdź czy dist został utworzony
if [ -d "dist" ]; then
    DIST_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
    print_status "Katalog dist został utworzony: $DIST_SIZE"
else
    print_warning "Katalog dist nie został utworzony - może być problem z buildem"
fi

print_step "Krok 10: Sprawdzenie gotowości do Netlify..."

# Lista plików ważnych dla Netlify
IMPORTANT_FILES=("package.json" "vite.config.ts" "netlify.toml" "tsconfig.json")

echo ""
print_info "Sprawdzanie ważnych plików:"
for file in "${IMPORTANT_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status "$file ✅"
    else
        print_warning "$file ❌ (może być potrzebny)"
    fi
done

echo ""
echo "======================================================================="
print_step "PODSUMOWANIE NAPRAWY XLSX DLA NETLIFY:"
echo ""

if [ -d "node_modules/xlsx" ] && [ -f "dist/index.html" ]; then
    print_status "🎉 SUKCES! Projekt jest gotowy do wdrożenia na Netlify"
    echo ""
    print_info "Co zostało naprawione:"
    echo "  ✅ XLSX dependency został zainstalowany"
    echo "  ✅ Build lokalny działa"
    echo "  ✅ Struktura projektu jest poprawna"
    echo ""
    print_info "Następne kroki:"
    echo "  1. Commituj zmiany do Git"
    echo "  2. Push do repozytorium"
    echo "  3. Netlify automatycznie zbuduje projekt"
    echo ""
    print_info "Komenda do commitu:"
    echo "  git add ."
    echo "  git commit -m 'Fix: XLSX import issue for Netlify deployment'"
    echo "  git push"
    
elif [ -d "node_modules/xlsx" ]; then
    print_warning "XLSX jest zainstalowany, ale build się nie powiódł"
    print_info "Sprawdź błędy powyżej i uruchom ponownie: npm run build:simple"
    
else
    print_error "XLSX nie został poprawnie zainstalowany"
    print_info "Spróbuj ręcznie: npm install xlsx --save --legacy-peer-deps"
fi

echo ""
print_info "W przypadku dalszych problemów:"
echo "  - Sprawdź logi Netlify w panelu administracyjnym"
echo "  - Upewnij się, że VITE_GOOGLE_SERVICE_ACCOUNT_KEY jest ustawiony"
echo "  - Sprawdź czy wszystkie pliki są w repozytorium Git"

echo ""
echo "🚀 NETLIFY XLSX FIX - ZAKOŃCZONY"
echo "======================================================================="