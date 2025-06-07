import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
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
  FileBarChart,
  BarChart3,
  PieChart
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts';
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

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [equipmentResults, setEquipmentResults] = useState<any>(null);
  const { toast } = useToast();

  // Fetch available processors from document center
  const { data: processors = [] } = useQuery({
    queryKey: ['/api/processors'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Handle processor selection from dropdown
  const handleProcessorSelection = (processorName: string, isCurrentProcessor: boolean = true) => {
    const selectedProcessor = processors.find((p: any) => p.name === processorName);
    if (selectedProcessor) {
      if (isCurrentProcessor) {
        setBusinessData(prev => ({
          ...prev,
          currentProcessor: { ...selectedProcessor }
        }));
      } else {
        setBusinessData(prev => ({
          ...prev,
          proposedProcessor: { ...selectedProcessor }
        }));
      }
      
      toast({
        title: "Processor Selected",
        description: `${processorName} rates have been loaded automatically.`,
      });
    }
  };

  // File upload handling
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF merchant statement.",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      setUploadedFile(file);
      setAnalysisResults(null); // Clear previous results
    }
  };

  // Enhanced merchant statement analysis mutation with OCR
  const statementAnalysisMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('statement', file);
      
      const response = await fetch('/api/iso-amp/analyze-statement', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze statement');
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
      
      // Show detailed success message with extraction quality
      const metadata = data.analysisMetadata;
      const qualityMessage = metadata.dataQuality === 'high' 
        ? 'High quality data extraction completed'
        : metadata.dataQuality === 'medium'
        ? 'Good quality data extracted with minor gaps'
        : 'Basic data extracted - some manual verification recommended';
      
      toast({
        title: `Statement Analyzed (${Math.round(metadata.confidence * 100)}% confidence)`,
        description: `${qualityMessage}. Processor: ${metadata.processorDetected}`,
      });
      
      // Show improvement suggestions if any
      if (metadata.improvementSuggestions?.length > 0) {
        setTimeout(() => {
          toast({
            title: "Extraction Tips",
            description: metadata.improvementSuggestions[0],
            variant: "default",
          });
        }, 2000);
      }
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Could not analyze the uploaded statement. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAnalyzeStatement = () => {
    if (uploadedFile) {
      statementAnalysisMutation.mutate(uploadedFile);
    }
  };

  // Rate comparison mutation with integrated calculator
  const rateComparisonMutation = useMutation({
    mutationFn: (data: BusinessData) => {
      const merchantProfile = {
        businessName: data.businessName || 'Unknown Business',
        industry: data.industry,
        businessType: data.businessType as 'retail' | 'restaurant' | 'ecommerce' | 'service' | 'healthcare' | 'automotive' | 'other',
        monthlyVolume: data.monthlyVolume,
        averageTicket: data.averageTicket,
        transactionCount: data.transactionCount,
        cardPresentPercentage: data.transactionBreakdown.cardPresentPercentage
      };
      
      return apiRequest('POST', '/api/iso-amp/rate-comparison', {
        merchantProfile,
        currentProcessor: data.currentProcessor
      });
    },
    onSuccess: (data) => {
      setResults({ type: 'comparison', data });
      toast({ 
        title: 'Rate Comparison Complete', 
        description: `Found ${data.comparisons?.length || 0} processor options for comparison` 
      });
    },
    onError: () => {
      toast({ 
        title: 'Comparison Failed', 
        description: 'Unable to calculate rate comparisons. Please verify your data.' 
      });
    }
  });

  // Advanced savings mutation with integrated calculator
  const advancedSavingsMutation = useMutation({
    mutationFn: (data: BusinessData) => {
      const merchantProfile = {
        businessName: data.businessName || 'Unknown Business',
        industry: data.industry,
        businessType: data.businessType as 'retail' | 'restaurant' | 'ecommerce' | 'service' | 'healthcare' | 'automotive' | 'other',
        monthlyVolume: data.monthlyVolume,
        averageTicket: data.averageTicket,
        transactionCount: data.transactionCount,
        cardPresentPercentage: data.transactionBreakdown.cardPresentPercentage
      };
      
      return apiRequest('POST', '/api/iso-amp/advanced-savings', {
        merchantProfile,
        currentProcessor: data.currentProcessor,
        proposedProcessor: data.proposedProcessor
      });
    },
    onSuccess: (data) => {
      setResults({ type: 'savings', data });
      toast({ 
        title: 'Savings Analysis Complete', 
        description: `Potential monthly savings: $${data.savings?.monthly?.toFixed(2) || '0.00'}` 
      });
    },
    onError: () => {
      toast({ 
        title: 'Analysis Failed', 
        description: 'Unable to calculate savings analysis. Please check your processor data.' 
      });
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
    <div className="space-y-6 pb-20 px-4 pt-4 md:px-0 md:pt-0">
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
              {/* Merchant Statement Upload Section */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Upload Merchant Processing Statement</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Upload a PDF merchant account statement from their current processor to automatically extract volume and pricing data
                </p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="statement-upload"
                />
                <label htmlFor="statement-upload" className="cursor-pointer">
                  <Button variant="outline" className="gap-2">
                    <CreditCard className="w-4 h-4" />
                    Choose Merchant Statement
                  </Button>
                </label>
                <p className="text-xs text-gray-400 mt-2">
                  Supports statements from Square, Stripe, First Data, Chase, Elavon, Heartland, and other major processors
                </p>
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
                  <div className="flex gap-3">
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
                </div>
              )}

              {/* OCR Accuracy Test Section */}
              <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    Enhanced OCR Testing
                  </CardTitle>
                  <CardDescription>
                    Test advanced document processing with the Genesis merchant statement example
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => {
                      // Test OCR accuracy with Genesis statement
                      fetch('/api/iso-amp/test-ocr-accuracy', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                      })
                      .then(response => response.json())
                      .then(data => {
                        if (data.success) {
                          setAnalysisResults({
                            extractedData: data.testResults.extractedData,
                            analysisMetadata: data.testResults.extractionMetadata,
                            qualityReport: data.qualityReport,
                            testResults: data.testResults
                          });
                          
                          // Auto-populate with extracted data
                          if (data.testResults.extractedData) {
                            setBusinessData(prev => ({
                              ...prev,
                              ...data.testResults.extractedData
                            }));
                          }
                          
                          toast({
                            title: `OCR Test Complete (${data.testResults.overallAccuracy}% accuracy)`,
                            description: `Genesis statement analyzed with ${data.testResults.extractionMetadata.method} extraction`,
                          });
                        } else {
                          throw new Error(data.error);
                        }
                      })
                      .catch(error => {
                        toast({
                          title: "Test Failed",
                          description: error.message || "Could not test OCR accuracy",
                          variant: "destructive",
                        });
                      });
                    }}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Brain className="w-4 h-4" />
                    Test Enhanced OCR with Genesis Statement
                  </Button>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    This will analyze a real Genesis merchant statement ($76,268 volume, 82 transactions) 
                    to demonstrate OCR accuracy and processor-specific pattern recognition.
                  </p>
                </CardContent>
              </Card>

              {/* Enhanced Analysis Results Display */}
              {analysisResults && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5" />
                      Enhanced OCR Statement Analysis
                    </CardTitle>
                    <CardDescription>
                      Advanced document processing with AI-powered data extraction
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Quality Metrics Dashboard */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round((analysisResults.analysisMetadata?.confidence || analysisResults.confidence || 0) * 100)}%
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Extraction Confidence</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="text-lg font-bold text-green-600 capitalize">
                            {analysisResults.analysisMetadata?.dataQuality || 'Good'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Data Quality</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                          <div className="text-lg font-bold text-purple-600 capitalize">
                            {analysisResults.analysisMetadata?.extractionMethod || 'Enhanced'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">OCR Method</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                          <div className="text-lg font-bold text-orange-600">
                            {analysisResults.analysisMetadata?.processorDetected || analysisResults.processorName || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Processor</div>
                        </div>
                      </div>

                      {/* Financial Data Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <Label className="text-sm text-gray-600 dark:text-gray-400">Monthly Volume</Label>
                          <p className="text-xl font-bold text-green-600">
                            ${(analysisResults.extractedData?.monthlyVolume || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <Label className="text-sm text-gray-600 dark:text-gray-400">Transaction Count</Label>
                          <p className="text-xl font-bold">
                            {(analysisResults.extractedData?.transactionCount || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <Label className="text-sm text-gray-600 dark:text-gray-400">Average Ticket</Label>
                          <p className="text-xl font-bold">
                            ${(analysisResults.extractedData?.averageTicket || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Validation Alerts */}
                      {analysisResults.analysisMetadata?.validationErrors?.length > 0 && (
                        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <AlertTitle className="text-yellow-800 dark:text-yellow-200">
                            Data Validation Notices ({analysisResults.analysisMetadata.validationErrors.length})
                          </AlertTitle>
                          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                            <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                              {analysisResults.analysisMetadata.validationErrors.map((error: string, index: number) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Optimization Tips */}
                      {analysisResults.analysisMetadata?.improvementSuggestions?.length > 0 && (
                        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                          <Lightbulb className="h-4 w-4 text-blue-600" />
                          <AlertTitle className="text-blue-800 dark:text-blue-200">
                            OCR Optimization Tips
                          </AlertTitle>
                          <AlertDescription className="text-blue-700 dark:text-blue-300">
                            <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                              {analysisResults.analysisMetadata.improvementSuggestions.map((suggestion: string, index: number) => (
                                <li key={index}>{suggestion}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Detailed Report Accordion */}
                      {analysisResults.qualityReport && (
                        <div className="border rounded-lg">
                          <details className="group">
                            <summary className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                              <span className="font-medium">View Detailed OCR Analysis Report</span>
                              <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                            </summary>
                            <div className="p-4 border-t">
                              <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto whitespace-pre-wrap font-mono">
                                {analysisResults.qualityReport}
                              </pre>
                            </div>
                          </details>
                        </div>
                      )}
                      {/* OCR Test Results */}
                      {analysisResults.testResults && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                            OCR Accuracy Test ({analysisResults.testResults.overallAccuracy}% accurate)
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <strong>Expected Values:</strong>
                              <ul className="text-green-700 dark:text-green-300 mt-1">
                                <li>Volume: ${analysisResults.testResults.expectedData.monthlyVolume.toLocaleString()}</li>
                                <li>Transactions: {analysisResults.testResults.expectedData.transactionCount}</li>
                                <li>Processor: {analysisResults.testResults.expectedData.processorName}</li>
                              </ul>
                            </div>
                            <div>
                              <strong>Extracted Values:</strong>
                              <ul className="text-green-700 dark:text-green-300 mt-1">
                                <li>Volume: ${(analysisResults.testResults.extractedData.monthlyVolume || 0).toLocaleString()}</li>
                                <li>Transactions: {analysisResults.testResults.extractedData.transactionCount || 0}</li>
                                <li>Processor: {analysisResults.testResults.extractedData.currentProcessor?.name || 'Unknown'}</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Processor Comparison Results */}
              {results?.type === 'comparison' && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Processor Comparison Results
                    </CardTitle>
                    <CardDescription>
                      Side-by-side analysis of payment processors for your business
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {results.data.comparisons?.map((comparison: any, index: number) => (
                        <Card key={index} className="p-4 border-l-4 border-l-blue-500">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold text-lg">{comparison.processor.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                {comparison.processor.type.replace('_', ' ')} pricing model
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">
                                ${Math.abs(comparison.savings.monthly).toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-600">
                                {comparison.savings.monthly >= 0 ? 'monthly savings' : 'monthly increase'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                              <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Cost</div>
                              <div className="text-lg font-semibold">${comparison.proposedCosts.totalMonthlyCost.toFixed(2)}</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                              <div className="text-sm text-gray-600 dark:text-gray-400">Effective Rate</div>
                              <div className="text-lg font-semibold">{(comparison.proposedCosts.effectiveRate * 100).toFixed(2)}%</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                              <div className="text-sm text-gray-600 dark:text-gray-400">Annual Impact</div>
                              <div className="text-lg font-semibold text-green-600">${Math.abs(comparison.savings.annual).toFixed(0)}</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                              <div className="text-sm text-gray-600 dark:text-gray-400">ROI</div>
                              <div className="text-lg font-semibold">{comparison.savings.roi.toFixed(1)}%</div>
                            </div>
                          </div>

                          {comparison.recommendations?.length > 0 && (
                            <div className="border-t pt-3">
                              <h5 className="font-medium mb-2">Recommendations:</h5>
                              <ul className="text-sm space-y-1">
                                {comparison.recommendations.map((rec: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-blue-600 mt-1">•</span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Advanced Savings Analysis */}
              {results?.type === 'savings' && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Advanced Savings Analysis
                    </CardTitle>
                    <CardDescription>
                      Detailed cost breakdown and ROI analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <h4 className="font-semibold mb-3 text-red-800 dark:text-red-200">Current Processor</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Monthly Cost:</span>
                            <span className="font-medium">${results.data.savings.current.totalMonthlyCost.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Effective Rate:</span>
                            <span className="font-medium">{(results.data.savings.current.effectiveRate * 100).toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Annual Cost:</span>
                            <span className="font-medium">${results.data.savings.current.annualCost.toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 className="font-semibold mb-3 text-green-800 dark:text-green-200">Proposed Processor</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Monthly Cost:</span>
                            <span className="font-medium">${results.data.savings.proposed.totalMonthlyCost.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Effective Rate:</span>
                            <span className="font-medium">{(results.data.savings.proposed.effectiveRate * 100).toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Annual Cost:</span>
                            <span className="font-medium">${results.data.savings.proposed.annualCost.toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h4 className="font-semibold mb-4">Financial Impact Summary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            ${Math.abs(results.data.savings.monthly).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">Monthly {results.data.savings.monthly >= 0 ? 'Savings' : 'Increase'}</div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            ${Math.abs(results.data.savings.annual).toFixed(0)}
                          </div>
                          <div className="text-sm text-gray-600">Annual {results.data.savings.annual >= 0 ? 'Savings' : 'Increase'}</div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {results.data.savings.paybackPeriod.toFixed(1)}
                          </div>
                          <div className="text-sm text-gray-600">Payback Months</div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {results.data.savings.roi.toFixed(0)}%
                          </div>
                          <div className="text-sm text-gray-600">Annual ROI</div>
                        </div>
                      </div>
                    </div>

                    {results.data.savings.breakdownAnalysis && (
                      <div className="border-t mt-6 pt-6">
                        <h4 className="font-semibold mb-4">Cost Breakdown Analysis</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-green-600">
                              ${Math.abs(results.data.savings.breakdownAnalysis.processingCostSavings).toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-600">Processing Costs</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-blue-600">
                              ${Math.abs(results.data.savings.breakdownAnalysis.feeSavings).toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-600">Monthly Fees</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-purple-600">
                              ${Math.abs(results.data.savings.breakdownAnalysis.equipmentSavings).toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-600">Equipment Costs</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

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
                  <Label htmlFor="current-processor-select">Current Processor</Label>
                  <Select
                    value={businessData.currentProcessor.name}
                    onValueChange={(value) => {
                      if (value === "custom") {
                        setBusinessData(prev => ({
                          ...prev,
                          currentProcessor: { ...prev.currentProcessor, name: "" }
                        }));
                      } else {
                        handleProcessorSelection(value, true);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your current processor" />
                    </SelectTrigger>
                    <SelectContent>
                      {processors.map((processor: any) => (
                        <SelectItem key={processor.name} value={processor.name}>
                          {processor.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom/Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {businessData.currentProcessor.name && !processors.find((p: any) => p.name === businessData.currentProcessor.name) && (
                  <div>
                    <Label htmlFor="custom-processor-name">Custom Processor Name</Label>
                    <Input
                      id="custom-processor-name"
                      placeholder="Enter processor name"
                      value={businessData.currentProcessor.name}
                      onChange={(e) => {
                        setBusinessData(prev => ({
                          ...prev,
                          currentProcessor: { ...prev.currentProcessor, name: e.target.value }
                        }));
                      }}
                    />
                  </div>
                )}
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
                  <Label htmlFor="proposed-processor-select">Proposed Processor</Label>
                  <Select
                    value={businessData.proposedProcessor.name}
                    onValueChange={(value) => {
                      if (value === "custom") {
                        setBusinessData(prev => ({
                          ...prev,
                          proposedProcessor: { ...prev.proposedProcessor, name: "" }
                        }));
                      } else {
                        handleProcessorSelection(value, false);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select proposed processor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TracerPay">TracerPay (Recommended)</SelectItem>
                      {processors.filter((p: any) => p.name !== "TracerPay").map((processor: any) => (
                        <SelectItem key={processor.name} value={processor.name}>
                          {processor.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom/Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {businessData.proposedProcessor.name && !processors.find((p: any) => p.name === businessData.proposedProcessor.name) && (
                  <div>
                    <Label htmlFor="custom-proposed-name">Custom Processor Name</Label>
                    <Input
                      id="custom-proposed-name"
                      placeholder="Enter processor name"
                      value={businessData.proposedProcessor.name}
                      onChange={(e) => {
                        setBusinessData(prev => ({
                          ...prev,
                          proposedProcessor: { ...prev.proposedProcessor, name: e.target.value }
                        }));
                      }}
                    />
                  </div>
                )}
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
      </Tabs>
    </div>
  );
}
