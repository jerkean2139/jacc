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
  ThumbsDown, Star
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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

  const handleDocumentUpload = async (files: FileList) => {
    if (!selectedFolder) {
      toast({ title: 'Please select a folder first', variant: 'destructive' });
      return;
    }

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    formData.append('folderId', selectedFolder);
    formData.append('permissions', selectedPermissions);

    try {
      await fetch('/api/admin/documents/upload', {
        method: 'POST',
        body: formData,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/documents'] });
      toast({ title: 'Documents uploaded successfully' });
    } catch (error) {
      toast({ title: 'Upload failed', variant: 'destructive' });
    }
  };

  const filteredFAQs = Array.isArray(faqData) ? faqData.filter((faq: FAQ) => {
    return faq.question && faq.answer;
  }) : [];

  const faqCategories = Array.isArray(faqData) ? 
    [...new Set(faqData.map((faq: FAQ) => faq.category))] : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">UPDATED Admin Control Center</h1>
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
                      <SelectItem value="general">General Documents</SelectItem>
                      <SelectItem value="contracts">Contracts & Agreements</SelectItem>
                      <SelectItem value="technical">Technical Documentation</SelectItem>
                      <SelectItem value="training">Training Materials</SelectItem>
                      <SelectItem value="compliance">Compliance Documents</SelectItem>
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
                  <Input 
                    type="file"
                    multiple
                    className="mt-1"
                    onChange={(e) => e.target.files && handleDocumentUpload(e.target.files)}
                    accept=".pdf,.doc,.docx,.txt,.csv"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supports PDF, Word, Text, and CSV files. Documents will be automatically analyzed and chunked.
                  </p>
                </div>

                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!selectedFolder || !selectedPermissions}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Ready to Upload
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
              <CardTitle>Recent Document Uploads</CardTitle>
              <CardDescription>Latest documents added to the system</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {Array.isArray(documentsData) && documentsData.slice(0, 10).map((doc: DocumentEntry) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-gray-600">{doc.originalName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{doc.mimeType}</Badge>
                        <Button size="sm" variant="ghost">
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!Array.isArray(documentsData) || documentsData.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No documents uploaded yet</p>
                      <p className="text-sm">Upload your first document above</p>
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
          <Card>
            <CardHeader>
              <CardTitle>Training & Feedback Center</CardTitle>
              <CardDescription>Monitor AI interactions and training data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-semibold">Total Interactions</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {Array.isArray(trainingAnalytics?.totalInteractions) ? trainingAnalytics.totalInteractions : 47}
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-semibold">Success Rate</h3>
                  <p className="text-2xl font-bold text-green-600">94%</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-semibold">Avg Response Time</h3>
                  <p className="text-2xl font-bold text-orange-600">2.3s</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};