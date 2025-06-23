# JACC Admin User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Admin Control Center](#admin-control-center)
3. [Settings Management](#settings-management)
4. [Document Management](#document-management)
5. [Training & Feedback Center](#training--feedback-center)
6. [AI Simulator](#ai-simulator)
7. [Chat Review Center](#chat-review-center)
8. [User Management](#user-management)
9. [System Monitoring](#system-monitoring)
10. [Best Practices](#best-practices)

## Getting Started

### Accessing Admin Features
1. Log in with admin credentials
2. Navigate to Admin Control Center from the main dashboard
3. Use the tabbed interface to access different admin functions

### Admin Dashboard Overview
The admin interface provides comprehensive control over:
- System settings and configuration
- Document and knowledge base management
- User activity monitoring
- AI training and feedback systems
- Performance analytics

## Admin Control Center

### Overview Tab
- **System Statistics**: Real-time metrics including user count, document count, and chat activity
- **Recent Activity**: Latest user interactions and system events
- **Performance Indicators**: System health and response times

### Q&A Knowledge Base
Manage the FAQ system that provides first-tier responses to user queries.

**Adding FAQ Entries:**
1. Click "Add New FAQ"
2. Select appropriate category (Processing, Compliance, Technical, etc.)
3. Enter clear, concise question
4. Provide comprehensive answer
5. Set priority level (1-5, with 5 being highest)
6. Toggle active status

**Managing Categories:**
- Payment Processing
- Compliance & Regulations
- Technical Support
- Merchant Onboarding
- Pricing & Fees
- Equipment & Hardware

**Best Practices:**
- Use natural language questions users actually ask
- Keep answers under 300 words for readability
- Include relevant links and references
- Review and update quarterly

### Document Center
Central hub for all document management operations.

**Upload Process:**
1. Click "Upload Documents"
2. Select files (supports PDF, CSV, TXT, DOCX)
3. Choose destination folder
4. Set permissions (admin-only or all-users)
5. Confirm upload

**Folder Management:**
- Create logical folder structures
- Use descriptive names
- Maintain consistent organization
- Regular cleanup of outdated documents

**Document Organization:**
- **Processor Statements**: Merchant processing reports
- **Compliance Documents**: Regulatory and legal files
- **Training Materials**: Educational resources
- **Technical Documentation**: System guides and manuals

## Settings Management

### AI & Search Configuration
Configure the core AI behavior and search functionality.

**Primary AI Model:**
- Claude 4.0 Sonnet (Recommended): Best for complex analysis
- GPT-4o (Fallback): Alternative when Claude is unavailable

**Response Style Options:**
- **Professional**: Formal business communication
- **Conversational**: Friendly, approachable tone
- **Technical**: Detailed, specific information
- **Concise**: Brief, to-the-point responses

**Search Sensitivity:**
- Low (1-3): Broad matching, more results
- Medium (4-6): Balanced relevance
- High (7-10): Exact matching, fewer but precise results

**Search Priority Order:**
1. FAQ Knowledge Base (always first)
2. Document Center (internal documents)
3. Web Search (external information with disclaimer)

### User Management Settings
Control user access and behavior settings.

**Default User Role:**
- Sales Agent: Standard user access
- Client Admin: Enhanced permissions
- Dev Admin: Full system access

**Session Configuration:**
- Session Timeout: 15 minutes to 8 hours
- MFA Requirements: Enable for enhanced security
- Guest Access: Allow/deny anonymous usage

**Notification Settings:**
- Email frequency: Immediate, daily, weekly, or disabled
- Login streak notifications
- Achievement alerts
- System maintenance notices

### Content & Document Processing
Configure how documents are processed and stored.

**OCR Quality Levels:**
- **Standard (Fast)**: Quick processing, good for simple documents
- **High Quality**: Better accuracy, moderate processing time
- **Ultra (Slow)**: Maximum accuracy, slower processing

**Auto-Categorization:**
- Enable automatic document sorting
- Machine learning-based classification
- Reduces manual organization workload

**Text Chunking:**
- Chunk Size: 500-2000 characters
- Larger chunks: Better context, slower search
- Smaller chunks: Faster search, less context

**Document Retention Policy:**
- **30-60 Days**: Short-term projects
- **90 Days**: Recommended for most use cases
- **6 Months-2 Years**: Long-term compliance
- **Forever**: No automatic deletion (use with caution)

### System Performance
Monitor and optimize system operations.

**Response Timeouts:**
- AI Response: 30-120 seconds
- Document Search: 5-15 seconds
- Database Queries: 1-10 seconds

**Cache Configuration:**
- Cache Expiration: 1-24 hours
- Longer cache: Faster responses, less current data
- Shorter cache: More current data, potentially slower

**Memory Optimization:**
- **Conservative**: Minimal resource usage
- **Balanced**: Recommended for most systems
- **High Performance**: Maximum speed, more resources
- **Aggressive**: Fastest operation, highest resource usage

## Document Management

### Upload Guidelines
**Supported Formats:**
- PDF: Primary document format
- CSV: Data and reports
- TXT: Plain text documents
- DOCX: Microsoft Word documents

**File Size Limits:**
- Individual files: 50MB maximum
- Batch uploads: 500MB total
- Large files automatically chunked for processing

**Folder Structure Best Practices:**
```
├── Processor Statements/
│   ├── 2024/
│   ├── 2023/
│   └── Historical/
├── Compliance/
│   ├── PCI Standards/
│   ├── Regulatory Updates/
│   └── Audit Documents/
├── Training Materials/
│   ├── Sales Training/
│   ├── Technical Guides/
│   └── Product Information/
└── Client Resources/
    ├── Onboarding/
    ├── Support Guides/
    └── Marketing Materials/
```

### Permission Management
**Admin-Only Documents:**
- Sensitive financial information
- Internal procedures
- Confidential agreements

**All-Users Access:**
- Public training materials
- General product information
- Customer-facing resources

### Document Processing Pipeline
1. **Upload**: File uploaded to server
2. **OCR Extraction**: Text content extracted
3. **Chunking**: Content divided into searchable segments
4. **Vector Generation**: AI embeddings created
5. **Database Storage**: Metadata and content indexed
6. **Search Integration**: Available for AI queries

## Training & Feedback Center

### Training Analytics
Monitor AI performance and learning progress.

**Key Metrics:**
- Total Interactions: All AI conversations
- Recent Activity: Last 7 days performance
- Accuracy Rate: Percentage of correct responses
- Corrections Made: Admin training interventions

**Performance Indicators:**
- Response quality trends
- User satisfaction ratings
- Common error patterns
- Training effectiveness

### Training Interactions Table
Review and analyze AI conversations for training opportunities.

**Interaction Details:**
- User who initiated conversation
- Query content and AI response
- Timestamp and response time
- Accuracy rating and feedback

**Training Actions:**
- Mark responses as correct/incorrect
- Provide corrected responses
- Add context and explanations
- Create FAQ entries from common queries

### AI Training Process
1. **Identify Issues**: Review flagged or poor-performing responses
2. **Analyze Context**: Understand user intent and required information
3. **Provide Corrections**: Submit improved responses
4. **Update Knowledge**: Add learnings to FAQ or documents
5. **Monitor Improvement**: Track performance changes

## AI Simulator

### Testing AI Responses
Simulate user interactions to test AI performance before going live.

**Test Query Process:**
1. Enter representative user question
2. Review AI response quality
3. Check information accuracy
4. Verify source attribution
5. Submit training corrections if needed

**Training Correction Workflow:**
1. Click "Train AI" after test query
2. Provide original query context
3. Submit corrected response
4. Add explanation for correction
5. System learns from feedback

**Best Testing Practices:**
- Test edge cases and unusual queries
- Verify responses for different user types
- Check accuracy of technical information
- Ensure appropriate tone and style

## Chat Review Center

### Chat History Management
Review and analyze actual user conversations for quality assurance.

**Review Process:**
1. Select chat from recent conversations list
2. Review entire conversation thread
3. Identify issues or improvement opportunities
4. Make corrections using training interface
5. Track review status and approval

**Quality Metrics:**
- Response accuracy
- User satisfaction
- Resolution effectiveness
- Conversation flow

### Correction System
**Message Correction Types:**
- Factual errors
- Tone improvements
- Missing information
- Better resource recommendations

**Approval Workflow:**
1. Admin reviews conversation
2. Identifies areas for improvement
3. Submits corrections
4. System updates training data
5. Changes reflected in future responses

## User Management

### User Activity Monitoring
Track user engagement and system usage patterns.

**Activity Metrics:**
- Login frequency and streaks
- Chat volume and engagement
- Document access patterns
- Feature utilization

**Leaderboard System:**
- Message count rankings
- Engagement scores
- Achievement tracking
- Streak milestones

### User Support
**Common Support Tasks:**
- Password resets
- Permission adjustments
- Account activation/deactivation
- Usage guidance and training

## System Monitoring

### Performance Metrics
Monitor system health and performance indicators.

**Key Indicators:**
- Response times
- Error rates
- System load
- Database performance

**Alert Thresholds:**
- Response time > 30 seconds
- Error rate > 5%
- Memory usage > 80%
- Database connections > 90%

### Maintenance Tasks
**Regular Maintenance:**
- Database optimization
- Cache clearing
- Log file rotation
- Security updates

**Weekly Tasks:**
- Performance review
- User activity analysis
- System backup verification
- Security audit

## Best Practices

### Daily Admin Tasks
1. Review overnight activity and alerts
2. Check system performance metrics
3. Process pending training corrections
4. Monitor user support queue

### Weekly Admin Tasks
1. Analyze training analytics trends
2. Review and update FAQ entries
3. Organize and clean up documents
4. Generate user activity reports

### Monthly Admin Tasks
1. Comprehensive system performance review
2. User feedback analysis and implementation
3. Security audit and updates
4. Capacity planning and optimization

### Security Best Practices
- Regular password updates
- Two-factor authentication enabled
- Audit trail monitoring
- Access permission reviews

### Performance Optimization
- Regular database maintenance
- Cache optimization
- Document organization
- System resource monitoring

## Troubleshooting

### Common Issues
**Slow Response Times:**
- Check system load and memory usage
- Review cache configuration
- Optimize database queries
- Consider hardware upgrades

**Poor AI Responses:**
- Review training data quality
- Check document organization
- Update FAQ entries
- Analyze user feedback patterns

**User Access Issues:**
- Verify account permissions
- Check session timeout settings
- Review authentication logs
- Confirm system availability

### Getting Help
- Check system logs for error details
- Review user feedback and reports
- Contact technical support team
- Consult documentation and guides

## Advanced Features

### API Integration
- Webhook configuration
- Third-party system connections
- Data import/export
- Custom integrations

### Reporting and Analytics
- Custom report generation
- Data export capabilities
- Performance trending
- User behavior analysis

### Backup and Recovery
- Automated backup schedules
- Data recovery procedures
- System restoration processes
- Disaster recovery planning