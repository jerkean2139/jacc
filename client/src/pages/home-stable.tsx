import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Menu, Plus, MessageSquare, Folder, Download, Settings, HelpCircle, Calculator, BookOpen, Search, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import Sidebar from "@/components/sidebar";
import ChatInterface from "@/components/chat-interface";
import { useAuth } from "@/hooks/useAuth";
import { useNewChatFAB } from "@/components/bottom-nav";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UsageMeter } from "@/components/gamification/usage-meter";
import { Leaderboard } from "@/components/gamification/leaderboard";

export default function HomeStable() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessingStatement, setIsProcessingStatement] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Extract chatId from URL
  const activeChatId = location.includes('/chat/') ? location.split('/chat/')[1] : null;

  // Fetch chats and folders
  const { data: chats = [], refetch: refetchChats } = useQuery({
    queryKey: ["/api/chats"],
  });

  const { data: folders = [] } = useQuery({
    queryKey: ["/api/folders"],
  });

  // Mutation for creating new chat
  const createChatMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/chats", {
        title: "New Chat",
      });
      return response.json();
    },
    onSuccess: (newChat) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      navigate(`/chat/${newChat.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
    }
  });

  // Mutation for creating new folder
  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/folders", { name });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
    },
  });

  const handleNewChat = () => {
    createChatMutation.mutate();
  };

  const handleNewChatWithMessage = async (message: string) => {
    try {
      const response = await apiRequest("POST", "/api/chats", {
        title: "New Chat",
      });
      const newChat = await response.json();
      
      // Refresh chats immediately
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      
      // Navigate to the new chat
      navigate(`/chat/${newChat.id}`);
      
      // Send the message using apiRequest to ensure proper conversation starter detection
      setTimeout(async () => {
        await apiRequest("POST", `/api/chats/${newChat.id}/messages`, {
          content: message,
          role: "user"
        });
        
        // Refresh messages for the new chat
        queryClient.invalidateQueries({ queryKey: [`/api/chats/${newChat.id}/messages`] });
      }, 200);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
    }
  };

  const handleChatSelect = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  const handleFolderCreate = (name: string) => {
    createFolderMutation.mutate(name);
  };

  // Mutation for deleting folder
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      const response = await apiRequest("DELETE", `/api/folders/${folderId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      toast({
        title: "Success",
        description: "Folder deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive",
      });
    }
  });

  const handleFolderDelete = (folderId: string) => {
    deleteFolderMutation.mutate(folderId);
  };

  const handleStatementUpload = async (file: File) => {
    try {
      console.log('Processing statement upload:', file.name);
      setIsProcessingStatement(true);
      setProcessingProgress(0);
      
      // Show initial progress
      toast({
        title: "Processing Statement",
        description: `Analyzing ${file.name}...`,
      });
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 500);
      
      // Create FormData to upload the file
      const formData = new FormData();
      formData.append('statement', file);
      
      // Upload to statement analyzer API
      const response = await fetch('/api/iso-amp/analyze-statement', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
      
      const analysisResult = await response.json();
      console.log('Statement analysis result:', analysisResult);
      
      // Create a new chat with the analysis results
      const summaryMessage = `I've analyzed your statement from ${file.name}. Here are the key findings:

**Business Information:**
- Business: ${analysisResult.analysis?.extractedData?.businessName || 'Not detected'}
- Current Processor: ${analysisResult.analysis?.extractedData?.currentProcessor || 'Not detected'}
- Monthly Volume: $${(analysisResult.analysis?.extractedData?.monthlyVolume || 0).toLocaleString()}
- Transaction Count: ${analysisResult.analysis?.extractedData?.transactionCount || 'Not detected'}
- Average Ticket: $${analysisResult.analysis?.extractedData?.averageTicket || 'Not calculated'}
- Effective Rate: ${analysisResult.analysis?.extractedData?.effectiveRate || 'Not calculated'}%

**Potential Savings:**
${analysisResult.analysis?.competitiveAnalysis?.potentialSavings || 'Analysis in progress'}

Would you like me to run a competitive analysis and show you better processing options, or do you have specific questions about your current processing costs?`;

      handleNewChatWithMessage(summaryMessage);
      
      toast({
        title: "Analysis Complete",
        description: "Statement processed successfully!",
      });
      
    } catch (error) {
      console.error('Statement upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to process statement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingStatement(false);
      setProcessingProgress(0);
    }
  };

  // Connect the floating action button to new chat creation
  useNewChatFAB(handleNewChat);

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900">
      {/* Mobile Header - Always visible on mobile */}
      <div className="lg:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <Sidebar
                user={user}
                chats={chats}
                folders={folders}
                activeChatId={activeChatId}
                onNewChat={handleNewChat}
                onChatSelect={handleChatSelect}
                onFolderCreate={handleFolderCreate}
                onFolderDelete={handleFolderDelete}
                collapsed={false}
              />
            </SheetContent>
          </Sheet>
          <img 
            src="/jacc-logo.jpg" 
            alt="JACC" 
            className="w-8 h-8 rounded-full object-cover" 
          />
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">JACC</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.pdf,.doc,.docx,.txt';
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  console.log('File selected:', file.name);
                  await handleStatementUpload(file);
                }
              };
              input.click();
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            📄 Upload Statement
          </button>
          <button
            onClick={handleNewChat}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            New Chat
          </button>
        </div>
      </div>

      {/* Mobile Chat Area */}
      <div className="lg:hidden flex-1 h-[calc(100vh-80px)]">
        <ChatInterface 
          chatId={activeChatId} 
          onChatUpdate={refetchChats}
          onNewChatWithMessage={handleNewChatWithMessage}
        />
      </div>

      {/* Desktop Layout - CSS Grid for stability */}
      <div className="hidden lg:grid grid-cols-[320px_1fr] h-full w-full">
        {/* Sidebar - Fixed width grid column */}
        <div className="border-r border-border overflow-hidden">
          <Sidebar
            user={user}
            chats={chats}
            folders={folders}
            activeChatId={activeChatId}
            onNewChat={handleNewChat}
            onChatSelect={handleChatSelect}
            onFolderCreate={handleFolderCreate}
            onFolderDelete={handleFolderDelete}
            collapsed={false}
          />
        </div>

        {/* Chat Panel - Flexible grid column */}
        <div className="overflow-hidden flex flex-col">
          {/* Desktop Header Navigation */}
          <div className="border-b border-border p-2 bg-background">
            <div className="flex items-center gap-2">
              {/* Calculator link hidden for MVP - Version 2 feature */}
              {false && (
                <Link href="/calculator">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Calculator className="w-4 h-4" />
                    Calculator
                  </Button>
                </Link>
              )}
              <Link href="/prompts">
                <Button variant="ghost" size="sm" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  AI Prompts
                </Button>
              </Link>
              <Link href="/guide">
                <Button variant="ghost" size="sm" className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  Guide
                </Button>
              </Link>
              {user?.role === 'dev_admin' && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Admin
                  </Button>
                </Link>
              )}
            </div>
          </div>
          
          {/* Chat Interface */}
          <div className="flex-1 overflow-hidden">
            <ChatInterface
              chatId={activeChatId}
              onChatUpdate={refetchChats}
              onNewChatWithMessage={handleNewChatWithMessage}
            />
          </div>
        </div>


      </div>

      {/* Processing Modal */}
      <Dialog open={isProcessingStatement} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Analyzing Statement
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Processing your statement...</p>
                <p className="text-xs text-muted-foreground">This may take a few moments</p>
              </div>
            </div>
            <Progress value={processingProgress} className="w-full" />
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Extracting data</span>
                <span>{processingProgress < 30 ? '...' : '✓'}</span>
              </div>
              <div className="flex justify-between">
                <span>Analyzing patterns</span>
                <span>{processingProgress < 60 ? '...' : '✓'}</span>
              </div>
              <div className="flex justify-between">
                <span>Generating insights</span>
                <span>{processingProgress < 90 ? '...' : '✓'}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}