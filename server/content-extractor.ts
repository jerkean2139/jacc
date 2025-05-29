import fs from 'fs';
import { storage } from './storage';

interface DocumentContent {
  text: string;
  chunks: string[];
}

async function extractDocumentContent(filePath: string, mimeType: string): Promise<string> {
  try {
    if (!fs.existsSync(filePath)) {
      return '';
    }

    // PDF documents
    if (mimeType === 'application/pdf') {
      try {
        const pdfParse = require('pdf-parse');
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
      } catch (error) {
        console.log('PDF parsing failed, using filename-based search');
        return '';
      }
    }

    // Word documents
    if (mimeType.includes('wordprocessingml')) {
      try {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
      } catch (error) {
        console.log('Word document parsing failed, using filename-based search');
        return '';
      }
    }

    // Text-based files
    if (mimeType.includes('text/') || mimeType.includes('csv')) {
      return fs.readFileSync(filePath, 'utf8');
    }

    return '';
  } catch (error) {
    console.error(`Content extraction error for ${filePath}:`, error);
    return '';
  }
}

function chunkContent(text: string, maxChunkSize: number = 1000): string[] {
  if (!text || text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (currentChunk.length + trimmedSentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmedSentence + '. ';
    } else {
      currentChunk += trimmedSentence + '. ';
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export async function processDocumentForSearch(documentId: string): Promise<void> {
  try {
    const document = await storage.getDocument(documentId);
    if (!document) return;

    const content = await extractDocumentContent(document.path, document.mimeType);
    
    if (content && content.length > 100) {
      const chunks = chunkContent(content);
      console.log(`Extracted ${chunks.length} chunks from ${document.originalName}`);
      
      // Store content chunks for enhanced search (could be stored in database or vector store)
      // For now, we'll enhance the filename-based search with content awareness
    }
  } catch (error) {
    console.error(`Document processing error for ${documentId}:`, error);
  }
}

export { extractDocumentContent, chunkContent };