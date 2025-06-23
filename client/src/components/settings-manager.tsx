import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";

export function SettingsManager() {
  const [primaryModel, setPrimaryModel] = useState("claude-sonnet-4-20250514");
  const [responseStyle, setResponseStyle] = useState("professional");
  const [sessionTimeout, setSessionTimeout] = useState(60);
  const [mfaRequired, setMfaRequired] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Settings
          </CardTitle>
          <CardDescription>
            Configure core system settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Primary AI Model</Label>
                <Select value={primaryModel} onValueChange={setPrimaryModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-sonnet-4-20250514">Claude 4.0 Sonnet</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Response Style</Label>
                <Select value={responseStyle} onValueChange={setResponseStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="conversational">Conversational</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="concise">Concise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Session Timeout (minutes): {sessionTimeout}</Label>
                <div className="px-3 py-2">
                  <Slider
                    value={[sessionTimeout]}
                    onValueChange={([value]) => setSessionTimeout(value)}
                    max={480}
                    min={15}
                    step={15}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Require MFA</Label>
                <Switch
                  checked={mfaRequired}
                  onCheckedChange={setMfaRequired}
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 pt-4">
            <Button variant="outline">
              Reset to Defaults
            </Button>
            <Button>
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}