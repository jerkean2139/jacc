import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  File,
  FileText,
  Image,
  X,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
}

interface UploadFile extends File {
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function FileUpload({
  onFileUpload,
  maxFiles = 5,
  maxFileSize = 100,
  acceptedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png']
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (!type) return File;
    if (type.includes('image')) return Image;
    if (type.includes('pdf') || type.includes('document')) return FileText;
    return File;
  };

  const getFileTypeColor = (type: string) => {
    if (!type) return 'text-slate-500';
    if (type.includes('image')) return 'text-blue-500';
    if (type.includes('pdf')) return 'text-red-500';
    if (type.includes('spreadsheet') || type.includes('excel')) return 'text-green-500';
    return 'text-slate-500';
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }

    // Check file type
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension && !acceptedTypes.includes(extension)) {
      return `File type .${extension} is not supported`;
    }

    return null;
  };

  const processFiles = (fileList: FileList | File[]) => {
    const newFiles: UploadFile[] = [];
    const currentFileCount = files.length;

    Array.from(fileList).forEach((file, index) => {
      if (currentFileCount + newFiles.length >= maxFiles) {
        return; // Skip if we've reached max files
      }

      const error = validateFile(file);
      const uploadFile: UploadFile = {
        ...file,
        id: `${file.name}-${Date.now()}-${index}`,
        progress: 0,
        status: error ? 'error' : 'pending',
        error: error ?? undefined
      };

      newFiles.push(uploadFile);
    });

    setFiles(prev => [...prev, ...newFiles]);

    // Start uploading valid files
    newFiles.forEach(file => {
      if (file.status === 'pending') {
        uploadFile(file);
      }
    });
  };

  const uploadFile = async (file: UploadFile) => {
    setFiles(prev => prev.map(f => 
      f.id === file.id ? { ...f, status: 'uploading' } : f
    ));

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === file.id && f.progress < 90) {
            return { ...f, progress: f.progress + 10 };
          }
          return f;
        }));
      }, 200);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, status: 'success', progress: 100 }
          : f
      ));

      // Call the callback with successful files
      onFileUpload([file]);

    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, status: 'error', error: 'Upload failed' }
          : f
      ));
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
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
    processFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragOver 
            ? "border-green-500 bg-green-50 dark:bg-green-900/10" 
            : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Upload className={cn(
            "w-12 h-12 mb-4",
            isDragOver ? "text-green-500" : "text-slate-400"
          )} />
          <p className="text-slate-600 dark:text-slate-300 mb-2">
            <span className="font-medium">Click to upload</span> or drag and drop
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Supports PDF, DOC, XLS, JPG, PNG files (max {maxFileSize}MB each)
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Maximum {maxFiles} files
          </p>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.map(type => `.${type}`).join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Uploaded Files ({files.length}/{maxFiles})
          </h4>
          {files.map((file) => {
            const IconComponent = getFileIcon(file.type);
            const iconColorClass = getFileTypeColor(file.type);

            return (
              <Card key={file.id} className="p-3">
                <div className="flex items-center space-x-3">
                  <IconComponent className={cn("w-5 h-5 flex-shrink-0", iconColorClass)} />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatFileSize(file.size)}
                    </p>
                    
                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="mt-2 h-1" />
                    )}
                    
                    {file.error && (
                      <p className="text-xs text-red-500 mt-1">{file.error}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {file.status === 'success' && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                      className="w-6 h-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
