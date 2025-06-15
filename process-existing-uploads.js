import fs from 'fs';
import path from 'path';
import { Pool } from '@neondatabase/serverless';

// Simple database connection for processing uploads
async function processExistingUploads() {
  console.log('Processing existing uploads to database...');
  
  const uploadsDir = './uploads';
  const files = fs.readdirSync(uploadsDir);
  
  let processed = 0;
  let skipped = 0;
  
  // Import database connection
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  for (const file of files) {
    if (file === 'extracted' || file === '.DS_Store' || file.startsWith('.')) continue;
    
    const filePath = path.join(uploadsDir, file);
    const stats = fs.statSync(filePath);
    
    if (!stats.isFile()) continue;
    
    try {
      // Check if document already exists
      const existingCheck = await pool.query(
        'SELECT id FROM documents WHERE name = $1 OR path = $2 LIMIT 1',
        [file, filePath]
      );
      
      if (existingCheck.rows.length > 0) {
        console.log(`  ✓ Already exists: ${file}`);
        skipped++;
        continue;
      }
      
      // Determine file type and extract basic info
      let mimeType = 'application/octet-stream';
      let originalName = file;
      
      if (file.toLowerCase().endsWith('.pdf')) mimeType = 'application/pdf';
      else if (file.toLowerCase().endsWith('.txt')) mimeType = 'text/plain';
      else if (file.toLowerCase().endsWith('.csv')) mimeType = 'text/csv';
      else if (file.toLowerCase().endsWith('.doc')) mimeType = 'application/msword';
      else if (file.toLowerCase().endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      // Generate unique ID
      const docId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Insert document record
      await pool.query(`
        INSERT INTO documents (
          id, name, "originalName", "mimeType", size, path, "userId", 
          "isFavorite", "isPublic", "adminOnly", "managerOnly", 
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        docId,
        file,
        originalName,
        mimeType,
        stats.size,
        filePath,
        'admin-user',
        false,
        false,
        false,
        false,
        new Date().toISOString(),
        new Date().toISOString()
      ]);
      
      console.log(`  ✓ Added to database: ${originalName}`);
      processed++;
      
    } catch (error) {
      console.error(`  ❌ Error processing ${file}:`, error.message);
    }
  }
  
  await pool.end();
  console.log(`\n📋 Processing complete:`);
  console.log(`   ✅ Added: ${processed} documents`);
  console.log(`   ⏭️  Skipped: ${skipped} existing documents`);
  console.log(`   📁 Total files in uploads: ${files.length}`);
}

// Run the processing
processExistingUploads().catch(console.error);