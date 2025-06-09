import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ProcessorPattern {
  name: string;
  identifiers: string[];
  ratePatterns: RegExp[];
  feePatterns: RegExp[];
  volumePatterns: RegExp[];
}

export interface EnhancedExtractionResult {
  extractedData: any;
  confidence: number;
  extractionMethod: 'text' | 'ocr' | 'hybrid';
  dataQuality: 'high' | 'medium' | 'low';
  validationErrors: string[];
  improvementSuggestions: string[];
}

export class EnhancedPDFAnalyzer {
  private processorPatterns: ProcessorPattern[] = [
    {
      name: 'Genesis',
      identifiers: ['genesis', 'reynolds and reynolds', 'reynolds & reynolds', 'merchant nbr'],
      ratePatterns: [/(\d+\.\d+)%\s*\+\s*\$(\d+\.\d+)/i, /processing\s*activity\s*summary/i],
      feePatterns: [/interchange\s*fees/i, /other\s*fees/i, /assessment/i],
      volumePatterns: [/net\s*sales[:\s]*\$?([\d,]+\.?\d*)/i, /amount\s*of\s*sales[:\s]*\$?([\d,]+\.?\d*)/i]
    },
    {
      name: 'Square',
      identifiers: ['square', 'squa.e', 'sq account'],
      ratePatterns: [/(\d+\.\d+)%?\s*processing\s*rate/i, /rate:\s*(\d+\.\d+)%/i],
      feePatterns: [/monthly\s*fee[:\s]*\$?(\d+\.\d+)/i, /statement\s*fee[:\s]*\$?(\d+\.\d+)/i],
      volumePatterns: [/total\s*volume[:\s]*\$?([\d,]+\.?\d*)/i, /gross\s*sales[:\s]*\$?([\d,]+\.?\d*)/i]
    },
    {
      name: 'Stripe',
      identifiers: ['stripe', 'str.pe'],
      ratePatterns: [/(\d+\.\d+)%\s*\+\s*\$?(\d+\.\d+)/i],
      feePatterns: [/fee[:\s]*\$?(\d+\.\d+)/i],
      volumePatterns: [/volume[:\s]*\$?([\d,]+\.?\d*)/i]
    },
    {
      name: 'PayPal',
      identifiers: ['paypal', 'pay pal', 'pp merchant'],
      ratePatterns: [/(\d+\.\d+)%\s*per\s*transaction/i],
      feePatterns: [/monthly\s*fee[:\s]*\$?(\d+\.\d+)/i],
      volumePatterns: [/sales\s*volume[:\s]*\$?([\d,]+\.?\d*)/i]
    },
    {
      name: 'First Data',
      identifiers: ['first data', 'firstdata', 'fiserv'],
      ratePatterns: [/discount\s*rate[:\s]*(\d+\.\d+)%/i, /qualified[:\s]*(\d+\.\d+)%/i],
      feePatterns: [/authorization\s*fee[:\s]*\$?(\d+\.\d+)/i, /monthly\s*minimum[:\s]*\$?(\d+\.\d+)/i],
      volumePatterns: [/net\s*sales[:\s]*\$?([\d,]+\.?\d*)/i]
    },
    {
      name: 'Worldpay',
      identifiers: ['worldpay', 'world pay', 'wp merchant'],
      ratePatterns: [/merchant\s*rate[:\s]*(\d+\.\d+)%/i],
      feePatterns: [/gateway\s*fee[:\s]*\$?(\d+\.\d+)/i],
      volumePatterns: [/transaction\s*volume[:\s]*\$?([\d,]+\.?\d*)/i]
    },
    {
      name: 'Heartland',
      identifiers: ['heartland', 'global payments', 'gp merchant'],
      ratePatterns: [/discount\s*rate[:\s]*(\d+\.\d+)%/i, /interchange\s*plus/i],
      feePatterns: [/monthly\s*service[:\s]*\$?(\d+\.\d+)/i, /per\s*item[:\s]*\$?(\d+\.\d+)/i],
      volumePatterns: [/monthly\s*volume[:\s]*\$?([\d,]+\.?\d*)/i]
    },
    {
      name: 'TSYS',
      identifiers: ['tsys', 'total system services', 'ts merchant'],
      ratePatterns: [/qualified\s*rate[:\s]*(\d+\.\d+)%/i, /mid\s*qualified[:\s]*(\d+\.\d+)%/i],
      feePatterns: [/authorization[:\s]*\$?(\d+\.\d+)/i, /settlement[:\s]*\$?(\d+\.\d+)/i],
      volumePatterns: [/gross\s*volume[:\s]*\$?([\d,]+\.?\d*)/i]
    },
    {
      name: 'Elavon',
      identifiers: ['elavon', 'converge', 'us bank merchant'],
      ratePatterns: [/effective\s*rate[:\s]*(\d+\.\d+)%/i, /blended\s*rate[:\s]*(\d+\.\d+)%/i],
      feePatterns: [/monthly\s*minimum[:\s]*\$?(\d+\.\d+)/i, /statement[:\s]*\$?(\d+\.\d+)/i],
      volumePatterns: [/sales\s*amount[:\s]*\$?([\d,]+\.?\d*)/i]
    }
  ];

  async analyzeStatement(fileBuffer: Buffer, filename: string): Promise<EnhancedExtractionResult> {
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
      // Step 1: Extract text using pdf-parse
      const textResult = await this.extractTextFromPDF(fileBuffer);
      
      // Step 2: If text extraction confidence is low, use OCR
      const ocrResult = textResult.confidence < 0.7 ? 
        await this.extractWithOCR(fileBuffer, filename, tempDir) : null;
      
      // Step 3: Use hybrid approach if both are available
      const bestResult = this.selectBestExtraction(textResult, ocrResult);
      
      // Step 4: Enhanced AI analysis with processor-specific patterns
      const analysisResult = await this.performEnhancedAnalysis(bestResult);
      
      // Step 5: Validate and quality check
      const validatedResult = this.validateExtraction(analysisResult);
      
      return validatedResult;
    } catch (error) {
      console.error('Enhanced PDF analysis error:', error);
      throw new Error('Failed to analyze PDF statement with enhanced methods');
    } finally {
      // Cleanup temp files
      this.cleanupTempFiles(tempDir);
    }
  }

  private async extractTextFromPDF(fileBuffer: Buffer): Promise<{ text: string; confidence: number }> {
    try {
      // Use dynamic import to avoid initialization issues
      const pdf = await import('pdf-parse');
      const pdfParse = pdf.default || pdf;
      const pdfData = await pdfParse(fileBuffer);
      const text = pdfData.text;
      
      // Calculate confidence based on text quality indicators
      const confidence = this.calculateTextConfidence(text);
      
      return { text, confidence };
    } catch (error) {
      console.error('PDF text extraction error:', error);
      return { text: '', confidence: 0 };
    }
  }

  private calculateTextConfidence(text: string): number {
    let confidence = 0.5; // Base confidence
    
    // Check for key financial terms
    const financialTerms = [
      'processing', 'transaction', 'volume', 'rate', 'fee', 'discount',
      'qualified', 'authorization', 'batch', 'statement', 'merchant'
    ];
    
    const foundTerms = financialTerms.filter(term => 
      text.toLowerCase().includes(term)).length;
    confidence += (foundTerms / financialTerms.length) * 0.3;
    
    // Check for numerical data patterns
    const numberPatterns = [
      /\$[\d,]+\.\d{2}/g, // Currency amounts
      /\d+\.\d+%/g, // Percentages
      /\d{1,2}\/\d{1,2}\/\d{4}/g // Dates
    ];
    
    const numberMatches = numberPatterns.reduce((count, pattern) => 
      count + (text.match(pattern) || []).length, 0);
    confidence += Math.min(numberMatches / 20, 0.2);
    
    // Penalize for OCR artifacts
    const ocrArtifacts = /[^\w\s\$\.\,\%\-\(\)\/]/g;
    const artifactCount = (text.match(ocrArtifacts) || []).length;
    confidence -= Math.min(artifactCount / text.length, 0.2);
    
    return Math.max(0, Math.min(1, confidence));
  }

  private async extractWithOCR(fileBuffer: Buffer, filename: string, tempDir: string): Promise<{ text: string; confidence: number }> {
    try {
      // Simplified OCR extraction - use OpenAI's vision API directly
      // Convert PDF buffer to base64 for vision processing
      const base64Buffer = fileBuffer.toString('base64');
      
      const ocrText = await this.performVisionOCR(base64Buffer);
      const confidence = this.calculateTextConfidence(ocrText);
      
      return { text: ocrText, confidence };
    } catch (error) {
      console.error('OCR extraction error:', error);
      return { text: '', confidence: 0 };
    }
  }

  private async performVisionOCR(base64Image: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all text from this merchant processing statement image. Focus on preserving exact numbers, percentages, and dollar amounts. Maintain the structure and formatting as much as possible."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Vision OCR error:', error);
      return '';
    }
  }

  private selectBestExtraction(textResult: { text: string; confidence: number }, 
                              ocrResult: { text: string; confidence: number } | null): { text: string; confidence: number; method: string } {
    if (!ocrResult) {
      return { ...textResult, method: 'text' };
    }
    
    if (ocrResult.confidence > textResult.confidence) {
      return { ...ocrResult, method: 'ocr' };
    }
    
    // Use hybrid approach - combine both texts
    const combinedText = `${textResult.text}\n\n--- OCR SUPPLEMENT ---\n\n${ocrResult.text}`;
    const combinedConfidence = Math.max(textResult.confidence, ocrResult.confidence);
    
    return { text: combinedText, confidence: combinedConfidence, method: 'hybrid' };
  }

  private async performEnhancedAnalysis(extractionResult: { text: string; confidence: number; method: string }): Promise<any> {
    // First, identify the processor using pattern matching
    const detectedProcessor = this.detectProcessor(extractionResult.text);
    
    const enhancedPrompt = `
You are an expert merchant services analyst specializing in payment processing statements. Analyze this statement and extract precise financial data.

DETECTED PROCESSOR: ${detectedProcessor.name}
EXTRACTION METHOD: ${extractionResult.method}
CONFIDENCE: ${extractionResult.confidence}

CRITICAL REQUIREMENTS:
1. Extract ALL numerical values with exact precision
2. Identify the specific processor and rate structure
3. Calculate effective rates and total costs
4. Flag any inconsistencies or missing data
5. Provide confidence scores for each extracted field

PROCESSOR-SPECIFIC PATTERNS TO LOOK FOR:
${this.getProcessorSpecificGuidance(detectedProcessor)}

STATEMENT DATA:
${extractionResult.text}

Return detailed JSON with:
- All numerical values with source references
- Processor identification confidence
- Rate structure type (tiered, interchange-plus, flat-rate)
- Transaction breakdown by card type
- Complete fee analysis
- Potential savings opportunities
- Data quality assessment`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a merchant services expert. Extract financial data with absolute precision. Return comprehensive JSON with confidence scores for each field."
          },
          {
            role: "user",
            content: enhancedPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 4000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      result._metadata = {
        detectedProcessor,
        extractionMethod: extractionResult.method,
        overallConfidence: extractionResult.confidence
      };
      
      return result;
    } catch (error) {
      console.error('Enhanced analysis error:', error);
      throw error;
    }
  }

  private detectProcessor(text: string): ProcessorPattern {
    const lowerText = text.toLowerCase();
    
    for (const pattern of this.processorPatterns) {
      for (const identifier of pattern.identifiers) {
        if (lowerText.includes(identifier)) {
          return pattern;
        }
      }
    }
    
    // Default fallback
    return {
      name: 'Unknown Processor',
      identifiers: [],
      ratePatterns: [],
      feePatterns: [],
      volumePatterns: []
    };
  }

  private getProcessorSpecificGuidance(processor: ProcessorPattern): string {
    if (processor.name === 'Genesis') {
      return `
Processor: Genesis (Reynolds & Reynolds) - Interchange Plus Model
CRITICAL EXTRACTION POINTS:
- Total Monthly Volume: Look for "Total" row in deposit summary or processing activity
- Transaction Count: Sum of all "Number Sales" or look for total transaction count
- Processor Name: "Genesis", "Reynolds and Reynolds", or merchant number format
- Rate Structure: Interchange Plus (separate interchange fees + markup)
- Key Sections:
  * DEPOSIT SUMMARY: Daily transaction totals
  * PROCESSING ACTIVITY SUMMARY: Card type breakdown with volumes and fees
  * INTERCHANGE FEES: Detailed interchange costs by card type
  * OTHER FEES: Assessments, per-item fees, monthly charges
- Card Mix Analysis: Extract individual card type volumes (Visa, MC, Amex, Discover, Debit)
- Average Ticket: May be shown per card type or calculate from total volume/count
- Effective Rate Calculation: (Total Interchange + Other Fees) / Total Volume`;
    }
    
    return `
Processor: ${processor.name}
Look for these specific patterns:
- Rate patterns: Common rate structures and fee formats
- Fee patterns: Monthly fees, per-transaction fees, assessments
- Volume patterns: Total processing volume and transaction counts

Common ${processor.name} statement sections:
- Transaction summary
- Rate breakdown  
- Fee itemization
- Volume analysis
- Monthly totals`;
  }

  private validateExtraction(analysisResult: any): EnhancedExtractionResult {
    const validationErrors: string[] = [];
    const improvementSuggestions: string[] = [];
    
    // Validate required fields
    if (!analysisResult.monthlyVolume || analysisResult.monthlyVolume <= 0) {
      validationErrors.push('Monthly volume missing or invalid');
    }
    
    if (!analysisResult.currentProcessor?.name || analysisResult.currentProcessor.name === 'Unknown Processor') {
      validationErrors.push('Processor identification failed');
      improvementSuggestions.push('Try uploading a clearer image or different pages of the statement');
    }
    
    // Validate rate consistency
    const rates = analysisResult.currentProcessor;
    if (rates && (rates.qualifiedRate > 0.1 || rates.midQualifiedRate > 0.1 || rates.nonQualifiedRate > 0.1)) {
      validationErrors.push('Processing rates appear unusually high');
    }
    
    // Calculate data quality
    let dataQuality: 'high' | 'medium' | 'low' = 'high';
    if (validationErrors.length > 2) dataQuality = 'low';
    else if (validationErrors.length > 0) dataQuality = 'medium';
    
    // Calculate overall confidence
    const baseConfidence = analysisResult._metadata?.overallConfidence || 0.7;
    const validationPenalty = validationErrors.length * 0.1;
    const finalConfidence = Math.max(0.1, baseConfidence - validationPenalty);
    
    return {
      extractedData: analysisResult,
      confidence: finalConfidence,
      extractionMethod: analysisResult._metadata?.extractionMethod || 'text',
      dataQuality,
      validationErrors,
      improvementSuggestions
    };
  }

  private cleanupTempFiles(tempDir: string): void {
    try {
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        files.forEach(file => {
          const filePath = path.join(tempDir, file);
          if (file.startsWith('temp_') || file.startsWith('page')) {
            fs.unlinkSync(filePath);
          }
        });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  // Method to provide feedback on extraction quality
  async generateExtractionReport(result: EnhancedExtractionResult): Promise<string> {
    const report = `
MERCHANT STATEMENT ANALYSIS REPORT
==================================

Extraction Method: ${result.extractionMethod.toUpperCase()}
Overall Confidence: ${(result.confidence * 100).toFixed(1)}%
Data Quality: ${result.dataQuality.toUpperCase()}

PROCESSOR INFORMATION:
- Name: ${result.extractedData.currentProcessor?.name || 'Not identified'}
- Detection Confidence: ${(result.extractedData._metadata?.detectedProcessor?.confidence || 0.5) * 100}%

FINANCIAL SUMMARY:
- Monthly Volume: $${result.extractedData.monthlyVolume?.toLocaleString() || 'Not extracted'}
- Transaction Count: ${result.extractedData.transactionCount?.toLocaleString() || 'Not extracted'}
- Average Ticket: $${result.extractedData.averageTicket?.toFixed(2) || 'Not calculated'}

VALIDATION RESULTS:
${result.validationErrors.length === 0 ? '✓ All validations passed' : 
  result.validationErrors.map(error => `✗ ${error}`).join('\n')}

${result.improvementSuggestions.length > 0 ? 
  `SUGGESTIONS FOR IMPROVEMENT:\n${result.improvementSuggestions.map(s => `• ${s}`).join('\n')}` : ''}
    `;
    
    return report.trim();
  }
}

export const enhancedPDFAnalyzer = new EnhancedPDFAnalyzer();