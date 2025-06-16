import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Search, Upload, CheckCircle, X, FileSpreadsheet, Languages, Eye } from 'lucide-react';
import XLSXImporter from './XLSXImporter';

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface LanguageSelectorProps {
  languages: Language[];
  selectedLanguages: string[];
  onSelectionChange: (selected: string[]) => void;
  maxSelection?: number;
  disabled?: boolean;
  onXLSXImport?: (file: File, translations: any) => void;
}

export default function LanguageSelector({
  languages,
  selectedLanguages,
  onSelectionChange,
  maxSelection = 0,
  disabled = false,
  onXLSXImport
}: LanguageSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showXLSXImporter, setShowXLSXImporter] = useState(false);

  // Filter languages based on search term
  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle language selection
  const toggleLanguage = (languageCode: string) => {
    if (disabled) return;

    const isSelected = selectedLanguages.includes(languageCode);
    let newSelection: string[];

    if (isSelected) {
      // Remove language
      newSelection = selectedLanguages.filter(code => code !== languageCode);
    } else {
      // Add language (check max selection)
      if (maxSelection > 0 && selectedLanguages.length >= maxSelection) {
        return; // Max limit reached
      }
      newSelection = [...selectedLanguages, languageCode];
    }

    onSelectionChange(newSelection);
  };

  // Select all filtered languages
  const selectAll = () => {
    if (disabled) return;

    const allFilteredCodes = filteredLanguages.map(lang => lang.code);
    const uniqueSelection = [...new Set([...selectedLanguages, ...allFilteredCodes])];
    
    // Apply max selection limit if specified
    const finalSelection = maxSelection > 0 
      ? uniqueSelection.slice(0, maxSelection)
      : uniqueSelection;

    onSelectionChange(finalSelection);
  };

  // Clear all selections
  const clearAll = () => {
    if (disabled) return;
    onSelectionChange([]);
  };

  // Handle XLSX import
  const handleXLSXImport = (file: File, translations: any) => {
    console.log('📊 LanguageSelector received XLSX import:', { file: file.name, translations });
    
    if (onXLSXImport) {
      onXLSXImport(file, translations);
    }
    
    setShowXLSXImporter(false);
  };

  return (
    <div className="space-y-4">
      {/* ENHANCED: Selected Languages Display - Shows what's currently selected */}
      {selectedLanguages.length > 0 && (
        <Card className="p-4 bg-black/40 backdrop-blur-sm border-green-500/20 border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <h4 className="text-green-400 font-medium">Selected Languages ({selectedLanguages.length})</h4>
            </div>
            <Button
              onClick={clearAll}
              disabled={disabled}
              size="sm"
              variant="outline"
              className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
            >
              <X className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {selectedLanguages.map(langCode => {
              const lang = languages.find(l => l.code === langCode);
              return lang ? (
                <Badge
                  key={langCode}
                  className="bg-green-500/20 text-green-300 border-green-500/30 cursor-pointer hover:bg-green-500/30 transition-colors"
                  onClick={() => toggleLanguage(langCode)}
                >
                  <span className="mr-2">{lang.flag}</span>
                  {lang.name}
                  <X className="w-3 h-3 ml-2 hover:text-red-400" />
                </Badge>
              ) : (
                <Badge
                  key={langCode}
                  className="bg-gray-500/20 text-gray-300 border-gray-500/30 cursor-pointer hover:bg-gray-500/30"
                  onClick={() => toggleLanguage(langCode)}
                >
                  {langCode.toUpperCase()}
                  <X className="w-3 h-3 ml-2 hover:text-red-400" />
                </Badge>
              );
            })}
          </div>
          
          {selectedLanguages.length > 0 && (
            <div className="mt-3 p-2 bg-green-500/10 rounded border border-green-500/20">
              <p className="text-green-300 text-xs">
                ✅ Ready for translation: {selectedLanguages.length} languages selected
                {maxSelection > 0 && ` (max ${maxSelection})`}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Search and Actions */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search languages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={disabled}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400"
          />
        </div>
        
        <Button
          onClick={selectAll}
          disabled={disabled || filteredLanguages.length === 0}
          size="sm"
          className="bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30 border"
        >
          <Languages className="w-4 h-4 mr-1" />
          Select All
        </Button>
        
        <Button
          onClick={() => setShowXLSXImporter(true)}
          disabled={disabled}
          size="sm"
          className="bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30 border"
        >
          <FileSpreadsheet className="w-4 h-4 mr-1" />
          Import XLSX
        </Button>
      </div>

      {/* Max Selection Warning */}
      {maxSelection > 0 && selectedLanguages.length >= maxSelection && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
          <p className="text-yellow-400 text-sm">
            Maximum selection limit reached ({maxSelection} languages). 
            Remove some languages to select others.
          </p>
        </div>
      )}

      {/* ENHANCED: Language Grid with Better Visual Feedback */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-80 overflow-y-auto smooth-scroll">
        {filteredLanguages.map(lang => {
          const isSelected = selectedLanguages.includes(lang.code);
          const isDisabled = disabled || (maxSelection > 0 && selectedLanguages.length >= maxSelection && !isSelected);
          
          return (
            <Button
              key={lang.code}
              onClick={() => toggleLanguage(lang.code)}
              disabled={isDisabled}
              size="sm"
              className={`
                justify-start text-left p-3 h-auto transition-all duration-200
                ${isSelected 
                  ? 'bg-green-500/20 border-green-500/50 text-green-300 hover:bg-green-500/30 shadow-lg shadow-green-500/20 scale-105' 
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                border
              `}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-lg">{lang.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{lang.name}</div>
                  <div className="text-xs opacity-70">{lang.code.toUpperCase()}</div>
                </div>
                {isSelected && (
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                )}
              </div>
            </Button>
          );
        })}
      </div>

      {/* No Results */}
      {filteredLanguages.length === 0 && searchTerm && (
        <div className="text-center py-8 text-gray-400">
          <Languages className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No languages found matching "{searchTerm}"</p>
        </div>
      )}

      {/* Selection Summary */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>
          {selectedLanguages.length} selected
          {maxSelection > 0 && ` of ${maxSelection} max`}
        </span>
        <span>
          {filteredLanguages.length} available
          {searchTerm && ` (filtered from ${languages.length})`}
        </span>
      </div>

      {/* XLSX Importer Modal */}
      {showXLSXImporter && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-black/90 backdrop-blur-md border-white/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Import XLSX Translations</h3>
                <Button
                  onClick={() => setShowXLSXImporter(false)}
                  size="sm"
                  variant="outline"
                  className="bg-gray-500/10 border-gray-500/30 text-gray-400"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <XLSXImporter onImport={handleXLSXImport} />
              
              <div className="mt-4 p-3 bg-blue-500/10 rounded border border-blue-500/20">
                <p className="text-blue-300 text-sm">
                  💡 Upload an XLSX file with translations to automatically detect and select languages.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}