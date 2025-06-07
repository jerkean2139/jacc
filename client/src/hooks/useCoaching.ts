import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface CoachingTip {
  id: string;
  type: 'opportunity' | 'warning' | 'insight' | 'next-step';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'discovery' | 'presentation' | 'objection' | 'closing' | 'follow-up';
  confidence: number;
  suggestedAction?: string;
  relatedDocs?: string[];
  timestamp: Date;
}

interface SalesMetrics {
  callDuration: number;
  questionsAsked: number;
  objections: number;
  nextSteps: number;
  engagementScore: number;
  closingSignals: number;
  talkToListenRatio: number;
  discoveryCompleteness: number;
}

interface ConversationAnalysis {
  stage: 'discovery' | 'presentation' | 'demo' | 'objection-handling' | 'closing' | 'follow-up';
  prospectType: 'new' | 'existing' | 'referral' | 'inbound' | 'cold';
  productInterest: string[];
  painPoints: string[];
  budget?: string;
  timeline?: string;
  decisionMaker?: boolean;
  engagementLevel: number;
  closingSignals: number;
  objections: string[];
  questionsAsked: number;
  nextSteps: string[];
}

export function useCoaching() {
  const [isCoachingEnabled, setIsCoachingEnabled] = useState(true);
  const [coachingTips, setCoachingTips] = useState<CoachingTip[]>([]);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<ConversationAnalysis | null>(null);

  // Get current metrics
  const { data: metrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['/api/coaching/metrics'],
    enabled: isCoachingEnabled,
    refetchInterval: 5000 // Update every 5 seconds
  });

  // Analyze conversation mutation
  const analyzeConversation = useMutation({
    mutationFn: async (conversationText: string) => {
      return await apiRequest('/api/coaching/analyze-conversation', {
        method: 'POST',
        body: { conversationText }
      });
    },
    onSuccess: (data) => {
      setCurrentAnalysis(data.analysis);
      setCoachingTips(data.coachingTips);
    }
  });

  // Real-time message analysis
  const analyzeMessage = useMutation({
    mutationFn: async ({ message, speaker }: { message: string; speaker: 'agent' | 'prospect' }) => {
      return await apiRequest('/api/coaching/real-time-message', {
        method: 'POST',
        body: { message, speaker }
      });
    },
    onSuccess: (data) => {
      if (data.urgentTips.length > 0) {
        setCoachingTips(prev => [...data.urgentTips, ...prev].slice(0, 10)); // Keep latest 10 tips
      }
      if (data.stageChange) {
        setCurrentAnalysis(prev => prev ? { ...prev, stage: data.stageChange } : null);
      }
      refetchMetrics();
    }
  });

  // Reset coaching session
  const resetSession = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/coaching/reset-session', {
        method: 'POST'
      });
    },
    onSuccess: () => {
      setCoachingTips([]);
      setConversationHistory([]);
      setCurrentAnalysis(null);
      refetchMetrics();
    }
  });

  // Process chat messages for coaching
  const processMessage = useCallback((message: string, isAgent: boolean) => {
    if (!isCoachingEnabled) return;

    const speaker = isAgent ? 'agent' : 'prospect';
    setConversationHistory(prev => [...prev, `${speaker}: ${message}`]);
    
    // Analyze message for real-time coaching
    analyzeMessage.mutate({ message, speaker });

    // If conversation has enough content, do full analysis
    if (conversationHistory.length > 0 && conversationHistory.length % 10 === 0) {
      const fullConversation = [...conversationHistory, `${speaker}: ${message}`].join('\n');
      analyzeConversation.mutate(fullConversation);
    }
  }, [isCoachingEnabled, conversationHistory, analyzeMessage, analyzeConversation]);

  // Start new coaching session
  const startSession = useCallback(() => {
    resetSession.mutate();
  }, [resetSession]);

  // Dismiss tip
  const dismissTip = useCallback((tipId: string) => {
    setCoachingTips(prev => prev.filter(tip => tip.id !== tipId));
  }, []);

  // Get tips by priority
  const getTipsByPriority = useCallback((priority: string) => {
    return coachingTips.filter(tip => tip.priority === priority);
  }, [coachingTips]);

  // Get tips by category
  const getTipsByCategory = useCallback((category: string) => {
    return coachingTips.filter(tip => tip.category === category);
  }, [coachingTips]);

  return {
    // State
    isCoachingEnabled,
    setIsCoachingEnabled,
    coachingTips,
    metrics: metrics as SalesMetrics,
    currentAnalysis,
    conversationHistory,
    
    // Actions
    processMessage,
    startSession,
    dismissTip,
    analyzeFullConversation: analyzeConversation.mutate,
    
    // Helpers
    getTipsByPriority,
    getTipsByCategory,
    
    // Loading states
    isAnalyzing: analyzeConversation.isPending || analyzeMessage.isPending,
    isResetting: resetSession.isPending
  };
}