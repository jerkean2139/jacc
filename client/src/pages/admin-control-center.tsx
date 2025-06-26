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
import { 
  Settings, Database, MessageSquare, Brain, PlayCircle, CheckCircle, XCircle, 
  AlertTriangle, Clock, TrendingUp, Zap, Globe, Search, FileText, Eye, Download,
  Edit, Trash2, Save, Plus, Folder, FolderOpen, Upload, Users, Activity,
  BarChart3, Timer, ChevronDown, ChevronRight, Target, BookOpen, ThumbsUp,
  ThumbsDown, Star, Copy, AlertCircle, ArrowRight, User, Bot, RefreshCw, Calendar,
  Archive,
  Scan
} from 'lucide-react';
import DocumentDragDrop from '@/components/ui/document-drag-drop';
import DocumentPreviewModal from '@/components/ui/document-preview-modal';
import DocumentUpload from '@/components/document-upload';
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
  
  // URL Scraping for Knowledge Base
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScrapingForKnowledge, setIsScrapingForKnowledge] = useState(false);
  const [enableWeeklyUpdates, setEnableWeeklyUpdates] = useState(false);
  const [settingsTab, setSettingsTab] = useState("ai-search");
  const [scheduledUrls, setScheduledUrls] = useState<string[]>([]);
  const [correctionText, setCorrectionText] = useState("");
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  // Data queries
  const { data: faqData = [], isLoading: faqLoading, error: faqError } = useQuery({
    queryKey: ['/api/admin/faq'],
    retry: false,
    onSuccess: (data) => {
      console.log('FAQ Data loaded:', data?.length || 0, 'entries');
      console.log('FAQ Categories found:', Array.from(new Set(data?.map((f: FAQ) => f.category) || [])));
    },
    onError: (error) => {
      console.error('FAQ loading error:', error);
    }
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

  // Mutations
  const createFAQMutation = useMutation({
    mutationFn: async (newFAQ: Omit<FAQ, 'id'>) => {
      return await apiRequest('/api/admin/faq', {
        method: 'POST',
        body: JSON.stringify(newFAQ),
      });
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
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (folderData: { name: string; color: string }) => {
      return apiRequest('/api/folders', {
        method: 'POST',
        body: JSON.stringify({
          name: folderData.name,
          color: folderData.color,
          folderType: 'custom',
          vectorNamespace: `folder_${folderData.name.toLowerCase().replace(/\s+/g, '_')}`
        })
      });
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
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat-reviews'] });
      toast({
        title: "Chat Approved",
        description: "AI response approved and added to training data",
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

  const deleteFAQMutation = useMutation({
    mutationFn: (faqId: number) => apiRequest(`/api/admin/faq/${faqId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faq'] });
      toast({ title: 'FAQ deleted successfully' });
    },
  });

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
  };

  const handleDeleteFAQ = (faqId: number) => {
    if (confirm('Are you sure you want to delete this FAQ entry?')) {
      deleteFAQMutation.mutate(faqId);
    }
  };

  // Filtered data for FAQ management
  const filteredFAQs = Array.isArray(faqData) ? faqData.filter((faq: FAQ) => {
    return faq.question && faq.answer;
  }) : [];

  const faqCategories = Array.isArray(faqData) ? 
    Array.from(new Set(faqData.map((faq: FAQ) => faq.category))) : [];

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

  const handleApproveChat = () => {
    if (!selectedChatId) return;
    approveChatMutation.mutate(selectedChatId);
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
                                <h4 className="font-medium truncate text-sm">{chat.title || 'Untitled Chat'}</h4>
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

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-3 border-t">
                        <Button 
                          onClick={handleApproveChat}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                          disabled={approveChatMutation.isPending}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          {approveChatMutation.isPending ? 'Approving...' : 'Approve Response'}
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

            <Card>
              <CardHeader>
                <CardTitle>📚 Knowledge Base Categories</CardTitle>
                <CardDescription>Browse and manage FAQ categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {faqLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                        <span className="ml-2">Loading categories...</span>
                      </div>
                    ) : faqCategories.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">No FAQ categories found</p>
                        <p className="text-sm">Add your first FAQ entry to create categories</p>
                        {faqError && (
                          <p className="text-red-500 text-sm mt-2">Error loading FAQ data</p>
                        )}
                      </div>
                    ) : (
                      faqCategories.map((category) => {
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
                                <Badge variant="secondary">{count}</Badge>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 ml-6 space-y-2">
                              {categoryFAQs.map((faq: FAQ) => (
                                <div key={faq.id} className="p-2 bg-gray-50 rounded text-sm">
                                  <div className="font-medium text-gray-800">{faq.question}</div>
                                  <div className="text-gray-600 mt-1">{faq.answer.length > 100 ? faq.answer.substring(0, 100) + '...' : faq.answer}</div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Button size="sm" variant="ghost" onClick={() => handleEditFAQ(faq)}>
                                      <Edit className="w-3 h-3 mr-1" />
                                      Edit
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleDeleteFAQ(faq.id)}>
                                      <Trash2 className="w-3 h-3 mr-1 text-red-500" />
                                      Delete
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
              </CardContent>
            </Card>
          </div>

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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Categories */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Settings Categories</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="space-y-1">
                    <Button 
                      variant={settingsTab === "ai-search" ? "default" : "ghost"} 
                      className="w-full justify-start text-sm"
                      onClick={() => setSettingsTab("ai-search")}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      AI & Search
                    </Button>
                    <Button 
                      variant={settingsTab === "user-mgmt" ? "default" : "ghost"} 
                      className="w-full justify-start text-sm"
                      onClick={() => setSettingsTab("user-mgmt")}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      User Management
                    </Button>
                    <Button 
                      variant={settingsTab === "content-docs" ? "default" : "ghost"} 
                      className="w-full justify-start text-sm"
                      onClick={() => setSettingsTab("content-docs")}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Content & Documents
                    </Button>
                    <Button 
                      variant={settingsTab === "system-perf" ? "default" : "ghost"} 
                      className="w-full justify-start text-sm"
                      onClick={() => setSettingsTab("system-perf")}
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      System Performance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-3">
              {settingsTab === "ai-search" && (
                <div className="space-y-6">
                  {/* AI Prompts Management */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-500" />
                        AI Prompts Management
                      </CardTitle>
                      <CardDescription>Configure AI behavior and prompt templates</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* System Prompts */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          System Prompts
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card className="border-blue-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">Document Search</span>
                                <Button size="sm" variant="outline">
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </div>
                              <p className="text-xs text-gray-600">Controls how AI searches documents</p>
                            </CardContent>
                          </Card>
                          <Card className="border-green-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">Response Formatting</span>
                                <Button size="sm" variant="outline">
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </div>
                              <p className="text-xs text-gray-600">Manages response structure and style</p>
                            </CardContent>
                          </Card>
                          <Card className="border-red-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">Error Handling</span>
                                <Button size="sm" variant="outline">
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </div>
                              <p className="text-xs text-gray-600">Defines error response behavior</p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      <Separator />

                      {/* Personality & Behavior */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Personality & Behavior
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium">AI Response Style</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Professional & Helpful" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="professional">Professional & Helpful</SelectItem>
                                  <SelectItem value="technical">Technical & Detailed</SelectItem>
                                  <SelectItem value="conversational">Conversational & Friendly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Response Tone</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Balanced" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="formal">Formal</SelectItem>
                                  <SelectItem value="balanced">Balanced</SelectItem>
                                  <SelectItem value="casual">Casual</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Expertise Level</Label>
                              <div className="px-3 py-2 border rounded">Advanced</div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Behavioral Options</Label>
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <input type="checkbox" id="proactive" defaultChecked />
                                  <Label htmlFor="proactive" className="text-sm">Proactive suggestions</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input type="checkbox" id="detailed" defaultChecked />
                                  <Label htmlFor="detailed" className="text-sm">Detailed explanations</Label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Custom Prompt Templates */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Custom Prompt Templates
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card className="border-purple-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">Pricing Analysis</span>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline">
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Download className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 mb-2">Merchant rate comparison template</p>
                              <Badge variant="outline" className="text-xs">Active</Badge>
                            </CardContent>
                          </Card>
                          <Card className="border-orange-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">Objection Handling</span>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline">
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Download className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 mb-2">Sales objection responses</p>
                              <Badge variant="outline" className="text-xs">Active</Badge>
                            </CardContent>
                          </Card>
                          <Card className="border-teal-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">Compliance Guidance</span>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline">
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Download className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 mb-2">Regulatory compliance help</p>
                              <Badge variant="outline" className="text-xs">Active</Badge>
                            </CardContent>
                          </Card>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button variant="outline" size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Template
                          </Button>
                          <Button variant="outline" size="sm">
                            <Upload className="w-4 h-4 mr-2" />
                            Import Template
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      {/* User-Specific Overrides */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          User-Specific Prompt Overrides
                        </h4>
                        <div className="space-y-3">
                          <Card className="border-indigo-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium text-sm">Dev Admin Role</span>
                                  <p className="text-xs text-gray-600">Technical responses with system details</p>
                                </div>
                                <Button size="sm" variant="outline">
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="border-emerald-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium text-sm">Sales Agent Role</span>
                                  <p className="text-xs text-gray-600">Sales-focused responses with market insights</p>
                                </div>
                                <Button size="sm" variant="outline">
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Model Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Model Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Primary Model</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Claude 4.0 Sonnet" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="claude-4-sonnet">Claude 4.0 Sonnet</SelectItem>
                              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Search Sensitivity</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Balanced" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High Precision</SelectItem>
                              <SelectItem value="balanced">Balanced</SelectItem>
                              <SelectItem value="broad">Broad Search</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {settingsTab === "system-perf" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-orange-500" />
                        System Performance Monitoring
                      </CardTitle>
                      <CardDescription>Real-time system metrics and configuration</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Real-time Metrics */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          Real-time Metrics
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card className="border-green-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Activity className="h-4 w-4 text-green-500" />
                                  <span className="font-medium text-sm">System Status</span>
                                </div>
                                <Badge variant="outline" className="text-green-600">Online</Badge>
                              </div>
                              <p className="text-xs text-gray-600">All Services Operational</p>
                              <div className="mt-2">
                                <Progress value={98} className="h-2" />
                                <p className="text-xs text-gray-500 mt-1">98% Uptime</p>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="border-blue-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Database className="h-4 w-4 text-blue-500" />
                                  <span className="font-medium text-sm">Database</span>
                                </div>
                                <Badge variant="outline" className="text-blue-600">Connected</Badge>
                              </div>
                              <p className="text-xs text-gray-600">Response: 2.3s avg</p>
                              <div className="mt-2">
                                <Progress value={85} className="h-2" />
                                <p className="text-xs text-gray-500 mt-1">85% Efficiency</p>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="border-orange-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Zap className="h-4 w-4 text-orange-500" />
                                  <span className="font-medium text-sm">Memory Usage</span>
                                </div>
                                <Badge variant="outline" className="text-orange-600">97%</Badge>
                              </div>
                              <p className="text-xs text-gray-600">1.2GB / 1.25GB Used</p>
                              <div className="mt-2">
                                <Progress value={97} className="h-2" />
                                <p className="text-xs text-gray-500 mt-1">High Usage</p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      <Separator />

                      {/* Timeout & Cache Settings */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Timer className="w-4 h-4" />
                          Timeouts & Cache
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium">API Timeout</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="30 seconds" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="15s">15 seconds</SelectItem>
                                  <SelectItem value="30s">30 seconds</SelectItem>
                                  <SelectItem value="60s">60 seconds</SelectItem>
                                  <SelectItem value="120s">2 minutes</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Database Timeout</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="10 seconds" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="5s">5 seconds</SelectItem>
                                  <SelectItem value="10s">10 seconds</SelectItem>
                                  <SelectItem value="20s">20 seconds</SelectItem>
                                  <SelectItem value="30s">30 seconds</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium">Cache Duration</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="5 minutes" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1min">1 minute</SelectItem>
                                  <SelectItem value="5min">5 minutes</SelectItem>
                                  <SelectItem value="15min">15 minutes</SelectItem>
                                  <SelectItem value="1hour">1 hour</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Memory Optimization</Label>
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <input type="checkbox" id="auto-gc" defaultChecked />
                                  <Label htmlFor="auto-gc" className="text-sm">Auto garbage collection</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input type="checkbox" id="cache-compression" defaultChecked />
                                  <Label htmlFor="cache-compression" className="text-sm">Cache compression</Label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Health Monitoring */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Health Monitoring
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card className="border-purple-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">AI Services</span>
                                <Badge variant="outline" className="text-green-600">Healthy</Badge>
                              </div>
                              <div className="space-y-1 text-xs text-gray-600">
                                <div className="flex justify-between">
                                  <span>Claude API:</span>
                                  <span className="text-green-600">Active</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>OpenAI API:</span>
                                  <span className="text-green-600">Active</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Pinecone:</span>
                                  <span className="text-green-600">Connected</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="border-teal-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">Search Accuracy</span>
                                <Badge variant="outline" className="text-teal-600">96%</Badge>
                              </div>
                              <div className="space-y-1 text-xs text-gray-600">
                                <div className="flex justify-between">
                                  <span>Document Retrieval:</span>
                                  <span className="text-green-600">Excellent</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>FAQ Matching:</span>
                                  <span className="text-green-600">High</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Vector Search:</span>
                                  <span className="text-green-600">Optimal</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {settingsTab === "user-mgmt" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        User Management
                      </CardTitle>
                      <CardDescription>Configure user access and session settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Sessions & Notifications */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Sessions & Notifications
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium">Default User Role</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sales Agent" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sales-agent">Sales Agent</SelectItem>
                                  <SelectItem value="client-admin">Client Admin</SelectItem>
                                  <SelectItem value="dev-admin">Dev Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Session Timeout</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="2 hours" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="15min">15 minutes</SelectItem>
                                  <SelectItem value="1hour">1 hour</SelectItem>
                                  <SelectItem value="2hours">2 hours</SelectItem>
                                  <SelectItem value="8hours">8 hours</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">MFA Settings</Label>
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <input type="checkbox" id="mfa-required" defaultChecked />
                                  <Label htmlFor="mfa-required" className="text-sm">Require MFA for admin roles</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input type="checkbox" id="guest-access" />
                                  <Label htmlFor="guest-access" className="text-sm">Allow guest access</Label>
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Notification Preferences</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Daily digest" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="immediate">Immediate</SelectItem>
                                  <SelectItem value="daily">Daily digest</SelectItem>
                                  <SelectItem value="weekly">Weekly summary</SelectItem>
                                  <SelectItem value="disabled">Disabled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {settingsTab === "content-docs" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-500" />
                        Content & Document Processing
                      </CardTitle>
                      <CardDescription>Configure OCR, categorization, and retention policies</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* OCR & Categorization */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Scan className="w-4 h-4" />
                          OCR & Categorization
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium">OCR Quality Level</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="High Quality" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="basic">Basic (Fast)</SelectItem>
                                  <SelectItem value="standard">Standard</SelectItem>
                                  <SelectItem value="high">High Quality</SelectItem>
                                  <SelectItem value="premium">Premium (Slow)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Auto-Categorization</Label>
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <input type="checkbox" id="auto-categorize" defaultChecked />
                                  <Label htmlFor="auto-categorize" className="text-sm">Enable auto-categorization</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input type="checkbox" id="auto-tagging" defaultChecked />
                                  <Label htmlFor="auto-tagging" className="text-sm">Automatic tagging</Label>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium">Text Chunking Size</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="800 characters" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="500">500 characters</SelectItem>
                                  <SelectItem value="800">800 characters</SelectItem>
                                  <SelectItem value="1000">1000 characters</SelectItem>
                                  <SelectItem value="1500">1500 characters</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Document Retention</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="2 years" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1year">1 year</SelectItem>
                                  <SelectItem value="2years">2 years</SelectItem>
                                  <SelectItem value="5years">5 years</SelectItem>
                                  <SelectItem value="permanent">Permanent</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Folder Dialog */}
      <Dialog open={isCreateFolderDialogOpen} onOpenChange={setIsCreateFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your documents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="folder-color">Folder Color</Label>
              <Select value={newFolderColor} onValueChange={setNewFolderColor}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose folder color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">🔵 Blue</SelectItem>
                  <SelectItem value="green">🟢 Green</SelectItem>
                  <SelectItem value="yellow">🟡 Yellow</SelectItem>
                  <SelectItem value="red">🔴 Red</SelectItem>
                  <SelectItem value="purple">🟣 Purple</SelectItem>
                  <SelectItem value="orange">🟠 Orange</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateFolderDialogOpen(false);
                setNewFolderName('');
                setNewFolderColor('blue');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (newFolderName.trim()) {
                  createFolderMutation.mutate({
                    name: newFolderName.trim(),
                    color: newFolderColor
                  });
                }
              }}
              disabled={!newFolderName.trim() || createFolderMutation.isPending}
            >
              {createFolderMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Folder
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}