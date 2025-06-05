import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, X, Target, Lightbulb } from 'lucide-react';

interface TutorialTooltipProps {
  isVisible: boolean;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  targetElement?: string;
  step: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  showSkip?: boolean;
  highlight?: boolean;
}

export default function TutorialTooltip({
  isVisible,
  title,
  content,
  position,
  targetElement,
  step,
  totalSteps,
  onNext,
  onPrevious,
  onClose,
  showSkip = true,
  highlight = false
}: TutorialTooltipProps) {
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && targetElement) {
      const target = document.querySelector(targetElement);
      if (target && tooltipRef.current) {
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        
        let top = 0;
        let left = 0;

        switch (position) {
          case 'top':
            top = targetRect.top - tooltipRect.height - 10;
            left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
            break;
          case 'bottom':
            top = targetRect.bottom + 10;
            left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
            break;
          case 'left':
            top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
            left = targetRect.left - tooltipRect.width - 10;
            break;
          case 'right':
            top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
            left = targetRect.right + 10;
            break;
        }

        // Ensure tooltip stays within viewport
        const padding = 10;
        top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));
        left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));

        setTooltipPosition({ top, left });

        // Add highlight effect to target element
        if (highlight) {
          target.classList.add('tutorial-highlight');
        }
      }
    }

    return () => {
      if (targetElement && highlight) {
        const target = document.querySelector(targetElement);
        if (target) {
          target.classList.remove('tutorial-highlight');
        }
      }
    };
  }, [isVisible, targetElement, position, highlight]);

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 max-w-sm"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        <Card className="shadow-xl border-2 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Target className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                </div>
                <Badge variant="outline" className="text-xs">
                  Step {step} of {totalSteps}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-sm text-muted-foreground">{content}</p>
              
              {/* Tip indicator */}
              <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                <Lightbulb className="w-3 h-3" />
                <span>Interactive tutorial tip</span>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-4 pt-3 border-t">
              <div className="flex gap-1">
                {step > 1 && (
                  <Button variant="outline" size="sm" onClick={onPrevious}>
                    <ArrowLeft className="w-3 h-3 mr-1" />
                    Back
                  </Button>
                )}
                {showSkip && (
                  <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
                    Skip
                  </Button>
                )}
              </div>
              
              <Button size="sm" onClick={onNext}>
                {step === totalSteps ? 'Finish' : 'Next'}
                {step < totalSteps && <ArrowRight className="w-3 h-3 ml-1" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Arrow pointer */}
        <div
          className={`absolute w-3 h-3 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rotate-45 ${
            position === 'top' ? 'bottom-[-6px] left-1/2 transform -translate-x-1/2' :
            position === 'bottom' ? 'top-[-6px] left-1/2 transform -translate-x-1/2' :
            position === 'left' ? 'right-[-6px] top-1/2 transform -translate-y-1/2' :
            'left-[-6px] top-1/2 transform -translate-y-1/2'
          }`}
        />
      </div>

      {/* CSS for highlight effect */}
      <style jsx global>{`
        .tutorial-highlight {
          position: relative;
          z-index: 45;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5) !important;
          border-radius: 8px !important;
          animation: pulse-highlight 2s infinite;
        }
        
        @keyframes pulse-highlight {
          0%, 100% { 
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5); 
          }
          50% { 
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3); 
          }
        }
      `}</style>
    </>
  );
}