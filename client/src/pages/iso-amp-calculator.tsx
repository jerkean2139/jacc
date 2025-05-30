import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  Settings,
  FileText,
  CheckCircle,
  AlertTriangle,
  Zap,
  Target,
  Award,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface BusinessData {
  monthlyVolume: number;
  averageTicket: number;
  transactionCount: number;
  businessType: string;
  industry: string;
  currentRates?: {
    qualifiedRate: number;
    midQualifiedRate: number;
    nonQualifiedRate: number;
    authFee: number;
    monthlyFee: number;
    statementFee: number;
    batchFee: number;
    equipmentLease?: number;
  };
}

export default function ISOAmpCalculator() {
  const [activeTab, setActiveTab] = useState('setup');
  const [businessData, setBusinessData] = useState<BusinessData>({
    monthlyVolume: 50000,
    averageTicket: 85,
    transactionCount: 588,
    businessType: 'retail',
    industry: 'general_retail',
    currentRates: {
      qualifiedRate: 2.89,
      midQualifiedRate: 3.25,
      nonQualifiedRate: 3.89,
      authFee: 0.15,
      monthlyFee: 25,
      statementFee: 10,
      batchFee: 0.25,
      equipmentLease: 89,
    }
  });

  const [results, setResults] = useState<any>(null);
  const [equipmentResults, setEquipmentResults] = useState<any>(null);
  const { toast } = useToast();

  // Rate comparison mutation
  const rateComparisonMutation = useMutation({
    mutationFn: (data: BusinessData) => apiRequest('POST', '/api/iso-amp/rate-comparison', data),
    onSuccess: (data) => {
      setResults({ type: 'comparison', data });
      toast({ title: 'Success', description: 'Rate comparison completed successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to fetch rate comparison. Please check your connection.' });
    }
  });

  // Advanced savings mutation
  const advancedSavingsMutation = useMutation({
    mutationFn: (data: BusinessData) => apiRequest('POST', '/api/iso-amp/advanced-savings', data),
    onSuccess: (data) => {
      setResults({ type: 'savings', data });
      toast({ title: 'Success', description: 'Advanced savings analysis completed' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to calculate advanced savings. Please try again.' });
    }
  });

  // Equipment costs mutation
  const equipmentCostsMutation = useMutation({
    mutationFn: (requirements: any) => apiRequest('POST', '/api/iso-amp/equipment-costs', requirements),
    onSuccess: (data) => {
      setEquipmentResults(data);
      toast({ title: 'Success', description: 'Equipment recommendations generated' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to calculate equipment costs. Please try again.' });
    }
  });

  const handleRateComparison = () => {
    rateComparisonMutation.mutate(businessData);
  };

  const handleAdvancedSavings = () => {
    advancedSavingsMutation.mutate(businessData);
  };

  const handleEquipmentCalculation = () => {
    const requirements = {
      businessType: businessData.businessType,
      locations: 1,
      monthlyVolume: businessData.monthlyVolume,
      mobileProcessing: businessData.businessType === 'service',
      ecommerceNeeds: businessData.businessType === 'ecommerce'
    };
    equipmentCostsMutation.mutate(requirements);
  };

  return (
    <div className="space-y-6 pb-20 px-4 md:px-0">
      <div className="flex items-start gap-3 md:items-center md:gap-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
          <Zap className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg md:text-2xl font-bold leading-tight">ISOAmp Integration Calculator</h2>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Advanced merchant services calculations with real-time rate analysis
          </p>
        </div>
      </div>

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
          <TabsTrigger value="setup" className="text-xs md:text-sm">Setup</TabsTrigger>
          <TabsTrigger value="rates" className="text-xs md:text-sm">Rates</TabsTrigger>
          <TabsTrigger value="savings" className="text-xs md:text-sm">Savings</TabsTrigger>
          <TabsTrigger value="equipment" className="text-xs md:text-sm">Equipment</TabsTrigger>
        </TabsList>

        {/* Business Setup Tab */}
        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Business Information
              </CardTitle>
              <CardDescription>
                Configure your business details for accurate rate calculations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monthlyVolume">Monthly Processing Volume ($)</Label>
                  <Input
                    id="monthlyVolume"
                    type="number"
                    value={businessData.monthlyVolume === 0 ? '' : businessData.monthlyVolume}
                    placeholder="Enter monthly volume"
                    onChange={(e) => setBusinessData(prev => ({
                      ...prev,
                      monthlyVolume: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0,
                      transactionCount: Math.round((e.target.value === '' ? 0 : parseFloat(e.target.value) || 0) / prev.averageTicket)
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="averageTicket">Average Transaction Amount ($)</Label>
                  <Input
                    id="averageTicket"
                    type="number"
                    value={businessData.averageTicket}
                    onChange={(e) => setBusinessData(prev => ({
                      ...prev,
                      averageTicket: parseFloat(e.target.value) || 0,
                      transactionCount: Math.round(prev.monthlyVolume / (parseFloat(e.target.value) || 1))
                    }))}
                  />
                </div>
              </div>

              <div>
                <Label>Estimated Monthly Transactions</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-2xl font-bold text-blue-600">
                    {businessData.transactionCount.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">transactions/month</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select 
                    value={businessData.businessType} 
                    onValueChange={(value) => setBusinessData(prev => ({ ...prev, businessType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail Store</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="service">Service Business</SelectItem>
                      <SelectItem value="professional">Professional Services</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="industry">Industry Category</Label>
                  <Select 
                    value={businessData.industry} 
                    onValueChange={(value) => setBusinessData(prev => ({ ...prev, industry: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general_retail">General Retail</SelectItem>
                      <SelectItem value="restaurant">Restaurant/Food Service</SelectItem>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="professional_services">Professional Services</SelectItem>
                      <SelectItem value="automotive">Automotive</SelectItem>
                      <SelectItem value="beauty">Beauty/Wellness</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">Current Processing Rates</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="qualifiedRate">Qualified Rate (%)</Label>
                    <Input
                      id="qualifiedRate"
                      type="number"
                      step="0.01"
                      value={businessData.currentRates?.qualifiedRate || 0}
                      onChange={(e) => setBusinessData(prev => ({
                        ...prev,
                        currentRates: { ...prev.currentRates!, qualifiedRate: parseFloat(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="midQualifiedRate">Mid-Qualified Rate (%)</Label>
                    <Input
                      id="midQualifiedRate"
                      type="number"
                      step="0.01"
                      value={businessData.currentRates?.midQualifiedRate || 0}
                      onChange={(e) => setBusinessData(prev => ({
                        ...prev,
                        currentRates: { ...prev.currentRates!, midQualifiedRate: parseFloat(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nonQualifiedRate">Non-Qualified Rate (%)</Label>
                    <Input
                      id="nonQualifiedRate"
                      type="number"
                      step="0.01"
                      value={businessData.currentRates?.nonQualifiedRate || 0}
                      onChange={(e) => setBusinessData(prev => ({
                        ...prev,
                        currentRates: { ...prev.currentRates!, nonQualifiedRate: parseFloat(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="monthlyFee">Monthly Fee ($)</Label>
                    <Input
                      id="monthlyFee"
                      type="number"
                      value={businessData.currentRates?.monthlyFee || 0}
                      onChange={(e) => setBusinessData(prev => ({
                        ...prev,
                        currentRates: { ...prev.currentRates!, monthlyFee: parseFloat(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="equipmentLease">Equipment Lease ($)</Label>
                    <Input
                      id="equipmentLease"
                      type="number"
                      value={businessData.currentRates?.equipmentLease || 0}
                      onChange={(e) => setBusinessData(prev => ({
                        ...prev,
                        currentRates: { ...prev.currentRates!, equipmentLease: parseFloat(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rate Analysis Tab */}
        <TabsContent value="rates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Real-Time Rate Comparison
              </CardTitle>
              <CardDescription>
                Compare Tracer Co Card rates with your current processor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleRateComparison}
                disabled={rateComparisonMutation.isPending}
                className="w-full mb-4"
              >
                {rateComparisonMutation.isPending ? 'Calculating...' : 'Get Rate Comparison'}
                <Target className="w-4 h-4 ml-2" />
              </Button>

              {results?.type === 'comparison' && (
                <div className="space-y-4">
                  {results.data.map((comparison: any, index: number) => (
                    <Card key={index} className={comparison.provider === 'Tracer Co Card' ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{comparison.provider}</CardTitle>
                            {comparison.provider === 'Tracer Co Card' && (
                              <Badge variant="default" className="bg-green-600">
                                <Award className="w-3 h-3 mr-1" />
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold">{comparison.qualifiedRate}%</div>
                            <div className="text-sm text-muted-foreground">Qualified Rate</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-semibold text-green-600 mb-2">Advantages</h5>
                            <ul className="space-y-1">
                              {comparison.advantages.map((advantage: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                  {advantage}
                                </li>
                              ))}
                            </ul>
                          </div>
                          {comparison.disadvantages.length > 0 && (
                            <div>
                              <h5 className="font-semibold text-orange-600 mb-2">Considerations</h5>
                              <ul className="space-y-1">
                                {comparison.disadvantages.map((disadvantage: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <AlertTriangle className="w-3 h-3 text-orange-600 mt-0.5 flex-shrink-0" />
                                    {disadvantage}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Savings Calculator Tab */}
        <TabsContent value="savings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Advanced Savings Analysis
              </CardTitle>
              <CardDescription>
                Multi-scenario savings projections with risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleAdvancedSavings}
                disabled={advancedSavingsMutation.isPending}
                className="w-full mb-4"
              >
                {advancedSavingsMutation.isPending ? 'Analyzing...' : 'Calculate Advanced Savings'}
                <DollarSign className="w-4 h-4 ml-2" />
              </Button>

              {results?.type === 'savings' && (
                <div className="space-y-6">
                  {/* Risk Assessment */}
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Risk Assessment:</strong> {results.data.riskAssessment}
                    </AlertDescription>
                  </Alert>

                  {/* Optimal Solution */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Recommended Solution</h4>
                    <p className="text-blue-600 dark:text-blue-400">{results.data.optimalSolution}</p>
                  </div>

                  {/* Scenarios */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Savings Scenarios</h4>
                    {results.data.scenarios.map((scenario: any, index: number) => (
                      <Card key={index}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{scenario.name}</CardTitle>
                              <CardDescription>{scenario.description}</CardDescription>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-green-600">
                                ${scenario.annualSavings.toFixed(2)}
                              </div>
                              <div className="text-sm text-muted-foreground">Annual Savings</div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-semibold text-green-600 mb-2">Pros</h5>
                              <ul className="space-y-1">
                                {scenario.pros.map((pro: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                    {pro}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="font-semibold text-orange-600 mb-2">Cons</h5>
                              <ul className="space-y-1">
                                {scenario.cons.map((con: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <AlertTriangle className="w-3 h-3 text-orange-600 mt-0.5 flex-shrink-0" />
                                    {con}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="font-semibold mb-3">Personalized Recommendations</h4>
                    <div className="space-y-2">
                      {results.data.recommendations.map((recommendation: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                          <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Equipment Recommendations
              </CardTitle>
              <CardDescription>
                Get personalized equipment suggestions based on your business needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleEquipmentCalculation}
                disabled={equipmentCostsMutation.isPending}
                className="w-full mb-4"
              >
                {equipmentCostsMutation.isPending ? 'Calculating...' : 'Get Equipment Recommendations'}
                <Settings className="w-4 h-4 ml-2" />
              </Button>

              {equipmentResults && (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">${equipmentResults.totalUpfrontCost}</div>
                      <div className="text-sm text-muted-foreground">Total Upfront Cost</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">${equipmentResults.totalMonthlyLease}</div>
                      <div className="text-sm text-muted-foreground">Monthly Lease</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{equipmentResults.estimatedSetupTime}</div>
                      <div className="text-sm text-muted-foreground">Setup Time</div>
                    </div>
                  </div>

                  {/* Support Level */}
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Support Level:</strong> {equipmentResults.supportLevel}
                    </AlertDescription>
                  </Alert>

                  {/* Equipment Recommendations */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Recommended Equipment</h4>
                    {equipmentResults.recommendations.map((item: any, index: number) => (
                      <Card key={index}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{item.name}</CardTitle>
                              <CardDescription>Model: {item.model}</CardDescription>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold">${item.price}</div>
                              {item.monthlyFee && (
                                <div className="text-sm text-muted-foreground">${item.monthlyFee}/month</div>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {item.features.map((feature: string, idx: number) => (
                              <Badge key={idx} variant="secondary">{feature}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}