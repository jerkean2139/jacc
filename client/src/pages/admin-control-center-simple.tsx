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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Settings, Database, MessageSquare, Brain, CheckCircle, 
  AlertTriangle, Clock, Search, FileText, Eye, Download,
  Edit, Trash2, Save, Plus, Folder, Upload, Users,
  BarChart3, ThumbsUp, User, Bot, RefreshCw, AlertCircle,
  ChevronRight, ChevronDown, BookOpen, FolderOpen
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Document Center Tab Component
function DocumentCenterTab() {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch folders and documents
  const { data: foldersData } = useQuery({
    queryKey: ['/api/admin/folders'],
  });
  
  const { data: documentsData } = useQuery({
    queryKey: ['/api/documents'],
  });
  
  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };
  
  const folders = Array.isArray(foldersData) ? foldersData : [];
  const documents = (documentsData as any)?.documents || documentsData || [];
  
  const getDocumentsInFolder = (folderId: string) => {
    return documents.filter((doc: any) => doc.folderId === folderId);
  };
  
  const filteredFolders = folders.filter(folder => 
    searchTerm === "" || 
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Document Center</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Search folders and documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Badge variant="secondary">
            {folders.length} folders, {documents.length} documents
          </Badge>
        </div>
      </div>
      
      <Tabs defaultValue="folders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="folders">
            <Folder className="h-4 w-4 mr-2" />
            Folders ({folders.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            All Documents ({documents.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="folders" className="space-y-4">
          <div className="space-y-2">
            {filteredFolders.map((folder) => {
              const folderDocs = getDocumentsInFolder(folder.id);
              const isExpanded = expandedFolders.has(folder.id);
              
              return (
                <Card key={folder.id} className="border">
                  <CardContent className="p-4">
                    <Collapsible open={isExpanded} onOpenChange={() => toggleFolder(folder.id)}>
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <FolderOpen className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{folder.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {folderDocs.length} docs
                            </Badge>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-4">
                        {folderDocs.length > 0 ? (
                          <div className="space-y-2 ml-6">
                            {folderDocs.map((doc: any) => (
                              <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm">{doc.name || doc.originalName}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {doc.mimeType?.split('/')[1] || 'file'}
                                  </Badge>
                                </div>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost">
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost">
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 ml-6">No documents in this folder</p>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="documents" className="space-y-4">
          <div className="grid gap-4">
            {documents.length > 0 ? (
              documents.map((doc: any) => (
                <Card key={doc.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="font-medium">{doc.name || doc.originalName}</div>
                          <div className="text-sm text-gray-500">
                            {doc.folderId ? (
                              folders.find(f => f.id === doc.folderId)?.name || 'Unknown folder'
                            ) : (
                              'No folder assigned'
                            )}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {doc.mimeType?.split('/')[1] || 'file'}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No documents found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Knowledge Base Tab Component  
function KnowledgeBaseTab() {
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch FAQ data
  const { data: faqData } = useQuery({
    queryKey: ['/api/admin/faq'],
  });
  
  // Add new FAQ mutation
  const addFAQMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/admin/faq', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faq'] });
      setNewQuestion("");
      setNewAnswer("");
      toast({
        title: "Success",
        description: "FAQ entry added successfully",
      });
    },
  });
  
  const handleAddFAQ = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both question and answer",
        variant: "destructive",
      });
      return;
    }
    
    addFAQMutation.mutate({
      question: newQuestion,
      answer: newAnswer,
      category: selectedCategory,
    });
  };
  
  const faqs = Array.isArray(faqData) ? faqData : [];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Q&A Knowledge Base</h2>
        <Badge variant="secondary">
          {faqs.length} entries
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add New FAQ */}
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="text-blue-600">📝 Add New FAQ Entry</CardTitle>
            <CardDescription>Create comprehensive Q&A entries for the knowledge base</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Question</Label>
              <Input 
                placeholder="What is the processing fee for restaurants?"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
              />
            </div>
            <div>
              <Label>Answer</Label>
              <Textarea 
                placeholder="Processing fees for restaurants typically range from 2.3% to 3.5% depending on the card type and processing method..."
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                rows={4}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="pricing">Pricing</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="hardware">Hardware</SelectItem>
                  <SelectItem value="integration">Integration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleAddFAQ} 
              className="w-full"
              disabled={addFAQMutation.isPending}
            >
              {addFAQMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add FAQ Entry
            </Button>
          </CardContent>
        </Card>
        
        {/* Existing FAQs */}
        <Card>
          <CardHeader>
            <CardTitle>📚 Existing FAQ Entries</CardTitle>
            <CardDescription>Manage and edit current knowledge base entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {faqs.length > 0 ? (
                faqs.map((faq: any) => (
                  <Collapsible key={faq.id}>
                    <CollapsibleTrigger className="w-full text-left">
                      <div className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                            <p className="font-medium text-sm">{faq.question}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-6 mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm">{faq.answer}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className="text-xs">
                            {faq.category}
                          </Badge>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost">
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No FAQ entries yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminControlCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Chat Review Center States
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedChatDetails, setSelectedChatDetails] = useState<any>(null);
  const [correctionText, setCorrectionText] = useState("");
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [reportFilter, setReportFilter] = useState("all");
  const [correctionMode, setCorrectionMode] = useState(false);

  // Fetch user chats for review
  const { data: userChats, isLoading: chatsLoading } = useQuery({
    queryKey: ['/api/admin/chat-reviews'],
  });

  // Fetch messages for selected chat - CRITICAL: DO NOT CHANGE THIS QUERY FORMAT
  // This exact format was locked after fixing Chat Review Center regression
  const { data: chatMessages, isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/chats/${selectedChatId}/messages`],
    enabled: !!selectedChatId,
  });

  // Handle message data when it loads
  React.useEffect(() => {
    if (chatMessages && Array.isArray(chatMessages) && chatMessages.length > 0) {
      setSelectedChatDetails({
        userMessage: chatMessages.find((m: any) => m.role === 'user')?.content || '',
        aiResponse: chatMessages.find((m: any) => m.role === 'assistant')?.content || '',
        messages: chatMessages
      });
    }
  }, [chatMessages]);

  // Helper mutation functions for ChatReviewCenter
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
          description: "AI has been trained with the corrected response and will learn from this feedback",
        });
        setCorrectionMode(false);
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

  function ChatReviewCenter() {
    return (
      <div className="space-y-6">
        {/* Enhanced Analytics Dashboard */}
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

        {/* Split-Screen Chat Review & Training Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: '700px' }}>
          {/* Chat List Panel */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Chat Review Center
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {Array.isArray(userChats) ? userChats.length : 0} conversations
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowReports(!showReports)}
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Reports
                  </Button>
                </div>
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
                <div className="space-y-3 h-full overflow-y-auto">
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
              )}
            </CardContent>
          </Card>

          {/* Chat Review & Training Panel */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  {selectedChatId ? 'Review & Train AI' : 'Select Chat to Review'}
                </div>
                {selectedChatId && selectedChatDetails && (
                  <Badge variant="secondary">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Chat Selected
                  </Badge>
                )}
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
                      <div className="bg-gray-50 border-l-4 border-gray-500 p-4 rounded-r-lg flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="h-4 w-4 text-gray-600" />
                          <span className="font-medium text-gray-800">AI Response</span>
                        </div>
                        <div className="text-sm text-gray-900 max-h-40 overflow-y-auto">
                          <div dangerouslySetInnerHTML={{ 
                            __html: selectedChatDetails.aiResponse || 'No AI response found'
                          }} />
                        </div>
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
                        <Button 
                          variant="outline"
                          onClick={() => setCorrectionMode(!correctionMode)}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Provide Correction
                        </Button>
                      </div>

                      {/* Correction Interface */}
                      {correctionMode && (
                        <div className="space-y-3 p-4 bg-yellow-50 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <span className="font-medium text-yellow-800">Training Correction</span>
                          </div>
                          <Textarea
                            value={correctionText}
                            onChange={(e) => setCorrectionText(e.target.value)}
                            placeholder="Provide the corrected AI response that should have been given to this user question..."
                            className="w-full p-3 border rounded-lg resize-none"
                            rows={6}
                          />
                          <div className="flex gap-2">
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
                            <Button 
                              variant="outline"
                              onClick={() => {
                                setCorrectionMode(false);
                                setCorrectionText("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Reports Section */}
                      {showReports && (
                        <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              Chat Review Reports
                            </h4>
                            <Select value={reportFilter} onValueChange={setReportFilter}>
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Chats</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="corrected">With Corrections</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Total Reviews:</span>
                              <span className="font-medium">{Array.isArray(userChats) ? userChats.length : 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Approved:</span>
                              <span className="font-medium text-green-600">
                                {Array.isArray(userChats) ? userChats.filter((c: any) => c.reviewStatus === 'approved').length : 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Pending Review:</span>
                              <span className="font-medium text-yellow-600">
                                {Array.isArray(userChats) ? userChats.filter((c: any) => c.reviewStatus !== 'approved').length : 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
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
      
      <Tabs defaultValue="chat-reviews" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat-reviews">Chat Review & Training</TabsTrigger>
          <TabsTrigger value="documents">Document Center</TabsTrigger>
          <TabsTrigger value="knowledge">Q&A Knowledge</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="chat-reviews" className="space-y-6">
          <ChatReviewCenter />
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <DocumentCenterTab />
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-6">
          <KnowledgeBaseTab />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure AI behavior and system parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Settings interface would be here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}