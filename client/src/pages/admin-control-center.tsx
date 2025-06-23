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
  RefreshCw,
  FolderOpen
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

const categories = ["General", "Payment Processing", "Compliance", "Technical", "Pricing"];

// Three-Step Document Upload Component
function ThreeStepDocumentUpload({ foldersData, onUploadComplete }: { 
  foldersData: any[], 
  onUploadComplete: () => void 
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [permissions, setPermissions] = useState<"admin-only" | "all-users">("all-users");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Upload Successful",
        description: `${selectedFiles.length} document(s) uploaded successfully`,
      });
      setCurrentStep(1);
      setSelectedFiles([]);
      setSelectedFolder("");
      setPermissions("all-users");
      onUploadComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload documents",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    if (files.length > 0) {
      setCurrentStep(2);
    }
  };

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolder(folderId);
    setCurrentStep(3);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });
    
    if (selectedFolder) {
      formData.append('folderId', selectedFolder);
    }
    formData.append('permissions', permissions);

    uploadMutation.mutate(formData);
  };

  const resetUpload = () => {
    setCurrentStep(1);
    setSelectedFiles([]);
    setSelectedFolder("");
    setPermissions("all-users");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep >= step 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {step}
              </div>
              {step < 3 && (
                <div className={`
                  w-12 h-0.5 mx-2
                  ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>
        <Button variant="ghost" onClick={resetUpload} className="text-sm">
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className={currentStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
          1. Select Files
        </div>
        <div className={currentStep >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
          2. Choose Folder
        </div>
        <div className={currentStep >= 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
          3. Set Permissions
        </div>
      </div>

      <div className="border rounded-lg p-6">
        {currentStep === 1 && (
          <div className="text-center space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Select Files to Upload</h3>
              <p className="text-gray-500 mb-4">
                Choose documents, PDFs, images, or other files to add to your knowledge base
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.csv,.jpg,.jpeg,.png"
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Choose Files
              </Button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Selected Files ({selectedFiles.length})</h3>
              <div className="space-y-2 mb-6">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{file.name}</span>
                    <Badge variant="outline">{Math.round(file.size / 1024)}KB</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Choose Destination Folder</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div 
                  onClick={() => handleFolderSelect("")}
                  className={`
                    border rounded-lg p-4 cursor-pointer transition-colors
                    ${selectedFolder === "" 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Unassigned</div>
                      <div className="text-sm text-gray-500">Place in root directory</div>
                    </div>
                  </div>
                </div>

                {Array.isArray(foldersData) && foldersData.map((folder: any) => (
                  <div 
                    key={folder.id}
                    onClick={() => handleFolderSelect(folder.id)}
                    className={`
                      border rounded-lg p-4 cursor-pointer transition-colors
                      ${selectedFolder === folder.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5" />
                      <div>
                        <div className="font-medium">{folder.name}</div>
                        <div className="text-sm text-gray-500">
                          {folder.documentCount || 0} documents
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Review Upload Details</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Files:</span>
                  <span className="font-medium">{selectedFiles.length} selected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Destination:</span>
                  <span className="font-medium">
                    {selectedFolder 
                      ? foldersData?.find((f: any) => f.id === selectedFolder)?.name || "Unknown Folder"
                      : "Unassigned (Root)"
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Size:</span>
                  <span className="font-medium">
                    {Math.round(selectedFiles.reduce((acc, file) => acc + file.size, 0) / 1024)}KB
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Set Access Permissions</h3>
              <div className="space-y-3">
                <div 
                  onClick={() => setPermissions("all-users")}
                  className={`
                    border rounded-lg p-4 cursor-pointer transition-colors
                    ${permissions === "all-users" 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-4 h-4 rounded-full border-2
                      ${permissions === "all-users" 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                      }
                    `}>
                      {permissions === "all-users" && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">All Users</div>
                      <div className="text-sm text-gray-500">
                        Documents visible to all authenticated users
                      </div>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => setPermissions("admin-only")}
                  className={`
                    border rounded-lg p-4 cursor-pointer transition-colors
                    ${permissions === "admin-only" 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-4 h-4 rounded-full border-2
                      ${permissions === "admin-only" 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                      }
                    `}>
                      {permissions === "admin-only" && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">Admin Only</div>
                      <div className="text-sm text-gray-500">
                        Restricted access for administrators only
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(2)}
                disabled={isUploading}
              >
                Back
              </Button>
              <Button 
                onClick={handleUpload}
                disabled={isUploading || selectedFiles.length === 0}
                className="min-w-[120px]"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
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
    const interactions = (trainingData && typeof trainingData === 'object' && 'interactions' in trainingData && Array.isArray((trainingData as any).interactions)) ? (trainingData as any).interactions : [];
    
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
          <div className="space-y-6">
            {/* Document Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  3-Step Document Upload Process
                </CardTitle>
                <CardDescription>
                  Upload documents with proper folder organization and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ThreeStepDocumentUpload 
                  foldersData={foldersData}
                  onUploadComplete={() => {
                    queryClient.invalidateQueries({ queryKey: ['/api/admin/documents'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/admin/folders'] });
                  }}
                />
              </CardContent>
            </Card>

            {/* Document Management Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Management Center
                </CardTitle>
                <CardDescription>
                  Manage documents across {Array.isArray(foldersData) ? foldersData.length : 0} folders with {Array.isArray(documentsData) ? documentsData.length : 0} total documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documentsLoading || foldersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading documents...</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className="p-4">
                        <div className="text-2xl font-bold">{Array.isArray(documentsData) ? documentsData.length : 0}</div>
                        <div className="text-sm text-gray-600">Total Documents</div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-2xl font-bold">{Array.isArray(foldersData) ? foldersData.length : 0}</div>
                        <div className="text-sm text-gray-600">Folders</div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-2xl font-bold">
                          {Array.isArray(documentsData) ? documentsData.filter((d: any) => d.folderId).length : 0}
                        </div>
                        <div className="text-sm text-gray-600">Organized</div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-2xl font-bold">
                          {Array.isArray(documentsData) ? documentsData.filter((d: any) => !d.folderId).length : 0}
                        </div>
                        <div className="text-sm text-gray-600">Unassigned</div>
                      </Card>
                    </div>

                    {/* Folders with Documents */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Documents by Folder</h3>
                      {Array.isArray(foldersData) ? foldersData.map((folder: any) => {
                        const folderDocs = Array.isArray(documentsData) ? 
                          documentsData.filter((doc: any) => doc.folderId === folder.id) : [];
                        
                        return (
                          <Card key={folder.id} className="overflow-hidden">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FolderOpen className="h-5 w-5" />
                                  <h4 className="font-semibold">{folder.name}</h4>
                                  <Badge variant="secondary">{folderDocs.length} documents</Badge>
                                </div>
                                <Button variant="ghost" size="sm">
                                  <Plus className="h-4 w-4" />
                                  Add Document
                                </Button>
                              </div>
                              {folder.description && (
                                <p className="text-sm text-gray-600 mt-2">{folder.description}</p>
                              )}
                            </div>
                            {folderDocs.length > 0 && (
                              <div className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {folderDocs.slice(0, 6).map((doc: any) => (
                                    <div key={doc.id} className="border rounded-lg p-3">
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                          <h5 className="font-medium truncate text-sm">{doc.originalName || doc.name}</h5>
                                          <p className="text-xs text-gray-500">{doc.mimeType}</p>
                                        </div>
                                        <Badge variant="outline" className="ml-2 text-xs">
                                          {Math.round(doc.size / 1024)}KB
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handlePreviewDocument(doc)}
                                          className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                                        >
                                          <Eye className="h-3 w-3" />
                                          View
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleDownloadDocument(doc)}
                                          className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                                        >
                                          <Download className="h-3 w-3" />
                                          Download
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleEditDocument(doc)}
                                          className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                                        >
                                          <Edit className="h-3 w-3" />
                                          Edit
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {folderDocs.length > 6 && (
                                  <div className="mt-3 text-center">
                                    <Button variant="ghost" size="sm">
                                      View all {folderDocs.length} documents
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </Card>
                        );
                      }) : null}

                      {/* Unassigned Documents */}
                      {Array.isArray(documentsData) && documentsData.filter((d: any) => !d.folderId).length > 0 && (
                        <Card>
                          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b">
                            <div className="flex items-center gap-2">
                              <Folder className="h-5 w-5" />
                              <h4 className="font-semibold">Unassigned Documents</h4>
                              <Badge variant="destructive">
                                {documentsData.filter((d: any) => !d.folderId).length} documents
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                              Documents that need to be organized into folders
                            </p>
                          </div>
                          <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {documentsData.filter((d: any) => !d.folderId).slice(0, 6).map((doc: any) => (
                                <div key={doc.id} className="border rounded-lg p-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 min-w-0">
                                      <h5 className="font-medium truncate text-sm">{doc.originalName || doc.name}</h5>
                                      <p className="text-xs text-gray-500">{doc.mimeType}</p>
                                    </div>
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {Math.round(doc.size / 1024)}KB
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handlePreviewDocument(doc)}
                                      className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                                    >
                                      <Eye className="h-3 w-3" />
                                      View
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditDocument(doc)}
                                      className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                                    >
                                      <Edit className="h-3 w-3" />
                                      Assign
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </Card>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
                <div className="text-2xl font-bold">{(trainingData && typeof trainingData === 'object' && 'accuracyRate' in trainingData) ? (trainingData as any).accuracyRate : 0}%</div>
                <Progress value={(trainingData && typeof trainingData === 'object' && 'accuracyRate' in trainingData) ? (trainingData as any).accuracyRate : 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Corrections Made</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(trainingData && typeof trainingData === 'object' && 'totalCorrections' in trainingData) ? (trainingData as any).totalCorrections : 0}</div>
                <p className="text-xs text-muted-foreground">
                  {(trainingData && typeof trainingData === 'object' && 'pendingCorrections' in trainingData) ? (trainingData as any).pendingCorrections : 0} pending review
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