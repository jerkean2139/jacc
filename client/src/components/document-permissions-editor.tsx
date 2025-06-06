import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Eye,
  Lock,
  Users,
  ShieldCheck,
  Database,
  Zap,
  FileText,
  Settings,
  Save,
  X
} from "lucide-react";

interface DocumentPermissions {
  viewAll: boolean;
  adminOnly: boolean;
  managerAccess: boolean;
  agentAccess: boolean;
  trainingData: boolean;
  autoVectorize: boolean;
}

interface Document {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  folderId?: string;
  isPublic?: boolean;
  adminOnly?: boolean;
  managerOnly?: boolean;
  agentOnly?: boolean;
  trainingData?: boolean;
  autoVectorize?: boolean;
  createdAt: string;
}

interface DocumentPermissionsEditorProps {
  documents: Document[];
  folderPermissions?: DocumentPermissions;
  onClose: () => void;
}

export default function DocumentPermissionsEditor({ 
  documents, 
  folderPermissions,
  onClose 
}: DocumentPermissionsEditorProps) {
  const [documentPermissions, setDocumentPermissions] = useState<Record<string, DocumentPermissions>>(
    documents.reduce((acc, doc) => ({
      ...acc,
      [doc.id]: {
        viewAll: doc.isPublic || false,
        adminOnly: doc.adminOnly || false,
        managerAccess: doc.managerOnly || false,
        agentAccess: doc.agentOnly || true,
        trainingData: doc.trainingData || false,
        autoVectorize: doc.autoVectorize || true
      }
    }), {})
  );

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update document permissions mutation
  const updatePermissions = useMutation({
    mutationFn: async ({ docId, permissions }: { docId: string; permissions: DocumentPermissions }) => {
      return apiRequest(`/api/documents/${docId}/permissions`, {
        method: 'PATCH',
        body: JSON.stringify({
          isPublic: permissions.viewAll,
          adminOnly: permissions.adminOnly,
          managerOnly: permissions.managerAccess,
          agentOnly: permissions.agentAccess,
          trainingData: permissions.trainingData,
          autoVectorize: permissions.autoVectorize
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    }
  });

  const handlePermissionChange = (docId: string, permission: keyof DocumentPermissions, value: boolean) => {
    setDocumentPermissions(prev => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        [permission]: value
      }
    }));
  };

  const handleApplyFolderPermissions = (docId: string) => {
    if (!folderPermissions) return;
    
    setDocumentPermissions(prev => ({
      ...prev,
      [docId]: { ...folderPermissions }
    }));
  };

  const handleSaveAll = async () => {
    const promises = documents.map(doc => 
      updatePermissions.mutateAsync({
        docId: doc.id,
        permissions: documentPermissions[doc.id]
      })
    );

    try {
      await Promise.all(promises);
      toast({
        title: "Permissions Updated",
        description: `Updated permissions for ${documents.length} documents`
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update some document permissions",
        variant: "destructive"
      });
    }
  };

  const getPermissionConflicts = (docId: string) => {
    const perms = documentPermissions[docId];
    if (!folderPermissions) return [];

    const conflicts = [];
    if (perms.viewAll !== folderPermissions.viewAll) conflicts.push('Public Access');
    if (perms.adminOnly !== folderPermissions.adminOnly) conflicts.push('Admin Only');
    if (perms.managerAccess !== folderPermissions.managerAccess) conflicts.push('Manager Access');
    if (perms.agentAccess !== folderPermissions.agentAccess) conflicts.push('Agent Access');
    if (perms.trainingData !== folderPermissions.trainingData) conflicts.push('Training Data');
    if (perms.autoVectorize !== folderPermissions.autoVectorize) conflicts.push('Auto-Vectorize');

    return conflicts;
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Document-Level Permissions
            </CardTitle>
            <CardDescription>
              Configure individual document permissions within the folder
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {folderPermissions && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-2">Folder Default Permissions</h4>
            <div className="flex flex-wrap gap-2">
              {folderPermissions.viewAll && <Badge variant="secondary"><Eye className="h-3 w-3 mr-1" />Public</Badge>}
              {folderPermissions.adminOnly && <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" />Admin Only</Badge>}
              {folderPermissions.managerAccess && <Badge variant="secondary"><ShieldCheck className="h-3 w-3 mr-1" />Manager</Badge>}
              {folderPermissions.agentAccess && <Badge variant="secondary"><Users className="h-3 w-3 mr-1" />Agent</Badge>}
              {folderPermissions.trainingData && <Badge variant="secondary"><Database className="h-3 w-3 mr-1" />Training</Badge>}
              {folderPermissions.autoVectorize && <Badge variant="secondary"><Zap className="h-3 w-3 mr-1" />Auto-Vectorize</Badge>}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {documents.map((doc) => {
              const conflicts = getPermissionConflicts(doc.id);
              const perms = documentPermissions[doc.id];

              return (
                <Card key={doc.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium">{doc.originalName}</h4>
                        <div className="text-sm text-gray-500">
                          {(doc.size / 1024 / 1024).toFixed(2)} MB • {doc.mimeType}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {conflicts.length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conflicts.length} Override{conflicts.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {folderPermissions && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApplyFolderPermissions(doc.id)}
                        >
                          Use Folder Defaults
                        </Button>
                      )}
                    </div>
                  </div>

                  <Separator className="mb-4" />

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${doc.id}-viewAll`}
                        checked={perms.viewAll}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(doc.id, 'viewAll', !!checked)
                        }
                      />
                      <Label htmlFor={`${doc.id}-viewAll`} className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Public Access
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${doc.id}-adminOnly`}
                        checked={perms.adminOnly}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(doc.id, 'adminOnly', !!checked)
                        }
                      />
                      <Label htmlFor={`${doc.id}-adminOnly`} className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Admin Only
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${doc.id}-managerAccess`}
                        checked={perms.managerAccess}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(doc.id, 'managerAccess', !!checked)
                        }
                      />
                      <Label htmlFor={`${doc.id}-managerAccess`} className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Manager Access
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${doc.id}-agentAccess`}
                        checked={perms.agentAccess}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(doc.id, 'agentAccess', !!checked)
                        }
                      />
                      <Label htmlFor={`${doc.id}-agentAccess`} className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Agent Access
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${doc.id}-trainingData`}
                        checked={perms.trainingData}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(doc.id, 'trainingData', !!checked)
                        }
                      />
                      <Label htmlFor={`${doc.id}-trainingData`} className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Use for Training
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${doc.id}-autoVectorize`}
                        checked={perms.autoVectorize}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(doc.id, 'autoVectorize', !!checked)
                        }
                      />
                      <Label htmlFor={`${doc.id}-autoVectorize`} className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Auto-Vectorize
                      </Label>
                    </div>
                  </div>

                  {conflicts.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                      <div className="text-sm font-medium text-yellow-800 mb-1">
                        Permission Overrides:
                      </div>
                      <div className="text-sm text-yellow-700">
                        {conflicts.join(', ')} differ from folder defaults
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex justify-between pt-4">
          <div className="text-sm text-gray-500">
            Managing permissions for {documents.length} document{documents.length > 1 ? 's' : ''}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSaveAll} disabled={updatePermissions.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updatePermissions.isPending ? 'Saving...' : 'Save All Changes'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}