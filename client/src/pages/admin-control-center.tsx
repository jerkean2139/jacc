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
import { Folder, FileText, AlertTriangle, Settings, Users, BarChart3, MessageSquare, Brain, ChevronDown, Download, Edit, Send, ThumbsUp, Eye, RefreshCw, Plus, Upload, Search, Trash2, Save, X } from 'lucide-react';
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
  const [trainingChatMessages, setTrainingChatMessages] = useState<any[]>([]);
  const [trainingQuery, setTrainingQuery] = useState('');
  const [isTrainingChat, setIsTrainingChat] = useState(false);
  
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

  // Fetch chat details for review
  const { data: selectedChatDetails } = useQuery({
    queryKey: ['/api/admin/chat-reviews', selectedChatId],
    enabled: !!selectedChatId,
  });

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

  const handleSendTrainingMessage = async () => {
    if (!trainingQuery.trim()) return;

    const userMessage = { role: 'user', content: trainingQuery };
    setTrainingChatMessages(prev => [...prev, userMessage]);
    setTrainingQuery('');
    setIsTrainingChat(true);

    try {
      const response = await apiRequest('POST', '/api/admin/training/conversational', {
        message: userMessage.content,
        context: selectedChatDetails,
        chatHistory: trainingChatMessages
      });

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

  // Chat Review handlers
  const handleReviewChat = async (chatId: string) => {
    setSelectedChatId(chatId);
    setShowChatReviewModal(true);
    
    // Fetch chat details immediately
    try {
      const response = await fetch(`/api/admin/chat-reviews/${chatId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const chatDetails = await response.json();
        console.log('Chat details loaded:', chatDetails);
      }
    } catch (error) {
      console.error('Error loading chat details:', error);
      toast({ 
        title: 'Error loading chat history',
        description: 'Please try again',
        variant: 'destructive'
      });
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
              Chat Review & AI Training
            </DialogTitle>
            <DialogDescription>
              Review user conversations and train AI responses
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="chat-review" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat-review" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Chat Review
              </TabsTrigger>
              <TabsTrigger value="ai-emulator" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Emulator
              </TabsTrigger>
            </TabsList>

            {/* Chat Review Tab */}
            <TabsContent value="chat-review" className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="text-sm text-muted-foreground">
                Review actual user conversations and provide training corrections
              </div>
              
              <ScrollArea className="h-[60vh] border rounded-lg p-4">
                {(selectedChatDetails as any)?.messages?.map((message: any, index: number) => (
                  <div key={message.id || index} className={`mb-6 p-4 rounded-lg border ${
                    message.role === 'user' 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700">
                          {message.role === 'user' ? '👤 User' : '🤖 AI Assistant'}
                        </span>
                        {message.role === 'assistant' && (
                          <Badge variant="outline" className="text-xs">
                            Needs Review
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : 'Just now'}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                    
                    {message.role === 'assistant' && (
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproveMessage(message.id)}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            Approve Response
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCorrectingMessageId(message.id);
                              setMessageCorrection('');
                            }}
                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Train AI
                          </Button>
                        </div>

                        {correctingMessageId === message.id && (
                          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                            <h6 className="font-medium text-orange-900 mb-2">AI Training Instructions</h6>
                            <p className="text-xs text-orange-700 mb-3">
                              Describe how the AI should improve this response. The AI will learn from your feedback and update its knowledge.
                            </p>
                            <Textarea
                              placeholder="Example: 'This response should mention competitive rates first, then explain benefits. Make it less technical and more business-focused. Include specific pricing ranges when discussing costs.'"
                              value={messageCorrection}
                              onChange={(e) => setMessageCorrection(e.target.value)}
                              rows={4}
                              className="mb-3"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleCorrectMessage(message.id, messageCorrection)}
                                disabled={!messageCorrection.trim()}
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Submit Training
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setCorrectingMessageId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )) || (
                  <div className="text-center text-muted-foreground py-12">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No conversation selected</p>
                    <p className="text-sm">Select a chat from the list to review and train AI responses</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* AI Emulator Tab */}
            <TabsContent value="ai-emulator" className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="text-sm text-muted-foreground">
                Test AI responses to specific queries (independent testing tool)
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Test Input */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        Test Query
                      </CardTitle>
                      <CardDescription>Enter a question to test AI response</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        placeholder="Example: What are your payment processing rates for restaurants?"
                        value={testQuery}
                        onChange={(e) => setTestQuery(e.target.value)}
                        rows={4}
                      />
                      <Button
                        onClick={handleTestAI}
                        disabled={!testQuery.trim() || isTestingAI}
                        className="w-full"
                        size="lg"
                      >
                        {isTestingAI ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Test AI Response
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Response Output */}
                <div className="space-y-4">
                  {aiResponse ? (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Brain className="h-5 w-5" />
                          AI Response
                        </CardTitle>
                        <CardDescription>Current AI response to your test query</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 bg-gray-50 border rounded-lg">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{aiResponse}</p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              toast({ title: 'Response approved' });
                              setAiResponse('');
                              setTestQuery('');
                            }}
                            className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Good Response
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowCorrectInterface(true)}
                            className="flex-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Needs Training
                          </Button>
                        </div>

                        {showCorrectInterface && (
                          <Card className="border-orange-200">
                            <CardHeader className="bg-orange-50 pb-3">
                              <CardTitle className="text-lg text-orange-900">AI Training Session</CardTitle>
                              <CardDescription className="text-orange-700">
                                Describe what needs improvement. The AI will learn from your feedback.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {/* Training Chat Messages */}
                              {trainingChatMessages.length > 0 && (
                                <div className="max-h-64 overflow-y-auto border rounded-lg p-3 space-y-2 bg-white">
                                  {trainingChatMessages.map((msg, idx) => (
                                    <div key={idx} className={`p-3 rounded ${
                                      msg.role === 'user' 
                                        ? 'bg-blue-100 text-blue-900 ml-6' 
                                        : 'bg-gray-100 text-gray-900 mr-6'
                                    }`}>
                                      <div className="text-xs font-medium mb-1">
                                        {msg.role === 'user' ? '👨‍💼 Admin' : '🤖 AI Learning'}
                                      </div>
                                      <div className="text-sm leading-relaxed">{msg.content}</div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <Textarea
                                placeholder="Example: 'This response is too technical. Make it simpler and focus on business benefits. Start with pricing information since that's what they asked about.'"
                                value={trainingQuery}
                                onChange={(e) => setTrainingQuery(e.target.value)}
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={handleSendTrainingMessage}
                                  disabled={!trainingQuery.trim() || isTrainingChat}
                                  className="bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                  {isTrainingChat ? (
                                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <Send className="h-4 w-4 mr-2" />
                                  )}
                                  Send Training
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setShowCorrectInterface(false);
                                    setTrainingChatMessages([]);
                                    setTrainingQuery('');
                                  }}
                                >
                                  Close Training
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Brain className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-lg font-medium text-gray-500 mb-2">Ready to Test</p>
                        <p className="text-sm text-gray-400">Enter a query and click "Test AI Response" to see how the AI responds</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}