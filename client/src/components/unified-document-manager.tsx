import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  File,
  FileText,
  Image,
  X,
  Check,
  AlertCircle,
  Download,
  FolderOpen,
  Archive,
  Settings,
  Users,
  Shield,
  Eye,
  Lock,
  Trash2,
  Plus,
  Folder,
  Cloud,
  HardDrive
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Document } from "@shared/schema";
import { cn } from "@/lib/utils";
import CloudDriveWizard from "./cloud-drive-wizard";
import DocumentPermissionsEditor from "./document-permissions-editor";

interface UnifiedDocumentManagerProps {
  folderId?: string;
  onUploadComplete?: () => void;
}

interface DocumentPermissions {
  viewAll: boolean;
  adminOnly: boolean;
  managerAccess: boolean;
  agentAccess: boolean;
  trainingData: boolean;
  autoVectorize: boolean;
}

export default function UnifiedDocumentManager({ folderId, onUploadComplete }: UnifiedDocumentManagerProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [documentPermissions, setDocumentPermissions] = useState<DocumentPermissions>({
    viewAll: true,
    adminOnly: false,
    managerAccess: true,
    agentAccess: true,
    trainingData: true,
    autoVectorize: true,
  });
  const [uploadMode, setUploadMode] = useState<'files' | 'folder' | 'zip'>('files');
  const [activeTab, setActiveTab] = useState<'local' | 'cloud'>('local');
  const [showCloudWizard, setShowCloudWizard] = useState(false);
  const [showPermissionsEditor, setShowPermissionsEditor] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing documents
  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  // Upload mutation with zip extraction support
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setSelectedFiles([]);
      setUploadProgress({});
      onUploadComplete?.();
      toast({
        title: "Upload Successful",
        description: "Documents have been uploaded and processed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update document permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ id, permissions }: { id: string, permissions: Partial<DocumentPermissions> }) => {
      return apiRequest(`/api/documents/${id}/permissions`, {
        method: "PATCH",
        body: permissions,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Permissions Updated",
        description: "Document permissions have been updated successfully.",
      });
    },
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/documents/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document Deleted",
        description: "Document has been removed successfully.",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      toast({
        title: "Folder Selected",
        description: `${files.length} files selected from folder`,
      });
    }
  };

  const handleZipSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const zipFiles = files.filter(file => file.name.toLowerCase().endsWith('.zip'));
    if (zipFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...zipFiles]);
      toast({
        title: "ZIP Files Selected",
        description: `${zipFiles.length} ZIP file(s) will be extracted on upload`,
      });
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select files to upload.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    
    // Add files
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    // Add folder ID if provided
    if (folderId) {
      formData.append("folderId", folderId);
    }

    // Add permissions
    formData.append("permissions", JSON.stringify(documentPermissions));

    // Add upload mode for server processing
    formData.append("uploadMode", uploadMode);

    uploadMutation.mutate(formData);
  };

  const handlePermissionChange = (permission: keyof DocumentPermissions, checked: boolean) => {
    setDocumentPermissions(prev => {
      const updated = { ...prev, [permission]: checked };
      
      // If "view all" is checked, enable all other permissions except admin-only
      if (permission === 'viewAll' && checked) {
        updated.adminOnly = false;
        updated.managerAccess = true;
        updated.agentAccess = true;
      }
      
      // If admin-only is checked, disable view all and other permissions
      if (permission === 'adminOnly' && checked) {
        updated.viewAll = false;
        updated.managerAccess = false;
        updated.agentAccess = false;
      }
      
      return updated;
    });
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="h-4 w-4 text-green-500" />;
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive className="h-4 w-4 text-purple-500" />;
      default:
        return <File className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Show cloud drive wizard when requested
  if (showCloudWizard) {
    return (
      <div className="space-y-6">
        <CloudDriveWizard />
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setShowCloudWizard(false)}>
            Back to Local Upload
          </Button>
        </div>
      </div>
    );
  }

  // Show document permissions editor when requested
  if (showPermissionsEditor && selectedDocuments.length > 0) {
    return (
      <div className="space-y-6">
        <DocumentPermissionsEditor
          documents={selectedDocuments}
          folderPermissions={documentPermissions}
          onClose={() => {
            setShowPermissionsEditor(false);
            setSelectedDocuments([]);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'local' | 'cloud')} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="local" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Local Upload
          </TabsTrigger>
          <TabsTrigger value="cloud" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            Cloud Drives
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="local" className="space-y-6">
          {/* Upload Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Document Upload Manager
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Mode Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Upload Method</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={uploadMode === 'files' ? 'default' : 'outline'}
                    onClick={() => setUploadMode('files')}
                    className="flex items-center gap-2"
                  >
                    <File className="h-4 w-4" />
                    Files
                  </Button>
                  <Button
                    variant={uploadMode === 'folder' ? 'default' : 'outline'}
                    onClick={() => setUploadMode('folder')}
                    className="flex items-center gap-2"
                  >
                    <Folder className="h-4 w-4" />
                    Folder
                  </Button>
                  <Button
                    variant={uploadMode === 'zip' ? 'default' : 'outline'}
                    onClick={() => setUploadMode('zip')}
                    className="flex items-center gap-2"
                  >
                    <Archive className="h-4 w-4" />
                    ZIP Extract
                  </Button>
                </div>
              </div>

              {/* File Selection Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full"
                    disabled={uploadMode !== 'files'}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Select Files
                  </Button>
                </div>

                <div>
                  <input
                    ref={folderInputRef}
                    type="file"
                    webkitdirectory=""
                    multiple
                    onChange={handleFolderSelect}
                    className="hidden"
                  />
                  <Button
                    onClick={() => folderInputRef.current?.click()}
                    variant="outline"
                    className="w-full"
                    disabled={uploadMode !== 'folder'}
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Select Folder
                  </Button>
                </div>

                <div>
                  <input
                    ref={zipInputRef}
                    type="file"
                    multiple
                    onChange={handleZipSelect}
                    className="hidden"
                    accept=".zip"
                  />
                  <Button
                    onClick={() => zipInputRef.current?.click()}
                    variant="outline"
                    className="w-full"
                    disabled={uploadMode !== 'zip'}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Select ZIP Files
                  </Button>
                </div>
              </div>

              {/* Selected Files Display */}
              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Selected Files ({selectedFiles.length})
                  </Label>
                  <ScrollArea className="h-40 w-full border rounded-md p-3">
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {getFileIcon(file.name)}
                            <span className="text-sm truncate">{file.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {formatFileSize(file.size)}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || uploadMutation.isPending}
                className="w-full"
              >
                {uploadMutation.isPending ? (
                  "Uploading..."
                ) : (
                  `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Document List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <File className="h-5 w-5" />
                Document Library
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getFileIcon(doc.filename)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(doc.size || 0)} • {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {doc.isPublic && <Badge variant="secondary">Public</Badge>}
                          {doc.adminOnly && <Badge variant="destructive">Admin Only</Badge>}
                          {doc.managerOnly && <Badge variant="outline">Manager+</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Document Permissions</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`public-${doc.id}`}
                                  checked={doc.isPublic}
                                  onCheckedChange={(checked) =>
                                    updatePermissionsMutation.mutate({
                                      id: doc.id,
                                      permissions: { isPublic: checked }
                                    })
                                  }
                                />
                                <Label htmlFor={`public-${doc.id}`}>Public (All Users)</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`manager-${doc.id}`}
                                  checked={doc.managerOnly}
                                  onCheckedChange={(checked) =>
                                    updatePermissionsMutation.mutate({
                                      id: doc.id,
                                      permissions: { managerOnly: checked }
                                    })
                                  }
                                />
                                <Label htmlFor={`manager-${doc.id}`}>Manager+ Only</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`admin-${doc.id}`}
                                  checked={doc.adminOnly}
                                  onCheckedChange={(checked) =>
                                    updatePermissionsMutation.mutate({
                                      id: doc.id,
                                      permissions: { adminOnly: checked }
                                    })
                                  }
                                />
                                <Label htmlFor={`admin-${doc.id}`}>Admin Only</Label>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cloud" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Cloud Drive Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-8">
                <Cloud className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                <h3 className="text-lg font-semibold mb-2">3-Step Import Wizard</h3>
                <p className="text-gray-600 mb-6">
                  Import documents from Google Drive, Dropbox, or OneDrive with full permission control
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 border rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-blue-600 font-semibold">1</span>
                    </div>
                    <h4 className="font-medium mb-1">Choose Source</h4>
                    <p className="text-sm text-gray-600">Select files, folders, or cloud drives</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-blue-600 font-semibold">2</span>
                    </div>
                    <h4 className="font-medium mb-1">Select Content</h4>
                    <p className="text-sm text-gray-600">Choose files and folders to import</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-blue-600 font-semibold">3</span>
                    </div>
                    <h4 className="font-medium mb-1">Set Permissions</h4>
                    <p className="text-sm text-gray-600">Configure access and destination</p>
                  </div>
                </div>

                <Button 
                  onClick={() => setShowCloudWizard(true)} 
                  size="lg" 
                  className="px-8"
                >
                  <Cloud className="h-5 w-5 mr-2" />
                  Start Cloud Import Wizard
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Default Document Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Access Control</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="viewAll"
                        checked={documentPermissions.viewAll}
                        onCheckedChange={(checked) => handlePermissionChange('viewAll', checked as boolean)}
                      />
                      <Label htmlFor="viewAll" className="text-sm">Allow all users to view</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="adminOnly"
                        checked={documentPermissions.adminOnly}
                        onCheckedChange={(checked) => handlePermissionChange('adminOnly', checked as boolean)}
                      />
                      <Label htmlFor="adminOnly" className="text-sm">Admin only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="managerAccess"
                        checked={documentPermissions.managerAccess}
                        onCheckedChange={(checked) => handlePermissionChange('managerAccess', checked as boolean)}
                      />
                      <Label htmlFor="managerAccess" className="text-sm">Manager access</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="agentAccess"
                        checked={documentPermissions.agentAccess}
                        onCheckedChange={(checked) => handlePermissionChange('agentAccess', checked as boolean)}
                      />
                      <Label htmlFor="agentAccess" className="text-sm">Agent access</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-sm">AI Processing</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="trainingData"
                        checked={documentPermissions.trainingData}
                        onCheckedChange={(checked) => handlePermissionChange('trainingData', checked as boolean)}
                      />
                      <Label htmlFor="trainingData" className="text-sm">Use for AI training</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="autoVectorize"
                        checked={documentPermissions.autoVectorize}
                        onCheckedChange={(checked) => handlePermissionChange('autoVectorize', checked as boolean)}
                      />
                      <Label htmlFor="autoVectorize" className="text-sm">Auto-vectorize for search</Label>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Granular Document-Level Permissions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Document-Level Permission Overrides</h4>
                  <Badge variant="secondary" className="text-xs">
                    Advanced Feature
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Set custom permissions for individual documents that override folder defaults. 
                  Useful when a folder is public but contains sensitive documents that need restricted access.
                </p>

                {documents.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Available Documents ({documents.length})
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDocuments(documents);
                          setShowPermissionsEditor(true);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Manage All Permissions
                      </Button>
                    </div>

                    <ScrollArea className="h-32 border rounded-md p-2">
                      <div className="space-y-1">
                        {documents.slice(0, 5).map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded text-sm">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span className="truncate max-w-48">{doc.originalName || doc.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {doc.isPublic && <Badge variant="secondary" className="text-xs"><Eye className="h-3 w-3" /></Badge>}
                              {doc.adminOnly && <Badge variant="destructive" className="text-xs"><Lock className="h-3 w-3" /></Badge>}
                              {doc.managerOnly && <Badge variant="outline" className="text-xs"><ShieldCheck className="h-3 w-3" /></Badge>}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedDocuments([doc]);
                                  setShowPermissionsEditor(true);
                                }}
                              >
                                <Settings className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {documents.length > 5 && (
                          <div className="text-center p-2 text-sm text-gray-500">
                            +{documents.length - 5} more documents
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="text-center p-4 text-gray-500 text-sm border rounded-lg bg-gray-50">
                    No documents available. Upload documents to manage individual permissions.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}