import fs from 'fs';
import path from 'path';
import { storage } from './storage';
import { pineconeVectorService } from './pinecone-vector';

interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  metadata: {
    documentName: string;
    originalName: string;
    mimeType: string;
    pageNumber?: number;
    startChar: number;
    endChar: number;
  };
}

export class DocumentProcessor {
  async processUploadedDocument(documentId: string): Promise<void> {
    try {
      const document = await storage.getDocument(documentId);
      if (!document) {
        console.error(`Document ${documentId} not found`);
        return;
      }

      console.log(`Processing document: ${document.originalName}`);
      
      // Extract text content based on file type
      const textContent = await this.extractTextContent(document.path, document.mimeType);
      
      if (!textContent || textContent.trim().length === 0) {
        console.log(`No text content extracted from ${document.originalName}`);
        return;
      }

      // Chunk the content
      const chunks = this.chunkText(textContent, document, 1000);
      
      // Create vector embeddings and store
      await this.vectorizeAndStore(chunks);
      
      console.log(`Successfully processed ${chunks.length} chunks for ${document.originalName}`);
    } catch (error) {
      console.error(`Error processing document ${documentId}:`, error);
    }
  }

  async extractTextContent(filePath: string, mimeType: string): Promise<string> {
    try {
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return '';
      }

      // For PDF files
      if (mimeType === 'application/pdf') {
        try {
          // Try to use pdf-parse if available
          const pdfParse = require('pdf-parse');
          const dataBuffer = fs.readFileSync(filePath);
          const data = await pdfParse(dataBuffer);
          return data.text;
        } catch (error) {
          console.log('pdf-parse not available, extracting basic text');
          // Fallback: read as text (limited effectiveness)
          return fs.readFileSync(filePath, 'utf8');
        }
      }

      // For text-based files
      if (mimeType.includes('text/') || mimeType.includes('json') || mimeType.includes('csv')) {
        return fs.readFileSync(filePath, 'utf8');
      }

      // For Office documents (Word, Excel, PowerPoint)
      if (mimeType.includes('officedocument') || mimeType.includes('opendocument')) {
        try {
          // Try mammoth for Word documents
          if (mimeType.includes('wordprocessingml')) {
            const mammoth = require('mammoth');
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
          }
          
          // For other Office docs, return placeholder for now
          return `Document content from ${path.basename(filePath)} - Office document processing requires additional setup.`;
        } catch (error) {
          console.log('Office document processing not available');
          return `Document: ${path.basename(filePath)} - Content extraction requires additional document processing libraries.`;
        }
      }

      // Fallback for other file types
      return `Document: ${path.basename(filePath)} - Content type: ${mimeType}`;
    } catch (error) {
      console.error(`Error extracting text from ${filePath}:`, error);
      return '';
    }
  }

  private chunkText(text: string, document: any, maxChunkSize: number = 1000): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    let chunkIndex = 0;
    let startChar = 0;

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (currentChunk.length + trimmedSentence.length > maxChunkSize && currentChunk.length > 0) {
        // Create chunk
        chunks.push({
          id: `${document.id}-chunk-${chunkIndex}`,
          documentId: document.id,
          content: currentChunk.trim(),
          chunkIndex,
          metadata: {
            documentName: document.name,
            originalName: document.originalName,
            mimeType: document.mimeType,
            startChar,
            endChar: startChar + currentChunk.length
          }
        });

        startChar += currentChunk.length;
        currentChunk = trimmedSentence + '. ';
        chunkIndex++;
      } else {
        currentChunk += trimmedSentence + '. ';
      }
    }

    // Add final chunk if there's remaining content
    if (currentChunk.trim().length > 0) {
      chunks.push({
        id: `${document.id}-chunk-${chunkIndex}`,
        documentId: document.id,
        content: currentChunk.trim(),
        chunkIndex,
        metadata: {
          documentName: document.name,
          originalName: document.originalName,
          mimeType: document.mimeType,
          startChar,
          endChar: startChar + currentChunk.length
        }
      });
    }

    return chunks;
  }

  private async vectorizeAndStore(chunks: DocumentChunk[]): Promise<void> {
    for (const chunk of chunks) {
      try {
        // Create vector embedding and store in Pinecone
        await pineconeVectorService.indexDocumentChunk(chunk);
      } catch (error) {
        console.error(`Error vectorizing chunk ${chunk.id}:`, error);
      }
    }
  }

  async processAllUploadedDocuments(): Promise<void> {
    try {
      const documents = await storage.getUserDocuments('simple-user-001');
      console.log(`Processing ${documents.length} uploaded documents for vectorization...`);
      
      for (const document of documents) {
        await this.processUploadedDocument(document.id);
      }
    } catch (error) {
      console.error('Error processing all documents:', error);
    }
  }
}

export const documentProcessor = new DocumentProcessor();