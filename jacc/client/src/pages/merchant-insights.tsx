import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Lightbulb,
  BarChart3,
  Users,
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface MerchantData {
  businessName: string;
  businessType: string;
  industry: string;
  monthlyVolume: number;
  averageTicket: number;
  transactionCount: number;
  location: string;
  yearsInBusiness: number;
  currentProcessor: string;
  currentRates: {
    qualifiedRate: number;
    monthlyFee: number;
  };
  businessChallenges: string;
  goals: string;
}

interface InsightResponse {
  overallScore: number;
  insights: {
    category: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    actionable: boolean;
    recommendations: string[];
  }[];
  competitiveAnalysis: {
    marketPosition: string;
    opportunities: string[];
    threats: string[];
  };
  growthRecommendations: {
    shortTerm: string[];
    longTerm: string[];
  };
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    mitigation: string[];
  };
}

export default function MerchantInsights() {
  const [merchantData, setMerchantData] = useState<MerchantData>({
    businessName: '',
    businessType: 'retail',
    industry: 'general_retail',
    monthlyVolume: 0,
    averageTicket: 0,
    transactionCount: 0,
    location: '',
    yearsInBusiness: 0,
    currentProcessor: '',
    currentRates: {
      qualifiedRate: 0,
      monthlyFee: 0,
    },
    businessChallenges: '',
    goals: '',
  });

  const [insights, setInsights] = useState<InsightResponse | null>(null);
  const { toast } = useToast();

  const generateInsightsMutation = useMutation({
    mutationFn: async (data: MerchantData) => {
      const response = await apiRequest('POST', '/api/merchant-insights/generate', data);
      return await response.json();
    },
    onSuccess: (response: any) => {
      console.log('=== FRONTEND DEBUG ===');
      console.log('Full API response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      
      // The API returns response.insights, so we need to extract that
      const insightsData = response.insights || response;
      console.log('Extracted insights:', insightsData);
      console.log('Insights type:', typeof insightsData);
      console.log('Insights keys:', Object.keys(insightsData || {}));
      console.log('=== END FRONTEND DEBUG ===');
      
      setInsights(insightsData);
      toast({
        title: "✅ Insights Generated Successfully",
        description: `Complete analysis ready for ${merchantData.businessName}. Scroll down to view results.`,
      });
      
      // Scroll to results section after a brief delay
      setTimeout(() => {
        const resultsSection = document.getElementById('insights-results');
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    },
    onError: (error) => {
      console.error('Insights generation error:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not generate merchant insights. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateInsights = () => {
    if (!merchantData.businessName || !merchantData.monthlyVolume) {
      toast({
        title: "Missing Information",
        description: "Please provide at least business name and monthly volume.",
        variant: "destructive",
      });
      return;
    }
    generateInsightsMutation.mutate(merchantData);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
          <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">Merchant Insights Generator</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered business intelligence and recommendations for merchant services
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Business Information
              </CardTitle>
              <CardDescription>
                Enter merchant details for comprehensive analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={merchantData.businessName}
                    onChange={(e) => setMerchantData(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder="e.g. Joe's Coffee Shop"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={merchantData.location}
                    onChange={(e) => setMerchantData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. Austin, TX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select value={merchantData.businessType} onValueChange={(value) => setMerchantData(prev => ({ ...prev, businessType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="automotive">Automotive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="yearsInBusiness">Years in Business</Label>
                  <Input
                    id="yearsInBusiness"
                    type="number"
                    value={merchantData.yearsInBusiness || ''}
                    onChange={(e) => setMerchantData(prev => ({ ...prev, yearsInBusiness: parseInt(e.target.value) || 0 }))}
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="monthlyVolume">Monthly Volume ($)</Label>
                  <Input
                    id="monthlyVolume"
                    type="number"
                    value={merchantData.monthlyVolume || ''}
                    onChange={(e) => setMerchantData(prev => ({ ...prev, monthlyVolume: parseFloat(e.target.value) || 0 }))}
                    placeholder="50000"
                  />
                </div>
                <div>
                  <Label htmlFor="averageTicket">Average Ticket ($)</Label>
                  <Input
                    id="averageTicket"
                    type="number"
                    value={merchantData.averageTicket || ''}
                    onChange={(e) => setMerchantData(prev => ({ ...prev, averageTicket: parseFloat(e.target.value) || 0 }))}
                    placeholder="85"
                  />
                </div>
                <div>
                  <Label htmlFor="transactionCount">Transactions/Month</Label>
                  <Input
                    id="transactionCount"
                    type="number"
                    value={merchantData.transactionCount || ''}
                    onChange={(e) => setMerchantData(prev => ({ ...prev, transactionCount: parseInt(e.target.value) || 0 }))}
                    placeholder="588"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="currentProcessor">Current Processor</Label>
                <Input
                  id="currentProcessor"
                  value={merchantData.currentProcessor}
                  onChange={(e) => setMerchantData(prev => ({ ...prev, currentProcessor: e.target.value }))}
                  placeholder="e.g. Square, Stripe, Chase"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="qualifiedRate">Current Rate (%)</Label>
                  <Input
                    id="qualifiedRate"
                    type="number"
                    step="0.01"
                    value={merchantData.currentRates.qualifiedRate || ''}
                    onChange={(e) => setMerchantData(prev => ({ 
                      ...prev, 
                      currentRates: { ...prev.currentRates, qualifiedRate: parseFloat(e.target.value) || 0 }
                    }))}
                    placeholder="2.89"
                  />
                </div>
                <div>
                  <Label htmlFor="monthlyFee">Monthly Fee ($)</Label>
                  <Input
                    id="monthlyFee"
                    type="number"
                    value={merchantData.currentRates.monthlyFee || ''}
                    onChange={(e) => setMerchantData(prev => ({ 
                      ...prev, 
                      currentRates: { ...prev.currentRates, monthlyFee: parseFloat(e.target.value) || 0 }
                    }))}
                    placeholder="25"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="businessChallenges">Current Business Challenges</Label>
                <Textarea
                  id="businessChallenges"
                  value={merchantData.businessChallenges}
                  onChange={(e) => setMerchantData(prev => ({ ...prev, businessChallenges: e.target.value }))}
                  placeholder="Describe current challenges, pain points, or areas of concern..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="goals">Business Goals</Label>
                <Textarea
                  id="goals"
                  value={merchantData.goals}
                  onChange={(e) => setMerchantData(prev => ({ ...prev, goals: e.target.value }))}
                  placeholder="Describe business objectives, growth plans, or specific goals..."
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleGenerateInsights}
                disabled={generateInsightsMutation.isPending}
                className="w-full gap-2"
                size="lg"
              >
                {generateInsightsMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Generate Insights
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div>
          {generateInsightsMutation.isPending ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analyzing Business Data</h3>
                <p className="text-muted-foreground text-center">
                  AI is generating comprehensive insights for {merchantData.businessName}...
                </p>
              </CardContent>
            </Card>
          ) : insights ? (
            <div className="space-y-4">
              {/* Success Header */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-800 dark:text-green-200">
                      Analysis Complete for {merchantData.businessName}
                    </h3>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      AI-powered merchant insights generated successfully
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Health Score */}
              {insights.overallScore && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Business Health Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-bold text-blue-600">{insights.overallScore}/100</div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${insights.overallScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Key Insights */}
              {insights.insights && Array.isArray(insights.insights) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Key Business Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {insights.insights.map((insight: any, idx: number) => (
                      <div key={idx} className="border-l-4 border-blue-500 pl-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{insight.title || insight.category}</h4>
                          {insight.impact && (
                            <Badge variant="outline" className={getImpactColor(insight.impact)}>
                              {insight.impact.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {insight.description}
                        </p>
                        {insight.recommendations && Array.isArray(insight.recommendations) && (
                          <ul className="text-sm space-y-1">
                            {insight.recommendations.map((rec: string, recIdx: number) => (
                              <li key={recIdx} className="flex items-start gap-2">
                                <CheckCircle className="w-3 h-3 mt-1 text-green-500 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Competitive Analysis */}
              {insights.competitiveAnalysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Market Position
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3">{insights.competitiveAnalysis.marketPosition}</p>
                    {insights.competitiveAnalysis.opportunities && (
                      <div>
                        <h4 className="font-semibold mb-2">Growth Opportunities:</h4>
                        <ul className="text-sm space-y-1">
                          {insights.competitiveAnalysis.opportunities.map((opp: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <TrendingUp className="w-3 h-3 mt-1 text-green-500 flex-shrink-0" />
                              {opp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Raw Data Display for Debugging */}
              <Card>
                <CardHeader>
                  <CardTitle>Complete Analysis Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-96">
                    {JSON.stringify(insights, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ready for Analysis</h3>
                <p className="text-muted-foreground text-center">
                  Fill in the business information and click "Generate Insights" to receive 
                  comprehensive AI-powered recommendations and analysis.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}