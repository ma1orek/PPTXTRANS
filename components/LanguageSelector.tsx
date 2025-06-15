import React from 'react';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { useTranslation } from '../hooks/useTranslation';

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface LanguageSelectorProps {
  languages: Language[];
  selectedLanguages: string[];
  onSelectionChange: (languages: string[]) => void;
  maxSelection?: number;
  disabled?: boolean;
}

export default function LanguageSelector({
  languages,
  selectedLanguages,
  onSelectionChange,
  maxSelection = 0, // 0 means no limit
  disabled = false
}: LanguageSelectorProps) {
  const { t } = useTranslation();

  const handleLanguageToggle = (languageCode: string) => {
    if (disabled) return;
    
    if (selectedLanguages.includes(languageCode)) {
      // Remove language
      onSelectionChange(selectedLanguages.filter(code => code !== languageCode));
    } else if (maxSelection === 0 || selectedLanguages.length < maxSelection) {
      // Add language (no limit if maxSelection is 0)
      onSelectionChange([...selectedLanguages, languageCode]);
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    
    if (selectedLanguages.length === languages.length) {
      // Deselect all
      onSelectionChange([]);
    } else {
      // Select all
      onSelectionChange(languages.map(lang => lang.code));
    }
  };

  const isLanguageDisabled = (languageCode: string) => {
    return disabled || (maxSelection > 0 && !selectedLanguages.includes(languageCode) && selectedLanguages.length >= maxSelection);
  };

  const allSelected = selectedLanguages.length === languages.length;
  const noneSelected = selectedLanguages.length === 0;

  return (
    <div className="space-y-4">
      {/* Selection Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-400">
            {maxSelection > 0 ? `Select up to ${maxSelection} languages` : 'Select target languages'}
          </p>
          {!disabled && (
            <Button
              onClick={handleSelectAll}
              variant="outline"
              size="sm"
              className="h-7 px-3 text-xs bg-white/5 border-white/20 hover:bg-white/10 text-white"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </Button>
          )}
        </div>
        
        <Badge 
          variant="outline" 
          className={`${
            maxSelection > 0 && selectedLanguages.length >= maxSelection 
              ? 'border-green-500/50 text-green-400' 
              : selectedLanguages.length > 0 
                ? 'border-blue-500/50 text-blue-400'
                : 'border-gray-500/50 text-gray-400'
          }`}
        >
          {maxSelection > 0 ? `${selectedLanguages.length}/${maxSelection}` : `${selectedLanguages.length} selected`}
        </Badge>
      </div>

      {/* Quick Selection Options */}
      {!disabled && (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => onSelectionChange(['pl', 'es', 'fr', 'de', 'it'])}
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs bg-white/5 border-white/20 hover:bg-white/10 text-white"
          >
            🇪🇺 European
          </Button>
          <Button
            onClick={() => onSelectionChange(['ja', 'ko', 'zh'])}
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs bg-white/5 border-white/20 hover:bg-white/10 text-white"
          >
            🌏 Asian
          </Button>
          <Button
            onClick={() => onSelectionChange(['es', 'pt'])}
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs bg-white/5 border-white/20 hover:bg-white/10 text-white"
          >
            🌎 Latin American
          </Button>
        </div>
      )}

      {/* Language Grid with Fixed Height and Scroll */}
      <div className="h-64 border border-white/10 rounded-lg bg-black/20 backdrop-blur-sm">
        <ScrollArea className="h-full p-2">
          <div className="grid grid-cols-2 gap-2 pr-3">
            {languages.map((language) => {
              const isSelected = selectedLanguages.includes(language.code);
              const isDisabled = isLanguageDisabled(language.code);

              return (
                <div
                  key={language.code}
                  onClick={() => handleLanguageToggle(language.code)}
                  className={`
                    flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer
                    ${isSelected
                      ? 'bg-blue-500/20 border-blue-500/50 shadow-md'
                      : isDisabled
                        ? 'bg-gray-800/30 border-gray-700/50 cursor-not-allowed opacity-50'
                        : 'bg-black/40 border-white/10 hover:bg-white/5 hover:border-white/20'
                    }
                  `}
                >
                  <Checkbox
                    checked={isSelected}
                    disabled={isDisabled}
                    className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                  />
                  
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span className="text-lg" role="img" aria-label={language.name}>
                      {language.flag}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        isSelected ? 'text-blue-100' : isDisabled ? 'text-gray-500' : 'text-white'
                      }`}>
                        {language.name}
                      </p>
                      <p className={`text-xs truncate ${
                        isSelected ? 'text-blue-300' : isDisabled ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {language.code.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Selected Languages Summary */}
      {selectedLanguages.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-400 mb-2">Selected for translation:</p>
          <div className="flex flex-wrap gap-2">
            {selectedLanguages.map((languageCode) => {
              const language = languages.find(lang => lang.code === languageCode);
              if (!language) return null;

              return (
                <Badge
                  key={languageCode}
                  className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs py-1 px-2 cursor-pointer hover:bg-blue-500/30"
                  onClick={() => handleLanguageToggle(languageCode)}
                >
                  <span className="mr-1">{language.flag}</span>
                  {language.name}
                  <span className="ml-1 hover:text-red-300">×</span>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Selection Warnings */}
      {maxSelection > 0 && selectedLanguages.length >= maxSelection && (
        <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-400 text-xs">
            Maximum {maxSelection} languages selected. Unselect a language to choose a different one.
          </p>
        </div>
      )}

      {/* Processing Info */}
      {disabled && (
        <div className="p-2 bg-gray-500/10 border border-gray-500/30 rounded-lg">
          <p className="text-gray-400 text-xs">
            Language selection is disabled during translation process.
          </p>
        </div>
      )}

      {/* Large Selection Warning */}
      {selectedLanguages.length > 10 && (
        <div className="p-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <p className="text-orange-400 text-xs">
            ⚠️ {selectedLanguages.length} languages selected. Large translations may take longer to process.
          </p>
        </div>
      )}
    </div>
  );
}