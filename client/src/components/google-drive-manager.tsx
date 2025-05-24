import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FolderOpen, 
  FileText, 
  Download, 
  Upload, 
  RefreshCw, 
  Search, 
  Filter,
  Tag,
  Star,
  Eye,
  MoreVertical,
  Sync,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  modifiedTime: string;
  webViewLink: string;
  thumbnailLink?: string;
  parents: string[];
  isProcessed?: boolean;
  tags?: string[];
  isFavorite?: boolean;
}

interface ProcessingStatus {
  total: number;
  processed: number;
  currentFile: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  errors: string[];
}

export default function GoogleDriveManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMimeType, setSelectedMimeType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    total: 0,
    processed: 0,
    currentFile: '',
    status: 'idle',
    errors: []
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Google Drive files
  const { data: driveFiles = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/google-drive/files'],
  });

  // Fetch available document tags
  const { data: availableTags = [] } = useQuery({
    queryKey: ['/api/admin/tags'],
  });

  // Process documents mutation
  const processDocumentsMutation = useMutation({
    mutationFn: (fileIds: string[]) => apiRequest('POST', '/api/google-drive/process', { fileIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/google-drive/files'] });
      toast({ title: 'Success', description: 'Documents processed successfully' });
    },
  });

  // Sync with Google Drive
  const syncDriveMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/google-drive/sync'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/google-drive/files'] });
      toast({ title: 'Success', description: 'Google Drive synced successfully' });
    },
  });

  // Add tag to document
  const addTagMutation = useMutation({
    mutationFn: ({ fileId, tagId }: { fileId: string; tagId: string }) => 
      apiRequest('POST', `/api/google-drive/files/${fileId}/tags`, { tagId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/google-drive/files'] });
    },
  });

  // Toggle favorite
  const toggleFavoriteMutation = useMutation({
    mutationFn: (fileId: string) => 
      apiRequest('POST', `/api/google-drive/files/${fileId}/favorite`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/google-drive/files'] });
    },
  });

  // Filter files based on search and type
  const filteredFiles = driveFiles.filter((file: DriveFile) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedMimeType === 'all' || 
      (selectedMimeType === 'documents' && file.mimeType.includes('document')) ||
      (selectedMimeType === 'spreadsheets' && file.mimeType.includes('spreadsheet')) ||
      (selectedMimeType === 'presentations' && file.mimeType.includes('presentation')) ||
      (selectedMimeType === 'pdfs' && file.mimeType.includes('pdf'));
    
    return matchesSearch && matchesType;
  });

  // Get file type icon
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('document') || mimeType.includes('text')) return '📄';
    if (mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('presentation')) return '📈';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('image')) return '🖼️';
    return '📁';
  };

  // Format file size
  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Bulk operations
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  
  const selectFile = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const selectAllFiles = () => {
    setSelectedFiles(
      selectedFiles.length === filteredFiles.length 
        ? [] 
        : filteredFiles.map((file: DriveFile) => file.id)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Google Drive Documents</h2>
          <p className="text-muted-foreground">
            Manage and process merchant services documentation from Google Drive
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            onClick={() => syncDriveMutation.mutate()}
            disabled={syncDriveMutation.isPending}
          >
            <Sync className="w-4 h-4 mr-2" />
            Sync Drive
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={selectedMimeType} onValueChange={setSelectedMimeType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Files</SelectItem>
            <SelectItem value="documents">Documents</SelectItem>
            <SelectItem value="spreadsheets">Spreadsheets</SelectItem>
            <SelectItem value="presentations">Presentations</SelectItem>
            <SelectItem value="pdfs">PDFs</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedFiles.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => processDocumentsMutation.mutate(selectedFiles)}
                  disabled={processDocumentsMutation.isPending}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Process Selected
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setSelectedFiles([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing status */}
      {processingStatus.status === 'processing' && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950">
          <CardContent className="pt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Processing Documents</span>
                <span className="text-sm text-muted-foreground">
                  {processingStatus.processed} / {processingStatus.total}
                </span>
              </div>
              <Progress 
                value={(processingStatus.processed / processingStatus.total) * 100} 
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Current: {processingStatus.currentFile}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File display */}
      <div className={
        viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          : "space-y-2"
      }>
        {/* Select all checkbox for list view */}
        {viewMode === 'list' && (
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
            <input
              type="checkbox"
              checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
              onChange={selectAllFiles}
              className="rounded"
            />
            <span className="text-sm font-medium">
              Select All ({filteredFiles.length} files)
            </span>
          </div>
        )}

        {filteredFiles.map((file: DriveFile) => (
          <FileCard
            key={file.id}
            file={file}
            viewMode={viewMode}
            isSelected={selectedFiles.includes(file.id)}
            onSelect={() => selectFile(file.id)}
            onAddTag={(tagId) => addTagMutation.mutate({ fileId: file.id, tagId })}
            onToggleFavorite={() => toggleFavoriteMutation.mutate(file.id)}
            availableTags={availableTags}
            getFileIcon={getFileIcon}
            formatFileSize={formatFileSize}
          />
        ))}
      </div>

      {filteredFiles.length === 0 && !isLoading && (
        <Card className="text-center py-12">
          <CardContent>
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search terms or filters.' : 'Sync with Google Drive to load your documents.'}
            </p>
            {!searchQuery && (
              <Button onClick={() => syncDriveMutation.mutate()}>
                <Sync className="w-4 h-4 mr-2" />
                Sync Google Drive
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Individual file card component
interface FileCardProps {
  file: DriveFile;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: () => void;
  onAddTag: (tagId: string) => void;
  onToggleFavorite: () => void;
  availableTags: any[];
  getFileIcon: (mimeType: string) => string;
  formatFileSize: (bytes: string) => string;
}

function FileCard({ 
  file, 
  viewMode, 
  isSelected, 
  onSelect, 
  onAddTag, 
  onToggleFavorite, 
  availableTags,
  getFileIcon,
  formatFileSize 
}: FileCardProps) {
  const [showTagDialog, setShowTagDialog] = useState(false);

  if (viewMode === 'list') {
    return (
      <Card className={`transition-all ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="rounded"
            />
            
            <div className="text-2xl">{getFileIcon(file.mimeType)}</div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{file.name}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{formatFileSize(file.size)}</span>
                <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>
                {file.isProcessed && (
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Processed
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {file.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
              
              <div className="flex gap-1">
                {file.tags?.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <Button variant="ghost" size="sm" asChild>
                <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
                  <Eye className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="rounded mt-1"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFavorite}
          >
            <Star className={`w-4 h-4 ${file.isFavorite ? 'text-yellow-500 fill-current' : ''}`} />
          </Button>
        </div>
        
        <div className="text-4xl text-center mb-2">
          {getFileIcon(file.mimeType)}
        </div>
        
        <CardTitle className="text-sm truncate" title={file.name}>
          {file.name}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Size:</span>
            <span>{formatFileSize(file.size)}</span>
          </div>
          <div className="flex justify-between">
            <span>Modified:</span>
            <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>
          </div>
        </div>

        {file.isProcessed && (
          <Badge variant="outline" className="w-full mt-3 justify-center text-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Processed
          </Badge>
        )}

        <div className="flex gap-1 mt-3">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
              <Eye className="w-3 h-3 mr-1" />
              View
            </a>
          </Button>
          
          <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Tag className="w-3 h-3" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Tag</DialogTitle>
                <DialogDescription>
                  Add a tag to organize this document
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {availableTags.map((tag: any) => (
                  <Button
                    key={tag.id}
                    variant="outline"
                    onClick={() => {
                      onAddTag(tag.id);
                      setShowTagDialog(false);
                    }}
                    className="justify-start"
                  >
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {file.tags && file.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {file.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}