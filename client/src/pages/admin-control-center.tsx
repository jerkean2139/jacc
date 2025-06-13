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