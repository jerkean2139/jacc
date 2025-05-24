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
  ThumbsDown
} from "lucide-react";
import MessageBubble from "./message-bubble";
import FileUpload from "./file-upload";
import type { Message } from "@shared/schema";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  chatId: string | null;
  onChatUpdate: () => void;
}

interface MessageWithActions extends Message {
  actions?: Array<{
    type: 'save_to_folder' | 'download' | 'create_proposal';
    label: string;
    data?: any;
  }>;
  suggestions?: string[];
}

export default function ChatInterface({ chatId, onChatUpdate }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch messages for the active chat
  const { data: messages = [], isLoading } = useQuery<MessageWithActions[]>({
    queryKey: ["/api/chats", chatId, "messages"],
    enabled: !!chatId,
  });

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
      queryClient.invalidateQueries({ queryKey: ["/api/chats", chatId, "messages"] });
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
    setInput(action);
  };

  if (!chatId) {
    return (
      <div className="h-full flex flex-col">
        {/* Header - Desktop Only */}
        <div className="hidden md:block border-b border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">JACC Assistant</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">AI-powered sales support</p>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Screen */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Send className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Welcome to JACC
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Start a new conversation to get help with insurance questions, rate comparisons, 
              document analysis, and more.
            </p>
            <Button onClick={() => {}} className="navy-primary text-white hover:opacity-90">
              Start New Chat
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      {/* Chat Header - Desktop Only */}
      <div className="hidden md:block border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">JACC Assistant</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">AI-powered sales support</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleVoiceInput}
              className={cn(
                "transition-colors",
                isListening && "text-red-500"
              )}
              title="Voice Chat"
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFileUpload(!showFileUpload)}
              title="Upload File"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  Clear Chat
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Export Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
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
            messages.map((message) => (
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
              className="auto-resize border-slate-300 dark:border-slate-600 rounded-xl pr-20 min-h-[50px] max-h-[120px] resize-none focus:ring-green-500 focus:border-green-500"
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
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleQuickAction("Help me analyze this document and provide insights")}
            className="text-slate-700 dark:text-slate-300"
          >
            <FileSearch className="w-3 h-3 mr-2" />
            Analyze Document
          </Button>
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
