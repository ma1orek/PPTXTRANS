# 🚀 PPTX Translator Pro

**Professional PowerPoint Translation Tool** z integracją Google Drive

**Czas ostatniej aktualizacji: 21:31** ⏰

---

## 🎯 SZYBKI START (5 minut)

### 📋 Wymagania
- **Node.js 18+** (pobierz z [nodejs.org](https://nodejs.org/))
- **Git** (opcjonalnie)

### ⚡ Automatyczna instalacja

```bash
# 1. Pobierz projekt
git clone https://github.com/TWOJA_NAZWA/pptx-translator-pro.git
cd pptx-translator-pro

# 2. Uruchom automatyczny setup
chmod +x setup.sh
./setup.sh

# 3. Uruchom aplikację
npm run dev
```

**Gotowe!** Aplikacja działa na http://localhost:5173 🎉

---

## 🌐 DEPLOYMENT NA NETLIFY (2 minuty)

### Metoda 1: GitHub → Netlify (ZALECANE)

1. **Push na GitHub:**
   ```bash
   git add .
   git commit -m "PPTX Translator Pro"
   git push origin main
   ```

2. **Netlify Deploy:**
   - Idź na [netlify.com](https://netlify.com)
   - Kliknij "New site from Git"
   - Wybierz swoje GitHub repo
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - Kliknij "Deploy site"

3. **GOTOWE!** 🚀 
   - Twoja aplikacja: `https://your-app-name.netlify.app`
   - Auto-deploy przy każdym git push

### Metoda 2: Drag & Drop

```bash
# Zbuduj aplikację
npm run build

# Przeciągnij folder 'dist' na netlify.com
```

---

## 🛠️ ROZWIĄZYWANIE PROBLEMÓW

### ❌ "npm install failed"

```bash
# Metoda 1: Legacy peer deps
npm install --legacy-peer-deps --force

# Metoda 2: Usuń i zainstaluj ponownie
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Metoda 3: Użyj Yarn
npm install -g yarn
yarn install --ignore-engines
```

### ❌ "Build failed"

```bash
# Wyczyść i zbuduj ponownie
npm run build -- --emptyOutDir

# Lub z flagą force
rm -rf dist
npm run build
```

### ❌ "Dependency conflicts"

```bash
# Instaluj z flagami obejścia konfliktów
npm install --legacy-peer-deps --no-optional --force
```

---

## 📁 STRUKTURA PROJEKTU

```
├── 📄 App.tsx              # Główny komponent
├── 🎨 styles/globals.css   # Style Tailwind CSS
├── 🧩 components/          # Komponenty React
│   ├── FileUploader.tsx
│   ├── LanguageSelector.tsx
│   └── ui/                 # ShadCN komponenty
├── 🔧 services/            # Logika biznesowa
│   ├── translationService.ts
│   ├── googleApi.ts
│   └── pptxProcessor.ts
├── 🌐 hooks/               # React hooks
├── 📦 package.json         # Dependencies
├── ⚙️ vite.config.ts       # Konfiguracja build
├── 🚀 netlify.toml         # Konfiguracja Netlify
└── 📋 setup.sh             # Automatyczna instalacja
```

---

## ✨ FUNKCJE APLIKACJI

### 🎯 Główne możliwości:
- ✅ **Upload plików PPTX** - przeciągnij i upuść
- ✅ **5 języków jednocześnie** - maksymalnie
- ✅ **Google Translate API** - automatyczne tłumaczenie
- ✅ **Zachowanie formatowania** - oryginalny layout
- ✅ **Mouse-reactive tło** - animacje za kursorem
- ✅ **PWA ready** - działa offline
- ✅ **Responsive design** - mobile-friendly

### 🌍 Obsługiwane języki:
🇵🇱 Polski • 🇪🇸 Hiszpański • 🇫🇷 Francuski • 🇩🇪 Niemiecki • 🇮🇹 Włoski • 🇵🇹 Portugalski • 🇳🇱 Holenderski • 🇷🇺 Rosyjski • 🇯🇵 Japoński • 🇰🇷 Koreański • 🇨🇳 Chiński • 🇸🇦 Arabski

---

## 🔧 KOMENDY

```bash
# Rozwój
npm run dev          # Uruchom dev server
npm run build        # Zbuduj dla produkcji
npm run preview      # Podgląd buildu

# Setup
./setup.sh           # Automatyczna instalacja
npm run setup        # Alternatywny setup

# Deployment
npm run deploy       # Deploy na Netlify (wymaga CLI)
```

---

## 🚀 ALTERNATYWNE OPCJE DEPLOYMENT

### Vercel
```bash
# 1. Push na GitHub
# 2. Idź na vercel.com
# 3. Import repo → Deploy
# Link: https://your-app.vercel.app
```

### GitHub Pages
```bash
# 1. W ustawieniach repo włącz Pages
# 2. Source: GitHub Actions
# Link: https://username.github.io/repo-name
```

### Manual Deploy
```bash
npm run build
# Upload folder 'dist' na dowolny hosting
```

---

## 🔒 BEZPIECZEŃSTWO

- ✅ **No real API keys** w kodzie
- ✅ **Mock mode** domyślnie włączony  
- ✅ **Client-side only** - brak serwera
- ✅ **HTTPS everywhere** - Netlify/Vercel
- ✅ **Privacy first** - pliki nie są przechowywane

---

## 📊 TECH STACK

- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS v4 + ShadCN/UI
- **Build:** Vite + Rollup
- **Hosting:** Netlify/Vercel
- **APIs:** Google Drive + Sheets + Translate
- **PWA:** Service Worker + Manifest

---

## 🆘 POMOC

### Błędy instalacji?
1. **Usuń node_modules:** `rm -rf node_modules`
2. **Wyczyść cache:** `npm cache clean --force`
3. **Zainstaluj ponownie:** `npm install --legacy-peer-deps`

### Nie działa deployment?
1. **Build lokalnie:** `npm run build`
2. **Sprawdź logi** na Netlify/Vercel
3. **Sprawdź node version:** `node --version` (wymagane 18+)

### Inne problemy?
- 📧 **Email:** support@example.com
- 🐛 **Issues:** GitHub Issues
- 📚 **Docs:** README.md

---

## 📈 PRZYSZŁE FUNKCJE

- [ ] **Batch processing** - wiele plików jednocześnie
- [ ] **Custom templates** - własne szablony
- [ ] **AI translation** - OpenAI integration
- [ ] **Collaboration** - udostępnianie projektów
- [ ] **Analytics** - statystyki użycia

---

## 🎉 GOTOWE!

**Twoja aplikacja jest gotowa do użycia!**

1. ✅ **Lokalna wersja:** http://localhost:5173
2. ✅ **Online wersja:** https://your-app.netlify.app  
3. ✅ **Auto-deploy:** Każdy git push = aktualizacja

**Powodzenia z tłumaczeniem prezentacji!** 🚀

---

*Bartosz Idzik Enterprise Ecosystem • 2024*