import yauzl from "yauzl";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import type { InsertDocument, InsertFolder } from "@shared/schema";

export interface ZipProcessingResult {
  extractedFiles: string[];
  foldersCreated: string[];
  documentsCreated: string[];
  errors: string[];
}

export class ZipProcessor {
  private extractDir: string;

  constructor() {
    this.extractDir = path.join(process.cwd(), "uploads", "extracted");
    this.ensureExtractDir();
  }

  private ensureExtractDir() {
    if (!fs.existsSync(this.extractDir)) {
      fs.mkdirSync(this.extractDir, { recursive: true });
    }
  }

  async processZipFile(zipPath: string, userId: string, parentFolderId?: string): Promise<ZipProcessingResult> {
    const result: ZipProcessingResult = {
      extractedFiles: [],
      foldersCreated: [],
      documentsCreated: [],
      errors: []
    };

    return new Promise((resolve) => {
      yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          result.errors.push(`Failed to open ZIP file: ${err.message}`);
          resolve(result);
          return;
        }

        if (!zipfile) {
          result.errors.push("Invalid ZIP file");
          resolve(result);
          return;
        }

        const folderMap = new Map<string, string>(); // path -> folderId
        let pendingOperations = 0;
        let completed = false;

        const checkCompletion = () => {
          if (pendingOperations === 0 && completed) {
            resolve(result);
          }
        };

        zipfile.readEntry();

        zipfile.on("entry", async (entry) => {
          if (completed) return;

          const fileName = entry.fileName;
          const isDirectory = fileName.endsWith('/');

          try {
            if (isDirectory) {
              // Create folder
              pendingOperations++;
              const folderPath = fileName.slice(0, -1); // Remove trailing slash
              const folderName = path.basename(folderPath);
              const parentPath = path.dirname(folderPath);
              
              let parentId = parentFolderId;
              if (parentPath !== '.' && folderMap.has(parentPath)) {
                parentId = folderMap.get(parentPath);
              }

              const folderData: InsertFolder = {
                name: folderName,
                description: `Extracted from ZIP: ${path.basename(zipPath)}`,
                parentId,
                userId
              };

              try {
                const folder = await storage.createFolder(folderData);
                folderMap.set(folderPath, folder.id);
                result.foldersCreated.push(folder.id);
              } catch (error) {
                result.errors.push(`Failed to create folder ${folderName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }

              pendingOperations--;
              zipfile.readEntry();
              checkCompletion();
            } else {
              // Extract file
              pendingOperations++;
              
              zipfile.openReadStream(entry, async (err, readStream) => {
                if (err) {
                  result.errors.push(`Failed to read ${fileName}: ${err.message}`);
                  pendingOperations--;
                  zipfile.readEntry();
                  checkCompletion();
                  return;
                }

                if (!readStream) {
                  result.errors.push(`No stream for ${fileName}`);
                  pendingOperations--;
                  zipfile.readEntry();
                  checkCompletion();
                  return;
                }

                // Create unique filename
                const timestamp = Date.now();
                const sanitizedName = path.basename(fileName).replace(/[^a-zA-Z0-9.-]/g, '_');
                const extractedPath = path.join(this.extractDir, `${timestamp}_${sanitizedName}`);

                const writeStream = fs.createWriteStream(extractedPath);
                
                writeStream.on('error', (error) => {
                  result.errors.push(`Failed to write ${fileName}: ${error.message}`);
                  pendingOperations--;
                  zipfile.readEntry();
                  checkCompletion();
                });

                writeStream.on('finish', async () => {
                  try {
                    // Determine folder for this file
                    const filePath = fileName;
                    const fileDir = path.dirname(filePath);
                    let targetFolderId = parentFolderId;
                    
                    if (fileDir !== '.' && folderMap.has(fileDir)) {
                      targetFolderId = folderMap.get(fileDir);
                    }

                    // Get file stats
                    const stats = fs.statSync(extractedPath);
                    const mimeType = this.getMimeType(extractedPath);

                    // Create document record
                    const documentData: InsertDocument = {
                      name: path.basename(fileName),
                      originalName: path.basename(fileName),
                      mimeType,
                      size: stats.size,
                      path: extractedPath,
                      userId,
                      folderId: targetFolderId
                    };

                    const document = await storage.createDocument(documentData);
                    result.documentsCreated.push(document.id);
                    result.extractedFiles.push(extractedPath);

                  } catch (error) {
                    result.errors.push(`Failed to save document ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }

                  pendingOperations--;
                  zipfile.readEntry();
                  checkCompletion();
                });

                readStream.pipe(writeStream);
              });
            }
          } catch (error) {
            result.errors.push(`Error processing ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            pendingOperations--;
            zipfile.readEntry();
            checkCompletion();
          }
        });

        zipfile.on("end", () => {
          completed = true;
          checkCompletion();
        });

        zipfile.on("error", (error) => {
          result.errors.push(`ZIP processing error: ${error.message}`);
          completed = true;
          checkCompletion();
        });
      });
    });
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.txt': 'text/plain'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  cleanup(extractedFiles: string[]) {
    extractedFiles.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error(`Failed to cleanup file ${filePath}:`, error);
      }
    });
  }
}

export const zipProcessor = new ZipProcessor();