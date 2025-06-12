import fs from 'fs';
import csv from 'csv-parser';
import { db } from './server/db.ts';
import { faqKnowledgeBase } from './shared/schema.ts';

async function importFAQData() {
  const faqs = [];
  
  // Read and parse CSV file
  return new Promise((resolve, reject) => {
    fs.createReadStream('./uploads/zenbot-knowledge-base.csv')
      .pipe(csv())
      .on('data', (row) => {
        const question = row['REP Questions'];
        const answer = row['Tracer - C2FS Answers'];
        
        if (question && answer && question.trim() && answer.trim()) {
          // Categorize based on content
          let category = 'general';
          const questionLower = question.toLowerCase();
          const answerLower = answer.toLowerCase();
          
          if (questionLower.includes('pos') || questionLower.includes('point of sale') || answerLower.includes('pos')) {
            category = 'pos-systems';
          } else if (questionLower.includes('fee') || questionLower.includes('cost') || questionLower.includes('price')) {
            category = 'pricing-rates';
          } else if (questionLower.includes('support') || questionLower.includes('contact') || answerLower.includes('support')) {
            category = 'technical-support';
          } else if (questionLower.includes('integration') || questionLower.includes('integrate')) {
            category = 'integrations';
          } else if (questionLower.includes('gateway') || questionLower.includes('payment') || questionLower.includes('processing')) {
            category = 'payment-processing';
          } else if (questionLower.includes('merchant') || questionLower.includes('business')) {
            category = 'merchant-services';
          }
          
          // Determine priority based on importance keywords
          let priority = 2; // Default to medium
          if (questionLower.includes('support') || questionLower.includes('contact') || questionLower.includes('number')) {
            priority = 1; // High priority for support contacts
          } else if (questionLower.includes('fee') || questionLower.includes('cost') || questionLower.includes('price')) {
            priority = 1; // High priority for pricing
          } else if (questionLower.includes('integration') || questionLower.includes('integrate')) {
            priority = 1; // High priority for integrations
          }
          
          const faq = {
            question: question.trim(),
            answer: answer.trim(),
            category: category,
            tags: [],
            isActive: true,
            priority: priority
          };
          
          faqs.push(faq);
        }
      })
      .on('end', async () => {
        try {
          console.log(`Importing ${faqs.length} FAQ entries...`);
          
          // Import all FAQs into database
          for (const faq of faqs) {
            await db.insert(faqKnowledgeBase).values(faq);
          }
          
          console.log(`✅ Successfully imported ${faqs.length} FAQ entries`);
          console.log('Categories imported:');
          
          const categoryCount = {};
          faqs.forEach(faq => {
            categoryCount[faq.category] = (categoryCount[faq.category] || 0) + 1;
          });
          
          Object.entries(categoryCount).forEach(([category, count]) => {
            console.log(`  - ${category}: ${count} entries`);
          });
          
          resolve(faqs);
        } catch (error) {
          console.error('Error importing FAQ data:', error);
          reject(error);
        }
      })
      .on('error', reject);
  });
}

// Run the import
importFAQData()
  .then(() => {
    console.log('FAQ import completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('FAQ import failed:', error);
    process.exit(1);
  });