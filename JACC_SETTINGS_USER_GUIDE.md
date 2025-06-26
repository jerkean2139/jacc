# JACC Settings User Guide

## Overview
The JACC Settings panel provides comprehensive control over AI behavior, user management, document processing, and system performance. This guide explains each setting, best practices, and troubleshooting tips.

## Navigation
Access Settings through:
- **Desktop**: Admin Control Center → Settings tab
- **Mobile**: Bottom navigation → Settings (admin users only)

---

## 1. AI & Search Configuration

### AI Model Settings
**What it does**: Controls which AI model JACC uses for responses
- **Primary Model**: Claude 4.0 Sonnet (recommended for accuracy)
- **Fallback Model**: GPT-4o (used when Claude is unavailable)

**Best Practices**:
- Keep Claude as primary for merchant services expertise
- Monitor response quality and switch if issues persist

**Troubleshooting**:
- **Problem**: Slow AI responses → Check model status indicators
- **Problem**: Poor answer quality → Try switching models temporarily
- **Problem**: AI not responding → Verify API keys in environment

### Response Style Settings
**What it does**: Adjusts how JACC communicates with users

**Professional Mode**: 
- Formal business language
- Technical terminology included
- Longer, detailed explanations

**Conversational Mode**:
- Friendly, approachable tone
- Simplified explanations
- Shorter responses

**Best Practices**:
- Use Professional for client-facing scenarios
- Use Conversational for internal team training
- Match style to your audience

**Troubleshooting**:
- **Problem**: Responses too technical → Switch to Conversational
- **Problem**: Responses too casual → Switch to Professional
- **Problem**: Wrong tone for audience → Check current mode setting

### Search Configuration
**What it does**: Controls how JACC finds information

**Search Priority Order**:
1. FAQ Knowledge Base (internal Q&A)
2. Document Center (uploaded files)
3. Web Search (external sources)

**Search Sensitivity**:
- **High**: Finds more results, may include less relevant content
- **Medium**: Balanced accuracy and coverage
- **Low**: Only highly relevant results

**Best Practices**:
- Keep priority order as-is for best results
- Use Medium sensitivity for most scenarios
- Increase sensitivity if missing expected results
- Decrease if getting too many irrelevant results

**Troubleshooting**:
- **Problem**: Can't find known information → Increase search sensitivity
- **Problem**: Too many irrelevant results → Decrease search sensitivity
- **Problem**: Wrong information source → Check search priority order
- **Problem**: Outdated results → Check document upload dates

### AI Prompts Management

#### System Prompts
**What it does**: Core instructions that guide AI behavior

**Document Search Prompt**:
- Controls how AI searches through your documents
- Determines relevance scoring
- **When to modify**: If document search isn't finding relevant files

**Response Formatting Prompt**:
- Controls how AI structures answers
- Manages HTML formatting and links
- **When to modify**: If responses look messy or poorly formatted

**Error Handling Prompt**:
- Controls what AI does when it can't find information
- Manages fallback responses
- **When to modify**: If error messages are unhelpful

#### Personality & Behavior
**What it does**: Fine-tunes AI personality traits

**AI Style Options**:
- **Expert**: Authoritative, confident responses
- **Helpful**: Supportive, guidance-focused
- **Analytical**: Data-driven, detailed explanations

**Response Tone**:
- **Formal**: Business professional language
- **Friendly**: Warm, approachable communication
- **Direct**: Concise, to-the-point answers

**Expertise Level**: 1-10 scale
- **1-3**: Beginner-friendly explanations
- **4-7**: Standard business knowledge
- **8-10**: Expert-level technical detail

**Best Practices**:
- Match style to your team's preferences
- Use higher expertise levels for experienced agents
- Adjust tone based on client interaction context

#### Custom Prompt Templates
**What it does**: Pre-written prompts for specific scenarios

**Available Templates**:
- **Pricing Analysis**: For calculating processing costs
- **Objection Handling**: For addressing client concerns
- **Compliance Guidance**: For regulatory questions

**Best Practices**:
- Test templates before using with clients
- Customize templates for your specific needs
- Enable only templates your team will actually use

**Troubleshooting**:
- **Problem**: Template gives wrong answers → Edit and test in AI Simulator
- **Problem**: Template not appearing → Check if it's enabled
- **Problem**: Template too generic → Customize with your specific scenarios

#### User-Specific Overrides
**What it does**: Different AI behavior for different user roles

**Dev Admin Overrides**:
- Technical language enabled
- System debugging information included
- Advanced configuration options shown

**Sales Agent Overrides**:
- Sales-focused language
- Client-facing tone
- Pricing and objection handling emphasis

**Best Practices**:
- Configure based on actual job roles
- Test overrides with different user accounts
- Update when team roles change

---

## 2. User Management

### Sessions & Notifications

#### Default User Roles
**What it does**: Sets automatic permissions for new users
- **Sales Agent**: Standard user with basic access
- **Client Admin**: Advanced user with team management
- **Dev Admin**: Full system access

**Best Practices**:
- Set to most common role in your organization
- Review and adjust individual permissions as needed

#### Session Timeouts
**What it does**: Controls how long users stay logged in

**Options**:
- **15 minutes**: High security, frequent re-authentication
- **1 hour**: Balanced security and convenience
- **4 hours**: Extended work sessions
- **8 hours**: Full workday sessions

**Best Practices**:
- Use 1 hour for most business environments
- Use 15 minutes for sensitive data access
- Use 8 hours for trusted internal users

**Troubleshooting**:
- **Problem**: Users complaining about frequent logouts → Increase timeout
- **Problem**: Security concerns → Decrease timeout
- **Problem**: Lost work due to timeouts → Check auto-save features

#### Multi-Factor Authentication (MFA)
**What it does**: Adds extra security layer with authentication apps

**Settings**:
- **Required**: All users must enable MFA
- **Optional**: Users can choose to enable
- **Disabled**: No MFA required

**Best Practices**:
- Require MFA for admin users
- Make optional for standard users initially
- Provide MFA setup training

#### Notification Preferences
**What it does**: Controls email and system notifications

**Types**:
- **Login Alerts**: Notify on new device logins
- **System Updates**: Feature and maintenance notifications
- **Security Alerts**: Unusual activity warnings
- **Achievement Notifications**: Gamification milestones

**Best Practices**:
- Enable security-related notifications
- Limit non-essential notifications to reduce noise
- Customize based on user preferences

---

## 3. Content & Document Processing

### OCR & Categorization

#### OCR Quality Levels
**What it does**: Controls optical character recognition accuracy

**Standard**: 
- Faster processing
- Good for clear, high-quality documents
- May miss some text in poor quality scans

**High Quality**:
- Slower processing
- Better accuracy for unclear documents
- Recommended for important contracts

**Maximum**:
- Slowest processing
- Best accuracy for difficult documents
- Use for critical compliance documents

**Best Practices**:
- Use Standard for most documents
- Use High Quality for contracts and legal documents
- Use Maximum only when Standard/High miss important text

**Troubleshooting**:
- **Problem**: Text not extracted properly → Increase OCR quality
- **Problem**: Document processing too slow → Decrease OCR quality
- **Problem**: Garbled text in search results → Check original document quality

#### Auto-Categorization
**What it does**: Automatically sorts documents into folders

**Confidence Levels**:
- **Low (60%)**: Categories more documents, less accuracy
- **Medium (75%)**: Balanced approach
- **High (90%)**: Only categorizes when very confident

**Best Practices**:
- Start with Medium confidence
- Review auto-categorized documents initially
- Adjust based on accuracy results

**Troubleshooting**:
- **Problem**: Documents in wrong folders → Increase confidence level
- **Problem**: Too many uncategorized documents → Decrease confidence level
- **Problem**: Important documents miscategorized → Manual review and folder adjustment

### Text Processing

#### Chunk Size
**What it does**: Controls how documents are split for AI processing

**Small (500 words)**: 
- More precise search results
- Slower processing
- Better for detailed queries

**Medium (800 words)**:
- Balanced performance
- Recommended for most use cases

**Large (1200 words)**:
- Faster processing
- Good for overview queries
- May miss specific details

**Best Practices**:
- Use Medium for general business documents
- Use Small for legal/compliance documents
- Use Large for training materials and guides

#### Overlap Settings
**What it does**: Prevents information loss at chunk boundaries

**Low (10%)**: Minimal overlap, faster processing
**Medium (25%)**: Balanced approach (recommended)
**High (40%)**: Maximum information preservation

**Best Practices**:
- Keep at Medium unless experiencing issues
- Increase if search misses information spanning sections
- Decrease only if processing speed is critical

### Retention Policies

#### Document Retention
**What it does**: Controls how long documents are kept

**Options**:
- **1 year**: Standard business retention
- **3 years**: Extended compliance needs
- **5 years**: Long-term regulatory requirements
- **Indefinite**: Keep all documents

**Best Practices**:
- Match your industry compliance requirements
- Consider storage costs for longer retention
- Document your retention policy for audits

#### Search History Retention
**What it does**: Controls how long user search history is kept

**30 days**: Privacy-focused, minimal tracking
**90 days**: Standard analytics period
**1 year**: Comprehensive usage analysis

**Best Practices**:
- Use 90 days for most organizations
- Consider privacy policies when setting
- Longer retention helps improve AI training

---

## 4. System Performance

### Real-time Metrics

#### System Status Monitoring
**What it displays**: Current system health indicators

**Green indicators**: System operating normally
**Yellow indicators**: Performance issues detected
**Red indicators**: Critical problems requiring attention

**What to check**:
- **Database Response Time**: Should be under 500ms
- **AI Service Status**: Should show "Connected"
- **Search Accuracy**: Should be above 85%
- **Memory Usage**: Should be under 80%

#### Performance Alerts
**What it does**: Notifies when system performance degrades

**Response Time Alerts**:
- Triggers when responses take longer than set threshold
- Helps identify performance bottlenecks

**Error Rate Alerts**:
- Triggers when error percentage exceeds threshold
- Indicates system stability issues

**Best Practices**:
- Set realistic thresholds based on normal operation
- Monitor alerts for patterns
- Investigate immediately when alerts trigger

### Timeout & Cache Settings

#### API Timeouts
**What it does**: Controls how long to wait for external services

**AI Service Timeout**:
- **30 seconds**: Standard for most queries
- **60 seconds**: For complex analysis requests
- **120 seconds**: For document processing

**Search Timeout**:
- **10 seconds**: Quick searches
- **20 seconds**: Standard searches
- **30 seconds**: Complex document searches

**Best Practices**:
- Use standard settings unless experiencing timeouts
- Increase if getting timeout errors
- Don't set too high as it affects user experience

#### Cache Settings
**What it does**: Controls how long to store frequently accessed data

**Document Cache**:
- Stores processed documents for faster access
- **1 hour**: Frequently changing documents
- **24 hours**: Standard business documents
- **7 days**: Static reference materials

**Search Cache**:
- Stores search results for repeated queries
- **15 minutes**: Dynamic content
- **1 hour**: Standard searches
- **4 hours**: Reference searches

**Best Practices**:
- Longer cache improves performance
- Shorter cache ensures fresh content
- Monitor cache hit rates for optimization

### Health Monitoring

#### AI Services Health
**What it monitors**: Connection status to AI providers

**Claude API**: Primary AI service status
**OpenAI API**: Fallback service status
**Pinecone**: Vector search service status

**Troubleshooting**:
- **Red status**: Check API keys and network connectivity
- **Yellow status**: Service experiencing issues, may be slower
- **Green status**: Service operating normally

#### Search Accuracy Metrics
**What it tracks**: How often users find helpful information

**High accuracy (>90%)**: Excellent knowledge base
**Medium accuracy (75-90%)**: Good, some improvements needed
**Low accuracy (<75%)**: Requires attention

**Improving accuracy**:
- Add more relevant documents
- Improve document organization
- Update outdated information
- Train AI with user feedback

---

## Troubleshooting Quick Reference

### Common Problems and Settings to Check

#### AI gives wrong or poor answers
1. **Check**: AI & Search → AI Model Settings
2. **Check**: AI & Search → Response Style
3. **Check**: AI & Search → Search Sensitivity
4. **Action**: Test different models or adjust search settings

#### Users can't find information
1. **Check**: AI & Search → Search Priority Order
2. **Check**: AI & Search → Search Sensitivity
3. **Check**: Content & Documents → Auto-Categorization
4. **Action**: Increase search sensitivity or reorganize documents

#### System running slowly
1. **Check**: System Performance → Real-time Metrics
2. **Check**: System Performance → Cache Settings
3. **Check**: Content & Documents → OCR Quality
4. **Action**: Optimize cache settings or reduce OCR quality

#### Users getting logged out frequently
1. **Check**: User Management → Session Timeouts
2. **Check**: User Management → MFA settings
3. **Action**: Increase timeout duration or check MFA configuration

#### Documents not processing correctly
1. **Check**: Content & Documents → OCR Quality
2. **Check**: Content & Documents → Text Processing
3. **Check**: Content & Documents → Auto-Categorization
4. **Action**: Adjust OCR quality or chunk size settings

#### Security concerns
1. **Check**: User Management → MFA Settings
2. **Check**: User Management → Session Timeouts
3. **Check**: Content & Documents → Retention Policies
4. **Action**: Enable MFA and review timeout settings

---

## Best Practices Summary

### Initial Setup
1. Start with default settings for 2 weeks
2. Monitor performance metrics daily
3. Gather user feedback on AI responses
4. Adjust settings based on actual usage patterns

### Ongoing Maintenance
1. Review performance metrics weekly
2. Update document organization monthly
3. Adjust AI prompts based on user feedback
4. Monitor security alerts immediately

### Team Training
1. Train admins on all settings sections
2. Document your specific configuration choices
3. Create troubleshooting runbooks for your team
4. Regular review meetings to discuss improvements

### Security
1. Enable MFA for all admin users
2. Set appropriate session timeouts
3. Monitor login alerts
4. Regular security settings review

This guide provides the foundation for effectively managing your JACC system. Adjust settings gradually and monitor the impact on user experience and system performance.