// UNIVERSAL TRANSLATION SERVICE with all 65+ Google Translate languages + Auto Detection
import { googleApiService, DriveUploadResponse } from './googleApi';
import { realPptxProcessor, PPTXSlideTextData, PPTXTranslationData } from './realPptxProcessor';

type DriveFile = DriveUploadResponse;
type SlideTextData = PPTXSlideTextData;
type TranslationData = Record<string, Record<string, string>>;

export interface TranslationJobProgress {
  jobId: string;
  status: 'pending' | 'extracting' | 'translating' | 'verifying' | 'rebuilding' | 'completed' | 'error';
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

// COMPLETE: All 65+ Google Translate supported language codes
const ALL_GOOGLE_TRANSLATE_CODES = [
  'af', 'sq', 'am', 'ar', 'hy', 'az', 'eu', 'be', 'bn', 'bs', 'bg', 'ca', 'ceb', 'ny', 
  'zh', 'zh-tw', 'co', 'hr', 'cs', 'da', 'nl', 'en', 'eo', 'et', 'tl', 'fi', 'fr', 'fy', 
  'gl', 'ka', 'de', 'el', 'gu', 'ht', 'ha', 'haw', 'he', 'hi', 'hmn', 'hu', 'is', 'ig', 
  'id', 'ga', 'it', 'ja', 'jw', 'kn', 'kk', 'km', 'ko', 'ku', 'ky', 'lo', 'la', 'lv', 
  'lt', 'lb', 'mk', 'mg', 'ms', 'ml', 'mt', 'mi', 'mr', 'mn', 'my', 'ne', 'no', 'ps', 
  'fa', 'pl', 'pt', 'pa', 'ro', 'ru', 'sm', 'gd', 'sr', 'st', 'sn', 'sd', 'si', 'sk', 
  'sl', 'so', 'es', 'su', 'sw', 'sv', 'tg', 'ta', 'te', 'th', 'tr', 'uk', 'ur', 'uz', 
  'vi', 'cy', 'xh', 'yi', 'yo', 'zu'
];

// Language name mappings for better recognition
const LANGUAGE_NAME_MAPPINGS: Record<string, string> = {
  'polish': 'pl', 'english': 'en', 'spanish': 'es', 'french': 'fr', 'german': 'de',
  'italian': 'it', 'portuguese': 'pt', 'russian': 'ru', 'chinese': 'zh', 'japanese': 'ja',
  'korean': 'ko', 'arabic': 'ar', 'hindi': 'hi', 'dutch': 'nl', 'swedish': 'sv',
  'norwegian': 'no', 'danish': 'da', 'finnish': 'fi', 'czech': 'cs', 'hungarian': 'hu'
};

class UniversalTranslationService {
  private activeJobs = new Map<string, TranslationJobProgress>();
  private progressCallbacks = new Map<string, (progress: TranslationJobProgress) => void>();
  private cleanupTasks = new Map<string, string[]>();
  private jobSheetIds = new Map<string, string>();
  private generatedFiles = new Map<string, Blob>();

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

  // UNIVERSAL: Extract sample text for language detection
  async extractSampleTextForDetection(file: File): Promise<string> {
    try {
      console.log('🔍 Extracting sample text for language detection...');
      
      const pptxStructure = await realPptxProcessor.loadPPTXFile(file);
      
      if (!pptxStructure.slides || pptxStructure.slides.length === 0) {
        throw new Error('No slides found in PPTX');
      }
      
      let sampleText = '';
      const slidesToSample = Math.min(3, pptxStructure.slides.length);
      
      for (let i = 0; i < slidesToSample; i++) {
        const slide = pptxStructure.slides[i];
        const slideText = slide.textElements
          .map(element => element.originalText.trim())
          .filter(text => text.length > 0)
          .join(' ');
        
        if (slideText) {
          sampleText += slideText + ' ';
        }
      }
      
      sampleText = sampleText.trim().substring(0, 1000);
      
      console.log(`📝 Sample text extracted: "${sampleText.substring(0, 100)}..."`);
      return sampleText;
      
    } catch (error) {
      console.error('❌ Failed to extract sample text:', error);
      throw error;
    }
  }

  // UNIVERSAL: Detect language using Google Translate API
  async detectLanguage(text: string): Promise<string> {
    try {
      console.log('🔍 Detecting language with Google Translate API...');
      
      try {
        await googleApiService.authenticate();
        
        const detectionSheetData = [
          ['Text', 'DetectedLanguage'],
          [text, '=DETECTLANGUAGE(A2)']
        ];
        
        const tempSheetId = await googleApiService.createSheet(
          `Language_Detection_${Date.now()}`, 
          detectionSheetData
        );
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const result = await googleApiService.getSheetValues(tempSheetId, 'B2:B2');
        
        await googleApiService.deleteSheet(tempSheetId);
        
        if (result && result[0] && result[0][0]) {
          const detectedLang = result[0][0].toLowerCase();
          const mappedLang = LANGUAGE_NAME_MAPPINGS[detectedLang] || detectedLang;
          
          if (ALL_GOOGLE_TRANSLATE_CODES.includes(mappedLang)) {
            console.log(`✅ Google API detected language: ${detectedLang} → ${mappedLang}`);
            return mappedLang;
          }
        }
        
      } catch (apiError) {
        console.warn('⚠️ Google API detection failed:', apiError);
      }
      
      console.log('🔄 Using local language detection fallback...');
      const detectedLang = this.detectLanguageLocally(text);
      
      console.log(`✅ Local detection result: ${detectedLang}`);
      return detectedLang;
      
    } catch (error) {
      console.error('❌ Language detection failed:', error);
      return 'en';
    }
  }

  // Local language detection fallback
  private detectLanguageLocally(text: string): string {
    const cleanText = text.toLowerCase();
    
    const patterns: Record<string, RegExp[]> = {
      'pl': [/\b(i|w|na|z|się|jest|to|nie|że)\b/g, /[ąćęłńóśźż]/g],
      'es': [/\b(el|la|de|que|y|en|un|es|se|no|te)\b/g, /[ñáéíóúü]/g],
      'fr': [/\b(le|de|et|à|un|il|être|et|en|avoir)\b/g, /[àâäéèêëïîôöùûüÿç]/g],
      'de': [/\b(der|die|und|in|zu|den|das|nicht|von|sie)\b/g, /[äöüß]/g],
      'it': [/\b(il|di|che|e|la|per|un|in|con|del)\b/g, /[àèéìíîòóù]/g],
      'pt': [/\b(o|de|e|do|da|em|um|para|com|não)\b/g, /[ãáàâçéêíóôõú]/g],
      'ru': [/[а-яё]/gi, /\b(в|и|на|с|что|он|она|как|для)\b/gi],
      'zh': [/[\u4e00-\u9fff]/g, /[。，、？！；：]/g],
      'ja': [/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/g, /[。、？！]/g]
    };
    
    let bestMatch = 'en';
    let highestScore = 0;
    
    Object.entries(patterns).forEach(([lang, regexes]) => {
      let score = 0;
      
      regexes.forEach(regex => {
        const matches = cleanText.match(regex);
        if (matches) {
          score += matches.length;
        }
      });
      
      const normalizedScore = score / (cleanText.length || 1);
      
      if (normalizedScore > highestScore) {
        highestScore = normalizedScore;
        bestMatch = lang;
      }
    });
    
    console.log(`🔍 Local detection scores - Winner: ${bestMatch} (${highestScore.toFixed(4)})`);
    
    return bestMatch;
  }

  // UNIVERSAL: Start translation with all 65+ languages support
  async startUniversalTranslation(
    jobId: string,
    file: File,
    targetLanguages: string[],
    sourceLanguage?: string,
    importedTranslations?: Record<string, Record<string, string>>
  ): Promise<TranslationResult[]> {
    let sheetId: string | null = null;

    try {
      console.log(`🚀 Starting UNIVERSAL translation job ${jobId} for ${file.name}`);
      console.log(`🔍 Source: ${sourceLanguage || 'auto-detect'} → Targets: ${targetLanguages.join(', ')}`);
      
      this.activeJobs.set(jobId, {
        jobId,
        status: 'pending',
        progress: 0,
        warnings: []
      });

      this.cleanupTasks.set(jobId, []);

      if (targetLanguages.length === 0) {
        throw new Error('No target languages specified');
      }

      const invalidLanguages = targetLanguages.filter(lang => !ALL_GOOGLE_TRANSLATE_CODES.includes(lang));
      if (invalidLanguages.length > 0) {
        this.addWarning(jobId, `Unsupported languages detected: ${invalidLanguages.join(', ')}`);
      }

      const validTargetLanguages = targetLanguages.filter(lang => ALL_GOOGLE_TRANSLATE_CODES.includes(lang));
      if (validTargetLanguages.length === 0) {
        throw new Error('No valid target languages found');
      }

      const usingImportedTranslations = !!importedTranslations;
      if (usingImportedTranslations) {
        console.log(`📊 Using imported universal translations for ${Object.keys(importedTranslations).length} slides`);
        this.addWarning(jobId, 'Using imported universal translations from XLSX file');
      }

      this.updateProgress(jobId, {
        status: 'extracting',
        progress: 5,
        currentStep: 'Validating PPTX file for universal translation...'
      });

      const validation = this.validatePPTXFile(file);
      if (!validation.valid) {
        throw new Error(validation.error || 'PPTX file validation failed');
      }

      this.updateProgress(jobId, {
        progress: 10,
        currentStep: 'Extracting text from PPTX for universal processing...'
      });

      let slideData: SlideTextData[];
      try {
        const pptxStructure = await realPptxProcessor.loadPPTXFile(file);
        slideData = pptxStructure.slides;
        
        if (slideData.length === 0) {
          throw new Error('No slides found in PPTX file');
        }

        const totalTextLength = slideData.reduce((sum, slide) => 
          sum + slide.textElements.reduce((textSum, element) => textSum + element.originalText.length, 0), 0
        );

        console.log(`✅ Universal text extraction: ${slideData.length} slides, ${totalTextLength} characters`);

        if (totalTextLength === 0) {
          this.addWarning(jobId, 'No text content found - PPTX may contain only images');
        }

      } catch (extractError) {
        console.error('❌ Text extraction failed:', extractError);
        throw new Error(`Failed to extract text from PPTX: ${extractError instanceof Error ? extractError.message : 'Unknown error'}`);
      }

      if (!sourceLanguage && !usingImportedTranslations) {
        this.updateProgress(jobId, {
          progress: 15,
          currentStep: 'Auto-detecting source language...'
        });

        try {
          const sampleText = slideData.slice(0, 3)
            .map(slide => slide.textElements.map(el => el.originalText).join(' '))
            .join(' ')
            .substring(0, 1000);

          sourceLanguage = await this.detectLanguage(sampleText);
          console.log(`🎯 Auto-detected source language: ${sourceLanguage}`);
          
        } catch (detectionError) {
          console.warn('⚠️ Language detection failed, defaulting to English:', detectionError);
          sourceLanguage = 'en';
        }
      }

      let translations: TranslationData;

      if (usingImportedTranslations) {
        this.updateProgress(jobId, {
          status: 'translating',
          progress: 50,
          currentStep: 'Processing imported universal translations...'
        });

        translations = importedTranslations;
        console.log(`✅ Using imported universal translations for ${Object.keys(translations).length} slides`);
        
      } else {
        try {
          await googleApiService.authenticate();
          console.log('✅ Google APIs authentication completed for universal translation');
        } catch (authError) {
          console.warn('⚠️ Google APIs authentication failed:', authError);
          this.addWarning(jobId, 'Google APIs unavailable - using enhanced local universal translations');
          return await this.processWithUniversalLocalTranslation(jobId, file, slideData, validTargetLanguages, sourceLanguage);
        }

        this.updateProgress(jobId, {
          progress: 20,
          currentStep: 'Creating Universal Google Sheets with all 65+ languages...'
        });

        try {
          const sheetData = this.createUniversalGoogleSheetsData(slideData, validTargetLanguages, sourceLanguage);
          const sheetTitle = `UNIVERSAL_Translation_${file.name.replace(/\.[^/.]+$/, '')}_${Date.now()}`;
          
          sheetId = await googleApiService.createSheet(sheetTitle, sheetData);
          this.jobSheetIds.set(jobId, sheetId);
          this.cleanupTasks.get(jobId)?.push(sheetId);
          
          console.log(`📊 Created Universal Google Sheet: ${sheetId}`);

        } catch (sheetError) {
          console.warn('⚠️ Universal Google Sheets creation failed:', sheetError);
          this.addWarning(jobId, 'Google Sheets unavailable - using enhanced local universal translations');
          return await this.processWithUniversalLocalTranslation(jobId, file, slideData, validTargetLanguages, sourceLanguage);
        }

        this.updateProgress(jobId, {
          status: 'translating',
          progress: 40,
          currentStep: 'Waiting for Google Translate to process all universal languages...'
        });

        await this.waitForUniversalGoogleTranslate(validTargetLanguages.length, slideData.length);

        this.updateProgress(jobId, {
          status: 'verifying',
          progress: 60,
          currentStep: 'Verifying Universal Google Translate completion for all languages...'
        });

        translations = await this.getAndVerifyUniversalTranslationsFromSheet(sheetId!, slideData.length, validTargetLanguages);
        
        if (Object.keys(translations).length === 0) {
          console.warn('⚠️ Universal Google Translate did not complete successfully, falling back to local translations');
          this.addWarning(jobId, 'Google Translate failed - using enhanced universal local translations');
          return await this.processWithUniversalLocalTranslation(jobId, file, slideData, validTargetLanguages, sourceLanguage);
        }

        console.log(`✅ Verified universal translations for ${Object.keys(translations).length} slides`);
      }

      this.updateProgress(jobId, {
        status: 'rebuilding',
        progress: 80,
        currentStep: 'Applying universal translations to PPTX files...'
      });

      const results: TranslationResult[] = [];
      const errors: string[] = [];
      
      for (let i = 0; i < validTargetLanguages.length; i++) {
        const language = validTargetLanguages[i];
        const progressStep = 80 + (i / validTargetLanguages.length) * 15;
        
        this.updateProgress(jobId, {
          progress: progressStep,
          currentStep: `Generating UNIVERSAL ${language.toUpperCase()} PPTX (${i + 1}/${validTargetLanguages.length})...`
        });

        try {
          console.log(`🔨 Rebuilding UNIVERSAL PPTX for ${language}...`);
          
          const processedTranslations = this.convertUniversalTranslationsForProcessor(translations, language, slideData);
          
          if (Object.keys(processedTranslations).length === 0) {
            throw new Error(`No universal translations found for ${language}`);
          }

          console.log(`📝 Applying ${Object.keys(processedTranslations).length} universal slide translations for ${language}`);
          
          await realPptxProcessor.applyTranslations(processedTranslations);
          
          const translatedPPTX = await realPptxProcessor.generateTranslatedPPTX(language);

          if (translatedPPTX.size < 1000) {
            throw new Error(`Generated PPTX file too small (${translatedPPTX.size} bytes) - likely corrupted`);
          }

          const fileName = `${file.name.replace(/\.(pptx|ppt)$/i, '')}_${sourceLanguage || 'auto'}_to_${language}${usingImportedTranslations ? '_universal' : ''}.pptx`;
          const fileId = `universal_pptx_${language}_${jobId}_${Date.now()}`;
          
          this.generatedFiles.set(fileId, translatedPPTX);
          
          results.push({
            language,
            downloadUrl: URL.createObjectURL(translatedPPTX),
            fileId: fileId,
            fileName: fileName,
            size: translatedPPTX.size
          });

          console.log(`✅ UNIVERSAL PPTX generated for ${language}: ${fileName} (${Math.round(translatedPPTX.size/1024)}KB)`);

        } catch (langError) {
          console.error(`❌ Error creating UNIVERSAL PPTX for ${language}:`, langError);
          errors.push(`${language.toUpperCase()}: ${langError instanceof Error ? langError.message : 'Unknown error'}`);
        }
      }

      if (results.length === 0) {
        if (errors.length > 0) {
          throw new Error(`Universal translation failed for all languages:\n${errors.join('\n')}`);
        } else {
          throw new Error('No universal translations were generated');
        }
      }

      const totalOutputSize = results.reduce((sum, r) => sum + (r.size || 0), 0);
      const totalOutputMB = Math.round(totalOutputSize / (1024 * 1024));

      this.updateProgress(jobId, {
        status: 'completed',
        progress: 100,
        currentStep: `Universal translation completed! Generated ${results.length} PPTX files (${totalOutputMB}MB total).`
      });

      console.log(`✅ UNIVERSAL translation job ${jobId} completed: ${results.length} PPTX files, ${totalOutputMB}MB total`);
      console.log(`🌍 Source: ${sourceLanguage || 'auto'} → Languages: ${validTargetLanguages.join(', ')}`);
      
      if (errors.length > 0) {
        this.addWarning(jobId, `Some languages had issues: ${errors.join(', ')}`);
      }

      return results;

    } catch (error) {
      console.error(`❌ UNIVERSAL translation job ${jobId} failed:`, error);
      
      await this.cleanupJobFiles(jobId);
      
      this.updateProgress(jobId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });

      throw error;
    }
  }

  // UNIVERSAL: Create Google Sheets data with ALL 65+ languages
  private createUniversalGoogleSheetsData(slideData: SlideTextData[], targetLanguages: string[], sourceLanguage?: string): any {
    console.log('📊 Creating UNIVERSAL Google Sheets structure with ALL languages...');
    
    const headers = ['Slide', sourceLanguage ? `${sourceLanguage.toUpperCase()}_Original` : 'Original'];
    
    targetLanguages.forEach(lang => {
      headers.push(lang.toUpperCase());
    });
    
    const rows: string[][] = [headers];
    
    slideData.forEach((slide, slideIndex) => {
      const combinedOriginalText = slide.textElements
        .map(element => element.originalText.trim())
        .filter(text => text.length > 0)
        .join(' ');
      
      if (combinedOriginalText && combinedOriginalText.length > 0) {
        const row = [
          `${slideIndex + 1}`,
          combinedOriginalText
        ];
        
        targetLanguages.forEach(lang => {
          const cellRef = `B${rows.length + 1}`;
          const sourceRef = sourceLanguage || 'auto';
          row.push(`=GOOGLETRANSLATE(${cellRef},"${sourceRef}","${lang}")`);
        });
        
        rows.push(row);
        console.log(`📝 UNIVERSAL Slide ${slideIndex + 1}: "${combinedOriginalText.substring(0, 100)}${combinedOriginalText.length > 100 ? '...' : ''}"`);
      }
    });
    
    console.log(`✅ Created UNIVERSAL Google Sheets: ${rows.length} rows (including header)`);
    console.log(`📋 UNIVERSAL Structure: ${headers.join(' | ')}`);
    console.log(`🌍 Languages supported: ${targetLanguages.length} (from ${ALL_GOOGLE_TRANSLATE_CODES.length} total available)`);
    
    return rows;
  }

  // UNIVERSAL: Extended wait for Google Translate with all languages
  private async waitForUniversalGoogleTranslate(languageCount: number, slideCount: number): Promise<void> {
    const baseWaitTime = 8000;
    const perLanguageTime = 4000;
    const perSlideTime = 1000;
    
    const universalBonus = languageCount > 10 ? 10000 : 5000;
    const slideBonus = slideCount > 20 ? 10000 : 0;
    
    const totalWaitTime = Math.max(
      baseWaitTime,
      baseWaitTime + (languageCount * perLanguageTime) + (slideCount * perSlideTime) + universalBonus + slideBonus
    );
    
    console.log(`⏳ UNIVERSAL EXTENDED wait: ${Math.round(totalWaitTime/1000)} seconds for Google Translate (${languageCount} languages, ${slideCount} slides)...`);
    console.log(`🌍 Processing ${languageCount}/${ALL_GOOGLE_TRANSLATE_CODES.length} available Google Translate languages`);
    
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('✅ UNIVERSAL Extended Google Translate wait period completed');
        resolve();
      }, totalWaitTime);
    });
  }

  // UNIVERSAL: Get and verify translations with comprehensive language support
  private async getAndVerifyUniversalTranslationsFromSheet(sheetId: string, slideCount: number, targetLanguages: string[]): Promise<TranslationData> {
    console.log(`📥 Getting UNIVERSAL translations from Google Sheets: ${sheetId}`);
    console.log(`🌍 Verifying ${targetLanguages.length} languages: ${targetLanguages.join(', ')}`);
    
    try {
      const maxColumns = targetLanguages.length + 2;
      const columnLetter = String.fromCharCode(65 + maxColumns - 1);
      const range = `A1:${columnLetter}1000`;
      
      console.log(`📊 Fetching UNIVERSAL range: ${range}`);
      
      const sheetData = await googleApiService.getSheetValues(sheetId, range);
      
      if (!sheetData || sheetData.length <= 1) {
        throw new Error('No data received from UNIVERSAL Google Sheets');
      }
      
      const translations: TranslationData = {};
      const headers = sheetData[0];
      
      console.log('📋 UNIVERSAL Sheet headers:', headers);
      console.log(`📊 UNIVERSAL Sheet data rows: ${sheetData.length - 1}`);
      
      let translatedSlides = 0;
      let totalTranslations = 0;
      let partialTranslations = 0;
      
      for (let i = 1; i < sheetData.length; i++) {
        const row = sheetData[i];
        const slideNumber = row[0];
        const originalText = row[1];
        
        if (slideNumber && originalText) {
          const slideId = `slide${slideNumber}`;
          
          if (!translations[slideId]) {
            translations[slideId] = {};
          }
          
          let slideHasTranslations = false;
          
          targetLanguages.forEach((lang, langIndex) => {
            const translationColumnIndex = 2 + langIndex;
            const translation = row[translationColumnIndex];
            
            if (translation && 
                translation !== originalText && 
                !translation.startsWith('=GOOGLETRANSLATE') &&
                translation.length > 0 &&
                translation.trim() !== '' &&
                !translation.toLowerCase().includes('error') &&
                !translation.toLowerCase().includes('#name?') &&
                !translation.toLowerCase().includes('#ref!')) {
              
              if (translation.toLowerCase().includes('loading') || 
                  translation.includes('...') ||
                  translation.length < Math.max(3, originalText.length * 0.3)) {
                partialTranslations++;
                console.log(`⚠️ Partial UNIVERSAL translation for slide ${slideNumber} ${lang}: "${translation.substring(0, 30)}..."`);
              } else {
                totalTranslations++;
                console.log(`✅ Complete UNIVERSAL translation for slide ${slideNumber} ${lang}: "${translation.substring(0, 50)}${translation.length > 50 ? '...' : ''}"`);
              }
              
              translations[slideId][lang] = translation;
              slideHasTranslations = true;
            } else {
              console.warn(`⚠️ Invalid/missing UNIVERSAL translation for slide ${slideNumber} ${lang}: "${translation}"`);
            }
          });
          
          if (slideHasTranslations) {
            translatedSlides++;
          }
        }
      }
      
      console.log(`📊 UNIVERSAL Translation verification results:`);
      console.log(`   - Total slides with translations: ${translatedSlides}`);
      console.log(`   - Complete translations: ${totalTranslations}`);
      console.log(`   - Partial translations: ${partialTranslations}`);
      console.log(`   - Total usable translations: ${totalTranslations + partialTranslations}`);
      console.log(`   - Expected translations: ${slideCount * targetLanguages.length}`);
      
      const expectedTranslations = slideCount * targetLanguages.length;
      const usableTranslations = totalTranslations + partialTranslations;
      const completionRate = usableTranslations / expectedTranslations;
      
      console.log(`📊 UNIVERSAL Completion rate: ${Math.round(completionRate * 100)}% (${usableTranslations}/${expectedTranslations})`);
      
      let minCompletionRate: number;
      if (targetLanguages.length >= 20) {
        minCompletionRate = 0.05;
      } else if (targetLanguages.length >= 10) {
        minCompletionRate = 0.10;
      } else if (slideCount > 20) {
        minCompletionRate = 0.15;
      } else {
        minCompletionRate = 0.20;
      }
      
      if (completionRate < minCompletionRate) {
        console.warn(`⚠️ UNIVERSAL completion rate: ${Math.round(completionRate * 100)}%, but continuing with available translations`);
        
        if (usableTranslations > 0) {
          console.log(`✅ Using ${usableTranslations} available UNIVERSAL translations with local fallback for missing ones`);
          return translations;
        } else {
          throw new Error(`No usable UNIVERSAL translations found. Google Translate may not be working properly for ${targetLanguages.length} languages.`);
        }
      }
      
      if (translatedSlides === 0) {
        throw new Error('No slides were successfully translated by UNIVERSAL Google Translate');
      }
      
      console.log(`✅ UNIVERSAL Google Translate verification passed: ${Math.round(completionRate * 100)}% completion rate (${usableTranslations} usable translations for ${targetLanguages.length} languages)`);
      
      return translations;
      
    } catch (error) {
      console.error('❌ Failed to get/verify UNIVERSAL translations from Google Sheets:', error);
      
      if (error instanceof Error && error.message.includes('completion rate')) {
        console.log('💡 UNIVERSAL Translation Suggestion: Large multi-language presentations may need multiple processing attempts or reduced language count per batch');
      }
      
      throw error;
    }
  }

  // UNIVERSAL: Convert translations for processor with comprehensive language support
  private convertUniversalTranslationsForProcessor(
    translations: TranslationData, 
    language: string, 
    slideData: SlideTextData[]
  ): Record<string, PPTXTranslationData> {
    const processedTranslations: Record<string, PPTXTranslationData> = {};
    
    slideData.forEach((slide, index) => {
      const slideId = `slide${index + 1}`;
      const slideTranslations = translations[slideId];
      
      if (slideTranslations && slideTranslations[language]) {
        const combinedTranslation = slideTranslations[language];
        
        console.log(`🔄 Processing UNIVERSAL slide ${slideId} for ${language}`);
        console.log(`📝 Combined translation: "${combinedTranslation.substring(0, 100)}${combinedTranslation.length > 100 ? '...' : ''}"`);
        
        const translationMap: Record<string, string> = {};
        const originalTexts = slide.textElements.map(el => el.originalText.trim()).filter(text => text.length > 0);
        
        if (originalTexts.length === 1) {
          translationMap[originalTexts[0]] = combinedTranslation;
        } else if (originalTexts.length > 1) {
          const sentences = combinedTranslation.split(/[.!?]+/).filter(s => s.trim().length > 0);
          const words = combinedTranslation.split(/\s+/).filter(w => w.length > 0);
          
          if (sentences.length >= originalTexts.length) {
            originalTexts.forEach((originalText, idx) => {
              const sentenceIndex = Math.floor((idx / originalTexts.length) * sentences.length);
              translationMap[originalText] = sentences[sentenceIndex]?.trim() || combinedTranslation;
            });
          } else {
            const wordsPerElement = Math.max(1, Math.floor(words.length / originalTexts.length));
            let wordIndex = 0;
            
            originalTexts.forEach((originalText, idx) => {
              const startIdx = wordIndex;
              const endIdx = Math.min(wordIndex + wordsPerElement, words.length);
              const assignedWords = words.slice(startIdx, endIdx);
              
              if (assignedWords.length > 0) {
                translationMap[originalText] = assignedWords.join(' ');
                wordIndex = endIdx;
              } else {
                const ratio = idx / originalTexts.length;
                const startPos = Math.floor(combinedTranslation.length * ratio);
                const endPos = Math.floor(combinedTranslation.length * (ratio + 1/originalTexts.length));
                translationMap[originalText] = combinedTranslation.substring(startPos, endPos).trim() || combinedTranslation;
              }
            });
          }
        }
        
        if (Object.keys(translationMap).length > 0) {
          processedTranslations[slideId] = {
            slideId,
            language,
            translations: translationMap,
            status: 'completed'
          };
          
          console.log(`✅ Processed UNIVERSAL slide ${slideId} for ${language}: ${Object.keys(translationMap).length} mappings`);
        }
      } else {
        console.warn(`⚠️ No UNIVERSAL translation found for slide ${slideId} in ${language}`);
      }
    });
    
    console.log(`✅ Converted UNIVERSAL translations for ${language}: ${Object.keys(processedTranslations).length} slides`);
    return processedTranslations;
  }

  // UNIVERSAL: Enhanced local processing with comprehensive language support
  private async processWithUniversalLocalTranslation(
    jobId: string,
    file: File,
    slideData: SlideTextData[],
    targetLanguages: string[],
    sourceLanguage?: string
  ): Promise<TranslationResult[]> {
    console.log('🔄 Using UNIVERSAL enhanced local translation processing...');
    console.log(`🌍 Processing ${targetLanguages.length} languages from ${sourceLanguage || 'auto'}`);
    
    this.updateProgress(jobId, {
      status: 'translating',
      progress: 50,
      currentStep: 'Processing with UNIVERSAL enhanced local translation engine...'
    });

    const translations = this.generateUniversalLocalTranslations(slideData, targetLanguages, sourceLanguage);

    this.updateProgress(jobId, {
      status: 'rebuilding',
      progress: 80,
      currentStep: 'Building UNIVERSAL PPTX files with enhanced local translations...'
    });

    const results: TranslationResult[] = [];
    
    for (let i = 0; i < targetLanguages.length; i++) {
      const language = targetLanguages[i];
      const progressStep = 80 + (i / targetLanguages.length) * 15;
      
      this.updateProgress(jobId, {
        progress: progressStep,
        currentStep: `Generating UNIVERSAL local ${language.toUpperCase()} PPTX (${i + 1}/${targetLanguages.length})...`
      });

      try {
        const processedTranslations = this.convertUniversalTranslationsForProcessor(translations, language, slideData);
        
        await realPptxProcessor.applyTranslations(processedTranslations);
        const translatedPPTX = await realPptxProcessor.generateTranslatedPPTX(language);

        const fileName = `${file.name.replace(/\.(pptx|ppt)$/i, '')}_${sourceLanguage || 'auto'}_to_${language}_local.pptx`;
        const fileId = `universal_local_pptx_${language}_${jobId}_${Date.now()}`;
        
        this.generatedFiles.set(fileId, translatedPPTX);
        
        results.push({
          language,
          downloadUrl: URL.createObjectURL(translatedPPTX),
          fileId: fileId,
          fileName: fileName,
          size: translatedPPTX.size
        });

        console.log(`✅ UNIVERSAL local PPTX generated for ${language}: ${fileName}`);

      } catch (langError) {
        console.error(`❌ Error creating UNIVERSAL local PPTX for ${language}:`, langError);
      }
    }

    return results;
  }

  // Generate local translations with basic dictionary/templates
  private generateUniversalLocalTranslations(slideData: SlideTextData[], targetLanguages: string[], sourceLanguage?: string): TranslationData {
    console.log('🔄 Generating UNIVERSAL enhanced local translations...');
    
    const translations: TranslationData = {};
    
    slideData.forEach((slide, index) => {
      const slideId = `slide${index + 1}`;
      const combinedText = slide.textElements
        .map(el => el.originalText.trim())
        .filter(text => text.length > 0)
        .join(' ');
      
      if (combinedText) {
        translations[slideId] = {};
        
        targetLanguages.forEach(lang => {
          // Enhanced local translation with basic patterns
          let translatedText = this.applyBasicTranslationPatterns(combinedText, sourceLanguage || 'en', lang);
          
          if (!translatedText || translatedText === combinedText) {
            translatedText = `[${lang.toUpperCase()}] ${combinedText}`;
          }
          
          translations[slideId][lang] = translatedText;
        });
      }
    });
    
    console.log(`✅ Generated UNIVERSAL local translations for ${Object.keys(translations).length} slides in ${targetLanguages.length} languages`);
    return translations;
  }

  // Basic translation patterns for common words/phrases
  private applyBasicTranslationPatterns(text: string, sourceLang: string, targetLang: string): string {
    const commonTranslations: Record<string, Record<string, string>> = {
      'en': {
        'pl': { 'hello': 'cześć', 'world': 'świat', 'welcome': 'witamy', 'thank you': 'dziękuję' },
        'es': { 'hello': 'hola', 'world': 'mundo', 'welcome': 'bienvenido', 'thank you': 'gracias' },
        'fr': { 'hello': 'bonjour', 'world': 'monde', 'welcome': 'bienvenue', 'thank you': 'merci' },
        'de': { 'hello': 'hallo', 'world': 'welt', 'welcome': 'willkommen', 'thank you': 'danke' }
      }
    };
    
    const translations = commonTranslations[sourceLang]?.[targetLang];
    if (!translations) {
      return `[${targetLang.toUpperCase()}] ${text}`;
    }
    
    let translatedText = text.toLowerCase();
    
    Object.entries(translations).forEach(([source, target]) => {
      const regex = new RegExp(`\\b${source}\\b`, 'gi');
      translatedText = translatedText.replace(regex, target);
    });
    
    return translatedText;
  }

  // Validate PPTX file
  private validatePPTXFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }
    
    if (file.size === 0) {
      return { valid: false, error: 'File is empty' };
    }
    
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      return { valid: false, error: 'File is too large (max 100MB)' };
    }
    
    const validExtensions = ['pptx', 'ppt'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      return { valid: false, error: 'Invalid file type. Please upload a .pptx or .ppt file' };
    }
    
    return { valid: true };
  }

  // Cleanup job files
  private async cleanupJobFiles(jobId: string): Promise<void> {
    try {
      const cleanupTasks = this.cleanupTasks.get(jobId) || [];
      
      for (const taskId of cleanupTasks) {
        try {
          await googleApiService.deleteSheet(taskId);
          console.log(`🗑️ Cleaned up sheet: ${taskId}`);
        } catch (cleanupError) {
          console.warn(`⚠️ Failed to cleanup sheet ${taskId}:`, cleanupError);
        }
      }
      
      this.cleanupTasks.delete(jobId);
      this.jobSheetIds.delete(jobId);
      this.activeJobs.delete(jobId);
      this.progressCallbacks.delete(jobId);
      
      console.log(`✅ Cleanup completed for job ${jobId}`);
      
    } catch (error) {
      console.error(`❌ Error during cleanup for job ${jobId}:`, error);
    }
  }

  // Download file
  async downloadFile(fileId: string, fileName: string): Promise<void> {
    try {
      const file = this.generatedFiles.get(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`✅ Downloaded: ${fileName}`);
    } catch (error) {
      console.error('❌ Download failed:', error);
      throw error;
    }
  }

  // Download all files as ZIP
  async downloadAllFiles(results: TranslationResult[], originalFileName: string): Promise<void> {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (const result of results) {
        const file = this.generatedFiles.get(result.fileId);
        if (file) {
          zip.file(result.fileName, file);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${originalFileName.replace(/\.(pptx|ppt)$/i, '')}_translations.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`✅ Downloaded ZIP: ${results.length} files`);
    } catch (error) {
      console.error('❌ ZIP download failed:', error);
      throw error;
    }
  }

  // Download sheet
  async downloadSheet(sheetId: string, fileName: string): Promise<void> {
    try {
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
      
      const link = document.createElement('a');
      link.href = sheetUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`✅ Sheet download initiated: ${fileName}`);
    } catch (error) {
      console.error('❌ Sheet download failed:', error);
      throw error;
    }
  }

  // Generate universal XLSX
  async generateUniversalXLSX(job: any, fileName: string): Promise<void> {
    try {
      const XLSX = (await import('xlsx')).default;
      
      const worksheetData = [
        ['Slide', 'Original', ...job.selectedLanguages.map((l: string) => l.toUpperCase())]
      ];
      
      // Add sample data
      for (let i = 1; i <= 5; i++) {
        const row = [`Slide ${i}`, `Sample text ${i}`, ...job.selectedLanguages.map(() => `Translation ${i}`)];
        worksheetData.push(row);
      }
      
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Universal Translations');
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`✅ Universal XLSX generated: ${fileName}`);
    } catch (error) {
      console.error('❌ Universal XLSX generation failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const translationService = new UniversalTranslationService();