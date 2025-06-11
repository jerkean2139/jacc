import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Accessibility, Settings } from 'lucide-react';
import { useAccessibility } from './accessibility-provider';

export function AccessibilityMenu() {
  const {
    isHighContrast,
    setHighContrast,
    fontSize,
    setFontSize,
    reducedMotion,
    setReducedMotion
  } = useAccessibility();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          aria-label="Accessibility settings"
        >
          <Accessibility className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Accessibility</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5" />
              Accessibility Settings
            </CardTitle>
            <CardDescription>
              Customize your experience for better accessibility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* High Contrast Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="high-contrast" className="text-sm font-medium">
                  High Contrast Mode
                </Label>
                <p className="text-xs text-muted-foreground">
                  Increase color contrast for better visibility
                </p>
              </div>
              <Switch
                id="high-contrast"
                checked={isHighContrast}
                onCheckedChange={setHighContrast}
                aria-describedby="high-contrast-description"
              />
            </div>

            {/* Font Size Selection */}
            <div className="space-y-2">
              <Label htmlFor="font-size" className="text-sm font-medium">
                Font Size
              </Label>
              <Select value={fontSize} onValueChange={setFontSize}>
                <SelectTrigger id="font-size">
                  <SelectValue placeholder="Select font size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium (Default)</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Adjust text size throughout the application
              </p>
            </div>

            {/* Reduced Motion Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reduced-motion" className="text-sm font-medium">
                  Reduce Motion
                </Label>
                <p className="text-xs text-muted-foreground">
                  Minimize animations and transitions
                </p>
              </div>
              <Switch
                id="reduced-motion"
                checked={reducedMotion}
                onCheckedChange={setReducedMotion}
                aria-describedby="reduced-motion-description"
              />
            </div>

            {/* Keyboard Navigation Info */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Keyboard Navigation</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Tab</kbd> Navigate forward</div>
                <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Shift+Tab</kbd> Navigate backward</div>
                <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> Activate buttons/links</div>
                <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> Close dialogs</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}