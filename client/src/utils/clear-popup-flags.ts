// Utility to clear all onboarding and tutorial popup flags from localStorage
export function clearAllPopupFlags() {
  try {
    const keysToRemove: string[] = [];
    
    // Find all keys related to popups
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('jacc-onboarding') || 
        key.includes('jacc-tutorial') || 
        key.includes('walkthrough') ||
        key.includes('tutorial-') ||
        key.includes('onboarding-')
      )) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all popup-related flags
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log('Cleared popup flag:', key);
    });
    
    console.log(`Cleared ${keysToRemove.length} popup flags from localStorage`);
    return keysToRemove.length;
  } catch (error) {
    console.error('Error clearing popup flags:', error);
    return 0;
  }
}

// Auto-clear on app load
if (typeof window !== 'undefined') {
  clearAllPopupFlags();
}