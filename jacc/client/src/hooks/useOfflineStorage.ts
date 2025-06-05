import { useState, useEffect } from 'react';
import { pwaService } from '@/lib/pwa';

export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncInProgress, setSyncInProgress] = useState(false);

  useEffect(() => {
    const handleOnlineStatus = (event: any) => {
      setIsOnline(event.detail.online);
    };

    const handleDataSynced = () => {
      setSyncInProgress(false);
    };

    window.addEventListener('pwa-online-status', handleOnlineStatus);
    window.addEventListener('pwa-data-synced', handleDataSynced);

    // Start sync when coming online
    if (isOnline && !syncInProgress) {
      setSyncInProgress(true);
    }

    return () => {
      window.removeEventListener('pwa-online-status', handleOnlineStatus);
      window.removeEventListener('pwa-data-synced', handleDataSynced);
    };
  }, [isOnline, syncInProgress]);

  const storeMessageOffline = async (message: {
    id: string;
    chatId: string;
    content: string;
    role: 'user' | 'assistant';
  }) => {
    return await pwaService.storeMessageOffline(message);
  };

  const storeChatOffline = async (chat: {
    id: string;
    title: string;
    userId: string;
    folderId?: string;
  }) => {
    return await pwaService.storeChatOffline(chat);
  };

  const getOfflineMessages = async (chatId: string) => {
    return await pwaService.getOfflineMessages(chatId);
  };

  const getOfflineChats = async () => {
    return await pwaService.getOfflineChats();
  };

  const cacheUserData = async (key: string, data: any) => {
    return await pwaService.cacheUserData(key, data);
  };

  const getCachedUserData = async (key: string) => {
    return await pwaService.getCachedUserData(key);
  };

  return {
    isOnline,
    syncInProgress,
    storeMessageOffline,
    storeChatOffline,
    getOfflineMessages,
    getOfflineChats,
    cacheUserData,
    getCachedUserData,
  };
}