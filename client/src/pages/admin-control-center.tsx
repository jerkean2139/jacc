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
  ThumbsDown, Star, Copy, AlertCircle, ArrowRight
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
  const [duplicatePreview, setDuplicatePreview] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showDocumentDetails, setShowDocumentDetails] = useState(false);
  
  // Document edit states
  const [editingDocument, setEditingDocument] = useState<DocumentEntry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDocumentName, setEditDocumentName] = useState('');
  const [editDocumentFolder, setEditDocumentFolder] = useState('');
  const [editDocumentPermissions, setEditDocumentPermissions] = useState('admin');
  
  // Documents integration states
  const [integratedDocumentsData, setIntegratedDocumentsData] = useState<any>(null);
  const [documentSearchQuery, setDocumentSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  
  // Tag management states
  const [availableTags, setAvailableTags] = useState<any>({});
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [bulkTagOperation, setBulkTagOperation] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedProcessorType, setSelectedProcessorType] = useState('');

  // Document preview states
  const [previewDocument, setPreviewDocument] = useState<DocumentEntry | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // FAQ edit states
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [showEditFAQModal, setShowEditFAQModal] = useState(false);
  const [editFAQQuestion, setEditFAQQuestion] = useState('');
  const [editFAQAnswer, setEditFAQAnswer] = useState('');
  const [editFAQCategory, setEditFAQCategory] = useState('general');
  const [editFAQPriority, setEditFAQPriority] = useState(1);

  // Knowledge base accordion states
  const [openKnowledgeCategories, setOpenKnowledgeCategories] = useState<string[]>([]);

  // Prompt editing states
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
  const [showEditPromptModal, setShowEditPromptModal] = useState(false);
  const [editPromptName, setEditPromptName] = useState('');
  const [editPromptDescription, setEditPromptDescription] = useState('');
  const [editPromptTemplate, setEditPromptTemplate] = useState('');
  const [editPromptCategory, setEditPromptCategory] = useState('system');
  const [editPromptTemperature, setEditPromptTemperature] = useState(0.7);
  const [editPromptMaxTokens, setEditPromptMaxTokens] = useState(1000);

  // AI Simulator state
  const [testQuery, setTestQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [correctedResponse, setCorrectedResponse] = useState('');
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [showCorrectInterface, setShowCorrectInterface] = useState<boolean | 'correct'>(false);
  const [simulatorHistory, setSimulatorHistory] = useState<Array<{
    id: string;
    query: string;
    originalResponse: string;
    correctedResponse?: string;
    timestamp: string;
    wasCorrected: boolean;
  }>>([]);

  // Chat Review Center states
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showChatReviewModal, setShowChatReviewModal] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('pending');
  const [reviewNotes, setReviewNotes] = useState('');
  const [chatReviewFilter, setChatReviewFilter] = useState('pending');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [messageCorrection, setMessageCorrection] = useState('');



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

  // Fetch integrated documents data
  const { data: integratedDocuments, isLoading: integratedDocumentsLoading } = useQuery({
    queryKey: ['/api/documents'],
  });

  const { data: foldersData } = useQuery({
    queryKey: ['/api/folders'],
  });

  // Chat Review Center data
  const { data: chatReviews, isLoading: chatReviewsLoading } = useQuery({
    queryKey: ['/api/admin/chat-reviews', { status: chatReviewFilter }],
  });

  const { data: chatReviewStats } = useQuery({
    queryKey: ['/api/admin/chat-reviews/stats'],
  });

  const { data: selectedChatDetails } = useQuery({
    queryKey: ['/api/admin/chat-reviews', selectedChatId],
    enabled: !!selectedChatId,
  });

  const { data: trainingInteractions } = useQuery({
    queryKey: ['/api/admin/training/interactions'],
  });

  // Mutations
  const createFAQMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/faq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to create FAQ');
      return response.json();
    },
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
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to create prompt');
      return response.json();
    },
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

  const editDocumentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/documents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/documents'] });
      setShowEditModal(false);
      setEditingDocument(null);
      toast({ title: 'Document updated successfully' });
    },
  });

  const editFAQMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/admin/faq/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to update FAQ');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faq'] });
      setShowEditFAQModal(false);
      setEditingFAQ(null);
      toast({ title: 'FAQ updated successfully' });
    },
  });

  const deleteFAQMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/faq/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete FAQ');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faq'] });
      toast({ title: 'FAQ deleted successfully' });
    },
  });

  const editPromptMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/admin/prompts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to update prompt');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prompts'] });
      setShowEditPromptModal(false);
      setEditingPrompt(null);
      toast({ title: 'Prompt template updated successfully' });
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

  const handleEditFAQ = (faq: FAQ) => {
    setEditingFAQ(faq);
    setEditFAQQuestion(faq.question);
    setEditFAQAnswer(faq.answer);
    setEditFAQCategory(faq.category);
    setEditFAQPriority(faq.priority);
    setShowEditFAQModal(true);
  };

  const handleUpdateFAQ = () => {
    if (!editFAQQuestion.trim() || !editFAQAnswer.trim() || !editingFAQ) {
      toast({ title: 'Please fill in both question and answer', variant: 'destructive' });
      return;
    }

    editFAQMutation.mutate({
      id: editingFAQ.id,
      data: {
        question: editFAQQuestion,
        answer: editFAQAnswer,
        category: editFAQCategory,
        priority: editFAQPriority,
        isActive: true,
      },
    });
  };

  const handleDeleteFAQ = (faqId: number) => {
    if (confirm('Are you sure you want to delete this FAQ entry?')) {
      deleteFAQMutation.mutate(faqId);
    }
  };

  const toggleKnowledgeCategory = (category: string) => {
    setOpenKnowledgeCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Document handlers
  const handlePreviewDocument = (document: DocumentEntry) => {
    setPreviewDocument(document);
    setShowPreviewModal(true);
  };

  const handleDownloadDocument = (doc: DocumentEntry) => {
    const downloadUrl = `/api/documents/${doc.id}/download`;
    window.open(downloadUrl, '_blank');
  };

  const handleEditDocumentTags = (document: DocumentEntry) => {
    setEditingDocument(document);
    setEditDocumentName(document.name);
    setEditDocumentFolder(document.folderId || '');
    setShowEditModal(true);
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
      
      // Refresh the documents data
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({ title: 'Document moved successfully' });
    } catch (error) {
      console.error('Error moving document:', error);
      toast({ title: 'Failed to move document', variant: 'destructive' });
    }
  };

  const handleEditPrompt = (prompt: PromptTemplate) => {
    setEditingPrompt(prompt);
    setEditPromptName(prompt.name);
    setEditPromptDescription(prompt.description);
    setEditPromptTemplate(prompt.template);
    setEditPromptCategory(prompt.category);
    setEditPromptTemperature(prompt.temperature);
    setEditPromptMaxTokens(prompt.maxTokens);
    setShowEditPromptModal(true);
  };

  const handleUpdatePrompt = () => {
    if (!editPromptName.trim() || !editPromptTemplate.trim() || !editingPrompt) {
      toast({ title: 'Please fill in template name and content', variant: 'destructive' });
      return;
    }

    editPromptMutation.mutate({
      id: editingPrompt.id,
      data: {
        name: editPromptName,
        description: editPromptDescription,
        template: editPromptTemplate,
        category: editPromptCategory,
        temperature: editPromptTemperature,
        maxTokens: editPromptMaxTokens,
        isActive: true,
      },
    });
  };

  // AI Simulator functions
  const testAIQuery = async () => {
    if (!testQuery.trim()) {
      toast({ title: 'Please enter a test query', variant: 'destructive' });
      return;
    }

    setIsTestingAI(true);
    setAiResponse('');
    setShowCorrectInterface(false);

    try {
      const response = await fetch('/api/admin/ai-simulator/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testQuery }),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to test AI query');
      
      const result = await response.json();
      setAiResponse(result.response);
      setShowCorrectInterface(true);
      
    } catch (error) {
      toast({ title: 'Failed to test AI query', variant: 'destructive' });
    } finally {
      setIsTestingAI(false);
    }
  };

  const submitCorrection = async () => {
    if (!correctedResponse.trim()) {
      toast({ title: 'Please enter a corrected response', variant: 'destructive' });
      return;
    }

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

      if (!response.ok) throw new Error('Failed to submit training correction');
      
      // Add to history
      const newEntry = {
        id: `sim-${Date.now()}`,
        query: testQuery,
        originalResponse: aiResponse,
        correctedResponse: correctedResponse,
        timestamp: new Date().toISOString(),
        wasCorrected: true,
      };
      
      setSimulatorHistory(prev => [newEntry, ...prev]);
      
      // Reset form
      setTestQuery('');
      setAiResponse('');
      setCorrectedResponse('');
      setShowCorrectInterface(false);
      
      toast({ title: 'AI training updated successfully' });
      
    } catch (error) {
      toast({ title: 'Failed to submit training correction', variant: 'destructive' });
    }
  };

  const markResponseGood = () => {
    const newEntry = {
      id: `sim-${Date.now()}`,
      query: testQuery,
      originalResponse: aiResponse,
      timestamp: new Date().toISOString(),
      wasCorrected: false,
    };
    
    setSimulatorHistory(prev => [newEntry, ...prev]);
    
    // Reset form
    setTestQuery('');
    setAiResponse('');
    setShowCorrectInterface(false);
    
    toast({ title: 'Response marked as good' });
  };

  const handleEditDocumentModal = (document: DocumentEntry) => {
    setEditingDocument(document);
    setEditDocumentName(document.name);
    setEditDocumentFolder(document.folderId || 'no-folder');
    setEditDocumentPermissions('admin');
    setShowEditModal(true);
  };

  const handleSaveDocumentEdit = () => {
    if (!editingDocument || !editDocumentName.trim()) {
      toast({ title: 'Please provide a document name', variant: 'destructive' });
      return;
    }

    const updateData = {
      name: editDocumentName,
      folderId: editDocumentFolder === 'no-folder' ? null : editDocumentFolder,
      isPublic: editDocumentPermissions === 'public',
      adminOnly: editDocumentPermissions === 'admin',
      managerOnly: editDocumentPermissions === 'manager'
    };

    editDocumentMutation.mutate({
      id: editingDocument.id,
      data: updateData
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

  // Chat Review Center mutations
  const approveChatMutation = useMutation({
    mutationFn: (chatId: string) =>
      apiRequest('/api/admin/chat-reviews/approve', {
        method: 'POST',
        body: JSON.stringify({ chatId, reviewNotes }),
      }),
    onSuccess: () => {
      toast({ title: 'Chat approved successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat-reviews'] });
      setShowChatReviewModal(false);
      setReviewNotes('');
    },
    onError: () => {
      toast({ title: 'Failed to approve chat', variant: 'destructive' });
    },
  });

  const submitMessageCorrectionMutation = useMutation({
    mutationFn: (data: { messageId: string; chatId: string; correctedContent: string; improvementType: string }) =>
      apiRequest('/api/admin/chat-reviews/correct-message', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: 'Message correction submitted' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat-reviews'] });
    },
    onError: () => {
      toast({ title: 'Failed to submit correction', variant: 'destructive' });
    },
  });

  const filteredFAQs = Array.isArray(faqData) ? faqData.filter((faq: FAQ) => {
    return faq.question && faq.answer;
  }) : [];

  const faqCategories = Array.isArray(faqData) ? 
    Array.from(new Set(faqData.map((faq: FAQ) => faq.category))) : [];

  // Filter and sort documents based on search and filter criteria (newest first)
  const filteredDocuments = Array.isArray(documentsData) ? documentsData
    .filter((doc: DocumentEntry) => {
      const matchesSearch = documentSearchTerm === '' || 
        doc.originalName.toLowerCase().includes(documentSearchTerm.toLowerCase()) ||
        doc.name.toLowerCase().includes(documentSearchTerm.toLowerCase());
      
      const matchesFilter = documentFilter === 'all' || 
        (documentFilter === 'pdf' && doc.mimeType === 'application/pdf') ||
        (documentFilter === 'text' && doc.mimeType.includes('text/')) ||
        (documentFilter === 'csv' && doc.mimeType.includes('csv')) ||
        (documentFilter === 'recent' && new Date(doc.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000));
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];

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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="knowledge" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Q&A Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Document Center
          </TabsTrigger>
          <TabsTrigger value="repository" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Documents Repository
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Prompts
          </TabsTrigger>
          <TabsTrigger value="chat-reviews" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Chat Reviews
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Training & Feedback
          </TabsTrigger>
          <TabsTrigger value="simulator" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            AI Simulator
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
                  disabled={!selectedPermissions || !selectedFiles || selectedFiles.length === 0}
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
                    {scanDuplicatesMutation.isPending ? 'Scanning...' : 'Clean Duplicates'}
                  </Button>
                  {filteredDocuments.length < (Array.isArray(documentsData) ? documentsData.length : 0) && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={filteredDocuments.length === 0}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete Filtered ({filteredDocuments.length})
                    </Button>
                  )}
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
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          title="Edit"
                          onClick={() => handleEditDocument(doc)}
                        >
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
              <CardDescription>
                These prompts control how the AI assistant behaves and responds to users. System prompts define the AI's personality, 
                knowledge base instructions, and response formatting. Edit these to customize the AI's expertise in merchant services, 
                payment processing, and sales support.
              </CardDescription>
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
                              <Button size="sm" variant="ghost" onClick={() => handleEditPrompt(template)}>
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

        {/* Chat Review Center Tab */}
        <TabsContent value="chat-reviews" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Chat Review Center</h3>
              <p className="text-sm text-gray-600">Review user conversations and improve AI responses</p>
            </div>
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
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Reviews</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {chatReviewStats?.pending || 0}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-green-600">
                      {chatReviewStats?.approved || 0}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Need Correction</p>
                    <p className="text-2xl font-bold text-red-600">
                      {chatReviewStats?.needsCorrection || 0}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Corrections</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {chatReviewStats?.totalCorrections || 0}
                    </p>
                  </div>
                  <Edit className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Reviews List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat Reviews ({chatReviewFilter})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chatReviewsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {chatReviews && Array.isArray(chatReviews) && chatReviews.length > 0 ? (
                    chatReviews.map((chat: any) => (
                      <div
                        key={chat.chatId}
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedChatId(chat.chatId);
                          setShowChatReviewModal(true);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-gray-900">{chat.chatTitle}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                chat.reviewStatus === 'pending' ? 'bg-orange-100 text-orange-800' :
                                chat.reviewStatus === 'approved' ? 'bg-green-100 text-green-800' :
                                chat.reviewStatus === 'needs_correction' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {chat.reviewStatus || 'pending'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>User: {chat.userName}</span>
                              <span>Messages: {chat.messageCount}</span>
                              <span>Corrections: {chat.correctionsMade || 0}</span>
                              <span>Updated: {new Date(chat.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedChatId(chat.chatId);
                                setShowChatReviewModal(true);
                              }}
                            >
                              Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No chat reviews found for "{chatReviewFilter}" status
                    </div>
                  )}
                </div>
              )}
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
                    <Badge variant="secondary">{trainingAnalytics?.totalInteractions || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Satisfaction</span>
                    <Badge variant="secondary" className={trainingAnalytics?.averageSatisfaction > 0 ? "text-green-600" : ""}>
                      {trainingAnalytics?.averageSatisfaction > 0 ? `${trainingAnalytics.averageSatisfaction}/5` : "No data"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Messages</span>
                    <Badge variant="outline">{trainingAnalytics?.totalMessages || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Flagged for Review</span>
                    <Badge variant="secondary" className={trainingAnalytics?.flaggedForReview > 0 ? "text-orange-600" : ""}>
                      {trainingAnalytics?.flaggedForReview || 0}
                    </Badge>
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

        {/* AI Simulator Tab */}
        <TabsContent value="simulator" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">AI Simulator & Training</h2>
            <Badge variant="outline" className="text-lg px-3 py-1">
              <Target className="w-4 h-4 mr-2" />
              Live Testing & Training
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test Interface */}
            <Card className="border-2 border-blue-500">
              <CardHeader>
                <CardTitle className="text-blue-600 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Test AI Query
                </CardTitle>
                <CardDescription>
                  Enter a query to test how the AI responds. You can then correct the response to improve the system.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-query">Test Query</Label>
                  <Textarea
                    id="test-query"
                    placeholder="Enter a merchant services question to test the AI response..."
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                
                <Button 
                  onClick={testAIQuery} 
                  disabled={isTestingAI || !testQuery.trim()}
                  className="w-full"
                >
                  {isTestingAI ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Testing AI...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Test AI Response
                    </>
                  )}
                </Button>

                {aiResponse && (
                  <div className="mt-4 space-y-4">
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <Label className="text-sm font-semibold text-gray-700">AI Response:</Label>
                      <p className="mt-2 text-sm whitespace-pre-wrap">{aiResponse}</p>
                    </div>

                    {showCorrectInterface && (
                      <div className="space-y-4 p-4 border-2 border-yellow-200 rounded-lg bg-yellow-50">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <Label className="font-semibold">Is this response accurate?</Label>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button onClick={markResponseGood} variant="outline" className="flex-1">
                            <ThumbsUp className="w-4 h-4 mr-2" />
                            Response is Good
                          </Button>
                          <Button 
                            onClick={() => setShowCorrectInterface('correct')} 
                            variant="outline" 
                            className="flex-1"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Needs Correction
                          </Button>
                        </div>

                        {showCorrectInterface === 'correct' && (
                          <div className="space-y-3">
                            <Label htmlFor="corrected-response">Provide Corrected Response:</Label>
                            <Textarea
                              id="corrected-response"
                              placeholder="Enter the correct response to train the AI..."
                              value={correctedResponse}
                              onChange={(e) => setCorrectedResponse(e.target.value)}
                              className="min-h-[120px]"
                            />
                            <Button 
                              onClick={submitCorrection} 
                              className="w-full"
                              disabled={!correctedResponse.trim()}
                            >
                              <Brain className="w-4 h-4 mr-2" />
                              Submit Training Correction
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Training History */}
            <Card className="border-2 border-green-500">
              <CardHeader>
                <CardTitle className="text-green-600 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Training History
                </CardTitle>
                <CardDescription>
                  Recent test queries and training corrections that have improved the AI.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {!trainingInteractions || trainingInteractions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No test queries yet</p>
                      <p className="text-sm">Test AI responses to build training history</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {trainingInteractions.map((entry) => (
                        <div 
                          key={entry.id} 
                          className={`border rounded-lg p-4 ${
                            entry.correctedResponse ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {entry.correctedResponse ? (
                                <Edit className="w-4 h-4 text-orange-600" />
                              ) : (
                                <ThumbsUp className="w-4 h-4 text-green-600" />
                              )}
                              <span className="text-sm font-medium">
                                {entry.correctedResponse ? 'Training Correction' : entry.source === 'admin_test' ? 'AI Simulator Test' : 'User Chat'}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {entry.source}
                              </Badge>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(entry.createdAt).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs font-semibold text-gray-600">Query:</Label>
                              <p className="text-sm">{entry.query}</p>
                            </div>
                            
                            {entry.correctedResponse && (
                              <div>
                                <Label className="text-xs font-semibold text-green-600">Training Update:</Label>
                                <p className="text-sm">{entry.correctedResponse}</p>
                              </div>
                            )}
                            
                            {entry.response && !entry.correctedResponse && (
                              <div>
                                <Label className="text-xs font-semibold text-blue-600">AI Response:</Label>
                                <p className="text-sm text-gray-700">{entry.response.substring(0, 200)}...</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Training Impact Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Training Impact</CardTitle>
              <CardDescription>
                How administrator corrections and feedback improve the AI's performance over time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{trainingInteractions?.length || 0}</div>
                  <div className="text-sm text-gray-600">Total Tests</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {trainingInteractions?.filter(h => h.correctedResponse).length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Corrections Made</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {trainingInteractions?.filter(h => !h.correctedResponse).length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Approved Responses</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {trainingInteractions && trainingInteractions.length > 0 ? 
                      Math.round((trainingInteractions.filter(h => !h.correctedResponse).length / trainingInteractions.length) * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Accuracy Rate</div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-800">How Training Works</span>
                </div>
                <p className="text-blue-700 text-sm">
                  When you correct an AI response, the system automatically updates the knowledge base with your improved answer 
                  and adjusts the AI's prompts to provide more accurate responses to similar queries in the future.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Repository Tab */}
        <TabsContent value="repository" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Documents Repository</h2>
              <p className="text-gray-600 mt-1">Complete document management with folder organization</p>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              {integratedDocuments?.totalDocuments || 0} Total Documents
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Documents Overview Cards */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-blue-600">Repository Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Documents</span>
                    <span className="font-semibold">{integratedDocuments?.totalDocuments || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Folders</span>
                    <span className="font-semibold">{integratedDocuments?.totalFolders || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">With Folders</span>
                    <span className="font-semibold">{integratedDocuments?.documentsWithFolders || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Unassigned</span>
                    <span className="font-semibold text-orange-600">{integratedDocuments?.documentsWithoutFolders || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Search Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Search documents..."
                    value={documentSearchQuery}
                    onChange={(e) => setDocumentSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Folders and Documents */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Document Organization</CardTitle>
                  <CardDescription>Documents organized by folders with real-time data</CardDescription>
                </CardHeader>
                <CardContent>
                  {integratedDocumentsLoading ? (
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
                        onEditDocument={handleEditDocumentTags}
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
      </Tabs>
    </div>
  );
}
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

      {/* Document Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Update document name and folder assignment
            </DialogDescription>
          </DialogHeader>
          
          {editingDocument && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="document-name">Document Name</Label>
                <Input
                  id="document-name"
                  value={editDocumentName}
                  onChange={(e) => setEditDocumentName(e.target.value)}
                  placeholder="Enter document name"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="document-folder">Folder Assignment</Label>
                <Select value={editDocumentFolder} onValueChange={setEditDocumentFolder}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-folder">No Folder (General)</SelectItem>
                    {foldersData?.map((folder: any) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Document Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Size:</span> {Math.round(editingDocument.size / 1024)} KB
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span> {editingDocument.mimeType}
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">ID:</span> {editingDocument.id}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setEditingDocument(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveDocumentEdit}
              disabled={editDocumentMutation.isPending}
            >
              {editDocumentMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FAQ Edit Modal */}
      <Dialog open={showEditFAQModal} onOpenChange={setShowEditFAQModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit FAQ Entry</DialogTitle>
            <DialogDescription>
              Update the question, answer, category, and priority level
            </DialogDescription>
          </DialogHeader>
          
          {editingFAQ && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-faq-question">Question</Label>
                <Input
                  id="edit-faq-question"
                  value={editFAQQuestion}
                  onChange={(e) => setEditFAQQuestion(e.target.value)}
                  placeholder="Enter the question"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-faq-answer">Answer</Label>
                <Textarea
                  id="edit-faq-answer"
                  value={editFAQAnswer}
                  onChange={(e) => setEditFAQAnswer(e.target.value)}
                  placeholder="Enter the detailed answer"
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-faq-category">Category</Label>
                  <Select value={editFAQCategory} onValueChange={setEditFAQCategory}>
                    <SelectTrigger>
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

                <div className="grid gap-2">
                  <Label htmlFor="edit-faq-priority">Priority</Label>
                  <Select value={editFAQPriority.toString()} onValueChange={(value) => setEditFAQPriority(parseInt(value))}>
                    <SelectTrigger>
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

              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium mb-2">FAQ Information</h4>
                <div className="text-sm text-gray-600">
                  <div>ID: {editingFAQ.id}</div>
                  <div>Current Category: {editingFAQ.category}</div>
                  <div>Current Priority: {editingFAQ.priority}</div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditFAQModal(false);
                setEditingFAQ(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateFAQ}
              disabled={editFAQMutation.isPending}
            >
              {editFAQMutation.isPending ? 'Updating...' : 'Update FAQ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prompt Edit Modal */}
      <Dialog open={showEditPromptModal} onOpenChange={setShowEditPromptModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit AI Prompt Template</DialogTitle>
            <DialogDescription>
              Modify the AI prompt template that controls how the assistant responds. These prompts define the AI's behavior, 
              expertise level, and response style for merchant services and payment processing queries.
            </DialogDescription>
          </DialogHeader>
          
          {editingPrompt && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-prompt-name">Template Name</Label>
                <Input
                  id="edit-prompt-name"
                  value={editPromptName}
                  onChange={(e) => setEditPromptName(e.target.value)}
                  placeholder="Enter template name"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-prompt-description">Description</Label>
                <Input
                  id="edit-prompt-description"
                  value={editPromptDescription}
                  onChange={(e) => setEditPromptDescription(e.target.value)}
                  placeholder="Brief description of this prompt's purpose"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-prompt-template">Prompt Template</Label>
                <Textarea
                  id="edit-prompt-template"
                  value={editPromptTemplate}
                  onChange={(e) => setEditPromptTemplate(e.target.value)}
                  placeholder="Enter the AI prompt instructions..."
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  This controls how the AI assistant behaves. Include instructions about merchant services expertise, 
                  response tone, and specific knowledge areas.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-prompt-category">Category</Label>
                  <Select value={editPromptCategory} onValueChange={setEditPromptCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="merchant">Merchant Services</SelectItem>
                      <SelectItem value="technical">Technical Support</SelectItem>
                      <SelectItem value="sales">Sales Assistant</SelectItem>
                      <SelectItem value="analysis">Document Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-prompt-temperature">Temperature</Label>
                  <Input
                    id="edit-prompt-temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={editPromptTemperature}
                    onChange={(e) => setEditPromptTemperature(parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">0=focused, 2=creative</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-prompt-tokens">Max Tokens</Label>
                  <Input
                    id="edit-prompt-tokens"
                    type="number"
                    min="100"
                    max="4000"
                    step="100"
                    value={editPromptMaxTokens}
                    onChange={(e) => setEditPromptMaxTokens(parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">Response length limit</p>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Current Template Info</h4>
                <div className="text-sm text-gray-600">
                  <div>ID: {editingPrompt.id}</div>
                  <div>Category: {editingPrompt.category}</div>
                  <div>Status: {editingPrompt.isActive ? 'Active' : 'Inactive'}</div>
                  <div>Current Length: {editingPrompt.template.length} characters</div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditPromptModal(false);
                setEditingPrompt(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePrompt}
              disabled={editPromptMutation.isPending}
            >
              {editPromptMutation.isPending ? 'Updating...' : 'Update Prompt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <div className="space-y-4">
                  {selectedChatDetails?.messages?.map((message: any) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-blue-50 border-l-4 border-blue-400' 
                          : 'bg-gray-50 border-l-4 border-gray-400'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-sm">
                          {message.role === 'user' ? 'User' : 'AI Assistant'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </span>
                          {message.role === 'assistant' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedMessageId(message.id);
                                setMessageCorrection(message.content);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {message.content}
                      </p>
                      
                      {/* Show correction interface for selected message */}
                      {selectedMessageId === message.id && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <Label htmlFor="message-correction">Improved Response</Label>
                          <Textarea
                            id="message-correction"
                            value={messageCorrection}
                            onChange={(e) => setMessageCorrection(e.target.value)}
                            placeholder="Enter the improved AI response..."
                            className="mt-2 min-h-[100px]"
                          />
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              onClick={() => {
                                submitMessageCorrectionMutation.mutate({
                                  messageId: message.id,
                                  chatId: selectedChatId!,
                                  correctedContent: messageCorrection,
                                  improvementType: 'accuracy'
                                });
                                setSelectedMessageId(null);
                                setMessageCorrection('');
                              }}
                              disabled={submitMessageCorrectionMutation.isPending}
                            >
                              {submitMessageCorrectionMutation.isPending ? 'Submitting...' : 'Submit Correction'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedMessageId(null);
                                setMessageCorrection('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Review & Approval Panel */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Review Status</h4>
                <Select value={reviewStatus} onValueChange={setReviewStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="needs_correction">Needs Correction</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Chat Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Chat Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>User:</span>
                    <span className="font-medium">{selectedChatDetails?.userName || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Created:</span>
                    <span>{selectedChatDetails?.createdAt ? new Date(selectedChatDetails.createdAt).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Messages:</span>
                    <span>{selectedChatDetails?.messages?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Corrections Made:</span>
                    <span className="text-orange-600">{selectedChatDetails?.correctionCount || 0}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Review Notes */}
              <div className="space-y-3">
                <Label htmlFor="review-notes">Review Notes</Label>
                <Textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this conversation review..."
                  className="min-h-[100px]"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    approveChatMutation.mutate(selectedChatId!);
                  }}
                  disabled={approveChatMutation.isPending}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  {approveChatMutation.isPending ? 'Approving...' : 'Approve Chat'}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // Move to next pending chat
                    const currentIndex = chatReviews?.findIndex((chat: any) => chat.chatId === selectedChatId) || 0;
                    const nextChat = chatReviews?.[currentIndex + 1];
                    if (nextChat) {
                      setSelectedChatId(nextChat.chatId);
                      setReviewNotes('');
                    } else {
                      setShowChatReviewModal(false);
                      toast({ title: 'No more chats to review' });
                    }
                  }}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Next Chat
                </Button>
              </div>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Review Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Reviewed Today:</span>
                      <span className="font-medium">
                        {chatReviewStats?.reviewedToday || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pending:</span>
                      <span className="text-orange-600">
                        {chatReviewStats?.pending || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Your Progress:</span>
                      <span className="text-green-600">
                        {Math.round(((chatReviewStats?.approved || 0) / Math.max((chatReviewStats?.total || 1), 1)) * 100)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowChatReviewModal(false);
                setSelectedChatId(null);
                setReviewNotes('');
                setSelectedMessageId(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};