import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calculator, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  PieChart,
  Download,
  Share,
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface BusinessData {
  monthlyVolume: number;
  averageTicket: number;
  transactionCount: number;
  businessType: string;
  industry: string;
  currentProcessor?: string;
  currentRates?: ProcessingRates;
}

interface ProcessingRates {
  qualifiedRate: number;
  midQualifiedRate: number;
  nonQualifiedRate: number;
  interchangePlus?: number;
  authFee: number;
  monthlyFee: number;
  statementFee: number;
  batchFee: number;
  equipmentLease?: number;
}

interface RateComparison {
  provider: string;
  rates: ProcessingRates;
  monthlyCost: number;
  annualCost: number;
  savings: number;
  savingsPercentage: number;
  advantages: string[];
  disadvantages: string[];
  rating: number;
}

interface SavingsProjection {
  monthlyVolume: number;
  currentCost: number;
  proposedCost: number;
  monthlySavings: number;
  annualSavings: number;
  breakEvenMonths: number;
  roi: number;
}

export default function RateCalculator() {
  const [businessData, setBusinessData] = useState<BusinessData>({
    monthlyVolume: 50000,
    averageTicket: 85,
    transactionCount: 588,
    businessType: 'retail',
    industry: 'general_retail',
  });

  const [currentRates, setCurrentRates] = useState<ProcessingRates>({
    qualifiedRate: 2.89,
    midQualifiedRate: 3.25,
    nonQualifiedRate: 3.89,
    authFee: 0.15,
    monthlyFee: 25,
    statementFee: 10,
    batchFee: 0.25,
    equipmentLease: 89,
  });

  const [showComparison, setShowComparison] = useState(false);

  // Calculate transaction count when volume or ticket changes
  useEffect(() => {
    if (businessData.monthlyVolume && businessData.averageTicket) {
      const count = Math.round(businessData.monthlyVolume / businessData.averageTicket);
      setBusinessData(prev => ({ ...prev, transactionCount: count }));
    }
  }, [businessData.monthlyVolume, businessData.averageTicket]);

  // Industry-specific rate recommendations
  const getIndustryRates = (industry: string): ProcessingRates => {
    const industryRates: Record<string, ProcessingRates> = {
      'general_retail': {
        qualifiedRate: 2.65,
        midQualifiedRate: 2.95,
        nonQualifiedRate: 3.25,
        interchangePlus: 0.15,
        authFee: 0.10,
        monthlyFee: 15,
        statementFee: 7.95,
        batchFee: 0.20,
        equipmentLease: 49,
      },
      'restaurant': {
        qualifiedRate: 2.69,
        midQualifiedRate: 2.99,
        nonQualifiedRate: 3.29,
        interchangePlus: 0.15,
        authFee: 0.10,
        monthlyFee: 20,
        statementFee: 7.95,
        batchFee: 0.25,
        equipmentLease: 59,
      },
      'ecommerce': {
        qualifiedRate: 2.79,
        midQualifiedRate: 3.09,
        nonQualifiedRate: 3.49,
        interchangePlus: 0.20,
        authFee: 0.12,
        monthlyFee: 25,
        statementFee: 9.95,
        batchFee: 0.30,
      },
      'healthcare': {
        qualifiedRate: 2.59,
        midQualifiedRate: 2.89,
        nonQualifiedRate: 3.19,
        interchangePlus: 0.12,
        authFee: 0.08,
        monthlyFee: 12,
        statementFee: 5.95,
        batchFee: 0.15,
        equipmentLease: 45,
      },
      'professional_services': {
        qualifiedRate: 2.55,
        midQualifiedRate: 2.85,
        nonQualifiedRate: 3.15,
        interchangePlus: 0.10,
        authFee: 0.08,
        monthlyFee: 10,
        statementFee: 5.95,
        batchFee: 0.15,
        equipmentLease: 39,
      },
    };

    return industryRates[industry] || industryRates['general_retail'];
  };

  // Calculate monthly processing costs
  const calculateMonthlyCost = (rates: ProcessingRates, volume: number, transactionCount: number): number => {
    // Assume card mix: 70% qualified, 20% mid-qualified, 10% non-qualified
    const qualifiedVolume = volume * 0.70;
    const midQualifiedVolume = volume * 0.20;
    const nonQualifiedVolume = volume * 0.10;

    const processingFees = 
      (qualifiedVolume * rates.qualifiedRate / 100) +
      (midQualifiedVolume * rates.midQualifiedRate / 100) +
      (nonQualifiedVolume * rates.nonQualifiedRate / 100);

    const transactionFees = transactionCount * rates.authFee;
    const batchFees = 30 * rates.batchFee; // Assume daily batching
    const monthlyFees = rates.monthlyFee + rates.statementFee + (rates.equipmentLease || 0);

    return processingFees + transactionFees + batchFees + monthlyFees;
  };

  // Generate rate comparisons
  const rateComparisons = useMemo((): RateComparison[] => {
    const tracerRates = getIndustryRates(businessData.industry);
    const currentCost = calculateMonthlyCost(currentRates, businessData.monthlyVolume, businessData.transactionCount);
    
    const comparisons: RateComparison[] = [
      {
        provider: 'Tracer Co Card',
        rates: tracerRates,
        monthlyCost: calculateMonthlyCost(tracerRates, businessData.monthlyVolume, businessData.transactionCount),
        annualCost: 0,
        savings: 0,
        savingsPercentage: 0,
        advantages: [
          'Competitive interchange-plus pricing',
          '24/7 customer support',
          'Local merchant services team',
          'No early termination fee',
          'Free equipment replacement'
        ],
        disadvantages: [],
        rating: 4.8
      },
      {
        provider: 'Current Processor',
        rates: currentRates,
        monthlyCost: currentCost,
        annualCost: currentCost * 12,
        savings: 0,
        savingsPercentage: 0,
        advantages: ['Existing relationship'],
        disadvantages: ['Higher processing rates', 'Additional fees'],
        rating: 3.2
      }
    ];

    // Calculate savings and annual costs
    comparisons.forEach(comp => {
      comp.annualCost = comp.monthlyCost * 12;
      comp.savings = currentCost - comp.monthlyCost;
      comp.savingsPercentage = (comp.savings / currentCost) * 100;
    });

    return comparisons.sort((a, b) => b.savings - a.savings);
  }, [businessData, currentRates]);

  // Calculate savings projection
  const savingsProjection = useMemo((): SavingsProjection => {
    const tracerComparison = rateComparisons.find(r => r.provider === 'Tracer Co Card');
    const currentComparison = rateComparisons.find(r => r.provider === 'Current Processor');
    
    if (!tracerComparison || !currentComparison) {
      return {
        monthlyVolume: businessData.monthlyVolume,
        currentCost: 0,
        proposedCost: 0,
        monthlySavings: 0,
        annualSavings: 0,
        breakEvenMonths: 0,
        roi: 0
      };
    }

    const monthlySavings = tracerComparison.savings;
    const annualSavings = monthlySavings * 12;
    const setupCost = 0; // Assume no setup cost for Tracer Co Card
    const breakEvenMonths = setupCost > 0 ? setupCost / monthlySavings : 0;
    const roi = annualSavings > 0 ? (annualSavings / (currentComparison.annualCost)) * 100 : 0;

    return {
      monthlyVolume: businessData.monthlyVolume,
      currentCost: currentComparison.monthlyCost,
      proposedCost: tracerComparison.monthlyCost,
      monthlySavings,
      annualSavings,
      breakEvenMonths,
      roi
    };
  }, [rateComparisons, businessData.monthlyVolume]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
          <Calculator className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Rate Calculator & Savings Projector</h2>
          <p className="text-muted-foreground">
            Calculate processing costs and project savings with Tracer Co Card's competitive rates
          </p>
        </div>
      </div>

      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calculator">Rate Calculator</TabsTrigger>
          <TabsTrigger value="comparison">Rate Comparison</TabsTrigger>
          <TabsTrigger value="projection">Savings Projection</TabsTrigger>
        </TabsList>

        {/* Rate Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Business Information
                </CardTitle>
                <CardDescription>
                  Enter your business details for accurate rate calculations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="monthlyVolume">Monthly Volume ($)</Label>
                    <Input
                      id="monthlyVolume"
                      type="number"
                      value={businessData.monthlyVolume}
                      onChange={(e) => setBusinessData(prev => ({
                        ...prev,
                        monthlyVolume: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="averageTicket">Average Ticket ($)</Label>
                    <Input
                      id="averageTicket"
                      type="number"
                      value={businessData.averageTicket}
                      onChange={(e) => setBusinessData(prev => ({
                        ...prev,
                        averageTicket: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="transactionCount">Transactions/Month</Label>
                  <Input
                    id="transactionCount"
                    type="number"
                    value={businessData.transactionCount}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Calculated automatically: Volume ÷ Average Ticket
                  </p>
                </div>

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
                  <Label htmlFor="industry">Industry</Label>
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
              </CardContent>
            </Card>

            {/* Current Processing Rates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Current Processing Rates
                </CardTitle>
                <CardDescription>
                  Enter your current processor's rates for comparison
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="qualifiedRate">Qualified Rate (%)</Label>
                    <Input
                      id="qualifiedRate"
                      type="number"
                      step="0.01"
                      value={currentRates.qualifiedRate}
                      onChange={(e) => setCurrentRates(prev => ({
                        ...prev,
                        qualifiedRate: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="midQualifiedRate">Mid-Qualified Rate (%)</Label>
                    <Input
                      id="midQualifiedRate"
                      type="number"
                      step="0.01"
                      value={currentRates.midQualifiedRate}
                      onChange={(e) => setCurrentRates(prev => ({
                        ...prev,
                        midQualifiedRate: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nonQualifiedRate">Non-Qualified Rate (%)</Label>
                    <Input
                      id="nonQualifiedRate"
                      type="number"
                      step="0.01"
                      value={currentRates.nonQualifiedRate}
                      onChange={(e) => setCurrentRates(prev => ({
                        ...prev,
                        nonQualifiedRate: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="authFee">Authorization Fee ($)</Label>
                    <Input
                      id="authFee"
                      type="number"
                      step="0.01"
                      value={currentRates.authFee}
                      onChange={(e) => setCurrentRates(prev => ({
                        ...prev,
                        authFee: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="monthlyFee">Monthly Fee ($)</Label>
                    <Input
                      id="monthlyFee"
                      type="number"
                      value={currentRates.monthlyFee}
                      onChange={(e) => setCurrentRates(prev => ({
                        ...prev,
                        monthlyFee: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="equipmentLease">Equipment Lease ($)</Label>
                    <Input
                      id="equipmentLease"
                      type="number"
                      value={currentRates.equipmentLease || 0}
                      onChange={(e) => setCurrentRates(prev => ({
                        ...prev,
                        equipmentLease: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                </div>

                <Button 
                  onClick={() => setShowComparison(true)} 
                  className="w-full"
                >
                  Calculate Savings
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rate Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <div className="space-y-4">
            {rateComparisons.map((comparison, index) => (
              <Card key={comparison.provider} className={`${
                comparison.provider === 'Tracer Co Card' 
                  ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                  : ''
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="flex items-center gap-2">
                        {comparison.provider === 'Tracer Co Card' && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        {comparison.provider}
                      </CardTitle>
                      {comparison.provider === 'Tracer Co Card' && (
                        <Badge variant="default" className="bg-green-600">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        ${comparison.monthlyCost.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">per month</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Processing Rates</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Qualified:</span>
                          <span>{comparison.rates.qualifiedRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mid-Qualified:</span>
                          <span>{comparison.rates.midQualifiedRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Non-Qualified:</span>
                          <span>{comparison.rates.nonQualifiedRate}%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Monthly Fees</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Monthly Fee:</span>
                          <span>${comparison.rates.monthlyFee}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Statement Fee:</span>
                          <span>${comparison.rates.statementFee}</span>
                        </div>
                        {comparison.rates.equipmentLease && (
                          <div className="flex justify-between">
                            <span>Equipment:</span>
                            <span>${comparison.rates.equipmentLease}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Savings Analysis</h4>
                      <div className="space-y-1 text-sm">
                        {comparison.savings > 0 ? (
                          <>
                            <div className="flex justify-between text-green-600">
                              <span>Monthly Savings:</span>
                              <span className="font-medium">
                                ${comparison.savings.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-green-600">
                              <span>Annual Savings:</span>
                              <span className="font-medium">
                                ${(comparison.savings * 12).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-green-600">
                              <span>Savings %:</span>
                              <span className="font-medium">
                                {comparison.savingsPercentage.toFixed(1)}%
                              </span>
                            </div>
                          </>
                        ) : comparison.savings < 0 ? (
                          <div className="flex justify-between text-red-600">
                            <span>Additional Cost:</span>
                            <span>${Math.abs(comparison.savings).toFixed(2)}</span>
                          </div>
                        ) : (
                          <div className="text-muted-foreground">Current Processor</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-green-600">Advantages</h4>
                      <ul className="space-y-1 text-sm">
                        {comparison.advantages.map((advantage, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                            {advantage}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {comparison.disadvantages.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-orange-600">Considerations</h4>
                        <ul className="space-y-1 text-sm">
                          {comparison.disadvantages.map((disadvantage, idx) => (
                            <li key={idx} className="flex items-start gap-2">
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
        </TabsContent>

        {/* Savings Projection Tab */}
        <TabsContent value="projection" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-green-600" />
                  Savings Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                    <span className="font-medium">Current Monthly Cost:</span>
                    <span className="text-lg font-bold text-red-600">
                      ${savingsProjection.currentCost.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <span className="font-medium">Proposed Monthly Cost:</span>
                    <span className="text-lg font-bold text-green-600">
                      ${savingsProjection.proposedCost.toFixed(2)}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <span className="font-medium">Monthly Savings:</span>
                    <span className="text-xl font-bold text-blue-600">
                      ${savingsProjection.monthlySavings.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <span className="font-medium">Annual Savings:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ${savingsProjection.annualSavings.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  ROI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {savingsProjection.roi.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Annual ROI</div>
                  </div>
                  
                  {savingsProjection.breakEvenMonths > 0 && (
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                      <div className="text-xl font-bold text-orange-600 mb-1">
                        {savingsProjection.breakEvenMonths.toFixed(1)} months
                      </div>
                      <div className="text-sm text-muted-foreground">Break-even period</div>
                    </div>
                  )}
                  
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <div className="text-lg font-bold text-purple-600 mb-1">
                      ${(savingsProjection.annualSavings * 3).toFixed(0)}
                    </div>
                    <div className="text-sm text-muted-foreground">3-Year Savings Projection</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Savings Breakdown by Month</CardTitle>
              <CardDescription>
                Project your cumulative savings over the next 12 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <div key={month} className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">
                      Month {month}
                    </div>
                    <div className="font-bold text-green-600">
                      ${(savingsProjection.monthlySavings * month).toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download Proposal
            </Button>
            <Button variant="outline" className="flex-1">
              <Share className="w-4 h-4 mr-2" />
              Share Analysis
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}