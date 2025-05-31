import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';

interface HelpBubble {
  id: string;
  pageRoute: string;
  elementSelector: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  isActive: boolean;
  order: number;
}

interface ContextualHelpProps {
  enabled?: boolean;
}

export default function ContextualHelp({ enabled = true }: ContextualHelpProps) {
  const [location] = useLocation();
  const [activeBubble, setActiveBubble] = useState<HelpBubble | null>(null);
  const [bubblePosition, setBubblePosition] = useState({ x: 0, y: 0 });
  const [currentHelpIndex, setCurrentHelpIndex] = useState(0);
  const [helpMode, setHelpMode] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Fetch help content for current page
  const { data: helpBubbles = [] } = useQuery({
    queryKey: ['/api/help/content', location],
    enabled: enabled && helpMode,
  });

  // Calculate bubble position relative to target element
  const calculatePosition = (element: Element, position: string) => {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    switch (position) {
      case 'top':
        return {
          x: rect.left + scrollLeft + rect.width / 2,
          y: rect.top + scrollTop - 10
        };
      case 'bottom':
        return {
          x: rect.left + scrollLeft + rect.width / 2,
          y: rect.bottom + scrollTop + 10
        };
      case 'left':
        return {
          x: rect.left + scrollLeft - 10,
          y: rect.top + scrollTop + rect.height / 2
        };
      case 'right':
        return {
          x: rect.right + scrollLeft + 10,
          y: rect.top + scrollTop + rect.height / 2
        };
      default:
        return {
          x: rect.left + scrollLeft + rect.width / 2,
          y: rect.bottom + scrollTop + 10
        };
    }
  };

  // Show help bubble for specific element
  const showHelpBubble = (bubble: HelpBubble) => {
    const element = document.querySelector(bubble.elementSelector);
    if (!element) return;

    const position = calculatePosition(element, bubble.position);
    setBubblePosition(position);
    setActiveBubble(bubble);

    // Highlight the target element
    element.classList.add('help-highlight');
    setTimeout(() => {
      element.classList.remove('help-highlight');
    }, 3000);
  };

  // Navigate through help bubbles
  const nextHelpBubble = () => {
    if (currentHelpIndex < helpBubbles.length - 1) {
      const nextIndex = currentHelpIndex + 1;
      setCurrentHelpIndex(nextIndex);
      showHelpBubble(helpBubbles[nextIndex]);
    }
  };

  const previousHelpBubble = () => {
    if (currentHelpIndex > 0) {
      const prevIndex = currentHelpIndex - 1;
      setCurrentHelpIndex(prevIndex);
      showHelpBubble(helpBubbles[prevIndex]);
    }
  };

  // Start help tour
  const startHelpTour = () => {
    if (helpBubbles.length > 0) {
      setHelpMode(true);
      setCurrentHelpIndex(0);
      showHelpBubble(helpBubbles[0]);
    }
  };

  // End help tour
  const endHelpTour = () => {
    setHelpMode(false);
    setActiveBubble(null);
    setCurrentHelpIndex(0);
  };

  // Handle click outside bubble to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bubbleRef.current && !bubbleRef.current.contains(event.target as Node)) {
        setActiveBubble(null);
      }
    };

    if (activeBubble) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeBubble]);

  // Auto-show help on new pages if user hasn't seen it
  useEffect(() => {
    const hasSeenHelp = localStorage.getItem(`help-seen-${location}`);
    if (!hasSeenHelp && helpBubbles.length > 0 && enabled) {
      // Auto-show help after a brief delay
      const timer = setTimeout(() => {
        if (helpBubbles.length > 0) {
          showHelpBubble(helpBubbles[0]);
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [location, helpBubbles, enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* Help Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 left-4 z-50 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900"
        onClick={helpMode ? endHelpTour : startHelpTour}
      >
        <HelpCircle className="w-4 h-4 mr-2" />
        {helpMode ? 'End Help' : 'Show Help'}
      </Button>

      {/* Help Bubble */}
      {activeBubble && (
        <div
          ref={bubbleRef}
          className="fixed z-50 pointer-events-auto"
          style={{
            left: bubblePosition.x,
            top: bubblePosition.y,
            transform: 'translate(-50%, -100%)',
            maxWidth: '320px',
          }}
        >
          <Card className="shadow-lg border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {activeBubble.title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActiveBubble(null);
                    localStorage.setItem(`help-seen-${location}`, 'true');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-sm mb-4">
                {activeBubble.content}
              </CardDescription>
              
              {helpMode && helpBubbles.length > 1 && (
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {currentHelpIndex + 1} of {helpBubbles.length}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={previousHelpBubble}
                      disabled={currentHelpIndex === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextHelpBubble}
                      disabled={currentHelpIndex === helpBubbles.length - 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Bubble Arrow */}
          <div 
            className={`absolute w-3 h-3 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 transform rotate-45 ${
              activeBubble.position === 'top' ? 'bottom-[-6px] left-1/2 -translate-x-1/2' :
              activeBubble.position === 'bottom' ? 'top-[-6px] left-1/2 -translate-x-1/2' :
              activeBubble.position === 'left' ? 'right-[-6px] top-1/2 -translate-y-1/2' :
              'left-[-6px] top-1/2 -translate-y-1/2'
            }`}
          />
        </div>
      )}

      {/* Help Highlight Styles */}
      <style jsx={true} global={true}>{`
        .help-highlight {
          outline: 2px solid #3b82f6 !important;
          outline-offset: 2px !important;
          border-radius: 4px !important;
          background-color: rgba(59, 130, 246, 0.1) !important;
          transition: all 0.3s ease !important;
        }
        
        .help-highlight::before {
          content: '';
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          border: 2px solid #3b82f6;
          border-radius: 6px;
          pointer-events: none;
          animation: helpPulse 2s infinite;
        }
        
        @keyframes helpPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.02); }
        }
      `}</style>
    </>
  );
}

// Hook for manual help trigger
export function useContextualHelp() {
  const [helpVisible, setHelpVisible] = useState(false);

  const showHelp = (elementSelector: string, content: string, title?: string) => {
    const element = document.querySelector(elementSelector);
    if (!element) return;

    // Create temporary help bubble
    const helpBubble: HelpBubble = {
      id: 'manual-help',
      pageRoute: window.location.pathname,
      elementSelector,
      title: title || 'Help',
      content,
      position: 'bottom',
      isActive: true,
      order: 0,
    };

    // Dispatch custom event to show help
    window.dispatchEvent(new CustomEvent('show-contextual-help', { 
      detail: helpBubble 
    }));
  };

  const hideHelp = () => {
    setHelpVisible(false);
  };

  return { showHelp, hideHelp, helpVisible };
}