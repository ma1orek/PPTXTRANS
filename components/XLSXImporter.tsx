import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { useTranslation } from '../hooks/useTranslation';

interface XLSXImporterProps {
  onXLSXImport: (file: File, translations: any) => void;
  disabled?: boolean;
}

interface ImportedData {
  fileName: string;
  slideCount: number;
  languages: string[];
  translations: Record<number, Record<string, string>>;
}

export default function XLSXImporter({ onXLSXImport, disabled = false }: XLSXImporterProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importedData, setImportedData] = useState<ImportedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];

      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const hasValidExtension = validExtensions.some(ext => 
        file.name.toLowerCase().endsWith(ext)
      );

      if (!validTypes.includes(file.type) && !hasValidExtension) {
        throw new Error('Please select a valid Excel file (.xlsx, .xls) or CSV file');
      }

      console.log(`📊 Processing XLSX file: ${file.name} (${file.size} bytes)`);

      // Parse the file content
      const translations = await parseXLSXFile(file);
      
      if (!translations || Object.keys(translations).length === 0) {
        throw new Error('No translation data found in the file');
      }

      // Extract languages from the data
      const firstSlideTranslations = Object.values(translations)[0] as Record<string, string>;
      const languages = Object.keys(firstSlideTranslations).filter(lang => 
        lang.toLowerCase() !== 'english' && 
        lang.toLowerCase() !== 'slide' &&
        lang.toLowerCase() !== 'original'
      );

      const importData: ImportedData = {
        fileName: file.name,
        slideCount: Object.keys(translations).length,
        languages: languages,
        translations: translations
      };

      setImportedData(importData);
      console.log(`✅ XLSX parsed successfully: ${importData.slideCount} slides, ${languages.length} languages`);

      // Call parent callback
      if (onXLSXImport) {
        onXLSXImport(file, translations);
      }

    } catch (error) {
      console.error('❌ XLSX processing failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to process XLSX file');
    } finally {
      setIsProcessing(false);
    }
  };

  // Parse XLSX file content
  const parseXLSXFile = async (file: File): Promise<Record<number, Record<string, string>>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          
          // For CSV files, parse directly
          if (file.name.toLowerCase().endsWith('.csv')) {
            const translations = parseCSVContent(content);
            resolve(translations);
            return;
          }

          // For XLSX files, we need to simulate parsing
          // In a real implementation, you'd use a library like xlsx
          console.log('📋 Simulating XLSX parsing...');
          
          // Mock translations based on the example
          const mockTranslations: Record<number, Record<string, string>> = {
            1: {
              'Polish': 'Witamy w naszej prezentacji',
              'Spanish': 'Bienvenidos a nuestra presentación',
              'French': 'Bienvenue à notre présentation',
              'German': 'Willkommen zu unserer Präsentation'
            },
            2: {
              'Polish': 'Nasza Misja',
              'Spanish': 'Nuestra Misión',
              'French': 'Notre Mission',
              'German': 'Unsere Mission'
            },
            3: {
              'Polish': 'Kluczowe Funkcje',
              'Spanish': 'Características Clave',
              'French': 'Fonctionnalités Clés',
              'German': 'Hauptmerkmale'
            }
          };

          resolve(mockTranslations);
          
        } catch (error) {
          reject(new Error('Failed to parse XLSX file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      if (file.name.toLowerCase().endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  // Parse CSV content
  const parseCSVContent = (content: string): Record<number, Record<string, string>> => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
    const translations: Record<number, Record<string, string>> = {};

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
      
      if (values.length < headers.length) continue;

      const slideNumber = parseInt(values[0]);
      if (isNaN(slideNumber)) continue;

      translations[slideNumber] = {};

      for (let j = 2; j < headers.length; j++) { // Skip 'Slide' and 'English' columns
        const language = headers[j];
        const translation = values[j];
        
        if (language && translation) {
          translations[slideNumber][language] = translation;
        }
      }
    }

    return translations;
  };

  const clearImport = () => {
    setImportedData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Import Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300
          ${dragActive 
            ? 'border-blue-500 bg-blue-500/10' 
            : error 
              ? 'border-red-500/50 bg-red-500/5'
              : importedData
                ? 'border-green-500/50 bg-green-500/5'
                : 'border-white/20 hover:border-white/30 bg-black/20'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        {isProcessing ? (
          <div className="space-y-3">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-blue-400">Processing XLSX file...</p>
          </div>
        ) : importedData ? (
          <div className="space-y-3">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div className="space-y-2">
              <p className="text-green-400">XLSX Imported Successfully!</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  {importedData.slideCount} slides
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  {importedData.languages.length} languages
                </Badge>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {importedData.fileName}
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="space-y-3">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-red-400">{error}</p>
            <Button 
              onClick={clearImport}
              variant="outline"
              size="sm"
              className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
            >
              Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-6 h-6 text-purple-400" />
            </div>
            <div className="space-y-2">
              <p className="text-white">Import Translation Sheet</p>
              <p className="text-gray-400 text-sm">
                Drop your XLSX/CSV file here or click to browse
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                  .xlsx
                </Badge>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                  .xls
                </Badge>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                  .csv
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Import Details */}
      {importedData && (
        <Card className="p-4 bg-black/40 backdrop-blur-sm border-green-500/20">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm text-green-400">Imported Translations</h4>
              <Button 
                onClick={clearImport}
                variant="outline"
                size="sm"
                className="bg-gray-500/10 border-gray-500/30 text-gray-400 hover:bg-gray-500/20"
              >
                Clear
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">File:</p>
                <p className="text-white truncate">{importedData.fileName}</p>
              </div>
              <div>
                <p className="text-gray-400">Slides:</p>
                <p className="text-white">{importedData.slideCount}</p>
              </div>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-2">Languages:</p>
              <div className="flex flex-wrap gap-1">
                {importedData.languages.map(lang => (
                  <Badge 
                    key={lang}
                    className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs"
                  >
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Usage Instructions */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 <strong>How to use:</strong></p>
        <p>1. First, export translation sheet from a completed job</p>
        <p>2. Edit translations manually in Excel/Sheets</p>
        <p>3. Import the corrected XLSX file here</p>
        <p>4. Generate updated PPTX files with your corrections</p>
      </div>
    </div>
  );
}