import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Download,
  Save,
  Share,
  ThumbsUp,
  ThumbsDown,
  Bot,
  User,
  CheckCircle
} from "lucide-react";
import type { Message } from "@shared/schema";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
  actions?: Array<{
    type: 'save_to_folder' | 'download' | 'create_proposal';
    label: string;
    data?: any;
  }>;
}

export default function MessageBubble({ message, actions }: MessageBubbleProps) {
  const [feedback, setFeedback] = useState<'liked' | 'disliked' | null>(null);
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  // Don't render empty messages
  if (!message.content || message.content.trim() === '') {
    return null;
  }

  const handleAction = (actionType: string, data?: any) => {
    console.log('Action triggered:', actionType, data);
    // Implement action handling based on type
    switch (actionType) {
      case 'save_to_folder':
        // Open folder selection dialog
        break;
      case 'download':
        // Download the content/comparison
        break;
      case 'create_proposal':
        // Create client proposal
        break;
    }
  };

  const handleFeedback = (type: 'liked' | 'disliked') => {
    setFeedback(type);
    // TODO: Send feedback to backend
    console.log('Feedback:', type, 'for message:', message.id);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Check if message contains structured data (like rate comparisons)
  const hasStructuredData = message.content?.includes('Medicare Advantage') || 
                            message.content?.includes('rate comparison') ||
                            message.content?.includes('comparison table');

  return (
    <div className={cn(
      "flex items-start space-x-3 message-enter",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="navy-primary text-white">
            <Bot className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn("flex-1 max-w-3xl", isUser && "flex justify-end")}>
        <div className={cn(
          "rounded-2xl p-4 max-w-full",
          isUser 
            ? "navy-primary text-white rounded-tr-md" 
            : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-md"
        )}>
          {/* Message Content */}
          <div className="prose prose-sm max-w-none">
            {hasStructuredData && isAssistant ? (
              <div>
                <p className="mb-3">{message.content.split('\n')[0]}</p>
                
                {/* Mock Rate Comparison Table */}
                <Card className="mb-3">
                  <CardHeader className="py-2 px-3 bg-slate-50 dark:bg-slate-700">
                    <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                      Medicare Advantage Plans - Florida (Age 67)
                    </h4>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700 rounded-md">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">UnitedHealthcare AARP</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Plan G-1</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600 text-sm">$0/month</p>
                          <p className="text-xs text-slate-500">$1,500 deductible</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700 rounded-md">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">Humana Gold Plus</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">HMO Plan</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600 text-sm">$23/month</p>
                          <p className="text-xs text-slate-500">$0 deductible</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}
          </div>

          {/* Action Buttons for AI responses */}
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(action.type, action.data)}
                  className={cn(
                    "text-xs border-current",
                    isUser 
                      ? "border-white/20 text-white hover:bg-white/10" 
                      : "border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                  )}
                >
                  {action.type === 'save_to_folder' && <Save className="w-3 h-3 mr-1" />}
                  {action.type === 'download' && <Download className="w-3 h-3 mr-1" />}
                  {action.type === 'create_proposal' && <Share className="w-3 h-3 mr-1" />}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Message Footer */}
        <div className={cn(
          "flex items-center mt-2 space-x-2 text-xs",
          isUser ? "justify-end" : "justify-start"
        )}>
          <span className="text-slate-400 dark:text-slate-500">
            {isUser ? "You" : "JACC"}
          </span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span className="text-slate-400 dark:text-slate-500">
            {formatTimestamp(message.createdAt!)}
          </span>
          
          {/* Feedback buttons for AI messages */}
          {isAssistant && (
            <>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleFeedback('liked')}
                  className={cn(
                    "w-5 h-5 p-0",
                    feedback === 'liked' 
                      ? "text-green-500" 
                      : "text-slate-400 hover:text-green-500"
                  )}
                >
                  <ThumbsUp className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleFeedback('disliked')}
                  className={cn(
                    "w-5 h-5 p-0",
                    feedback === 'disliked' 
                      ? "text-red-500" 
                      : "text-slate-400 hover:text-red-500"
                  )}
                >
                  <ThumbsDown className="w-3 h-3" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {isUser && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="bg-slate-300 dark:bg-slate-600">
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
