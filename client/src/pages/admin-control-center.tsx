import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  FileText, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Upload,
  Download,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Folder,
  Star,
  Eye,
  BookOpen,
  HelpCircle,
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Brain,
  Zap,
  Database,
  Activity,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// import DocumentPreviewModal from "@/components/ui/document-preview-modal";
import { SettingsManager } from "@/components/settings-manager";

interface DocumentEntry {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  folderId?: string;
}

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  priority: number;
  isActive: boolean;
}

export default function AdminControlCenter() {
  const [activeTab, setActiveTab] = useState("qa-knowledge");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<DocumentEntry | null>(null);
  const [showChatReviewModal, setShowChatReviewModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Q&A Knowledge Base data
  const { data: faqData, isLoading: faqLoading } = useQuery({
    queryKey: ['/api/admin/faq'],
    enabled: activeTab === "qa-knowledge"
  });

  // Fetch documents data
  const { data: documentsData, isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/admin/documents'],
    enabled: activeTab === "document-center"
  });

  // Fetch folders data
  const { data: foldersData, isLoading: foldersLoading } = useQuery({
    queryKey: ['/api/admin/folders'],
    enabled: activeTab === "document-center"
  });

  // Fetch training analytics
  const { data: trainingData, isLoading: trainingLoading } = useQuery({
    queryKey: ['/api/admin/training/analytics'],
    enabled: activeTab === "training-feedback"
  });

  const handlePreviewDocument = (document: DocumentEntry) => {
    setPreviewDocument(document);
    setShowPreviewModal(true);
  };

  const handleDownloadDocument = (doc: DocumentEntry) => {
    const link = document.createElement('a');
    link.href = `/api/documents/download/${doc.id}`;
    link.download = doc.originalName || doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditDocument = (document: DocumentEntry) => {
    toast({
      title: "Edit Document",
      description: "Document editing functionality will be available soon.",
    });
  };

  function TrainingInteractionsTable() {
    const interactions = Array.isArray(trainingData?.interactions) ? trainingData.interactions : [];
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Training Interactions</h3>
          <Badge variant="secondary">{interactions.length} interactions</Badge>
        </div>
        
        <div className="border rounded-lg">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">Query</th>
                  <th className="text-left p-3 font-medium">Source</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {interactions.map((interaction: any, index: number) => (
                  <tr key={index} className="border-t hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-3">
                      <div className="font-medium">{interaction.username || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{interaction.userRole || 'User'}</div>
                    </td>
                    <td className="p-3">
                      <div className="max-w-xs truncate">{interaction.query}</div>
                    </td>
                    <td className="p-3">
                      <Badge variant={interaction.source === 'admin_test' ? 'destructive' : 'default'}>
                        {interaction.source === 'admin_test' ? 'Admin Test' : 
                         interaction.source === 'admin_correction' ? 'Correction' : 'User Chat'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant={interaction.wasCorrect ? 'default' : 'secondary'}>
                        {interaction.wasCorrect ? 'Accurate' : 'Needs Review'}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {new Date(interaction.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const categories = Array.isArray(faqData) ? 
    Array.from(new Set(faqData.map((faq: FAQ) => faq.category))) : [];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Control Center</h1>
        <p className="text-muted-foreground mt-2">
          Manage knowledge base, documents, AI prompts, and system training
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="qa-knowledge" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Q&A Knowledge
          </TabsTrigger>
          <TabsTrigger value="document-center" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Document Center
          </TabsTrigger>
          <TabsTrigger value="training-feedback" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Training & Feedback
          </TabsTrigger>
          <TabsTrigger value="chat-review" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat Review
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="qa-knowledge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Q&A Knowledge Base
              </CardTitle>
              <CardDescription>
                Manage frequently asked questions and knowledge base entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {faqLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading FAQ data...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">{Array.isArray(faqData) ? faqData.length : 0} total entries</Badge>
                      <Badge variant="outline">{categories.length} categories</Badge>
                    </div>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add FAQ
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {categories.map(category => {
                      const categoryFAQs = Array.isArray(faqData) ? 
                        faqData.filter((f: FAQ) => f.category === category) : [];
                      
                      return (
                        <Card key={category} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-lg">{category}</h3>
                            <Badge variant="outline">{categoryFAQs.length} questions</Badge>
                          </div>
                          <div className="space-y-2">
                            {categoryFAQs.map((faq: FAQ) => (
                              <div key={faq.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex-1">
                                  <div className="font-medium">{faq.question}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                    {faq.answer}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <Badge variant={faq.isActive ? "default" : "secondary"}>
                                    {faq.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="document-center" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Management Center
              </CardTitle>
              <CardDescription>
                Upload, organize, and manage training documents and resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading documents...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">{Array.isArray(documentsData) ? documentsData.length : 0} documents</Badge>
                      <Badge variant="outline">{Array.isArray(foldersData) ? foldersData.length : 0} folders</Badge>
                    </div>
                    <Button className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Documents
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.isArray(documentsData) ? documentsData.slice(0, 6).map((doc: DocumentEntry) => (
                      <Card key={doc.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium truncate">{doc.originalName || doc.name}</h4>
                            <p className="text-sm text-gray-500">{doc.mimeType}</p>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {Math.round(doc.size / 1024)}KB
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewDocument(doc)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadDocument(doc)}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDocument(doc)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                        </div>
                      </Card>
                    )) : null}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training-feedback" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(trainingData && typeof trainingData === 'object' && 'totalInteractions' in trainingData) ? (trainingData as any).totalInteractions : 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{(trainingData && typeof trainingData === 'object' && 'recentInteractions' in trainingData) ? (trainingData as any).recentInteractions : 0} this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{trainingData?.accuracyRate || 0}%</div>
                <Progress value={trainingData?.accuracyRate || 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Corrections Made</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{trainingData?.totalCorrections || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {trainingData?.pendingCorrections || 0} pending review
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Training Analytics & Feedback
              </CardTitle>
              <CardDescription>
                Monitor AI performance and training effectiveness
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trainingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading training data...</span>
                </div>
              ) : (
                <TrainingInteractionsTable />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat-review" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat Review & Training Center
              </CardTitle>
              <CardDescription>
                Review conversations and train AI responses through interactive correction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <h3 className="text-lg font-medium">Chat Review System</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                      Review user conversations and train the AI with better responses for continuous improvement.
                    </p>
                  </div>
                  <Button onClick={() => setShowChatReviewModal(true)}>
                    Open Chat Review Center
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <SettingsManager />
        </TabsContent>
      </Tabs>

      {/* Document Preview Modal - Temporarily disabled */}

      {/* Chat Review Modal */}
      <Dialog open={showChatReviewModal} onOpenChange={setShowChatReviewModal}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat Review & Training Center
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p>Chat review functionality will be integrated here.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}