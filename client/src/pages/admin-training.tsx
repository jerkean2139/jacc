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
import { AlertTriangle, Brain, CheckCircle, MessageSquare, Settings, Target, FileText, Eye, Download, ExternalLink, Plus, Edit, Trash2, Save, X, Archive, BookOpen, Database, Upload, Search, ChevronDown, ChevronRight, Sliders, Folder, FolderOpen } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Slider } from '@/components/ui/slider';
import { apiRequest } from '@/lib/queryClient';

interface TrainingFeedback {
  id: string;
  chatId: string;
  userQuery: string;
  aiResponse: string;
  correctResponse?: string;
  feedbackType: 'incorrect' | 'incomplete' | 'good' | 'needs_training';
  adminNotes?: string;
  status: 'pending' | 'reviewed' | 'trained' | 'resolved';
  priority: number;
  createdAt: string;
  sourceDocs?: any[];
}

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: string;
  temperature: number;
  maxTokens: number;
  isActive: boolean;
  version: number;
}

interface KnowledgeBaseEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  lastUpdated: string;
  author: string;
  isActive: boolean;
  priority: number;
}

interface DocumentEntry {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  userId: string;
  folderId?: string;
  isFavorite: boolean;
  contentHash?: string;
  nameHash?: string;
  isPublic: boolean;
  adminOnly: boolean;
  managerOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

export function AdminTrainingPage() {
  const [selectedFeedback, setSelectedFeedback] = useState<TrainingFeedback | null>(null);
  const [testQuery, setTestQuery] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [testResponseData, setTestResponseData] = useState<any>(null);
  
  // Prompt Management State
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
  const [newPrompt, setNewPrompt] = useState<Partial<PromptTemplate>>({
    name: '',
    description: '',
    category: 'merchant_services',
    template: '',
    temperature: 0.7,
    maxTokens: 2000,
    isActive: true,
    version: 1
  });
  
  // Knowledge Base State
  const [editingKBEntry, setEditingKBEntry] = useState<KnowledgeBaseEntry | null>(null);
  const [newKBEntry, setNewKBEntry] = useState<Partial<KnowledgeBaseEntry>>({
    title: '',
    content: '',
    category: 'merchant_services',
    tags: [],
    isActive: true,
    priority: 1
  });
  
  // Document Management State
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [documentFilter, setDocumentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'folder'>('list');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [documentPermissions, setDocumentPermissions] = useState({
    viewAll: true,
    adminOnly: false,
    managerAccess: false,
    agentAccess: true,
    trainingData: true,
    autoVectorize: true
  });

  // Accordion state for prompt templates
  const [expandedPrompts, setExpandedPrompts] = useState<string[]>([]);
  const [editingPromptValues, setEditingPromptValues] = useState<Record<string, Partial<PromptTemplate>>>({});
  
  const queryClient = useQueryClient();

  // Helper functions for accordion management
  const togglePromptExpansion = (promptId: string) => {
    setExpandedPrompts(prev => 
      prev.includes(promptId) 
        ? prev.filter(id => id !== promptId)
        : [...prev, promptId]
    );
  };

  const updatePromptValue = (promptId: string, field: keyof PromptTemplate, value: any) => {
    setEditingPromptValues(prev => ({
      ...prev,
      [promptId]: {
        ...prev[promptId],
        [field]: value
      }
    }));
  };

  // Fetch FAQ data from the knowledge base
  const { data: qaData = [] } = useQuery({
    queryKey: ['/api/admin/faq'],
    retry: false,
  });

  // Update prompt template mutation
  const updatePromptMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PromptTemplate> }) => {
      return apiRequest(`/api/admin/prompt-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prompt-templates'] });
    }
  });

  // Data fetching
  const { data: feedbackData = [] } = useQuery({
    queryKey: ['/api/admin/training/feedback'],
    retry: false,
  });

  const { data: promptTemplates = [] } = useQuery({
    queryKey: ['/api/admin/prompt-templates'],
    retry: false,
  });

  const { data: knowledgeBaseData = [] } = useQuery({
    queryKey: ['/api/admin/knowledge-base'],
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

  // Debug logging to see what documents data we're getting
  console.log('Documents Data:', documentsData);
  console.log('Documents Array Length:', Array.isArray(documentsData) ? documentsData.length : 'Not an array');
  console.log('Documents Data Type:', typeof documentsData);

  // Test AI response mutation
  const testAIMutation = useMutation({
    mutationFn: async (query: string) => {
      return apiRequest('POST', '/api/admin/training/test', { query, useTestMode: true });
    },
    onSuccess: (data) => {
      setTestResponse(data.response);
      setTestResponseData(data);
    },
  });

  // Mutations for prompt templates
  const createPromptMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/admin/prompt-templates', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prompt-templates'] });
      setNewPrompt({
        name: '',
        description: '',
        category: 'merchant_services',
        template: '',
        temperature: 0.7,
        maxTokens: 2000,
        isActive: true,
        version: 1
      });
    },
  });

  // Mutations for knowledge base
  const createKBMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/admin/knowledge-base', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/knowledge-base'] });
      setNewKBEntry({
        title: '',
        content: '',
        category: 'merchant_services',
        tags: [],
        isActive: true,
        priority: 1
      });
    },
  });

  const deleteKBMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/admin/knowledge-base/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/knowledge-base'] });
    },
  });

  const handlePermissionChange = (key: string, value: boolean) => {
    setDocumentPermissions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Training & Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage AI knowledge base, prompts, and document training system
        </p>
      </div>

      <Tabs defaultValue="knowledge" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="knowledge">Knowledge Base & AI</TabsTrigger>
          <TabsTrigger value="documents">Document Manager</TabsTrigger>
        </TabsList>

        {/* Knowledge Base & AI Tab */}
        <TabsContent value="knowledge" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Q&A Structure */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Knowledge Base Q&A
                  </CardTitle>
                  <CardDescription>
                    Manage questions and answers for the AI knowledge base
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add New Q&A Entry */}
                  <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                    <h4 className="font-medium mb-3">Add New Q&A Entry</h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="kb-title">Question/Title</Label>
                        <Input
                          id="kb-title"
                          placeholder="What are the current processing rates for restaurants?"
                          value={newKBEntry.title}
                          onChange={(e) => setNewKBEntry({...newKBEntry, title: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="kb-content">Answer/Content</Label>
                        <Textarea
                          id="kb-content"
                          placeholder="Detailed answer with specific rates, terms, and guidance..."
                          value={newKBEntry.content}
                          onChange={(e) => setNewKBEntry({...newKBEntry, content: e.target.value})}
                          rows={6}
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label htmlFor="kb-category">Category</Label>
                          <Select value={newKBEntry.category} onValueChange={(value) => setNewKBEntry({...newKBEntry, category: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="merchant_services">Merchant Services</SelectItem>
                              <SelectItem value="processing_rates">Processing Rates</SelectItem>
                              <SelectItem value="pos_systems">POS Systems</SelectItem>
                              <SelectItem value="compliance">Compliance</SelectItem>
                              <SelectItem value="equipment">Equipment</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-24">
                          <Label htmlFor="kb-priority">Priority</Label>
                          <Select value={newKBEntry.priority?.toString()} onValueChange={(value) => setNewKBEntry({...newKBEntry, priority: parseInt(value)})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Low</SelectItem>
                              <SelectItem value="2">Medium</SelectItem>
                              <SelectItem value="3">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button onClick={() => createKBMutation.mutate(newKBEntry)} disabled={createKBMutation.isPending}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Q&A Entry
                      </Button>
                    </div>
                  </div>

                  {/* Existing KB Entries */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Existing Q&A Entries</h4>
                    {Array.isArray(knowledgeBaseData) && knowledgeBaseData.length > 0 ? (
                      <div className="space-y-2">
                        {knowledgeBaseData.map((entry: KnowledgeBaseEntry) => (
                          <div key={entry.id} className="border rounded-lg p-3 bg-white dark:bg-gray-900">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-medium text-sm">{entry.title}</h5>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingKBEntry(entry)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteKBMutation.mutate(entry.id)}
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                              {entry.content}
                            </p>
                            <div className="flex items-center gap-2 text-xs">
                              <Badge variant="outline">{entry.category}</Badge>
                              <span className="text-gray-500">Priority: {entry.priority}</span>
                            </div>
                            {entry.tags?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {entry.tags.map((tag, idx) => (
                                  <span key={idx} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No knowledge base entries found.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: AI Prompt Management */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    AI Prompt Management
                  </CardTitle>
                  <CardDescription>
                    Configure how the AI agent works with prompts and LLM chains
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* System Prompts & Chains - Accordion View */}
                  <div className="space-y-3">
                    <h4 className="font-medium">System Prompts & Chains</h4>
                    {Array.isArray(promptTemplates) && promptTemplates.map((template: PromptTemplate) => {
                      const isExpanded = expandedPrompts.includes(template.id);
                      const currentValues = editingPromptValues[template.id] || template;
                      
                      return (
                        <Collapsible
                          key={template.id}
                          open={isExpanded}
                          onOpenChange={() => togglePromptExpansion(template.id)}
                        >
                          <div className="border rounded-lg bg-white dark:bg-gray-900">
                            <CollapsibleTrigger className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                  )}
                                  <div>
                                    <h5 className="font-medium text-sm">{template.name}</h5>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{template.description}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={template.isActive ? "default" : "secondary"}>
                                    {template.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    v{template.version}
                                  </Badge>
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent className="border-t bg-gray-50 dark:bg-gray-800/50">
                              <div className="p-4 space-y-4">
                                {/* Prompt Template Content */}
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Prompt Template</Label>
                                  <Textarea
                                    value={currentValues.template}
                                    onChange={(e) => updatePromptValue(template.id, 'template', e.target.value)}
                                    placeholder="Enter your prompt template..."
                                    className="min-h-32 font-mono text-sm"
                                  />
                                </div>

                                {/* Controls Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {/* Temperature Control */}
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                      <Sliders className="w-3 h-3" />
                                      Temperature: {currentValues.temperature}
                                    </Label>
                                    <Slider
                                      value={[currentValues.temperature]}
                                      onValueChange={(value) => updatePromptValue(template.id, 'temperature', value[0])}
                                      max={2}
                                      min={0}
                                      step={0.1}
                                      className="w-full"
                                    />
                                  </div>

                                  {/* Max Tokens */}
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">Max Tokens</Label>
                                    <Input
                                      type="number"
                                      value={currentValues.maxTokens}
                                      onChange={(e) => updatePromptValue(template.id, 'maxTokens', parseInt(e.target.value))}
                                      min={1}
                                      max={4000}
                                    />
                                  </div>

                                  {/* Category */}
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">Category</Label>
                                    <Select 
                                      value={currentValues.category}
                                      onValueChange={(value) => updatePromptValue(template.id, 'category', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="merchant_services">Merchant Services</SelectItem>
                                        <SelectItem value="document_analysis">Document Analysis</SelectItem>
                                        <SelectItem value="pricing_comparison">Pricing Comparison</SelectItem>
                                        <SelectItem value="general_support">General Support</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* Additional Settings */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">Name</Label>
                                    <Input
                                      value={currentValues.name}
                                      onChange={(e) => updatePromptValue(template.id, 'name', e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">Description</Label>
                                    <Input
                                      value={currentValues.description}
                                      onChange={(e) => updatePromptValue(template.id, 'description', e.target.value)}
                                    />
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center justify-between pt-2 border-t">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`active-${template.id}`}
                                      checked={currentValues.isActive}
                                      onChange={(e) => updatePromptValue(template.id, 'isActive', e.target.checked)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <Label htmlFor={`active-${template.id}`} className="text-sm">
                                      Active
                                    </Label>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingPromptValues(prev => {
                                          const { [template.id]: _, ...rest } = prev;
                                          return rest;
                                        });
                                      }}
                                    >
                                      <X className="w-3 h-3 mr-1" />
                                      Reset
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        updatePromptMutation.mutate({
                                          id: template.id,
                                          data: currentValues
                                        });
                                      }}
                                      disabled={updatePromptMutation.isPending}
                                    >
                                      <Save className="w-3 h-3 mr-1" />
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      );
                    })}
                  </div>

                  {/* Q&A Knowledge Base from Document Center */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Q&A Knowledge Base</h4>
                    {Array.isArray(qaData) && qaData.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {qaData.map((qa: any, index: number) => (
                          <Collapsible key={index}>
                            <CollapsibleTrigger className="w-full text-left">
                              <div className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-blue-600" />
                                    <p className="font-medium text-sm">{qa.question}</p>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-gray-500" />
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="ml-6 mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
                                <p className="text-sm text-gray-700 dark:text-gray-300">{qa.answer}</p>
                                {qa.category && (
                                  <Badge variant="outline" className="mt-2 text-xs">
                                    {qa.category}
                                  </Badge>
                                )}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No Q&A data available from document center</p>
                      </div>
                    )}
                  </div>

                  {/* AI Training Feedback Summary */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Training Feedback Summary</h4>
                    {Array.isArray(feedbackData) && feedbackData.length > 0 ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                            <strong>Needs Training:</strong> {feedbackData.filter((f: TrainingFeedback) => f.status === 'pending').length}
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                            <strong>Trained:</strong> {feedbackData.filter((f: TrainingFeedback) => f.status === 'resolved').length}
                          </div>
                        </div>
                        {feedbackData.slice(0, 3).map((item: TrainingFeedback) => (
                          <div key={item.id} className="border rounded-lg p-3 bg-yellow-50 dark:bg-yellow-900/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">{item.feedbackType}</Badge>
                              <Badge variant="outline">Priority {item.priority}</Badge>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              <strong>Query:</strong> {item.userQuery}
                            </p>
                            <p className="text-xs text-gray-500">
                              <strong>Issue:</strong> {item.adminNotes}
                            </p>
                          </div>
                        ))}
                        {feedbackData.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{feedbackData.length - 3} more training items
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No training feedback available.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Document Manager Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Document Manager
              </CardTitle>
              <CardDescription>
                Upload documents, manage permissions, and configure AI training options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Document Upload Area */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h4 className="font-medium mb-2">Upload Documents</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Drag and drop files here or click to upload
                  </p>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Files
                  </Button>
                </div>
              </div>

              {/* Document Permissions & AI Training Options */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Document Permissions */}
                <div className="space-y-4">
                  <h4 className="font-medium">Document Permissions</h4>
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="doc-view-all" 
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={documentPermissions.viewAll}
                          onChange={(e) => handlePermissionChange('viewAll', e.target.checked)}
                        />
                        <Label htmlFor="doc-view-all" className="text-sm">Allow all users to view</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="doc-admin-only" 
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={documentPermissions.adminOnly}
                          onChange={(e) => handlePermissionChange('adminOnly', e.target.checked)}
                        />
                        <Label htmlFor="doc-admin-only" className="text-sm">Admin only</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="doc-manager-access" 
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={documentPermissions.managerAccess}
                          onChange={(e) => handlePermissionChange('managerAccess', e.target.checked)}
                        />
                        <Label htmlFor="doc-manager-access" className="text-sm">Manager access</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="doc-agent-access" 
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={documentPermissions.agentAccess}
                          onChange={(e) => handlePermissionChange('agentAccess', e.target.checked)}
                        />
                        <Label htmlFor="doc-agent-access" className="text-sm">Agent access</Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Training Options */}
                <div className="space-y-4">
                  <h4 className="font-medium">AI Training Options</h4>
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="doc-training-data" 
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={documentPermissions.trainingData}
                          onChange={(e) => handlePermissionChange('trainingData', e.target.checked)}
                        />
                        <Label htmlFor="doc-training-data" className="text-sm">Use for AI training</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="doc-auto-vectorize" 
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={documentPermissions.autoVectorize}
                          onChange={(e) => handlePermissionChange('autoVectorize', e.target.checked)}
                        />
                        <Label htmlFor="doc-auto-vectorize" className="text-sm">Auto-vectorize for search</Label>
                      </div>
                      <div className="mt-3">
                        <Label className="text-sm font-medium">Training Priority</Label>
                        <Select>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low Priority</SelectItem>
                            <SelectItem value="medium">Medium Priority</SelectItem>
                            <SelectItem value="high">High Priority</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Document & Folder Management</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                    <Select value={documentFilter} onValueChange={setDocumentFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pdf">PDFs</SelectItem>
                        <SelectItem value="csv">CSVs</SelectItem>
                        <SelectItem value="text">Text Files</SelectItem>
                        <SelectItem value="recent">Recent</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant={viewMode === 'folder' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode(viewMode === 'folder' ? 'list' : 'folder')}
                    >
                      {viewMode === 'folder' ? 'List View' : 'Folder View'}
                    </Button>
                  </div>
                </div>

                {/* Folder View */}
                {viewMode === 'folder' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                    {/* Folders Column */}
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300">Folders</h5>
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        <Button
                          variant={selectedFolder === null ? 'default' : 'ghost'}
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => setSelectedFolder(null)}
                        >
                          <FolderOpen className="w-4 h-4 mr-2" />
                          All Documents ({documentsData.length})
                        </Button>
                        {Array.isArray(foldersData) && foldersData.map((folder: any) => {
                          const folderDocCount = documentsData.filter((doc: any) => doc.folderId === folder.id).length;
                          return (
                            <Button
                              key={folder.id}
                              variant={selectedFolder === folder.id ? 'default' : 'ghost'}
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => setSelectedFolder(folder.id)}
                            >
                              <Folder className="w-4 h-4 mr-2" />
                              {folder.name} ({folderDocCount})
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Document Categories */}
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300">By File Type</h5>
                      <div className="space-y-1">
                        {[
                          { type: 'pdf', label: 'PDF Documents', icon: FileText },
                          { type: 'csv', label: 'CSV Files', icon: Database },
                          { type: 'text', label: 'Text Files', icon: FileText },
                          { type: 'image', label: 'Images', icon: FileText }
                        ].map(({ type, label, icon: Icon }) => {
                          const count = documentsData.filter((doc: any) => 
                            doc.mimeType?.includes(type) || doc.originalName?.toLowerCase().includes(`.${type}`)
                          ).length;
                          return (
                            <Button
                              key={type}
                              variant="ghost"
                              size="sm"
                              className="w-full justify-between"
                              onClick={() => setDocumentFilter(type)}
                            >
                              <div className="flex items-center">
                                <Icon className="w-4 h-4 mr-2" />
                                {label}
                              </div>
                              <Badge variant="outline">{count}</Badge>
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300">Quick Stats</h5>
                      <div className="space-y-2">
                        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                          <div className="flex justify-between">
                            <span>Total Documents:</span>
                            <span className="font-medium">{documentsData.length}</span>
                          </div>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                          <div className="flex justify-between">
                            <span>Total Folders:</span>
                            <span className="font-medium">{foldersData.length}</span>
                          </div>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                          <div className="flex justify-between">
                            <span>Total Size:</span>
                            <span className="font-medium">
                              {(documentsData.reduce((sum: number, doc: any) => sum + (doc.size || 0), 0) / 1024 / 1024).toFixed(1)} MB
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {Array.isArray(documentsData) && documentsData.length > 0 ? (
                    documentsData
                      .filter((doc: any) => {
                        // Filter by folder selection
                        if (selectedFolder !== null && doc.folderId !== selectedFolder) {
                          return false;
                        }
                        
                        // Filter by document type
                        if (documentFilter !== 'all') {
                          if (documentFilter === 'pdf' && !doc.mimeType?.includes('pdf')) return false;
                          if (documentFilter === 'csv' && !doc.mimeType?.includes('csv')) return false;
                          if (documentFilter === 'text' && !doc.mimeType?.includes('text')) return false;
                          if (documentFilter === 'recent') {
                            const weekAgo = new Date();
                            weekAgo.setDate(weekAgo.getDate() - 7);
                            if (new Date(doc.createdAt) < weekAgo) return false;
                          }
                        }
                        
                        // Filter by search term
                        if (searchTerm && !doc.originalName?.toLowerCase().includes(searchTerm.toLowerCase())) {
                          return false;
                        }
                        
                        return true;
                      })
                      .map((doc: any) => (
                      <div key={doc.id} className="border rounded-lg p-3 bg-white dark:bg-gray-900">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <h6 className="font-medium text-sm truncate">{doc.originalName || doc.name}</h6>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                              <span>{(doc.size / 1024).toFixed(1)} KB</span>
                              <span>•</span>
                              <span>{doc.mimeType}</span>
                              <span>•</span>
                              <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={doc.vectorized ? "default" : "secondary"}>
                                {doc.vectorized ? "Vectorized" : "Pending"}
                              </Badge>
                              <Badge variant={doc.isActive ? "default" : "outline"}>
                                {doc.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`/api/documents/${doc.id}/preview`, '_blank')}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`/api/documents/${doc.id}/download`, '_blank')}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No documents uploaded yet</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminTrainingPage;