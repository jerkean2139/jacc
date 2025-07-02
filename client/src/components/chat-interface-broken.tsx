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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Settings,
  MessageSquare,
  Search,
  X,
  Upload
} from "lucide-react";
import { Link } from "wouter";
import MessageBubble from "./message-bubble";
import FileUpload from "./file-upload";
import { ExternalSearchDialog } from "./external-search-dialog";
import CoachingOverlay from "./coaching-overlay";
import { useCoaching } from "@/hooks/useCoaching";
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
  const [showRecordingDialog, setShowRecordingDialog] = useState(false);
  const [showExternalSearchDialog, setShowExternalSearchDialog] = useState(false);
  const [pendingExternalQuery, setPendingExternalQuery] = useState("");
  const [showPromptDropdown, setShowPromptDropdown] = useState(false);
  const [promptSearchTerm, setPromptSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // PDF Export functionality
  const exportToPDF = async (messageContent: string, messageTitle?: string) => {
    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: messageContent,
          title: messageTitle || 'JACC Action Plan',
          chatId: chatId
        })
      });

      if (!response.ok) throw new Error('Export failed');
      
      const result = await response.json();
      
      // Show success notification
      alert(`Document saved to your personal library!\nFile: ${result.document.name}`);
      
      // Trigger download
      const downloadLink = document.createElement('a');
      downloadLink.href = result.downloadUrl;
      downloadLink.download = result.document.name;
      downloadLink.click();
      
      // Refresh user's documents
      await queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  // Make PDF export available globally for button clicks in AI responses
  useEffect(() => {
    (window as any).requestPDFExport = (element?: HTMLElement) => {
      // Find the message content containing the PDF export button
      const messageElement = element?.closest('.message-content') || 
                            document.querySelector('.message-content:last-child');
      
      if (messageElement) {
        const content = messageElement.innerHTML;
        const titleElement = messageElement.querySelector('h1');
        const title = titleElement?.textContent || 'JACC Action Plan';
        exportToPDF(content, title);
      }
    };

    return () => {
      delete (window as any).requestPDFExport;
    };
  }, [chatId]);

  // Initialize coaching hook
  const coaching = useCoaching();

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
    onSuccess: async (data, variables) => {
      // Process message for coaching analysis
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
      
      // Set up polling to check for AI response
      const pollForAIResponse = async () => {
        let attempts = 0;
        const maxAttempts = 20; // 20 attempts over 20 seconds
        
        const checkForResponse = async () => {
          attempts++;
          console.log(`🔄 Polling for AI response (attempt ${attempts}/${maxAttempts})...`);
          
          try {
            const response = await fetch(`/api/chats/${chatId}/messages?t=${Date.now()}`, {
              credentials: "include",
              cache: "no-store",
              headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
              }
            });
            
            if (response.ok) {
              const messages = await response.json();
              console.log(`📊 Polling check: Found ${messages.length} messages`);
              
              // Log each message for debugging
              messages.forEach((msg: any, index: number) => {
                console.log(`Message ${index + 1}: ${msg.role} - ${msg.content?.substring(0, 50)}... (created: ${msg.createdAt})`);
              });
              
              // Check if we have more messages than before polling started
              const currentMessageCount = messages.length;
              const expectedMinimumMessages = 2; // user message + AI response
              
              console.log(`📊 Message count check: ${currentMessageCount} messages (expecting at least ${expectedMinimumMessages})`);
              
              // Also check for recent assistant messages within last 2 minutes
              const recentThreshold = new Date(Date.now() - 120000); // 2 minutes instead of 1
              
              const hasAIResponse = messages.some((msg: any) => {
                const msgDate = new Date(msg.createdAt);
                const isAssistant = msg.role === 'assistant';
                const isRecent = msgDate > recentThreshold;
                console.log(`Checking message: ${msg.role}, created: ${msgDate.toISOString()}, recent: ${isRecent}`);
                return isAssistant && isRecent;
              });
              
              // Stop polling if we have enough messages OR if no new messages are being generated
              const shouldStopPolling = currentMessageCount >= expectedMinimumMessages || hasAIResponse;
              
              if (shouldStopPolling) {
                console.log('✅ AI response detected! Refreshing messages...');
                // Use the EXACT same query key format as the main query
                const currentRefreshTrigger = refreshTrigger;
                const nextRefreshTrigger = currentRefreshTrigger + 1;
                setRefreshTrigger(nextRefreshTrigger);
                
                // Invalidate with both current and next refresh trigger
                await queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`, currentRefreshTrigger] });
                await queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`, nextRefreshTrigger] });
                await queryClient.refetchQueries({ queryKey: [`/api/chats/${chatId}/messages`, nextRefreshTrigger] });
                
                // Also invalidate without refresh trigger as fallback
                await queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
                return true; // Stop polling
              } else {
                console.log('❌ No recent AI response found yet');
              }
            }
          } catch (error) {
            console.error('Error polling for AI response:', error);
          }
          
          if (attempts < maxAttempts) {
            setTimeout(checkForResponse, 1000); // Check again in 1 second
          } else {
            console.log('❌ Stopped polling - AI response not detected within 20 seconds');
            // Force refresh messages even if no recent AI response detected
            console.log('🔄 Force refreshing messages cache...');
            setRefreshTrigger(prev => prev + 1); // Force cache bust
            const messageQueryKey = [`/api/chats/${chatId}/messages`];
            await queryClient.invalidateQueries({ queryKey: messageQueryKey });
            await queryClient.refetchQueries({ queryKey: messageQueryKey });
          }
        };
        
        // Start polling after 2 seconds
        setTimeout(checkForResponse, 2000);
      };
      
      pollForAIResponse();
      
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

  const handleSendMessage = async () => {
    if (!input?.trim() || sendMessageMutation.isPending) return;

    // If no active chat, create one first and then send message
    if (!chatId && onNewChatWithMessage) {
      onNewChatWithMessage(input);
      setInput("");
      return;
    }

    // If we have an active chat, send the message normally
    if (chatId) {
      sendMessageMutation.mutate(input);
      setInput("");
    }
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
        setShowRecordingDialog(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + transcript);
        setIsListening(false);
        setShowRecordingDialog(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setShowRecordingDialog(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setShowRecordingDialog(false);
      };

      recognition.start();
    } else {
      alert("Speech recognition is not supported in this browser.");
    }
  };

  const handleQuickAction = (action: string) => {
    console.log("🚀 CONVERSATION STARTER: handleQuickAction called with:", action);
    console.log("🚀 CONVERSATION STARTER: onNewChatWithMessage available:", !!onNewChatWithMessage);
    
    // Create engaging conversation starters with follow-up questions
    const engagingStarters = {
      "Calculate processing rates for a restaurant": `I need to calculate processing rates for a restaurant client. Can you help me get competitive rates and processor recommendations?`,

      "Analyze Stripe vs Square vs Clover for my restaurant client": `Great choice! I'll help you compare these top processors for your restaurant client.

To provide the most relevant analysis, tell me:

1. What's the restaurant's monthly processing volume?
2. Do they need POS hardware or just payment processing?
3. Are they focused more on in-store, online, or delivery orders?

Based on your answers, I'll break down the costs, features, and best fit for each processor with specific recommendations.`,

      "Get current payment processing industry trends and market analysis": `Perfect timing! The payment processing industry is evolving rapidly. I'll share the latest insights.

Are you looking for:

1. Overall market trends and growth projections?
2. New technology impacts (AI, blockchain, mobile payments)?
3. Competitive landscape changes?
4. Specific vertical market trends (retail, restaurants, e-commerce)?

Let me know your focus area and I'll provide detailed analysis with actionable insights for your sales strategy.`,

      "Help me prepare a proposal for a new client": `Excellent! I'll help you create a compelling proposal that wins the deal.

To craft the perfect proposal, I need:

1. What type of business is your prospect?
2. What's their current payment processing pain point?
3. Estimated monthly transaction volume?
4. Any specific requirements they mentioned?

With these details, I'll create a customized proposal highlighting value propositions, competitive rates, and implementation benefits that resonate with their specific needs.`
    };

    const engagingMessage = engagingStarters[action as keyof typeof engagingStarters] || action;
    
    console.log("🚀 CONVERSATION STARTER: Final message:", engagingMessage);
    
    if (onNewChatWithMessage) {
      console.log("🚀 CONVERSATION STARTER: Calling onNewChatWithMessage");
      onNewChatWithMessage(engagingMessage);
    } else {
      console.log("🚀 CONVERSATION STARTER: Setting input instead");
      setInput(engagingMessage);
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
    },
    {
      id: 'default-4',
      name: 'Niche Marketing Plan',
      promptTemplate: 'Using Alex Hormozi value stacking methodology, create a targeted marketing plan for [NICHE] businesses. Include specific pain points, value propositions, and irresistible offers that match merchant services products to their exact needs.',
      category: 'marketing'
    },
    {
      id: 'default-5',
      name: 'Social Media Content Strategy',
      promptTemplate: 'Create Gary Vaynerchuk-style social media content for [PLATFORM] targeting [BUSINESS_TYPE] owners. Focus on providing value first, building trust, and establishing authority in payment processing. Include 5 post ideas with captions.',
      category: 'marketing'
    },
    {
      id: 'default-6',
      name: 'NLP Sales Script (Jeremy Miner)',
      promptTemplate: 'Using Jeremy Miner NEPQ method, create a sales conversation script for [PROSPECT_TYPE]. Include problem-aware questions, emotional triggers, and tone-downs to move prospects from skeptical to committed.',
      category: 'sales'
    },
    {
      id: 'default-7',
      name: 'Mindset & Work Ethic',
      promptTemplate: 'Channel Tony Robbins mindset coaching to help me overcome [CHALLENGE] in my sales career. Provide actionable strategies for peak performance, managing rejection, and maintaining motivation in merchant services sales.',
      category: 'mindset'
    },
    {
      id: 'default-8',
      name: 'Dan Kennedy Direct Response',
      promptTemplate: 'Using Dan Kennedy direct response principles, write marketing copy for [PRODUCT/SERVICE] targeting [AUDIENCE]. Include compelling headlines, urgency, social proof, and clear calls-to-action.',
      category: 'marketing'
    },
    {
      id: 'default-9',
      name: 'Patrick Bet-David Business Strategy',
      promptTemplate: 'Apply Patrick Bet-David strategic thinking to [BUSINESS_SITUATION]. Break down the problem, identify opportunities, create actionable steps, and develop contingency plans for success.',
      category: 'strategy'
    },
    {
      id: 'default-10',
      name: 'Value Proposition Builder',
      promptTemplate: 'Create an irresistible value proposition for [TARGET_MARKET] using the "So good they cannot ignore it" principle. Stack benefits, address objections, and make the offer feel like a no-brainer decision.',
      category: 'sales'
    },
    {
      id: 'default-11',
      name: 'Cold Email Sequence - Niche Specific',
      promptTemplate: 'Write a 3-email cold outreach sequence for [NICHE] businesses. Make it conversational and human-sounding. Email 1: Value-first introduction with industry insight. Email 2: Case study or success story. Email 3: Soft CTA with helpful resource. Focus on their specific pain points and avoid sounding salesy.',
      category: 'outbound'
    },
    {
      id: 'default-12',
      name: 'SMS Cold Outreach Sequence',
      promptTemplate: 'Create a 3-message SMS sequence for [NICHE] business owners. Keep messages under 160 characters, conversational tone, and focused on helping rather than selling. Message 1: Quick introduction + value. Message 2: Social proof or insight. Message 3: Low-pressure offer to connect.',
      category: 'outbound'
    },
    {
      id: 'default-13',
      name: 'LinkedIn DM Sequence',
      promptTemplate: 'Write a 3-message LinkedIn DM sequence targeting [NICHE] business owners. Message 1: Personalized connection based on their business/posts. Message 2: Share relevant industry insight or resource. Message 3: Casual invitation to discuss their payment processing challenges. Keep it professional but conversational.',
      category: 'outbound'
    },
    {
      id: 'default-14',
      name: 'Multi-Channel Outbound Campaign',
      promptTemplate: 'Create a coordinated outbound campaign for [NICHE] using email, LinkedIn, and SMS. Design a 2-week sequence that feels natural and builds genuine relationship. Include specific timing, channel strategy, and message variations for maximum effectiveness.',
      category: 'outbound'
    },
    {
      id: 'default-15',
      name: 'Niche Pain Point Research',
      promptTemplate: 'Research and identify the top 5 payment processing pain points specific to [NICHE] businesses. Include why each pain point matters, how it impacts their business, and what questions to ask to uncover these issues during sales conversations.',
      category: 'research'
    },
    {
      id: 'default-16',
      name: 'Daily Success Routine Builder',
      promptTemplate: 'Create a high-performance daily routine for a merchant services sales rep focusing on [GOAL]. Include morning rituals, prospecting blocks, mindset practices, and evening review. Base it on habits of top performers like Brian Tracy and Hal Elrod.',
      category: 'personal-growth'
    },
    {
      id: 'default-17',
      name: 'Rejection Recovery System',
      promptTemplate: 'Design a system to bounce back from rejection and maintain motivation in sales. Include mental reframes, confidence builders, and action steps to turn rejection into fuel for success. Draw from resilience psychology and sales psychology.',
      category: 'personal-growth'
    },
    {
      id: 'default-18',
      name: 'Goal Achievement Blueprint',
      promptTemplate: 'Create a 90-day goal achievement plan for [SPECIFIC_GOAL] in my sales career. Include weekly milestones, daily actions, accountability measures, and obstacle management strategies using proven goal-setting methodologies.',
      category: 'personal-growth'
    },
    {
      id: 'default-19',
      name: 'Confidence Building Exercises',
      promptTemplate: 'Provide specific exercises and techniques to build unshakeable confidence for sales conversations. Include visualization techniques, power posing, affirmations, and real-world practice scenarios to overcome fear and self-doubt.',
      category: 'personal-growth'
    },
    {
      id: 'default-20',
      name: 'Peak Performance State',
      promptTemplate: 'Design a system to enter peak performance state before important sales calls or meetings. Include breathing techniques, mental preparation, energy management, and focus optimization strategies from high-performance psychology.',
      category: 'personal-growth'
    },
    {
      id: 'default-21',
      name: 'Mel Robbins 5 Second Rule for Sales',
      promptTemplate: 'Apply Mel Robbins 5 Second Rule to overcome [SALES_CHALLENGE]. Create specific countdown strategies to push through fear, make difficult calls, approach prospects, and take action when motivation fails. Include daily implementation tactics.',
      category: 'personal-growth'
    },
    {
      id: 'default-22',
      name: 'Good to Great Sales Strategy',
      promptTemplate: 'Using Jim Collins Good to Great principles, analyze my sales approach and create a plan to go from good to great. Focus on disciplined people, disciplined thought, and disciplined action. Include hedgehog concept for my niche and flywheel momentum strategy.',
      category: 'strategy'
    },
    {
      id: 'default-23',
      name: 'EOS Sales System Implementation',
      promptTemplate: 'Design an EOS-based sales system for merchant services reps. Include Vision (goals), Traction (90-day rocks), and People (accountability). Create weekly Level 10 meeting structure and scorecard metrics for consistent sales performance.',
      category: 'strategy'
    },
    {
      id: 'default-24',
      name: 'StoryBrand Sales Framework',
      promptTemplate: 'Using Donald Miller StoryBrand framework, craft a compelling sales story for [PROSPECT_TYPE]. Position the prospect as hero, identify their problem, present yourself as guide, provide clear plan, call to action that avoids failure and achieves success.',
      category: 'sales'
    },
    {
      id: 'default-25',
      name: 'Duct Tape Marketing for Payment Processing',
      promptTemplate: 'Apply John Jantsch Duct Tape Marketing system to create a systematic marketing approach for [NICHE]. Include referral system design, strategic partnerships, and total customer experience that turns clients into marketing assets.',
      category: 'marketing'
    }
  ];

  // Filter prompts based on search term and category, fallback to default prompts if none saved
  const availablePrompts = Array.isArray(savedPrompts) && savedPrompts.length > 0 ? savedPrompts : defaultPrompts;
  
  // Get unique categories for filter buttons
  const categories = ["all", ...Array.from(new Set(availablePrompts.map((p: any) => p.category)))];
  
  const filteredPrompts = availablePrompts.filter((prompt: any) => {
    const matchesSearch = prompt.name?.toLowerCase().includes(promptSearchTerm.toLowerCase()) ||
                         prompt.promptTemplate?.toLowerCase().includes(promptSearchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || prompt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto relative">
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

          {/* Conversation Starters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mb-8">
            <div className="w-full">
              <Button
                variant="outline"
                className="p-4 h-auto text-left justify-start hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-200 dark:hover:border-blue-700 transition-colors w-full"
                onClick={() => handleQuickAction("I need help calculating processing rates and finding competitive pricing")}
              >
                <Calculator className="mr-3 h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold mb-1 text-sm">Calculate Processing Rates</div>
                  <div className="text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400">Get competitive rates for any business type</div>
                </div>
              </Button>
            </div>

            <div className="w-full">
              <Button
                variant="outline"
                className="p-4 h-auto text-left justify-start hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300 hover:border-green-200 dark:hover:border-green-700 transition-colors w-full"
                onClick={() => handleQuickAction("I need to compare payment processors - can you help me analyze different options?")}
              >
                <FileSearch className="mr-3 h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold mb-1 text-sm">Compare Processors</div>
                  <div className="text-xs text-slate-500 hover:text-green-600 dark:hover:text-green-400">Side-by-side processor analysis</div>
                </div>
              </Button>
            </div>
            
            {/* Let's Talk Marketing - Admin Only */}
            {(!userLoading && user && (user.role === 'dev-admin' || user.role === 'client-admin')) ? (
              <div className="w-full">
                <Button
                  variant="outline"
                  className="p-4 h-auto text-left justify-start hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 hover:border-purple-200 dark:hover:border-purple-700 transition-colors w-full"
                  onClick={() => handleQuickAction("I need help with sales strategies and marketing techniques for my merchant services business")}
                >
                  <Brain className="mr-3 h-5 w-5 text-purple-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold mb-1 text-sm">Let's Talk Marketing</div>
                    <div className="text-xs text-slate-500 hover:text-purple-600 dark:hover:text-purple-400">Sales strategies and marketing insights</div>
                  </div>
                </Button>
              </div>
            ) : (
              // Default: Coming Soon for all non-admin users, loading states, or undefined users
              <div className="w-full relative group">
                <Button
                  disabled
                  variant="outline"
                  className="p-4 h-auto text-left justify-start cursor-not-allowed opacity-60 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 w-full"
                  onClick={(e) => e.preventDefault()}
                >
                  <Brain className="mr-3 h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold mb-1 text-sm text-gray-500">Let's Talk Marketing</div>
                    <div className="text-xs text-gray-400">Sales strategies and marketing insights</div>
                    <span className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 px-2 py-1 rounded-full mt-1 inline-block">Coming Soon</span>
                  </div>
                </Button>
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Coming Soon
                </span>
              </div>
            )}
            
            <div className="w-full">
              <Button
                variant="outline"
                className="p-4 h-auto text-left justify-start hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-700 dark:hover:text-orange-300 hover:border-orange-200 dark:hover:border-orange-700 transition-colors w-full"
                onClick={() => handleQuickAction("Help me prepare a proposal for a new client")}
              >
                <FileText className="mr-3 h-5 w-5 text-orange-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold mb-1 text-sm">Create Proposal</div>
                  <div className="text-xs text-slate-500 hover:text-orange-600 dark:hover:text-orange-400">Build winning client proposals</div>
                </div>
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Input Box for New Chat */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 pb-20 md:pb-4 z-30">
          {/* File Upload Area */}
          {showFileUpload && (
            <div className="mb-4 max-w-4xl mx-auto">
              <FileUpload onFileUpload={handleFileUpload} />
            </div>
          )}


          
          {/* Enhanced Input Box */}
          <div className="flex items-end space-x-3 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                onFocus={() => {
                  // Scroll input into view with proper spacing
                  setTimeout(() => {
                    textareaRef.current?.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'center',
                      inline: 'nearest'
                    });
                  }, 100);
                }}
                onClick={() => {
                  // Ensure input takes priority and stays visible
                  setTimeout(() => {
                    textareaRef.current?.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'center',
                      inline: 'nearest'
                    });
                  }, 50);
                }}
                placeholder="Ask JACC anything about rates, documents, or client questions..."
                className="auto-resize border-slate-300 dark:border-slate-600 rounded-xl pr-28 min-h-[50px] max-h-[120px] resize-none focus:ring-blue-500 focus:border-blue-500 shadow-sm focus:shadow-lg transition-shadow"
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
                
                {/* AI PROMPTS BUTTON - Coming Soon */}
                <div className="relative group">
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 cursor-not-allowed opacity-60 bg-gray-100 hover:bg-gray-100 border-gray-300"
                    title="Coming Soon"
                    disabled
                  >
                    <Brain className="w-4 h-4 text-gray-400" />
                  </Button>
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Coming Soon
                  </span>
                </div>
                
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
              
              {/* AI Prompt Dropdown - Disabled */}
              {false && (
                <div className="absolute right-2 bottom-14 w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                  {/* Header with search */}
                  <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-sm">AI Prompts</span>
                      <Link href="/prompts">
                        <Button variant="ghost" size="sm" className="ml-auto text-xs">
                          Manage →
                        </Button>
                      </Link>
                    </div>
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
                  
                  {/* Category filters */}
                  <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex flex-wrap gap-1">
                      {categories.map((category) => (
                        <Button
                          key={category}
                          variant={selectedCategory === category ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setSelectedCategory(category)}
                          className="text-xs h-6 px-2 capitalize"
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Prompt list */}
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
                            {prompt.promptTemplate?.slice(0, 100) || 'No template available'}...
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
                        {promptSearchTerm || selectedCategory !== "all" ? "No prompts found" : "No saved prompts available"}
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
              className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:bg-gray-400"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Action Buttons - Hidden for Version 2 */}
          {/* Document analysis and proposal creation features moved to Version 2 */}
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
              <p className="text-slate-600 dark:text-slate-400 mb-6">Ask me anything about Tracer Merchant Services; documents, marketing, sales, or client questions.</p>
            </div>
          ) : (
            safeMessages.map((message, index) => {
              console.log(`🔍 RENDERING MESSAGE ${index}:`, {
                id: message.id,
                role: message.role,
                contentLength: message.content?.length || 0,
                hasActions: !!message.actions,
                messageObject: message
              });
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  actions={message.actions}
                />
              );
            })
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
      <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 pb-20 md:pb-4 z-30">
        {/* Input Box */}
        <div className="flex items-end space-x-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              onFocus={() => {
                // Scroll input into view with proper spacing
                setTimeout(() => {
                  textareaRef.current?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                  });
                }, 100);
              }}
              onClick={() => {
                // Ensure input takes priority and stays visible
                setTimeout(() => {
                  textareaRef.current?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                  });
                }, 50);
              }}
              placeholder="Ask JACC anything about rates, documents, or client questions..."
              className="auto-resize border-slate-300 dark:border-slate-600 rounded-xl pr-28 min-h-[50px] max-h-[120px] resize-none focus:ring-green-500 focus:border-green-500 focus:shadow-lg transition-shadow"
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
              <div className="absolute right-2 bottom-14 w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                {/* Header with search */}
                <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-sm">AI Prompts</span>
                    <Link href="/prompts">
                      <Button variant="ghost" size="sm" className="ml-auto text-xs">
                        Manage →
                      </Button>
                    </Link>
                  </div>
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
                
                {/* Category filters */}
                <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex flex-wrap gap-1">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className="text-xs h-6 px-2 capitalize"
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Prompt list */}
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
                          {prompt.promptTemplate?.slice(0, 100) || 'No template available'}...
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
                      {promptSearchTerm || selectedCategory !== "all" ? "No prompts found" : "No saved prompts available"}
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
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:bg-gray-400"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick Actions - Version 2 features hidden */}
        {/* Document analysis, proposal creation, and ISO Hub integration moved to Version 2 */}
      </div>
      {/* Sales Coaching Overlay - Temporarily disabled */}
      {/* {coaching.isCoachingEnabled && <CoachingOverlay />} */}

      {/* Voice Recording Dialog */}
      <Dialog open={showRecordingDialog} onOpenChange={setShowRecordingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              Recording Voice Input
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div className="relative mb-4">
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-red-300 rounded-full animate-ping"></div>
            </div>
            <p className="text-center text-slate-600 dark:text-slate-400 mb-2">
              Listening for your voice...
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 text-center">
              Speak clearly and I'll convert your speech to text
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setShowRecordingDialog(false);
                setIsListening(false);
              }}
              className="mt-4"
            >
              Cancel Recording
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
