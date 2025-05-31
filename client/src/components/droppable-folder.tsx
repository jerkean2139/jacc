import { useState } from 'react';
import { useDragDrop } from './drag-drop-provider';
import { Folder, FolderOpen, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface DroppableFolderProps {
  folder: {
    id: string;
    name: string;
    documentCount?: number;
    createdAt?: string;
  };
  onDocumentMove?: (documentId: string, targetFolderId: string) => Promise<void>;
  onClick?: () => void;
  isSelected?: boolean;
}

export function DroppableFolder({ folder, onDocumentMove, onClick, isSelected }: DroppableFolderProps) {
  const { draggedItem, setDropTarget, dropTarget } = useDragDrop();
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);

  const canAcceptDrop = draggedItem?.type === 'document';
  const isDropTarget = dropTarget === folder.id;

  const handleDragOver = (e: React.DragEvent) => {
    if (!canAcceptDrop) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(folder.id);
    setIsHovered(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only reset if we're leaving the folder entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropTarget(null);
      setIsHovered(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDropTarget(null);
    setIsHovered(false);

    if (!canAcceptDrop || !draggedItem || !onDocumentMove) return;

    try {
      await onDocumentMove(draggedItem.id, folder.id);
      toast({
        title: "Document moved",
        description: `"${draggedItem.name}" moved to "${folder.name}"`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move document",
        variant: "destructive",
      });
    }
  };

  return (
    <Card
      className={`
        group cursor-pointer transition-all duration-200
        ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' : ''}
        ${isDropTarget ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950 scale-105' : ''}
        ${canAcceptDrop ? 'hover:shadow-md' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {isHovered && canAcceptDrop ? (
              <FolderOpen className="h-8 w-8 text-green-600" />
            ) : (
              <Folder className="h-8 w-8 text-yellow-600" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">
              {folder.name}
            </h3>
            {folder.documentCount !== undefined && (
              <p className="text-xs text-muted-foreground">
                {folder.documentCount} documents
              </p>
            )}
            {folder.createdAt && (
              <p className="text-xs text-muted-foreground">
                {new Date(folder.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>

          {isDropTarget && canAcceptDrop && (
            <div className="flex-shrink-0">
              <Plus className="h-5 w-5 text-green-600" />
            </div>
          )}
        </div>

        {isDropTarget && canAcceptDrop && (
          <div className="mt-2 text-xs text-green-600 font-medium">
            Drop to move document here
          </div>
        )}
      </CardContent>
    </Card>
  );
}