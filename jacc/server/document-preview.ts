import { storage } from './storage';
import path from 'path';
import fs from 'fs';

export interface DocumentPreview {
  id: string;
  name: string;
  mimeType: string;
  createdAt: string;
  description: string;
  viewUrl: string;
  downloadUrl: string;
  thumbnailUrl?: string;
  textPreview: string;
  wordCount: number;
  pageCount?: number;
  highlights?: string[];
}

export class DocumentPreviewService {
  
  // Generate comprehensive document preview
  async generateDocumentPreview(documentId: string, searchQuery?: string): Promise<DocumentPreview> {
    const document = await storage.getDocument(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    const filePath = path.join(process.cwd(), 'uploads', document.path);
    
    // Extract text content for preview
    const textPreview = await this.extractTextPreview(filePath, document.mimeType);
    
    // Generate thumbnail if PDF
    let thumbnailUrl: string | undefined;
    if (document.mimeType === 'application/pdf') {
      thumbnailUrl = await this.generatePDFThumbnail(documentId, filePath);
    }

    // Calculate document stats
    const wordCount = this.calculateWordCount(textPreview);
    const pageCount = await this.estimatePageCount(filePath, document.mimeType);

    // Highlight search terms if query provided
    let highlights: string[] = [];
    if (searchQuery) {
      highlights = this.extractHighlights(textPreview, searchQuery);
    }

    return {
      id: document.id,
      name: document.name,
      mimeType: document.mimeType,
      createdAt: document.createdAt?.toISOString() || new Date().toISOString(),
      description: document.description || this.generateAutoDescription(textPreview, document.name),
      viewUrl: `/api/documents/${documentId}/view`,
      downloadUrl: `/api/documents/${documentId}/download`,
      thumbnailUrl,
      textPreview: textPreview.substring(0, 500),
      wordCount,
      pageCount,
      highlights
    };
  }

  // Extract text content based on file type
  private async extractTextPreview(filePath: string, mimeType: string): Promise<string> {
    if (!fs.existsSync(filePath)) {
      return 'File content not available for preview.';
    }

    try {
      if (mimeType === 'text/csv' || mimeType === 'text/plain') {
        return fs.readFileSync(filePath, 'utf8');
      }
      
      if (mimeType === 'application/pdf') {
        return await this.extractPDFText(filePath);
      }
      
      if (mimeType.includes('word') || mimeType.includes('document')) {
        return await this.extractWordText(filePath);
      }
      
      // For other types, return type info
      return `${mimeType.split('/')[1]?.toUpperCase() || 'Document'} file - Click to view full content`;
    } catch (error) {
      console.log(`Error extracting text from ${filePath}:`, error);
      return 'Preview not available - click to view document';
    }
  }

  // Extract text from PDF using basic parsing
  private async extractPDFText(filePath: string): Promise<string> {
    try {
      const pdfParse = await import('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse.default(dataBuffer);
      return data.text;
    } catch (error) {
      console.log('PDF parsing not available, using fallback');
      return 'PDF document - Click to view content';
    }
  }

  // Extract text from Word documents
  private async extractWordText(filePath: string): Promise<string> {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      console.log('Word document parsing not available, using fallback');
      return 'Word document - Click to view content';
    }
  }

  // Generate PDF thumbnail (placeholder implementation)
  private async generatePDFThumbnail(documentId: string, filePath: string): Promise<string | undefined> {
    try {
      // Check if thumbnail already exists
      const thumbnailDir = path.join(process.cwd(), 'uploads', 'thumbnails');
      const thumbnailPath = path.join(thumbnailDir, `${documentId}.png`);
      
      if (fs.existsSync(thumbnailPath)) {
        return `/api/documents/${documentId}/thumbnail`;
      }
      
      // Create thumbnails directory if it doesn't exist
      if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
      }

      // Try to generate thumbnail using pdf2pic if available
      try {
        const pdf2pic = await import('pdf2pic');
        const convert = pdf2pic.fromPath(filePath, {
          density: 100,
          saveFilename: documentId,
          savePath: thumbnailDir,
          format: "png",
          width: 200,
          height: 300
        });
        
        await convert(1); // Convert first page only
        return `/api/documents/${documentId}/thumbnail`;
      } catch (error) {
        console.log('PDF thumbnail generation not available');
        return undefined;
      }
    } catch (error) {
      console.log('Thumbnail generation failed:', error);
      return undefined;
    }
  }

  // Calculate word count
  private calculateWordCount(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  // Estimate page count based on content
  private async estimatePageCount(filePath: string, mimeType: string): Promise<number | undefined> {
    if (mimeType === 'application/pdf') {
      try {
        const pdfParse = await import('pdf-parse');
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse.default(dataBuffer);
        return data.numpages;
      } catch (error) {
        return undefined;
      }
    }
    return undefined;
  }

  // Extract highlighted snippets around search terms
  private extractHighlights(text: string, searchQuery: string): string[] {
    const highlights: string[] = [];
    const queryTerms = searchQuery.toLowerCase().split(/\s+/);
    const textLower = text.toLowerCase();
    
    queryTerms.forEach(term => {
      const index = textLower.indexOf(term);
      if (index !== -1) {
        const start = Math.max(0, index - 50);
        const end = Math.min(text.length, index + term.length + 50);
        const snippet = text.substring(start, end);
        
        // Highlight the term
        const regex = new RegExp(`(${term})`, 'gi');
        const highlighted = snippet.replace(regex, '<mark>$1</mark>');
        highlights.push('...' + highlighted + '...');
      }
    });
    
    return highlights.slice(0, 3); // Return top 3 highlights
  }

  // Generate automatic description based on content
  private generateAutoDescription(textPreview: string, fileName: string): string {
    const preview = textPreview.substring(0, 200);
    
    // Extract key information patterns
    if (preview.toLowerCase().includes('pricing') || preview.toLowerCase().includes('rates')) {
      return `${fileName} - Contains pricing and rate information`;
    }
    
    if (preview.toLowerCase().includes('contact') || preview.toLowerCase().includes('support')) {
      return `${fileName} - Contains contact and support information`;
    }
    
    if (preview.toLowerCase().includes('equipment') || preview.toLowerCase().includes('terminal')) {
      return `${fileName} - Contains equipment and terminal information`;
    }
    
    if (preview.toLowerCase().includes('integration') || preview.toLowerCase().includes('api')) {
      return `${fileName} - Contains integration and technical information`;
    }
    
    return `${fileName} - Click to view full document content`;
  }

  // Generate document insights for search results
  async generateDocumentInsights(documentId: string, searchQuery: string): Promise<{
    relevanceExplanation: string;
    keyFindings: string[];
    suggestedActions: string[];
  }> {
    const document = await storage.getDocument(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    const filePath = path.join(process.cwd(), 'uploads', document.path);
    const textContent = await this.extractTextPreview(filePath, document.mimeType);
    
    const insights = {
      relevanceExplanation: this.generateRelevanceExplanation(textContent, searchQuery),
      keyFindings: this.extractKeyFindings(textContent, searchQuery),
      suggestedActions: this.generateSuggestedActions(textContent, searchQuery)
    };

    return insights;
  }

  private generateRelevanceExplanation(content: string, query: string): string {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const foundTerms = queryTerms.filter(term => 
      content.toLowerCase().includes(term)
    );
    
    if (foundTerms.length === queryTerms.length) {
      return `This document contains all search terms: ${foundTerms.join(', ')}`;
    } else if (foundTerms.length > 0) {
      return `This document contains ${foundTerms.length} of ${queryTerms.length} search terms: ${foundTerms.join(', ')}`;
    } else {
      return 'This document was found through related keywords and semantic matching';
    }
  }

  private extractKeyFindings(content: string, query: string): string[] {
    const findings: string[] = [];
    const contentLower = content.toLowerCase();
    
    // Look for pricing information
    if (query.toLowerCase().includes('pricing') || query.toLowerCase().includes('rates')) {
      const pricePatterns = [
        /\$[\d,]+\.?\d*/g,
        /\d+\.?\d*%/g,
        /\d+\.\d+ \+ \$\d+\.\d+/g
      ];
      
      pricePatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          findings.push(`Pricing information found: ${matches.slice(0, 3).join(', ')}`);
        }
      });
    }
    
    // Look for contact information
    if (query.toLowerCase().includes('contact') || query.toLowerCase().includes('support')) {
      const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
      const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      
      const phones = content.match(phonePattern);
      const emails = content.match(emailPattern);
      
      if (phones) findings.push(`Phone numbers: ${phones.slice(0, 2).join(', ')}`);
      if (emails) findings.push(`Email addresses: ${emails.slice(0, 2).join(', ')}`);
    }
    
    return findings.slice(0, 3);
  }

  private generateSuggestedActions(content: string, query: string): string[] {
    const actions: string[] = [];
    
    if (content.toLowerCase().includes('pricing') || content.toLowerCase().includes('rates')) {
      actions.push('Compare with other processor rates');
      actions.push('Save pricing information to folder');
    }
    
    if (content.toLowerCase().includes('contact') || content.toLowerCase().includes('support')) {
      actions.push('Add contact information to CRM');
      actions.push('Schedule follow-up call');
    }
    
    if (content.toLowerCase().includes('equipment') || content.toLowerCase().includes('terminal')) {
      actions.push('Check equipment availability');
      actions.push('Request equipment quote');
    }
    
    actions.push('Download document for offline access');
    actions.push('Share with team members');
    
    return actions.slice(0, 4);
  }
}

export const documentPreviewService = new DocumentPreviewService();