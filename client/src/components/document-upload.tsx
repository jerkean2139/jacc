import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  File,
  FileText,
  Image,
  X,
  Check,
  CheckCircle,
  AlertCircle,
  Download,
  ExternalLink,
  Edit2,
  Trash2,
  Save,
  AlertTriangle,
  Settings
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Document } from "@shared/schema";
import { cn } from "@/lib/utils";
import DocumentPlacementDialog from "./document-placement-dialog";

interface DocumentUploadProps {
  folderId?: string;
  onUploadComplete?: () => void;
}

export default function DocumentUpload({ folderId, onUploadComplete }: DocumentUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentStep, setCurrentStep] = useState<'files' | 'folder' | 'permissions'>('files');
  const [selectedFolderId, setSelectedFolderId] = useState<string>(folderId || "");
  const [permissions, setPermissions] = useState({
    viewAll: true,
    adminOnly: false,
    managerAccess: true,
    agentAccess: true,
    trainingData: true,
    autoVectorize: true,
  });
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [duplicateWarnings, setDuplicateWarnings] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const isAuthenticated = true; // Admin-only component, no auth check needed

  // Fetch existing documents and folders
  const { data: documentsData } = useQuery({
    queryKey: ["/api/documents"],
    enabled: isAuthenticated,
  });

  const { data: folders = [] } = useQuery({
    queryKey: ["/api/folders"],
    enabled: isAuthenticated,
  });

  // Extract documents from the integrated structure
  const documents = documentsData ? [
    ...((documentsData as any)?.folders?.flatMap((folder: any) => folder.documents || []) || []),
    ...((documentsData as any)?.unassignedDocuments || [])
  ] : [];

  // Reset to step 1 when files are cleared
  const resetToStep1 = () => {
    setCurrentStep('files');
    setSelectedFiles([]);
    setFileNames({});
    setDuplicateWarnings([]);
  };

  // Check for duplicate files using the API
  const checkForDuplicates = async (files: File[]) => {
    try {
      const filenames = files.map(file => file.name);
      const response = await fetch('/api/documents/check-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ filenames })
      });

      if (response.ok) {
        try {
          const data = await response.json();
          const duplicates: string[] = [];
          
          if (data.results && Array.isArray(data.results)) {
            data.results.forEach((result: any) => {
              if (result.potentialDuplicates > 0) {
                duplicates.push(result.filename);
              }
            });
          }
          
          setDuplicateWarnings(duplicates);
          return; // Successfully processed, exit function
        } catch (jsonError) {
          console.log('API response not JSON, using local check');
          // Fall through to local check
        }
      }
    } catch (error) {
      console.error('Error checking for duplicates, using local check:', error);
      // Fallback to local check
      const duplicates: string[] = [];
      files.forEach(file => {
        const existingDoc = documents.find(doc => 
          doc.originalName?.toLowerCase() === file.name.toLowerCase() || 
          doc.name.toLowerCase() === file.name.replace(/\.[^/.]+$/, "").toLowerCase()
        );
        if (existingDoc && !duplicates.includes(file.name)) {
          duplicates.push(file.name);
        }
      });
      setDuplicateWarnings(duplicates);
    }
  };

  // Update file name
  const updateFileName = (fileIndex: number, newName: string) => {
    const fileKey = `${fileIndex}-${selectedFiles[fileIndex]?.name}`;
    setFileNames(prev => ({
      ...prev,
      [fileKey]: newName
    }));
  };



  // Upload mutation - Step 1: Upload files temporarily
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/documents/upload-temp", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setUploadedFiles(data.files);
      setSelectedFiles([]);
      setUploadProgress({});
      setShowPlacementDialog(true);
      toast({
        title: "Upload successful",
        description: "Files uploaded. Please configure folder placement and permissions.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const validateAndAddFiles = (files: File[]) => {
    // Enhanced file type validation including ZIP files
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg', 
      'image/png', 
      'image/jpg',
      'application/zip',
      'application/x-zip-compressed'
    ];
    
    const validFiles = files.filter(file => {
      const isValidType = allowedTypes.includes(file.type) || 
                         file.name.toLowerCase().endsWith('.zip') ||
                         file.name.toLowerCase().endsWith('.docx') ||
                         file.name.toLowerCase().endsWith('.xlsx') ||
                         file.name.toLowerCase().endsWith('.pptx');
      const isValidSize = file.size <= 100 * 1024 * 1024; // 100MB limit
      return isValidType && isValidSize;
    });

    const skippedFiles = files.length - validFiles.length;
    if (skippedFiles > 0) {
      toast({
        title: `${skippedFiles} file(s) skipped`,
        description: "Only PDF, Word, Excel, PowerPoint, Images, and ZIP files under 100MB are allowed.",
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => {
        const newFiles = [...prev, ...validFiles];
        checkForDuplicates(newFiles);
        return newFiles;
      });
      toast({
        title: `${validFiles.length} file(s) ready`,
        description: "Files added successfully. Click 'Upload Documents' to process them.",
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    validateAndAddFiles(files);
    // Reset the input value so the same file can be selected again
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    validateAndAddFiles(files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      checkForDuplicates(newFiles);
      return newFiles;
    });
    // Clear the custom name for this file
    const fileKey = `${index}-${selectedFiles[index]?.name}`;
    setFileNames(prev => {
      const updated = { ...prev };
      delete updated[fileKey];
      return updated;
    });
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) return;
    if (uploadMutation.isPending) return; // Prevent double upload
    
    // Create FormData with custom names
    const formData = new FormData();
    selectedFiles.forEach((file, index) => {
      const fileKey = `${index}-${file.name}`;
      const customName = fileNames[fileKey];
      
      // Add the file with the custom name as metadata
      formData.append('files', file);
      if (customName && customName !== file.name.replace(/\.[^/.]+$/, "")) {
        formData.append(`customName_${index}`, customName);
      }
    });
    
    uploadMutation.mutate(formData);
  };

  // Delete document function
  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
        toast({
          title: "Document deleted",
          description: "The document has been successfully removed.",
        });
      } else {
        throw new Error('Failed to delete document');
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (fileType.includes('word')) return <FileText className="h-4 w-4 text-blue-500" />;
    if (fileType.includes('excel') || fileType.includes('sheet')) return <File className="h-4 w-4 text-green-500" />;
    if (fileType.includes('image')) return <Image className="h-4 w-4 text-purple-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Merchant Services Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">


          {/* Enhanced Drag & Drop Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 relative ${
              selectedFiles.length > 0 
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                : isDragOver 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer'
            } ${!isAuthenticated ? 'opacity-50 pointer-events-none' : ''}
            ${selectedFiles.length > 0 ? 'pointer-events-none' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedFiles.length > 0 ? (
              <CheckCircle className="mx-auto h-12 w-12 mb-4 text-green-500" />
            ) : (
              <Upload className={`mx-auto h-12 w-12 mb-4 transition-colors ${
                isDragOver ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'
              }`} />
            )}
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {selectedFiles.length > 0 
                  ? `${selectedFiles.length} File(s) Selected` 
                  : isDragOver 
                    ? 'Drop your files here!' 
                    : 'Upload Documents'
                }
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedFiles.length > 0 
                  ? 'Ready to upload. Click "Upload Documents" below to proceed.' 
                  : isDragOver 
                    ? 'Release to add your documents' 
                    : 'Drag and drop files here'
                }
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.pptx,.jpg,.jpeg,.png,.zip"
              className="hidden"
            />
            <div className="mt-4 space-y-3">
              {selectedFiles.length === 0 && (
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files to Upload
                </Button>
              )}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Supported: PDF, Word, Excel, PowerPoint, Images, ZIP files
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                  ✓ 100MB max per file ✓ Automatic ZIP extraction ✓ Folder organization
                </p>
              </div>
            </div>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Selected Files ({selectedFiles.length})</Label>
                {duplicateWarnings.length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {duplicateWarnings.length} Potential Duplicates
                  </Badge>
                )}
              </div>
              
              <ScrollArea className="h-40 border rounded-md p-3">
                {selectedFiles.map((file, index) => {
                  const fileKey = `${index}-${file.name}`;
                  const customName = fileNames[fileKey];
                  const isDuplicate = duplicateWarnings.includes(file.name);
                  
                  return (
                    <div key={index} className={`flex items-center gap-2 py-2 px-2 rounded ${isDuplicate ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : ''}`}>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getFileIcon(file.type)}
                        <div className="flex-1 min-w-0">
                          <Input
                            value={customName || file.name.replace(/\.[^/.]+$/, "")}
                            onChange={(e) => updateFileName(index, e.target.value)}
                            className="text-sm h-7 border-0 bg-transparent p-1"
                            placeholder="Document name..."
                          />
                          {isDuplicate && (
                            <div className="flex items-center gap-1 mt-1">
                              <AlertTriangle className="h-3 w-3 text-red-500" />
                              <span className="text-xs text-red-600 dark:text-red-400">
                                Similar document exists
                              </span>
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {formatFileSize(file.size)}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </ScrollArea>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploadMutation.isPending}
            className="w-full"
          >
            {uploadMutation.isPending ? (
              <>
                <AlertCircle className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Documents */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              Your Documents ({documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(doc.mimeType || '')}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {doc.originalName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.isFavorite && (
                          <Badge variant="secondary" className="text-xs">
                            Favorite
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {doc.mimeType?.split('/')[1]?.toUpperCase() || 'Document'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {doc.path && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`/uploads/${doc.path}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Document Placement Dialog */}
      <DocumentPlacementDialog
        open={showPlacementDialog}
        onClose={() => {
          setShowPlacementDialog(false);
          setUploadedFiles([]);
        }}
        uploadedFiles={uploadedFiles}
        onComplete={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
          setUploadedFiles([]);
          onUploadComplete?.();
          toast({
            title: "Documents processed",
            description: "Your documents have been placed in the document library and are now searchable.",
          });
        }}
      />
    </div>
  );
}