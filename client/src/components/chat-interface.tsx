import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Download, FileText, Smile, User, Bot, Brain, Calculator, TrendingUp, BarChart3, Mic, MicOff } from "lucide-react";
import { MessageContent } from "./message-content";
// Remove these imports temporarily as they may not exist
// import { useCoaching } from "@/hooks/use-coaching"; // Temporarily removed
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportToPDF, exportToCSV } from "@/lib/export-utils";

interface MessageWithActions {
  id: string;
  content: string;
  role: "user" | "assistant";
  createdAt: string;
  actions?: Array<{
    type: "document_link" | "search_query" | "export";
    label: string;
    url?: string;
    query?: string;
  }>;
}

interface ChatInterfaceProps {
  chatId: string | null;
  onChatUpdate: () => void;
  onNewChatWithMessage?: (message: string) => Promise<void>;
}

// Define conversation starters
const conversationStarters = [
  {
    id: "rates",
    icon: Calculator,
    text: "I need help calculating processing rates and finding competitive pricing",
    color: "bg-blue-500 hover:bg-blue-600 hover:text-white"
  },
  {
    id: "processors", 
    icon: TrendingUp,
    text: "I need to compare payment processors - can you help me analyze different options?",
    color: "bg-green-500 hover:bg-green-600 hover:text-white"
  },
  {
    id: "proposal",
    icon: BarChart3,
    text: "I need help creating a merchant proposal with competitive rates and terms",
    color: "bg-purple-500 hover:bg-purple-600 hover:text-white"
  },
  {
    id: "marketing",
    icon: Brain,
    text: "Let's Talk Marketing",
    color: "bg-purple-600 hover:bg-purple-700 hover:text-white",
    comingSoon: true
  }
];

export function ChatInterface({ chatId, onChatUpdate, onNewChatWithMessage }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Clear all cached queries on mount to prevent infinite loops
  useEffect(() => {
    console.log('🔄 ChatInterface mounted - clearing stale cached queries');
    queryClient.clear();
  }, []);
  
  // Fetch messages for the active chat - USING WORKING PUBLIC ENDPOINT TEMPORARILY
  const { data: messages = [], isLoading, error, refetch } = useQuery<MessageWithActions[]>({
    queryKey: [`/api/public/chats/${chatId}/messages`],
    enabled: !!chatId,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 2000, // Poll every 2 seconds to catch AI responses
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Fetch saved prompts for the dropdown (only when authenticated)
  const { data: savedPrompts = [] } = useQuery({
    queryKey: ["/api/user/prompts"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false, // Don't retry on auth errors
  });

  // Fetch user data for role-based access control
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/user"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false, // Don't retry on auth errors
  });

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + transcript);
        setIsRecording(false);
      };
      
      recognition.onerror = () => {
        setIsRecording(false);
        toast({
          title: "Voice recognition error",
          description: "Please try again or type your message.",
          variant: "destructive",
        });
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      setRecognition(recognition);
    }
  }, [toast]);

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
  
  // DETAILED DEBUGGING FOR MESSAGE DISPLAY ISSUE
  console.log("🔍 DETAILED MESSAGE DEBUG:", {
    rawMessages: messages,
    messagesType: typeof messages,
    isArray: Array.isArray(messages),
    messagesLength: messages?.length,
    safeMessagesLength: safeMessages.length,
    firstMessage: safeMessages[0],
    allMessages: safeMessages,
    queryKey: ['/api/chats', chatId, 'messages'],
    chatId: chatId,
    isQueryEnabled: !!chatId
  });

  // Send message mutation - SIMPLIFIED VERSION WITHOUT POLLING
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
    onSuccess: async (data, variables) => {
      // Process message for coaching analysis - temporarily disabled
      // const coaching = useCoaching();
      // coaching.processMessage(variables, true); // true = agent message
      
      // Input will be cleared by form reset
      
      // Force refresh using exact same query key format
      await queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
      await queryClient.refetchQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      onChatUpdate();
      
      // Also force a direct refetch
      refetch();
      
      console.log('✅ Message sent successfully. Cache invalidated and refetched.');
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle conversation starter clicks
  const handleConversationStarter = async (starter: typeof conversationStarters[0]) => {
    try {
      console.log("🚀 Starting conversation with starter:", starter.text);
      
      if (onNewChatWithMessage) {
        // Use the proper new chat with message function from home page
        console.log("📨 Using onNewChatWithMessage function");
        await onNewChatWithMessage(starter.text);
      } else {
        console.log("🔧 Using fallback manual chat creation");
        // Fallback: create chat and send message manually using fetch
        const response = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: "New Chat",
            isActive: true
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create chat: ${response.statusText}`);
        }
        
        const newChat = await response.json();
        console.log("✅ Created new chat:", newChat.id);
        
        // Send the message immediately
        const messageResponse = await fetch(`/api/chats/${newChat.id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            content: starter.text,
            role: "user"
          }),
        });
        
        if (!messageResponse.ok) {
          throw new Error(`Failed to send message: ${messageResponse.statusText}`);
        }
        
        console.log("✅ Sent initial message, navigating to chat");
        // Navigate to the new chat after message is sent
        window.location.href = `/chat/${newChat.id}`;
      }
    } catch (error) {
      console.error("❌ Failed to start conversation:", error);
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle voice recording toggle
  const toggleVoiceRecording = () => {
    if (!recognition) {
      toast({
        title: "Voice not supported",
        description: "Speech recognition is not available in your browser.",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      try {
        recognition.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Voice recognition error:', error);
        setIsRecording(false);
        toast({
          title: "Voice recognition error",
          description: "Please try again or type your message.",
          variant: "destructive",
        });
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessageMutation.isPending) return;

    const message = input.trim();
    setInput("");
    
    try {
      if (!chatId) {
        // No active chat, create a new one with the message
        if (onNewChatWithMessage) {
          await onNewChatWithMessage(message);
        } else {
          // Fallback: create chat manually if onNewChatWithMessage is not available
          const response = await apiRequest("POST", "/api/chats", {
            title: "New Chat",
            isActive: true
          });
          const newChat = await response.json();
          window.location.href = `/chat/${newChat.id}`;
          
          // Send the message after navigation
          setTimeout(async () => {
            await apiRequest("POST", `/api/chats/${newChat.id}/messages`, {
              content: message,
              role: "user"
            });
          }, 200);
        }
      } else {
        // Active chat exists, send message normally
        await sendMessageMutation.mutateAsync(message);
      }
    } catch (error) {
      console.error("Send message error:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [safeMessages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Welcome screen when no chat is selected
  if (!chatId) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Welcome Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          {/* JACC Logo - Guy with Glasses */}
          <div className="mb-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg">
              <img 
                src="/jacc-logo.jpg" 
                alt="JACC Assistant" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
            Welcome to JACC
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md text-sm">
            Your AI-powered merchant services assistant. Start a conversation to get help with pricing, processors, and proposals.
          </p>
          
          {/* Conversation Starters */}
          <div className="grid gap-3 w-full max-w-lg">
            {conversationStarters.map((starter) => {
              const Icon = starter.icon;
              const isComingSoon = starter.comingSoon;
              return (
                <div key={starter.id} className="relative">
                  <Button
                    variant="outline"
                    className={`${
                      isComingSoon 
                        ? 'bg-gray-400 hover:bg-gray-500 cursor-not-allowed opacity-70 text-white hover:text-white' 
                        : starter.color
                    } text-white hover:text-white border-0 h-auto p-3 text-left flex items-center gap-2 transition-all duration-200 ${
                      !isComingSoon ? 'hover:scale-[1.02] hover:shadow-lg' : ''
                    } w-full text-sm`}
                    onClick={() => !isComingSoon && handleConversationStarter(starter)}
                    disabled={isComingSoon}
                    title={isComingSoon ? "Coming Soon" : undefined}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="leading-tight">{starter.text}</span>
                  </Button>
                  {isComingSoon && (
                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold shadow-lg">
                      Soon
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Input for Welcome Screen */}
        <div className="border-t p-3 bg-white dark:bg-gray-800">
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-lg mx-auto">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about processing rates, compare processors, or request market insights..."
                className="min-h-[36px] max-h-16 resize-none pr-12 text-sm py-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleVoiceRecording}
                className={`absolute right-1 top-1 p-2 h-8 w-8 rounded-full ${
                  isRecording 
                    ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
                disabled={!recognition}
                title={isRecording ? "Stop recording" : "Start voice recording"}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
            </div>
            
            <Button
              type="submit"
              disabled={!input.trim() || sendMessageMutation.isPending}
              className="bg-blue-700 hover:bg-blue-800 text-white h-9 w-9 p-0 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" key={`messages-${safeMessages.length}-${chatId}`}>
        {isLoading && safeMessages.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : safeMessages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No messages yet. Start the conversation!
          </div>
        ) : (
          safeMessages.map((message) => {
            console.log('🔥 RENDERING MESSAGE:', {
              messageId: message.id,
              messageRole: message.role,
              messageContent: message.content?.substring(0, 100),
              messageKeys: Object.keys(message),
              hasContent: !!message.content
            });
            return (
              <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <img 
                      src="/jacc-logo.jpg" 
                      alt="JACC Assistant" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              
              <Card className={`max-w-[80%] p-4 ${
                message.role === "user" 
                  ? "bg-blue-500 text-white ml-auto" 
                  : "bg-white dark:bg-gray-800"
              }`}>
                <MessageContent 
                  content={message.content} 
                  role={message.role}
                />
                
                {/* Actions removed temporarily */}
              </Card>
              
              {message.role === "user" && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gray-500 dark:bg-gray-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
              </div>
            );
          })
        )}
        
        {sendMessageMutation.isPending && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img 
                  src="/jacc-logo.jpg" 
                  alt="JACC Assistant" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <Card className="max-w-[80%] p-4 bg-white dark:bg-gray-800">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </Card>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="border-t p-4 bg-white dark:bg-gray-800">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about processing rates, compare processors, or request market insights..."
              className="min-h-[40px] max-h-20 resize-none pr-12"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleVoiceRecording}
              className={`absolute right-1 top-2 p-2 h-8 w-8 rounded-full ${
                isRecording 
                  ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              disabled={!recognition}
              title={isRecording ? "Stop recording" : "Start voice recording"}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
          </div>
          
          <Button
            type="submit"
            disabled={!input.trim() || sendMessageMutation.isPending}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 h-11"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export default ChatInterface;