import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  FileText,
  ThumbsUp,
  ThumbsDown,
  Folder,
  User,
  Calendar,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Bell,
  Sparkles,
  TrendingUp
} from "lucide-react";

interface PendingApproval {
  id: string;
  vendorName: string;
  documentTitle: string;
  documentUrl: string;
  documentType: string;
  contentPreview: string;
  aiRecommendation: string;
  aiReasoning: string;
  suggestedFolder: string;
  newsWorthiness: number;
  detectedAt: string;
}

interface Folder {
  id: string;
  name: string;
  path: string;
}

export default function DocumentApprovalWorkflow() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [permissionLevel, setPermissionLevel] = useState<string>("public");
  const [notes, setNotes] = useState("");
  const [isSwipeMode, setIsSwipeMode] = useState(true);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending approvals
  const { data: pendingApprovals = [], isLoading } = useQuery<PendingApproval[]>({
    queryKey: ['/api/document-approvals/pending'],
    refetchInterval: 30000,
  });

  // Fetch available folders
  const { data: folders = [] } = useQuery<Folder[]>({
    queryKey: ['/api/folders'],
  });

  const currentApproval = pendingApprovals[currentIndex];

  // Initialize selected folder when approval changes
  useEffect(() => {
    if (currentApproval?.suggestedFolder) {
      setSelectedFolder(currentApproval.suggestedFolder);
    }
  }, [currentApproval]);

  // Process approval decision
  const processDecision = useMutation({
    mutationFn: async ({ decision, approvalId }: { decision: 'approve' | 'reject', approvalId: string }) => {
      return apiRequest('/api/document-approvals/decide', {
        method: 'POST',
        body: JSON.stringify({
          approvalId,
          decision,
          selectedFolder: decision === 'approve' ? selectedFolder : null,
          permissionLevel: decision === 'approve' ? permissionLevel : null,
          notes
        })
      });
    },
    onSuccess: (_, { decision }) => {
      toast({
        title: decision === 'approve' ? "Document Approved" : "Document Rejected",
        description: decision === 'approve' 
          ? "Document has been added to the database"
          : "Document has been rejected and won't be added"
      });
      
      // Move to next document
      if (currentIndex < pendingApprovals.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0);
      }
      
      // Reset form
      setNotes("");
      setPermissionLevel("public");
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/document-approvals/pending'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process approval decision",
        variant: "destructive"
      });
    }
  });

  const handleSwipeLeft = () => {
    if (currentApproval) {
      processDecision.mutate({ decision: 'reject', approvalId: currentApproval.id });
    }
  };

  const handleSwipeRight = () => {
    if (currentApproval && selectedFolder) {
      processDecision.mutate({ decision: 'approve', approvalId: currentApproval.id });
    } else {
      toast({
        title: "Folder Required",
        description: "Please select a folder before approving",
        variant: "destructive"
      });
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4 text-red-600" />;
      case 'sales_flyer': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'product_announcement': return <Bell className="h-4 w-4 text-blue-600" />;
      case 'blog_post': return <Sparkles className="h-4 w-4 text-purple-600" />;
      case 'news': return <Bell className="h-4 w-4 text-orange-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'recommend': return 'bg-green-100 text-green-800 border-green-200';
      case 'review_needed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'skip': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pending approvals...</p>
        </div>
      </div>
    );
  }

  if (pendingApprovals.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">No Pending Approvals</h3>
          <p className="text-gray-600">All detected documents have been reviewed.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Document Approval Workflow</h2>
          <p className="text-gray-600">
            Review AI-detected documents from vendor sites ({currentIndex + 1} of {pendingApprovals.length})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {pendingApprovals.length} pending
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSwipeMode(!isSwipeMode)}
          >
            {isSwipeMode ? "Detail Mode" : "Swipe Mode"}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm text-gray-600">
          {currentIndex + 1} / {pendingApprovals.length}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentIndex(Math.min(pendingApprovals.length - 1, currentIndex + 1))}
          disabled={currentIndex === pendingApprovals.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Document Card */}
      {currentApproval && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getDocumentTypeIcon(currentApproval.documentType)}
                  <CardTitle className="text-lg">{currentApproval.documentTitle}</CardTitle>
                </div>
                <p className="text-sm text-gray-600 mb-2">From: {currentApproval.vendorName}</p>
                <div className="flex items-center gap-2">
                  <Badge className={getRecommendationColor(currentApproval.aiRecommendation)}>
                    AI: {currentApproval.aiRecommendation.replace('_', ' ')}
                  </Badge>
                  {currentApproval.newsWorthiness > 7 && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      Newsworthy
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                <Calendar className="h-3 w-3 inline mr-1" />
                {new Date(currentApproval.detectedAt).toLocaleDateString()}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* AI Reasoning */}
            <div>
              <Label className="text-sm font-medium text-gray-700">AI Analysis</Label>
              <p className="text-sm text-gray-600 mt-1">{currentApproval.aiReasoning}</p>
            </div>

            {/* Content Preview */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Content Preview</Label>
              <div className="bg-gray-50 rounded-md p-3 mt-1">
                <p className="text-sm text-gray-700 line-clamp-4">
                  {currentApproval.contentPreview}
                </p>
              </div>
            </div>

            {/* Folder Selection */}
            <div>
              <Label htmlFor="folder-select">Target Folder</Label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select folder for document" />
                </SelectTrigger>
                <SelectContent>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        {folder.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentApproval.suggestedFolder && (
                <p className="text-xs text-gray-500 mt-1">
                  AI suggested: {currentApproval.suggestedFolder}
                </p>
              )}
            </div>

            {/* Permission Level */}
            <div>
              <Label htmlFor="permission-level">Permission Level</Label>
              <Select value={permissionLevel} onValueChange={setPermissionLevel}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public Access</SelectItem>
                  <SelectItem value="admin_only">Admin Only</SelectItem>
                  <SelectItem value="manager_access">Manager Access</SelectItem>
                  <SelectItem value="training_data">Training Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this decision..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Document Link */}
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href={currentApproval.documentUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Original Document
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {currentApproval && (
        <div className="flex justify-center gap-4 max-w-2xl mx-auto">
          <Button
            variant="destructive"
            size="lg"
            onClick={handleSwipeLeft}
            disabled={processDecision.isPending}
            className="flex-1 max-w-xs"
          >
            <ThumbsDown className="h-5 w-5 mr-2" />
            Reject
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={handleSwipeRight}
            disabled={processDecision.isPending || !selectedFolder}
            className="flex-1 max-w-xs"
          >
            <ThumbsUp className="h-5 w-5 mr-2" />
            Approve & Add
          </Button>
        </div>
      )}
    </div>
  );
}