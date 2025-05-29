// Script to parse and import FAQ data from the spreadsheet
import { db } from './server/db.js';
import { faqKnowledgeBase } from './shared/schema.js';
import fs from 'fs';

async function parseFaqData() {
  console.log('Reading FAQ spreadsheet data...');
  
  const data = fs.readFileSync('./attached_assets/Pasted-REP-Questions-Tracer-C2FS-Answers-Date-Added-Date-Updated-What-POS-option-t-1748554154432.txt', 'utf8');
  const lines = data.split('\n').filter(line => line.trim());
  
  const faqEntries = [];
  
  // Skip header line and process data
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Split by tab characters to separate question and answer
    const parts = line.split('\t').map(part => part.trim());
    if (parts.length < 2) continue;
    
    const question = parts[0];
    const answer = parts[1];
    
    if (!question || !answer || question === 'REP Questions') continue;
    
    // Categorize based on keywords in the question
    let category = 'general';
    let tags = [];
    
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('pos') || lowerQuestion.includes('point of sale')) {
      category = 'pos';
      tags.push('pos', 'systems');
    } else if (lowerQuestion.includes('integrate') || lowerQuestion.includes('integration')) {
      category = 'integration';
      tags.push('integration', 'software');
    } else if (lowerQuestion.includes('support') || lowerQuestion.includes('customer') || lowerQuestion.includes('contact')) {
      category = 'support';
      tags.push('support', 'contact');
    } else if (lowerQuestion.includes('fee') || lowerQuestion.includes('cost') || lowerQuestion.includes('price')) {
      category = 'pricing';
      tags.push('pricing', 'fees');
    } else if (lowerQuestion.includes('gateway') || lowerQuestion.includes('payment')) {
      category = 'gateway';
      tags.push('gateway', 'payment');
    } else if (lowerQuestion.includes('terminal') || lowerQuestion.includes('hardware')) {
      category = 'hardware';
      tags.push('hardware', 'terminal');
    } else if (lowerQuestion.includes('restaurant') || lowerQuestion.includes('retail') || lowerQuestion.includes('salon')) {
      category = 'industry';
      tags.push('industry', 'vertical');
    }
    
    // Extract processor/partner names for tags
    const processors = ['tsys', 'clearent', 'trx', 'micamp', 'shift4', 'quantic', 'hubwallet'];
    processors.forEach(processor => {
      if (lowerQuestion.includes(processor) || answer.toLowerCase().includes(processor)) {
        tags.push(processor);
      }
    });
    
    faqEntries.push({
      question: question,
      answer: answer,
      category: category,
      tags: tags,
      priority: category === 'support' ? 3 : (category === 'pos' ? 2 : 1),
      isActive: true
    });
  }
  
  console.log(`Parsed ${faqEntries.length} FAQ entries`);
  return faqEntries;
}

async function importFaqData() {
  try {
    const faqEntries = await parseFaqData();
    
    console.log('Importing FAQ entries into database...');
    
    // Clear existing data first
    await db.delete(faqKnowledgeBase);
    console.log('Cleared existing FAQ data');
    
    // Insert new data in batches
    const batchSize = 50;
    for (let i = 0; i < faqEntries.length; i += batchSize) {
      const batch = faqEntries.slice(i, i + batchSize);
      await db.insert(faqKnowledgeBase).values(batch);
      console.log(`Imported batch ${Math.floor(i/batchSize) + 1}`);
    }
    
    console.log(`✅ Successfully imported ${faqEntries.length} FAQ entries`);
    
    // Show some sample data
    const sampleFaqs = await db.select().from(faqKnowledgeBase).limit(5);
    console.log('\nSample imported FAQs:');
    sampleFaqs.forEach((faq, index) => {
      console.log(`${index + 1}. Q: ${faq.question.substring(0, 60)}...`);
      console.log(`   A: ${faq.answer.substring(0, 60)}...`);
      console.log(`   Category: ${faq.category}, Tags: [${faq.tags.join(', ')}]\n`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing FAQ data:', error);
    process.exit(1);
  }
}

importFaqData();