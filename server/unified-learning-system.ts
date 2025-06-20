import { db } from './db';
import { faqKnowledgeBase, trainingInteractions } from '@shared/schema';
import { desc, eq, and } from 'drizzle-orm';

export interface LearningInteraction {
  query: string;
  response: string;
  source: 'user_chat' | 'admin_test' | 'admin_correction';
  userId?: string;
  sessionId?: string;
  quality?: number; // 1-5 rating
  wasCorrect?: boolean;
  correctedResponse?: string;
  metadata?: {
    processingTime?: number;
    sourcesUsed?: string[];
    confidence?: number;
  };
}

export class UnifiedLearningSystem {
  /**
   * Central method to capture all Q&A interactions for learning
   */
  async captureInteraction(interaction: LearningInteraction): Promise<void> {
    try {
      // Store in training interactions table for monitoring
      await db.insert(trainingInteractions).values({
        query: interaction.query,
        response: interaction.response,
        source: interaction.source,
        userId: interaction.userId || 'system',
        sessionId: interaction.sessionId || this.generateSessionId(),
        quality: interaction.quality || null,
        wasCorrect: interaction.wasCorrect ?? true,
        correctedResponse: interaction.correctedResponse || null,
        metadata: interaction.metadata ? JSON.stringify(interaction.metadata) : null,
        timestamp: new Date()
      });

      // Skip automatic knowledge base addition temporarily due to schema constraints
      // if (this.shouldAddToKnowledgeBase(interaction)) {
      //   await this.addToKnowledgeBase(interaction);
      // }

      console.log(`📚 Learning interaction captured: ${interaction.source} - ${interaction.query.substring(0, 50)}...`);
    } catch (error) {
      console.error('Error capturing learning interaction:', error);
    }
  }

  /**
   * Determine if interaction should be added to permanent knowledge base
   */
  private shouldAddToKnowledgeBase(interaction: LearningInteraction): boolean {
    // Add to knowledge base if:
    // 1. It's an admin correction
    // 2. It's a high-quality user interaction (rating 4-5)
    // 3. It's an admin test that was marked as good
    return (
      interaction.source === 'admin_correction' ||
      (interaction.quality && interaction.quality >= 4) ||
      (interaction.source === 'admin_test' && interaction.wasCorrect === true)
    );
  }

  /**
   * Add interaction to permanent knowledge base
   */
  private async addToKnowledgeBase(interaction: LearningInteraction): Promise<void> {
    try {
      const finalResponse = interaction.correctedResponse || interaction.response;
      
      await db.insert(faqKnowledgeBase).values({
        question: interaction.query,
        answer: finalResponse,
        category: 'ai_training',
        tags: [`learning_${interaction.source}`, 'ai_corrected'],
        priority: this.calculatePriority(interaction),
        isActive: true,
        lastUpdated: new Date(),
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error adding to knowledge base:', error);
    }
  }

  /**
   * Calculate priority based on interaction source and quality
   */
  private calculatePriority(interaction: LearningInteraction): number {
    switch (interaction.source) {
      case 'admin_correction': return 10; // Highest priority
      case 'admin_test': return 7;
      case 'user_chat': return interaction.quality || 5;
      default: return 5;
    }
  }

  /**
   * Calculate effectiveness rating
   */
  private calculateEffectiveness(interaction: LearningInteraction): string {
    if (interaction.source === 'admin_correction') return 'high';
    if (interaction.quality && interaction.quality >= 4) return 'high';
    if (interaction.quality && interaction.quality >= 3) return 'medium';
    return 'low';
  }

  /**
   * Generate review notes for the knowledge base entry
   */
  private generateReviewNotes(interaction: LearningInteraction): string {
    const notes = [`Source: ${interaction.source}`];
    
    if (interaction.quality) {
      notes.push(`Quality: ${interaction.quality}/5`);
    }
    
    if (interaction.correctedResponse) {
      notes.push('Admin corrected response');
    }
    
    if (interaction.metadata?.confidence) {
      notes.push(`AI confidence: ${interaction.metadata.confidence}`);
    }

    return notes.join(' | ');
  }

  /**
   * Get recent learning interactions for admin review
   */
  async getRecentLearningInteractions(limit: number = 50): Promise<any[]> {
    try {
      return await db
        .select()
        .from(trainingInteractions)
        .orderBy(desc(trainingInteractions.timestamp))
        .limit(limit);
    } catch (error) {
      console.error('Error fetching recent interactions:', error);
      return [];
    }
  }

  /**
   * Get interactions that need admin review
   */
  async getInteractionsForReview(): Promise<any[]> {
    try {
      return await db
        .select()
        .from(trainingInteractions)
        .where(
          and(
            eq(trainingInteractions.wasCorrect, false),
            eq(trainingInteractions.correctedResponse, null)
          )
        )
        .orderBy(desc(trainingInteractions.timestamp));
    } catch (error) {
      console.error('Error fetching interactions for review:', error);
      return [];
    }
  }

  /**
   * Update an interaction with admin corrections
   */
  async correctInteraction(interactionId: string, correctedResponse: string, adminNotes?: string): Promise<void> {
    try {
      await db
        .update(trainingInteractions)
        .set({
          correctedResponse,
          wasCorrect: true,
          reviewNotes: adminNotes,
          lastReviewed: new Date()
        })
        .where(eq(trainingInteractions.id, interactionId));

      // Also add the corrected version to knowledge base
      const interaction = await db
        .select()
        .from(trainingInteractions)
        .where(eq(trainingInteractions.id, interactionId))
        .limit(1);

      if (interaction[0]) {
        await this.captureInteraction({
          query: interaction[0].query,
          response: correctedResponse,
          source: 'admin_correction',
          userId: 'admin',
          wasCorrect: true,
          correctedResponse
        });
      }
    } catch (error) {
      console.error('Error correcting interaction:', error);
    }
  }

  /**
   * Generate session ID for grouping related interactions
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get learning analytics for admin dashboard
   */
  async getLearningAnalytics(): Promise<any> {
    try {
      const interactions = await db.select().from(trainingInteractions);
      
      const totalInteractions = interactions.length;
      const correctInteractions = interactions.filter(i => i.wasCorrect).length;
      const averageQuality = interactions
        .filter(i => i.quality)
        .reduce((sum, i) => sum + (i.quality || 0), 0) / interactions.filter(i => i.quality).length || 0;
      
      const sourceBreakdown = interactions.reduce((acc, i) => {
        acc[i.source] = (acc[i.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const needsReview = interactions.filter(i => !i.wasCorrect && !i.correctedResponse).length;

      return {
        totalInteractions,
        correctInteractions,
        accuracyRate: totalInteractions > 0 ? (correctInteractions / totalInteractions) * 100 : 0,
        averageSatisfaction: Math.round(averageQuality * 10) / 10,
        totalMessages: totalInteractions,
        flaggedForReview: needsReview,
        sourceBreakdown,
        needsReview,
        recentInteractions: interactions
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10)
      };
    } catch (error) {
      console.error('Error getting learning analytics:', error);
      return {
        totalInteractions: 0,
        correctInteractions: 0,
        accuracyRate: 0,
        averageQuality: 0,
        sourceBreakdown: {},
        needsReview: 0,
        recentInteractions: []
      };
    }
  }
}

export const unifiedLearningSystem = new UnifiedLearningSystem();