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
  ChevronLeft,
  Upload,
  FileBarChart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface TransactionBreakdown {
  creditCardVolume: number;
  debitCardVolume: number;
  keyedVolume: number;
  ecommerceVolume: number;
  cardPresentPercentage: number;
  qualifiedPercentage: number;
  midQualifiedPercentage: number;
  nonQualifiedPercentage: number;
}

interface ProcessorRates {
  name: string;
  qualifiedRate: number;
  midQualifiedRate: number;
  nonQualifiedRate: number;
  debitRate: number;
  authFee: number;
  monthlyFee: number;
  statementFee: number;
  batchFee: number;
  keyedUpcharge: number;
  ecommerceUpcharge: number;
  equipmentLease: number;
  gatewayFee: number;
  pciFee: number;
  regulatoryFee: number;
}

interface BusinessData {
  monthlyVolume: number;
  averageTicket: number;
  transactionCount: number;
  businessType: string;
  industry: string;
  transactionBreakdown: TransactionBreakdown;
  currentProcessor: ProcessorRates;
  proposedProcessor: ProcessorRates;
  additionalCosts: {
    hardwareCosts: number;
    softwareFees: number;
    supportFees: number;
    installationFees: number;
  };
}

// Helper function to calculate monthly costs
const calculateMonthlyCosts = (data: BusinessData, processor: ProcessorRates) => {
  const { transactionBreakdown } = data;
  
  // Calculate volume-based fees
  const qualifiedVolume = data.monthlyVolume * (transactionBreakdown.qualifiedPercentage / 100);
  const midQualifiedVolume = data.monthlyVolume * (transactionBreakdown.midQualifiedPercentage / 100);
  const nonQualifiedVolume = data.monthlyVolume * (transactionBreakdown.nonQualifiedPercentage / 100);
  
  const qualifiedFees = qualifiedVolume * (processor.qualifiedRate / 100);
  const midQualifiedFees = midQualifiedVolume * (processor.midQualifiedRate / 100);
  const nonQualifiedFees = nonQualifiedVolume * (processor.nonQualifiedRate / 100);
  
  // Calculate debit fees
  const debitFees = transactionBreakdown.debitCardVolume * (processor.debitRate / 100);
  
  // Calculate transaction-based fees
  const authFees = data.transactionCount * processor.authFee;
  const batchFees = 30 * processor.batchFee; // Assuming daily batches
  
  // Calculate keyed and ecommerce upcharges
  const keyedUpcharge = transactionBreakdown.keyedVolume * (processor.keyedUpcharge / 100);
  const ecommerceUpcharge = transactionBreakdown.ecommerceVolume * (processor.ecommerceUpcharge / 100);
  
  // Monthly fixed fees
  const monthlyFees = processor.monthlyFee + processor.statementFee + processor.gatewayFee + 
                     processor.pciFee + processor.regulatoryFee + processor.equipmentLease;
  
  const totalProcessingFees = qualifiedFees + midQualifiedFees + nonQualifiedFees + debitFees + 
                             authFees + batchFees + keyedUpcharge + ecommerceUpcharge;
  
  return {
    processingFees: totalProcessingFees,
    monthlyFees: monthlyFees,
    total: totalProcessingFees + monthlyFees,
    breakdown: {
      qualifiedFees,
      midQualifiedFees,
      nonQualifiedFees,
      debitFees,
      authFees,
      batchFees,
      keyedUpcharge,
      ecommerceUpcharge,
      monthlyFees
    }
  };
};

export default function ISOAmpCalculator() {
  const [activeTab, setActiveTab] = useState('volume');
  const [businessData, setBusinessData] = useState<BusinessData>({
    monthlyVolume: 50000,
    averageTicket: 85,
    transactionCount: 588,
    businessType: 'retail',
    industry: 'general_retail',
    transactionBreakdown: {
      creditCardVolume: 40000,
      debitCardVolume: 10000,
      keyedVolume: 5000,
      ecommerceVolume: 0,
      cardPresentPercentage: 90,
      qualifiedPercentage: 70,
      midQualifiedPercentage: 20,
      nonQualifiedPercentage: 10
    },
    currentProcessor: {
      name: 'Current Processor',
      qualifiedRate: 2.89,
      midQualifiedRate: 3.25,
      nonQualifiedRate: 3.89,
      debitRate: 1.19,
      authFee: 0.15,
      monthlyFee: 25,
      statementFee: 10,
      batchFee: 0.25,
      keyedUpcharge: 0.30,
      ecommerceUpcharge: 0.15,
      equipmentLease: 89,
      gatewayFee: 15,
      pciFee: 8.95,
      regulatoryFee: 2.95
    },
    proposedProcessor: {
      name: 'TracerPay',
      qualifiedRate: 2.49,
      midQualifiedRate: 2.89,
      nonQualifiedRate: 3.29,
      debitRate: 0.95,
      authFee: 0.10,
      monthlyFee: 15,
      statementFee: 0,
      batchFee: 0.10,
      keyedUpcharge: 0.20,
      ecommerceUpcharge: 0.10,
      equipmentLease: 69,
      gatewayFee: 10,
      pciFee: 0,
      regulatoryFee: 1.95
    },
    additionalCosts: {
      hardwareCosts: 0,
      softwareFees: 0,
      supportFees: 0,
      installationFees: 0
    }
  });

  const [results, setResults] = useState<any>(null);
  const [equipmentResults, setEquipmentResults] = useState<any>(null);
  const { toast } = useToast();

  // File upload handling
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  // Bank statement analysis mutation
  const statementAnalysisMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('statement', file);
      
      const response = await fetch('/api/iso-amp/analyze-statement', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze statement');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResults(data);
      // Auto-populate business data from analysis
      if (data.extractedData) {
        setBusinessData(prev => ({
          ...prev,
          ...data.extractedData
        }));
      }
      toast({
        title: "Statement Analyzed",
        description: "Business data has been extracted and populated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the uploaded statement. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAnalyzeStatement = () => {
    if (uploadedFile) {
      statementAnalysisMutation.mutate(uploadedFile);
    }
  };

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
          <h2 className="text-lg md:text-2xl font-bold leading-tight">Merchant Services Calculator</h2>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Professional cost comparison and savings analysis for payment processing
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-6 gap-1">
          <TabsTrigger value="volume" className="text-xs md:text-sm">Volume</TabsTrigger>
          <TabsTrigger value="current" className="text-xs md:text-sm">Current</TabsTrigger>
          <TabsTrigger value="proposed" className="text-xs md:text-sm">Proposed</TabsTrigger>
          <TabsTrigger value="comparison" className="text-xs md:text-sm">Compare</TabsTrigger>
          <TabsTrigger value="equipment" className="text-xs md:text-sm">Equipment</TabsTrigger>
          <TabsTrigger value="summary" className="text-xs md:text-sm">Summary</TabsTrigger>
        </TabsList>

        {/* Volume & Transaction Breakdown Tab */}
        <TabsContent value="volume" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Monthly Volume & Transaction Breakdown
              </CardTitle>
              <CardDescription>
                Enter detailed processing volume and transaction type information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Volume Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="monthly-volume">Total Monthly Volume ($)</Label>
                  <Input
                    id="monthly-volume"
                    type="number"
                    value={businessData.monthlyVolume}
                    onChange={(e) => {
                      const volume = parseFloat(e.target.value) || 0;
                      setBusinessData(prev => ({ 
                        ...prev, 
                        monthlyVolume: volume,
                        transactionBreakdown: {
                          ...prev.transactionBreakdown,
                          creditCardVolume: volume * 0.8,
                          debitCardVolume: volume * 0.2
                        }
                      }));
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="transaction-count">Monthly Transaction Count</Label>
                  <Input
                    id="transaction-count"
                    type="number"
                    value={businessData.transactionCount}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 0;
                      setBusinessData(prev => ({ ...prev, transactionCount: count }));
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="average-ticket">Average Ticket ($)</Label>
                  <Input
                    id="average-ticket"
                    type="number"
                    value={businessData.averageTicket}
                    onChange={(e) => {
                      const ticket = parseFloat(e.target.value) || 0;
                      setBusinessData(prev => ({ ...prev, averageTicket: ticket }));
                    }}
                  />
                </div>
              </div>

              <Separator />

              {/* Transaction Type Breakdown */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Transaction Type Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="credit-volume">Credit Card Volume ($)</Label>
                    <Input
                      id="credit-volume"
                      type="number"
                      value={businessData.transactionBreakdown.creditCardVolume}
                      onChange={(e) => {
                        const volume = parseFloat(e.target.value) || 0;
                        setBusinessData(prev => ({ 
                          ...prev, 
                          transactionBreakdown: { ...prev.transactionBreakdown, creditCardVolume: volume }
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="debit-volume">Debit Card Volume ($)</Label>
                    <Input
                      id="debit-volume"
                      type="number"
                      value={businessData.transactionBreakdown.debitCardVolume}
                      onChange={(e) => {
                        const volume = parseFloat(e.target.value) || 0;
                        setBusinessData(prev => ({ 
                          ...prev, 
                          transactionBreakdown: { ...prev.transactionBreakdown, debitCardVolume: volume }
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="keyed-volume">Keyed/Manual Entry Volume ($)</Label>
                    <Input
                      id="keyed-volume"
                      type="number"
                      value={businessData.transactionBreakdown.keyedVolume}
                      onChange={(e) => {
                        const volume = parseFloat(e.target.value) || 0;
                        setBusinessData(prev => ({ 
                          ...prev, 
                          transactionBreakdown: { ...prev.transactionBreakdown, keyedVolume: volume }
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ecommerce-volume">E-commerce Volume ($)</Label>
                    <Input
                      id="ecommerce-volume"
                      type="number"
                      value={businessData.transactionBreakdown.ecommerceVolume}
                      onChange={(e) => {
                        const volume = parseFloat(e.target.value) || 0;
                        setBusinessData(prev => ({ 
                          ...prev, 
                          transactionBreakdown: { ...prev.transactionBreakdown, ecommerceVolume: volume }
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Qualification Percentages */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Rate Qualification Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="qualified-pct">Qualified Rate Percentage (%)</Label>
                    <Input
                      id="qualified-pct"
                      type="number"
                      value={businessData.transactionBreakdown.qualifiedPercentage}
                      onChange={(e) => {
                        const pct = parseFloat(e.target.value) || 0;
                        setBusinessData(prev => ({ 
                          ...prev, 
                          transactionBreakdown: { ...prev.transactionBreakdown, qualifiedPercentage: pct }
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mid-qualified-pct">Mid-Qualified Percentage (%)</Label>
                    <Input
                      id="mid-qualified-pct"
                      type="number"
                      value={businessData.transactionBreakdown.midQualifiedPercentage}
                      onChange={(e) => {
                        const pct = parseFloat(e.target.value) || 0;
                        setBusinessData(prev => ({ 
                          ...prev, 
                          transactionBreakdown: { ...prev.transactionBreakdown, midQualifiedPercentage: pct }
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="non-qualified-pct">Non-Qualified Percentage (%)</Label>
                    <Input
                      id="non-qualified-pct"
                      type="number"
                      value={businessData.transactionBreakdown.nonQualifiedPercentage}
                      onChange={(e) => {
                        const pct = parseFloat(e.target.value) || 0;
                        setBusinessData(prev => ({ 
                          ...prev, 
                          transactionBreakdown: { ...prev.transactionBreakdown, nonQualifiedPercentage: pct }
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* File Upload Section */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="statement-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                        Or Upload Processing Statement (Optional)
                      </span>
                      <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                        PDF parsing in development - use manual input above for now
                      </span>
                    </label>
                    <input
                      id="statement-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>
              </div>

              {/* Uploaded File Display */}
              {uploadedFile && (
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">{uploadedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {Math.round(uploadedFile.size / 1024)} KB
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleAnalyzeStatement}
                    disabled={statementAnalysisMutation.isPending}
                    className="gap-2"
                  >
                    {statementAnalysisMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <FileBarChart className="w-4 h-4" />
                        Analyze Statement
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Analysis Results */}
              {analysisResults && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="font-medium text-green-800 dark:text-green-200">
                        Analysis Complete
                      </h3>
                    </div>
                    
                    {analysisResults.extractedData && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Monthly Volume</p>
                          <p className="text-lg font-semibold">
                            ${analysisResults.extractedData.monthlyVolume?.toLocaleString() || 'N/A'}
                          </p>
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Average Ticket</p>
                          <p className="text-lg font-semibold">
                            ${analysisResults.extractedData.averageTicket || 'N/A'}
                          </p>
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Transaction Count</p>
                          <p className="text-lg font-semibold">
                            {analysisResults.extractedData.transactionCount?.toLocaleString() || 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}

                    <Alert className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Extracted data has been automatically populated in the Setup tab. 
                        Review and adjust as needed before proceeding.
                      </AlertDescription>
                    </Alert>

                    {/* Debug information */}
                    {analysisResults.rawTextSample && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                        <details className="cursor-pointer">
                          <summary className="text-sm font-medium mb-2">
                            Debug: Extracted Text Sample ({analysisResults.contentLength} total characters)
                          </summary>
                          <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap max-h-40 overflow-y-auto">
                            {analysisResults.rawTextSample}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => setActiveTab('setup')} className="gap-2">
                      Continue to Setup
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Current Processor Rates Tab */}
        <TabsContent value="current" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Current Processor Rates
              </CardTitle>
              <CardDescription>
                Enter your current processor's rates and fees for comparison
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="current-processor-name">Processor Name</Label>
                  <Input
                    id="current-processor-name"
                    value={businessData.currentProcessor.name}
                    onChange={(e) => {
                      setBusinessData(prev => ({
                        ...prev,
                        currentProcessor: { ...prev.currentProcessor, name: e.target.value }
                      }));
                    }}
                  />
                </div>
              </div>

              <Separator />

              {/* Processing Rates */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Processing Rates (%)</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="current-qualified-rate">Qualified Rate</Label>
                    <Input
                      id="current-qualified-rate"
                      type="number"
                      step="0.01"
                      value={businessData.currentProcessor.qualifiedRate}
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value) || 0;
                        setBusinessData(prev => ({
                          ...prev,
                          currentProcessor: { ...prev.currentProcessor, qualifiedRate: rate }
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="current-mid-qualified-rate">Mid-Qualified Rate</Label>
                    <Input
                      id="current-mid-qualified-rate"
                      type="number"
                      step="0.01"
                      value={businessData.currentProcessor.midQualifiedRate}
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value) || 0;
                        setBusinessData(prev => ({
                          ...prev,
                          currentProcessor: { ...prev.currentProcessor, midQualifiedRate: rate }
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="current-non-qualified-rate">Non-Qualified Rate</Label>
                    <Input
                      id="current-non-qualified-rate"
                      type="number"
                      step="0.01"
                      value={businessData.currentProcessor.nonQualifiedRate}
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value) || 0;
                        setBusinessData(prev => ({
                          ...prev,
                          currentProcessor: { ...prev.currentProcessor, nonQualifiedRate: rate }
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="current-debit-rate">Debit Card Rate</Label>
                    <Input
                      id="current-debit-rate"
                      type="number"
                      step="0.01"
                      value={businessData.currentProcessor.debitRate}
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value) || 0;
                        setBusinessData(prev => ({
                          ...prev,
                          currentProcessor: { ...prev.currentProcessor, debitRate: rate }
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Transaction Fees */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Transaction Fees ($)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="current-auth-fee">Authorization Fee</Label>
                    <Input
                      id="current-auth-fee"
                      type="number"
                      step="0.01"
                      value={businessData.currentProcessor.authFee}
                      onChange={(e) => {
                        const fee = parseFloat(e.target.value) || 0;
                        setBusinessData(prev => ({
                          ...prev,
                          currentProcessor: { ...prev.currentProcessor, authFee: fee }
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="current-batch-fee">Batch Fee</Label>
                    <Input
                      id="current-batch-fee"
                      type="number"
                      step="0.01"
                      value={businessData.currentProcessor.batchFee}
                      onChange={(e) => {
                        const fee = parseFloat(e.target.value) || 0;
                        setBusinessData(prev => ({
                          ...prev,
                          currentProcessor: { ...prev.currentProcessor, batchFee: fee }
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="current-keyed-upcharge">Keyed Entry Upcharge (%)</Label>
                    <Input
                      id="current-keyed-upcharge"
                      type="number"
                      step="0.01"
                      value={businessData.currentProcessor.keyedUpcharge}
                      onChange={(e) => {
                        const upcharge = parseFloat(e.target.value) || 0;
                        setBusinessData(prev => ({
                          ...prev,
                          currentProcessor: { ...prev.currentProcessor, keyedUpcharge: upcharge }
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Monthly Fees */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Monthly Fees ($)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="current-monthly-fee">Monthly Service Fee</Label>
                    <Input
                      id="current-monthly-fee"
                      type="number"
                      step="0.01"
                      value={businessData.currentProcessor.monthlyFee}
                      onChange={(e) => {
                        const fee = parseFloat(e.target.value) || 0;
                        setBusinessData(prev => ({
                          ...prev,
                          currentProcessor: { ...prev.currentProcessor, monthlyFee: fee }
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="current-statement-fee">Statement Fee</Label>
                    <Input
                      id="current-statement-fee"
                      type="number"
                      step="0.01"
                      value={businessData.currentProcessor.statementFee}
                      onChange={(e) => {
                        const fee = parseFloat(e.target.value) || 0;
                        setBusinessData(prev => ({
                          ...prev,
                          currentProcessor: { ...prev.currentProcessor, statementFee: fee }
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="current-equipment-lease">Equipment Lease</Label>
                    <Input
                      id="current-equipment-lease"
                      type="number"
                      step="0.01"
                      value={businessData.currentProcessor.equipmentLease}
                      onChange={(e) => {
                        const lease = parseFloat(e.target.value) || 0;
                        setBusinessData(prev => ({
                          ...prev,
                          currentProcessor: { ...prev.currentProcessor, equipmentLease: lease }
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="current-gateway-fee">Gateway Fee</Label>
                    <Input
                      id="current-gateway-fee"
                      type="number"
                      step="0.01"
                      value={businessData.currentProcessor.gatewayFee}
                      onChange={(e) => {
                        const fee = parseFloat(e.target.value) || 0;
                        setBusinessData(prev => ({
                          ...prev,
                          currentProcessor: { ...prev.currentProcessor, gatewayFee: fee }
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="current-pci-fee">PCI Compliance Fee</Label>
                    <Input
                      id="current-pci-fee"
                      type="number"
                      step="0.01"
                      value={businessData.currentProcessor.pciFee}
                      onChange={(e) => {
                        const fee = parseFloat(e.target.value) || 0;
                        setBusinessData(prev => ({
                          ...prev,
                          currentProcessor: { ...prev.currentProcessor, pciFee: fee }
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="current-regulatory-fee">Regulatory Fee</Label>
                    <Input
                      id="current-regulatory-fee"
                      type="number"
                      step="0.01"
                      value={businessData.currentProcessor.regulatoryFee}
                      onChange={(e) => {
                        const fee = parseFloat(e.target.value) || 0;
                        setBusinessData(prev => ({
                          ...prev,
                          currentProcessor: { ...prev.currentProcessor, regulatoryFee: fee }
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setActiveTab('proposed')} className="gap-2">
                  Continue to Proposed Rates
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Proposed Processor Rates Tab */}
        <TabsContent value="proposed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Proposed TracerPay Rates
              </CardTitle>
              <CardDescription>
                Enter TracerPay's competitive rates and fees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="proposed-processor-name">Processor Name</Label>
                  <Input
                    id="proposed-processor-name"
                    value={businessData.proposedProcessor.name}
                    onChange={(e) => {
                      setBusinessData(prev => ({
                        ...prev,
                        proposedProcessor: { ...prev.proposedProcessor, name: e.target.value }
                      }));
                    }}
                  />
                </div>
              </div>

              <Separator />

              {/* Processing Rates */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Processing Rates (%)</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="proposed-qualified-rate">Qualified Rate</Label>
                    <Input
                      id="proposed-qualified-rate"
                      type="number"
                      step="0.01"
                      value={businessData.proposedProcessor.qualifiedRate}
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value) || 0;
                        setBusinessData(prev => ({
                          ...prev,
                          proposedProcessor: { ...prev.proposedProcessor, qualifiedRate: rate }
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="proposed-mid-qualified-rate">Mid-Qualified Rate</Label>
                    <Input
                      id="proposed-mid-qualified-rate"
                      type="number"
                      step="0.01"
                      value={businessData.proposedProcessor.midQualifiedRate}
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value) || 0;
                        setBusinessData(prev => ({
                          ...prev,
                          proposedProcessor: { ...prev.proposedProcessor, midQualifiedRate: rate }
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="proposed-non-qualified-rate">Non-Qualified Rate</Label>
                    <Input
                      id="proposed-non-qualified-rate"
                      type="number"
                      step="0.01"
                      value={businessData.proposedProcessor.nonQualifiedRate}
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value) || 0;
                        setBusinessData(prev => ({
                          ...prev,
                          proposedProcessor: { ...prev.proposedProcessor, nonQualifiedRate: rate }
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="proposed-debit-rate">Debit Card Rate</Label>
                    <Input
                      id="proposed-debit-rate"
                      type="number"
                      step="0.01"
                      value={businessData.proposedProcessor.debitRate}
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value) || 0;
                        setBusinessData(prev => ({
                          ...prev,
                          proposedProcessor: { ...prev.proposedProcessor, debitRate: rate }
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setActiveTab('comparison')} className="gap-2">
                  View Comparison
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Side-by-Side Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Side-by-Side Cost Comparison
              </CardTitle>
              <CardDescription>
                Monthly and yearly cost analysis with savings calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const currentCosts = calculateMonthlyCosts(businessData, businessData.currentProcessor);
                const proposedCosts = calculateMonthlyCosts(businessData, businessData.proposedProcessor);
                const monthlySavings = currentCosts.total - proposedCosts.total;
                const yearlySavings = monthlySavings * 12;

                return (
                  <div className="space-y-6">
                    {/* Monthly Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="border-gray-300">
                        <CardHeader className="text-center">
                          <CardTitle className="text-lg">{businessData.currentProcessor.name}</CardTitle>
                          <CardDescription>Current Processor</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">${currentCosts.total.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">Monthly Total</p>
                          </div>
                          <Separator />
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Processing Fees:</span>
                              <span>${currentCosts.processingFees.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Monthly Fees:</span>
                              <span>${currentCosts.monthlyFees.toFixed(2)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-green-300 bg-green-50 dark:bg-green-900/10">
                        <CardHeader className="text-center">
                          <CardTitle className="text-lg">{businessData.proposedProcessor.name}</CardTitle>
                          <CardDescription>Proposed Processor</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">${proposedCosts.total.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">Monthly Total</p>
                          </div>
                          <Separator />
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Processing Fees:</span>
                              <span>${proposedCosts.processingFees.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Monthly Fees:</span>
                              <span>${proposedCosts.monthlyFees.toFixed(2)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-blue-300 bg-blue-50 dark:bg-blue-900/10">
                        <CardHeader className="text-center">
                          <CardTitle className="text-lg">Savings</CardTitle>
                          <CardDescription>Cost Reduction</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">${monthlySavings.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">Monthly Savings</p>
                          </div>
                          <Separator />
                          <div className="text-center">
                            <p className="text-xl font-semibold text-blue-600">${yearlySavings.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">Annual Savings</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Detailed Breakdown */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Detailed Cost Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2">Fee Type</th>
                                <th className="text-right py-2">{businessData.currentProcessor.name}</th>
                                <th className="text-right py-2">{businessData.proposedProcessor.name}</th>
                                <th className="text-right py-2">Difference</th>
                              </tr>
                            </thead>
                            <tbody className="space-y-1">
                              <tr className="border-b">
                                <td className="py-2">Qualified Fees</td>
                                <td className="text-right">${currentCosts.breakdown.qualifiedFees.toFixed(2)}</td>
                                <td className="text-right">${proposedCosts.breakdown.qualifiedFees.toFixed(2)}</td>
                                <td className="text-right text-green-600">${(currentCosts.breakdown.qualifiedFees - proposedCosts.breakdown.qualifiedFees).toFixed(2)}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2">Mid-Qualified Fees</td>
                                <td className="text-right">${currentCosts.breakdown.midQualifiedFees.toFixed(2)}</td>
                                <td className="text-right">${proposedCosts.breakdown.midQualifiedFees.toFixed(2)}</td>
                                <td className="text-right text-green-600">${(currentCosts.breakdown.midQualifiedFees - proposedCosts.breakdown.midQualifiedFees).toFixed(2)}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2">Non-Qualified Fees</td>
                                <td className="text-right">${currentCosts.breakdown.nonQualifiedFees.toFixed(2)}</td>
                                <td className="text-right">${proposedCosts.breakdown.nonQualifiedFees.toFixed(2)}</td>
                                <td className="text-right text-green-600">${(currentCosts.breakdown.nonQualifiedFees - proposedCosts.breakdown.nonQualifiedFees).toFixed(2)}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2">Debit Card Fees</td>
                                <td className="text-right">${currentCosts.breakdown.debitFees.toFixed(2)}</td>
                                <td className="text-right">${proposedCosts.breakdown.debitFees.toFixed(2)}</td>
                                <td className="text-right text-green-600">${(currentCosts.breakdown.debitFees - proposedCosts.breakdown.debitFees).toFixed(2)}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2">Authorization Fees</td>
                                <td className="text-right">${currentCosts.breakdown.authFees.toFixed(2)}</td>
                                <td className="text-right">${proposedCosts.breakdown.authFees.toFixed(2)}</td>
                                <td className="text-right text-green-600">${(currentCosts.breakdown.authFees - proposedCosts.breakdown.authFees).toFixed(2)}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2">Monthly Fixed Fees</td>
                                <td className="text-right">${currentCosts.breakdown.monthlyFees.toFixed(2)}</td>
                                <td className="text-right">${proposedCosts.breakdown.monthlyFees.toFixed(2)}</td>
                                <td className="text-right text-green-600">${(currentCosts.breakdown.monthlyFees - proposedCosts.breakdown.monthlyFees).toFixed(2)}</td>
                              </tr>
                              <tr className="border-t-2 font-semibold">
                                <td className="py-2">Total Monthly</td>
                                <td className="text-right">${currentCosts.total.toFixed(2)}</td>
                                <td className="text-right">${proposedCosts.total.toFixed(2)}</td>
                                <td className="text-right text-green-600 font-bold">${monthlySavings.toFixed(2)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Savings Highlights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <p className="font-semibold">Monthly Savings: ${monthlySavings.toFixed(2)}</p>
                            <p>That's {((monthlySavings / currentCosts.total) * 100).toFixed(1)}% reduction in processing costs</p>
                          </div>
                        </AlertDescription>
                      </Alert>
                      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                        <Award className="h-4 w-4 text-blue-600" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <p className="font-semibold">Annual Savings: ${yearlySavings.toFixed(2)}</p>
                            <p>Reinvest these savings back into your business growth</p>
                          </div>
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment & Additional Costs Tab */}
        <TabsContent value="equipment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Equipment & Additional Costs
              </CardTitle>
              <CardDescription>
                Factor in hardware, software, and setup costs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hardware-costs">Hardware/Terminal Costs ($)</Label>
                  <Input
                    id="hardware-costs"
                    type="number"
                    value={businessData.additionalCosts.hardwareCosts}
                    onChange={(e) => {
                      const cost = parseFloat(e.target.value) || 0;
                      setBusinessData(prev => ({
                        ...prev,
                        additionalCosts: { ...prev.additionalCosts, hardwareCosts: cost }
                      }));
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="software-fees">Software/POS Integration ($)</Label>
                  <Input
                    id="software-fees"
                    type="number"
                    value={businessData.additionalCosts.softwareFees}
                    onChange={(e) => {
                      const cost = parseFloat(e.target.value) || 0;
                      setBusinessData(prev => ({
                        ...prev,
                        additionalCosts: { ...prev.additionalCosts, softwareFees: cost }
                      }));
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="support-fees">Support/Training Fees ($)</Label>
                  <Input
                    id="support-fees"
                    type="number"
                    value={businessData.additionalCosts.supportFees}
                    onChange={(e) => {
                      const cost = parseFloat(e.target.value) || 0;
                      setBusinessData(prev => ({
                        ...prev,
                        additionalCosts: { ...prev.additionalCosts, supportFees: cost }
                      }));
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="installation-fees">Installation/Setup Fees ($)</Label>
                  <Input
                    id="installation-fees"
                    type="number"
                    value={businessData.additionalCosts.installationFees}
                    onChange={(e) => {
                      const cost = parseFloat(e.target.value) || 0;
                      setBusinessData(prev => ({
                        ...prev,
                        additionalCosts: { ...prev.additionalCosts, installationFees: cost }
                      }));
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setActiveTab('summary')} className="gap-2">
                  View Final Summary
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Final Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Complete Cost Analysis Summary
              </CardTitle>
              <CardDescription>
                Total cost of ownership including all fees and equipment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const currentCosts = calculateMonthlyCosts(businessData, businessData.currentProcessor);
                const proposedCosts = calculateMonthlyCosts(businessData, businessData.proposedProcessor);
                const monthlySavings = currentCosts.total - proposedCosts.total;
                const yearlySavings = monthlySavings * 12;
                
                const totalAdditionalCosts = Object.values(businessData.additionalCosts).reduce((sum, cost) => sum + cost, 0);
                const paybackPeriod = totalAdditionalCosts > 0 ? (totalAdditionalCosts / monthlySavings) : 0;

                return (
                  <div className="space-y-6">
                    {/* Executive Summary */}
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-6 rounded-lg">
                      <h3 className="text-xl font-bold mb-4">Executive Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-green-600">${monthlySavings.toFixed(2)}</p>
                          <p className="text-sm">Monthly Savings</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">${yearlySavings.toFixed(2)}</p>
                          <p className="text-sm">Annual Savings</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-600">${totalAdditionalCosts.toFixed(2)}</p>
                          <p className="text-sm">Setup Costs</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-purple-600">{paybackPeriod > 0 ? paybackPeriod.toFixed(1) : '0'}</p>
                          <p className="text-sm">Payback (Months)</p>
                        </div>
                      </div>
                    </div>

                    {/* ROI Analysis */}
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-semibold">Return on Investment Analysis</p>
                          <p>• Monthly savings: ${monthlySavings.toFixed(2)} ({((monthlySavings / currentCosts.total) * 100).toFixed(1)}% reduction)</p>
                          <p>• Break-even point: {paybackPeriod > 0 ? `${paybackPeriod.toFixed(1)} months` : 'Immediate'}</p>
                          <p>• 3-year savings: ${(yearlySavings * 3 - totalAdditionalCosts).toFixed(2)}</p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
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
                    value={businessData.averageTicket === 0 ? '' : businessData.averageTicket}
                    placeholder="Enter average ticket"
                    onChange={(e) => setBusinessData(prev => ({
                      ...prev,
                      averageTicket: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0,
                      transactionCount: Math.round(prev.monthlyVolume / (e.target.value === '' ? 1 : parseFloat(e.target.value) || 1))
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
                      value={businessData.currentRates?.qualifiedRate === 0 ? '' : businessData.currentRates?.qualifiedRate || ''}
                      placeholder="e.g. 2.89"
                      onChange={(e) => setBusinessData(prev => ({
                        ...prev,
                        currentRates: { ...prev.currentRates!, qualifiedRate: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="midQualifiedRate">Mid-Qualified Rate (%)</Label>
                    <Input
                      id="midQualifiedRate"
                      type="number"
                      step="0.01"
                      value={businessData.currentRates?.midQualifiedRate === 0 ? '' : businessData.currentRates?.midQualifiedRate || ''}
                      placeholder="e.g. 3.19"
                      onChange={(e) => setBusinessData(prev => ({
                        ...prev,
                        currentRates: { ...prev.currentRates!, midQualifiedRate: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nonQualifiedRate">Non-Qualified Rate (%)</Label>
                    <Input
                      id="nonQualifiedRate"
                      type="number"
                      step="0.01"
                      value={businessData.currentRates?.nonQualifiedRate === 0 ? '' : businessData.currentRates?.nonQualifiedRate || ''}
                      placeholder="e.g. 3.49"
                      onChange={(e) => setBusinessData(prev => ({
                        ...prev,
                        currentRates: { ...prev.currentRates!, nonQualifiedRate: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 }
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
                      value={businessData.currentRates?.monthlyFee === 0 ? '' : businessData.currentRates?.monthlyFee || ''}
                      placeholder="e.g. 25"
                      onChange={(e) => setBusinessData(prev => ({
                        ...prev,
                        currentRates: { ...prev.currentRates!, monthlyFee: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="equipmentLease">Equipment Lease ($)</Label>
                    <Input
                      id="equipmentLease"
                      type="number"
                      value={businessData.currentRates?.equipmentLease === 0 ? '' : businessData.currentRates?.equipmentLease || ''}
                      placeholder="e.g. 39"
                      onChange={(e) => setBusinessData(prev => ({
                        ...prev,
                        currentRates: { ...prev.currentRates!, equipmentLease: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="p-6 pt-0">
              <div className="flex justify-end">
                <Button onClick={() => setActiveTab('rates')} className="gap-2">
                  Next: Rate Analysis
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
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

              {results?.type === 'comparison' && results.data && Array.isArray(results.data) && (
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
            <div className="p-6 pt-0">
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('setup')} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Back: Setup
                </Button>
                <Button onClick={() => setActiveTab('savings')} className="gap-2">
                  Next: Savings Analysis
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
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
                    {results.data.scenarios?.map((scenario: any, index: number) => (
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
            <div className="p-6 pt-0">
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('rates')} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Back: Rate Analysis
                </Button>
                <Button onClick={() => setActiveTab('equipment')} className="gap-2">
                  Next: Equipment
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
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
                    {equipmentResults.recommendations?.map((item: any, index: number) => (
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
            <div className="p-6 pt-0">
              <div className="flex justify-start">
                <Button variant="outline" onClick={() => setActiveTab('savings')} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Back: Savings Analysis
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}