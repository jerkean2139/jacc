import React, { useState } from 'react';
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
  ThumbsDown, Star, Copy, AlertCircle, ArrowRight, User, Bot, RefreshCw, Calendar
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
  
  // Document management states
  const [documentSearchTerm, setDocumentSearchTerm] = useState('');
  const [documentFilter, setDocumentFilter] = useState('all');
  
  // Chat Review Center States
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedChatDetails, setSelectedChatDetails] = useState<any>(null);
  
  // URL Scraping for Knowledge Base
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScrapingForKnowledge, setIsScrapingForKnowledge] = useState(false);
  const [enableWeeklyUpdates, setEnableWeeklyUpdates] = useState(false);
  const [scheduledUrls, setScheduledUrls] = useState<string[]>([]);
  const [correctionText, setCorrectionText] = useState("");
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  // Data queries
  const { data: faqData = [] } = useQuery({
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
    queryKey: ['/api/chats', selectedChatId, 'messages'],
    enabled: !!selectedChatId,
    onSuccess: (data) => {
      if (data && data.length > 0) {
        setSelectedChatDetails({
          userMessage: data.find((m: any) => m.role === 'user')?.content || '',
          aiResponse: data.find((m: any) => m.role === 'assistant')?.content || '',
          messages: data
        });
      }
    }
  });

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: '600px' }}>
          {/* Chat List Panel */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat Review Center
              </CardTitle>
              <CardDescription>
                Select a chat to review user question and AI response
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              {chatsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading chat reviews...</span>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {Array.isArray(userChats) && userChats.length > 0 ? (
                      userChats.map((chat: any) => (
                        <div 
                          key={chat.chatId}
                          onClick={() => setSelectedChatId(chat.chatId)}
                          className={`
                            p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md
                            ${selectedChatId === chat.chatId 
                              ? 'border-blue-500 bg-blue-50 shadow-sm' 
                              : 'border-gray-200 hover:border-gray-300'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium truncate">{chat.chatTitle || 'Untitled Chat'}</h4>
                            <Badge variant={chat.reviewStatus === 'approved' ? 'default' : 'secondary'}>
                              {chat.reviewStatus === 'approved' ? (
                                <ThumbsUp className="h-3 w-3 mr-1" />
                              ) : (
                                <Clock className="h-3 w-3 mr-1" />
                              )}
                              {chat.reviewStatus || 'pending'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p><span className="font-medium">{chat.messageCount || 0}</span> messages</p>
                              <p>{chat.username || 'Unknown User'}</p>
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
                    {faqCategories.map((category) => {
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
                    })}
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
          <Card>
            <CardHeader>
              <CardTitle>Document Management</CardTitle>
              <CardDescription>Upload and manage documents for AI training</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          <p className="text-sm text-gray-600">Upload Ready</p>
                          <p className="text-xl font-bold">✓</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <DocumentUpload onUploadComplete={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
                  toast({
                    title: "Upload Complete",
                    description: "Documents have been uploaded successfully",
                  });
                }} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat-training" className="space-y-6">
          <ChatReviewCenter />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure AI behavior and system parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">AI Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">Response Quality</span>
                        </div>
                        <p className="text-sm text-gray-600">Current: High Precision</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Settings className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Model Configuration</span>
                        </div>
                        <p className="text-sm text-gray-600">Claude 4.0 Sonnet Active</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">System Performance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="h-4 w-4 text-green-500" />
                          <span className="font-medium">System Status</span>
                        </div>
                        <p className="text-sm text-green-600">All Systems Operational</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">Database</span>
                        </div>
                        <p className="text-sm text-blue-600">Connected & Optimized</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">Performance</span>
                        </div>
                        <p className="text-sm text-yellow-600">Excellent</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}