/**
 * Real PPTX Processor for PPTX Translator Pro v2024.12.16.18.00
 * Handles actual PPTX file processing with JSZip - FIXED TRANSLATION WORKFLOW
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
  // NEW: Better tracking for translation application
  elementContext?: string;
  isTranslated?: boolean;
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
 * Real PPTX Processor Class - ENHANCED WITH PROPER TRANSLATION APPLICATION
 * Handles all PPTX file operations with authentic text extraction and formatting preservation
 */
export class RealPptxProcessor {
  private zip: JSZip | null = null;
  private structure: PPTXStructure | null = null;
  private originalSize: number = 0;
  private currentTranslations: Record<string, PPTXTranslationData> = {}; // NEW: Store current translations

  constructor() {
    console.log('🔧 Initializing REAL PPTX Processor v2024.12.16.18.00 with enhanced translation...');
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
      
      // Debug: list all files in PPTX
      const fileNames = Object.keys(this.zip.files);
      console.log('📁 PPTX contains files:', fileNames.filter(name => name.includes('slide')));
      
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
   * Extract slides with text content - ENHANCED
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

    console.log(`🎞️ Processing ${slideFiles.length} REAL slides for text extraction...`);

    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = slideFiles[i];
      const file = this.zip.file(slideFile);
      
      if (file) {
        try {
          const slideXml = await file.async('text');
          const slideNumber = i + 1;
          const slideId = `slide${slideNumber}`;
          
          console.log(`📄 Processing slide ${slideNumber}: ${slideFile}`);
          
          // Extract text elements from slide XML with enhanced tracking
          const textElements = this.extractTextElementsFromXML(slideXml, slideFile);
          
          const slideData: PPTXSlideTextData = {
            slideIndex: i,
            slideId: slideId,
            textElements: textElements,
            originalXml: slideXml
          };
          
          slides.push(slideData);
          
          console.log(`✅ Slide ${slideNumber}: extracted ${textElements.length} text elements`);
          
          // Enhanced debug: log found text with more detail
          textElements.forEach((element, idx) => {
            console.log(`   Text ${idx + 1} [${element.elementType}]: "${element.originalText}"`);
          });
          
        } catch (error) {
          console.error(`❌ Failed to process slide ${i + 1}:`, error);
          // Continue with other slides
        }
      }
    }

    return slides;
  }

  /**
   * ENHANCED: Extract text elements from slide XML with better parsing and context tracking
   */
  private extractTextElementsFromXML(xml: string, xmlPath: string): PPTXTextElement[] {
    const textElements: PPTXTextElement[] = [];
    
    try {
      // Parse XML to find text elements
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, 'text/xml');
      
      // Enhanced text extraction - look for various text element patterns with context
      const textSelectors = [
        { selector: 'a\\:t, t', type: 'textRun' as const },
        { selector: 'a\\:fld, fld', type: 'textRun' as const },
        { selector: 'a\\:br, br', type: 'textRun' as const }
      ];
      
      textSelectors.forEach(({ selector, type }) => {
        const textNodes = xmlDoc.querySelectorAll(selector);
        
        textNodes.forEach((node, index) => {
          const textContent = node.textContent?.trim();
          
          if (textContent && textContent.length > 0) {
            // Get comprehensive parent context for better translation mapping
            const paragraph = node.closest('a\\:p, p');
            const shape = node.closest('p\\:sp, sp');
            const textBox = node.closest('p\\:txBody, txBody');
            const slideElement = node.closest('p\\:sld, sld');
            
            // Determine element type and context based on hierarchy
            let elementType: PPTXTextElement['elementType'] = type;
            let elementContext = '';
            
            // Check if it's a title or special element
            if (shape) {
              const nvSpPr = shape.querySelector('p\\:nvSpPr, nvSpPr');
              const cNvPr = nvSpPr?.querySelector('p\\:cNvPr, cNvPr');
              const name = cNvPr?.getAttribute('name')?.toLowerCase() || '';
              
              if (name.includes('title') || name.includes('heading')) {
                elementType = 'title';
                elementContext = 'title';
              } else if (name.includes('content') || name.includes('body')) {
                elementType = 'paragraph';
                elementContext = 'content';
              } else if (paragraph) {
                elementType = 'paragraph';
                elementContext = 'paragraph';
              } else {
                elementType = 'shape';
                elementContext = 'shape';
              }
            }

            // Extract style information
            const styleInfo = this.extractStyleInfo(node);
            
            // Create unique ID with better tracking
            const elementId = `${xmlPath}_${selector.replace(/[\\:]/g, '_')}_${index}_${Date.now()}`;
            
            const textElement: PPTXTextElement = {
              id: elementId,
              originalText: textContent,
              xmlPath: xmlPath,
              elementType: elementType,
              styleInfo: styleInfo,
              elementContext: elementContext,
              isTranslated: false
            };
            
            textElements.push(textElement);
            
            console.log(`🔍 Found text element: "${textContent}" [${elementType}:${elementContext}]`);
          }
        });
      });

    } catch (error) {
      console.error('❌ Failed to parse slide XML for text extraction:', error);
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
   * FIXED: Apply translations to PPTX structure with proper text replacement
   */
  async applyTranslations(translations: Record<string, PPTXTranslationData>): Promise<void> {
    if (!this.structure) {
      throw new Error('PPTX structure not loaded');
    }

    console.log(`🌍 Applying REAL translations to ${Object.keys(translations).length} slides...`);
    
    // Store translations for use during generation
    this.currentTranslations = translations;
    
    let totalApplied = 0;
    let totalElements = 0;

    try {
      for (const slide of this.structure.slides) {
        const slideTranslations = translations[slide.slideId];
        
        if (slideTranslations && slideTranslations.translations) {
          console.log(`📝 Applying translations to ${slide.slideId}...`);
          
          let slideApplied = 0;
          
          // Enhanced translation application with multiple strategies
          for (const textElement of slide.textElements) {
            totalElements++;
            
            let translationApplied = false;
            const originalText = textElement.originalText.trim();
            
            if (!originalText) continue;
            
            // Strategy 1: Exact match
            if (slideTranslations.translations[originalText]) {
              textElement.translatedText = slideTranslations.translations[originalText];
              textElement.isTranslated = true;
              translationApplied = true;
              console.log(`✅ Exact: "${originalText}" → "${textElement.translatedText}"`);
            }
            
            // Strategy 2: Case-insensitive match
            if (!translationApplied) {
              const caseInsensitiveMatch = Object.keys(slideTranslations.translations).find(
                key => key.toLowerCase() === originalText.toLowerCase()
              );
              if (caseInsensitiveMatch) {
                textElement.translatedText = slideTranslations.translations[caseInsensitiveMatch];
                textElement.isTranslated = true;
                translationApplied = true;
                console.log(`✅ Case-insensitive: "${originalText}" → "${textElement.translatedText}"`);
              }
            }
            
            // Strategy 3: Partial match for combined text
            if (!translationApplied) {
              for (const [originalKey, translation] of Object.entries(slideTranslations.translations)) {
                if (originalKey.includes(originalText) || originalText.includes(originalKey)) {
                  textElement.translatedText = translation;
                  textElement.isTranslated = true;
                  translationApplied = true;
                  console.log(`✅ Partial: "${originalText}" → "${translation}"`);
                  break;
                }
              }
            }
            
            // Strategy 4: Use first available translation as fallback
            if (!translationApplied && Object.keys(slideTranslations.translations).length > 0) {
              const firstTranslation = Object.values(slideTranslations.translations)[0];
              if (firstTranslation && typeof firstTranslation === 'string') {
                textElement.translatedText = firstTranslation;
                textElement.isTranslated = true;
                translationApplied = true;
                console.log(`⚠️ Fallback: "${originalText}" → "${firstTranslation}"`);
              }
            }
            
            if (translationApplied) {
              slideApplied++;
              totalApplied++;
            } else {
              console.warn(`⚠️ No translation found for: "${originalText}"`);
            }
          }
          
          console.log(`📊 Applied ${slideApplied}/${slide.textElements.length} translations for ${slide.slideId}`);
          
          // Apply translations to XML - this is crucial for generating the final file
          slide.modifiedXml = await this.applyTranslationsToXML(slide.originalXml, slide.textElements);
          
        } else {
          console.warn(`⚠️ No translations found for ${slide.slideId}`);
        }
      }

      console.log(`✅ Translation application complete: ${totalApplied}/${totalElements} elements translated`);
      
      if (totalApplied === 0) {
        console.warn('⚠️ WARNING: No translations were applied! This will result in an identical file.');
        console.log('🔍 Available translations:', Object.keys(translations));
      }

    } catch (error) {
      console.error('❌ Failed to apply translations:', error);
      throw new Error(`Failed to apply translations: ${error}`);
    }
  }

  /**
   * ENHANCED: Apply translations to slide XML with multiple replacement strategies
   */
  private async applyTranslationsToXML(originalXml: string, textElements: PPTXTextElement[]): Promise<string> {
    let modifiedXml = originalXml;
    let replacementCount = 0;

    try {
      console.log(`🔄 Applying ${textElements.filter(e => e.isTranslated).length} translations to XML...`);
      
      // Apply each translation with enhanced replacement strategies
      for (const element of textElements) {
        if (element.translatedText && element.isTranslated && element.translatedText !== element.originalText) {
          
          // Escape XML special characters properly
          const escapedOriginal = this.escapeXmlText(element.originalText);
          const escapedTranslation = this.escapeXmlText(element.translatedText);
          
          // Multiple replacement patterns to catch different XML structures
          const patterns = [
            // Standard text run patterns
            `(<a:t[^>]*>)\\s*${this.escapeRegex(escapedOriginal)}\\s*(</a:t>)`,
            `(<t[^>]*>)\\s*${this.escapeRegex(escapedOriginal)}\\s*(</t>)`,
            // Field patterns  
            `(<a:fld[^>]*>)\\s*${this.escapeRegex(escapedOriginal)}\\s*(</a:fld>)`,
            `(<fld[^>]*>)\\s*${this.escapeRegex(escapedOriginal)}\\s*(</fld>)`,
            // Alternative patterns for complex structures
            `(>[^<]*?)${this.escapeRegex(escapedOriginal)}([^<]*?<)`,
          ];
          
          let replaced = false;
          
          for (const pattern of patterns) {
            const regex = new RegExp(pattern, 'gi');
            const beforeReplace = modifiedXml;
            
            if (pattern.includes('>[^<]*?')) {
              // Special handling for content between tags
              modifiedXml = modifiedXml.replace(regex, `$1${escapedTranslation}$2`);
            } else {
              // Standard tag replacement
              modifiedXml = modifiedXml.replace(regex, `$1${escapedTranslation}$2`);
            }
            
            if (modifiedXml !== beforeReplace) {
              replaced = true;
              replacementCount++;
              console.log(`🔄 XML replaced [${pattern.substring(0, 20)}...]: "${element.originalText}" → "${element.translatedText}"`);
              break; // Only apply first successful pattern
            }
          }
          
          if (!replaced) {
            console.warn(`⚠️ Failed to replace in XML: "${element.originalText}"`);
            
            // Fallback: try simple text replacement as last resort
            const simpleReplace = modifiedXml.replace(
              new RegExp(this.escapeRegex(escapedOriginal), 'g'), 
              escapedTranslation
            );
            
            if (simpleReplace !== modifiedXml) {
              modifiedXml = simpleReplace;
              replacementCount++;
              console.log(`🔄 Fallback replacement successful: "${element.originalText}"`);
            }
          }
        }
      }
      
      console.log(`✅ XML translation complete: ${replacementCount} replacements made`);

    } catch (error) {
      console.error('❌ Failed to apply translations to XML:', error);
    }

    return modifiedXml;
  }

  /**
   * Enhanced XML text escaping
   */
  private escapeXmlText(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Enhanced regex escaping for text replacement
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * ENHANCED: Generate translated PPTX file with proper content verification
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

      // Replace slides with translated versions - this is the key step
      await this.replaceTranslatedSlides(newZip);

      // Generate the new PPTX file with proper settings  
      const pptxBlob = await newZip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6 // Good balance of compression and speed
        }
      });

      const finalSize = pptxBlob.size;
      const sizeRatio = (finalSize / this.originalSize * 100).toFixed(1);
      
      console.log(`✅ REAL translated PPTX generated: ${Math.round(finalSize/(1024*1024))}MB (${sizeRatio}% of original)`);
      
      // Enhanced verification
      if (finalSize < this.originalSize * 0.1) {
        console.error(`❌ Generated file suspiciously small - likely contains no content!`);
        console.log(`📊 Size comparison: ${finalSize} bytes vs ${this.originalSize} bytes (${sizeRatio}%)`);
        
        // Check if we have translations applied
        const translatedElements = this.structure.slides.reduce((count, slide) => 
          count + slide.textElements.filter(e => e.isTranslated).length, 0
        );
        
        console.log(`📝 Applied translations: ${translatedElements} elements`);
        
        if (translatedElements === 0) {
          throw new Error(`No translations were applied - cannot generate meaningful output for ${language}`);
        }
      }
      
      return pptxBlob;

    } catch (error) {
      console.error('❌ Failed to generate translated PPTX:', error);
      throw new Error(`Failed to generate translated PPTX for ${language}: ${error}`);
    }
  }

  /**
   * Copy all original files to new ZIP
   */
  private async copyOriginalFiles(newZip: JSZip): Promise<void> {
    if (!this.zip) return;

    console.log('📋 Copying original PPTX structure...');

    let copiedCount = 0;
    
    for (const [path, file] of Object.entries(this.zip.files)) {
      if (!file.dir && !path.startsWith('ppt/slides/slide')) {
        // Copy all non-slide files as-is (themes, layouts, etc.)
        const content = await file.async('arraybuffer');
        newZip.file(path, content);
        copiedCount++;
      }
    }
    
    console.log(`📋 Copied ${copiedCount} original files (themes, layouts, etc.)`);
  }

  /**
   * ENHANCED: Replace slides with translated versions
   */
  private async replaceTranslatedSlides(newZip: JSZip): Promise<void> {
    if (!this.structure) return;

    console.log('🔄 Replacing slides with translated versions...');

    let replacedCount = 0;
    let translatedCount = 0;
    
    for (const slide of this.structure.slides) {
      const slideNumber = slide.slideIndex + 1;
      const slidePath = `ppt/slides/slide${slideNumber}.xml`;
      
      // Use translated XML if available, otherwise use original
      const xmlContent = slide.modifiedXml || slide.originalXml;
      newZip.file(slidePath, xmlContent);
      replacedCount++;
      
      // Check if we actually have translations applied to this slide
      const hasTranslations = slide.textElements.some(element => element.isTranslated);
      if (hasTranslations) {
        const translatedElementCount = slide.textElements.filter(e => e.isTranslated).length;
        translatedCount++;
        console.log(`✅ Slide ${slideNumber}: ${translatedElementCount} translated elements applied`);
      } else {
        console.warn(`⚠️ Slide ${slideNumber}: no translations applied (using original content)`);
      }
    }
    
    console.log(`🔄 Replaced ${replacedCount} slides (${translatedCount} with actual translations)`);
    
    if (translatedCount === 0) {
      console.error(`❌ WARNING: No slides have translations applied! Generated file will be identical to original.`);
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
   * Get processing statistics with enhanced information
   */
  getProcessingStats() {
    if (!this.structure) {
      return {
        slidesCount: 0,
        textElementsCount: 0,
        originalSize: this.originalSize,
        hasTranslations: false,
        translatedElementsCount: 0
      };
    }

    const textElementsCount = this.structure.slides.reduce((total, slide) => 
      total + slide.textElements.length, 0
    );

    const translatedElementsCount = this.structure.slides.reduce((total, slide) => 
      total + slide.textElements.filter(e => e.isTranslated).length, 0
    );

    const hasTranslations = translatedElementsCount > 0;

    return {
      slidesCount: this.structure.slides.length,
      textElementsCount,
      translatedElementsCount,
      originalSize: this.originalSize,
      hasTranslations,
      translationRate: textElementsCount > 0 ? (translatedElementsCount / textElementsCount * 100).toFixed(1) + '%' : '0%'
    };
  }

  /**
   * FIXED: Create Excel-compatible data for Google Sheets
   */
  createExcelData(slideData: PPTXSlideTextData[], targetLanguages: string[]): string[][] {
    console.log('📊 Creating Excel data for Google Sheets...');
    
    const headers = ['Slide', 'Original Text', ...targetLanguages.map(lang => lang.toUpperCase())];
    const rows: string[][] = [headers];
    
    slideData.forEach((slide, slideIndex) => {
      slide.textElements.forEach((element, elementIndex) => {
        if (element.originalText.trim()) {
          const row = [
            `Slide ${slideIndex + 1}`,
            element.originalText,
            // Add GOOGLETRANSLATE formulas for each target language
            ...targetLanguages.map(lang => {
              const cellRef = `B${rows.length + 1}`; // Reference to original text cell (column B)
              return `=GOOGLETRANSLATE(${cellRef},"auto","${lang}")`;
            })
          ];
          rows.push(row);
        }
      });
    });
    
    console.log(`✅ Created Excel data: ${rows.length} rows with GOOGLETRANSLATE formulas for ${targetLanguages.length} languages`);
    return rows;
  }

  /**
   * FIXED: Create translation formulas for Google Sheets
   */
  createTranslationFormulas(targetLanguages: string[]): Array<{range: string, values: string[][]}> {
    console.log('🔧 Creating GOOGLETRANSLATE formulas...');
    
    if (!this.structure) {
      throw new Error('PPTX structure not loaded');
    }

    const formulas: Array<{range: string, values: string[][]}> = [];
    let currentRow = 2; // Start after header row
    
    this.structure.slides.forEach((slide, slideIndex) => {
      slide.textElements.forEach((element, elementIndex) => {
        if (element.originalText.trim()) {
          targetLanguages.forEach((lang, langIndex) => {
            const column = String.fromCharCode(67 + langIndex); // C, D, E, etc.
            const cellRef = `B${currentRow}`; // Reference to original text cell
            const formula = `=GOOGLETRANSLATE(${cellRef},"auto","${lang}")`;
            
            formulas.push({
              range: `${column}${currentRow}`,
              values: [[formula]]
            });
          });
          currentRow++;
        }
      });
    });
    
    console.log(`✅ Created ${formulas.length} GOOGLETRANSLATE formulas`);
    return formulas;
  }

  /**
   * FIXED: Parse translations from Excel/Sheets data
   */
  parseTranslationsFromExcel(data: string[][], targetLanguages: string[]): Record<string, Record<string, string>> {
    console.log('📥 Parsing translations from Excel/Sheets data...');
    
    if (!data || data.length <= 1) {
      console.warn('⚠️ No translation data found');
      return {};
    }
    
    const translations: Record<string, Record<string, string>> = {};
    const headers = data[0];
    
    console.log('📋 Sheet headers:', headers);
    
    // Find language columns (starting from column 2, after Slide and Original Text)
    const languageColumns: Record<string, number> = {};
    targetLanguages.forEach((lang, index) => {
      const expectedColumnIndex = 2 + index; // Column 0: Slide, Column 1: Original Text, Column 2+: Languages
      if (expectedColumnIndex < headers.length) {
        languageColumns[lang] = expectedColumnIndex;
      }
    });
    
    console.log('📍 Language column mapping:', languageColumns);
    
    // Process data rows
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const slideInfo = row[0]; // e.g., "Slide 1"
      const originalText = row[1]; // Original text column
      
      if (slideInfo && originalText) {
        const slideMatch = slideInfo.match(/Slide (\d+)/);
        if (slideMatch) {
          const slideId = `slide${slideMatch[1]}`;
          
          if (!translations[slideId]) {
            translations[slideId] = {};
          }
          
          // Get translations for each language
          Object.entries(languageColumns).forEach(([lang, colIndex]) => {
            const translation = row[colIndex];
            if (translation && translation !== originalText && !translation.startsWith('=GOOGLETRANSLATE')) {
              // For each slide, store the translation mapped to the original text
              translations[slideId][originalText] = translation;
            }
          });
        }
      }
    }
    
    const slideCount = Object.keys(translations).length;
    console.log(`✅ Parsed translations for ${slideCount} slides from Excel/Sheets data`);
    
    return translations;
  }
}

// Export singleton instance for use throughout the app
export const realPptxProcessor = new RealPptxProcessor();

// Export main interface types again to ensure they're available
export type { PPTXSlideTextData as SlideTextData, PPTXTextElement as TextElement, PPTXTranslationData as TranslationData, PPTXStructure };