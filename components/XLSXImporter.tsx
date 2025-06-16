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

  // FIXED: Process XLSX/CSV file with proper structure parsing as shown in user's image
  const handleFileProcess = async (file: File) => {
    setIsProcessing(true);
    
    try {
      console.log(`📊 Processing XLSX/CSV file: ${file.name}`);
      
      const text = await file.text();
      console.log('📄 File content loaded, parsing...');
      
      // Parse CSV content
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      if (lines.length < 2) {
        throw new Error('File appears to be empty or invalid');
      }
      
      // FIXED: Parse header row to detect proper structure as in user's image
      const headerLine = lines[0];
      const headers = parseCSVLine(headerLine);
      
      console.log('📋 Detected headers:', headers);
      
      // ENHANCED: Validate structure - should have Slide, English/Original, and language columns
      if (headers.length < 3) {
        throw new Error('Invalid structure: Need at least Slide, English, and one language column');
      }
      
      // Find column indexes
      const slideColumnIndex = findColumnIndex(headers, ['slide', 'slides', 'slide number', 'slide_number']);
      const englishColumnIndex = findColumnIndex(headers, ['english', 'original text', 'original', 'originaltext', 'english text']);
      
      if (slideColumnIndex === -1) {
        throw new Error('Could not find Slide column. Expected column names: Slide, Slides, or Slide Number');
      }
      
      if (englishColumnIndex === -1) {
        throw new Error('Could not find English/Original text column. Expected: English, Original Text, or Original');
      }
      
      // ENHANCED: Identify language columns (everything after English column, excluding metadata)
      const languageColumns: Array<{index: number, name: string, code: string}> = [];
      
      for (let i = 0; i < headers.length; i++) {
        if (i !== slideColumnIndex && i !== englishColumnIndex) {
          const headerName = headers[i].trim();
          
          // Skip obvious metadata columns
          if (!['instructions', 'info', 'google api', 'api', 'structure', 'step 1', 'step 2', 'step 3', 'step 4', 'step 5', 'step 6', '', 'how to use'].includes(headerName.toLowerCase())) {
            const languageCode = mapLanguageNameToCode(headerName);
            if (languageCode) {
              languageColumns.push({
                index: i,
                name: headerName,
                code: languageCode
              });
            }
          }
        }
      }
      
      console.log('🌍 Detected language columns:', languageColumns);
      
      if (languageColumns.length === 0) {
        throw new Error('No language columns detected. Please ensure you have language headers like Dutch, Spanish, French, etc.');
      }
      
      // ENHANCED: Parse data rows with proper structure
      const translations: Record<string, Record<string, string>> = {};
      let validRowCount = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '' || line.toLowerCase().includes('instructions') || line.toLowerCase().includes('step ') || line.toLowerCase().includes('info') || line.toLowerCase().includes('api')) {
          continue; // Skip instruction/info rows
        }
        
        const cells = parseCSVLine(line);
        
        if (cells.length <= Math.max(slideColumnIndex, englishColumnIndex)) {
          continue; // Skip incomplete rows
        }
        
        const slideValue = cells[slideColumnIndex]?.trim();
        const englishText = cells[englishColumnIndex]?.trim();
        
        if (!slideValue || !englishText) {
          continue; // Skip rows without slide number or english text
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
            continue; // Skip if no slide number found
          }
        }
        
        const slideId = `slide${slideNumber}`;
        
        if (!translations[slideId]) {
          translations[slideId] = {};
        }
        
        // FIXED: Store the ENTIRE English text for this slide
        translations[slideId]['originalText'] = englishText;
        
        // Extract translations for each language
        languageColumns.forEach(({ index, name, code }) => {
          const translation = cells[index]?.trim();
          if (translation && translation !== englishText && !translation.startsWith('=GOOGLETRANSLATE')) {
            translations[slideId][code] = translation;
            console.log(`📝 Slide ${slideNumber} ${name}: "${translation}"`);
          }
        });
        
        validRowCount++;
      }
      
      console.log(`✅ Processed ${validRowCount} slides with translations`);
      console.log(`🌍 Available languages: ${languageColumns.map(l => l.code).join(', ')}`);
      
      if (validRowCount === 0) {
        throw new Error('No valid translation data found. Please check the file format.');
      }
      
      if (Object.keys(translations).length === 0) {
        throw new Error('No translations extracted. Please verify the file structure.');
      }
      
      // Call the import callback with processed data
      onImport(file, translations);
      
      console.log(`✅ XLSX import completed: ${Object.keys(translations).length} slides, ${languageColumns.length} languages`);
      
    } catch (error) {
      console.error('❌ XLSX processing failed:', error);
      alert(`Failed to process XLSX file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // FIXED: Parse CSV line with proper quote handling
  const parseCSVLine = (line: string): string[] => {
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

  // Find column index by multiple possible names
  const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase().trim();
      if (possibleNames.some(name => name.toLowerCase() === header)) {
        return i;
      }
    }
    return -1;
  };

  // ENHANCED: Map language names to codes as shown in user's image
  const mapLanguageNameToCode = (languageName: string): string | null => {
    const mapping: Record<string, string> = {
      // Exact matches from user's image structure
      'dutch': 'nl',
      'spanish': 'es', 
      'portuguese': 'pt',
      'greek': 'el',
      'german': 'de',
      'finnish': 'fi',
      'swedish': 'sv',
      'danish': 'da',
      'norwegian': 'no',
      'polish': 'pl',
      'czech': 'cs',
      'romanian': 'ro',
      'hungarian': 'hu',
      'french': 'fr',
      'italian': 'it',
      
      // Additional common mappings
      'english': 'en',
      'russian': 'ru',
      'japanese': 'ja',
      'korean': 'ko',
      'chinese': 'zh',
      'arabic': 'ar',
      'hindi': 'hi',
      'turkish': 'tr',
      'hebrew': 'he',
      'thai': 'th',
      'vietnamese': 'vi',
      'indonesian': 'id',
      'malay': 'ms',
      'filipino': 'tl',
      'ukrainian': 'uk',
      'lithuanian': 'lt',
      'latvian': 'lv',
      'estonian': 'et',
      'slovenian': 'sl',
      'croatian': 'hr',
      'bulgarian': 'bg',
      'slovak': 'sk',
      'icelandic': 'is',
      'maltese': 'mt',
      'irish': 'ga',
      'welsh': 'cy',
      'basque': 'eu',
      'catalan': 'ca',
      'galician': 'gl',
      'belarusian': 'be',
      'serbian': 'sr',
      'bosnian': 'bs',
      'macedonian': 'mk',
      'georgian': 'ka',
      'armenian': 'hy',
      'azerbaijani': 'az',
      'persian': 'fa',
      'farsi': 'fa',
      'swahili': 'sw',
      'afrikaans': 'af',
      'amharic': 'am',
      'bengali': 'bn',
      'urdu': 'ur',
      'punjabi': 'pa',
      'gujarati': 'gu',
      'tamil': 'ta',
      'telugu': 'te',
      'kannada': 'kn',
      'malayalam': 'ml',
      
      // Alternative names and abbreviations
      'nl': 'nl', 'es': 'es', 'pt': 'pt', 'el': 'el', 'de': 'de',
      'fi': 'fi', 'sv': 'sv', 'da': 'da', 'no': 'no', 'pl': 'pl',
      'cs': 'cs', 'ro': 'ro', 'hu': 'hu', 'fr': 'fr', 'it': 'it',
      'ru': 'ru', 'ja': 'ja', 'ko': 'ko', 'zh': 'zh', 'ar': 'ar',
      'hi': 'hi', 'tr': 'tr', 'he': 'he', 'th': 'th', 'vi': 'vi',
      
      // Common alternative spellings
      'nederland': 'nl', 'nederlands': 'nl', 'holland': 'nl',
      'spain': 'es', 'espanol': 'es', 'español': 'es',
      'portugal': 'pt', 'português': 'pt',
      'greece': 'el', 'ελληνικά': 'el',
      'deutschland': 'de', 'deutsch': 'de', 'germany': 'de',
      'suomi': 'fi', 'finland': 'fi',
      'sverige': 'sv', 'svenska': 'sv', 'sweden': 'sv',
      'denmark': 'da', 'dansk': 'da',
      'norway': 'no', 'norsk': 'no',
      'polska': 'pl', 'polski': 'pl', 'poland': 'pl',
      'cesky': 'cs', 'czechia': 'cs',
      'romania': 'ro', 'romana': 'ro',
      'magyar': 'hu', 'hungary': 'hu',
      'france': 'fr', 'francais': 'fr', 'français': 'fr',
      'italia': 'it', 'italiano': 'it', 'italy': 'it'
    };
    
    const key = languageName.toLowerCase().trim();
    return mapping[key] || null;
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
              Expected structure: Slide | English | Dutch | Spanish | ...
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
      
      {/* Instructions */}
      <div className="p-4 bg-blue-500/10 rounded border border-blue-500/20">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-blue-300 text-sm">
            <p className="font-medium mb-1">Expected XLSX Structure:</p>
            <ul className="text-xs space-y-1 text-blue-200">
              <li>• Column A: Slide numbers (1, 2, 3...)</li>
              <li>• Column B: English/Original text (combined per slide)</li>
              <li>• Columns C+: Language translations (Dutch, Spanish, French...)</li>
              <li>• One row per slide with all text combined in single cells</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Warning */}
      <div className="p-3 bg-yellow-500/10 rounded border border-yellow-500/20">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="text-yellow-300 text-xs">
            <strong>Important:</strong> Make sure your XLSX follows the exact structure shown above. 
            Each slide should be one row with combined text in language columns.
          </div>
        </div>
      </div>
    </div>
  );
}