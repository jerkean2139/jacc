import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  CheckCircle,
  AlertTriangle,
  Zap,
  Target,
  Award,
  ArrowRight,
  Percent,
  Calendar,
  Building
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BusinessData {
  monthlyVolume: number;
  averageTicket: number;
  transactionCount: number;
  businessType: string;
  currentRate: number;
  currentMonthlyFees: number;
  cardPresentPercent: number;
  keyedPercent: number;
  ecommercePercent: number;
}

interface ComparisonResult {
  currentCost: {
    processingFees: number;
    monthlyFees: number;
    total: number;
  };
  tracerPayCost: {
    processingFees: number;
    monthlyFees: number;
    total: number;
  };
  savings: {
    monthly: number;
    annual: number;
    percentage: number;
  };
}

const businessTypes = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'retail', label: 'Retail Store' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'service', label: 'Service Business' },
  { value: 'hotel', label: 'Hotel/Hospitality' },
  { value: 'gas_station', label: 'Gas Station' },
  { value: 'auto_repair', label: 'Auto Repair' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'other', label: 'Other' }
];

// TracerPay competitive pricing structure
const tracerPayRates = {
  restaurant: { rate: 2.49, monthlyFee: 15, pciFee: 0, statementFee: 0 },
  retail: { rate: 2.39, monthlyFee: 15, pciFee: 0, statementFee: 0 },
  ecommerce: { rate: 2.89, monthlyFee: 25, pciFee: 0, statementFee: 0 },
  service: { rate: 2.59, monthlyFee: 15, pciFee: 0, statementFee: 0 },
  hotel: { rate: 2.69, monthlyFee: 20, pciFee: 0, statementFee: 0 },
  gas_station: { rate: 2.29, monthlyFee: 15, pciFee: 0, statementFee: 0 },
  auto_repair: { rate: 2.49, monthlyFee: 15, pciFee: 0, statementFee: 0 },
  healthcare: { rate: 2.79, monthlyFee: 20, pciFee: 0, statementFee: 0 },
  other: { rate: 2.59, monthlyFee: 15, pciFee: 0, statementFee: 0 }
};

export default function PricingComparison() {
  const [businessData, setBusinessData] = useState<BusinessData>({
    monthlyVolume: 0,
    averageTicket: 0,
    transactionCount: 0,
    businessType: '',
    currentRate: 0,
    currentMonthlyFees: 0,
    cardPresentPercent: 90,
    keyedPercent: 5,
    ecommercePercent: 5
  });

  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Calculate comparison when data changes
  useEffect(() => {
    if (businessData.monthlyVolume > 0 && businessData.currentRate > 0 && businessData.businessType) {
      calculateComparison();
    }
  }, [businessData]);

  const calculateComparison = () => {
    const { monthlyVolume, currentRate, currentMonthlyFees, businessType } = businessData;
    
    // Current processor costs
    const currentProcessingFees = monthlyVolume * (currentRate / 100);
    const currentTotal = currentProcessingFees + currentMonthlyFees;

    // TracerPay costs
    const tracerPay = tracerPayRates[businessType] || tracerPayRates.other;
    const tracerPayProcessingFees = monthlyVolume * (tracerPay.rate / 100);
    const tracerPayTotal = tracerPayProcessingFees + tracerPay.monthlyFee;

    // Savings calculation
    const monthlySavings = currentTotal - tracerPayTotal;
    const annualSavings = monthlySavings * 12;
    const savingsPercentage = (monthlySavings / currentTotal) * 100;

    setComparison({
      currentCost: {
        processingFees: currentProcessingFees,
        monthlyFees: currentMonthlyFees,
        total: currentTotal
      },
      tracerPayCost: {
        processingFees: tracerPayProcessingFees,
        monthlyFees: tracerPay.monthlyFee,
        total: tracerPayTotal
      },
      savings: {
        monthly: monthlySavings,
        annual: annualSavings,
        percentage: savingsPercentage
      }
    });

    setShowResults(true);
  };

  const handleInputChange = (field: keyof BusinessData, value: string | number) => {
    setBusinessData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const chartData = comparison ? [
    {
      name: 'Current Processor',
      'Processing Fees': comparison.currentCost.processingFees,
      'Monthly Fees': comparison.currentCost.monthlyFees,
      'Total': comparison.currentCost.total
    },
    {
      name: 'TracerPay',
      'Processing Fees': comparison.tracerPayCost.processingFees,
      'Monthly Fees': comparison.tracerPayCost.monthlyFees,
      'Total': comparison.tracerPayCost.total
    }
  ] : [];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Live Pricing Comparison Tool
          </h1>
          <p className="text-muted-foreground">
            Real-time side-by-side pricing analysis for prospect meetings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT SIDE - INPUT SECTION */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Business Information
                </CardTitle>
                <CardDescription>
                  Enter prospect's current processing details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyVolume">Monthly Volume ($)</Label>
                    <Input
                      id="monthlyVolume"
                      type="number"
                      placeholder="50,000"
                      value={businessData.monthlyVolume || ''}
                      onChange={(e) => handleInputChange('monthlyVolume', Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="averageTicket">Average Ticket ($)</Label>
                    <Input
                      id="averageTicket"
                      type="number"
                      placeholder="85"
                      value={businessData.averageTicket || ''}
                      onChange={(e) => handleInputChange('averageTicket', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select 
                    value={businessData.businessType} 
                    onValueChange={(value) => handleInputChange('businessType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentRate">Current Rate (%)</Label>
                    <Input
                      id="currentRate"
                      type="number"
                      step="0.01"
                      placeholder="2.89"
                      value={businessData.currentRate || ''}
                      onChange={(e) => handleInputChange('currentRate', Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currentMonthlyFees">Current Monthly Fees ($)</Label>
                    <Input
                      id="currentMonthlyFees"
                      type="number"
                      placeholder="89"
                      value={businessData.currentMonthlyFees || ''}
                      onChange={(e) => handleInputChange('currentMonthlyFees', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardPresent">Card Present (%)</Label>
                    <Input
                      id="cardPresent"
                      type="number"
                      value={businessData.cardPresentPercent}
                      onChange={(e) => handleInputChange('cardPresentPercent', Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="keyed">Keyed (%)</Label>
                    <Input
                      id="keyed"
                      type="number"
                      value={businessData.keyedPercent}
                      onChange={(e) => handleInputChange('keyedPercent', Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ecommerce">E-commerce (%)</Label>
                    <Input
                      id="ecommerce"
                      type="number"
                      value={businessData.ecommercePercent}
                      onChange={(e) => handleInputChange('ecommercePercent', Number(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT SIDE - RESULTS SECTION */}
          <div className="space-y-6">
            {showResults && comparison ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      Monthly Cost Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Current vs TracerPay */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="text-sm text-muted-foreground">Current Processor</p>
                          <p className="text-2xl font-bold text-red-600">
                            ${comparison.currentCost.total.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">per month</p>
                        </div>
                        
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm text-muted-foreground">TracerPay</p>
                          <p className="text-2xl font-bold text-green-600">
                            ${comparison.tracerPayCost.total.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">per month</p>
                        </div>
                      </div>

                      {/* Savings Highlight */}
                      <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Zap className="w-6 h-6 text-blue-600" />
                          <span className="text-lg font-semibold">Monthly Savings</span>
                        </div>
                        <p className="text-3xl font-bold text-blue-600">
                          ${comparison.savings.monthly.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {comparison.savings.percentage.toFixed(1)}% reduction
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Annual Savings Projection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
                      <p className="text-4xl font-bold text-green-600 mb-2">
                        ${comparison.savings.annual.toLocaleString()}
                      </p>
                      <p className="text-muted-foreground">saved per year</p>
                      
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Current Annual Cost</p>
                          <p className="text-red-600">${(comparison.currentCost.total * 12).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="font-medium">TracerPay Annual Cost</p>
                          <p className="text-green-600">${(comparison.tracerPayCost.total * 12).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cost Breakdown Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                          <Bar dataKey="Processing Fees" fill="#3b82f6" />
                          <Bar dataKey="Monthly Fees" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Benefits */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      TracerPay Advantages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>Lower processing rates</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>Reduced monthly fees</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>24/7 customer support</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>No PCI compliance fees</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>Free statement fees</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Calculator className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ready for Comparison</h3>
                  <p className="text-muted-foreground">
                    Enter business details on the left to see real-time savings analysis
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}