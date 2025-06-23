import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Save, MessageSquare, Copy, X } from 'lucide-react';

interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  variables?: string[];
}

interface PromptEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: PromptTemplate;
  onUsePrompt?: (content: string) => void;
}

export default function PromptEditorModal({ 
  open, 
  onOpenChange, 
  template,
  onUsePrompt 
}: PromptEditorModalProps) {
  const [title, setTitle] = useState(template?.title || '');
  const [description, setDescription] = useState(template?.description || '');
  const [category, setCategory] = useState(template?.category || 'General');
  const [content, setContent] = useState(template?.content || '');
  const [isModified, setIsModified] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Track modifications
  const handleContentChange = (value: string) => {
    setContent(value);
    setIsModified(true);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setIsModified(true);
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    setIsModified(true);
  };

  // Save prompt mutation
  const savePromptMutation = useMutation({
    mutationFn: async (promptData: any) => {
      const response = await fetch('/api/user/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(promptData)
      });
      if (!response.ok) {
        throw new Error('Failed to save prompt');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/prompts'] });
      setIsModified(false);
      toast({
        title: "Prompt Saved",
        description: "Your custom prompt has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Unable to save prompt. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Create new chat with prompt
  const startChatMutation = useMutation({
    mutationFn: async (promptContent: string) => {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: `${title || 'Custom Prompt'} Chat`,
          initialMessage: promptContent
        })
      });
      if (!response.ok) {
        throw new Error('Failed to create chat');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      onOpenChange(false);
      // Navigate to new chat
      window.location.href = `/chat/${data.id}`;
      toast({
        title: "Chat Started",
        description: "New conversation started with your prompt.",
      });
    },
    onError: () => {
      toast({
        title: "Chat Creation Failed",
        description: "Unable to start new chat. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and content for the prompt.",
        variant: "destructive"
      });
      return;
    }

    savePromptMutation.mutate({
      id: template?.id || undefined,
      title: title.trim(),
      description: description.trim(),
      category,
      content: content.trim()
    });
  };

  const handleSaveAndUse = () => {
    if (!content.trim()) {
      toast({
        title: "Empty Prompt",
        description: "Please add content to use this prompt.",
        variant: "destructive"
      });
      return;
    }

    // Save first if modified
    if (isModified && title.trim()) {
      savePromptMutation.mutate({
        id: template?.id || undefined,
        title: title.trim(),
        description: description.trim(),
        category,
        content: content.trim()
      });
    }

    // Start new chat with prompt
    startChatMutation.mutate(content.trim());
  };

  const handleUseOnly = () => {
    if (!content.trim()) {
      toast({
        title: "Empty Prompt",
        description: "Please add content to use this prompt.",
        variant: "destructive"
      });
      return;
    }

    startChatMutation.mutate(content.trim());
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied",
        description: "Prompt content copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    if (isModified) {
      if (confirm("You have unsaved changes. Are you sure you want to close?")) {
        onOpenChange(false);
        setIsModified(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {template ? 'Edit Prompt Template' : 'Create Prompt Template'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6">
          {/* Prompt Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prompt-title">Title</Label>
              <Input
                id="prompt-title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter prompt title..."
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt-category">Category</Label>
              <Input
                id="prompt-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Sales, Analysis, Support"
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt-description">Description</Label>
            <Input
              id="prompt-description"
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Brief description of what this prompt does..."
              className="w-full"
            />
          </div>

          <Separator />

          {/* Prompt Content Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt-content">Prompt Content</Label>
              <div className="flex items-center gap-2">
                {isModified && (
                  <Badge variant="secondary" className="text-xs">
                    Modified
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPrompt}
                  disabled={!content.trim()}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
              </div>
            </div>
            <Textarea
              id="prompt-content"
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Enter your prompt content here. You can use variables like {merchant_name} or {business_type} for dynamic content..."
              className="min-h-[300px] font-mono text-sm"
              style={{ resize: 'vertical' }}
            />
            <p className="text-xs text-muted-foreground">
              Tip: Use curly braces for variables like {"{merchant_name}"} or {"{business_type}"}
            </p>
          </div>

          {/* Preview Variables */}
          {content.includes('{') && (
            <div className="space-y-2">
              <Label>Detected Variables</Label>
              <div className="flex flex-wrap gap-2">
                {Array.from(content.matchAll(/\{([^}]+)\}/g)).map(([_, variable], index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {variable}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
          <div className="flex flex-1 gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={savePromptMutation.isPending || startChatMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={!title.trim() || !content.trim() || savePromptMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleUseOnly}
              disabled={!content.trim() || startChatMutation.isPending}
              className="flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Use Only
            </Button>
            <Button
              onClick={handleSaveAndUse}
              disabled={!content.trim() || savePromptMutation.isPending || startChatMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <MessageSquare className="w-4 h-4" />
              Save & Use
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}