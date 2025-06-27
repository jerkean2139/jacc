import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { v4 as uuidv4 } from 'uuid';
import ws from 'ws';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Database setup
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Import schemas
import { folders, documents } from './shared/schema.ts';

async function createSalesMarketingFolder() {
  try {
    console.log('Creating Sales & Marketing folder...');
    
    // Create the folder
    const folderId = uuidv4();
    await db.insert(folders).values({
      id: folderId,
      name: 'Sales & Marketing',
      description: 'Sales strategies, marketing techniques, and business growth content from industry experts',
      userId: 'admin-user-id',
      adminOnly: false,
      vectorNamespace: 'sales-marketing',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('Sales & Marketing folder created successfully');
    return folderId;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
}

async function addMarketingDocument(folderId, title, content, expertName, sourceUrl) {
  try {
    const documentId = uuidv4();
    const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    const filePath = path.join('uploads', fileName);
    
    // Create document content with proper formatting
    const documentContent = `# ${title}
**Expert:** ${expertName}
**Source:** ${sourceUrl}

${content}

---
*This content is curated from ${expertName}'s teachings and strategies for sales agent training and reference.*
`;
    
    // Save file to uploads directory
    await fs.writeFile(filePath, documentContent, 'utf8');
    
    // Add to database
    await db.insert(documents).values({
      id: documentId,
      name: title,
      originalName: fileName,
      path: filePath,
      size: Buffer.byteLength(documentContent),
      mimeType: 'text/markdown',
      userId: 'admin-user-id',
      folderId: folderId,
      category: 'sales-marketing',
      tags: ['sales', 'marketing', expertName.toLowerCase().replace(' ', '-')],
      adminOnly: false,
      allUsersAccess: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`Added document: ${title}`);
    return documentId;
  } catch (error) {
    console.error(`Error adding document ${title}:`, error);
    throw error;
  }
}

async function setupSalesMarketingContent() {
  try {
    console.log('Setting up Sales & Marketing content...');
    
    // Create the folder
    const folderId = await createSalesMarketingFolder();
    
    // Alex Hormozi Content
    const hormoziContent = [
      {
        title: "Value Stacking Framework for Sales Success",
        content: `# Alex Hormozi's Value Stacking Method

## Core Principle
Make your offer so good people feel stupid saying no.

## The Value Equation
Value = (Dream Outcome × Perceived Likelihood of Achievement) / (Time Delay × Effort & Sacrifice)

## Value Stacking Components

### 1. Core Offer
- Primary product/service that solves the main problem
- Must address the biggest pain point
- Should provide clear transformation

### 2. Bonuses That Eliminate Objections
- **Time Objection:** Add done-for-you components
- **Knowledge Objection:** Include training and guides  
- **Support Objection:** Provide access to experts
- **Results Objection:** Offer guarantees or case studies

### 3. Scarcity and Urgency
- **Quantity Scarcity:** Limited spots available
- **Time Scarcity:** Limited time offer
- **Bonus Scarcity:** Special bonuses expire

### 4. Risk Reversal
- Money-back guarantees
- Performance guarantees
- "Better than money-back" guarantees

## Implementation for Merchant Services

### Core Offer: Payment Processing Setup
- Competitive rates
- Modern POS system
- Quick approval process

### Value Stack Additions:
1. **FREE Business Analysis** ($500 value)
2. **FREE Rate Audit** ($300 value)
3. **FREE POS Training** ($200 value)
4. **90-Day Rate Lock Guarantee**
5. **24/7 Support Hotline**
6. **Chargeback Protection Program**

### Total Package Value: $3,500+
### Your Investment: Processing fees only

## Key Phrases:
- "So good they feel stupid saying no"
- "Remove all the risk from their side"
- "Stack the value until it's irresistible"`,
        expertName: "Alex Hormozi",
        sourceUrl: "https://acquisition.com"
      },
      {
        title: "The Perfect Sales Script Structure",
        content: `# Alex Hormozi's Sales Script Framework

## The CLOSER Framework

### C - Clarify Why They're There
- "What made you decide to look into payment processing?"
- "What's working and what's not with your current setup?"
- Uncover their primary pain point

### L - Label Their Problem
- Repeat back their problem in your words
- "So if I understand correctly, you're losing money on high fees..."
- Get confirmation: "Is that accurate?"

### O - Overview Their Situation
- Paint the picture of their current state
- "Right now you're paying 3.5% when you could be paying 2.1%"
- "That's costing you $X per month"

### S - Sell Them the Solution
- Present your offer using value stacking
- Connect each benefit to their specific problem
- Use the "because" bridge: "We include X because you mentioned Y"

### E - Explain Away Objections
- Address objections before they bring them up
- "You might be thinking about switching costs..."
- "Here's why that's actually not a concern..."

### R - Reinforce Their Decision
- Summarize the transformation
- "So in 30 days, instead of losing $500/month on fees, you'll be saving money and have a better system"

## Advanced Techniques

### The Assumption Close
- "When would you like to start saving money?"
- "Would you prefer to get set up this week or next?"

### The Summary Close
- "Let me make sure I understand what you want..."
- List all their desired outcomes
- "Is there anything else?"

### The Scarcity Close
- "I can only offer this rate to 3 new clients this month"
- "This bonus expires Friday"

## Objection Handling Scripts

### "I need to think about it"
- "What specifically do you need to think about?"
- "Is it the monthly cost, setup process, or something else?"
- Address the real concern, then close

### "I need to talk to my business partner"
- "Of course! What questions do you think they'll have?"
- "What would need to happen for both of you to feel comfortable moving forward?"

### "Your rates seem high"
- "Compared to what specifically?"
- "Let me show you the total cost of ownership..."
- Focus on value, not price`,
        expertName: "Alex Hormozi",
        sourceUrl: "https://acquisition.com"
      }
    ];

    // Gary Vaynerchuk Content
    const garyVContent = [
      {
        title: "Social Media Strategy for Sales Agents",
        content: `# Gary Vaynerchuk's Social Media Sales Strategy

## Core Philosophy
"Provide value first, sell second. The market will reward you for your patience."

## The Jab, Jab, Jab, Right Hook Method

### Jabs (Value Content) - 80%
1. **Educational Posts**
   - Industry insights and trends
   - Tips for business owners
   - Common payment processing mistakes

2. **Behind-the-Scenes Content**
   - Day in the life of a payment consultant
   - Client success stories (with permission)
   - Team meetings and training

3. **Thought Leadership**
   - Industry predictions
   - Commentary on business news
   - Personal business philosophy

### Right Hook (Sales Content) - 20%
- Direct offers and calls-to-action
- Product demonstrations
- Limited-time promotions

## Platform-Specific Strategies

### LinkedIn (Primary for B2B)
- **Content:** Industry insights, case studies, business tips
- **Frequency:** 1-2 posts daily
- **Engagement:** Comment on prospects' posts with value
- **DMs:** Soft approach with helpful resources

### Instagram
- **Content:** Behind-the-scenes, success stories, quick tips
- **Format:** Stories, reels, carousel posts
- **Hashtags:** Industry-specific and location-based

### TikTok/YouTube Shorts
- **Content:** Quick tips, myth-busting, day-in-the-life
- **Style:** Authentic, unpolished, educational
- **Hook:** First 3 seconds are everything

## Content Pillars for Payment Processing

### Pillar 1: Education (30%)
- "5 hidden fees in your merchant account"
- "How to read your processing statement"
- "EMV vs. NFC: What's the difference?"

### Pillar 2: Industry News (25%)
- Payment technology updates
- Regulatory changes
- Market trends and predictions

### Pillar 3: Business Growth (25%)
- Customer service tips
- Inventory management
- Marketing for small businesses

### Pillar 4: Personal Brand (20%)
- Your story and why you help businesses
- Client testimonials and success stories
- Team culture and values

## Engagement Strategy

### Daily Actions:
1. **Morning:** Share educational content
2. **Midday:** Engage with prospects' content
3. **Evening:** Share behind-the-scenes or personal content

### Weekly Actions:
1. **Monday:** Industry news roundup
2. **Wednesday:** Educational deep-dive
3. **Friday:** Week recap and weekend motivation

### Monthly Actions:
1. **Case study or success story**
2. **Industry trend analysis**
3. **Personal reflection on business growth**

## Conversion Techniques

### Soft Sell Approach:
- "DM me if you want to learn more"
- "Link in bio for free rate analysis"
- "Comment 'RATES' for a free consultation"

### Community Building:
- Create Facebook groups for local businesses
- Host virtual networking events
- Share others' success stories`,
        expertName: "Gary Vaynerchuk",
        sourceUrl: "https://garyvaynerchuk.com"
      }
    ];

    // Neil Patel Content
    const neilPatelContent = [
      {
        title: "Digital Marketing Funnel for Financial Services",
        content: `# Neil Patel's Digital Marketing Framework for Payment Processing

## The Customer Journey Funnel

### 1. Awareness Stage
**Goal:** Get discovered by businesses looking for payment solutions

**Tactics:**
- SEO-optimized blog content
- Social media presence
- Google Ads for high-intent keywords
- Industry event participation

**Content Ideas:**
- "Complete Guide to Payment Processing"
- "Hidden Costs in Merchant Accounts"
- "Best POS Systems for [Industry]"

### 2. Interest Stage
**Goal:** Capture leads and build trust

**Tactics:**
- Lead magnets (free guides, calculators)
- Email nurture sequences
- Retargeting campaigns
- Free consultations

**Lead Magnets:**
- "Merchant Account Cost Calculator"
- "Payment Processing Comparison Chart"
- "Small Business Payment Guide"

### 3. Consideration Stage
**Goal:** Position as the best solution

**Tactics:**
- Case studies and testimonials
- Free rate analysis
- Educational webinars
- Comparison content

**Content Types:**
- Client success stories
- "Us vs. Competitor" comparisons
- Industry-specific solutions
- ROI calculators

### 4. Decision Stage
**Goal:** Convert prospects to clients

**Tactics:**
- Limited-time offers
- Personal consultations
- References and guarantees
- Simplified onboarding

## SEO Strategy for Payment Processing

### Primary Keywords:
- "payment processing [city]"
- "merchant services [industry]"
- "POS systems [business type]"
- "credit card processing rates"

### Content Strategy:
1. **Pillar Pages:** Comprehensive guides on main topics
2. **Cluster Content:** Specific articles linking to pillars
3. **Local SEO:** City + service combinations
4. **Industry Pages:** Solutions for specific business types

### Local SEO Tactics:
- Google My Business optimization
- Local directory listings
- Industry-specific directories
- Client testimonials with locations

## Email Marketing Sequences

### Lead Nurture (7-email series):
1. **Welcome + Free Guide**
2. **Common Payment Processing Mistakes**
3. **How to Calculate Your Real Costs**
4. **Success Story: Similar Business**
5. **Industry Trends and Insights**
6. **Free Rate Analysis Offer**
7. **Limited-Time Promotion**

### Educational Series (5-email series):
1. **Understanding Interchange Rates**
2. **EMV and Security Standards**
3. **Choosing the Right POS System**
4. **Chargeback Prevention**
5. **Integration and API Basics**

## Conversion Rate Optimization

### Landing Page Elements:
- Clear value proposition
- Trust signals (logos, certifications)
- Social proof (testimonials, reviews)
- Risk reversal (guarantees)
- Strong call-to-action

### A/B Testing Ideas:
- Headline variations
- CTA button colors and text
- Form length and fields
- Video vs. image hero sections

## Analytics and Tracking

### Key Metrics:
- Cost per lead (CPL)
- Lead to customer conversion rate
- Customer lifetime value (CLV)
- Return on ad spend (ROAS)

### Tracking Setup:
- Google Analytics 4
- Facebook Pixel
- LinkedIn Insight Tag
- Call tracking numbers
- CRM integration`,
        expertName: "Neil Patel",
        sourceUrl: "https://neilpatel.com"
      }
    ];

    // Jeremy Miner Content
    const jeremyMinerContent = [
      {
        title: "NEPQ Sales Method for Financial Services",
        content: `# Jeremy Miner's NEPQ (Neuro-Emotional Persuasion Questions) Framework

## Core Philosophy
"People buy based on emotion and justify with logic. Stop trying to convince and start getting them to convince themselves."

## The NEPQ Framework

### 1. Situation Questions
**Purpose:** Understand their current setup
**Examples:**
- "How long have you been with your current processor?"
- "What made you choose them initially?"
- "How many locations do you process payments at?"

### 2. Problem Questions
**Purpose:** Uncover pain points
**Examples:**
- "What challenges are you experiencing with your current setup?"
- "How is this affecting your bottom line?"
- "What happens when the system goes down?"

### 3. Implication Questions
**Purpose:** Make problems feel bigger
**Examples:**
- "How much revenue do you lose when you can't process cards?"
- "What does that stress do to you and your team?"
- "How does this impact your customers' experience?"

### 4. Need-Payoff Questions
**Purpose:** Get them to sell themselves
**Examples:**
- "How would it feel to save $500 monthly on processing?"
- "What would that extra money allow you to do for your business?"
- "How important is it to have reliable payment processing?"

## Advanced NEPQ Techniques

### The Consequence Question
- "What happens if you don't solve this problem?"
- "Where do you see your business in 6 months if this continues?"
- Forces them to confront the cost of inaction

### The Vision Question
- "If we could solve this perfectly, what would that look like?"
- "How would your ideal payment system work?"
- Gets them to paint the picture of success

### The Commitment Question
- "How committed are you to solving this problem?"
- "On a scale of 1-10, how important is this to you?"
- Qualifies their motivation level

## Tonality and Delivery

### Concerned Tone
- Lower pitch, slower pace
- Shows genuine concern for their situation
- "I'm a little concerned about what you just told me..."

### Confused Tone
- Slightly higher pitch, questioning inflection
- "I'm a little confused... help me understand..."
- Gets them to explain and elaborate

### Challenging Tone
- Confident, matter-of-fact delivery
- "Most businesses in your situation..."
- Challenges their current thinking

## Objection Prevention

### Price Objection Prevention
Before they can object to price:
- "Now, you mentioned budget is tight..."
- "You're probably wondering about the investment..."
- "I'm sure cost is a consideration..."

### Trust Objection Prevention
Before they can doubt credibility:
- "You might be thinking, 'Another salesperson...'"
- "I know you've probably heard promises before..."
- "You're probably skeptical about switching..."

## The NEPQ Sales Process

### Phase 1: Problem Identification (40% of call)
- Use situation and problem questions
- Get them talking about current challenges
- Don't present solutions yet

### Phase 2: Problem Amplification (30% of call)
- Use implication questions
- Make problems feel bigger
- Create urgency for change

### Phase 3: Solution Presentation (20% of call)
- Present tailored solution
- Connect to their specific problems
- Use their language and priorities

### Phase 4: Commitment (10% of call)
- Use need-payoff questions
- Get them to sell themselves
- Close with their own words

## Power Phrases for Payment Processing

### Opening the Conversation:
- "Help me understand your current payment setup..."
- "What's working well with your processor?"
- "What's not working as well as you'd like?"

### Digging Deeper:
- "How is that affecting your business?"
- "What does that cost you monthly?"
- "How long has this been a problem?"

### Creating Urgency:
- "What happens if this continues for another year?"
- "How much money is that over 12 months?"
- "What could you do with that extra profit?"

### Closing:
- "Based on what you've told me, it sounds like..."
- "How does that solution sound to you?"
- "What questions do you have before we move forward?"`,
        expertName: "Jeremy Miner",
        sourceUrl: "https://7thlevelhq.com"
      }
    ];

    // Donald Miller (StoryBrand) Content
    const donaldMillerContent = [
      {
        title: "StoryBrand Framework for Payment Processing",
        content: `# Donald Miller's StoryBrand Framework for Payment Processors

## The 7-Part StoryBrand Framework

### 1. The Hero (Your Customer)
**Not You, But Your Customer is the Hero**
- Small business owners
- Restaurant managers
- Retail store owners
- E-commerce entrepreneurs

**Their Desire:**
- Reliable payment processing
- Lower fees
- Better customer experience
- Business growth

### 2. The Problem
**Three Levels of Problems:**

**External Problem:** High processing fees
**Internal Problem:** Feeling ripped off and frustrated
**Philosophical Problem:** Businesses deserve transparent, fair pricing

**Example messaging:**
"Tired of surprise fees and confusing statements? You deserve honest, transparent payment processing."

### 3. The Guide (You)
**Express Empathy + Show Authority**

**Empathy:**
- "We understand how frustrating hidden fees can be"
- "We've helped thousands of businesses like yours"

**Authority:**
- Years of experience
- Industry certifications
- Client testimonials
- Case studies

### 4. The Plan
**Make it simple and clear**

**3-Step Process:**
1. **Free Rate Analysis** - We review your current statements
2. **Custom Proposal** - We design a solution for your business
3. **Seamless Setup** - We handle the entire transition

### 5. Call to Action
**Direct and Transitional CTAs**

**Direct CTA:**
- "Get Your Free Rate Analysis"
- "Schedule Your Consultation"
- "Start Saving Today"

**Transitional CTA:**
- "Download Our Fee Comparison Guide"
- "Watch Our Savings Calculator"
- "Read Our Success Stories"

### 6. Success
**Paint the picture of success**
- Lower monthly processing costs
- Reliable, fast transactions
- Better customer experience
- More time to focus on business growth
- Peace of mind with transparent pricing

### 7. Failure
**What happens if they don't change**
- Continue overpaying for processing
- Dealing with system downtime
- Frustrated customers
- Missing out on growth opportunities
- Falling behind competitors

## StoryBrand Website Structure

### Header Section:
**Headline:** "Stop Overpaying for Payment Processing"
**Subheadline:** "We help small businesses save 30% on processing fees with transparent pricing and reliable service"
**CTA Button:** "Get Your Free Rate Analysis"

### Problem Section:
"Are you tired of..."
- Hidden fees on your merchant statements
- Confusing contracts and terms
- Poor customer service when issues arise
- Overpaying compared to what you could be getting

### Solution Section:
"We provide..."
- Transparent, competitive pricing
- Reliable payment processing technology
- Dedicated account support
- Simple contract terms

### Plan Section:
"Here's how it works..."
1. Free rate analysis
2. Custom proposal
3. Seamless setup

### Success Stories Section:
"Here's what success looks like..."
- Client testimonials
- Case studies
- Before/after comparisons

## Email Sequences Using StoryBrand

### Welcome Email:
**Subject:** "Your journey to better payment processing starts here"
**Content:** Position them as hero, acknowledge their problem, introduce yourself as guide

### Problem-Focused Email:
**Subject:** "The hidden cost of 'competitive' rates"
**Content:** Dive deep into external, internal, and philosophical problems

### Solution Email:
**Subject:** "What if payment processing was actually simple?"
**Content:** Present your plan and success stories

### Social Proof Email:
**Subject:** "How [Similar Business] saved $2,400 annually"
**Content:** Case study showing transformation

### Urgency Email:
**Subject:** "Don't let another month of overpaying slip by"
**Content:** Failure scenarios and call to action

## StoryBrand Sales Conversations

### Opening:
"I understand you're looking at payment processing options. Most business owners we talk to are frustrated with hidden fees and poor service. Is that something you're experiencing?"

### Problem Exploration:
"Help me understand what's not working with your current processor..."

### Positioning as Guide:
"We've helped over 500 businesses solve exactly this problem..."

### Presenting the Plan:
"Here's how we'd solve this for you..."

### Painting Success:
"Imagine next month when you see your statement and you're saving $300..."

### Call to Action:
"Should we start with the free rate analysis or do you have other questions first?"

## Key StoryBrand Principles for Payment Processing

1. **Clear Message:** Stop confusing customers with industry jargon
2. **Customer as Hero:** Focus on their success, not your features
3. **Simple Plan:** Make the next step obvious
4. **Strong CTAs:** Every page needs a clear next step
5. **Success Vision:** Help them see life after solving their problem`,
        expertName: "Donald Miller",
        sourceUrl: "https://storybrand.com"
      }
    ];

    // Gino Wickman (EOS) Content
    const ginoWickmanContent = [
      {
        title: "EOS Business Development and Client Management",
        content: `# Gino Wickman's EOS Framework for Sales Organizations

## The EOS Model Components

### 1. Vision
**Get everyone aligned on where you're going**

**The Vision/Traction Organizer (V/TO):**
- Core Values
- Core Focus
- 10-Year Target
- Marketing Strategy
- 3-Year Picture
- 1-Year Plan
- Quarterly Rocks

### 2. People
**Get the right people in the right seats**

**People Analyzer:**
Rate each team member on:
- **GWC:** Gets it, Wants it, Capacity to do it
- **Core Values:** Do they share and live your values?

**For Sales Teams:**
- Gets it: Understands sales process and customer needs
- Wants it: Genuinely enjoys selling and helping customers
- Capacity: Has the skills and time to be successful

### 3. Data
**Run your business based on a handful of numbers**

**Sales Scorecard Metrics:**
- Number of prospects contacted weekly
- Number of discovery calls scheduled
- Number of proposals sent
- Conversion rate from proposal to close
- Average deal size
- Sales cycle length
- Customer acquisition cost
- Customer lifetime value

### 4. Issues
**Solve problems at their root**

**IDS Process:**
- **Identify:** What is the real issue?
- **Discuss:** Get to the root cause
- **Solve:** Determine next steps and ownership

**Common Sales Issues:**
- Low lead quality
- Long sales cycles
- Price objections
- Competition stealing deals

### 5. Process
**Document and systematize your way of doing business**

**Core Processes to Document:**
1. Lead Generation Process
2. Sales Process
3. Customer Onboarding Process
4. Customer Success Process
5. Account Management Process

### 6. Traction
**Bring discipline and accountability to your organization**

**90-Day Rocks:**
- 3-7 most important priorities for the quarter
- Specific, measurable, achievable
- Assigned to one person
- Reviewed weekly

## The Sales Process (EOS Style)

### Lead Generation Process
**Step 1:** Identify ideal customer profile
**Step 2:** Generate leads through defined channels
**Step 3:** Qualify leads using BANT criteria
**Step 4:** Schedule discovery call

### Sales Process
**Step 1:** Discovery call using NEPQ or similar framework
**Step 2:** Needs analysis and solution design
**Step 3:** Proposal presentation
**Step 4:** Objection handling and negotiation
**Step 5:** Close and onboard

### Customer Success Process
**Step 1:** Implementation and setup
**Step 2:** Training and education
**Step 3:** Regular check-ins and optimization
**Step 4:** Expansion and referral requests

## Weekly Level 10 Meetings

### Meeting Agenda (90 minutes):
1. **Segue** (5 minutes): Personal and business good news
2. **Scorecard Review** (5 minutes): Review key metrics
3. **Rock Review** (5 minutes): Update on quarterly priorities
4. **Customer/Employee Headlines** (5 minutes): Important updates
5. **To-Do List** (5 minutes): Review action items from last week
6. **IDS** (60 minutes): Solve the most important issues
7. **Conclude** (5 minutes): Recap to-dos and rate the meeting

### Sales Team Scorecard Example:
- Outbound calls made: Target 50/week
- Discovery calls scheduled: Target 10/week
- Proposals sent: Target 5/week
- Deals closed: Target 2/week
- Revenue generated: Target $50k/week

## Quarterly Planning for Sales Teams

### 90-Day Rock Examples:
- "Implement new CRM system by Q1 end"
- "Increase conversion rate to 25% by Q2 end"
- "Generate 50 qualified leads monthly by Q3 end"
- "Reduce sales cycle to 30 days by Q4 end"

### Annual Planning Process:
1. **Review Previous Year:** What worked, what didn't
2. **Set Annual Goals:** Revenue, growth, market share
3. **Break into Quarters:** 90-day rocks for each quarter
4. **Assign Ownership:** Who's accountable for each rock
5. **Create Scorecard:** How will you measure progress

## People Development

### Core Values for Sales Organizations:
- **Integrity:** Always do what's right for the customer
- **Excellence:** Continuously improve and deliver quality
- **Teamwork:** Support each other and share knowledge
- **Growth:** Embrace learning and development
- **Fun:** Enjoy the work and celebrate wins

### Accountability Chart:
Define roles and responsibilities:
- **Sales Manager:** Owns sales process and team development
- **Account Executives:** Own individual sales goals
- **Sales Development Reps:** Own lead generation and qualification
- **Customer Success:** Own implementation and retention

## Issues Management

### Common Sales Issues and Solutions:

**Issue:** "We're not hitting our numbers"
**Root Cause Analysis:**
- Is it a people problem? (Wrong person in seat)
- Is it a process problem? (Poor sales methodology)
- Is it a data problem? (Wrong metrics or targets)
- Is it a market problem? (External factors)

**Issue:** "Sales cycle is too long"
**Solutions:**
- Better qualification process
- Clearer value proposition
- Stronger urgency creation
- Improved objection handling

**Issue:** "Losing deals to competitors"
**Solutions:**
- Better competitive analysis
- Unique value proposition development
- Stronger relationship building
- Earlier engagement in buying process

## Implementation Roadmap

### Month 1-2: Foundation
- Define core values and core focus
- Create accountability chart
- Implement weekly Level 10 meetings
- Start tracking basic scorecard

### Month 3-4: Process
- Document core sales processes
- Implement CRM system
- Create sales playbooks
- Train team on new processes

### Month 5-6: Optimization
- Set quarterly rocks
- Refine scorecard metrics
- Address people issues
- Optimize processes based on data

### Ongoing: Discipline
- Weekly Level 10 meetings
- Quarterly planning sessions
- Annual vision refresh
- Continuous process improvement`,
        expertName: "Gino Wickman",
        sourceUrl: "https://eosworldwide.com"
      }
    ];

    // Add all content to the database
    console.log('Adding Alex Hormozi content...');
    for (const content of hormoziContent) {
      await addMarketingDocument(folderId, content.title, content.content, content.expertName, content.sourceUrl);
    }

    console.log('Adding Gary Vaynerchuk content...');
    for (const content of garyVContent) {
      await addMarketingDocument(folderId, content.title, content.content, content.expertName, content.sourceUrl);
    }

    console.log('Adding Neil Patel content...');
    for (const content of neilPatelContent) {
      await addMarketingDocument(folderId, content.title, content.content, content.expertName, content.sourceUrl);
    }

    console.log('Adding Jeremy Miner content...');
    for (const content of jeremyMinerContent) {
      await addMarketingDocument(folderId, content.title, content.content, content.expertName, content.sourceUrl);
    }

    console.log('Adding Donald Miller content...');
    for (const content of donaldMillerContent) {
      await addMarketingDocument(folderId, content.title, content.content, content.expertName, content.sourceUrl);
    }

    console.log('Adding Gino Wickman content...');
    for (const content of ginoWickmanContent) {
      await addMarketingDocument(folderId, content.title, content.content, content.expertName, content.sourceUrl);
    }

    console.log('Sales & Marketing content setup completed successfully!');
    console.log(`Total documents added: ${hormoziContent.length + garyVContent.length + neilPatelContent.length + jeremyMinerContent.length + donaldMillerContent.length + ginoWickmanContent.length}`);
    
  } catch (error) {
    console.error('Error setting up sales marketing content:', error);
  } finally {
    await pool.end();
  }
}

// Run the setup
setupSalesMarketingContent();