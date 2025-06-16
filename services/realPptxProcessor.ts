// FIXED: Real PPTX Processor with ACTUAL text replacement
import JSZip from 'jszip';

export interface PPTXSlideTextData {
  slideIndex: number;
  slideId: string;
  textElements: Array<{
    elementId: string;
    originalText: string;
    xpath?: string;
    slideRelId?: string;
  }>;
}

export interface PPTXTranslationData {
  slideId: string;
  language: string;
  translations: Record<string, string>; // originalText -> translatedText
  status: 'pending' | 'completed' | 'error';
}

export interface PPTXStructure {
  slides: PPTXSlideTextData[];
  slideFiles: Record<string, string>; // slideId -> XML content
  originalZip: JSZip;
  contentTypes: string;
  relationships: string;
  app: string;
  core: string;
  slideRelationships: Record<string, string>; // slideId -> rels XML
}

class RealPPTXProcessor {
  private pptxStructure: PPTXStructure | null = null;
  private appliedTranslations: Record<string, PPTXTranslationData> = {};

  // FIXED: Load PPTX file with REAL XML parsing
  async loadPPTXFile(file: File): Promise<PPTXStructure> {
    try {
      console.log(`🔍 REAL PPTX Loading: ${file.name} (${Math.round(file.size/1024/1024)}MB)`);
      
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      
      console.log('📦 PPTX ZIP Contents:', Object.keys(zipContent.files));
      
      // Load core files
      const contentTypes = await this.getFileContent(zipContent, '[Content_Types].xml');
      const relationships = await this.getFileContent(zipContent, '_rels/.rels');
      const app = await this.getFileContent(zipContent, 'docProps/app.xml');
      const core = await this.getFileContent(zipContent, 'docProps/core.xml');
      
      // Find all slide files
      const slideFiles: Record<string, string> = {};
      const slideRelationships: Record<string, string> = {};
      const slides: PPTXSlideTextData[] = [];
      
      // ENHANCED: Find slides by scanning the ZIP contents
      const slideFilePattern = /^ppt\/slides\/slide(\d+)\.xml$/;
      const slideRelPattern = /^ppt\/slides\/_rels\/slide(\d+)\.xml\.rels$/;
      
      // Get slide files
      for (const fileName in zipContent.files) {
        const slideMatch = fileName.match(slideFilePattern);
        if (slideMatch) {
          const slideNumber = parseInt(slideMatch[1]);
          const slideId = `slide${slideNumber}`;
          const slideContent = await this.getFileContent(zipContent, fileName);
          slideFiles[slideId] = slideContent;
          
          console.log(`📄 Found slide: ${slideId} (${slideContent.length} chars)`);
          
          // Extract text from slide
          const textElements = this.extractTextFromSlideXML(slideContent, slideId, slideNumber);
          slides.push({
            slideIndex: slideNumber,
            slideId,
            textElements
          });
          
          // Get slide relationships if they exist
          const relFileName = `ppt/slides/_rels/slide${slideNumber}.xml.rels`;
          if (zipContent.files[relFileName]) {
            slideRelationships[slideId] = await this.getFileContent(zipContent, relFileName);
          }
        }
      }
      
      // Sort slides by index
      slides.sort((a, b) => a.slideIndex - b.slideIndex);
      
      console.log(`✅ REAL PPTX loaded: ${slides.length} slides, ${slides.reduce((sum, s) => sum + s.textElements.length, 0)} text elements`);
      
      this.pptxStructure = {
        slides,
        slideFiles,
        originalZip: zipContent,
        contentTypes,
        relationships,
        app,
        core,
        slideRelationships
      };
      
      return this.pptxStructure;
      
    } catch (error) {
      console.error('❌ REAL PPTX loading failed:', error);
      throw new Error(`Failed to load PPTX file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ENHANCED: Extract text from slide XML with better parsing
  private extractTextFromSlideXML(slideXML: string, slideId: string, slideNumber: number): Array<{
    elementId: string;
    originalText: string;
    xpath?: string;
    slideRelId?: string;
  }> {
    const textElements: Array<{
      elementId: string;
      originalText: string;
      xpath?: string;
      slideRelId?: string;
    }> = [];
    
    try {
      // ENHANCED: Extract text from <a:t> elements (actual text content)
      const textRegex = /<a:t[^>]*>([^<]+)<\/a:t>/g;
      let match;
      let elementIndex = 0;
      
      while ((match = textRegex.exec(slideXML)) !== null) {
        const textContent = match[1];
        
        // Skip empty or whitespace-only text
        if (textContent && textContent.trim().length > 0) {
          const cleanText = this.cleanExtractedText(textContent);
          
          if (cleanText.length > 0) {
            textElements.push({
              elementId: `${slideId}_text_${elementIndex}`,
              originalText: cleanText,
              xpath: `//a:t[${elementIndex + 1}]`,
              slideRelId: slideId
            });
            
            elementIndex++;
            console.log(`📝 Slide ${slideNumber} text ${elementIndex}: "${cleanText}"`);
          }
        }
      }
      
      // Also try to extract from paragraph runs (<a:r><a:t>)
      const runTextRegex = /<a:r[^>]*>.*?<a:t[^>]*>([^<]+)<\/a:t>.*?<\/a:r>/g;
      while ((match = runTextRegex.exec(slideXML)) !== null) {
        const textContent = match[1];
        
        if (textContent && textContent.trim().length > 0) {
          const cleanText = this.cleanExtractedText(textContent);
          
          // Avoid duplicates
          if (cleanText.length > 0 && !textElements.some(el => el.originalText === cleanText)) {
            textElements.push({
              elementId: `${slideId}_run_${elementIndex}`,
              originalText: cleanText,
              xpath: `//a:r/a:t[contains(text(),'${cleanText.substring(0, 20)}')]`,
              slideRelId: slideId
            });
            
            elementIndex++;
            console.log(`📝 Slide ${slideNumber} run text: "${cleanText}"`);
          }
        }
      }
      
      console.log(`✅ Slide ${slideNumber}: extracted ${textElements.length} text elements`);
      
    } catch (error) {
      console.error(`❌ Text extraction failed for slide ${slideNumber}:`, error);
    }
    
    return textElements;
  }

  // Clean extracted text
  private cleanExtractedText(text: string): string {
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .trim();
  }

  // Get file content from ZIP
  private async getFileContent(zip: JSZip, fileName: string): Promise<string> {
    const file = zip.files[fileName];
    if (!file) {
      throw new Error(`File not found in PPTX: ${fileName}`);
    }
    return await file.async('text');
  }

  // CRITICAL FIX: Apply translations with REAL text replacement
  async applyTranslations(translationsData: Record<string, PPTXTranslationData>): Promise<void> {
    if (!this.pptxStructure) {
      throw new Error('PPTX not loaded. Call loadPPTXFile first.');
    }

    console.log('🔄 APPLYING REAL TRANSLATIONS TO PPTX...');
    console.log('📊 Translation data keys:', Object.keys(translationsData));
    
    // Store applied translations
    this.appliedTranslations = { ...translationsData };
    
    // Apply translations to each slide
    for (const [slideId, translationData] of Object.entries(translationsData)) {
      if (this.pptxStructure.slideFiles[slideId]) {
        console.log(`🔄 Processing slide: ${slideId}`);
        console.log(`📝 Translations available:`, Object.keys(translationData.translations));
        
        // FIXED: Actually replace text in slide XML
        let modifiedSlideXML = this.pptxStructure.slideFiles[slideId];
        let replacementCount = 0;
        
        // Apply each translation
        for (const [originalText, translatedText] of Object.entries(translationData.translations)) {
          if (originalText && translatedText && originalText !== translatedText) {
            console.log(`🔄 Replacing: "${originalText}" → "${translatedText}"`);
            
            // ENHANCED: Multiple replacement strategies
            const replacements = [
              // Strategy 1: Direct text replacement in <a:t> tags
              {
                pattern: new RegExp(`(<a:t[^>]*>)${this.escapeRegex(originalText)}(<\/a:t>)`, 'g'),
                replacement: `$1${this.escapeXML(translatedText)}$2`
              },
              // Strategy 2: Replace in text content anywhere
              {
                pattern: new RegExp(`>${this.escapeRegex(originalText)}<`, 'g'),
                replacement: `>${this.escapeXML(translatedText)}<`
              },
              // Strategy 3: Replace exact text content
              {
                pattern: new RegExp(this.escapeRegex(originalText), 'g'),
                replacement: this.escapeXML(translatedText)
              }
            ];
            
            for (const { pattern, replacement } of replacements) {
              const beforeLength = modifiedSlideXML.length;
              modifiedSlideXML = modifiedSlideXML.replace(pattern, replacement);
              
              if (modifiedSlideXML.length !== beforeLength) {
                replacementCount++;
                console.log(`✅ Applied replacement strategy for: "${originalText}"`);
                break; // Stop after first successful replacement
              }
            }
          }
        }
        
        // Update slide content
        this.pptxStructure.slideFiles[slideId] = modifiedSlideXML;
        console.log(`✅ Slide ${slideId}: ${replacementCount} text replacements applied`);
        
      } else {
        console.warn(`⚠️ Slide not found: ${slideId}`);
      }
    }
    
    console.log('✅ ALL TRANSLATIONS APPLIED TO PPTX STRUCTURE');
  }

  // Escape text for regex
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Escape text for XML
  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // FIXED: Generate translated PPTX with REAL modified content
  async generateTranslatedPPTX(language: string): Promise<Blob> {
    if (!this.pptxStructure) {
      throw new Error('PPTX not loaded or translations not applied');
    }

    console.log(`📦 Generating TRANSLATED PPTX for ${language}...`);
    
    try {
      // Create new ZIP with modified content
      const newZip = new JSZip();
      
      // Copy all original files first
      const originalFiles = this.pptxStructure.originalZip.files;
      
      for (const fileName in originalFiles) {
        const file = originalFiles[fileName];
        
        if (!file.dir) {
          if (fileName.match(/^ppt\/slides\/slide\d+\.xml$/)) {
            // Use modified slide content
            const slideMatch = fileName.match(/slide(\d+)\.xml$/);
            if (slideMatch) {
              const slideNumber = slideMatch[1];
              const slideId = `slide${slideNumber}`;
              
              if (this.pptxStructure.slideFiles[slideId]) {
                console.log(`📝 Adding modified slide: ${fileName}`);
                newZip.file(fileName, this.pptxStructure.slideFiles[slideId]);
              } else {
                // Fallback to original
                newZip.file(fileName, await file.async('text'));
              }
            }
          } else {
            // Copy original file
            if (fileName.endsWith('.xml') || fileName.endsWith('.rels')) {
              newZip.file(fileName, await file.async('text'));
            } else {
              newZip.file(fileName, await file.async('arraybuffer'));
            }
          }
        }
      }
      
      // Generate the PPTX blob
      const pptxBlob = await newZip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6
        }
      });
      
      console.log(`✅ Generated translated PPTX: ${Math.round(pptxBlob.size/1024)}KB`);
      
      // Verify size is reasonable
      if (pptxBlob.size < 1000) {
        throw new Error('Generated PPTX file is too small - likely corrupted');
      }
      
      return pptxBlob;
      
    } catch (error) {
      console.error('❌ PPTX generation failed:', error);
      throw new Error(`Failed to generate translated PPTX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get current PPTX structure info
  getPPTXInfo(): { slideCount: number; totalTextElements: number } | null {
    if (!this.pptxStructure) return null;
    
    return {
      slideCount: this.pptxStructure.slides.length,
      totalTextElements: this.pptxStructure.slides.reduce((sum, slide) => sum + slide.textElements.length, 0)
    };
  }

  // Get slide text for debugging
  getSlideText(slideId: string): string[] {
    if (!this.pptxStructure) return [];
    
    const slide = this.pptxStructure.slides.find(s => s.slideId === slideId);
    return slide ? slide.textElements.map(el => el.originalText) : [];
  }

  // ENHANCED: Get all text for XLSX generation
  getAllExtractedText(): Record<string, string[]> {
    if (!this.pptxStructure) return {};
    
    const result: Record<string, string[]> = {};
    
    this.pptxStructure.slides.forEach(slide => {
      result[slide.slideId] = slide.textElements.map(el => el.originalText);
    });
    
    return result;
  }

  // Reset processor state
  reset(): void {
    this.pptxStructure = null;
    this.appliedTranslations = {};
    console.log('🔄 PPTX Processor reset');
  }
}

// Export singleton instance
export const realPptxProcessor = new RealPPTXProcessor();

// Export types
export type { PPTXSlideTextData, PPTXTranslationData, PPTXStructure };