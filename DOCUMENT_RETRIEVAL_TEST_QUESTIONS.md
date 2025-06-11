# Document Retrieval Test Questions

## Real Agent Questions for JACC Document Search & Knowledge Base

### 1. Basic Rates and Fees
**Question:** "What rates can TracerPay offer for a restaurant doing $15,000 per month in credit card sales?"

**Expected Result:** Should retrieve TracerPay pricing information, restaurant industry rates, and volume-based pricing from uploaded documents and FAQ.

### 2. Equipment Questions
**Question:** "My client wants to know what card terminals are available and how much they cost. What options do we have?"

**Expected Result:** Should return equipment options, pricing, lease vs purchase information from product catalogs and FAQ sections.

### 3. Getting Started Process
**Question:** "A new merchant wants to sign up. What documents do they need to provide and how long does approval take?"

**Expected Result:** Should retrieve onboarding requirements, document checklist, and timeline information from process documents.

### 4. Competitive Comparison
**Question:** "My prospect is currently with Square and paying 2.9%. How can I show them TracerPay is better?"

**Expected Result:** Should find competitive comparison data, TracerPay advantages, and rate comparison information from sales materials.

### 5. Problem Resolution
**Question:** "A merchant is asking about chargebacks. What should I tell them about how we handle disputes?"

**Expected Result:** Should retrieve chargeback support information, dispute resolution process, and merchant protection details from FAQ.

### 6. Industry-Specific Questions
**Question:** "Do we have special programs for auto repair shops? The merchant wants to know about our rates for this industry."

**Expected Result:** Should find industry-specific pricing, programs, or requirements for automotive businesses from uploaded materials.

### 7. Commission and Earnings
**Question:** "How much commission will I make on a $20,000 monthly volume account, and when do I get paid?"

**Expected Result:** Should retrieve commission structure, payment schedules, and earnings calculator information from agent materials.

### 8. Technical Support
**Question:** "My merchant's terminal isn't working. What's the technical support phone number and what troubleshooting steps should we try?"

**Expected Result:** Should find technical support contact information and basic troubleshooting steps from support documentation.

### 9. Contract and Terms
**Question:** "The merchant wants to know about contract length and early termination fees. What are our standard terms?"

**Expected Result:** Should retrieve contract terms, cancellation policies, and fee structures from agreement documents.

### 10. Referral and Bonus Programs
**Question:** "Are there any current promotions or bonus programs I can offer to new merchants to help close deals?"

**Expected Result:** Should find current promotional offers, sign-up bonuses, or incentive programs from marketing materials and FAQ.

## Testing Instructions

1. **Test each question individually** in the chat interface
2. **Verify response accuracy** against known documentation
3. **Check for relevant document citations** in responses
4. **Evaluate response completeness** and usefulness
5. **Test follow-up questions** to ensure context retention

## Expected Behavior

- **Relevant Documents Retrieved:** System should find and reference appropriate documents
- **Accurate Information:** Responses should match documented facts and figures
- **Contextual Understanding:** System should understand industry terminology and concepts
- **Source Attribution:** Responses should indicate which documents were referenced
- **Comprehensive Coverage:** Answers should address all aspects of the question

## Performance Metrics

- **Retrieval Accuracy:** Are the right documents being found?
- **Response Quality:** Is the information accurate and helpful?
- **Speed:** How quickly are responses generated?
- **Relevance:** Do responses directly address the question asked?
- **Completeness:** Are all relevant aspects covered?

## Troubleshooting

If any test fails:
1. Check if relevant documents exist in the knowledge base
2. Verify document indexing and chunking is working
3. Test search query variations
4. Review vector similarity thresholds
5. Examine document content for searchable terms

---
*Use these questions to validate the document retrieval system is functioning correctly and providing accurate, helpful responses to user queries.*