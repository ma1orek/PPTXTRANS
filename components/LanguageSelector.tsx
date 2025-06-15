import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Card } from './ui/card';
import { FileSpreadsheet, CheckSquare, Square, Globe, Upload, Languages } from 'lucide-react';
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
  maxSelection?: number; // 0 = no limit
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
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set(['European Languages']));
  const [showImporter, setShowImporter] = useState(false);

  // Group languages by region
  const languageGroups = {
    'European Languages': languages.filter(lang => 
      ['pl', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'sv', 'no', 'da', 'fi', 'is', 'cs', 'sk', 'hu', 'ro', 'bg', 'hr', 'sl', 'lt', 'lv', 'et', 'mt', 'ga', 'cy', 'eu', 'ca', 'gl'].includes(lang.code)
    ),
    'Slavic Languages': languages.filter(lang => 
      ['ru', 'uk', 'be', 'sr', 'bs', 'mk'].includes(lang.code)
    ),
    'Asian Languages': languages.filter(lang => 
      ['ja', 'ko', 'zh', 'zh-tw', 'hi', 'bn', 'ur', 'pa', 'gu', 'ta', 'te', 'kn', 'ml', 'th', 'vi', 'id', 'ms', 'tl'].includes(lang.code)
    ),
    'Middle Eastern & African': languages.filter(lang => 
      ['ar', 'he', 'fa', 'tr', 'az', 'ka', 'hy', 'sw', 'af', 'am'].includes(lang.code)
    ),
    'Other Languages': languages.filter(lang => 
      ['el', 'eo', 'la'].includes(lang.code)
    )
  };

  // Filter languages based on search
  const filteredGroups = Object.entries(languageGroups).reduce((acc, [region, langs]) => {
    const filtered = langs.filter(lang =>
      lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filtered.length > 0) {
      acc[region] = filtered;
    }
    
    return acc;
  }, {} as Record<string, Language[]>);

  const handleLanguageToggle = (langCode: string) => {
    if (disabled) return;
    
    const isSelected = selectedLanguages.includes(langCode);
    
    if (isSelected) {
      // Remove language
      onSelectionChange(selectedLanguages.filter(code => code !== langCode));
    } else {
      // Add language (check limit)
      if (maxSelection > 0 && selectedLanguages.length >= maxSelection) {
        alert(`Maximum ${maxSelection} languages can be selected.`);
        return;
      }
      onSelectionChange([...selectedLanguages, langCode]);
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    
    if (maxSelection > 0) {
      // Limited selection - take first maxSelection languages
      const allVisible = Object.values(filteredGroups).flat();
      const toSelect = allVisible.slice(0, maxSelection).map(lang => lang.code);
      onSelectionChange(toSelect);
    } else {
      // No limit - select all filtered languages
      const allVisible = Object.values(filteredGroups).flat().map(lang => lang.code);
      onSelectionChange(allVisible);
    }
  };

  const handleDeselectAll = () => {
    if (disabled) return;
    onSelectionChange([]);
  };

  const toggleRegion = (region: string) => {
    const newExpanded = new Set(expandedRegions);
    if (newExpanded.has(region)) {
      newExpanded.delete(region);
    } else {
      newExpanded.add(region);
    }
    setExpandedRegions(newExpanded);
  };

  const handleXLSXImportSuccess = (file: File, translations: any) => {
    setShowImporter(false);
    if (onXLSXImport) {
      onXLSXImport(file, translations);
    }
  };

  const totalVisible = Object.values(filteredGroups).flat().length;
  const selectedCount = selectedLanguages.length;

  return (
    <div className="space-y-4">
      {/* Controls Header */}
      <div className="flex flex-col gap-3">
        {/* Search & Import Controls */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search languages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            disabled={disabled}
          />
          
          <Button
            onClick={() => setShowImporter(!showImporter)}
            variant="outline"
            size="sm"
            className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 flex items-center gap-2"
            disabled={disabled}
          >
            <FileSpreadsheet className="w-4 h-4" />
            {showImporter ? 'Cancel' : 'Import XLSX'}
          </Button>
        </div>

        {/* XLSX Importer */}
        {showImporter && (
          <Card className="p-4 bg-black/20 border-green-500/20">
            <XLSXImporter
              onImportSuccess={handleXLSXImportSuccess}
              onCancel={() => setShowImporter(false)}
            />
          </Card>
        )}

        {/* Selection Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-2 py-1 text-xs">
              <Globe className="w-3 h-3 mr-1" />
              {selectedCount} of {totalVisible} selected
            </Badge>
            
            {maxSelection > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 px-2 py-1 text-xs">
                Limit: {maxSelection}
              </Badge>
            )}
            
            {maxSelection === 0 && (
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-2 py-1 text-xs">
                No Limits
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSelectAll}
              variant="outline"
              size="sm"
              className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 text-xs px-2 py-1"
              disabled={disabled || totalVisible === 0}
            >
              <CheckSquare className="w-3 h-3 mr-1" />
              Select {maxSelection > 0 ? `${Math.min(maxSelection, totalVisible)}` : 'All'}
            </Button>
            
            <Button
              onClick={handleDeselectAll}
              variant="outline"
              size="sm"
              className="bg-gray-500/10 border-gray-500/30 text-gray-400 hover:bg-gray-500/20 text-xs px-2 py-1"
              disabled={disabled || selectedCount === 0}
            >
              <Square className="w-3 h-3 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Language Groups */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {Object.entries(filteredGroups).map(([region, langs]) => (
          <div key={region} className="space-y-2">
            {/* Region Header */}
            <button
              onClick={() => toggleRegion(region)}
              className="flex items-center justify-between w-full px-3 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-sm"
              disabled={disabled}
            >
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-gray-400" />
                <span className="text-white font-medium">{region}</span>
                <Badge className="bg-white/10 text-gray-300 text-xs">
                  {langs.length}
                </Badge>
              </div>
              <div className="text-gray-400">
                {expandedRegions.has(region) ? '▼' : '▶'}
              </div>
            </button>

            {/* Region Languages */}
            {expandedRegions.has(region) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pl-4">
                {langs.map(language => {
                  const isSelected = selectedLanguages.includes(language.code);
                  
                  return (
                    <div
                      key={language.code}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer
                        ${isSelected 
                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-200' 
                          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      onClick={() => handleLanguageToggle(language.code)}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={disabled}
                        className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                      />
                      
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-lg flex-shrink-0">{language.flag}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{language.name}</div>
                          <div className="text-xs text-gray-500">{language.code}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* No Results Message */}
      {totalVisible === 0 && searchTerm && (
        <div className="text-center py-8 text-gray-400">
          <Languages className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No languages found for "{searchTerm}"</p>
          <p className="text-xs mt-1">Try searching by language name or code</p>
        </div>
      )}

      {/* Selection Summary */}
      {selectedCount > 0 && (
        <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-300 text-sm font-medium">Selected Languages:</span>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
              {selectedCount} selected
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {selectedLanguages.map(langCode => {
              const lang = languages.find(l => l.code === langCode);
              return lang ? (
                <Badge 
                  key={langCode}
                  className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs flex items-center gap-1"
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}