// Test script to set up folder structure and organize chats
import { db } from './server/db.js';
import { folders, chats } from './shared/schema.js';
import { eq } from 'drizzle-orm';

const testUserId = 'dev-user-123';

async function setupTestFolders() {
  console.log('Setting up test folder structure...');
  
  const testFolders = [
    {
      name: 'TSYS Documents',
      vectorNamespace: 'processors/tsys',
      folderType: 'processor',
      priority: 90,
      color: 'blue'
    },
    {
      name: 'Clearent Materials',
      vectorNamespace: 'processors/clearent',
      folderType: 'processor',
      priority: 85,
      color: 'green'
    },
    {
      name: 'Rate Comparisons',
      vectorNamespace: 'sales/comparisons',
      folderType: 'sales',
      priority: 80,
      color: 'purple'
    },
    {
      name: 'Terminal Hardware',
      vectorNamespace: 'hardware/terminals',
      folderType: 'hardware',
      priority: 75,
      color: 'yellow'
    },
    {
      name: 'Sales Presentations',
      vectorNamespace: 'sales/presentations',
      folderType: 'sales',
      priority: 70,
      color: 'red'
    }
  ];

  for (const folder of testFolders) {
    try {
      const result = await db.insert(folders).values({
        name: folder.name,
        userId: testUserId,
        vectorNamespace: folder.vectorNamespace,
        folderType: folder.folderType,
        priority: folder.priority,
        color: folder.color
      }).returning();
      
      console.log(`✅ Created folder: ${folder.name} (${folder.vectorNamespace})`);
    } catch (error) {
      console.log(`⚠️ Folder ${folder.name} might already exist`);
    }
  }
}

async function organizeChatsByTopic() {
  console.log('\nOrganizing existing chats into folders...');
  
  // Get all existing chats
  const existingChats = await db
    .select()
    .from(chats)
    .where(eq(chats.userId, testUserId))
    .limit(10);

  console.log(`Found ${existingChats.length} existing chats to organize`);

  // Get created folders
  const createdFolders = await db
    .select()
    .from(folders)
    .where(eq(folders.userId, testUserId));

  // Organize chats based on keywords in titles
  for (const chat of existingChats) {
    const title = chat.title.toLowerCase();
    let targetFolder = null;

    if (title.includes('tsys') || title.includes('total system')) {
      targetFolder = createdFolders.find(f => f.vectorNamespace === 'processors/tsys');
    } else if (title.includes('clearent') || title.includes('clearant')) {
      targetFolder = createdFolders.find(f => f.vectorNamespace === 'processors/clearent');
    } else if (title.includes('rate') || title.includes('comparison') || title.includes('pricing')) {
      targetFolder = createdFolders.find(f => f.vectorNamespace === 'sales/comparisons');
    } else if (title.includes('terminal') || title.includes('hardware') || title.includes('equipment')) {
      targetFolder = createdFolders.find(f => f.vectorNamespace === 'hardware/terminals');
    } else if (title.includes('presentation') || title.includes('sales') || title.includes('proposal')) {
      targetFolder = createdFolders.find(f => f.vectorNamespace === 'sales/presentations');
    }

    if (targetFolder) {
      try {
        await db
          .update(chats)
          .set({ folderId: targetFolder.id })
          .where(eq(chats.id, chat.id));
        
        console.log(`📁 Moved "${chat.title}" to folder "${targetFolder.name}"`);
      } catch (error) {
        console.log(`❌ Failed to move chat: ${chat.title}`);
      }
    }
  }
}

async function createTestChats() {
  console.log('\nCreating additional test chats...');
  
  const testChats = [
    {
      title: 'TSYS Application Process Questions',
      folderId: 'processors/tsys'
    },
    {
      title: 'Clearent Rate Structure Inquiry',
      folderId: 'processors/clearent'
    },
    {
      title: 'Terminal Hardware Comparison',
      folderId: 'hardware/terminals'
    },
    {
      title: 'Monthly Rate Analysis Report',
      folderId: 'sales/comparisons'
    },
    {
      title: 'Client Presentation Materials',
      folderId: 'sales/presentations'
    }
  ];

  const createdFolders = await db
    .select()
    .from(folders)
    .where(eq(folders.userId, testUserId));

  for (const chatData of testChats) {
    const targetFolder = createdFolders.find(f => f.vectorNamespace === chatData.folderId);
    
    if (targetFolder) {
      try {
        const result = await db.insert(chats).values({
          title: chatData.title,
          userId: testUserId,
          folderId: targetFolder.id
        }).returning();
        
        console.log(`💬 Created test chat: "${chatData.title}" in "${targetFolder.name}"`);
      } catch (error) {
        console.log(`❌ Failed to create chat: ${chatData.title}`);
      }
    }
  }
}

async function runSetup() {
  try {
    await setupTestFolders();
    await organizeChatsByTopic();
    await createTestChats();
    console.log('\n🎉 Test folder setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

runSetup();