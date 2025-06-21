import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Folder, 
  Star, 
  Globe, 
  Eye,
  Download,
  Tag,
  MoreVertical 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Document {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  folderId?: string;
  isFavorite?: boolean;
  isPublic?: boolean;
  tags?: string[];
  category?: string;
  createdAt: string;
}

interface Folder {
  id: string;
  name: string;
  documents: Document[];
}

interface DocumentItemProps {
  document: Document;
  onPreview: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onEdit: (doc: Document) => void;
}

function DocumentItem({ document, onPreview, onDownload, onEdit }: DocumentItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: document.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group flex items-center justify-between p-3 bg-white rounded-lg border hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'shadow-lg ring-2 ring-blue-400' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm truncate">{document.name}</div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {document.mimeType?.split('/')[1] || 'unknown'}
            </Badge>
            <span className="text-xs text-gray-500">
              {Math.round((document.size || 0) / 1024)}KB
            </span>
            {document.category && (
              <Badge variant="secondary" className="text-xs">
                {document.category}
              </Badge>
            )}
          </div>
          {document.tags && document.tags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {document.tags.slice(0, 3).map((tag, idx) => (
                <Badge key={idx} variant="outline" className="text-xs px-1">
                  {tag}
                </Badge>
              ))}
              {document.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-1">
                  +{document.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {document.isFavorite && <Star className="h-3 w-3 text-yellow-500" />}
        {document.isPublic && <Globe className="h-3 w-3 text-green-500" />}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPreview(document)}>
              <Eye className="h-3 w-3 mr-2" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(document)}>
              <Download className="h-3 w-3 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(document)}>
              <Tag className="h-3 w-3 mr-2" />
              Edit Tags
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

interface FolderDropZoneProps {
  folder: Folder;
  isOver: boolean;
  children: React.ReactNode;
}

function FolderDropZone({ folder, isOver, children }: FolderDropZoneProps) {
  return (
    <Card className={`transition-all ${isOver ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Folder className="h-4 w-4 text-blue-600" />
          {folder.name}
          <Badge variant="secondary" className="text-xs">
            {folder.documents.length} docs
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {children}
      </CardContent>
    </Card>
  );
}

interface DocumentDragDropProps {
  folders: Folder[];
  unassignedDocuments: Document[];
  onMoveDocument: (documentId: string, targetFolderId: string | null) => Promise<void>;
  onPreviewDocument: (doc: Document) => void;
  onDownloadDocument: (doc: Document) => void;
  onEditDocument: (doc: Document) => void;
}

export default function DocumentDragDrop({
  folders,
  unassignedDocuments,
  onMoveDocument,
  onPreviewDocument,
  onDownloadDocument,
  onEditDocument,
}: DocumentDragDropProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedDocument, setDraggedDocument] = useState<Document | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Find the dragged document
    const allDocuments = [
      ...unassignedDocuments,
      ...folders.flatMap(folder => folder.documents)
    ];
    const document = allDocuments.find(doc => doc.id === active.id);
    setDraggedDocument(document || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setDraggedDocument(null);
      return;
    }

    const documentId = active.id as string;
    const targetFolderId = over.id === 'unassigned' ? null : over.id as string;
    
    // Find current folder of the document
    const currentFolder = folders.find(folder => 
      folder.documents.some(doc => doc.id === documentId)
    );
    const currentFolderId = currentFolder?.id || null;

    // Only move if target is different from current
    if (targetFolderId !== currentFolderId) {
      try {
        await onMoveDocument(documentId, targetFolderId);
      } catch (error) {
        console.error('Failed to move document:', error);
      }
    }

    setActiveId(null);
    setDraggedDocument(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Folders */}
        {folders.map(folder => (
          <SortableContext 
            key={folder.id} 
            items={folder.documents.map(doc => doc.id)}
            strategy={verticalListSortingStrategy}
          >
            <FolderDropZone 
              folder={folder}
              isOver={activeId !== null && draggedDocument?.folderId !== folder.id}
            >
              {folder.documents.length > 0 ? (
                folder.documents.map(document => (
                  <DocumentItem
                    key={document.id}
                    document={document}
                    onPreview={onPreviewDocument}
                    onDownload={onDownloadDocument}
                    onEdit={onEditDocument}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No documents in this folder
                  <br />
                  <span className="text-xs">Drag documents here to organize them</span>
                </div>
              )}
            </FolderDropZone>
          </SortableContext>
        ))}

        {/* Unassigned Documents */}
        {unassignedDocuments.length > 0 && (
          <SortableContext 
            items={unassignedDocuments.map(doc => doc.id)}
            strategy={verticalListSortingStrategy}
          >
            <Card className="border-dashed border-orange-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-orange-600">
                  <FileText className="h-4 w-4" />
                  Unassigned Documents
                  <Badge variant="outline" className="text-xs border-orange-300">
                    {unassignedDocuments.length} docs
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {unassignedDocuments.map(document => (
                  <DocumentItem
                    key={document.id}
                    document={document}
                    onPreview={onPreviewDocument}
                    onDownload={onDownloadDocument}
                    onEdit={onEditDocument}
                  />
                ))}
              </CardContent>
            </Card>
          </SortableContext>
        )}
      </div>

      <DragOverlay>
        {activeId && draggedDocument ? (
          <div className="bg-white rounded-lg border shadow-lg p-3 opacity-95">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium text-sm">{draggedDocument.name}</div>
                <div className="text-xs text-gray-500">
                  {Math.round((draggedDocument.size || 0) / 1024)}KB
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}