import React, { useState } from 'react';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface DocumentPreview {
  id: string;
  name: string;
  mimeType: string;
  createdAt: string;
  description: string;
  viewUrl: string;
  downloadUrl: string;
}

interface DocumentLinkProps {
  documentId: string;
  documentName: string;
  className?: string;
}

export function DocumentLink({ documentId, documentName, className = '' }: DocumentLinkProps) {
  const [isHovering, setIsHovering] = useState(false);

  // Fetch document preview data for hover
  const { data: preview } = useQuery<DocumentPreview>({
    queryKey: [`/api/documents/${documentId}/preview`],
    enabled: isHovering,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Update browser URL and open document in same tab for better UX
    const viewUrl = `/documents/${documentId}`;
    window.location.href = viewUrl;
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Trigger download
    const downloadUrl = `/api/documents/${documentId}/download`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = documentName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (mimeType?: string) => {
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return '📊';
    if (mimeType?.includes('document') || mimeType?.includes('word')) return '📝';
    return '📁';
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={`
          inline-flex items-center gap-2 px-3 py-1 rounded-md
          bg-blue-50 dark:bg-blue-900/20 
          text-blue-700 dark:text-blue-300
          hover:bg-blue-100 dark:hover:bg-blue-900/40
          hover:text-blue-800 dark:hover:text-blue-200
          border border-blue-200 dark:border-blue-800
          transition-all duration-200
          cursor-pointer text-sm font-medium
          ${className}
        `}
      >
        <FileText className="w-4 h-4" />
        <span className="truncate max-w-xs">{documentName}</span>
        <ExternalLink className="w-3 h-3 opacity-60" />
      </button>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="ml-1 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Download document"
      >
        <Download className="w-3 h-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
      </button>

      {/* Hover Preview */}
      {isHovering && preview && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-80 max-w-sm">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">{getFileIcon(preview.mimeType)}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {preview.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {preview.description}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{preview.mimeType?.split('/')[1]?.toUpperCase() || 'Document'}</span>
                  <span>{new Date(preview.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleClick}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                  >
                    View Document
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}