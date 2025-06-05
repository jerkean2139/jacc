import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpCircle, BookOpen, Lightbulb, MessageSquare, Wand2, Target, ArrowRight } from "lucide-react";

export default function PromptTutorial() {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      title: "What are AI Prompts?",
      content: "Think of prompts as instructions you give to your AI assistant. Just like telling a human assistant exactly what you need, prompts help the AI understand your specific requirements and deliver better results.",
      example: "Instead of saying 'help with marketing', say 'Create a social media post for a restaurant promoting their weekend brunch special with mouth-watering food descriptions'."
    },
    {
      title: "Why Use Prompt Templates?",
      content: "Templates save you time and ensure consistent, professional results. They're like having expert-written scripts that you can customize for any situation.",
      example: "A sales script template helps you handle objections the same professional way every time, whether you're talking to a restaurant owner or a retail store manager."
    },
    {
      title: "Three Types of Prompts",
      content: "Internal Strategy prompts help you plan and analyze. Client-Facing prompts create materials for your customers. Marketing prompts help you find and convert new prospects.",
      example: "Use Internal for calculating rates, Client-Facing for creating presentations, and Marketing for writing follow-up emails."
    },
    {
      title: "How to Use Variables",
      content: "Variables in brackets like [BUSINESS_TYPE] let you customize templates for different situations. Just replace the bracketed text with specific details.",
      example: "[BUSINESS_TYPE] becomes 'Italian Restaurant' or 'Auto Repair Shop' - making each prompt perfectly tailored."
    },
    {
      title: "Getting Better Results",
      content: "The more specific your input, the better your output. Include context, desired tone, and specific requirements for professional results.",
      example: "Good: 'Write a follow-up email for a restaurant owner who expressed interest in lower processing fees but hasn't responded in 2 weeks. Keep it helpful, not pushy.'"
    }
  ];

  return (
    <TooltipProvider>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <BookOpen className="h-4 w-4" />
            New to AI Prompts?
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              AI Prompts Made Simple
            </DialogTitle>
            <DialogDescription>
              A beginner-friendly guide to getting the most out of AI assistance
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="tutorial" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tutorial">Step-by-Step Guide</TabsTrigger>
              <TabsTrigger value="templates">Template Types</TabsTrigger>
              <TabsTrigger value="tips">Pro Tips</TabsTrigger>
            </TabsList>

            <TabsContent value="tutorial" className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  Step {currentStep + 1} of {tutorialSteps.length}
                </Badge>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                  >
                    Previous
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => setCurrentStep(Math.min(tutorialSteps.length - 1, currentStep + 1))}
                    disabled={currentStep === tutorialSteps.length - 1}
                  >
                    Next <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{tutorialSteps[currentStep].title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    {tutorialSteps[currentStep].content}
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Example:
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {tutorialSteps[currentStep].example}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-500" />
                      Internal Strategy Prompts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      These help you analyze, plan, and make better business decisions.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div>• <strong>Rate Calculations:</strong> Figure out competitive pricing instantly</div>
                      <div>• <strong>Market Research:</strong> Get current industry insights and trends</div>
                      <div>• <strong>Lead Scoring:</strong> Evaluate prospect quality systematically</div>
                      <div>• <strong>Territory Planning:</strong> Build targeted prospect lists efficiently</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-green-500" />
                      Client-Facing Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Create professional materials to share with your customers.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div>• <strong>Social Media:</strong> Posts with custom images for client businesses</div>
                      <div>• <strong>Presentations:</strong> Professional slides with supporting graphics</div>
                      <div>• <strong>Website Content:</strong> Banners and copy that convert visitors</div>
                      <div>• <strong>Newsletters:</strong> Engaging content with header images</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wand2 className="h-5 w-5 text-purple-500" />
                      Marketing & Sales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Proven frameworks for finding and converting prospects.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div>• <strong>Value Stacking:</strong> Create irresistible offers using Hormozi methods</div>
                      <div>• <strong>Sales Scripts:</strong> NEPQ questioning techniques that convert</div>
                      <div>• <strong>Email Sequences:</strong> Cold outreach that builds relationships</div>
                      <div>• <strong>Social Outreach:</strong> LinkedIn and SMS that gets responses</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tips" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Getting Professional Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">✓ Do This</h4>
                      <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        <li>• Be specific about your industry and business type</li>
                        <li>• Include the desired tone (professional, friendly, urgent)</li>
                        <li>• Mention your target audience clearly</li>
                        <li>• Add context about the situation or goal</li>
                        <li>• Use the variable placeholders [LIKE_THIS] for easy customization</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">✗ Avoid This</h4>
                      <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        <li>• Vague requests like "write something about payments"</li>
                        <li>• Forgetting to specify the audience or purpose</li>
                        <li>• Making requests too long or complicated</li>
                        <li>• Not reviewing and customizing the output</li>
                        <li>• Using the same exact template without personalization</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Start Checklist</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">1</div>
                        <span>Browse the template categories and find one that fits your current need</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">2</div>
                        <span>Click the template button to load it into your chat</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">3</div>
                        <span>Replace the [VARIABLES] with your specific details</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">4</div>
                        <span>Send the message and review the AI's response</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">5</div>
                        <span>Ask for adjustments if needed, like "make it more professional" or "add more details about security"</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

// Tooltip component for individual prompt elements
export function PromptTooltip({ children, content, side = "top" }: { 
  children: React.ReactNode; 
  content: string; 
  side?: "top" | "bottom" | "left" | "right" 
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}