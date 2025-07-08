import { Request, Response } from 'express';
import { db } from './db';
import { chats, users, messages, chatReviews, messageCorrections } from '@shared/schema';
import { eq, desc, isNull, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export function registerChatReviewRoutes(app: any) {
  // Get review stats (must be before parameterized routes)
  app.get('/api/admin/chat-reviews/stats', async (req: Request, res: Response) => {
    try {
      // Count chats with messages (potential reviews)
      const chatsWithMessages = await db.execute(sql`
        SELECT COUNT(DISTINCT c.id) as count
        FROM chats c
        INNER JOIN messages m ON c.id = m.chat_id
      `);

      // Count pending reviews (chats with messages but no review)
      const pendingReviews = await db.execute(sql`
        SELECT COUNT(DISTINCT c.id) as count
        FROM chats c
        INNER JOIN messages m ON c.id = m.chat_id
        LEFT JOIN chat_reviews cr ON c.id = cr.chat_id
        WHERE cr.id IS NULL
      `);

      // Count approved reviews
      const approvedReviews = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM chat_reviews
        WHERE review_status = 'approved'
      `);

      // Count reviews needing correction
      const correctionReviews = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM chat_reviews
        WHERE review_status = 'needs_correction'
      `);

      // Count total message corrections
      const corrections = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM message_corrections
      `);

      res.json({
        pending: Number(pendingReviews.rows[0]?.count) || 0,
        approved: Number(approvedReviews.rows[0]?.count) || 0,
        needsCorrection: Number(correctionReviews.rows[0]?.count) || 0,
        totalCorrections: Number(corrections.rows[0]?.count) || 0,
      });
    } catch (error) {
      console.error('Error fetching chat review stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Get chat reviews list
  app.get('/api/admin/chat-reviews', async (req: Request, res: Response) => {
    try {
      const { status = 'all', limit = 20, offset = 0 } = req.query;
      
      // First get all chats with their message counts
      const allChats = await db
        .select({
          chatId: chats.id,
          chatTitle: chats.title,
          userId: chats.userId,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
          messageCount: sql<number>`COUNT(${messages.id})`,
        })
        .from(chats)
        .leftJoin(messages, eq(chats.id, messages.chatId))
        .groupBy(chats.id, chats.title, chats.userId, chats.createdAt, chats.updatedAt)
        .having(sql`COUNT(${messages.id}) > 0`) // Only show chats with messages
        .orderBy(desc(chats.updatedAt));

      // Then get review statuses for these chats
      const chatReviewStatuses = await db
        .select({
          chatId: chatReviews.chatId,
          reviewStatus: chatReviews.reviewStatus,
          reviewedBy: chatReviews.reviewedBy,
          reviewNotes: chatReviews.reviewNotes,
          updatedAt: chatReviews.updatedAt,
        })
        .from(chatReviews);

      // Get correction counts for each chat
      const correctionCounts = await db
        .select({
          chatId: messageCorrections.chatId,
          correctionCount: sql<number>`COUNT(*)`,
        })
        .from(messageCorrections)
        .groupBy(messageCorrections.chatId);

      // Combine the data
      const chatsWithReviews = allChats.map(chat => {
        const review = chatReviewStatuses.find(r => r.chatId === chat.chatId);
        const corrections = correctionCounts.find(c => c.chatId === chat.chatId);
        
        const reviewStatus = review?.reviewStatus || 'pending';
        
        return {
          chatId: chat.chatId,
          chatTitle: chat.chatTitle,
          userId: chat.userId,
          userName: chat.userId,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
          messageCount: chat.messageCount,
          reviewStatus,
          reviewedBy: review?.reviewedBy || null,
          lastReviewedAt: review?.updatedAt || chat.updatedAt,
          correctionsMade: corrections?.correctionCount || 0,
        };
      });

      // Filter by status if needed
      const filteredChats = status === 'all' 
        ? chatsWithReviews
        : chatsWithReviews.filter(chat => chat.reviewStatus === status);

      // Apply pagination
      const paginatedChats = filteredChats
        .slice(Number(offset), Number(offset) + Number(limit));

      res.json(paginatedChats);
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
        .select({
          id: messages.id,
          content: messages.content,
          role: messages.role,
          createdAt: messages.createdAt,
          chatId: messages.chatId,
        })
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(messages.createdAt);

      // Get existing review status
      const existingReview = await db
        .select()
        .from(chatReviews)
        .where(eq(chatReviews.chatId, chatId))
        .limit(1);

      // Get any message corrections (handle missing columns gracefully)
      let corrections = [];
      try {
        corrections = await db
          .select({
            id: messageCorrections.id,
            messageId: messageCorrections.messageId,
            chatId: messageCorrections.chatId,
            originalContent: messageCorrections.originalContent,
            correctedContent: messageCorrections.correctedContent,
            correctedBy: messageCorrections.correctedBy,
            improvementType: messageCorrections.improvementType,
            createdAt: messageCorrections.createdAt
          })
          .from(messageCorrections)
          .where(eq(messageCorrections.chatId, chatId))
          .orderBy(messageCorrections.createdAt);
      } catch (error) {
        console.log('Message corrections table not fully migrated, using empty array');
        corrections = [];
      }

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
          id: randomUUID(),
          chatId,
          reviewStatus,
          reviewNotes,
          reviewedBy: userId,
          correctionsMade: correctionsCount,
          totalMessages: messageCount,
          lastReviewedAt: new Date(),
          createdAt: new Date(),
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error saving chat review:', error);
      res.status(500).json({ error: 'Failed to save review' });
    }
  });

  // Delete chat endpoint
  app.delete('/api/admin/chat-reviews/:chatId/delete', async (req: Request, res: Response) => {
    try {
      const { chatId } = req.params;
      const userId = (req.session as any)?.user?.id || 'admin';

      console.log(`Deleting chat ${chatId} by user ${userId}`);

      // Delete in proper order to avoid foreign key constraints
      // 1. Delete message corrections
      await db.delete(messageCorrections).where(eq(messageCorrections.chatId, chatId));
      
      // 2. Delete chat reviews
      await db.delete(chatReviews).where(eq(chatReviews.chatId, chatId));
      
      // 3. Delete messages
      await db.delete(messages).where(eq(messages.chatId, chatId));
      
      // 4. Delete the chat itself
      await db.delete(chats).where(eq(chats.id, chatId));

      res.json({ success: true, message: 'Chat deleted successfully' });
    } catch (error) {
      console.error('Error deleting chat:', error);
      res.status(500).json({ error: 'Failed to delete chat' });
    }
  });

  // Archive chat endpoint
  app.post('/api/admin/chat-reviews/:chatId/archive', async (req: Request, res: Response) => {
    try {
      const { chatId } = req.params;
      const userId = (req.session as any)?.user?.id || 'admin';

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
            reviewStatus: 'archived',
            reviewedBy: userId === 'admin' ? 'admin-user-id' : userId,
            lastReviewedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(chatReviews.chatId, chatId));
      } else {
        await db.insert(chatReviews).values({
          chatId,
          reviewStatus: 'archived',
          reviewedBy: userId === 'admin' ? 'admin-user-id' : userId,
          lastReviewedAt: new Date(),
        });
      }

      res.json({ success: true, message: 'Chat archived successfully' });
    } catch (error) {
      console.error('Error archiving chat:', error);
      res.status(500).json({ error: 'Failed to archive chat' });
    }
  });

  // Approve chat endpoint
  app.post('/api/admin/chat-reviews/:chatId/approve', async (req: Request, res: Response) => {
    try {
      const { chatId } = req.params;
      const userId = (req.session as any)?.user?.id || 'admin';

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
            reviewStatus: 'approved',
            reviewedBy: userId === 'admin' ? 'admin-user-id' : userId,
            lastReviewedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(chatReviews.chatId, chatId));
      } else {
        await db.insert(chatReviews).values({
          chatId,
          reviewStatus: 'approved',
          reviewedBy: userId === 'admin' ? 'admin-user-id' : userId,
          lastReviewedAt: new Date(),
        });
      }

      res.json({ success: true, message: 'Chat approved successfully' });
    } catch (error) {
      console.error('Error approving chat:', error);
      res.status(500).json({ error: 'Failed to approve chat' });
    }
  });

}