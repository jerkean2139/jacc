import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Cloud, 
  FolderPlus, 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Lock,
  Users,
  ShieldCheck,
  Database,
  Zap
} from "lucide-react";
import { SiGoogledrive, SiDropbox, SiMicrosoftonedrive } from "react-icons/si";

interface CloudFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modifiedTime?: string;
  mimeType?: string;
  webViewLink?: string;
  selected?: boolean;
  children?: CloudFile[];
}

interface WizardStepProps {
  onNext: () => void;
  onPrev?: () => void;
  isLast?: boolean;
}

export default function CloudDriveWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [sourceType, setSourceType] = useState<'files' | 'folder' | 'cloud'>('files');
  const [cloudProvider, setCloudProvider] = useState<'google' | 'dropbox' | 'onedrive' | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<CloudFile[]>([]);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [permissions, setPermissions] = useState({
    viewAll: false,
    adminOnly: false,
    managerAccess: false,
    agentAccess: true,
    trainingData: false,
    autoVectorize: true
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available folders
  const { data: folders = [] } = useQuery({
    queryKey: ['/api/folders'],
  });

  // Cloud drive connection mutation
  const connectCloudDrive = useMutation({
    mutationFn: async (provider: string) => {
      return apiRequest(`/api/cloud-drives/${provider}/connect`, {
        method: 'POST'
      });
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.open(data.authUrl, '_blank', 'width=600,height=600');
      }
    }
  });

  // Cloud files fetch
  const { data: cloudFiles = [], isLoading: loadingCloudFiles } = useQuery({
    queryKey: ['/api/cloud-drives', cloudProvider, 'files'],
    enabled: !!cloudProvider
  });

  // Create folder mutation
  const createFolder = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest('/api/folders', {
        method: 'POST',
        body: JSON.stringify({ name, description: `Created via wizard for ${sourceType} upload` })
      });
    }
  });

  // Document import mutation
  const importDocuments = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/documents/import-wizard', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  });

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCloudConnect = (provider: 'google' | 'dropbox' | 'onedrive') => {
    setCloudProvider(provider);
    connectCloudDrive.mutate(provider);
  };

  const handleFileSelection = (file: CloudFile, selected: boolean) => {
    if (selected) {
      setSelectedFiles([...selectedFiles, { ...file, selected: true }]);
    } else {
      setSelectedFiles(selectedFiles.filter(f => f.id !== file.id));
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      const folder = await createFolder.mutateAsync(newFolderName);
      setTargetFolderId(folder.id);
      setNewFolderName('');
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      toast({
        title: "Folder Created",
        description: `Created folder "${folder.name}" successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive"
      });
    }
  };

  const handleFinish = async () => {
    setIsProcessing(true);
    
    try {
      const importData = {
        sourceType,
        cloudProvider,
        selectedFiles,
        targetFolderId,
        permissions,
        createNewFolder: !!newFolderName
      };

      await importDocuments.mutateAsync(importData);
      
      toast({
        title: "Import Complete",
        description: `Successfully imported ${selectedFiles.length} items`
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      
      // Reset wizard
      setCurrentStep(1);
      setSelectedFiles([]);
      setTargetFolderId(null);
      setSourceType('files');
      setCloudProvider(null);
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import selected items",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Document Import Wizard
        </CardTitle>
        <CardDescription>
          Import documents and folders with granular permission controls
        </CardDescription>
        
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mt-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === currentStep ? 'bg-blue-600 text-white' :
                step < currentStep ? 'bg-green-600 text-white' :
                'bg-gray-200 text-gray-600'
              }`}>
                {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
              </div>
              {step < 3 && <div className="w-12 h-1 bg-gray-200 mx-2" />}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 1: Source Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Step 1: Choose Import Source</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Local Files */}
                <Card className={`cursor-pointer transition-colors ${sourceType === 'files' ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => setSourceType('files')}>
                  <CardContent className="p-6 text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                    <h4 className="font-semibold mb-2">Upload Files</h4>
                    <p className="text-sm text-gray-600">
                      Upload files from your computer via drag-and-drop or file picker
                    </p>
                  </CardContent>
                </Card>

                {/* Local Folder */}
                <Card className={`cursor-pointer transition-colors ${sourceType === 'folder' ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => setSourceType('folder')}>
                  <CardContent className="p-6 text-center">
                    <FolderPlus className="h-12 w-12 mx-auto mb-4 text-green-600" />
                    <h4 className="font-semibold mb-2">Upload Folder</h4>
                    <p className="text-sm text-gray-600">
                      Upload entire folders with structure preservation
                    </p>
                  </CardContent>
                </Card>

                {/* Cloud Drives */}
                <Card className={`cursor-pointer transition-colors ${sourceType === 'cloud' ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => setSourceType('cloud')}>
                  <CardContent className="p-6 text-center">
                    <Cloud className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                    <h4 className="font-semibold mb-2">Cloud Drives</h4>
                    <p className="text-sm text-gray-600">
                      Import from Google Drive, Dropbox, or OneDrive
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Cloud Provider Selection */}
              {sourceType === 'cloud' && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-semibold">Select Cloud Provider</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant={cloudProvider === 'google' ? 'default' : 'outline'}
                      className="h-16 flex flex-col gap-2"
                      onClick={() => handleCloudConnect('google')}
                    >
                      <SiGoogledrive className="h-6 w-6" />
                      Google Drive
                    </Button>
                    <Button
                      variant={cloudProvider === 'dropbox' ? 'default' : 'outline'}
                      className="h-16 flex flex-col gap-2"
                      onClick={() => handleCloudConnect('dropbox')}
                    >
                      <SiDropbox className="h-6 w-6" />
                      Dropbox
                    </Button>
                    <Button
                      variant={cloudProvider === 'onedrive' ? 'default' : 'outline'}
                      className="h-16 flex flex-col gap-2"
                      onClick={() => handleCloudConnect('onedrive')}
                    >
                      <SiMicrosoftonedrive className="h-6 w-6" />
                      OneDrive
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: File/Folder Selection */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Step 2: Select Items to Import</h3>
              
              {sourceType === 'cloud' && cloudProvider ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Available Files</h4>
                    <Badge variant="secondary">{selectedFiles.length} selected</Badge>
                  </div>
                  
                  <ScrollArea className="h-64 border rounded-md p-4">
                    {loadingCloudFiles ? (
                      <div className="text-center py-8 text-gray-500">
                        Loading files from {cloudProvider}...
                      </div>
                    ) : cloudFiles.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No files found or connection not established
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cloudFiles.map((file: CloudFile) => (
                          <div key={file.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                            <Checkbox
                              checked={selectedFiles.some(f => f.id === file.id)}
                              onCheckedChange={(checked) => handleFileSelection(file, !!checked)}
                            />
                            {file.type === 'folder' ? (
                              <FolderPlus className="h-4 w-4 text-blue-600" />
                            ) : (
                              <FileText className="h-4 w-4 text-gray-600" />
                            )}
                            <div className="flex-1">
                              <div className="font-medium">{file.name}</div>
                              {file.size && (
                                <div className="text-sm text-gray-500">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <div className="text-lg font-medium mb-2">
                    {sourceType === 'folder' ? 'Select Folder to Upload' : 'Drop Files Here'}
                  </div>
                  <div className="text-gray-600 mb-4">
                    {sourceType === 'folder' 
                      ? 'Choose a folder to upload with full structure'
                      : 'Drag and drop files or click to browse'
                    }
                  </div>
                  <Button variant="outline">
                    {sourceType === 'folder' ? 'Select Folder' : 'Browse Files'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Destination and Permissions */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Step 3: Set Destination and Permissions</h3>
              
              {/* Destination Folder */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folder-select">Destination Folder</Label>
                  <Select value={targetFolderId || ''} onValueChange={setTargetFolderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select folder or create new" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Root (No folder)</SelectItem>
                      {folders.map((folder: any) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Create New Folder */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Create new folder..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                  <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                    Create
                  </Button>
                </div>

                <Separator />

                {/* Permissions */}
                <div>
                  <Label className="text-base font-semibold">Document Permissions</Label>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="viewAll"
                        checked={permissions.viewAll}
                        onCheckedChange={(checked) => 
                          setPermissions(prev => ({ ...prev, viewAll: !!checked }))
                        }
                      />
                      <Label htmlFor="viewAll" className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Public Access
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="adminOnly"
                        checked={permissions.adminOnly}
                        onCheckedChange={(checked) => 
                          setPermissions(prev => ({ ...prev, adminOnly: !!checked }))
                        }
                      />
                      <Label htmlFor="adminOnly" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Admin Only
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="managerAccess"
                        checked={permissions.managerAccess}
                        onCheckedChange={(checked) => 
                          setPermissions(prev => ({ ...prev, managerAccess: !!checked }))
                        }
                      />
                      <Label htmlFor="managerAccess" className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Manager Access
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="agentAccess"
                        checked={permissions.agentAccess}
                        onCheckedChange={(checked) => 
                          setPermissions(prev => ({ ...prev, agentAccess: !!checked }))
                        }
                      />
                      <Label htmlFor="agentAccess" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Agent Access
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="trainingData"
                        checked={permissions.trainingData}
                        onCheckedChange={(checked) => 
                          setPermissions(prev => ({ ...prev, trainingData: !!checked }))
                        }
                      />
                      <Label htmlFor="trainingData" className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Use for Training
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="autoVectorize"
                        checked={permissions.autoVectorize}
                        onCheckedChange={(checked) => 
                          setPermissions(prev => ({ ...prev, autoVectorize: !!checked }))
                        }
                      />
                      <Label htmlFor="autoVectorize" className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Auto-Vectorize
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing Progress */}
        {isProcessing && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Processing import...</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 1 || isProcessing}
        >
          Previous
        </Button>
        
        <div className="flex gap-2">
          {currentStep < 3 ? (
            <Button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !sourceType) ||
                (currentStep === 2 && sourceType === 'cloud' && selectedFiles.length === 0) ||
                isProcessing
              }
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={selectedFiles.length === 0 || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Import Documents'}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}