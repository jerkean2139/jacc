import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, Award, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ProcessorRecommendation {
  processorName: string;
  estimatedRate: number;
  monthlyFees: number;
  setupFees: number;
  totalMonthlyCost: number;
  annualSavings: number;
  competitivePosition: string;
  confidenceLevel: number;
  reasoning: string[];
  breakdown: {
    interchangeCost: number;
    processorMarkup: number;
    assessmentFees: number;
    monthlyFees: number;
    transactionFees: number;
  };
}

interface DemoData {
  merchantProfile: any;
  recommendations: ProcessorRecommendation[];
  competitiveAnalysis: any;
  demoInsights: {
    tracerPayAdvantage: any;
    trxComparison: any;
    marketPosition: any;
  };
}

export default function PricingDemo() {
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDemo = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/api/pricing/demo/trx-tracerpay');
      setDemoData(response.demo);
    } catch (error) {
      console.error('Error loading pricing demo:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDemo();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center py-12">
          <div className="animate-pulse">Loading pricing intelligence demo...</div>
        </div>
      </div>
    );
  }

  if (!demoData) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center py-12">
          <Button onClick={loadDemo}>Load TRX & TracerPay Demo</Button>
        </div>
      </div>
    );
  }

  const { merchantProfile, recommendations, competitiveAnalysis, demoInsights } = demoData;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Intelligent Pricing Demo</h1>
        <p className="text-muted-foreground mt-2">
          TRX vs TracerPay competitive analysis using real interchange rates
        </p>
      </div>

      {/* Merchant Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Sample Restaurant Merchant
          </CardTitle>
          <CardDescription>
            Based on typical restaurant processing profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Monthly Volume</div>
              <div className="font-semibold">${merchantProfile.monthlyVolume.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Average Ticket</div>
              <div className="font-semibold">${merchantProfile.averageTicket}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Current Rate</div>
              <div className="font-semibold">{merchantProfile.currentRate}%</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Current Processor</div>
              <div className="font-semibold">{merchantProfile.currentProcessor}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations">Top Recommendations</TabsTrigger>
          <TabsTrigger value="tracerpay">TracerPay Advantage</TabsTrigger>
          <TabsTrigger value="comparison">TRX vs TracerPay</TabsTrigger>
          <TabsTrigger value="market">Market Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-4">
            {recommendations.map((rec, index) => (
              <Card key={rec.processorName} className={index === 0 ? 'border-green-500' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {rec.processorName}
                        {index === 0 && <Badge variant="default">Best Value</Badge>}
                        <Badge 
                          variant={rec.competitivePosition === 'aggressive' ? 'destructive' : 'secondary'}
                        >
                          {rec.competitivePosition}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Effective Rate: {rec.estimatedRate.toFixed(2)}%
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        ${Math.round(rec.totalMonthlyCost)}/mo
                      </div>
                      <div className="text-sm text-green-600">
                        Save ${Math.round(rec.annualSavings)}/year
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Progress value={rec.confidenceLevel * 10} className="flex-1" />
                      <span className="text-sm">{rec.confidenceLevel}/10 confidence</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Interchange</div>
                        <div>{rec.breakdown.interchangeCost.toFixed(3)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Processor Markup</div>
                        <div>{rec.breakdown.processorMarkup.toFixed(3)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Assessment</div>
                        <div>{rec.breakdown.assessmentFees.toFixed(3)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Monthly Fees</div>
                        <div>${rec.monthlyFees}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Auth Fees</div>
                        <div>${Math.round(rec.breakdown.transactionFees)}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="font-medium">Key Advantages:</div>
                      <ul className="text-sm space-y-1">
                        {rec.reasoning.map((reason, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tracerpay" className="space-y-4">
          {demoInsights.tracerPayAdvantage && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-500" />
                  TracerPay Competitive Advantage
                </CardTitle>
                <CardDescription>
                  Industry-leading pricing with white-label gateway integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      ${demoInsights.tracerPayAdvantage.monthlySavings}
                    </div>
                    <div className="text-sm text-muted-foreground">Monthly Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      ${demoInsights.tracerPayAdvantage.annualSavings}
                    </div>
                    <div className="text-sm text-muted-foreground">Annual Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {demoInsights.tracerPayAdvantage.savingsPercent}%
                    </div>
                    <div className="text-sm text-muted-foreground">Cost Reduction</div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-3">Unique Advantages:</h4>
                  <ul className="space-y-2">
                    {demoInsights.tracerPayAdvantage.competitiveAdvantages.map((advantage: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{advantage}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          {demoInsights.trxComparison && (
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">TracerPay Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {demoInsights.trxComparison.tracerPayAdvantages.map((advantage: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{advantage}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <div className="text-sm font-medium">Cost Advantage</div>
                    <div className="text-lg font-bold text-green-600">
                      ${demoInsights.trxComparison.costDifference} lower monthly
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-600">TRX Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {demoInsights.trxComparison.trxStrengths.map((strength: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium">Rate Difference</div>
                    <div className="text-lg font-bold text-blue-600">
                      +{demoInsights.trxComparison.rateDifference} basis points
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          {demoInsights.marketPosition && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Market Intelligence
                </CardTitle>
                <CardDescription>
                  Industry positioning and competitive landscape
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-xl font-bold">
                      {demoInsights.marketPosition.marketLeader}
                    </div>
                    <div className="text-sm text-muted-foreground">Market Leader</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">
                      {demoInsights.marketPosition.marketAverage}%
                    </div>
                    <div className="text-sm text-muted-foreground">Market Average</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">
                      {demoInsights.marketPosition.competitiveSpread}%
                    </div>
                    <div className="text-sm text-muted-foreground">Rate Spread</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Industry Insights:</h4>
                  <ul className="space-y-2">
                    {demoInsights.marketPosition.industryInsights.map((insight: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <div className="text-center mt-8">
        <Button onClick={loadDemo} variant="outline">
          <Clock className="w-4 h-4 mr-2" />
          Refresh Demo Data
        </Button>
      </div>
    </div>
  );
}