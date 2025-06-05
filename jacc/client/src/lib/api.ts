import { apiRequest } from "./queryClient";

export interface CreateChatRequest {
  title: string;
  folderId?: string;
}

export interface SendMessageRequest {
  content: string;
  role: 'user' | 'assistant';
  metadata?: any;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string;
  color?: string;
}

export const api = {
  // Chat operations
  chats: {
    list: () => apiRequest('GET', '/api/chats'),
    create: (data: CreateChatRequest) => apiRequest('POST', '/api/chats', data),
    getMessages: (chatId: string) => apiRequest('GET', `/api/chats/${chatId}/messages`),
    sendMessage: (chatId: string, data: SendMessageRequest) => 
      apiRequest('POST', `/api/chats/${chatId}/messages`, data),
  },

  // Folder operations
  folders: {
    list: () => apiRequest('GET', '/api/folders'),
    create: (data: CreateFolderRequest) => apiRequest('POST', '/api/folders', data),
  },

  // Document operations
  documents: {
    list: () => apiRequest('GET', '/api/documents'),
    upload: (formData: FormData) => {
      return fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
    }
  },

  // Favorites operations
  favorites: {
    list: () => apiRequest('GET', '/api/favorites'),
    create: (itemType: string, itemId: string) => 
      apiRequest('POST', '/api/favorites', { itemType, itemId }),
    delete: (id: string) => apiRequest('DELETE', `/api/favorites/${id}`),
  },

  // Auth operations
  auth: {
    user: () => apiRequest('GET', '/api/auth/user'),
    login: () => { window.location.href = '/api/login'; },
    logout: () => { window.location.href = '/api/logout'; },
  }
};
