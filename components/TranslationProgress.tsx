import React from 'react';
import { Download, FileText, Clock, CheckCircle, AlertCircle, Globe, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { useTranslation } from '../hooks/useTranslation';

interface TranslationJob {
  id: string;
  fileName: string;
  selectedLanguages: string[];
  status: 'pending' | 'extracting' | 'translating' | 'rebuilding' | 'completed' | 'error';
  progress: number;
  currentStep?: string;
  results?: Array<{
    language: string;
    downloadUrl: string;
    fileId: string;
    fileName: string;
    size?: number;
  }>;
  error?: string;
}

interface TranslationProgressProps {
  job: TranslationJob;
  onDownload: (job: TranslationJob, language: string) => void;
  onDownloadAll: (job: TranslationJob) => void;
}

const LANGUAGE_FLAGS: Record<string, string> = {
  pl: '🇵🇱',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
  pt: '🇵🇹',
  nl: '🇳🇱',
  ru: '🇷🇺',
  ja: '🇯🇵',
  ko: '🇰🇷',
  zh: '🇨🇳',
  ar: '🇸🇦'
};

const LANGUAGE_NAMES: Record<string, string> = {
  pl: 'Polish',
  es: 'Spanish', 
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  ru: 'Russian',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  ar: 'Arabic'
};

export default function TranslationProgress({ 
  job, 
  onDownload, 
  onDownloadAll 
}: TranslationProgressProps) {
  const { t } = useTranslation();

  const getStatusIcon = () => {
    switch (job.status) {
      case 'pending':
      case 'extracting':
      case 'translating':
      case 'rebuilding':
        return <RotateCcw className="w-4 h-4 animate-spin text-blue-400" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case 'pending':
        return 'text-gray-400';
      case 'extracting':
      case 'translating':
      case 'rebuilding':
        return 'text-blue-400';
      case 'completed':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    switch (job.status) {
      case 'pending':
        return 'Pending';
      case 'extracting':
        return 'Extracting';
      case 'translating':
        return 'Translating';
      case 'rebuilding':
        return 'Rebuilding';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const getProgressColor = () => {
    if (job.status === 'error') return 'bg-red-500';
    if (job.status === 'completed') return 'bg-green-500';
    return 'bg-blue-500';
  };

  return (
    <div className="border border-white/10 rounded-xl p-4 bg-black/20 backdrop-blur-sm">
      {/* Job Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{job.fileName}</p>
            <div className="flex items-center space-x-2 mt-1">
              {getStatusIcon()}
              <span className={`text-xs font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
              {job.progress > 0 && (
                <span className="text-xs text-gray-400">
                  {job.progress}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Languages Badge */}
        <div className="flex items-center space-x-1">
          {job.selectedLanguages.slice(0, 3).map(lang => (
            <span key={lang} className="text-lg" title={LANGUAGE_NAMES[lang] || lang}>
              {LANGUAGE_FLAGS[lang] || '🌐'}
            </span>
          ))}
          {job.selectedLanguages.length > 3 && (
            <span className="text-xs text-gray-400">
              +{job.selectedLanguages.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {job.status !== 'error' && job.progress > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-400">
              {job.currentStep || 'Processing...'}
            </span>
            <span className="text-xs text-gray-400">
              {job.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${job.progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {job.status === 'error' && job.error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-400 font-medium text-sm mb-1">Translation Failed</p>
              <p className="text-red-300 text-xs">{job.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Completed Results */}
      {job.status === 'completed' && job.results && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-green-400 text-sm font-medium">
              ✅ Translation completed successfully!
            </p>
            <Button
              size="sm"
              onClick={() => onDownloadAll(job)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Download All
            </Button>
          </div>

          {/* Individual Language Downloads */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {job.results.map(result => (
              <Button
                key={result.language}
                variant="outline"
                size="sm"
                onClick={() => onDownload(job, result.language)}
                className="flex items-center space-x-2 justify-start p-2 text-xs border-white/20 hover:border-white/40 hover:bg-white/5 transition-colors"
              >
                <span className="text-base">
                  {LANGUAGE_FLAGS[result.language] || '🌐'}
                </span>
                <div className="flex-1 text-left">
                  <div className="text-white">{LANGUAGE_NAMES[result.language] || result.language.toUpperCase()}</div>
                  {result.size && (
                    <div className="text-gray-400 text-xs">
                      {(result.size / 1024 / 1024).toFixed(1)}MB
                    </div>
                  )}
                </div>
                <Download className="w-3 h-3 text-gray-400" />
              </Button>
            ))}
          </div>

          <div className="pt-2 border-t border-white/10">
            <p className="text-xs text-gray-400 text-center">
              Files are ready for download. Click individual languages or download all at once.
            </p>
          </div>
        </div>
      )}

      {/* Processing Info */}
      {(job.status === 'extracting' || job.status === 'translating' || job.status === 'rebuilding') && (
        <div className="pt-3 border-t border-white/10">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <p className="text-blue-400 text-xs">
              {job.currentStep || 'Processing your presentation...'}
            </p>
          </div>
          
          {job.status === 'translating' && (
            <div className="mt-2 text-xs text-gray-400">
              <p>🔄 Using Google Translate for {job.selectedLanguages.length} languages</p>
              <p>⏱️ This may take 1-3 minutes depending on content size</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}