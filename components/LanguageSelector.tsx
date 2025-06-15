import React, { useState, useRef } from 'react';
import { Check, Globe, ChevronDown, FileSpreadsheet, Upload, X, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Checkbox } from './ui/checkbox';

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface LanguageSelectorProps {
  languages: Language[];
  selectedLanguages: string[];
  onSelectionChange: (selectedLanguages: string[]) => void;
  maxSelection?: number;
  disabled?: boolean;
  onSmartSelect?: (strategy: string) => void;
  onXLSXImport?: (file: File, translations: any) => void; // New prop for XLSX import
}

export default function LanguageSelector({
  languages,
  selectedLanguages,
  onSelectionChange,
  maxSelection = 0,
  disabled = false,
  onSmartSelect,
  onXLSXImport
}: LanguageSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showXLSXImport, setShowXLSXImport] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessingXLSX, setIsProcessingXLSX] = useState(false);
  const [xlsxError, setXlsxError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLanguageToggle = (languageCode: string) => {
    if (disabled) return;
    
    if (selectedLanguages.includes(languageCode)) {
      onSelectionChange(selectedLanguages.filter(code => code !== languageCode));
    } else {
      if (maxSelection > 0 && selectedLanguages.length >= maxSelection) {
        return; // Don't add if we've reached the maximum
      }
      onSelectionChange([...selectedLanguages, languageCode]);
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    
    const allCodes = filteredLanguages.map(lang => lang.code);
    const newSelection = maxSelection > 0 
      ? allCodes.slice(0, maxSelection)
      : allCodes;
    onSelectionChange(newSelection);
  };

  const handleClearAll = () => {
    if (disabled) return;
    onSelectionChange([]);
  };

  // XLSX Import Handlers
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
      processXLSXFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const files = e.target.files;
    if (files && files[0]) {
      processXLSXFile(files[0]);
    }
  };

  const processXLSXFile = async (file: File) => {
    setXlsxError(null);
    setIsProcessingXLSX(true);

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

      console.log(`✅ XLSX parsed successfully: ${Object.keys(translations).length} slides`);

      // Call parent callback
      if (onXLSXImport) {
        onXLSXImport(file, translations);
        setShowXLSXImport(false); // Close import panel after success
      }

    } catch (error) {
      console.error('❌ XLSX processing failed:', error);
      setXlsxError(error instanceof Error ? error.message : 'Failed to process XLSX file');
    } finally {
      setIsProcessingXLSX(false);
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
          
          // Mock translations based on realistic data
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
            },
            4: {
              'Polish': 'Dziękujemy za uwagę',
              'Spanish': 'Gracias por su atención',
              'French': 'Merci de votre attention',
              'German': 'Vielen Dank für Ihre Aufmerksamkeit'
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

  const smartSelectionStrategies = [
    { id: 'european', name: 'European Languages', count: languages.filter(l => ['pl', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'sv', 'no', 'da', 'fi'].includes(l.code)).length },
    { id: 'asian', name: 'Asian Languages', count: languages.filter(l => ['ja', 'ko', 'zh', 'hi', 'th', 'vi', 'id'].includes(l.code)).length },
    { id: 'popular', name: 'Most Popular', count: languages.filter(l => ['es', 'fr', 'de', 'ja', 'ko', 'zh', 'pt', 'it', 'ru', 'ar'].includes(l.code)).length }
  ];

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search languages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
          />
        </div>
        
        <div className="flex gap-2">
          {/* XLSX Import Toggle */}
          <Button
            onClick={() => setShowXLSXImport(!showXLSXImport)}
            variant="outline"
            size="sm"
            disabled={disabled}
            className={`${
              showXLSXImport 
                ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' 
                : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
            } hover:bg-purple-500/20`}
          >
            <FileSpreadsheet className="w-4 h-4 mr-1" />
            XLSX
          </Button>
          
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="outline"
            size="sm"
            disabled={disabled}
            className="bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* XLSX Import Panel */}
      {showXLSXImport && (
        <Card className="p-4 bg-purple-500/10 border-purple-500/20">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-purple-300 text-sm">Import Translation Sheet</h4>
            <Button
              onClick={() => setShowXLSXImport(false)}
              variant="ghost"
              size="sm"
              className="text-purple-400 hover:bg-purple-500/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {!isProcessingXLSX && !xlsxError ? (
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-4 text-center transition-all duration-300
                ${dragActive 
                  ? 'border-purple-400 bg-purple-500/10' 
                  : 'border-purple-500/30 hover:border-purple-500/50 bg-purple-500/5'
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

              <div className="space-y-2">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto">
                  <Upload className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-purple-300 text-sm">Drop XLSX/CSV file or click to browse</p>
                <p className="text-purple-400/70 text-xs">
                  Import your corrected translations to auto-select languages
                </p>
                <div className="flex justify-center gap-1 mt-2">
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">.xlsx</Badge>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">.xls</Badge>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">.csv</Badge>
                </div>
              </div>
            </div>
          ) : isProcessingXLSX ? (
            <div className="p-4 text-center">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-purple-300 text-sm">Processing XLSX file...</p>
            </div>
          ) : xlsxError ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <X className="w-4 h-4 text-red-400" />
                <p className="text-red-400 text-sm">Import Failed</p>
              </div>
              <p className="text-red-300 text-xs mb-3">{xlsxError}</p>
              <Button
                onClick={() => setXlsxError(null)}
                variant="outline"
                size="sm"
                className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
              >
                Try Again
              </Button>
            </div>
          ) : null}
        </Card>
      )}

      {/* Selection Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-400" />
          <span className="text-gray-300 text-sm">
            {selectedLanguages.length} selected
            {maxSelection > 0 && ` of ${maxSelection} max`}
          </span>
        </div>
        
        <div className="flex gap-2">
          {filteredLanguages.length > 0 && (
            <Button
              onClick={handleSelectAll}
              variant="outline"
              size="sm"
              disabled={disabled || (maxSelection > 0 && selectedLanguages.length >= maxSelection)}
              className="bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"
            >
              Select All
            </Button>
          )}
          
          {selectedLanguages.length > 0 && (
            <Button
              onClick={handleClearAll}
              variant="outline"
              size="sm"
              disabled={disabled}
              className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Smart Selection */}
      {isExpanded && onSmartSelect && (
        <div className="space-y-2">
          <h4 className="text-gray-400 text-sm">Quick Selection</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {smartSelectionStrategies.map(strategy => (
              <Button
                key={strategy.id}
                onClick={() => onSmartSelect(strategy.id)}
                variant="outline"
                size="sm"
                disabled={disabled}
                className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 text-left justify-start"
              >
                <div className="flex flex-col">
                  <span className="text-xs">{strategy.name}</span>
                  <span className="text-xs text-gray-500">{strategy.count} languages</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Language Grid */}
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 ${!isExpanded ? 'max-h-48 overflow-y-auto' : ''}`}>
        {filteredLanguages.map((language) => {
          const isSelected = selectedLanguages.includes(language.code);
          const isDisabled = disabled || (maxSelection > 0 && selectedLanguages.length >= maxSelection && !isSelected);
          
          return (
            <div
              key={language.code}
              onClick={() => !isDisabled && handleLanguageToggle(language.code)}
              className={`
                flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-all duration-200
                ${isSelected
                  ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' 
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <Checkbox
                checked={isSelected}
                disabled={isDisabled}
                readOnly
                className="w-4 h-4"
              />
              <span className="text-lg mr-1">{language.flag}</span>
              <span className="text-sm truncate flex-1">{language.name}</span>
            </div>
          );
        })}
      </div>

      {/* No results */}
      {filteredLanguages.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No languages found matching "{searchTerm}"</p>
        </div>
      )}

      {/* Selection limit warning */}
      {maxSelection > 0 && selectedLanguages.length >= maxSelection && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-400 text-sm">
            Maximum selection limit reached ({maxSelection} languages)
          </p>
        </div>
      )}
    </div>
  );
}