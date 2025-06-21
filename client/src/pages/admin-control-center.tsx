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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Folder, FileText, AlertTriangle, Settings, Users, BarChart3, MessageSquare, Brain, ChevronDown, Download, Edit, Send, ThumbsUp, Eye, RefreshCw, Plus, Upload, Search, Trash2, Save, X, User, Bot, Loader2, CheckCircle, AlertCircle, SkipForward } from 'lucide-react';
import DocumentDragDrop from '@/components/ui/document-drag-drop';
import DocumentPreviewModal from '@/components/ui/document-preview-modal';
import DocumentUpload from '@/components/document-upload';
import { DraggableDocument } from '@/components/draggable-document';
import { DroppableFolder } from '@/components/droppable-folder';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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
  const [searchQuery, setSearchQuery] = useState("");
  
  // AI Simulator state
  const [correctedResponse, setCorrectedResponse] = useState('');
  
  // Chat Review state
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedChatDetails, setSelectedChatDetails] = useState<any>(null);
  const [showChatReviewModal, setShowChatReviewModal] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('pending');
  const [chatReviewFilter, setChatReviewFilter] = useState('pending');
  const [messageCorrection, setMessageCorrection] = useState('');
  const [correctingMessageId, setCorrectingMessageId] = useState<string | null>(null);
  const [trainingChatMessages, setTrainingChatMessages] = useState<any[]>([]);
  const [trainingQuery, setTrainingQuery] = useState('');
  const [isTrainingChat, setIsTrainingChat] = useState(false);
  const [testQuery, setTestQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [showCorrectInterface, setShowCorrectInterface] = useState(false);
  
  // FAQ Management state
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [showFaqDialog, setShowFaqDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: '',
    isActive: true
  });
  
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

  // Fetch chat details for review (handled manually in handleReviewChat function)

  // Extract documents from the integrated structure for search and display
  const allDocuments = integratedDocuments ? [
    ...((integratedDocuments as any)?.folders?.flatMap((folder: any) => folder.documents || []) || []),
    ...((integratedDocuments as any)?.unassignedDocuments || [])
  ] : [];

  const filteredDocuments = allDocuments.filter((doc: any) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.originalName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // FAQ Management mutations
  const createFaqMutation = useMutation({
    mutationFn: async (faqData: any) => {
      const response = await fetch('/api/admin/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faqData),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to create FAQ');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faq'] });
      setShowFaqDialog(false);
      setFaqForm({ question: '', answer: '', category: '', isActive: true });
      toast({ title: 'FAQ created successfully' });
    },
    onError: () => {
      toast({ title: 'Error creating FAQ', variant: 'destructive' });
    }
  });

  const updateFaqMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await fetch(`/api/admin/faq/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to update FAQ');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faq'] });
      setEditingFaq(null);
      setShowFaqDialog(false);
      toast({ title: 'FAQ updated successfully' });
    },
    onError: () => {
      toast({ title: 'Error updating FAQ', variant: 'destructive' });
    }
  });

  const deleteFaqMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/faq/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete FAQ');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faq'] });
      toast({ title: 'FAQ deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Error deleting FAQ', variant: 'destructive' });
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryName: string) => {
      const response = await fetch('/api/admin/faq/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to create category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faq'] });
      setShowCategoryDialog(false);
      setNewCategory('');
      toast({ title: 'Category created successfully' });
    },
    onError: () => {
      toast({ title: 'Error creating category', variant: 'destructive' });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryName: string) => {
      const response = await fetch(`/api/admin/faq/categories/${encodeURIComponent(categoryName)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faq'] });
      toast({ title: 'Category deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Error deleting category', variant: 'destructive' });
    }
  });

  // FAQ Management handlers
  const handleCreateFaq = () => {
    setEditingFaq(null);
    setFaqForm({ question: '', answer: '', category: '', isActive: true });
    setShowFaqDialog(true);
  };

  const handleEditFaq = (faq: any) => {
    setEditingFaq(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      isActive: faq.isActive
    });
    setShowFaqDialog(true);
  };

  const handleSaveFaq = () => {
    if (editingFaq) {
      updateFaqMutation.mutate({ id: editingFaq.id, ...faqForm });
    } else {
      createFaqMutation.mutate(faqForm);
    }
  };

  const handleDeleteFaq = (id: number) => {
    deleteFaqMutation.mutate(id);
  };

  const handleCreateCategory = () => {
    if (newCategory.trim()) {
      createCategoryMutation.mutate(newCategory.trim());
    }
  };

  const handleDeleteCategory = (categoryName: string) => {
    deleteCategoryMutation.mutate(categoryName);
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

  // Chat Review handlers
  const handleReviewChat = async (chatId: string) => {
    setSelectedChatId(chatId);
    try {
      const response = await fetch(`/api/admin/chat-reviews/${chatId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to load chat details');
      const chatData = await response.json();
      setTrainingChatMessages(chatData.messages || []);
      setSelectedChatDetails(chatData);
    } catch (error) {
      console.error('Error loading chat details:', error);
      toast({ title: 'Failed to load chat details', variant: 'destructive' });
    }
  };

  const handleSubmitTraining = async () => {
    if (!trainingQuery.trim() || !selectedChatId) return;
    
    setIsTrainingChat(true);
    try {
      const response = await fetch('/api/admin/ai-simulator/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: trainingQuery,
          chatId: selectedChatId,
          context: 'chat_review'
        }),
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to submit training');
      
      const result = await response.json();
      setTrainingChatMessages(prev => [...prev, 
        { role: 'user', content: trainingQuery, createdAt: new Date() },
        { role: 'assistant', content: result.response, createdAt: new Date() }
      ]);
      setTrainingQuery('');
      toast({ title: 'Training submitted successfully' });
    } catch (error) {
      toast({ title: 'Failed to submit training', variant: 'destructive' });
    } finally {
      setIsTrainingChat(false);
    }
  };

  const handleUpdateReviewStatus = async (status: string) => {
    if (!selectedChatId) return;
    
    try {
      const response = await fetch(`/api/admin/chat-reviews/${selectedChatId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to update review status');
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat-reviews'] });
      toast({ title: `Chat marked as ${status}` });
    } catch (error) {
      toast({ title: 'Failed to update status', variant: 'destructive' });
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

  // Message handlers for chat review
  const handleApproveMessage = async (messageId: string) => {
    try {
      await apiRequest(`/api/admin/chat-reviews/messages/${messageId}/approve`, 'POST');
      toast({ title: 'Message approved' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat-reviews', selectedChatId] });
    } catch (error) {
      toast({ title: 'Error approving message', variant: 'destructive' });
    }
  };

  const handleCorrectMessage = async (messageId: string, correction: string) => {
    if (!correction.trim()) return;
    
    try {
      await apiRequest(`/api/admin/chat-reviews/messages/${messageId}/correct`, 'POST', { correction, chatId: selectedChatId });
      toast({ title: 'Correction submitted for training' });
      setMessageCorrection('');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat-reviews', selectedChatId] });
    } catch (error) {
      toast({ title: 'Error submitting correction', variant: 'destructive' });
    }
  };

  const handleStartTrainingChat = () => {
    setTrainingChatMessages([{
      role: 'assistant',
      content: 'Hi! I am ready to learn from your feedback. Tell me about the corrections you would like to make to my responses. You can speak naturally - for example: "When users ask about pricing, you should mention our competitive rates first" or "Your response about merchant services was too technical, make it simpler."'
    }]);
    setIsTrainingChat(true);
  };

  // Unified training message handler for chat review
  const handleSendTrainingMessage = async () => {
    if (!trainingQuery.trim()) return;

    const userMessage = { role: 'user', content: trainingQuery, createdAt: new Date() };
    setTrainingChatMessages(prev => [...prev, userMessage]);
    setTrainingQuery('');
    setIsTrainingChat(true);

    try {
      const response = await fetch('/api/admin/ai-simulator/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage.content,
          chatId: selectedChatId,
          context: 'chat_review_training'
        }),
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to send training message');
      
      const result = await response.json();

      const responseData = await response.json();
      const aiMessage = { role: 'assistant', content: responseData.response };
      setTrainingChatMessages(prev => [...prev, aiMessage]);
      
      if (responseData.trainingApplied) {
        toast({ title: 'Training correction applied successfully' });
      }
    } catch (error) {
      console.error('Training chat error:', error);
      setTrainingChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your training feedback. Please try again.'
      }]);
    } finally {
      setIsTrainingChat(false);
    }
  };

  // Chat Review specific handlers



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
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Document Management</h3>
              <p className="text-sm text-muted-foreground">
                Upload and organize merchant services documents for instant search in Tracer
              </p>
            </div>

            <Tabs defaultValue="upload" className="space-y-4">
              <TabsList>
                <TabsTrigger value="upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documents
                </TabsTrigger>
                <TabsTrigger value="manage">
                  <FileText className="h-4 w-4 mr-2" />
                  Manage & Organize ({allDocuments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <Upload className="h-5 w-5" />
                      3-Step Document Upload Process
                    </CardTitle>
                    <CardDescription>
                      Step 1: Select Files → Step 2: Choose Folder → Step 3: Set Permissions & Upload
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DocumentUpload />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="manage" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Document Organization</CardTitle>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search documents by name, description, or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border-2 border-dashed border-blue-200 dark:border-blue-800">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Drag & Drop Instructions</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-200">
                        • Drag documents from the left panel to folders on the right to organize them
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-200">
                        • Folders will highlight when you can drop documents into them
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Side - All Documents */}
                      <div className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              All Documents
                              <Badge variant="secondary" className="ml-auto">
                                {filteredDocuments.length}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="max-h-[600px] overflow-y-auto">
                            <div className="space-y-2">
                              {filteredDocuments.map((doc: any) => (
                                <DraggableDocument
                                  key={doc.id}
                                  document={doc}
                                  onMove={handleMoveDocument}
                                />
                              ))}
                              {filteredDocuments.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                  {searchQuery ? 'No documents match your search.' : 'No documents available'}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Right Side - Folders */}
                      <div className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Folder className="h-5 w-5" />
                              Folders
                              <Badge variant="secondary" className="ml-auto">
                                {(integratedDocuments as any)?.folders?.length || 0}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="max-h-[600px] overflow-y-auto">
                            <div className="space-y-3">
                              {(integratedDocuments as any)?.folders?.length > 0 ? (
                                (integratedDocuments as any)?.folders?.map((folder: any) => (
                                  <DroppableFolder
                                    key={folder.id}
                                    folder={{
                                      ...folder,
                                      documentCount: folder.documents?.length || 0
                                    }}
                                    onDocumentMove={handleMoveDocument}
                                  />
                                ))
                              ) : (
                                <div className="text-center py-8">
                                  <Folder className="mx-auto h-12 w-12 text-muted-foreground" />
                                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No folders available</h3>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    Contact administrator to create folders for document organization.
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Knowledge Base Management</CardTitle>
                  <CardDescription>
                    Manage FAQ entries and knowledge base content with full CRUD operations
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Category
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                        <DialogDescription>
                          Create a new category for organizing FAQ entries
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="categoryName">Category Name</Label>
                          <Input
                            id="categoryName"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Enter category name"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateCategory} disabled={!newCategory.trim()}>
                          Create Category
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button onClick={handleCreateFaq} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add FAQ
                  </Button>
                </div>
              </div>
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
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {categoryFAQs.length} entries
                              </Badge>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the "{category}" category? This will also delete all FAQ entries in this category. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteCategory(category)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete Category
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 space-y-2">
                          {categoryFAQs.map((faq: FAQ) => (
                            <div key={faq.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{faq.question}</p>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{faq.answer}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={faq.isActive ? "default" : "secondary"}>
                                  {faq.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Button size="sm" variant="outline" onClick={() => handleEditFaq(faq)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete FAQ Entry</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this FAQ entry? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteFaq(faq.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete FAQ
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          ))}
                          {categoryFAQs.length === 0 && (
                            <div className="text-center py-4 text-gray-500">
                              No FAQ entries in this category
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {categories.length === 0 && (
                    <div className="text-center py-8">
                      <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-semibold text-gray-900">No FAQ categories</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Start by creating a category to organize your FAQ entries.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* FAQ Edit/Create Dialog */}
          <Dialog open={showFaqDialog} onOpenChange={setShowFaqDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingFaq ? 'Edit FAQ Entry' : 'Create New FAQ Entry'}
                </DialogTitle>
                <DialogDescription>
                  {editingFaq ? 'Update the FAQ entry details below' : 'Add a new FAQ entry to the knowledge base'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="question">Question</Label>
                  <Input
                    id="question"
                    value={faqForm.question}
                    onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                    placeholder="Enter the FAQ question"
                  />
                </div>
                <div>
                  <Label htmlFor="answer">Answer</Label>
                  <Textarea
                    id="answer"
                    value={faqForm.answer}
                    onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                    placeholder="Enter the detailed answer"
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={faqForm.category}
                    onValueChange={(value) => setFaqForm({ ...faqForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category: string) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={faqForm.isActive}
                    onCheckedChange={(checked) => setFaqForm({ ...faqForm, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active (visible to users)</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowFaqDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveFaq} 
                  disabled={!faqForm.question.trim() || !faqForm.answer.trim() || !faqForm.category}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingFaq ? 'Update FAQ' : 'Create FAQ'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">
                      {(trainingAnalytics as any)?.totalInteractions || 0}
                    </div>
                    <div className="text-sm text-gray-600">Training Interactions</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">
                      {(trainingAnalytics as any)?.correctionsSubmitted || 0}
                    </div>
                    <div className="text-sm text-gray-600">AI Corrections</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-700">
                      {(trainingAnalytics as any)?.averageResponseTime || 0}ms
                    </div>
                    <div className="text-sm text-gray-600">Avg Response Time</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-700">
                      {(trainingAnalytics as any)?.knowledgeBaseEntries || 0}
                    </div>
                    <div className="text-sm text-gray-600">Knowledge Entries</div>
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
                      <div key={chat.chatId} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">
                              {chat.chatTitle || `Chat ${chat.chatId.substring(0, 8)}`}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {chat.messageCount} messages • User: {chat.userId}
                            </p>
                            <p className="text-xs text-gray-500">
                              Last updated: {new Date(chat.updatedAt).toLocaleDateString()}
                              {chat.correctionsMade > 0 && ` • ${chat.correctionsMade} corrections`}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={chat.reviewStatus === 'approved' ? 'default' : 'secondary'}>
                              {chat.reviewStatus}
                            </Badge>
                            <Button
                              size="sm"
                              onClick={() => handleReviewChat(chat.chatId)}
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

      {/* Chat Review Modal */}
      <Dialog open={showChatReviewModal} onOpenChange={setShowChatReviewModal}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat Review & Training Center
            </DialogTitle>
            <DialogDescription>
              Review conversations and train AI responses through interactive correction
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh]">
            {/* Left Side - Conversation History */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Conversation History</h3>
                <Select value={chatReviewFilter} onValueChange={setChatReviewFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Chats</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="needs_correction">Needs Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Chat List */}
              <div className="border rounded-lg h-[25vh] overflow-y-auto">
                <div className="p-4 space-y-3">
                  {Array.isArray(chatReviews) && chatReviews.length > 0 ? (
                    chatReviews.map((chat: any) => (
                      <div 
                        key={chat.chatId} 
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedChatId === chat.chatId ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleReviewChat(chat.chatId)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-sm">
                              {chat.chatTitle || `Chat ${chat.chatId.substring(0, 8)}`}
                            </h4>
                            <p className="text-xs text-gray-600">
                              {chat.messageCount} messages • {chat.userId}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(chat.updatedAt).toLocaleDateString()}
                              {chat.correctionsMade > 0 && ` • ${chat.correctionsMade} corrections`}
                            </p>
                          </div>
                          <Badge variant={chat.reviewStatus === 'approved' ? 'default' : 'secondary'} className="text-xs">
                            {chat.reviewStatus}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No chat reviews found for "{chatReviewFilter}" status
                    </div>
                  )}
                </div>
              </div>
              
              {/* Selected Chat Messages */}
              <div className="space-y-2">
                <h4 className="font-medium">Messages</h4>
                <ScrollArea className="h-[35vh] border rounded-lg p-4">
                  {trainingChatMessages.length > 0 ? (
                    <div className="space-y-3">
                      {trainingChatMessages.map((message: any, index: number) => (
                        <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-lg p-3 ${
                            message.role === 'user' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              {message.role === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                              <span className="text-xs font-medium">
                                {message.role === 'user' ? 'User' : 'AI Assistant'}
                              </span>
                            </div>
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Select a chat to view conversation</p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
            
            {/* Right Side - AI Training Chat */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">AI Training Chat</h3>
                {selectedChatId && (
                  <Badge variant="outline">Chat: {selectedChatId.substring(0, 8)}</Badge>
                )}
              </div>
              
              {selectedChatId ? (
                <Card className="h-full">
                  <CardContent className="p-4 h-full flex flex-col">
                    {/* Training Chat Messages */}
                    <ScrollArea className="flex-1 mb-4 border rounded-lg p-3 min-h-[40vh]">
                      <div className="space-y-3">
                        <div className="flex justify-start">
                          <div className="bg-gray-100 rounded-lg p-3 max-w-[85%]">
                            <div className="flex items-center gap-2 mb-1">
                              <Bot className="h-3 w-3" />
                              <span className="text-xs font-medium">AI Trainer</span>
                            </div>
                            <p className="text-sm">
                              I'm here to help you train and improve AI responses. You can:
                              <br/>• Ask how the AI should have responded differently
                              <br/>• Provide better example responses
                              <br/>• Explain why certain responses need improvement
                              <br/>• Test new response strategies
                            </p>
                          </div>
                        </div>
                        
                        {/* Show any existing training conversation */}
                        {isTrainingChat && (
                          <div className="flex justify-center">
                            <div className="bg-blue-50 rounded-lg p-2">
                              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                              <p className="text-xs text-center mt-1">AI is learning...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                    
                    {/* Training Input */}
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Ask how the AI should respond differently, provide corrections, or explain improvements..."
                        value={trainingQuery}
                        onChange={(e) => setTrainingQuery(e.target.value)}
                        className="min-h-[80px] resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSubmitTraining}
                          disabled={!trainingQuery.trim() || isTrainingChat}
                          className="flex-1"
                        >
                          {isTrainingChat ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Training...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Send Training
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setTrainingQuery('');
                          }}
                          disabled={isTrainingChat}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Review Status Actions */}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateReviewStatus('approved')}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateReviewStatus('needs_correction')}
                          className="text-yellow-600 hover:text-yellow-700"
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Needs Work
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateReviewStatus('skipped')}
                          className="text-gray-600 hover:text-gray-700"
                        >
                          <SkipForward className="h-4 w-4 mr-1" />
                          Skip
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed h-full">
                  <CardContent className="flex flex-col items-center justify-center h-full text-center">
                    <Brain className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-lg font-medium text-gray-500 mb-2">Select a Chat to Start Training</p>
                    <p className="text-sm text-gray-400 max-w-sm">
                      Choose a conversation from the left to review messages and train the AI with better responses
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}