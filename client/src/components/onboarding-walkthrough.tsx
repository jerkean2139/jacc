import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Play, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle, 
  MessageSquare, 
  Calculator,
  Mic,
  FileText,
  Target,
  Zap,
  BookOpen,
  X,
  Lightbulb,
  MousePointer
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  target?: string;
  action?: string;
  nextButton?: string;
  skipButton?: boolean;
  highlight?: boolean;
}

export default function OnboardingWalkthrough() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    const onboardingStatus = localStorage.getItem(`jacc-onboarding-${user?.id}`);
    // Always set as seen onboarding to prevent popup - only show via manual trigger
    setHasSeenOnboarding(true);
    
    // DISABLED: No automatic popups whatsoever
    // Only manual triggers allowed via user interface buttons
    // if (onboardingStatus === 'show_requested' && user) {
    //   setTimeout(() => setIsOpen(true), 1000);
    //   localStorage.setItem(`jacc-onboarding-${user?.id}`, 'completed');
    // }
  }, [user]);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Tracer! 🎉',
      description: 'Your AI-powered merchant services assistant',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Welcome to Tracer!</h3>
            <p className="text-muted-foreground">
              You're about to discover the most powerful merchant services platform at Tracer Co Card.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <MessageSquare className="w-6 h-6 text-blue-600 mb-2" />
              <div className="text-sm font-semibold">AI Assistant</div>
              <div className="text-xs text-muted-foreground">Instant answers</div>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <Calculator className="w-6 h-6 text-green-600 mb-2" />
              <div className="text-sm font-semibold">Rate Calculator</div>
              <div className="text-xs text-muted-foreground">Real-time data</div>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <Mic className="w-6 h-6 text-purple-600 mb-2" />
              <div className="text-sm font-semibold">Voice Features</div>
              <div className="text-xs text-muted-foreground">Hands-free</div>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <FileText className="w-6 h-6 text-orange-600 mb-2" />
              <div className="text-sm font-semibold">Smart Docs</div>
              <div className="text-xs text-muted-foreground">Instant access</div>
            </div>
          </div>
        </div>
      ),
      nextButton: "Let's Start!",
    },
    {
      id: 'interface-overview',
      title: 'Your JACC Interface',
      description: 'Main areas and navigation',
      content: (
        <div className="space-y-4">
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              JACC is designed for sales professionals who need quick, accurate merchant services information.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold">Chat Interface</div>
                <div className="text-sm text-muted-foreground">Main area for AI conversations</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Calculator className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="font-semibold">Rate Calculator</div>
                <div className="text-sm text-muted-foreground">Advanced merchant services calculations</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <Target className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold">Sidebar Navigation</div>
                <div className="text-sm text-muted-foreground">Chat history and organization</div>
              </div>
            </div>
          </div>
        </div>
      ),
      target: '.main-interface',
      nextButton: 'Show Me More'
    },
    {
      id: 'chat-assistant',
      title: 'AI Chat Assistant',
      description: 'Your intelligent merchant services companion',
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 rounded-lg">
            <h4 className="font-semibold mb-2">Popular Searches</h4>
            <div className="text-sm space-y-1">
              <div>• "Find TRX processing information"</div>
              <div>• "What do you know about Clearent pricing?"</div>
              <div>• "Tell me about Sky Tab and Shift 4 for restaurants"</div>
              <div>• "What are TSYS offerings?"</div>
            </div>
          </div>
          
          <Alert>
            <MessageSquare className="h-4 w-4" />
            <AlertDescription>
              <strong>Pro Tip:</strong> The AI has access to all Tracer Co Card documentation and current market data. Be specific with your questions for best results.
            </AlertDescription>
          </Alert>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mic className="w-4 h-4" />
            <span>Voice input available - perfect for calls with prospects!</span>
          </div>
        </div>
      ),
      action: 'Try asking a question in the chat box below',
      nextButton: 'Got It!'
    },
    {
      id: 'rate-calculator',
      title: 'Rate Calculator',
      description: 'Real-time merchant services calculations',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="font-semibold text-blue-700 dark:text-blue-300 mb-1">Live ISO AMP Data</div>
              <div className="text-sm text-muted-foreground">Real-time market rates</div>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="font-semibold text-green-700 dark:text-green-300 mb-1">Savings Analysis</div>
              <div className="text-sm text-muted-foreground">Multi-scenario projections</div>
            </div>
          </div>
          
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Perfect for:</h4>
            <div className="text-sm space-y-1">
              <div>• Live presentations with prospects</div>
              <div>• Competitive rate comparisons</div>
              <div>• Equipment recommendations</div>
              <div>• Professional proposal generation</div>
            </div>
          </div>
          
          <Alert>
            <Calculator className="h-4 w-4" />
            <AlertDescription>
              Access the calculator anytime from the navigation menu or ask the AI: "Calculate rates for..."
            </AlertDescription>
          </Alert>
        </div>
      ),
      nextButton: 'Show Me Calculator'
    },
    {
      id: 'voice-features',
      title: 'Voice Capabilities',
      description: 'Hands-free operation for busy sales professionals',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mic className="w-6 h-6 text-orange-600" />
            </div>
            <h4 className="font-semibold mb-2">Talk to JACC</h4>
            <p className="text-sm text-muted-foreground">Perfect for multitasking during sales calls</p>
          </div>
          
          <div className="space-y-3">
            <div className="p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 rounded-lg">
              <div className="font-semibold mb-1">Voice Commands</div>
              <div className="text-sm">
                "Calculate rates for restaurant" • "What is interchange plus?" • "Show me terminals"
              </div>
            </div>
            
            <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg">
              <div className="font-semibold mb-1">Text-to-Speech</div>
              <div className="text-sm">
                JACC reads responses aloud - ideal for hands-free operation
              </div>
            </div>
          </div>
          
          <Alert>
            <Mic className="h-4 w-4" />
            <AlertDescription>
              <strong>First time?</strong> Your browser will ask for microphone permission. Click "Allow" to enable voice features.
            </AlertDescription>
          </Alert>
        </div>
      ),
      action: 'We\'ll test your microphone in the next step',
      nextButton: 'Test Voice Features'
    },
    {
      id: 'first-interaction',
      title: 'Try Your First Question',
      description: 'Let\'s practice with a real merchant services question',
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-lg">
            <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">Suggested First Questions:</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-white dark:bg-gray-800 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                "Find TRX processing information"
              </div>
              <div className="p-2 bg-white dark:bg-gray-800 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                "What do you know about Clearent pricing?"
              </div>
              <div className="p-2 bg-white dark:bg-gray-800 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                "What are TSYS offerings?"
              </div>
            </div>
          </div>
          
          <Alert>
            <MousePointer className="h-4 w-4" />
            <AlertDescription>
              Click any suggested question above, or type your own in the chat box. The AI is ready to help!
            </AlertDescription>
          </Alert>
        </div>
      ),
      action: 'Type or click a question to try JACC',
      nextButton: 'I Asked a Question!'
    },
    {
      id: 'completion',
      title: 'You\'re Ready to Sell! 🚀',
      description: 'Onboarding complete - time to boost your sales success',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Congratulations!</h3>
            <p className="text-muted-foreground">
              You've completed the Tracer onboarding. You're now ready to leverage AI for merchant services success.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" onClick={() => window.open('/guide', '_blank')}>
              <BookOpen className="w-4 h-4 mr-2" />
              User Guide
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open('/calculator', '_blank')}>
              <Calculator className="w-4 h-4 mr-2" />
              Try Calculator
            </Button>
          </div>
          
          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription>
              <strong>Next Steps:</strong> Start using JACC with real prospects. The AI learns from your interactions and gets smarter over time!
            </AlertDescription>
          </Alert>
        </div>
      ),
      nextButton: 'Start Selling!'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => [...prev, steps[currentStep].id]);
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete onboarding
      const status = dontShowAgain ? 'never_show' : 'completed';
      localStorage.setItem(`jacc-onboarding-${user?.id}`, status);
      setIsOpen(false);
      setHasSeenOnboarding(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    const status = dontShowAgain ? 'never_show' : 'skipped';
    localStorage.setItem(`jacc-onboarding-${user?.id}`, status);
    setIsOpen(false);
    setHasSeenOnboarding(true);
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  // Restart onboarding is now handled in sidebar navigation
  if (hasSeenOnboarding) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {currentStep + 1}
                </span>
              </div>
              <div>
                <DialogTitle className="text-left">{currentStepData.title}</DialogTitle>
                <DialogDescription className="text-left">
                  {currentStepData.description}
                </DialogDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSkip}
              className="bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-gray-600 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm"
              title="Don't show this tutorial again"
            >
              <X className="w-4 h-4 mr-1" />
              <span className="text-xs">Don't show again</span>
            </Button>
          </div>
          
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {currentStepData.content}
          
          {currentStepData.action && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <MousePointer className="w-4 h-4" />
                <span className="font-medium">Action:</span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                {currentStepData.action}
              </p>
            </div>
          )}
        </div>

        {/* Checkbox for "Don't show again" - moved to header for better visibility */}
        <div className="pt-4 border-t">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox 
              id="dont-show-again"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <label 
              htmlFor="dont-show-again"
              className="text-sm font-medium cursor-pointer select-none"
            >
              Don't show this tutorial again
            </label>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
              
              {currentStepData.skipButton !== false && currentStep < steps.length - 1 && (
                <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
                  Skip Tutorial
                </Button>
              )}
            </div>

            <Button onClick={handleNext}>
              {currentStepData.nextButton || 'Next'}
              {currentStep < steps.length - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}