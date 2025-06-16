import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';

interface XLSXImporterProps {
  onImport: (file: File, translations: any) => void;
}

export default function XLSXImporter({ onImport }: XLSXImporterProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const xlsxFile = files.find(file => 
      file.name.toLowerCase().endsWith('.xlsx') || 
      file.name.toLowerCase().endsWith('.csv')
    );
    
    if (xlsxFile) {
      handleFileProcess(xlsxFile);
    } else {
      alert('Please drop an XLSX or CSV file.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  // FIXED: Simplified XLSX processing with better error handling
  const handleFileProcess = async (file: File) => {
    setIsProcessing(true);
    
    try {
      console.log(`📊 Processing XLSX/CSV file: ${file.name}`);
      
      const text = await file.text();
      console.log('📄 File content loaded, parsing...');
      
      if (!text || text.trim().length === 0) {
        throw new Error('File is empty or could not be read');
      }
      
      // Parse CSV content with better error handling
      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      if (lines.length < 2) {
        throw new Error('File must have at least 2 lines (header + data)');
      }
      
      console.log(`📋 Found ${lines.length} lines in file`);
      
      // SIMPLIFIED: Parse header row - expect simple structure
      const headerLine = lines[0];
      const headers = parseCSVLine(headerLine);
      
      console.log('📋 Headers found:', headers);
      
      if (headers.length < 3) {
        throw new Error('Need at least 3 columns: Slide, English, and one target language');
      }
      
      // SIMPLIFIED: Find basic columns
      const slideColIndex = findSlideColumn(headers);
      const englishColIndex = findEnglishColumn(headers);
      
      if (slideColIndex === -1) {
        throw new Error(`Could not find Slide column. Found headers: ${headers.join(', ')}`);
      }
      
      if (englishColIndex === -1) {
        throw new Error(`Could not find English column. Found headers: ${headers.join(', ')}`);
      }
      
      // SIMPLIFIED: Find language columns (everything else that's not slide/english)
      const languageColumns: Array<{index: number, name: string, code: string}> = [];
      
      for (let i = 0; i < headers.length; i++) {
        if (i !== slideColIndex && i !== englishColIndex) {
          const headerName = headers[i].trim();
          
          // Skip empty or instruction headers
          if (headerName && 
              !headerName.toLowerCase().includes('instruction') &&
              !headerName.toLowerCase().includes('step') &&
              !headerName.toLowerCase().includes('info') &&
              headerName.length > 0) {
            
            const languageCode = mapLanguageNameToCode(headerName);
            if (languageCode) {
              languageColumns.push({
                index: i,
                name: headerName,
                code: languageCode
              });
              console.log(`✅ Language column: ${headerName} → ${languageCode}`);
            } else {
              console.warn(`⚠️ Unknown language: ${headerName}`);
            }
          }
        }
      }
      
      if (languageColumns.length === 0) {
        throw new Error(`No recognized language columns found. Expected language names like: Dutch, Spanish, Polish, etc. Found: ${headers.filter((h, i) => i !== slideColIndex && i !== englishColIndex).join(', ')}`);
      }
      
      console.log(`🌍 Found ${languageColumns.length} language columns:`, languageColumns.map(l => l.name));
      
      // SIMPLIFIED: Parse data rows
      const translations: Record<string, Record<string, string>> = {};
      let processedRows = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip obviously empty or instruction lines
        if (!line || 
            line.toLowerCase().includes('instruction') ||
            line.toLowerCase().includes('step') ||
            line.toLowerCase().includes('info') ||
            line.toLowerCase().includes('how to')) {
          continue;
        }
        
        const cells = parseCSVLine(line);
        
        if (cells.length < 3) {
          console.warn(`⚠️ Skipping short row ${i}: ${cells.length} cells`);
          continue;
        }
        
        const slideValue = cells[slideColIndex]?.trim();
        const englishText = cells[englishColIndex]?.trim();
        
        if (!slideValue || !englishText) {
          console.warn(`⚠️ Skipping row ${i}: missing slide (${slideValue}) or english (${englishText})`);
          continue;
        }
        
        // Extract slide number
        let slideNumber: string;
        if (/^\d+$/.test(slideValue)) {
          slideNumber = slideValue;
        } else {
          const match = slideValue.match(/(\d+)/);
          if (match) {
            slideNumber = match[1];
          } else {
            console.warn(`⚠️ Skipping row ${i}: no slide number in "${slideValue}"`);
            continue;
          }
        }
        
        const slideId = `slide${slideNumber}`;
        
        if (!translations[slideId]) {
          translations[slideId] = {};
        }
        
        // Store English text
        translations[slideId]['originalText'] = englishText;
        
        // Extract translations for each language
        let hasTranslations = false;
        languageColumns.forEach(({ index, name, code }) => {
          const translation = cells[index]?.trim();
          
          if (translation && 
              translation.length > 0 &&
              translation !== englishText && 
              !translation.startsWith('=GOOGLETRANSLATE') &&
              !translation.toLowerCase().includes('translation')) {
            
            translations[slideId][code] = translation;
            hasTranslations = true;
            console.log(`📝 Slide ${slideNumber} ${name}: "${translation.substring(0, 50)}${translation.length > 50 ? '...' : ''}"`);
          }
        });
        
        if (hasTranslations) {
          processedRows++;
        }
      }
      
      console.log(`✅ Processed ${processedRows} slides with translations`);
      
      if (processedRows === 0) {
        throw new Error('No valid translation data found. Please check that your XLSX has the correct format with actual translations.');
      }
      
      if (Object.keys(translations).length === 0) {
        throw new Error('No slide translations were extracted. Please verify your file structure.');
      }
      
      // SUCCESS: Call the import callback
      console.log(`🎉 XLSX import successful: ${Object.keys(translations).length} slides, ${languageColumns.length} languages`);
      onImport(file, translations);
      
    } catch (error) {
      console.error('❌ XLSX processing failed:', error);
      
      // Show detailed error to user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to process XLSX file:\n\n${errorMessage}\n\nPlease check the file format and try again.`);
    } finally {
      setIsProcessing(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // SIMPLIFIED: Parse CSV line with better error handling
  const parseCSVLine = (line: string): string[] => {
    if (!line) return [];
    
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Cell separator
        cells.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    // Add the last cell
    cells.push(current.trim());
    
    return cells;
  };

  // SIMPLIFIED: Find slide column
  const findSlideColumn = (headers: string[]): number => {
    const slidePatterns = ['slide', 'slides', 'slide number', 'slide_number', 'nr', 'number'];
    
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase().trim();
      if (slidePatterns.some(pattern => header === pattern || header.includes(pattern))) {
        return i;
      }
    }
    return -1;
  };

  // SIMPLIFIED: Find English column
  const findEnglishColumn = (headers: string[]): number => {
    const englishPatterns = ['english', 'original', 'original text', 'originaltext', 'source', 'en'];
    
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase().trim();
      if (englishPatterns.some(pattern => header === pattern || header.includes(pattern))) {
        return i;
      }
    }
    return -1;
  };

  // SIMPLIFIED: Map language names to codes
  const mapLanguageNameToCode = (languageName: string): string | null => {
    const name = languageName.toLowerCase().trim();
    
    // Direct mapping
    const mapping: Record<string, string> = {
      // Common language names
      'dutch': 'nl', 'nederlands': 'nl', 'holland': 'nl', 'nl': 'nl',
      'spanish': 'es', 'español': 'es', 'espanol': 'es', 'es': 'es',
      'french': 'fr', 'français': 'fr', 'francais': 'fr', 'fr': 'fr',
      'german': 'de', 'deutsch': 'de', 'de': 'de',
      'italian': 'it', 'italiano': 'it', 'it': 'it',
      'portuguese': 'pt', 'português': 'pt', 'pt': 'pt',
      'polish': 'pl', 'polski': 'pl', 'pl': 'pl',
      'russian': 'ru', 'русский': 'ru', 'ru': 'ru',
      'japanese': 'ja', '日本語': 'ja', 'ja': 'ja',
      'korean': 'ko', '한국어': 'ko', 'ko': 'ko',
      'chinese': 'zh', '中文': 'zh', 'zh': 'zh',
      'arabic': 'ar', 'العربية': 'ar', 'ar': 'ar',
      'hindi': 'hi', 'हिन्दी': 'hi', 'hi': 'hi',
      'greek': 'el', 'ελληνικά': 'el', 'el': 'el',
      'turkish': 'tr', 'türkçe': 'tr', 'tr': 'tr',
      'swedish': 'sv', 'svenska': 'sv', 'sv': 'sv',
      'norwegian': 'no', 'norsk': 'no', 'no': 'no',
      'danish': 'da', 'dansk': 'da', 'da': 'da',
      'finnish': 'fi', 'suomi': 'fi', 'fi': 'fi',
      'czech': 'cs', 'čeština': 'cs', 'cs': 'cs',
      'hungarian': 'hu', 'magyar': 'hu', 'hu': 'hu',
      'romanian': 'ro', 'română': 'ro', 'ro': 'ro',
      'bulgarian': 'bg', 'български': 'bg', 'bg': 'bg',
      'croatian': 'hr', 'hrvatski': 'hr', 'hr': 'hr',
      'slovak': 'sk', 'slovenčina': 'sk', 'sk': 'sk',
      'slovenian': 'sl', 'slovenščina': 'sl', 'sl': 'sl',
      'lithuanian': 'lt', 'lietuvių': 'lt', 'lt': 'lt',
      'latvian': 'lv', 'latviešu': 'lv', 'lv': 'lv',
      'estonian': 'et', 'eesti': 'et', 'et': 'et',
      'ukrainian': 'uk', 'українська': 'uk', 'uk': 'uk',
      'vietnamese': 'vi', 'tiếng việt': 'vi', 'vi': 'vi',
      'thai': 'th', 'ไทย': 'th', 'th': 'th',
      'hebrew': 'he', 'עברית': 'he', 'he': 'he',
      'persian': 'fa', 'فارسی': 'fa', 'farsi': 'fa', 'fa': 'fa',
      'indonesian': 'id', 'bahasa indonesia': 'id', 'id': 'id',
      'malay': 'ms', 'bahasa melayu': 'ms', 'ms': 'ms',
      'filipino': 'tl', 'tagalog': 'tl', 'tl': 'tl'
    };
    
    return mapping[name] || null;
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.csv"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isDragging 
            ? 'border-blue-400 bg-blue-500/10' 
            : 'border-white/20 hover:border-white/30'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={!isProcessing ? handleButtonClick : undefined}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
            {isProcessing ? (
              <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileSpreadsheet className="w-6 h-6 text-green-400" />
            )}
          </div>
          
          <div>
            <h3 className="text-white font-medium mb-2">
              {isProcessing ? 'Processing XLSX...' : 'Import XLSX Translations'}
            </h3>
            <p className="text-gray-400 text-sm mb-2">
              {isDragging 
                ? 'Drop your XLSX file here' 
                : 'Drag & drop or click to select XLSX/CSV file'
              }
            </p>
            <p className="text-gray-500 text-xs">
              Simple format: Slide | English | Target Language
            </p>
          </div>
          
          {!isProcessing && (
            <Button
              type="button"
              size="sm"
              className="bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30 border"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
          )}
        </div>
      </div>
      
      {/* SIMPLIFIED: Instructions */}
      <div className="p-4 bg-blue-500/10 rounded border border-blue-500/20">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-blue-300 text-sm">
            <p className="font-medium mb-1">✅ Simple XLSX Format:</p>
            <ul className="text-xs space-y-1 text-blue-200">
              <li>• Column A: <strong>Slide</strong> (numbers: 1, 2, 3...)</li>
              <li>• Column B: <strong>English</strong> (all original text for the slide)</li>
              <li>• Column C: <strong>Target Language</strong> (all translated text for the slide)</li>
              <li>• One row per slide</li>
              <li>• All text from one slide goes in one cell per language</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Warning */}
      <div className="p-3 bg-yellow-500/10 rounded border border-yellow-500/20">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="text-yellow-300 text-xs">
            <strong>Important:</strong> Each slide should be one row. Put all English text from that slide in one cell, 
            and all translated text in the corresponding language cell.
          </div>
        </div>
      </div>
    </div>
  );
}