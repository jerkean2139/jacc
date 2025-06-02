import React from 'react';
import { DocumentLink } from './document-link';

interface MessageContentProps {
  content: string;
  className?: string;
}

export function MessageContent({ content, className = '' }: MessageContentProps) {
  // Parse markdown-style links and convert document links to interactive components
  const parseContent = (text: string) => {
    const parts = [];
    let lastIndex = 0;
    
    // Regex to match markdown links: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = linkRegex.exec(text)) !== null) {
      const [fullMatch, linkText, linkUrl] = match;
      const startIndex = match.index;
      
      // Add text before the link
      if (startIndex > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, startIndex)}
          </span>
        );
      }
      
      // Check if this is a document link (handles both /documents/{id} and /api/documents/{id}/view formats)
      const isDocumentLink = linkUrl.includes('/documents/') || (linkUrl.includes('/api/documents/') && linkUrl.includes('/view'));
      
      if (isDocumentLink) {
        // Extract document ID from URL - handle both formats
        let documentIdMatch = linkUrl.match(/\/documents\/([^/]+)/);
        if (!documentIdMatch) {
          documentIdMatch = linkUrl.match(/\/api\/documents\/([^/]+)\/view/);
        }
        const documentId = documentIdMatch ? documentIdMatch[1] : '';
        
        if (documentId) {
          parts.push(
            <DocumentLink
              key={`doc-${startIndex}`}
              documentId={documentId}
              documentName={linkText}
              className="mx-1"
            />
          );
        } else {
          // Fallback to regular link
          parts.push(
            <a
              key={`link-${startIndex}`}
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
            >
              {linkText}
            </a>
          );
        }
      } else {
        // Regular external link
        parts.push(
          <a
            key={`link-${startIndex}`}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
          >
            {linkText}
          </a>
        );
      }
      
      lastIndex = startIndex + fullMatch.length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }
    
    return parts.length > 0 ? parts : [text];
  };

  // Split content by newlines and process each line
  const lines = content.split('\n');
  
  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {lines.map((line, lineIndex) => (
        <div key={lineIndex} className={lineIndex > 0 ? 'mt-1' : ''}>
          {parseContent(line)}
        </div>
      ))}
    </div>
  );
}