import React from 'react';
import { DocumentLink } from './document-link';

interface MessageContentProps {
  content: string;
  className?: string;
}

export function MessageContent({ content, className = '' }: MessageContentProps) {
  // Check if content contains HTML tags
  const hasHtmlTags = /<[^>]*>/g.test(content);
  
  if (hasHtmlTags) {
    // Parse HTML content safely while preserving document links
    const parseHtmlContent = (htmlContent: string) => {
      // First, handle document links by converting markdown-style links to DocumentLink components
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let processedContent = htmlContent;
      const documentLinks: Array<{ id: string; name: string; placeholder: string }> = [];
      
      let match;
      while ((match = linkRegex.exec(htmlContent)) !== null) {
        const [fullMatch, linkText, linkUrl] = match;
        const isDocumentLink = linkUrl.includes('/documents/') || (linkUrl.includes('/api/documents/') && linkUrl.includes('/view'));
        
        if (isDocumentLink) {
          let documentIdMatch = linkUrl.match(/\/documents\/([^/]+)/);
          if (!documentIdMatch) {
            documentIdMatch = linkUrl.match(/\/api\/documents\/([^/]+)\/view/);
          }
          const documentId = documentIdMatch ? documentIdMatch[1] : '';
          
          if (documentId) {
            const placeholder = `__DOCUMENT_LINK_${documentLinks.length}__`;
            documentLinks.push({ id: documentId, name: linkText, placeholder });
            processedContent = processedContent.replace(fullMatch, placeholder);
          }
        }
      }
      
      // Create HTML with placeholders replaced by DocumentLink components
      const htmlParts = processedContent.split(/(__DOCUMENT_LINK_\d+__)/);
      
      return htmlParts.map((part, index) => {
        const linkMatch = part.match(/__DOCUMENT_LINK_(\d+)__/);
        if (linkMatch) {
          const linkIndex = parseInt(linkMatch[1]);
          const docLink = documentLinks[linkIndex];
          return (
            <DocumentLink
              key={`doc-${index}`}
              documentId={docLink.id}
              documentName={docLink.name}
              className="mx-1"
            />
          );
        }
        
        // Render HTML content safely
        return (
          <div 
            key={index}
            dangerouslySetInnerHTML={{ __html: part }}
            className="[&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-2 [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:mb-2 [&>h3]:text-base [&>h3]:font-medium [&>h3]:mb-1 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:mb-2 [&>ol]:list-decimal [&>ol]:ml-4 [&>ol]:mb-2 [&>li]:mb-1 [&>p]:mb-2 [&>strong]:font-semibold [&>em]:italic"
          />
        );
      });
    };
    
    return (
      <div className={className}>
        {parseHtmlContent(content)}
      </div>
    );
  }
  
  // Fallback to original markdown parsing for non-HTML content
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