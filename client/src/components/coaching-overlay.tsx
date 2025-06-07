import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  DollarSign,
  MessageSquare,
  BookOpen,
  Award,
  Lightbulb,
  BarChart3,
  Eye,
  EyeOff,
  Minimize2,
  Maximize2,
  X
} from 'lucide-react';

interface CoachingTip {
  id: string;
  type: 'opportunity' | 'warning' | 'insight' | 'next-step';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'discovery' | 'presentation' | 'objection' | 'closing' | 'follow-up';
  confidence: number;
  suggestedAction?: string;
  relatedDocs?: string[];
}

interface SalesMetrics {
  callDuration: number;
  questionsAsked: number;
  objections: number;
  nextSteps: number;
  engagementScore: number;
  closingSignals: number;
}

interface ConversationContext {
  stage: 'discovery' | 'presentation' | 'demo' | 'objection-handling' | 'closing' | 'follow-up';
  prospectType: 'new' | 'existing' | 'referral' | 'inbound' | 'cold';
  productInterest: string[];
  painPoints: string[];
  budget?: string;
  timeline?: string;
  decisionMaker?: boolean;
}

export default function CoachingOverlay() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState('tips');
  const [coachingTips, setCoachingTips] = useState<CoachingTip[]>([]);
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics>({
    callDuration: 0,
    questionsAsked: 0,
    objections: 0,
    nextSteps: 0,
    engagementScore: 75,
    closingSignals: 0
  });
  const [context, setContext] = useState<ConversationContext>({
    stage: 'discovery',
    prospectType: 'new',
    productInterest: [],
    painPoints: []
  });

  useEffect(() => {
    // Simulate real-time coaching tips
    const generateCoachingTips = () => {
      const tips: CoachingTip[] = [
        {
          id: '1',
          type: 'opportunity',
          title: 'Perfect Discovery Moment',
          message: 'The prospect just mentioned payment processing challenges. This is an ideal time to ask about their current volume and pain points.',
          priority: 'high',
          category: 'discovery',
          confidence: 92,
          suggestedAction: 'Ask: "What volume are you currently processing monthly, and what specific challenges are you facing with your current processor?"',
          relatedDocs: ['TracerPay Product Features', 'Discovery Question Bank']
        },
        {
          id: '2',
          type: 'warning',
          title: 'Missing Key Qualification',
          message: 'You haven\'t established budget parameters yet. This is critical for proposal preparation.',
          priority: 'medium',
          category: 'discovery',
          confidence: 88,
          suggestedAction: 'Ask about their current processing costs and pain threshold for fees.',
          relatedDocs: ['Qualification Framework', 'Budget Discovery Scripts']
        },
        {
          id: '3',
          type: 'insight',
          title: 'Competitive Intelligence',
          message: 'Based on their current processor mention, they likely have rate issues. TracerPay\'s interchange-plus model could save them 0.15-0.25%.',
          priority: 'high',
          category: 'presentation',
          confidence: 95,
          suggestedAction: 'Present interchange-plus savings calculator and position TracerPay\'s transparent pricing.',
          relatedDocs: ['TracerPay Pricing Guide', 'Competitive Analysis']
        },
        {
          id: '4',
          type: 'next-step',
          title: 'Demo Readiness Check',
          message: 'You\'ve gathered enough discovery information. The prospect is showing interest signals - time to suggest a demo.',
          priority: 'high',
          category: 'presentation',
          confidence: 87,
          suggestedAction: 'Suggest a 15-minute TracerPay demo focused on their specific pain points.',
          relatedDocs: ['Demo Scripts', 'TracerPay Features']
        }
      ];
      setCoachingTips(tips);
    };

    generateCoachingTips();
    
    // Update metrics periodically
    const metricsInterval = setInterval(() => {
      setSalesMetrics(prev => ({
        ...prev,
        callDuration: prev.callDuration + 1,
        engagementScore: Math.min(100, prev.engagementScore + Math.random() * 2 - 1)
      }));
    }, 1000);

    return () => clearInterval(metricsInterval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Target className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'insight': return <Lightbulb className="h-4 w-4" />;
      case 'next-step': return <CheckCircle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (!isVisible) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full h-12 w-12 shadow-lg bg-blue-600 hover:bg-blue-700"
        >
          <Brain className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 w-96 max-h-[calc(100vh-2rem)] z-50 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-sm">Sales Coach</h3>
          <Badge variant="outline" className="text-xs">
            AI-Powered
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(true)}
            className="h-8 w-8 p-0"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
        <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
          <TabsTrigger value="tips" className="text-xs">Tips</TabsTrigger>
          <TabsTrigger value="metrics" className="text-xs">Metrics</TabsTrigger>
          <TabsTrigger value="context" className="text-xs">Context</TabsTrigger>
        </TabsList>

        <div className="max-h-96 overflow-hidden">
          <TabsContent value="tips" className="mt-0 p-0">
            <ScrollArea className="h-96">
              <div className="p-3 space-y-3">
                {coachingTips.map((tip) => (
                  <Card key={tip.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(tip.type)}
                          <CardTitle className="text-sm font-medium">
                            {tip.title}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(tip.priority)}`} />
                          <span className="text-xs text-gray-500">{tip.confidence}%</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                        {tip.message}
                      </p>
                      {tip.suggestedAction && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-xs">
                          <strong>Suggested Action:</strong>
                          <p className="mt-1">{tip.suggestedAction}</p>
                        </div>
                      )}
                      {tip.relatedDocs && tip.relatedDocs.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tip.relatedDocs.map((doc, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              <BookOpen className="h-3 w-3 mr-1" />
                              {doc}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="metrics" className="mt-0 p-0">
            <ScrollArea className="h-96">
              <div className="p-3 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-medium">Call Duration</span>
                    </div>
                    <p className="text-lg font-bold">{formatTime(salesMetrics.callDuration)}</p>
                  </Card>
                  
                  <Card className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium">Questions Asked</span>
                    </div>
                    <p className="text-lg font-bold">{salesMetrics.questionsAsked}</p>
                  </Card>
                  
                  <Card className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="text-xs font-medium">Objections</span>
                    </div>
                    <p className="text-lg font-bold">{salesMetrics.objections}</p>
                  </Card>
                  
                  <Card className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-medium">Next Steps</span>
                    </div>
                    <p className="text-lg font-bold">{salesMetrics.nextSteps}</p>
                  </Card>
                </div>

                <Card className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium">Engagement Score</span>
                    <span className="text-sm font-bold ml-auto">{Math.round(salesMetrics.engagementScore)}%</span>
                  </div>
                  <Progress value={salesMetrics.engagementScore} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {salesMetrics.engagementScore >= 80 ? 'Excellent engagement!' : 
                     salesMetrics.engagementScore >= 60 ? 'Good engagement' : 'Needs improvement'}
                  </p>
                </Card>

                <Card className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium">Closing Signals</span>
                    <span className="text-sm font-bold ml-auto">{salesMetrics.closingSignals}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Budget Questions</span>
                      <span className="font-medium">2</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Timeline Inquiries</span>
                      <span className="font-medium">1</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Implementation Questions</span>
                      <span className="font-medium">0</span>
                    </div>
                  </div>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="context" className="mt-0 p-0">
            <ScrollArea className="h-96">
              <div className="p-3 space-y-4">
                <Card className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Current Stage</span>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {context.stage.replace('-', ' ')}
                  </Badge>
                </Card>

                <Card className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Prospect Type</span>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {context.prospectType}
                  </Badge>
                </Card>

                {context.productInterest.length > 0 && (
                  <Card className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Product Interest</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {context.productInterest.map((product, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {product}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}

                {context.painPoints.length > 0 && (
                  <Card className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Pain Points</span>
                    </div>
                    <div className="space-y-1">
                      {context.painPoints.map((pain, index) => (
                        <div key={index} className="text-xs text-gray-700 dark:text-gray-300">
                          • {pain}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <Card className="p-3">
                  <div className="text-sm font-medium mb-2">Next Recommended Actions</div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-xs">
                      <CheckCircle className="h-3 w-3 text-green-600 mt-0.5" />
                      <span>Ask about current processing volume</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <CheckCircle className="h-3 w-3 text-green-600 mt-0.5" />
                      <span>Identify decision-making process</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <Clock className="h-3 w-3 text-gray-400 mt-0.5" />
                      <span>Schedule technical demo</span>
                    </div>
                  </div>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}