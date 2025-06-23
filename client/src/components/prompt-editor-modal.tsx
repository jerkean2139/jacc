import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, MessageSquare, Copy, X, Edit } from 'lucide-react';

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
  const [isEditing, setIsEditing] = useState(false);
  const [templateEnabled, setTemplateEnabled] = useState(true);
  
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
              {template?.title || 'Prompt Template'}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={templateEnabled}
                  onCheckedChange={setTemplateEnabled}
                  id="template-enabled"
                />
                <Label htmlFor="template-enabled" className="text-sm">
                  Template Enabled
                </Label>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6">
          {/* Template Info */}
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">{template?.title}</h3>
              <Badge variant="outline">{template?.category}</Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {template?.description}
            </p>
          </div>

          {/* Prompt Content Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt-content">Prompt Content</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  {isEditing ? 'Preview' : 'Edit'}
                </Button>
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
            
            {isEditing ? (
              <Textarea
                id="prompt-content"
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="min-h-[300px] font-mono text-sm border-2 border-blue-200 dark:border-blue-800"
                style={{ resize: 'vertical' }}
              />
            ) : (
              <div className="min-h-[300px] p-4 border rounded-lg bg-white dark:bg-gray-800 font-mono text-sm whitespace-pre-wrap">
                {content || 'No content available'}
              </div>
            )}
            
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
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              {isEditing ? 'Preview' : 'Edit'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!content.trim() || savePromptMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}