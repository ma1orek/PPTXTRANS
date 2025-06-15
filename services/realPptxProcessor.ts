/**
 * Real PPTX Processor for PPTX Translator Pro
 * Handles actual PPTX file processing with JSZip
 * Extracts text, applies translations, and rebuilds files with preserved formatting
 */

import JSZip from 'jszip';

// Core interfaces - using unique naming to avoid conflicts
export interface PPTXSlideTextData {
  slideIndex: number;
  slideId: string;
  textElements: PPTXTextElement[];
  originalXml: string;
  modifiedXml?: string;
}

export interface PPTXTextElement {
  id: string;
  originalText: string;
  translatedText?: string;
  xmlPath: string;
  elementType: 'paragraph' | 'textRun' | 'shape' | 'title';
  styleInfo?: {
    fontFamily?: string;
    fontSize?: string;
    fontColor?: string;
    bold?: boolean;
    italic?: boolean;
  };
}

export interface PPTXTranslationData {
  slideId: string;
  language: string;
  translations: Record<string, string>;
  status: 'pending' | 'completed' | 'error';
}

export interface PPTXStructure {
  slides: PPTXSlideTextData[];
  relationships: Record<string, string>;
  contentTypes: string;
  appProperties: string;
  coreProperties: string;
  theme?: string;
  slideMasters?: string[];
  slideLayouts?: string[];
}

/**
 * Real PPTX Processor Class
 * Handles all PPTX file operations with authentic text extraction and formatting preservation
 */
export class RealPptxProcessor {
  private zip: JSZip | null = null;
  private structure: PPTXStructure | null = null;
  private originalSize: number = 0;

  constructor() {
    console.log('🔧 Initializing REAL PPTX Processor with JSZip...');
  }

  /**
   * Load and parse PPTX file
   */
  async loadPPTXFile(file: File): Promise<PPTXStructure> {
    console.log(`📂 Loading REAL PPTX file: ${file.name} (${Math.round(file.size/(1024*1024))}MB)`);
    
    this.originalSize = file.size;
    
    try {
      // Load file with JSZip
      const arrayBuffer = await file.arrayBuffer();
      this.zip = await JSZip.loadAsync(arrayBuffer);
      
      console.log('✅ PPTX ZIP structure loaded successfully');
      
      // Extract PPTX structure
      this.structure = await this.extractPPTXStructure();
      
      console.log(`📊 Extracted ${this.structure.slides.length} slides with REAL text elements`);
      
      return this.structure;
      
    } catch (error) {
      console.error('❌ Failed to load REAL PPTX file:', error);
      throw new Error(`Failed to load PPTX file: ${error}`);
    }
  }

  /**
   * Extract complete PPTX structure including slides, relationships, and metadata
   */
  private async extractPPTXStructure(): Promise<PPTXStructure> {
    if (!this.zip) {
      throw new Error('PPTX file not loaded');
    }

    console.log('🔍 Extracting REAL PPTX structure...');

    const structure: PPTXStructure = {
      slides: [],
      relationships: {},
      contentTypes: '',
      appProperties: '',
      coreProperties: ''
    };

    try {
      // Extract content types
      const contentTypesFile = this.zip.file('[Content_Types].xml');
      if (contentTypesFile) {
        structure.contentTypes = await contentTypesFile.async('text');
      }

      // Extract app properties
      const appPropsFile = this.zip.file('docProps/app.xml');
      if (appPropsFile) {
        structure.appProperties = await appPropsFile.async('text');
      }

      // Extract core properties
      const corePropsFile = this.zip.file('docProps/core.xml');
      if (corePropsFile) {
        structure.coreProperties = await corePropsFile.async('text');
      }

      // Extract presentation relationships
      const presRelsFile = this.zip.file('ppt/_rels/presentation.xml.rels');
      if (presRelsFile) {
        const relsXml = await presRelsFile.async('text');
        structure.relationships['presentation'] = relsXml;
      }

      // Extract theme
      const themeFile = this.zip.file('ppt/theme/theme1.xml');
      if (themeFile) {
        structure.theme = await themeFile.async('text');
      }

      // Extract slide masters
      structure.slideMasters = [];
      const slideMasterFiles = Object.keys(this.zip.files).filter(name => 
        name.startsWith('ppt/slideMasters/slideMaster') && name.endsWith('.xml')
      );
      
      for (const masterFile of slideMasterFiles) {
        const file = this.zip.file(masterFile);
        if (file) {
          const content = await file.async('text');
          structure.slideMasters.push(content);
        }
      }

      // Extract slide layouts
      structure.slideLayouts = [];
      const slideLayoutFiles = Object.keys(this.zip.files).filter(name => 
        name.startsWith('ppt/slideLayouts/slideLayout') && name.endsWith('.xml')
      );
      
      for (const layoutFile of slideLayoutFiles) {
        const file = this.zip.file(layoutFile);
        if (file) {
          const content = await file.async('text');
          structure.slideLayouts.push(content);
        }
      }

      // Extract slides with text content
      structure.slides = await this.extractSlidesWithText();

      console.log(`✅ REAL PPTX structure extracted: ${structure.slides.length} slides, ${structure.slideMasters?.length || 0} masters, ${structure.slideLayouts?.length || 0} layouts`);
      
      return structure;

    } catch (error) {
      console.error('❌ Failed to extract PPTX structure:', error);
      throw new Error(`Failed to extract PPTX structure: ${error}`);
    }
  }

  /**
   * Extract slides with text content
   */
  private async extractSlidesWithText(): Promise<PPTXSlideTextData[]> {
    if (!this.zip) {
      throw new Error('PPTX file not loaded');
    }

    const slides: PPTXSlideTextData[] = [];

    // Find all slide files
    const slideFiles = Object.keys(this.zip.files)
      .filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
      .sort((a, b) => {
        const aNum = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || '0');
        const bNum = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || '0');
        return aNum - bNum;
      });

    console.log(`🎞️ Processing ${slideFiles.length} REAL slides...`);

    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = slideFiles[i];
      const file = this.zip.file(slideFile);
      
      if (file) {
        try {
          const slideXml = await file.async('text');
          const slideNumber = i + 1;
          const slideId = `slide${slideNumber}`;
          
          console.log(`📄 Processing slide ${slideNumber}: ${slideFile}`);
          
          // Extract text elements from slide XML
          const textElements = this.extractTextElementsFromXML(slideXml, slideFile);
          
          const slideData: PPTXSlideTextData = {
            slideIndex: i,
            slideId: slideId,
            textElements: textElements,
            originalXml: slideXml
          };
          
          slides.push(slideData);
          
          console.log(`✅ Slide ${slideNumber}: extracted ${textElements.length} text elements`);
          
        } catch (error) {
          console.error(`❌ Failed to process slide ${i + 1}:`, error);
          // Continue with other slides
        }
      }
    }

    return slides;
  }

  /**
   * Extract text elements from slide XML with proper parsing
   */
  private extractTextElementsFromXML(xml: string, xmlPath: string): PPTXTextElement[] {
    const textElements: PPTXTextElement[] = [];
    
    try {
      // Parse XML to find text elements
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, 'text/xml');
      
      // Find all text runs (a:t elements)
      const textNodes = xmlDoc.querySelectorAll('a\\:t, t');
      
      textNodes.forEach((node, index) => {
        const textContent = node.textContent?.trim();
        
        if (textContent && textContent.length > 0) {
          // Get parent paragraph for context
          const paragraph = node.closest('a\\:p, p');
          const shape = node.closest('p\\:sp, sp');
          
          // Determine element type
          let elementType: PPTXTextElement['elementType'] = 'textRun';
          if (shape?.querySelector('p\\:nvSpPr p\\:cNvPr[name*="Title"], nvSpPr cNvPr[name*="Title"]')) {
            elementType = 'title';
          } else if (paragraph) {
            elementType = 'paragraph';
          } else if (shape) {
            elementType = 'shape';
          }

          // Extract style information
          const styleInfo = this.extractStyleInfo(node);
          
          const textElement: PPTXTextElement = {
            id: `${xmlPath}_text_${index}`,
            originalText: textContent,
            xmlPath: xmlPath,
            elementType: elementType,
            styleInfo: styleInfo
          };
          
          textElements.push(textElement);
        }
      });

      // Also look for placeholder text
      const placeholderNodes = xmlDoc.querySelectorAll('a\\:ph, ph');
      placeholderNodes.forEach((node, index) => {
        const textContent = node.textContent?.trim();
        if (textContent && textContent.length > 0) {
          const textElement: PPTXTextElement = {
            id: `${xmlPath}_placeholder_${index}`,
            originalText: textContent,
            xmlPath: xmlPath,
            elementType: 'paragraph'
          };
          
          textElements.push(textElement);
        }
      });

    } catch (error) {
      console.error('❌ Failed to parse slide XML:', error);
    }

    return textElements;
  }

  /**
   * Extract style information from text element
   */
  private extractStyleInfo(node: Element): PPTXTextElement['styleInfo'] {
    const styleInfo: PPTXTextElement['styleInfo'] = {};

    try {
      // Find parent text run properties
      const rPr = node.closest('a\\:r, r')?.querySelector('a\\:rPr, rPr');
      if (rPr) {
        // Font family
        const latinFont = rPr.querySelector('a\\:latin, latin');
        if (latinFont) {
          styleInfo.fontFamily = latinFont.getAttribute('typeface') || undefined;
        }

        // Font size
        const fontSize = rPr.getAttribute('sz');
        if (fontSize) {
          styleInfo.fontSize = fontSize;
        }

        // Font color
        const solidFill = rPr.querySelector('a\\:solidFill, solidFill');
        if (solidFill) {
          const colorElement = solidFill.firstElementChild;
          if (colorElement) {
            styleInfo.fontColor = colorElement.getAttribute('val') || colorElement.tagName;
          }
        }

        // Bold
        const bold = rPr.querySelector('a\\:b, b');
        if (bold) {
          styleInfo.bold = bold.getAttribute('val') !== '0';
        }

        // Italic
        const italic = rPr.querySelector('a\\:i, i');
        if (italic) {
          styleInfo.italic = italic.getAttribute('val') !== '0';
        }
      }
    } catch (error) {
      console.error('❌ Failed to extract style info:', error);
    }

    return styleInfo;
  }

  /**
   * Apply translations to PPTX structure
   */
  async applyTranslations(translations: Record<string, PPTXTranslationData>): Promise<void> {
    if (!this.structure) {
      throw new Error('PPTX structure not loaded');
    }

    console.log(`🌍 Applying REAL translations to ${Object.keys(translations).length} slides...`);

    try {
      for (const slide of this.structure.slides) {
        const slideTranslations = translations[slide.slideId];
        
        if (slideTranslations && slideTranslations.translations) {
          console.log(`📝 Applying translations to ${slide.slideId}...`);
          
          // Apply translations to text elements
          for (const textElement of slide.textElements) {
            const translation = slideTranslations.translations[textElement.originalText];
            if (translation) {
              textElement.translatedText = translation;
              console.log(`✅ Translated: "${textElement.originalText}" → "${translation}"`);
            }
          }

          // Modify slide XML with translations
          slide.modifiedXml = this.applyTranslationsToXML(slide.originalXml, slide.textElements);
        }
      }

      console.log('✅ All REAL translations applied successfully');

    } catch (error) {
      console.error('❌ Failed to apply translations:', error);
      throw new Error(`Failed to apply translations: ${error}`);
    }
  }

  /**
   * Apply translations to slide XML
   */
  private applyTranslationsToXML(originalXml: string, textElements: PPTXTextElement[]): string {
    let modifiedXml = originalXml;

    try {
      // Apply each translation
      for (const element of textElements) {
        if (element.translatedText) {
          // Simple text replacement - in production, use proper XML manipulation
          const escapedOriginal = this.escapeXml(element.originalText);
          const escapedTranslation = this.escapeXml(element.translatedText);
          
          // Replace in XML while preserving structure
          modifiedXml = modifiedXml.replace(
            new RegExp(`(<a:t[^>]*>)${escapedOriginal}(</a:t>)`, 'g'),
            `$1${escapedTranslation}$2`
          );
          
          // Also try without namespace
          modifiedXml = modifiedXml.replace(
            new RegExp(`(<t[^>]*>)${escapedOriginal}(</t>)`, 'g'),
            `$1${escapedTranslation}$2`
          );
        }
      }

    } catch (error) {
      console.error('❌ Failed to apply translations to XML:', error);
    }

    return modifiedXml;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Generate translated PPTX file
   */
  async generateTranslatedPPTX(language: string): Promise<Blob> {
    if (!this.zip || !this.structure) {
      throw new Error('PPTX not loaded or translations not applied');
    }

    console.log(`🔨 Generating REAL translated PPTX for language: ${language}`);

    try {
      // Create new ZIP for translated file
      const newZip = new JSZip();

      // Copy all original files first
      await this.copyOriginalFiles(newZip);

      // Replace slides with translated versions
      await this.replaceTranslatedSlides(newZip);

      // Generate the new PPTX file
      const pptxBlob = await newZip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6
        }
      });

      const finalSize = pptxBlob.size;
      const sizeRatio = (finalSize / this.originalSize * 100).toFixed(1);
      
      console.log(`✅ REAL translated PPTX generated: ${Math.round(finalSize/(1024*1024))}MB (${sizeRatio}% of original)`);
      
      return pptxBlob;

    } catch (error) {
      console.error('❌ Failed to generate translated PPTX:', error);
      throw new Error(`Failed to generate translated PPTX: ${error}`);
    }
  }

  /**
   * Copy all original files to new ZIP
   */
  private async copyOriginalFiles(newZip: JSZip): Promise<void> {
    if (!this.zip) return;

    console.log('📋 Copying original PPTX structure...');

    for (const [path, file] of Object.entries(this.zip.files)) {
      if (!file.dir && !path.startsWith('ppt/slides/slide')) {
        // Copy all non-slide files as-is
        const content = await file.async('arraybuffer');
        newZip.file(path, content);
      }
    }
  }

  /**
   * Replace slides with translated versions
   */
  private async replaceTranslatedSlides(newZip: JSZip): Promise<void> {
    if (!this.structure) return;

    console.log('🔄 Replacing slides with translated versions...');

    for (const slide of this.structure.slides) {
      const slideNumber = slide.slideIndex + 1;
      const slidePath = `ppt/slides/slide${slideNumber}.xml`;
      
      const xmlContent = slide.modifiedXml || slide.originalXml;
      newZip.file(slidePath, xmlContent);
      
      console.log(`✅ Replaced slide ${slideNumber} with translated version`);
    }
  }

  /**
   * Extract text for translation (simplified format for external translation)
   */
  getTextForTranslation(): Record<string, Record<string, string>> {
    if (!this.structure) {
      throw new Error('PPTX structure not loaded');
    }

    const textData: Record<string, Record<string, string>> = {};

    for (const slide of this.structure.slides) {
      const slideTexts: Record<string, string> = {};
      
      slide.textElements.forEach((element, index) => {
        if (element.originalText.trim()) {
          slideTexts[`text_${index}`] = element.originalText;
        }
      });
      
      if (Object.keys(slideTexts).length > 0) {
        textData[slide.slideId] = slideTexts;
      }
    }

    return textData;
  }

  /**
   * Get processing statistics
   */
  getProcessingStats() {
    if (!this.structure) {
      return {
        slidesCount: 0,
        textElementsCount: 0,
        originalSize: this.originalSize,
        hasTranslations: false
      };
    }

    const textElementsCount = this.structure.slides.reduce((total, slide) => 
      total + slide.textElements.length, 0
    );

    const hasTranslations = this.structure.slides.some(slide => 
      slide.textElements.some(element => !!element.translatedText)
    );

    return {
      slidesCount: this.structure.slides.length,
      textElementsCount,
      originalSize: this.originalSize,
      hasTranslations
    };
  }
}

// Export singleton instance for use throughout the app - FIXED CASING
export const realPptxProcessor = new RealPptxProcessor();

// Export main interface types again to ensure they're available
export type { PPTXSlideTextData as SlideTextData, PPTXTextElement as TextElement, PPTXTranslationData as TranslationData, PPTXStructure };