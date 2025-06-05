import { useState, useEffect, useRef } from 'react';
import { Search, FileText, Clock, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DocumentLink } from './document-link';

interface SearchResult {
  id: string;
  score: number;
  documentId: string;
  content: string;
  highlightedContent: string;
  metadata: {
    documentName: string;
    relevanceScore: number;
    semanticMatch: boolean;
    keywordMatches: string[];
    contextualInfo: string;
    chunkIndex: number;
    mimeType: string;
  };
}

interface EnhancedSearchProps {
  onResultSelect?: (result: SearchResult) => void;
  placeholder?: string;
  showSuggestions?: boolean;
}

export function EnhancedSearch({ 
  onResultSelect, 
  placeholder = "Search documents...",
  showSuggestions = true 
}: EnhancedSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const searchRef = useRef<HTMLDivElement>(null);

  // Auto-search with debouncing
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (query.length > 2) {
      searchTimeout.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      setResults([]);
      setShowResults(false);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query]);

  // Load suggestions when user types
  useEffect(() => {
    if (showSuggestions && query.length > 1) {
      loadSuggestions(query);
    }
  }, [query, showSuggestions]);

  // Click outside to close results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true);
    try {
      const response = await fetch('/api/search-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, userId: 'simple-user-001' })
      });

      if (response.ok) {
        const searchResults = await response.json();
        setResults(searchResults);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const loadSuggestions = async (searchQuery: string) => {
    try {
      const response = await fetch(`/api/documents/search/suggestions?query=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const suggestionList = await response.json();
        setSuggestions(suggestionList);
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return '📊';
    if (mimeType?.includes('document') || mimeType?.includes('word')) return '📝';
    return '📁';
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.9) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 0.7) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 2 && setShowResults(true)}
          className="pl-10 pr-4 py-2 text-base"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && query.length > 1 && !showResults && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg">
          <CardContent className="p-2">
            <div className="text-xs text-gray-500 mb-2">Suggestions:</div>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
              >
                <Search className="inline w-3 h-3 mr-2 text-gray-400" />
                {suggestion}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {showResults && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            <div className="p-3 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Found {results.length} document{results.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setShowResults(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            {results.map((result) => (
              <div
                key={result.id}
                className="p-4 border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  onResultSelect?.(result);
                  setShowResults(false);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{getFileIcon(result.metadata.mimeType)}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {result.metadata.documentName}
                      </h4>
                      <Badge className={`text-xs ${getRelevanceColor(result.metadata.relevanceScore)}`}>
                        {Math.round(result.metadata.relevanceScore * 100)}% match
                      </Badge>
                      {result.metadata.semanticMatch && (
                        <Badge variant="outline" className="text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Smart Match
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {result.metadata.contextualInfo}
                    </p>
                    
                    {result.metadata.keywordMatches.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {result.metadata.keywordMatches.slice(0, 3).map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {result.metadata.mimeType.split('/')[1]?.toUpperCase() || 'Document'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Chunk {result.metadata.chunkIndex + 1}
                      </span>
                    </div>
                  </div>
                  
                  <DocumentLink
                    documentId={result.documentId}
                    documentName={result.metadata.documentName}
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {showResults && results.length === 0 && !isSearching && query.length > 2 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-gray-500 mb-2">No documents found for "{query}"</div>
            <div className="text-sm text-gray-400">
              Try different keywords or check spelling
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}