import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Plus, Edit2, Trash2, Tag, FileText, Users, HelpCircle, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface QAItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  isActive: boolean;
  priority: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface DocumentTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdBy: string;
  createdAt: string;
}

interface MerchantApplication {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  businessType: string;
  monthlyVolume: string;
  averageTicket: string;
  status: string;
  priority: string;
  assignedAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('qa-management');
  const [qaDialogOpen, setQaDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [editingQA, setEditingQA] = useState<QAItem | null>(null);
  const [editingTag, setEditingTag] = useState<DocumentTag | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Q&A items
  const { data: qaItems = [], isLoading: qaLoading } = useQuery({
    queryKey: ['/api/admin/qa'],
    enabled: activeTab === 'qa-management',
  });

  // Fetch document tags
  const { data: documentTags = [], isLoading: tagsLoading } = useQuery({
    queryKey: ['/api/admin/tags'],
    enabled: activeTab === 'document-tags',
  });

  // Fetch merchant applications
  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ['/api/admin/applications'],
    enabled: activeTab === 'merchant-apps',
  });

  // Q&A Management mutations
  const createQAMutation = useMutation({
    mutationFn: (data: Partial<QAItem>) => apiRequest('POST', '/api/admin/qa', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/qa'] });
      setQaDialogOpen(false);
      setEditingQA(null);
      toast({ title: 'Success', description: 'Q&A item saved successfully' });
    },
  });

  const updateQAMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<QAItem> & { id: string }) => 
      apiRequest('PUT', `/api/admin/qa/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/qa'] });
      setQaDialogOpen(false);
      setEditingQA(null);
      toast({ title: 'Success', description: 'Q&A item updated successfully' });
    },
  });

  const deleteQAMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/qa/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/qa'] });
      toast({ title: 'Success', description: 'Q&A item deleted successfully' });
    },
  });

  // Tag Management mutations
  const createTagMutation = useMutation({
    mutationFn: (data: Partial<DocumentTag>) => apiRequest('POST', '/api/admin/tags', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tags'] });
      setTagDialogOpen(false);
      setEditingTag(null);
      toast({ title: 'Success', description: 'Tag created successfully' });
    },
  });

  const QAManagementTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Q&A Knowledge Base</h2>
          <p className="text-muted-foreground">Manage training questions and answers for JACC</p>
        </div>
        <Dialog open={qaDialogOpen} onOpenChange={setQaDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingQA(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Q&A
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingQA ? 'Edit Q&A' : 'Add New Q&A'}</DialogTitle>
              <DialogDescription>
                Create training data to improve JACC's responses to merchant services questions.
              </DialogDescription>
            </DialogHeader>
            <QAForm 
              qa={editingQA} 
              onSubmit={(data) => {
                if (editingQA) {
                  updateQAMutation.mutate({ ...data, id: editingQA.id });
                } else {
                  createQAMutation.mutate(data);
                }
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {qaItems.map((qa: QAItem) => (
          <Card key={qa.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={qa.isActive ? "default" : "secondary"}>
                    {qa.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">{qa.category}</Badge>
                  <span className="text-sm text-muted-foreground">Priority: {qa.priority}</span>
                </div>
                <h3 className="font-semibold mb-2">{qa.question}</h3>
                <p className="text-sm text-muted-foreground mb-2">{qa.answer}</p>
                {qa.tags && qa.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {qa.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEditingQA(qa);
                    setQaDialogOpen(true);
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => deleteQAMutation.mutate(qa.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const DocumentTagsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Document Tags</h2>
          <p className="text-muted-foreground">Organize documents with custom tags and categories</p>
        </div>
        <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTag(null)}>
              <Tag className="w-4 h-4 mr-2" />
              Create Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Document Tag</DialogTitle>
              <DialogDescription>
                Add a new tag to categorize and organize documents in JACC.
              </DialogDescription>
            </DialogHeader>
            <TagForm 
              tag={editingTag} 
              onSubmit={(data) => createTagMutation.mutate(data)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documentTags.map((tag: DocumentTag) => (
          <Card key={tag.id} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: tag.color }}
              />
              <h3 className="font-semibold">{tag.name}</h3>
            </div>
            {tag.description && (
              <p className="text-sm text-muted-foreground">{tag.description}</p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );

  const MerchantAppsTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Merchant Applications</h2>
        <p className="text-muted-foreground">Track and manage ISO AMP merchant applications</p>
      </div>

      <div className="grid gap-4">
        {applications.map((app: MerchantApplication) => (
          <Card key={app.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={app.status === 'approved' ? "default" : 
                    app.status === 'pending' ? "secondary" : "destructive"}>
                    {app.status}
                  </Badge>
                  <Badge variant="outline">{app.priority}</Badge>
                </div>
                <h3 className="font-semibold">{app.businessName}</h3>
                <p className="text-sm text-muted-foreground">
                  {app.contactName} • {app.email} • {app.phone}
                </p>
                <p className="text-sm">
                  {app.businessType} • Monthly Volume: ${app.monthlyVolume} • 
                  Avg Ticket: ${app.averageTicket}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage JACC's knowledge base, documents, and merchant services integration
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="qa-management" className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Q&A Management
          </TabsTrigger>
          <TabsTrigger value="document-tags" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Document Tags
          </TabsTrigger>
          <TabsTrigger value="merchant-apps" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Merchant Apps
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="qa-management">
          <QAManagementTab />
        </TabsContent>

        <TabsContent value="document-tags">
          <DocumentTagsTab />
        </TabsContent>

        <TabsContent value="merchant-apps">
          <MerchantAppsTab />
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">System Analytics</h2>
            <p className="text-muted-foreground">
              Analytics dashboard coming soon - track JACC usage, Q&A effectiveness, and merchant application metrics.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Q&A Form Component
const QAForm = ({ qa, onSubmit }: { qa: QAItem | null; onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    question: qa?.question || '',
    answer: qa?.answer || '',
    category: qa?.category || 'merchant-services',
    tags: qa?.tags?.join(', ') || '',
    priority: qa?.priority || 0,
    isActive: qa?.isActive ?? true,
  });

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="question">Question</Label>
        <Input
          id="question"
          value={formData.question}
          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
          placeholder="What question should JACC be able to answer?"
        />
      </div>
      
      <div>
        <Label htmlFor="answer">Answer</Label>
        <Textarea
          id="answer"
          value={formData.answer}
          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
          placeholder="Provide a comprehensive answer..."
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="merchant-services">Merchant Services</SelectItem>
              <SelectItem value="payment-processing">Payment Processing</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="rates-pricing">Rates & Pricing</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priority (0-10)</Label>
          <Input
            id="priority"
            type="number"
            min="0"
            max="10"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="credit card processing, rates, interchange"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label>Active (JACC will use this Q&A)</Label>
      </div>

      <DialogFooter>
        <Button 
          onClick={() => onSubmit({
            ...formData,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          })}
        >
          Save Q&A
        </Button>
      </DialogFooter>
    </div>
  );
};

// Tag Form Component
const TagForm = ({ tag, onSubmit }: { tag: DocumentTag | null; onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    name: tag?.name || '',
    color: tag?.color || '#3b82f6',
    description: tag?.description || '',
  });

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Tag Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., High Priority, Training Material"
        />
      </div>
      
      <div>
        <Label htmlFor="color">Color</Label>
        <Input
          id="color"
          type="color"
          value={formData.color}
          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe when to use this tag..."
        />
      </div>

      <DialogFooter>
        <Button onClick={() => onSubmit(formData)}>
          Create Tag
        </Button>
      </DialogFooter>
    </div>
  );
};