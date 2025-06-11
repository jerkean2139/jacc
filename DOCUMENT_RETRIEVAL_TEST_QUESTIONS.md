# Document Retrieval Test Questions

## Test Questions for JACC Document Search & Knowledge Base

### 1. Processor Rate Comparison
**Question:** "What are the current interchange rates for Visa and MasterCard credit cards, and how do they compare to debit card rates?"

**Expected Result:** Should retrieve information about current interchange rate structures, differences between credit/debit processing, and any recent rate changes.

### 2. Equipment and Hardware
**Question:** "What point-of-sale terminals and card readers are compatible with TracerPay processing, and what are their monthly lease rates?"

**Expected Result:** Should return hardware compatibility information, equipment specifications, pricing structures, and lease vs. purchase options.

### 3. Industry-Specific Processing
**Question:** "What are the specific requirements and rates for restaurant payment processing, including tips and gratuity handling?"

**Expected Result:** Should retrieve restaurant industry guidelines, tip processing procedures, specialized rates for food service, and compliance requirements.

### 4. Compliance and Regulations
**Question:** "What are the current PCI DSS compliance requirements for merchants, and what are the penalties for non-compliance?"

**Expected Result:** Should return PCI compliance standards, security requirements, audit procedures, and penalty structures for violations.

### 5. Chargeback and Dispute Management
**Question:** "How does the chargeback process work, what are the time limits for responding, and what documentation is required?"

**Expected Result:** Should retrieve chargeback procedures, response timeframes, required evidence, and dispute resolution processes.

### 6. High-Risk Merchant Processing
**Question:** "What industries are considered high-risk for payment processing, and what additional requirements or rates apply?"

**Expected Result:** Should return high-risk industry classifications, enhanced underwriting requirements, reserve requirements, and specialized pricing.

### 7. E-commerce and Card-Not-Present
**Question:** "What are the security requirements and fraud prevention measures for online payment processing?"

**Expected Result:** Should retrieve CNP transaction requirements, fraud prevention tools, 3D Secure protocols, and online security standards.

### 8. Mobile and Alternative Payments
**Question:** "What mobile payment solutions are available, and how do digital wallet transactions like Apple Pay and Google Pay get processed?"

**Expected Result:** Should return mobile payment options, digital wallet processing flows, contactless payment methods, and associated fees.

### 9. International and Multi-Currency
**Question:** "How are international transactions processed, and what are the foreign exchange fees and conversion rates?"

**Expected Result:** Should retrieve international processing procedures, FX fee structures, currency conversion methods, and cross-border regulations.

### 10. Statement Analysis and Savings
**Question:** "How can I analyze a merchant's current processing statement to identify potential savings and create a competitive proposal?"

**Expected Result:** Should return statement analysis procedures, cost breakdown methods, savings calculation techniques, and proposal generation guidelines.

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