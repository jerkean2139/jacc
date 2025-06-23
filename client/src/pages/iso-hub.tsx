import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Upload, 
  FileText, 
  Calculator, 
  TrendingDown, 
  DollarSign, 
  Building2, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Download,
  RefreshCw,
  ArrowRight,
  BarChart3,
  PieChart,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AnalysisResult {
  businessName: string;
  currentProcessor: string;
  monthlyVolume: number;
  transactionCount: number;
  averageTicket: number;
  effectiveRate: number;
  monthlyFees: number;
  potentialSavings: {
    monthly: number;
    annual: number;
    percentage: number;
  };
  competitiveAnalysis: {
    tracerPay: {
      rate: number;
      monthlyFees: number;
      savings: number;
    };
    marketAverage: number;
  };
}

export default function ISOHub() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showProposalWizard, setShowProposalWizard] = useState(false);

  // Fetch recent analyses
  const { data: recentAnalyses = [] } = useQuery({
    queryKey: ["/api/iso-amp/analyses"],
    staleTime: 30000,
  });

  const handleStatementUpload = async (file: File) => {
    if (!file) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      const formData = new FormData();
      formData.append('statement', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev < 85) return prev + 3;
          return prev;
        });
      }, 2000);

      const response = await fetch('/api/iso-amp/analyze-statement', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result);

      toast({
        title: "Analysis Complete",
        description: `Analyzed ${file.name} successfully`,
      });

      // Refresh recent analyses
      queryClient.invalidateQueries({ queryKey: ["/api/iso-amp/analyses"] });

    } catch (error) {
      console.error('Statement analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze statement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleStatementUpload(file);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            ISO Hub - Statement Analysis
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Analyze processor statements and create competitive proposals
          </p>
        </div>

        <Tabs defaultValue="analyze" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analyze">Analyze Statement</TabsTrigger>
            <TabsTrigger 
              value="iso-amp" 
              disabled 
              className="relative cursor-not-allowed group"
              title="Coming Soon"
            >
              ISO-AMP
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                Coming Soon
              </span>
            </TabsTrigger>
            <TabsTrigger value="proposals">Create Proposal</TabsTrigger>
          </TabsList>

          {/* Statement Analysis Tab */}
          <TabsContent value="analyze" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Processor Statement
                  </CardTitle>
                  <CardDescription>
                    Upload a PDF or image of the merchant's current processor statement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div 
                    className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={handleFileSelect}
                  >
                    <FileText className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Click to upload statement
                    </p>
                    <p className="text-sm text-slate-500">
                      Supports PDF, JPG, PNG files up to 10MB
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </CardContent>
              </Card>

              {/* Analysis Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Analysis Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isAnalyzing ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Analyzing statement...</span>
                      </div>
                      <Progress value={analysisProgress} className="w-full" />
                    </div>
                  ) : analysisResult ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-500">Business</p>
                          <p className="font-medium">{analysisResult.businessName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Current Processor</p>
                          <p className="font-medium">{analysisResult.currentProcessor}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Monthly Volume</p>
                          <p className="font-medium">{formatCurrency(analysisResult.monthlyVolume)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Effective Rate</p>
                          <p className="font-medium">{analysisResult.effectiveRate}%</p>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                          Potential Savings with TracerPay
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span>Monthly:</span>
                          <span className="font-medium text-green-600">{formatCurrency(analysisResult.potentialSavings.monthly)}</span>
                          <span>Annual:</span>
                          <span className="font-medium text-green-600">{formatCurrency(analysisResult.potentialSavings.annual)}</span>
                        </div>
                      </div>

                      <Button 
                        className="w-full"
                        onClick={() => setShowProposalWizard(true)}
                      >
                        Create Proposal <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      Upload a statement to see analysis results
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Analyses */}
            {recentAnalyses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Analyses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentAnalyses.slice(0, 5).map((analysis: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <div>
                          <p className="font-medium">{analysis.businessName}</p>
                          <p className="text-sm text-slate-500">{analysis.uploadedAt}</p>
                        </div>
                        <Badge variant="secondary">
                          {formatCurrency(analysis.potentialSavings)} savings
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ISO-AMP Tab */}
          <TabsContent value="iso-amp" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Agent Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">24</div>
                      <p className="text-sm text-slate-500">Active Agents</p>
                    </div>
                    <Button className="w-full" variant="outline">
                      Manage Agents
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Commission Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">$12,450</div>
                      <p className="text-sm text-slate-500">This Month</p>
                    </div>
                    <Button className="w-full" variant="outline">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Merchant Pipeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">18</div>
                      <p className="text-sm text-slate-500">Pending Deals</p>
                    </div>
                    <Button className="w-full" variant="outline">
                      View Pipeline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>ISO-AMP Dashboard</CardTitle>
                <CardDescription>
                  Comprehensive agent and merchant management platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">
                    Coming Soon: Full ISO-AMP Integration
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300 mb-4">
                    Advanced agent management, commission tracking, and merchant pipeline tools are being integrated.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Statement Analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">Agent Dashboard</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">Commission Calculator</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">Pipeline Management</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Proposals Tab */}
          <TabsContent value="proposals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Proposal Generator
                </CardTitle>
                <CardDescription>
                  Create professional proposals with side-by-side comparisons
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    size="lg" 
                    className="w-full"
                    onClick={() => setShowProposalWizard(true)}
                  >
                    <Calculator className="w-5 h-5 mr-2" />
                    Start Proposal Wizard
                  </Button>
                  
                  <div className="text-center text-slate-500">
                    <p>Create customized proposals with:</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Current vs TracerPay cost comparison</li>
                      <li>• Detailed savings breakdown</li>
                      <li>• Professional PDF output</li>
                      <li>• Equipment recommendations</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Proposal Wizard Modal */}
      <Dialog open={showProposalWizard} onOpenChange={setShowProposalWizard}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Proposal Wizard</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                Coming Soon: Interactive Proposal Builder
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                The proposal wizard will guide you through creating professional proposals with:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-300">
                <li>• Merchant information input</li>
                <li>• Current processor analysis</li>
                <li>• TracerPay pricing configuration</li>
                <li>• Equipment recommendations</li>
                <li>• Professional PDF generation</li>
              </ul>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowProposalWizard(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}