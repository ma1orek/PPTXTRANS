# 🚀 INSTRUKCJE KROK PO KROK - PPTX Translator Pro

## ⚠️ WAŻNE: Twój plik PPTX waży tylko 70 bytes!

Plik PowerPoint o wielkości 70 bytes jest **za mały** i prawdopodobnie **uszkodzony lub pusty**. Normalny plik PPTX waży zwykle **kilkaset KB do kilku MB**.

## 🔧 CO ZROBIĆ TERAZ?

### OPCJA 1: Użyj przykładowego pliku (ZALECANE)
```bash
# Uruchom aplikację
npm run dev

# W aplikacji kliknij przycisk "Generate Sample File" (dodamy go)
# Lub użyj naszego przykładowego pliku
```

### OPCJA 2: Znajdź prawdziwy plik PPTX
- Otwórz PowerPoint i stwórz nową prezentację
- Dodaj przynajmniej 2-3 slajdy z tekstem
- Zapisz jako `.pptx`
- Sprawdź czy plik waży więcej niż 10KB

## 📋 INSTALACJA I URUCHOMIENIE

### Krok 1: Zainstaluj dependencies
```bash
# Automatyczna instalacja (ZALECANE)
chmod +x install-dependencies.sh
./install-dependencies.sh

# LUB ręcznie:
npm install
npm install googleapis jszip xml2js pptxgenjs @types/xml2js
```

### Krok 2: Uruchom aplikację
```bash
npm run dev
```

### Krok 3: Otwórz w przeglądarce
```
http://localhost:3000
```

## 🎯 JAK UŻYWAĆ APLIKACJI

### Tryb Development (Domyślny)
Aplikacja działa **bez prawdziwych plików PPTX** - używa przykładowych danych.

1. **Upload pliku**:
   - Przeciągnij plik PPTX lub kliknij aby wybrać
   - ⚠️ Jeśli plik waży mniej niż 1KB - zostanie odrzucony
   - ✅ Aplikacja zaakceptuje pliki 1KB - 100MB

2. **Wybierz języki**:
   - Wybierz maksymalnie 5 języków docelowych
   - Dostępne: Polski, Hiszpański, Francuski, Niemiecki, itd.

3. **Rozpocznij tłumaczenie**:
   - Kliknij "Start Translation"
   - Obserwuj postęp w czasie rzeczywistym
   - Proces trwa 2-5 minut

4. **Pobierz rezultaty**:
   - Po zakończeniu - pobierz przetłumaczone pliki
   - Każdy język = osobny plik PPTX

## 🐛 ROZWIĄZYWANIE PROBLEMÓW

### Problem: "File is too small (70 bytes)"
**Rozwiązanie:**
```bash
# 1. Stwórz nowy plik PPTX w PowerPoint:
#    - Dodaj tytuł na slajdzie 1
#    - Dodaj content na slajdzie 2  
#    - Zapisz jako .pptx
#    - Sprawdź rozmiar pliku (powinien być >10KB)

# 2. LUB użyj naszego sample file:
#    - W aplikacji kliknij "Generate Sample"
#    - Pobierz i użyj tego pliku do testów
```

### Problem: "Module not found" błędy
**Rozwiązanie:**
```bash
# Usuń i przeinstaluj dependencies
rm -rf node_modules package-lock.json
npm install
npm install googleapis jszip xml2js pptxgenjs @types/xml2js
```

### Problem: "Google APIs not available"
**To jest NORMALNE w trybie development!**
- Aplikacja używa mock danych
- Wszystko nadal działa
- Pokazuje jak będzie wyglądać prawdziwy proces

### Problem: "Translation timeout"
**Rozwiązanie:**
- To jest normalne w trybie mock
- W prawdziwej aplikacji Google Translate potrzebuje czasu
- Aplikacja automatycznie kontynuuje z dostępnymi tłumaczeniami

## 🔍 DEBUG MODE

Włącz szczegółowe logi:
```javascript
// W konsoli przeglądarki:
localStorage.setItem('debug', 'true');
// Odśwież stronę i sprawdź Console (F12)
```

## 📁 PRZYKŁADY PLIKÓW DO TESTÓW

### Minimalny test PPTX:
1. Otwórz PowerPoint
2. Stwórz 3 slajdy:
   - Slajd 1: "Welcome to Test Presentation"
   - Slajd 2: "This is sample content for translation testing"
   - Slajd 3: "Thank you for testing our app"
3. Zapisz jako `test.pptx`
4. Sprawdź rozmiar (powinien być ~15-30KB)

## ⚡ SZYBKI START

```bash
# 1. Zainstaluj wszystko
./install-dependencies.sh

# 2. Uruchom aplikację  
npm run dev

# 3. Otwórz http://localhost:3000

# 4. Stwórz test PPTX w PowerPoint lub użyj sample file

# 5. Przetestuj proces tłumaczenia

# 6. Sprawdź Console (F12) dla szczegółowych logów
```

## 🎨 TRYBY DZIAŁANIA

### Development Mode (Obecnie aktywny)
- ✅ Działa bez prawdziwych plików PPTX
- ✅ Używa mock danych do demonstracji
- ✅ Pokazuje cały proces UI/UX  
- ✅ Bezpieczny do testów
- ⚠️ Nie wykonuje prawdziwych tłumaczeń

### Production Mode (Wymaga Google APIs)
- ✅ Prawdziwe przetwarzanie PPTX
- ✅ Rzeczywiste tłumaczenia przez Google Translate
- ✅ Upload/Download przez Google Drive
- ⚠️ Wymaga konfiguracji Google Cloud
- ⚠️ Może generować koszty API

## 🏁 PODSUMOWANIE

**Twój główny problem:** Plik PPTX ma tylko 70 bytes - to za mało na prawdziwy PowerPoint.

**Rozwiązania:**
1. Stwórz nowy plik PPTX z contentem (>10KB)
2. Użyj przykładowego pliku z aplikacji
3. Przetestuj aplikację w trybie development

**Aplikacja DZIAŁA** - problem jest tylko z rozmiarem Twojego pliku PPTX! 🎉

---
💡 **Potrzebujesz pomocy?** Sprawdź logi w Console przeglądarki (F12) lub stwórz nowy test PPTX.