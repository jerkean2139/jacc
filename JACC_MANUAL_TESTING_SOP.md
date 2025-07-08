# JACC Manual Testing SOP (Standard Operating Procedure)

## Overview
This document provides comprehensive testing instructions for all JACC functionality across user roles. Follow this checklist systematically to ensure complete system validation.

## Test Credentials
- **Regular User**: tracer-user / demo-password
- **Manager**: manager / manager123  
- **Admin**: admin / admin123

---

## 1. LOGIN & AUTHENTICATION TESTING

### 1.1 Login Screen Testing
- [ ] **Load Application**: Navigate to main URL
- [ ] **UI Elements Present**:
  - [ ] JACC logo displays correctly (guy with glasses image)
  - [ ] Username/email input field
  - [ ] Password input field  
  - [ ] Login button
  - [ ] No bottom navigation visible on login screen
- [ ] **Form Validation**:
  - [ ] Empty fields show validation
  - [ ] Invalid credentials show error message
  - [ ] Valid credentials redirect to main interface
- [ ] **Role-Based Redirection**:
  - [ ] Regular user → Home with conversation starters
  - [ ] Admin → Home with full feature access

### 1.2 Session Management
- [ ] **Logout Functionality**: 
  - [ ] Logout button works from sidebar
  - [ ] Clears session properly
  - [ ] Redirects to login screen
- [ ] **Session Persistence**:
  - [ ] Refresh maintains login state
  - [ ] Browser close/reopen preserves session
  - [ ] Session timeout works appropriately

---

## 2. USER ROLE TESTING (tracer-user/demo-password)

### 2.1 Main Interface Layout
- [ ] **Sidebar Navigation**:
  - [ ] New chat button creates fresh conversation
  - [ ] Recent chats list displays (should show actual chat titles, not "New Chat")
  - [ ] Chat selection loads conversation history
  - [ ] Chat delete button works with confirmation
  - [ ] Document Center link navigates to /documents
  - [ ] Guide link navigates to /guide
  - [ ] Logout button functions properly

### 2.2 Chat Interface Testing
- [ ] **Welcome Screen**:
  - [ ] JACC logo displays (guy with glasses)
  - [ ] Welcome message shows
  - [ ] 4 conversation starter buttons present:
    - [ ] Blue: "I need help calculating processing rates..."
    - [ ] Green: "I need to compare payment processors..."  
    - [ ] Purple: "I need help creating a merchant proposal..."
    - [ ] Gray: "Let's Talk Marketing" (Coming Soon for users)

### 2.3 Conversation Starter Testing
Test each button individually:

#### 2.3.1 Processing Rates (Blue Button)
- [ ] **Click Response**: Should respond in under 1 second
- [ ] **Content Validation**: Asks about business type, current statement, processor comparison
- [ ] **Processor References**: Mentions TracerPay/Accept Blue, Clearent, MiCamp, TRX, Quantic, Shift4
- [ ] **Follow-up**: Can continue conversation naturally

#### 2.3.2 Processor Comparison (Green Button)  
- [ ] **Click Response**: Fast response under 1 second
- [ ] **Content Validation**: Asks about business type, monthly volume, feature needs
- [ ] **Processor Options**: References actual Tracer Co Card partners
- [ ] **Conversational Flow**: Guides toward providing more details

#### 2.3.3 Merchant Proposal (Purple Button)
- [ ] **Click Response**: Quick response generation
- [ ] **Content Validation**: Asks about industry, current processing, pain points
- [ ] **Professional Tone**: Business-appropriate language and structure
- [ ] **Next Steps**: Provides clear path forward

#### 2.3.4 Marketing Button (Gray - Coming Soon)
- [ ] **Disabled State**: Button appears grayed out
- [ ] **Coming Soon Badge**: Yellow "Soon" badge visible
- [ ] **Hover Tooltip**: Shows "Coming Soon" on hover
- [ ] **No Action**: Clicking does nothing

### 2.4 Chat Input & Voice Features
- [ ] **Text Input**:
  - [ ] Textarea expands with content
  - [ ] Placeholder text appropriate
  - [ ] Enter sends message (Shift+Enter new line)
  - [ ] Send button changes color on hover
- [ ] **Voice Input**:
  - [ ] Microphone button visible and large enough to click easily
  - [ ] Button positioned away from scrollbar (right-3)
  - [ ] Recording state shows red color and different icon
  - [ ] Tooltip shows "Start voice recording" / "Stop recording"
  - [ ] Voice recognition works (if supported)

### 2.5 Chat Conversation Testing
- [ ] **Message Display**:
  - [ ] User messages appear on right with proper styling
  - [ ] AI responses appear on left with JACC avatar
  - [ ] HTML formatting renders correctly (headings, lists, bold)
  - [ ] Messages have proper spacing and readability
- [ ] **AI Response Quality**:
  - [ ] Responses under 10 seconds generation time
  - [ ] Content relevant to merchant services
  - [ ] Professional formatting with HTML elements
  - [ ] Document links formatted as cards (not markdown)
- [ ] **Chat History**:
  - [ ] Messages persist in conversation
  - [ ] Chat titles generate meaningfully (not "New Chat")
  - [ ] Conversation appears in sidebar recent chats

### 2.6 Document Center Access (/documents)
- [ ] **Page Access**: Navigate via sidebar link
- [ ] **Role-Based Content**: 
  - [ ] Only permitted documents visible to regular users
  - [ ] Admin-only documents hidden
  - [ ] Document counts accurate for user's permission level
- [ ] **Document Organization**:
  - [ ] Folders display with correct document counts
  - [ ] Documents organized by categories (Admin, Clearent, MiCamp, etc.)
  - [ ] Search functionality works
  - [ ] View/Download buttons functional
- [ ] **Upload Restrictions**:
  - [ ] Upload functionality not available to regular users
  - [ ] Website URL scraping not accessible

### 2.7 User Guide (/guide)
- [ ] **Guide Access**: Accessible via sidebar
- [ ] **Role-Based Content**:
  - [ ] Sales Agent specific onboarding visible
  - [ ] Admin sections not accessible
  - [ ] Getting Started, Onboarding, Tips & Tricks tabs present
- [ ] **Content Validation**:
  - [ ] Step-by-step instructions for JACC usage
  - [ ] Search hierarchy explanation (FAQ → Documents → Web)
  - [ ] AI Prompts education with YouTube link
  - [ ] Document Center navigation guide

### 2.8 Bottom Navigation (Mobile)
- [ ] **Navigation Tabs**:
  - [ ] Guide tab navigates correctly
  - [ ] Home tab returns to chat interface
  - [ ] Documents tab opens document center
  - [ ] Calculator shows "Coming Soon" (disabled)
  - [ ] Intelligence shows "Coming Soon" (disabled)
- [ ] **Horizontal Scrolling**: 
  - [ ] Navigation scrolls smoothly like CapCut
  - [ ] All tabs accessible via scroll
  - [ ] Coming Soon tabs at end

---

## 3. ADMIN ROLE TESTING (admin/admin123)

### 3.1 Admin Interface Access
- [ ] **Enhanced Sidebar**:
  - [ ] All user features accessible
  - [ ] Additional admin-only sections visible
  - [ ] Settings link navigates to admin control center
- [ ] **Admin Control Center**: 
  - [ ] Accessible via sidebar Settings link
  - [ ] 4 main tabs visible: Q&A, Docs, Chat, Config

### 3.2 Q&A Knowledge Base Tab
- [ ] **FAQ Management**:
  - [ ] Display all 53+ FAQ entries
  - [ ] Create new FAQ functionality
  - [ ] Edit existing FAQ entries
  - [ ] Delete FAQ entries with confirmation
  - [ ] Category filtering works
- [ ] **URL Scraping Feature**:
  - [ ] "Add from Website URL" section highlighted in green
  - [ ] URL input accepts valid websites
  - [ ] Processing indicator shows during scraping
  - [ ] Content converts to Q&A entries automatically
  - [ ] Success notifications display

### 3.3 Document Center Tab
- [ ] **Document Management**:
  - [ ] All 143+ documents visible
  - [ ] 3-step upload process: Select Files → Choose Folder → Set Permissions
  - [ ] Folder assignment modal functional
  - [ ] Permission settings (admin-only vs all-users)
  - [ ] Bulk actions available
- [ ] **Folder Management**:
  - [ ] 29+ folders organized properly
  - [ ] Create new folders
  - [ ] Drag-and-drop functionality
  - [ ] Document counts accurate
  - [ ] Folder assignment works

### 3.4 Chat Review & Training Tab
- [ ] **Split-Screen Interface**:
  - [ ] Left panel: Chat history list (5 chats max, Load More button)
  - [ ] Right panel: AI training interface
  - [ ] Chat selection loads messages properly
- [ ] **Chat Review Features**:
  - [ ] 105+ conversations accessible
  - [ ] Chat filtering: Active/Pending/Archived
  - [ ] Message display with user/AI attribution
  - [ ] Archive functionality
  - [ ] Delete functionality with confirmation
- [ ] **Training Interface**:
  - [ ] Test query input
  - [ ] AI response generation
  - [ ] Training correction submission
  - [ ] Save to chat history option

### 3.5 Settings (Config) Tab
Test all 4 main categories:

#### 3.5.1 AI & Search Configuration
- [ ] **AI Model Selection**:
  - [ ] Primary/fallback model dropdown
  - [ ] Response style options (Expert/Helpful/Analytical)
  - [ ] Response tone settings (Formal/Friendly/Direct)
  - [ ] Expertise level slider (1-10)
- [ ] **Search Configuration**:
  - [ ] Search priority order display (FAQ → Documents → Web)
  - [ ] Search sensitivity slider
  - [ ] Settings save properly
- [ ] **AI Prompts Management**:
  - [ ] System Prompts section (Document Search, Response Formatting, Error Handling)
  - [ ] Personality & Behavior controls
  - [ ] Custom Prompt Templates (Pricing Analysis, Objection Handling, Compliance)
  - [ ] User-Specific Prompt Overrides
  - [ ] Edit/save functionality for all prompts

#### 3.5.2 User Management  
- [ ] **Sessions & Notifications**:
  - [ ] Default user roles dropdown
  - [ ] Session timeout settings
  - [ ] MFA settings toggles
  - [ ] Notification preferences
- [ ] **User Session Monitoring**:
  - [ ] Active sessions display
  - [ ] User activity tracking
  - [ ] Session termination capability

#### 3.5.3 Content & Documents
- [ ] **OCR & Categorization**:
  - [ ] OCR quality level settings
  - [ ] Auto-categorization toggles
  - [ ] Document type recognition
- [ ] **Text Processing**:
  - [ ] Text chunking size controls
  - [ ] Retention policy settings
  - [ ] Weekly URL scheduling checkbox

#### 3.5.4 System Performance
- [ ] **Real-time Metrics**:
  - [ ] Database response time display
  - [ ] Memory usage progress bars (97% shown)
  - [ ] AI services status indicators
  - [ ] Search accuracy metrics (96% shown)
- [ ] **Performance Controls**:
  - [ ] Timeout settings adjustable
  - [ ] Cache controls functional
  - [ ] Health monitoring active

### 3.6 Enhanced Chat Features (Admin)
- [ ] **Marketing Conversation Starter**:
  - [ ] Purple "Let's Talk Marketing" button active (not Coming Soon)
  - [ ] Access to Alex Hormozi marketing strategies
  - [ ] Gary Vaynerchuk social media content
  - [ ] Neil Patel digital marketing funnels
  - [ ] Professional marketing response formatting

### 3.7 Document Management (Admin)
- [ ] **Enhanced Document Access**:
  - [ ] All 143+ documents visible regardless of permissions
  - [ ] Upload functionality available
  - [ ] Website URL scraping accessible
  - [ ] Folder creation capabilities
  - [ ] Permission management controls

---

## 4. CROSS-ROLE FUNCTIONALITY TESTING

### 4.1 Search & AI System
- [ ] **Search Hierarchy Validation**:
  - [ ] FAQ Knowledge Base searched first
  - [ ] Document Center searched second  
  - [ ] Web search used as last resort with disclaimer
- [ ] **Processor Information Accuracy**:
  - [ ] Questions about processors return Tracer Co Card partners
  - [ ] No generic processors (Stripe/Square) mentioned inappropriately
  - [ ] Accurate processor list: TracerPay/Accept Blue, Clearent, MiCamp, TRX, Quantic, Shift4

### 4.2 Performance Testing
- [ ] **Response Times**:
  - [ ] Conversation starters: Under 1 second
  - [ ] Regular AI responses: Under 10 seconds
  - [ ] Document searches: Under 5 seconds
  - [ ] Page navigation: Under 2 seconds
- [ ] **System Stability**:
  - [ ] No crashes during extended use
  - [ ] Memory usage remains stable
  - [ ] Chat history preserves properly

### 4.3 Visual & UI Testing
- [ ] **Responsive Design**:
  - [ ] Desktop layout proper
  - [ ] Mobile responsive elements
  - [ ] Tablet/medium screen compatibility
- [ ] **Visual Elements**:
  - [ ] JACC logo displays consistently
  - [ ] Button hover effects work
  - [ ] Color scheme consistent
  - [ ] Text readable and properly sized
  - [ ] Icons display correctly

---

## 5. ERROR HANDLING & EDGE CASES

### 5.1 Network & Connectivity
- [ ] **Offline Behavior**:
  - [ ] Graceful degradation when offline
  - [ ] Appropriate error messages
  - [ ] Recovery when connection restored
- [ ] **API Failures**:
  - [ ] Timeout handling
  - [ ] Service unavailable messages
  - [ ] Retry mechanisms

### 5.2 Data Validation
- [ ] **Form Validation**:
  - [ ] Required field validation
  - [ ] Format validation (emails, URLs)
  - [ ] Character limits enforced
- [ ] **File Upload Validation**:
  - [ ] File type restrictions
  - [ ] File size limits
  - [ ] Malformed file handling

### 5.3 Browser Compatibility
- [ ] **Chrome**: Full functionality
- [ ] **Firefox**: Complete feature support
- [ ] **Safari**: All features operational
- [ ] **Edge**: System works properly
- [ ] **Mobile Browsers**: Responsive design functional

---

## 6. SECURITY TESTING

### 6.1 Authentication Security
- [ ] **Session Security**:
  - [ ] Sessions expire appropriately
  - [ ] No session fixation vulnerabilities
  - [ ] Proper session invalidation on logout
- [ ] **Role-Based Access**:
  - [ ] Users cannot access admin features
  - [ ] Direct URL access properly restricted
  - [ ] Permission boundaries enforced

### 6.2 Data Security
- [ ] **Input Sanitization**:
  - [ ] XSS prevention in chat inputs
  - [ ] SQL injection protection
  - [ ] File upload security
- [ ] **Data Exposure**:
  - [ ] No sensitive data in client-side code
  - [ ] Proper API endpoint protection
  - [ ] User data isolation

---

## 7. COMPLETION CHECKLIST

### 7.1 Final Validation
- [ ] **All Tests Completed**: Every checkbox marked
- [ ] **Issues Documented**: Any failures noted with details
- [ ] **Retesting Done**: Failed items retested after fixes
- [ ] **Performance Validated**: All timing requirements met

### 7.2 Sign-off
- **Tester Name**: ________________
- **Date Completed**: ________________
- **Role Tested**: ☐ User ☐ Admin ☐ Both
- **Overall Status**: ☐ Pass ☐ Fail ☐ Pass with Notes

### 7.3 Notes Section
Use this space to document any issues, observations, or recommendations:

```
Issue #1: [Description]
Steps to Reproduce: [Steps]
Expected: [Expected behavior]
Actual: [Actual behavior]
Severity: [High/Medium/Low]

Issue #2: [Description]
...
```

---

## Testing Completion Time Estimate
- **User Role Testing**: 2-3 hours
- **Admin Role Testing**: 3-4 hours  
- **Cross-Role & Security Testing**: 1-2 hours
- **Total Estimated Time**: 6-9 hours for comprehensive testing

This SOP ensures complete validation of all JACC functionality across user roles and provides systematic documentation of system behavior and any issues discovered during testing.