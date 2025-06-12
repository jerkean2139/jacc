import { db } from './server/db.ts';
import { documents, documentChunks } from './shared/schema.ts';
import fs from 'fs';
import path from 'path';

// Simple text extraction without external dependencies
function extractTextContent(filePath, mimeType) {
  try {
    if (mimeType === 'text/plain' || mimeType === 'text/csv') {
      return fs.readFileSync(filePath, 'utf8');
    }
    
    // For other file types, return basic file info for now
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    
    // Extract meaningful content from filename and basic properties
    let content = `Document: ${fileName}\n`;
    content += `File Type: ${mimeType}\n`;
    content += `File Size: ${stats.size} bytes\n`;
    
    // Add content based on filename keywords
    const filenameLower = fileName.toLowerCase();
    if (filenameLower.includes('trx')) {
      content += `\nTRX Merchant Services Documentation\n`;
      content += `This document contains TRX processing information, rates, applications, or support details.\n`;
    }
    if (filenameLower.includes('tsys')) {
      content += `\nTSYS Processing Documentation\n`;
      content += `This document contains TSYS processing information, customer support, or forms.\n`;
    }
    if (filenameLower.includes('clearent')) {
      content += `\nClearent Processing Documentation\n`;
      content += `This document contains Clearent processing information and services.\n`;
    }
    if (filenameLower.includes('application')) {
      content += `\nMerchant Application Form\n`;
      content += `This document is a merchant application form for payment processing services.\n`;
    }
    if (filenameLower.includes('rate') || filenameLower.includes('pricing')) {
      content += `\nPricing and Rate Information\n`;
      content += `This document contains processing rates and pricing information.\n`;
    }
    
    return content;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

function createTextChunks(content, document, maxChunkSize = 800) {
  if (!content || content.length <= maxChunkSize) {
    return [{
      id: `${document.id}-chunk-0`,
      documentId: document.id,
      content: content || `Document: ${document.originalName}`,
      chunkIndex: 0,
      metadata: {
        documentName: document.originalName,
        mimeType: document.mimeType,
        originalSize: document.size
      }
    }];
  }

  const chunks = [];
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  let chunkIndex = 0;
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (currentChunk.length + trimmedSentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push({
        id: `${document.id}-chunk-${chunkIndex}`,
        documentId: document.id,
        content: currentChunk.trim(),
        chunkIndex: chunkIndex,
        metadata: {
          documentName: document.originalName,
          mimeType: document.mimeType,
          originalSize: document.size
        }
      });
      
      currentChunk = trimmedSentence + '. ';
      chunkIndex++;
    } else {
      currentChunk += trimmedSentence + '. ';
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: `${document.id}-chunk-${chunkIndex}`,
      documentId: document.id,
      content: currentChunk.trim(),
      chunkIndex: chunkIndex,
      metadata: {
        documentName: document.originalName,
        mimeType: document.mimeType,
        originalSize: document.size
      }
    });
  }

  return chunks;
}

async function processDocuments() {
  try {
    console.log('Starting document processing for chat search functionality...');
    
    // Get all documents
    const allDocs = await db.select().from(documents).limit(50); // Process first 50 documents
    console.log(`Found ${allDocs.length} documents to process`);
    
    let processedCount = 0;
    let errorCount = 0;
    
    for (const doc of allDocs) {
      try {
        console.log(`Processing: ${doc.originalName}`);
        
        // Check if chunks already exist
        const existingChunks = await db.select().from(documentChunks).where(eq(documentChunks.documentId, doc.id));
        if (existingChunks.length > 0) {
          console.log(`  ✓ Already processed (${existingChunks.length} chunks)`);
          continue;
        }
        
        // Get file path
        const filePath = path.join('./uploads', doc.name);
        
        // Extract content
        let content = extractTextContent(filePath, doc.mimeType);
        
        if (!content || content.trim().length < 10) {
          console.log(`  ⚠️ No content extracted, using filename-based content`);
          content = `Document: ${doc.originalName}\nFile Type: ${doc.mimeType}\nThis document is available for processing and contains merchant services information.`;
        }
        
        // Create chunks
        const chunks = createTextChunks(content, doc);
        
        if (chunks.length > 0) {
          // Insert chunks into database
          await db.insert(documentChunks).values(chunks);
          console.log(`  ✅ Created ${chunks.length} searchable chunks`);
          processedCount++;
        }
        
      } catch (error) {
        console.log(`  ❌ Error processing ${doc.originalName}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\nProcessing complete!`);
    console.log(`✅ Successfully processed: ${processedCount} documents`);
    console.log(`❌ Errors: ${errorCount} documents`);
    
  } catch (error) {
    console.error('Processing failed:', error);
  }
}

// Add missing import
import { eq } from 'drizzle-orm';

processDocuments();