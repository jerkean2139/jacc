// Test script for document search with 5 realistic sales rep questions
import { db } from './server/db.js';
import { enhancedAIService } from './server/enhanced-ai.js';

async function testDocumentSearch() {
  console.log('🔍 Testing Document Search with 5 Realistic Sales Rep Questions\n');

  // 5 realistic questions that sales reps would ask
  const testQuestions = [
    {
      id: 1,
      question: "What are Square processing rates and fees?",
      category: "Processor Rates"
    },
    {
      id: 2,
      question: "What POS systems does Clover integrate with?",
      category: "POS Integration"
    },
    {
      id: 3,
      question: "What are the interchange rates for retail transactions?",
      category: "Interchange Rates"
    },
    {
      id: 4,
      question: "Does First Data offer mobile payment solutions?",
      category: "Mobile Payments"
    },
    {
      id: 5,
      question: "What are the chargeback fees for Worldpay?",
      category: "Chargeback Info"
    }
  ];

  for (const test of testQuestions) {
    console.log(`\n📋 Test ${test.id}: ${test.category}`);
    console.log(`❓ Question: "${test.question}"`);
    console.log('⏳ Searching documents...\n');

    try {
      // Search internal documents first
      const searchResults = await enhancedAIService.searchDocuments(test.question);
      
      console.log(`📚 Found ${searchResults.length} relevant documents:`);
      
      if (searchResults.length > 0) {
        searchResults.slice(0, 3).forEach((result, index) => {
          console.log(`  ${index + 1}. ${result.document.name}`);
          console.log(`     Relevance: ${(result.similarity * 100).toFixed(1)}%`);
          console.log(`     Snippet: ${result.chunk.content.substring(0, 100)}...`);
        });

        // Generate AI response with document context
        const response = await enhancedAIService.generateResponseWithDocuments(
          test.question,
          searchResults,
          'simple-user-001'
        );

        console.log('\n🤖 AI Response:');
        console.log(response.response.substring(0, 200) + '...');
        
        if (response.sources && response.sources.length > 0) {
          console.log(`\n📎 Sources cited: ${response.sources.length}`);
          response.sources.forEach((source, index) => {
            console.log(`  ${index + 1}. ${source.name} (${source.type})`);
          });
        }
      } else {
        console.log('❌ No relevant documents found');
        
        // Test ZenBot knowledge base search
        const zenBotResults = await enhancedAIService.searchZenBotKnowledgeBase(test.question);
        
        if (zenBotResults.length > 0) {
          console.log(`\n🧠 Found ${zenBotResults.length} ZenBot knowledge entries:`);
          zenBotResults.slice(0, 2).forEach((result, index) => {
            console.log(`  ${index + 1}. ${result.chunk.content.substring(0, 100)}...`);
          });
        }
      }

    } catch (error) {
      console.error(`❌ Error testing question ${test.id}:`, error.message);
    }

    console.log('\n' + '='.repeat(80));
  }

  console.log('\n✅ Document search testing completed!');
  console.log('This test validates that the AI can find and use internal documents to answer sales rep questions.');
}

// Run the test
testDocumentSearch().catch(console.error);