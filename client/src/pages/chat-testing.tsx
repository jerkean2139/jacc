import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  PlayCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Search,
  Globe,
  Database,
  Zap
} from 'lucide-react';

interface TestScenario {
  id: string;
  title: string;
  description: string;
  userQuery: string;
  expectedResponseType: 'internal_knowledge' | 'web_search' | 'hybrid';
  expectedKeywords: string[];
  category: 'pricing' | 'pos_systems' | 'processors' | 'industry_info' | 'support';
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'passed' | 'failed' | 'needs_review';
  lastTested?: string;
  aiResponse?: string;
  responseQuality?: number;
  responseTime?: number;
}

interface TestResult {
  scenarioId: string;
  timestamp: string;
  userQuery: string;
  aiResponse: string;
  responseTime: number;
  sourceTypes: string[];
  qualityScore: number;
  passedChecks: string[];
  failedChecks: string[];
  recommendations: string[];
}

interface TestingSummary {
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  needsReview: number;
  averageQuality: number;
  averageResponseTime: number;
  lastTestRun: number | null;
}

export default function ChatTesting() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/testing/dashboard'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const summary: TestingSummary = (dashboardData as any)?.summary || {
    totalScenarios: 0,
    passedScenarios: 0,
    failedScenarios: 0,
    needsReview: 0,
    averageQuality: 0,
    averageResponseTime: 0,
    lastTestRun: null
  };

  const scenarios: TestScenario[] = (dashboardData as any)?.scenarios || [];
  const recentResults: TestResult[] = (dashboardData as any)?.recentResults || [];

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

  const handleRunAllTests = async () => {
    await runAllTestsMutation.mutateAsync();
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

  const getStatusBadge = (status: string) => {
    const variants = {
      passed: 'default',
      failed: 'destructive',
      needs_review: 'secondary',
      pending: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.replace('_', ' ')}
      </Badge>
    );
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

  const categories = ['all', 'pricing', 'pos_systems', 'processors', 'industry_info', 'support'];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Chat Testing & Monitoring</h1>
        <Button 
          onClick={handleRunAllTests}
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

      <Tabs defaultValue="scenarios" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scenarios">Test Scenarios</TabsTrigger>
          <TabsTrigger value="results">Recent Results</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="space-y-4">
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
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

          {/* Test Scenarios Grid */}
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
                      {getStatusBadge(scenario.status)}
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

                  {scenario.lastTested && (
                    <p className="text-xs text-muted-foreground">
                      Last tested: {new Date(scenario.lastTested).toLocaleString()}
                    </p>
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
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {recentResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{result.userQuery}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={result.qualityScore >= 7 ? "default" : "secondary"}>
                            {result.qualityScore}/10
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {(result.responseTime / 1000).toFixed(1)}s
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm font-medium text-green-600 mb-1">Passed Checks:</p>
                          <ul className="text-xs space-y-1">
                            {result.passedChecks.map((check, i) => (
                              <li key={i} className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                {check}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {result.failedChecks.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-red-600 mb-1">Failed Checks:</p>
                            <ul className="text-xs space-y-1">
                              {result.failedChecks.map((check, i) => (
                                <li key={i} className="flex items-center gap-1">
                                  <XCircle className="h-3 w-3 text-red-500" />
                                  {check}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {result.sourceTypes.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium mb-1">Source Types:</p>
                          <div className="flex gap-2">
                            {result.sourceTypes.map((source, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {source.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm">
                        <p className="font-medium mb-1">AI Response:</p>
                        <p className="line-clamp-3">{result.aiResponse}</p>
                      </div>

                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(result.timestamp).toLocaleString()}
                      </p>
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