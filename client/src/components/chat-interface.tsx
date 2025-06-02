import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Send,
  Paperclip,
  Mic,
  MoreVertical,
  Menu,
  Calculator,
  FileSearch,
  HelpCircle,
  Download,
  Save,
  Share,
  ThumbsUp,
  FileText,
  ThumbsDown,
  Brain,
  Globe,
  Zap,
  MessageSquare,
  Search
} from "lucide-react";
import MessageBubble from "./message-bubble";
import FileUpload from "./file-upload";
import { ExternalSearchDialog } from "./external-search-dialog";
import { Input } from "@/components/ui/input";
import type { Message } from "@shared/schema";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  chatId: string | null;
  onChatUpdate: () => void;
  onNewChatWithMessage?: (message: string) => void;
}

interface MessageWithActions extends Message {
  actions?: Array<{
    type: 'save_to_folder' | 'download' | 'create_proposal' | 'external_search_request';
    label: string;
    data?: any;
    query?: string;
  }>;
  suggestions?: string[];
  needsExternalSearchPermission?: boolean;
}

export default function ChatInterface({ chatId, onChatUpdate, onNewChatWithMessage }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showExternalSearchDialog, setShowExternalSearchDialog] = useState(false);
  const [pendingExternalQuery, setPendingExternalQuery] = useState("");
  const [showPromptDropdown, setShowPromptDropdown] = useState(false);
  const [promptSearchTerm, setPromptSearchTerm] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch messages for the active chat - with error handling
  const { data: messages = [], isLoading, error } = useQuery<MessageWithActions[]>({
    queryKey: [`/api/chats/${chatId}/messages`],
    enabled: !!chatId,
    refetchOnMount: true,
    staleTime: 0, // Always refetch
  });

  // Fetch saved prompts for the dropdown (only when authenticated)
  const { data: savedPrompts = [] } = useQuery({
    queryKey: ["/api/user/prompts"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false, // Don't retry on auth errors
  });

  // Log any errors with message loading
  if (error) {
    console.error("Error loading messages:", error);
  }

  // Debug the actual API call
  console.log("Messages Query Status:", {
    chatId,
    queryKey: [`/api/chats/${chatId}/messages`],
    enabled: !!chatId,
    isLoading,
    hasError: !!error,
    messageCount: messages?.length || 0
  });

  // Debug logging with performance optimization
  console.log("Chat Interface Debug:", {
    chatId,
    messagesCount: Array.isArray(messages) ? messages.length : 0,
    isLoading,
    hasMessages: Array.isArray(messages) && messages.length > 0
  });

  // Ensure messages is always an array to prevent crashes
  const safeMessages = Array.isArray(messages) ? messages : [];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!chatId) throw new Error("No active chat");
      
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content,
          role: "user"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      return response.json();
    },
    onSuccess: async () => {
      // Input will be cleared by form reset
      
      // Force immediate refresh of messages with correct query key format
      await queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
      await queryClient.refetchQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      onChatUpdate();
      
      // Track message sent action for gamification
      try {
        await fetch("/api/user/track-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action: "message_sent" })
        });
      } catch (error) {
        console.log("Achievement tracking unavailable");
      }
    },
  });

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim() || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate(input);
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (files: File[]) => {
    // Handle file upload logic
    console.log("Files uploaded:", files);
    setShowFileUpload(false);
  };

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert("Speech recognition is not supported in this browser.");
    }
  };

  const handleQuickAction = (action: string) => {
    if (onNewChatWithMessage) {
      onNewChatWithMessage(action);
    } else {
      setInput(action);
    }
  };

  // Default prompts for testing when no saved prompts exist
  const defaultPrompts = [
    {
      id: 'default-1',
      name: 'Calculate Processing Rates',
      promptTemplate: 'Calculate processing rates for a [BUSINESS_TYPE] with [MONTHLY_VOLUME] in monthly sales volume',
      category: 'calculations'
    },
    {
      id: 'default-2', 
      name: 'Competitor Analysis',
      promptTemplate: 'Compare [PROCESSOR_A] vs [PROCESSOR_B] for a [BUSINESS_TYPE] client',
      category: 'analysis'
    },
    {
      id: 'default-3',
      name: 'Client Proposal',
      promptTemplate: 'Create a merchant services proposal for [CLIENT_NAME] - [BUSINESS_TYPE] with [REQUIREMENTS]',
      category: 'proposals'
    }
  ];

  // Filter prompts based on search term, fallback to default prompts if none saved
  const availablePrompts = Array.isArray(savedPrompts) && savedPrompts.length > 0 ? savedPrompts : defaultPrompts;
  const filteredPrompts = availablePrompts.filter((prompt: any) =>
    prompt.name?.toLowerCase().includes(promptSearchTerm.toLowerCase()) ||
    prompt.promptTemplate?.toLowerCase().includes(promptSearchTerm.toLowerCase())
  );

  // Handle prompt selection
  const handlePromptSelect = (prompt: any) => {
    setInput(prompt.promptTemplate);
    setShowPromptDropdown(false);
    setPromptSearchTerm("");
    textareaRef.current?.focus();
  };

  if (!chatId) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-slate-900">

        {/* Welcome Screen */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <img 
              src="/jacc-logo.jpg" 
              alt="JACC" 
              className="w-24 h-24 rounded-full mx-auto mb-6 object-cover shadow-lg"
            />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
              How can I help you today?
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Ask me about merchant services, rates, documents, or client questions
            </p>
          </div>

          {/* Suggested Prompts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mb-8">
            <Button
              variant="outline"
              className="p-3 h-auto text-left justify-start hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-200 dark:hover:border-blue-700 transition-colors w-full"
              onClick={() => handleQuickAction("Calculate processing rates for a restaurant")}
            >
              <Calculator className="mr-3 h-4 w-4 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="font-medium mb-1 text-sm truncate">Calculate Rates</div>
                <div className="text-xs text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">Get processing rates for different business types</div>
              </div>
            </Button>

            <div className="relative group w-full">
              <Button
                variant="outline"
                className="p-3 h-auto text-left justify-start hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300 hover:border-green-200 dark:hover:border-green-700 transition-colors w-full cursor-not-allowed opacity-75"
                onClick={(e) => {
                  e.preventDefault();
                  // Temporarily disabled - show coming soon
                }}
              >
                <Globe className="mr-3 h-4 w-4 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="font-medium mb-1 text-sm truncate">Real-Time Market Intelligence</div>
                  <div className="text-xs text-slate-500 group-hover:text-green-600 dark:group-hover:text-green-400 line-clamp-2">Get current processor pricing and industry trends</div>
                </div>
              </Button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Coming Soon
              </div>
            </div>
            
            <Button
              variant="outline"
              className="p-3 h-auto text-left justify-start hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 hover:border-purple-200 dark:hover:border-purple-700 transition-colors w-full"
              onClick={() => handleQuickAction("Analyze Stripe vs Square vs Clover for my restaurant client")}
            >
              <Brain className="mr-3 h-4 w-4 text-purple-600 flex-shrink-0" />
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="font-medium mb-1 text-sm truncate">AI Competitor Analysis</div>
                <div className="text-xs text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 line-clamp-2">Compare processors with real-time intelligence</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="p-3 h-auto text-left justify-start hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-700 dark:hover:text-yellow-300 hover:border-yellow-200 dark:hover:border-yellow-700 transition-colors w-full"
              onClick={() => handleQuickAction("Get current payment processing industry trends and market analysis")}
            >
              <Zap className="mr-3 h-4 w-4 text-yellow-600 flex-shrink-0" />
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="font-medium mb-1 text-sm truncate">Industry Intelligence</div>
                <div className="text-xs text-slate-500 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 line-clamp-2">Real-time market trends and analysis</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="p-3 h-auto text-left justify-start hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-200 dark:hover:border-blue-700 transition-colors w-full"
              onClick={() => handleQuickAction("Help me prepare a proposal for a new client")}
            >
              <FileText className="mr-3 h-4 w-4 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="font-medium mb-1 text-sm truncate">Create Proposal</div>
                <div className="text-xs text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">Generate client proposals and documents</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Input Box for New Chat */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-end space-x-3 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask JACC anything about merchant services..."
                className="auto-resize border-slate-300 dark:border-slate-600 rounded-xl pr-12 min-h-[50px] max-h-[120px] resize-none focus:ring-blue-500 focus:border-blue-500"
                disabled={sendMessageMutation.isPending}
              />
              
              <div className="absolute right-2 bottom-2">
                <Button
                  type="submit"
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!input.trim() || sendMessageMutation.isPending}
                  className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : safeMessages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Start the conversation
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Ask me anything about insurance rates, documents, or client questions.
              </p>
            </div>
          ) : (
            safeMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                actions={message.actions}
              />
            ))
          )}
          
          {sendMessageMutation.isPending && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-4 h-4 bg-white rounded-full" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-md p-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce typing-dot" />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce typing-dot" />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce typing-dot" />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* File Upload Area */}
      {showFileUpload && (
        <div className="border-t border-slate-200 dark:border-slate-700 p-4">
          <FileUpload onFileUpload={handleFileUpload} />
        </div>
      )}

      {/* Chat Input */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4 pb-safe md:pb-4">
        {/* Input Box */}
        <div className="flex items-end space-x-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask JACC anything about rates, documents, or client questions..."
              className="auto-resize border-slate-300 dark:border-slate-600 rounded-xl pr-28 min-h-[50px] max-h-[120px] resize-none focus:ring-green-500 focus:border-green-500"
              disabled={sendMessageMutation.isPending}
            />
            
            {/* Input Actions */}
            <div className="absolute right-2 bottom-2 flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFileUpload(!showFileUpload)}
                className="w-8 h-8"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              
              {/* AI PROMPTS BUTTON - PURPLE BACKGROUND FOR VISIBILITY */}
              <Button
                variant="default"
                size="icon"
                onClick={() => setShowPromptDropdown(!showPromptDropdown)}
                className="w-8 h-8 bg-purple-600 hover:bg-purple-700 text-white shadow-md"
                title="AI Prompts"
              >
                <Brain className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleVoiceInput}
                className={cn(
                  "w-8 h-8",
                  isListening && "text-red-500"
                )}
                title="Voice input"
              >
                <Mic className="w-4 h-4" />
              </Button>
            </div>
            
            {/* AI Prompt Dropdown - positioned outside textarea */}
            {showPromptDropdown && (
              <div className="absolute right-2 bottom-14 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search prompts..."
                      value={promptSearchTerm}
                      onChange={(e) => setPromptSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {filteredPrompts.length > 0 ? (
                    filteredPrompts.map((prompt: any) => (
                      <div
                        key={prompt.id}
                        onClick={() => handlePromptSelect(prompt)}
                        className="flex flex-col items-start p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-600 last:border-b-0"
                      >
                        <div className="font-medium text-sm text-slate-900 dark:text-white">{prompt.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {prompt.promptTemplate.slice(0, 100)}...
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {prompt.category}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                      {promptSearchTerm ? "No prompts found" : "No saved prompts available"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Send Button */}
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || sendMessageMutation.isPending}
            className="navy-primary text-white px-4 py-3 rounded-xl hover:opacity-90 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick Actions - Simplified to avoid redundancy with bottom nav */}
        <div className="flex flex-wrap gap-2 mt-3 max-w-4xl mx-auto">
          <div className="relative group">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                // Temporarily disabled - show coming soon
              }}
              className="text-slate-700 dark:text-slate-300 cursor-not-allowed opacity-75"
            >
              <FileSearch className="w-3 h-3 mr-2" />
              Analyze Document
            </Button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              Coming Soon
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleQuickAction("Generate a client proposal based on this information")}
            className="text-slate-700 dark:text-slate-300"
          >
            <FileText className="w-3 h-3 mr-2" />
            Create Proposal
          </Button>
        </div>
      </div>
    </div>
  );
}
