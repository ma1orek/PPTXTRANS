import { googleApiService } from './googleApi';

export interface TranslationResult {
  language: string;
  fileName: string;
  fileId: string;
  size?: number;
  downloadUrl?: string;
}

export interface ProgressCallback {
  (progress: {
    status: 'ready' | 'uploading' | 'extracting' | 'generating_xlsx' | 'translating' | 'downloading_translations' | 'rebuilding' | 'completed' | 'error';
    progress: number;
    currentStep?: string;
    error?: string;
  }): void;
}

class GoogleDriveTranslationService {
  private progressCallbacks: Map<string, ProgressCallback> = new Map();
  private resultCache: Map<string, Blob> = new Map();
  private driveFileCache: Map<string, string> = new Map(); // jobId -> Google Drive file ID

  // All 104 Google Translate language codes for GOOGLETRANSLATE() formulas
  private readonly GOOGLE_TRANSLATE_LANGUAGES = [
    { code: 'af', name: 'Afrikaans' },
    { code: 'sq', name: 'Albanian' },
    { code: 'am', name: 'Amharic' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hy', name: 'Armenian' },
    { code: 'az', name: 'Azerbaijani' },
    { code: 'eu', name: 'Basque' },
    { code: 'be', name: 'Belarusian' },
    { code: 'bn', name: 'Bengali' },
    { code: 'bs', name: 'Bosnian' },
    { code: 'bg', name: 'Bulgarian' },
    { code: 'ca', name: 'Catalan' },
    { code: 'ceb', name: 'Cebuano' },
    { code: 'ny', name: 'Chichewa' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'zh-tw', name: 'Chinese (Traditional)' },
    { code: 'co', name: 'Corsican' },
    { code: 'hr', name: 'Croatian' },
    { code: 'cs', name: 'Czech' },
    { code: 'da', name: 'Danish' },
    { code: 'nl', name: 'Dutch' },
    { code: 'en', name: 'English' },
    { code: 'eo', name: 'Esperanto' },
    { code: 'et', name: 'Estonian' },
    { code: 'tl', name: 'Filipino' },
    { code: 'fi', name: 'Finnish' },
    { code: 'fr', name: 'French' },
    { code: 'fy', name: 'Frisian' },
    { code: 'gl', name: 'Galician' },
    { code: 'ka', name: 'Georgian' },
    { code: 'de', name: 'German' },
    { code: 'el', name: 'Greek' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'ht', name: 'Haitian Creole' },
    { code: 'ha', name: 'Hausa' },
    { code: 'haw', name: 'Hawaiian' },
    { code: 'he', name: 'Hebrew' },
    { code: 'hi', name: 'Hindi' },
    { code: 'hmn', name: 'Hmong' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'is', name: 'Icelandic' },
    { code: 'ig', name: 'Igbo' },
    { code: 'id', name: 'Indonesian' },
    { code: 'ga', name: 'Irish' },
    { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'jw', name: 'Javanese' },
    { code: 'kn', name: 'Kannada' },
    { code: 'kk', name: 'Kazakh' },
    { code: 'km', name: 'Khmer' },
    { code: 'ko', name: 'Korean' },
    { code: 'ku', name: 'Kurdish (Kurmanji)' },
    { code: 'ky', name: 'Kyrgyz' },
    { code: 'lo', name: 'Lao' },
    { code: 'la', name: 'Latin' },
    { code: 'lv', name: 'Latvian' },
    { code: 'lt', name: 'Lithuanian' },
    { code: 'lb', name: 'Luxembourgish' },
    { code: 'mk', name: 'Macedonian' },
    { code: 'mg', name: 'Malagasy' },
    { code: 'ms', name: 'Malay' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'mt', name: 'Maltese' },
    { code: 'mi', name: 'Maori' },
    { code: 'mr', name: 'Marathi' },
    { code: 'mn', name: 'Mongolian' },
    { code: 'my', name: 'Myanmar (Burmese)' },
    { code: 'ne', name: 'Nepali' },
    { code: 'no', name: 'Norwegian' },
    { code: 'ps', name: 'Pashto' },
    { code: 'fa', name: 'Persian' },
    { code: 'pl', name: 'Polish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'pa', name: 'Punjabi' },
    { code: 'ro', name: 'Romanian' },
    { code: 'ru', name: 'Russian' },
    { code: 'sm', name: 'Samoan' },
    { code: 'gd', name: 'Scots Gaelic' },
    { code: 'sr', name: 'Serbian' },
    { code: 'st', name: 'Sesotho' },
    { code: 'sn', name: 'Shona' },
    { code: 'sd', name: 'Sindhi' },
    { code: 'si', name: 'Sinhala' },
    { code: 'sk', name: 'Slovak' },
    { code: 'sl', name: 'Slovenian' },
    { code: 'so', name: 'Somali' },
    { code: 'es', name: 'Spanish' },
    { code: 'su', name: 'Sundanese' },
    { code: 'sw', name: 'Swahili' },
    { code: 'sv', name: 'Swedish' },
    { code: 'tg', name: 'Tajik' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'th', name: 'Thai' },
    { code: 'tr', name: 'Turkish' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'ur', name: 'Urdu' },
    { code: 'uz', name: 'Uzbek' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'cy', name: 'Welsh' },
    { code: 'xh', name: 'Xhosa' },
    { code: 'yi', name: 'Yiddish' },
    { code: 'yo', name: 'Yoruba' },
    { code: 'zu', name: 'Zulu' }
  ];

  onProgress(jobId: string, callback: ProgressCallback) {
    this.progressCallbacks.set(jobId, callback);
  }

  private updateProgress(jobId: string, progress: any) {
    const callback = this.progressCallbacks.get(jobId);
    if (callback) {
      callback(progress);
    }
  }

  /**
   * MAIN WORKFLOW: PPTX → Google Drive → XLSX with GOOGLETRANSLATE → Final PPTX
   */
  async startGoogleDriveTranslation(
    jobId: string,
    file: File,
    targetLanguages: string[],
    sourceLanguage?: string
  ): Promise<TranslationResult[]> {
    console.log(`🚀 Starting Google Drive Translation Pipeline for job ${jobId}`);
    console.log(`📊 Target languages: ${targetLanguages.join(', ')}`);
    console.log(`🔍 Source language: ${sourceLanguage || 'auto-detect'}`);

    try {
      // STEP 1: Upload PPTX to Google Drive
      this.updateProgress(jobId, {
        status: 'uploading',
        progress: 10,
        currentStep: 'Uploading PPTX to Google Drive...'
      });

      const driveFileId = await this.uploadToGoogleDrive(file, jobId);
      this.driveFileCache.set(jobId, driveFileId);

      // STEP 2: Extract text from PPTX on Google Drive
      this.updateProgress(jobId, {
        status: 'extracting',
        progress: 20,
        currentStep: 'Extracting text from PPTX...'
      });

      const extractedText = await this.extractTextFromDrive(driveFileId);
      
      // STEP 3: Generate XLSX with GOOGLETRANSLATE formulas
      this.updateProgress(jobId, {
        status: 'generating_xlsx',
        progress: 30,
        currentStep: 'Generating XLSX with GOOGLETRANSLATE formulas...'
      });

      const xlsxFileId = await this.generateXLSXWithFormulas(
        extractedText, 
        targetLanguages, 
        sourceLanguage || 'auto',
        jobId
      );

      // STEP 4: Wait for Google Sheets to translate everything
      this.updateProgress(jobId, {
        status: 'translating',
        progress: 40,
        currentStep: 'Waiting for Google Translate to process all languages...'
      });

      await this.waitForTranslationCompletion(xlsxFileId, targetLanguages);

      // STEP 5: Download completed translations
      this.updateProgress(jobId, {
        status: 'downloading_translations',
        progress: 70,
        currentStep: 'Downloading completed translations...'
      });

      const translatedData = await this.downloadTranslatedXLSX(xlsxFileId);

      // STEP 6: Generate final PPTX files for each language
      this.updateProgress(jobId, {
        status: 'rebuilding',
        progress: 80,
        currentStep: 'Generating translated PPTX files...'
      });

      const results: TranslationResult[] = [];
      
      for (let i = 0; i < targetLanguages.length; i++) {
        const language = targetLanguages[i];
        const progressStep = 80 + (i / targetLanguages.length) * 15;
        
        this.updateProgress(jobId, {
          status: 'rebuilding',
          progress: progressStep,
          currentStep: `Generating ${language.toUpperCase()} PPTX... (${i + 1}/${targetLanguages.length})`
        });

        const translatedPptx = await this.generateTranslatedPPTX(
          driveFileId,
          translatedData,
          language,
          file.name
        );

        const result: TranslationResult = {
          language: language,
          fileName: file.name.replace(/\.pptx?$/i, `_${language.toUpperCase()}.pptx`),
          fileId: `${jobId}_${language}_${Date.now()}`,
          size: translatedPptx.size
        };

        this.resultCache.set(result.fileId, translatedPptx);
        results.push(result);
      }

      // STEP 7: Complete
      this.updateProgress(jobId, {
        status: 'completed',
        progress: 100,
        currentStep: `Completed! Generated ${results.length} translated PPTX files.`
      });

      console.log(`✅ Google Drive translation completed: ${results.length} files generated`);
      return results;

    } catch (error) {
      console.error(`❌ Google Drive translation failed for job ${jobId}:`, error);
      
      this.updateProgress(jobId, {
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Google Drive translation failed'
      });
      
      throw error;
    }
  }

  /**
   * Upload PPTX file to Google Drive
   */
  private async uploadToGoogleDrive(file: File, jobId: string): Promise<string> {
    try {
      console.log('📤 Uploading PPTX to Google Drive...');
      
      if (!await googleApiService.isAvailable()) {
        throw new Error('Google Drive API not available - add API credentials');
      }

      // Convert File to base64 for upload
      const fileContent = await this.fileToBase64(file);
      
      // Upload to Google Drive using Google API
      const driveFileId = await googleApiService.uploadToDrive(
        file.name,
        fileContent,
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      );

      console.log(`✅ PPTX uploaded to Google Drive: ${driveFileId}`);
      return driveFileId;

    } catch (error) {
      console.error('❌ Failed to upload to Google Drive:', error);
      throw new Error(`Google Drive upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from PPTX on Google Drive
   */
  private async extractTextFromDrive(driveFileId: string): Promise<{ [slideNumber: number]: string }> {
    try {
      console.log('📄 Extracting text from PPTX on Google Drive...');

      // Download PPTX from Google Drive
      const pptxBlob = await googleApiService.downloadFromDrive(driveFileId);
      
      // Extract text using local PPTX processor
      const extractedText = await this.extractTextFromPPTXBlob(pptxBlob);
      
      console.log(`✅ Extracted text from ${Object.keys(extractedText).length} slides`);
      return extractedText;

    } catch (error) {
      console.error('❌ Failed to extract text from Drive PPTX:', error);
      throw new Error(`Text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate XLSX with GOOGLETRANSLATE formulas and upload to Google Drive
   */
  private async generateXLSXWithFormulas(
    extractedText: { [slideNumber: number]: string },
    targetLanguages: string[],
    sourceLanguage: string,
    jobId: string
  ): Promise<string> {
    try {
      console.log('📊 Generating XLSX with GOOGLETRANSLATE formulas...');

      // Create XLSX structure with GOOGLETRANSLATE formulas
      const xlsxData = this.createXLSXWithGoogleTranslateFormulas(
        extractedText,
        targetLanguages,
        sourceLanguage
      );

      // Convert to XLSX blob
      const xlsxBlob = await this.generateXLSXBlob(xlsxData);

      // Upload XLSX to Google Drive
      const xlsxContent = await this.blobToBase64(xlsxBlob);
      const xlsxFileId = await googleApiService.uploadToDrive(
        `translations_${jobId}.xlsx`,
        xlsxContent,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      // Convert to Google Sheets for formula processing
      const sheetsId = await googleApiService.convertToGoogleSheets(xlsxFileId);

      console.log(`✅ XLSX with GOOGLETRANSLATE formulas created: ${sheetsId}`);
      return sheetsId;

    } catch (error) {
      console.error('❌ Failed to generate XLSX with formulas:', error);
      throw new Error(`XLSX generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create XLSX data structure with GOOGLETRANSLATE formulas
   */
  private createXLSXWithGoogleTranslateFormulas(
    extractedText: { [slideNumber: number]: string },
    targetLanguages: string[],
    sourceLanguage: string
  ): any[] {
    const xlsxRows: any[] = [];

    // Header row
    const headerRow: any = {
      'Slide Number': 'Slide Number',
      'Original Text': 'Original Text'
    };

    // Add language columns
    targetLanguages.forEach(langCode => {
      const language = this.GOOGLE_TRANSLATE_LANGUAGES.find(l => l.code === langCode);
      headerRow[langCode] = language ? language.name : langCode.toUpperCase();
    });

    xlsxRows.push(headerRow);

    // Data rows with GOOGLETRANSLATE formulas
    Object.entries(extractedText).forEach(([slideNum, text]) => {
      const dataRow: any = {
        'Slide Number': parseInt(slideNum),
        'Original Text': text
      };

      // Add GOOGLETRANSLATE formulas for each target language
      targetLanguages.forEach(langCode => {
        // GOOGLETRANSLATE(text, source_language, target_language)
        dataRow[langCode] = `=GOOGLETRANSLATE(B${xlsxRows.length + 1},"${sourceLanguage}","${langCode}")`;
      });

      xlsxRows.push(dataRow);
    });

    console.log(`📊 Created XLSX structure: ${xlsxRows.length} rows, ${targetLanguages.length} translation columns`);
    return xlsxRows;
  }

  /**
   * Wait for Google Sheets to complete all GOOGLETRANSLATE formulas
   */
  private async waitForTranslationCompletion(sheetsId: string, targetLanguages: string[]): Promise<void> {
    const maxWaitTime = 300000; // 5 minutes
    const checkInterval = 5000; // 5 seconds
    const startTime = Date.now();

    console.log('⏳ Waiting for Google Translate to complete all translations...');

    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Check if all formulas have been calculated
        const isComplete = await this.checkTranslationCompletion(sheetsId, targetLanguages);
        
        if (isComplete) {
          console.log('✅ All GOOGLETRANSLATE formulas completed!');
          return;
        }

        console.log('⏳ Still translating... checking again in 5 seconds');
        await new Promise(resolve => setTimeout(resolve, checkInterval));

      } catch (error) {
        console.warn('⚠️ Error checking translation completion:', error);
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
    }

    throw new Error('Translation timeout - Google Translate took too long to complete');
  }

  /**
   * Check if all GOOGLETRANSLATE formulas have completed
   */
  private async checkTranslationCompletion(sheetsId: string, targetLanguages: string[]): Promise<boolean> {
    try {
      // Get sheet data from Google Sheets API
      const sheetData = await googleApiService.getSheetData(sheetsId);
      
      if (!sheetData || sheetData.length < 2) {
        return false; // No data or only header
      }

      // Check if all language columns have translated text (not formulas)
      for (let row = 1; row < sheetData.length; row++) { // Skip header
        for (const langCode of targetLanguages) {
          const cellValue = sheetData[row][langCode];
          
          // If cell is empty, contains formula, or contains error - not complete
          if (!cellValue || 
              cellValue.startsWith('=') || 
              cellValue.includes('#') ||
              cellValue === 'Loading...' ||
              cellValue.length < 2) {
            return false;
          }
        }
      }

      return true; // All translations completed

    } catch (error) {
      console.error('❌ Error checking translation completion:', error);
      return false;
    }
  }

  /**
   * Download completed translations from Google Sheets
   */
  private async downloadTranslatedXLSX(sheetsId: string): Promise<any[]> {
    try {
      console.log('📥 Downloading completed translations from Google Sheets...');

      // Get all data from Google Sheets
      const translatedData = await googleApiService.getSheetData(sheetsId);
      
      if (!translatedData || translatedData.length === 0) {
        throw new Error('No translated data found in Google Sheets');
      }

      console.log(`✅ Downloaded ${translatedData.length} rows of translated data`);
      return translatedData;

    } catch (error) {
      console.error('❌ Failed to download translated data:', error);
      throw new Error(`Translation download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate translated PPTX file for specific language
   */
  private async generateTranslatedPPTX(
    originalPptxFileId: string,
    translatedData: any[],
    targetLanguage: string,
    originalFileName: string
  ): Promise<Blob> {
    try {
      console.log(`🔧 Generating ${targetLanguage.toUpperCase()} PPTX...`);

      // Download original PPTX from Google Drive
      const originalPptx = await googleApiService.downloadFromDrive(originalPptxFileId);
      
      // Extract translations for target language
      const translations: { [slideNumber: number]: string } = {};
      
      translatedData.forEach((row, index) => {
        if (index === 0) return; // Skip header
        
        const slideNumber = row['Slide Number'];
        const translatedText = row[targetLanguage];
        
        if (slideNumber && translatedText) {
          translations[slideNumber] = translatedText;
        }
      });

      // Replace text in PPTX while preserving formatting
      const translatedPptx = await this.replaceTextInPPTX(originalPptx, translations);
      
      console.log(`✅ Generated ${targetLanguage.toUpperCase()} PPTX (${Math.round(translatedPptx.size/1024)}KB)`);
      return translatedPptx;

    } catch (error) {
      console.error(`❌ Failed to generate ${targetLanguage} PPTX:`, error);
      throw new Error(`PPTX generation failed for ${targetLanguage}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods for file processing
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remove data:mime;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async extractTextFromPPTXBlob(pptxBlob: Blob): Promise<{ [slideNumber: number]: string }> {
    // This would use a proper PPTX processing library
    // For now, return mock data
    return {
      1: "Sample slide 1 text content",
      2: "Sample slide 2 text content", 
      3: "Sample slide 3 text content"
    };
  }

  private async generateXLSXBlob(data: any[]): Promise<Blob> {
    // This would use a proper XLSX library like xlsx or exceljs
    // For now, return mock XLSX blob
    const mockXlsxContent = JSON.stringify(data, null, 2);
    return new Blob([mockXlsxContent], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  }

  private async replaceTextInPPTX(originalPptx: Blob, translations: { [slideNumber: number]: string }): Promise<Blob> {
    // This would use a proper PPTX processing library to replace text while preserving formatting
    // For now, return modified blob
    const mockContent = `Translated PPTX with ${Object.keys(translations).length} slide translations`;
    return new Blob([mockContent], { 
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
    });
  }

  // Download methods
  async downloadFile(fileId: string, fileName: string): Promise<void> {
    try {
      const file = this.resultCache.get(fileId);
      if (!file) {
        throw new Error('File not found in cache');
      }

      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`✅ Downloaded: ${fileName}`);
    } catch (error) {
      console.error(`❌ Download failed for ${fileName}:`, error);
      throw error;
    }
  }

  async downloadAllFiles(results: TranslationResult[], baseName: string): Promise<void> {
    try {
      console.log(`📦 Downloading ${results.length} files...`);
      
      for (const result of results) {
        await this.downloadFile(result.fileId, result.fileName);
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between downloads
      }

      console.log(`✅ All files downloaded successfully`);
    } catch (error) {
      console.error(`❌ Bulk download failed:`, error);
      throw error;
    }
  }

  async generateUniversalXLSX(job: any, fileName: string): Promise<void> {
    try {
      console.log(`📊 Generating Universal XLSX: ${fileName}`);
      
      // Get the Google Sheets file ID for this job
      const driveFileId = this.driveFileCache.get(job.id);
      if (driveFileId) {
        // Download the Google Sheets file as XLSX
        const xlsxBlob = await googleApiService.downloadAsXLSX(driveFileId);
        
        const url = URL.createObjectURL(xlsxBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`✅ Downloaded Google Sheets XLSX: ${fileName}`);
      } else {
        throw new Error('No Google Sheets file found for this job');
      }
    } catch (error) {
      console.error(`❌ XLSX download failed:`, error);
      throw error;
    }
  }

  // Language detection and sample text extraction
  async detectLanguage(text: string): Promise<string> {
    try {
      if (await googleApiService.isAvailable()) {
        return await googleApiService.detectLanguage(text);
      }
      
      // Fallback language detection
      return this.detectLanguageFallback(text);
    } catch (error) {
      console.warn('⚠️ Language detection failed:', error);
      return 'en';
    }
  }

  async extractSampleTextForDetection(file: File): Promise<string> {
    try {
      // Quick sample extraction for language detection
      // This would extract first few text elements from PPTX
      return `Sample text from ${file.name} for language detection`;
    } catch (error) {
      console.warn('⚠️ Sample text extraction failed:', error);
      return 'Default sample text';
    }
  }

  private detectLanguageFallback(text: string): string {
    // Simple pattern-based language detection
    const patterns = {
      'pl': /\b(i|w|na|z|się|to|jest|że|nie|do|od|dla|przez|po|przed|między)\b/gi,
      'es': /\b(el|la|los|las|un|una|de|en|a|por|para|con|sin|sobre|bajo|entre)\b/gi,
      'fr': /\b(le|la|les|un|une|des|de|du|dans|sur|avec|sans|pour|par|à|en)\b/gi,
      'de': /\b(der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines|und|oder)\b/gi,
      'it': /\b(il|lo|la|i|gli|le|un|uno|una|di|a|da|in|con|su|per|tra|fra)\b/gi,
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern);
      if (matches && matches.length > 3) {
        return lang;
      }
    }
    
    return 'en';
  }
}

export const googleDriveTranslationService = new GoogleDriveTranslationService();