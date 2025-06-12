import { db } from './server/db.js';
import { documents, documentChunks } from './shared/schema.js';
import { eq } from 'drizzle-orm';
import { EnhancedAIService } from './server/enhanced-ai.js';

// Test questions to validate document reading accuracy
const testQuestions = [
  {
    id: 'processing_rates',
    question: "What are the processing rates for a restaurant processing $50,000 monthly volume?",
    expectedKeywords: ['rate', 'processing', 'restaurant', 'volume', 'monthly'],
    category: 'pricing'
  },
  {
    id: 'interchange_fees',
    question: "Explain interchange fees and how they affect merchant costs",
    expectedKeywords: ['interchange', 'fees', 'merchant', 'cost', 'card'],
    category: 'education'
  },
  {
    id: 'pos_integration',
    question: "What POS systems does TracerPay integrate with?",
    expectedKeywords: ['POS', 'integration', 'TracerPay', 'systems'],
    category: 'technical'
  },
  {
    id: 'compliance_requirements',
    question: "What are the PCI compliance requirements for merchants?",
    expectedKeywords: ['PCI', 'compliance', 'requirements', 'merchant', 'security'],
    category: 'compliance'
  },
  {
    id: 'competitive_analysis',
    question: "How does TracerPay compare to Square for small businesses?",
    expectedKeywords: ['TracerPay', 'Square', 'comparison', 'small business'],
    category: 'competitive'
  }
];

async function testDocumentAccuracy() {
  console.log('🧪 Starting Document Reading Accuracy Test');
  console.log('=' .repeat(60));
  
  try {
    // Initialize AI service
    const aiService = new EnhancedAIService();
    
    // Check available documents
    const availableDocuments = await db.select().from(documents);
    console.log(`📚 Found ${availableDocuments.length} documents in database`);
    
    if (availableDocuments.length === 0) {
      console.log('❌ No documents found. Please upload documents first.');
      return;
    }
    
    // List available documents
    console.log('\n📋 Available Documents:');
    availableDocuments.forEach((doc, index) => {
      console.log(`  ${index + 1}. ${doc.name} (${doc.mimeType})`);
    });
    
    const results = [];
    
    // Test each question
    for (const testCase of testQuestions) {
      console.log(`\n🔍 Testing: ${testCase.question}`);
      console.log(`   Category: ${testCase.category}`);
      
      try {
        // Query the AI system
        const response = await aiService.processMessage(testCase.question, []);
        
        // Analyze response quality
        const analysis = analyzeResponse(response, testCase);
        results.push({
          ...testCase,
          response: response.message,
          sources: response.sources || [],
          analysis
        });
        
        console.log(`   ✅ Response generated (${response.message.length} chars)`);
        console.log(`   📊 Quality Score: ${analysis.qualityScore}/10`);
        console.log(`   📖 Sources Used: ${response.sources?.length || 0}`);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.push({
          ...testCase,
          error: error.message,
          analysis: { qualityScore: 0, issues: ['System error'] }
        });
      }
    }
    
    // Generate summary report
    generateReport(results);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

function analyzeResponse(response, testCase) {
  const analysis = {
    qualityScore: 0,
    keywordMatches: 0,
    hasSources: false,
    responseLength: response.message.length,
    issues: []
  };
  
  // Check keyword coverage
  const responseText = response.message.toLowerCase();
  testCase.expectedKeywords.forEach(keyword => {
    if (responseText.includes(keyword.toLowerCase())) {
      analysis.keywordMatches++;
    }
  });
  
  // Check if sources are provided
  analysis.hasSources = response.sources && response.sources.length > 0;
  
  // Response length assessment
  if (analysis.responseLength < 100) {
    analysis.issues.push('Response too short');
  } else if (analysis.responseLength > 2000) {
    analysis.issues.push('Response potentially too verbose');
  }
  
  // Keyword coverage score (0-4 points)
  const keywordScore = (analysis.keywordMatches / testCase.expectedKeywords.length) * 4;
  
  // Source usage score (0-3 points)
  const sourceScore = analysis.hasSources ? 3 : 0;
  
  // Length appropriateness score (0-2 points)
  const lengthScore = (analysis.responseLength >= 100 && analysis.responseLength <= 2000) ? 2 : 1;
  
  // Specificity score (0-1 point) - basic check for generic responses
  const specificityScore = responseText.includes('tracerpay') || 
                           responseText.includes('specific') || 
                           responseText.includes('merchant') ? 1 : 0;
  
  analysis.qualityScore = Math.round(keywordScore + sourceScore + lengthScore + specificityScore);
  
  return analysis;
}

function generateReport(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 DOCUMENT READING ACCURACY REPORT');
  console.log('='.repeat(60));
  
  const totalTests = results.length;
  const successfulTests = results.filter(r => !r.error).length;
  const averageQuality = results.reduce((sum, r) => sum + (r.analysis?.qualityScore || 0), 0) / totalTests;
  
  console.log(`\n📈 Summary Statistics:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Successful: ${successfulTests}/${totalTests} (${Math.round(successfulTests/totalTests*100)}%)`);
  console.log(`   Average Quality Score: ${averageQuality.toFixed(1)}/10`);
  
  // Category breakdown
  const categories = {};
  results.forEach(result => {
    if (!categories[result.category]) {
      categories[result.category] = { total: 0, avgScore: 0 };
    }
    categories[result.category].total++;
    categories[result.category].avgScore += result.analysis?.qualityScore || 0;
  });
  
  console.log(`\n📂 Performance by Category:`);
  Object.entries(categories).forEach(([category, stats]) => {
    const avgScore = (stats.avgScore / stats.total).toFixed(1);
    console.log(`   ${category}: ${avgScore}/10 (${stats.total} tests)`);
  });
  
  // Detailed results
  console.log(`\n📝 Detailed Results:`);
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.question}`);
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    } else {
      console.log(`   Score: ${result.analysis.qualityScore}/10`);
      console.log(`   Keywords Found: ${result.analysis.keywordMatches}/${result.expectedKeywords.length}`);
      console.log(`   Sources: ${result.sources.length}`);
      if (result.analysis.issues.length > 0) {
        console.log(`   Issues: ${result.analysis.issues.join(', ')}`);
      }
    }
  });
  
  // Recommendations
  console.log(`\n💡 Recommendations:`);
  if (averageQuality < 6) {
    console.log(`   • Quality scores are below optimal (${averageQuality.toFixed(1)}/10)`);
    console.log(`   • Consider improving document indexing and search relevance`);
  }
  
  const sourcelessResponses = results.filter(r => !r.analysis?.hasSources).length;
  if (sourcelessResponses > 0) {
    console.log(`   • ${sourcelessResponses} responses lacked document sources`);
    console.log(`   • Verify document processing and vector search functionality`);
  }
  
  const errorCount = results.filter(r => r.error).length;
  if (errorCount > 0) {
    console.log(`   • ${errorCount} tests failed with errors`);
    console.log(`   • Check AI service configuration and API connectivity`);
  }
  
  console.log('\n✅ Document accuracy test completed!');
}

// Run the test
testDocumentAccuracy().catch(console.error);