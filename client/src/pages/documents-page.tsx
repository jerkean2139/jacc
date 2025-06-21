import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import DocumentUpload from "@/components/document-upload";
import { DraggableDocument } from "@/components/draggable-document";
import { DroppableFolder } from "@/components/droppable-folder";
import { apiRequest } from "@/lib/queryClient";
import { Search, FileText, Upload, Folder, Trash2 } from "lucide-react";
import type { Document, Folder as FolderType, User } from "@shared/schema";

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user data to determine role
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  // Fetch documents and folders
  const { data: documentsData } = useQuery({
    queryKey: ["/api/documents"],
  });

  const { data: folders = [] } = useQuery<FolderType[]>({
    queryKey: ["/api/folders"],
  });

  // Check if user is admin
  const isAdmin = user?.role === 'dev-admin' || user?.role === 'client-admin';

  // Extract documents from the integrated structure with role-based filtering
  const documents = documentsData ? [
    ...(documentsData.folders?.flatMap((folder: any) => {
      if (!folder.documents) return [];
      // Filter documents based on user role and permissions
      return folder.documents.filter((doc: any) => {
        if (isAdmin) return true; // Admins see all documents
        // Regular users only see documents that are not admin-only
        return !doc.adminOnly;
      });
    }) || []),
    ...(documentsData.unassignedDocuments?.filter((doc: any) => {
      if (isAdmin) return true; // Admins see all documents
      return !doc.adminOnly; // Regular users only see non-admin documents
    }) || [])
  ] : [];

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
        body: { folderId },
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

  const handleDocumentMove = async (documentId: string, targetFolderId: string) => {
    await moveMutation.mutateAsync({ documentId, folderId: targetFolderId });
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.originalName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
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

      <Tabs defaultValue={isAdmin ? "upload" : "manage"} className="space-y-4">
        <TabsList>
          {isAdmin && (
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload Documents
            </TabsTrigger>
          )}
          <TabsTrigger value="manage">
            <FileText className="h-4 w-4 mr-2" />
            {isAdmin ? 'All Documents' : 'Documents'} ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="folders">
            <Folder className="h-4 w-4 mr-2" />
            Folders ({folders.length})
          </TabsTrigger>
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
            {filteredDocuments.length > 0 && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.map((doc) => (
                    <DraggableDocument
                      key={doc.id}
                      document={doc}
                      onMove={handleDocumentMove}
                    />
                  ))}
                </div>
              </CardContent>
            )}
            {filteredDocuments.length === 0 && (
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No documents found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {searchQuery ? 'Try adjusting your search terms.' : 'Upload some documents to get started.'}
                  </p>
                </div>
              </CardContent>
            )}
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
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border-2 border-dashed border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Drag & Drop Instructions</h4>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  • Drag documents from the "Manage Documents" tab to any folder below to organize them
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  • Folders will highlight when you can drop documents into them
                </p>
              </div>
              
              {folders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {folders.map((folder) => {
                    const documentsInFolder = documents.filter(doc => doc.folderId === folder.id);
                    return (
                      <DroppableFolder
                        key={folder.id}
                        folder={{
                          ...folder,
                          documentCount: documentsInFolder.length
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