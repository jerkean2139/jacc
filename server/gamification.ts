import { db } from './db';
import { 
  achievements, 
  userAchievements, 
  userStats,
  users,
  chatRatings,
  dailyUsage,
  leaderboards,
  chats,
  type Achievement,
  type UserAchievement,
  type UserStats,
  type ChatRating,
  type DailyUsage,
  type Leaderboard,
  type InsertUserAchievement,
  type InsertUserStats,
  type InsertChatRating,
  type InsertDailyUsage
} from '@shared/schema';
import { eq, and, desc, gte, lte, avg, count, sum } from 'drizzle-orm';

// Achievement definitions with unlock criteria
export const DEFAULT_ACHIEVEMENTS: Omit<Achievement, 'id' | 'createdAt'>[] = [
  // Chat & Communication Achievements
  {
    name: "First Steps",
    description: "Send your first message to JACC",
    icon: "MessageCircle",
    category: "chat",
    rarity: "common",
    points: 10,
    requirement: { type: "messages_sent", count: 1 },
    isHidden: false
  },
  {
    name: "Chatterbox",
    description: "Send 50 messages",
    icon: "MessageSquare",
    category: "chat", 
    rarity: "common",
    points: 25,
    requirement: { type: "messages_sent", count: 50 },
    isHidden: false
  },
  {
    name: "Conversation Master",
    description: "Send 500 messages",
    icon: "Users",
    category: "chat",
    rarity: "rare",
    points: 100,
    requirement: { type: "messages_sent", count: 500 },
    isHidden: false
  },

  // Calculator & Rate Analysis Achievements
  {
    name: "Number Cruncher",
    description: "Perform your first rate calculation",
    icon: "Calculator",
    category: "calculator",
    rarity: "common",
    points: 15,
    requirement: { type: "calculations_performed", count: 1 },
    isHidden: false
  },
  {
    name: "Rate Expert",
    description: "Complete 25 rate calculations",
    icon: "TrendingUp",
    category: "calculator",
    rarity: "rare",
    points: 50,
    requirement: { type: "calculations_performed", count: 25 },
    isHidden: false
  },
  {
    name: "Financial Wizard",
    description: "Complete 100 rate calculations",
    icon: "DollarSign",
    category: "calculator",
    rarity: "epic",
    points: 200,
    requirement: { type: "calculations_performed", count: 100 },
    isHidden: false
  },

  // Document Analysis Achievements
  {
    name: "Document Detective",
    description: "Analyze your first document",
    icon: "FileSearch",
    category: "documents",
    rarity: "common",
    points: 20,
    requirement: { type: "documents_analyzed", count: 1 },
    isHidden: false
  },
  {
    name: "Knowledge Seeker",
    description: "Analyze 10 documents",
    icon: "BookOpen",
    category: "documents",
    rarity: "common",
    points: 40,
    requirement: { type: "documents_analyzed", count: 10 },
    isHidden: false
  },
  {
    name: "Document Master",
    description: "Analyze 50 documents", 
    icon: "Archive",
    category: "documents",
    rarity: "rare",
    points: 150,
    requirement: { type: "documents_analyzed", count: 50 },
    isHidden: false
  },

  // Proposal Generation Achievements
  {
    name: "Proposal Pioneer",
    description: "Generate your first client proposal",
    icon: "FileText",
    category: "social",
    rarity: "common",
    points: 30,
    requirement: { type: "proposals_generated", count: 1 },
    isHidden: false
  },
  {
    name: "Deal Maker",
    description: "Generate 10 client proposals",
    icon: "Handshake",
    category: "social",
    rarity: "rare",
    points: 100,
    requirement: { type: "proposals_generated", count: 10 },
    isHidden: false
  },
  {
    name: "Sales Champion",
    description: "Generate 25 client proposals",
    icon: "Trophy",
    category: "social",
    rarity: "epic",
    points: 250,
    requirement: { type: "proposals_generated", count: 25 },
    isHidden: false
  },

  // Streak Achievements
  {
    name: "Getting Started",
    description: "Use JACC for 3 days in a row",
    icon: "Calendar",
    category: "streaks",
    rarity: "common",
    points: 25,
    requirement: { type: "daily_streak", count: 3 },
    isHidden: false
  },
  {
    name: "Consistency King",
    description: "Use JACC for 7 days in a row",
    icon: "CalendarDays",
    category: "streaks",
    rarity: "rare",
    points: 75,
    requirement: { type: "daily_streak", count: 7 },
    isHidden: false
  },
  {
    name: "Dedication Legend",
    description: "Use JACC for 30 days in a row",
    icon: "Flame",
    category: "streaks",
    rarity: "legendary",
    points: 500,
    requirement: { type: "daily_streak", count: 30 },
    isHidden: false
  },

  // Special Hidden Achievements
  {
    name: "Speed Demon",
    description: "Send 10 messages in under 1 minute",
    icon: "Zap",
    category: "chat",
    rarity: "epic",
    points: 150,
    requirement: { type: "rapid_messages", count: 10, timeLimit: 60 },
    isHidden: true
  },
  {
    name: "Night Owl",
    description: "Use JACC between midnight and 5 AM",
    icon: "Moon",
    category: "social",
    rarity: "rare",
    points: 50,
    requirement: { type: "night_usage", hours: [0, 1, 2, 3, 4] },
    isHidden: true
  },
  {
    name: "Early Bird",
    description: "Use JACC before 6 AM",
    icon: "Sunrise",
    category: "social",
    rarity: "rare",
    points: 50,
    requirement: { type: "early_usage", hours: [5, 6] },
    isHidden: true
  }
];

export class GamificationService {
  // Initialize user stats for new users
  async initializeUserStats(userId: string): Promise<UserStats> {
    const existingStats = await this.getUserStats(userId);
    if (existingStats) return existingStats;

    // Verify user exists before creating stats
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        console.error(`Cannot initialize stats: User ${userId} not found in database`);
        throw new Error(`User ${userId} not found`);
      }

      const newStats: InsertUserStats = {
        userId,
        totalMessages: 0,
        totalChats: 0,
        calculationsPerformed: 0,
        documentsAnalyzed: 0,
        proposalsGenerated: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: new Date(),
        totalPoints: 0,
        level: 1
      };

      const [stats] = await db.insert(userStats).values(newStats).returning();
      return stats;
    } catch (error) {
      console.error(`Failed to initialize user stats for ${userId}:`, error);
      throw error;
    }
  }

  // Get user stats
  async getUserStats(userId: string): Promise<UserStats | null> {
    const [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId));
    
    return stats || null;
  }

  // Update user stats and check for achievements
  async updateUserStats(userId: string, updates: Partial<UserStats>): Promise<UserAchievement[]> {
    // Update stats
    await db
      .update(userStats)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userStats.userId, userId));

    // Check for new achievements
    return await this.checkAchievements(userId);
  }

  // Track specific actions and award points
  async trackAction(userId: string, action: 'message_sent' | 'calculation_performed' | 'document_analyzed' | 'proposal_generated' | 'daily_login'): Promise<UserAchievement[]> {
    const stats = await this.getUserStats(userId);
    if (!stats) {
      await this.initializeUserStats(userId);
      return await this.trackAction(userId, action);
    }

    const updates: Partial<UserStats> = {};
    
    switch (action) {
      case 'message_sent':
        updates.totalMessages = (stats.totalMessages || 0) + 1;
        updates.totalPoints = (stats.totalPoints || 0) + 1; // 1 point per message
        break;
      case 'calculation_performed':
        updates.calculationsPerformed = (stats.calculationsPerformed || 0) + 1;
        updates.totalPoints = (stats.totalPoints || 0) + 5; // 5 points per calculation
        break;
      case 'document_analyzed':
        updates.documentsAnalyzed = (stats.documentsAnalyzed || 0) + 1;
        updates.totalPoints = (stats.totalPoints || 0) + 10; // 10 points per document
        break;
      case 'proposal_generated':
        updates.proposalsGenerated = (stats.proposalsGenerated || 0) + 1;
        updates.totalPoints = (stats.totalPoints || 0) + 25; // 25 points per proposal
        break;
      case 'daily_login':
        updates.lastActiveDate = new Date();
        // Update streak logic would go here
        break;
    }

    // Calculate level based on total points
    if (updates.totalPoints) {
      updates.level = Math.floor((updates.totalPoints || 0) / 100) + 1;
    }

    return await this.updateUserStats(userId, updates);
  }

  // Check if user has unlocked new achievements
  async checkAchievements(userId: string): Promise<UserAchievement[]> {
    const stats = await this.getUserStats(userId);
    if (!stats) return [];

    // Get all achievements user hasn't unlocked yet
    const unlockedAchievementIds = await db
      .select({ achievementId: userAchievements.achievementId })
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));

    const unlockedIds = unlockedAchievementIds.map(ua => ua.achievementId);
    
    const availableAchievements = await db
      .select()
      .from(achievements)
      .where(unlockedIds.length > 0 ? 
        and(...unlockedIds.map(id => eq(achievements.id, id))) : 
        eq(achievements.id, achievements.id)
      );

    const newlyUnlocked: UserAchievement[] = [];

    for (const achievement of availableAchievements) {
      if (unlockedIds.includes(achievement.id)) continue;

      const requirement = achievement.requirement as any;
      let unlocked = false;

      // Check different achievement types
      switch (requirement.type) {
        case 'messages_sent':
          unlocked = (stats.totalMessages || 0) >= requirement.count;
          break;
        case 'calculations_performed':
          unlocked = (stats.calculationsPerformed || 0) >= requirement.count;
          break;
        case 'documents_analyzed':
          unlocked = (stats.documentsAnalyzed || 0) >= requirement.count;
          break;
        case 'proposals_generated':
          unlocked = (stats.proposalsGenerated || 0) >= requirement.count;
          break;
        case 'daily_streak':
          unlocked = (stats.currentStreak || 0) >= requirement.count;
          break;
      }

      if (unlocked) {
        const newAchievement: InsertUserAchievement = {
          userId,
          achievementId: achievement.id
        };

        const [userAchievement] = await db
          .insert(userAchievements)
          .values(newAchievement)
          .returning();

        // Award points for the achievement
        await db
          .update(userStats)
          .set({ 
            totalPoints: (stats.totalPoints || 0) + achievement.points,
            updatedAt: new Date()
          })
          .where(eq(userStats.userId, userId));

        newlyUnlocked.push(userAchievement);
      }
    }

    return newlyUnlocked;
  }

  // Get user's achievements with achievement details
  async getUserAchievements(userId: string): Promise<(UserAchievement & { achievement: Achievement })[]> {
    const userAchievementsWithDetails = await db
      .select({
        id: userAchievements.id,
        userId: userAchievements.userId,
        achievementId: userAchievements.achievementId,
        unlockedAt: userAchievements.unlockedAt,
        progress: userAchievements.progress,
        achievement: achievements
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId));

    return userAchievementsWithDetails;
  }

  // Get achievement progress for user
  async getAchievementProgress(userId: string): Promise<{ achievement: Achievement; unlocked: boolean; progress: number; requirement: any }[]> {
    const stats = await this.getUserStats(userId);
    if (!stats) return [];

    const allAchievements = await db.select().from(achievements);
    const userUnlockedAchievements = await this.getUserAchievements(userId);
    const unlockedIds = userUnlockedAchievements.map(ua => ua.achievementId);

    return allAchievements.map(achievement => {
      const requirement = achievement.requirement as any;
      let progress = 0;

      switch (requirement.type) {
        case 'messages_sent':
          progress = Math.min((stats.totalMessages || 0) / requirement.count, 1);
          break;
        case 'calculations_performed':
          progress = Math.min((stats.calculationsPerformed || 0) / requirement.count, 1);
          break;
        case 'documents_analyzed':
          progress = Math.min((stats.documentsAnalyzed || 0) / requirement.count, 1);
          break;
        case 'proposals_generated':
          progress = Math.min((stats.proposalsGenerated || 0) / requirement.count, 1);
          break;
        case 'daily_streak':
          progress = Math.min((stats.currentStreak || 0) / requirement.count, 1);
          break;
        default:
          progress = unlockedIds.includes(achievement.id) ? 1 : 0;
      }

      return {
        achievement,
        unlocked: unlockedIds.includes(achievement.id),
        progress: Math.round(progress * 100),
        requirement
      };
    });
  }

  // Initialize default achievements in database
  async initializeAchievements(): Promise<void> {
    try {
      // Check if achievements already exist
      const existingCount = await db.select().from(achievements);
      if (existingCount.length > 0) return;

      // Insert default achievements
      await db.insert(achievements).values(DEFAULT_ACHIEVEMENTS);
      console.log('✅ Default achievements initialized');
    } catch (error) {
      console.error('Failed to initialize achievements:', error);
    }
  }

  // Chat Rating System Methods
  async submitChatRating(chatId: string, userId: string, rating: number, feedback?: string): Promise<void> {
    try {
      await db.insert(chatRatings).values({
        chatId,
        userId,
        rating,
        feedback,
        messageCount: 0, // Will be updated with actual count
        wasHelpful: rating >= 4
      });

      // Update user stats with new rating
      await this.updateUserRatingStats(userId);
      console.log(`📊 Chat rating submitted: ${rating}/5 stars for chat ${chatId}`);
    } catch (error) {
      console.error('Failed to submit chat rating:', error);
    }
  }

  async updateUserRatingStats(userId: string): Promise<void> {
    try {
      const ratings = await db.select()
        .from(chatRatings)
        .where(eq(chatRatings.userId, userId));

      if (ratings.length === 0) return;

      const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      const totalRatings = ratings.length;

      await db.update(userStats)
        .set({ 
          averageRating: Number(averageRating.toFixed(2)),
          totalRatings 
        })
        .where(eq(userStats.userId, userId));
    } catch (error) {
      console.error('Failed to update user rating stats:', error);
    }
  }

  async getLowRatedSessions(threshold: number = 3): Promise<any[]> {
    try {
      const lowRatedChats = await db.select({
        chatId: chatRatings.chatId,
        userId: chatRatings.userId,
        rating: chatRatings.rating,
        feedback: chatRatings.feedback,
        sessionNotes: chatRatings.sessionNotes,
        createdAt: chatRatings.createdAt,
        chatTitle: chats.title
      })
      .from(chatRatings)
      .innerJoin(chats, eq(chatRatings.chatId, chats.id))
      .where(lte(chatRatings.rating, threshold))
      .orderBy(desc(chatRatings.createdAt));

      return lowRatedChats;
    } catch (error) {
      console.error('Failed to get low rated sessions:', error);
      return [];
    }
  }

  // Daily Usage Tracking
  async trackDailyUsage(userId: string, action: string): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingUsage = await db.select()
        .from(dailyUsage)
        .where(and(
          eq(dailyUsage.userId, userId),
          eq(dailyUsage.date, today)
        ));

      if (existingUsage.length === 0) {
        // Create new daily usage record
        await db.insert(dailyUsage).values({
          userId,
          date: today,
          messagesCount: action === 'message' ? 1 : 0,
          chatsCreated: action === 'chat' ? 1 : 0,
          featuresUsed: [action],
          pointsEarned: this.getPointsForAction(action)
        });
      } else {
        // Update existing record
        const current = existingUsage[0];
        const newFeaturesUsed = [...(current.featuresUsed || [])];
        if (!newFeaturesUsed.includes(action)) {
          newFeaturesUsed.push(action);
        }

        await db.update(dailyUsage)
          .set({
            messagesCount: action === 'message' ? (current.messagesCount || 0) + 1 : current.messagesCount,
            chatsCreated: action === 'chat' ? (current.chatsCreated || 0) + 1 : current.chatsCreated,
            featuresUsed: newFeaturesUsed,
            pointsEarned: (current.pointsEarned || 0) + this.getPointsForAction(action)
          })
          .where(eq(dailyUsage.id, current.id));
      }

      // Update streak
      await this.updateUserStreak(userId);
    } catch (error) {
      console.error('Failed to track daily usage:', error);
    }
  }

  private getPointsForAction(action: string): number {
    const pointsMap: { [key: string]: number } = {
      'message': 1,
      'chat': 5,
      'calculator': 10,
      'document': 15,
      'proposal': 25
    };
    return pointsMap[action] || 1;
  }

  async updateUserStreak(userId: string): Promise<void> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentUsage = await db.select()
        .from(dailyUsage)
        .where(and(
          eq(dailyUsage.userId, userId),
          gte(dailyUsage.date, sevenDaysAgo)
        ))
        .orderBy(desc(dailyUsage.date));

      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculate current streak
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        
        const hasUsage = recentUsage.some(usage => 
          usage.date && usage.date.toDateString() === checkDate.toDateString()
        );

        if (hasUsage) {
          currentStreak++;
        } else if (i === 0) {
          // If no usage today, streak breaks
          break;
        } else {
          // If no usage on previous day, streak continues until break
          break;
        }
      }

      const stats = await this.getUserStats(userId);
      const longestStreak = Math.max(stats?.longestStreak || 0, currentStreak);

      await db.update(userStats)
        .set({ 
          currentStreak,
          longestStreak,
          lastActiveDate: new Date()
        })
        .where(eq(userStats.userId, userId));
    } catch (error) {
      console.error('Failed to update user streak:', error);
    }
  }

  // Leaderboard System
  async updateLeaderboards(): Promise<void> {
    try {
      // Update weekly leaderboard
      await this.updateLeaderboardPeriod('weekly');
      // Update monthly leaderboard  
      await this.updateLeaderboardPeriod('monthly');
      // Update all-time leaderboard
      await this.updateLeaderboardPeriod('all_time');
    } catch (error) {
      console.error('Failed to update leaderboards:', error);
    }
  }

  private async updateLeaderboardPeriod(period: 'weekly' | 'monthly' | 'all_time'): Promise<void> {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date = now;

    switch (period) {
      case 'weekly':
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all_time':
        periodStart = new Date('2024-01-01');
        break;
    }

    // Get top users by different metrics
    const metrics = ['messages', 'rating', 'streak', 'points'];

    for (const metric of metrics) {
      let topUsers: any[] = [];

      switch (metric) {
        case 'messages':
          topUsers = await db.select({
            userId: userStats.userId,
            score: userStats.totalMessages,
            firstName: users.firstName,
            lastName: users.lastName
          })
          .from(userStats)
          .innerJoin(users, eq(userStats.userId, users.id))
          .orderBy(desc(userStats.totalMessages))
          .limit(10);
          break;

        case 'rating':
          topUsers = await db.select({
            userId: userStats.userId,
            score: userStats.averageRating,
            firstName: users.firstName,
            lastName: users.lastName
          })
          .from(userStats)
          .innerJoin(users, eq(userStats.userId, users.id))
          .where(gte(userStats.totalRatings, 3)) // Minimum 3 ratings
          .orderBy(desc(userStats.averageRating))
          .limit(10);
          break;

        case 'streak':
          topUsers = await db.select({
            userId: userStats.userId,
            score: userStats.longestStreak,
            firstName: users.firstName,
            lastName: users.lastName
          })
          .from(userStats)
          .innerJoin(users, eq(userStats.userId, users.id))
          .orderBy(desc(userStats.longestStreak))
          .limit(10);
          break;

        case 'points':
          topUsers = await db.select({
            userId: userStats.userId,
            score: userStats.totalPoints,
            firstName: users.firstName,
            lastName: users.lastName
          })
          .from(userStats)
          .innerJoin(users, eq(userStats.userId, users.id))
          .orderBy(desc(userStats.totalPoints))
          .limit(10);
          break;
      }

      // Clear existing leaderboard for this period and metric
      await db.delete(leaderboards)
        .where(and(
          eq(leaderboards.period, period),
          eq(leaderboards.metric, metric)
        ));

      // Insert new leaderboard data
      const leaderboardData = topUsers.map((user, index) => ({
        userId: user.userId,
        period,
        rank: index + 1,
        score: user.score || 0,
        metric,
        periodStart,
        periodEnd
      }));

      if (leaderboardData.length > 0) {
        await db.insert(leaderboards).values(leaderboardData);
      }
    }
  }

  async getLeaderboard(period: 'weekly' | 'monthly' | 'all_time', metric: string): Promise<any[]> {
    try {
      return await db.select({
        rank: leaderboards.rank,
        userId: leaderboards.userId,
        score: leaderboards.score,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl
      })
      .from(leaderboards)
      .innerJoin(users, eq(leaderboards.userId, users.id))
      .where(and(
        eq(leaderboards.period, period),
        eq(leaderboards.metric, metric)
      ))
      .orderBy(leaderboards.rank)
      .limit(10);
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      return [];
    }
  }

  // Usage Analytics
  async getUserEngagementMetrics(userId: string): Promise<any> {
    try {
      const stats = await this.getUserStats(userId);
      const recentRatings = await db.select()
        .from(chatRatings)
        .where(eq(chatRatings.userId, userId))
        .orderBy(desc(chatRatings.createdAt))
        .limit(10);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentUsage = await db.select()
        .from(dailyUsage)
        .where(and(
          eq(dailyUsage.userId, userId),
          gte(dailyUsage.date, thirtyDaysAgo)
        ));

      const averageRating = recentRatings.length > 0 
        ? recentRatings.reduce((sum, r) => sum + r.rating, 0) / recentRatings.length 
        : 0;

      const totalRecentMessages = recentUsage.reduce((sum, day) => sum + (day.messagesCount || 0), 0);
      const activeDays = recentUsage.length;

      return {
        userId,
        totalMessages: stats?.totalMessages || 0,
        totalChats: stats?.totalChats || 0,
        currentStreak: stats?.currentStreak || 0,
        longestStreak: stats?.longestStreak || 0,
        averageRating: Number(averageRating.toFixed(2)),
        totalRatings: recentRatings.length,
        recentActivity: {
          messagesLast30Days: totalRecentMessages,
          activeDaysLast30Days: activeDays,
          dailyAverage: activeDays > 0 ? Math.round(totalRecentMessages / activeDays) : 0
        },
        level: stats?.level || 1,
        totalPoints: stats?.totalPoints || 0,
        lastActiveDate: stats?.lastActiveDate
      };
    } catch (error) {
      console.error('Failed to get user engagement metrics:', error);
      return null;
    }
  }
}

export const gamificationService = new GamificationService();