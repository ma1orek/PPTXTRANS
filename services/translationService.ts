// Enhanced Translation Service with better validation and error handling
import { googleApiService, DriveFile } from './googleApi';
import { pptxProcessor, SlideTextData, TranslationData, FileValidationResult } from './pptxProcessor';

export interface TranslationJobProgress {
  jobId: string;
  status: 'pending' | 'extracting' | 'translating' | 'rebuilding' | 'completed' | 'error';
  progress: number;
  currentStep?: string;
  error?: string;
  warnings?: string[];
}

export interface TranslationResult {
  language: string;
  downloadUrl: string;
  fileId: string;
  fileName: string;
  size?: number;
}

class TranslationService {
  private activeJobs = new Map<string, TranslationJobProgress>();
  private progressCallbacks = new Map<string, (progress: TranslationJobProgress) => void>();
  private cleanupTasks = new Map<string, string[]>(); // jobId -> fileIds to cleanup

  // Register progress callback for a job
  onProgress(jobId: string, callback: (progress: TranslationJobProgress) => void) {
    this.progressCallbacks.set(jobId, callback);
  }

  // Update job progress and notify callback
  private updateProgress(jobId: string, updates: Partial<TranslationJobProgress>) {
    const currentProgress = this.activeJobs.get(jobId);
    if (!currentProgress) return;

    const newProgress = { ...currentProgress, ...updates };
    this.activeJobs.set(jobId, newProgress);

    const callback = this.progressCallbacks.get(jobId);
    if (callback) {
      callback(newProgress);
    }
  }

  // Add warning to job
  private addWarning(jobId: string, warning: string) {
    const currentProgress = this.activeJobs.get(jobId);
    if (!currentProgress) return;

    const warnings = [...(currentProgress.warnings || []), warning];
    this.updateProgress(jobId, { warnings });
  }

  // Start translation process
  async startTranslation(
    jobId: string,
    file: File,
    targetLanguages: string[]
  ): Promise<TranslationResult[]> {
    let uploadedFileId: string | null = null;
    let sheetId: string | null = null;

    try {
      // Initialize job
      this.activeJobs.set(jobId, {
        jobId,
        status: 'pending',
        progress: 0,
        warnings: []
      });

      this.cleanupTasks.set(jobId, []);

      // Validate inputs
      if (targetLanguages.length === 0) {
        throw new Error('No target languages specified');
      }

      if (targetLanguages.length > 5) {
        throw new Error('Maximum 5 languages allowed');
      }

      console.log(`🚀 Starting translation job ${jobId} for ${file.name}`);
      console.log(`📝 File info: ${pptxProcessor.getFileInfo(file)}`);
      console.log(`🌍 Target languages: ${targetLanguages.join(', ')}`);

      this.updateProgress(jobId, {
        status: 'extracting',
        progress: 5,
        currentStep: 'Validating file and checking systems...'
      });

      // File validation - use the same logic as the sync version
      console.log(`🔍 Final file validation for job ${jobId}...`);
      const quickValidation = this.validateFile(file);
      if (!quickValidation.valid) {
        throw new Error(quickValidation.error || 'File validation failed');
      }

      // Add warnings from sync validation
      if (quickValidation.warnings && quickValidation.warnings.length > 0) {
        quickValidation.warnings.forEach(warning => this.addWarning(jobId, warning));
      }

      console.log(`✅ File validation passed for job ${jobId}`);

      // Step 1: Authenticate with Google APIs
      try {
        await googleApiService.authenticate();
        console.log('✅ Google APIs authentication successful');
      } catch (authError) {
        console.error('❌ Google APIs authentication failed:', authError);
        this.addWarning(jobId, 'Using development mode - some features may be limited');
      }

      this.updateProgress(jobId, {
        progress: 10,
        currentStep: 'Uploading file to Google Drive...'
      });

      // Step 2: Upload PPTX to Google Drive
      let uploadedFile: DriveFile;
      try {
        uploadedFile = await googleApiService.uploadToDrive(file);
        uploadedFileId = uploadedFile.id;
        this.cleanupTasks.get(jobId)?.push(uploadedFileId);
        console.log('📤 File uploaded to Drive:', uploadedFile.id);
      } catch (uploadError) {
        console.error('❌ Upload to Drive failed:', uploadError);
        this.addWarning(jobId, 'File upload to Drive failed, using local processing');
        uploadedFile = {
          id: 'local_' + Date.now(),
          name: file.name,
          mimeType: file.type,
          size: file.size.toString()
        };
      }

      this.updateProgress(jobId, {
        progress: 20,
        currentStep: 'Extracting text from slides...'
      });

      // Step 3: Extract text from PPTX
      let slideData: SlideTextData[];
      try {
        slideData = await pptxProcessor.extractTextFromPPTX(file);
        
        if (slideData.length === 0) {
          console.warn('⚠️ No slides found, generating fallback slides');
          this.addWarning(jobId, 'No slides found in the presentation, using fallback content');
          slideData = await pptxProcessor.extractTextFromPPTX(file); // This will generate fallback data
        }

        const totalTextLength = slideData.reduce((sum, slide) => sum + slide.combinedText.length, 0);
        if (totalTextLength === 0) {
          this.addWarning(jobId, 'No text content found in slides - presentation may be image-only');
        }

        console.log(`📄 Extracted text from ${slideData.length} slides`);
        console.log(`📊 Total characters: ${totalTextLength}`);
      } catch (extractError) {
        console.error('❌ Text extraction failed:', extractError);
        this.addWarning(jobId, 'Using fallback text extraction');
        // Generate basic fallback slides
        slideData = [{
          slideNumber: 1,
          textElements: [],
          combinedText: `Content from ${file.name}`
        }];
      }

      this.updateProgress(jobId, {
        progress: 30,
        currentStep: 'Creating Google Sheet for translation...'
      });

      // Step 4: Create Google Sheet with extracted text
      let sheet: any;
      try {
        const sheetTitle = `Translation_${file.name.replace(/\.[^/.]+$/, '')}_${Date.now()}`;
        sheet = await googleApiService.createSheet(sheetTitle);
        sheetId = sheet.spreadsheetId;
        this.cleanupTasks.get(jobId)?.push(sheetId);
        console.log('📊 Created Google Sheet:', sheet.spreadsheetId);
      } catch (sheetError) {
        console.error('❌ Sheet creation failed:', sheetError);
        this.addWarning(jobId, 'Google Sheets unavailable, using mock translations');
        sheet = { spreadsheetId: 'mock_sheet_' + Date.now() };
      }

      // Step 5: Populate sheet with text and translation formulas
      try {
        const excelData = pptxProcessor.createExcelData(slideData, targetLanguages);
        await googleApiService.updateSheetData(sheet.spreadsheetId, 'A1:Z1000', excelData);
        console.log(`✅ Sheet populated with ${excelData.length} rows`);
      } catch (dataError) {
        console.error('❌ Sheet population failed:', dataError);
        this.addWarning(jobId, 'Sheet population failed, using mock data');
      }

      this.updateProgress(jobId, {
        status: 'translating',
        progress: 40,
        currentStep: 'Adding Google Translate formulas...'
      });

      // Step 6: Add translation formulas
      try {
        const formulas = pptxProcessor.createTranslationFormulas(targetLanguages);
        
        // Convert formulas to batch update requests
        const batchRequests = formulas.map(formula => {
          const match = formula.range.match(/([A-Z]+)(\d+)/);
          if (!match) return null;
          
          const col = match[1].charCodeAt(0) - 65; // A=0, B=1, C=2, etc.
          const row = parseInt(match[2]) - 1; // Convert to 0-based
          
          return {
            updateCells: {
              range: {
                sheetId: 0,
                startRowIndex: row,
                endRowIndex: row + 1,
                startColumnIndex: col,
                endColumnIndex: col + 1
              },
              rows: [{
                values: [{
                  userEnteredValue: {
                    formulaValue: formula.values[0][0]
                  }
                }]
              }],
              fields: 'userEnteredValue'
            }
          };
        }).filter(Boolean);

        if (batchRequests.length > 0) {
          await googleApiService.batchUpdateSheet(sheet.spreadsheetId, batchRequests);
          console.log(`✅ Added ${batchRequests.length} translation formulas`);
        }
      } catch (formulaError) {
        console.error('❌ Formula addition failed:', formulaError);
        this.addWarning(jobId, 'Translation formulas failed, using mock translations');
      }

      this.updateProgress(jobId, {
        progress: 50,
        currentStep: 'Waiting for translations to complete...'
      });

      // Step 7: Wait for Google Translate formulas to calculate
      let waitProgress = 50;
      const progressInterval = setInterval(() => {
        if (waitProgress < 75) {
          waitProgress += 3;
          this.updateProgress(jobId, {
            progress: waitProgress,
            currentStep: 'Google Translate is processing the content...'
          });
        }
      }, 2000);

      let formulasComplete = false;
      try {
        formulasComplete = await googleApiService.waitForFormulasToCalculate(
          sheet.spreadsheetId,
          90000 // 1.5 minutes
        );
      } catch (waitError) {
        console.error('⚠️ Error waiting for formulas:', waitError);
        this.addWarning(jobId, 'Translation timeout, using available results');
      } finally {
        clearInterval(progressInterval);
      }

      if (!formulasComplete) {
        this.addWarning(jobId, 'Some translations may still be processing');
      }

      this.updateProgress(jobId, {
        status: 'rebuilding',
        progress: 80,
        currentStep: 'Downloading translated content...'
      });

      // Step 8: Get translated data
      let translatedData: any[][];
      let translations: TranslationData;
      try {
        translatedData = await googleApiService.getSheetValues(
          sheet.spreadsheetId,
          'A1:Z1000'
        );

        translations = pptxProcessor.parseTranslationsFromExcel(
          translatedData,
          targetLanguages
        );

        const translationCount = Object.keys(translations).length;
        console.log(`📋 Parsed translations for ${translationCount} slides`);

        if (translationCount === 0) {
          console.warn('⚠️ No translations found, using mock data');
          this.addWarning(jobId, 'No translations available, generating mock translations');
          // Generate mock translations
          translations = this.generateMockTranslations(slideData, targetLanguages);
        }
      } catch (translationError) {
        console.error('❌ Translation retrieval failed:', translationError);
        this.addWarning(jobId, 'Translation retrieval failed, using mock translations');
        translations = this.generateMockTranslations(slideData, targetLanguages);
      }

      this.updateProgress(jobId, {
        progress: 85,
        currentStep: 'Rebuilding PowerPoint files...'
      });

      // Step 9: Generate translated PPTX files
      const results: TranslationResult[] = [];
      const errors: string[] = [];
      
      for (let i = 0; i < targetLanguages.length; i++) {
        const language = targetLanguages[i];
        const progressStep = 85 + (i / targetLanguages.length) * 10;
        
        this.updateProgress(jobId, {
          progress: progressStep,
          currentStep: `Creating ${language.toUpperCase()} version...`
        });

        try {
          // Check if we have translations for this language
          const hasTranslations = Object.values(translations).some(slideTranslations => 
            slideTranslations[language] && slideTranslations[language].trim() !== ''
          );

          if (!hasTranslations) {
            this.addWarning(jobId, `No translations found for ${language.toUpperCase()}, using original text`);
            // Use original text as fallback
            slideData.forEach(slide => {
              if (!translations[slide.slideNumber]) {
                translations[slide.slideNumber] = {};
              }
              translations[slide.slideNumber][language] = slide.combinedText;
            });
          }

          // Rebuild PPTX with translations
          const translatedPPTX = await pptxProcessor.rebuildPPTXWithTranslations(
            file,
            slideData,
            translations,
            language
          );

          // Upload translated PPTX to Drive
          const fileName = `${file.name.replace(/\.(pptx|ppt)$/i, '')}_${language}.pptx`;
          const translatedFile = new File([translatedPPTX], fileName, {
            type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
          });

          let uploadedTranslation: DriveFile;
          try {
            uploadedTranslation = await googleApiService.uploadToDrive(translatedFile);
            this.cleanupTasks.get(jobId)?.push(uploadedTranslation.id);
          } catch (uploadError) {
            console.warn(`⚠️ Upload failed for ${language}, creating download URL`);
            uploadedTranslation = {
              id: `local_${language}_${Date.now()}`,
              name: fileName,
              mimeType: translatedFile.type,
              size: translatedFile.size.toString(),
              webContentLink: URL.createObjectURL(translatedPPTX)
            };
          }

          results.push({
            language,
            downloadUrl: uploadedTranslation.webContentLink || `#download-${language}`,
            fileId: uploadedTranslation.id,
            fileName: uploadedTranslation.name,
            size: translatedPPTX.size
          });

          console.log(`✅ Created ${language} translation: ${uploadedTranslation.name}`);

        } catch (langError) {
          console.error(`❌ Error creating ${language} translation:`, langError);
          errors.push(`${language.toUpperCase()}: ${langError instanceof Error ? langError.message : 'Unknown error'}`);
        }
      }

      this.updateProgress(jobId, {
        progress: 98,
        currentStep: 'Cleaning up temporary files...'
      });

      // Step 10: Cleanup temporary files (but keep result files)
      try {
        if (uploadedFileId && uploadedFileId.startsWith('mock_') === false) {
          await googleApiService.deleteFile(uploadedFileId);
          console.log('🗑️ Deleted original uploaded file');
        }
        if (sheetId && sheetId.startsWith('mock_') === false) {
          await googleApiService.deleteFile(sheetId);
          console.log('🗑️ Deleted temporary sheet');
        }
      } catch (cleanupError) {
        console.warn('⚠️ Cleanup warning:', cleanupError);
        this.addWarning(jobId, 'Some temporary files may not have been cleaned up');
      }

      // Final validation
      if (results.length === 0) {
        if (errors.length > 0) {
          throw new Error(`Translation failed for all languages:\n${errors.join('\n')}`);
        } else {
          throw new Error('No translations were generated - please try again');
        }
      }

      this.updateProgress(jobId, {
        status: 'completed',
        progress: 100,
        currentStep: `Translation completed! Generated ${results.length} file(s).`
      });

      console.log(`✅ Translation job ${jobId} completed successfully`);
      console.log(`📊 Results: ${results.length} files generated`);
      
      if (errors.length > 0) {
        this.addWarning(jobId, `Some translations failed: ${errors.join(', ')}`);
      }

      return results;

    } catch (error) {
      console.error(`❌ Translation job ${jobId} failed:`, error);
      
      // Cleanup on error
      await this.cleanupJobFiles(jobId);
      
      this.updateProgress(jobId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });

      throw error;
    }
  }

  // Generate mock translations for fallback
  private generateMockTranslations(slideData: SlideTextData[], targetLanguages: string[]): TranslationData {
    console.log('📝 Generating mock translations...');
    
    const translations: TranslationData = {};
    
    const mockTranslationMap: Record<string, Record<string, string>> = {
      'pl': {
        'Welcome': 'Witamy',
        'Hello': 'Cześć',
        'Thank you': 'Dziękujemy',
        'Our Mission': 'Nasza Misja',
        'Key Features': 'Kluczowe Funkcje',
        'Questions': 'Pytania'
      },
      'es': {
        'Welcome': 'Bienvenido',
        'Hello': 'Hola',
        'Thank you': 'Gracias',
        'Our Mission': 'Nuestra Misión',
        'Key Features': 'Características Clave',
        'Questions': 'Preguntas'
      },
      'fr': {
        'Welcome': 'Bienvenue',
        'Hello': 'Bonjour',
        'Thank you': 'Merci',
        'Our Mission': 'Notre Mission',
        'Key Features': 'Fonctionnalités Clés',
        'Questions': 'Questions'
      }
    };

    slideData.forEach(slide => {
      translations[slide.slideNumber] = {};
      
      targetLanguages.forEach(lang => {
        let translatedText = slide.combinedText;
        
        // Apply simple mock translations
        if (mockTranslationMap[lang]) {
          Object.entries(mockTranslationMap[lang]).forEach(([en, translated]) => {
            translatedText = translatedText.replace(new RegExp(en, 'gi'), translated);
          });
        }
        
        // Add language suffix if no translation was applied
        if (translatedText === slide.combinedText) {
          translatedText = `${slide.combinedText} [${lang.toUpperCase()}]`;
        }
        
        translations[slide.slideNumber][lang] = translatedText;
      });
    });
    
    return translations;
  }

  // Cleanup files for a job
  private async cleanupJobFiles(jobId: string): Promise<void> {
    const filesToCleanup = this.cleanupTasks.get(jobId) || [];
    
    for (const fileId of filesToCleanup) {
      try {
        if (!fileId.startsWith('mock_') && !fileId.startsWith('local_')) {
          await googleApiService.deleteFile(fileId);
          console.log(`🗑️ Cleaned up file: ${fileId}`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not cleanup file ${fileId}:`, error);
      }
    }
    
    this.cleanupTasks.delete(jobId);
  }

  // Download file from Google Drive
  async downloadFile(fileId: string, fileName: string): Promise<void> {
    try {
      console.log(`📥 Starting download: ${fileName}`);
      
      if (fileId.startsWith('local_')) {
        // Handle local blob URLs
        const link = document.createElement('a');
        link.href = fileId.replace('local_', '');
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      const blob = await googleApiService.downloadFromDrive(fileId);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      URL.revokeObjectURL(url);
      
      console.log(`✅ Downloaded: ${fileName}`);
    } catch (error) {
      console.error('❌ Download failed:', error);
      throw new Error(`Failed to download ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Download all files for a job
  async downloadAllFiles(results: TranslationResult[], originalFileName: string): Promise<void> {
    try {
      console.log(`📦 Starting bulk download for ${originalFileName}`);
      
      // Download files with delays to avoid overwhelming the browser
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        
        try {
          await this.downloadFile(result.fileId, result.fileName);
          
          // Add delay between downloads
          if (i < results.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (downloadError) {
          console.error(`❌ Failed to download ${result.fileName}:`, downloadError);
          // Continue with other downloads
        }
      }
      
      console.log(`✅ Bulk download completed for ${originalFileName}`);
    } catch (error) {
      console.error('❌ Bulk download failed:', error);
      throw new Error(`Failed to download files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get job status
  getJobStatus(jobId: string): TranslationJobProgress | null {
    return this.activeJobs.get(jobId) || null;
  }

  // Remove completed job
  removeJob(jobId: string): void {
    this.activeJobs.delete(jobId);
    this.progressCallbacks.delete(jobId);
    this.cleanupTasks.delete(jobId);
  }

  // Synchronous file validation (used by FileUploader and App.tsx)
  validateFile(file: File): { valid: boolean; error?: string; warnings?: string[] } {
    console.log(`🔍 Validating file: ${file.name} (${file.size} bytes, ${file.type})`);
    
    // Check file extension first (fastest check)
    const validExtensions = ['.pptx', '.ppt'];
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
      console.error(`❌ Invalid extension: ${file.name}`);
      return {
        valid: false,
        error: `Invalid file type. Please select a PowerPoint file (.pptx or .ppt). Selected file: ${file.name}`
      };
    }

    // Check file size (100MB limit, 1KB minimum)
    const maxSize = 100 * 1024 * 1024; // 100MB
    const minSize = 512; // 512 bytes (more lenient minimum)
    
    if (file.size > maxSize) {
      console.error(`❌ File too large: ${file.size} bytes`);
      return {
        valid: false,
        error: `File size too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please use files smaller than 100MB.`
      };
    }

    if (file.size < minSize) {
      console.error(`❌ File too small: ${file.size} bytes`);
      return {
        valid: false,
        error: `File appears to be empty or corrupted (${file.size} bytes). Please select a valid PowerPoint file with actual content.`
      };
    }

    // Check MIME type (if available)
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint'
    ];
    
    const warnings: string[] = [];
    
    // Add warnings for small files
    if (file.size < 10240) { // Less than 10KB
      warnings.push(`File is very small (${(file.size / 1024).toFixed(1)}KB). Make sure it contains actual presentation content.`);
    }

    // Check MIME type
    if (file.type && !validTypes.includes(file.type)) {
      warnings.push('File type detection unclear. File will be processed as PowerPoint based on extension.');
    }

    console.log(`✅ File validation passed: ${file.name} - ${file.size} bytes`);
    
    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  // Get service status
  async getServiceStatus(): Promise<{ 
    googleDrive: boolean; 
    googleSheets: boolean; 
    pptxProcessing: boolean;
    message: string;
  }> {
    try {
      await googleApiService.authenticate();
      const status = googleApiService.getServiceStatus();
      const capabilities = pptxProcessor.getCapabilities();
      
      return {
        googleDrive: status.connected,
        googleSheets: status.connected,
        pptxProcessing: capabilities.canProcessReal,
        message: status.connected 
          ? 'All services operational' 
          : 'Running in development mode with mock data'
      };
    } catch (error) {
      return {
        googleDrive: false,
        googleSheets: false,
        pptxProcessing: false,
        message: 'Services unavailable - running in fallback mode'
      };
    }
  }

  // Generate sample PPTX for testing
  async generateSampleFile(): Promise<File> {
    try {
      const sampleBlob = await pptxProcessor.generateSamplePPTX();
      return new File([sampleBlob], 'Sample_Presentation.pptx', {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      });
    } catch (error) {
      console.error('❌ Failed to generate sample file:', error);
      throw new Error('Could not generate sample file');
    }
  }
}

export const translationService = new TranslationService();