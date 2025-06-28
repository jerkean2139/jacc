import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  ExternalLink, 
  FileText, 
  Image, 
  File,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DocumentPreviewModalProps {
  document: any;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (doc: any) => void;
}

export default function DocumentPreviewModal({
  document,
  isOpen,
  onClose,
  onDownload,
}: DocumentPreviewModalProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!document) return null;

  const isPDF = document.mimeType === 'application/pdf';
  const isImage = document.mimeType?.startsWith('image/') || false;
  const isText = document.mimeType?.startsWith('text/') || 
                 document.mimeType === 'application/json' ||
                 document.mimeType === 'application/javascript' || false;

  const previewUrl = `/api/documents/${document.id}/view`;
  const downloadUrl = `/api/documents/${document.id}/download`;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderPreview = () => {
    if (isPDF) {
      return (
        <div className="relative w-full h-full bg-gray-100 rounded">
          <iframe
            src={previewUrl}
            className="w-full h-full rounded"
            style={{ 
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
            title={`Preview of ${document.name}`}
          />
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="relative w-full h-full bg-gray-100 rounded flex items-center justify-center">
          <img
            src={previewUrl}
            alt={document.name}
            className="max-w-full max-h-full object-contain rounded"
            style={{ 
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
          />
        </div>
      );
    }

    if (isText) {
      return (
        <div className="relative w-full h-full bg-white rounded border">
          <iframe
            src={previewUrl}
            className="w-full h-full rounded"
            style={{ 
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left'
            }}
            title={`Preview of ${document.name}`}
          />
        </div>
      );
    }

    // Fallback for unsupported file types
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
        <File className="h-16 w-16" />
        <div className="text-center">
          <div className="font-medium">Preview not available</div>
          <div className="text-sm">This file type cannot be previewed</div>
          <div className="text-sm">Download to view the file</div>
        </div>
        <Button onClick={() => onDownload(document)} className="mt-4">
          <Download className="h-4 w-4 mr-2" />
          Download File
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 z-50">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold truncate">
                {document.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Document preview for {document.name}
              </DialogDescription>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">
                  {document.mimeType?.split('/')[1] || 'unknown'}
                </Badge>
                <span className="text-sm text-gray-500">
                  {formatFileSize(document.size)}
                </span>
                <span className="text-sm text-gray-500">
                  {formatDate(document.createdAt)}
                </span>
              </div>
              {document.tags && document.tags.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {document.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              {(isPDF || isImage) && (
                <>
                  <Button variant="outline" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-500 px-2">{zoom}%</span>
                  <Button variant="outline" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRotate}>
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              <Button variant="outline" size="sm" onClick={() => onDownload(document)}>
                <Download className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="sm" asChild>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 p-6 pt-4">
          <div className="h-[60vh] w-full">
            {renderPreview()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}