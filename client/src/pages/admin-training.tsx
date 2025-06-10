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
import { AlertTriangle, Brain, CheckCircle, MessageSquare, Settings, Target, FileText, Eye, Download, ExternalLink, Plus, Edit, Trash2, Save, X, Archive, BookOpen, Database, Upload, Search } from 'lucide-react';
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
  createdAt: string;
  isActive: boolean;
  vectorized: boolean;
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
  const [documentPermissions, setDocumentPermissions] = useState({
    viewAll: true,
    adminOnly: false,
    managerAccess: false,
    agentAccess: true,
    trainingData: true,
    autoVectorize: true
  });
  
  const queryClient = useQueryClient();

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

  const updatePromptMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest('PUT', `/api/admin/prompt-templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prompt-templates'] });
      setEditingPrompt(null);
    },
  });

  const deletePromptMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/admin/prompt-templates/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prompt-templates'] });
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

  const updateKBMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest('PUT', `/api/admin/knowledge-base/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/knowledge-base'] });
      setEditingKBEntry(null);
    },
  });

  const deleteKBMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/admin/knowledge-base/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/knowledge-base'] });
    },
  });

  // Submit feedback correction
  const submitCorrectionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/admin/training/feedback', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/training/feedback'] });
      setSelectedFeedback(null);
    },
  });

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 4: return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 3: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 2: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 4: return 'Critical';
      case 3: return 'High';
      case 2: return 'Medium';
      default: return 'Low';
    }
  };

  const handleDocumentPreview = (source: any) => {
    if (source.url) {
      window.open(source.url, '_blank');
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setDocumentPermissions(prev => {
      const updated = { ...prev, [permission]: checked };
      
      // If "view all" is checked, enable all other permissions except admin-only
      if (permission === 'viewAll' && checked) {
        updated.adminOnly = false;
        updated.managerAccess = true;
        updated.agentAccess = true;
      }
      
      // If admin-only is checked, disable view all and other permissions
      if (permission === 'adminOnly' && checked) {
        updated.viewAll = false;
        updated.managerAccess = false;
        updated.agentAccess = false;
      }
      
      return updated;
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">AI Training & Feedback Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Train the AI system, review responses, and improve knowledge base accuracy
          </p>
        </div>
      </div>

      <Tabs defaultValue="feedback" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="feedback">Response Review</TabsTrigger>
          <TabsTrigger value="emulator">AI Emulator</TabsTrigger>
          <TabsTrigger value="prompts">Prompt Management</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
        </TabsList>

        {/* Response Review Tab */}
        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Training Feedback Queue
              </CardTitle>
              <CardDescription>
                Review AI responses that need attention and provide corrections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(feedbackData) && feedbackData.length > 0 ? (
                  feedbackData.map((item: TrainingFeedback) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(item.priority)}>
                            {getPriorityLabel(item.priority)}
                          </Badge>
                          <Badge variant="outline">{item.feedbackType}</Badge>
                          <Badge variant="secondary">{item.status}</Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium text-sm">User Query:</span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {item.userQuery}
                          </p>
                        </div>
                        
                        <div>
                          <span className="font-medium text-sm">AI Response:</span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {item.aiResponse}
                          </p>
                        </div>
                        
                        {item.correctResponse && (
                          <div>
                            <span className="font-medium text-sm">Suggested Correction:</span>
                            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                              {item.correctResponse}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedFeedback(item)}
                        >
                          Review & Train
                        </Button>
                        <Button size="sm" variant="outline">
                          <Archive className="w-3 h-3 mr-1" />
                          Archive
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No training feedback items found.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Emulator Tab */}
        <TabsContent value="emulator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                AI Response Testing
              </CardTitle>
              <CardDescription>
                Test AI responses with different queries and analyze the results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-query">Test Query</Label>
                <Textarea
                  id="test-query"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  placeholder="Enter a question to test the AI response..."
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={() => testAIMutation.mutate(testQuery)}
                disabled={!testQuery.trim() || testAIMutation.isPending}
                className="w-full"
              >
                {testAIMutation.isPending ? 'Testing...' : 'Test AI Response'}
              </Button>
              
              {testResponseData && (
                <div className="border rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                  <div>
                    <h4 className="font-medium mb-2">AI Response</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {testResponseData.response}
                    </p>
                  </div>
                  
                  {testResponseData.sources && testResponseData.sources.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-3 text-sm">Document Sources ({testResponseData.sources.length})</h5>
                      <div className="space-y-3">
                        {testResponseData.sources.map((source: any, index: number) => (
                          <div key={index} className="border rounded-lg p-3 bg-white dark:bg-gray-900 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h6 className="font-medium text-sm truncate">{source.name}</h6>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <span>Relevance: {Math.round((source.relevanceScore || 0) * 100)}%</span>
                                      <span>•</span>
                                      <span className="capitalize">{source.type || 'document'}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {source.snippet && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                    {source.snippet}
                                  </p>
                                )}
                                
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDocumentPreview(source)}
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    Preview
                                  </Button>
                                  {source.url && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => window.open(source.url, '_blank')}
                                    >
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      Open
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {testResponseData?.reasoning && (
                    <div className="border-t pt-4">
                      <h5 className="font-medium mb-2 text-sm">Response Analysis</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {testResponseData.reasoning}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Good
                </Button>
                <Button variant="outline" className="flex-1">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Needs Correction
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prompt Management Tab */}
        <TabsContent value="prompts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Prompt Templates Management
              </CardTitle>
              <CardDescription>
                Create, edit, and manage AI prompt templates for different merchant services scenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Prompt Form */}
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create New Prompt Template
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="prompt-name">Template Name</Label>
                    <Input
                      id="prompt-name"
                      value={newPrompt.name || ''}
                      onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                      placeholder="e.g., Merchant Onboarding Assistant"
                    />
                  </div>
                  <div>
                    <Label htmlFor="prompt-category">Category</Label>
                    <Select value={newPrompt.category} onValueChange={(value) => setNewPrompt({ ...newPrompt, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="merchant_services">Merchant Services</SelectItem>
                        <SelectItem value="payment_processing">Payment Processing</SelectItem>
                        <SelectItem value="pos_systems">POS Systems</SelectItem>
                        <SelectItem value="pricing_analysis">Pricing Analysis</SelectItem>
                        <SelectItem value="customer_support">Customer Support</SelectItem>
                        <SelectItem value="technical_support">Technical Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="prompt-temperature">Temperature ({newPrompt.temperature})</Label>
                    <Input
                      id="prompt-temperature"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={newPrompt.temperature || 0.7}
                      onChange={(e) => setNewPrompt({ ...newPrompt, temperature: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="prompt-tokens">Max Tokens</Label>
                    <Input
                      id="prompt-tokens"
                      type="number"
                      value={newPrompt.maxTokens || 2000}
                      onChange={(e) => setNewPrompt({ ...newPrompt, maxTokens: parseInt(e.target.value) })}
                      placeholder="2000"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <Label htmlFor="prompt-description">Description</Label>
                  <Input
                    id="prompt-description"
                    value={newPrompt.description || ''}
                    onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
                    placeholder="Brief description of this prompt's purpose"
                  />
                </div>
                <div className="mb-4">
                  <Label htmlFor="prompt-template">Prompt Template</Label>
                  <Textarea
                    id="prompt-template"
                    value={newPrompt.template || ''}
                    onChange={(e) => setNewPrompt({ ...newPrompt, template: e.target.value })}
                    placeholder="Enter the prompt template with placeholders like {query}, {context}, etc."
                    rows={6}
                  />
                </div>
                <Button 
                  onClick={() => createPromptMutation.mutate(newPrompt)}
                  disabled={!newPrompt.name || !newPrompt.template || createPromptMutation.isPending}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {createPromptMutation.isPending ? 'Creating...' : 'Create Template'}
                </Button>
              </div>

              {/* Existing Prompts List */}
              <div className="space-y-4">
                <h3 className="font-medium">Existing Templates</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {Array.isArray(promptTemplates) && promptTemplates.map((template: PromptTemplate) => (
                    <Card key={template.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            v{template.version}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingPrompt(template)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deletePromptMutation.mutate(template.id)}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {template.description}
                      </p>
                      <div className="text-xs text-gray-500 space-y-1 mb-3">
                        <div>Category: <span className="font-medium">{template.category}</span></div>
                        <div>Temperature: <span className="font-medium">{template.temperature}</span></div>
                        <div>Max Tokens: <span className="font-medium">{template.maxTokens}</span></div>
                      </div>
                      <div className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
                        <div className="font-medium mb-1">Template Preview:</div>
                        <div className="truncate">{template.template}</div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Knowledge Base Management
              </CardTitle>
              <CardDescription>
                Create structured Q&A entries for AI training and user support
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add New KB Entry Form */}
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 mb-6">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add New Knowledge Base Entry
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Q&A Structure */}
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Question & Answer
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="kb-category" className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</Label>
                          <Select value={newKBEntry.category} onValueChange={(value) => setNewKBEntry({ ...newKBEntry, category: value })}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="merchant_services">Merchant Services</SelectItem>
                              <SelectItem value="payment_processing">Payment Processing</SelectItem>
                              <SelectItem value="pos_systems">POS Systems</SelectItem>
                              <SelectItem value="pricing_guides">Pricing Guides</SelectItem>
                              <SelectItem value="technical_specs">Technical Specifications</SelectItem>
                              <SelectItem value="compliance">Compliance & Security</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="kb-question" className="text-sm font-medium text-gray-700 dark:text-gray-300">Question/Topic</Label>
                          <Input
                            id="kb-question"
                            value={newKBEntry.title || ''}
                            onChange={(e) => setNewKBEntry({ ...newKBEntry, title: e.target.value })}
                            placeholder="e.g., How do I process a refund in Clover?"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="kb-answer" className="text-sm font-medium text-gray-700 dark:text-gray-300">Answer/Content</Label>
                          <Textarea
                            id="kb-answer"
                            value={newKBEntry.content || ''}
                            onChange={(e) => setNewKBEntry({ ...newKBEntry, content: e.target.value })}
                            placeholder="Provide step-by-step instructions or detailed explanation..."
                            rows={8}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="kb-tags" className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags</Label>
                          <Input
                            id="kb-tags"
                            value={newKBEntry.tags?.join(', ') || ''}
                            onChange={(e) => setNewKBEntry({ ...newKBEntry, tags: e.target.value.split(',').map(t => t.trim()) })}
                            placeholder="refund, clover, pos, transaction"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Settings & Permissions */}
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Entry Settings
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="kb-priority" className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority Level</Label>
                          <Select value={newKBEntry.priority?.toString()} onValueChange={(value) => setNewKBEntry({ ...newKBEntry, priority: parseInt(value) })}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">High Priority</SelectItem>
                              <SelectItem value="2">Medium Priority</SelectItem>
                              <SelectItem value="3">Low Priority</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Access Permissions</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input 
                                type="checkbox" 
                                id="kb-view-all" 
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={documentPermissions.viewAll}
                                onChange={(e) => handlePermissionChange('viewAll', e.target.checked)}
                              />
                              <Label htmlFor="kb-view-all" className="text-sm">Visible to all users</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input 
                                type="checkbox" 
                                id="kb-admin-only" 
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={documentPermissions.adminOnly}
                                onChange={(e) => handlePermissionChange('adminOnly', e.target.checked)}
                              />
                              <Label htmlFor="kb-admin-only" className="text-sm">Admin only</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input 
                                type="checkbox" 
                                id="kb-manager-access" 
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={documentPermissions.managerAccess}
                                onChange={(e) => handlePermissionChange('managerAccess', e.target.checked)}
                              />
                              <Label htmlFor="kb-manager-access" className="text-sm">Manager access</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input 
                                type="checkbox" 
                                id="kb-agent-access" 
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={documentPermissions.agentAccess}
                                onChange={(e) => handlePermissionChange('agentAccess', e.target.checked)}
                              />
                              <Label htmlFor="kb-agent-access" className="text-sm">Agent access</Label>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Training Options</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input 
                                type="checkbox" 
                                id="kb-training-data" 
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={documentPermissions.trainingData}
                                onChange={(e) => handlePermissionChange('trainingData', e.target.checked)}
                              />
                              <Label htmlFor="kb-training-data" className="text-sm">Use for AI training</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input 
                                type="checkbox" 
                                id="kb-auto-vectorize" 
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={documentPermissions.autoVectorize}
                                onChange={(e) => handlePermissionChange('autoVectorize', e.target.checked)}
                              />
                              <Label htmlFor="kb-auto-vectorize" className="text-sm">Enable semantic search</Label>
                            </div>
                          </div>
                        </div>

                        <Button 
                          onClick={() => createKBMutation.mutate(newKBEntry)}
                          disabled={!newKBEntry.title || !newKBEntry.content || createKBMutation.isPending}
                          className="w-full mt-4"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {createKBMutation.isPending ? 'Adding...' : 'Add Knowledge Base Entry'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Existing KB Entries */}
              <div className="space-y-3">
                <h4 className="font-medium">Existing Entries</h4>
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
        </TabsContent>

        {/* Document Library Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Document Library
                </CardTitle>
                <CardDescription>
                  Manage uploaded documents and their vectorization status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Document Filter and Search */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Search documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={documentFilter} onValueChange={setDocumentFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="vectorized">Vectorized</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Document List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {Array.isArray(documentsData) && documentsData.filter((doc: DocumentEntry) => {
                    const matchesSearch = !searchTerm || doc.name.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesFilter = documentFilter === 'all' || 
                      (documentFilter === 'vectorized' && doc.vectorized) ||
                      (documentFilter === 'pending' && !doc.vectorized) ||
                      (documentFilter === 'active' && doc.isActive);
                    return matchesSearch && matchesFilter;
                  }).map((doc: DocumentEntry) => (
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
                  ))}
                </div>

                {/* Document Upload */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4">
                  <div className="text-center mb-4">
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Drag and drop files here or click to upload
                    </p>
                    <Button variant="outline" className="mt-2">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Documents
                    </Button>
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