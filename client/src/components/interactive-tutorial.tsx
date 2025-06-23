import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle, 
  MessageSquare, 
  Calculator,
  Mic,
  Target,
  Zap,
  MousePointer,
  Sparkles,
  Users,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import VoiceTestDemo from './voice-test-demo';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  action?: string;
  targetSelector?: string;
  highlightElement?: boolean;
  nextButton?: string;
  completionCheck?: () => boolean;
}

export default function InteractiveTutorial() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showVoiceTest, setShowVoiceTest] = useState(false);

  // Check if user has completed tutorial
  useEffect(() => {
    const tutorialStatus = localStorage.getItem(`jacc-tutorial-${user?.id}`);
    if (!tutorialStatus && user) {
      // Auto-start tutorial for new users after a brief delay
      setTimeout(() => setIsActive(true), 2000);
    } else if (tutorialStatus === 'completed' || tutorialStatus === 'never-show') {
      setIsCompleted(true);
    }
  }, [user]);

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to JACC! 🚀',
      description: 'Your AI-powered merchant services assistant',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Welcome to JACC!
            </h3>
            <p className="text-muted-foreground text-lg">
              You're about to discover how AI can transform your merchant services success at Tracer Co Card.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg">
              <MessageSquare className="w-8 h-8 text-blue-600 mb-3" />
              <div className="font-semibold text-blue-800 dark:text-blue-200">AI Assistant</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Instant expert answers</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg">
              <Calculator className="w-8 h-8 text-green-600 mb-3" />
              <div className="font-semibold text-green-800 dark:text-green-200">Rate Calculator</div>
              <div className="text-sm text-green-600 dark:text-green-400">Real-time ISO AMP data</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg">
              <Mic className="w-8 h-8 text-purple-600 mb-3" />
              <div className="font-semibold text-purple-800 dark:text-purple-200">Voice Features</div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Hands-free operation</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg">
              <TrendingUp className="w-8 h-8 text-orange-600 mb-3" />
              <div className="font-semibold text-orange-800 dark:text-orange-200">Sales Tools</div>
              <div className="text-sm text-orange-600 dark:text-orange-400">Instant proposals</div>
            </div>
          </div>

          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription>
              This interactive tutorial will show you exactly how to use JACC to close more deals and boost your sales success.
            </AlertDescription>
          </Alert>
        </div>
      ),
      nextButton: "Let's Get Started!"
    },
    {
      id: 'chat-demo',
      title: 'AI Chat Assistant Demo',
      description: 'See how the AI answers merchant services questions',
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-3">Try These Sample Questions:</h4>
            <div className="space-y-2">
              <div 
                className="p-3 bg-white dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors border border-gray-200 dark:border-gray-700"
                onClick={() => {
                  // Simulate typing in chat
                  const chatInput = document.querySelector('textarea') as HTMLTextAreaElement;
                  if (chatInput) {
                    chatInput.value = "Find TRX processing information";
                    chatInput.focus();
                  }
                }}
              >
                <div className="text-sm font-medium">"Find TRX processing information"</div>
                <div className="text-xs text-muted-foreground mt-1">Click to try this question</div>
              </div>
              
              <div 
                className="p-3 bg-white dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors border border-gray-200 dark:border-gray-700"
                onClick={() => {
                  const chatInput = document.querySelector('textarea') as HTMLTextAreaElement;
                  if (chatInput) {
                    chatInput.value = "What do you know about Clearent pricing?";
                    chatInput.focus();
                  }
                }}
              >
                <div className="text-sm font-medium">"What do you know about Clearent pricing?"</div>
                <div className="text-xs text-muted-foreground mt-1">Click to try this question</div>
              </div>
              
              <div 
                className="p-3 bg-white dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors border border-gray-200 dark:border-gray-700"
                onClick={() => {
                  const chatInput = document.querySelector('textarea') as HTMLTextAreaElement;
                  if (chatInput) {
                    chatInput.value = "Tell me about Sky Tab and Shift 4 for restaurants";
                    chatInput.focus();
                  }
                }}
              >
                <div className="text-sm font-medium">"Tell me about Sky Tab and Shift 4 for restaurants"</div>
                <div className="text-xs text-muted-foreground mt-1">Click to try this question</div>
              </div>
              
              <div 
                className="p-3 bg-white dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors border border-gray-200 dark:border-gray-700"
                onClick={() => {
                  const chatInput = document.querySelector('textarea') as HTMLTextAreaElement;
                  if (chatInput) {
                    chatInput.value = "What are TSYS offerings?";
                    chatInput.focus();
                  }
                }}
              >
                <div className="text-sm font-medium">"What are TSYS offerings?"</div>
                <div className="text-xs text-muted-foreground mt-1">Click to try this question</div>
              </div>
            </div>
          </div>
          
          <Alert>
            <MessageSquare className="h-4 w-4" />
            <AlertDescription>
              <strong>Pro Tip:</strong> The AI has access to all Tracer Co Card documentation and current market data. Be specific with business details for the best answers.
            </AlertDescription>
          </Alert>
        </div>
      ),
      action: 'Click a sample question above to see the AI in action',
      targetSelector: 'textarea',
      highlightElement: true,
      nextButton: 'Show Me the Calculator'
    },
    {
      id: 'calculator-tour',
      title: 'Rate Calculator Tour',
      description: 'Your secret weapon for competitive presentations',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-lg font-semibold mb-2">Professional Rate Calculator</h4>
            <p className="text-muted-foreground">
              Generate real-time rate comparisons with authentic ISO AMP data
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="font-semibold text-green-700 dark:text-green-300 mb-1">Live Market Data</div>
              <div className="text-sm text-green-600 dark:text-green-400">Real ISO AMP rates updated in real-time</div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="font-semibold text-blue-700 dark:text-blue-300 mb-1">Savings Analysis</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Multi-scenario projections with ROI calculations</div>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="font-semibold text-purple-700 dark:text-purple-300 mb-1">Equipment Recommendations</div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Tailored terminal suggestions based on business needs</div>
            </div>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h5 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">Perfect for Sales Presentations:</h5>
            <div className="text-sm text-yellow-600 dark:text-yellow-400 space-y-1">
              <div>• Share screen during virtual meetings</div>
              <div>• Input prospect data live during calls</div>
              <div>• Generate instant professional proposals</div>
              <div>• Show real competitive savings</div>
            </div>
          </div>
        </div>
      ),
      action: 'Click the button below to open the rate calculator',
      nextButton: 'Open Calculator'
    },
    {
      id: 'voice-features',
      title: 'Voice Features Demo',
      description: 'Hands-free operation for busy sales professionals',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Mic className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-lg font-semibold mb-2">Talk to JACC</h4>
            <p className="text-muted-foreground">
              Perfect for multitasking during sales calls and presentations
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-3 mb-2">
                <Mic className="w-5 h-5 text-orange-600" />
                <div className="font-semibold text-orange-700 dark:text-orange-300">Voice Commands</div>
              </div>
              <div className="text-sm text-orange-600 dark:text-orange-400 space-y-1">
                <div>• "Calculate rates for restaurant processing 50K monthly"</div>
                <div>• "What is interchange plus pricing?"</div>
                <div>• "Show me terminal options for mobile business"</div>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-purple-600" />
                <div className="font-semibold text-purple-700 dark:text-purple-300">Text-to-Speech</div>
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">
                JACC reads responses aloud automatically - perfect for hands-free operation during calls
              </div>
            </div>
          </div>
          
          <Alert>
            <Mic className="h-4 w-4" />
            <AlertDescription>
              <strong>First Time Setup:</strong> Your browser will ask for microphone permission. Click "Allow" to enable voice features for the best JACC experience.
            </AlertDescription>
          </Alert>
        </div>
      ),
      nextButton: 'Test Voice Features'
    },
    {
      id: 'success-tips',
      title: 'Sales Success Tips',
      description: 'Pro strategies for maximizing your JACC results',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-lg font-semibold mb-2">Boost Your Sales Success</h4>
            <p className="text-muted-foreground">
              Expert strategies from top-performing Tracer Co Card agents
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="font-semibold text-green-700 dark:text-green-300 mb-2">🎯 During Prospect Calls</div>
              <div className="text-sm text-green-600 dark:text-green-400 space-y-1">
                <div>• Use voice input to ask JACC questions while listening</div>
                <div>• Get instant competitive analysis without losing momentum</div>
                <div>• Generate proposals while still on the call</div>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="font-semibold text-blue-700 dark:text-blue-300 mb-2">📊 For Presentations</div>
              <div className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                <div>• Share your screen and run calculations live</div>
                <div>• Input their current rates to show real savings</div>
                <div>• Use authentic ISO AMP data for credibility</div>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="font-semibold text-purple-700 dark:text-purple-300 mb-2">⚡ Quick Wins</div>
              <div className="text-sm text-purple-600 dark:text-purple-400 space-y-1">
                <div>• Ask specific questions: "Rate for retail $25K monthly"</div>
                <div>• Use industry context for better AI responses</div>
                <div>• Reference competitor names for detailed comparisons</div>
              </div>
            </div>
          </div>
        </div>
      ),
      nextButton: 'Ready to Sell!'
    },
    {
      id: 'completion',
      title: 'Tutorial Complete! 🎉',
      description: 'You\'re now ready to leverage JACC for sales success',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Congratulations!
            </h3>
            <p className="text-muted-foreground text-lg">
              You've completed the Tracer tutorial and are ready to transform your merchant services sales with AI power.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <Button 
              className="w-full" 
              onClick={() => setLocation('/calculator')}
            >
              <Calculator className="w-4 h-4 mr-2" />
              Try the Rate Calculator
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.open('/guide', '_blank')}
            >
              <Users className="w-4 h-4 mr-2" />
              View Complete User Guide
            </Button>
          </div>
          
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              <strong>What's Next?</strong> Start using JACC with real prospects! The AI learns from interactions and gets smarter over time. Remember - you can restart this tutorial anytime from the help menu.
            </AlertDescription>
          </Alert>
        </div>
      ),
      nextButton: 'Start Selling with JACC!'
    }
  ];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      // Special handling for voice features step
      if (tutorialSteps[currentStep]?.id === 'voice-features') {
        setShowVoiceTest(true);
        return;
      }
      
      setCompletedSteps(prev => [...prev, tutorialSteps[currentStep].id]);
      setCurrentStep(prev => prev + 1);
      
      // Special handling for calculator step
      if (tutorialSteps[currentStep + 1]?.id === 'calculator-tour') {
        // Could add specific calculator demo logic here
      }
    } else {
      // Complete tutorial
      localStorage.setItem(`jacc-tutorial-${user?.id}`, 'completed');
      setIsActive(false);
      setIsCompleted(true);
    }
  };

  const handleVoiceTestComplete = () => {
    setShowVoiceTest(false);
    setCompletedSteps(prev => [...prev, tutorialSteps[currentStep].id]);
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(`jacc-tutorial-${user?.id}`, 'skipped');
    setIsActive(false);
    setIsCompleted(true);
  };

  const handleNeverShowAgain = () => {
    localStorage.setItem(`jacc-tutorial-${user?.id}`, 'never-show');
    setIsActive(false);
    setIsCompleted(true);
  };

  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;
  const currentStepData = tutorialSteps[currentStep];

  // Remove duplicate restart button - only show in sidebar
  if (isCompleted && !isActive) {
    return null;
  }

  return (
    <>
      <Dialog open={isActive} onOpenChange={setIsActive}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {currentStep + 1}
                  </span>
                </div>
                <div>
                  <DialogTitle className="text-left text-xl">{currentStepData.title}</DialogTitle>
                  <p className="text-left text-muted-foreground">{currentStepData.description}</p>
                </div>
              </div>
              <Badge variant="secondary" className="px-3 py-1">
                Interactive Tutorial
              </Badge>
            </div>
            
            <div className="space-y-3">
              <Progress value={progress} className="w-full h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Step {currentStep + 1} of {tutorialSteps.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
            </div>
          </DialogHeader>

          <div className="py-6">
            {currentStepData.content}
            
            {currentStepData.action && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                  <MousePointer className="w-5 h-5" />
                  <span className="font-semibold">Try This:</span>
                </div>
                <p className="text-blue-600 dark:text-blue-400">
                  {currentStepData.action}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
              
              {currentStep < tutorialSteps.length - 1 && (
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
                    Skip Tutorial
                  </Button>
                  <Button variant="ghost" onClick={handleNeverShowAgain} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                    I'm a pro, don't show this again
                  </Button>
                </div>
              )}
            </div>

            <Button onClick={handleNext} className="px-6">
              {currentStepData.nextButton || 'Next'}
              {currentStep < tutorialSteps.length - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Voice Test Demo Dialog */}
      <Dialog open={showVoiceTest} onOpenChange={setShowVoiceTest}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <VoiceTestDemo 
            onComplete={handleVoiceTestComplete}
            onClose={() => setShowVoiceTest(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}