import { db } from './db';
import { chats, messages, chatMonitoring } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';

export interface ChatMonitoringData {
  id: string;
  chatId: string;
  userId: string;
  firstUserQuery: string;
  aiResponse: string;
  responseTime: number;
  tokensUsed: number;
  model: string;
  confidence: number;
  timestamp: Date;
  isAccurate: boolean | null;
  adminNotes: string | null;
}

export class ChatMonitoringService {
  async captureFirstInteraction(
    chatId: string,
    userId: string,
    userQuery: string,
    aiResponse: string,
    metadata: {
      responseTime: number;
      tokensUsed: number;
      model: string;
      confidence: number;
    }
  ): Promise<void> {
    try {
      // Check if this is the first interaction for this chat
      const existingMessages = await db.select()
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .limit(2);

      // Only capture if this is the first user message and AI response
      if (existingMessages.length <= 2) {
        await db.insert(chatMonitoring).values({
          id: `monitor_${chatId}_${Date.now()}`,
          chatId,
          userId,
          firstUserQuery: userQuery,
          aiResponse,
          responseTime: metadata.responseTime,
          tokensUsed: metadata.tokensUsed,
          model: metadata.model,
          confidence: metadata.confidence,
          timestamp: new Date(),
          isAccurate: null,
          adminNotes: null
        });

        console.log(`Captured first interaction for chat ${chatId}`);
      }
    } catch (error) {
      console.error('Failed to capture chat monitoring data:', error);
    }
  }

  async getMonitoringData(limit: number = 50): Promise<ChatMonitoringData[]> {
    try {
      const monitoringData = await db.select()
        .from(chatMonitoring)
        .orderBy(desc(chatMonitoring.timestamp))
        .limit(limit);

      return monitoringData;
    } catch (error) {
      console.error('Failed to get monitoring data:', error);
      return [];
    }
  }

  async updateAccuracyRating(
    monitoringId: string,
    isAccurate: boolean,
    adminNotes?: string
  ): Promise<void> {
    try {
      await db.update(chatMonitoring)
        .set({
          isAccurate,
          adminNotes,
          updatedAt: new Date()
        })
        .where(eq(chatMonitoring.id, monitoringId));

      console.log(`Updated accuracy rating for monitoring ID ${monitoringId}`);
    } catch (error) {
      console.error('Failed to update accuracy rating:', error);
    }
  }

  async getAccuracyStats(): Promise<{
    total: number;
    accurate: number;
    inaccurate: number;
    pending: number;
    averageResponseTime: number;
    averageConfidence: number;
  }> {
    try {
      const allData = await db.select().from(chatMonitoring);
      
      const stats = {
        total: allData.length,
        accurate: allData.filter(d => d.isAccurate === true).length,
        inaccurate: allData.filter(d => d.isAccurate === false).length,
        pending: allData.filter(d => d.isAccurate === null).length,
        averageResponseTime: allData.reduce((sum, d) => sum + d.responseTime, 0) / allData.length || 0,
        averageConfidence: allData.reduce((sum, d) => sum + d.confidence, 0) / allData.length || 0
      };

      return stats;
    } catch (error) {
      console.error('Failed to get accuracy stats:', error);
      return {
        total: 0,
        accurate: 0,
        inaccurate: 0,
        pending: 0,
        averageResponseTime: 0,
        averageConfidence: 0
      };
    }
  }

  async getChatsByUser(userId: string): Promise<any[]> {
    try {
      const userChats = await db.select()
        .from(chatMonitoring)
        .where(eq(chatMonitoring.userId, userId))
        .orderBy(desc(chatMonitoring.timestamp));

      return userChats;
    } catch (error) {
      console.error('Failed to get chats by user:', error);
      return [];
    }
  }
}

export const chatMonitoringService = new ChatMonitoringService();