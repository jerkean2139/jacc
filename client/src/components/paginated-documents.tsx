import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { DocumentLink } from './document-link';
import { ChevronDown, FileText } from 'lucide-react';

interface PaginatedDocument {
  id: string;
  score: number;
  documentId: string;
  content: string;
  metadata: {
    documentName: string;
    relevanceScore: number;
    mimeType: string;
  };
}

interface PaginatedDocumentsProps {
  query: string;
  initialDocuments: PaginatedDocument[];
  totalCount: number;
  className?: string;
}

export function PaginatedDocuments({ 
  query, 
  initialDocuments, 
  totalCount, 
  className = '' 
}: PaginatedDocumentsProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [allDocuments, setAllDocuments] = useState<PaginatedDocument[]>(initialDocuments);

  // Query for additional documents when "see more" is clicked
  const { data: moreDocuments, isLoading, refetch } = useQuery({
    queryKey: [`/api/documents/search`, query, currentPage + 1],
    enabled: false, // Only fetch when manually triggered
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const handleSeeMore = async () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    
    try {
      const response = await fetch(`/api/documents/search?query=${encodeURIComponent(query)}&page=${nextPage}&limit=5`);
      const data = await response.json();
      
      if (data.documents) {
        setAllDocuments(prev => [...prev, ...data.documents]);
      }
    } catch (error) {
      console.error('Failed to load more documents:', error);
    }
  };

  const hasMore = allDocuments.length < totalCount;
  const remainingCount = totalCount - allDocuments.length;

  if (allDocuments.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <FileText className="w-4 h-4" />
        <span>Found {totalCount} relevant document{totalCount !== 1 ? 's' : ''}</span>
      </div>
      
      {/* Display documents */}
      <div className="space-y-3">
        {allDocuments.map((doc, index) => (
          <div 
            key={`${doc.documentId}-${index}`}
            className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <DocumentLink
                  documentId={doc.documentId}
                  documentName={doc.metadata.documentName}
                  className="mb-2"
                />
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                  {doc.content.substring(0, 150)}...
                </p>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                <div>Relevance</div>
                <div className="font-medium">{(doc.score * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* See More Button */}
      {hasMore && (
        <div className="text-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeeMore}
            disabled={isLoading}
            className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <ChevronDown className="w-4 h-4 mr-2" />
            {isLoading ? 'Loading...' : `See More (${remainingCount} remaining)`}
          </Button>
        </div>
      )}
    </div>
  );
}