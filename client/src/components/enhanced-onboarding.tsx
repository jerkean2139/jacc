import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, ArrowRight, Star, Target, Users, TrendingUp } from 'lucide-react';
import { useAccessibility } from './accessibility-provider';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
  optional?: boolean;
  estimatedTime: string;
}

interface OnboardingProps {
  userType: 'agent' | 'admin' | 'new_user';
  onComplete: () => void;
  onSkip: () => void;
}

export function EnhancedOnboarding({ userType, onComplete, onSkip }: OnboardingProps) {
  const { announceToScreenReader } = useAccessibility();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const getStepsForUserType = (type: string): OnboardingStep[] => {
    const baseSteps = [
      {
        id: 'welcome',
        title: 'Welcome to JACC',
        description: 'Your AI-powered merchant services assistant',
        icon: Star,
        completed: false,
        estimatedTime: '1 min'
      }
    ];

    if (type === 'agent') {
      return [
        ...baseSteps,
        {
          id: 'profile',
          title: 'Complete Your Profile',
          description: 'Add your contact information and specialties',
          icon: Users,
          completed: false,
          estimatedTime: '2 min'
        },
        {
          id: 'first_chat',
          title: 'Start Your First Conversation',
          description: 'Ask JACC about merchant processing rates',
          icon: Target,
          completed: false,
          estimatedTime: '3 min'
        },
        {
          id: 'document_upload',
          title: 'Upload Training Materials',
          description: 'Add documents to enhance AI responses',
          icon: TrendingUp,
          completed: false,
          optional: true,
          estimatedTime: '5 min'
        }
      ];
    }

    if (type === 'admin') {
      return [
        ...baseSteps,
        {
          id: 'team_setup',
          title: 'Set Up Your Team',
          description: 'Invite agents and configure permissions',
          icon: Users,
          completed: false,
          estimatedTime: '5 min'
        },
        {
          id: 'knowledge_base',
          title: 'Configure Knowledge Base',
          description: 'Add Q&A entries and prompt templates',
          icon: Target,
          completed: false,
          estimatedTime: '10 min'
        },
        {
          id: 'analytics_review',
          title: 'Review Analytics Dashboard',
          description: 'Understand usage metrics and insights',
          icon: TrendingUp,
          completed: false,
          estimatedTime: '3 min'
        }
      ];
    }

    return [
      ...baseSteps,
      {
        id: 'explore_features',
        title: 'Explore Key Features',
        description: 'Discover chat, document search, and insights',
        icon: Target,
        completed: false,
        estimatedTime: '5 min'
      }
    ];
  };

  const [steps] = useState(() => getStepsForUserType(userType));
  const progress = (completedSteps.size / steps.length) * 100;

  useEffect(() => {
    announceToScreenReader(`Onboarding started. ${steps.length} steps total.`);
  }, []);

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
    announceToScreenReader(`Step "${steps.find(s => s.id === stepId)?.title}" completed`);
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
    announceToScreenReader(`Navigated to step ${index + 1}: ${steps[index].title}`);
  };

  const isStepAccessible = (index: number) => {
    if (index === 0) return true;
    return completedSteps.has(steps[index - 1].id) || steps[index].optional;
  };

  const allRequiredStepsComplete = steps
    .filter(step => !step.optional)
    .every(step => completedSteps.has(step.id));

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Progress Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Welcome to JACC</h1>
        <p className="text-lg text-muted-foreground">
          Let's get you set up for success with your AI merchant services assistant
        </p>
        <div className="space-y-2">
          <Progress value={progress} className="h-3" aria-label="Onboarding progress" />
          <p className="text-sm text-muted-foreground">
            {completedSteps.size} of {steps.length} steps completed
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Steps Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Setup Steps</CardTitle>
              <CardDescription>
                Complete these steps to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {steps.map((step, index) => {
                const isCompleted = completedSteps.has(step.id);
                const isCurrent = index === currentStep;
                const isAccessible = isStepAccessible(index);
                
                return (
                  <button
                    key={step.id}
                    onClick={() => isAccessible && handleStepClick(index)}
                    disabled={!isAccessible}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      isCurrent 
                        ? 'border-primary bg-primary/5' 
                        : isCompleted 
                        ? 'border-green-200 bg-green-50' 
                        : isAccessible
                        ? 'border-gray-200 hover:border-gray-300'
                        : 'border-gray-100 opacity-50 cursor-not-allowed'
                    }`}
                    aria-label={`Step ${index + 1}: ${step.title}${isCompleted ? ' (completed)' : ''}`}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    <div className="flex items-center gap-3">
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{step.title}</span>
                          {step.optional && (
                            <Badge variant="secondary" className="text-xs">Optional</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{step.estimatedTime}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Current Step Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {steps[currentStep] && React.createElement(steps[currentStep].icon, { className: "h-6 w-6 text-primary" })}
                </div>
                <div>
                  <CardTitle className="text-xl">{steps[currentStep]?.title}</CardTitle>
                  <CardDescription className="text-base">
                    {steps[currentStep]?.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step-specific content */}
              {currentStep === 0 && steps[currentStep] && (
                <div className="space-y-4">
                  <p className="text-lg">
                    JACC is your intelligent assistant for merchant services, powered by advanced AI 
                    to help you close more deals and provide better customer service.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">AI-Powered Chat</h4>
                      <p className="text-sm text-muted-foreground">
                        Get instant answers about processing rates, equipment, and industry insights
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Real-Time Research</h4>
                      <p className="text-sm text-muted-foreground">
                        Access current market data and competitive analysis on demand
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Document Intelligence</h4>
                      <p className="text-sm text-muted-foreground">
                        Upload and analyze merchant statements, contracts, and proposals
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Business Insights</h4>
                      <p className="text-sm text-muted-foreground">
                        Generate detailed reports and recommendations for prospects
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={onSkip}
                  className="gap-2"
                >
                  Skip Setup
                </Button>
                
                <div className="flex gap-3">
                  {!completedSteps.has(steps[currentStep]?.id) && (
                    <Button
                      onClick={() => handleStepComplete(steps[currentStep].id)}
                      className="gap-2"
                    >
                      Complete Step
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {allRequiredStepsComplete && (
                    <Button
                      onClick={onComplete}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      Finish Setup
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Achievement Celebration */}
      {allRequiredStepsComplete && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div className="text-green-600">
                <CheckCircle className="h-12 w-12 mx-auto" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-green-800">Congratulations!</h3>
                <p className="text-green-700">
                  You've completed the onboarding process. You're ready to start using JACC!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}