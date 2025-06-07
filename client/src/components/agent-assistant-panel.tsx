import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Search, 
  HelpCircle, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  BookOpen,
  Phone,
  DollarSign,
  Settings,
  Zap
} from 'lucide-react';

interface QuickAnswer {
  answer: string;
  confidence: number;
  sources: string[];
  followUpQuestions?: string[];
  escalationNeeded?: boolean;
}

export default function AgentAssistantPanel() {
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState('general');
  const [urgency, setUrgency] = useState('medium');
  const [answer, setAnswer] = useState<QuickAnswer | null>(null);
  const [showQuickRef, setShowQuickRef] = useState(false);

  const askQuestion = useMutation({
    mutationFn: async (query: { question: string; category: string; urgency: string }) => {
      return await apiRequest('/api/agent-support/ask', {
        method: 'POST',
        body: query
      });
    },
    onSuccess: (data) => {
      setAnswer(data);
    }
  });

  const quickReference = {
    'Restaurant POS': 'Shift4 (SkyTab), MiCamp, HubWallet',
    'Retail POS': 'Quantic, Clover, HubWallet',
    'Food Truck': 'HubWallet, Quantic',
    'Salon POS': 'HubWallet',
    'High Risk': 'TRX, Payment Advisors',
    'Mobile Processing': 'TRX, Clearent, MiCamp',
    'Gift Cards': 'Valutec, Factor4, Shift4, Quantic',
    'ACH Services': 'TRX, ACI, Clearent',
    'QuickBooks Integration': 'TRX and Clearent through Hyfin',
    'SwipeSimple Fees': '$20 monthly',
    'Rectangle Health': 'TSYS VAR via TRX, Clearent or MiCamp'
  };

  const commonQuestions = [
    'What POS is best for restaurants?',
    'Who offers mobile processing?',
    'What are Quantic fees?',
    'How do I integrate with QuickBooks?',
    'Who offers gift card services?',
    'Support contact numbers?'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      askQuestion.mutate({ question, category, urgency });
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Quick Question Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            Ask JACC
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Get instant answers to merchant services questions
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ask your question..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={askQuestion.isPending}>
                {askQuestion.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-2 border rounded text-sm"
              >
                <option value="general">General</option>
                <option value="vendor">Vendor Recommendations</option>
                <option value="pricing">Pricing</option>
                <option value="technical">Technical/Integration</option>
                <option value="policy">Policy/Process</option>
                <option value="compliance">Compliance</option>
              </select>

              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="px-3 py-2 border rounded text-sm"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Answer Display */}
      {answer && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Answer
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={getConfidenceColor(answer.confidence)}>
                  {answer.confidence}% Confidence
                </Badge>
                {answer.escalationNeeded && (
                  <Badge className="bg-red-500 text-white">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Escalation Needed
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap">{answer.answer}</div>
            </div>

            {answer.sources.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Sources:</p>
                <div className="flex flex-wrap gap-1">
                  {answer.sources.map((source, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {source}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {answer.followUpQuestions && answer.followUpQuestions.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Follow-up Questions:</p>
                <div className="space-y-1">
                  {answer.followUpQuestions.map((q, index) => (
                    <button
                      key={index}
                      onClick={() => setQuestion(q)}
                      className="block text-left text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Common Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Common Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {commonQuestions.map((q, index) => (
              <button
                key={index}
                onClick={() => setQuestion(q)}
                className="text-left p-2 text-sm border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {q}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle 
            className="text-lg flex items-center gap-2 cursor-pointer"
            onClick={() => setShowQuickRef(!showQuickRef)}
          >
            <BookOpen className="h-5 w-5 text-green-600" />
            Quick Reference
            <Badge variant="outline" className="ml-auto">
              {showQuickRef ? 'Hide' : 'Show'}
            </Badge>
          </CardTitle>
        </CardHeader>
        {showQuickRef && (
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {Object.entries(quickReference).map(([key, value]) => (
                  <div key={key} className="p-2 border rounded">
                    <div className="font-medium text-sm">{key}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{value}</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        )}
      </Card>

      {/* Support Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Phone className="h-5 w-5 text-purple-600" />
            Support Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Clearent:</span>
              <span>866.435.0666 Option 1</span>
            </div>
            <div className="flex justify-between">
              <span>TRX:</span>
              <span>888-933-8797 Option 2</span>
            </div>
            <div className="flex justify-between">
              <span>TSYS:</span>
              <span>877-608-6599</span>
            </div>
            <div className="flex justify-between">
              <span>Shift4:</span>
              <span>800-201-0461 Option 1</span>
            </div>
            <div className="flex justify-between">
              <span>Merchant Lynx:</span>
              <span>844-200-8996 Option 2</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}