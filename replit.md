# JACC - AI-Powered Merchant Services Platform

## Overview

JACC is an advanced AI-powered assistant platform designed for independent sales agents in the merchant services industry. The system provides intelligent document processing, business intelligence, and ISO hub integration through an adaptive AI ecosystem. The platform combines modern web technologies with enterprise-grade AI services to streamline merchant analysis and competitive intelligence workflows.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type-safe component development
- **Vite** as build tool and development server with hot module replacement
- **Wouter** for lightweight client-side routing
- **TanStack Query v5** for server state management and caching
- **Tailwind CSS** with shadcn/ui components for consistent styling
- **Radix UI** primitives for accessible component foundations
- **Progressive Web App (PWA)** capabilities for mobile usage

### Backend Architecture
- **Node.js** with Express.js server framework
- **TypeScript** for end-to-end type safety
- **Session-based authentication** with PostgreSQL session store
- **RESTful API** design with comprehensive endpoint structure
- **Modular service architecture** with dedicated services for AI, search, and document processing

### Database Design
- **PostgreSQL** (Neon) as primary data storage
- **Drizzle ORM** for database operations and schema management
- **Comprehensive schema** supporting users, chats, documents, vendors, and monitoring
- **Vector embeddings storage** for semantic search capabilities

## Key Components

### AI Integration Layer
- **Claude 4.0 Sonnet** (claude-sonnet-4-20250514) as primary language model
- **OpenAI GPT-4o** as fallback language model
- **Pinecone** vector database for semantic document search
- **Custom prompt chaining** for enhanced AI responses
- **AI orchestration system** with multi-agent task management

### Document Processing System
- **OCR pipeline** with Tesseract.js integration
- **Multi-format support** (PDF, CSV, text files)
- **Intelligent text chunking** for vector storage
- **Metadata extraction** and content categorization
- **Vector embedding generation** for semantic search

### Authentication & Security
- **Multi-factor authentication** with TOTP implementation
- **Role-based access control** (sales-agent, client-admin, dev-admin)
- **ISO Hub SSO integration** for external platform authentication
- **Session management** with secure cookie handling
- **Enterprise security middleware** with CSP, HSTS, and rate limiting

### ISO Hub Integration
- **SSO authentication** endpoints for seamless integration
- **API-first design** supporting iframe embedding and standalone deployment
- **Token-based authentication** for external system integration
- **CORS configuration** for cross-origin requests

## Data Flow

### User Authentication Flow
1. User authentication via session-based login or ISO Hub SSO
2. Session creation with role-based permissions
3. Frontend route protection based on user role
4. API request authorization middleware

### Chat Processing Flow
1. User submits query through chat interface
2. Query preprocessing and intent analysis
3. Document search using vector similarity
4. AI response generation with context injection
5. Response delivery with source attribution
6. Conversation history persistence

### Document Processing Flow
1. File upload with format validation
2. OCR text extraction for supported formats
3. Content chunking and preprocessing
4. Vector embedding generation
5. Pinecone vector storage with metadata
6. Database record creation with searchable content

## External Dependencies

### AI Services
- **Anthropic Claude API** - Primary language model
- **OpenAI API** - Fallback language model and embeddings
- **Pinecone** - Vector database for semantic search

### Cloud Services
- **Google Drive API** - Document synchronization (optional)
- **Google Service Account** - Authentication for Drive integration
- **Neon PostgreSQL** - Cloud database hosting

### ISO Integrations
- **ISO Hub Server** - External merchant services platform
- **ISO AMP API** - Merchant processing analysis tools

## Deployment Strategy

### Development Environment
- **Replit hosting** with Node.js 20 runtime
- **PostgreSQL 16** module for database services
- **Memory optimization** configurations for efficient resource usage
- **Hot reload** development server on port 5000

### Production Considerations
- **Auto-scaling** policies based on memory and response time metrics
- **Performance monitoring** with real-time metrics collection
- **Health endpoints** for system status monitoring
- **Memory optimization** with garbage collection tuning

### Integration Deployment
- **Iframe embedding** support for ISO Hub frontend integration
- **API-only integration** for headless implementations
- **New tab integration** for standalone usage
- **CORS configuration** for cross-origin access

## Changelog

Changelog:
- June 13, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.