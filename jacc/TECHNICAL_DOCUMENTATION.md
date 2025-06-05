# Tracer AI Assistant - Technical Documentation

## System Overview

Tracer is an AI-powered merchant services assistant built with a modern full-stack architecture. The platform provides intelligent document processing, real-time rate calculations, and adaptive business intelligence through a progressive web application interface.

## Architecture Stack

### Frontend Technologies
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server
- **Wouter** for lightweight client-side routing
- **TanStack Query v5** for server state management and caching
- **Tailwind CSS** with shadcn/ui components for consistent styling
- **Radix UI** primitives for accessible component foundations
- **Framer Motion** for smooth animations and transitions

### Backend Technologies
- **Node.js** with Express.js server framework
- **TypeScript** for end-to-end type safety
- **Drizzle ORM** for database operations and schema management
- **PostgreSQL** (Neon) for primary data storage
- **Passport.js** with local strategy for authentication
- **Express Session** with PostgreSQL session store

### AI and ML Integrations
- **Claude AI (Anthropic)** as primary language model
- **OpenAI GPT** as fallback language model
- **Pinecone** for vector database and semantic search
- **Perplexity API** for real-time web search capabilities
- **Custom prompt chaining** for enhanced AI responses

## Database Architecture

### Core Schema (shared/schema.ts)

#### User Management
```typescript
users: {
  id: serial primary key
  username: unique string
  password: hashed string
  email: string
  createdAt: timestamp
}
```

#### Chat System
```typescript
chats: {
  id: uuid primary key
  userId: foreign key to users
  title: string
  isArchived: boolean
  createdAt: timestamp
}

messages: {
  id: uuid primary key
  chatId: foreign key to chats
  role: 'user' | 'assistant' | 'system'
  content: text
  createdAt: timestamp
}
```

#### Document Management
```typescript
documents: {
  id: uuid primary key
  userId: foreign key to users
  name: string
  originalName: string
  mimeType: string
  size: integer
  folderId: foreign key to folders
  filePath: string
  isProcessed: boolean
  contentHash: string (SHA256)
  nameHash: string (MD5)
  createdAt: timestamp
}

folders: {
  id: uuid primary key
  userId: foreign key to users
  name: string
  createdAt: timestamp
}
```

#### Gamification System
```typescript
userStats: {
  id: uuid primary key
  userId: foreign key to users
  totalMessages: integer
  calculationsPerformed: integer
  documentsAnalyzed: integer
  proposalsGenerated: integer
  level: integer
  experience: integer
  streak: integer
  lastActiveDate: date
}

achievements: {
  id: uuid primary key
  name: string
  description: text
  requirement: jsonb
  badgeIcon: string
}

userAchievements: {
  id: uuid primary key
  userId: foreign key to users
  achievementId: foreign key to achievements
  unlockedAt: timestamp
}
```

## AI System Architecture

### Prompt Structure and Chaining

#### Primary AI Service (enhanced-ai.ts)
The system uses a sophisticated prompt chaining approach:

1. **System Context Injection**
```typescript
const systemPrompt = `You are Tracer, an AI assistant specializing in merchant services...
Current date: ${new Date().toLocaleDateString()}
User context: ${userContext}
Available documents: ${documentContext}`;
```

2. **Document Context Integration**
```typescript
async function generateResponseWithDocuments(query: string, searchResults: VectorSearchResult[]) {
  const documentContext = formatDocumentContext(searchResults);
  const enhancedPrompt = `${basePrompt}\n\nRelevant Documents:\n${documentContext}\n\nUser Query: ${query}`;
}
```

3. **Multi-Step Reasoning Chain**
```typescript
async function generateChainedResponse(query: string) {
  // Step 1: Intent analysis
  const intent = await analyzeUserIntent(query);
  
  // Step 2: Document retrieval
  const relevantDocs = await searchDocuments(query);
  
  // Step 3: External data integration
  const externalData = await getRelevantExternalData(intent);
  
  // Step 4: Response synthesis
  const response = await synthesizeResponse(query, relevantDocs, externalData, intent);
}
```

### Vector Database Integration

#### Document Processing Pipeline

1. **Content Extraction** (content-extractor.ts)
```typescript
async function extractDocumentContent(filePath: string, mimeType: string): Promise<string> {
  switch (mimeType) {
    case 'application/pdf':
      return await extractPDFContent(filePath);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return await extractDOCXContent(filePath);
    case 'text/plain':
      return await fs.readFile(filePath, 'utf-8');
  }
}
```

2. **Chunking Strategy**
```typescript
function chunkContent(text: string, maxChunkSize: number = 1000): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}
```

3. **Vector Storage** (document-processor.ts)
```typescript
class DocumentProcessor {
  async vectorizeAndStore(chunks: DocumentChunk[]): Promise<void> {
    const vectors = [];
    
    for (const chunk of chunks) {
      // Generate embeddings using OpenAI
      const embedding = await this.generateEmbedding(chunk.content);
      
      vectors.push({
        id: chunk.id,
        values: embedding,
        metadata: {
          documentId: chunk.documentId,
          content: chunk.content,
          chunkIndex: chunk.chunkIndex,
          documentName: chunk.metadata.documentName,
          mimeType: chunk.metadata.mimeType
        }
      });
    }
    
    // Store in Pinecone with namespace organization
    await pinecone.index('tracer-documents').namespace(this.getNamespace(chunks[0])).upsert(vectors);
  }
  
  private getNamespace(chunk: DocumentChunk): string {
    const { mimeType, documentName } = chunk.metadata;
    
    if (mimeType.includes('pdf')) return 'pdf-documents';
    if (mimeType.includes('word')) return 'word-documents';
    if (documentName.toLowerCase().includes('pricing')) return 'pricing-sheets';
    if (documentName.toLowerCase().includes('contract')) return 'contracts';
    
    return 'general-documents';
  }
}
```

#### Semantic Search Implementation

```typescript
async function searchDocuments(query: string): Promise<VectorSearchResult[]> {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  
  // Search across relevant namespaces
  const namespaces = determineRelevantNamespaces(query);
  const searchPromises = namespaces.map(namespace => 
    pinecone.index('tracer-documents')
      .namespace(namespace)
      .query({
        vector: queryEmbedding,
        topK: 5,
        includeMetadata: true,
        filter: { userId: currentUserId }
      })
  );
  
  const results = await Promise.all(searchPromises);
  return aggregateAndRankResults(results, query);
}
```

## Google Drive Integration

### Service Account Authentication (google-drive.ts)
```typescript
class GoogleDriveService {
  constructor() {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
    this.auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly']
    });
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }
  
  async scanAndProcessFolder(folderId: string): Promise<ProcessedDocument[]> {
    const files = await this.listFolderContents(folderId);
    const processedDocs = [];
    
    for (const file of files) {
      if (this.isSupportedFileType(file.mimeType)) {
        const buffer = await this.downloadFile(file.id);
        const content = await this.extractTextFromFile(file, buffer);
        const chunks = this.chunkDocument(content);
        
        const processedDoc = {
          id: file.id,
          name: file.name,
          content,
          chunks,
          metadata: {
            mimeType: file.mimeType,
            size: file.size,
            modifiedTime: file.modifiedTime,
            webViewLink: file.webViewLink
          }
        };
        
        await this.vectorizeAndStore(processedDoc);
        processedDocs.push(processedDoc);
      }
    }
    
    return processedDocs;
  }
}
```

## ISO AMP API Integration

### Rate Calculation Engine (iso-amp-api.ts)
```typescript
class ISOAMPService {
  async getRateComparisons(businessData: BusinessData): Promise<RateComparison[]> {
    try {
      // Attempt external API call
      const response = await this.makeAPIRequest('/rates/compare', 'POST', businessData);
      return response.comparisons;
    } catch (error) {
      // Fallback to internal calculation engine
      return this.generateEnhancedRateComparisons(businessData);
    }
  }
  
  private generateEnhancedRateComparisons(businessData: BusinessData): RateComparison[] {
    const riskLevel = this.assessBusinessRisk(businessData);
    const interchangeRates = this.getInterchangeRates();
    const tracerRates = this.calculateTracerRates(businessData, riskLevel);
    const competitorRates = this.generateCompetitorRates(businessData, riskLevel);
    
    return [tracerRates, ...competitorRates].map(rates => ({
      ...rates,
      advantages: this.getProviderAdvantages(rates.provider, businessData),
      disadvantages: this.getProviderDisadvantages(rates.provider, businessData),
      overallRating: this.calculateOverallRating(rates, businessData)
    }));
  }
}
```

## Authentication and Session Management

### Passport Configuration (auth.ts)
```typescript
export function setupAuth(app: Express) {
  // Session configuration
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({
      pool: dbPool,
      createTableIfMissing: true
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };
  
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Local strategy with bcrypt password hashing
  passport.use(new LocalStrategy(async (username, password, done) => {
    const user = await storage.getUserByUsername(username);
    if (!user || !(await comparePasswords(password, user.password))) {
      return done(null, false);
    }
    return done(null, user);
  }));
}
```

## Real-time Features

### WebSocket Integration (server/index.ts)
```typescript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws, req) => {
  const userId = extractUserIdFromSession(req);
  
  ws.on('message', async (data) => {
    const message = JSON.parse(data.toString());
    
    switch (message.type) {
      case 'chat_message':
        await handleChatMessage(ws, message, userId);
        break;
      case 'document_upload':
        await handleDocumentUpload(ws, message, userId);
        break;
    }
  });
});
```

## Error Handling and Resilience

### AI Service Fallback Chain
```typescript
async function generateChatResponse(messages: ChatMessage[]): Promise<AIResponse> {
  const providers = [
    { name: 'claude', fn: () => generateClaudeResponse(messages) },
    { name: 'openai', fn: () => generateOpenAIResponse(messages) },
    { name: 'local', fn: () => generateLocalResponse(messages) }
  ];
  
  for (const provider of providers) {
    try {
      return await provider.fn();
    } catch (error) {
      console.warn(`${provider.name} failed, trying next provider:`, error.message);
    }
  }
  
  throw new Error('All AI providers failed');
}
```

### Database Connection Resilience
```typescript
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  retryAttempts: 3,
  retryDelay: 1000
});
```

## Security Features

### Input Sanitization and Validation
```typescript
// Zod schemas for request validation
const businessDataSchema = z.object({
  monthlyVolume: z.number().min(0).max(10000000),
  averageTicket: z.number().min(0).max(100000),
  businessType: z.enum(['retail', 'restaurant', 'ecommerce', 'service']),
  industry: z.string().min(1).max(100)
});

// Route protection middleware
export const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};
```

### File Upload Security
```typescript
const upload = multer({
  dest: './uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 50
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ];
    
    cb(null, allowedTypes.includes(file.mimetype));
  }
});
```

## Performance Optimizations

### Caching Strategy
```typescript
// Redis-like caching with memory store
const cache = new Map();

async function getCachedResponse(key: string): Promise<any> {
  if (cache.has(key)) {
    const { data, expiry } = cache.get(key);
    if (Date.now() < expiry) {
      return data;
    }
    cache.delete(key);
  }
  return null;
}

async function setCachedResponse(key: string, data: any, ttl: number = 300000): Promise<void> {
  cache.set(key, {
    data,
    expiry: Date.now() + ttl
  });
}
```

### Database Query Optimization
```typescript
// Prepared statements with Drizzle ORM
const getUserChatsOptimized = db
  .select({
    id: chats.id,
    title: chats.title,
    createdAt: chats.createdAt,
    messageCount: count(messages.id)
  })
  .from(chats)
  .leftJoin(messages, eq(chats.id, messages.chatId))
  .where(and(
    eq(chats.userId, placeholder('userId')),
    eq(chats.isArchived, false)
  ))
  .groupBy(chats.id)
  .orderBy(desc(chats.createdAt))
  .prepare();
```

## Monitoring and Logging

### Application Logging
```typescript
class Logger {
  static info(message: string, metadata?: any) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, metadata || '');
  }
  
  static error(message: string, error?: Error) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error?.stack || '');
  }
  
  static aiUsage(provider: string, tokens: number, cost: number) {
    console.log(`[AI_USAGE] ${provider} - Tokens: ${tokens}, Cost: $${cost.toFixed(4)}`);
  }
}
```

## Deployment Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...
PGHOST=localhost
PGPORT=5432
PGUSER=username
PGPASSWORD=password
PGDATABASE=tracer

# AI Services
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...

# Vector Database
PINECONE_API_KEY=...

# Google Drive
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Session Security
SESSION_SECRET=your-secure-secret
```

### Progressive Web App Configuration
```typescript
// Service Worker for offline functionality
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html');
      })
    );
  }
});
```

This technical documentation covers the complete architecture of the Tracer AI assistant, including all major integrations, data flow patterns, and implementation details for the core systems.