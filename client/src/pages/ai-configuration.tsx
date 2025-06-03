import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Brain, Settings, TrendingUp, Database, Shield, Zap, Activity, BarChart3, Cpu, Search, Filter, AlertTriangle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  isActive: boolean;
  maxTokens: number;
  costPerToken: number;
  isDefault: boolean;
  capabilities: any;
  description: string;
}

interface ModelPerformance {
  modelId: string;
  totalRequests: number;
  successfulRequests: number;
  averageResponseTime: number;
  averageTokensUsed: number;
  totalCost: number;
  userSatisfactionScore: number;
}

interface RetrievalConfig {
  id: string;
  name: string;
  similarityThreshold: number;
  maxResults: number;
  chunkSize: number;
  chunkOverlap: number;
  searchStrategy: string;
  embeddingModel: string;
  isDefault: boolean;
}

export function AIConfigurationPage() {
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [testQuery, setTestQuery] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('7days');
  
  const queryClient = useQueryClient();

  // Data fetching
  const { data: models = [] } = useQuery({
    queryKey: ['/api/admin/ai-models'],
    retry: false,
  });

  const { data: performance = [] } = useQuery({
    queryKey: ['/api/admin/model-performance', performanceFilter],
    retry: false,
  });

  const { data: retrievalConfigs = [] } = useQuery({
    queryKey: ['/api/admin/retrieval-configs'],
    retry: false,
  });

  const { data: systemStats = {} } = useQuery({
    queryKey: ['/api/admin/system-analytics'],
    retry: false,
  });

  // Model management mutations
  const setDefaultModelMutation = useMutation({
    mutationFn: async (modelId: string) => {
      return apiRequest('POST', `/api/admin/ai-models/${modelId}/set-default`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai-models'] });
    },
  });

  const updateModelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest('PUT', `/api/admin/ai-models/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai-models'] });
    },
  });

  // Test AI response
  const testModelMutation = useMutation({
    mutationFn: async ({ modelId, query }: { modelId: string; query: string }) => {
      return apiRequest('POST', '/api/admin/test-model', { modelId, query });
    },
    onSuccess: (data) => {
      setTestResponse(data.response);
    },
  });

  // Retrieval configuration mutations
  const updateRetrievalConfigMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest('PUT', `/api/admin/retrieval-configs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/retrieval-configs'] });
    },
  });

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'anthropic': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'openai': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getSuccessRate = (perf: ModelPerformance) => {
    return perf.totalRequests > 0 ? (perf.successfulRequests / perf.totalRequests) * 100 : 0;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">AI Configuration & Performance</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage AI models, document retrieval, and system performance
          </p>
        </div>
      </div>

      <Tabs defaultValue="models" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="models">AI Models</TabsTrigger>
          <TabsTrigger value="retrieval">Document Retrieval</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="safety">Safety & Compliance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="testing">Model Testing</TabsTrigger>
        </TabsList>

        {/* AI Models Tab */}
        <TabsContent value="models" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model: AIModel) => (
              <Card key={model.id} className={`cursor-pointer transition-all ${model.isDefault ? 'ring-2 ring-blue-500' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <Badge className={getProviderColor(model.provider)}>
                      {model.provider.toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription>{model.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Max Tokens:</span>
                    <span className="font-medium">{model.maxTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Cost per Token:</span>
                    <span className="font-medium">${(model.costPerToken * 1000).toFixed(3)}/K</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    {model.capabilities?.vision && <Badge variant="outline">Vision</Badge>}
                    {model.capabilities?.functions && <Badge variant="outline">Functions</Badge>}
                    {model.capabilities?.reasoning && <Badge variant="outline">Reasoning</Badge>}
                    {model.capabilities?.longContext && <Badge variant="outline">Long Context</Badge>}
                  </div>

                  <div className="flex gap-2 pt-2">
                    {!model.isDefault && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDefaultModelMutation.mutate(model.id)}
                        disabled={setDefaultModelMutation.isPending}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedModel(model)}
                    >
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Model Configuration Panel */}
          {selectedModel && (
            <Card>
              <CardHeader>
                <CardTitle>Configure {selectedModel.name}</CardTitle>
                <CardDescription>Adjust model parameters and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Max Tokens</Label>
                    <Input
                      type="number"
                      value={selectedModel.maxTokens}
                      onChange={(e) => setSelectedModel({
                        ...selectedModel,
                        maxTokens: parseInt(e.target.value)
                      })}
                    />
                  </div>
                  <div>
                    <Label>Cost per Token</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={selectedModel.costPerToken}
                      onChange={(e) => setSelectedModel({
                        ...selectedModel,
                        costPerToken: parseFloat(e.target.value)
                      })}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={selectedModel.isActive}
                    onCheckedChange={(checked) => setSelectedModel({
                      ...selectedModel,
                      isActive: checked
                    })}
                  />
                  <Label>Model Active</Label>
                </div>

                <Button
                  onClick={() => updateModelMutation.mutate({
                    id: selectedModel.id,
                    data: selectedModel
                  })}
                  disabled={updateModelMutation.isPending}
                >
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Document Retrieval Tab */}
        <TabsContent value="retrieval" className="space-y-6">
          {retrievalConfigs.map((config: RetrievalConfig) => (
            <Card key={config.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  {config.name} Configuration
                  {config.isDefault && <Badge>Default</Badge>}
                </CardTitle>
                <CardDescription>
                  Document retrieval and vector search settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Similarity Threshold: {config.similarityThreshold}</Label>
                      <Slider
                        value={[config.similarityThreshold]}
                        onValueChange={([value]) => {
                          const updated = { ...config, similarityThreshold: value };
                          updateRetrievalConfigMutation.mutate({ id: config.id, data: updated });
                        }}
                        min={0.1}
                        max={1.0}
                        step={0.05}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label>Max Results: {config.maxResults}</Label>
                      <Slider
                        value={[config.maxResults]}
                        onValueChange={([value]) => {
                          const updated = { ...config, maxResults: value };
                          updateRetrievalConfigMutation.mutate({ id: config.id, data: updated });
                        }}
                        min={1}
                        max={50}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Chunk Size: {config.chunkSize}</Label>
                      <Slider
                        value={[config.chunkSize]}
                        onValueChange={([value]) => {
                          const updated = { ...config, chunkSize: value };
                          updateRetrievalConfigMutation.mutate({ id: config.id, data: updated });
                        }}
                        min={500}
                        max={2000}
                        step={100}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label>Chunk Overlap: {config.chunkOverlap}</Label>
                      <Slider
                        value={[config.chunkOverlap]}
                        onValueChange={([value]) => {
                          const updated = { ...config, chunkOverlap: value };
                          updateRetrievalConfigMutation.mutate({ id: config.id, data: updated });
                        }}
                        min={0}
                        max={500}
                        step={50}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Search Strategy</Label>
                    <Select
                      value={config.searchStrategy}
                      onValueChange={(value) => {
                        const updated = { ...config, searchStrategy: value };
                        updateRetrievalConfigMutation.mutate({ id: config.id, data: updated });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semantic">Semantic Only</SelectItem>
                        <SelectItem value="keyword">Keyword Only</SelectItem>
                        <SelectItem value="hybrid">Hybrid (Recommended)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Embedding Model</Label>
                    <Select
                      value={config.embeddingModel}
                      onValueChange={(value) => {
                        const updated = { ...config, embeddingModel: value };
                        updateRetrievalConfigMutation.mutate({ id: config.id, data: updated });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text-embedding-3-large">OpenAI Large (Best Quality)</SelectItem>
                        <SelectItem value="text-embedding-3-small">OpenAI Small (Faster)</SelectItem>
                        <SelectItem value="text-embedding-ada-002">OpenAI Ada (Legacy)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Model Performance Metrics
              </CardTitle>
              <CardDescription>
                Response times, success rates, and cost analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {performance.map((perf: ModelPerformance) => {
                  const model = models.find((m: AIModel) => m.id === perf.modelId);
                  const successRate = getSuccessRate(perf);
                  
                  return (
                    <div key={perf.modelId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h6 className="font-medium text-sm">{model?.name || 'Unknown Model'}</h6>
                        <Badge className={getProviderColor(model?.provider || 'unknown')}>
                          {model?.provider?.toUpperCase() || 'N/A'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Requests:</span>
                          <span className="font-medium">{perf.totalRequests.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Success Rate:</span>
                          <span className="font-medium">{successRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Response:</span>
                          <span className="font-medium">{perf.averageResponseTime.toFixed(0)}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Cost:</span>
                          <span className="font-medium">${perf.totalCost.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Success Rate</span>
                          <span>{successRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={successRate} className="h-2" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Safety & Compliance Tab */}
        <TabsContent value="safety" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Content Filtering & Safety
              </CardTitle>
              <CardDescription>
                Configure content filtering rules and compliance checks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch defaultChecked />
                <Label>Enable Content Filtering</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch />
                <Label>Enable Bias Detection</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch />
                <Label>Enable Compliance Checking</Label>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Filter Rules</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <span className="font-medium">Profanity Filter</span>
                      <p className="text-sm text-gray-500">Block inappropriate language</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <span className="font-medium">Sensitive Information</span>
                      <p className="text-sm text-gray-500">Detect and filter personal data</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <span className="font-medium">Business Compliance</span>
                      <p className="text-sm text-gray-500">Industry-specific compliance rules</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Daily Users</p>
                    <p className="text-2xl font-bold">{systemStats.dailyUsers || 0}</p>
                  </div>
                  <Activity className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">AI Requests</p>
                    <p className="text-2xl font-bold">{systemStats.aiRequests || 0}</p>
                  </div>
                  <Cpu className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Documents</p>
                    <p className="text-2xl font-bold">{systemStats.documentCount || 0}</p>
                  </div>
                  <Database className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Cost</p>
                    <p className="text-2xl font-bold">${systemStats.totalCost || 0}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Model Testing Tab */}
        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Model Testing & Comparison
              </CardTitle>
              <CardDescription>
                Test different models with the same query to compare performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Select Model</Label>
                  <Select onValueChange={(value) => setSelectedModel(models.find((m: AIModel) => m.id === value) || null)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a model to test" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.filter((m: AIModel) => m.isActive).map((model: AIModel) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name} ({model.provider})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Test Query</Label>
                  <Input
                    placeholder="Enter a test question..."
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={() => {
                  if (selectedModel && testQuery) {
                    testModelMutation.mutate({ modelId: selectedModel.id, query: testQuery });
                  }
                }}
                disabled={!selectedModel || !testQuery || testModelMutation.isPending}
                className="w-full"
              >
                {testModelMutation.isPending ? 'Testing...' : 'Test Model'}
              </Button>

              {testResponse && (
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                  <h4 className="font-medium mb-2">Model Response:</h4>
                  <p className="text-sm whitespace-pre-wrap">{testResponse}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AIConfigurationPage;