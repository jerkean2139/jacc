import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Folder, 
  FileText, 
  Upload, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Star,
  Download,
  Eye,
  Tag,
  FolderPlus
} from "lucide-react";
import type { PersonalDocument, PersonalFolder } from "@shared/schema";

export default function MyDocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isEditDocumentOpen, setIsEditDocumentOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<PersonalDocument | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#3B82F6");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch personal documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery<PersonalDocument[]>({
    queryKey: ['/api/personal-documents'],
  });

  // Fetch personal folders
  const { data: folders = [], isLoading: foldersLoading } = useQuery<PersonalFolder[]>({
    queryKey: ['/api/personal-folders'],
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (folderData: { name: string; description?: string; color: string }) => {
      return apiRequest('/api/personal-folders', 'POST', folderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/personal-folders'] });
      setIsCreateFolderOpen(false);
      setNewFolderName("");
      setNewFolderDescription("");
      setNewFolderColor("#3B82F6");
      toast({
        title: "Success",
        description: "Folder created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
    },
  });

  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PersonalDocument> }) => {
      return apiRequest(`/api/personal-documents/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/personal-documents'] });
      setIsEditDocumentOpen(false);
      setEditingDocument(null);
      toast({
        title: "Success",
        description: "Document updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update document",
        variant: "destructive",
      });
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/personal-documents/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/personal-documents'] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/personal-folders/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/personal-folders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personal-documents'] });
      setSelectedFolder(null);
      toast({
        title: "Success",
        description: "Folder deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive",
      });
    },
  });

  // Filter documents based on search and selected folder
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFolder = selectedFolder ? doc.personalFolderId === selectedFolder : true;
    
    return matchesSearch && matchesFolder;
  });

  // Get documents in selected folder
  const folderDocuments = selectedFolder 
    ? documents.filter((doc) => doc.personalFolderId === selectedFolder)
    : [];

  // Get unorganized documents
  const unorganizedDocuments = documents.filter((doc) => !doc.personalFolderId);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    
    createFolderMutation.mutate({
      name: newFolderName,
      description: newFolderDescription,
      color: newFolderColor,
    });
  };

  const handleEditDocument = (document: PersonalDocument) => {
    setEditingDocument(document);
    setIsEditDocumentOpen(true);
  };

  const handleUpdateDocument = () => {
    if (!editingDocument) return;
    
    updateDocumentMutation.mutate({
      id: editingDocument.id,
      data: editingDocument,
    });
  };

  const handleDeleteDocument = (id: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteDocumentMutation.mutate(id);
    }
  };

  const handleDeleteFolder = (id: string) => {
    if (confirm("Are you sure you want to delete this folder? Documents will be moved to unorganized.")) {
      deleteFolderMutation.mutate(id);
    }
  };

  const handleToggleFavorite = (document: PersonalDocument) => {
    updateDocumentMutation.mutate({
      id: document.id,
      data: { isFavorite: !document.isFavorite },
    });
  };

  if (documentsLoading || foldersLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Documents</h1>
          <p className="text-gray-600 dark:text-gray-400">Organize and manage your personal documents</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <FolderPlus className="h-4 w-4" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folderName">Folder Name</Label>
                  <Input
                    id="folderName"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                  />
                </div>
                <div>
                  <Label htmlFor="folderDescription">Description (Optional)</Label>
                  <Textarea
                    id="folderDescription"
                    value={newFolderDescription}
                    onChange={(e) => setNewFolderDescription(e.target.value)}
                    placeholder="Enter folder description"
                  />
                </div>
                <div>
                  <Label htmlFor="folderColor">Color</Label>
                  <Input
                    id="folderColor"
                    type="color"
                    value={newFolderColor}
                    onChange={(e) => setNewFolderColor(e.target.value)}
                    className="w-20 h-10"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateFolder} disabled={createFolderMutation.isPending}>
                    {createFolderMutation.isPending ? 'Creating...' : 'Create Folder'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="folders" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="folders">Folders</TabsTrigger>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>

        {/* Folders Tab */}
        <TabsContent value="folders" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {folders.map((folder: PersonalFolder) => (
              <Card 
                key={folder.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedFolder(selectedFolder === folder.id ? null : folder.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Folder 
                        className="h-5 w-5" 
                        style={{ color: folder.color }}
                      />
                      <CardTitle className="text-lg">{folder.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {folder.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{folder.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {folderDocuments.length} document{folderDocuments.length !== 1 ? 's' : ''}
                    </Badge>
                    {selectedFolder === folder.id && (
                      <Badge variant="default">Selected</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Unorganized Documents */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow border-dashed"
              onClick={() => setSelectedFolder(selectedFolder === null ? 'unorganized' : null)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Folder className="h-5 w-5 text-gray-400" />
                  <CardTitle className="text-lg text-gray-600">Unorganized</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">
                    {unorganizedDocuments.length} document{unorganizedDocuments.length !== 1 ? 's' : ''}
                  </Badge>
                  {selectedFolder === 'unorganized' && (
                    <Badge variant="default">Selected</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Folder Documents */}
          {selectedFolder && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {selectedFolder === 'unorganized' 
                  ? 'Unorganized Documents' 
                  : folders.find((f: PersonalFolder) => f.id === selectedFolder)?.name
                }
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(selectedFolder === 'unorganized' ? unorganizedDocuments : folderDocuments)
                  .map((document: PersonalDocument) => (
                  <DocumentCard 
                    key={document.id} 
                    document={document}
                    onEdit={handleEditDocument}
                    onDelete={handleDeleteDocument}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* All Documents Tab */}
        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((document: PersonalDocument) => (
              <DocumentCard 
                key={document.id} 
                document={document}
                onEdit={handleEditDocument}
                onDelete={handleDeleteDocument}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        </TabsContent>

        {/* Favorites Tab */}
        <TabsContent value="favorites" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents
              .filter((doc: PersonalDocument) => doc.isFavorite)
              .map((document: PersonalDocument) => (
                <DocumentCard 
                  key={document.id} 
                  document={document}
                  onEdit={handleEditDocument}
                  onDelete={handleDeleteDocument}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Document Dialog */}
      <Dialog open={isEditDocumentOpen} onOpenChange={setIsEditDocumentOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
          </DialogHeader>
          {editingDocument && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="docName">Document Name</Label>
                <Input
                  id="docName"
                  value={editingDocument.name}
                  onChange={(e) => setEditingDocument({ ...editingDocument, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="docNotes">Notes</Label>
                <Textarea
                  id="docNotes"
                  value={editingDocument.notes || ''}
                  onChange={(e) => setEditingDocument({ ...editingDocument, notes: e.target.value })}
                  placeholder="Add your notes about this document"
                />
              </div>
              <div>
                <Label htmlFor="docFolder">Folder</Label>
                <Select
                  value={editingDocument.personalFolderId || 'none'}
                  onValueChange={(value) => 
                    setEditingDocument({ 
                      ...editingDocument, 
                      personalFolderId: value === 'none' ? null : value 
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No folder</SelectItem>
                    {folders.map((folder: PersonalFolder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDocumentOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateDocument} disabled={updateDocumentMutation.isPending}>
                  {updateDocumentMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Document Card Component
function DocumentCard({ 
  document, 
  onEdit, 
  onDelete, 
  onToggleFavorite 
}: {
  document: PersonalDocument;
  onEdit: (doc: PersonalDocument) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (doc: PersonalDocument) => void;
}) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base truncate">{document.name}</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(document.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleFavorite(document)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Star 
              className={`h-4 w-4 ${document.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} 
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {document.notes && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {document.notes}
          </p>
        )}
        
        {document.tags && document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {document.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
            {document.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{document.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center pt-2">
          <div className="flex gap-1">
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(document)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(document.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}