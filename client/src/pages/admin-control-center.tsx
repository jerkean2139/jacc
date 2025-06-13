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
          <Card>
            <CardHeader>
              <CardTitle>Document Center</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Document management interface - {Array.isArray(documentsData) ? documentsData.length : 0} documents</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Prompts Tab */}
        <TabsContent value="prompts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Prompt Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Prompt templates with temperature controls - {Array.isArray(promptTemplates) ? promptTemplates.length : 0} templates</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Training & Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Chat emulator and training feedback system</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminControlCenter;