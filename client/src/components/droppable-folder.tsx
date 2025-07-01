import { useState } from 'react';
import { useDragDrop } from './drag-drop-provider';
import { Folder, FolderOpen, Plus, FileText, Edit, Trash2, Download, Eye, MoreHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface DroppableFolderProps {
  folder: {
    id: string;
    name: string;
    documentCount?: number;
    createdAt?: string;
    documents?: any[];
  };
  onDocumentMove?: (documentId: string, targetFolderId: string) => Promise<void>;
  onClick?: () => void;
  isSelected?: boolean;
}

export function DroppableFolder({ folder, onDocumentMove, onClick, isSelected }: DroppableFolderProps) {
  const { draggedItem, setDropTarget, dropTarget } = useDragDrop();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);



  const canAcceptDrop = draggedItem?.type === 'document';
  const isDropTarget = dropTarget === folder.id;

  // CRUD handlers for documents
  const handleEditDocument = (doc: any) => {
    toast({
      title: "Edit Document",
      description: `Edit functionality for "${doc.name}" will be implemented soon.`,
    });
  };

  const handleDeleteDocument = async (doc: any) => {
    if (!confirm(`Are you sure you want to delete "${doc.originalName || doc.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${doc.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Document Deleted",
          description: `"${doc.originalName || doc.name}" has been deleted successfully.`,
        });
        // Invalidate queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
        queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      } else {
        throw new Error('Failed to delete document');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  const handleFolderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canAcceptDrop) {
      setIsExpanded(!isExpanded);
    }
    if (onClick) onClick();
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
      onClick={handleFolderClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {isHovered && canAcceptDrop ? (
              <FolderOpen className="h-8 w-8 text-green-600" />
            ) : isExpanded ? (
              <FolderOpen className="h-8 w-8 text-blue-600" />
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

          {isDropTarget && canAcceptDrop ? (
            <div className="flex-shrink-0">
              <Plus className="h-5 w-5 text-green-600" />
            </div>
          ) : (
            <div className="flex-shrink-0">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? '−' : '+'}
              </Button>
            </div>
          )}
        </div>

        {isDropTarget && canAcceptDrop && (
          <div className="mt-2 text-xs text-green-600 font-medium">
            Drop to move document here
          </div>
        )}

        {isExpanded && folder.documents && folder.documents.length > 0 && (
          <div className="mt-3 space-y-2 border-t pt-3">
            {folder.documents.map((doc: any) => (
              <div 
                key={doc.id} 
                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
              >
                <FileText className="w-3 h-3 text-blue-600 flex-shrink-0" />
                <span 
                  className="flex-1 truncate font-medium cursor-pointer hover:text-blue-600"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent folder toggle
                    // Open document preview or download
                    if (doc.webViewLink) {
                      window.open(doc.webViewLink, '_blank');
                    } else if (doc.path) {
                      // For local documents, construct view URL
                      window.open(`/api/documents/${doc.id}/view`, '_blank');
                    }
                  }}
                >
                  {doc.originalName || doc.name}
                </span>
                <span className="text-gray-500 dark:text-gray-400">{new Date(doc.createdAt).toLocaleDateString()}</span>
                
                {/* CRUD Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        if (doc.webViewLink) {
                          window.open(doc.webViewLink, '_blank');
                        } else {
                          window.open(`/api/documents/${doc.id}/view`, '_blank');
                        }
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Document
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        if (doc.downloadLink) {
                          window.open(doc.downloadLink, '_blank');
                        } else {
                          window.open(`/api/documents/${doc.id}/download`, '_blank');
                        }
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditDocument(doc);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDocument(doc);
                      }}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Document
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}