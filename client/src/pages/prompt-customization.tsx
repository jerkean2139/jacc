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
import { Plus, Edit3, Trash2, MessageSquare, Mail, TrendingUp, Users, Home, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface UserPrompt {
  id: string;
  userId: string;
  name: string;
  writingStyle: string;
  systemRules: string;
  promptTemplate: string;
  isDefault: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_PROMPTS = [
  {
    name: "Email Writing",
    category: "communication",
    icon: Mail,
    writingStyle: "Professional yet friendly, concise and action-oriented",
    systemRules: "Always prioritize internal database search before external resources. Focus on merchant services industry context. Keep emails under 150 words unless specifically requested otherwise.",
    promptTemplate: "Write a professional email that sounds like me: {writingStyle}. Search our internal documents first for any relevant information about {topic}. If found, reference specific documents. Format: Clear subject line, brief greeting, main points with internal references, clear call-to-action, professional close."
  },
  {
    name: "Marketing Ideas",
    category: "marketing",
    icon: TrendingUp,
    writingStyle: "Creative, persuasive, and results-focused with industry expertise",
    systemRules: "Heavily search internal knowledge base and documents for merchant services insights, competitor analysis, and industry trends before suggesting external research. All ideas should be grounded in our existing knowledge.",
    promptTemplate: "Generate marketing ideas that match my style: {writingStyle}. First, thoroughly search our internal database for: merchant services trends, competitor information, successful campaigns, and industry insights related to {topic}. Base all suggestions on internal findings. Provide 3-5 concrete, actionable ideas with references to our internal resources."
  },
  {
    name: "Client Communication",
    category: "communication", 
    icon: Users,
    writingStyle: "Consultative, trustworthy, and solution-focused",
    systemRules: "Always search internal documents for relevant case studies, pricing information, and solution details before crafting responses. Present information as coming from our expertise and resources.",
    promptTemplate: "Craft client communication in my style: {writingStyle}. Search our internal knowledge base for information about {topic} including: relevant case studies, pricing details, solution comparisons, and success stories. Present findings as our expertise. Keep tone professional but approachable."
  },
  {
    name: "Text Messages",
    category: "communication",
    icon: MessageSquare,
    writingStyle: "Casual, friendly, but still professional",
    systemRules: "Keep messages brief (under 160 characters when possible). Search internal database for quick facts or references that support the message.",
    promptTemplate: "Write a text message in my casual style: {writingStyle}. Search internal resources for any relevant quick facts about {topic}. Keep it brief, friendly, and include internal reference if available. Format for mobile viewing."
  }
];

export default function PromptCustomization() {
  const [selectedPrompt, setSelectedPrompt] = useState<UserPrompt | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    writingStyle: "",
    systemRules: "",
    promptTemplate: "",
    category: "general",
    isDefault: false
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: prompts = [], isLoading } = useQuery<UserPrompt[]>({
    queryKey: ["/api/user/prompts"],
  });

  const createPromptMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/user/prompts", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/prompts"] });
      resetForm();
      toast({ title: "Prompt created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create prompt", variant: "destructive" });
    }
  });

  const updatePromptMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/user/prompts/${id}`, "PUT", data),
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
      isDefault: false
    });
    setSelectedPrompt(null);
    setIsEditing(false);
  };

  const handleEdit = (prompt: UserPrompt) => {
    setSelectedPrompt(prompt);
    setFormData({
      name: prompt.name,
      writingStyle: prompt.writingStyle || "",
      systemRules: prompt.systemRules || "",
      promptTemplate: prompt.promptTemplate || "",
      category: prompt.category,
      isDefault: prompt.isDefault
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
      isDefault: false
    };
    createPromptMutation.mutate(promptData);
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center text-sm text-muted-foreground mb-4">
        <Link href="/" className="flex items-center hover:text-foreground transition-colors">
          <Home className="w-4 h-4 mr-1" />
          Home
        </Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-foreground">AI Prompt Customization</span>
      </nav>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Prompt Customization</h1>
          <p className="text-muted-foreground">
            Create personalized prompts that match your writing style and prioritize internal knowledge
          </p>
        </div>
        <Button onClick={() => setIsEditing(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Prompt
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
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
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Default Prompt Templates */}
          <div className="space-y-4">
            <h3 className="text-md font-medium">Quick Start Templates</h3>
            <div className="space-y-2">
              {DEFAULT_PROMPTS.map((template, index) => {
                const IconComponent = template.icon;
                const exists = prompts.some(p => p.name === template.name);
                
                return (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <IconComponent className="w-5 h-5 text-primary" />
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
                          onClick={() => createDefaultPrompt(template)}
                        >
                          {exists ? "Added" : "Use Template"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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