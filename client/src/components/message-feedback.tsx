import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown, MessageSquare, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface MessageFeedbackProps {
  messageId: string;
  chatId: string;
  userQuery: string;
  aiResponse: string;
  onClose?: () => void;
}

export function MessageFeedback({ messageId, chatId, userQuery, aiResponse, onClose }: MessageFeedbackProps) {
  const [feedbackType, setFeedbackType] = useState<string>('');
  const [correctResponse, setCorrectResponse] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [showFullForm, setShowFullForm] = useState(false);
  const queryClient = useQueryClient();

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to submit feedback');
      return response.json();
    },
    onSuccess: () => {
      // Reset form and notify success
      setFeedbackType('');
      setCorrectResponse('');
      setAdminNotes('');
      setShowFullForm(false);
      if (onClose) onClose();
      
      // Show success message
      console.log('Feedback submitted successfully');
    },
  });

  const handleQuickFeedback = (type: 'good' | 'incorrect') => {
    if (type === 'good') {
      submitFeedbackMutation.mutate({
        chatId,
        messageId,
        userQuery,
        aiResponse,
        feedbackType: 'good',
        correctResponse: '',
        adminNotes: 'User marked as good response'
      });
    } else {
      setFeedbackType('incorrect');
      setShowFullForm(true);
    }
  };

  const handleDetailedFeedback = () => {
    submitFeedbackMutation.mutate({
      chatId,
      messageId,
      userQuery,
      aiResponse,
      feedbackType,
      correctResponse,
      adminNotes
    });
  };

  if (!showFullForm) {
    return (
      <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
        <span className="text-sm text-gray-600 dark:text-gray-400">Was this response helpful?</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleQuickFeedback('good')}
          disabled={submitFeedbackMutation.isPending}
          className="h-8"
        >
          <ThumbsUp className="w-3 h-3 mr-1" />
          Yes
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleQuickFeedback('incorrect')}
          disabled={submitFeedbackMutation.isPending}
          className="h-8"
        >
          <ThumbsDown className="w-3 h-3 mr-1" />
          No
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowFullForm(true)}
          className="h-8"
        >
          <MessageSquare className="w-3 h-3 mr-1" />
          Details
        </Button>
      </div>
    );
  }

  return (
    <Card className="mt-4">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Provide AI Training Feedback</h4>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowFullForm(false);
              if (onClose) onClose();
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Feedback Type</label>
          <Select value={feedbackType} onValueChange={setFeedbackType}>
            <SelectTrigger>
              <SelectValue placeholder="Select feedback type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="incorrect">Incorrect Information</SelectItem>
              <SelectItem value="incomplete">Incomplete Response</SelectItem>
              <SelectItem value="needs_training">Needs Training</SelectItem>
              <SelectItem value="good">Good Response</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {feedbackType && feedbackType !== 'good' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Correct Response</label>
              <Textarea
                placeholder="Provide the correct response that the AI should have given..."
                value={correctResponse}
                onChange={(e) => setCorrectResponse(e.target.value)}
                className="min-h-24"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Training Notes</label>
              <Textarea
                placeholder="Additional notes to help improve the AI's responses..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="min-h-20"
              />
            </div>
          </>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleDetailedFeedback}
            disabled={!feedbackType || submitFeedbackMutation.isPending}
            className="flex-1"
          >
            {submitFeedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFullForm(false)}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}