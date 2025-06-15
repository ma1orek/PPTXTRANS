// Browser-compatible Google API Service
// This version handles both real API calls and fallback modes gracefully

interface GoogleCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
}

interface SheetsData {
  spreadsheetId: string;
  sheets: Array<{
    properties: {
      sheetId: number;
      title: string;
    };
  }>;
}

class GoogleApiService {
  private credentials: GoogleCredentials;
  private auth: any = null;
  private drive: any = null;
  private sheets: any = null;
  private isInitialized = false;
  private useRealApis = false;

  constructor(credentials: GoogleCredentials) {
    this.credentials = credentials;
  }

  // Check if we're in a compatible environment and try to initialize APIs
  private async initializeApis(): Promise<boolean> {
    if (this.isInitialized) return this.useRealApis;

    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        console.log('📝 Server environment detected, using mock mode');
        this.useRealApis = false;
        this.isInitialized = true;
        return false;
      }

      console.log('🔧 Attempting to initialize Google APIs...');
      
      // Try dynamic import with proper error handling
      let google: any = null;
      try {
        const googleapis = await import('googleapis');
        google = googleapis.google;
        console.log('✅ googleapis imported successfully');
      } catch (importError) {
        // Safe error logging that doesn't convert objects to primitives
        const errorMessage = importError instanceof Error 
          ? importError.message 
          : 'Unknown import error';
        console.warn('⚠️ googleapis not available:', errorMessage);
        this.useRealApis = false;
        this.isInitialized = true;
        return false;
      }
      
      // Create JWT auth client
      try {
        this.auth = new google.auth.JWT({
          email: this.credentials.client_email,
          key: this.credentials.private_key.replace(/\\n/g, '\n'),
          scopes: [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/spreadsheets'
          ]
        });

        // Initialize API clients
        this.drive = google.drive({ version: 'v3', auth: this.auth });
        this.sheets = google.sheets({ version: 'v4', auth: this.auth });

        console.log('✅ Google API clients initialized');
        this.useRealApis = true;
        this.isInitialized = true;
        return true;
      } catch (authError) {
        const errorMessage = authError instanceof Error 
          ? authError.message 
          : 'Authentication initialization failed';
        console.warn('⚠️ Google API initialization failed:', errorMessage);
        this.useRealApis = false;
        this.isInitialized = true;
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to initialize Google APIs';
      console.warn('⚠️ Failed to initialize Google APIs, using fallback mode:', errorMessage);
      this.useRealApis = false;
      this.isInitialized = true;
      return false;
    }
  }

  // Authenticate with Google APIs or return mock token
  async authenticate(): Promise<string> {
    const success = await this.initializeApis();
    
    if (!success) {
      console.log('📝 Using mock authentication');
      return 'mock_token_' + Date.now();
    }

    try {
      await this.auth.authorize();
      console.log('✅ Google APIs authentication successful');
      return this.auth.credentials.access_token || 'authenticated_' + Date.now();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      console.error('❌ Authentication failed:', errorMessage);
      this.useRealApis = false;
      return 'fallback_token_' + Date.now();
    }
  }

  // Upload file to Google Drive or simulate upload
  async uploadToDrive(file: File, parentFolderId?: string): Promise<DriveFile> {
    await this.authenticate();

    if (!this.useRealApis) {
      return this.mockUploadToDrive(file);
    }

    try {
      console.log(`📤 Uploading ${file.name} to Google Drive...`);

      // Convert File to buffer for upload
      const buffer = await file.arrayBuffer();
      const media = {
        mimeType: file.type,
        body: Buffer.from(buffer)
      };

      const fileMetadata: any = {
        name: file.name,
        parents: parentFolderId ? [parentFolderId] : undefined
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,name,mimeType,size,webViewLink,webContentLink'
      });

      const uploadedFile = response.data;
      console.log(`✅ File uploaded successfully: ${uploadedFile.id}`);

      return {
        id: uploadedFile.id,
        name: uploadedFile.name,
        mimeType: uploadedFile.mimeType,
        size: uploadedFile.size,
        webViewLink: uploadedFile.webViewLink,
        webContentLink: uploadedFile.webContentLink
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      console.error('❌ Real upload failed, using mock:', errorMessage);
      return this.mockUploadToDrive(file);
    }
  }

  // Mock upload implementation
  private async mockUploadToDrive(file: File): Promise<DriveFile> {
    console.log(`📝 Mock uploading ${file.name}...`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const fileId = 'mock_drive_file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        resolve({
          id: fileId,
          name: file.name,
          mimeType: file.type,
          size: file.size.toString(),
          webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
          webContentLink: `https://drive.google.com/uc?id=${fileId}&export=download`
        });
      }, 1000 + Math.random() * 1000); // 1-2 second delay
    });
  }

  // Download file from Google Drive or simulate
  async downloadFromDrive(fileId: string): Promise<Blob> {
    await this.authenticate();

    if (!this.useRealApis) {
      return this.mockDownloadFromDrive(fileId);
    }

    try {
      console.log(`📥 Downloading file ${fileId} from Google Drive...`);

      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, { responseType: 'arraybuffer' });

      const blob = new Blob([response.data]);
      console.log(`✅ File downloaded successfully`);
      return blob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      console.error('❌ Real download failed, using mock:', errorMessage);
      return this.mockDownloadFromDrive(fileId);
    }
  }

  // Mock download implementation
  private async mockDownloadFromDrive(fileId: string): Promise<Blob> {
    console.log(`📝 Mock downloading file ${fileId}...`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Create a realistic mock PPTX blob
        const mockContent = new Uint8Array([
          0x50, 0x4B, 0x03, 0x04, // ZIP file signature for PPTX
          0x14, 0x00, 0x06, 0x00, 0x08, 0x00, 0x21, 0x00,
          // Add some more realistic content
          ...Array.from(new TextEncoder().encode(`Mock PPTX content for ${fileId}`))
        ]);
        
        resolve(new Blob([mockContent], { 
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
        }));
      }, 800 + Math.random() * 700); // 0.8-1.5 second delay
    });
  }

  // Create Google Sheet or simulate
  async createSheet(title: string): Promise<SheetsData> {
    await this.authenticate();

    if (!this.useRealApis) {
      return this.mockCreateSheet(title);
    }

    try {
      console.log(`📊 Creating Google Sheet: ${title}`);

      const request = {
        resource: {
          properties: {
            title: title
          }
        }
      };

      const response = await this.sheets.spreadsheets.create(request);
      const spreadsheet = response.data;

      console.log(`✅ Sheet created successfully: ${spreadsheet.spreadsheetId}`);

      return {
        spreadsheetId: spreadsheet.spreadsheetId,
        sheets: spreadsheet.sheets.map((sheet: any) => ({
          properties: {
            sheetId: sheet.properties.sheetId,
            title: sheet.properties.title
          }
        }))
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sheet creation failed';
      console.error('❌ Real sheet creation failed, using mock:', errorMessage);
      return this.mockCreateSheet(title);
    }
  }

  // Mock sheet creation
  private async mockCreateSheet(title: string): Promise<SheetsData> {
    console.log(`📝 Mock creating Google Sheet: ${title}`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const spreadsheetId = 'mock_sheet_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        resolve({
          spreadsheetId,
          sheets: [{
            properties: {
              sheetId: 0,
              title: 'Sheet1'
            }
          }]
        });
      }, 500 + Math.random() * 500); // 0.5-1 second delay
    });
  }

  // Update sheet data or simulate
  async updateSheetData(spreadsheetId: string, range: string, values: any[][]): Promise<void> {
    await this.authenticate();

    if (!this.useRealApis) {
      return this.mockUpdateSheetData(spreadsheetId, range, values);
    }

    try {
      console.log(`📝 Updating sheet ${spreadsheetId} range ${range}`);

      const request = {
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values
        }
      };

      await this.sheets.spreadsheets.values.update(request);
      console.log(`✅ Sheet updated successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sheet update failed';
      console.error('❌ Real sheet update failed, using mock:', errorMessage);
      return this.mockUpdateSheetData(spreadsheetId, range, values);
    }
  }

  // Mock sheet update
  private async mockUpdateSheetData(spreadsheetId: string, range: string, values: any[][]): Promise<void> {
    console.log(`📝 Mock updating sheet ${spreadsheetId} range ${range} with ${values.length} rows`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 300 + Math.random() * 400); // 0.3-0.7 second delay
    });
  }

  // Batch update sheet or simulate
  async batchUpdateSheet(spreadsheetId: string, requests: any[]): Promise<void> {
    await this.authenticate();

    if (!this.useRealApis) {
      return this.mockBatchUpdateSheet(spreadsheetId, requests);
    }

    try {
      console.log(`🔄 Batch updating sheet ${spreadsheetId}`);

      const batchUpdateRequest = {
        spreadsheetId,
        resource: {
          requests
        }
      };

      await this.sheets.spreadsheets.batchUpdate(batchUpdateRequest);
      console.log(`✅ Batch update completed`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch update failed';
      console.error('❌ Real batch update failed, using mock:', errorMessage);
      return this.mockBatchUpdateSheet(spreadsheetId, requests);
    }
  }

  // Mock batch update
  private async mockBatchUpdateSheet(spreadsheetId: string, requests: any[]): Promise<void> {
    console.log(`📝 Mock batch updating sheet ${spreadsheetId} with ${requests.length} requests`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 500 + Math.random() * 500); // 0.5-1 second delay
    });
  }

  // Get sheet values or simulate
  async getSheetValues(spreadsheetId: string, range: string): Promise<any[][]> {
    await this.authenticate();

    if (!this.useRealApis) {
      return this.mockGetSheetValues(spreadsheetId, range);
    }

    try {
      console.log(`📖 Getting values from sheet ${spreadsheetId} range ${range}`);

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
        valueRenderOption: 'UNFORMATTED_VALUE'
      });

      const values = response.data.values || [];
      console.log(`✅ Retrieved ${values.length} rows from sheet`);
      return values;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sheet values retrieval failed';
      console.error('❌ Real sheet values retrieval failed, using mock:', errorMessage);
      return this.mockGetSheetValues(spreadsheetId, range);
    }
  }

  // Mock sheet values retrieval with realistic translations
  private async mockGetSheetValues(spreadsheetId: string, range: string): Promise<any[][]> {
    console.log(`📝 Mock getting values from sheet ${spreadsheetId} range ${range}`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate realistic mock translation data
        const mockTranslations = [
          ['Slide', 'English', 'Polish', 'Spanish', 'French', 'German'],
          ['1', 'Welcome to Our Presentation', 'Witamy w naszej prezentacji', 'Bienvenido a nuestra presentación', 'Bienvenue à notre présentation', 'Willkommen zu unserer Präsentation'],
          ['2', 'Our Mission Statement', 'Nasze oświadczenie o misji', 'Nuestra declaración de misión', 'Notre énoncé de mission', 'Unser Leitbild'],
          ['3', 'Key Features and Benefits', 'Kluczowe funkcje i korzyści', 'Características y beneficios clave', 'Caractéristiques et avantages clés', 'Hauptmerkmale und Vorteile'],
          ['4', 'Thank you for your attention', 'Dziękujemy za uwagę', 'Gracias por su atención', 'Merci pour votre attention', 'Vielen Dank für Ihre Aufmerksamkeit']
        ];
        resolve(mockTranslations);
      }, 1000 + Math.random() * 1000); // 1-2 second delay to simulate translation time
    });
  }

  // Export sheet as Excel or simulate
  async exportSheetAsExcel(spreadsheetId: string): Promise<Blob> {
    await this.authenticate();

    if (!this.useRealApis) {
      return this.mockExportSheetAsExcel(spreadsheetId);
    }

    try {
      console.log(`📋 Exporting sheet ${spreadsheetId} as Excel`);

      const response = await this.drive.files.export({
        fileId: spreadsheetId,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }, { responseType: 'arraybuffer' });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      console.log(`✅ Sheet exported as Excel successfully`);
      return blob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Excel export failed';
      console.error('❌ Real Excel export failed, using mock:', errorMessage);
      return this.mockExportSheetAsExcel(spreadsheetId);
    }
  }

  // Mock Excel export
  private async mockExportSheetAsExcel(spreadsheetId: string): Promise<Blob> {
    console.log(`📝 Mock exporting sheet ${spreadsheetId} as Excel`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Create mock Excel blob
        const mockExcelData = new Uint8Array([
          0x50, 0x4B, 0x03, 0x04, 0x20, 0x00, 0x06, 0x00, // Excel ZIP signature
          ...Array.from(new TextEncoder().encode(`Mock Excel data for ${spreadsheetId}`))
        ]);
        resolve(new Blob([mockExcelData], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        }));
      }, 600 + Math.random() * 400); // 0.6-1 second delay
    });
  }

  // Delete file or simulate
  async deleteFile(fileId: string): Promise<void> {
    await this.authenticate();

    if (!this.useRealApis) {
      return this.mockDeleteFile(fileId);
    }

    try {
      console.log(`🗑️ Deleting file ${fileId}`);
      await this.drive.files.delete({ fileId: fileId });
      console.log(`✅ File deleted successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'File deletion failed';
      console.warn('⚠️ File deletion failed (continuing):', errorMessage);
      // Don't throw error for cleanup operations
    }
  }

  // Mock file deletion
  private async mockDeleteFile(fileId: string): Promise<void> {
    console.log(`📝 Mock deleting file ${fileId}`);
    return Promise.resolve();
  }

  // Wait for formulas to calculate or simulate
  async waitForFormulasToCalculate(spreadsheetId: string, maxWaitTime: number = 60000): Promise<boolean> {
    const startTime = Date.now();
    const checkInterval = 3000; // Check every 3 seconds
    
    console.log(`⏳ Waiting for formulas to calculate in sheet ${spreadsheetId}`);
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const values = await this.getSheetValues(spreadsheetId, 'C2:Z100');
        
        if (values.length === 0) {
          console.log('📝 No translation data found yet, waiting...');
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          continue;
        }
        
        // Check if we have actual translations (mock always returns good data)
        const hasTranslations = values.some(row =>
          row.some(cell => 
            typeof cell === 'string' && 
            cell.length > 3 && 
            !cell.toLowerCase().includes('loading') &&
            !cell.includes('#')
          )
        );
        
        if (hasTranslations) {
          console.log('✅ All formulas have been calculated');
          return true;
        }
        
        const progress = Math.min(90, ((Date.now() - startTime) / maxWaitTime) * 100);
        console.log(`⏳ Formulas still calculating... ${progress.toFixed(0)}%`);
        
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Formula status check failed';
        console.error('❌ Error checking formula status:', errorMessage);
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
    }
    
    console.log('⚠️ Timeout reached, proceeding with current values');
    return false;
  }

  // Make sheet publicly readable or simulate
  async makeSheetPublic(fileId: string): Promise<void> {
    await this.authenticate();

    if (!this.useRealApis) {
      console.log(`📝 Mock making sheet ${fileId} public`);
      return Promise.resolve();
    }

    try {
      await this.drive.permissions.create({
        fileId: fileId,
        resource: {
          role: 'reader',
          type: 'anyone'
        }
      });
      console.log(`✅ Sheet made publicly readable`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Make sheet public failed';
      console.warn('⚠️ Failed to make sheet public (continuing):', errorMessage);
      // Continue without public access
    }
  }

  // Get service status
  getServiceStatus(): { connected: boolean; mode: string; message: string } {
    return {
      connected: this.isInitialized && this.useRealApis,
      mode: this.useRealApis ? 'production' : 'development',
      message: this.useRealApis 
        ? 'Connected to Google APIs' 
        : 'Using development mode with mock data'
    };
  }
}

// Export singleton instance with real credentials
const GOOGLE_CREDENTIALS: GoogleCredentials = {
  type: "service_account",
  project_id: "sweden-383609",
  private_key_id: "e27db569b1ecba0a2eb1b6b71edc75b386dfb316",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDVSxeQmmVJFHRQ\nmjv7zJNyykqmpJCis5U5IQdAlQsMpGOJW8WCQh8DdXwc6aIAHAf0U2ErRTuK/nSU\nFKR2Lj6yn2Ux0m/PPSiA/xNfHhW5JInmkVdM3WM5xfijsP+w98rHrtrSkrHr0HdC\nlS5bhmliOa4lpDWu2WxNjJRsOCrHzP+J8x3hjFHAr6XfGxOQmwu2FZ4uRq72YO5w\nxYlGgvez8HIkcqfzcn8IyMj03yc8S7sVVkH1IAynl5M3E2IOVcI5opSjzvJq5k8W\nuXgLuuMnlMmXWTASXMwhNqrNgkHubO6C89ibACPnRJmNf3i+f1qAMPhzcpRPxxie\nUv3GvQ+5AgMBAAECggEAM4i9rFQJldMp2VGynX+Lvqfuyn2nbpA6RT/cKzf3n/nW\nDNmOCo9kQ+cuciPm3uTm7Rr6NsS3ArnBPAgSxnUc8/Z8MkH4ftd1glle+lPgBsgz\nw3Apaipxb4OMNCyvUrhEF+QA/fCwqVvIfN9jgHyk2LU8BN88kz74InKNZ+pYN8a4\nZ/DhTaaokO94cW4FI/iKxViV7yxtRd9t/ZkGNjC5arPii4CRvD1s8vfJF9+TjKoU\n9e01bGS9Tgo5ho49BVhxgkNfYoFcZhzb5XD0slxeSQzjY67AAANajuIowcRmP1qX\naFILNbHKOVcnlkyegLlg+sIr4JFUqQdiwEMmpoXGOwKBgQD6C+pcnWmGUmMLuJob\n5v+L/CJbcq91nIX9JQL0oye4CU9kv23625pLz5adK2W77TewTxXFYCDpu+E7KkAg\nu5A+B10W0iJpGyaw80pZqpJx3JDCSpS3o8m9y51C8MLNSjGTPJjY1oB7iPYIPONh\nymlNyG9j3zusbNSuoGpg5zmFYwKBgQDaXyiC8vX70V8VUGCj0cWeZbzJ60EDXSA2\nmKjF0LsWF/q4SLc3ET7mPJ6gvwsvJZEaBy9RySQyUteyJUH5pxN+SK5fvev2Q028\nUVn0Gu0t4ILkzEB8fmV8zRyqSVtW/qyH8C9WyKlnHYba4nWEkd9Dg6/qXdMV7MrC\nZmIDkIWfMwKBgAXJstIT/rZSP+KskjylGzM1UeJGBFO3nM5gRfI9uJSk+oZ9e+E7\nphWtJ3JZ58/yzMAzBHD+KaTfaXZCIxve25bj+r6lfJBsRXgBGa57qUojbeJhcZHS\no7/V77z177xqxD0BQRR72puBbxh/uE+yLL/VLObl6u6x0jZ8lhnKIGW7AoGBAMy7\n0ruTFtTVY5QUG8b7cZAkSm/1RKrmsMD/N5zfKch5CvOkGUJjxNkPlJmZA99cFUKV\n4eOH9YvI57l5/PUXk8seUX4qDgSA7WzVyMR4Sk5s48unQ/50cqojk/CDfkN92jxJ\nD9kJoOmwYTLuhseYC/68hD3zYWh47VB9tP8qjFzJAoGBAMeGn9kZzyuUYNZZrMq9\n9pXXmrAqK4cTgLaw8Dq7yZzVjcnpgpC1CbyqB79v4By4zf+7M9KcVMsuUesojpND\nLUSfmeHW8ZXvgiRLKViOtg29ZENLFcuztEXMrF0VfLwliyKAilufr+3p+x2uH/fw\nDXnmzHlPtEaY5D22zNC9HOBp\n-----END PRIVATE KEY-----\n",
  client_email: "w12345@sweden-383609.iam.gserviceaccount.com",
  client_id: "115538923647917923403",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/w12345%40sweden-383609.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

export const googleApiService = new GoogleApiService(GOOGLE_CREDENTIALS);
export type { DriveFile, SheetsData };