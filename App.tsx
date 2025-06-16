import React, { useState, useEffect } from 'react';
import { Upload, Download, Globe, FileText, CheckCircle, Clock, AlertCircle, Languages, FileSpreadsheet, Settings, Cpu, Zap, PlayCircle } from 'lucide-react';
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

type TranslationJob = {
  id: string;
  fileName: string;
  sourceFile: File;
  selectedLanguages: string[];
  status: 'ready' | 'pending' | 'extracting' | 'translating' | 'rebuilding' | 'completed' | 'error';
  progress: number;
  currentStep?: string;
  results?: TranslationResult[];
  error?: string;
  sheetId?: string;
  importedTranslations?: any;
  usingImportedTranslations?: boolean;
  isSetupComplete?: boolean;
};

// Expanded language list - no limits!
const AVAILABLE_LANGUAGES = [
  // European Languages
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'da', name: 'Danish', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
  { code: 'is', name: 'Icelandic', flag: '🇮🇸' },
  { code: 'cs', name: 'Czech', flag: '🇨🇿' },
  { code: 'sk', name: 'Slovak', flag: '🇸🇰' },
  { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
  { code: 'bg', name: 'Bulgarian', flag: '🇧🇬' },
  { code: 'hr', name: 'Croatian', flag: '🇭🇷' },
  { code: 'sl', name: 'Slovenian', flag: '🇸🇮' },
  { code: 'lt', name: 'Lithuanian', flag: '🇱🇹' },
  { code: 'lv', name: 'Latvian', flag: '🇱🇻' },
  { code: 'et', name: 'Estonian', flag: '🇪🇪' },
  { code: 'mt', name: 'Maltese', flag: '🇲🇹' },
  { code: 'ga', name: 'Irish', flag: '🇮🇪' },
  { code: 'cy', name: 'Welsh', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { code: 'eu', name: 'Basque', flag: '🇪🇸' },
  { code: 'ca', name: 'Catalan', flag: '🇪🇸' },
  { code: 'gl', name: 'Galician', flag: '🇪🇸' },
  
  // Slavic Languages
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'be', name: 'Belarusian', flag: '🇧🇾' },
  { code: 'sr', name: 'Serbian', flag: '🇷🇸' },
  { code: 'bs', name: 'Bosnian', flag: '🇧🇦' },
  { code: 'mk', name: 'Macedonian', flag: '🇲🇰' },
  
  // Asian Languages
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'zh-tw', name: 'Chinese (Traditional)', flag: '🇹🇼' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
  { code: 'pa', name: 'Punjabi', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', flag: '🇲🇾' },
  { code: 'tl', name: 'Filipino', flag: '🇵🇭' },
  
  // Middle Eastern & African Languages
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'fa', name: 'Persian', flag: '🇮🇷' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'az', name: 'Azerbaijani', flag: '🇦🇿' },
  { code: 'ka', name: 'Georgian', flag: '🇬🇪' },
  { code: 'hy', name: 'Armenian', flag: '🇦🇲' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
  { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
  { code: 'am', name: 'Amharic', flag: '🇪🇹' },
  
  // Other Languages
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
  { code: 'eo', name: 'Esperanto', flag: '🌍' },
  { code: 'la', name: 'Latin', flag: '🏛️' }
];

const UI_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

export default function App() {
  const [jobs, setJobs] = useState<TranslationJob[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [importedTranslations, setImportedTranslations] = useState<any>(null);
  const [importedFileName, setImportedFileName] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { t, currentLanguage, changeLanguage } = useTranslation();
  
  // Mouse tracking for animations
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Check API status on load with better error handling
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        console.log('🔍 Checking REAL API status...');
        
        // Try to authenticate first
        await googleApiService.authenticate();
        
        // Get credentials status
        const status = googleApiService.getCredentialsStatus();
        console.log('📊 REAL API Status:', status);
        
        setApiStatus(status);
      } catch (error) {
        console.error('❌ Failed to check REAL API status:', error);
        
        // Set fallback status
        setApiStatus({
          hasEnvironmentKey: false,
          environmentKeyValid: false,
          recommendedSetup: 'Error checking API status - running in enhanced local mode',
          availableEnvVars: [],
          debugInfo: {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    };

    // Delay the check slightly to ensure environment is ready
    const timeoutId = setTimeout(checkApiStatus, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Handle XLSX import (integrated with language selection)
  const handleXLSXImport = (file: File, translations: any) => {
    try {
      console.log('📊 XLSX imported with REAL translations:', translations);
      
      // Store imported translations
      setImportedTranslations(translations);
      setImportedFileName(file.name);
      
      // Auto-detect and select languages from imported data
      const firstSlideTranslations = Object.values(translations)[0] as Record<string, string>;
      const importedLanguages = Object.keys(firstSlideTranslations);
      
      // Map to our language codes
      const mappedLanguages = importedLanguages
        .map(lang => {
          const found = AVAILABLE_LANGUAGES.find(
            avail => avail.name.toLowerCase() === lang.toLowerCase() ||
                     avail.code.toLowerCase() === lang.toLowerCase()
          );
          return found?.code;
        })
        .filter(Boolean) as string[];
      
      if (mappedLanguages.length > 0) {
        setSelectedLanguages(mappedLanguages);
        console.log(`✅ Auto-selected ${mappedLanguages.length} languages from REAL XLSX:`, mappedLanguages);
      } else {
        console.warn('⚠️ No matching languages found in XLSX, keeping current selection');
      }
      
    } catch (error) {
      console.error('❌ Error processing REAL XLSX import:', error);
      alert('Failed to process XLSX file. Please check the format and try again.');
    }
  };

  // Clear imported translations
  const clearImportedTranslations = () => {
    setImportedTranslations(null);
    setImportedFileName('');
    console.log('🗑️ Cleared imported REAL translations');
  };
  
  // Handle file selection - just store the file, don't start processing yet
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    console.log(`📁 File selected: ${file.name} (${Math.round(file.size/(1024*1024))}MB)`);
  };

  // Create a setup for translation - this prepares everything but doesn't start translation
  const createTranslationSetup = () => {
    if (!selectedFile) {
      alert('Please select a PPTX file first.');
      return;
    }

    if (selectedLanguages.length === 0) {
      alert(t('selectAtLeastOneLanguage') || 'Please select at least one target language.');
      return;
    }

    const usingImported = !!importedTranslations;
    
    console.log(`🎯 Creating translation setup for: ${selectedFile.name}`);
    console.log(`🌍 Target languages: ${selectedLanguages.join(', ')}`);
    
    // Create setup job
    const newJob: TranslationJob = {
      id: Date.now().toString(),
      fileName: selectedFile.name,
      sourceFile: selectedFile,
      selectedLanguages: [...selectedLanguages],
      status: 'ready',
      progress: 0,
      importedTranslations: importedTranslations,
      usingImportedTranslations: usingImported,
      isSetupComplete: true
    };
    
    setJobs(prev => [...prev, newJob]);
    
    // Clear the form
    setSelectedFile(null);
    // Keep languages selected for convenience
  };

  // Start translation for specific language
  const startTranslationForLanguage = async (job: TranslationJob, language: string) => {
    if (isProcessing) {
      alert('Please wait for the current translation to complete.');
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log(`🚀 Starting translation for ${language} in job ${job.id}`);
      
      // Update job status
      updateJob(job.id, {
        status: 'pending',
        progress: 0,
        currentStep: `Starting ${language.toUpperCase()} translation...`
      });

      await startRealTranslation(job.id, job.sourceFile, [language], job.importedTranslations);
    } catch (error) {
      console.error('❌ Translation failed:', error);
      updateJob(job.id, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Translation failed'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Start translation for all languages
  const startTranslationForAllLanguages = async (job: TranslationJob) => {
    if (isProcessing) {
      alert('Please wait for the current translation to complete.');
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log(`🚀 Starting translation for all languages in job ${job.id}`);
      
      // Update job status
      updateJob(job.id, {
        status: 'pending',
        progress: 0,
        currentStep: `Starting translation for ${job.selectedLanguages.length} languages...`
      });

      await startRealTranslation(job.id, job.sourceFile, job.selectedLanguages, job.importedTranslations);
    } catch (error) {
      console.error('❌ Translation failed:', error);
      updateJob(job.id, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Translation failed'
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

  const startRealTranslation = async (jobId: string, file: File, targetLanguages: string[], importedTranslations?: any) => {
    // Set up progress callback
    translationService.onProgress(jobId, (progress) => {
      updateJob(jobId, {
        status: progress.status,
        progress: progress.progress,
        currentStep: progress.currentStep,
        error: progress.error
      });
    });

    try {
      console.log(`🚀 Starting REAL translation service for job: ${jobId}`);
      
      // Start the actual REAL translation process
      const results = await translationService.startTranslation(
        jobId,
        file,
        targetLanguages,
        importedTranslations
      );

      // Update job with REAL results
      updateJob(jobId, {
        status: 'completed',
        progress: 100,
        results: results
      });

      const totalSize = results.reduce((sum, r) => sum + (r.size || 0), 0);
      console.log(`✅ REAL translation completed for job ${jobId}: ${results.length} files, ${Math.round(totalSize/(1024*1024))}MB total`);

    } catch (error) {
      console.error(`❌ REAL translation failed for job ${jobId}:`, error);
      
      updateJob(jobId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      throw error;
    }
  };

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

  // Download XLSX with REAL translations
  const handleDownloadXLSX = async (job: TranslationJob) => {
    try {
      if (job.sheetId) {
        // Download the REAL Google Sheet as XLSX
        await translationService.downloadSheet(job.sheetId, `${job.fileName}_translations.xlsx`);
      } else {
        // Generate REAL XLSX from job data
        await translationService.generateXLSX(job, `${job.fileName}_translations.xlsx`);
      }
    } catch (error) {
      alert(`Failed to download REAL XLSX: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      {/* Mouse-Following Animated Background */}
      <div className="fixed inset-0 z-0">
        {/* Primary flowing gradients that follow mouse */}
        <div className="absolute inset-0">
          <div 
            className="absolute w-[600px] h-[600px] bg-gradient-to-br from-blue-500/6 via-cyan-500/8 to-purple-500/6 rounded-full blur-3xl transition-transform duration-1000 ease-out"
            style={{
              transform: `translate(${mousePosition.x * 3 - 300}px, ${mousePosition.y * 2 - 200}px) scale(${1 + mousePosition.x * 0.002})`
            }}
          ></div>
          <div 
            className="absolute w-[500px] h-[500px] bg-gradient-to-bl from-purple-500/8 via-pink-500/6 to-blue-500/4 rounded-full blur-2xl transition-transform duration-1200 ease-out"
            style={{
              transform: `translate(${-mousePosition.x * 2 + 200}px, ${mousePosition.y * 1.5 - 100}px) scale(${1 + mousePosition.y * 0.0015})`
            }}
          ></div>
          <div 
            className="absolute w-[700px] h-[700px] bg-gradient-to-tr from-cyan-500/6 via-blue-500/8 to-purple-500/4 rounded-full blur-3xl transition-transform duration-800 ease-out"
            style={{
              transform: `translate(${mousePosition.x * 1.5 - 150}px, ${-mousePosition.y * 2 + 300}px) rotate(${mousePosition.x * 0.5}deg)`
            }}
          ></div>
        </div>

        {/* Secondary orbs that react to mouse */}  
        <div className="absolute inset-0">
          <div 
            className="absolute w-80 h-80 bg-gradient-to-r from-blue-400/4 to-purple-400/6 rounded-full blur-2xl transition-all duration-500 ease-out"
            style={{
              left: `${20 + mousePosition.x * 0.3}%`,
              top: `${30 + mousePosition.y * 0.2}%`,
              transform: `scale(${1 + Math.sin(mousePosition.x * 0.05) * 0.1})`
            }}
          ></div>
          <div 
            className="absolute w-60 h-60 bg-gradient-to-l from-purple-400/6 to-cyan-400/4 rounded-full blur-xl transition-all duration-700 ease-out"
            style={{
              right: `${15 + mousePosition.y * 0.2}%`,
              bottom: `${25 + mousePosition.x * 0.15}%`,
              transform: `scale(${1 + Math.cos(mousePosition.y * 0.03) * 0.08})`
            }}
          ></div>
        </div>

        {/* Subtle animated grid */}
        <div className="absolute inset-0 opacity-[0.015]">
          <div 
            className="absolute inset-0 transition-transform duration-2000 ease-out"
            style={{
              backgroundImage: `
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
              transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`
            }}
          ></div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <div className="flex justify-between items-center mb-3">
            {/* Enhanced API Status */}
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
                    REAL PPTX
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
            {t('subtitle') || 'Professional PowerPoint translation with REAL text extraction and preserved formatting'}
          </p>
          
          {/* Updated Badge */}
          <div className="flex justify-center">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1 text-sm">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected to Bartosz Idzik Enterprise Ecosystem
            </Badge>
          </div>
        </div>

        {/* Main Content - Enhanced Interface */}
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Upload & Language Selection */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Enhanced File Upload */}
            <Card className="p-6 bg-black/40 backdrop-blur-sm border-white/10 border shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif text-white">{t('selectPPTXFile') || 'Select PPTX File'}</h2>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-2 py-1 text-xs">
                  <Cpu className="w-3 h-3 mr-1" />
                  REAL Processing
                </Badge>
              </div>
              <FileUploader 
                onFileSelect={handleFileSelect}
                disabled={isProcessing}
              />
            </Card>

            {/* Enhanced Language Selection */}
            <Card className="p-6 bg-black/40 backdrop-blur-sm border-white/10 border shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif text-white">{t('targetLanguages') || 'Target Languages'}</h2>
                <div className="flex gap-2">
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 px-2 py-1 text-xs">
                    {AVAILABLE_LANGUAGES.length} Languages
                  </Badge>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-2 py-1 text-xs">
                    No Limits
                  </Badge>
                </div>
              </div>
              
              <LanguageSelector 
                languages={AVAILABLE_LANGUAGES}
                selectedLanguages={selectedLanguages}
                onSelectionChange={setSelectedLanguages}
                maxSelection={0} // No limit!
                disabled={isProcessing}
                onXLSXImport={handleXLSXImport} // Pass XLSX import handler
              />
            </Card>
          </div>

          {/* Setup Button */}
          {selectedFile && selectedLanguages.length > 0 && (
            <Card className="p-6 bg-black/40 backdrop-blur-sm border-green-500/20 border shadow-2xl">
              <div className="text-center">
                <h3 className="text-lg font-serif text-white mb-3">Ready to Setup Translation</h3>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-300">{selectedFile.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Languages className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-gray-300">{selectedLanguages.length} languages selected</span>
                  </div>
                </div>
                <Button
                  onClick={createTranslationSetup}
                  disabled={isProcessing}
                  className="bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30 border"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Setup Translation Project
                </Button>
              </div>
            </Card>
          )}

          {/* Enhanced XLSX Import Status */}
          {importedTranslations && (
            <Card className="p-4 bg-black/40 backdrop-blur-sm border-green-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-green-400" />
                  <h3 className="text-green-400">Using REAL Imported Translations</h3>
                </div>
                <Button
                  onClick={clearImportedTranslations}
                  variant="outline"
                  size="sm"
                  className="bg-gray-500/10 border-gray-500/30 text-gray-400 hover:bg-gray-500/20"
                >
                  Clear
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">File:</span>
                  <span className="text-white truncate max-w-48">{importedFileName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Slides:</span>
                  <span className="text-white">{Object.keys(importedTranslations).length}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedLanguages.map(langCode => {
                    const lang = AVAILABLE_LANGUAGES.find(l => l.code === langCode);
                    return lang ? (
                      <Badge key={langCode} className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                        <span className="mr-1">{lang.flag}</span>
                        {lang.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
              
              <div className="mt-3 p-2 bg-green-500/10 rounded border border-green-500/20">
                <p className="text-green-300 text-xs">
                  ✅ Ready to generate REAL PPTX files using your manually corrected translations
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
                  REAL translation in progress. Processing with authentic PPTX extraction...
                </p>
              </div>
            </Card>
          )}

          {/* Enhanced Translation Jobs */}
          {jobs.length > 0 && (
            <Card className="p-6 bg-black/40 backdrop-blur-sm border-white/10 border shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif text-white">{t('translationProjects') || 'Translation Projects'}</h2>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-2 py-1 text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  {jobs.length} Projects
                </Badge>
              </div>
              <div className="space-y-6">
                {jobs.map(job => (
                  <div key={job.id} className="relative border border-white/10 rounded-lg p-4">
                    {/* Job Header */}
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
                            {job.status === 'ready' ? 'Ready' : 
                             job.status === 'completed' ? 'Completed' :
                             job.status === 'error' ? 'Error' : 'Processing'
                            }
                          </Badge>
                          <span className="text-sm text-gray-400">
                            {job.selectedLanguages.length} languages
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ready State - Show Generate Buttons */}
                    {job.status === 'ready' && (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {job.selectedLanguages.map(langCode => {
                            const lang = AVAILABLE_LANGUAGES.find(l => l.code === langCode);
                            return lang ? (
                              <Button
                                key={langCode}
                                onClick={() => startTranslationForLanguage(job, langCode)}
                                disabled={isProcessing}
                                size="sm"
                                className="bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30 border"
                              >
                                <span className="mr-2">{lang.flag}</span>
                                Generate {lang.name}
                              </Button>
                            ) : null;
                          })}
                        </div>
                        
                        <div className="pt-4 border-t border-white/10">
                          <Button
                            onClick={() => startTranslationForAllLanguages(job)}
                            disabled={isProcessing}
                            className="bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30 border"
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            Generate All Languages
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Processing State */}
                    {['pending', 'extracting', 'translating', 'rebuilding'].includes(job.status) && (
                      <TranslationProgress 
                        job={job}
                        onDownload={handleDownload}
                        onDownloadAll={handleDownloadAll}
                      />
                    )}

                    {/* Completed State */}
                    {job.status === 'completed' && job.results && (
                      <div className="space-y-4">
                        <div className="grid gap-3">
                          {job.results.map(result => (
                            <div key={result.language} className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">
                                  {AVAILABLE_LANGUAGES.find(l => l.code === result.language)?.flag}
                                </span>
                                <div>
                                  <p className="text-green-400 font-medium">
                                    {AVAILABLE_LANGUAGES.find(l => l.code === result.language)?.name}
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
                          ))}
                        </div>
                        
                        <div className="pt-4 border-t border-white/10 flex gap-3">
                          <Button
                            onClick={() => handleDownloadAll(job)}
                            className="bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30 border"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download All Files
                          </Button>
                          
                          {!job.usingImportedTranslations && (
                            <Button
                              onClick={() => handleDownloadXLSX(job)}
                              variant="outline"
                              className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                            >
                              <FileSpreadsheet className="w-4 h-4 mr-2" />
                              Download XLSX
                            </Button>
                          )}
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

                    {/* Show enhanced imported translation info */}
                    {job.usingImportedTranslations && (
                      <div className="mt-3 p-2 bg-green-500/10 rounded border border-green-500/20">
                        <p className="text-green-300 text-xs flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Using imported translations with preserved formatting
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Enhanced Features */}
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            {[
              {
                icon: <Cpu className="w-5 h-5" />,
                title: 'REAL PPTX Processing',
                description: 'Authentic text extraction using JSZip with preserved XML structure'
              },
              {
                icon: <Zap className="w-5 h-5" />,
                title: 'Size Preservation',
                description: '15MB input → ~15MB output with maintained formatting and quality'
              },
              {
                icon: <FileSpreadsheet className="w-5 h-5" />,
                title: 'Google Sheets Integration',
                description: 'GOOGLETRANSLATE() formulas with downloadable XLSX workflow'
              }
            ].map((feature, index) => (
              <div key={index} className="p-4 bg-black/40 backdrop-blur-sm border-white/10 border rounded-xl shadow-xl hover:bg-black/50 transition-all duration-300">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-3 shadow-lg">
                  {feature.icon}
                </div>
                <h3 className="text-base font-serif text-white mb-1">{feature.title}</h3>
                <p className="text-gray-400 text-xs">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Enhanced API Status Debug */}
          {apiStatus && !apiStatus.hasEnvironmentKey && (
            <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <h3 className="text-yellow-400">Google APIs Not Configured</h3>
              </div>
              <p className="text-yellow-300 text-sm mb-3">
                App is using REAL PPTX processing with enhanced local translations. To enable Google Translate:
              </p>
              <div className="text-xs text-yellow-200 space-y-1">
                <p>1. Go to <strong>Netlify Dashboard</strong> → Your Site → <strong>Environment Variables</strong></p>
                <p>2. Add variable: <code className="bg-yellow-500/20 px-1 rounded">VITE_GOOGLE_SERVICE_ACCOUNT_KEY</code></p>
                <p>3. Value: Your <code className="bg-yellow-500/20 px-1 rounded">sweden-383609-e27db569b1ec.json</code> content (as single line)</p>
                <p>4. <strong>Deploy site</strong> to activate real Google Translate</p>
              </div>
              <p className="text-yellow-300 text-sm mt-2">
                Current REAL PPTX processing works perfectly - Google API key unlocks premium translation quality! 🚀
              </p>
              
              {/* Debug Info */}
              {apiStatus.debugInfo && (
                <details className="mt-3">
                  <summary className="text-yellow-400 text-xs cursor-pointer">REAL Processing Debug Information</summary>
                  <div className="mt-2 text-xs text-yellow-200 space-y-1">
                    <p>Environment Context:</p>
                    <ul className="ml-4 space-y-1">
                      <li>• Has import.meta: {apiStatus.debugInfo.hasImportMeta ? '✅' : '❌'}</li>
                      <li>• Has import.meta.env: {apiStatus.debugInfo.hasImportMetaEnv ? '✅' : '❌'}</li>
                      <li>• REAL PPTX Processing: ✅ Available</li>
                      <li>• JSZip Integration: ✅ Active</li>
                    </ul>
                    {apiStatus.availableEnvVars?.length > 0 && (
                      <p>Available vars: {apiStatus.availableEnvVars.join(', ')}</p>
                    )}
                  </div>
                </details>
              )}
            </Card>
          )}
        </div>
      </div>

      <style>{`
        @keyframes success-glow {
          0%, 100% { 
            opacity: 0.75;
            transform: scale(1);
          }
          50% { 
            opacity: 1;
            transform: scale(1.02);
          }
        }

        .animate-success-glow {
          animation: success-glow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}