import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  CollisionDetection,
  rectIntersection,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import {
  FileText,
  Folder,
  FolderOpen,
  MoreVertical,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  Move,
  CheckCircle2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Document {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  folderId: string | null;
  permissions: 'admin-only' | 'all-users';
  uploadedAt: string;
  content?: string;
}

interface Folder {
  id: string;
  name: string;
  documentCount: number;
  isExpanded?: boolean;
}

interface DragData {
  type: 'document' | 'folder';
  id: string;
  title?: string;
  name?: string;
}

// Sortable Document Item Component
function SortableDocument({ document, isOverlay = false }: { document: Document; isOverlay?: boolean }) {
  const { toast } = useToast();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: document.id,
    data: {
      type: 'document',
      id: document.id,
      title: document.title,
    } as DragData,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/api/documents/${document.id}/view`, '_blank');
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/api/documents/${document.id}/download`, '_blank');
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        group cursor-grab active:cursor-grabbing
        ${isDragging ? 'z-50 rotate-3 scale-105' : ''}
        ${isOverlay ? 'rotate-3 scale-105 shadow-2xl' : ''}
      `}
    >
      <Card className={`
        transition-all duration-200 hover:shadow-md border-2
        ${isDragging ? 'border-blue-400 bg-blue-50 shadow-lg' : 'border-transparent'}
        ${isOverlay ? 'border-blue-400 bg-blue-50 shadow-2xl' : ''}
      `}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {document.title}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  {document.fileName}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge 
                    variant={document.permissions === 'admin-only' ? 'destructive' : 'default'}
                    className="text-xs"
                  >
                    {document.permissions === 'admin-only' ? 'Admin' : 'All Users'}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {document.fileType?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleView}
                className="h-8 w-8 p-0"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-8 w-8 p-0"
              >
                <Download className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Sortable Folder Component
function SortableFolder({ 
  folder, 
  documents, 
  isExpanded, 
  onToggleExpanded,
  isOverlay = false 
}: { 
  folder: Folder; 
  documents: Document[];
  isExpanded: boolean;
  onToggleExpanded: (folderId: string) => void;
  isOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: folder.id,
    data: {
      type: 'folder',
      id: folder.id,
      name: folder.name,
    } as DragData,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  const folderDocuments = documents.filter(doc => doc.folderId === folder.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        ${isDragging ? 'z-40' : ''}
        ${isOverlay ? 'rotate-2 scale-105 shadow-2xl' : ''}
      `}
    >
      <Card className={`
        transition-all duration-200
        ${isDragging ? 'border-green-400 bg-green-50 shadow-lg' : ''}
        ${isOver ? 'border-blue-400 bg-blue-50 shadow-md' : ''}
        ${isOverlay ? 'border-green-400 bg-green-50 shadow-2xl' : ''}
      `}>
        <CardHeader 
          className="pb-3 cursor-pointer"
          {...attributes}
          {...listeners}
          onClick={() => onToggleExpanded(folder.id)}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isExpanded ? (
                <FolderOpen className="h-5 w-5 text-blue-500" />
              ) : (
                <Folder className="h-5 w-5 text-blue-500" />
              )}
              <span className="text-sm font-medium">{folder.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {folderDocuments.length} docs
              </Badge>
              {isOver && (
                <Badge variant="default" className="text-xs bg-blue-500">
                  Drop here
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-2 pl-4 border-l-2 border-gray-200">
              <SortableContext
                items={folderDocuments.map(doc => doc.id)}
                strategy={rectSortingStrategy}
              >
                {folderDocuments.map((document) => (
                  <SortableDocument key={document.id} document={document} />
                ))}
              </SortableContext>
              {folderDocuments.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm border-2 border-dashed border-gray-300 rounded-lg">
                  Drop documents here
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// Main Drag Drop Documents Component
export default function DragDropDocuments() {
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [activeItem, setActiveItem] = useState<DragData | null>(null);

  // Fetch documents and folders
  const { data: documentsData, isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/personal-documents'],
  });

  const { data: foldersData, isLoading: foldersLoading } = useQuery({
    queryKey: ['/api/personal-folders'],
  });

  const documents: Document[] = Array.isArray(documentsData) ? documentsData : [];
  const folders: Folder[] = Array.isArray(foldersData) ? foldersData : [];

  // Move document mutation
  const moveDocumentMutation = useMutation({
    mutationFn: async ({ documentId, folderId }: { documentId: string; folderId: string | null }) => {
      const response = await apiRequest('PUT', `/api/personal-documents/${documentId}/move`, {
        folderId
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/personal-documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personal-folders'] });
      toast({
        title: "Success",
        description: "Document moved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to move document",
        variant: "destructive",
      });
    },
  });

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
    setActiveItem(active.data.current as DragData);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeData = active.data.current as DragData;
    const overData = over.data.current as DragData;

    // Only handle document over folder scenarios
    if (activeData?.type === 'document' && overData?.type === 'folder') {
      // Visual feedback is handled by the folder component
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setActiveItem(null);

    if (!over) return;

    const activeData = active.data.current as DragData;
    const overData = over.data.current as DragData;

    // Handle document to folder movement
    if (activeData?.type === 'document' && overData?.type === 'folder') {
      const documentId = active.id as string;
      const folderId = over.id as string;
      
      // Check if document is not already in this folder
      const document = documents.find(doc => doc.id === documentId);
      if (document && document.folderId !== folderId) {
        moveDocumentMutation.mutate({ documentId, folderId });
      }
    }

    // Handle document to unassigned area (if implemented)
    if (activeData?.type === 'document' && over.id === 'unassigned') {
      const documentId = active.id as string;
      const document = documents.find(doc => doc.id === documentId);
      if (document && document.folderId) {
        moveDocumentMutation.mutate({ documentId, folderId: null });
      }
    }
  };

  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const unassignedDocuments = documents.filter(doc => !doc.folderId);

  if (documentsLoading || foldersLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Document Organization</h2>
            <p className="text-sm text-gray-600">
              Drag documents between folders to organize your files
            </p>
          </div>
          <Button onClick={() => setExpandedFolders(new Set(folders.map(f => f.id)))}>
            <FolderOpen className="h-4 w-4 mr-2" />
            Expand All
          </Button>
        </div>

        {/* Folders Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Folders</h3>
          <SortableContext
            items={folders.map(folder => folder.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {folders.map((folder) => (
                <SortableFolder
                  key={folder.id}
                  folder={folder}
                  documents={documents}
                  isExpanded={expandedFolders.has(folder.id)}
                  onToggleExpanded={toggleFolderExpansion}
                />
              ))}
            </div>
          </SortableContext>
        </div>

        {/* Unassigned Documents Section */}
        {unassignedDocuments.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Unassigned Documents</h3>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50"
              data-id="unassigned"
            >
              <SortableContext
                items={unassignedDocuments.map(doc => doc.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {unassignedDocuments.map((document) => (
                    <SortableDocument key={document.id} document={document} />
                  ))}
                </div>
              </SortableContext>
            </div>
          </div>
        )}

        {/* Success Feedback */}
        {moveDocumentMutation.isSuccess && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Document moved successfully!</span>
            </div>
          </div>
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeItem && activeItem.type === 'document' && (
          <SortableDocument
            document={documents.find(doc => doc.id === activeId)!}
            isOverlay={true}
          />
        )}
        {activeItem && activeItem.type === 'folder' && (
          <SortableFolder
            folder={folders.find(folder => folder.id === activeId)!}
            documents={documents}
            isExpanded={false}
            onToggleExpanded={() => {}}
            isOverlay={true}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}