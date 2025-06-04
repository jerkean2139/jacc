import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ChatRatingProps {
  chatId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatRating({ chatId, isOpen, onClose }: ChatRatingProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitRatingMutation = useMutation({
    mutationFn: async () => {
      if (rating === 0) {
        throw new Error("Please select a rating");
      }
      
      await apiRequest("POST", `/api/chats/${chatId}/rating`, {
        rating,
        feedback: feedback.trim() || undefined
      });
    },
    onSuccess: () => {
      toast({
        title: "Rating Submitted",
        description: "Thank you for your feedback! It helps us improve JACC.",
      });
      
      // Refresh user stats and engagement metrics
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/engagement"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      
      // Reset form and close
      setRating(0);
      setFeedback("");
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating",
        variant: "destructive",
      });
    },
  });

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating: number) => {
    setHoveredRating(starRating);
  };

  const getRatingText = (ratingValue: number) => {
    switch (ratingValue) {
      case 1:
        return "Poor - Not helpful";
      case 2:
        return "Fair - Somewhat helpful";
      case 3:
        return "Good - Helpful";
      case 4:
        return "Very Good - Very helpful";
      case 5:
        return "Excellent - Extremely helpful";
      default:
        return "Select a rating";
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate This Chat Session</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              How helpful was JACC in this conversation?
            </p>
            
            {/* Star Rating */}
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 hover:scale-110 transition-transform"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= displayRating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            
            {/* Rating Text */}
            <p className="text-sm font-medium text-gray-700">
              {getRatingText(displayRating)}
            </p>
          </div>

          {/* Feedback Textarea */}
          <div className="space-y-2">
            <label htmlFor="feedback" className="text-sm font-medium text-gray-700">
              Additional feedback (optional)
            </label>
            <Textarea
              id="feedback"
              placeholder="What went well? What could be improved?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">
              {feedback.length}/500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={submitRatingMutation.isPending}
            >
              Skip
            </Button>
            <Button
              onClick={() => submitRatingMutation.mutate()}
              disabled={rating === 0 || submitRatingMutation.isPending}
              className="flex-1"
            >
              {submitRatingMutation.isPending ? "Submitting..." : "Submit Rating"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}