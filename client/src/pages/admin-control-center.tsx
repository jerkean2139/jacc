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

export function AdminControlCenter() {
  const [activeSection, setActiveSection] = useState('qa');
  const [searchTerm, setSearchTerm] = useState('');

  // Data fetching
  const { data: faqData = [] } = useQuery({
    queryKey: ['/api/admin/faq'],
    retry: false,
  });

  const { data: documentsData = [] } = useQuery({
    queryKey: ['/api/admin/documents'],
    retry: false,
  });

  const { data: promptTemplates = [] } = useQuery({
    queryKey: ['/api/admin/prompt-templates'],
    retry: false,
  });

  const { data: trainingInteractions = [] } = useQuery({
    queryKey: ['/api/admin/training/interactions'],
    retry: false,
  });

  const { data: trainingAnalytics = {} } = useQuery({
    queryKey: ['/api/admin/training/analytics'],
    retry: false,
  });

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
        <h1 className="text-3xl font-bold text-red-600">UPDATED Admin Control Center</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Complete system management with reorganized Q&A layout
        </p>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="qa">Q&A Knowledge</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="prompts">AI Prompts</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
        </TabsList>

        {/* Q&A Knowledge Base - FIXED LAYOUT */}
        <TabsContent value="qa" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Q&A Knowledge Base</h2>
            <Input
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT SIDE - Q&A Entry Form */}
            <div className="space-y-4">
              <Card className="border-2 border-blue-500">
                <CardHeader>
                  <CardTitle className="text-blue-600">⭐ Add New Q&A Entry (LEFT SIDE)</CardTitle>
                  <CardDescription>Create questions and answers for the AI knowledge base</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Question/Title</Label>
                      <Input 
                        placeholder="What are the current processing rates for restaurants?"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Answer/Content</Label>
                      <Textarea 
                        placeholder="Detailed answer with specific rates, terms, and guidance..."
                        className="mt-1 min-h-[120px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Category</Label>
                        <Select defaultValue="merchant_services">
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="merchant_services">Merchant Services</SelectItem>
                            <SelectItem value="pos_systems">POS Systems</SelectItem>
                            <SelectItem value="technical_support">Technical Support</SelectItem>
                            <SelectItem value="integrations">Integrations</SelectItem>
                            <SelectItem value="pricing">Pricing & Rates</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Priority</Label>
                        <Select defaultValue="low">
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Q&A Entry
                    </Button>

                    <Separator />

                    <div>
                      <h6 className="font-medium text-sm mb-2">Existing Q&A Entries</h6>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {filteredFAQs.length > 0 ? `${filteredFAQs.length} entries found` : 'No knowledge base entries found.'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {['POS Systems', 'Technical Support', 'Integrations', 'Pricing & Rates', 'General', 'Payment Processing'].map(category => {
                      const count = Array.isArray(faqData) ? faqData.filter((f: FAQ) => f.category === category).length : 0;
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
            </div>

            {/* RIGHT SIDE - FAQ Entries Display */}
            <div>
              <Card className="border-2 border-green-500">
                <CardHeader>
                  <CardTitle className="text-green-600">⭐ FAQ Entries Display (RIGHT SIDE) - {filteredFAQs.length} entries</CardTitle>
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
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Document Center</h2>
            <Button className="bg-green-600 hover:bg-green-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload & Management */}
            <Card className="border-2 border-green-500">
              <CardHeader>
                <CardTitle className="text-green-600">📁 Document Upload</CardTitle>
                <CardDescription>Add documents to the knowledge base</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Drop files here or click to upload</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOC, TXT files supported</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Document Category</Label>
                    <Select defaultValue="knowledge_base">
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="knowledge_base">Knowledge Base</SelectItem>
                        <SelectItem value="training_materials">Training Materials</SelectItem>
                        <SelectItem value="policies">Policies & Procedures</SelectItem>
                        <SelectItem value="product_docs">Product Documentation</SelectItem>
                        <SelectItem value="compliance">Compliance Documents</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Process & Index
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Document Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Document Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Documents</span>
                    <Badge variant="secondary">{Array.isArray(documentsData) ? documentsData.length : 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Indexed Documents</span>
                    <Badge variant="secondary">{Array.isArray(documentsData) ? documentsData.filter((doc: DocumentEntry) => doc.mimeType).length : 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Knowledge Base Entries</span>
                    <Badge variant="secondary">{filteredFAQs.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Processing Queue</span>
                    <Badge variant="outline">0</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Search className="w-4 h-4 mr-2" />
                    Search Documents
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Browse by Category
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Activity className="w-4 h-4 mr-2" />
                    Processing Status
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Export Knowledge Base
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Document List */}
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
              <CardDescription>Manage and view indexed documents</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {Array.isArray(documentsData) && documentsData.length > 0 ? (
                    documentsData.slice(0, 10).map((doc: DocumentEntry) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="font-medium text-sm">{doc.originalName || doc.name}</p>
                            <p className="text-xs text-gray-500">
                              {doc.mimeType} • {Math.round((doc.size || 0) / 1024)} KB • 
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {doc.mimeType?.includes('pdf') ? 'PDF' : 
                             doc.mimeType?.includes('text') ? 'TXT' : 
                             doc.mimeType?.includes('csv') ? 'CSV' : 'DOC'}
                          </Badge>
                          <Button size="sm" variant="ghost">
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No documents uploaded yet</p>
                      <p className="text-sm">Upload documents to build your knowledge base</p>
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
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Prompt Template
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create/Edit Prompt Template */}
            <Card className="border-2 border-purple-500">
              <CardHeader>
                <CardTitle className="text-purple-600">🤖 Create AI Prompt Template</CardTitle>
                <CardDescription>Design custom prompts for specific use cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Template Name</Label>
                    <Input 
                      placeholder="e.g., Merchant Analysis Assistant"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <Input 
                      placeholder="What this prompt template is used for"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Prompt Template</Label>
                    <Textarea 
                      placeholder="You are an expert merchant services advisor. Your role is to analyze {merchant_data} and provide insights on {analysis_type}. Focus on {key_metrics} and ensure your response includes {required_sections}."
                      className="mt-1 min-h-[120px] font-mono text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Category</Label>
                      <Select defaultValue="merchant_analysis">
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="merchant_analysis">Merchant Analysis</SelectItem>
                          <SelectItem value="pricing_comparison">Pricing Comparison</SelectItem>
                          <SelectItem value="technical_support">Technical Support</SelectItem>
                          <SelectItem value="sales_coaching">Sales Coaching</SelectItem>
                          <SelectItem value="document_analysis">Document Analysis</SelectItem>
                          <SelectItem value="general_assistant">General Assistant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Temperature</Label>
                      <Select defaultValue="0.7">
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.1">0.1 (Very Focused)</SelectItem>
                          <SelectItem value="0.3">0.3 (Focused)</SelectItem>
                          <SelectItem value="0.5">0.5 (Balanced)</SelectItem>
                          <SelectItem value="0.7">0.7 (Creative)</SelectItem>
                          <SelectItem value="0.9">0.9 (Very Creative)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Max Tokens</Label>
                      <Select defaultValue="2000">
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="500">500 (Brief)</SelectItem>
                          <SelectItem value="1000">1000 (Standard)</SelectItem>
                          <SelectItem value="2000">2000 (Detailed)</SelectItem>
                          <SelectItem value="4000">4000 (Comprehensive)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700">
                        <Save className="w-4 h-4 mr-2" />
                        Save Template
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Template Variables Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Template Variables</CardTitle>
                <CardDescription>Available variables for dynamic prompts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <code className="text-sm font-mono text-purple-600">{"{merchant_data}"}</code>
                    <p className="text-xs text-gray-600 mt-1">Current merchant information and context</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <code className="text-sm font-mono text-purple-600">{"{user_query}"}</code>
                    <p className="text-xs text-gray-600 mt-1">The user's specific question or request</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <code className="text-sm font-mono text-purple-600">{"{knowledge_base}"}</code>
                    <p className="text-xs text-gray-600 mt-1">Relevant knowledge base content</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <code className="text-sm font-mono text-purple-600">{"{document_context}"}</code>
                    <p className="text-xs text-gray-600 mt-1">Context from uploaded documents</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <code className="text-sm font-mono text-purple-600">{"{analysis_type}"}</code>
                    <p className="text-xs text-gray-600 mt-1">Type of analysis requested</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Existing Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Existing Prompt Templates</CardTitle>
              <CardDescription>Manage and customize AI behavior templates</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {Array.isArray(promptTemplates) && promptTemplates.length > 0 ? (
                    promptTemplates.map((template: PromptTemplate) => (
                      <div key={template.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Brain className="w-5 h-5 text-purple-500" />
                            <div>
                              <h4 className="font-medium">{template.name}</h4>
                              <p className="text-sm text-gray-600">{template.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                            <Badge variant={template.isActive ? "default" : "secondary"} className="text-xs">
                              {template.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Button size="sm" variant="ghost">
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm font-mono">
                            {template.template.length > 200 
                              ? template.template.substring(0, 200) + "..." 
                              : template.template}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Temperature: {template.temperature}</span>
                            <span>Max Tokens: {template.maxTokens}</span>
                            <span>Category: {template.category}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No prompt templates created yet</p>
                      <p className="text-sm">Create templates to customize AI behavior for specific use cases</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training & Feedback Center */}
        <TabsContent value="training" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Training & Feedback Center</h2>
            <Badge variant="outline" className="text-lg px-3 py-1">
              First Interaction Tracking
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Analytics Cards */}
            <Card className="border-2 border-purple-500">
              <CardHeader>
                <CardTitle className="text-purple-600 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Analytics Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total First Interactions</span>
                    <Badge variant="secondary">{(trainingAnalytics as any)?.totalInteractions || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Satisfaction</span>
                    <Badge variant="secondary">{(trainingAnalytics as any)?.averageSatisfaction || 0}/5</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Flagged for Review</span>
                    <Badge variant="destructive">{(trainingAnalytics as any)?.flaggedForReview || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Response Time</span>
                    <Badge variant="outline">{(trainingAnalytics as any)?.averageResponseTime || 0}ms avg</Badge>
                  </div>
                </div>

                <Separator className="my-4" />

                <div>
                  <h6 className="font-medium text-sm mb-2">Response Quality Distribution</h6>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Excellent</span>
                      <div className="flex items-center gap-2">
                        <Progress value={38} className="w-16 h-2" />
                        <span className="text-xs">18</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Good</span>
                      <div className="flex items-center gap-2">
                        <Progress value={47} className="w-16 h-2" />
                        <span className="text-xs">22</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Poor</span>
                      <div className="flex items-center gap-2">
                        <Progress value={15} className="w-16 h-2" />
                        <span className="text-xs">7</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Training Categories */}
            <Card className="border-2 border-blue-500">
              <CardHeader>
                <CardTitle className="text-blue-600 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Training Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries((trainingAnalytics as any)?.categoryBreakdown || {}).map(([category, count], index) => {
                    const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-purple-500'];
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                          <span className="text-sm">{category.replace('_', ' ')}</span>
                        </div>
                        <Badge variant="outline">{count as number}</Badge>
                      </div>
                    );
                  })}
                </div>

                <Separator className="my-4" />

                <div>
                  <h6 className="font-medium text-sm mb-2">Improvement Trends</h6>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs">Week over Week</span>
                      <Badge variant="secondary" className="text-green-600">+12%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs">Month over Month</span>
                      <Badge variant="secondary" className="text-green-600">+28%</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-2 border-orange-500">
              <CardHeader>
                <CardTitle className="text-orange-600 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Review Flagged Interactions
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Training Data
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Training Settings
                  </Button>
                </div>

                <Separator className="my-4" />

                <div>
                  <h6 className="font-medium text-sm mb-2">System Status</h6>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-xs">Training Logger Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-xs">First Chat Detection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-xs">Response Quality Tracking</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* First Interactions Log */}
          <Card className="border-2 border-green-500">
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                First Interactions Log - Real-Time Training Data
              </CardTitle>
              <CardDescription>
                Capturing every user's first message and JACC's first response for training improvement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {Array.isArray(trainingInteractions) && trainingInteractions.length > 0 ? (
                    trainingInteractions.slice(0, 10).map((interaction: any) => (
                      <div key={interaction.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{interaction.trainingCategory || 'general'}</Badge>
                            <Badge variant={interaction.responseQuality === 'excellent' ? 'default' : interaction.responseQuality === 'good' ? 'secondary' : 'destructive'}>
                              {interaction.responseQuality || 'good'}
                            </Badge>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-3 h-3 rounded-full ${
                                    i < (interaction.userSatisfaction || 3) ? 'bg-yellow-400' : 'bg-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Timer className="w-4 h-4" />
                          {interaction.responseTime}ms • {interaction.timestamp}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h6 className="font-medium text-sm mb-1 text-blue-600">User's First Message:</h6>
                          <p className="text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded border-l-4 border-blue-500">
                            {interaction.userFirstMessage || 'No message recorded'}
                          </p>
                        </div>

                        <div>
                          <h6 className="font-medium text-sm mb-1 text-green-600">JACC's First Response:</h6>
                          <p className="text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded border-l-4 border-green-500">
                            {interaction.aiFirstResponse || 'No response recorded'}
                          </p>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline">
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            Good Response
                          </Button>
                          <Button size="sm" variant="outline">
                            <ThumbsDown className="w-4 h-4 mr-1" />
                            Needs Improvement
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Star className="w-3 h-3 mr-1" />
                            Use for Training
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">No training interactions recorded yet</p>
                    <p className="text-sm text-gray-400">Start chatting with JACC to see training data here</p>
                  </div>
                )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminControlCenter;