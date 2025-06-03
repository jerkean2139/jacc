import React, { useState, useEffect } from 'react';
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
import { AlertTriangle, Brain, CheckCircle, MessageSquare, Settings, Target } from 'lucide-react';
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

export function AdminTrainingPage() {
  const [selectedFeedback, setSelectedFeedback] = useState<TrainingFeedback | null>(null);
  const [testQuery, setTestQuery] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const queryClient = useQueryClient();

  // Fetch training feedback data
  const { data: feedbackData, isLoading } = useQuery({
    queryKey: ['/api/admin/training/feedback'],
    staleTime: 30000,
  });

  // Fetch prompt templates
  const { data: promptTemplates } = useQuery({
    queryKey: ['/api/admin/training/prompts'],
    staleTime: 60000,
  });

  // Test AI response mutation
  const testAIMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest('/api/admin/training/test', {
        method: 'POST',
        body: { query, useTestMode: true }
      });
      return response;
    },
    onSuccess: (data) => {
      setTestResponse(data.response);
    },
  });

  // Submit feedback correction
  const submitCorrectionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/admin/training/feedback', {
        method: 'POST',
        body: data
      });
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feedback List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Pending Reviews
                </CardTitle>
                <CardDescription>
                  Review AI responses that need feedback or correction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div>Loading feedback items...</div>
                ) : feedbackData?.length > 0 ? (
                  feedbackData.map((item: TrainingFeedback) => (
                    <div
                      key={item.id}
                      className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        selectedFeedback?.id === item.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => setSelectedFeedback(item)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-medium text-sm">{item.userQuery}</p>
                        <Badge className={getPriorityColor(item.priority)}>
                          {getPriorityLabel(item.priority)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {item.aiResponse}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{item.feedbackType}</Badge>
                        <Badge variant="outline">{item.status}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No pending feedback items</p>
                )}
              </CardContent>
            </Card>

            {/* Feedback Details */}
            <Card>
              <CardHeader>
                <CardTitle>Review & Correct Response</CardTitle>
                <CardDescription>
                  Provide corrections and training guidance for the AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedFeedback ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">User Query</Label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                        {selectedFeedback.userQuery}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">AI Response</Label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                        {selectedFeedback.aiResponse}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="correctResponse">Correct Response</Label>
                      <Textarea
                        id="correctResponse"
                        placeholder="Provide the correct response that the AI should have given..."
                        className="min-h-32"
                        defaultValue={selectedFeedback.correctResponse || ''}
                      />
                    </div>

                    <div>
                      <Label htmlFor="adminNotes">Training Notes</Label>
                      <Textarea
                        id="adminNotes"
                        placeholder="Notes on what the AI got wrong and how to improve..."
                        defaultValue={selectedFeedback.adminNotes || ''}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="feedbackType">Feedback Type</Label>
                        <Select defaultValue={selectedFeedback.feedbackType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="incorrect">Incorrect</SelectItem>
                            <SelectItem value="incomplete">Incomplete</SelectItem>
                            <SelectItem value="needs_training">Needs Training</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select defaultValue={selectedFeedback.priority.toString()}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Low</SelectItem>
                            <SelectItem value="2">Medium</SelectItem>
                            <SelectItem value="3">High</SelectItem>
                            <SelectItem value="4">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button 
                      onClick={() => submitCorrectionMutation.mutate({
                        feedbackId: selectedFeedback.id,
                        // Add form data here
                      })}
                      className="w-full"
                      disabled={submitCorrectionMutation.isPending}
                    >
                      {submitCorrectionMutation.isPending ? 'Saving...' : 'Save Correction & Train AI'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Select a feedback item to review and correct
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Emulator Tab */}
        <TabsContent value="emulator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                AI Response Emulator
              </CardTitle>
              <CardDescription>
                Test queries against the AI system to see how it responds and identify training needs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="testQuery">Test Query</Label>
                <Textarea
                  id="testQuery"
                  placeholder="Enter a question to test how the AI responds..."
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  className="min-h-24"
                />
              </div>

              <Button 
                onClick={() => testAIMutation.mutate(testQuery)}
                disabled={!testQuery.trim() || testAIMutation.isPending}
                className="w-full"
              >
                {testAIMutation.isPending ? 'Testing...' : 'Test AI Response'}
              </Button>

              {testResponse && (
                <div className="space-y-4">
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium">AI Response</Label>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded border">
                      {testResponse}
                    </div>
                  </div>

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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prompt Management Tab */}
        <TabsContent value="prompts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Prompt Templates
              </CardTitle>
              <CardDescription>
                Manage AI prompt templates and system instructions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {promptTemplates?.map((template: PromptTemplate) => (
                  <Card key={template.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium">{template.name}</h3>
                      <Badge variant={template.isActive ? "default" : "secondary"}>
                        v{template.version}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {template.description}
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Category: {template.category}</div>
                      <div>Temperature: {template.temperature}</div>
                      <div>Max Tokens: {template.maxTokens}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base Management</CardTitle>
              <CardDescription>
                Review and update the AI's knowledge base content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Knowledge base management interface coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminTrainingPage;