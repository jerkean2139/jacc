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
  BarChart3, Timer, ChevronDown, ChevronRight, Target, BookOpen
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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

interface TestScenario {
  id: string;
  title: string;
  description: string;
  userQuery: string;
  expectedResponseType: string;
  category: string;
  status: 'passed' | 'failed' | 'pending' | 'needs_review';
  priority: 'high' | 'medium' | 'low';
  responseQuality?: number;
  lastTested?: Date;
}

interface ChatMonitoringData {
  id: string;
  chatId: string;
  userId: string;
  firstUserMessage: string;
  firstAssistantMessage: string;
  totalMessages: number;
  lastActivity: string;
}

export function UnifiedAdminPanel() {
  const [activeSection, setActiveSection] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'folder'>('list');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const [expandedPrompts, setExpandedPrompts] = useState<string[]>([]);

  const queryClient = useQueryClient();

  // Data fetching
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

  const { data: promptTemplates = [] } = useQuery({
    queryKey: ['/api/admin/prompt-templates'],
    retry: false,
  });

  const { data: testingData, isLoading: testingLoading } = useQuery({
    queryKey: ['/api/testing/dashboard'],
    retry: false,
  });

  const { data: chatMonitoringData = [] } = useQuery({
    queryKey: ['/api/admin/chat-monitoring'],
    retry: false,
  });

  const summary = testingData?.summary || {
    totalScenarios: 0,
    passedScenarios: 0,
    failedScenarios: 0,
    needsReview: 0,
    averageQuality: 0,
    averageResponseTime: 0,
  };

  const scenarios: TestScenario[] = testingData?.scenarios || [];
  const recentResults = testingData?.recentResults || [];

  // Mutations
  const runTestMutation = useMutation({
    mutationFn: async (scenarioId: string) => {
      const response = await fetch(`/api/testing/scenarios/${scenarioId}/run`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to run test');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/testing/dashboard'] });
    },
  });

  const runAllTestsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/testing/run-all', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to run all tests');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/testing/dashboard'] });
    },
  });

  const handleRunTest = async (scenarioId: string) => {
    setRunningTests(prev => new Set([...Array.from(prev), scenarioId]));
    try {
      await runTestMutation.mutateAsync(scenarioId);
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(scenarioId);
        return newSet;
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'needs_review':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pricing':
        return <TrendingUp className="h-4 w-4" />;
      case 'pos_systems':
        return <Zap className="h-4 w-4" />;
      case 'processors':
        return <Database className="h-4 w-4" />;
      case 'industry_info':
        return <Globe className="h-4 w-4" />;
      case 'support':
        return <Search className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredScenarios = selectedCategory === 'all' 
    ? scenarios 
    : scenarios.filter(s => s.category === selectedCategory);

  const filteredDocuments = Array.isArray(documentsData) ? documentsData.filter((doc: any) => {
    // Filter by folder selection
    if (selectedFolder !== null && doc.folderId !== selectedFolder) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm && !doc.originalName?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  }) : [];

  const filteredFAQs = Array.isArray(faqData) ? faqData.filter((faq: FAQ) => {
    if (searchTerm && !faq.question.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !faq.answer.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  }) : [];

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Unified Admin Control Center</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Complete system management, monitoring, and configuration hub
        </p>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="qa">Q&A Knowledge</TabsTrigger>
          <TabsTrigger value="documents">Document Center</TabsTrigger>
          <TabsTrigger value="prompts">AI Prompts</TabsTrigger>
          <TabsTrigger value="testing">Chat Testing</TabsTrigger>
          <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
        </TabsList>

        {/* Overview Dashboard */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">FAQ Entries</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{faqData.length}</div>
                <p className="text-xs text-muted-foreground">
                  {faqData.filter((f: FAQ) => f.isActive).length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documentsData.length}</div>
                <p className="text-xs text-muted-foreground">
                  {(documentsData.reduce((sum: number, doc: any) => sum + (doc.size || 0), 0) / 1024 / 1024).toFixed(1)} MB total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Test Scenarios</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalScenarios}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.passedScenarios} passed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{chatMonitoringData.length}</div>
                <p className="text-xs text-muted-foreground">
                  {chatMonitoringData.filter((chat: any) => chat.firstUserMessage).length} with messages
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                onClick={() => setActiveSection('testing')}
                className="flex items-center gap-2 h-16"
              >
                <PlayCircle className="h-5 w-5" />
                Run All Tests
              </Button>
              <Button 
                variant="outline"
                onClick={() => setActiveSection('documents')}
                className="flex items-center gap-2 h-16"
              >
                <Upload className="h-5 w-5" />
                Upload Documents
              </Button>
              <Button 
                variant="outline"
                onClick={() => setActiveSection('qa')}
                className="flex items-center gap-2 h-16"
              >
                <Plus className="h-5 w-5" />
                Add FAQ
              </Button>
              <Button 
                variant="outline"
                onClick={() => setActiveSection('monitoring')}
                className="flex items-center gap-2 h-16"
              >
                <Activity className="h-5 w-5" />
                View Live Chats
              </Button>
            </CardContent>
          </Card>

          {/* System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Testing Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Pass Rate</span>
                    <span>{summary.totalScenarios > 0 ? Math.round((summary.passedScenarios / summary.totalScenarios) * 100) : 0}%</span>
                  </div>
                  <Progress value={summary.totalScenarios > 0 ? (summary.passedScenarios / summary.totalScenarios) * 100 : 0} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Avg Quality</span>
                    <span>{summary.averageQuality.toFixed(1)}/10</span>
                  </div>
                  <Progress value={summary.averageQuality * 10} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentResults.slice(0, 5).map((result: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1">{result.userQuery}</span>
                      <Badge variant={result.qualityScore >= 7 ? "default" : "secondary"}>
                        {result.qualityScore}/10
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Q&A Knowledge Base */}
        <TabsContent value="qa" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Q&A Knowledge Base</h2>
            <div className="flex gap-2">
              <Input
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add FAQ
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>FAQ Entries ({filteredFAQs.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-3">
                      {filteredFAQs.map((faq: FAQ) => (
                        <Collapsible key={faq.id}>
                          <CollapsibleTrigger className="w-full text-left">
                            <div className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="w-4 h-4 text-blue-600" />
                                  <p className="font-medium text-sm">{faq.question}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{faq.category}</Badge>
                                  <ChevronRight className="w-4 h-4 text-gray-500" />
                                </div>
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="ml-6 mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
                              <p className="text-sm text-gray-700 dark:text-gray-300">{faq.answer}</p>
                              <div className="flex items-center justify-between mt-2">
                                <Badge variant={faq.isActive ? "default" : "secondary"}>
                                  {faq.isActive ? "Active" : "Inactive"}
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
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {['POS Systems', 'Technical Support', 'Integrations', 'Pricing & Rates', 'General', 'Payment Processing'].map(category => {
                      const count = faqData.filter((f: FAQ) => f.category === category).length;
                      return (
                        <Button
                          key={category}
                          variant="ghost"
                          className="w-full justify-between"
                          size="sm"
                        >
                          <span>{category}</span>
                          <Badge variant="outline">{count}</Badge>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total FAQs:</span>
                    <span className="font-medium">{faqData.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Active:</span>
                    <span className="font-medium">{faqData.filter((f: FAQ) => f.isActive).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Categories:</span>
                    <span className="font-medium">6</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Document Center */}
        <TabsContent value="documents" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Document Center</h2>
            <div className="flex gap-2">
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button
                variant={viewMode === 'folder' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode(viewMode === 'folder' ? 'list' : 'folder')}
              >
                {viewMode === 'folder' ? 'List View' : 'Folder View'}
              </Button>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>

          {viewMode === 'folder' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Folders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
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
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredDocuments.map((doc: any) => (
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
                            </div>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost">
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}

          {viewMode === 'list' && (
            <Card>
              <CardHeader>
                <CardTitle>All Documents ({filteredDocuments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {filteredDocuments.map((doc: any) => (
                      <div key={doc.id} className="border rounded-lg p-3 bg-white dark:bg-gray-900">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <h6 className="font-medium">{doc.originalName || doc.name}</h6>
                              <p className="text-sm text-gray-500">
                                {(doc.size / 1024).toFixed(1)} KB • {doc.mimeType} • {new Date(doc.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Prompts */}
        <TabsContent value="prompts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">AI Prompt Management</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Prompt
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Prompts & Chains</CardTitle>
              <CardDescription>Configure AI behavior and response patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {Array.isArray(promptTemplates) && promptTemplates.map((template: PromptTemplate) => {
                    const isExpanded = expandedPrompts.includes(template.id);
                    
                    return (
                      <Collapsible
                        key={template.id}
                        open={isExpanded}
                        onOpenChange={() => {
                          setExpandedPrompts(prev => 
                            prev.includes(template.id) 
                              ? prev.filter(id => id !== template.id)
                              : [...prev, template.id]
                          );
                        }}
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
                                  {template.category}
                                </Badge>
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent className="border-t bg-gray-50 dark:bg-gray-800/50">
                            <div className="p-4 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Temperature</Label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm">{template.temperature}</span>
                                    <div className="flex-1 h-2 bg-gray-200 rounded">
                                      <div 
                                        className="h-2 bg-blue-500 rounded" 
                                        style={{ width: `${template.temperature * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Max Tokens</Label>
                                  <p className="text-sm mt-1">{template.maxTokens}</p>
                                </div>
                              </div>
                              
                              <div>
                                <Label className="text-sm font-medium">Template</Label>
                                <Textarea 
                                  value={template.template} 
                                  readOnly 
                                  className="mt-1 min-h-[100px]" 
                                />
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={template.isActive}
                                    readOnly
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <Label className="text-sm">Active</Label>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">
                                    <Edit className="w-3 h-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button size="sm">
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
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Testing */}
        <TabsContent value="testing" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Chat Testing & Emulation</h2>
            <Button 
              onClick={() => runAllTestsMutation.mutate()}
              disabled={runAllTestsMutation.isPending}
              className="flex items-center gap-2"
            >
              <PlayCircle className="h-4 w-4" />
              {runAllTestsMutation.isPending ? 'Running All Tests...' : 'Run All Tests'}
            </Button>
          </div>

          {/* Summary Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Scenarios</p>
                    <p className="text-2xl font-bold">{summary.totalScenarios}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Passed</p>
                    <p className="text-2xl font-bold text-green-600">{summary.passedScenarios}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Average Quality</p>
                    <p className="text-2xl font-bold">{summary.averageQuality.toFixed(1)}/10</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    <p className="text-2xl font-bold">{(summary.averageResponseTime / 1000).toFixed(1)}s</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Test Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle>Test Scenarios</CardTitle>
              <div className="flex gap-2">
                {['all', 'pricing', 'pos_systems', 'processors', 'industry_info', 'support'].map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="capitalize"
                  >
                    {category.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredScenarios.map(scenario => (
                    <Card key={scenario.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(scenario.category)}
                            <CardTitle className="text-lg">{scenario.title}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(scenario.status)}
                            <Badge variant={
                              scenario.status === 'passed' ? 'default' :
                              scenario.status === 'failed' ? 'destructive' :
                              scenario.status === 'needs_review' ? 'secondary' : 'outline'
                            }>
                              {scenario.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{scenario.description}</p>
                        
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-sm font-medium mb-1">Test Query:</p>
                          <p className="text-sm italic">"{scenario.userQuery}"</p>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Expected: {scenario.expectedResponseType.replace('_', ' ')}
                          </span>
                          <Badge variant="outline" className={
                            scenario.priority === 'high' ? 'border-red-500 text-red-500' :
                            scenario.priority === 'medium' ? 'border-yellow-500 text-yellow-500' :
                            'border-gray-500 text-gray-500'
                          }>
                            {scenario.priority} priority
                          </Badge>
                        </div>

                        {scenario.responseQuality && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Quality Score</span>
                              <span>{scenario.responseQuality}/10</span>
                            </div>
                            <Progress value={scenario.responseQuality * 10} className="h-2" />
                          </div>
                        )}

                        <Button
                          onClick={() => handleRunTest(scenario.id)}
                          disabled={runningTests.has(scenario.id)}
                          className="w-full"
                          size="sm"
                        >
                          {runningTests.has(scenario.id) ? 'Running...' : 'Run Test'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Monitoring */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Live Chat Monitoring</h2>
            <Button variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{chatMonitoringData.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {chatMonitoringData.filter((chat: any) => chat.firstUserMessage).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Responses</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {chatMonitoringData.filter((chat: any) => chat.firstAssistantMessage).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Messages/Chat</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {chatMonitoringData.length > 0 
                    ? Math.round(chatMonitoringData.reduce((sum: number, chat: any) => sum + chat.totalMessages, 0) / chatMonitoringData.length)
                    : 0
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {chatMonitoringData.map((chat: any) => (
                    <div key={chat.id} className="border rounded-lg p-4 bg-white dark:bg-gray-900">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">User {chat.userId}</span>
                          <Badge variant="outline">{chat.totalMessages} messages</Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(chat.lastActivity).toLocaleString()}
                        </span>
                      </div>

                      {chat.firstUserMessage && (
                        <div className="mb-2">
                          <p className="text-sm font-medium text-blue-600">First User Message:</p>
                          <p className="text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                            {chat.firstUserMessage}
                          </p>
                        </div>
                      )}

                      {chat.firstAssistantMessage && (
                        <div>
                          <p className="text-sm font-medium text-green-600">AI Response:</p>
                          <p className="text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded">
                            {chat.firstAssistantMessage}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default UnifiedAdminPanel;