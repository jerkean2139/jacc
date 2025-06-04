import OpenAI from 'openai';

export interface SemanticChunk {
  id: string;
  content: string;
  startChar: number;
  endChar: number;
  semanticBoundary: 'sentence' | 'paragraph' | 'section' | 'topic';
  coherenceScore: number;
  keyTerms: string[];
  embeddingVector?: number[];
  metadata: {
    wordCount: number;
    sentenceCount: number;
    topicSignals: string[];
    structuralMarkers: string[];
  };
}

export interface ChunkingStrategy {
  maxChunkSize: number;
  minChunkSize: number;
  overlapSize: number;
  semanticThreshold: number;
  preserveBoundaries: boolean;
  useSliding: boolean;
}

export class SemanticChunkingService {
  private openai: OpenAI;
  private merchantTerms: Set<string>;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Domain-specific terms for merchant services
    this.merchantTerms = new Set([
      'processing rate', 'interchange', 'assessment', 'terminal', 'gateway',
      'chargeback', 'authorization', 'settlement', 'underwriting', 'PCI',
      'EMV', 'contactless', 'mobile payment', 'e-commerce', 'card present',
      'card not present', 'risk management', 'fraud prevention', 'ISO',
      'merchant account', 'acquirer', 'processor', 'payment facilitator'
    ]);
  }

  async chunkDocument(
    text: string, 
    documentId: string,
    strategy: ChunkingStrategy = this.getDefaultStrategy()
  ): Promise<SemanticChunk[]> {
    console.log(`🧩 Processing document ${documentId} with semantic chunking`);
    
    try {
      // Preprocess text for better chunking
      const preprocessedText = this.preprocessText(text);
      
      // Extract structural markers
      const structuralMarkers = this.extractStructuralMarkers(preprocessedText);
      
      // Generate sentence boundaries
      const sentences = this.extractSentences(preprocessedText);
      
      // Create semantic chunks using sliding window approach
      const chunks = strategy.useSliding 
        ? await this.createSlidingWindowChunks(sentences, strategy, structuralMarkers)
        : await this.createBoundaryBasedChunks(sentences, strategy, structuralMarkers);
      
      // Enhance chunks with semantic analysis
      const enhancedChunks = await this.enhanceChunksWithSemantics(chunks, documentId);
      
      console.log(`✨ Created ${enhancedChunks.length} semantic chunks`);
      return enhancedChunks;
    } catch (error) {
      console.error('Semantic chunking failed:', error);
      // Fallback to basic chunking
      return this.fallbackChunking(text, documentId, strategy);
    }
  }

  private getDefaultStrategy(): ChunkingStrategy {
    return {
      maxChunkSize: 1000,
      minChunkSize: 200,
      overlapSize: 100,
      semanticThreshold: 0.7,
      preserveBoundaries: true,
      useSliding: true
    };
  }

  private preprocessText(text: string): string {
    // Clean and normalize text while preserving structure
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .replace(/([.!?])\s*\n\s*/g, '$1\n\n') // Preserve paragraph breaks
      .trim();
  }

  private extractStructuralMarkers(text: string): string[] {
    const markers: string[] = [];
    
    // Headers and sections
    const headerPatterns = [
      /^(#+\s.*$)/gm, // Markdown headers
      /^([A-Z][^a-z]*:?\s*$)/gm, // All caps headers
      /^(\d+\.?\s+[A-Z].*$)/gm, // Numbered sections
      /^([A-Z][a-z\s]*:$)/gm // Title case headers with colon
    ];
    
    headerPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) markers.push(...matches);
    });
    
    return markers;
  }

  private extractSentences(text: string): Array<{content: string, start: number, end: number}> {
    const sentences: Array<{content: string, start: number, end: number}> = [];
    
    // Enhanced sentence boundary detection
    const sentencePattern = /([^.!?]*[.!?](?:\s|$))/g;
    let match;
    
    while ((match = sentencePattern.exec(text)) !== null) {
      const content = match[1].trim();
      if (content.length > 10) { // Filter out very short fragments
        sentences.push({
          content,
          start: match.index,
          end: match.index + match[1].length
        });
      }
    }
    
    return sentences;
  }

  private async createSlidingWindowChunks(
    sentences: Array<{content: string, start: number, end: number}>,
    strategy: ChunkingStrategy,
    structuralMarkers: string[]
  ): Promise<SemanticChunk[]> {
    const chunks: SemanticChunk[] = [];
    let currentChunk = '';
    let chunkStart = 0;
    let sentenceIndex = 0;

    while (sentenceIndex < sentences.length) {
      const sentence = sentences[sentenceIndex];
      const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + sentence.content;
      
      if (potentialChunk.length <= strategy.maxChunkSize) {
        if (!currentChunk) chunkStart = sentence.start;
        currentChunk = potentialChunk;
        sentenceIndex++;
      } else {
        // Create chunk if we have enough content
        if (currentChunk.length >= strategy.minChunkSize) {
          const chunk = await this.createSemanticChunk(
            currentChunk,
            chunkStart,
            sentences[sentenceIndex - 1].end,
            chunks.length,
            structuralMarkers
          );
          chunks.push(chunk);
          
          // Start new chunk with overlap
          const overlapSentences = this.calculateOverlapSentences(
            sentences,
            sentenceIndex - 1,
            strategy.overlapSize
          );
          currentChunk = overlapSentences.content;
          chunkStart = overlapSentences.start;
          sentenceIndex = overlapSentences.nextIndex;
        } else {
          sentenceIndex++;
        }
      }
    }
    
    // Add final chunk
    if (currentChunk.length >= strategy.minChunkSize) {
      const chunk = await this.createSemanticChunk(
        currentChunk,
        chunkStart,
        sentences[sentences.length - 1].end,
        chunks.length,
        structuralMarkers
      );
      chunks.push(chunk);
    }
    
    return chunks;
  }

  private async createBoundaryBasedChunks(
    sentences: Array<{content: string, start: number, end: number}>,
    strategy: ChunkingStrategy,
    structuralMarkers: string[]
  ): Promise<SemanticChunk[]> {
    const chunks: SemanticChunk[] = [];
    const paragraphs = this.groupSentencesByParagraph(sentences);
    
    for (const paragraph of paragraphs) {
      if (paragraph.totalLength <= strategy.maxChunkSize) {
        const chunk = await this.createSemanticChunk(
          paragraph.content,
          paragraph.start,
          paragraph.end,
          chunks.length,
          structuralMarkers
        );
        chunks.push(chunk);
      } else {
        // Split large paragraphs while preserving semantic boundaries
        const subChunks = await this.splitLargeParagraph(paragraph, strategy, structuralMarkers);
        chunks.push(...subChunks);
      }
    }
    
    return chunks;
  }

  private calculateOverlapSentences(
    sentences: Array<{content: string, start: number, end: number}>,
    currentIndex: number,
    overlapSize: number
  ): {content: string, start: number, nextIndex: number} {
    let overlapContent = '';
    let overlapLength = 0;
    let startIndex = currentIndex;
    
    // Go backwards to collect overlap
    while (startIndex >= 0 && overlapLength < overlapSize) {
      const sentence = sentences[startIndex];
      if (overlapLength + sentence.content.length <= overlapSize) {
        overlapContent = sentence.content + (overlapContent ? ' ' : '') + overlapContent;
        overlapLength += sentence.content.length;
        startIndex--;
      } else {
        break;
      }
    }
    
    return {
      content: overlapContent,
      start: startIndex >= 0 ? sentences[startIndex + 1].start : sentences[0].start,
      nextIndex: startIndex + 1
    };
  }

  private groupSentencesByParagraph(sentences: Array<{content: string, start: number, end: number}>) {
    // Group sentences into logical paragraphs based on content breaks
    const paragraphs: Array<{content: string, start: number, end: number, totalLength: number}> = [];
    let currentParagraph = '';
    let paragraphStart = 0;
    let paragraphEnd = 0;
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      
      if (!currentParagraph) {
        paragraphStart = sentence.start;
        currentParagraph = sentence.content;
      } else {
        currentParagraph += ' ' + sentence.content;
      }
      
      paragraphEnd = sentence.end;
      
      // Check for paragraph break (look ahead for content gaps or structural markers)
      const isLastSentence = i === sentences.length - 1;
      const nextSentenceGap = !isLastSentence ? sentences[i + 1].start - sentence.end : 0;
      const hasStructuralBreak = nextSentenceGap > 50; // Significant whitespace gap
      
      if (isLastSentence || hasStructuralBreak) {
        paragraphs.push({
          content: currentParagraph,
          start: paragraphStart,
          end: paragraphEnd,
          totalLength: currentParagraph.length
        });
        currentParagraph = '';
      }
    }
    
    return paragraphs;
  }

  private async splitLargeParagraph(
    paragraph: {content: string, start: number, end: number, totalLength: number},
    strategy: ChunkingStrategy,
    structuralMarkers: string[]
  ): Promise<SemanticChunk[]> {
    const sentences = this.extractSentences(paragraph.content);
    return this.createSlidingWindowChunks(sentences, strategy, structuralMarkers);
  }

  private async createSemanticChunk(
    content: string,
    start: number,
    end: number,
    index: number,
    structuralMarkers: string[]
  ): Promise<SemanticChunk> {
    const keyTerms = this.extractKeyTerms(content);
    const semanticBoundary = this.determineBoundaryType(content, structuralMarkers);
    const coherenceScore = await this.calculateCoherenceScore(content);
    
    return {
      id: `chunk_${index}_${Date.now()}`,
      content,
      startChar: start,
      endChar: end,
      semanticBoundary,
      coherenceScore,
      keyTerms,
      metadata: {
        wordCount: content.split(/\s+/).length,
        sentenceCount: content.split(/[.!?]+/).length - 1,
        topicSignals: this.extractTopicSignals(content),
        structuralMarkers: structuralMarkers.filter(marker => 
          content.toLowerCase().includes(marker.toLowerCase())
        )
      }
    };
  }

  private extractKeyTerms(content: string): string[] {
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const termFreq = new Map<string, number>();
    
    // Count merchant-specific terms
    words.forEach(word => {
      if (this.merchantTerms.has(word) || word.length > 4) {
        termFreq.set(word, (termFreq.get(word) || 0) + 1);
      }
    });
    
    // Return top terms by frequency
    return Array.from(termFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([term]) => term);
  }

  private determineBoundaryType(content: string, structuralMarkers: string[]): 'sentence' | 'paragraph' | 'section' | 'topic' {
    // Check for structural markers
    const hasStructuralMarkers = structuralMarkers.some(marker => 
      content.includes(marker)
    );
    
    if (hasStructuralMarkers) return 'section';
    
    // Check sentence vs paragraph boundaries
    const sentenceCount = (content.match(/[.!?]/g) || []).length;
    if (sentenceCount === 1) return 'sentence';
    if (sentenceCount <= 3) return 'paragraph';
    
    return 'topic';
  }

  private async calculateCoherenceScore(content: string): Promise<number> {
    try {
      // Simple coherence scoring based on content structure and merchant domain relevance
      const merchantTermCount = Array.from(this.merchantTerms).filter(term => 
        content.toLowerCase().includes(term)
      ).length;
      
      const structureScore = this.calculateStructureScore(content);
      const domainRelevance = Math.min(merchantTermCount / 5, 1); // Max score at 5+ terms
      
      return (structureScore + domainRelevance) / 2;
    } catch (error) {
      return 0.5; // Default coherence score
    }
  }

  private calculateStructureScore(content: string): number {
    let score = 0.5; // Base score
    
    // Reward proper punctuation
    const sentenceEndings = (content.match(/[.!?]/g) || []).length;
    const wordCount = content.split(/\s+/).length;
    if (sentenceEndings > 0 && wordCount / sentenceEndings < 50) {
      score += 0.2; // Well-structured sentences
    }
    
    // Reward logical flow indicators
    const flowIndicators = ['first', 'second', 'then', 'however', 'therefore', 'additionally'];
    const foundIndicators = flowIndicators.filter(indicator => 
      content.toLowerCase().includes(indicator)
    ).length;
    score += Math.min(foundIndicators * 0.1, 0.3);
    
    return Math.min(score, 1);
  }

  private extractTopicSignals(content: string): string[] {
    const signals: string[] = [];
    
    // Look for topic indicators
    const topicPatterns = [
      /\b(regarding|about|concerning|related to)\s+([^.!?]+)/gi,
      /\b(the topic of|subject of|matter of)\s+([^.!?]+)/gi,
      /\b(specifically|particularly|especially)\s+([^.!?]+)/gi
    ];
    
    topicPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        signals.push(...matches.map(match => match.trim()));
      }
    });
    
    return signals.slice(0, 5); // Limit topic signals
  }

  private async enhanceChunksWithSemantics(chunks: SemanticChunk[], documentId: string): Promise<SemanticChunk[]> {
    // Generate embeddings for high-quality chunks
    const enhancedChunks = await Promise.all(
      chunks.map(async (chunk) => {
        if (chunk.coherenceScore > 0.6 && chunk.content.length > 100) {
          try {
            const embedding = await this.generateEmbedding(chunk.content);
            return { ...chunk, embeddingVector: embedding };
          } catch (error) {
            console.warn(`Failed to generate embedding for chunk ${chunk.id}`);
            return chunk;
          }
        }
        return chunk;
      })
    );
    
    return enhancedChunks;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text.substring(0, 8192),
      encoding_format: "float",
    });
    
    return response.data[0].embedding;
  }

  private fallbackChunking(text: string, documentId: string, strategy: ChunkingStrategy): SemanticChunk[] {
    console.log('Using fallback chunking for document:', documentId);
    
    const chunks: SemanticChunk[] = [];
    const words = text.split(/\s+/);
    let currentChunk = '';
    let start = 0;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + word;
      
      if (potentialChunk.length <= strategy.maxChunkSize) {
        currentChunk = potentialChunk;
      } else {
        if (currentChunk.length >= strategy.minChunkSize) {
          chunks.push({
            id: `fallback_${chunks.length}_${Date.now()}`,
            content: currentChunk,
            startChar: start,
            endChar: start + currentChunk.length,
            semanticBoundary: 'paragraph',
            coherenceScore: 0.5,
            keyTerms: this.extractKeyTerms(currentChunk),
            metadata: {
              wordCount: currentChunk.split(/\s+/).length,
              sentenceCount: (currentChunk.match(/[.!?]/g) || []).length,
              topicSignals: [],
              structuralMarkers: []
            }
          });
        }
        start += currentChunk.length + 1;
        currentChunk = word;
      }
    }
    
    // Add final chunk
    if (currentChunk.length >= strategy.minChunkSize) {
      chunks.push({
        id: `fallback_${chunks.length}_${Date.now()}`,
        content: currentChunk,
        startChar: start,
        endChar: start + currentChunk.length,
        semanticBoundary: 'paragraph',
        coherenceScore: 0.5,
        keyTerms: this.extractKeyTerms(currentChunk),
        metadata: {
          wordCount: currentChunk.split(/\s+/).length,
          sentenceCount: (currentChunk.match(/[.!?]/g) || []).length,
          topicSignals: [],
          structuralMarkers: []
        }
      });
    }
    
    return chunks;
  }
}

export const semanticChunkingService = new SemanticChunkingService();