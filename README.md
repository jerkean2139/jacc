# JACC - AI-Powered Merchant Services Platform

An advanced AI-powered assistant platform that revolutionizes document processing and business intelligence through an intelligent, adaptive prompt ecosystem for independent sales agents.

## Features

- **AI-Powered Document Processing**: Advanced document analysis and extraction using Claude AI and OpenAI
- **Vector Database Search**: Intelligent document search capabilities with Pinecone integration
- **Progressive Web App**: Full PWA support with offline functionality
- **User Management**: Comprehensive authentication and role-based access control
- **Business Intelligence**: AI-powered insights generation for merchant services
- **Interactive Tutorial System**: Guided onboarding and feature discovery
- **Gamification**: Achievement and progress tracking system
- **Google Drive Integration**: Seamless document synchronization
- **Advanced Search**: Semantic search with AI-enhanced results

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI Services**: Claude AI (Anthropic), OpenAI
- **Vector Database**: Pinecone
- **Authentication**: Passport.js with session management
- **Cloud Storage**: Google Drive API integration

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- API keys for AI services (Claude, OpenAI)
- Pinecone API key for vector search
- Google Drive API credentials (optional)

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd jacc
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example and configure your values
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/jacc
ANTHROPIC_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
SESSION_SECRET=your_secure_session_secret
```

5. Run database migrations:
```bash
npm run db:push
```

6. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   └── lib/           # Utilities and configurations
├── server/                # Express backend
│   ├── routes.ts          # API routes
│   ├── auth.ts            # Authentication logic
│   ├── enhanced-ai.ts     # AI service integration
│   └── storage.ts         # Database operations
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema definitions
└── uploads/               # File upload storage
```

## Key Features

### Document Processing
- Upload and process various document formats (PDF, DOCX, etc.)
- AI-powered content extraction and analysis
- Vector embedding for semantic search
- Duplicate detection and content management

### AI Assistant
- Context-aware responses using document knowledge base
- Advanced prompt management and categorization
- Multi-model AI integration (Claude, OpenAI)
- Business intelligence and insights generation

### User Experience
- Progressive Web App with offline support
- Responsive design for mobile and desktop
- Dark/light theme support
- Gamification with achievements and progress tracking

## API Documentation

The application exposes a REST API for all major operations:

- `GET /api/user` - Get current user information
- `POST /api/chats` - Create new chat sessions
- `POST /api/documents/upload` - Upload documents
- `GET /api/search` - Perform document searches
- `POST /api/ai/generate` - Generate AI responses

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is proprietary software developed for merchant services applications.

## Support

For support and questions, please contact the development team or refer to the technical documentation.