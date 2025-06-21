import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Folder, FileText, AlertTriangle, Settings, Users, BarChart3, MessageSquare, Brain, ChevronDown, Download, Edit } from 'lucide-react';
import DocumentDragDrop from '@/components/ui/document-drag-drop';
import DocumentPreviewModal from '@/components/ui/document-preview-modal';
import { useToast } from '@/hooks/use-toast';

interface DocumentEntry {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  folderId?: string;
}

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  priority: number;
  isActive: boolean;
}

export default function AdminControlCenter() {
  const [activeTab, setActiveTab] = useState('documents');
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [previewDocument, setPreviewDocument] = useState<DocumentEntry | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch documents data
  const { data: integratedDocuments, isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/documents'],
    enabled: activeTab === 'documents',
  });

  // Fetch FAQ data
  const { data: faqData, isLoading: faqLoading } = useQuery({
    queryKey: ['/api/admin/faq'],
    enabled: activeTab === 'faq',
  });

  // Fetch training analytics
  const { data: trainingAnalytics, isLoading: trainingLoading } = useQuery({
    queryKey: ['/api/admin/training/analytics'],
    enabled: activeTab === 'training',
  });

  const handlePreviewDocument = (document: DocumentEntry) => {
    setPreviewDocument(document);
    setShowPreviewModal(true);
  };

  const handleDownloadDocument = (doc: DocumentEntry) => {
    const downloadUrl = `/api/documents/${doc.id}/download`;
    window.open(downloadUrl, '_blank');
  };

  const handleEditDocument = (document: DocumentEntry) => {
    // Placeholder for edit functionality
    toast({ title: 'Edit functionality coming soon' });
  };

  const handleMoveDocument = async (documentId: string, targetFolderId: string | null) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId: targetFolderId }),
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to move document');
      
      // Refresh the documents data
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({ title: 'Document moved successfully' });
    } catch (error) {
      toast({ 
        title: 'Failed to move document', 
        description: 'Please try again',
        variant: 'destructive' 
      });
    }
  };

  const categories = Array.isArray(faqData) ? 
    Array.from(new Set(faqData.map((faq: FAQ) => faq.category))) : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Control Center</h1>
        <p className="text-gray-600 mt-2">Manage documents, knowledge base, and system settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <Folder className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Training
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Folder className="h-5 w-5" />
                    Document Repository
                  </CardTitle>
                  <CardDescription>
                    Organize and manage your document collection with drag-and-drop functionality
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {documentsLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Loading documents...</span>
                    </div>
                  ) : (
                    <ScrollArea className="h-[600px] pr-4">
                      <DocumentDragDrop
                        folders={integratedDocuments?.folders || []}
                        unassignedDocuments={integratedDocuments?.unassignedDocuments || []}
                        onMoveDocument={handleMoveDocument}
                        onPreviewDocument={handlePreviewDocument}
                        onDownloadDocument={handleDownloadDocument}
                        onEditDocument={handleEditDocument}
                      />
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Document Preview Modal */}
          <DocumentPreviewModal
            document={previewDocument}
            isOpen={showPreviewModal}
            onClose={() => setShowPreviewModal(false)}
            onDownload={handleDownloadDocument}
          />
        </TabsContent>

        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base Management</CardTitle>
              <CardDescription>
                Manage FAQ entries and knowledge base content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {faqLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Loading FAQ data...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {categories.map((category: string) => {
                    const categoryFAQs = Array.isArray(faqData) ? 
                      faqData.filter((f: FAQ) => f.category === category) : [];
                    
                    return (
                      <div key={category} className="border rounded-lg">
                        <div className="p-4 bg-gray-50 border-b">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{category}</h3>
                            <Badge variant="secondary">
                              {categoryFAQs.length} entries
                            </Badge>
                          </div>
                        </div>
                        <div className="p-4 space-y-2">
                          {categoryFAQs.map((faq: FAQ) => (
                            <div key={faq.id} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{faq.question}</p>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{faq.answer}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={faq.isActive ? "default" : "secondary"}>
                                  {faq.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Button size="sm" variant="outline">
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Training Analytics</CardTitle>
              <CardDescription>
                Monitor AI training performance and user interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trainingLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Loading training data...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">
                      {trainingAnalytics?.totalInteractions || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Interactions</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">
                      {trainingAnalytics?.averageSatisfaction || 0}%
                    </div>
                    <div className="text-sm text-gray-600">Satisfaction Rate</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-700">
                      {trainingAnalytics?.totalMessages || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Messages</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Analytics</CardTitle>
              <CardDescription>
                Overview of system performance and usage metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 text-gray-500">
                Analytics dashboard coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure system parameters and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 text-gray-500">
                Settings panel coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}