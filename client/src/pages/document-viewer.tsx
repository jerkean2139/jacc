import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, ArrowLeft, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Document } from '@shared/schema';

export default function DocumentViewer() {
  const { documentId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch document metadata
  const { data: document, isLoading, error } = useQuery<Document>({
    queryKey: [`/api/documents/${documentId}`],
    enabled: !!documentId,
  });

  const handleDownload = () => {
    if (!document) return;
    
    const downloadUrl = `/api/documents/${documentId}/download`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = document.originalName || document.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download started",
      description: `Downloading ${document.name}`,
    });
  };

  const handleOpenInNewTab = () => {
    const viewUrl = `/api/documents/${documentId}/view`;
    window.open(viewUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Document Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The requested document could not be found.</p>
          <Button onClick={() => setLocation('/documents')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Documents
          </Button>
        </div>
      </div>
    );
  }

  const getFileIcon = (mimeType?: string) => {
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return '📊';
    if (mimeType?.includes('document') || mimeType?.includes('word')) return '📝';
    if (mimeType?.includes('image')) return '🖼️';
    return '📁';
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setLocation('/documents')} 
            variant="outline" 
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {getFileIcon(document.mimeType)} {document.name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {document.originalName} • {document.mimeType?.split('/')[1]?.toUpperCase() || 'Document'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button onClick={handleOpenInNewTab} variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in New Tab
          </Button>
        </div>
      </div>

      {/* Document Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Document Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-900 dark:text-gray-100">File Name:</span>
              <p className="text-gray-600 dark:text-gray-400">{document.originalName}</p>
            </div>
            <div>
              <span className="font-medium text-gray-900 dark:text-gray-100">File Type:</span>
              <p className="text-gray-600 dark:text-gray-400">{document.mimeType}</p>
            </div>
            <div>
              <span className="font-medium text-gray-900 dark:text-gray-100">Size:</span>
              <p className="text-gray-600 dark:text-gray-400">{document.size ? `${Math.round(document.size / 1024)} KB` : 'Unknown'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-900 dark:text-gray-100">Uploaded:</span>
              <p className="text-gray-600 dark:text-gray-400">
                {document.createdAt ? new Date(document.createdAt).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
          {document.description && (
            <div>
              <span className="font-medium text-gray-900 dark:text-gray-100">Description:</span>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{document.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Viewer */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Document Preview</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full h-[600px] border rounded-b-lg overflow-hidden bg-gray-50 dark:bg-gray-900 relative">
            {document.mimeType === 'application/pdf' ? (
              <>
                <iframe
                  src={`/api/documents/${documentId}/view#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                  className="w-full h-full border-0"
                  title={`Preview of ${document.name}`}
                  allow="fullscreen"
                  style={{ border: 'none' }}
                  onLoad={(e) => {
                    // Hide the loading message when PDF loads
                    const loadingDiv = document.getElementById('pdf-loading');
                    if (loadingDiv) loadingDiv.style.display = 'none';
                  }}
                />
                <div id="pdf-loading" className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📄</div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">Loading PDF preview...</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      If the preview doesn't load, use the "Open in New Tab" button above
                    </p>
                  </div>
                </div>
              </>
            ) : document.mimeType?.startsWith('image/') ? (
              <div className="flex items-center justify-center h-full">
                <img
                  src={`/api/documents/${documentId}/view`}
                  alt={document.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-4xl mb-4">📄</div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Preview not available for this file type
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Use the download button to view the file
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}