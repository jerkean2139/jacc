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
  useDroppable,
} from '@dnd-kit/core';
import {
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
  MoreVertical,
  GripVertical,
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
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (!mimeType) return <FileText className="h-4 w-4 text-gray-500" />;
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (mimeType.includes('image')) return <FileText className="h-4 w-4 text-green-500" />;
    if (mimeType.includes('text')) return <FileText className="h-4 w-4 text-blue-500" />;
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors ${
        isDragging ? 'opacity-50 shadow-lg bg-blue-50 border-blue-300' : 'bg-white'
      }`}
    >
      {/* Drag Handle */}
      <div 
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded flex items-center"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* File Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {getFileIcon(document.mimeType)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">
              {document.name || document.originalName || 'Untitled Document'}
            </p>
            {document.tags && document.tags.length > 0 && (
              <div className="flex gap-1">
                {document.tags.slice(0, 2).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {document.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{document.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-500">{formatFileSize(document.size)}</p>
            {document.createdAt && (
              <p className="text-xs text-gray-400">
                {new Date(document.createdAt).toLocaleDateString()}
              </p>
            )}
            {document.category && (
              <Badge variant="secondary" className="text-xs">
                {document.category}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {/* Actions */}
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
  folderId: string;
  folderName: string;
  documentCount: number;
  isOver: boolean;
  children?: React.ReactNode;
}

function FolderDropZone({ folderId, folderName, documentCount, isOver }: FolderDropZoneProps) {
  const { setNodeRef } = useDroppable({
    id: folderId,
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[100px] border-2 border-dashed rounded-lg p-4 transition-all ${
        isOver 
          ? 'border-blue-500 bg-blue-50' 
          : folderId === 'unassigned' 
            ? 'border-gray-300 bg-gray-50 hover:bg-gray-100' 
            : 'border-blue-200 bg-blue-50 hover:bg-blue-100'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {folderId === 'unassigned' ? (
          <FileText className="h-4 w-4 text-gray-600" />
        ) : (
          <Folder className="h-4 w-4 text-blue-600" />
        )}
        <span className="text-sm font-medium">{folderName}</span>
        <Badge variant="outline" className="ml-auto">
          {documentCount}
        </Badge>
      </div>
      <p className="text-xs text-gray-500">
        {folderId === 'unassigned' 
          ? 'Drop documents here to remove from folders' 
          : 'Drop documents here to organize into this folder'
        }
      </p>
    </div>
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
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Combine all documents for the left side
  const allDocuments = [
    ...unassignedDocuments,
    ...folders.flatMap(folder => folder.documents)
  ];

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    const document = allDocuments.find(doc => doc.id === active.id);
    setDraggedDocument(document || null);
  };

  const handleDragOver = (event: any) => {
    const { over } = event;
    setOverId(over?.id || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setDraggedDocument(null);
      setOverId(null);
      return;
    }

    const documentId = active.id as string;
    const targetFolderId = over.id === 'unassigned' ? null : over.id as string;
    
    try {
      await onMoveDocument(documentId, targetFolderId);
    } catch (error) {
      console.error('Failed to move document:', error);
    }

    setActiveId(null);
    setDraggedDocument(null);
    setOverId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - All Documents */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                All Documents
                <Badge variant="secondary" className="ml-auto">
                  {allDocuments.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              <div className="space-y-2">
                {allDocuments.map((document) => (
                  <DocumentItem
                    key={document.id}
                    document={document}
                    onPreview={onPreviewDocument}
                    onDownload={onDownloadDocument}
                    onEdit={onEditDocument}
                  />
                ))}
                {allDocuments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No documents available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Folder Drop Zones */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Organize into Folders
                <Badge variant="secondary" className="ml-auto">
                  {folders.length + 1} zones
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto space-y-4">
              {/* Unassigned Drop Zone */}
              <FolderDropZone
                folderId="unassigned"
                folderName="Unassigned"
                documentCount={unassignedDocuments.length}
                isOver={overId === 'unassigned'}
              />

              {/* Folder Drop Zones */}
              {folders.map((folder) => (
                <FolderDropZone
                  key={folder.id}
                  folderId={folder.id}
                  folderName={folder.name}
                  documentCount={folder.documents.length}
                  isOver={overId === folder.id}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <DragOverlay>
        {activeId && draggedDocument ? (
          <div className="bg-white p-3 rounded-lg shadow-lg border border-blue-200 opacity-90">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">
                {draggedDocument.name || draggedDocument.originalName || 'Untitled Document'}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}