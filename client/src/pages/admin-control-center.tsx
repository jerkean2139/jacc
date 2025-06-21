import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Folder, FileText, AlertTriangle, Settings, Users, BarChart3, MessageSquare, Brain, ChevronDown, Download, Edit, Send, ThumbsUp, Eye, RefreshCw, Plus } from 'lucide-react';
import DocumentDragDrop from '@/components/ui/document-drag-drop';
import DocumentPreviewModal from '@/components/ui/document-preview-modal';
import { useToast } from '@/hooks/use-toast';

interface DocumentEntry {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  folderId?: string;
}

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  priority: number;
  isActive: boolean;
}

export default function AdminControlCenter() {
  const [activeTab, setActiveTab] = useState('documents');
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [previewDocument, setPreviewDocument] = useState<DocumentEntry | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // AI Simulator state
  const [testQuery, setTestQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [correctedResponse, setCorrectedResponse] = useState('');
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [showCorrectInterface, setShowCorrectInterface] = useState(false);
  
  // Chat Review state
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showChatReviewModal, setShowChatReviewModal] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('pending');
  const [chatReviewFilter, setChatReviewFilter] = useState('pending');
  const [messageCorrection, setMessageCorrection] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch documents data
  const { data: integratedDocuments, isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/documents'],
    enabled: activeTab === 'documents',
  });

  // Fetch FAQ data
  const { data: faqData, isLoading: faqLoading } = useQuery({
    queryKey: ['/api/admin/faq'],
    enabled: activeTab === 'faq',
  });

  // Fetch training analytics
  const { data: trainingAnalytics, isLoading: trainingLoading } = useQuery({
    queryKey: ['/api/admin/training/analytics'],
    enabled: activeTab === 'training',
  });

  // Fetch chat reviews
  const { data: chatReviews, isLoading: chatReviewsLoading } = useQuery({
    queryKey: ['/api/admin/chat-reviews'],
    enabled: activeTab === 'chat-review',
  });

  // Fetch chat details for review
  const { data: selectedChatDetails } = useQuery({
    queryKey: ['/api/admin/chat-reviews', selectedChatId],
    enabled: !!selectedChatId,
  });

  const handlePreviewDocument = (document: DocumentEntry) => {
    setPreviewDocument(document);
    setShowPreviewModal(true);
  };

  const handleDownloadDocument = (doc: DocumentEntry) => {
    const downloadUrl = `/api/documents/${doc.id}/download`;
    window.open(downloadUrl, '_blank');
  };

  const handleEditDocument = (document: DocumentEntry) => {
    // Placeholder for edit functionality
    toast({ title: 'Edit functionality coming soon' });
  };

  const handleMoveDocument = async (documentId: string, targetFolderId: string | null) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId: targetFolderId }),
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to move document');
      
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({ title: 'Document moved successfully' });
    } catch (error) {
      toast({ 
        title: 'Failed to move document', 
        description: 'Please try again',
        variant: 'destructive' 
      });
    }
  };

  // AI Simulator handlers
  const handleTestAI = async () => {
    if (!testQuery.trim()) return;
    
    setIsTestingAI(true);
    try {
      const response = await fetch('/api/admin/ai-simulator/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testQuery }),
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to test AI');
      
      const data = await response.json();
      setAiResponse(data.response);
      setShowCorrectInterface(true);
    } catch (error) {
      toast({ title: 'Failed to test AI query', variant: 'destructive' });
    } finally {
      setIsTestingAI(false);
    }
  };

  const handleSubmitCorrection = async () => {
    if (!correctedResponse.trim()) return;
    
    try {
      const response = await fetch('/api/admin/ai-simulator/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: testQuery,
          originalResponse: aiResponse,
          correctedResponse: correctedResponse,
        }),
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to submit correction');
      
      toast({ title: 'Training correction submitted successfully' });
      setCorrectedResponse('');
      setShowCorrectInterface(false);
    } catch (error) {
      toast({ title: 'Failed to submit correction', variant: 'destructive' });
    }
  };

  // Chat Review handlers
  const handleReviewChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setShowChatReviewModal(true);
  };

  const handleApproveMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/admin/chat-reviews/${selectedChatId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to approve message');
      
      toast({ title: 'Message approved' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat-reviews'] });
    } catch (error) {
      toast({ title: 'Failed to approve message', variant: 'destructive' });
    }
  };

  const handleCorrectMessage = async (messageId: string, correction: string) => {
    try {
      const response = await fetch(`/api/admin/chat-reviews/${selectedChatId}/correct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, correction }),
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to submit correction');
      
      toast({ title: 'Correction submitted' });
      setMessageCorrection('');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat-reviews'] });
    } catch (error) {
      toast({ title: 'Failed to submit correction', variant: 'destructive' });
    }
  };

  const categories = Array.isArray(faqData) ? 
    Array.from(new Set(faqData.map((faq: FAQ) => faq.category))) : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Control Center</h1>
        <p className="text-gray-600 mt-2">Manage documents, knowledge base, and system settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <Folder className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="chat-review" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat Review
          </TabsTrigger>
          <TabsTrigger value="ai-simulator" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Simulator
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Training
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Folder className="h-5 w-5" />
                    Document Repository
                  </CardTitle>
                  <CardDescription>
                    Organize and manage your document collection with drag-and-drop functionality
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {documentsLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Loading documents...</span>
                    </div>
                  ) : (
                    <ScrollArea className="h-[600px] pr-4">
                      <DocumentDragDrop
                        folders={integratedDocuments?.folders || []}
                        unassignedDocuments={integratedDocuments?.unassignedDocuments || []}
                        onMoveDocument={handleMoveDocument}
                        onPreviewDocument={handlePreviewDocument}
                        onDownloadDocument={handleDownloadDocument}
                        onEditDocument={handleEditDocument}
                      />
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Document Preview Modal */}
          <DocumentPreviewModal
            document={previewDocument}
            isOpen={showPreviewModal}
            onClose={() => setShowPreviewModal(false)}
            onDownload={handleDownloadDocument}
          />
        </TabsContent>

        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base Management</CardTitle>
              <CardDescription>
                Manage FAQ entries and knowledge base content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {faqLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Loading FAQ data...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {categories.map((category: string) => {
                    const categoryFAQs = Array.isArray(faqData) ? 
                      faqData.filter((f: FAQ) => f.category === category) : [];
                    
                    return (
                      <div key={category} className="border rounded-lg">
                        <div className="p-4 bg-gray-50 border-b">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{category}</h3>
                            <Badge variant="secondary">
                              {categoryFAQs.length} entries
                            </Badge>
                          </div>
                        </div>
                        <div className="p-4 space-y-2">
                          {categoryFAQs.map((faq: FAQ) => (
                            <div key={faq.id} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{faq.question}</p>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{faq.answer}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={faq.isActive ? "default" : "secondary"}>
                                  {faq.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Button size="sm" variant="outline">
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Training Analytics</CardTitle>
              <CardDescription>
                Monitor AI training performance and user interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trainingLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Loading training data...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">
                      {trainingAnalytics?.totalInteractions || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Interactions</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">
                      {trainingAnalytics?.averageSatisfaction || 0}%
                    </div>
                    <div className="text-sm text-gray-600">Satisfaction Rate</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-700">
                      {trainingAnalytics?.totalMessages || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Messages</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat-review" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Chat Review Center
                <div className="flex gap-2">
                  <Select value={chatReviewFilter} onValueChange={setChatReviewFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="needs_correction">Needs Correction</SelectItem>
                      <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
              <CardDescription>
                Review user conversations and make corrections for training
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chatReviewsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Loading chat reviews...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(chatReviews) && chatReviews.length > 0 ? (
                    chatReviews.map((chat: any) => (
                      <div key={chat.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Chat {chat.id}</h4>
                            <p className="text-sm text-gray-600">
                              {chat.messageCount} messages • {chat.status}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={chat.status === 'approved' ? 'default' : 'secondary'}>
                              {chat.status}
                            </Badge>
                            <Button
                              size="sm"
                              onClick={() => handleReviewChat(chat.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-8 text-gray-500">
                      No chat reviews available
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-simulator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Simulator</CardTitle>
              <CardDescription>
                Test AI responses and train the system with corrections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Query Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Test Query</label>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Enter a test query for the AI system..."
                      value={testQuery}
                      onChange={(e) => setTestQuery(e.target.value)}
                      className="flex-1"
                      rows={3}
                    />
                    <Button
                      onClick={handleTestAI}
                      disabled={!testQuery.trim() || isTestingAI}
                      className="px-6"
                    >
                      {isTestingAI ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Test AI
                    </Button>
                  </div>
                </div>

                {/* AI Response */}
                {aiResponse && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">AI Response</label>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <p className="text-sm whitespace-pre-wrap">{aiResponse}</p>
                      </div>
                    </div>

                    {/* Correction Interface */}
                    {showCorrectInterface && (
                      <div className="space-y-4 p-4 bg-blue-50 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-blue-900">Train the AI</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCorrectInterface(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-blue-900">
                            Provide Corrected Response
                          </label>
                          <Textarea
                            placeholder="Enter the correct response to train the AI..."
                            value={correctedResponse}
                            onChange={(e) => setCorrectedResponse(e.target.value)}
                            rows={4}
                          />
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSubmitCorrection}
                            disabled={!correctedResponse.trim()}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Submit Training
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowCorrectInterface(false);
                              toast({ title: 'Response marked as correct' });
                            }}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Mark as Correct
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!aiResponse && !isTestingAI && (
                  <div className="text-center p-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                    Enter a test query above to simulate AI responses and train the system
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Analytics</CardTitle>
              <CardDescription>
                Overview of system performance and usage metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 text-gray-500">
                Analytics dashboard coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure system parameters and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 text-gray-500">
                Settings panel coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Chat Review Modal with Built-in Emulator */}
      <Dialog open={showChatReviewModal} onOpenChange={setShowChatReviewModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Chat Review & Emulator
            </DialogTitle>
            <DialogDescription>
              Review conversation and make corrections with built-in AI emulator
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
            {/* Chat History Panel */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Conversation History</h4>
                <Badge variant="outline">
                  {selectedChatDetails?.messages?.length || 0} messages
                </Badge>
              </div>
              
              <ScrollArea className="h-[500px] border rounded-lg p-4">
                {selectedChatDetails?.messages?.map((message: any, index: number) => (
                  <div key={message.id || index} className="mb-4">
                    <div className={`p-3 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-blue-50 border-l-4 border-blue-400' 
                        : 'bg-gray-50 border-l-4 border-gray-400'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {message.role === 'user' ? 'User' : 'Assistant'}
                        </span>
                        {message.role === 'assistant' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveMessage(message.id)}
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {message.role === 'assistant' && (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            placeholder="Enter correction for this response..."
                            value={messageCorrection}
                            onChange={(e) => setMessageCorrection(e.target.value)}
                            className="text-sm"
                            rows={2}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleCorrectMessage(message.id, messageCorrection)}
                            disabled={!messageCorrection.trim()}
                          >
                            Submit Correction
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )) || (
                  <div className="text-center text-gray-500 py-8">
                    No messages in this conversation
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* AI Emulator Panel */}
            <div className="space-y-4">
              <h4 className="font-medium">AI Response Emulator</h4>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Test Query</label>
                  <Textarea
                    placeholder="Test how AI would respond to this query..."
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={handleTestAI}
                    disabled={!testQuery.trim() || isTestingAI}
                    className="w-full"
                  >
                    {isTestingAI ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Test AI Response
                  </Button>
                </div>

                {aiResponse && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">AI Response</label>
                      <div className="p-3 bg-gray-50 border rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{aiResponse}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowCorrectInterface(true)}
                        className="flex-1"
                      >
                        Need Correction
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          toast({ title: 'Response approved' });
                          setAiResponse('');
                        }}
                        className="flex-1"
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>

                    {showCorrectInterface && (
                      <div className="space-y-4 p-4 bg-blue-50 rounded-lg border">
                        <h5 className="font-medium text-blue-900">Provide Training Correction</h5>
                        <Textarea
                          placeholder="Enter the correct response..."
                          value={correctedResponse}
                          onChange={(e) => setCorrectedResponse(e.target.value)}
                          rows={4}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSubmitCorrection}
                            disabled={!correctedResponse.trim()}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Submit Training
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowCorrectInterface(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}