# 🚀 NETLIFY XLSX FIX - Rozwiązanie błędu importu XLSX

## 🔍 Problem
```
[vite]: Rollup failed to resolve import "xlsx" from "/opt/build/repo/services/translationService.ts".
This is most likely unintended because it can break your application at runtime.
If you do want to externalize this module explicitly add it to `build.rollupOptions.external`
```

## ✅ Rozwiązanie

### Metoda 1: Automatyczna (ZALECANA)

```bash
# Uruchom skrypt naprawczy
chmod +x netlify-xlsx-fix.sh
./netlify-xlsx-fix.sh
```

### Metoda 2: Ręczna

#### Krok 1: Sprawdź package.json
Upewnij się, że `xlsx` jest w dependencies:

```json
{
  "dependencies": {
    "xlsx": "^0.18.5",
    // ... inne dependencies
  }
}
```

#### Krok 2: Wyczyść i reinstaluj
```bash
rm -rf node_modules
rm -f package-lock.json
npm install --legacy-peer-deps
```

#### Krok 3: Sprawdź vite.config.ts
Upewnij się, że zawiera:

```typescript
export default defineConfig({
  // ...
  optimizeDeps: {
    include: [
      'xlsx'  // Dodaj xlsx tutaj
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'xlsx-vendor': ['xlsx']  // Osobny chunk dla xlsx
        }
      }
    }
  }
})
```

#### Krok 4: Sprawdź dynamiczne importy
W `translationService.ts` używaj tylko dynamicznych importów:

```typescript
// ❌ Złe - statyczny import
import * as XLSX from 'xlsx';

// ✅ Dobre - dynamiczny import
const XLSX = (await import('xlsx')).default;
```

#### Krok 5: Test lokalny
```bash
npm run build:simple
```

#### Krok 6: Commit i push
```bash
git add .
git commit -m "Fix: XLSX import issue for Netlify deployment"
git push
```

## 🔧 Dodatkowe opcje naprawy

### Opcja A: External dependency (jeśli nadal nie działa)

W `vite.config.ts`:
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['xlsx']  // Oznacz xlsx jako external
    }
  }
})
```

### Opcja B: Fallback na CDN

Dodaj do `index.html`:
```html
<script src="https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
```

## 🎯 Najczęstsze przyczyny problemu

1. **Brak dependency** - xlsx nie jest w package.json
2. **Problemy z bundlerem** - Vite nie wie jak obsłużyć xlsx
3. **Statyczne importy** - używanie import zamiast dynamicznego importu
4. **Cache** - stare node_modules lub cache bundlera
5. **Wersje Node.js** - Netlify wymaga Node.js >=18

## 🚀 Weryfikacja naprawy

### Sprawdź lokalnie:
```bash
# 1. Build powinien przejść bez błędów
npm run build:simple

# 2. Sprawdź czy xlsx jest zainstalowany
ls node_modules/xlsx

# 3. Sprawdź czy dist został utworzony
ls dist/
```

### Sprawdź na Netlify:
1. Idź do Netlify Dashboard
2. Zobacz logi deployment
3. Sprawdź czy błąd xlsx zniknął

## 🛠️ Fallback solutions

### Jeśli XLSX nadal nie działa:

#### 1. Mock Implementation
```typescript
// W translationService.ts
const getMockXLSX = () => ({
  utils: {
    aoa_to_sheet: (data: any[][]) => ({ mock: true, data }),
    book_new: () => ({ mock: true, SheetNames: [], Sheets: {} }),
    book_append_sheet: (wb: any, ws: any, name: string) => {
      wb.SheetNames.push(name);
      wb.Sheets[name] = ws;
    }
  },
  write: (wb: any, opts: any) => new TextEncoder().encode('mock csv data')
});
```

#### 2. CSV Fallback
```typescript
const generateCSV = (data: any[][]) => {
  return data.map(row => 
    row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');
};
```

## 📊 Status check commands

```bash
# Sprawdź czy wszystko jest OK
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "XLSX installed: $([ -d node_modules/xlsx ] && echo "YES" || echo "NO")"
echo "Build status: $(npm run build:simple > /dev/null 2>&1 && echo "OK" || echo "FAILED")"
```

## 🎉 Success indicators

Po pomyślnej naprawie powinieneś zobaczyć:
- ✅ Build lokalny przechodzi bez błędów
- ✅ node_modules/xlsx istnieje  
- ✅ dist/ folder zostaje utworzony
- ✅ Netlify deployment się udaje
- ✅ Brak błędów związanych z xlsx w logach

## 🆘 Support

Jeśli problem nadal występuje:

1. **Sprawdź logi Netlify** - dokładne błędy
2. **Sprawdź wersję Node.js** - Netlify uses 18+
3. **Sprawdź environment variables** - czy wszystkie są ustawione
4. **Spróbuj deploy z clean cache** - w Netlify UI

---

**Uwaga:** Ten fix jest testowany na Netlify z Node.js 18+ i Vite 5+. Dla innych platformy mogą być potrzebne modyfikacje.