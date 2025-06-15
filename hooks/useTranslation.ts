import React, { useState, useCallback } from 'react';

// Translation keys and their values
const translations = {
  en: {
    // Main UI
    subtitle: 'Transform your PowerPoint presentations into multiple languages while preserving perfect formatting',
    selectPPTXFile: 'Select PPTX File',
    targetLanguages: 'Target Languages',
    translationStatus: 'Translation Status',
    downloadResults: 'Download Results',
    
    // File Upload
    dragPPTXHere: 'Drag your PPTX file here',
    clickToSelect: 'or click to select from your computer',
    supportedFormats: 'Supports .pptx and .ppt files up to 50MB',
    pleaseSelectPowerPoint: 'Please select a valid PowerPoint file (.pptx or .ppt)',
    startTranslation: 'Start Translation',
    
    // Language Selection
    selectMaxLanguages: 'Select up to 5 target languages',
    selectedLanguages: 'Selected Languages',
    selectAtLeastOneLanguage: 'Please select at least one target language',
    
    // Translation Progress
    pending: 'Pending',
    extractingText: 'Extracting Text',
    translationInProgress: 'Translating',
    rebuildingPPTX: 'Rebuilding PPTX',
    completed: 'Completed',
    error: 'Error',
    progress: 'Progress',
    targetLanguagesLabel: 'Target Languages',
    translationCompletedSuccessfully: 'Translation completed successfully!',
    generatedFiles: '{{count}} translated files generated',
    
    // Results
    downloadAll: 'Download All',
    translatedTo: 'Translated to {{count}} languages',
    summary: 'Summary',
    translatedPresentations: '{{count}} presentations translated into {{totalFiles}} files',
    filesReady: 'files ready',
    originalSize: 'Original: {{size}}MB',
    completedAt: 'Completed at {{time}}',
    
    // Features
    preserveFormattingTitle: 'Perfect Formatting',
    preserveFormattingDesc: 'All fonts, colors, layouts, and styling are preserved exactly as in the original',
    multilingualTitle: 'Multiple Languages',
    multilingualDesc: 'Translate to up to 5 languages simultaneously using Google Translate',
    noLimitsTitle: 'No File Limits',
    noLimitsDesc: 'Process presentations of any size directly through Google Drive integration'
  },
  pl: {
    // Main UI
    subtitle: 'Przekształć swoje prezentacje PowerPoint na wiele języków zachowując idealne formatowanie',
    selectPPTXFile: 'Wybierz plik PPTX',
    targetLanguages: 'Języki docelowe',
    translationStatus: 'Status tłumaczenia',
    downloadResults: 'Pobierz wyniki',
    
    // File Upload
    dragPPTXHere: 'Przeciągnij tutaj swój plik PPTX',
    clickToSelect: 'lub kliknij, aby wybrać z komputera',
    supportedFormats: 'Obsługuje pliki .pptx i .ppt do 50MB',
    pleaseSelectPowerPoint: 'Proszę wybrać prawidłowy plik PowerPoint (.pptx lub .ppt)',
    startTranslation: 'Rozpocznij tłumaczenie',
    
    // Language Selection
    selectMaxLanguages: 'Wybierz do 5 języków docelowych',
    selectedLanguages: 'Wybrane języki',
    selectAtLeastOneLanguage: 'Proszę wybrać co najmniej jeden język docelowy',
    
    // Translation Progress
    pending: 'Oczekuje',
    extractingText: 'Wyciąganie tekstu',
    translationInProgress: 'Tłumaczenie',
    rebuildingPPTX: 'Odbudowa PPTX',
    completed: 'Zakończone',
    error: 'Błąd',
    progress: 'Postęp',
    targetLanguagesLabel: 'Języki docelowe',
    translationCompletedSuccessfully: 'Tłumaczenie zakończone pomyślnie!',
    generatedFiles: 'Wygenerowano {{count}} przetłumaczonych plików',
    
    // Results
    downloadAll: 'Pobierz wszystko',
    translatedTo: 'Przetłumaczone na {{count}} języków',
    summary: 'Podsumowanie',
    translatedPresentations: '{{count}} prezentacji przetłumaczonych na {{totalFiles}} plików',
    filesReady: 'plików gotowych',
    originalSize: 'Oryginalny: {{size}}MB',
    completedAt: 'Zakończono o {{time}}',
    
    // Features
    preserveFormattingTitle: 'Idealne formatowanie',
    preserveFormattingDesc: 'Wszystkie czcionki, kolory, układy i style są zachowane dokładnie jak w oryginale',
    multilingualTitle: 'Wiele języków',
    multilingualDesc: 'Tłumacz na do 5 języków jednocześnie używając Google Translate',
    noLimitsTitle: 'Bez limitów plików',
    noLimitsDesc: 'Przetwarzaj prezentacje dowolnej wielkości bezpośrednio przez integrację z Google Drive'
  },
  es: {
    // Main UI
    subtitle: 'Transforma tus presentaciones de PowerPoint a múltiples idiomas manteniendo el formateo perfecto',
    selectPPTXFile: 'Seleccionar archivo PPTX',
    targetLanguages: 'Idiomas objetivo',
    translationStatus: 'Estado de traducción',
    downloadResults: 'Descargar resultados',
    
    // File Upload
    dragPPTXHere: 'Arrastra tu archivo PPTX aquí',
    clickToSelect: 'o haz clic para seleccionar de tu computadora',
    supportedFormats: 'Soporta archivos .pptx y .ppt hasta 50MB',
    pleaseSelectPowerPoint: 'Por favor selecciona un archivo válido de PowerPoint (.pptx o .ppt)',
    startTranslation: 'Iniciar traducción',
    
    // Language Selection
    selectMaxLanguages: 'Selecciona hasta 5 idiomas objetivo',
    selectedLanguages: 'Idiomas seleccionados',
    selectAtLeastOneLanguage: 'Por favor selecciona al menos un idioma objetivo',
    
    // Translation Progress
    pending: 'Pendiente',
    extractingText: 'Extrayendo texto',
    translationInProgress: 'Traduciendo',
    rebuildingPPTX: 'Reconstruyendo PPTX',
    completed: 'Completado',
    error: 'Error',
    progress: 'Progreso',
    targetLanguagesLabel: 'Idiomas objetivo',
    translationCompletedSuccessfully: '¡Traducción completada exitosamente!',
    generatedFiles: '{{count}} archivos traducidos generados',
    
    // Results
    downloadAll: 'Descargar todo',
    translatedTo: 'Traducido a {{count}} idiomas',
    summary: 'Resumen',
    translatedPresentations: '{{count}} presentaciones traducidas en {{totalFiles}} archivos',
    filesReady: 'archivos listos',
    originalSize: 'Original: {{size}}MB',
    completedAt: 'Completado a las {{time}}',
    
    // Features
    preserveFormattingTitle: 'Formateo perfecto',
    preserveFormattingDesc: 'Todas las fuentes, colores, diseños y estilos se preservan exactamente como en el original',
    multilingualTitle: 'Múltiples idiomas',
    multilingualDesc: 'Traduce hasta 5 idiomas simultáneamente usando Google Translate',
    noLimitsTitle: 'Sin límites de archivo',
    noLimitsDesc: 'Procesa presentaciones de cualquier tamaño directamente a través de la integración con Google Drive'
  },
  fr: {
    // Main UI
    subtitle: 'Transformez vos présentations PowerPoint en plusieurs langues en préservant le formatage parfait',
    selectPPTXFile: 'Sélectionner fichier PPTX',
    targetLanguages: 'Langues cibles',
    translationStatus: 'Statut de traduction',
    downloadResults: 'Télécharger les résultats',
    
    // File Upload
    dragPPTXHere: 'Glissez votre fichier PPTX ici',
    clickToSelect: 'ou cliquez pour sélectionner depuis votre ordinateur',
    supportedFormats: 'Supporte les fichiers .pptx et .ppt jusqu\'à 50MB',
    pleaseSelectPowerPoint: 'Veuillez sélectionner un fichier PowerPoint valide (.pptx ou .ppt)',
    startTranslation: 'Commencer la traduction',
    
    // Language Selection
    selectMaxLanguages: 'Sélectionnez jusqu\'à 5 langues cibles',
    selectedLanguages: 'Langues sélectionnées',
    selectAtLeastOneLanguage: 'Veuillez sélectionner au moins une langue cible',
    
    // Translation Progress
    pending: 'En attente',
    extractingText: 'Extraction du texte',
    translationInProgress: 'Traduction',
    rebuildingPPTX: 'Reconstruction PPTX',
    completed: 'Terminé',
    error: 'Erreur',
    progress: 'Progrès',
    targetLanguagesLabel: 'Langues cibles',
    translationCompletedSuccessfully: 'Traduction terminée avec succès!',
    generatedFiles: '{{count}} fichiers traduits générés',
    
    // Results
    downloadAll: 'Tout télécharger',
    translatedTo: 'Traduit en {{count}} langues',
    summary: 'Résumé',
    translatedPresentations: '{{count}} présentations traduites en {{totalFiles}} fichiers',
    filesReady: 'fichiers prêts',
    originalSize: 'Original: {{size}}MB',
    completedAt: 'Terminé à {{time}}',
    
    // Features
    preserveFormattingTitle: 'Formatage parfait',
    preserveFormattingDesc: 'Toutes les polices, couleurs, mises en page et styles sont préservés exactement comme dans l\'original',
    multilingualTitle: 'Langues multiples',
    multilingualDesc: 'Traduisez jusqu\'à 5 langues simultanément en utilisant Google Translate',
    noLimitsTitle: 'Aucune limite de fichier',
    noLimitsDesc: 'Traitez des présentations de toute taille directement via l\'intégration Google Drive'
  },
  de: {
    // Main UI
    subtitle: 'Verwandeln Sie Ihre PowerPoint-Präsentationen in mehrere Sprachen unter Beibehaltung der perfekten Formatierung',
    selectPPTXFile: 'PPTX-Datei auswählen',
    targetLanguages: 'Zielsprachen',
    translationStatus: 'Übersetzungsstatus',
    downloadResults: 'Ergebnisse herunterladen',
    
    // File Upload
    dragPPTXHere: 'Ziehen Sie Ihre PPTX-Datei hierher',
    clickToSelect: 'oder klicken Sie, um von Ihrem Computer auszuwählen',
    supportedFormats: 'Unterstützt .pptx und .ppt Dateien bis zu 50MB',
    pleaseSelectPowerPoint: 'Bitte wählen Sie eine gültige PowerPoint-Datei (.pptx oder .ppt)',
    startTranslation: 'Übersetzung starten',
    
    // Language Selection
    selectMaxLanguages: 'Wählen Sie bis zu 5 Zielsprachen',
    selectedLanguages: 'Ausgewählte Sprachen',
    selectAtLeastOneLanguage: 'Bitte wählen Sie mindestens eine Zielsprache',
    
    // Translation Progress
    pending: 'Ausstehend',
    extractingText: 'Text extrahieren',
    translationInProgress: 'Übersetzen',
    rebuildingPPTX: 'PPTX wiederherstellen',
    completed: 'Abgeschlossen',
    error: 'Fehler',
    progress: 'Fortschritt',
    targetLanguagesLabel: 'Zielsprachen',
    translationCompletedSuccessfully: 'Übersetzung erfolgreich abgeschlossen!',
    generatedFiles: '{{count}} übersetzte Dateien generiert',
    
    // Results
    downloadAll: 'Alle herunterladen',
    translatedTo: 'Übersetzt in {{count}} Sprachen',
    summary: 'Zusammenfassung',
    translatedPresentations: '{{count}} Präsentationen in {{totalFiles}} Dateien übersetzt',
    filesReady: 'Dateien bereit',
    originalSize: 'Original: {{size}}MB',
    completedAt: 'Abgeschlossen um {{time}}',
    
    // Features
    preserveFormattingTitle: 'Perfekte Formatierung',
    preserveFormattingDesc: 'Alle Schriftarten, Farben, Layouts und Stile werden genau wie im Original beibehalten',
    multilingualTitle: 'Mehrere Sprachen',
    multilingualDesc: 'Übersetzen Sie bis zu 5 Sprachen gleichzeitig mit Google Translate',
    noLimitsTitle: 'Keine Dateibeschränkungen',
    noLimitsDesc: 'Verarbeiten Sie Präsentationen jeder Größe direkt über die Google Drive-Integration'
  }
};

type TranslationKey = keyof typeof translations.en;
type Language = keyof typeof translations;

export function useTranslation() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');

  const t = useCallback((key: TranslationKey, params?: Record<string, string>): string => {
    let translation = translations[currentLanguage]?.[key] || translations.en[key] || key;
    
    // Replace placeholders like {{count}} with actual values
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(new RegExp(`\\{\\{${param}\\}\\}`, 'g'), value);
      });
    }
    
    return translation;
  }, [currentLanguage]);

  const changeLanguage = useCallback((language: Language) => {
    setCurrentLanguage(language);
    // Optionally save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-language', language);
    }
  }, []);

  // Load language from localStorage on first render
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('app-language') as Language;
      if (savedLanguage && translations[savedLanguage]) {
        setCurrentLanguage(savedLanguage);
      }
    }
  }, []);

  return {
    t,
    currentLanguage,
    changeLanguage,
    availableLanguages: Object.keys(translations) as Language[]
  };
}

// Export types for use in components
export type { TranslationKey, Language };