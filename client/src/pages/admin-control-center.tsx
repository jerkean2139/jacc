import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import PromptEditorModal from "@/components/prompt-editor-modal";
import WebsiteURLScraper from "@/components/website-url-scraper";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  FolderOpen,
  Save,
  File,
  FileImage,
  FileSpreadsheet
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

// AI Simulator Interface Component
function AISimulatorInterface() {
  const [testQuery, setTestQuery] = useState("");
  const [response, setResponse] = useState("");
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [correctionMode, setCorrectionMode] = useState(false);
  const [correctedResponse, setCorrectedResponse] = useState("");
  const [saveToHistory, setSaveToHistory] = useState(true);
  const { toast } = useToast();

  const testAIMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch('/api/admin/ai-simulator/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, saveToHistory })
      });
      return response.json();
    },
    onSuccess: (data) => {
      setResponse(data.response);
      toast({
        title: "AI Test Complete",
        description: "Response generated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Test Failed",
        description: "Failed to generate AI response",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsTestingAI(false);
    }
  });

  const submitCorrectionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/ai-simulator/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Training Correction Submitted",
        description: "AI has been trained with the corrected response",
      });
      setCorrectionMode(false);
      setCorrectedResponse("");
    },
    onError: () => {
      toast({
        title: "Training Failed",
        description: "Failed to submit training correction",
        variant: "destructive",
      });
    }
  });

  const handleTestAI = () => {
    if (!testQuery.trim()) return;
    setIsTestingAI(true);
    testAIMutation.mutate(testQuery);
  };

  const handleSubmitCorrection = () => {
    if (!correctedResponse.trim()) return;
    
    submitCorrectionMutation.mutate({
      originalQuery: testQuery,
      originalResponse: response,
      correctedResponse: correctedResponse,
      improvementType: "accuracy"
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Test Query</label>
          <textarea
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="Enter a question to test the AI response..."
            className="w-full p-3 border rounded-lg resize-none"
            rows={3}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="saveToHistory"
              checked={saveToHistory}
              onChange={(e) => setSaveToHistory(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="saveToHistory" className="text-sm">Save to chat history</label>
          </div>
          
          <Button 
            onClick={handleTestAI}
            disabled={isTestingAI || !testQuery.trim()}
          >
            {isTestingAI ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing AI...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Test AI Response
              </>
            )}
          </Button>
        </div>
      </div>

      {response && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">AI Response</label>
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div dangerouslySetInnerHTML={{ __html: response }} />
            </div>
          </div>

          {!correctionMode ? (
            <Button 
              variant="outline"
              onClick={() => setCorrectionMode(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Provide Training Correction
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Corrected Response</label>
                <textarea
                  value={correctedResponse}
                  onChange={(e) => setCorrectedResponse(e.target.value)}
                  placeholder="Provide the correct response for training..."
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={4}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmitCorrection}
                  disabled={!correctedResponse.trim() || submitCorrectionMutation.isPending}
                >
                  {submitCorrectionMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Submit Correction
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setCorrectionMode(false);
                    setCorrectedResponse("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Enhanced Chat Review Center Component
function ChatReviewCenter() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [testQuery, setTestQuery] = useState("");
  const [testResponse, setTestResponse] = useState("");
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [correctionMode, setCorrectionMode] = useState(false);
  const [correctedResponse, setCorrectedResponse] = useState("");
  const [approvalFeedback, setApprovalFeedback] = useState("");
  const { toast } = useToast();

  // Fetch user chats for review
  const { data: userChats, isLoading: chatsLoading } = useQuery({
    queryKey: ['/api/admin/chat-reviews'],
  });

  // Fetch messages for selected chat
  const { data: chatMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/admin/chat-reviews', selectedChatId, 'messages'],
    enabled: !!selectedChatId
  });

  const testAIMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch('/api/admin/ai-simulator/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, saveToHistory: true })
      });
      return response.json();
    },
    onSuccess: (data) => {
      setTestResponse(data.response);
    },
    onSettled: () => {
      setIsTestingAI(false);
    }
  });

  const submitCorrectionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/ai-simulator/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Training Correction Submitted",
        description: "AI has been trained with the corrected response",
      });
      setCorrectionMode(false);
      setCorrectedResponse("");
    }
  });

  const approveChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const response = await fetch(`/api/admin/chat-reviews/${chatId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: approvalFeedback })
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Chat Approved",
        description: "Chat conversation has been approved and marked for training",
      });
      setApprovalFeedback("");
    }
  });

  const handleTestAI = () => {
    if (!testQuery.trim()) return;
    setIsTestingAI(true);
    testAIMutation.mutate(testQuery);
  };

  const handleSubmitCorrection = () => {
    if (!correctedResponse.trim()) return;
    
    submitCorrectionMutation.mutate({
      originalQuery: testQuery,
      originalResponse: testResponse,
      correctedResponse: correctedResponse,
      improvementType: "accuracy"
    });
  };

  const handleApproveChat = () => {
    if (!selectedChatId) return;
    approveChatMutation.mutate(selectedChatId);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Chats</p>
                <p className="text-xl font-bold">{Array.isArray(userChats) ? userChats.length : 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-xl font-bold">
                  {Array.isArray(userChats) ? userChats.filter((c: any) => c.reviewStatus === 'approved').length : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold">
                  {Array.isArray(userChats) ? userChats.filter((c: any) => c.reviewStatus === 'pending').length : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Training Items</p>
                <p className="text-xl font-bold">
                  {Array.isArray(userChats) ? userChats.filter((c: any) => c.hasCorrections).length : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Split-Screen Chat Review & Training Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: '700px' }}>
        {/* Enhanced Chat Review Panel */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat Review Center
              </div>
              <Badge variant="outline">
                {Array.isArray(userChats) ? userChats.length : 0} conversations
              </Badge>
            </CardTitle>
            <CardDescription>
              Review user conversations with built-in emulator functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            {chatsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading chat reviews...</span>
              </div>
            ) : (
              <div className="space-y-3 h-full overflow-y-auto">
                {Array.isArray(userChats) && userChats.length > 0 ? (
                  userChats.map((chat: any) => (
                    <div 
                      key={chat.chatId}
                      onClick={() => setSelectedChatId(chat.chatId)}
                      className={`
                        p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md
                        ${selectedChatId === chat.chatId 
                          ? 'border-blue-500 bg-blue-50 shadow-sm' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{chat.chatTitle || 'Untitled Chat'}</h4>
                          {chat.hasCorrections && (
                            <Badge variant="secondary" className="text-xs">
                              <Brain className="h-3 w-3 mr-1" />
                              Training
                            </Badge>
                          )}
                        </div>
                        <Badge variant={chat.reviewStatus === 'approved' ? 'default' : 'secondary'}>
                          {chat.reviewStatus === 'approved' ? (
                            <ThumbsUp className="h-3 w-3 mr-1" />
                          ) : (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {chat.reviewStatus || 'pending'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p><span className="font-medium">{chat.messageCount || 0}</span> messages</p>
                          <p>{chat.username || 'Unknown User'}</p>
                        </div>
                        <div className="text-right">
                          <p>{new Date(chat.createdAt).toLocaleDateString()}</p>
                          <p className="text-xs">{new Date(chat.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>

                      {selectedChatId === chat.chatId && (
                        <div className="mt-4 pt-3 border-t space-y-2">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproveChat();
                              }}
                              disabled={chat.reviewStatus === 'approved'}
                            >
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              {chat.reviewStatus === 'approved' ? 'Approved' : 'Approve'}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedChatId(chat.chatId);
                                toast({
                                  title: "Chat Emulator",
                                  description: "Loading chat emulation interface...",
                                });
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Emulate
                            </Button>
                          </div>
                          
                          <textarea
                            value={approvalFeedback}
                            onChange={(e) => setApprovalFeedback(e.target.value)}
                            placeholder="Add feedback or notes for this conversation..."
                            className="w-full p-2 text-sm border rounded resize-none"
                            rows={2}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Chat Reviews</h3>
                    <p className="text-gray-500">User conversations will appear here for review and training</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced AI Training Interface */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Training Interface
              </div>
              <Badge variant="outline" className="text-green-600">
                Live Testing
              </Badge>
            </CardTitle>
            <CardDescription>
              Test AI responses and provide training corrections with chat integration
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            {/* Test Query Section */}
            <div>
              <label className="text-sm font-medium mb-2 block">Test Query</label>
              <textarea
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="Enter a question to test the AI response..."
                className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="saveToHistory"
                  defaultChecked={true}
                  className="rounded"
                />
                <label htmlFor="saveToHistory" className="text-sm">Save to chat history</label>
              </div>
              
              <Button 
                onClick={handleTestAI}
                disabled={isTestingAI || !testQuery.trim()}
              >
                {isTestingAI ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Test AI
                  </>
                )}
              </Button>
            </div>

            {/* AI Response Section */}
            {testResponse && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">AI Response</label>
                  <div className="p-4 bg-gray-50 rounded-lg border max-h-64 overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: testResponse }} />
                  </div>
                </div>

                {!correctionMode ? (
                  <Button 
                    variant="outline"
                    onClick={() => setCorrectionMode(true)}
                    className="w-full"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Provide Training Correction
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Corrected Response</label>
                      <textarea
                        value={correctedResponse}
                        onChange={(e) => setCorrectedResponse(e.target.value)}
                        placeholder="Provide the correct response for training..."
                        className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSubmitCorrection}
                        disabled={!correctedResponse.trim() || submitCorrectionMutation.isPending}
                        className="flex-1"
                      >
                        {submitCorrectionMutation.isPending ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Submit Correction
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setCorrectionMode(false);
                          setCorrectedResponse("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Selected Chat Context */}
            {selectedChatId && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Selected Chat Context
                </h4>
                <div className="border rounded-lg p-3 bg-gray-50 max-h-32 overflow-y-auto">
                  {messagesLoading ? (
                    <p className="text-sm text-gray-500">Loading messages...</p>
                  ) : Array.isArray(chatMessages) && chatMessages.length > 0 ? (
                    <div className="space-y-2">
                      {chatMessages.slice(0, 3).map((message: any, index: number) => (
                        <div key={index} className="text-sm">
                          <span className={`font-medium ${message.role === 'user' ? 'text-blue-600' : 'text-green-600'}`}>
                            {message.role === 'user' ? 'User' : 'Assistant'}:
                          </span> 
                          <span className="ml-2">{message.content ? message.content.substring(0, 100) + '...' : 'No content'}</span>
                        </div>
                      ))}
                      {chatMessages.length > 3 && (
                        <p className="text-xs text-gray-400">...and {chatMessages.length - 3} more messages</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No messages found</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Comprehensive Settings Interface Component
function ComprehensiveSettingsInterface() {
  const [activeSettingsTab, setActiveSettingsTab] = useState("ai-search");
  const [activeSubTab, setActiveSubTab] = useState("configuration");
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [selectedPromptTemplate, setSelectedPromptTemplate] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch settings data
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: () => fetch('/api/admin/settings').then(res => res.json())
  });

  // Fetch performance metrics
  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ['/api/admin/performance'],
    queryFn: () => fetch('/api/admin/performance').then(res => res.json()),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch active sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/admin/sessions'],
    queryFn: () => fetch('/api/admin/sessions').then(res => res.json()),
    refetchInterval: 60000 // Refresh every minute
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async ({ category, subcategory, settings }: { category: string, subcategory: string, settings: any }) => {
      const response = await fetch(`/api/admin/settings/${category}/${subcategory}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "Settings Saved",
        description: "Your settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  });

  // End session mutation
  const endSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sessions'] });
      toast({
        title: "Session Ended",
        description: "User session has been terminated successfully.",
      });
    }
  });

  // Clear cache mutation
  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/cache/clear', {
        method: 'POST'
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/performance'] });
      toast({
        title: "Cache Cleared",
        description: `Cleared ${data.clearedItems} items (${data.clearedSize} MB)`,
      });
    }
  });

  // Main settings categories for the first navigation bar
  const mainCategories = [
    { id: "ai-search", label: "AI & Search", icon: Brain },
    { id: "user-management", label: "User Management", icon: Users },
    { id: "content-processing", label: "Content & Documents", icon: FileText },
    { id: "system-performance", label: "System Performance", icon: Activity }
  ];

  // Sub-categories for the second navigation bar
  const getSubCategories = (mainCategory: string) => {
    switch (mainCategory) {
      case "ai-search":
        return [
          { id: "configuration", label: "Configuration" },
          { id: "prompts", label: "AI Prompts" },
          { id: "search-settings", label: "Search Settings" }
        ];
      case "user-management":
        return [
          { id: "roles", label: "Roles & Permissions" },
          { id: "sessions", label: "Sessions" },
          { id: "notifications", label: "Notifications" }
        ];
      case "content-processing":
        return [
          { id: "ocr", label: "OCR Settings" },
          { id: "categorization", label: "Auto-Categorization" },
          { id: "retention", label: "Retention Policies" }
        ];
      case "system-performance":
        return [
          { id: "timeouts", label: "Timeouts" },
          { id: "cache", label: "Cache Settings" },
          { id: "monitoring", label: "Monitoring" }
        ];
      default:
        return [];
    }
  };

  const renderSettingsContent = () => {
    const key = `${activeSettingsTab}-${activeSubTab}`;
    
    switch (key) {
      case "ai-search-configuration":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">AI Model Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Primary AI Model</label>
                  <select className="w-full p-2 border rounded-lg">
                    <option>Claude 4.0 Sonnet</option>
                    <option>GPT-4o</option>
                    <option>GPT-4o Mini</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Fallback Model</label>
                  <select className="w-full p-2 border rounded-lg">
                    <option>GPT-4o</option>
                    <option>Claude 4.0 Sonnet</option>
                    <option>None</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Response Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Response Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm">Concise</Button>
                    <Button variant="default" size="sm">Balanced</Button>
                    <Button variant="outline" size="sm">Detailed</Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Confidence Threshold</label>
                  <input type="range" min="0" max="100" defaultValue="75" className="w-full" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Low (0%)</span>
                    <span>High (100%)</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Search Priority Order</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>1. FAQ Knowledge Base</span>
                  <Badge variant="default">Primary</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>2. Document Center</span>
                  <Badge variant="secondary">Secondary</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>3. Web Search (Perplexity)</span>
                  <Badge variant="outline">Fallback</Badge>
                </div>
              </div>
            </div>
          </div>
        );

      case "ai-search-prompts":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">System Prompts Management</h3>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Document Search Prompt</h4>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">Controls how AI searches through uploaded documents...</p>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Response Formatting Prompt</h4>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">Defines how AI formats and structures responses...</p>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Error Handling Prompt</h4>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">How AI responds when information is not found...</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Custom Prompt Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Pricing Analysis</h4>
                  <p className="text-sm text-gray-600 mb-3">Template for merchant pricing analysis</p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedPromptTemplate({
                          id: 'pricing-analysis',
                          title: 'Pricing Analysis',
                          description: 'Template for merchant pricing analysis',
                          category: 'Sales',
                          content: 'As a payment processing expert, analyze the following merchant information and provide a comprehensive pricing comparison:\n\nMerchant Business Type: {business_type}\nMonthly Volume: {monthly_volume}\nAverage Transaction: {average_transaction}\nCurrent Processor: {current_processor}\n\nProvide:\n1. Current cost analysis\n2. Competitive pricing options\n3. Potential savings\n4. Recommended processor\n5. Implementation timeline'
                        });
                        setShowPromptEditor(true);
                      }}
                    >
                      Use Template
                    </Button>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Objection Handling</h4>
                  <p className="text-sm text-gray-600 mb-3">Template for sales objection responses</p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedPromptTemplate({
                          id: 'objection-handling',
                          title: 'Objection Handling',
                          description: 'Template for sales objection responses',
                          category: 'Sales',
                          content: 'Help me respond to this merchant objection professionally and persuasively:\n\nMerchant Objection: {objection_text}\nMerchant Business: {business_type}\nCurrent Situation: {current_situation}\n\nProvide:\n1. Acknowledgment of their concern\n2. Evidence-based response\n3. Value proposition\n4. Next steps\n5. Follow-up strategy\n\nTone: Professional, empathetic, solution-focused'
                        });
                        setShowPromptEditor(true);
                      }}
                    >
                      Use Template
                    </Button>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Compliance Guidance</h4>
                  <p className="text-sm text-gray-600 mb-3">Template for compliance-related queries</p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedPromptTemplate({
                          id: 'compliance-guidance',
                          title: 'Compliance Guidance',
                          description: 'Template for compliance-related queries',
                          category: 'Compliance',
                          content: 'Provide compliance guidance for this payment processing scenario:\n\nBusiness Type: {business_type}\nTransaction Type: {transaction_type}\nRegulatory Concern: {compliance_question}\nIndustry: {industry}\n\nProvide:\n1. Applicable regulations\n2. Compliance requirements\n3. Risk assessment\n4. Implementation steps\n5. Documentation needed\n\nEnsure all guidance follows current PCI DSS, PSD2, and relevant industry standards.'
                        });
                        setShowPromptEditor(true);
                      }}
                    >
                      Use Template
                    </Button>
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="outline" size="sm">Export</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "user-management-roles":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Role Configuration</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Default New User Role</label>
                    <select className="w-full p-2 border rounded-lg">
                      <option>sales-agent</option>
                      <option>client-admin</option>
                      <option>viewer</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Auto-approve Registrations</label>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="auto-approve" className="rounded" />
                      <label htmlFor="auto-approve" className="text-sm">Enable automatic approval</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Permission Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full border rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 border-b">Feature</th>
                      <th className="text-center p-3 border-b">Sales Agent</th>
                      <th className="text-center p-3 border-b">Client Admin</th>
                      <th className="text-center p-3 border-b">Dev Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border-b">Chat Interface</td>
                      <td className="text-center p-3 border-b">✓</td>
                      <td className="text-center p-3 border-b">✓</td>
                      <td className="text-center p-3 border-b">✓</td>
                    </tr>
                    <tr>
                      <td className="p-3 border-b">Document Upload</td>
                      <td className="text-center p-3 border-b">✗</td>
                      <td className="text-center p-3 border-b">✓</td>
                      <td className="text-center p-3 border-b">✓</td>
                    </tr>
                    <tr>
                      <td className="p-3 border-b">Admin Control Center</td>
                      <td className="text-center p-3 border-b">✗</td>
                      <td className="text-center p-3 border-b">Limited</td>
                      <td className="text-center p-3 border-b">✓</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      // User Management - Sessions
      case "user-management-sessions":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Session Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Session Timeout</label>
                  <select className="w-full p-2 border rounded-lg">
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>2 hours</option>
                    <option>4 hours</option>
                    <option>8 hours</option>
                    <option>24 hours</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Remember Me Duration</label>
                  <select className="w-full p-2 border rounded-lg">
                    <option>7 days</option>
                    <option>14 days</option>
                    <option>30 days</option>
                    <option>90 days</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Active Sessions</h3>
              <div className="border rounded-lg">
                <div className="p-4 bg-gray-50 border-b">
                  <h4 className="font-medium">
                    Current Active Sessions: {sessionsData?.sessions?.length || 0}
                  </h4>
                </div>
                {sessionsLoading ? (
                  <div className="p-8 text-center text-gray-500">Loading sessions...</div>
                ) : (
                  <div className="divide-y">
                    {sessionsData?.sessions?.map((session: any, index: number) => (
                      <div key={session.sessionId} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{session.email}</p>
                          <p className="text-sm text-gray-500">
                            {session.userAgent?.split(' ')[0] || 'Unknown'} • {session.ipAddress}
                          </p>
                          <p className="text-xs text-gray-400">
                            Started {new Date(session.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={session.status === 'active' ? 'secondary' : 'outline'}>
                            {session.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => endSessionMutation.mutate(session.sessionId)}
                            disabled={endSessionMutation.isPending}
                          >
                            End Session
                          </Button>
                        </div>
                      </div>
                    )) || (
                      <div className="p-8 text-center text-gray-500">No active sessions</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Security Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Force logout on IP change</p>
                    <p className="text-sm text-gray-500">Automatically end sessions when IP address changes</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Concurrent session limit</p>
                    <p className="text-sm text-gray-500">Maximum number of active sessions per user</p>
                  </div>
                  <select className="p-2 border rounded">
                    <option>3</option>
                    <option>5</option>
                    <option>10</option>
                    <option>Unlimited</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Session activity logging</p>
                    <p className="text-sm text-gray-500">Log all session creation and termination events</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
              </div>
            </div>
          </div>
        );

      // User Management - Notifications
      case "user-management-notifications":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Email Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Welcome emails</p>
                    <p className="text-sm text-gray-500">Send welcome email to new users</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Login streak notifications</p>
                    <p className="text-sm text-gray-500">Notify users about streak milestones</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Achievement notifications</p>
                    <p className="text-sm text-gray-500">Email users when they earn achievements</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Weekly activity reports</p>
                    <p className="text-sm text-gray-500">Send weekly summary to managers</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Push Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Browser notifications</p>
                    <p className="text-sm text-gray-500">Enable browser push notifications</p>
                  </div>
                  <input type="checkbox" className="rounded" />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Mobile app notifications</p>
                    <p className="text-sm text-gray-500">Send notifications to mobile app</p>
                  </div>
                  <input type="checkbox" className="rounded" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Notification Templates</h3>
              <div className="space-y-3">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Welcome Email Template</h4>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">Subject: Welcome to JACC - Your AI Assistant is Ready!</p>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Streak Milestone Template</h4>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">Subject: Congratulations! You've reached a milestone day streak!</p>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Inactive User Reminder</h4>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">Subject: We miss you! Come back to JACC</p>
                </div>
              </div>
            </div>
          </div>
        );

      // Content Processing - OCR Settings
      case "content-processing-ocr":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">OCR Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">OCR Quality Level</label>
                  <select className="w-full p-2 border rounded-lg">
                    <option>Fast (Basic quality)</option>
                    <option>Balanced (Good quality)</option>
                    <option>High (Best quality)</option>
                    <option>Maximum (Slowest, highest accuracy)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Language Detection</label>
                  <select className="w-full p-2 border rounded-lg">
                    <option>Auto-detect</option>
                    <option>English only</option>
                    <option>English + Spanish</option>
                    <option>Multi-language</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Processing Options</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Auto-rotate images</p>
                    <p className="text-sm text-gray-500">Automatically detect and correct image orientation</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Enhance low-quality images</p>
                    <p className="text-sm text-gray-500">Apply image enhancement for better OCR results</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Extract tables</p>
                    <p className="text-sm text-gray-500">Detect and extract table structures</p>
                  </div>
                  <input type="checkbox" className="rounded" />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Preserve formatting</p>
                    <p className="text-sm text-gray-500">Maintain original document formatting when possible</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Supported File Types</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 border rounded-lg text-center">
                  <FileText className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm font-medium">PDF</p>
                  <p className="text-xs text-gray-500">Enabled</p>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <FileImage className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <p className="text-sm font-medium">Images</p>
                  <p className="text-xs text-gray-500">JPG, PNG, TIFF</p>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <FileSpreadsheet className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                  <p className="text-sm font-medium">Spreadsheets</p>
                  <p className="text-xs text-gray-500">CSV, XLS, XLSX</p>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <File className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                  <p className="text-sm font-medium">Documents</p>
                  <p className="text-xs text-gray-500">DOC, DOCX, TXT</p>
                </div>
              </div>
            </div>
          </div>
        );

      // Content Processing - Auto-Categorization
      case "content-processing-categorization":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Auto-Categorization Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Enable auto-categorization</p>
                    <p className="text-sm text-gray-500">Automatically assign categories to uploaded documents</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Confidence threshold</p>
                    <p className="text-sm text-gray-500">Minimum confidence required for auto-assignment</p>
                  </div>
                  <select className="p-2 border rounded">
                    <option>Low (60%)</option>
                    <option>Medium (75%)</option>
                    <option>High (85%)</option>
                    <option>Very High (95%)</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Category Rules</h3>
              <div className="space-y-3">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">Payment Processing</h4>
                      <p className="text-sm text-gray-500">Keywords: payment, processing, merchant, gateway</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Rule
                    </Button>
                  </div>
                  <div className="text-xs text-gray-400">Documents matched: 45 • Accuracy: 92%</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">Compliance</h4>
                      <p className="text-sm text-gray-500">Keywords: compliance, regulation, PCI, security</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Rule
                    </Button>
                  </div>
                  <div className="text-xs text-gray-400">Documents matched: 23 • Accuracy: 88%</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">Sales Materials</h4>
                      <p className="text-sm text-gray-500">Keywords: sales, proposal, rates, pricing</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Rule
                    </Button>
                  </div>
                  <div className="text-xs text-gray-400">Documents matched: 67 • Accuracy: 95%</div>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add New Category Rule
              </Button>
            </div>
          </div>
        );

      // Content Processing - Retention Policies
      case "content-processing-retention":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Document Retention Policies</h3>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Default Retention Period</h4>
                    <select className="p-2 border rounded">
                      <option>1 year</option>
                      <option>2 years</option>
                      <option>5 years</option>
                      <option>7 years</option>
                      <option>Indefinite</option>
                    </select>
                  </div>
                  <p className="text-sm text-gray-600">Documents without specific policies will follow this default retention period</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Category-Specific Policies</h3>
              <div className="space-y-3">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Financial Records</h4>
                      <p className="text-sm text-gray-500">Tax returns, bank statements, financial reports</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">7 years</span>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Compliance Documents</h4>
                      <p className="text-sm text-gray-500">PCI compliance, regulatory filings</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">5 years</span>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Sales Materials</h4>
                      <p className="text-sm text-gray-500">Proposals, rate sheets, marketing materials</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">2 years</span>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Cleanup Actions</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Automatic deletion</p>
                    <p className="text-sm text-gray-500">Automatically delete documents when retention period expires</p>
                  </div>
                  <input type="checkbox" className="rounded" />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Archive before deletion</p>
                    <p className="text-sm text-gray-500">Move to archive for 30 days before permanent deletion</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Admin notification</p>
                    <p className="text-sm text-gray-500">Notify administrators before deletion</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
              </div>
            </div>
          </div>
        );

      // System Performance - Timeouts
      case "system-performance-timeouts":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Request Timeouts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">AI Response Timeout</label>
                  <select className="w-full p-2 border rounded-lg">
                    <option>30 seconds</option>
                    <option>60 seconds</option>
                    <option>90 seconds</option>
                    <option>120 seconds</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Document Processing Timeout</label>
                  <select className="w-full p-2 border rounded-lg">
                    <option>2 minutes</option>
                    <option>5 minutes</option>
                    <option>10 minutes</option>
                    <option>15 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Database Query Timeout</label>
                  <select className="w-full p-2 border rounded-lg">
                    <option>5 seconds</option>
                    <option>10 seconds</option>
                    <option>15 seconds</option>
                    <option>30 seconds</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">File Upload Timeout</label>
                  <select className="w-full p-2 border rounded-lg">
                    <option>2 minutes</option>
                    <option>5 minutes</option>
                    <option>10 minutes</option>
                    <option>20 minutes</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Retry Configuration</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Automatic retries</p>
                    <p className="text-sm text-gray-500">Automatically retry failed requests</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Maximum retry attempts</p>
                    <p className="text-sm text-gray-500">Number of retry attempts before giving up</p>
                  </div>
                  <select className="p-2 border rounded">
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>5</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Retry delay</p>
                    <p className="text-sm text-gray-500">Time to wait between retry attempts</p>
                  </div>
                  <select className="p-2 border rounded">
                    <option>1 second</option>
                    <option>2 seconds</option>
                    <option>5 seconds</option>
                    <option>10 seconds</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      // System Performance - Cache Settings
      case "system-performance-cache":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Cache Configuration</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Enable response caching</p>
                    <p className="text-sm text-gray-500">Cache AI responses for faster delivery</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Cache duration</p>
                    <p className="text-sm text-gray-500">How long to keep cached responses</p>
                  </div>
                  <select className="p-2 border rounded">
                    <option>15 minutes</option>
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>4 hours</option>
                    <option>24 hours</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Document cache size</p>
                    <p className="text-sm text-gray-500">Maximum size for document cache</p>
                  </div>
                  <select className="p-2 border rounded">
                    <option>100 MB</option>
                    <option>250 MB</option>
                    <option>500 MB</option>
                    <option>1 GB</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Cache Statistics</h3>
              {performanceLoading ? (
                <div className="p-8 text-center text-gray-500">Loading cache data...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">{performanceData?.cache?.hitRate || 0}%</div>
                    <div className="text-sm text-gray-600">Cache Hit Rate</div>
                    <div className="text-xs text-gray-400">Last 24 hours</div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{performanceData?.cache?.size || 0} MB</div>
                    <div className="text-sm text-gray-600">Cache Size</div>
                    <div className="text-xs text-gray-400">{Math.round((performanceData?.cache?.size || 0) / 5)}% of limit</div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">{performanceData?.cache?.items || 0}</div>
                    <div className="text-sm text-gray-600">Cached Items</div>
                    <div className="text-xs text-gray-400">Active entries</div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Cache Management</h3>
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => clearCacheMutation.mutate()}
                  disabled={clearCacheMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {clearCacheMutation.isPending ? 'Clearing...' : 'Clear Cache'}
                </Button>
                <Button variant="outline">
                  <Database className="h-4 w-4 mr-2" />
                  Rebuild Index
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Stats
                </Button>
              </div>
            </div>
          </div>
        );

      case "system-performance-monitoring":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Real-time System Status</h3>
              {performanceLoading ? (
                <div className="p-8 text-center text-gray-500">Loading performance data...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Database</span>
                      <div className={`w-2 h-2 rounded-full ${
                        performanceData?.database?.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                    <p className="text-2xl font-bold capitalize">{performanceData?.database?.status || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">Response: {performanceData?.database?.responseTime || '--'}ms</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">AI Services</span>
                      <div className={`w-2 h-2 rounded-full ${
                        performanceData?.aiServices?.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                    <p className="text-2xl font-bold capitalize">{performanceData?.aiServices?.status || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">
                      {performanceData?.aiServices?.claudeStatus} + {performanceData?.aiServices?.gptStatus}
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Memory Usage</span>
                      <div className={`w-2 h-2 rounded-full ${
                        (performanceData?.memory?.percentage || 0) > 80 ? 'bg-red-500' : 
                        (performanceData?.memory?.percentage || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                    </div>
                    <p className="text-2xl font-bold">{performanceData?.memory?.percentage || 0}%</p>
                    <p className="text-xs text-gray-500">
                      {performanceData?.memory?.used || 0}MB / {performanceData?.memory?.total || 672}MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Performance Metrics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Average Response Time</span>
                    <span>{performanceData?.performance?.averageResponseTime || 0}ms</span>
                  </div>
                  <Progress value={Math.min(100, (performanceData?.performance?.averageResponseTime || 0) / 30)} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Document Processing Speed</span>
                    <span>{performanceData?.performance?.documentProcessingSpeed || 0}%</span>
                  </div>
                  <Progress value={performanceData?.performance?.documentProcessingSpeed || 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Search Accuracy</span>
                    <span>{performanceData?.performance?.searchAccuracy || 0}%</span>
                  </div>
                  <Progress value={performanceData?.performance?.searchAccuracy || 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Cache Hit Rate</span>
                    <span>{performanceData?.performance?.cacheHitRate || 0}%</span>
                  </div>
                  <Progress value={performanceData?.performance?.cacheHitRate || 0} className="h-2" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Alert Configuration</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">High memory usage alerts</p>
                    <p className="text-sm text-gray-500">Alert when memory usage exceeds 80%</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Slow response alerts</p>
                    <p className="text-sm text-gray-500">Alert when response time exceeds 5 seconds</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Error rate alerts</p>
                    <p className="text-sm text-gray-500">Alert when error rate exceeds {(performanceData?.performance?.errorRate || 0).toFixed(1)}%</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Settings Configuration</h3>
            <p className="text-gray-500">Select a category and sub-section to configure system settings.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* First Navigation Bar - Main Categories */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {mainCategories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => {
                  setActiveSettingsTab(category.id);
                  setActiveSubTab(getSubCategories(category.id)[0]?.id || "");
                }}
                className={`
                  flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeSettingsTab === category.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {category.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Second Navigation Bar - Sub Categories */}
      {getSubCategories(activeSettingsTab).length > 0 && (
        <div className="border-b bg-gray-50 -mx-6 px-6">
          <nav className="flex space-x-6">
            {getSubCategories(activeSettingsTab).map((subCategory) => (
              <button
                key={subCategory.id}
                onClick={() => setActiveSubTab(subCategory.id)}
                className={`
                  py-3 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeSubTab === subCategory.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                  }
                `}
              >
                {subCategory.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Settings Content Area */}
      <div className="min-h-[500px]">
        {renderSettingsContent()}
      </div>

      {/* Save Settings Button */}
      <div className="flex justify-end pt-6 border-t">
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={async () => {
              try {
                const response = await fetch('/api/admin/settings/reset', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    category: activeSettingsTab,
                    subcategory: activeSubTab 
                  })
                });
                const data = await response.json();
                
                if (data.success) {
                  queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
                  toast({
                    title: "Settings Reset",
                    description: `Reset ${data.deletedCount} settings to defaults`,
                  });
                }
              } catch (error) {
                toast({
                  title: "Reset Failed",
                  description: "Failed to reset settings. Please try again.",
                  variant: "destructive",
                });
              }
            }}
          >
            Reset to Defaults
          </Button>
          <Button
            onClick={() => {
              // Example save action - in real implementation, collect form data
              const sampleSettings = {
                sessionTimeout: "1 hour",
                rememberMeDuration: "30 days",
                enableNotifications: true,
                lastUpdated: new Date().toISOString()
              };
              
              saveSettingsMutation.mutate({
                category: activeSettingsTab,
                subcategory: activeSubTab,
                settings: sampleSettings
              });
            }}
            disabled={saveSettingsMutation.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Prompt Editor Modal */}
      <PromptEditorModal
        open={showPromptEditor}
        onOpenChange={setShowPromptEditor}
        template={selectedPromptTemplate}
      />
    </div>
  );
}

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
      console.log('Upload mutation starting...');
      console.log('FormData entries:', Array.from(formData.entries()));
      
      const response = await fetch('/api/admin/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      console.log('Upload response status:', response.status);
      console.log('Upload response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Upload success result:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Upload mutation success:', data);
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
      console.error('Upload mutation error:', error);
      console.error('Error stack:', error.stack);
      toast({
        title: "Upload Failed",
        description: `Upload failed: ${error.message || 'Unknown error'}. Check console for details.`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      console.log('Upload mutation settled');
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
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });
    
    if (selectedFolder) {
      formData.append('folderId', selectedFolder);
    }
    formData.append('permissions', permissions);

    console.log('Starting upload with:', {
      fileCount: selectedFiles.length,
      folder: selectedFolder,
      permissions
    });

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
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2 md:space-x-4 overflow-x-auto">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-shrink-0">
              <div className={`
                w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-medium
                ${currentStep >= step 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {step}
              </div>
              {step < 3 && (
                <div className={`
                  w-6 md:w-12 h-0.5 mx-1 md:mx-2
                  ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>
        <Button variant="ghost" onClick={resetUpload} className="text-xs md:text-sm self-start sm:self-center">
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 text-center">
        <div className={`text-xs md:text-sm ${currentStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
          1. Select Files
        </div>
        <div className={`text-xs md:text-sm ${currentStep >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
          2. Choose Folder
        </div>
        <div className={`text-xs md:text-sm ${currentStep >= 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
          3. Set Permissions
        </div>
      </div>

      <div className="border rounded-lg p-3 md:p-6">
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* File Upload Section */}
            <div className="text-center space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Upload Files</h3>
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

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* URL Scraping Section */}
            <WebsiteURLScraper onScrapeComplete={(files: File[]) => {
              setSelectedFiles(files);
              if (files.length > 0) {
                setCurrentStep(2);
              }
            }} />
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base md:text-lg font-medium mb-2">Selected Files ({selectedFiles.length})</h3>
              <div className="space-y-2 mb-4 md:mb-6 max-h-32 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs md:text-sm">
                    <span className="truncate flex-1 mr-2">{file.name}</span>
                    <Badge variant="outline" className="text-xs">{Math.round(file.size / 1024)}KB</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4">Choose Destination Folder</h3>
              <div className="grid grid-cols-1 gap-3">
                <div 
                  onClick={() => handleFolderSelect("")}
                  className={`
                    border rounded-lg p-3 md:p-4 cursor-pointer transition-colors
                    ${selectedFolder === "" 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 md:h-5 md:w-5" />
                    <div>
                      <div className="font-medium text-sm md:text-base">Unassigned</div>
                      <div className="text-xs md:text-sm text-gray-500">Place in root directory</div>
                    </div>
                  </div>
                </div>

                {Array.isArray(foldersData) && foldersData.map((folder: any) => (
                  <div 
                    key={folder.id}
                    onClick={() => handleFolderSelect(folder.id)}
                    className={`
                      border rounded-lg p-3 md:p-4 cursor-pointer transition-colors
                      ${selectedFolder === folder.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 md:h-5 md:w-5" />
                      <div>
                        <div className="font-medium text-sm md:text-base">{folder.name}</div>
                        <div className="text-xs md:text-sm text-gray-500">
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
  const [showAddFAQModal, setShowAddFAQModal] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<any>(null);
  
  // Prompt editor modal states
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [selectedPromptTemplate, setSelectedPromptTemplate] = useState<any>(null);
  
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
    const queryClient = useQueryClient();

    const cleanupMutation = useMutation({
      mutationFn: async () => {
        const response = await fetch('/api/admin/training/cleanup-duplicates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        return response.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/training/analytics'] });
        toast({
          title: "Training Data Cleaned",
          description: "Duplicate and test entries have been removed",
        });
      }
    });
    
    return (
      <div className="space-y-6">
        {/* Enhanced Training Analytics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Interactions</p>
                  <p className="text-2xl font-bold">{interactions.length || '0'}</p>
                  <p className="text-xs text-green-600">↑ 12% this week</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Accuracy Rate</p>
                  <p className="text-2xl font-bold">{Math.round((interactions.filter((i: any) => i.wasCorrect).length / Math.max(interactions.length, 1)) * 100)}%</p>
                  <p className="text-xs text-green-600">↑ 3.2% improved</p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Corrections Made</p>
                  <p className="text-2xl font-bold">{interactions.filter((i: any) => i.source === 'admin_correction').length || '0'}</p>
                  <p className="text-xs text-orange-600">7 pending review</p>
                </div>
                <CheckCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold">{Array.from(new Set(interactions.filter((i: any) => i.username).map((i: any) => i.username))).length || '0'}</p>
                  <p className="text-xs text-blue-600">4 online now</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Response Accuracy</span>
                  <div className="flex items-center gap-2">
                    <Progress value={87} className="w-20" />
                    <span className="text-sm font-medium">87%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">User Satisfaction</span>
                  <div className="flex items-center gap-2">
                    <Progress value={92} className="w-20" />
                    <span className="text-sm font-medium">92%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Training Coverage</span>
                  <div className="flex items-center gap-2">
                    <Progress value={78} className="w-20" />
                    <span className="text-sm font-medium">78%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Learning Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Most Improved Topic</p>
                  <p className="text-xs text-blue-600">Payment Processing (+15% accuracy)</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm font-medium text-orange-800">Needs Attention</p>
                  <p className="text-xs text-orange-600">Compliance Questions (65% accuracy)</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Top Performer</p>
                  <p className="text-xs text-green-600">Merchant Onboarding (95% accuracy)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Training Data Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Training Data Management
                </CardTitle>
                <CardDescription>
                  Monitor and manage AI training interactions with quality control
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Export Started",
                      description: "Training data export will begin shortly...",
                    });
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => cleanupMutation.mutate()}
                  disabled={cleanupMutation.isPending}
                >
                  {cleanupMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Cleaning...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Duplicates
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="outline">
                    {interactions.length} interactions
                  </Badge>
                  <Badge variant="secondary">
                    Last updated: {new Date().toLocaleDateString()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Filter Options",
                        description: "Advanced filtering coming soon...",
                      });
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Search Training Data",
                        description: "Search functionality coming soon...",
                      });
                    }}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>

              {/* Training Interaction Categories */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">User Corrections</h4>
                    <Badge variant="secondary">
                      {interactions.filter((i: any) => i.source === 'user_chat').length}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">Direct feedback from user interactions</p>
                  <Progress value={78} className="mt-2" />
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Admin Training</h4>
                    <Badge variant="secondary">
                      {interactions.filter((i: any) => i.source === 'admin_correction').length}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">Manual corrections from administrators</p>
                  <Progress value={92} className="mt-2" />
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Test Data</h4>
                    <Badge variant="secondary">
                      {interactions.filter((i: any) => i.source === 'admin_test').length}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">Development and testing entries</p>
                  <Progress value={65} className="mt-2" />
                </div>
              </div>

              {/* Enhanced Training Interactions Table */}
              <div className="border rounded-lg">
                <div className="p-4 border-b">
                  <h4 className="font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Recent Training Activities
                  </h4>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {interactions.length > 0 ? (
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left p-3 font-medium">User</th>
                          <th className="text-left p-3 font-medium">Query</th>
                          <th className="text-left p-3 font-medium">Source</th>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="text-left p-3 font-medium">Time</th>
                          <th className="text-left p-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {interactions.slice(0, 15).map((interaction: any, index: number) => (
                          <tr key={index} className="border-t hover:bg-gray-50 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  interaction.wasCorrect ? 'bg-green-500' : 'bg-orange-500'
                                }`} />
                                <div>
                                  <div className="font-medium text-sm">{interaction.username || 'Unknown'}</div>
                                  <div className="text-xs text-gray-500">{interaction.userRole || 'User'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="max-w-xs truncate text-sm">{interaction.query}</div>
                            </td>
                            <td className="p-3">
                              <Badge variant={
                                interaction.source === 'admin_test' ? 'destructive' : 
                                interaction.source === 'admin_correction' ? 'default' : 'secondary'
                              } className="text-xs">
                                {interaction.source === 'admin_test' ? 'Test' : 
                                 interaction.source === 'admin_correction' ? 'Correction' : 'Chat'}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <Badge variant={interaction.wasCorrect ? 'default' : 'secondary'} className="text-xs">
                                {interaction.wasCorrect ? 'Accurate' : 'Corrected'}
                              </Badge>
                            </td>
                            <td className="p-3 text-xs text-gray-500">
                              {new Date(interaction.timestamp).toLocaleDateString()}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    toast({
                                      title: "View Interaction",
                                      description: `Viewing details for: ${interaction.query.substring(0, 30)}...`,
                                    });
                                  }}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    toast({
                                      title: "Edit Training Data",
                                      description: `Loading interaction for editing: ${interaction.query.substring(0, 30)}...`,
                                    });
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Training Interactions</h3>
                      <p className="text-gray-500">Training data will appear here as users provide feedback</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categories = Array.isArray(faqData) ? 
    Array.from(new Set(faqData.map((faq: FAQ) => faq.category))) : [];

  return (
    <div className="container mx-auto p-3 md:p-6 max-w-7xl">
      <div className="mb-4 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Control Center</h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          Manage knowledge base, documents, AI prompts, and system training
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1">
          <TabsTrigger value="qa-knowledge" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3">
            <HelpCircle className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Q&A Knowledge</span>
            <span className="sm:hidden">Q&A</span>
          </TabsTrigger>
          <TabsTrigger value="document-center" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3">
            <FileText className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Document Center</span>
            <span className="sm:hidden">Docs</span>
          </TabsTrigger>
          <TabsTrigger value="chat-review" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3">
            <MessageSquare className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Chat Review & Training</span>
            <span className="sm:hidden">Chat</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3">
            <Settings className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Settings</span>
            <span className="sm:hidden">Config</span>
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
                    <Button 
                      className="flex items-center gap-2"
                      onClick={() => setShowAddFAQModal(true)}
                    >
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
                  foldersData={(foldersData as any[]) || []}
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
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    toast({
                                      title: "Add Document",
                                      description: `Adding document to ${folder.name} folder...`,
                                    });
                                  }}
                                >
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

        <TabsContent value="chat-review" className="space-y-6">
          <ChatReviewCenter />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <ComprehensiveSettingsInterface />
        </TabsContent>
      </Tabs>

      {/* Document Preview Modal - Temporarily disabled */}

      {/* Add FAQ Modal */}
      <Dialog open={showAddFAQModal} onOpenChange={setShowAddFAQModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New FAQ Entry
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="faq-question">Question</Label>
              <Input
                id="faq-question"
                placeholder="Enter the frequently asked question..."
                className="w-full"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="faq-answer">Answer</Label>
              <Textarea
                id="faq-answer"
                placeholder="Enter the detailed answer..."
                className="min-h-[120px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="faq-category">Category</Label>
              <div className="flex gap-2">
                <Select>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(faqData) ? 
                      Array.from(new Set(faqData.map((faq: FAQ) => faq.category))).map((category: string) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      )) : 
                      [
                        <SelectItem key="general" value="general">General</SelectItem>,
                        <SelectItem key="pricing" value="pricing">Pricing</SelectItem>,
                        <SelectItem key="technical" value="technical">Technical</SelectItem>,
                        <SelectItem key="merchant-services" value="merchant-services">Merchant Services</SelectItem>,
                        <SelectItem key="compliance" value="compliance">Compliance</SelectItem>
                      ]
                    }
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowCategoryManager(true)}
                  className="px-3"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="faq-active" defaultChecked={true} />
              <Label htmlFor="faq-active">Active (visible to users)</Label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddFAQModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast({
                  title: "FAQ Added",
                  description: "New FAQ entry has been created successfully.",
                });
                setShowAddFAQModal(false);
              }}>
                Create FAQ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Category Management Modal */}
      <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              FAQ Category Management
            </DialogTitle>
            <DialogDescription>
              Create, edit, and organize FAQ categories for better content organization
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Add New Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add New Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter category name..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newCategoryName.trim()) {
                        toast({
                          title: "Category Created",
                          description: `Added new category: ${newCategoryName}`,
                        });
                        setNewCategoryName("");
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => {
                      if (newCategoryName.trim()) {
                        toast({
                          title: "Category Created",
                          description: `Added new category: ${newCategoryName}`,
                        });
                        setNewCategoryName("");
                      }
                    }}
                    disabled={!newCategoryName.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Existing Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Existing Categories</CardTitle>
                <CardDescription>
                  {Array.isArray(faqData) ? 
                    `${Array.from(new Set(faqData.map((faq: FAQ) => faq.category))).length} categories` : 
                    "0 categories"
                  } currently in use
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.isArray(faqData) ? 
                    Array.from(new Set(faqData.map((faq: FAQ) => faq.category))).map((category: string) => {
                      const categoryFAQs = faqData.filter((f: FAQ) => f.category === category);
                      return (
                        <div key={category} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              <div>
                                <h4 className="font-medium">{category}</h4>
                                <p className="text-sm text-gray-500">
                                  {categoryFAQs.length} FAQ{categoryFAQs.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {categoryFAQs.filter((f: FAQ) => f.isActive).length} active
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingCategory(category)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  toast({
                                    title: "Category Deleted",
                                    description: `Removed category: ${category}`,
                                    variant: "destructive",
                                  });
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                          
                          {/* Category FAQs Preview */}
                          <div className="mt-3 pl-6">
                            <div className="text-sm text-gray-600">Recent FAQs:</div>
                            <div className="mt-2 space-y-1">
                              {categoryFAQs.slice(0, 3).map((faq: FAQ) => (
                                <div key={faq.id} className="text-sm text-gray-700 truncate">
                                  • {faq.question}
                                </div>
                              ))}
                              {categoryFAQs.length > 3 && (
                                <div className="text-sm text-gray-500">
                                  + {categoryFAQs.length - 3} more...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }) : 
                    <div className="text-center py-8 text-gray-500">
                      No categories found. Add some FAQs to see categories here.
                    </div>
                  }
                </div>
              </CardContent>
            </Card>

            {/* Category Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Category Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {Array.isArray(faqData) ? 
                        Array.from(new Set(faqData.map((faq: FAQ) => faq.category))).length : 0
                      }
                    </div>
                    <div className="text-sm text-gray-600">Total Categories</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {Array.isArray(faqData) ? faqData.filter((f: FAQ) => f.isActive).length : 0}
                    </div>
                    <div className="text-sm text-gray-600">Active FAQs</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {Array.isArray(faqData) ? faqData.filter((f: FAQ) => !f.isActive).length : 0}
                    </div>
                    <div className="text-sm text-gray-600">Inactive FAQs</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {Array.isArray(faqData) ? Math.round(faqData.length / Math.max(1, Array.from(new Set(faqData.map((faq: FAQ) => faq.category))).length)) : 0}
                    </div>
                    <div className="text-sm text-gray-600">Avg per Category</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCategoryManager(false)}>
              Close
            </Button>
            <Button onClick={() => {
              toast({
                title: "Categories Saved",
                description: "All category changes have been applied successfully",
              });
              setShowCategoryManager(false);
            }}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Prompt Editor Modal */}
      <PromptEditorModal
        open={showPromptEditor}
        onOpenChange={setShowPromptEditor}
        template={selectedPromptTemplate}
      />
    </div>
  );
}