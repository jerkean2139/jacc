// Quick test to check if document search is working
const fetch = require('node-fetch');

async function testDocumentSearch() {
  try {
    console.log('Testing document search for TSYS...');
    
    // Test the documents API first
    const docsResponse = await fetch('http://localhost:5000/api/documents');
    const documents = await docsResponse.json();
    
    console.log(`Found ${documents.length} total documents`);
    
    // Filter for TSYS documents
    const tsysDocuments = documents.filter(doc => 
      doc.name.toLowerCase().includes('tsys') || 
      doc.originalName.toLowerCase().includes('tsys')
    );
    
    console.log(`Found ${tsysDocuments.length} TSYS documents:`);
    tsysDocuments.forEach(doc => {
      console.log(`- ${doc.name} (${doc.originalName})`);
    });
    
    if (tsysDocuments.length > 0) {
      console.log('\n✅ TSYS documents are uploaded and accessible');
      console.log('The issue is that the AI search system is not connecting to these documents');
    } else {
      console.log('\n❌ No TSYS documents found');
    }
    
  } catch (error) {
    console.error('Error testing document search:', error.message);
  }
}

testDocumentSearch();