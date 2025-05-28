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
  AlertCircle,
  Download,
  ExternalLink,
  Edit2,
  Save,
  AlertTriangle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Document } from "@shared/schema";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  folderId?: string;
  onUploadComplete?: () => void;
}

export default function DocumentUpload({ folderId, onUploadComplete }: DocumentUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [duplicateWarnings, setDuplicateWarnings] = useState<string[]>([]);

  // Simple authentication function
  const handleAuthenticate = async () => {
    try {
      const response = await fetch('/api/auth/simple-login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setIsAuthenticated(true);
        queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
        toast({
          title: "Authentication Successful",
          description: "You can now upload documents using drag & drop!",
        });
      }
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch existing documents
  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  // Check for duplicate files
  const checkForDuplicates = (files: File[]) => {
    const duplicates: string[] = [];
    files.forEach(file => {
      const existingDoc = documents.find(doc => 
        doc.originalName === file.name || 
        doc.name === file.name
      );
      if (existingDoc) {
        duplicates.push(file.name);
      }
    });
    setDuplicateWarnings(duplicates);
  };

  // Update file name
  const updateFileName = (fileIndex: number, newName: string) => {
    const fileKey = `${fileIndex}-${selectedFiles[fileIndex]?.name}`;
    setFileNames(prev => ({
      ...prev,
      [fileKey]: newName
    }));
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      
      if (folderId) {
        formData.append("folderId", folderId);
      }

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
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
      toast({
        title: "Upload successful",
        description: "Your documents have been uploaded and are now searchable in Tracer.",
      });
      onUploadComplete?.();
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const [isDragOver, setIsDragOver] = useState(false);

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
      setSelectedFiles(prev => [...prev, ...validFiles]);
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
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) return;
    uploadMutation.mutate(selectedFiles);
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
          {/* Authentication Button */}
          {!isAuthenticated && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Authentication Required</h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">Click to enable document uploads</p>
                </div>
                <Button onClick={handleAuthenticate} variant="outline" size="sm">
                  Enable Uploads
                </Button>
              </div>
            </div>
          )}

          {/* Enhanced Drag & Drop Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer relative ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105' 
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
            } ${!isAuthenticated ? 'opacity-50 pointer-events-none' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={`mx-auto h-12 w-12 mb-4 transition-colors ${
              isDragOver ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'
            }`} />
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {isDragOver ? 'Drop your files here!' : 'Upload Documents'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {isDragOver 
                  ? 'Release to add your documents' 
                  : 'Drag and drop files here, or click to browse'
                }
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.pptx,.jpg,.jpeg,.png,.zip"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">
                Supported: PDF, Word, Excel, PowerPoint, Images, ZIP files
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                ✓ 100MB max per file ✓ Automatic ZIP extraction ✓ Folder organization
              </p>
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
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                        {doc.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {doc.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.isFavorite && (
                          <Badge variant="secondary" className="text-xs">
                            Favorite
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {doc.category || 'Document'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {doc.url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}