export interface UserFeedback {
  id: string;
  userId: string;
  sessionId: string;
  queryId: string;
  feedbackType: 'rating' | 'thumbs' | 'detailed' | 'implicit';
  rating?: number; // 1-5 scale
  thumbsDirection?: 'up' | 'down';
  comment?: string;
  searchResults?: {
    resultId: string;
    relevanceScore: number;
    clicked: boolean;
    timeSpent: number;
  }[];
  responseQuality: {
    accuracy: number;
    completeness: number;
    helpfulness: number;
    clarity: number;
  };
  timestamp: number;
  context: {
    queryText: string;
    responseLength: number;
    sourcesCount: number;
    searchLatency: number;
  };
}

export interface LearningPattern {
  pattern: string;
  frequency: number;
  averageRating: number;
  improvements: string[];
  lastUpdated: number;
}

export interface AdaptiveModel {
  userId: string;
  preferences: {
    responseStyle: 'detailed' | 'concise' | 'bullet_points';
    preferredSources: string[];
    domainFocus: string[];
    searchApproach: 'comprehensive' | 'quick' | 'expert';
  };
  learningHistory: LearningPattern[];
  performanceMetrics: {
    averageSatisfaction: number;
    totalInteractions: number;
    successfulQueries: number;
    lastOptimized: number;
  };
}

export class UserFeedbackSystem {
  private feedbackData: Map<string, UserFeedback> = new Map();
  private adaptiveModels: Map<string, AdaptiveModel> = new Map();
  private learningPatterns: Map<string, LearningPattern> = new Map();

  async captureFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp'>): Promise<string> {
    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const completeFeedback: UserFeedback = {
      ...feedback,
      id: feedbackId,
      timestamp: Date.now()
    };

    this.feedbackData.set(feedbackId, completeFeedback);
    
    // Update adaptive model
    await this.updateAdaptiveModel(feedback.userId, completeFeedback);
    
    // Extract learning patterns
    await this.extractLearningPatterns(completeFeedback);
    
    console.log(`Captured feedback ${feedbackId} for user ${feedback.userId}`);
    return feedbackId;
  }

  async captureImplicitFeedback(
    userId: string,
    queryId: string,
    interactions: {
      searchResults: Array<{
        resultId: string;
        clicked: boolean;
        timeSpent: number;
        scrollDepth: number;
      }>;
      queryRefinements: number;
      sessionDuration: number;
      tasksCompleted: string[];
    }
  ): Promise<void> {
    // Convert implicit signals to feedback scores
    const implicitRating = this.calculateImplicitRating(interactions);
    
    const implicitFeedback: Omit<UserFeedback, 'id' | 'timestamp'> = {
      userId,
      sessionId: `session_${Date.now()}`,
      queryId,
      feedbackType: 'implicit',
      rating: implicitRating,
      searchResults: interactions.searchResults.map(result => ({
        resultId: result.resultId,
        relevanceScore: this.calculateRelevanceFromBehavior(result),
        clicked: result.clicked,
        timeSpent: result.timeSpent
      })),
      responseQuality: {
        accuracy: implicitRating / 5,
        completeness: Math.min(interactions.sessionDuration / 300, 1), // 5 minute ideal
        helpfulness: interactions.tasksCompleted.length > 0 ? 0.9 : 0.3,
        clarity: 1 - (interactions.queryRefinements * 0.2) // fewer refinements = clearer
      },
      context: {
        queryText: '', // Would be filled from query log
        responseLength: 0,
        sourcesCount: interactions.searchResults.length,
        searchLatency: 0
      }
    };

    await this.captureFeedback(implicitFeedback);
  }

  private calculateImplicitRating(interactions: any): number {
    let score = 3; // Base neutral score
    
    // Positive signals
    if (interactions.searchResults.some((r: any) => r.clicked)) score += 0.5;
    if (interactions.sessionDuration > 180) score += 0.5; // 3+ minutes
    if (interactions.tasksCompleted.length > 0) score += 1;
    if (interactions.queryRefinements === 0) score += 0.5; // Found what they needed immediately
    
    // Negative signals
    if (interactions.queryRefinements > 2) score -= 1;
    if (interactions.sessionDuration < 30) score -= 1; // Very short session
    if (!interactions.searchResults.some((r: any) => r.timeSpent > 10)) score -= 0.5; // No engagement
    
    return Math.max(1, Math.min(5, score));
  }

  private calculateRelevanceFromBehavior(result: any): number {
    let relevance = 0.5; // Base score
    
    if (result.clicked) relevance += 0.3;
    if (result.timeSpent > 30) relevance += 0.2;
    if (result.scrollDepth > 0.5) relevance += 0.2;
    if (result.timeSpent > 120) relevance -= 0.1; // Too much time might indicate confusion
    
    return Math.max(0, Math.min(1, relevance));
  }

  private async updateAdaptiveModel(userId: string, feedback: UserFeedback): Promise<void> {
    let model = this.adaptiveModels.get(userId);
    
    if (!model) {
      model = {
        userId,
        preferences: {
          responseStyle: 'detailed',
          preferredSources: [],
          domainFocus: [],
          searchApproach: 'comprehensive'
        },
        learningHistory: [],
        performanceMetrics: {
          averageSatisfaction: 0,
          totalInteractions: 0,
          successfulQueries: 0,
          lastOptimized: Date.now()
        }
      };
    }

    // Update performance metrics
    model.performanceMetrics.totalInteractions++;
    if (feedback.rating && feedback.rating >= 4) {
      model.performanceMetrics.successfulQueries++;
    }
    
    const newSatisfaction = feedback.rating || 3;
    model.performanceMetrics.averageSatisfaction = 
      (model.performanceMetrics.averageSatisfaction + newSatisfaction) / 2;

    // Adapt preferences based on feedback
    if (feedback.rating && feedback.rating >= 4) {
      // Learn from successful interactions
      if (feedback.context.responseLength > 1000) {
        model.preferences.responseStyle = 'detailed';
      } else if (feedback.context.responseLength < 500) {
        model.preferences.responseStyle = 'concise';
      }
    }

    this.adaptiveModels.set(userId, model);
  }

  private async extractLearningPatterns(feedback: UserFeedback): Promise<void> {
    if (!feedback.context.queryText) return;
    
    // Extract patterns from query text
    const patterns = this.identifyQueryPatterns(feedback.context.queryText);
    
    patterns.forEach(pattern => {
      const existing = this.learningPatterns.get(pattern) || {
        pattern,
        frequency: 0,
        averageRating: 0,
        improvements: [],
        lastUpdated: 0
      };
      
      existing.frequency++;
      existing.averageRating = (existing.averageRating + (feedback.rating || 3)) / 2;
      existing.lastUpdated = Date.now();
      
      // Identify improvement areas for low-rated patterns
      if (feedback.rating && feedback.rating < 3) {
        const improvement = this.suggestImprovement(feedback);
        if (improvement && !existing.improvements.includes(improvement)) {
          existing.improvements.push(improvement);
        }
      }
      
      this.learningPatterns.set(pattern, existing);
    });
  }

  private identifyQueryPatterns(queryText: string): string[] {
    const patterns: string[] = [];
    const text = queryText.toLowerCase();
    
    // Query type patterns
    if (text.includes('what is') || text.includes('define')) {
      patterns.push('definition_query');
    }
    if (text.includes('how to') || text.includes('how do')) {
      patterns.push('instructional_query');
    }
    if (text.includes('compare') || text.includes('vs') || text.includes('versus')) {
      patterns.push('comparison_query');
    }
    if (text.includes('rate') || text.includes('price') || text.includes('cost')) {
      patterns.push('pricing_query');
    }
    if (text.includes('best') || text.includes('recommend')) {
      patterns.push('recommendation_query');
    }
    
    // Domain patterns
    if (text.includes('restaurant') || text.includes('food')) {
      patterns.push('restaurant_domain');
    }
    if (text.includes('retail') || text.includes('store')) {
      patterns.push('retail_domain');
    }
    if (text.includes('e-commerce') || text.includes('online')) {
      patterns.push('ecommerce_domain');
    }
    
    return patterns;
  }

  private suggestImprovement(feedback: UserFeedback): string | null {
    if (feedback.responseQuality.accuracy < 0.6) {
      return 'improve_source_quality';
    }
    if (feedback.responseQuality.completeness < 0.6) {
      return 'expand_search_scope';
    }
    if (feedback.responseQuality.clarity < 0.6) {
      return 'simplify_response_structure';
    }
    if (feedback.context.searchLatency > 3000) {
      return 'optimize_search_performance';
    }
    
    return null;
  }

  getUserAdaptiveModel(userId: string): AdaptiveModel | null {
    return this.adaptiveModels.get(userId) || null;
  }

  getOptimizationInsights(): {
    topPatterns: LearningPattern[];
    improvementAreas: string[];
    userSatisfactionTrends: {
      overall: number;
      byPattern: Record<string, number>;
    };
    recommendations: string[];
  } {
    const patterns = Array.from(this.learningPatterns.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    const improvementAreas = patterns
      .filter(p => p.averageRating < 3.5)
      .flatMap(p => p.improvements);

    const overallSatisfaction = Array.from(this.adaptiveModels.values())
      .reduce((sum, model) => sum + model.performanceMetrics.averageSatisfaction, 0) / 
      Math.max(this.adaptiveModels.size, 1);

    const satisfactionByPattern: Record<string, number> = {};
    patterns.forEach(pattern => {
      satisfactionByPattern[pattern.pattern] = pattern.averageRating;
    });

    const recommendations = this.generateRecommendations(patterns, improvementAreas);

    return {
      topPatterns: patterns,
      improvementAreas: [...new Set(improvementAreas)],
      userSatisfactionTrends: {
        overall: overallSatisfaction,
        byPattern: satisfactionByPattern
      },
      recommendations
    };
  }

  private generateRecommendations(patterns: LearningPattern[], improvements: string[]): string[] {
    const recommendations: string[] = [];
    
    // Pattern-based recommendations
    const lowRatedPatterns = patterns.filter(p => p.averageRating < 3.5);
    if (lowRatedPatterns.length > 0) {
      recommendations.push(`Focus on improving ${lowRatedPatterns[0].pattern} queries - current satisfaction: ${lowRatedPatterns[0].averageRating.toFixed(1)}/5`);
    }

    // Improvement area recommendations
    const improvementCounts = improvements.reduce((acc, imp) => {
      acc[imp] = (acc[imp] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topImprovement = Object.entries(improvementCounts)
      .sort((a, b) => b[1] - a[1])[0];

    if (topImprovement) {
      recommendations.push(`Priority improvement: ${topImprovement[0]} (mentioned ${topImprovement[1]} times)`);
    }

    // Usage pattern recommendations
    const highFrequencyPattern = patterns[0];
    if (highFrequencyPattern && highFrequencyPattern.frequency > 10) {
      recommendations.push(`Optimize for ${highFrequencyPattern.pattern} - your most common query type (${highFrequencyPattern.frequency} occurrences)`);
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  async generatePersonalizedResponse(
    userId: string,
    baseResponse: string,
    context: any
  ): Promise<string> {
    const model = this.getUserAdaptiveModel(userId);
    if (!model) return baseResponse;

    let personalizedResponse = baseResponse;

    // Adapt response style
    switch (model.preferences.responseStyle) {
      case 'concise':
        personalizedResponse = this.makeConcise(baseResponse);
        break;
      case 'bullet_points':
        personalizedResponse = this.convertToBulletPoints(baseResponse);
        break;
      case 'detailed':
        // Keep original detailed response
        break;
    }

    // Add personalized context based on user's domain focus
    if (model.preferences.domainFocus.length > 0) {
      const relevantDomains = model.preferences.domainFocus.join(', ');
      personalizedResponse += `\n\n*This response is tailored for ${relevantDomains} contexts based on your previous interactions.*`;
    }

    return personalizedResponse;
  }

  private makeConcise(text: string): string {
    // Simplify to key points only
    const sentences = text.split('. ');
    const keySentences = sentences.filter(sentence => 
      sentence.includes('rate') || 
      sentence.includes('fee') || 
      sentence.includes('cost') ||
      sentence.includes('important') ||
      sentence.includes('key')
    );
    
    return keySentences.slice(0, 3).join('. ') + '.';
  }

  private convertToBulletPoints(text: string): string {
    const sentences = text.split('. ');
    const bulletPoints = sentences
      .filter(sentence => sentence.length > 20)
      .slice(0, 5)
      .map(sentence => `• ${sentence.trim()}${sentence.endsWith('.') ? '' : '.'}`)
      .join('\n');
    
    return bulletPoints;
  }
}

export const userFeedbackSystem = new UserFeedbackSystem();