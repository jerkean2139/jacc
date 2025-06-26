// Production deployment setup and error handling
import fs from 'fs';
import path from 'path';

export function createTestDataPlaceholders() {
  // Create required test directory structure for pdf-parse dependency
  const testDirs = [
    'test/data',
    'node_modules/pdf-parse/test/data'
  ];
  
  testDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
  
  // Create the specific missing PDF test file
  const testFile = path.join(process.cwd(), 'test/data/05-versions-space.pdf');
  if (!fs.existsSync(testFile)) {
    // Create minimal valid PDF structure
    const pdfContent = Buffer.from([
      0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A, // %PDF-1.4\n
      0x31, 0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A, 0x0A,       // 1 0 obj\n
      0x3C, 0x3C, 0x2F, 0x54, 0x79, 0x70, 0x65, 0x2F,       // <</Type/
      0x43, 0x61, 0x74, 0x61, 0x6C, 0x6F, 0x67, 0x3E,       // Catalog>
      0x3E, 0x0A, 0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A, // >\nendobj\n
      0x78, 0x72, 0x65, 0x66, 0x0A,                         // xref\n
      0x30, 0x20, 0x31, 0x0A,                               // 0 1\n
      0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30,       // 00000000
      0x30, 0x30, 0x20, 0x36, 0x35, 0x35, 0x33, 0x35,       // 00 65535
      0x20, 0x66, 0x0A,                                     //  f\n
      0x74, 0x72, 0x61, 0x69, 0x6C, 0x65, 0x72, 0x3C,       // trailer<
      0x3C, 0x2F, 0x52, 0x6F, 0x6F, 0x74, 0x20, 0x31,       // </Root 1
      0x20, 0x30, 0x20, 0x52, 0x3E, 0x3E, 0x0A,             //  0 R>>\n
      0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, 0x65,       // startxre
      0x66, 0x0A, 0x39, 0x0A,                               // f\n9\n
      0x25, 0x25, 0x45, 0x4F, 0x46                          // %%EOF
    ]);
    
    fs.writeFileSync(testFile, pdfContent);
    console.log('Created PDF test placeholder for production deployment');
  }
  
  // Also create the file in node_modules location if it doesn't exist
  const nodeModulesTestFile = path.join(process.cwd(), 'node_modules/pdf-parse/test/data/05-versions-space.pdf');
  if (!fs.existsSync(nodeModulesTestFile) && fs.existsSync(path.dirname(nodeModulesTestFile))) {
    fs.copyFileSync(testFile, nodeModulesTestFile);
    console.log('Copied PDF test file to node_modules location');
  }
}

export function setupProductionDirectories() {
  const requiredDirs = [
    'uploads',
    'public',
    'dist',
    'temp',
    'test/data'
  ];
  
  requiredDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`Created production directory: ${dir}`);
    }
  });
}

export function validateProductionEnvironment() {
  const checks = {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    databaseUrl: !!process.env.DATABASE_URL,
    testFileExists: fs.existsSync(path.join(process.cwd(), 'test/data/05-versions-space.pdf')),
    uploadsDir: fs.existsSync(path.join(process.cwd(), 'uploads')),
    publicDir: fs.existsSync(path.join(process.cwd(), 'public'))
  };
  
  console.log('Production Environment Validation:');
  console.log(`- NODE_ENV: ${checks.nodeEnv || 'not set'}`);
  console.log(`- PORT: ${checks.port || 'using default 5000'}`);
  console.log(`- Database URL: ${checks.databaseUrl ? 'configured' : 'missing'}`);
  console.log(`- Test files: ${checks.testFileExists ? 'present' : 'missing'}`);
  console.log(`- Uploads directory: ${checks.uploadsDir ? 'exists' : 'missing'}`);
  console.log(`- Public directory: ${checks.publicDir ? 'exists' : 'missing'}`);
  
  return checks;
}

export function setupErrorHandling() {
  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
  });
  
  // Uncaught exception handling
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Don't exit on uncaught exceptions in production to maintain availability
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Log but don't crash in production
  });
}