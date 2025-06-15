# 🚨 SZYBKA NAPRAWA BEZPIECZEŃSTWA

## ⚡ **2 MINUTY - NAPRAW BEZPIECZEŃSTWO:**

### **KROK 1: USUŃ JSON Z GITHUB (NATYCHMIAST)**
```bash
# W folderze z kodem:
rm sweden-383609-e27db569b1ec.json
git add .
git commit -m "Remove sensitive API key"
git push
```

### **KROK 2: DODAJ DO NETLIFY**
1. **app.netlify.com** → Twoja strona
2. **Site settings** → **Environment variables**
3. **Add variable:**
   - Key: `VITE_GOOGLE_SERVICE_ACCOUNT_KEY`
   - Value: [JSON jako jedna linia]

### **KROK 3: REDEPLOY**
**Deploys** → **Trigger deploy** → **Deploy site**

---

## 🔧 **AUTOMATYCZNY KONWERTER JSON:**

### **Wklej swój JSON tutaj:**
```
[Wklej zawartość sweden-383609-e27db569b1ec.json]
```

### **Użyj tego w Netlify:**
```
[Skonwertowana wersja pojawi się tutaj]
```

**Lub użyj:** [jsonformatter.org/json-minify](https://jsonformatter.org/json-minify)

---

## 📱 **GDZIE DOKŁADNIE W NETLIFY:**

```
app.netlify.com
├── [Twoja strona - np. coruscating-pony-8b3075]
│   ├── Site settings ← KLIKNIJ
│   │   ├── Environment variables ← KLIKNIJ
│   │   │   └── Add a variable ← KLIKNIJ
│   │   │       ├── Key: VITE_GOOGLE_SERVICE_ACCOUNT_KEY
│   │   │       └── Value: [JSON jedna linia]
│   └── Deploys ← PO DODANIU ZMIENNEJ
│       └── Trigger deploy ← KLIKNIJ
```

---

## ✅ **SUKCES = BADGE ZMIENI SIĘ:**

### **Przed:**
🟡 **"Mock Mode"** - basic functionality

### **Po:**
🟢 **"APIs Connected"** - premium Google APIs!

---

## 🚨 **DLACZEGO TO PILNE:**

### **GitHub = PUBLIC = Wszyscy widzą klucz!**
- 💸 Ktoś może używać Twojego klucza
- 🚫 Google może zablokować projekt
- 💳 Mogą się naliczać koszty

### **Netlify Environment Variables = BEZPIECZNE:**
- 🔐 Tylko Twoja aplikacja ma dostęp
- 🛡️ Nie widać w kodzie źródłowym
- ✅ Industry standard dla API keys

---

## 📞 **SZYBKA POMOC:**

**Jeśli nie wiesz jak:**
1. **Pokaż screenshot** Netlify Dashboard
2. **Wyślij pierwszych 5 linii** JSON (bez private_key!)
3. **Napisz jakie błędy** widzisz

**I od razu pomogę!** 🚀

---

**GŁÓWNE: Usuń z GitHub + Dodaj do Netlify = Problem rozwiązany!** ⚡