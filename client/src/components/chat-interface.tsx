import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Download, FileText, Smile, User, Bot, Brain, Calculator, TrendingUp, PresentationChart } from "lucide-react";
import { MessageContent } from "./message-content";
// Remove these imports temporarily as they may not exist
import { useCoaching } from "@/hooks/use-coaching";
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
}

// Define conversation starters
const conversationStarters = [
  {
    id: "rates",
    icon: Calculator,
    text: "I need help calculating processing rates and finding competitive pricing",
    color: "bg-blue-500 hover:bg-blue-600"
  },
  {
    id: "processors", 
    icon: TrendingUp,
    text: "I need to compare payment processors - can you help me analyze different options?",
    color: "bg-green-500 hover:bg-green-600"
  },
  {
    id: "proposal",
    icon: PresentationChart,
    text: "I need help creating a merchant proposal with competitive rates and terms",
    color: "bg-purple-500 hover:bg-purple-600"
  }
];

export function ChatInterface({ chatId, onChatUpdate }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Add a refresh trigger to force cache busting
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Fetch messages for the active chat - with error handling
  const { data: messages = [], isLoading, error, refetch } = useQuery<MessageWithActions[]>({
    queryKey: [`/api/chats/${chatId}/messages`, refreshTrigger],
    enabled: !!chatId,
    refetchOnMount: true,
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache (gcTime replaces cacheTime in v5)
    refetchOnWindowFocus: false,
    retry: 1,
    networkMode: 'always', // Always attempt network request
  });

  // Force refresh messages when chatId changes
  useEffect(() => {
    if (chatId) {
      console.log('💫 Force refreshing messages for chat:', chatId);
      const nextRefreshTrigger = refreshTrigger + 1;
      setRefreshTrigger(nextRefreshTrigger);
      
      // Use the EXACT same query key format as the main query
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`, refreshTrigger] });
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`, nextRefreshTrigger] });
      refetch();
    }
  }, [chatId, refetch, queryClient, refreshTrigger]);

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
      // Process message for coaching analysis
      const coaching = useCoaching();
      coaching.processMessage(variables, true); // true = agent message
      
      // Input will be cleared by form reset
      
      // Immediate refresh for user message with proper query key format
      const currentRefreshTrigger = refreshTrigger;
      const nextRefreshTrigger = currentRefreshTrigger + 1;
      setRefreshTrigger(nextRefreshTrigger);
      
      // Use the EXACT same query key format as the main query
      await queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`, currentRefreshTrigger] });
      await queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`, nextRefreshTrigger] });
      await queryClient.refetchQueries({ queryKey: [`/api/chats/${chatId}/messages`, nextRefreshTrigger] });
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      onChatUpdate();
      
      // Simple timeout to allow backend to process the AI response
      console.log('✅ Message sent successfully. Waiting for AI response...');
      
      setTimeout(async () => {
        // Refresh to show both user message and AI response
        const laterRefreshTrigger = nextRefreshTrigger + 1;
        setRefreshTrigger(laterRefreshTrigger);
        
        await queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`, nextRefreshTrigger] });
        await queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`, laterRefreshTrigger] });
        await queryClient.refetchQueries({ queryKey: [`/api/chats/${chatId}/messages`, laterRefreshTrigger] });
        
        console.log('🔄 Chat refreshed after AI response delay');
      }, 3000); // Wait 3 seconds for AI to respond
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
    if (!chatId) {
      toast({
        title: "No active chat",
        description: "Please start a new chat first.",
        variant: "destructive",
      });
      return;
    }

    setInput(starter.text);
    await sendMessageMutation.mutateAsync(starter.text);
    setInput("");
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessageMutation.isPending) return;

    const message = input.trim();
    setInput("");
    
    try {
      await sendMessageMutation.mutateAsync(message);
    } catch (error) {
      // Error handling is done in the mutation's onError
      console.error("Send message error:", error);
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

  // Don't show interface without chat
  if (!chatId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Welcome to JACC
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
          Your AI-powered merchant services assistant. Start a conversation to get help with pricing, processors, and proposals.
        </p>
        
        {/* Conversation Starters */}
        <div className="grid gap-4 w-full max-w-md">
          {conversationStarters.map((starter) => {
            const Icon = starter.icon;
            return (
              <Button
                key={starter.id}
                variant="outline"
                className={`${starter.color} text-white border-0 h-auto p-4 text-left flex items-start gap-3 transition-all duration-200 hover:scale-105`}
                onClick={() => handleConversationStarter(starter)}
                disabled={!chatId}
              >
                <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm leading-relaxed">{starter.text}</span>
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && safeMessages.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : safeMessages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No messages yet. Start the conversation!
          </div>
        ) : (
          safeMessages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
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
          ))
        )}
        
        {sendMessageMutation.isPending && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            </div>
            <Card className="max-w-[80%] p-4 bg-white dark:bg-gray-800">
              <LoadingSpinner />
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
              className="min-h-[44px] max-h-32 resize-none pr-12"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
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