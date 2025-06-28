import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import DocumentUpload from "@/components/document-upload";
import { DraggableDocument } from "@/components/draggable-document";
import { DroppableFolder } from "@/components/droppable-folder";
import { apiRequest } from "@/lib/queryClient";
import { Search, FileText, Upload, Folder, Trash2, ArrowLeft, Home, Plus, FolderPlus } from "lucide-react";
import type { Document, Folder as FolderType, User } from "@shared/schema";

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("blue");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user data to determine role
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  // Fetch documents and folders with loading states
  const { data: documentsData, isLoading: documentsLoading, error: documentsError } = useQuery({
    queryKey: ["/api/documents"],
  });

  const { data: folders = [], isLoading: foldersLoading, error: foldersError } = useQuery<FolderType[]>({
    queryKey: ["/api/folders"],
  });

  // Check if user is admin
  const isAdmin = user?.role === 'dev-admin' || user?.role === 'client-admin';

  // Extract documents from API response - handle both array and object formats
  let documents: any[] = [];
  
  if (documentsData) {
    // Handle case where API returns array directly (current format)
    if (Array.isArray(documentsData)) {
      documents = documentsData.filter((doc: any) => {
        if (isAdmin) return true; // Admins see all documents
        return !doc.adminOnly; // Regular users only see non-admin documents
      });
    } 
    // Handle case where API returns object with folders structure (legacy format)
    else {
      documents = [
        ...(documentsData.folders?.flatMap((folder: any) => {
          if (!folder.documents || !Array.isArray(folder.documents)) return [];
          return folder.documents.filter((doc: any) => {
            if (isAdmin) return true; // Admins see all documents
            return !doc.admin_only && !doc.adminOnly;
          });
        }) || []),
        ...(documentsData.unassignedDocuments?.filter((doc: any) => {
          if (isAdmin) return true; // Admins see all documents
          return !doc.admin_only && !doc.adminOnly;
        }) || [])
      ];
    }
  }

  // Map the document structure to ensure consistent field names
  const normalizedDocuments = documents.map((doc: any) => ({
    ...doc,
    folderId: doc.folder_id || doc.folderId,
    adminOnly: doc.admin_only || doc.adminOnly
  }));

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document deleted",
        description: "The document has been successfully removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Document move mutation for drag-and-drop
  const moveMutation = useMutation({
    mutationFn: async ({ documentId, folderId }: { documentId: string; folderId: string }) => {
      return await apiRequest(`/api/documents/${documentId}/move`, {
        method: 'PATCH',
        body: JSON.stringify({ folderId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Move failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (folderData: { name: string; color: string }) => {
      return apiRequest('/api/folders', {
        method: 'POST',
        body: JSON.stringify({
          name: folderData.name,
          color: folderData.color,
          folderType: 'custom',
          vectorNamespace: `folder_${folderData.name.toLowerCase().replace(/\s+/g, '_')}`
        })
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setIsCreateFolderDialogOpen(false);
      setNewFolderName('');
      setNewFolderColor('blue');
      toast({
        title: "Folder Created",
        description: `Folder "${data.name}" has been created successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: "Failed to create folder. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleDocumentMove = async (documentId: string, targetFolderId: string) => {
    await moveMutation.mutateAsync({ documentId, folderId: targetFolderId });
  };

  const filteredDocuments = normalizedDocuments.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.originalName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  console.log('Search query:', searchQuery);
  console.log('Normalized documents:', normalizedDocuments.length);
  console.log('Filtered documents:', filteredDocuments.length);

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <span className="text-muted-foreground">/</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">Documents</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Document Management</h1>
            <p className="text-muted-foreground">
              Upload and organize your merchant services documents for instant search in Tracer
            </p>
          </div>
          {user && (
            <div className="text-right">
              <div className="text-sm font-medium">
                {isAdmin ? 'Administrator View' : 'User View'}
              </div>
              <div className="text-xs text-muted-foreground">
                {isAdmin ? 'Viewing all documents' : 'Viewing permitted documents only'}
              </div>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="folders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="folders">
            <Folder className="h-4 w-4 mr-2" />
            Folders ({folders.length})
          </TabsTrigger>
          <TabsTrigger value="manage">
            <FileText className="h-4 w-4 mr-2" />
            {isAdmin ? 'All Documents' : 'Documents'} ({normalizedDocuments.length})
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload Documents
            </TabsTrigger>
          )}
        </TabsList>

        {isAdmin && (
          <TabsContent value="upload" className="space-y-4">
            <DocumentUpload />
          </TabsContent>
        )}

        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Documents</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents by name, description, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading documents...</p>
                </div>
              ) : documentsError ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-red-400" />
                  <h3 className="mt-2 text-sm font-semibold text-red-600">Error loading documents</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Please try refreshing the page or contact support if the issue persists.
                  </p>
                </div>
              ) : filteredDocuments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.map((doc) => (
                    <DraggableDocument
                      key={doc.id}
                      document={doc}
                      onMove={handleDocumentMove}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No documents found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {searchQuery ? 'Try adjusting your search terms.' : 'Upload some documents to get started.'}
                  </p>
                  {normalizedDocuments.length === 0 && !searchQuery && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Documents available: {normalizedDocuments.length}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="folders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Folder Organization</CardTitle>
              <p className="text-sm text-muted-foreground">
                Organize your documents into folders for better management
              </p>
            </CardHeader>
            <CardContent>
              {!foldersLoading && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border-2 border-dashed border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Drag & Drop Instructions</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-200">
                    • Drag documents from the "Documents" tab to any folder below to organize them
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-200">
                    • Folders will highlight when you can drop documents into them
                  </p>
                </div>
              )}
              
              {foldersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading folders...</p>
                </div>
              ) : foldersError ? (
                <div className="text-center py-8">
                  <Folder className="mx-auto h-12 w-12 text-red-400" />
                  <h3 className="mt-2 text-sm font-semibold text-red-600">Error loading folders</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Please try refreshing the page or contact support if the issue persists.
                  </p>
                </div>
              ) : folders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {folders.map((folder) => {
                    // Calculate document count from the actual documents array
                    const documentCount = documents.filter(doc => doc.folderId === folder.id).length;
                    
                    return (
                      <DroppableFolder
                        key={folder.id}
                        folder={{
                          ...folder,
                          documentCount: documentCount
                        }}
                        onDocumentMove={handleDocumentMove}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Folder className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No folders available</h3>
                  <p className="text-sm text-muted-foreground">
                    Folders will be created automatically when you upload documents.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}