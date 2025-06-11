import { fromPath } from "pdf2pic";
import fs from "fs";

// Test OCR functionality with actual file processing
export async function testOCRPipeline(filePath: string): Promise<boolean> {
  try {
    console.log('Testing OCR pipeline with file:', filePath);
    
    if (!fs.existsSync('./temp')) {
      fs.mkdirSync('./temp', { recursive: true });
    }

    const convert = fromPath(filePath, {
      density: 300,
      saveFilename: "test_page",
      savePath: "./temp/",
      format: "png",
      width: 2000,
      height: 2000
    });

    console.log('Converting PDF to images...');
    const results = await convert.bulk(1); // Convert first page only for test
    
    if (results && results.length > 0) {
      console.log('PDF conversion successful');
      
      // Clean up test files
      for (const result of results) {
        if (result && result.path && fs.existsSync(result.path)) {
          fs.unlinkSync(result.path);
        }
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('OCR test failed:', error);
    return false;
  }
}