# JACC Design Lock System

## Purpose
This document serves as a comprehensive backup and verification system to prevent loss of critical functionality and design elements in the JACC platform.

## Critical Component Inventory

### 1. Admin Control Center Tabs (4 Primary)
- **Q&A Knowledge Base**: FAQ management with URL scraping integration
- **Document Center**: 3-step upload process with folder assignment and permissions
- **Chat Review & Training**: Split-screen interface for conversation oversight and AI training
- **Settings**: Comprehensive 4-category settings system

### 2. Settings Tab Structure (4 Categories)
#### AI & Search Configuration
- **AI Prompts Management** (4 key areas):
  1. System Prompts (Document Search, Response Formatting, Error Handling)
  2. Personality & Behavior (AI style, tone, expertise level, behavioral toggles)
  3. Custom Prompt Templates (Pricing Analysis, Objection Handling, Compliance Guidance)
  4. User-Specific Prompt Overrides (Dev Admin, Sales Agent roles)
- **Model Configuration**: Primary/fallback AI models, search sensitivity
- **Search Priority Order**: FAQ → Documents → Web with disclaimer

#### User Management
- **Sessions & Notifications**: Default roles, timeouts, MFA settings, notification preferences
- **Authentication Settings**: Session management, guest access controls
- **Permission Management**: Role-based access control

#### Content & Document Processing
- **OCR & Categorization**: Quality levels, auto-categorization, text chunking size
- **Document Retention**: Policies and automated cleanup
- **Processing Pipeline**: Text extraction, vector embedding, metadata handling

#### System Performance
- **Real-time Metrics**: System status, database performance, memory usage with progress bars
- **Timeout & Cache Settings**: API/database timeouts, cache duration, memory optimization
- **Health Monitoring**: AI services status, search accuracy metrics, service connectivity

### 3. Q&A Knowledge Base Features
- **FAQ Management**: Category-based organization, priority levels, active/inactive toggles
- **URL Scraping Integration**: Website content extraction with AI-powered Q&A generation
- **Weekly Scheduling**: Automated URL updates with database storage
- **Content Processing**: Bullet point to Q&A conversion, automatic categorization

### 4. Document Center Functionality
- **3-Step Upload Process**:
  1. File Selection (PDF, CSV, TXT, DOCX support)
  2. Folder Assignment (dropdown with 29+ folders)
  3. Permissions Setting (admin-only vs all-users)
- **Folder Management**: 29 organized folders with document counts
- **Role-based Access**: Different views for admin vs regular users
- **Document Organization**: 136+ documents properly categorized

### 5. Chat Review & Training Center
- **Split-screen Interface**: Real conversation review (left) + AI training (right)
- **Conversation Loading**: Authentic chat history from database
- **Training Corrections**: Message correction system with database storage
- **Review Status Tracking**: Approval system with thumbs up/down

## Backend Integration Points

### API Endpoints (Critical)
- `/api/admin/faq` - FAQ management
- `/api/admin/documents` - Document management
- `/api/admin/chat-reviews` - Chat review system
- `/api/admin/settings` - Settings persistence
- `/api/admin/performance` - Real-time metrics
- `/api/admin/sessions` - User session monitoring
- `/api/folders` - Folder management
- `/api/documents` - Document access with role filtering

### Database Schema (Essential Tables)
- `faq_entries` - Knowledge base content
- `documents` - Document metadata and content
- `folders` - Document organization
- `chat_reviews` - Conversation oversight
- `message_corrections` - Training data
- `ai_prompt_templates` - Prompt management
- `scheduled_urls` - Weekly URL updates
- `user_stats` - Gamification data

## UI Component Architecture

### Mobile Responsive Design
- **Bottom Navigation**: Home, Guide, Documents, Settings with horizontal scrolling
- **Admin PWA Navigation**: Streamlined 3-tab interface (Guide, Home, Settings)
- **Mobile Layouts**: 2x2 grid for admin tabs, stacked forms, proper touch targets

### Design System Elements
- **Card Layouts**: Color-coded borders (blue, green, orange, purple, teal)
- **Progress Indicators**: Real-time metrics with percentage bars
- **Badge System**: Status indicators (Online, Connected, Active, Healthy)
- **Icon Integration**: Lucide React icons for visual consistency
- **Responsive Grids**: Adaptive layouts for different screen sizes

## Verification Checklist

### Before Any Major Changes
1. ✅ Verify all 4 Settings categories are present and functional
2. ✅ Confirm AI Prompts Management has all 4 key areas
3. ✅ Test 3-step document upload process
4. ✅ Validate split-screen chat review interface
5. ✅ Check real-time performance metrics display
6. ✅ Ensure URL scraping integration works
7. ✅ Verify role-based document filtering
8. ✅ Test mobile responsive layouts

### Critical State Variables
```typescript
const [settingsTab, setSettingsTab] = useState("ai-search");
const [enableWeeklyUpdates, setEnableWeeklyUpdates] = useState(false);
const [correctionText, setCorrectionText] = useState("");
```

### Essential Imports
```typescript
import { Progress } from "@/components/ui/progress";
import { Scan, Timer, BarChart3, TrendingUp } from "lucide-react";
```

## Recovery Instructions

### If Settings Tab is Simplified
1. Restore 4-category navigation structure
2. Re-implement AI Prompts Management with all 4 areas
3. Add back real-time performance monitoring
4. Restore comprehensive User Management and Content Processing sections

### If Admin Interface is Corrupted
1. Reference `client/src/pages/admin-control-center.tsx` (working version)
2. Avoid `admin-control-center-corrupted.tsx` (broken backup)
3. Maintain tab order: Q&A Knowledge, Document Center, Chat Review & Training, Settings

### If Mobile Layout Breaks
1. Restore bottom navigation with horizontal scrolling
2. Re-implement 2x2 grid layout for admin tabs
3. Ensure proper touch targets and responsive design

## Critical Dependencies
- React Query for data fetching and caching
- Lucide React for consistent iconography
- shadcn/ui components for design system
- Tailwind CSS for responsive layouts
- TypeScript for type safety

## Backup Strategy
- This document serves as the primary design specification
- `replit.md` maintains chronological change history
- Code comments in critical files reference this system
- Regular verification through testing ensures integrity

## Last Verified: June 25, 2025
- All 4 Settings categories functional ✅
- AI Prompts Management complete ✅
- Real-time performance monitoring active ✅
- Mobile responsive design working ✅
- Backend integration verified ✅