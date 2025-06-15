import React from 'react';
import { Download, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { useTranslation } from '../hooks/useTranslation';
import { TranslationResult } from '../services/translationService';

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
};

interface ResultsSectionProps {
  jobs: TranslationJob[];
  onDownload?: (job: TranslationJob, language: string) => void;
  onDownloadAll?: (job: TranslationJob) => void;
}

const languageNames: Record<string, { name: string; flag: string }> = {
  'pl': { name: 'Polish', flag: '🇵🇱' },
  'es': { name: 'Spanish', flag: '🇪🇸' },
  'fr': { name: 'French', flag: '🇫🇷' },
  'de': { name: 'German', flag: '🇩🇪' },
  'it': { name: 'Italian', flag: '🇮🇹' },
  'pt': { name: 'Portuguese', flag: '🇵🇹' },
  'nl': { name: 'Dutch', flag: '🇳🇱' },
  'ru': { name: 'Russian', flag: '🇷🇺' },
  'ja': { name: 'Japanese', flag: '🇯🇵' },
  'ko': { name: 'Korean', flag: '🇰🇷' },
  'zh': { name: 'Chinese', flag: '🇨🇳' },
  'ar': { name: 'Arabic', flag: '🇸🇦' },
};

export default function ResultsSection({ jobs, onDownload, onDownloadAll }: ResultsSectionProps) {
  const { t } = useTranslation();

  const handleDownload = (job: TranslationJob, language: string) => {
    if (onDownload) {
      onDownload(job, language);
    }
  };

  const handleDownloadAll = (job: TranslationJob) => {
    if (onDownloadAll) {
      onDownloadAll(job);
    }
  };

  return (
    <div className="space-y-6">
      {jobs.map(job => (
        <div key={job.id} className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-cyan-500/20 rounded-xl blur opacity-75 animate-pulse"></div>
          <Card className="relative p-6 bg-black/40 backdrop-blur-sm border-green-500/20 border shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                
                <div>
                  <h3 className="text-white font-medium text-lg">{job.fileName}</h3>
                  <p className="text-gray-400 text-sm">
                    {t('translatedTo', { count: job.selectedLanguages.length.toString() })}
                  </p>
                  {job.results && (
                    <p className="text-green-400 text-xs">
                      ✅ {job.results.length} files ready for download
                    </p>
                  )}
                </div>
              </div>
              
              <Button
                onClick={() => handleDownloadAll(job)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
              >
                <Download className="w-4 h-4 mr-2" />
                {t('downloadAll')}
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {job.results?.map(result => {
                const langInfo = languageNames[result.language] || { name: result.language, flag: '🌐' };
                
                return (
                  <div
                    key={result.language}
                    className="relative group"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg blur opacity-0 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm border border-gray-600 rounded-lg hover:border-gray-500 transition-all duration-300 hover:shadow-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{langInfo.flag}</span>
                        <div>
                          <p className="text-white font-medium">{langInfo.name}</p>
                          <p className="text-gray-400 text-xs">
                            {result.fileName}
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownload(job, result.language)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 transition-all"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              }) || job.selectedLanguages.map(language => {
                const langInfo = languageNames[language] || { name: language, flag: '🌐' };
                
                return (
                  <div
                    key={language}
                    className="relative group"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg blur opacity-0 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm border border-gray-600 rounded-lg hover:border-gray-500 transition-all duration-300 hover:shadow-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{langInfo.flag}</span>
                        <div>
                          <p className="text-white font-medium">{langInfo.name}</p>
                          <p className="text-gray-400 text-xs">
                            {job.fileName.replace(/\.(pptx|ppt)$/i, '')}_${language}.pptx
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownload(job, language)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 transition-all"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            <div className="mt-6 pt-4 border-t border-gray-700/50">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {t('completed')}
                  </Badge>
                  
                  <span className="text-gray-400">
                    {t('originalSize', { size: (job.sourceFile.size / 1024 / 1024).toFixed(2) })}
                  </span>
                </div>
                
                <span className="text-gray-500">
                  {t('completedAt', { time: new Date().toLocaleTimeString() })}
                </span>
              </div>
            </div>
          </Card>
        </div>
      ))}

      {/* Summary */}
      {jobs.length > 1 && (
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-xl blur opacity-50"></div>
          <Card className="relative p-6 bg-black/40 backdrop-blur-sm border-blue-500/20 border shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium text-lg mb-2">{t('summary')}</h3>
                <p className="text-gray-400">
                  {t('translatedPresentations', { 
                    count: jobs.length.toString(),
                    totalFiles: jobs.reduce((sum, job) => sum + job.selectedLanguages.length, 0).toString()
                  })}
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-2xl font-bold text-green-400">
                  {jobs.reduce((sum, job) => sum + (job.results?.length || job.selectedLanguages.length), 0)}
                </p>
                <p className="text-gray-400 text-sm">{t('filesReady')}</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}