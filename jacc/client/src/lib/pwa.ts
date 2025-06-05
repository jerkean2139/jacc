// PWA Service Worker Registration and Offline Storage
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface OfflineDBSchema extends DBSchema {
  'chat-messages': {
    key: string;
    value: {
      id: string;
      chatId: string;
      content: string;
      role: 'user' | 'assistant';
      timestamp: number;
      synced: boolean;
    };
  };
  'chats': {
    key: string;
    value: {
      id: string;
      title: string;
      userId: string;
      folderId?: string;
      timestamp: number;
      synced: boolean;
    };
  };
  'user-data': {
    key: string;
    value: {
      key: string;
      data: any;
      timestamp: number;
    };
  };
}

class PWAService {
  private db: IDBPDatabase<OfflineDBSchema> | null = null;
  private isOnline = navigator.onLine;

  constructor() {
    this.initializeDB();
    this.setupOnlineOfflineListeners();
    this.registerServiceWorker();
  }

  private async initializeDB() {
    try {
      this.db = await openDB<OfflineDBSchema>('jacc-offline', 1, {
        upgrade(db) {
          // Create object stores for offline data
          if (!db.objectStoreNames.contains('chat-messages')) {
            db.createObjectStore('chat-messages', { keyPath: 'id' });
          }
          
          if (!db.objectStoreNames.contains('chats')) {
            db.createObjectStore('chats', { keyPath: 'id' });
          }
          
          if (!db.objectStoreNames.contains('user-data')) {
            db.createObjectStore('user-data', { keyPath: 'key' });
          }
        },
      });
    } catch (error) {
      console.error('Failed to initialize offline database:', error);
    }
  }

  private setupOnlineOfflineListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
      this.notifyOnlineStatus(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyOnlineStatus(false);
    });
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', registration);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.notifyAppUpdate();
              }
            });
          }
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Store message offline when network is unavailable
  async storeMessageOffline(message: {
    id: string;
    chatId: string;
    content: string;
    role: 'user' | 'assistant';
  }) {
    if (!this.db) return false;

    try {
      await this.db.add('chat-messages', {
        ...message,
        timestamp: Date.now(),
        synced: false,
      });
      return true;
    } catch (error) {
      console.error('Failed to store message offline:', error);
      return false;
    }
  }

  // Store chat offline
  async storeChatOffline(chat: {
    id: string;
    title: string;
    userId: string;
    folderId?: string;
  }) {
    if (!this.db) return false;

    try {
      await this.db.add('chats', {
        ...chat,
        timestamp: Date.now(),
        synced: false,
      });
      return true;
    } catch (error) {
      console.error('Failed to store chat offline:', error);
      return false;
    }
  }

  // Get offline messages for a chat
  async getOfflineMessages(chatId: string) {
    if (!this.db) return [];

    try {
      const messages = await this.db.getAll('chat-messages');
      return messages.filter(msg => msg.chatId === chatId);
    } catch (error) {
      console.error('Failed to get offline messages:', error);
      return [];
    }
  }

  // Get offline chats
  async getOfflineChats() {
    if (!this.db) return [];

    try {
      return await this.db.getAll('chats');
    } catch (error) {
      console.error('Failed to get offline chats:', error);
      return [];
    }
  }

  // Sync offline data when connection is restored
  private async syncOfflineData() {
    if (!this.db) return;

    try {
      // Sync messages
      const unsyncedMessages = await this.db.getAll('chat-messages');
      const pendingMessages = unsyncedMessages.filter(msg => !msg.synced);

      for (const message of pendingMessages) {
        try {
          const response = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatId: message.chatId,
              content: message.content,
              role: message.role,
            }),
          });

          if (response.ok) {
            // Mark as synced
            await this.db.put('chat-messages', { ...message, synced: true });
          }
        } catch (error) {
          console.error('Failed to sync message:', error);
        }
      }

      // Sync chats
      const unsyncedChats = await this.db.getAll('chats');
      const pendingChats = unsyncedChats.filter(chat => !chat.synced);

      for (const chat of pendingChats) {
        try {
          const response = await fetch('/api/chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: chat.title,
              folderId: chat.folderId,
            }),
          });

          if (response.ok) {
            await this.db.put('chats', { ...chat, synced: true });
          }
        } catch (error) {
          console.error('Failed to sync chat:', error);
        }
      }

      this.notifyDataSynced();
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  }

  // Cache user data for offline access
  async cacheUserData(key: string, data: any) {
    if (!this.db) return;

    try {
      await this.db.put('user-data', {
        key,
        data,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to cache user data:', error);
    }
  }

  // Get cached user data
  async getCachedUserData(key: string) {
    if (!this.db) return null;

    try {
      const result = await this.db.get('user-data', key);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to get cached user data:', error);
      return null;
    }
  }

  // Check if app is online
  isAppOnline() {
    return this.isOnline;
  }

  // Notification methods
  private notifyOnlineStatus(online: boolean) {
    window.dispatchEvent(new CustomEvent('pwa-online-status', { 
      detail: { online } 
    }));
  }

  private notifyAppUpdate() {
    window.dispatchEvent(new CustomEvent('pwa-app-update'));
  }

  private notifyDataSynced() {
    window.dispatchEvent(new CustomEvent('pwa-data-synced'));
  }

  // Install app prompt
  async promptInstall() {
    const deferredPrompt = (window as any).deferredPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('PWA install prompt outcome:', outcome);
      (window as any).deferredPrompt = null;
    }
  }
}

// Create global PWA service instance
export const pwaService = new PWAService();

// Install prompt handling
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
  
  // Notify app that install is available
  window.dispatchEvent(new CustomEvent('pwa-install-available'));
});

// React hook for PWA functionality
import { useState, useEffect } from 'react';

export function usePWA() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installAvailable, setInstallAvailable] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const handleOnlineStatus = (event: any) => {
      setIsOnline(event.detail.online);
    };

    const handleInstallAvailable = () => {
      setInstallAvailable(true);
    };

    const handleAppUpdate = () => {
      setUpdateAvailable(true);
    };

    window.addEventListener('pwa-online-status', handleOnlineStatus);
    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-app-update', handleAppUpdate);

    return () => {
      window.removeEventListener('pwa-online-status', handleOnlineStatus);
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-app-update', handleAppUpdate);
    };
  }, []);

  const installApp = () => {
    pwaService.promptInstall();
    setInstallAvailable(false);
  };

  const reloadApp = () => {
    window.location.reload();
  };

  return {
    isOnline,
    installAvailable,
    updateAvailable,
    installApp,
    reloadApp,
    storeOffline: pwaService.storeMessageOffline.bind(pwaService),
    getOfflineData: pwaService.getOfflineMessages.bind(pwaService),
  };
}