import crypto from 'crypto';
import fs from 'fs';
import { db } from './db';
import { documents } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export interface DuplicateCheck {
  isDuplicate: boolean;
  existingDocument?: any;
  similarDocuments: any[];
  contentHash: string;
  nameHash: string;
}

export class DuplicateDetectionService {
  
  async checkForDuplicates(
    filePath: string, 
    originalName: string, 
    userId: string
  ): Promise<DuplicateCheck> {
    
    // Generate content hash from file
    const contentHash = await this.generateFileHash(filePath);
    const nameHash = this.generateNameHash(originalName);
    
    // Check for exact content match
    const exactMatch = await db
      .select()
      .from(documents)
      .where(and(
        eq(documents.userId, userId),
        eq(documents.contentHash, contentHash)
      ))
      .limit(1);
    
    if (exactMatch.length > 0) {
      return {
        isDuplicate: true,
        existingDocument: exactMatch[0],
        similarDocuments: [],
        contentHash,
        nameHash
      };
    }
    
    // Check for similar names (potential duplicates with minor changes)
    const similarByName = await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId));
    
    const similarDocuments = similarByName.filter(doc => 
      this.calculateNameSimilarity(originalName, doc.originalName) > 0.8
    );
    
    return {
      isDuplicate: false,
      existingDocument: undefined,
      similarDocuments,
      contentHash,
      nameHash
    };
  }
  
  private async generateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }
  
  private generateNameHash(filename: string): string {
    // Normalize filename for comparison (remove extensions, special chars, etc.)
    const normalized = filename
      .toLowerCase()
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-z0-9]/g, '') // Remove special characters
      .trim();
    
    return crypto.createHash('md5').update(normalized).digest('hex');
  }
  
  public calculateNameSimilarity(name1: string, name2: string): number {
    const norm1 = this.normalizeFilename(name1);
    const norm2 = this.normalizeFilename(name2);
    
    // Use Levenshtein distance for similarity
    const distance = this.levenshteinDistance(norm1, norm2);
    const maxLength = Math.max(norm1.length, norm2.length);
    
    return maxLength > 0 ? 1 - (distance / maxLength) : 1;
  }
  
  private normalizeFilename(filename: string): string {
    return filename
      .toLowerCase()
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-z0-9\s]/g, '') // Keep only alphanumeric and spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
  
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  async updateDocumentHash(documentId: string, contentHash: string): Promise<void> {
    await db
      .update(documents)
      .set({ contentHash })
      .where(eq(documents.id, documentId));
  }
  
  generateDuplicateReport(check: DuplicateCheck, originalName: string): string {
    if (check.isDuplicate) {
      return `Duplicate detected: "${originalName}" is identical to existing file "${check.existingDocument.originalName}" uploaded on ${new Date(check.existingDocument.createdAt).toLocaleDateString()}`;
    }
    
    if (check.similarDocuments.length > 0) {
      const similarNames = check.similarDocuments.map(doc => doc.originalName).join(', ');
      return `Similar files found: ${similarNames}. Proceeding with upload.`;
    }
    
    return `No duplicates found. Proceeding with upload.`;
  }
}

export const duplicateDetectionService = new DuplicateDetectionService();