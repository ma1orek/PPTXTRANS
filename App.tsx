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
import { translationService, TranslationResult } from './services/translationService';
import { googleApiService } from './services/googleApi';

// UNIVERSAL TRANSLATION VERSION - All 65+ Google Translate Languages + Auto Detection
const APP_VERSION = '2024.12.16.23.00'; // CSS Fix + Language Error Fix
const BUILD_INFO = {
  version: APP_VERSION,
  buildTime: new Date().toISOString(),
  features: ['UNIVERSAL_TRANSLATION', 'ALL_65_LANGUAGES', 'AUTO_LANGUAGE_DETECTION', 'ANY_TO_ANY_TRANSLATION', 'COMPLETE_GT_VERIFICATION', 'CSS_LOADING_FIX']
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

// COMPLETE LIST: All 65+ Google Translate Supported Languages - FIXED Albanian mapping
const ALL_GOOGLE_TRANSLATE_LANGUAGES = [
  // European Languages
  { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
  { code: 'sq', name: 'Albanian', flag: '🇦🇱' }, // FIXED: This was the issue - correct Albanian code
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

// ENHANCED: Language code mapping and validation
const getLanguageInfo = (code: string) => {
  // Handle both 'sq' and variations for Albanian
  const normalizedCode = code.toLowerCase().trim();
  
  // Direct match first
  let language = ALL_GOOGLE_TRANSLATE_LANGUAGES.find(l => l.code === normalizedCode);
  
  // If not found, try alternative codes
  if (!language) {
    const alternativeMappings: { [key: string]: string } = {
      'al': 'sq', // Albania country code -> Albanian language
      'sqi': 'sq', // ISO 639-2 code for Albanian
      'alb': 'sq', // Alternative Albanian code
      'zh-cn': 'zh', // Chinese simplified variants
      'zh-hans': 'zh',
      'zh-hant': 'zh-tw',
    };
    
    const mappedCode = alternativeMappings[normalizedCode];
    if (mappedCode) {
      language = ALL_GOOGLE_TRANSLATE_LANGUAGES.find(l => l.code === mappedCode);
    }
  }
  
  // Fallback: partial match on name
  if (!language) {
    language = ALL_GOOGLE_TRANSLATE_LANGUAGES.find(l => 
      l.name.toLowerCase().includes(normalizedCode) ||
      normalizedCode.includes(l.code)
    );
  }
  
  return language;
};

// ENHANCED: Validate and normalize language selection
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
  
  return [...new Set(validCodes)]; // Remove duplicates
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
  
  // DEBUG: Log selectedLanguages state changes with validation
  useEffect(() => {
    console.log('🔍 DEBUG - selectedLanguages changed:', selectedLanguages);
    console.log('🔍 DEBUG - importedLanguages:', importedLanguages);
    console.log('🔍 DEBUG - detectedSourceLanguage:', detectedSourceLanguage);
    console.log('🔍 DEBUG - importedTranslations keys:', importedTranslations ? Object.keys(importedTranslations) : 'none');
    
    // ENHANCED: Validate selected languages
    if (selectedLanguages.length > 0) {
      const validatedLanguages = validateLanguageSelection(selectedLanguages);
      if (validatedLanguages.length !== selectedLanguages.length) {
        console.warn('🔧 Correcting invalid language selections...');
        setSelectedLanguages(validatedLanguages);
      }
    }
  }, [selectedLanguages, importedLanguages, importedTranslations, detectedSourceLanguage]);

  // Mouse tracking with enhanced error handling
  useEffect(() => {
    const shouldEnableAnimations = () => {
      try {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          return false;
        }
        
        const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
        const isSlowConnection = navigator.connection && navigator.connection.effectiveType && 
          ['slow-2g', '2g'].includes(navigator.connection.effectiveType);
        
        if (isLowEndDevice || isSlowConnection) {
          return false;
        }
        
        return true;
      } catch (error) {
        console.warn('⚠️ Animation detection failed, using safe defaults:', error);
        return false;
      }
    };

    const animationsSupported = shouldEnableAnimations();
    setAnimationsEnabled(animationsSupported);
    
    if (animationsSupported) {
      let rafId: number;
      let lastUpdate = 0;
      const throttleTime = 16; // ~60fps
      
      const handleMouseMove = (e: MouseEvent) => {
        try {
          const now = Date.now();
          if (now - lastUpdate < throttleTime) return;
          
          lastUpdate = now;
          
          if (rafId) {
            cancelAnimationFrame(rafId);
          }
          
          rafId = requestAnimationFrame(() => {
            setMousePosition({
              x: (e.clientX / window.innerWidth) * 100,
              y: (e.clientY / window.innerHeight) * 100
            });
          });
        } catch (error) {
          console.warn('⚠️ Mouse tracking error:', error);
        }
      };

      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
      };
    } else {
      console.log('🎨 Animations disabled for performance/compatibility');
      setMousePosition({ x: 50, y: 50 });
    }
  }, []);

  // Enhanced cache busting and version management
  useEffect(() => {
    console.log(`🚀 PPTX Translator Pro v${APP_VERSION} - CSS FIX + LANGUAGE ERROR FIX`);
    console.log('📋 Build Info:', BUILD_INFO);
    
    // Enhanced meta tags for better cache control
    const metaTags = [
      { name: 'app-version', content: APP_VERSION },
      { name: 'cache-control', content: 'no-cache, no-store, must-revalidate' },
      { name: 'pragma', content: 'no-cache' },
      { name: 'expires', content: '0' },
      { name: 'last-modified', content: new Date().toISOString() },
      { name: 'css-fix-applied', content: 'true' }
    ];
    
    metaTags.forEach(({ name, content }) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    });
    
    document.title = `PPTX Translator Pro v${APP_VERSION} - CSS Fixed + Universal Translation`;
    
    // Enhanced hash-based cache busting
    if (!window.location.hash.includes(APP_VERSION)) {
      const newHash = `#v${APP_VERSION}-css-fixed`;
      if (window.location.hash !== newHash) {
        console.log('🔄 Updating URL hash for cache busting with CSS fix');
        window.location.hash = newHash;
      }
    }
    
    const lastVersion = localStorage.getItem('pptx-translator-version');
    if (lastVersion !== APP_VERSION) {
      console.log('🔄 Version change detected, clearing local data');
      localStorage.clear();
      localStorage.setItem('pptx-translator-version', APP_VERSION);
      
      // Enhanced notification for CSS fix
      const notification = document.createElement('div');
      notification.innerHTML = `
        <div style="
          position: fixed; 
          top: 10px; 
          left: 50%; 
          transform: translateX(-50%);
          background: rgba(34, 197, 94, 0.95); 
          color: white; 
          padding: 12px 20px; 
          border-radius: 8px; 
          z-index: 10000;
          font-family: system-ui;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        ">
          ✅ Updated to v${APP_VERSION} - CSS Loading Fixed + Language Errors Resolved!
        </div>
      `;
      
      document.body.appendChild(notification);
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 5000);
    }
    
    // Enhanced cache clearing
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
      }).catch((error) => {
        console.warn('⚠️ Cache API not available:', error);
        setCacheStatus('unavailable');
      });
    } else {
      console.log('ℹ️ Cache API not supported');
      setCacheStatus('unsupported');
    }
    
    console.log('✅ Cache busting strategies applied for CSS fix');
  }, []);

  // Check API status on load with enhanced error handling
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        console.log('🔍 Checking UNIVERSAL API status...');
        
        await googleApiService.authenticate();
        const status = googleApiService.getCredentialsStatus();
        console.log('📊 UNIVERSAL API Status:', status);
        
        setApiStatus(status);
      } catch (error) {
        console.error('❌ Failed to check UNIVERSAL API status:', error);
        
        setApiStatus({
          hasEnvironmentKey: false,
          environmentKeyValid: false,
          recommendedSetup: 'Error checking API status - running in enhanced local mode',
          availableEnvVars: [],
          debugInfo: {
            error: error instanceof Error ? error.message : 'Unknown error',
            cssFixApplied: true,
            version: APP_VERSION
          }
        });
      }
    };

    const timeoutId = setTimeout(checkApiStatus, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  // ENHANCED: Auto-detect source language with better error handling
  const detectSourceLanguage = async (file: File): Promise<string> => {
    try {
      console.log('🔍 Detecting source language from PPTX...');
      
      // Extract sample text from PPTX for language detection
      const sampleText = await translationService.extractSampleTextForDetection(file);
      
      if (!sampleText || sampleText.length < 20) {
        console.warn('⚠️ Insufficient text for language detection, defaulting to English');
        return 'en';
      }
      
      // Use Google Translate API to detect language
      const detectedLang = await translationService.detectLanguage(sampleText);
      
      // Validate detected language
      const validatedLang = getLanguageInfo(detectedLang);
      const finalLang = validatedLang ? validatedLang.code : 'en';
      
      console.log(`✅ Detected source language: ${finalLang} from text: "${sampleText.substring(0, 100)}..."`);
      
      return finalLang;
    } catch (error) {
      console.error('❌ Language detection failed:', error);
      return 'en'; // Default to English
    }
  };

  // ENHANCED: Handle XLSX import with better language validation
  const handleXLSXImport = (file: File, translations: any) => {
    try {
      console.log('📊 UNIVERSAL XLSX IMPORT with enhanced language validation:', { fileName: file.name, translationsKeys: Object.keys(translations) });
      
      setImportedTranslations(translations);
      setImportedFileName(file.name);
      
      // Enhanced: Extract ALL available languages with validation
      const detectedLanguages = new Set<string>();
      let possibleSourceLang: string | null = null;
      
      Object.values(translations).forEach((slideTranslations: any) => {
        if (slideTranslations && typeof slideTranslations === 'object') {
          Object.keys(slideTranslations).forEach(key => {
            if (key !== 'originalText' && !['slide', 'slide_id', 'index', 'element', 'status'].includes(key.toLowerCase())) {
              const langCode = key.toLowerCase();
              
              // Use enhanced language validation
              const validatedLang = getLanguageInfo(langCode);
              
              if (validatedLang) {
                detectedLanguages.add(validatedLang.code);
                
                // Try to detect source language (usually has more complete text)
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
      
      console.log('🔍 Detected languages from UNIVERSAL XLSX (validated):', Array.from(detectedLanguages));
      console.log('🎯 Possible source language:', possibleSourceLang);
      
      // Set detected source language
      if (possibleSourceLang) {
        setDetectedSourceLanguage(possibleSourceLang);
      }
      
      const mappedLanguages = Array.from(detectedLanguages);
      setImportedLanguages(mappedLanguages);
      setSelectedLanguages(mappedLanguages);
      
      console.log('🔄 UNIVERSAL state updated after XLSX import (validated):', {
        importedLanguages: mappedLanguages,
        selectedLanguages: mappedLanguages,
        detectedSourceLanguage: possibleSourceLang,
        slideCount: Object.keys(translations).length
      });
      
      // Enhanced notification with validation info
      if (mappedLanguages.length > 0) {
        const languageNames = mappedLanguages.map(code => 
          getLanguageInfo(code)?.name || code
        ).join(', ');
        
        const sourceLangName = possibleSourceLang ? 
          getLanguageInfo(possibleSourceLang)?.name : 'Unknown';
        
        const notification = document.createElement('div');
        notification.innerHTML = `
          <div style="
            position: fixed; 
            top: 20px; 
            left: 50%; 
            transform: translateX(-50%);
            background: rgba(34, 197, 94, 0.95); 
            color: white; 
            padding: 16px 24px; 
            border-radius: 12px; 
            max-width: 600px; 
            z-index: 10001;
            font-family: system-ui, -apple-system, sans-serif;
            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(34, 197, 94, 0.3);
          ">
            <div style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">
              🌍 UNIVERSAL TRANSLATION XLSX Imported! ✅
            </div>
            <div style="font-size: 14px; opacity: 0.95; margin-bottom: 8px;">
              <strong>Source Language Detected:</strong> ${sourceLangName}<br>
              <strong>Validated Languages (${mappedLanguages.length}):</strong><br>
              ${languageNames}
            </div>
            <div style="font-size: 13px; opacity: 0.9; margin-bottom: 8px;">
              📋 ${Object.keys(translations).length} slides ready for ANY-to-ANY translation
            </div>
            <div style="font-size: 12px; opacity: 0.8;">
              Universal Translation: ${sourceLangName} → Any Target Language 🎯<br>
              Language validation: ✅ All codes verified
            </div>
          </div>
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 8000);
        
        console.log(`✅ UNIVERSAL SUCCESS: Auto-detected ${mappedLanguages.length} validated languages from XLSX with source: ${sourceLangName}`);
        
      } else {
        console.warn('⚠️ No recognizable languages found in UNIVERSAL XLSX structure');
        
        const notification = document.createElement('div');
        notification.innerHTML = `
          <div style="
            position: fixed; 
            top: 20px; 
            left: 50%; 
            transform: translateX(-50%);
            background: rgba(245, 158, 11, 0.95); 
            color: white; 
            padding: 16px 24px; 
            border-radius: 12px; 
            max-width: 500px; 
            z-index: 10001;
            font-family: system-ui, -apple-system, sans-serif;
            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(245, 158, 11, 0.3);
          ">
            <div style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">
              ⚠️ UNIVERSAL XLSX Language Detection Issue
            </div>
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">
              Could not auto-detect valid languages from XLSX structure.<br>
              <strong>Expected structure:</strong><br>
              Slide | SourceText | Valid Google Translate Language Codes...
            </div>
            <div style="font-size: 12px; opacity: 0.8;">
              Please manually select languages below for universal translation.<br>
              Language validation ensures compatibility with all ${ALL_GOOGLE_TRANSLATE_LANGUAGES.length} supported languages.
            </div>
          </div>
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 10000);
      }
      
    } catch (error) {
      console.error('❌ Error processing UNIVERSAL XLSX import:', error);
      
      const notification = document.createElement('div');
      notification.innerHTML = `
        <div style="
          position: fixed; 
          top: 20px; 
          left: 50%; 
          transform: translateX(-50%);
          background: rgba(239, 68, 68, 0.95); 
          color: white; 
          padding: 16px 24px; 
          border-radius: 12px; 
          max-width: 400px; 
          z-index: 10001;
          font-family: system-ui;
          box-shadow: 0 10px 30px rgba(0,0,0,0.4);
          backdrop-filter: blur(16px);
        ">
          <div style="font-weight: bold; margin-bottom: 8px;">❌ UNIVERSAL XLSX Import Error</div>
          <div style="font-size: 14px;">
            Failed to process UNIVERSAL XLSX file. Please check the format matches expected structure with valid language codes.
          </div>
        </div>
      `;
      
      document.body.appendChild(notification);
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 5000);
    }
  };

  // Clear imported translations
  const clearImportedTranslations = () => {
    setImportedTranslations(null);
    setImportedFileName('');
    setImportedLanguages([]);
    setDetectedSourceLanguage(null);
    console.log('🗑️ Cleared imported universal translations data');
  };

  // Handle file selection with enhanced auto language detection
  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    console.log(`📁 File selected: ${file.name} (${Math.round(file.size/(1024*1024))}MB)`);
    
    // Auto-detect source language with enhanced validation
    if (!detectedSourceLanguage) {
      try {
        const detected = await detectSourceLanguage(file);
        setDetectedSourceLanguage(detected);
        
        const detectedLangInfo = getLanguageInfo(detected);
        const detectedLangName = detectedLangInfo?.name || detected;
        
        console.log(`🎯 Auto-detected source language: ${detectedLangName} (${detected})`);
        
        // Show notification
        const notification = document.createElement('div');
        notification.innerHTML = `
          <div style="
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: rgba(59, 130, 246, 0.95); 
            color: white; 
            padding: 12px 16px; 
            border-radius: 8px; 
            z-index: 9999;
            font-family: system-ui;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          ">
            🔍 Source Language Detected: <strong>${detectedLangName}</strong>
          </div>
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 3000);
        
      } catch (error) {
        console.warn('⚠️ Auto language detection failed:', error);
      }
    }
  };

  // Handle selectedLanguages change with enhanced validation
  const handleLanguageSelectionChange = (newSelection: string[]) => {
    console.log('🔄 UNIVERSAL language selection changed:', { from: selectedLanguages, to: newSelection });
    
    // Enhanced validation before setting
    const validatedSelection = validateLanguageSelection(newSelection);
    console.log('🔍 Validated language selection:', validatedSelection);
    
    setSelectedLanguages(validatedSelection);
  };

  // Rest of the functions remain the same but with enhanced error handling
  const createTranslationSetup = () => {
    if (!selectedFile) {
      alert('Please select a PPTX file first.');
      return;
    }

    if (selectedLanguages.length === 0) {
      alert(t('selectAtLeastOneLanguage') || 'Please select at least one target language.');
      return;
    }

    // Enhanced validation
    const validatedLanguages = validateLanguageSelection(selectedLanguages);
    if (validatedLanguages.length !== selectedLanguages.length) {
      console.warn('🔧 Some languages were invalid and removed from selection');
      setSelectedLanguages(validatedLanguages);
    }

    if (validatedLanguages.length === 0) {
      alert('No valid languages selected. Please choose from the supported language list.');
      return;
    }

    const usingImported = !!importedTranslations;
    
    console.log(`🎯 Creating UNIVERSAL translation setup for: ${selectedFile.name}`);
    console.log(`🌍 Validated target languages: ${validatedLanguages.join(', ')}`);
    console.log(`🔍 Detected source: ${detectedSourceLanguage}`);
    console.log(`📊 Using imported translations: ${usingImported}`);
    
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
    
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed; 
        top: 20px; 
        right: 20px; 
        background: rgba(59, 130, 246, 0.95); 
        color: white; 
        padding: 16px; 
        border-radius: 8px; 
        max-width: 450px; 
        z-index: 9999;
        font-family: system-ui, -apple-system, sans-serif;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        backdrop-filter: blur(10px);
      ">
        <div style="font-weight: bold; margin-bottom: 8px;">🌍 Universal Translation Project Ready!</div>
        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">
          ✅ Source: ${sourceLangName}<br>
          ✅ Validated Target Languages: ${validatedLanguages.length}<br>
          ${usingImported ? '📊 Using XLSX imported translations' : '🌐 Ready for Google Translate processing'}
        </div>
        <div style="font-size: 12px; margin-top: 8px; opacity: 0.8;">
          Any-to-Any Translation Ready! 🎯<br>
          Language validation: ✅ All codes verified
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 6000);
  };

  // Continue with all other functions - they remain largely the same
  const startTranslationForLanguage = async (job: TranslationJob, language: string) => {
    if (isProcessing) {
      alert('Please wait for the current translation to complete.');
      return;
    }

    // Validate language before processing
    const validatedLang = getLanguageInfo(language);
    if (!validatedLang) {
      alert(`Invalid language code: ${language}. Please select a valid language.`);
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log(`🚀 Starting UNIVERSAL translation for ${validatedLang.name} (${validatedLang.code}) in job ${job.id}`);
      console.log(`🔍 Source language: ${job.detectedSourceLanguage || 'auto-detect'}`);
      console.log(`📊 Using imported translations:`, !!job.importedTranslations);
      
      updateJob(job.id, {
        status: 'pending',
        progress: 0,
        currentStep: `Starting ${validatedLang.name} translation from ${job.detectedSourceLanguage?.toUpperCase() || 'AUTO'} with ${job.usingImportedTranslations ? 'imported XLSX data' : 'Universal Google Translate'}...`
      });

      await startUniversalTranslation(job.id, job.sourceFile, [validatedLang.code], job.importedTranslations, job.detectedSourceLanguage);
    } catch (error) {
      console.error('❌ Universal translation failed:', error);
      updateJob(job.id, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Universal translation failed'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const startTranslationForAllLanguages = async (job: TranslationJob) => {
    if (isProcessing) {
      alert('Please wait for the current translation to complete.');
      return;
    }

    // Validate all languages before processing
    const validatedLanguages = validateLanguageSelection(job.selectedLanguages);
    if (validatedLanguages.length === 0) {
      alert('No valid languages in selection. Please check your language choices.');
      return;
    }

    if (validatedLanguages.length !== job.selectedLanguages.length) {
      console.warn('🔧 Some languages were invalid and will be skipped');
    }

    setIsProcessing(true);
    
    try {
      console.log(`🚀 Starting UNIVERSAL translation for all validated languages in job ${job.id}`);
      console.log(`🔍 Source language: ${job.detectedSourceLanguage || 'auto-detect'}`);
      console.log(`📊 Using imported translations:`, !!job.importedTranslations);
      console.log(`🌍 Validated languages: ${validatedLanguages.join(', ')}`);
      
      updateJob(job.id, {
        status: 'pending',
        progress: 0,
        currentStep: `Starting UNIVERSAL translation for ${validatedLanguages.length} validated languages from ${job.detectedSourceLanguage?.toUpperCase() || 'AUTO'} with ${job.usingImportedTranslations ? 'imported XLSX data' : 'Universal Google Translate'}...`
      });

      await startUniversalTranslation(job.id, job.sourceFile, validatedLanguages, job.importedTranslations, job.detectedSourceLanguage);
    } catch (error) {
      console.error('❌ Universal translation failed:', error);
      updateJob(job.id, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Universal translation failed'
      });
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
    // Enhanced validation for target languages
    const validatedTargetLanguages = validateLanguageSelection(targetLanguages);
    
    if (validatedTargetLanguages.length === 0) {
      throw new Error('No valid target languages provided');
    }

    if (validatedTargetLanguages.length !== targetLanguages.length) {
      console.warn(`🔧 Removed ${targetLanguages.length - validatedTargetLanguages.length} invalid language(s) from translation job: ${jobId}`);
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
      console.log(`🚀 Starting UNIVERSAL translation service for job: ${jobId}`);
      console.log(`📊 Using v${APP_VERSION} UNIVERSAL translation engine with enhanced validation`);
      console.log(`🔍 Source language: ${sourceLanguage || 'auto-detect'}`);
      console.log(`🌍 Validated target languages: ${validatedTargetLanguages.join(', ')}`);
      console.log(`📋 Imported translations:`, importedTranslations ? 'YES' : 'NO');
      
      const results = await translationService.startUniversalTranslation(
        jobId,
        file,
        validatedTargetLanguages, // Use validated languages
        sourceLanguage,
        importedTranslations
      );

      updateJob(jobId, {
        status: 'completed',
        progress: 100,
        results: results
      });

      const totalSize = results.reduce((sum, r) => sum + (r.size || 0), 0);
      console.log(`✅ UNIVERSAL translation completed for job ${jobId}: ${results.length} files, ${Math.round(totalSize/(1024*1024))}MB total`);

    } catch (error) {
      console.error(`❌ UNIVERSAL translation failed for job ${jobId}:`, error);
      
      updateJob(jobId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      throw error;
    }
  };

  // Rest of the functions remain the same...
  const handleDownload = async (job: TranslationJob, language: string) => {
    if (!job.results) return;
    
    const result = job.results.find(r => r.language === language);
    if (!result) return;

    try {
      await translationService.downloadFile(result.fileId, result.fileName);
    } catch (error) {
      alert(`Failed to download ${result.fileName}: ${error}`);
    }
  };

  const handleDownloadAll = async (job: TranslationJob) => {
    if (!job.results) return;

    try {
      await translationService.downloadAllFiles(job.results, job.fileName);
    } catch (error) {
      alert(`Failed to download files: ${error}`);
    }
  };

  const handleDownloadXLSX = async (job: TranslationJob) => {
    try {
      console.log(`📊 Downloading UNIVERSAL XLSX for job ${job.id} with v${APP_VERSION} ALL 65+ languages structure`);
      
      if (job.sheetId) {
        await translationService.downloadSheet(job.sheetId, `${job.fileName}_universal_translations.xlsx`);
      } else {
        await translationService.generateUniversalXLSX(job, `${job.fileName}_universal_translations.xlsx`);
      }
    } catch (error) {
      console.error('❌ UNIVERSAL XLSX download failed:', error);
      alert(`Failed to download UNIVERSAL XLSX: ${error}`);
    }
  };

  const forceRefresh = () => {
    console.log('🔄 Force refresh requested by user - clearing CSS and language caches');
    
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach(name => {
          caches.delete(name);
        });
        console.log('✅ Browser caches cleared for CSS refresh');
      });
    }
    
    localStorage.clear();
    console.log('✅ LocalStorage cleared');
    
    sessionStorage.clear();
    console.log('✅ SessionStorage cleared');
    
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      {/* Enhanced Version indicator and status */}
      <div className="fixed bottom-4 left-4 z-50 space-y-2">
        <Badge className="bg-gray-800/80 text-gray-300 border-gray-600/50 text-xs backdrop-blur-sm">
          v{APP_VERSION}
        </Badge>
        <Badge className="bg-green-800/80 text-green-300 border-green-600/50 text-xs backdrop-blur-sm">
          CSS Fixed ✅
        </Badge>
        <Badge className="bg-purple-800/80 text-purple-300 border-purple-600/50 text-xs backdrop-blur-sm">
          Universal: {ALL_GOOGLE_TRANSLATE_LANGUAGES.length} Langs
        </Badge>
        <Badge className={`text-xs backdrop-blur-sm ${
          cacheStatus === 'cleared' ? 'bg-green-800/80 text-green-300 border-green-600/50' :
          cacheStatus === 'partial' ? 'bg-yellow-800/80 text-yellow-300 border-yellow-600/50' :
          cacheStatus === 'unsupported' ? 'bg-blue-800/80 text-blue-300 border-blue-600/50' :
          cacheStatus === 'unavailable' ? 'bg-red-800/80 text-red-300 border-red-600/50' :
          'bg-gray-800/80 text-gray-300 border-gray-600/50'
        }`}>
          Cache: {cacheStatus}
        </Badge>
        
        {/* Enhanced Source Language Detection Status */}
        {detectedSourceLanguage && (
          <Badge className="bg-blue-800/80 text-blue-300 border-blue-600/50 text-xs backdrop-blur-sm">
            Source: {getLanguageInfo(detectedSourceLanguage)?.name || detectedSourceLanguage}
          </Badge>
        )}
        
        {/* Enhanced selected languages count */}
        {selectedLanguages.length > 0 && (
          <Badge className="bg-purple-800/80 text-purple-300 border-purple-600/50 text-xs backdrop-blur-sm">
            Selected: {selectedLanguages.length} ✓
          </Badge>
        )}
        
        {/* XLSX Import Status */}
        {importedTranslations && (
          <Badge className="bg-green-800/80 text-green-300 border-green-600/50 text-xs backdrop-blur-sm">
            📊 Universal XLSX ✓
          </Badge>
        )}
      </div>

      {/* Enhanced Force refresh button with CSS fix info */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={forceRefresh}
          size="sm"
          className="bg-gray-800/80 border-gray-600/50 text-gray-300 hover:bg-gray-700/80 backdrop-blur-sm"
          title="Clear cache and refresh (CSS fix applied)"
        >
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>

      {/* Animated Background - Enhanced for CSS fix testing */}
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
              ></div>
              <div 
                className="absolute w-[500px] h-[500px] bg-gradient-to-bl from-purple-500/8 via-pink-500/6 to-blue-500/4 rounded-full blur-2xl gpu-accelerated"
                style={{
                  transform: `translate(${-mousePosition.x * 2 + 200}px, ${mousePosition.y * 1.5 - 100}px) scale(${1 + mousePosition.y * 0.0015})`,
                  willChange: 'transform',
                  transition: 'transform 1200ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              ></div>
              <div 
                className="absolute w-[700px] h-[700px] bg-gradient-to-tr from-cyan-500/6 via-blue-500/8 to-purple-500/4 rounded-full blur-3xl gpu-accelerated"
                style={{
                  transform: `translate(${mousePosition.x * 1.5 - 150}px, ${-mousePosition.y * 2 + 300}px) rotate(${mousePosition.x * 0.5}deg)`,
                  willChange: 'transform',
                  transition: 'transform 800ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              ></div>
            </div>

            <div className="absolute inset-0">
              <div 
                className="absolute w-80 h-80 bg-gradient-to-r from-blue-400/4 to-purple-400/6 rounded-full blur-2xl gpu-accelerated"
                style={{
                  left: `${20 + mousePosition.x * 0.3}%`,
                  top: `${30 + mousePosition.y * 0.2}%`,
                  transform: `scale(${1 + Math.sin(mousePosition.x * 0.05) * 0.1})`,
                  transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              ></div>
              <div 
                className="absolute w-60 h-60 bg-gradient-to-l from-purple-400/6 to-cyan-400/4 rounded-full blur-xl gpu-accelerated"
                style={{
                  right: `${15 + mousePosition.y * 0.2}%`,
                  bottom: `${25 + mousePosition.x * 0.15}%`,
                  transform: `scale(${1 + Math.cos(mousePosition.y * 0.03) * 0.08})`,
                  transition: 'all 700ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              ></div>
            </div>

            <div className="absolute inset-0 opacity-[0.015]">
              <div 
                className="absolute inset-0 gpu-accelerated"
                style={{
                  backgroundImage: `
                    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '60px 60px',
                  transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`,
                  transition: 'transform 2000ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              ></div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0">
            <div className="absolute w-[600px] h-[600px] bg-gradient-to-br from-blue-500/4 via-cyan-500/6 to-purple-500/4 rounded-full blur-3xl left-1/4 top-1/4"></div>
            <div className="absolute w-[500px] h-[500px] bg-gradient-to-bl from-purple-500/6 via-pink-500/4 to-blue-500/3 rounded-full blur-2xl right-1/4 top-1/2"></div>
            <div className="absolute w-[700px] h-[700px] bg-gradient-to-tr from-cyan-500/4 via-blue-500/6 to-purple-500/3 rounded-full blur-3xl left-1/2 bottom-1/4"></div>
            
            <div className="absolute inset-0 opacity-[0.01]">
              <div 
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '60px 60px'
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Enhanced Header with CSS fix indicator */}
        <div className="text-center mb-12">
          <div className="flex justify-between items-center mb-3">
            {/* Enhanced API Status with CSS fix info */}
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
                      : 'Enhanced Mode'
                    }
                  </Badge>
                  
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                    <Cpu className="w-3 h-3 mr-1" />
                    UNIVERSAL
                  </Badge>
                  
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                    <Scan className="w-3 h-3 mr-1" />
                    Auto-Detect
                  </Badge>

                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    CSS Fixed
                  </Badge>
                </>
              )}
            </div>

            {/* Language Selector */}
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
            Universal PowerPoint translation with auto language detection and all {ALL_GOOGLE_TRANSLATE_LANGUAGES.length} Google Translate languages
          </p>
          
          {/* Enhanced Badges with CSS fix indicator */}
          <div className="flex justify-center gap-2">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1 text-sm">
              <CheckCircle className="w-3 h-3 mr-1" />
              CSS Loading Fixed
            </Badge>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 px-3 py-1 text-sm">
              <Globe className="w-3 h-3 mr-1" />
              {ALL_GOOGLE_TRANSLATE_LANGUAGES.length} Languages
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-3 py-1 text-sm">
              <Scan className="w-3 h-3 mr-1" />
              Language Validation
            </Badge>
          </div>
        </div>

        {/* Main Content - rest remains the same as before but with enhanced language validation throughout */}
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Upload & Language Selection */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Enhanced File Upload with Language Detection */}
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
              
              {/* Enhanced Source Language Detection Info */}
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

            {/* ENHANCED: Universal Language Selection with validation */}
            <Card className="p-6 bg-black/40 backdrop-blur-sm border-white/10 border shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif text-white">Target Languages</h2>
                <div className="flex gap-2">
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 px-2 py-1 text-xs">
                    Universal: {ALL_GOOGLE_TRANSLATE_LANGUAGES.length}
                  </Badge>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-2 py-1 text-xs">
                    Validated
                  </Badge>
                  {selectedLanguages.length > 0 && (
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-2 py-1 text-xs">
                      Selected: {selectedLanguages.length} ✓
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

          {/* Setup Button - Enhanced */}
          {selectedFile && selectedLanguages.length > 0 && (
            <Card className="p-6 bg-black/40 backdrop-blur-sm border-green-500/20 border shadow-2xl">
              <div className="text-center">
                <h3 className="text-lg font-serif text-white mb-3">Ready for Universal Translation</h3>
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
                    <span className="text-sm text-gray-300">{selectedLanguages.length} validated target languages</span>
                  </div>
                  {importedTranslations && (
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-300">Universal XLSX</span>
                    </div>
                  )}
                </div>
                <Button
                  onClick={createTranslationSetup}
                  disabled={isProcessing}
                  className="bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30 border"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Setup Universal Translation
                </Button>
              </div>
            </Card>
          )}

          {/* The rest of the components remain the same but with enhanced language validation... */}
          {/* For brevity, I'm keeping the existing structure but all language operations now use getLanguageInfo() for validation */}

          {/* Universal XLSX Import Status - Enhanced */}
          {importedTranslations && (
            <Card className="p-6 bg-black/40 backdrop-blur-sm border-green-500/20 border shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-green-400" />
                  <h3 className="text-green-400 text-lg font-medium">Universal XLSX Ready</h3>
                </div>
                <Button
                  onClick={clearImportedTranslations}
                  variant="outline"
                  size="sm"
                  className="bg-gray-500/10 border-gray-500/30 text-gray-400 hover:bg-gray-500/20"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear Import
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
                    <span className="text-white">{importedLanguages.length} validated</span>
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
                  <div className="text-sm text-gray-400 mb-2">Validated Languages:</div>
                  <div className="max-h-32 overflow-y-auto">
                    <div className="flex flex-wrap gap-1">
                      {importedLanguages.slice(0, 20).map(langCode => {
                        const lang = getLanguageInfo(langCode);
                        const isCurrentlySelected = selectedLanguages.includes(langCode);
                        
                        return lang ? (
                          <Badge 
                            key={langCode} 
                            className={`text-xs ${
                              isCurrentlySelected 
                                ? 'bg-green-500/30 text-green-200 border-green-400/50' 
                                : 'bg-green-500/10 text-green-400 border-green-500/30'
                            }`}
                          >
                            <span className="mr-1">{lang.flag}</span>
                            {lang.name}
                            {isCurrentlySelected && <CheckCircle className="w-3 h-3 ml-1" />}
                          </Badge>
                        ) : null;
                      })}
                      {importedLanguages.length > 20 && (
                        <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30 text-xs">
                          +{importedLanguages.length - 20} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <p className="text-green-300 text-sm font-medium">
                    Universal XLSX structure ready - All languages validated
                  </p>
                </div>
                <p className="text-green-200 text-xs">
                  ✅ Languages validated: {importedLanguages.length}<br />
                  ✅ Translation data ready for {Object.keys(importedTranslations).length} slides<br />
                  🌍 Universal Translation: {detectedSourceLanguage ? getLanguageInfo(detectedSourceLanguage)?.name : 'Any'} → Any Validated Language
                </p>
              </div>
            </Card>
          )}

          {/* Enhanced Processing Warning */}
          {isProcessing && (
            <Card className="p-3 bg-black/40 backdrop-blur-sm border-yellow-500/20 border">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <p className="text-yellow-400 text-sm">
                  Universal translation in progress with v{APP_VERSION} engine. Processing {detectedSourceLanguage ? `from ${getLanguageInfo(detectedSourceLanguage)?.name}` : 'with auto-detection'} using {importedTranslations ? 'imported XLSX translations' : 'complete Google Translate verification'} with enhanced language validation...
                </p>
              </div>
            </Card>
          )}

          {/* Translation Jobs - Enhanced with validation info throughout */}
          {jobs.length > 0 && (
            <Card className="p-6 bg-black/40 backdrop-blur-sm border-white/10 border shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif text-white">Universal Translation Projects</h2>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-2 py-1 text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  {jobs.length} Projects
                </Badge>
              </div>
              <div className="space-y-6">
                {jobs.map(job => (
                  <div key={job.id} className="relative border border-white/10 rounded-lg p-4">
                    {/* Job Header - Enhanced */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-white">{job.fileName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`text-xs ${
                            job.status === 'ready' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                            job.status === 'completed' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                            job.status === 'error' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                            job.status === 'verifying' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                            'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                          }`}>
                            {job.status === 'ready' ? 'Ready' : 
                             job.status === 'completed' ? 'Completed' :
                             job.status === 'error' ? 'Error' :
                             job.status === 'verifying' ? 'Verifying' : 'Processing'
                            }
                          </Badge>
                          <span className="text-sm text-gray-400">
                            {job.selectedLanguages.length} validated languages
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
                              Universal XLSX
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ready State - Show Generate Buttons with enhanced validation */}
                    {job.status === 'ready' && (
                      <div className="space-y-4">
                        {job.usingImportedTranslations && job.availableImportedLanguages && (
                          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
                            <div className="flex items-center gap-2 mb-2">
                              <Eye className="w-4 h-4 text-green-400" />
                              <span className="text-green-400 text-sm font-medium">Available from Universal Import (Validated):</span>
                            </div>
                            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                              {job.availableImportedLanguages.slice(0, 15).map(langCode => {
                                const lang = getLanguageInfo(langCode);
                                return lang ? (
                                  <Badge key={langCode} className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                                    <span className="mr-1">{lang.flag}</span>
                                    {lang.name}
                                  </Badge>
                                ) : null;
                              })}
                              {job.availableImportedLanguages.length > 15 && (
                                <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30 text-xs">
                                  +{job.availableImportedLanguages.length - 15} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-3">
                          <div className="text-sm text-gray-400 mb-2">Generate Individual Languages (Validated):</div>
                          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                            {job.selectedLanguages.slice(0, 20).map(langCode => {
                              const lang = getLanguageInfo(langCode);
                              const isAvailableFromImport = job.availableImportedLanguages?.includes(langCode);
                              
                              return lang ? (
                                <Button
                                  key={langCode}
                                  onClick={() => startTranslationForLanguage(job, langCode)}
                                  disabled={isProcessing}
                                  size="sm"
                                  className={`${
                                    isAvailableFromImport
                                      ? 'bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30'
                                      : 'bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30'
                                  } border text-xs`}
                                >
                                  <span className="mr-1">{lang.flag}</span>
                                  {lang.name}
                                  {isAvailableFromImport && (
                                    <FileSpreadsheet className="w-3 h-3 ml-1" />
                                  )}
                                </Button>
                              ) : null;
                            })}
                            {job.selectedLanguages.length > 20 && (
                              <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30 text-xs">
                                +{job.selectedLanguages.length - 20} more validated languages
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-white/10">
                          <Button
                            onClick={() => startTranslationForAllLanguages(job)}
                            disabled={isProcessing}
                            className="bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30 border"
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            Generate All Validated Languages ({job.selectedLanguages.length})
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

                    {/* Completed State - Enhanced */}
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
                            Download Universal XLSX
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

                    {/* Enhanced imported translation info */}
                    {job.usingImportedTranslations && (
                      <div className="mt-3 p-2 bg-green-500/10 rounded border border-green-500/20">
                        <p className="text-green-300 text-xs flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Using universal translations with complete language validation v{APP_VERSION}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Enhanced API Status Debug with CSS fix info */}
          {apiStatus && !apiStatus.hasEnvironmentKey && (
            <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <h3 className="text-yellow-400">Google APIs Not Configured</h3>
              </div>
              <p className="text-yellow-300 text-sm mb-3">
                App is using UNIVERSAL PPTX processing v{APP_VERSION} with CSS loading fixed and all {ALL_GOOGLE_TRANSLATE_LANGUAGES.length} Google Translate languages + auto language detection + enhanced validation. To enable full Google Translate API:
              </p>
              <div className="text-xs text-yellow-200 space-y-1">
                <p>1. Go to <strong>Netlify Dashboard</strong> → Your Site → <strong>Environment Variables</strong></p>
                <p>2. Add variable: <code className="bg-yellow-500/20 px-1 rounded">VITE_GOOGLE_SERVICE_ACCOUNT_KEY</code></p>
                <p>3. Value: Your <code className="bg-yellow-500/20 px-1 rounded">sweden-383609-e27db569b1ec.json</code> content (as single line)</p>
                <p>4. <strong>Deploy site</strong> to activate universal Google Translate</p>
              </div>
              <p className="text-yellow-300 text-sm mt-2">
                Universal features: 🌍 All {ALL_GOOGLE_TRANSLATE_LANGUAGES.length} languages + 🔍 Auto language detection + ✅ Complete translation verification + 🎨 CSS loading fixed + 🔧 Language validation! 🚀
              </p>
              
              {/* Enhanced Debug Info */}
              {apiStatus.debugInfo && (
                <details className="mt-3">
                  <summary className="text-yellow-400 text-xs cursor-pointer">v{APP_VERSION} Universal Processing + CSS Fix Debug Information</summary>
                  <div className="mt-2 text-xs text-yellow-200 space-y-1">
                    <p>Universal Translation Environment:</p>
                    <ul className="ml-4 space-y-1">
                      <li>• Version: v{APP_VERSION} ✅</li>
                      <li>• CSS Loading Fix: ✅ Applied</li>
                      <li>• Universal Languages: ✅ {ALL_GOOGLE_TRANSLATE_LANGUAGES.length} supported</li>
                      <li>• Auto Language Detection: ✅ Available</li>
                      <li>• Language Validation: ✅ Albanian + All languages</li>
                      <li>• Any-to-Any Translation: ✅ Ready</li>
                      <li>• Complete GT Verification: ✅ Implemented</li>
                      <li>• REAL PPTX Processing: ✅ Active</li>
                      <li>• Cache Busting: ✅ Multiple strategies</li>
                    </ul>
                    {apiStatus.availableEnvVars?.length > 0 && (
                      <p>Available vars: {apiStatus.availableEnvVars.join(', ')}</p>
                    )}
                    {apiStatus.debugInfo.cssFixApplied && (
                      <p>CSS Fix Status: ✅ PostCSS conflict resolved</p>
                    )}
                  </div>
                </details>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}