import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, File } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface DocumentDownloadProps {
  documentType: 'faq';
  className?: string;
}

export function DocumentDownload({ documentType, className }: DocumentDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const downloadDocument = async (format: 'txt' | 'json') => {
    try {
      setIsDownloading(true);
      
      const response = await fetch(`/api/documents/${documentType}/download/${format}`);
      
      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      // Create blob URL for download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Get filename from Content-Disposition header or create default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `tracer-${documentType}.${format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: `${filename} is being downloaded`,
      });
      
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Unable to download the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isDownloading}
          className={className}
        >
          <Download className="h-4 w-4 mr-2" />
          {isDownloading ? 'Downloading...' : 'Download FAQ'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => downloadDocument('txt')}>
          <FileText className="h-4 w-4 mr-2" />
          Text Format (.txt)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadDocument('json')}>
          <File className="h-4 w-4 mr-2" />
          JSON Format (.json)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Hook for creating downloadable blob URLs from text content
export function useDocumentBlob() {
  const createDownloadLink = (content: string, filename: string, mimeType = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const createPrintableDocument = (content: string, title: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 40px;
                line-height: 1.6;
              }
              h1 {
                color: #1e40af;
                border-bottom: 2px solid #1e40af;
                padding-bottom: 10px;
              }
              h2 {
                color: #374151;
                margin-top: 30px;
              }
              .question {
                font-weight: bold;
                margin-top: 20px;
                color: #111827;
              }
              .answer {
                margin-left: 20px;
                margin-bottom: 15px;
                color: #374151;
              }
              @media print {
                body { margin: 20px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="no-print">
              <button onclick="window.print()" style="padding: 10px 20px; margin-bottom: 20px; background: #1e40af; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Document</button>
            </div>
            <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${content}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return { createDownloadLink, createPrintableDocument };
}