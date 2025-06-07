import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Brain, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb,
  BarChart3,
  MessageSquare,
  Users,
  DollarSign,
  Eye,
  EyeOff
} from 'lucide-react';

interface CoachingSettings {
  enabled: boolean;
  realTimeAnalysis: boolean;
  urgentTipsOnly: boolean;
  priorityFilter: 'all' | 'high' | 'critical';
  categoryFilter: string[];
  confidenceThreshold: number;
  autoAnalyzeConversations: boolean;
  showMetricsOverlay: boolean;
  playSoundAlerts: boolean;
}

interface CoachingSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CoachingSettings;
  onSettingsChange: (settings: CoachingSettings) => void;
}

export default function CoachingSettingsPanel({ 
  isOpen, 
  onClose, 
  settings, 
  onSettingsChange 
}: CoachingSettingsProps) {
  const [localSettings, setLocalSettings] = useState<CoachingSettings>(settings);

  const updateSetting = (key: keyof CoachingSettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const toggleCategory = (category: string) => {
    const newCategories = localSettings.categoryFilter.includes(category)
      ? localSettings.categoryFilter.filter(c => c !== category)
      : [...localSettings.categoryFilter, category];
    updateSetting('categoryFilter', newCategories);
  };

  const categories = [
    { id: 'discovery', label: 'Discovery', icon: Target },
    { id: 'presentation', label: 'Presentation', icon: MessageSquare },
    { id: 'objection', label: 'Objection Handling', icon: AlertTriangle },
    { id: 'closing', label: 'Closing', icon: CheckCircle },
    { id: 'follow-up', label: 'Follow-up', icon: Users }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <CardTitle>Sales Coaching Settings</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Main Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Enable Sales Coaching</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Turn on AI-powered real-time sales coaching during conversations
              </p>
            </div>
            <Switch
              checked={localSettings.enabled}
              onCheckedChange={(checked) => updateSetting('enabled', checked)}
            />
          </div>

          <Separator />

          {/* Real-time Analysis */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Analysis Settings
            </h3>
            
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Real-time Message Analysis</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Analyze each message as it's sent for immediate coaching
                  </p>
                </div>
                <Switch
                  checked={localSettings.realTimeAnalysis}
                  onCheckedChange={(checked) => updateSetting('realTimeAnalysis', checked)}
                  disabled={!localSettings.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto-analyze Full Conversations</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Periodically analyze entire conversation for comprehensive insights
                  </p>
                </div>
                <Switch
                  checked={localSettings.autoAnalyzeConversations}
                  onCheckedChange={(checked) => updateSetting('autoAnalyzeConversations', checked)}
                  disabled={!localSettings.enabled}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Tip Filtering */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Coaching Tip Filters
            </h3>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Priority Level</Label>
                <div className="flex gap-2">
                  {['all', 'high', 'critical'].map((priority) => (
                    <Button
                      key={priority}
                      variant={localSettings.priorityFilter === priority ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSetting('priorityFilter', priority)}
                      disabled={!localSettings.enabled}
                      className="capitalize"
                    >
                      {priority}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">Sales Stage Categories</Label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    const isSelected = localSettings.categoryFilter.includes(category.id);
                    
                    return (
                      <Button
                        key={category.id}
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleCategory(category.id)}
                        disabled={!localSettings.enabled}
                        className="flex items-center gap-2 justify-start"
                      >
                        <Icon className="h-3 w-3" />
                        {category.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Confidence Threshold: {localSettings.confidenceThreshold}%
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Only show tips with confidence above this threshold
                </p>
                <Slider
                  value={[localSettings.confidenceThreshold]}
                  onValueChange={([value]) => updateSetting('confidenceThreshold', value)}
                  max={100}
                  min={50}
                  step={5}
                  disabled={!localSettings.enabled}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Display Options */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Display Options
            </h3>

            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Show Only Urgent Tips</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Display only high-priority tips that need immediate attention
                  </p>
                </div>
                <Switch
                  checked={localSettings.urgentTipsOnly}
                  onCheckedChange={(checked) => updateSetting('urgentTipsOnly', checked)}
                  disabled={!localSettings.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Show Metrics Overlay</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Display real-time call metrics and performance indicators
                  </p>
                </div>
                <Switch
                  checked={localSettings.showMetricsOverlay}
                  onCheckedChange={(checked) => updateSetting('showMetricsOverlay', checked)}
                  disabled={!localSettings.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Sound Alerts</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Play notification sounds for critical coaching tips
                  </p>
                </div>
                <Switch
                  checked={localSettings.playSoundAlerts}
                  onCheckedChange={(checked) => updateSetting('playSoundAlerts', checked)}
                  disabled={!localSettings.enabled}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onClose}>
              Close Settings
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  const defaultSettings: CoachingSettings = {
                    enabled: true,
                    realTimeAnalysis: true,
                    urgentTipsOnly: false,
                    priorityFilter: 'high',
                    categoryFilter: ['discovery', 'objection', 'closing'],
                    confidenceThreshold: 80,
                    autoAnalyzeConversations: true,
                    showMetricsOverlay: true,
                    playSoundAlerts: false
                  };
                  setLocalSettings(defaultSettings);
                  onSettingsChange(defaultSettings);
                }}
              >
                Reset to Defaults
              </Button>
              
              <Button onClick={onClose}>
                Save & Close
              </Button>
            </div>
          </div>

          {/* Status Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Coaching Status</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Badge variant={localSettings.enabled ? 'default' : 'secondary'} className="text-xs">
                  {localSettings.enabled ? 'Active' : 'Disabled'}
                </Badge>
                <span>Coaching Engine</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={localSettings.realTimeAnalysis ? 'default' : 'secondary'} className="text-xs">
                  {localSettings.realTimeAnalysis ? 'On' : 'Off'}
                </Badge>
                <span>Real-time Analysis</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}