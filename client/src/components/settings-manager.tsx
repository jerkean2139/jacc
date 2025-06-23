import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  Users, 
  FileText, 
  Settings, 
  MessageSquare, 
  Monitor,
  Save, 
  RotateCcw,
  Edit,
  Plus,
  User
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SettingsData {
  primaryModel: string;
  fallbackModel: string;
  responseStyle: string;
  searchSensitivity: number;
  searchOrder: string[];
  defaultRole: string;
  sessionTimeout: number;
  mfaRequired: boolean;
  allowGuestAccess: boolean;
  notificationFrequency: string;
  ocrQuality: string;
  autoCategorizationEnabled: boolean;
  textChunkSize: number;
  retentionPolicyDays: number;
  responseTimeout: number;
  cacheExpirationTime: number;
  memoryOptimization: string;
  maxConcurrentRequests: number;
  systemPrompts: {
    documentSearch: string;
    responseFormatting: string;
    errorHandling: string;
  };
  personalityStyle: string;
  responseTone: string;
  expertiseLevel: number;
  userSpecificOverrides: Record<string, any>;
}

export function SettingsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [tempPromptValue, setTempPromptValue] = useState("");

  // Fetch current settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
  });

  // Fetch system status
  const { data: systemStatus } = useQuery({
    queryKey: ['/api/admin/settings/status'],
    queryFn: async () => {
      const response = await fetch('/api/admin/settings/status');
      if (!response.ok) throw new Error('Failed to fetch status');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (settingsData?.settings) {
      setSettings(settingsData.settings);
    }
  }, [settingsData]);

  // Update settings mutations
  const updateAISearchMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/settings/ai-search', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update AI search settings');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "AI & Search settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
    },
  });

  const updateUserManagementMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/settings/user-management', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update user management settings');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "User management settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
    },
  });

  const updateContentProcessingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/settings/content-processing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update content processing settings');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Content processing settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
    },
  });

  const updatePerformanceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/settings/performance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update performance settings');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Performance settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
    },
  });

  const updateAIPromptsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/settings/ai-prompts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update AI prompts');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "AI prompts updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
    },
  });

  const resetSettingsMutation = useMutation({
    mutationFn: async (category: string) => {
      const response = await fetch('/api/admin/settings/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category })
      });
      if (!response.ok) throw new Error('Failed to reset settings');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Settings reset to defaults" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
    },
  });

  const handleUpdateSetting = (category: string, field: string, value: any) => {
    if (!settings) return;

    const updatedSettings = { ...settings, [field]: value };
    setSettings(updatedSettings);

    const updateData = { [field]: value };

    switch (category) {
      case 'ai-search':
        updateAISearchMutation.mutate(updateData);
        break;
      case 'user-management':
        updateUserManagementMutation.mutate(updateData);
        break;
      case 'content-processing':
        updateContentProcessingMutation.mutate(updateData);
        break;
      case 'performance':
        updatePerformanceMutation.mutate(updateData);
        break;
    }
  };

  const handlePromptEdit = (promptType: string) => {
    if (!settings) return;
    setEditingPrompt(promptType);
    setTempPromptValue(settings.systemPrompts[promptType as keyof typeof settings.systemPrompts] || "");
  };

  const handlePromptSave = (promptType: string) => {
    if (!settings) return;
    
    const updatedPrompts = {
      ...settings.systemPrompts,
      [promptType]: tempPromptValue
    };

    const updatedSettings = {
      ...settings,
      systemPrompts: updatedPrompts
    };

    setSettings(updatedSettings);
    updateAIPromptsMutation.mutate({ systemPrompts: updatedPrompts });
    setEditingPrompt(null);
    setTempPromptValue("");
  };

  if (isLoading || !settings) {
    return <div className="p-6 text-center">Loading settings...</div>;
  }

  return (
    <Tabs defaultValue="ai-search" className="space-y-6">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="ai-search" className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          AI & Search
        </TabsTrigger>
        <TabsTrigger value="user-management" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Users
        </TabsTrigger>
        <TabsTrigger value="content-processing" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Content
        </TabsTrigger>
        <TabsTrigger value="performance" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Performance
        </TabsTrigger>
        <TabsTrigger value="ai-prompts" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          AI Prompts
        </TabsTrigger>
        <TabsTrigger value="system-status" className="flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          Status
        </TabsTrigger>
      </TabsList>

      {/* AI & Search Configuration */}
      <TabsContent value="ai-search" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI & Search Configuration
            </CardTitle>
            <CardDescription>
              Configure AI model preferences and search behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Primary AI Model</Label>
                  <Select 
                    value={settings.primaryModel} 
                    onValueChange={(value) => handleUpdateSetting('ai-search', 'primaryModel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude-sonnet-4-20250514">Claude 4.0 Sonnet (Recommended)</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o (Fallback)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Response Style</Label>
                  <Select 
                    value={settings.responseStyle} 
                    onValueChange={(value) => handleUpdateSetting('ai-search', 'responseStyle', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concise-direct">Concise & Direct</SelectItem>
                      <SelectItem value="professional-helpful">Professional & Helpful</SelectItem>
                      <SelectItem value="technical-detailed">Technical & Detailed</SelectItem>
                      <SelectItem value="comprehensive-educational">Comprehensive & Educational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Document Search Sensitivity: {settings.searchSensitivity}</Label>
                  <div className="px-3 py-2">
                    <Slider
                      value={[settings.searchSensitivity]}
                      onValueChange={([value]) => handleUpdateSetting('ai-search', 'searchSensitivity', value)}
                      max={1}
                      min={0.3}
                      step={0.05}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Loose (0.3)</span>
                    <span>Balanced</span>
                    <span>Strict (1.0)</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Search Priority Order</Label>
                  <div className="space-y-2 mt-2">
                    {settings.searchOrder.map((source, index) => (
                      <div key={source} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                        <span className="text-sm font-medium">
                          {index + 1}. {source === 'faq' ? 'FAQ Knowledge Base' : 
                                       source === 'documents' ? 'Document Center' : 
                                       'Web Search Fallback'}
                        </span>
                        <Badge variant="outline">Active</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* User Management */}
      <TabsContent value="user-management" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management Settings
            </CardTitle>
            <CardDescription>
              Configure user roles, sessions, and access controls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Default User Role</Label>
                  <Select 
                    value={settings.defaultRole} 
                    onValueChange={(value) => handleUpdateSetting('user-management', 'defaultRole', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales-agent">Sales Agent</SelectItem>
                      <SelectItem value="client-admin">Client Admin</SelectItem>
                      <SelectItem value="dev-admin">Dev Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Session Timeout (minutes): {settings.sessionTimeout}</Label>
                  <div className="px-3 py-2">
                    <Slider
                      value={[settings.sessionTimeout]}
                      onValueChange={([value]) => handleUpdateSetting('user-management', 'sessionTimeout', value)}
                      max={120}
                      min={15}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Notification Frequency</Label>
                  <Select 
                    value={settings.notificationFrequency} 
                    onValueChange={(value) => handleUpdateSetting('user-management', 'notificationFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mfa-required">Require Multi-Factor Authentication</Label>
                  <Switch
                    id="mfa-required"
                    checked={settings.mfaRequired}
                    onCheckedChange={(checked) => handleUpdateSetting('user-management', 'mfaRequired', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="guest-access">Allow Guest Access</Label>
                  <Switch
                    id="guest-access"
                    checked={settings.allowGuestAccess}
                    onCheckedChange={(checked) => handleUpdateSetting('user-management', 'allowGuestAccess', checked)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Content Processing */}
      <TabsContent value="content-processing" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Content & Document Processing
            </CardTitle>
            <CardDescription>
              Configure OCR, text processing, and document handling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>OCR Quality Level</Label>
                  <Select 
                    value={settings.ocrQuality} 
                    onValueChange={(value) => handleUpdateSetting('content-processing', 'ocrQuality', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (Fast)</SelectItem>
                      <SelectItem value="high">High Quality</SelectItem>
                      <SelectItem value="ultra">Ultra (Slow)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Text Chunk Size: {settings.textChunkSize} characters</Label>
                  <div className="px-3 py-2">
                    <Slider
                      value={[settings.textChunkSize]}
                      onValueChange={([value]) => handleUpdateSetting('content-processing', 'textChunkSize', value)}
                      max={2000}
                      min={500}
                      step={100}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Document Retention Policy</Label>
                  <Select 
                    value={settings.retentionPolicyDays === -1 ? "forever" : settings.retentionPolicyDays.toString()} 
                    onValueChange={(value) => {
                      const days = value === "forever" ? -1 : parseInt(value);
                      handleUpdateSetting('content-processing', 'retentionPolicyDays', days);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="60">60 Days</SelectItem>
                      <SelectItem value="90">90 Days (Recommended)</SelectItem>
                      <SelectItem value="180">6 Months</SelectItem>
                      <SelectItem value="365">1 Year</SelectItem>
                      <SelectItem value="730">2 Years</SelectItem>
                      <SelectItem value="forever">Forever (No Deletion)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {settings.retentionPolicyDays === -1 
                      ? "Documents will be kept indefinitely" 
                      : `Documents older than ${settings.retentionPolicyDays} days will be automatically deleted`}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-categorization">Auto-Categorization</Label>
                  <Switch
                    id="auto-categorization"
                    checked={settings.autoCategorizationEnabled}
                    onCheckedChange={(checked) => handleUpdateSetting('content-processing', 'autoCategorizationEnabled', checked)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Performance */}
      <TabsContent value="performance" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Performance
            </CardTitle>
            <CardDescription>
              Configure timeouts, caching, and resource optimization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Response Timeout (seconds): {settings.responseTimeout}</Label>
                  <div className="px-3 py-2">
                    <Slider
                      value={[settings.responseTimeout]}
                      onValueChange={([value]) => handleUpdateSetting('performance', 'responseTimeout', value)}
                      max={120}
                      min={15}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Cache Expiration (minutes): {settings.cacheExpirationTime}</Label>
                  <div className="px-3 py-2">
                    <Slider
                      value={[settings.cacheExpirationTime]}
                      onValueChange={([value]) => handleUpdateSetting('performance', 'cacheExpirationTime', value)}
                      max={240}
                      min={15}
                      step={15}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Max Concurrent Requests: {settings.maxConcurrentRequests}</Label>
                  <div className="px-3 py-2">
                    <Slider
                      value={[settings.maxConcurrentRequests]}
                      onValueChange={([value]) => handleUpdateSetting('performance', 'maxConcurrentRequests', value)}
                      max={50}
                      min={5}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Memory Optimization</Label>
                  <Select 
                    value={settings.memoryOptimization} 
                    onValueChange={(value) => handleUpdateSetting('performance', 'memoryOptimization', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="high-performance">High Performance</SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* AI Prompts */}
      <TabsContent value="ai-prompts" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              AI Prompts Management
            </CardTitle>
            <CardDescription>
              Configure system prompts, personality settings, and AI behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Prompts */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">System Prompts</h4>
                </div>
                
                <div className="space-y-3">
                  {Object.entries(settings.systemPrompts).map(([key, value]) => (
                    <div key={key} className="p-4 border rounded-lg bg-blue-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          {key === 'documentSearch' ? 'Document Search Prompt' :
                           key === 'responseFormatting' ? 'Response Formatting Prompt' :
                           'Error Handling Prompt'}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handlePromptEdit(key)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {editingPrompt === key ? (
                        <div className="space-y-2">
                          <Textarea
                            value={tempPromptValue}
                            onChange={(e) => setTempPromptValue(e.target.value)}
                            rows={4}
                            className="text-sm"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handlePromptSave(key)}>
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setEditingPrompt(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs bg-white p-2 rounded border max-h-20 overflow-y-auto">
                          {value}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Personality & Behavior */}
              <div className="space-y-4">
                <h4 className="font-medium">Personality & Behavior</h4>
                
                <div className="space-y-4">
                  <div>
                    <Label>AI Personality Style</Label>
                    <Select 
                      value={settings.personalityStyle} 
                      onValueChange={(value) => {
                        const updatedSettings = { ...settings, personalityStyle: value };
                        setSettings(updatedSettings);
                        updateAIPromptsMutation.mutate({ personalityStyle: value });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional-helpful">Professional & Helpful</SelectItem>
                        <SelectItem value="friendly-expert">Friendly Expert</SelectItem>
                        <SelectItem value="direct-efficient">Direct & Efficient</SelectItem>
                        <SelectItem value="expert-consultant">Expert Consultant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Response Tone</Label>
                    <Select 
                      value={settings.responseTone} 
                      onValueChange={(value) => {
                        const updatedSettings = { ...settings, responseTone: value };
                        setSettings(updatedSettings);
                        updateAIPromptsMutation.mutate({ responseTone: value });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Expertise Level: {settings.expertiseLevel}</Label>
                    <div className="px-3 py-2">
                      <Slider
                        value={[settings.expertiseLevel]}
                        onValueChange={([value]) => {
                          const updatedSettings = { ...settings, expertiseLevel: value };
                          setSettings(updatedSettings);
                          updateAIPromptsMutation.mutate({ expertiseLevel: value });
                        }}
                        max={10}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Beginner (1)</span>
                      <span>Expert (10)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* System Status */}
      <TabsContent value="system-status" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              System Status & Monitoring
            </CardTitle>
            <CardDescription>
              Real-time system performance and health metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {systemStatus?.status && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {systemStatus.status.memoryUsage}%
                  </div>
                  <div className="text-sm text-gray-600">Memory Usage</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {systemStatus.status.cacheHitRate}%
                  </div>
                  <div className="text-sm text-gray-600">Cache Hit Rate</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {systemStatus.status.averageResponseTime}ms
                  </div>
                  <div className="text-sm text-gray-600">Response Time</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {systemStatus.status.activeUsers}
                  </div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {systemStatus.status.uptime}
                  </div>
                  <div className="text-sm text-gray-600">Uptime</div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-4">
              <p className="text-sm text-gray-600">
                Last updated: {systemStatus?.status?.lastUpdated ? new Date(systemStatus.status.lastUpdated).toLocaleString() : 'Never'}
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => resetSettingsMutation.mutate('all')}
                  disabled={resetSettingsMutation.isPending}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset All Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}