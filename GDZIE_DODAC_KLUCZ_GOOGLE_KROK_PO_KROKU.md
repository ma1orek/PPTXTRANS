# 🚨 WAŻNE: GDZIE DODAĆ KLUCZ GOOGLE API

## ❌ **CO ROBISZ ŹLE:**
Wrzuciłeś `sweden-383609-e27db569b1ec.json` na **GitHub** - to **NIEBEZPIECZNE**! 

**DLACZEGO TO ZŁE:**
- 🔓 GitHub jest **PUBLIC** - każdy widzi Twój klucz
- 💸 Ktoś może **ukraść** Twój klucz i generować koszty
- 🚫 Google może **zablokować** Twój projekt za naruszenie bezpieczeństwa

---

## ✅ **WŁAŚCIWY SPOSÓB - NETLIFY ENVIRONMENT VARIABLES**

### **KROK 1: USUŃ JSON Z GITHUB (NATYCHMIAST!)**
```bash
# Usuń plik z repo
git rm sweden-383609-e27db569b1ec.json
git commit -m "Remove sensitive Google API key"
git push

# Lub po prostu usuń plik z folderu i zrób commit
```

### **KROK 2: IDŹ DO NETLIFY DASHBOARD**
1. **Otwórz:** [app.netlify.com](https://app.netlify.com)
2. **Zaloguj się** na swoje konto
3. **Znajdź** swoją stronę PPTX Translator Pro
4. **Kliknij** na nazwę swojej strony

### **KROK 3: DODAJ ENVIRONMENT VARIABLE**
1. **Po lewej stronie:** kliknij **"Site settings"**
2. **W menu:** kliknij **"Environment variables"** 
3. **Kliknij:** **"Add a variable"** (zielony przycisk)
4. **Wypełnij:**
   - **Key:** `VITE_GOOGLE_SERVICE_ACCOUNT_KEY`
   - **Value:** [zobacz KROK 4]

### **KROK 4: PRZYGOTUJ WARTOŚĆ KLUCZA**
Twój plik `sweden-383609-e27db569b1ec.json` wygląda tak:
```json
{
  "type": "service_account",
  "project_id": "sweden-383609",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BA...\n-----END PRIVATE KEY-----\n",
  "client_email": "nazwa@sweden-383609.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/nazwa%40sweden-383609.iam.gserviceaccount.com"
}
```

**SKONWERTUJ NA JEDNĄ LINIĘ:**
```json
{"type":"service_account","project_id":"sweden-383609","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BA...\\n-----END PRIVATE KEY-----\\n","client_email":"nazwa@sweden-383609.iam.gserviceaccount.com","client_id":"123456789...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/nazwa%40sweden-383609.iam.gserviceaccount.com"}
```

**⚠️ WAŻNE:** Zamień `\n` na `\\n` w private_key!

### **KROK 5: AUTOMATYCZNA KONWERSJA**
**OPCJA A: Online tool**
1. Idź na: [jsonformatter.org/json-minify](https://jsonformatter.org/json-minify)
2. Wklej swój JSON
3. Kliknij **"Minify"**
4. Skopiuj wynik

**OPCJA B: Prosty sposób**
1. Otwórz `sweden-383609-e27db569b1ec.json` w Notepad
2. Zaznacz wszystko (Ctrl+A)
3. Skopiuj (Ctrl+C)
4. Wklej tutaj ⬇️

### **KROK 6: DODAJ DO NETLIFY**
1. **Key:** `VITE_GOOGLE_SERVICE_ACCOUNT_KEY`
2. **Value:** [wklej skonwertowany JSON z kroku 5]
3. **Kliknij:** **"Save"**

### **KROK 7: REDEPLOY STRONY**
1. **Idź do:** **"Deploys"** (zakładka)
2. **Kliknij:** **"Trigger deploy"** → **"Deploy site"**
3. **Czekaj** ~2-3 minuty

### **KROK 8: SPRAWDŹ CZY DZIAŁA**
1. **Otwórz** swoją stronę
2. **Szukaj badge:** powinien być 🟢 **"APIs Connected"** zamiast 🟡 **"Mock Mode"**
3. **Sprawdź console** (F12): powinno być `✅ Google API authentication successful`

---

## 🔧 **SZYBKA POMOC - KONWERSJA JSON**

### **Twój JSON:**
```
Wklej tutaj zawartość sweden-383609-e27db569b1ec.json
⬇️
```

### **Skonwertowany (użyj tego w Netlify):**
```
[Tu będzie skonwertowana wersja]
```

---

## 🎯 **DOKŁADNIE GDZIE W NETLIFY:**

```
app.netlify.com
  └── Twoja strona (np. "coruscating-pony-8b3075")
      └── Site settings [KLIKNIJ]
          └── Environment variables [KLIKNIJ]  
              └── Add a variable [KLIKNIJ]
                  ├── Key: VITE_GOOGLE_SERVICE_ACCOUNT_KEY
                  └── Value: [JSON jako jedna linia]
```

---

## 🚨 **TROUBLESHOOTING**

### **Problem: Nadal "Mock Mode"**
**Rozwiązanie:**
1. Sprawdź czy nazwa to **dokładnie:** `VITE_GOOGLE_SERVICE_ACCOUNT_KEY`
2. Sprawdź czy JSON jest **jedna linia** (bez enterów)
3. **Redeploy** stronę po dodaniu zmiennej

### **Problem: "Authentication failed"**
**Rozwiązanie:**
1. Sprawdź czy wszystkie znaki `\n` to `\\n` w private_key
2. Sprawdź czy JSON jest poprawny (bez błędów składni)
3. Sprawdź czy APIs są włączone w Google Cloud Console

### **Problem: Gdzie jest moja strona w Netlify?**
**Rozwiązanie:**
1. Idź na [app.netlify.com](https://app.netlify.com)
2. Szukaj nazwy typu: `coruscating-pony-8b3075`
3. Lub szukaj po domenie: `https://twoja-nazwa.netlify.app`

---

## ✅ **SUKCES - BĘDZIESZ MIEĆ:**

### **Przed (Mock Mode):**
- 🟡 Yellow badge "Mock Mode"
- Podstawowe tłumaczenia
- Pliki działają ale limitowane

### **Po (Real APIs):**
- 🟢 Green badge "APIs Connected"  
- 🚀 **Real Google Translate** quality
- ☁️ **Google Drive** integration
- 📊 **Google Sheets** with GOOGLETRANSLATE()
- 💎 **Professional results**

---

## 📞 **POTRZEBUJESZ POMOCY?**

### **Wyślij mi:**
1. **Screenshot** Netlify Dashboard
2. **Zawartość** sweden-383609-e27db569b1ec.json (pierwszych kilka linii)
3. **Błędy** z browser console (F12)

### **A ja Ci:**
1. **Skonwertuję** JSON do właściwego formatu
2. **Pokażę** dokładnie gdzie kliknąć
3. **Sprawdzę** czy wszystko działa

---

## 🔒 **BEZPIECZEŃSTWO - ZAPAMIĘTAJ:**

✅ **DOBRZE:**
- Environment variables w Netlify
- Prywatne repo (jeśli musisz)
- .gitignore dla *.json

❌ **ŹLE:**
- JSON w public GitHub repo
- Klucze w kodzie źródłowym
- Udostępnianie kluczy w czacie

---

**NAJWAŻNIEJSZE: USUŃ JSON Z GITHUB I DODAJ DO NETLIFY ENVIRONMENT VARIABLES!** 🚨

**Twoja aplikacja jest gotowa - potrzebuje tylko właściwego klucza w właściwym miejscu!** ⚡