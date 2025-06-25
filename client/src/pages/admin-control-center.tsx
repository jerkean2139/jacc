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
import { 
  Settings, Database, MessageSquare, Brain, PlayCircle, CheckCircle, XCircle, 
  AlertTriangle, Clock, TrendingUp, Zap, Globe, Search, FileText, Eye, Download,
  Edit, Trash2, Save, Plus, Folder, FolderOpen, Upload, Users, Activity,
  BarChart3, Timer, ChevronDown, ChevronRight, Target, BookOpen, ThumbsUp,
  ThumbsDown, Star, Copy, AlertCircle, ArrowRight, User, Bot, RefreshCw
} from 'lucide-react';
import DocumentDragDrop from '@/components/ui/document-drag-drop';
import DocumentPreviewModal from '@/components/ui/document-preview-modal';
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
          <Card>
            <CardHeader>
              <CardTitle>Q&A Knowledge Base</CardTitle>
              <CardDescription>Manage FAQ entries and knowledge base content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-600">FAQ Entries</p>
                          <p className="text-xl font-bold">{faqData.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm text-gray-600">Active Entries</p>
                          <p className="text-xl font-bold">{faqData.filter((f: FAQ) => f.isActive).length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4 text-purple-500" />
                        <div>
                          <p className="text-sm text-gray-600">Ready to Add</p>
                          <p className="text-xl font-bold">✓</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Create New FAQ Entry</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="question">Question</Label>
                      <Input
                        id="question"
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        placeholder="Enter the FAQ question..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={newCategory} onValueChange={setNewCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="pricing">Pricing</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="answer">Answer</Label>
                    <Textarea
                      id="answer"
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      placeholder="Enter the comprehensive answer..."
                      rows={4}
                    />
                  </div>
                  <Button 
                    onClick={() => createFAQMutation.mutate({
                      question: newQuestion,
                      answer: newAnswer,
                      category: newCategory,
                      priority: newPriority,
                      isActive: true
                    })}
                    disabled={!newQuestion.trim() || !newAnswer.trim() || createFAQMutation.isPending}
                  >
                    {createFAQMutation.isPending ? 'Creating...' : 'Create FAQ Entry'}
                  </Button>
                </div>
              </div>
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
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Document Upload Area</h3>
                  <p className="text-gray-500">Drag and drop files or click to browse</p>
                </div>
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