// Script to process all documents and make them searchable
import { db } from './server/db.ts';
import { documents, documentChunks } from './shared/schema.ts';
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

async function processAllDocuments() {
  console.log('🔄 Processing all documents for search...');
  
  try {
    // Get all documents from the database
    const allDocs = await db.select().from(documents);
    console.log(`📚 Found ${allDocs.length} documents to process`);
    
    let processedCount = 0;
    let errorCount = 0;
    
    for (const doc of allDocs) {
      try {
        console.log(`\n📄 Processing: ${doc.name}`);
        
        // Skip if already has chunks
        const existingChunks = await db
          .select()
          .from(documentChunks)
          .where({ documentId: doc.id })
          .limit(1);
          
        if (existingChunks.length > 0) {
          console.log(`  ✅ Already processed`);
          continue;
        }
        
        let content = '';
        
        // Extract content based on file type
        if (doc.mimeType === 'application/pdf' && doc.path) {
          try {
            const pdfBuffer = fs.readFileSync(doc.path);
            const pdfData = await pdf(pdfBuffer);
            content = pdfData.text;
          } catch (error) {
            console.log(`  ❌ Error reading PDF: ${error.message}`);
            continue;
          }
        } else if (doc.mimeType === 'text/csv' || doc.mimeType === 'text/plain') {
          try {
            content = fs.readFileSync(doc.path, 'utf8');
          } catch (error) {
            console.log(`  ❌ Error reading text file: ${error.message}`);
            continue;
          }
        } else {
          console.log(`  ⚠️ Unsupported file type: ${doc.mimeType}`);
          continue;
        }
        
        if (!content || content.trim().length < 10) {
          console.log(`  ⚠️ No content extracted`);
          continue;
        }
        
        // Create chunks from content
        const chunks = createTextChunks(content, doc);
        
        if (chunks.length > 0) {
          // Insert chunks into database
          await db.insert(documentChunks).values(chunks);
          console.log(`  ✅ Created ${chunks.length} searchable chunks`);
          processedCount++;
        }
        
      } catch (error) {
        console.log(`  ❌ Error processing ${doc.name}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Processing complete!`);
    console.log(`✅ Successfully processed: ${processedCount} documents`);
    console.log(`❌ Errors: ${errorCount} documents`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

function createTextChunks(content, document, maxChunkSize = 1000) {
  const chunks = [];
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  let chunkIndex = 0;
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        id: `${document.id}-chunk-${chunkIndex}`,
        documentId: document.id,
        content: currentChunk.trim(),
        chunkIndex: chunkIndex,
        metadata: {
          documentName: document.name,
          originalName: document.originalName,
          mimeType: document.mimeType,
          startChar: 0,
          endChar: currentChunk.length
        }
      });
      
      currentChunk = sentence.trim();
      chunkIndex++;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence.trim();
    }
  }
  
  // Add final chunk if there's content
  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: `${document.id}-chunk-${chunkIndex}`,
      documentId: document.id,
      content: currentChunk.trim(),
      chunkIndex: chunkIndex,
      metadata: {
        documentName: document.name,
        originalName: document.originalName,
        mimeType: document.mimeType,
        startChar: 0,
        endChar: currentChunk.length
      }
    });
  }
  
  return chunks;
}

// Run the processing
processAllDocuments()
  .then(() => {
    console.log('\n✅ All documents are now searchable!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Processing failed:', error);
    process.exit(1);
  });