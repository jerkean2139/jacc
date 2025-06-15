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
  ThumbsDown, Star, Copy
} from 'lucide-react';
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
  const [selectedFolder, setSelectedFolder] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState('admin');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  
  // Document management states
  const [documentSearchTerm, setDocumentSearchTerm] = useState('');
  const [documentFilter, setDocumentFilter] = useState('all');
  const [duplicatePreview, setDuplicatePreview] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showDocumentDetails, setShowDocumentDetails] = useState(false);

  // Fetch data
  const { data: faqData, isLoading: faqLoading } = useQuery({
    queryKey: ['/api/admin/faq'],
  });

  const { data: documentsData, isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/admin/documents'],
  });

  const { data: promptTemplates, isLoading: promptsLoading } = useQuery({
    queryKey: ['/api/admin/prompts'],
  });

  const { data: trainingAnalytics } = useQuery({
    queryKey: ['/api/admin/training/analytics'],
  });

  // Mutations
  const createFAQMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/faq', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faq'] });
      setNewQuestion('');
      setNewAnswer('');
      setNewCategory('general');
      setNewPriority(1);
      toast({ title: 'FAQ entry created successfully' });
    },
  });

  const createPromptMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/prompts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prompts'] });
      setShowCreatePrompt(false);
      setNewPromptName('');
      setNewPromptDescription('');
      setNewPromptTemplate('');
      setNewPromptCategory('system');
      setNewPromptTemperature(0.7);
      setNewPromptMaxTokens(1000);
      toast({ title: 'Prompt template created successfully' });
    },
  });

  const handleCreateFAQ = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast({ title: 'Please fill in both question and answer', variant: 'destructive' });
      return;
    }

    createFAQMutation.mutate({
      question: newQuestion,
      answer: newAnswer,
      category: newCategory,
      priority: newPriority,
      isActive: true,
    });
  };

  const handleCreatePrompt = () => {
    if (!newPromptName.trim() || !newPromptTemplate.trim()) {
      toast({ title: 'Please fill in template name and content', variant: 'destructive' });
      return;
    }

    createPromptMutation.mutate({
      name: newPromptName,
      description: newPromptDescription,
      template: newPromptTemplate,
      category: newPromptCategory,
      temperature: newPromptTemperature,
      maxTokens: newPromptMaxTokens,
      isActive: true,
    });
  };

  const handleDocumentUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({ title: 'Please select files to upload', variant: 'destructive' });
      return;
    }

    const formData = new FormData();
    const filePaths: string[] = [];
    
    Array.from(selectedFiles).forEach(file => {
      formData.append('files', file);
      // Preserve folder structure for folder uploads
      filePaths.push(file.webkitRelativePath || file.name);
    });
    
    // Handle folder selection - create new folder if needed
    let targetFolderId = selectedFolder;
    if (selectedFolder === 'new-folder' || !selectedFolder) {
      targetFolderId = ''; // Let backend create new folder
    }
    
    formData.append('folderId', targetFolderId);
    formData.append('permissions', selectedPermissions);
    formData.append('filePaths', JSON.stringify(filePaths));
    
    // Check if this is a folder upload
    const isFolder = selectedFiles[0]?.webkitRelativePath ? true : false;
    formData.append('isFolder', isFolder.toString());

    try {
      const endpoint = isFolder ? '/api/admin/upload-folder' : '/api/admin/documents/upload';
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        queryClient.invalidateQueries({ queryKey: ['/api/admin/documents'] });
        queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
        
        if (isFolder) {
          const folderName = selectedFiles[0].webkitRelativePath.split('/')[0];
          toast({ 
            title: `Folder Upload Complete`, 
            description: `"${folderName}" uploaded with ${result.processedCount} documents. ${result.subFoldersCreated || 0} subfolders created.`
          });
        } else {
          toast({ title: `Successfully uploaded ${selectedFiles.length} documents` });
        }
        
        setSelectedFiles(null);
        setSelectedFolder('');
        setSelectedPermissions('admin');
      } else {
        const error = await response.json();
        toast({ title: error.message || 'Upload failed', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', variant: 'destructive' });
    }
  };

  // Document management mutations
  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) => apiRequest(`/api/admin/documents/${documentId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/documents'] });
      toast({ title: 'Document deleted successfully' });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (documentIds: string[]) => apiRequest('/api/admin/documents/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ documentIds }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/documents'] });
      toast({ title: 'Documents deleted successfully' });
    },
  });

  const handleDeleteDocument = (documentId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      deleteDocumentMutation.mutate(documentId);
    }
  };

  const handleBulkDelete = () => {
    if (confirm('Are you sure you want to delete all filtered documents? This action cannot be undone.')) {
      const documentIds = filteredDocuments.map(doc => doc.id);
      bulkDeleteMutation.mutate(documentIds);
    }
  };

  const scanDuplicatesMutation = useMutation({
    mutationFn: () => fetch('/api/admin/documents/scan-duplicates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(res => res.json()),
    onSuccess: (data) => {
      console.log('Scan duplicates success:', data);
      setDuplicatePreview(data);
      setShowDuplicateModal(true);
    },
    onError: (error) => {
      console.error('Scan duplicates error:', error);
      toast({ 
        title: 'Scan failed', 
        description: 'Unable to scan for duplicates. Please try again.',
        variant: 'destructive' 
      });
    },
  });

  const removeDuplicatesMutation = useMutation({
    mutationFn: () => fetch('/api/admin/documents/remove-duplicates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(res => res.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/documents'] });
      setShowDuplicateModal(false);
      setDuplicatePreview(null);
      toast({ 
        title: 'Duplicates removed successfully', 
        description: `Removed ${data.duplicatesRemoved} duplicate documents`
      });
    },
  });

  const handleRemoveDuplicates = () => {
    console.log('Remove duplicates button clicked');
    scanDuplicatesMutation.mutate();
  };

  const confirmRemoveDuplicates = () => {
    removeDuplicatesMutation.mutate();
  };

  const filteredFAQs = Array.isArray(faqData) ? faqData.filter((faq: FAQ) => {
    return faq.question && faq.answer;
  }) : [];

  const faqCategories = Array.isArray(faqData) ? 
    [...new Set(faqData.map((faq: FAQ) => faq.category))] : [];

  // Filter documents based on search and filter criteria
  const filteredDocuments = Array.isArray(documentsData) ? documentsData.filter((doc: DocumentEntry) => {
    const matchesSearch = documentSearchTerm === '' || 
      doc.originalName.toLowerCase().includes(documentSearchTerm.toLowerCase()) ||
      doc.name.toLowerCase().includes(documentSearchTerm.toLowerCase());
    
    const matchesFilter = documentFilter === 'all' || 
      (documentFilter === 'pdf' && doc.mimeType === 'application/pdf') ||
      (documentFilter === 'text' && doc.mimeType.includes('text/')) ||
      (documentFilter === 'csv' && doc.mimeType.includes('csv')) ||
      (documentFilter === 'recent' && new Date(doc.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000));
    
    return matchesSearch && matchesFilter;
  }) : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Control Center</h1>
          <p className="text-muted-foreground">
            Unified management system for Q&A Knowledge Base, Document Center, AI Prompts, and Training Analytics
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Settings className="w-4 h-4 mr-2" />
          Admin Access
        </Badge>
      </div>

      <Tabs defaultValue="knowledge" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="knowledge" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Q&A Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Document Center
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Prompts
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Training & Feedback
          </TabsTrigger>
        </TabsList>

        {/* Q&A Knowledge Base Tab */}
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
                  onClick={handleCreateFAQ} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={createFAQMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {createFAQMutation.isPending ? 'Creating...' : 'Add FAQ Entry'}
                </Button>
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
                      return (
                        <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <BookOpen className="w-4 h-4 text-blue-500" />
                            <span className="font-medium capitalize">{category}</span>
                          </div>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
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
                            <Button size="sm" variant="ghost">
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost">
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

        {/* Document Center Tab */}
        <TabsContent value="documents" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Document Center Management</h2>
            <Badge variant="secondary">
              {Array.isArray(documentsData) ? documentsData.filter((doc: DocumentEntry) => doc.mimeType).length : 0} documents
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-2 border-green-500">
              <CardHeader>
                <CardTitle className="text-green-600">📁 3-Step Document Upload</CardTitle>
                <CardDescription>Folder assignment → Permission assignment → Upload with analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Step 1: Select Folder</Label>
                  <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                    <SelectTrigger className="mt-1">
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
                  <Label className="text-sm font-medium">Step 2: Permission Level</Label>
                  <Select value={selectedPermissions} onValueChange={setSelectedPermissions}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin Only</SelectItem>
                      <SelectItem value="sales-agent">Sales Agents</SelectItem>
                      <SelectItem value="client-admin">Client Admins</SelectItem>
                      <SelectItem value="public">Public Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Step 3: Upload Documents</Label>
                  <div className="space-y-3 mt-2">
                    <div>
                      <Label htmlFor="file-upload" className="text-sm text-gray-700">
                        Individual Files
                      </Label>
                      <Input 
                        id="file-upload"
                        type="file"
                        multiple
                        className="mt-1"
                        onChange={(e) => setSelectedFiles(e.target.files)}
                        accept=".pdf,.doc,.docx,.txt,.csv,.md"
                      />
                    </div>
                    
                    <div className="text-center text-gray-400">
                      OR
                    </div>
                    
                    <div>
                      <Label htmlFor="folder-upload" className="text-sm text-gray-700">
                        Entire Folder
                      </Label>
                      <Input
                        id="folder-upload"
                        type="file"
                        /* @ts-ignore */
                        webkitdirectory=""
                        directory=""
                        multiple
                        className="mt-1"
                        onChange={(e) => setSelectedFiles(e.target.files)}
                        accept=".pdf,.doc,.docx,.txt,.csv,.md"
                      />
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Supports PDF, Word, Text, CSV, and Markdown files. Documents will be organized by folder structure.
                  </p>
                  
                  {selectedFiles && selectedFiles.length > 0 && (
                    <div className="mt-2 p-2 bg-green-50 rounded border">
                      {selectedFiles[0].webkitRelativePath ? (
                        <div>
                          <div className="text-sm font-medium text-green-700">
                            Folder: {selectedFiles[0].webkitRelativePath.split('/')[0]}
                          </div>
                          <div className="text-xs text-green-600">
                            {selectedFiles.length} files selected from folder structure
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-green-600">
                          {selectedFiles.length} individual file(s) selected
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!selectedFolder || !selectedPermissions || !selectedFiles || selectedFiles.length === 0}
                  onClick={handleDocumentUpload}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {selectedFiles ? selectedFiles.length : 0} Document(s)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📊 Document Analytics</CardTitle>
                <CardDescription>Processing status and storage overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Documents</span>
                    <Badge variant="secondary">
                      {Array.isArray(documentsData) ? documentsData.length : 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Processed & Indexed</span>
                    <Badge variant="secondary">47</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Pending Analysis</span>
                    <Badge variant="destructive">12</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Storage Used</span>
                    <Badge variant="outline">2.4 GB</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Document Management</CardTitle>
                  <CardDescription>Search, filter, and manage all {Array.isArray(documentsData) ? documentsData.length : 0} documents</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('Button clicked, documentsData:', documentsData?.length);
                      handleRemoveDuplicates();
                    }}
                    disabled={scanDuplicatesMutation.isPending}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    {scanDuplicatesMutation.isPending ? 'Scanning...' : 'Remove Duplicates'}
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={filteredDocuments.length === 0}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Filtered ({filteredDocuments.length})
                  </Button>
                  <Badge variant="secondary">{filteredDocuments.length} of {Array.isArray(documentsData) ? documentsData.length : 0} shown</Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search documents by name..."
                    value={documentSearchTerm}
                    onChange={(e) => setDocumentSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={documentFilter} onValueChange={setDocumentFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Documents</SelectItem>
                    <SelectItem value="pdf">PDF Files</SelectItem>
                    <SelectItem value="text">Text Files</SelectItem>
                    <SelectItem value="csv">CSV Files</SelectItem>
                    <SelectItem value="recent">Recent (24h)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredDocuments.map((doc: DocumentEntry) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="w-4 h-4 text-green-500" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{doc.originalName}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{doc.mimeType}</span>
                            <span>•</span>
                            <span>{Math.round(doc.size / 1024)} KB</span>
                            <span>•</span>
                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {doc.folderId || 'general'}
                        </Badge>
                        <Button size="sm" variant="ghost" title="View Document">
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" title="Download">
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" title="Edit">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          title="Delete"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredDocuments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No documents match your search criteria</p>
                      <p className="text-sm">Try adjusting your search or filter</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Prompts Tab */}
        <TabsContent value="prompts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">AI Prompt Management</h2>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => setShowCreatePrompt(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Prompt Template
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-2 border-purple-500">
              <CardHeader>
                <CardTitle className="text-purple-600">🤖 Create AI Prompt Template</CardTitle>
                <CardDescription>Design custom prompts for specific use cases</CardDescription>
              </CardHeader>
              <CardContent>
                {showCreatePrompt ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Template Name</Label>
                      <Input 
                        placeholder="e.g., Merchant Analysis Assistant"
                        className="mt-1"
                        value={newPromptName}
                        onChange={(e) => setNewPromptName(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <Input 
                        placeholder="What this prompt template is used for"
                        className="mt-1"
                        value={newPromptDescription}
                        onChange={(e) => setNewPromptDescription(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Prompt Template</Label>
                      <Textarea 
                        placeholder="You are an expert merchant services advisor. Help analyze {merchant_type} businesses..."
                        className="mt-1 min-h-[120px]"
                        value={newPromptTemplate}
                        onChange={(e) => setNewPromptTemplate(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Category</Label>
                        <Select value={newPromptCategory} onValueChange={setNewPromptCategory}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="system">System Prompt</SelectItem>
                            <SelectItem value="admin">Admin Prompt</SelectItem>
                            <SelectItem value="assistant">Assistant Prompt</SelectItem>
                            <SelectItem value="analysis">Analysis Prompt</SelectItem>
                            <SelectItem value="customer">Customer Service</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Temperature</Label>
                        <Input 
                          type="number"
                          min="0"
                          max="2"
                          step="0.1"
                          className="mt-1"
                          value={newPromptTemperature}
                          onChange={(e) => setNewPromptTemperature(parseFloat(e.target.value))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Max Tokens</Label>
                      <Input 
                        type="number"
                        min="100"
                        max="4000"
                        step="100"
                        className="mt-1"
                        value={newPromptMaxTokens}
                        onChange={(e) => setNewPromptMaxTokens(parseInt(e.target.value))}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleCreatePrompt} 
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                        disabled={createPromptMutation.isPending}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {createPromptMutation.isPending ? 'Creating...' : 'Create Template'}
                      </Button>
                      <Button onClick={() => setShowCreatePrompt(false)} variant="outline">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Button onClick={() => setShowCreatePrompt(true)} className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Start Creating Template
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-500">
              <CardHeader>
                <CardTitle className="text-orange-600">⚙️ AI Agent Controls</CardTitle>
                <CardDescription>Fine-tune AI behavior and system prompts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Global Temperature</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        className="flex-1"
                        defaultValue="0.7"
                      />
                      <span className="text-sm font-mono w-8">0.7</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Controls randomness (0=focused, 2=creative)</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Response Length</Label>
                    <Select defaultValue="medium">
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short (500 tokens)</SelectItem>
                        <SelectItem value="medium">Medium (1000 tokens)</SelectItem>
                        <SelectItem value="long">Long (2000 tokens)</SelectItem>
                        <SelectItem value="detailed">Detailed (4000 tokens)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save AI Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System & Admin Prompts</CardTitle>
              <CardDescription>Manage core AI prompts that control system behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {Array.isArray(promptTemplates) && promptTemplates.length > 0 ? (
                    promptTemplates.map((template: PromptTemplate) => (
                      <Card key={template.id} className="border">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-sm">{template.name}</CardTitle>
                              <CardDescription className="text-xs">{template.description}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{template.category}</Badge>
                              <Button size="sm" variant="ghost">
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                            {template.template.length > 150 ? 
                              `${template.template.substring(0, 150)}...` : 
                              template.template
                            }
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Temp: {template.temperature}</span>
                            <span>Tokens: {template.maxTokens}</span>
                            <span className={`${template.isActive ? 'text-green-600' : 'text-red-600'}`}>
                              {template.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No prompt templates found</p>
                      <p className="text-sm">Create your first template above</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training & Feedback Tab */}
        <TabsContent value="training" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Training & Feedback Center</h2>
            <Badge variant="outline" className="text-lg px-3 py-1">
              AI Interaction Monitoring
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Analytics Overview */}
            <Card className="border-2 border-green-500">
              <CardHeader>
                <CardTitle className="text-green-600 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Interactions</span>
                    <Badge variant="secondary">{trainingAnalytics?.totalInteractions || 47}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Success Rate</span>
                    <Badge variant="secondary" className="text-green-600">94%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Avg Response Time</span>
                    <Badge variant="outline">2.3s</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">User Satisfaction</span>
                    <Badge variant="secondary">4.2/5</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Real-time Monitoring */}
            <Card className="border-2 border-blue-500">
              <CardHeader>
                <CardTitle className="text-blue-600 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Real-time Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Sessions</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">3 online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Queue Status</span>
                    <Badge variant="outline">0 pending</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Response Quality</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <Star className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Error Rate</span>
                    <Badge variant="destructive">0.3%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Training Progress */}
            <Card className="border-2 border-purple-500">
              <CardHeader>
                <CardTitle className="text-purple-600 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Training Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Knowledge Base Coverage</span>
                      <span className="text-sm">78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Response Accuracy</span>
                      <span className="text-sm">92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Context Understanding</span>
                      <span className="text-sm">85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Document Integration</span>
                      <span className="text-sm">71%</span>
                    </div>
                    <Progress value={71} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interaction History and Feedback */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent AI Interactions</CardTitle>
                <CardDescription>Latest user queries and AI responses for quality review</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium">Sales Agent Query</span>
                        </div>
                        <Badge variant="outline" className="text-xs">2 min ago</Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">"What are the processing rates for a high-volume restaurant chain?"</p>
                      <div className="text-xs text-gray-500 mb-2">AI Response: Processing rates for high-volume restaurant chains typically...</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3 text-green-500" />
                          <span className="text-xs">Helpful</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Timer className="w-3 h-3 text-gray-400" />
                          <span className="text-xs">1.8s</span>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium">Document Analysis</span>
                        </div>
                        <Badge variant="outline" className="text-xs">5 min ago</Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">"Analyze this merchant statement and identify cost savings"</p>
                      <div className="text-xs text-gray-500 mb-2">AI Response: Based on the statement analysis, I identified 3 key areas...</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3 text-green-500" />
                          <span className="text-xs">Very Helpful</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Timer className="w-3 h-3 text-gray-400" />
                          <span className="text-xs">3.2s</span>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium">Technical Support</span>
                        </div>
                        <Badge variant="outline" className="text-xs">12 min ago</Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">"How do I set up recurring billing for a subscription service?"</p>
                      <div className="text-xs text-gray-500 mb-2">AI Response: For subscription services, you'll need to configure...</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <ThumbsDown className="w-3 h-3 text-red-500" />
                          <span className="text-xs">Needs improvement</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Timer className="w-3 h-3 text-gray-400" />
                          <span className="text-xs">4.1s</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feedback Analysis</CardTitle>
                <CardDescription>User satisfaction trends and improvement areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-sm mb-3">Satisfaction by Category</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs">Pricing Questions</span>
                          <span className="text-xs">4.8/5</span>
                        </div>
                        <Progress value={96} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs">Document Analysis</span>
                          <span className="text-xs">4.5/5</span>
                        </div>
                        <Progress value={90} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs">Technical Support</span>
                          <span className="text-xs">3.8/5</span>
                        </div>
                        <Progress value={76} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs">General Inquiries</span>
                          <span className="text-xs">4.2/5</span>
                        </div>
                        <Progress value={84} className="h-2" />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-sm mb-3">Improvement Areas</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                        <span>Technical documentation needs more examples</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                        <span>Response time for complex queries can be improved</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>Pricing analysis accuracy is excellent</span>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Detailed Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Training Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Training Management</CardTitle>
              <CardDescription>Tools for improving AI performance and knowledge base quality</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
                  <BookOpen className="w-5 h-5 mb-1" />
                  <span className="text-xs">Update Knowledge Base</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
                  <Brain className="w-5 h-5 mb-1" />
                  <span className="text-xs">Retrain AI Model</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
                  <Target className="w-5 h-5 mb-1" />
                  <span className="text-xs">Run Quality Tests</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
                  <Download className="w-5 h-5 mb-1" />
                  <span className="text-xs">Export Training Data</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Duplicate Preview Modal */}
      <Dialog open={showDuplicateModal} onOpenChange={setShowDuplicateModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Duplicate Documents Found</DialogTitle>
            <DialogDescription>
              Review the duplicates found before removing them. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {duplicatePreview && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="font-semibold text-lg">{duplicatePreview.totalProcessed}</div>
                  <div className="text-gray-600">Database Records</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="font-semibold text-lg">{duplicatePreview.validFiles || 0}</div>
                  <div className="text-gray-600">Valid Files</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded">
                  <div className="font-semibold text-lg">{duplicatePreview.missingFiles?.length || 0}</div>
                  <div className="text-gray-600">Phantom Records</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded">
                  <div className="font-semibold text-lg">{duplicatePreview.duplicateGroups?.length || 0}</div>
                  <div className="text-gray-600">True Duplicates</div>
                </div>
              </div>

              {duplicatePreview.missingFiles?.length > 0 && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <div className="font-semibold text-orange-800">Data Integrity Issue Detected</div>
                  </div>
                  <p className="text-orange-700 text-sm">
                    Found {duplicatePreview.missingFiles.length} phantom database records with no corresponding files. 
                    These are leftover entries from failed uploads or file system cleanup. 
                    From your original 115 documents, you currently have {duplicatePreview.validFiles} valid files.
                  </p>
                </div>
              )}

              {duplicatePreview.missingFiles?.length === 0 && duplicatePreview.duplicateGroups?.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-semibold mb-2">No Issues Found!</h3>
                  <p className="text-gray-600">Your document library is clean. No phantom records or duplicates detected.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {duplicatePreview.duplicateGroups?.length > 0 && (
                    <div>
                      <h4 className="font-semibold">True Duplicate Groups:</h4>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                      {duplicatePreview.duplicateGroups?.map((group, index) => (
                        <Card key={index} className="border">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">
                                Original: {group.original.originalName}
                              </div>
                              <Badge variant="outline">
                                {group.duplicates.length} duplicate{group.duplicates.length > 1 ? 's' : ''}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(group.original.createdAt).toLocaleDateString()} • {Math.round(group.original.size / 1024)} KB
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-red-600">Duplicates to be removed:</div>
                              {group.duplicates.map((duplicate) => (
                                <div key={duplicate.id} className="flex items-center justify-between p-2 bg-red-50 rounded text-sm">
                                  <div>
                                    <div className="font-medium">{duplicate.originalName}</div>
                                    <div className="text-gray-500">
                                      {new Date(duplicate.createdAt).toLocaleDateString()} • {Math.round(duplicate.size / 1024)} KB
                                    </div>
                                  </div>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                  
                  {duplicatePreview.missingFiles?.length > 0 && (
                    <Card className="border border-orange-200">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <div className="font-medium">Phantom Records (No Files)</div>
                          <Badge variant="outline" className="bg-orange-50">
                            {duplicatePreview.missingFiles.length} record{duplicatePreview.missingFiles.length > 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          Database entries without corresponding files - these will be removed
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[200px]">
                          <div className="space-y-2">
                            {duplicatePreview.missingFiles.slice(0, 10).map((missing) => (
                              <div key={missing.id} className="flex items-center justify-between p-2 bg-orange-50 rounded text-sm">
                                <div>
                                  <div className="font-medium">{missing.originalName}</div>
                                  <div className="text-gray-500">Path: {missing.path}</div>
                                </div>
                                <Trash2 className="w-4 h-4 text-orange-500" />
                              </div>
                            ))}
                            {duplicatePreview.missingFiles.length > 10 && (
                              <div className="text-center text-gray-500 text-sm py-2">
                                ... and {duplicatePreview.missingFiles.length - 10} more phantom records
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicateModal(false)}>
              Cancel
            </Button>
            {duplicatePreview?.totalDuplicates > 0 && (
              <Button 
                variant="destructive" 
                onClick={confirmRemoveDuplicates}
                disabled={removeDuplicatesMutation.isPending}
              >
                {removeDuplicatesMutation.isPending ? 'Removing...' : `Remove ${duplicatePreview.totalDuplicates} Duplicates`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};