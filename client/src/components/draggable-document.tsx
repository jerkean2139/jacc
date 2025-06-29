import { useDragDrop } from './drag-drop-provider';
import { DocumentNameEditor } from './document-name-editor';
import { FileText, Download, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DraggableDocumentProps {
  document: {
    id: string;
    name: string;
    originalName: string;
    description?: string;
    tags?: string[];
    category?: string;
    isFavorite?: boolean;
    mimeType: string;
    createdAt: string;
    folderId?: string;
  };
  onMove?: (documentId: string, targetFolderId: string) => Promise<void>;
  onPreview?: (document: any) => void;
  onDownload?: (document: any) => void;
}

export function DraggableDocument({ document, onMove, onPreview, onDownload }: DraggableDocumentProps) {
  const { setDraggedItem, draggedItem, isDragging } = useDragDrop();

  const handleDragStart = (e: React.DragEvent) => {
    setDraggedItem({
      type: 'document',
      id: document.id,
      name: document.name,
      data: document,
    });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const isBeingDragged = draggedItem?.id === document.id;

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        group cursor-move transition-all duration-200 hover:shadow-md
        ${isBeingDragged ? 'opacity-50 scale-95' : ''}
        ${isDragging && !isBeingDragged ? 'opacity-70' : ''}
      `}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="mb-1">
                <DocumentNameEditor 
                  documentId={document.id}
                  currentName={document.name}
                />
              </div>
              
              {document.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {document.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-1 mb-2">
                {document.category && (
                  <Badge variant="secondary" className="text-xs">
                    {document.category}
                  </Badge>
                )}
                {document.tags?.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground">
                {document.createdAt ? new Date(document.createdAt).toLocaleDateString() : 'No date'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                console.log('Eye button clicked, onPreview available:', !!onPreview);
                if (onPreview) {
                  console.log('Calling onPreview with document:', document.name);
                  onPreview(document);
                } else {
                  console.log('No onPreview handler, opening in new tab');
                  window.open(`/documents/${document.id}`, '_blank');
                }
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                if (onDownload) {
                  onDownload(document);
                } else {
                  window.open(`/api/documents/${document.id}/download`, '_blank');
                }
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}