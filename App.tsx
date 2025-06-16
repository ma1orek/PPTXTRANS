import React, { useState, useEffect } from 'react';
import { Upload, Download, Globe, FileText, CheckCircle, Clock, AlertCircle, Languages, FileSpreadsheet, Settings, Cpu, Zap, PlayCircle, Eye, Trash2, RefreshCw, Scan } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Progress } from './components/ui/progress';
import { Badge } from './components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import FileUploader from './components/FileUploader';
import LanguageSelector from './components/LanguageSelector';
import TranslationProgress from './components/TranslationProgress';
import ResultsSection from './components/ResultsSection';
import { useTranslation } from './hooks/useTranslation';
// CRITICAL FIX: Use the FIXED translation service instead of broken one
import { translationService, TranslationResult } from './services/translationServiceFixed';
import { googleApiService } from './services/googleApi';
import NotificationSystem, { useNotifications } from './components/NotificationSystem';

// UNIVERSAL TRANSLATION VERSION - CSS FIXED + TRANSLATION SERVICE FIXED
const APP_VERSION = '2024.12.16.23.30'; // CRITICAL FIX: CSS + Translation Service Fixed
const BUILD_INFO = {
  version: APP_VERSION,
  buildTime: new Date().toISOString(),
  features: ['CSS_CONFLICT_RESOLVED', 'TRANSLATION_SERVICE_FIXED', 'UNIVERSAL_TRANSLATION', 'ALL_104_LANGUAGES', 'AUTO_LANGUAGE_DETECTION', 'ENHANCED_ERROR_HANDLING']
};

type TranslationJob = {
  id: string;
  fileName: string;
  sourceFile: File;
  selectedLanguages: string[];
  detectedSourceLanguage?: string;
  status: 'ready' | 'pending' | 'extracting' | 'translating' | 'verifying' | 'rebuilding' | 'completed' | 'error';
  progress: number;
  currentStep?: string;
  results?: TranslationResult[];
  error?: string;
  sheetId?: string;
  importedTranslations?: any;
  usingImportedTranslations?: boolean;
  isSetupComplete?: boolean;
  availableImportedLanguages?: string[];
};

// COMPLETE LIST: All 104 Google Translate Supported Languages
const ALL_GOOGLE_TRANSLATE_LANGUAGES = [
  { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
  { code: 'sq', name: 'Albanian', flag: '🇦🇱' },
  { code: 'am', name: 'Amharic', flag: '🇪🇹' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hy', name: 'Armenian', flag: '🇦🇲' },
  { code: 'az', name: 'Azerbaijani', flag: '🇦🇿' },
  { code: 'eu', name: 'Basque', flag: '🇪🇸' },
  { code: 'be', name: 'Belarusian', flag: '🇧🇾' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'bs', name: 'Bosnian', flag: '🇧🇦' },
  { code: 'bg', name: 'Bulgarian', flag: '🇧🇬' },
  { code: 'ca', name: 'Catalan', flag: '🇪🇸' },
  { code: 'ceb', name: 'Cebuano', flag: '🇵🇭' },
  { code: 'ny', name: 'Chichewa', flag: '🇲🇼' },
  { code: 'zh', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'zh-tw', name: 'Chinese (Traditional)', flag: '🇹🇼' },
  { code: 'co', name: 'Corsican', flag: '🇫🇷' },
  { code: 'hr', name: 'Croatian', flag: '🇭🇷' },
  { code: 'cs', name: 'Czech', flag: '🇨🇿' },
  { code: 'da', name: 'Danish', flag: '🇩🇰' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'eo', name: 'Esperanto', flag: '🌍' },
  { code: 'et', name: 'Estonian', flag: '🇪🇪' },
  { code: 'tl', name: 'Filipino', flag: '🇵🇭' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'fy', name: 'Frisian', flag: '🇳🇱' },
  { code: 'gl', name: 'Galician', flag: '🇪🇸' },
  { code: 'ka', name: 'Georgian', flag: '🇬🇪' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
  { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
  { code: 'ht', name: 'Haitian Creole', flag: '🇭🇹' },
  { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
  { code: 'haw', name: 'Hawaiian', flag: '🇺🇸' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'hmn', name: 'Hmong', flag: '🇱🇦' },
  { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
  { code: 'is', name: 'Icelandic', flag: '🇮🇸' },
  { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'ga', name: 'Irish', flag: '🇮🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'jw', name: 'Javanese', flag: '🇮🇩' },
  { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
  { code: 'kk', name: 'Kazakh', flag: '🇰🇿' },
  { code: 'km', name: 'Khmer', flag: '🇰🇭' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ku', name: 'Kurdish (Kurmanji)', flag: '🇹🇷' },
  { code: 'ky', name: 'Kyrgyz', flag: '🇰🇬' },
  { code: 'lo', name: 'Lao', flag: '🇱🇦' },
  { code: 'la', name: 'Latin', flag: '🏛️' },
  { code: 'lv', name: 'Latvian', flag: '🇱🇻' },
  { code: 'lt', name: 'Lithuanian', flag: '🇱🇹' },
  { code: 'lb', name: 'Luxembourgish', flag: '🇱🇺' },
  { code: 'mk', name: 'Macedonian', flag: '🇲🇰' },
  { code: 'mg', name: 'Malagasy', flag: '🇲🇬' },
  { code: 'ms', name: 'Malay', flag: '🇲🇾' },
  { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
  { code: 'mt', name: 'Maltese', flag: '🇲🇹' },
  { code: 'mi', name: 'Maori', flag: '🇳🇿' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
  { code: 'mn', name: 'Mongolian', flag: '🇲🇳' },
  { code: 'my', name: 'Myanmar (Burmese)', flag: '🇲🇲' },
  { code: 'ne', name: 'Nepali', flag: '🇳🇵' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'ps', name: 'Pashto', flag: '🇦🇫' },
  { code: 'fa', name: 'Persian', flag: '🇮🇷' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'pa', name: 'Punjabi', flag: '🇮🇳' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'sm', name: 'Samoan', flag: '🇼🇸' },
  { code: 'gd', name: 'Scots Gaelic', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { code: 'sr', name: 'Serbian', flag: '🇷🇸' },
  { code: 'st', name: 'Sesotho', flag: '🇱🇸' },
  { code: 'sn', name: 'Shona', flag: '🇿🇼' },
  { code: 'sd', name: 'Sindhi', flag: '🇵🇰' },
  { code: 'si', name: 'Sinhala', flag: '🇱🇰' },
  { code: 'sk', name: 'Slovak', flag: '🇸🇰' },
  { code: 'sl', name: 'Slovenian', flag: '🇸🇮' },
  { code: 'so', name: 'Somali', flag: '🇸🇴' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'su', name: 'Sundanese', flag: '🇮🇩' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'tg', name: 'Tajik', flag: '🇹🇯' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
  { code: 'uz', name: 'Uzbek', flag: '🇺🇿' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'cy', name: 'Welsh', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { code: 'xh', name: 'Xhosa', flag: '🇿🇦' },
  { code: 'yi', name: 'Yiddish', flag: '🇮🇱' },
  { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
  { code: 'zu', name: 'Zulu', flag: '🇿🇦' }
];

const UI_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

// Enhanced language validation
const getLanguageInfo = (code: string) => {
  const normalizedCode = code.toLowerCase().trim();
  let language = ALL_GOOGLE_TRANSLATE_LANGUAGES.find(l => l.code === normalizedCode);
  
  if (!language) {
    const alternativeMappings: { [key: string]: string } = {
      'al': 'sq', 'sqi': 'sq', 'alb': 'sq',
      'zh-cn': 'zh', 'zh-hans': 'zh', 'zh-hant': 'zh-tw',
      'gr': 'el', 'greek': 'el' // Add Greek mappings
    };
    
    const mappedCode = alternativeMappings[normalizedCode];
    if (mappedCode) {
      language = ALL_GOOGLE_TRANSLATE_LANGUAGES.find(l => l.code === mappedCode);
    }
  }
  
  if (!language) {
    language = ALL_GOOGLE_TRANSLATE_LANGUAGES.find(l => 
      l.name.toLowerCase().includes(normalizedCode) ||
      normalizedCode.includes(l.code)
    );
  }
  
  return language;
};

const validateLanguageSelection = (selectedCodes: string[]): string[] => {
  const validCodes: string[] = [];
  const invalidCodes: string[] = [];
  
  selectedCodes.forEach(code => {
    const language = getLanguageInfo(code);
    if (language) {
      validCodes.push(language.code);
    } else {
      invalidCodes.push(code);
      console.warn(`⚠️ Invalid language code: ${code}`);
    }
  });
  
  if (invalidCodes.length > 0) {
    console.warn(`⚠️ Removed invalid language codes: ${invalidCodes.join(', ')}`);
  }
  
  return [...new Set(validCodes)];
};

export default function App() {
  const [jobs, setJobs] = useState<TranslationJob[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [detectedSourceLanguage, setDetectedSourceLanguage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [importedTranslations, setImportedTranslations] = useState<any>(null);
  const [importedFileName, setImportedFileName] = useState<string>('');
  const [importedLanguages, setImportedLanguages] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cacheStatus, setCacheStatus] = useState<string>('ready');
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const { t, currentLanguage, changeLanguage } = useTranslation();
  
  // ENHANCED: Add notification system
  const {
    notifications,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showCSSFixed,
    showLanguageValidation,
    showTranslationError
  } = useNotifications();

  // DEBUG: Enhanced logging with better error tracking
  useEffect(() => {
    console.log('🔍 FIXED DEBUG - selectedLanguages changed:', selectedLanguages);
    console.log('🔍 FIXED DEBUG - importedLanguages:', importedLanguages);
    console.log('🔍 FIXED DEBUG - detectedSourceLanguage:', detectedSourceLanguage);
    console.log('🔍 FIXED DEBUG - importedTranslations keys:', importedTranslations ? Object.keys(importedTranslations) : 'none');
    
    // Enhanced validation with notifications
    if (selectedLanguages.length > 0) {
      const validatedLanguages = validateLanguageSelection(selectedLanguages);
      if (validatedLanguages.length !== selectedLanguages.length) {
        console.warn('🔧 Correcting invalid language selections...');
        const invalidCount = selectedLanguages.length - validatedLanguages.length;
        showWarning(
          'Language Validation',
          `${invalidCount} invalid language code(s) removed`,
          `Valid languages: ${validatedLanguages.length}/${selectedLanguages.length}`
        );
        setSelectedLanguages(validatedLanguages);
      } else if (validatedLanguages.length > 0) {
        showLanguageValidation(validatedLanguages.length, selectedLanguages.length);
      }
    }
  }, [selectedLanguages, importedLanguages, importedTranslations, detectedSourceLanguage]);

  // Enhanced initialization with CSS fix notification
  useEffect(() => {
    console.log(`🚀 PPTX Translator Pro v${APP_VERSION} - CRITICAL FIXES APPLIED`);
    console.log('📋 Build Info:', BUILD_INFO);
    
    // Show CSS fix notification
    showCSSFixed();
    
    // Enhanced version management
    document.title = `PPTX Translator Pro v${APP_VERSION} - CSS + Translation Fixed`;
    
    const lastVersion = localStorage.getItem('pptx-translator-version');
    if (lastVersion !== APP_VERSION) {
      console.log('🔄 Version change detected, clearing local data');
      localStorage.clear();
      localStorage.setItem('pptx-translator-version', APP_VERSION);
      
      showSuccess(
        '🎉 System Updated!',
        `Updated to v${APP_VERSION}`,
        'CSS Loading + Translation Service Fixed!'
      );
    }
    
    // Enhanced cache management
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        const deletePromises = cacheNames.map(cacheName => {
          console.log('🗑️ Deleting cache:', cacheName);
          return caches.delete(cacheName);
        });
        
        Promise.all(deletePromises).then(() => {
          console.log('✅ All browser caches cleared for CSS fix');
          setCacheStatus('cleared');
        }).catch((error) => {
          console.warn('⚠️ Some caches could not be cleared:', error);
          setCacheStatus('partial');
        });
      });
    }
  }, []);

  // Mouse tracking optimization (unchanged)
  useEffect(() => {
    const shouldEnableAnimations = () => {
      try {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          return false;
        }
        return navigator.hardwareConcurrency ? navigator.hardwareConcurrency > 2 : true;
      } catch (error) {
        return false;
      }
    };

    const animationsSupported = shouldEnableAnimations();
    setAnimationsEnabled(animationsSupported);
    
    if (animationsSupported) {
      let rafId: number;
      let lastUpdate = 0;
      
      const handleMouseMove = (e: MouseEvent) => {
        const now = Date.now();
        if (now - lastUpdate < 16) return;
        lastUpdate = now;
        
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          setMousePosition({
            x: (e.clientX / window.innerWidth) * 100,
            y: (e.clientY / window.innerHeight) * 100
          });
        });
      };

      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        if (rafId) cancelAnimationFrame(rafId);
      };
    } else {
      setMousePosition({ x: 50, y: 50 });
    }
  }, []);

  // Enhanced API status check
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        console.log('🔍 Checking ENHANCED API status...');
        await googleApiService.authenticate();
        const status = googleApiService.getCredentialsStatus();
        console.log('📊 ENHANCED API Status:', status);
        setApiStatus(status);
        
        if (!status.hasEnvironmentKey) {
          showInfo(
            'Google APIs',
            'Running in demo mode - add API key for full functionality',
            'All translation features work with mock data for testing'
          );
        }
      } catch (error) {
        console.error('❌ Failed to check API status:', error);
        setApiStatus({
          hasEnvironmentKey: false,
          environmentKeyValid: false,
          recommendedSetup: 'Error checking API status - running in enhanced local mode',
          availableEnvVars: [],
          debugInfo: { error: error instanceof Error ? error.message : 'Unknown error', version: APP_VERSION }
        });
        
        showError(
          'API Check Failed',
          'Could not verify Google API status',
          'System will work in demo mode with mock translations'
        );
      }
    };

    setTimeout(checkApiStatus, 100);
  }, []);

  // Enhanced auto-detect source language
  const detectSourceLanguage = async (file: File): Promise<string> => {
    try {
      console.log('🔍 Detecting source language from PPTX...');
      const sampleText = await translationService.extractSampleTextForDetection(file);
      
      if (!sampleText || sampleText.length < 20) {
        console.warn('⚠️ Insufficient text for detection, defaulting to English');
        return 'en';
      }
      
      const detectedLang = await translationService.detectLanguage(sampleText);
      const validatedLang = getLanguageInfo(detectedLang);
      const finalLang = validatedLang ? validatedLang.code : 'en';
      
      console.log(`✅ Detected source language: ${finalLang}`);
      return finalLang;
    } catch (error) {
      console.error('❌ Language detection failed:', error);
      showError(
        'Language Detection Failed',
        'Could not auto-detect source language',
        'Defaulting to English - you can manually select if needed'
      );
      return 'en';
    }
  };

  // Enhanced XLSX import
  const handleXLSXImport = (file: File, translations: any) => {
    try {
      console.log('📊 ENHANCED XLSX IMPORT:', { fileName: file.name, translationsKeys: Object.keys(translations) });
      
      setImportedTranslations(translations);
      setImportedFileName(file.name);
      
      const detectedLanguages = new Set<string>();
      let possibleSourceLang: string | null = null;
      
      Object.values(translations).forEach((slideTranslations: any) => {
        if (slideTranslations && typeof slideTranslations === 'object') {
          Object.keys(slideTranslations).forEach(key => {
            if (key !== 'originalText' && !['slide', 'slide_id', 'index', 'element', 'status'].includes(key.toLowerCase())) {
              const langCode = key.toLowerCase();
              const validatedLang = getLanguageInfo(langCode);
              
              if (validatedLang) {
                detectedLanguages.add(validatedLang.code);
                const text = slideTranslations[key];
                if (text && typeof text === 'string' && text.length > 50 && !possibleSourceLang) {
                  possibleSourceLang = validatedLang.code;
                }
              } else {
                console.warn(`⚠️ Unrecognized language code in XLSX: ${langCode}`);
              }
            }
          });
        }
      });
      
      if (possibleSourceLang) {
        setDetectedSourceLanguage(possibleSourceLang);
      }
      
      const mappedLanguages = Array.from(detectedLanguages);
      setImportedLanguages(mappedLanguages);
      setSelectedLanguages(mappedLanguages);
      
      if (mappedLanguages.length > 0) {
        const languageNames = mappedLanguages.map(code => 
          getLanguageInfo(code)?.name || code
        ).join(', ');
        
        const sourceLangName = possibleSourceLang ? 
          getLanguageInfo(possibleSourceLang)?.name : 'Unknown';
        
        showSuccess(
          '🌍 XLSX Import Success!',
          `Detected ${mappedLanguages.length} languages`,
          `Source: ${sourceLangName} | Languages: ${languageNames.substring(0, 100)}${languageNames.length > 100 ? '...' : ''}`
        );
      } else {
        showWarning(
          'XLSX Import Issue',
          'No valid languages detected in XLSX',
          'Please check the file format and language codes'
        );
      }
      
    } catch (error) {
      console.error('❌ Error processing XLSX import:', error);
      showError(
        'XLSX Import Failed',
        'Could not process the XLSX file',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  };

  // Enhanced file selection
  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    console.log(`📁 File selected: ${file.name} (${Math.round(file.size/(1024*1024))}MB)`);
    
    if (!detectedSourceLanguage) {
      try {
        const detected = await detectSourceLanguage(file);
        setDetectedSourceLanguage(detected);
        
        const detectedLangInfo = getLanguageInfo(detected);
        const detectedLangName = detectedLangInfo?.name || detected;
        
        showInfo(
          '🔍 Language Detected',
          `Source: ${detectedLangName}`,
          'Auto-detected from file content'
        );
      } catch (error) {
        console.warn('⚠️ Auto language detection failed:', error);
      }
    }
  };

  // Enhanced language selection
  const handleLanguageSelectionChange = (newSelection: string[]) => {
    console.log('🔄 Language selection changed:', { from: selectedLanguages, to: newSelection });
    const validatedSelection = validateLanguageSelection(newSelection);
    setSelectedLanguages(validatedSelection);
  };

  // Enhanced translation setup
  const createTranslationSetup = () => {
    if (!selectedFile) {
      showError('No File Selected', 'Please select a PPTX file first');
      return;
    }

    if (selectedLanguages.length === 0) {
      showError('No Languages Selected', 'Please select at least one target language');
      return;
    }

    const validatedLanguages = validateLanguageSelection(selectedLanguages);
    if (validatedLanguages.length === 0) {
      showError('Invalid Languages', 'No valid languages selected');
      return;
    }

    const usingImported = !!importedTranslations;
    
    const newJob: TranslationJob = {
      id: Date.now().toString(),
      fileName: selectedFile.name,
      sourceFile: selectedFile,
      selectedLanguages: [...validatedLanguages],
      detectedSourceLanguage: detectedSourceLanguage || undefined,
      status: 'ready',
      progress: 0,
      importedTranslations: importedTranslations,
      usingImportedTranslations: usingImported,
      isSetupComplete: true,
      availableImportedLanguages: usingImported ? [...importedLanguages] : undefined
    };
    
    setJobs(prev => [...prev, newJob]);
    setSelectedFile(null);
    
    const sourceLangName = detectedSourceLanguage ? 
      getLanguageInfo(detectedSourceLanguage)?.name : 'Auto-detect';
    
    showSuccess(
      '🎯 Translation Project Ready!',
      `${validatedLanguages.length} languages prepared`,
      `Source: ${sourceLangName} | File: ${selectedFile.name}`
    );
  };

  // Enhanced translation start
  const startTranslationForLanguage = async (job: TranslationJob, language: string) => {
    if (isProcessing) {
      showWarning('Translation Busy', 'Please wait for current translation to complete');
      return;
    }

    const validatedLang = getLanguageInfo(language);
    if (!validatedLang) {
      showError('Invalid Language', `Invalid language code: ${language}`);
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log(`🚀 Starting ENHANCED translation for ${validatedLang.name} (${validatedLang.code})`);
      
      updateJob(job.id, {
        status: 'pending',
        progress: 0,
        currentStep: `Starting ${validatedLang.name} translation with FIXED service...`
      });

      await startUniversalTranslation(job.id, job.sourceFile, [validatedLang.code], job.importedTranslations, job.detectedSourceLanguage);
    } catch (error) {
      console.error('❌ Translation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Translation failed';
      
      updateJob(job.id, {
        status: 'error',
        error: errorMessage
      });
      
      showTranslationError(validatedLang.name, errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const startTranslationForAllLanguages = async (job: TranslationJob) => {
    if (isProcessing) {
      showWarning('Translation Busy', 'Please wait for current translation to complete');
      return;
    }

    const validatedLanguages = validateLanguageSelection(job.selectedLanguages);
    if (validatedLanguages.length === 0) {
      showError('No Valid Languages', 'No valid languages in selection');
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log(`🚀 Starting ENHANCED translation for ${validatedLanguages.length} languages`);
      
      updateJob(job.id, {
        status: 'pending',
        progress: 0,
        currentStep: `Starting translation for ${validatedLanguages.length} languages with FIXED service...`
      });

      await startUniversalTranslation(job.id, job.sourceFile, validatedLanguages, job.importedTranslations, job.detectedSourceLanguage);
    } catch (error) {
      console.error('❌ Translation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Translation failed';
      
      updateJob(job.id, {
        status: 'error',
        error: errorMessage
      });
      
      showError('Translation Failed', errorMessage, 'Check console for detailed error information');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateJob = (jobId: string, updates: Partial<TranslationJob>) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, ...updates } : job
    ));
  };

  const startUniversalTranslation = async (jobId: string, file: File, targetLanguages: string[], importedTranslations?: any, sourceLanguage?: string) => {
    const validatedTargetLanguages = validateLanguageSelection(targetLanguages);
    
    if (validatedTargetLanguages.length === 0) {
      throw new Error('No valid target languages provided');
    }

    translationService.onProgress(jobId, (progress) => {
      updateJob(jobId, {
        status: progress.status,
        progress: progress.progress,
        currentStep: progress.currentStep,
        error: progress.error
      });
    });

    try {
      console.log(`🚀 Starting ENHANCED translation service for job: ${jobId}`);
      console.log(`📊 Using FIXED v${APP_VERSION} translation engine`);
      
      const results = await translationService.startUniversalTranslation(
        jobId,
        file,
        validatedTargetLanguages,
        sourceLanguage,
        importedTranslations
      );

      updateJob(jobId, {
        status: 'completed',
        progress: 100,
        results: results
      });

      const totalSize = results.reduce((sum, r) => sum + (r.size || 0), 0);
      console.log(`✅ ENHANCED translation completed: ${results.length} files, ${Math.round(totalSize/(1024*1024))}MB`);
      
      showSuccess(
        '🎉 Translation Complete!',
        `Generated ${results.length} translated files`,
        `Total size: ${Math.round(totalSize/(1024*1024))}MB`
      );

    } catch (error) {
      console.error(`❌ ENHANCED translation failed for job ${jobId}:`, error);
      throw error;
    }
  };

  // Download handlers (unchanged but with notifications)
  const handleDownload = async (job: TranslationJob, language: string) => {
    if (!job.results) return;
    
    const result = job.results.find(r => r.language === language);
    if (!result) return;

    try {
      await translationService.downloadFile(result.fileId, result.fileName);
      const lang = getLanguageInfo(language);
      showSuccess(
        'Download Started',
        `${lang?.name || language} file download initiated`,
        result.fileName
      );
    } catch (error) {
      showError('Download Failed', `Failed to download ${result.fileName}`, error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleDownloadAll = async (job: TranslationJob) => {
    if (!job.results) return;

    try {
      await translationService.downloadAllFiles(job.results, job.fileName);
      showSuccess(
        'Bulk Download Started',
        `Downloading ${job.results.length} files`,
        'Files will download individually'
      );
    } catch (error) {
      showError('Bulk Download Failed', 'Failed to download files', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleDownloadXLSX = async (job: TranslationJob) => {
    try {
      if (job.sheetId) {
        await translationService.downloadSheet(job.sheetId, `${job.fileName}_translations.xlsx`);
      } else {
        await translationService.generateUniversalXLSX(job, `${job.fileName}_translations.xlsx`);
      }
      showSuccess('XLSX Download', 'Translation spreadsheet download started');
    } catch (error) {
      showError('XLSX Download Failed', 'Could not download spreadsheet', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const clearImportedTranslations = () => {
    setImportedTranslations(null);
    setImportedFileName('');
    setImportedLanguages([]);
    setDetectedSourceLanguage(null);
    showInfo('Data Cleared', 'Imported translation data cleared');
  };

  const forceRefresh = () => {
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach(name => caches.delete(name));
      });
    }
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      {/* Notification System */}
      <NotificationSystem
        notifications={notifications}
        onRemove={removeNotification}
      />

      {/* Version indicators */}
      <div className="fixed bottom-4 left-4 z-50 space-y-2">
        <Badge className="bg-gray-800/80 text-gray-300 border-gray-600/50 text-xs backdrop-blur-sm">
          v{APP_VERSION}
        </Badge>
        <Badge className="bg-green-800/80 text-green-300 border-green-600/50 text-xs backdrop-blur-sm">
          FIXED ✅
        </Badge>
        <Badge className="bg-purple-800/80 text-purple-300 border-purple-600/50 text-xs backdrop-blur-sm">
          Languages: {ALL_GOOGLE_TRANSLATE_LANGUAGES.length}
        </Badge>
        <Badge className={`text-xs backdrop-blur-sm ${
          cacheStatus === 'cleared' ? 'bg-green-800/80 text-green-300 border-green-600/50' :
          'bg-gray-800/80 text-gray-300 border-gray-600/50'
        }`}>
          Cache: {cacheStatus}
        </Badge>
        
        {detectedSourceLanguage && (
          <Badge className="bg-blue-800/80 text-blue-300 border-blue-600/50 text-xs backdrop-blur-sm">
            Source: {getLanguageInfo(detectedSourceLanguage)?.name}
          </Badge>
        )}
        
        {selectedLanguages.length > 0 && (
          <Badge className="bg-purple-800/80 text-purple-300 border-purple-600/50 text-xs backdrop-blur-sm">
            Selected: {selectedLanguages.length}
          </Badge>
        )}
      </div>

      {/* Force refresh button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={forceRefresh}
          size="sm"
          className="bg-gray-800/80 border-gray-600/50 text-gray-300 hover:bg-gray-700/80 backdrop-blur-sm"
          title="Clear cache and refresh"
        >
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>

      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        {animationsEnabled ? (
          <>
            <div className="absolute inset-0">
              <div 
                className="absolute w-[600px] h-[600px] bg-gradient-to-br from-blue-500/6 via-cyan-500/8 to-purple-500/6 rounded-full blur-3xl gpu-accelerated"
                style={{
                  transform: `translate(${mousePosition.x * 3 - 300}px, ${mousePosition.y * 2 - 200}px) scale(${1 + mousePosition.x * 0.002})`,
                  willChange: 'transform',
                  transition: 'transform 1000ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
              <div 
                className="absolute w-[500px] h-[500px] bg-gradient-to-bl from-purple-500/8 via-pink-500/6 to-blue-500/4 rounded-full blur-2xl gpu-accelerated"
                style={{
                  transform: `translate(${-mousePosition.x * 2 + 200}px, ${mousePosition.y * 1.5 - 100}px) scale(${1 + mousePosition.y * 0.0015})`,
                  willChange: 'transform',
                  transition: 'transform 1200ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </div>
          </>
        ) : (
          <div className="absolute inset-0">
            <div className="absolute w-[600px] h-[600px] bg-gradient-to-br from-blue-500/4 via-cyan-500/6 to-purple-500/4 rounded-full blur-3xl left-1/4 top-1/4" />
            <div className="absolute w-[500px] h-[500px] bg-gradient-to-bl from-purple-500/6 via-pink-500/4 to-blue-500/3 rounded-full blur-2xl right-1/4 top-1/2" />
          </div>
        )}
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              {apiStatus && (
                <>
                  <Badge className={`${
                    apiStatus.hasEnvironmentKey && apiStatus.environmentKeyValid
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  } text-xs`}>
                    <Settings className="w-3 h-3 mr-1" />
                    {apiStatus.hasEnvironmentKey && apiStatus.environmentKeyValid 
                      ? 'Real APIs' 
                      : 'Demo Mode'
                    }
                  </Badge>
                  
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                    <Cpu className="w-3 h-3 mr-1" />
                    ENHANCED
                  </Badge>
                  
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    FIXED
                  </Badge>
                </>
              )}
            </div>

            <Select value={currentLanguage} onValueChange={changeLanguage}>
              <SelectTrigger className="w-36 bg-white/5 backdrop-blur-sm border-white/10 text-white">
                <SelectValue className="text-white" />
              </SelectTrigger>
              <SelectContent className="select-content bg-gray-900/95 backdrop-blur-md border-gray-700">
                {UI_LANGUAGES.map(lang => (
                  <SelectItem 
                    key={lang.code} 
                    value={lang.code} 
                    className="select-item text-white hover:bg-white/10 focus:bg-white/15 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-2xl">
              <Globe className="w-5 h-5" />
            </div>
            <h1 className="text-4xl font-serif bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent leading-tight">
              PPTX Translator Pro
            </h1>
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-gray-400 text-base max-w-xl mx-auto mb-3">
            Universal PowerPoint translation with enhanced error handling and all {ALL_GOOGLE_TRANSLATE_LANGUAGES.length} Google Translate languages
          </p>
          
          <div className="flex justify-center gap-2">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1 text-sm">
              <CheckCircle className="w-3 h-3 mr-1" />
              CSS + Service Fixed
            </Badge>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 px-3 py-1 text-sm">
              <Globe className="w-3 h-3 mr-1" />
              {ALL_GOOGLE_TRANSLATE_LANGUAGES.length} Languages
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-3 py-1 text-sm">
              <Scan className="w-3 h-3 mr-1" />
              Enhanced Detection
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Upload & Language Selection */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6 bg-black/40 backdrop-blur-sm border-white/10 border shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif text-white">Select PPTX File</h2>
                <div className="flex gap-2">
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-2 py-1 text-xs">
                    <Cpu className="w-3 h-3 mr-1" />
                    v{APP_VERSION}
                  </Badge>
                  {detectedSourceLanguage && (
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-2 py-1 text-xs">
                      <Scan className="w-3 h-3 mr-1" />
                      {getLanguageInfo(detectedSourceLanguage)?.flag} 
                      {getLanguageInfo(detectedSourceLanguage)?.name}
                    </Badge>
                  )}
                </div>
              </div>
              <FileUploader 
                onFileSelect={handleFileSelect}
                disabled={isProcessing}
              />
              
              {detectedSourceLanguage && (
                <div className="mt-4 p-3 bg-blue-500/10 rounded border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Scan className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 text-sm font-medium">Auto-detected Source Language</span>
                  </div>
                  <p className="text-blue-300 text-sm">
                    {getLanguageInfo(detectedSourceLanguage)?.flag} {' '}
                    <strong>{getLanguageInfo(detectedSourceLanguage)?.name}</strong> ({detectedSourceLanguage})
                  </p>
                </div>
              )}
            </Card>

            <Card className="p-6 bg-black/40 backdrop-blur-sm border-white/10 border shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif text-white">Target Languages</h2>
                <div className="flex gap-2">
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 px-2 py-1 text-xs">
                    All: {ALL_GOOGLE_TRANSLATE_LANGUAGES.length}
                  </Badge>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-2 py-1 text-xs">
                    Enhanced
                  </Badge>
                  {selectedLanguages.length > 0 && (
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-2 py-1 text-xs">
                      Selected: {selectedLanguages.length}
                    </Badge>
                  )}
                </div>
              </div>
              
              <LanguageSelector 
                languages={ALL_GOOGLE_TRANSLATE_LANGUAGES}
                selectedLanguages={selectedLanguages}
                onSelectionChange={handleLanguageSelectionChange}
                maxSelection={0}
                disabled={isProcessing}
                onXLSXImport={handleXLSXImport}
              />
            </Card>
          </div>

          {/* Setup Button */}
          {selectedFile && selectedLanguages.length > 0 && (
            <Card className="p-6 bg-black/40 backdrop-blur-sm border-green-500/20 border shadow-2xl">
              <div className="text-center">
                <h3 className="text-lg font-serif text-white mb-3">Ready for Enhanced Translation</h3>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-300">{selectedFile.name}</span>
                  </div>
                  {detectedSourceLanguage && (
                    <div className="flex items-center gap-2">
                      <Scan className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-300">
                        {getLanguageInfo(detectedSourceLanguage)?.flag} {getLanguageInfo(detectedSourceLanguage)?.name}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Languages className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-gray-300">{selectedLanguages.length} target languages</span>
                  </div>
                  {importedTranslations && (
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-300">XLSX Ready</span>
                    </div>
                  )}
                </div>
                <Button
                  onClick={createTranslationSetup}
                  disabled={isProcessing}
                  className="bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30 border"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Setup Enhanced Translation
                </Button>
              </div>
            </Card>
          )}

          {/* XLSX Import Status */}
          {importedTranslations && (
            <Card className="p-6 bg-black/40 backdrop-blur-sm border-green-500/20 border shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-green-400" />
                  <h3 className="text-green-400 text-lg font-medium">XLSX Translation Data Ready</h3>
                </div>
                <Button
                  onClick={clearImportedTranslations}
                  variant="outline"
                  size="sm"
                  className="bg-gray-500/10 border-gray-500/30 text-gray-400 hover:bg-gray-500/20"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">File:</span>
                    <span className="text-white truncate max-w-48">{importedFileName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Slides:</span>
                    <span className="text-white">{Object.keys(importedTranslations).length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Languages:</span>
                    <span className="text-white">{importedLanguages.length} detected</span>
                  </div>
                  {detectedSourceLanguage && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Source:</span>
                      <span className="text-green-300">
                        {getLanguageInfo(detectedSourceLanguage)?.flag} {getLanguageInfo(detectedSourceLanguage)?.name}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-gray-400 mb-2">Detected Languages:</div>
                  <div className="max-h-32 overflow-y-auto">
                    <div className="flex flex-wrap gap-1">
                      {importedLanguages.slice(0, 15).map(langCode => {
                        const lang = getLanguageInfo(langCode);
                        const isSelected = selectedLanguages.includes(langCode);
                        
                        return lang ? (
                          <Badge 
                            key={langCode} 
                            className={`text-xs ${
                              isSelected 
                                ? 'bg-green-500/30 text-green-200 border-green-400/50' 
                                : 'bg-green-500/10 text-green-400 border-green-500/30'
                            }`}
                          >
                            <span className="mr-1">{lang.flag}</span>
                            {lang.name}
                            {isSelected && <CheckCircle className="w-3 h-3 ml-1" />}
                          </Badge>
                        ) : null;
                      })}
                      {importedLanguages.length > 15 && (
                        <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30 text-xs">
                          +{importedLanguages.length - 15} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Processing Warning */}
          {isProcessing && (
            <Card className="p-3 bg-black/40 backdrop-blur-sm border-yellow-500/20 border">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <p className="text-yellow-400 text-sm">
                  Enhanced translation in progress with FIXED v{APP_VERSION} engine...
                </p>
              </div>
            </Card>
          )}

          {/* Translation Jobs */}
          {jobs.length > 0 && (
            <Card className="p-6 bg-black/40 backdrop-blur-sm border-white/10 border shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif text-white">Enhanced Translation Projects</h2>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-2 py-1 text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  {jobs.length} Projects
                </Badge>
              </div>
              <div className="space-y-6">
                {jobs.map(job => (
                  <div key={job.id} className="relative border border-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-white">{job.fileName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`text-xs ${
                            job.status === 'ready' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                            job.status === 'completed' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                            job.status === 'error' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                            'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                          }`}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </Badge>
                          <span className="text-sm text-gray-400">
                            {job.selectedLanguages.length} languages
                          </span>
                          {job.detectedSourceLanguage && (
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                              <Scan className="w-3 h-3 mr-1" />
                              {getLanguageInfo(job.detectedSourceLanguage)?.flag} 
                              {getLanguageInfo(job.detectedSourceLanguage)?.name}
                            </Badge>
                          )}
                          {job.usingImportedTranslations && (
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                              <FileSpreadsheet className="w-3 h-3 mr-1" />
                              XLSX
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ready State */}
                    {job.status === 'ready' && (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="text-sm text-gray-400 mb-2">Generate Individual Languages:</div>
                          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                            {job.selectedLanguages.slice(0, 20).map(langCode => {
                              const lang = getLanguageInfo(langCode);
                              const isFromImport = job.availableImportedLanguages?.includes(langCode);
                              
                              return lang ? (
                                <Button
                                  key={langCode}
                                  onClick={() => startTranslationForLanguage(job, langCode)}
                                  disabled={isProcessing}
                                  size="sm"
                                  className={`${
                                    isFromImport
                                      ? 'bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30'
                                      : 'bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30'
                                  } border text-xs`}
                                >
                                  <span className="mr-1">{lang.flag}</span>
                                  {lang.name}
                                </Button>
                              ) : null;
                            })}
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-white/10">
                          <Button
                            onClick={() => startTranslationForAllLanguages(job)}
                            disabled={isProcessing}
                            className="bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30 border"
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            Generate All Languages ({job.selectedLanguages.length})
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Processing State */}
                    {['pending', 'extracting', 'translating', 'verifying', 'rebuilding'].includes(job.status) && (
                      <TranslationProgress 
                        job={job}
                        onDownload={handleDownload}
                        onDownloadAll={handleDownloadAll}
                      />
                    )}

                    {/* Completed State */}
                    {job.status === 'completed' && job.results && (
                      <div className="space-y-4">
                        <div className="grid gap-3 max-h-60 overflow-y-auto">
                          {job.results.map(result => {
                            const lang = getLanguageInfo(result.language);
                            return (
                              <div key={result.language} className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded">
                                <div className="flex items-center gap-3">
                                  <span className="text-lg">
                                    {lang?.flag || '🌍'}
                                  </span>
                                  <div>
                                    <p className="text-green-400 font-medium">
                                      {lang?.name || result.language}
                                    </p>
                                    <p className="text-green-300 text-sm">
                                      {result.fileName} ({Math.round((result.size || 0)/1024)}KB)
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => handleDownload(job, result.language)}
                                  size="sm"
                                  className="bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30 border"
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Download
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="pt-4 border-t border-white/10 flex gap-3 flex-wrap">
                          <Button
                            onClick={() => handleDownloadAll(job)}
                            className="bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30 border"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download All Files
                          </Button>
                          
                          <Button
                            onClick={() => handleDownloadXLSX(job)}
                            variant="outline"
                            className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                          >
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Download XLSX
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Error State */}
                    {job.status === 'error' && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
                        <p className="text-red-400 text-sm">
                          {job.error || 'An unknown error occurred'}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* API Status */}
          {apiStatus && !apiStatus.hasEnvironmentKey && (
            <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <h3 className="text-yellow-400">Google APIs Not Configured</h3>
              </div>
              <p className="text-yellow-300 text-sm mb-3">
                App is using ENHANCED PPTX processing v{APP_VERSION} with full translation capabilities. 
                All features work with mock data for testing. To enable Google Translate API:
              </p>
              <div className="text-xs text-yellow-200 space-y-1">
                <p>1. Go to <strong>Netlify Dashboard</strong> → Your Site → <strong>Environment Variables</strong></p>
                <p>2. Add: <code className="bg-yellow-500/20 px-1 rounded">VITE_GOOGLE_SERVICE_ACCOUNT_KEY</code></p>
                <p>3. Value: Your service account JSON (as single line)</p>
                <p>4. <strong>Deploy site</strong> to activate Google Translate</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}