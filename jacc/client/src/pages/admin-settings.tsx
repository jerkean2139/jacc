import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, RefreshCw, FileText, Brain, Sliders, Database } from "lucide-react";

interface AdminSettings {
  systemPrompt: string;
  userInstructions: string;
  assistantPrompt: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  enableVoice: boolean;
  enableDocumentSearch: boolean;
  enableRateComparisons: boolean;
  googleDriveFolderId: string;
  model: string;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AdminSettings>({
    systemPrompt: `You are JACC, an AI-powered assistant for Tracer Co Card sales agents. You specialize in:
- Credit card processing solutions and merchant services
- Payment processing rates and fee comparisons
- Point-of-sale (POS) systems and payment terminals
- Business payment solutions and savings calculations
- Document organization and client proposal generation
- Answering merchant services questions using company knowledge base`,
    userInstructions: `Ask me about:
- Payment processing rates for different business types
- POS system recommendations
- Merchant account setup questions
- Credit card processing fee analysis
- Business payment solutions`,
    assistantPrompt: "I'm here to help you with all your merchant services needs. What would you like to know about payment processing solutions?",
    temperature: 0.7,
    maxTokens: 1500,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    enableVoice: true,
    enableDocumentSearch: true,
    enableRateComparisons: true,
    googleDriveFolderId: "1iIS1kMU_rnArNAF8Ka5F7y3rWj0-e8_X",
    model: "claude-3-7-sonnet-20250219"
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [indexingStatus, setIndexingStatus] = useState<string>("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast({
          title: "Settings Saved",
          description: "Admin settings have been updated successfully.",
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const indexDocuments = async () => {
    setIndexingStatus("Starting document indexing...");
    try {
      const response = await fetch('/api/documents/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: settings.googleDriveFolderId })
      });

      if (response.ok) {
        const result = await response.json();
        setIndexingStatus(`Successfully indexed ${result.documents?.length || 0} documents`);
        toast({
          title: "Indexing Complete",
          description: result.message,
        });
      } else {
        throw new Error('Failed to index documents');
      }
    } catch (error) {
      setIndexingStatus("Error during indexing");
      toast({
        title: "Indexing Error",
        description: "Failed to index documents. Please check your Google Drive configuration.",
        variant: "destructive",
      });
    }
  };

  const updateSetting = (key: keyof AdminSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <Settings className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">JACC Admin Settings</h1>
            <p className="text-slate-600 dark:text-slate-400">Configure AI behavior, prompts, and system parameters</p>
          </div>
        </div>
        <Button onClick={saveSettings} disabled={isSaving} className="navy-primary text-white">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <Tabs defaultValue="prompts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="prompts" className="flex items-center space-x-2">
            <Brain className="w-4 h-4" />
            <span>AI Prompts</span>
          </TabsTrigger>
          <TabsTrigger value="parameters" className="flex items-center space-x-2">
            <Sliders className="w-4 h-4" />
            <span>AI Parameters</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Features</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Documents</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prompts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Prompt Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  value={settings.systemPrompt}
                  onChange={(e) => updateSetting('systemPrompt', e.target.value)}
                  rows={8}
                  className="mt-2"
                  placeholder="Define the AI's role and expertise..."
                />
              </div>

              <div>
                <Label htmlFor="userInstructions">User Instructions</Label>
                <Textarea
                  id="userInstructions"
                  value={settings.userInstructions}
                  onChange={(e) => updateSetting('userInstructions', e.target.value)}
                  rows={6}
                  className="mt-2"
                  placeholder="Instructions shown to users..."
                />
              </div>

              <div>
                <Label htmlFor="assistantPrompt">Default Assistant Response</Label>
                <Textarea
                  id="assistantPrompt"
                  value={settings.assistantPrompt}
                  onChange={(e) => updateSetting('assistantPrompt', e.target.value)}
                  rows={3}
                  className="mt-2"
                  placeholder="Initial greeting message..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parameters" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Model Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="model">AI Model</Label>
                <Input
                  id="model"
                  value={settings.model}
                  onChange={(e) => updateSetting('model', e.target.value)}
                  className="mt-2"
                />
                <Badge variant="secondary" className="mt-2">Claude 3.7 Sonnet</Badge>
              </div>

              <div>
                <Label>Temperature: {settings.temperature}</Label>
                <Slider
                  value={[settings.temperature]}
                  onValueChange={(value) => updateSetting('temperature', value[0])}
                  max={2}
                  min={0}
                  step={0.1}
                  className="mt-2"
                />
                <p className="text-sm text-slate-600 mt-1">Controls randomness in responses (0 = deterministic, 2 = very creative)</p>
              </div>

              <div>
                <Label>Max Tokens: {settings.maxTokens}</Label>
                <Slider
                  value={[settings.maxTokens]}
                  onValueChange={(value) => updateSetting('maxTokens', value[0])}
                  max={4000}
                  min={100}
                  step={100}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Top P: {settings.topP}</Label>
                <Slider
                  value={[settings.topP]}
                  onValueChange={(value) => updateSetting('topP', value[0])}
                  max={1}
                  min={0}
                  step={0.01}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Voice Interface</Label>
                  <p className="text-sm text-slate-600">Enable voice input and output</p>
                </div>
                <Switch
                  checked={settings.enableVoice}
                  onCheckedChange={(checked) => updateSetting('enableVoice', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Document Search</Label>
                  <p className="text-sm text-slate-600">Enable AI to search company documents</p>
                </div>
                <Switch
                  checked={settings.enableDocumentSearch}
                  onCheckedChange={(checked) => updateSetting('enableDocumentSearch', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Rate Comparisons</Label>
                  <p className="text-sm text-slate-600">Enable payment processing rate analysis</p>
                </div>
                <Switch
                  checked={settings.enableRateComparisons}
                  onCheckedChange={(checked) => updateSetting('enableRateComparisons', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Google Drive Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="googleDriveFolderId">Google Drive Folder ID</Label>
                <Input
                  id="googleDriveFolderId"
                  value={settings.googleDriveFolderId}
                  onChange={(e) => updateSetting('googleDriveFolderId', e.target.value)}
                  className="mt-2"
                  placeholder="1iIS1kMU_rnArNAF8Ka5F7y3rWj0-e8_X"
                />
              </div>

              <div className="flex items-center space-x-4">
                <Button onClick={indexDocuments} variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Index Documents
                </Button>
                {indexingStatus && (
                  <Badge variant={indexingStatus.includes('Error') ? 'destructive' : 'default'}>
                    {indexingStatus}
                  </Badge>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Current Configuration:</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Folder: {settings.googleDriveFolderId}<br/>
                  Document search: {settings.enableDocumentSearch ? 'Enabled' : 'Disabled'}<br/>
                  Model: {settings.model}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}