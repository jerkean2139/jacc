import { Request, Response } from 'express';
import { db } from './db';
import { chats, users, messages, chatReviews, messageCorrections } from '@shared/schema';
import { eq, desc, isNull, sql } from 'drizzle-orm';

export function registerChatReviewRoutes(app: any) {
  // Get chat reviews list
  app.get('/api/admin/chat-reviews', async (req: Request, res: Response) => {
    try {
      const { status = 'pending', limit = 20, offset = 0 } = req.query;
      
      const chatsWithReviews = await db
        .select({
          chatId: chats.id,
          chatTitle: chats.title,
          userId: chats.userId,
          userName: users.username,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
          messageCount: sql<number>`COUNT(${messages.id})`,
          reviewStatus: sql<string>`COALESCE(${chatReviews.reviewStatus}, 'pending')`,
          reviewedBy: chatReviews.reviewedBy,
          lastReviewedAt: chatReviews.lastReviewedAt,
          correctionsMade: sql<number>`COALESCE(${chatReviews.correctionsMade}, 0)`,
        })
        .from(chats)
        .leftJoin(chatReviews, eq(chats.id, chatReviews.chatId))
        .leftJoin(users, eq(chats.userId, users.id))
        .leftJoin(messages, eq(chats.id, messages.chatId))
        .where(
          status === 'all' ? undefined : 
          status === 'pending' ? isNull(chatReviews.reviewStatus) :
          eq(chatReviews.reviewStatus, status as string)
        )
        .groupBy(chats.id, chats.title, chats.userId, users.username, chats.createdAt, chats.updatedAt, chatReviews.reviewStatus, chatReviews.reviewedBy, chatReviews.lastReviewedAt, chatReviews.correctionsMade)
        .orderBy(desc(chats.updatedAt))
        .limit(Number(limit))
        .offset(Number(offset));

      res.json(chatsWithReviews);
    } catch (error) {
      console.error('Error fetching chat reviews:', error);
      res.status(500).json({ error: 'Failed to fetch chat reviews' });
    }
  });

  // Get specific chat details for review
  app.get('/api/admin/chat-reviews/:chatId', async (req: Request, res: Response) => {
    try {
      const { chatId } = req.params;
      
      // Get chat details
      const chatWithMessages = await db
        .select({
          chatId: chats.id,
          chatTitle: chats.title,
          userId: chats.userId,
          userName: users.username,
          userEmail: users.email,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
        })
        .from(chats)
        .leftJoin(users, eq(chats.userId, users.id))
        .where(eq(chats.id, chatId))
        .limit(1);

      if (chatWithMessages.length === 0) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      // Get all messages for this chat
      const chatMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(messages.createdAt);

      // Get existing review status
      const existingReview = await db
        .select()
        .from(chatReviews)
        .where(eq(chatReviews.chatId, chatId))
        .limit(1);

      // Get any message corrections
      const corrections = await db
        .select()
        .from(messageCorrections)
        .where(eq(messageCorrections.chatId, chatId))
        .orderBy(messageCorrections.createdAt);

      res.json({
        chat: chatWithMessages[0],
        messages: chatMessages,
        review: existingReview[0] || null,
        corrections: corrections,
      });
    } catch (error) {
      console.error('Error fetching chat details:', error);
      res.status(500).json({ error: 'Failed to fetch chat details' });
    }
  });

  // Save chat review status
  app.post('/api/admin/chat-reviews/:chatId/review', async (req: Request, res: Response) => {
    try {
      const { chatId } = req.params;
      const { reviewStatus, reviewNotes } = req.body;
      const userId = (req.session as any)?.user?.id || 'admin';

      // Get message count for this chat
      const messageCountResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(messages)
        .where(eq(messages.chatId, chatId));
      
      const messageCount = messageCountResult[0]?.count || 0;

      // Get corrections count
      const correctionsCountResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(messageCorrections)
        .where(eq(messageCorrections.chatId, chatId));
      
      const correctionsCount = correctionsCountResult[0]?.count || 0;

      // Check if review exists
      const existingReview = await db
        .select()
        .from(chatReviews)
        .where(eq(chatReviews.chatId, chatId))
        .limit(1);

      if (existingReview.length > 0) {
        await db
          .update(chatReviews)
          .set({
            reviewStatus,
            reviewNotes,
            reviewedBy: userId,
            correctionsMade: correctionsCount,
            totalMessages: messageCount,
            lastReviewedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(chatReviews.chatId, chatId));
      } else {
        await db.insert(chatReviews).values({
          chatId,
          reviewStatus,
          reviewNotes,
          reviewedBy: userId,
          correctionsMade: correctionsCount,
          totalMessages: messageCount,
          lastReviewedAt: new Date(),
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error saving chat review:', error);
      res.status(500).json({ error: 'Failed to save review' });
    }
  });

  // Get review stats
  app.get('/api/admin/chat-reviews/stats', async (req: Request, res: Response) => {
    try {
      const pendingCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(chats)
        .leftJoin(chatReviews, eq(chats.id, chatReviews.chatId))
        .where(isNull(chatReviews.reviewStatus));

      const approvedCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(chatReviews)
        .where(eq(chatReviews.reviewStatus, 'approved'));

      const needsCorrectionCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(chatReviews)
        .where(eq(chatReviews.reviewStatus, 'needs_correction'));

      const totalCorrections = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(messageCorrections);

      res.json({
        pending: pendingCount[0]?.count || 0,
        approved: approvedCount[0]?.count || 0,
        needsCorrection: needsCorrectionCount[0]?.count || 0,
        totalCorrections: totalCorrections[0]?.count || 0,
      });
    } catch (error) {
      console.error('Error fetching chat review stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });
}