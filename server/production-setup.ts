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
  
  // Create the specific missing test file as text to avoid PDF parsing issues
  const testFile = path.join(process.cwd(), 'test/data/05-versions-space.pdf');
  if (!fs.existsSync(testFile)) {
    // Create simple text file to prevent missing file errors
    const textContent = 'Test file placeholder for deployment compatibility\nThis prevents pdf-parse test file dependency issues';
    fs.writeFileSync(testFile, textContent);
    console.log('Created test file placeholder for production deployment');
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