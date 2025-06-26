// Deployment configuration to handle production environment differences
import fs from 'fs';
import path from 'path';

export function ensureProductionFiles() {
  // Create test data directory structure for pdf-parse dependency
  const testDataDir = path.join(process.cwd(), 'test', 'data');
  const missingTestFile = path.join(testDataDir, '05-versions-space.pdf');
  
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }
  
  if (!fs.existsSync(missingTestFile)) {
    // Create minimal PDF placeholder to prevent startup crashes
    const pdfPlaceholder = Buffer.from([
      0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, // %PDF-1.4
      0x0A, 0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A, // Binary header
      0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A, // endobj
      0x25, 0x25, 0x45, 0x4F, 0x46 // %%EOF
    ]);
    fs.writeFileSync(missingTestFile, pdfPlaceholder);
    console.log('✅ Created test data placeholder for production deployment');
  }
}

export function configureProductionServer() {
  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads directory for production');
  }
  
  // Ensure public directory exists for static files
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('✅ Created public directory for static files');
  }
  
  // Set production environment variables
  if (process.env.NODE_ENV === 'production') {
    process.env.PORT = process.env.PORT || '5000';
    console.log(`✅ Production server configured on port ${process.env.PORT}`);
  }
}

export function validateDeploymentEnvironment() {
  const requiredEnvVars = ['DATABASE_URL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  console.log('✅ All required environment variables present');
  return true;
}