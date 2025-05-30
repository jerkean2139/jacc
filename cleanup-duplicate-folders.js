const fs = require('fs');

async function cleanupDuplicateFolders() {
  try {
    // Fetch all folders
    const response = await fetch('http://localhost:5000/api/folders');
    const folders = await response.json();
    
    console.log(`Found ${folders.length} total folders`);
    
    // Group folders by name
    const folderGroups = {};
    folders.forEach(folder => {
      if (!folderGroups[folder.name]) {
        folderGroups[folder.name] = [];
      }
      folderGroups[folder.name].push(folder);
    });
    
    // Find duplicates and identify which ones to delete
    const foldersToDelete = [];
    
    Object.entries(folderGroups).forEach(([name, group]) => {
      if (group.length > 1) {
        console.log(`\nFound ${group.length} duplicates for "${name}"`);
        
        // Sort by creation date to keep the oldest
        group.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        // Keep the first (oldest), delete the rest
        const toKeep = group[0];
        const toDelete = group.slice(1);
        
        console.log(`  Keeping: ${toKeep.id} (created ${toKeep.createdAt})`);
        toDelete.forEach(folder => {
          console.log(`  Deleting: ${folder.id} (created ${folder.createdAt})`);
          foldersToDelete.push(folder);
        });
      }
    });
    
    console.log(`\nTotal folders to delete: ${foldersToDelete.length}`);
    
    // Delete the duplicate folders
    for (const folder of foldersToDelete) {
      try {
        const deleteResponse = await fetch(`http://localhost:5000/api/folders/${folder.id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (deleteResponse.ok) {
          console.log(`✓ Deleted ${folder.name} (${folder.id})`);
        } else {
          console.log(`✗ Failed to delete ${folder.name} (${folder.id}): ${deleteResponse.status}`);
        }
      } catch (error) {
        console.log(`✗ Error deleting ${folder.name} (${folder.id}):`, error.message);
      }
    }
    
    console.log('\nCleanup completed!');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

cleanupDuplicateFolders();