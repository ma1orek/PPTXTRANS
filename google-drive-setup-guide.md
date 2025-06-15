# 🔧 GOOGLE DRIVE INTEGRATION SETUP GUIDE

## 📋 **CURRENT STATUS:**
Your PPTX Translator Pro is successfully deployed, but to enable **real Google Drive integration and translations**, you need to configure Google API credentials.

## 🔑 **GOOGLE API CREDENTIALS SETUP:**

### **Step 1: Service Account JSON File**
You mentioned the file `sweden-383609-e27db569b1ec.json` - this appears to be a Google Cloud service account key.

**IMPORTANT SECURITY NOTE:** Never commit this file to GitHub as it contains sensitive credentials.

### **Step 2: Where to Place the JSON File**

**Option A: Environment Variables (Recommended for Production)**
```bash
# Convert your JSON file content to a single-line string and add to Netlify environment variables
GOOGLE_SERVICE_ACCOUNT_KEY="your-json-content-as-single-line"
```

**Option B: Direct File (Development Only)**
```
# Place the file in your project root (NOT committed to Git)
/sweden-383609-e27db569b1ec.json

# Add to .gitignore
*.json
!package.json
!tsconfig.json
```

### **Step 3: Update Google API Service**

The `googleApi.ts` service needs to be configured to use your credentials:

```typescript
// In services/googleApi.ts - update the authentication section
private async initializeAuth(): Promise<void> {
  if (typeof window !== 'undefined') {
    // Browser environment - use environment variables
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountKey) {
      const credentials = JSON.parse(serviceAccountKey);
      // Initialize with your service account
    }
  }
}
```

### **Step 4: Required Google APIs**
Your service account needs access to:
- **Google Drive API** - for file upload/download
- **Google Sheets API** - for translation processing
- **Google Translate API** - for actual translations

### **Step 5: Netlify Environment Variables**
1. Go to Netlify Dashboard → Your Site → Environment Variables
2. Add these variables:
```
GOOGLE_SERVICE_ACCOUNT_KEY = "your-json-content-here"
GOOGLE_PROJECT_ID = "sweden-383609"
```

## 🚀 **DEPLOYMENT STEPS:**

### **Immediate Action Required:**
1. **DO NOT** commit the JSON file to GitHub
2. Convert JSON to environment variable
3. Update Netlify environment variables
4. Redeploy the application

### **Test Real Integration:**
After setup, the app will:
- ✅ Upload PPTX to Google Drive
- ✅ Create Google Sheets with extracted text
- ✅ Use Google Translate formulas for real translations
- ✅ Generate actual translated PPTX files
- ✅ Allow XLSX download with editable translations

## 📊 **CURRENT FUNCTIONALITY:**

### **Without Google Credentials (Current State):**
- ✅ File upload and validation
- ✅ Text extraction from PPTX
- ⚠️ **Mock translations** (not real Google Translate)
- ⚠️ **Dummy PPTX files** (contain placeholder text)
- ❌ No Google Drive storage
- ❌ No editable XLSX downloads

### **With Google Credentials (Target State):**
- ✅ Everything above PLUS:
- ✅ **Real Google Translate API translations**
- ✅ **Actual translated PPTX files**
- ✅ Google Drive integration
- ✅ Editable Google Sheets/XLSX downloads
- ✅ Unlimited language support
- ✅ Professional translation quality

## 🔒 **SECURITY BEST PRACTICES:**

1. **Never commit credentials to Git**
2. **Use environment variables in production**
3. **Limit service account permissions**
4. **Regularly rotate credentials**
5. **Monitor API usage**

## ❓ **NEXT STEPS:**

**Would you like me to:**
1. **Update the Google API service** to use your credentials?
2. **Create setup instructions** for Netlify environment variables?
3. **Test the integration** with your service account?
4. **Add credential validation** to check if setup is correct?

**Your JSON file should be configured as an environment variable, not committed to the repository.**

Let me know if you need help with any of these steps!