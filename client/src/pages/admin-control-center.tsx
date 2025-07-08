import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, Database, MessageSquare, Brain, PlayCircle, CheckCircle, XCircle, 
  AlertTriangle, Clock, TrendingUp, Zap, Globe, Search, FileText, Eye, Download,
  Edit, Trash2, Save, Plus, Folder, FolderOpen, Upload, Users, Activity,
  BarChart3, Timer, ChevronDown, ChevronRight, Target, BookOpen, ThumbsUp, Trash,
  ThumbsDown, Star, Copy, AlertCircle, ArrowRight, User, Bot, RefreshCw, Calendar,
  Archive, Scan
} from 'lucide-react';
import DocumentDragDrop from '@/components/ui/document-drag-drop';
import DocumentPreviewModal from '@/components/ui/document-preview-modal';
import DocumentUpload from '@/components/document-upload-new';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  priority: number;
  isActive: boolean;
}

interface DocumentEntry {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  folderId?: string;
}

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  category: string;
  temperature: number;
  maxTokens: number;
  isActive: boolean;
}

export default function AdminControlCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for creating new FAQ entries
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newPriority, setNewPriority] = useState(1);
  const [openKnowledgeCategories, setOpenKnowledgeCategories] = useState<string[]>([]);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);

  // State for creating new prompt templates
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptDescription, setNewPromptDescription] = useState('');
  const [newPromptTemplate, setNewPromptTemplate] = useState('');
  const [newPromptCategory, setNewPromptCategory] = useState('system');
  const [newPromptTemperature, setNewPromptTemperature] = useState(0.7);
  const [newPromptMaxTokens, setNewPromptMaxTokens] = useState(1000);

  // Document upload states
  const [uploadSelectedFolder, setUploadSelectedFolder] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState('admin');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  
  // Folder creation states
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('blue');
  
  // Document management states
  const [documentSearchTerm, setDocumentSearchTerm] = useState('');
  const [documentFilter, setDocumentFilter] = useState('all');
  
  // Chat Review Center States
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedChatDetails, setSelectedChatDetails] = useState<any>(null);
  const [chatReviewTab, setChatReviewTab] = useState<string>("active");
  const [chatDisplayLimit, setChatDisplayLimit] = useState(5); // Show 5 chats initially
  

  // URL tracking state  
  const [showEditUrl, setShowEditUrl] = useState(false);
  
  // State for category management
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  
  // URL Scraping for Knowledge Base
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScrapingForKnowledge, setIsScrapingForKnowledge] = useState(false);
  const [enableWeeklyUpdates, setEnableWeeklyUpdates] = useState(false);
  const [settingsTab, setSettingsTab] = useState("ai-search");
  
  // Dialog states for glassomorphic settings
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showEditFAQ, setShowEditFAQ] = useState(false);
  const [scheduledUrls, setScheduledUrls] = useState<string[]>([]);
  const [correctionText, setCorrectionText] = useState("");
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  // State for URL tracking management
  const [editingUrl, setEditingUrl] = useState<any>(null);
  const [isForcingUpdate, setIsForcingUpdate] = useState<string | null>(null);

  // Data queries
  const { data: faqData = [], isLoading: faqLoading, error: faqError } = useQuery({
    queryKey: ['/api/admin/faq'],
    retry: false,
  });

  const { data: documentsData = [] } = useQuery({
    queryKey: ['/api/admin/documents'],
    retry: false,
  });

  const { data: foldersData = [] } = useQuery({
    queryKey: ['/api/folders'],
    retry: false,
  });

  const { data: userChats, isLoading: chatsLoading } = useQuery({
    queryKey: ['/api/admin/chat-reviews'],
  });

  const { data: chatMessages, isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/chats/${selectedChatId}/messages`],
    enabled: !!selectedChatId,
  });

  // Fetch vendor URLs for tracking
  const { data: vendorUrls = [], refetch: refetchVendorUrls } = useQuery({
    queryKey: ['/api/admin/vendor-urls'],
    retry: false,
  });

  // Fetch FAQ categories
  const { data: faqCategories = [] } = useQuery({
    queryKey: ['/api/admin/faq-categories'],
    retry: false,
  });

  // Monitor chat selection state
  useEffect(() => {
    if (selectedChatId && chatMessages?.length > 0) {
      console.log('Chat loaded successfully:', {
        chatId: selectedChatId,
        messageCount: chatMessages.length
      });
    }
  }, [selectedChatId, chatMessages]);

  // Update chat details whenever chatMessages changes
  useEffect(() => {
    if (selectedChatId && chatMessages) {
      console.log('Processing chat messages:', { 
        chatId: selectedChatId, 
        messageCount: chatMessages.length,
        messages: chatMessages 
      });
      
      if (chatMessages.length > 0) {
        console.log('Sample message structure:', chatMessages[0]);
        
        // Try different message field names
        const userMessage = chatMessages.find((m: any) => 
          m.role === 'user' || m.sender === 'user' || m.type === 'user'
        )?.content || chatMessages.find((m: any) => 
          m.role === 'user' || m.sender === 'user' || m.type === 'user'
        )?.message || '';
        
        const aiResponse = chatMessages.find((m: any) => 
          m.role === 'assistant' || m.sender === 'assistant' || m.type === 'assistant'
        )?.content || chatMessages.find((m: any) => 
          m.role === 'assistant' || m.sender === 'assistant' || m.type === 'assistant'
        )?.message || '';
        
        setSelectedChatDetails({
          userMessage,
          aiResponse,
          messages: chatMessages
        });
        console.log('Chat details updated:', { 
          hasUserMessage: !!userMessage, 
          hasAiResponse: !!aiResponse,
          userMessageLength: userMessage.length,
          aiResponseLength: aiResponse.length,
          messageFields: Object.keys(chatMessages[0] || {})
        });
      } else {
        setSelectedChatDetails({
          userMessage: 'No user message in this conversation',
          aiResponse: 'No AI response in this conversation',
          messages: []
        });
      }
    }
  }, [chatMessages, selectedChatId]);

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      const response = await fetch('/api/admin/faq-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      });
      if (!response.ok) throw new Error('Failed to create category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faq'] });
      setShowCreateCategory(false);
      setNewCategoryName('');
      setNewCategoryDescription('');
      toast({
        title: "Category Created",
        description: "New FAQ category has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/admin/faq-categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faq'] });
      setShowEditCategory(false);
      setEditingCategory(null);
      setNewCategoryName('');
      setNewCategoryDescription('');
      toast({
        title: "Category Updated",
        description: "FAQ category has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update category. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/faq-categories/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faq'] });
      toast({
        title: "Category Deleted",
        description: "FAQ category has been deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed", 
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mutations
  const createFAQMutation = useMutation({
    mutationFn: async (newFAQ: Omit<FAQ, 'id'>) => {
      console.log('Creating FAQ with data:', newFAQ);
      const response = await apiRequest('POST', '/api/admin/faq', newFAQ);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faq'] });
      setNewQuestion('');
      setNewAnswer('');
      setNewCategory('general');
      setNewPriority(1);
      toast({
        title: "FAQ Created",
        description: "New FAQ entry has been added successfully.",
      });
    },
    onError: (error) => {
      console.error('FAQ creation error:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create FAQ entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Edit FAQ mutation - Fixed API call
  const editFAQMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FAQ> }) => {
      console.log('Updating FAQ:', id, data);
      const response = await fetch(`/api/admin/faq/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update FAQ');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faq'] });
      setEditingFAQ(null);
      toast({
        title: "FAQ Updated",
        description: "FAQ entry has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('FAQ update error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update FAQ entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete FAQ mutation - Fixed API call
  const deleteFAQMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/faq/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete FAQ');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faq'] });
      toast({
        title: "FAQ Deleted",
        description: "FAQ entry has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('FAQ deletion error:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete FAQ entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Category CRUD mutations - already defined above

  // Update and delete category mutations already defined above

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (folderData: { name: string; color: string }) => {
      const response = await apiRequest('POST', '/api/folders', {
        name: folderData.name,
        color: folderData.color,
        folderType: 'custom',
        vectorNamespace: `folder_${folderData.name.toLowerCase().replace(/\s+/g, '_')}`
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      setUploadSelectedFolder(data.id);
      setIsCreateFolderDialogOpen(false);
      setNewFolderName('');
      setNewFolderColor('blue');
      toast({
        title: "Folder Created",
        description: `Folder "${data.name}" has been created successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: "Failed to create folder. Please try again.",
        variant: "destructive",
      });
    }
  });



  const handleSubmitCorrection = async () => {
    if (!correctionText.trim() || !selectedChatDetails) return;
    
    setIsSubmittingCorrection(true);
    
    try {
      const response = await fetch('/api/admin/ai-simulator/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalQuery: selectedChatDetails.userMessage,
          originalResponse: selectedChatDetails.aiResponse,
          correctedResponse: correctionText,
          improvementType: "admin_correction",
          addToKnowledgeBase: true,
          chatId: selectedChatId
        })
      });
      
      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ['/api/admin/chat-reviews'] });
        toast({
          title: "Training Correction Submitted",
          description: "AI has been trained with the corrected response",
        });
        setCorrectionText("");
      } else {
        throw new Error('Failed to submit correction');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit training correction",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  // Archive chat mutation
  const archiveChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const response = await fetch(`/api/admin/chat-reviews/${chatId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to archive chat');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat-reviews'] });
      toast({
        title: "Chat Archived",
        description: "Chat has been moved to archived folder",
      });
      setSelectedChatId(null);
      setSelectedChatDetails(null);
    },
  });

  // URL tracking mutations
  const updateUrlMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest(`/api/admin/vendor-urls/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "URL Updated",
        description: "Vendor URL has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendor-urls'] });
      setShowEditUrl(false);
      setEditingUrl(null);
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: "Failed to update URL",
        variant: "destructive",
      });
    },
  });

  const forceUpdateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/admin/scrape-vendor-url/${id}`, {
        method: 'POST',
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Update Forced",
        description: "URL content is being scraped and updated",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendor-urls'] });
      setIsForcingUpdate(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to force update",
        variant: "destructive",
      });
      setIsForcingUpdate(null);
    },
  });

  const deleteUrlMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/admin/vendor-urls/${id}`, {
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "URL Deleted",
        description: "Vendor URL has been removed from tracking",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendor-urls'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete URL",
        variant: "destructive",
      });
    },
  });

  // Delete chat mutation
  const deleteChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const response = await fetch(`/api/admin/chat-reviews/${chatId}/delete`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'credentials': 'include'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to delete chat: ${response.status} ${errorData}`);
      }
      
      // Try to parse JSON, but handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      } else {
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      toast({
        title: "Chat Deleted",
        description: "Chat has been permanently removed from the system",
      });
      setSelectedChatId(null);
      setSelectedChatDetails(null);
    },
    onError: (error: Error) => {
      console.error('Delete chat error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete chat. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Approve chat mutation
  const approveChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const response = await fetch(`/api/admin/chat-reviews/${chatId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          feedback: 'Chat approved by admin',
          reviewStatus: 'approved'
        })
      });
      if (!response.ok) throw new Error('Failed to approve chat');
      return response.json();
    },
    onSuccess: (data, chatId) => {
      // Invalidate all related queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      
      // Update the selected chat details locally if it's the current one
      if (selectedChatId === chatId && selectedChatDetails) {
        setSelectedChatDetails({
          ...selectedChatDetails,
          reviewStatus: 'approved'
        });
      }
      
      toast({
        title: "Response Approved",
        description: "AI response has been approved and marked for training",
      });
    },
    onError: (error) => {
      toast({
        title: "Approval Failed",
        description: "Failed to approve chat response. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handler functions for chat actions
  const handleArchiveChat = () => {
    if (selectedChatId) {
      archiveChatMutation.mutate(selectedChatId);
    }
  };

  const handleApproveChat = () => {
    if (selectedChatId) {
      approveChatMutation.mutate(selectedChatId);
    }
  };

  const handleDeleteChat = () => {
    if (selectedChatId && confirm('Are you sure you want to permanently delete this chat? This action cannot be undone.')) {
      deleteChatMutation.mutate(selectedChatId);
    }
  };

  // Helper functions for FAQ management
  const toggleKnowledgeCategory = (category: string) => {
    setOpenKnowledgeCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleEditFAQ = (faq: FAQ) => {
    setEditingFAQ(faq);
    setNewQuestion(faq.question);
    setNewAnswer(faq.answer);
    setNewCategory(faq.category);
    setNewPriority(faq.priority);
    setShowEditFAQ(true);
  };

  // Handler functions for glassomorphic settings dialogs
  const handleCreateFolder = () => {
    // Implementation for creating folder
    console.log("Creating folder:", newFolderName);
    setShowCreateFolder(false);
    setNewFolderName("");
  };

  const handleUpdateFAQ = () => {
    // Implementation for updating FAQ
    console.log("Updating FAQ:", editingFAQ);
    setShowEditFAQ(false);
    setEditingFAQ(null);
  };



  const handleUpdateUrl = () => {
    // Implementation for updating URL
    console.log("Updating URL:", editingUrl);
    setShowEditUrl(false);
    setEditingUrl(null);
  };

  const handleDeleteFAQ = (faqId: number) => {
    if (confirm('Are you sure you want to delete this FAQ entry?')) {
      deleteFAQMutation.mutate(faqId);
    }
  };

  // Category management handlers
  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Category Name Required",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }
    createCategoryMutation.mutate({
      name: newCategoryName,
      description: newCategoryDescription
    });
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryDescription(category.description || '');
    setShowEditCategory(true);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;
    updateCategoryMutation.mutate({
      id: editingCategory.id,
      data: {
        name: newCategoryName,
        description: newCategoryDescription
      }
    });
  };

  const handleDeleteCategory = (id: number) => {
    if (confirm('Are you sure you want to delete this category? This will affect all FAQs in this category.')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  // URL tracking handlers
  const handleEditUrl = (urlData: any) => {
    setEditingUrl(urlData);
    setShowEditUrl(true);
  };

  const handleToggleUrlTracking = async (urlData: any) => {
    updateUrlMutation.mutate({
      id: urlData.id,
      data: { ...urlData, isActive: !urlData.isActive }
    });
  };

  const handleForceUpdate = async (urlId: string) => {
    setIsForcingUpdate(urlId);
    forceUpdateMutation.mutate(urlId);
  };

  const handleDeleteUrl = (urlId: string) => {
    if (confirm('Are you sure you want to remove this URL from tracking?')) {
      deleteUrlMutation.mutate(urlId);
    }
  };

  // Filtered data for FAQ management
  const filteredFAQs = Array.isArray(faqData) ? faqData.filter((faq: FAQ) => {
    return faq.question && faq.answer;
  }) : [];

  const computedFaqCategories = Array.isArray(faqCategories) && faqCategories.length > 0 ? 
    faqCategories.map((cat: any) => cat.name) : 
    (Array.isArray(faqData) ? Array.from(new Set(faqData.map((faq: FAQ) => faq.category))) : []);

  // URL Scraping for Knowledge Base
  const handleScrapeForKnowledge = async () => {
    if (!scrapeUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid website URL to scrape",
        variant: "destructive",
      });
      return;
    }

    let formattedUrl = scrapeUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    try {
      new URL(formattedUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setIsScrapingForKnowledge(true);
    try {
      const response = await fetch('/api/scrape-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url: formattedUrl }),
      });

      if (!response.ok) {
        throw new Error(`Scraping failed: ${response.status}`);
      }

      const result = await response.json();
      
      // If weekly updates enabled, schedule the URL
      if (enableWeeklyUpdates) {
        try {
          const scheduleResponse = await fetch('/api/admin/scheduled-urls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              url: formattedUrl,
              type: 'knowledge_base',
              frequency: 'weekly',
              enabled: true
            }),
          });
          
          if (scheduleResponse.ok) {
            console.log('URL scheduled for weekly updates');
          }
        } catch (scheduleError) {
          console.warn('Failed to schedule URL for weekly updates:', scheduleError);
        }
      }
      
      // Convert scraped content into FAQ entries
      if (result.bulletPoints && result.bulletPoints.length > 0) {
        for (const point of result.bulletPoints.slice(0, 5)) { // Limit to 5 entries
          const question = `What does ${result.title} say about: ${point.split('.')[0]}?`;
          const answer = `Based on ${result.title}: ${point}`;
          
          await createFAQMutation.mutateAsync({
            question,
            answer,
            category: 'integration',
            priority: 5,
            isActive: true
          });
        }
      } else {
        // Create a single FAQ from the summary
        const question = `What information is available about ${result.title}?`;
        const answer = result.summary || result.content.substring(0, 500) + '...';
        
        await createFAQMutation.mutateAsync({
          question,
          answer,
          category: 'general',
          priority: 5,
          isActive: true
        });
      }

      // If weekly updates are enabled, save URL for recurring scraping
      if (enableWeeklyUpdates) {
        try {
          await fetch('/api/admin/scheduled-urls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ 
              url: formattedUrl,
              type: 'knowledge_base',
              frequency: 'weekly',
              enabled: true
            }),
          });
          
          setScheduledUrls(prev => [...prev, formattedUrl]);
          toast({
            title: "URL Scheduled for Weekly Updates",
            description: `${formattedUrl} will be scraped weekly and added to knowledge base`,
          });
        } catch (scheduleError) {
          console.error('Failed to schedule URL:', scheduleError);
        }
      }

      toast({
        title: "Content Added to Knowledge Base",
        description: `Successfully created FAQ entries from ${result.title}${enableWeeklyUpdates ? ' (scheduled for weekly updates)' : ''}`,
      });
      
      setScrapeUrl('');
      setEnableWeeklyUpdates(false);
    } catch (error) {
      toast({
        title: "Scraping Failed",
        description: "Unable to scrape content from the provided URL",
        variant: "destructive",
      });
    } finally {
      setIsScrapingForKnowledge(false);
    }
  };

  // Chat Review Center Component
  function ChatReviewCenter() {
    return (
      <div className="space-y-6">
        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Chats</p>
                  <p className="text-xl font-bold">{Array.isArray(userChats) ? userChats.length : 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-xl font-bold">
                    {Array.isArray(userChats) ? userChats.filter((c: any) => c.reviewStatus === 'approved').length : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-xl font-bold">
                    {Array.isArray(userChats) ? userChats.filter((c: any) => c.reviewStatus === 'pending').length : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Training Items</p>
                  <p className="text-xl font-bold">
                    {Array.isArray(userChats) ? userChats.filter((c: any) => c.hasCorrections).length : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Split-Screen Chat Review Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: '700px' }}>
          {/* Chat List Panel with Tabs */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat Review Center
              </CardTitle>
              <CardDescription>
                Select a chat to review user question and AI response
              </CardDescription>
            </CardHeader>
            
            {/* Chat Review Tabs */}
            <div className="px-6 pb-3">
              <Tabs value={chatReviewTab} onValueChange={setChatReviewTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="active" className="text-xs">
                    Active ({Array.isArray(userChats) ? userChats.filter((c: any) => c.reviewStatus !== 'archived').length : 0})
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs">
                    Pending ({Array.isArray(userChats) ? userChats.filter((c: any) => c.reviewStatus === 'pending').length : 0})
                  </TabsTrigger>
                  <TabsTrigger value="archived" className="text-xs">
                    Archived ({Array.isArray(userChats) ? userChats.filter((c: any) => c.reviewStatus === 'archived').length : 0})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <CardContent className="flex-1 overflow-hidden px-6 pt-0">
              {chatsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading chat reviews...</span>
                </div>
              ) : (
                <div className="h-full">
                  <ScrollArea className="h-full">
                    <div className="space-y-3 pr-4">
                      {Array.isArray(userChats) && userChats.length > 0 ? (
                        userChats
                          .filter((chat: any) => {
                            if (chatReviewTab === 'active') return chat.reviewStatus !== 'archived';
                            if (chatReviewTab === 'pending') return chat.reviewStatus === 'pending';
                            if (chatReviewTab === 'archived') return chat.reviewStatus === 'archived';
                            return true;
                          })
                          .slice(0, chatDisplayLimit)
                          .map((chat: any) => (
                            <div 
                              key={chat.chatId}
                              onClick={() => setSelectedChatId(chat.chatId)}
                              className={`
                                p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md
                                ${selectedChatId === chat.chatId 
                                  ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                  : 'border-gray-200 hover:border-gray-300'
                                }
                              `}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium truncate text-sm">{chat.chatTitle || chat.title || 'Untitled Chat'}</h4>
                                <Badge variant={chat.reviewStatus === 'approved' ? 'default' : 'secondary'} className="text-xs">
                                  {chat.reviewStatus === 'approved' ? (
                                    <ThumbsUp className="h-3 w-3 mr-1" />
                                  ) : chat.reviewStatus === 'archived' ? (
                                    <Archive className="h-3 w-3 mr-1" />
                                  ) : (
                                    <Clock className="h-3 w-3 mr-1" />
                                  )}
                                  {chat.reviewStatus || 'pending'}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                                <div>
                                  <p><span className="font-medium">{chat.messageCount || 0}</span> messages</p>
                                  <p>{chat.userName || 'Unknown User'}</p>
                                </div>
                                <div className="text-right">
                                  <p>{new Date(chat.createdAt).toLocaleDateString()}</p>
                                  <p className="text-xs">{new Date(chat.createdAt).toLocaleTimeString()}</p>
                                </div>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="text-center py-12">
                          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No Chat Reviews</h3>
                          <p className="text-gray-500">User conversations will appear here for review and training</p>
                        </div>
                      )}

                      {/* Load More Button */}
                      {Array.isArray(userChats) && userChats.length > 0 && (() => {
                        const filteredChats = userChats.filter((chat: any) => {
                          if (chatReviewTab === 'active') return chat.reviewStatus !== 'archived';
                          if (chatReviewTab === 'pending') return chat.reviewStatus === 'pending';
                          if (chatReviewTab === 'archived') return chat.reviewStatus === 'archived';
                          return true;
                        });
                        return filteredChats.length > chatDisplayLimit && (
                          <div className="text-center pt-4 border-t">
                            <Button
                              onClick={() => setChatDisplayLimit(prev => prev + 5)}
                              variant="outline"
                              className="w-full"
                            >
                              Load More ({filteredChats.length - chatDisplayLimit} remaining)
                            </Button>
                          </div>
                        );
                      })()}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Review & Training Panel */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                {selectedChatId ? 'Review & Train AI' : 'Select Chat to Review'}
              </CardTitle>
              <CardDescription>
                {selectedChatId 
                  ? 'Review the user question and AI response. Approve if correct or provide training corrections.'
                  : 'Select a chat from the left panel to view the conversation and provide AI training feedback.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              {selectedChatId ? (
                <div className="space-y-4 h-full">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading conversation...</span>
                    </div>
                  ) : selectedChatDetails ? (
                    <div className="space-y-4 h-full flex flex-col">
                      {/* User Question */}
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-800">User Question</span>
                        </div>
                        <div className="text-sm text-blue-900">
                          {selectedChatDetails.userMessage || 'No user message found'}
                        </div>
                      </div>

                      {/* AI Response */}
                      <div className="bg-gray-50 border-l-4 border-gray-500 p-4 rounded-r-lg flex-1 overflow-hidden">
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="h-4 w-4 text-gray-600" />
                          <span className="font-medium text-gray-800">AI Response</span>
                        </div>
                        <ScrollArea className="h-40">
                          <div className="text-sm text-gray-900">
                            <div dangerouslySetInnerHTML={{ 
                              __html: selectedChatDetails.aiResponse || 'No AI response found'
                            }} />
                          </div>
                        </ScrollArea>
                      </div>

                      {/* Status Display */}
                      {selectedChatDetails?.reviewStatus && (
                        <div className={`p-3 rounded-lg border-l-4 ${
                          selectedChatDetails.reviewStatus === 'approved' 
                            ? 'bg-green-50 border-green-500' 
                            : selectedChatDetails.reviewStatus === 'archived'
                            ? 'bg-gray-50 border-gray-500'
                            : 'bg-orange-50 border-orange-500'
                        }`}>
                          <div className="flex items-center gap-2">
                            {selectedChatDetails.reviewStatus === 'approved' && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            {selectedChatDetails.reviewStatus === 'archived' && (
                              <Archive className="h-4 w-4 text-gray-600" />
                            )}
                            {selectedChatDetails.reviewStatus === 'pending' && (
                              <Clock className="h-4 w-4 text-orange-600" />
                            )}
                            <span className="font-medium text-sm">
                              Status: {selectedChatDetails.reviewStatus === 'approved' ? 'Approved for Training' : 
                                     selectedChatDetails.reviewStatus === 'archived' ? 'Archived' : 'Pending Review'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-3 border-t">
                        <Button 
                          onClick={handleApproveChat}
                          className={`flex items-center gap-2 ${
                            selectedChatDetails?.reviewStatus === 'approved' 
                              ? 'bg-green-500 hover:bg-green-600 cursor-not-allowed' 
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                          disabled={approveChatMutation.isPending || selectedChatDetails?.reviewStatus === 'approved'}
                        >
                          {selectedChatDetails?.reviewStatus === 'approved' ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Already Approved
                            </>
                          ) : (
                            <>
                              <ThumbsUp className="h-4 w-4" />
                              {approveChatMutation.isPending ? 'Approving...' : 'Approve Response'}
                            </>
                          )}
                        </Button>
                        <Button 
                          onClick={handleArchiveChat}
                          variant="outline"
                          className="flex items-center gap-2"
                          disabled={archiveChatMutation.isPending}
                        >
                          <Archive className="h-4 w-4" />
                          {archiveChatMutation.isPending ? 'Archiving...' : 'Archive Chat'}
                        </Button>
                        <Button 
                          onClick={handleDeleteChat}
                          variant="destructive"
                          className="flex items-center gap-2"
                          disabled={deleteChatMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                          {deleteChatMutation.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>

                      {/* Training Correction */}
                      <div className="space-y-3">
                        <Label>Provide Training Correction (Optional)</Label>
                        <Textarea
                          value={correctionText}
                          onChange={(e) => setCorrectionText(e.target.value)}
                          placeholder="Provide the corrected AI response that should have been given to this user question..."
                          className="w-full p-3 border rounded-lg resize-none"
                          rows={4}
                        />
                        <Button 
                          onClick={handleSubmitCorrection}
                          disabled={isSubmittingCorrection || !correctionText.trim()}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          {isSubmittingCorrection ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Correction
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No conversation data</h3>
                      <p className="text-gray-500">Unable to load messages for this chat</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">Select a Chat to Review</h3>
                    <p className="text-gray-500 max-w-xs">
                      Choose a conversation from the left panel to view the user question and AI response for review and training
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Control Center</h1>
        <p className="text-gray-600 mt-2">Manage AI training, document processing, and system oversight</p>
      </div>
      
      <Tabs defaultValue="knowledge" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="knowledge">Q&A Knowledge</TabsTrigger>
          <TabsTrigger value="documents">Document Center</TabsTrigger>
          <TabsTrigger value="chat-training">Chat & AI Training</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Q&A Knowledge Base Management</h2>
            <Badge variant="secondary">
              {Array.isArray(faqData) ? faqData.length : 0} entries
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-2 border-blue-500">
              <CardHeader>
                <CardTitle className="text-blue-600">📝 Add New FAQ Entry</CardTitle>
                <CardDescription>Create comprehensive Q&A entries for the knowledge base</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Question</Label>
                  <Input 
                    placeholder="What is the processing fee for restaurants?"
                    className="mt-1"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Answer</Label>
                  <Textarea 
                    placeholder="Processing fees for restaurants typically range from 2.3% to 3.5% depending on the card type..."
                    className="mt-1 min-h-[100px]"
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="pricing">Pricing</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="integration">Integration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Priority</Label>
                    <Select value={newPriority.toString()} onValueChange={(value) => setNewPriority(parseInt(value))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">High Priority</SelectItem>
                        <SelectItem value="2">Medium Priority</SelectItem>
                        <SelectItem value="3">Low Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={() => createFAQMutation.mutate({
                    question: newQuestion,
                    answer: newAnswer,
                    category: newCategory,
                    priority: newPriority,
                    isActive: true
                  })}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={!newQuestion.trim() || !newAnswer.trim() || createFAQMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {createFAQMutation.isPending ? 'Creating...' : 'Add FAQ Entry'}
                </Button>

                <Separator className="my-4" />

                {/* URL Scraping for Knowledge Base */}
                <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-green-600" />
                    Add from Website URL
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Scrape content from a website URL and convert it into Q&A entries
                  </p>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="scrape-url" className="text-sm font-medium">Website URL</Label>
                      <Input
                        id="scrape-url"
                        value={scrapeUrl}
                        onChange={(e) => setScrapeUrl(e.target.value)}
                        placeholder="https://support.example.com/article"
                        className="mt-1"
                      />
                    </div>
                    
                    {/* Weekly Updates Checkbox */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="enableWeeklyUpdates"
                        checked={enableWeeklyUpdates}
                        onCheckedChange={(checked) => setEnableWeeklyUpdates(checked as boolean)}
                      />
                      <Label htmlFor="enableWeeklyUpdates" className="text-sm text-green-700 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Schedule weekly updates for this URL
                      </Label>
                    </div>
                    
                    <Button 
                      onClick={handleScrapeForKnowledge}
                      disabled={!scrapeUrl.trim() || isScrapingForKnowledge}
                      className="w-full bg-green-600 hover:bg-green-700"
                      variant="default"
                    >
                      {isScrapingForKnowledge ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Scraping Content...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Scrape & Add to Knowledge Base
                          {enableWeeklyUpdates && ' (Weekly)'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Knowledge Base Management - Combined URL Tracking & Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Knowledge Base Management
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setShowCreateCategory(true)}>
                      <Plus className="w-4 h-4 mr-1" />
                      New Category
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Manage FAQ categories and track automated URL updates for knowledge base content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="categories" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="categories">FAQ Categories</TabsTrigger>
                    <TabsTrigger value="url-tracking">URL Tracking</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="categories" className="mt-4">
                    <ScrollArea className="h-[350px]">
                      <div className="space-y-3">
                        {faqLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin" />
                            <span className="ml-2">Loading categories...</span>
                          </div>
                        ) : computedFaqCategories.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="font-medium">No FAQ categories found</p>
                            <p className="text-sm">Add your first FAQ entry to create categories</p>
                            {faqError && (
                              <p className="text-red-500 text-sm mt-2">Error loading FAQ data</p>
                            )}
                          </div>
                        ) : (
                          computedFaqCategories.map((category) => {
                            const count = Array.isArray(faqData) ? faqData.filter((f: FAQ) => f.category === category).length : 0;
                            const categoryFAQs = Array.isArray(faqData) ? faqData.filter((f: FAQ) => f.category === category) : [];
                            const isOpen = openKnowledgeCategories.includes(category);
                            
                            return (
                              <Collapsible key={category} open={isOpen} onOpenChange={() => toggleKnowledgeCategory(category)}>
                                <CollapsibleTrigger asChild>
                                  <div className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                      {isOpen ? <ChevronDown className="w-4 h-4 text-blue-500" /> : <ChevronRight className="w-4 h-4 text-blue-500" />}
                                      <BookOpen className="w-4 h-4 text-blue-500" />
                                      <span className="font-medium capitalize">{category}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary">{count}</Badge>
                                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEditCategory({ name: category }); }}>
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2 ml-6 space-y-2">
                                  {categoryFAQs.map((faq: FAQ) => (
                                    <div key={faq.id} className="flex items-center justify-between p-2 bg-white border rounded text-sm">
                                      <div className="flex-1">
                                        <div className="font-medium truncate max-w-xs">{faq.question}</div>
                                        <div className="text-xs text-gray-500 mt-1">Priority: {faq.priority} | Active: {faq.isActive ? 'Yes' : 'No'}</div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button size="sm" variant="ghost" onClick={() => handleEditFAQ(faq)}>
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => handleDeleteFAQ(faq.id)}>
                                          <Trash className="w-3 h-3 text-red-500" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </CollapsibleContent>
                              </Collapsible>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="url-tracking" className="mt-4">
                    <ScrollArea className="h-[350px]">
                      <div className="space-y-3">
                        {Array.isArray(vendorUrls) && vendorUrls.length > 0 ? (
                          vendorUrls.map((urlData: any) => (
                            <div key={urlData.id} className="p-4 border rounded-lg bg-gray-50">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex-1">
                                  <div className="font-medium text-sm truncate max-w-sm">
                                    {urlData.urlTitle || urlData.url}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {urlData.vendorName} • Last checked: {urlData.lastScraped ? new Date(urlData.lastScraped).toLocaleDateString() : 'Never'}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch 
                                    checked={urlData.isActive} 
                                    onCheckedChange={() => handleToggleUrlTracking(urlData)}
                                    size="sm"
                                  />
                                  <Badge variant={urlData.isActive ? "default" : "secondary"}>
                                    {urlData.isActive ? "Active" : "Disabled"}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant={urlData.autoUpdate ? "default" : "secondary"} className="text-xs">
                                    {urlData.autoUpdate ? `Auto: ${urlData.updateFrequency}` : "Manual Only"}
                                  </Badge>
                                  <Badge variant={urlData.scrapingStatus === 'success' ? "default" : "destructive"} className="text-xs">
                                    {urlData.scrapingStatus || 'Pending'}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleForceUpdate(urlData.id)}
                                    disabled={isForcingUpdate === urlData.id}
                                  >
                                    {isForcingUpdate === urlData.id ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <RefreshCw className="w-3 h-3" />
                                    )}
                                    Force Update
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleEditUrl(urlData)}>
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeleteUrl(urlData.id)}>
                                    <Trash className="w-3 h-3 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Globe className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No tracked URLs yet</p>
                            <p className="text-xs">Add a URL above with weekly updates to see tracking status</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent FAQ Entries</CardTitle>
              <CardDescription>Latest additions to the knowledge base</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {filteredFAQs.map((faq: FAQ) => (
                    <Card key={faq.id} className="border">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium mb-2">{faq.question}</h4>
                            <p className="text-sm text-gray-600 mb-3">{faq.answer}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{faq.category}</Badge>
                              <Badge variant={faq.priority === 1 ? "destructive" : faq.priority === 2 ? "default" : "secondary"} className="text-xs">
                                Priority {faq.priority}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-4">
                            <Button size="sm" variant="ghost" onClick={() => handleEditFAQ(faq)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteFAQ(faq.id)}>
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredFAQs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No FAQ entries found</p>
                      <p className="text-sm">Create your first entry above</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Document Center Management</h2>
            <Badge variant="secondary">
              {Array.isArray(documentsData) ? documentsData.filter((doc: DocumentEntry) => doc.mimeType).length : 0} documents
            </Badge>
          </div>

          {/* Document Statistics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Documents</p>
                    <p className="text-xl font-bold">{documentsData.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Folders</p>
                    <p className="text-xl font-bold">{foldersData.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Storage Used</p>
                    <p className="text-xl font-bold">2.4 GB</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Upload Ready</p>
                    <p className="text-xl font-bold">✓</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Complete Document Upload System with 3-Step Process */}
          <Card className="border-2 border-green-500">
            <CardHeader>
              <CardTitle className="text-green-600">📁 Document Upload Center</CardTitle>
              <CardDescription>Complete 3-step process: Select Files → Choose Folder → Set Permissions → Upload</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Pre-Upload Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div>
                  <Label className="text-sm font-medium text-blue-700">Step 1: Select Destination Folder</Label>
                  <Select value={uploadSelectedFolder} onValueChange={(value) => {
                    if (value === "new-folder") {
                      setIsCreateFolderDialogOpen(true);
                    } else {
                      setUploadSelectedFolder(value);
                    }
                  }}>
                    <SelectTrigger className="mt-1 border-blue-300">
                      <SelectValue placeholder="Choose destination folder" />
                    </SelectTrigger>
                    <SelectContent>
                      {foldersData?.map((folder: any) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="new-folder">+ Create New Folder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-blue-700">Step 2: Set Access Permissions</Label>
                  <Select value={selectedPermissions} onValueChange={setSelectedPermissions}>
                    <SelectTrigger className="mt-1 border-blue-300">
                      <SelectValue placeholder="Choose access level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin Only</SelectItem>
                      <SelectItem value="all-users">All Users</SelectItem>
                      <SelectItem value="managers">Managers & Admins</SelectItem>
                      <SelectItem value="agents">Agents & Above</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Configuration Summary */}
              {(uploadSelectedFolder || selectedPermissions) && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-700">Upload Configuration:</p>
                  <div className="text-xs text-green-600 mt-1 space-y-1">
                    <p>📁 Folder: {uploadSelectedFolder ? foldersData?.find(f => f.id === uploadSelectedFolder)?.name || 'Selected' : 'Not selected'}</p>
                    <p>🔒 Access: {selectedPermissions || 'Not selected'}</p>
                  </div>
                </div>
              )}

              {/* Step 3: Document Upload Area */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium text-green-700 mb-2 block">Step 3: Upload Documents</Label>
                <DocumentUpload 
                  preSelectedFolder={uploadSelectedFolder}
                  preSelectedPermissions={selectedPermissions}
                  onUploadComplete={() => {
                    queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
                    setUploadSelectedFolder('');
                    setSelectedPermissions('');
                    toast({
                      title: "Upload Complete",
                      description: "Documents have been uploaded successfully",
                    });
                  }} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat-training" className="space-y-6">
          <ChatReviewCenter />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Glassomorphic Settings Panel */}
          <div className="relative min-h-screen">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 rounded-lg"></div>
            
            {/* Glass panel header */}
            <div className="relative glass-panel p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="glass-card p-3 rounded-full">
                    <Settings className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold settings-label">System Settings</h2>
                    <p className="settings-description">Configure your JACC admin environment</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="glass-button px-4 py-2 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <button className="glass-button px-4 py-2 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Import
                  </button>
                </div>
              </div>
            </div>

            <div className="relative grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Categories */}
              <div className="lg:col-span-1">
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold settings-label mb-4">Settings Categories</h3>
                  <div className="space-y-2">
                    <button 
                      className={`glass-button w-full justify-start text-sm p-3 ${settingsTab === "ai-search" ? "bg-blue-500/20 border-blue-400/50" : ""}`}
                      onClick={() => setSettingsTab("ai-search")}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      AI & Search
                    </button>
                    <button 
                      className={`glass-button w-full justify-start text-sm p-3 ${settingsTab === "user-mgmt" ? "bg-purple-500/20 border-purple-400/50" : ""}`}
                      onClick={() => setSettingsTab("user-mgmt")}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      User Management
                    </button>
                    <button 
                      className={`glass-button w-full justify-start text-sm p-3 ${settingsTab === "content-docs" ? "bg-green-500/20 border-green-400/50" : ""}`}
                      onClick={() => setSettingsTab("content-docs")}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Content & Documents
                    </button>
                    <button 
                      className={`glass-button w-full justify-start text-sm p-3 ${settingsTab === "system-perf" ? "bg-orange-500/20 border-orange-400/50" : ""}`}
                      onClick={() => setSettingsTab("system-perf")}
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      System Performance
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="lg:col-span-3">
                <div className="glass-card p-6">
                  {settingsTab === "ai-search" && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <Brain className="w-6 h-6 text-blue-400" />
                        <div>
                          <h3 className="text-xl font-semibold settings-label">AI & Search Configuration</h3>
                          <p className="settings-description">Manage AI models and search parameters</p>
                        </div>
                      </div>
                      
                      <div className="glass-divider mb-6"></div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-card p-4">
                          <h4 className="font-semibold settings-label mb-3">AI Model Configuration</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="settings-text text-sm">Primary Model</label>
                              <select className="glass-input w-full mt-1 p-2">
                                <option value="claude-sonnet">Claude Sonnet</option>
                                <option value="gpt-4">GPT-4</option>
                                <option value="gpt-3.5">GPT-3.5 Turbo</option>
                              </select>
                            </div>
                            <div>
                              <label className="settings-text text-sm">Response Temperature</label>
                              <input type="range" min="0" max="1" step="0.1" defaultValue="0.7" className="w-full mt-1" />
                              <div className="flex justify-between text-xs settings-description">
                                <span>Conservative</span>
                                <span>Creative</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="glass-card p-4">
                          <h4 className="font-semibold settings-label mb-3">Search Parameters</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="settings-text text-sm">Search Sensitivity</label>
                              <input type="range" min="0.1" max="1" step="0.1" defaultValue="0.8" className="w-full mt-1" />
                              <div className="flex justify-between text-xs settings-description">
                                <span>Strict</span>
                                <span>Fuzzy</span>
                              </div>
                            </div>
                            <div>
                              <label className="settings-text text-sm">Max Results</label>
                              <input type="number" min="1" max="50" defaultValue="10" className="glass-input w-full mt-1 p-2" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {settingsTab === "user-mgmt" && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <Users className="w-6 h-6 text-purple-400" />
                        <div>
                          <h3 className="text-xl font-semibold glass-text">User Management</h3>
                          <p className="glass-text-muted">Configure user access and permissions</p>
                        </div>
                      </div>
                      
                      <div className="glass-divider mb-6"></div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-card p-4">
                          <h4 className="font-semibold glass-text mb-3">Access Control</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="glass-text-muted text-sm">Default Role</label>
                              <select className="glass-input w-full mt-1 p-2">
                                <option value="sales-agent">Sales Agent</option>
                                <option value="client-admin">Client Admin</option>
                                <option value="dev-admin">Dev Admin</option>
                              </select>
                            </div>
                            <div>
                              <label className="glass-text-muted text-sm">Session Timeout</label>
                              <select className="glass-input w-full mt-1 p-2">
                                <option value="15min">15 minutes</option>
                                <option value="1hour">1 hour</option>
                                <option value="2hours">2 hours</option>
                                <option value="8hours">8 hours</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        
                        <div className="glass-card p-4">
                          <h4 className="font-semibold glass-text mb-3">Security Settings</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="glass-text text-sm">Require MFA</span>
                              <input type="checkbox" className="glass-input" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="glass-text text-sm">Allow Guest Access</span>
                              <input type="checkbox" className="glass-input" />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="glass-text text-sm">Auto-logout</span>
                              <input type="checkbox" className="glass-input" defaultChecked />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {settingsTab === "content-docs" && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <FileText className="w-6 h-6 text-green-400" />
                        <div>
                          <h3 className="text-xl font-semibold glass-text">Content & Documents</h3>
                          <p className="glass-text-muted">Configure document processing and content management</p>
                        </div>
                      </div>
                      
                      <div className="glass-divider mb-6"></div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-card p-4">
                          <h4 className="font-semibold glass-text mb-3">Document Processing</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="glass-text-muted text-sm">OCR Quality</label>
                              <select className="glass-input w-full mt-1 p-2">
                                <option value="high">High Quality</option>
                                <option value="medium">Medium Quality</option>
                                <option value="fast">Fast Processing</option>
                              </select>
                            </div>
                            <div>
                              <label className="glass-text-muted text-sm">Max File Size (MB)</label>
                              <input type="number" min="1" max="100" defaultValue="25" className="glass-input w-full mt-1 p-2" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="glass-card p-4">
                          <h4 className="font-semibold glass-text mb-3">Content Management</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="glass-text text-sm">Auto-categorize</span>
                              <input type="checkbox" className="glass-input" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="glass-text text-sm">Version Control</span>
                              <input type="checkbox" className="glass-input" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="glass-text text-sm">Backup Daily</span>
                              <input type="checkbox" className="glass-input" defaultChecked />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {settingsTab === "system-perf" && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <Activity className="w-6 h-6 text-orange-400" />
                        <div>
                          <h3 className="text-xl font-semibold glass-text">System Performance</h3>
                          <p className="glass-text-muted">Monitor and optimize system performance</p>
                        </div>
                      </div>
                      
                      <div className="glass-divider mb-6"></div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass-card p-4">
                          <h4 className="font-semibold glass-text mb-3">Memory Usage</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between glass-text-muted text-sm">
                              <span>Used</span>
                              <span>72%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full" style={{width: '72%'}}></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="glass-card p-4">
                          <h4 className="font-semibold glass-text mb-3">Response Time</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between glass-text-muted text-sm">
                              <span>Average</span>
                              <span>1.2s</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full" style={{width: '40%'}}></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="glass-card p-4">
                          <h4 className="font-semibold glass-text mb-3">Database Load</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between glass-text-muted text-sm">
                              <span>Load</span>
                              <span>45%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full" style={{width: '45%'}}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                Create Folder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit FAQ Dialog */}
      <Dialog open={showEditFAQ} onOpenChange={setShowEditFAQ}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit FAQ</DialogTitle>
            <DialogDescription>
              Update the FAQ question and answer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editQuestion">Question</Label>
              <Input
                id="editQuestion"
                value={editingFAQ?.question || ''}
                onChange={(e) => setEditingFAQ(prev => prev ? {...prev, question: e.target.value} : null)}
                placeholder="Enter question"
              />
            </div>
            <div>
              <Label htmlFor="editAnswer">Answer</Label>
              <Textarea
                id="editAnswer"
                value={editingFAQ?.answer || ''}
                onChange={(e) => setEditingFAQ(prev => prev ? {...prev, answer: e.target.value} : null)}
                placeholder="Enter answer"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="editCategory">Category</Label>
              <Select value={editingFAQ?.category || ''} onValueChange={(value) => setEditingFAQ(prev => prev ? {...prev, category: value} : null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {faqCategories.map(category => (
                    <SelectItem key={category.name || category} value={category.name || category}>{category.name || category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditFAQ(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateFAQ}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={showEditCategory} onOpenChange={setShowEditCategory}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category name
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editCategoryName">Category Name</Label>
              <Input
                id="editCategoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditCategory(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateCategory}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit URL Dialog */}
      <Dialog open={showEditUrl} onOpenChange={setShowEditUrl}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Vendor URL</DialogTitle>
            <DialogDescription>
              Update the vendor URL settings
            </DialogDescription>
          </DialogHeader>
          {editingUrl && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editUrlAddress">URL</Label>
                <Input
                  id="editUrlAddress"
                  value={editingUrl.url}
                  onChange={(e) => setEditingUrl(prev => prev ? {...prev, url: e.target.value} : null)}
                  placeholder="Enter URL"
                />
              </div>
              <div>
                <Label htmlFor="editUrlDescription">Description</Label>
                <Input
                  id="editUrlDescription"
                  value={editingUrl.description}
                  onChange={(e) => setEditingUrl(prev => prev ? {...prev, description: e.target.value} : null)}
                  placeholder="Enter description"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editUrlWeekly"
                  checked={editingUrl.weekly_updates}
                  onChange={(e) => setEditingUrl(prev => prev ? {...prev, weekly_updates: e.target.checked} : null)}
                />
                <Label htmlFor="editUrlWeekly">Weekly Updates</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditUrl(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateUrl}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
