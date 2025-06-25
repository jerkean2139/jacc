import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit3, Trash2, MessageSquare, Mail, TrendingUp, Users, Home, ChevronRight, Wand2, Cloud, Tag, Camera, Monitor, BarChart, MapPin, Presentation, HelpCircle, Send, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import PromptTutorial, { PromptTooltip } from "@/components/prompt-tutorial";

interface UserPrompt {
  id: string;
  userId: string;
  name: string;
  writingStyle: string;
  systemRules: string;
  promptTemplate: string;
  isDefault: boolean;
  category: string;
  tags?: string[];
  lastSynced?: string;
  createdAt: string;
  updatedAt: string;
}

// Internal Strategy Prompts (Agent-facing)
const INTERNAL_STRATEGY_PROMPTS = [
  {
    name: "Processing Rate Calculator",
    category: "internal-calculations",
    type: "internal",
    icon: TrendingUp,
    writingStyle: "Precise, analytical, and professional",
    systemRules: "Always search internal documents for current processing rates, fee structures, and industry benchmarks before calculating. Present calculations clearly with breakdown.",
    promptTemplate: "Calculate processing rates for [BUSINESS_TYPE] with [MONTHLY_VOLUME] in sales. Search internal rate sheets and pricing documents first. Show: effective rate, monthly fees, per-transaction costs, and comparison to industry averages."
  },
  {
    name: "Market Research & Competitive Analysis",
    category: "internal-strategy",
    type: "internal",
    icon: TrendingUp,
    writingStyle: "Strategic, data-driven, and comprehensive",
    systemRules: "Use Perplexity to research current market trends, competitor analysis, and industry insights for strategic planning.",
    promptTemplate: "Research [INDUSTRY/NICHE] market trends and competitive landscape. Include: current processing rate standards, key competitors, market opportunities, regulatory changes, and strategic recommendations for positioning."
  },
  {
    name: "Lead Qualification & Scoring",
    category: "internal-sales",
    type: "internal", 
    icon: Users,
    writingStyle: "Analytical, strategic, and objective",
    systemRules: "Create systematic lead scoring criteria based on ideal customer profiles and conversion data.",
    promptTemplate: "Analyze lead [LEAD_DETAILS] and provide qualification score (1-10). Consider: business size, processing volume, industry type, decision-making authority, timeline, and pain points. Include next steps and approach strategy."
  },
  {
    name: "Territory Planning & Target List Building",
    category: "internal-strategy",
    type: "internal",
    icon: MapPin,
    writingStyle: "Strategic, organized, and actionable",
    systemRules: "Use market data and demographic analysis to build targeted prospect lists and territory plans.",
    promptTemplate: "Create a territory plan for [GEOGRAPHIC_AREA] focusing on [TARGET_INDUSTRIES]. Include: prospect identification criteria, approach sequences, competitive positioning, and monthly activity goals."
  }
];

// Client-Facing Content Prompts (with Image Generation)
const CLIENT_CONTENT_PROMPTS = [
  {
    name: "Social Media Post with Image",
    category: "client-content",
    type: "client-facing",
    hasImageGeneration: true,
    icon: Camera,
    writingStyle: "Engaging, professional, and visually appealing",
    systemRules: "Create compelling social media content with matching visual concepts. Use DALL-E 3 for image generation when specified.",
    promptTemplate: "Create a social media post for [BUSINESS_TYPE] about [TOPIC]. Include: engaging caption, relevant hashtags, and generate an image showing [IMAGE_DESCRIPTION]. Make it professional yet approachable for their target audience."
  },
  {
    name: "Newsletter Content & Header Image",
    category: "client-content", 
    type: "client-facing",
    hasImageGeneration: true,
    icon: Mail,
    writingStyle: "Informative, engaging, and brand-consistent",
    systemRules: "Create newsletter content with accompanying visual elements. Focus on value-driven content that builds trust.",
    promptTemplate: "Write a newsletter section for [BUSINESS_TYPE] covering [TOPIC]. Include: compelling headline, value-rich content, call-to-action, and generate a professional header image featuring [IMAGE_CONCEPT]."
  },
  {
    name: "Website Banner & Copy",
    category: "client-content",
    type: "client-facing", 
    hasImageGeneration: true,
    icon: Monitor,
    writingStyle: "Clear, conversion-focused, and professional",
    systemRules: "Create website copy with matching banner visuals that drive conversions and communicate value clearly.",
    promptTemplate: "Create website banner copy for [BUSINESS_TYPE] highlighting [VALUE_PROPOSITION]. Include: headline, subheadline, benefit bullets, CTA button text, and generate a banner image showing [VISUAL_CONCEPT]."
  },
  {
    name: "Presentation Slide Content & Graphics",
    category: "client-content",
    type: "client-facing",
    hasImageGeneration: true,
    icon: Presentation,
    writingStyle: "Clear, persuasive, and data-driven",
    systemRules: "Create presentation content with supporting visual elements that enhance understanding and engagement.",
    promptTemplate: "Create presentation slides for [BUSINESS_TYPE] about [TOPIC]. Include: slide titles, bullet points, speaker notes, and generate supporting graphics showing [CHART_OR_VISUAL_CONCEPT]."
  },
  {
    name: "Infographic Content & Design",
    category: "client-content",
    type: "client-facing",
    hasImageGeneration: true, 
    icon: BarChart,
    writingStyle: "Data-driven, easy to understand, and visually structured",
    systemRules: "Create infographic content with clear data visualization concepts. Focus on making complex information digestible.",
    promptTemplate: "Create infographic content for [BUSINESS_TYPE] about [DATA_TOPIC]. Include: key statistics, process steps, visual hierarchy suggestions, and generate an infographic design showing [DATA_VISUALIZATION]."
  }
];



// Marketing Strategy Prompts (Internal Use)
const DEFAULT_PROMPTS = [
  {
    name: "Alex Hormozi Value Stacking",
    category: "marketing",
    icon: TrendingUp,
    writingStyle: "Direct, value-focused, and compelling",
    systemRules: "Focus on creating irresistible offers by stacking value and addressing objections. Use Hormozi's framework for offer creation.",
    promptTemplate: "Create an Alex Hormozi-style value stack for [TARGET_MARKET]. Include: core offer, bonuses that increase perceived value, risk reversals, urgency/scarcity, and objection handling. Make the offer feel like a no-brainer decision."
  },
  {
    name: "Jeremy Miner NEPQ Sales Script",
    category: "sales",
    icon: Users,
    writingStyle: "Consultative, empathetic, and solution-focused",
    systemRules: "Use Neuro-Emotional Persuasion Questioning to uncover pain points and create emotional investment in solutions.",
    promptTemplate: "Create a Jeremy Miner NEPQ sales script for [PROSPECT_TYPE]. Include: problem awareness questions, consequence questions, solution awareness questions, and commitment questions. Focus on helping prospects convince themselves."
  },
  {
    name: "Cold Email Sequence - Niche Specific",
    category: "outbound",
    icon: Mail,
    writingStyle: "Conversational, helpful, and relationship-focused",
    systemRules: "Create human-sounding sequences that provide value before selling. Avoid robotic sales language.",
    promptTemplate: "Write a 3-email cold outreach sequence for [NICHE] businesses. Email 1: Value-first introduction with industry insight. Email 2: Case study or success story. Email 3: Soft CTA with helpful resource. Focus on their specific pain points and avoid sounding salesy."
  },
  {
    name: "SMS Cold Outreach Sequence",
    category: "outbound",
    icon: MessageSquare,
    writingStyle: "Brief, friendly, and conversational",
    systemRules: "Keep messages under 160 characters each. Focus on helping rather than selling.",
    promptTemplate: "Create a 3-message SMS sequence for [NICHE] business owners. Message 1: Quick introduction + value. Message 2: Social proof or insight. Message 3: Low-pressure offer to connect. Keep conversational and helpful."
  },
  {
    name: "LinkedIn DM Sequence",
    category: "outbound",
    icon: Users,
    writingStyle: "Professional but conversational and personalized",
    systemRules: "Build genuine relationships through personalized, value-first messaging.",
    promptTemplate: "Write a 3-message LinkedIn DM sequence targeting [NICHE] business owners. Message 1: Personalized connection based on their business/posts. Message 2: Share relevant industry insight. Message 3: Casual invitation to discuss payment processing challenges."
  },
  {
    name: "Mel Robbins 5 Second Rule for Sales",
    category: "personal-growth",
    icon: Users,
    writingStyle: "Motivational, actionable, and confidence-building",
    systemRules: "Focus on overcoming fear and hesitation through countdown strategies and immediate action.",
    promptTemplate: "Apply Mel Robbins 5 Second Rule to overcome [SALES_CHALLENGE]. Create specific countdown strategies to push through fear, make difficult calls, and take action when motivation fails. Include daily implementation tactics."
  },
  {
    name: "Good to Great Sales Strategy",
    category: "strategy",
    icon: TrendingUp,
    writingStyle: "Strategic, disciplined, and results-oriented",
    systemRules: "Apply Jim Collins principles of disciplined people, thought, and action to sales excellence.",
    promptTemplate: "Using Jim Collins Good to Great principles, analyze my sales approach and create a plan to go from good to great. Focus on hedgehog concept for my niche and flywheel momentum strategy."
  },
  {
    name: "StoryBrand Sales Framework",
    category: "sales",
    icon: MessageSquare,
    writingStyle: "Story-driven, engaging, and customer-focused",
    systemRules: "Position prospect as hero, identify their problem, present yourself as guide with clear plan and strong call to action.",
    promptTemplate: "Using Donald Miller StoryBrand framework, craft a compelling sales story for [PROSPECT_TYPE]. Position prospect as hero, identify their problem, present yourself as guide, provide clear plan, call to action that avoids failure and achieves success."
  },
  {
    name: "Duct Tape Marketing System",
    category: "marketing",
    icon: TrendingUp,
    writingStyle: "Systematic, relationship-focused, and referral-driven",
    systemRules: "Create systematic marketing approaches that turn clients into marketing assets through referrals and partnerships.",
    promptTemplate: "Apply John Jantsch Duct Tape Marketing system to create a systematic marketing approach for [NICHE]. Include referral system design, strategic partnerships, and total customer experience that turns clients into marketing assets."
  }
];

export default function PromptCustomization() {
  const [selectedPrompt, setSelectedPrompt] = useState<UserPrompt | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPromptTester, setShowPromptTester] = useState(false);
  const [testPromptContent, setTestPromptContent] = useState("");
  const [testPromptTitle, setTestPromptTitle] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    writingStyle: "",
    systemRules: "",
    promptTemplate: "",
    category: "general",
    isDefault: false,
    tags: [] as string[]
  });
  const [showWizard, setShowWizard] = useState(false);
  const [currentTag, setCurrentTag] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: prompts = [], isLoading } = useQuery<UserPrompt[]>({
    queryKey: ["/api/user/prompts"],
  });

  const createPromptMutation = useMutation({
    mutationFn: (data: any) => {
      console.log("Creating prompt with data:", data);
      return apiRequest("POST", "/api/user/prompts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/prompts"] });
      resetForm();
      toast({ title: "Prompt created successfully" });
    },
    onError: (error: any) => {
      console.error("Create prompt error:", error);
      toast({ title: "Failed to create prompt", variant: "destructive" });
    }
  });

  const updatePromptMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PUT", `/api/user/prompts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/prompts"] });
      resetForm();
      toast({ title: "Prompt updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update prompt", variant: "destructive" });
    }
  });

  const deletePromptMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/user/prompts/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/prompts"] });
      toast({ title: "Prompt deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete prompt", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      writingStyle: "",
      systemRules: "",
      promptTemplate: "",
      category: "general",
      isDefault: false,
      tags: []
    });
    setSelectedPrompt(null);
    setIsEditing(false);
    setShowWizard(false);
  };

  const syncMutation = useMutation({
    mutationFn: () => apiRequest("/api/user/prompts/sync", "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/prompts"] });
      toast({ title: "Prompts synced successfully" });
    },
    onError: () => {
      toast({ title: "Sync failed", variant: "destructive" });
    }
  });

  const runWizard = () => {
    const wizardPrompt = {
      name: "Smart Email Assistant",
      writingStyle: "Professional, concise, action-oriented with a friendly tone",
      systemRules: "Always search internal documents first. Keep emails under 150 words. Include relevant document references when available.",
      promptTemplate: "Write a professional email about {topic}. Search our internal knowledge base first for relevant information. Use my writing style: {writingStyle}. Include clear subject line and call-to-action.",
      category: "communication",
      isDefault: false,
      tags: ["quick-setup", "email", "professional"]
    };
    setFormData(wizardPrompt);
    setIsEditing(true);
    setShowWizard(false);
    toast({ title: "Wizard complete! Review and save your prompt." });
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleEdit = (prompt: UserPrompt) => {
    setSelectedPrompt(prompt);
    setFormData({
      name: prompt.name,
      writingStyle: prompt.writingStyle || "",
      systemRules: prompt.systemRules || "",
      promptTemplate: prompt.promptTemplate || "",
      category: prompt.category,
      isDefault: prompt.isDefault,
      tags: prompt.tags || []
    });
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedPrompt) {
      updatePromptMutation.mutate({ id: selectedPrompt.id, ...formData });
    } else {
      createPromptMutation.mutate(formData);
    }
  };

  const createDefaultPrompt = (defaultPrompt: typeof DEFAULT_PROMPTS[0]) => {
    const promptData = {
      name: defaultPrompt.name,
      writingStyle: defaultPrompt.writingStyle,
      systemRules: defaultPrompt.systemRules,
      promptTemplate: defaultPrompt.promptTemplate,
      category: defaultPrompt.category,
      isDefault: false,
      tags: ['template', defaultPrompt.category]
    };
    createPromptMutation.mutate(promptData);
  };

  const testTemplate = (template: any) => {
    setTestPromptContent(`${template.systemRules}\n\n${template.promptTemplate}`);
    setTestPromptTitle(template.name);
    setShowPromptTester(true);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'communication': return Mail;
      case 'marketing': return TrendingUp;
      default: return MessageSquare;
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading prompts...</div>;
  }

  // Split-screen prompt tester component
  const PromptTester = () => {
    const [currentMessage, setCurrentMessage] = useState(testPromptContent);
    const [testMessages, setTestMessages] = useState<Array<{id: string, content: string, isUser: boolean}>>([]);
    const [isLoading, setIsLoading] = useState(false);

    const sendTestMessage = async () => {
      if (!currentMessage.trim()) return;
      
      const userMessage = {
        id: Date.now().toString(),
        content: currentMessage,
        isUser: true
      };
      
      setTestMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      
      try {
        // First create a new chat if we don't have one
        const chatResponse = await apiRequest("POST", "/api/chats/new", {
          message: "Test chat for prompt testing"
        });
        
        const chatId = chatResponse.chat?.id;
        if (!chatId) {
          throw new Error("Failed to create test chat");
        }
        
        // Now send the actual message to get AI response
        const messageResponse = await apiRequest("POST", `/api/chats/${chatId}/messages`, {
          content: currentMessage,
          role: 'user'
        });
        
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          content: messageResponse.data?.aiMessage?.content || messageResponse.data?.response?.message || "I received your prompt and processed it successfully.",
          isUser: false
        };
        
        setTestMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error("AI request error:", error);
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          content: "I'm having trouble processing your prompt right now. Please try again in a moment.",
          isUser: false
        };
        setTestMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[80vh] flex">
          {/* Left Panel - Template Editor */}
          <div className="w-1/2 p-6 border-r">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Template: {testPromptTitle}</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowPromptTester(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4 h-full flex flex-col">
              <Label htmlFor="prompt-content">Edit and test your prompt:</Label>
              <Textarea
                id="prompt-content"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                className="flex-1 min-h-[200px]"
                placeholder="Enter your prompt to test..."
              />
              <div className="flex gap-2">
                <Button onClick={sendTestMessage} disabled={isLoading} className="flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  {isLoading ? "Testing..." : "Ask JACC"}
                </Button>
                <Button 
                  onClick={() => {
                    // Save as new prompt
                    setFormData({
                      name: testPromptTitle,
                      writingStyle: "Template-based",
                      systemRules: "AI prompt template",
                      promptTemplate: currentMessage,
                      category: "general",
                      isDefault: false,
                      tags: ["tested", "template"]
                    });
                    setShowPromptTester(false);
                    setIsEditing(true);
                  }}
                  className="flex-1"
                >
                  Save as Prompt
                </Button>
              </div>
            </div>
          </div>
          
          {/* Right Panel - Chat Interface */}
          <div className="w-1/2 p-6 flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Test Results</h3>
            <div className="flex-1 overflow-auto space-y-4 mb-4">
              {testMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Click "Ask JACC" to test your prompt and see how the AI responds
                </div>
              ) : (
                testMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      message.isUser 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm">JACC is thinking...</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setTestMessages([])}>
                Clear Chat
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Prompt Tester Modal */}
      {showPromptTester && <PromptTester />}
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center text-sm text-muted-foreground mb-4">
        <Link href="/" className="flex items-center hover:text-foreground transition-colors">
          <Home className="w-4 h-4 mr-1" />
          Home
        </Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-foreground">AI Prompt Customization</span>
      </nav>

      <div className="space-y-4">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" className="gap-2 bg-white dark:bg-gray-800 border-2 shadow-sm hover:shadow-md transition-all">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              AI Prompt Customization
              <PromptTooltip content="Create personalized AI instructions that help you work faster and get better results. These prompts understand your business and writing style.">
                <HelpCircle className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-help" />
              </PromptTooltip>
            </h1>
            <p className="text-muted-foreground">
              Create personalized prompts that match your writing style and prioritize internal knowledge
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PromptTutorial />
            <PromptTooltip content="Set up your writing style and preferences quickly">
              <Button variant="outline" onClick={runWizard} className="gap-2 text-sm">
                <Wand2 className="w-4 h-4" />
                <span className="hidden sm:inline">Quick Setup</span>
                <span className="sm:hidden">Setup</span>
              </Button>
            </PromptTooltip>

            <PromptTooltip content="Create a custom prompt from scratch">
              <Button onClick={() => setIsEditing(true)} className="gap-2 text-sm">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Prompt</span>
                <span className="sm:hidden">New</span>
              </Button>
            </PromptTooltip>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Existing Prompts */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Custom Prompts</h2>
          
          {prompts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">No custom prompts yet</p>
                <p className="text-sm text-muted-foreground">
                  Start with a template below or create your own
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {prompts.map((prompt) => {
                const IconComponent = getCategoryIcon(prompt.category);
                return (
                  <Card key={prompt.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <IconComponent className="w-5 h-5 text-primary" />
                          <div>
                            <h3 className="font-medium">{prompt.name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">
                              {prompt.category}
                              {prompt.isDefault && " • Default"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(prompt)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePromptMutation.mutate(prompt.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {prompt.writingStyle && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Style: {prompt.writingStyle}
                        </p>
                      )}
                      {prompt.tags && prompt.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {prompt.tags.map((tag, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {prompt.lastSynced && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Last synced: {new Date(prompt.lastSynced).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Internal Strategy Templates */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-md font-medium">Internal Strategy Templates</h3>
              <PromptTooltip content="These prompts help you analyze data, research markets, and make strategic business decisions. Use these for your internal planning and analysis work.">
                <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
              </PromptTooltip>
            </div>
            <div className="space-y-2">
              {INTERNAL_STRATEGY_PROMPTS.map((template, index) => {
                const IconComponent = template.icon;
                const exists = prompts.some(p => p.name === template.name);
                
                return (
                  <PromptTooltip key={index} content={`${template.systemRules} Click to add this template to your collection.`}>
                    <Card className="hover:shadow-md transition-shadow cursor-help">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <IconComponent className="w-5 h-5 text-blue-500" />
                            <div>
                              <h4 className="font-medium">{template.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {template.writingStyle}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant={exists ? "secondary" : "default"}
                            size="sm"
                            disabled={exists}
                            onClick={() => testTemplate(template)}
                          >
                            {exists ? "Added" : "Use Template"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </PromptTooltip>
                );
              })}
            </div>
          </div>

          {/* Client-Facing Content Templates */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-md font-medium">Client-Facing Content Templates</h3>
              <PromptTooltip content="These prompts create professional materials for your clients, including content with AI-generated images. Perfect for presentations, social media, and marketing materials you deliver to customers.">
                <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
              </PromptTooltip>
            </div>
            <div className="space-y-2">
              {CLIENT_CONTENT_PROMPTS.map((template, index) => {
                const IconComponent = template.icon;
                const exists = prompts.some(p => p.name === template.name);
                
                return (
                  <PromptTooltip key={index} content={`${template.systemRules} ${template.hasImageGeneration ? 'Includes AI image generation with DALL-E 3.' : ''} Click to add this template.`}>
                    <Card className="hover:shadow-md transition-shadow cursor-help border-green-200 dark:border-green-800">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <IconComponent className="w-5 h-5 text-green-500" />
                            <div>
                              <h4 className="font-medium flex items-center gap-2">
                                {template.name}
                                {template.hasImageGeneration && (
                                  <PromptTooltip content="This template can generate images using DALL-E 3">
                                    <Camera className="w-4 h-4 text-purple-500" />
                                  </PromptTooltip>
                                )}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {template.writingStyle}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant={exists ? "secondary" : "default"}
                            size="sm"
                            disabled={exists}
                            onClick={() => testTemplate(template)}
                          >
                            {exists ? "Added" : "Use Template"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </PromptTooltip>
                );
              })}
            </div>
          </div>

          {/* Marketing Strategy Templates */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-md font-medium">Marketing & Sales Templates</h3>
              <PromptTooltip content="These prompts help you find prospects, create outreach sequences, and convert leads using proven sales methodologies. Use these for your marketing and sales activities.">
                <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
              </PromptTooltip>
            </div>
            <div className="space-y-2">
              {DEFAULT_PROMPTS.map((template, index) => {
                const IconComponent = template.icon;
                const exists = prompts.some(p => p.name === template.name);
                
                return (
                  <PromptTooltip key={index} content={`${template.systemRules} Click to add this template to your collection.`}>
                    <Card className="hover:shadow-md transition-shadow cursor-help border-purple-200 dark:border-purple-800">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <IconComponent className="w-5 h-5 text-purple-500" />
                            <div>
                              <h4 className="font-medium">{template.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {template.writingStyle}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant={exists ? "secondary" : "default"}
                            size="sm"
                            disabled={exists}
                            onClick={() => testTemplate(template)}
                          >
                            {exists ? "Added" : "Use Template"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </PromptTooltip>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form */}
        {isEditing && (
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedPrompt ? "Edit Prompt" : "Create New Prompt"}
              </CardTitle>
              <CardDescription>
                Customize how the AI responds and prioritizes internal knowledge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Prompt Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Email Writing, Marketing Ideas"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="communication">Communication</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="writing">Writing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="writingStyle">Your Writing Style</Label>
                  <Textarea
                    id="writingStyle"
                    value={formData.writingStyle}
                    onChange={(e) => setFormData(prev => ({ ...prev, writingStyle: e.target.value }))}
                    placeholder="Describe how you like to write: tone, length, formality level..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="systemRules">System Rules</Label>
                  <Textarea
                    id="systemRules"
                    value={formData.systemRules}
                    onChange={(e) => setFormData(prev => ({ ...prev, systemRules: e.target.value }))}
                    placeholder="Rules for AI behavior: prioritize internal search, response length, formatting requirements..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Tip: Always include "prioritize internal database search" for best results
                  </p>
                </div>

                <div>
                  <Label htmlFor="promptTemplate">Prompt Template</Label>
                  <Textarea
                    id="promptTemplate"
                    value={formData.promptTemplate}
                    onChange={(e) => setFormData(prev => ({ ...prev, promptTemplate: e.target.value }))}
                    placeholder="The actual prompt template. Use {topic} for user input, {writingStyle} for your style..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      id="tags"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      placeholder="Add a tag..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addTag}>
                      <Tag className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {formData.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
                  />
                  <Label htmlFor="isDefault">Set as default for this category</Label>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createPromptMutation.isPending || updatePromptMutation.isPending}
                  >
                    {selectedPrompt ? "Update Prompt" : "Create Prompt"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}