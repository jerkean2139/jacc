import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Monitor, Smartphone, Tablet, Eye, EyeOff, RefreshCw } from "lucide-react";

interface ScreenInfo {
  width: number;
  height: number;
  breakpoint: string;
  orientation: string;
  pixelRatio: number;
  colorScheme: string;
}

interface ViewportInfo {
  innerWidth: number;
  innerHeight: number;
  outerWidth: number;
  outerHeight: number;
  scrollX: number;
  scrollY: number;
}

export default function ResponsiveDebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [screenInfo, setScreenInfo] = useState<ScreenInfo>({
    width: 0,
    height: 0,
    breakpoint: "unknown",
    orientation: "unknown",
    pixelRatio: 1,
    colorScheme: "light"
  });
  const [viewportInfo, setViewportInfo] = useState<ViewportInfo>({
    innerWidth: 0,
    innerHeight: 0,
    outerWidth: 0,
    outerHeight: 0,
    scrollX: 0,
    scrollY: 0
  });
  const [layoutMode, setLayoutMode] = useState<string>("unknown");
  const [isRealtimeUpdate, setIsRealtimeUpdate] = useState(true);

  const getBreakpoint = (width: number): string => {
    if (width < 640) return "xs (< 640px)";
    if (width < 768) return "sm (640px - 767px)";
    if (width < 1024) return "md (768px - 1023px)";
    if (width < 1280) return "lg (1024px - 1279px)";
    if (width < 1536) return "xl (1280px - 1535px)";
    return "2xl (≥ 1536px)";
  };

  const getLayoutMode = (width: number): string => {
    if (width < 1024) return "Mobile Layout (lg:hidden)";
    return "Desktop Layout (hidden lg:flex)";
  };

  const getDeviceIcon = (width: number) => {
    if (width < 768) return <Smartphone className="w-4 h-4" />;
    if (width < 1024) return <Tablet className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const updateScreenInfo = () => {
    if (typeof window === "undefined") return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    setScreenInfo({
      width,
      height,
      breakpoint: getBreakpoint(width),
      orientation: width > height ? "landscape" : "portrait",
      pixelRatio: window.devicePixelRatio || 1,
      colorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    });

    setViewportInfo({
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth || 0,
      outerHeight: window.outerHeight || 0,
      scrollX: window.scrollX || 0,
      scrollY: window.scrollY || 0
    });

    setLayoutMode(getLayoutMode(width));
  };

  useEffect(() => {
    updateScreenInfo();

    if (isRealtimeUpdate) {
      const handleResize = () => updateScreenInfo();
      const handleScroll = () => updateScreenInfo();

      window.addEventListener("resize", handleResize);
      window.addEventListener("scroll", handleScroll);
      window.addEventListener("orientationchange", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("orientationchange", handleResize);
      };
    }
  }, [isRealtimeUpdate]);

  const getBreakpointColor = (breakpoint: string): string => {
    if (breakpoint.includes("xs")) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (breakpoint.includes("sm")) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    if (breakpoint.includes("md")) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    if (breakpoint.includes("lg")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (breakpoint.includes("xl")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
  };

  const getLayoutColor = (mode: string): string => {
    return mode.includes("Mobile") 
      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="outline"
          className="bg-white dark:bg-slate-800 shadow-lg"
        >
          <Eye className="w-4 h-4 mr-2" />
          Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="bg-white dark:bg-slate-800 shadow-xl border-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getDeviceIcon(screenInfo.width)}
              Responsive Debug
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={updateScreenInfo}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                <EyeOff className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {/* Screen Information */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Breakpoint:</span>
              <Badge className={getBreakpointColor(screenInfo.breakpoint)}>
                {screenInfo.breakpoint}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Layout Mode:</span>
              <Badge className={getLayoutColor(layoutMode)}>
                {layoutMode.split(" ")[0]}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Screen Size:</span>
              <span className="font-mono">{screenInfo.width} × {screenInfo.height}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Orientation:</span>
              <span className="capitalize">{screenInfo.orientation}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Pixel Ratio:</span>
              <span>{screenInfo.pixelRatio}x</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Color Scheme:</span>
              <span className="capitalize">{screenInfo.colorScheme}</span>
            </div>
          </div>

          {/* Viewport Information */}
          <div className="border-t pt-2 space-y-2">
            <div className="font-medium text-slate-800 dark:text-slate-200">Viewport Info</div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Inner:</span>
              <span className="font-mono">{viewportInfo.innerWidth} × {viewportInfo.innerHeight}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Outer:</span>
              <span className="font-mono">{viewportInfo.outerWidth} × {viewportInfo.outerHeight}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Scroll:</span>
              <span className="font-mono">{Math.round(viewportInfo.scrollX)}, {Math.round(viewportInfo.scrollY)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="border-t pt-2 space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="realtime" className="text-xs">Real-time Updates</Label>
              <Switch
                id="realtime"
                checked={isRealtimeUpdate}
                onCheckedChange={setIsRealtimeUpdate}
              />
            </div>
          </div>

          {/* Breakpoint Guide */}
          <div className="border-t pt-2">
            <div className="font-medium text-slate-800 dark:text-slate-200 mb-2">Tailwind Breakpoints</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>xs:</span>
                <span className="font-mono">&lt; 640px</span>
              </div>
              <div className="flex justify-between">
                <span>sm:</span>
                <span className="font-mono">640px+</span>
              </div>
              <div className="flex justify-between">
                <span>md:</span>
                <span className="font-mono">768px+</span>
              </div>
              <div className="flex justify-between">
                <span>lg:</span>
                <span className="font-mono">1024px+</span>
              </div>
              <div className="flex justify-between">
                <span>xl:</span>
                <span className="font-mono">1280px+</span>
              </div>
              <div className="flex justify-between">
                <span>2xl:</span>
                <span className="font-mono">1536px+</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}