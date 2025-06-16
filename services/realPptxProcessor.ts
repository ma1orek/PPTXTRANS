// ENHANCED Real PPTX Processor with improved text replacement
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

  // Load PPTX file with enhanced XML parsing
  async loadPPTXFile(file: File): Promise<PPTXStructure> {
    try {
      console.log(`🔍 Loading PPTX file: ${file.name} (${Math.round(file.size/1024/1024)}MB)`);
      
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
      
      // Enhanced slide discovery
      const slideFilePattern = /^ppt\/slides\/slide(\d+)\.xml$/;
      
      for (const fileName in zipContent.files) {
        const slideMatch = fileName.match(slideFilePattern);
        if (slideMatch) {
          const slideNumber = parseInt(slideMatch[1]);
          const slideId = `slide${slideNumber}`;
          const slideContent = await this.getFileContent(zipContent, fileName);
          slideFiles[slideId] = slideContent;
          
          console.log(`📄 Found slide: ${slideId} (${slideContent.length} chars)`);
          
          // Extract text with enhanced parsing
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
      
      const totalTextElements = slides.reduce((sum, s) => sum + s.textElements.length, 0);
      console.log(`✅ PPTX loaded: ${slides.length} slides, ${totalTextElements} text elements`);
      
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
      console.error('❌ PPTX loading failed:', error);
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
      console.log(`📝 Extracting text from slide ${slideNumber}...`);
      
      // ENHANCED: Multiple extraction strategies
      const extractionStrategies = [
        // Strategy 1: Direct <a:t> elements
        {
          name: 'Direct a:t elements',
          regex: /<a:t[^>]*>([^<]+)<\/a:t>/g,
          processor: (match: RegExpMatchArray) => this.cleanExtractedText(match[1])
        },
        // Strategy 2: Text runs with formatting
        {
          name: 'Text runs',
          regex: /<a:r[^>]*>.*?<a:t[^>]*>([^<]+)<\/a:t>.*?<\/a:r>/g,
          processor: (match: RegExpMatchArray) => this.cleanExtractedText(match[1])
        },
        // Strategy 3: Paragraph text
        {
          name: 'Paragraph text',
          regex: /<a:p[^>]*>.*?<a:t[^>]*>([^<]+)<\/a:t>.*?<\/a:p>/g,
          processor: (match: RegExpMatchArray) => this.cleanExtractedText(match[1])
        }
      ];
      
      let elementIndex = 0;
      const foundTexts = new Set<string>(); // Avoid duplicates
      
      extractionStrategies.forEach(strategy => {
        let match;
        while ((match = strategy.regex.exec(slideXML)) !== null) {
          const cleanText = strategy.processor(match);
          
          if (cleanText && cleanText.length > 0 && !foundTexts.has(cleanText)) {
            foundTexts.add(cleanText);
            
            textElements.push({
              elementId: `${slideId}_${strategy.name.replace(/\s+/g, '_')}_${elementIndex}`,
              originalText: cleanText,
              xpath: `//a:t[contains(text(),'${cleanText.substring(0, 20).replace(/'/g, "\\'")}')]`,
              slideRelId: slideId
            });
            
            elementIndex++;
            console.log(`📝 Slide ${slideNumber} [${strategy.name}]: "${cleanText}"`);
          }
        }
        
        // Reset regex for next strategy
        strategy.regex.lastIndex = 0;
      });
      
      console.log(`✅ Slide ${slideNumber}: extracted ${textElements.length} unique text elements using multiple strategies`);
      
    } catch (error) {
      console.error(`❌ Text extraction failed for slide ${slideNumber}:`, error);
    }
    
    return textElements;
  }

  // Clean extracted text with better handling
  private cleanExtractedText(text: string): string {
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ') // Normalize whitespace
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

  // CRITICAL: Apply translations with ENHANCED text replacement
  async applyTranslations(translationsData: Record<string, PPTXTranslationData>): Promise<void> {
    if (!this.pptxStructure) {
      throw new Error('PPTX not loaded. Call loadPPTXFile first.');
    }

    console.log('🔄 APPLYING ENHANCED TRANSLATIONS TO PPTX...');
    console.log('📊 Translation data:', Object.keys(translationsData));
    
    this.appliedTranslations = { ...translationsData };
    
    let totalReplacements = 0;
    
    // Apply translations to each slide
    for (const [slideId, translationData] of Object.entries(translationsData)) {
      if (this.pptxStructure.slideFiles[slideId]) {
        console.log(`🔄 Processing slide: ${slideId}`);
        console.log(`📝 Available translations:`, Object.keys(translationData.translations));
        
        let modifiedSlideXML = this.pptxStructure.slideFiles[slideId];
        let slideReplacements = 0;
        
        // Apply each translation with multiple strategies
        for (const [originalText, translatedText] of Object.entries(translationData.translations)) {
          if (originalText && translatedText && originalText !== translatedText) {
            console.log(`🔄 Replacing: "${originalText}" → "${translatedText}"`);
            
            const beforeXML = modifiedSlideXML;
            
            // ENHANCED: Multiple replacement strategies for better success rate
            const replacementStrategies = [
              // Strategy 1: Exact text replacement in <a:t> tags
              {
                name: 'Exact a:t replacement',
                pattern: new RegExp(`(<a:t[^>]*>)\\s*${this.escapeRegex(originalText)}\\s*(<\/a:t>)`, 'gi'),
                replacement: `$1${this.escapeXML(translatedText)}$2`
              },
              // Strategy 2: Text content with surrounding whitespace
              {
                name: 'Text with whitespace',
                pattern: new RegExp(`(>)\\s*${this.escapeRegex(originalText)}\\s*(<)`, 'gi'),
                replacement: `$1${this.escapeXML(translatedText)}$2`
              },
              // Strategy 3: Direct text replacement
              {
                name: 'Direct text replacement',
                pattern: new RegExp(this.escapeRegex(originalText), 'gi'),
                replacement: this.escapeXML(translatedText)
              },
              // Strategy 4: Partial word boundary replacement
              {
                name: 'Word boundary replacement',
                pattern: new RegExp(`\\b${this.escapeRegex(originalText)}\\b`, 'gi'),
                replacement: this.escapeXML(translatedText)
              }
            ];
            
            let replacementMade = false;
            
            for (const strategy of replacementStrategies) {
              const testXML = modifiedSlideXML.replace(strategy.pattern, strategy.replacement);
              
              if (testXML !== modifiedSlideXML) {
                modifiedSlideXML = testXML;
                slideReplacements++;
                totalReplacements++;
                replacementMade = true;
                console.log(`✅ Applied ${strategy.name} for: "${originalText}"`);
                break; // Stop after first successful replacement
              }
            }
            
            if (!replacementMade) {
              console.warn(`⚠️ No replacement strategy worked for: "${originalText}"`);
              
              // Debug: Show context around the text
              const contextMatch = beforeXML.match(new RegExp(`.{0,50}${this.escapeRegex(originalText)}.{0,50}`, 'i'));
              if (contextMatch) {
                console.log(`🔍 Context: "${contextMatch[0]}"`);
              }
            }
          }
        }
        
        // Update slide content
        this.pptxStructure.slideFiles[slideId] = modifiedSlideXML;
        console.log(`✅ Slide ${slideId}: ${slideReplacements} text replacements applied`);
        
      } else {
        console.warn(`⚠️ Slide not found: ${slideId}`);
      }
    }
    
    console.log(`✅ ALL TRANSLATIONS APPLIED: ${totalReplacements} total replacements across all slides`);
    
    if (totalReplacements === 0) {
      console.warn('⚠️ WARNING: No text replacements were made! This may indicate a problem with text extraction or replacement logic.');
    }
  }

  // Enhanced regex escaping
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Enhanced XML escaping
  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // ENHANCED: Generate translated PPTX with verification
  async generateTranslatedPPTX(language: string): Promise<Blob> {
    if (!this.pptxStructure) {
      throw new Error('PPTX not loaded or translations not applied');
    }

    console.log(`📦 Generating translated PPTX for ${language}...`);
    
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
                console.log(`📝 Adding translated slide: ${fileName}`);
                newZip.file(fileName, this.pptxStructure.slideFiles[slideId]);
              } else {
                // Fallback to original
                console.warn(`⚠️ Using original slide: ${fileName}`);
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
      
      // Generate the PPTX blob with optimization
      const pptxBlob = await newZip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6
        }
      });
      
      console.log(`✅ Generated translated PPTX: ${Math.round(pptxBlob.size/1024)}KB`);
      
      // Verify file integrity
      if (pptxBlob.size < 1000) {
        throw new Error('Generated PPTX file is too small - likely corrupted');
      }
      
      // Verify it's significantly different from original (indicating translations were applied)
      const originalSize = this.pptxStructure.originalZip.files['[Content_Types].xml'] ? 
        (await this.pptxStructure.originalZip.generateAsync({ type: 'blob' })).size : 0;
      
      const sizeDifference = Math.abs(pptxBlob.size - originalSize);
      if (sizeDifference < 100 && Object.keys(this.appliedTranslations).length > 0) {
        console.warn('⚠️ Generated file size very similar to original - translations may not have been applied properly');
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

  // Get all extracted text for XLSX generation
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