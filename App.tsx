import React, { useState, useEffect } from 'react';
import { Upload, Download, Globe, FileText, CheckCircle, Clock, AlertCircle, Languages, FileSpreadsheet } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Progress } from './components/ui/progress';
import { Badge } from './components/ui/badge';
import { Checkbox } from './components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import FileUploader from './components/FileUploader';
import LanguageSelector from './components/LanguageSelector';
import TranslationProgress from './components/TranslationProgress';
import ResultsSection from './components/ResultsSection';
import { useTranslation } from './hooks/useTranslation';
import { translationService, TranslationResult } from './services/translationService';

type TranslationJob = {
  id: string;
  fileName: string;
  sourceFile: File;
  selectedLanguages: string[];
  status: 'pending' | 'extracting' | 'translating' | 'rebuilding' | 'completed' | 'error';
  progress: number;
  currentStep?: string;
  results?: TranslationResult[];
  error?: string;
  sheetId?: string; // Add sheet ID for XLSX download
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
  
  const addTranslationJob = async (file: File) => {
    // Check if languages are selected
    if (selectedLanguages.length === 0) {
      alert(t('selectAtLeastOneLanguage'));
      return;
    }

    // Check if already processing
    if (isProcessing) {
      alert('Please wait for the current translation to complete before starting a new one.');
      return;
    }

    console.log(`🎯 Starting new translation job for: ${file.name} (${file.size} bytes)`);
    console.log(`🌍 Target languages: ${selectedLanguages.join(', ')}`);
    
    // Create job (no more language limit!)
    const newJob: TranslationJob = {
      id: Date.now().toString(),
      fileName: file.name,
      sourceFile: file,
      selectedLanguages: [...selectedLanguages],
      status: 'pending',
      progress: 0,
    };
    
    setJobs(prev => [...prev, newJob]);
    setIsProcessing(true);
    
    try {
      await startRealTranslation(newJob.id, file, selectedLanguages);
    } catch (error) {
      console.error('❌ Translation job failed:', error);
      updateJob(newJob.id, {
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

  const startRealTranslation = async (jobId: string, file: File, targetLanguages: string[]) => {
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
      console.log(`🚀 Starting translation service for job: ${jobId}`);
      
      // Start the actual translation process
      const results = await translationService.startTranslation(
        jobId,
        file,
        targetLanguages
      );

      // Update job with results
      updateJob(jobId, {
        status: 'completed',
        progress: 100,
        results: results
      });

      console.log(`✅ Translation completed for job ${jobId}:`, results);

    } catch (error) {
      console.error(`❌ Translation failed for job ${jobId}:`, error);
      
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

  // New function to download XLSX with translations
  const handleDownloadXLSX = async (job: TranslationJob) => {
    try {
      if (job.sheetId) {
        // Download the Google Sheet as XLSX
        await translationService.downloadSheet(job.sheetId, `${job.fileName}_translations.xlsx`);
      } else {
        // Generate XLSX from job data
        await translationService.generateXLSX(job, `${job.fileName}_translations.xlsx`);
      }
    } catch (error) {
      alert(`Failed to download XLSX: ${error}`);
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
        {/* Compact Header */}
        <div className="text-center mb-12">
          <div className="flex justify-end mb-3">
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
          </div>
          <p className="text-gray-400 text-base max-w-xl mx-auto mb-3">
            {t('subtitle')}
          </p>
          
          {/* Updated Badge */}
          <div className="flex justify-center">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1 text-sm">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected to Bartosz Idzik Enterprise Ecosystem
            </Badge>
          </div>
        </div>

        {/* Compact Main Content */}
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Upload & Language Selection */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6 bg-black/40 backdrop-blur-sm border-white/10 border shadow-2xl">
              <h2 className="text-xl font-serif mb-4 text-white">{t('selectPPTXFile')}</h2>
              <FileUploader 
                onFileSelect={addTranslationJob}
                disabled={isProcessing}
              />
            </Card>

            <Card className="p-6 bg-black/40 backdrop-blur-sm border-white/10 border shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif text-white">{t('targetLanguages')}</h2>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 px-2 py-1 text-xs">
                  {AVAILABLE_LANGUAGES.length} Languages Available
                </Badge>
              </div>
              <LanguageSelector 
                languages={AVAILABLE_LANGUAGES}
                selectedLanguages={selectedLanguages}
                onSelectionChange={setSelectedLanguages}
                maxSelection={0} // No limit!
                disabled={isProcessing}
              />
            </Card>
          </div>

          {/* Processing Warning */}
          {isProcessing && (
            <Card className="p-3 bg-black/40 backdrop-blur-sm border-yellow-500/20 border">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <p className="text-yellow-400 text-sm">
                  Translation in progress. Please wait before starting another translation.
                </p>
              </div>
            </Card>
          )}

          {/* Translation Jobs */}
          {jobs.length > 0 && (
            <Card className="p-6 bg-black/40 backdrop-blur-sm border-white/10 border shadow-2xl">
              <h2 className="text-xl font-serif mb-4 text-white">{t('translationStatus')}</h2>
              <div className="space-y-4">
                {jobs.map(job => (
                  <div key={job.id} className="relative">
                    <TranslationProgress 
                      job={job}
                      onDownload={handleDownload}
                      onDownloadAll={handleDownloadAll}
                    />
                    
                    {/* Add XLSX Download Button */}
                    {job.status === 'completed' && (
                      <div className="mt-3 flex justify-center">
                        <Button
                          onClick={() => handleDownloadXLSX(job)}
                          variant="outline"
                          size="sm"
                          className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                        >
                          <FileSpreadsheet className="w-4 h-4 mr-2" />
                          Download Translation Sheet (XLSX)
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Results - Only show success gradient for completed jobs */}
          {jobs.some(job => job.status === 'completed') && (
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-cyan-500/20 rounded-xl blur opacity-75 animate-success-glow"></div>
              <Card className="relative p-6 bg-black/40 backdrop-blur-sm border-white/10 border shadow-2xl">
                <h2 className="text-xl font-serif mb-4 text-white">{t('downloadResults')}</h2>
                <ResultsSection 
                  jobs={jobs.filter(job => job.status === 'completed')}
                  onDownload={handleDownload}
                  onDownloadAll={handleDownloadAll}
                />
              </Card>
            </div>
          )}

          {/* Compact Features */}
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            {[
              {
                icon: <FileText className="w-5 h-5" />,
                titleKey: 'preserveFormattingTitle',
                descriptionKey: 'preserveFormattingDesc'
              },
              {
                icon: <Globe className="w-5 h-5" />,
                titleKey: 'multilingualTitle',
                descriptionKey: 'All languages supported - no limits!'
              },
              {
                icon: <FileSpreadsheet className="w-5 h-5" />,
                titleKey: 'xlsxExportTitle',
                descriptionKey: 'Download translation sheets for manual editing'
              }
            ].map((feature, index) => (
              <div key={index} className="p-4 bg-black/40 backdrop-blur-sm border-white/10 border rounded-xl shadow-xl hover:bg-black/50 transition-all duration-300">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-3 shadow-lg">
                  {feature.icon}
                </div>
                <h3 className="text-base font-serif text-white mb-1">{typeof feature.titleKey === 'string' ? t(feature.titleKey) : feature.titleKey}</h3>
                <p className="text-gray-400 text-xs">{typeof feature.descriptionKey === 'string' ? t(feature.descriptionKey) : feature.descriptionKey}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
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