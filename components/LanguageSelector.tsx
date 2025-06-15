import React from 'react';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
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
  maxSelection = 5,
  disabled = false
}: LanguageSelectorProps) {
  const { t } = useTranslation();

  const handleLanguageToggle = (languageCode: string) => {
    if (disabled) return;
    
    if (selectedLanguages.includes(languageCode)) {
      // Remove language
      onSelectionChange(selectedLanguages.filter(code => code !== languageCode));
    } else if (selectedLanguages.length < maxSelection) {
      // Add language
      onSelectionChange([...selectedLanguages, languageCode]);
    }
  };

  const isLanguageDisabled = (languageCode: string) => {
    return disabled || (!selectedLanguages.includes(languageCode) && selectedLanguages.length >= maxSelection);
  };

  return (
    <div className="space-y-4">
      {/* Selection Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Select up to {maxSelection} target languages
        </p>
        <Badge 
          variant="outline" 
          className={`${
            selectedLanguages.length >= maxSelection 
              ? 'border-green-500/50 text-green-400' 
              : 'border-blue-500/50 text-blue-400'
          }`}
        >
          {selectedLanguages.length}/{maxSelection}
        </Badge>
      </div>

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
                  className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs py-1 px-2"
                >
                  <span className="mr-1">{language.flag}</span>
                  {language.name}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Max Selection Warning */}
      {selectedLanguages.length >= maxSelection && (
        <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-400 text-xs">
            Maximum {maxSelection} languages selected. Unselect a language to choose a different one.
          </p>
        </div>
      )}

      {/* Disabled State Info */}
      {disabled && (
        <div className="p-2 bg-gray-500/10 border border-gray-500/30 rounded-lg">
          <p className="text-gray-400 text-xs">
            Language selection is disabled during translation process.
          </p>
        </div>
      )}
    </div>
  );
}