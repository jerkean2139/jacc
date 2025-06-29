import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Edit3, Save, X } from "lucide-react";

interface DocumentNameEditorProps {
  documentId: string;
  currentName: string;
  onNameUpdate?: (newName: string) => void;
}

export function DocumentNameEditor({ documentId, currentName, onNameUpdate }: DocumentNameEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(currentName);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateNameMutation = useMutation({
    mutationFn: async (newName: string) => {
      return apiRequest(`/api/documents/${documentId}`, "PUT", { name: newName });
    },
    onSuccess: (updatedDocument) => {
      toast({
        title: "Document Updated",
        description: `Document name changed to "${updatedDocument.name}"`,
      });
      setIsEditing(false);
      onNameUpdate?.(updatedDocument.name);
      
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update document name",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (editedName.trim() && editedName !== currentName) {
      updateNameMutation.mutate(editedName.trim());
    } else {
      setIsEditing(false);
      setEditedName(currentName);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedName(currentName);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Input
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1 h-8"
          autoFocus
          disabled={updateNameMutation.isPending}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={updateNameMutation.isPending || !editedName.trim()}
          className="h-8 w-8 p-0"
        >
          <Save className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={updateNameMutation.isPending}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 min-w-0 flex-1 group">
      <span className="flex-1 truncate">{currentName}</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Edit3 className="h-4 w-4" />
      </Button>
    </div>
  );
}