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

  // FIXED: Process XLSX/CSV file with CORRECT structure parsing from user's image
  const handleFileProcess = async (file: File) => {
    setIsProcessing(true);
    
    try {
      console.log(`📊 Processing XLSX/CSV file with CORRECT structure: ${file.name}`);
      
      const text = await file.text();
      console.log('📄 File content loaded, parsing with proper column structure...');
      
      // Parse CSV content
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      if (lines.length < 2) {
        throw new Error('File appears to be empty or invalid');
      }
      
      // FIXED: Parse header row to detect CORRECT structure as in user's image
      const headerLine = lines[0];
      const headers = parseCSVLine(headerLine);
      
      console.log('📋 Detected headers:', headers);
      console.log('🔍 Analyzing structure for separate language columns...');
      
      // CRITICAL FIX: Validate CORRECT structure - separate columns as in user's image
      if (headers.length < 3) {
        throw new Error('Invalid structure: Need at least Slide, English, and one language column');
      }
      
      // Check for WRONG format (combined headers like "Slide.English.Italian")
      const hasWrongFormat = headers.some(header => 
        header.includes('.') && (header.toLowerCase().includes('slide') || header.toLowerCase().includes('english'))
      );
      
      if (hasWrongFormat) {
        throw new Error('WRONG FORMAT DETECTED! Headers should be separate columns: "Slide", "English", "Dutch", "Spanish"... NOT combined like "Slide.English.Italian"');
      }
      
      // Find column indexes for CORRECT structure
      const slideColumnIndex = findColumnIndex(headers, ['slide', 'slides', 'slide number', 'slide_number']);
      const englishColumnIndex = findColumnIndex(headers, ['english', 'original text', 'original', 'originaltext', 'english text']);
      
      if (slideColumnIndex === -1) {
        throw new Error('Could not find Slide column. Expected: "Slide" (separate column)');
      }
      
      if (englishColumnIndex === -1) {
        throw new Error('Could not find English column. Expected: "English" (separate column)');
      }
      
      // ENHANCED: Identify language columns (separate columns after English)
      const languageColumns: Array<{index: number, name: string, code: string}> = [];
      
      for (let i = 0; i < headers.length; i++) {
        if (i !== slideColumnIndex && i !== englishColumnIndex) {
          const headerName = headers[i].trim();
          
          // Skip instruction/metadata columns
          if (!['instructions', 'info', 'google api', 'api', 'structure', 'step', 'correct', 'wrong', 'right', 'how to use', ''].includes(headerName.toLowerCase())) {
            const languageCode = mapLanguageNameToCode(headerName);
            if (languageCode) {
              languageColumns.push({
                index: i,
                name: headerName,
                code: languageCode
              });
              console.log(`✅ Found language column: ${headerName} → ${languageCode} (column ${i})`);
            } else {
              console.warn(`⚠️ Unknown language column: ${headerName}`);
            }
          }
        }
      }
      
      console.log('🌍 Detected language columns:', languageColumns.map(l => `${l.name} (${l.code})`));
      
      if (languageColumns.length === 0) {
        throw new Error('No language columns detected. Please ensure you have separate language headers like: Dutch, Spanish, French, etc.');
      }
      
      // ENHANCED: Parse data rows with CORRECT structure (one row per slide)
      const translations: Record<string, Record<string, string>> = {};
      let validRowCount = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip instruction/info rows
        if (line.trim() === '' || 
            line.toLowerCase().includes('instructions') || 
            line.toLowerCase().includes('step ') || 
            line.toLowerCase().includes('info') || 
            line.toLowerCase().includes('api') ||
            line.toLowerCase().includes('structure') ||
            line.toLowerCase().includes('correct') ||
            line.toLowerCase().includes('wrong')) {
          continue;
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
        
        // FIXED: Store the English text for this slide
        translations[slideId]['originalText'] = englishText;
        
        // CRITICAL FIX: Extract translations from SEPARATE language columns
        languageColumns.forEach(({ index, name, code }) => {
          const translation = cells[index]?.trim();
          if (translation && 
              translation !== englishText && 
              !translation.startsWith('=GOOGLETRANSLATE') &&
              translation.length > 0) {
            translations[slideId][code] = translation;
            console.log(`📝 Slide ${slideNumber} ${name}: "${translation}"`);
          }
        });
        
        validRowCount++;
      }
      
      console.log(`✅ Processed ${validRowCount} slides with CORRECT structure`);
      console.log(`🌍 Available languages: ${languageColumns.map(l => l.code).join(', ')}`);
      
      if (validRowCount === 0) {
        throw new Error('No valid translation data found. Please check the file has the correct structure.');
      }
      
      if (Object.keys(translations).length === 0) {
        throw new Error('No translations extracted. Please verify the XLSX has separate language columns.');
      }
      
      // Call the import callback with processed data
      onImport(file, translations);
      
      console.log(`✅ XLSX import completed with CORRECT structure: ${Object.keys(translations).length} slides, ${languageColumns.length} languages`);
      
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

  // Parse CSV line with proper quote handling
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

  // ENHANCED: Map language names to codes EXACTLY as shown in user's image
  const mapLanguageNameToCode = (languageName: string): string | null => {
    const mapping: Record<string, string> = {
      // EXACT matches from user's image structure showing separate columns
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
      
      // Language codes as-is
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
              Expected: Slide | English | Dutch | Spanish | French...
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
      
      {/* ENHANCED: Instructions with CORRECT format example */}
      <div className="p-4 bg-blue-500/10 rounded border border-blue-500/20">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-blue-300 text-sm">
            <p className="font-medium mb-1">✅ CORRECT XLSX Structure:</p>
            <ul className="text-xs space-y-1 text-blue-200">
              <li>• Column A: <strong>Slide</strong> (slide numbers: 1, 2, 3...)</li>
              <li>• Column B: <strong>English</strong> (original text)</li>
              <li>• Column C: <strong>Dutch</strong> (translated text)</li>
              <li>• Column D: <strong>Spanish</strong> (translated text)</li>
              <li>• Column E: <strong>French</strong> (translated text), etc.</li>
              <li>• Each language in its own column - ONE row per slide</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* ENHANCED: Warning with WRONG format example */}
      <div className="p-3 bg-red-500/10 rounded border border-red-500/20">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="text-red-300 text-xs">
            <p className="font-medium mb-1">❌ WRONG Format (will be rejected):</p>
            <ul className="space-y-1 text-red-200">
              <li>• Headers like "Slide.English.Italian" in one cell</li>
              <li>• Multiple languages combined in single column</li>
              <li>• Merged cells or complex formatting</li>
              <li>• Missing separate language columns</li>
            </ul>
            <p className="mt-2 font-medium">
              ✅ Use separate columns for each language as shown above!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}