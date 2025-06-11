import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface SEOMetadataProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

const defaultMetadata = {
  title: 'JACC - AI-Powered Merchant Services Assistant',
  description: 'Intelligent merchant services platform delivering AI-driven document processing, training management, and business intelligence for payment gateway solutions.',
  keywords: ['merchant services', 'payment processing', 'AI assistant', 'business intelligence', 'document analysis'],
  image: '/og-image.png',
  type: 'website' as const,
  author: 'Tracer Co Card'
};

export function SEOMetadata(props: SEOMetadataProps) {
  const [location] = useLocation();
  
  const metadata = { ...defaultMetadata, ...props };
  const fullUrl = `${window.location.origin}${props.url || location}`;

  useEffect(() => {
    // Update document title
    document.title = metadata.title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, name);
        document.head.appendChild(tag);
      }
      
      tag.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', metadata.description);
    updateMetaTag('keywords', metadata.keywords.join(', '));
    updateMetaTag('author', metadata.author || defaultMetadata.author);

    // Open Graph tags
    updateMetaTag('og:title', metadata.title, true);
    updateMetaTag('og:description', metadata.description, true);
    updateMetaTag('og:image', metadata.image, true);
    updateMetaTag('og:url', fullUrl, true);
    updateMetaTag('og:type', metadata.type, true);
    updateMetaTag('og:site_name', 'JACC', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', metadata.title);
    updateMetaTag('twitter:description', metadata.description);
    updateMetaTag('twitter:image', metadata.image);

    // Additional SEO tags
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    updateMetaTag('theme-color', '#0066CC');

    // Structured data for merchant services
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "JACC",
      "description": metadata.description,
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "provider": {
        "@type": "Organization",
        "name": "Tracer Co Card",
        "url": "https://tracercocard.com"
      },
      "url": fullUrl,
      "screenshot": metadata.image
    };

    // Update or create structured data script
    let structuredDataScript = document.querySelector('script[type="application/ld+json"]');
    if (!structuredDataScript) {
      structuredDataScript = document.createElement('script');
      structuredDataScript.type = 'application/ld+json';
      document.head.appendChild(structuredDataScript);
    }
    structuredDataScript.textContent = JSON.stringify(structuredData);

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', fullUrl);

    // Cleanup function
    return () => {
      // Optionally reset to defaults when component unmounts
    };
  }, [metadata, fullUrl]);

  return null; // This component doesn't render anything
}

// Pre-defined metadata for different pages
export const pageMetadata = {
  home: {
    title: 'JACC - AI-Powered Merchant Services Assistant | Tracer Co Card',
    description: 'Transform your merchant services with JACC\'s AI-powered platform. Get instant processing rate analysis, document intelligence, and business insights for payment solutions.',
    keywords: ['merchant services', 'payment processing', 'AI assistant', 'rate analysis', 'business intelligence']
  },
  
  chat: {
    title: 'AI Chat Assistant - JACC | Real-time Merchant Services Support',
    description: 'Get instant answers about processing rates, equipment options, and industry insights with JACC\'s intelligent chat assistant.',
    keywords: ['AI chat', 'merchant services support', 'processing rates', 'payment equipment', 'instant answers']
  },
  
  documents: {
    title: 'Document Intelligence - JACC | Analyze Merchant Statements',
    description: 'Upload and analyze merchant statements, contracts, and proposals with advanced AI document processing and insights.',
    keywords: ['document analysis', 'merchant statements', 'contract review', 'AI processing', 'business insights']
  },
  
  admin: {
    title: 'Admin Dashboard - JACC | Manage Your Merchant Services Platform',
    description: 'Configure knowledge base, manage team permissions, and monitor platform analytics with JACC\'s comprehensive admin tools.',
    keywords: ['admin dashboard', 'knowledge base management', 'team management', 'analytics', 'platform configuration']
  },
  
  security: {
    title: 'Security Dashboard - JACC | Enterprise-Grade Security Monitoring',
    description: 'Monitor security metrics, compliance status, and audit logs with JACC\'s comprehensive security management system.',
    keywords: ['security monitoring', 'compliance management', 'audit logs', 'enterprise security', 'GDPR compliance']
  }
};