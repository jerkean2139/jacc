import { db } from './db';
import { userStats, userAchievements, users } from '@shared/schema';
import { eq, desc, sql, and, gte } from 'drizzle-orm';
import { emailNotificationService } from './email-notifications';

interface StreakAchievement {
  id: string;
  title: string;
  description: string;
  badgeIcon: string;
  points: number;
  streakDays: number;
  emailNotification: boolean;
}

const STREAK_ACHIEVEMENTS: StreakAchievement[] = [
  {
    id: 'first_login',
    title: 'Welcome to JACC!',
    description: 'First login to the platform',
    badgeIcon: '🎉',
    points: 10,
    streakDays: 1,
    emailNotification: true
  },
  {
    id: 'streak_3',
    title: 'Getting Started',
    description: '3 day login streak - You\'re building momentum!',
    badgeIcon: '🔥',
    points: 50,
    streakDays: 3,
    emailNotification: true
  },
  {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: '7 day login streak - You\'re unstoppable!',
    badgeIcon: '⚡',
    points: 100,
    streakDays: 7,
    emailNotification: true
  },
  {
    id: 'two_week_champion',
    title: 'Two Week Champion',
    description: '14 day login streak - Dedication pays off!',
    badgeIcon: '🏆',
    points: 200,
    streakDays: 14,
    emailNotification: true
  },
  {
    id: 'monthly_master',
    title: 'Monthly Master',
    description: '30 day login streak - You\'re a true professional!',
    badgeIcon: '👑',
    points: 500,
    streakDays: 30,
    emailNotification: true
  },
  {
    id: 'dedication_legend',
    title: 'Dedication Legend',
    description: '60 day login streak - Legendary commitment!',
    badgeIcon: '💎',
    points: 1000,
    streakDays: 60,
    emailNotification: true
  },
  {
    id: 'centurion',
    title: 'Centurion',
    description: '100 day login streak - You\'ve achieved the impossible!',
    badgeIcon: '🌟',
    points: 2000,
    streakDays: 100,
    emailNotification: true
  }
];

export class StreakGamificationEngine {
  /**
   * Track user login and update streak (Snapchat-style)
   */
  async trackUserLogin(userId: string): Promise<{
    newStreak: number;
    streakMaintained: boolean;
    achievementsEarned: StreakAchievement[];
    pointsEarned: number;
    levelUp: boolean;
  }> {
    try {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Get current user stats
      const userStat = await db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, userId))
        .limit(1);

      let newStreak = 1;
      let streakMaintained = false;
      let dailyLoginBonus = 10;
      let levelUp = false;
      let previousLevel = 1;

      if (userStat.length === 0) {
        // First time user - create stats
        await db.insert(userStats).values({
          userId,
          totalChats: 0,
          totalMessages: 0,
          totalPoints: dailyLoginBonus,
          level: 1,
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: today,
          calculationsPerformed: 0,
          documentsAnalyzed: 0,
          proposalsGenerated: 0,
          updatedAt: today
        });
        
        console.log(`🎯 New user registered: ${userId} with 1 day streak`);
      } else {
        const stats = userStat[0];
        previousLevel = stats.level || 1;
        const lastLogin = stats.lastActiveDate ? new Date(stats.lastActiveDate) : null;
        
        if (lastLogin) {
          const lastLoginStart = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());
          const daysDiff = Math.floor((todayStart.getTime() - lastLoginStart.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === 0) {
            // Same day login - no streak change but small bonus
            newStreak = stats.currentStreak || 1;
            streakMaintained = true;
            dailyLoginBonus = 5; // Reduced bonus for same day
          } else if (daysDiff === 1) {
            // Consecutive day - increment streak
            newStreak = (stats.currentStreak || 0) + 1;
            streakMaintained = true;
            
            // Progressive streak bonus calculation
            if (newStreak >= 100) dailyLoginBonus = 100;
            else if (newStreak >= 60) dailyLoginBonus = 75;
            else if (newStreak >= 30) dailyLoginBonus = 50;
            else if (newStreak >= 14) dailyLoginBonus = 30;
            else if (newStreak >= 7) dailyLoginBonus = 20;
            else if (newStreak >= 3) dailyLoginBonus = 15;
            
          } else {
            // Streak broken
            newStreak = 1;
            streakMaintained = false;
            console.log(`💔 Streak broken for ${userId}: was ${stats.currentStreak}, reset to 1`);
          }
        } else {
          newStreak = 1;
        }

        const newLongestStreak = Math.max(stats.longestStreak || 0, newStreak);
        const newTotalPoints = (stats.totalPoints || 0) + dailyLoginBonus;
        const newLevel = this.calculateLevel(newTotalPoints);
        levelUp = newLevel > previousLevel;
        
        // Update user stats
        await db
          .update(userStats)
          .set({
            currentStreak: newStreak,
            longestStreak: newLongestStreak,
            totalPoints: newTotalPoints,
            level: newLevel,
            lastActiveDate: today,
            updatedAt: today
          })
          .where(eq(userStats.userId, userId));

        console.log(`🔥 Login tracked for ${userId}: ${newStreak} day streak (+${dailyLoginBonus} points)`);
      }

      // Check for new streak achievements
      const achievementsEarned = await this.checkStreakAchievements(userId, newStreak);
      
      // Send email notifications for milestones
      for (const achievement of achievementsEarned) {
        if (achievement.emailNotification) {
          await emailNotificationService.sendStreakMilestoneEmail(userId, achievement.streakDays);
        }
      }

      return {
        newStreak,
        streakMaintained,
        achievementsEarned,
        pointsEarned: dailyLoginBonus,
        levelUp
      };
      
    } catch (error) {
      console.error('Error tracking user login:', error);
      return {
        newStreak: 1,
        streakMaintained: false,
        achievementsEarned: [],
        pointsEarned: 0,
        levelUp: false
      };
    }
  }

  /**
   * Update user activity stats (separate from login tracking)
   */
  async updateUserActivity(userId: string, activity: {
    chats?: number;
    messages?: number;
    documents?: number;
    proposals?: number;
    calculations?: number;
  }): Promise<{ pointsEarned: number; levelUp: boolean }> {
    try {
      const currentStats = await db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, userId))
        .limit(1);

      if (currentStats.length === 0) {
        // Initialize user first
        await this.trackUserLogin(userId);
        return this.updateUserActivity(userId, activity);
      }

      const stats = currentStats[0];
      const previousLevel = stats.level || 1;
      
      const newTotalChats = (stats.totalChats || 0) + (activity.chats || 0);
      const newTotalMessages = (stats.totalMessages || 0) + (activity.messages || 0);
      const newDocuments = (stats.documentsAnalyzed || 0) + (activity.documents || 0);
      const newProposals = (stats.proposalsGenerated || 0) + (activity.proposals || 0);
      const newCalculations = (stats.calculationsPerformed || 0) + (activity.calculations || 0);
      
      const activityPoints = this.calculateActivityPoints(activity);
      const newTotalPoints = (stats.totalPoints || 0) + activityPoints;
      const newLevel = this.calculateLevel(newTotalPoints);
      const levelUp = newLevel > previousLevel;
      
      await db
        .update(userStats)
        .set({
          totalChats: newTotalChats,
          totalMessages: newTotalMessages,
          calculationsPerformed: newCalculations,
          documentsAnalyzed: newDocuments,
          proposalsGenerated: newProposals,
          totalPoints: newTotalPoints,
          level: newLevel,
          updatedAt: new Date()
        })
        .where(eq(userStats.userId, userId));

      console.log(`📊 Activity tracked for ${userId}: +${activityPoints} points (Level ${newLevel})`);
      
      return { pointsEarned: activityPoints, levelUp };
      
    } catch (error) {
      console.error('Error updating user activity:', error);
      return { pointsEarned: 0, levelUp: false };
    }
  }

  private calculateActivityPoints(activity: any): number {
    let points = 0;
    points += (activity.chats || 0) * 10;      // 10 points per chat
    points += (activity.messages || 0) * 2;    // 2 points per message
    points += (activity.documents || 0) * 5;   // 5 points per document
    points += (activity.proposals || 0) * 20;  // 20 points per proposal
    points += (activity.calculations || 0) * 3; // 3 points per calculation
    return points;
  }

  private calculateLevel(totalPoints: number): number {
    // Progressive level calculation
    if (totalPoints >= 10000) return 10; // Master level
    if (totalPoints >= 5000) return 9;   // Expert level
    if (totalPoints >= 2500) return 8;   // Advanced level
    if (totalPoints >= 1500) return 7;   // Proficient level
    if (totalPoints >= 1000) return 6;   // Skilled level
    if (totalPoints >= 600) return 5;    // Experienced level
    if (totalPoints >= 300) return 4;    // Intermediate level
    if (totalPoints >= 150) return 3;    // Developing level
    if (totalPoints >= 50) return 2;     // Beginner level
    return 1;                           // Novice level
  }

  /**
   * Check for streak-based achievements
   */
  private async checkStreakAchievements(userId: string, currentStreak: number): Promise<StreakAchievement[]> {
    const streakAchievements = STREAK_ACHIEVEMENTS.filter(a => a.streakDays === currentStreak);
    const earned: StreakAchievement[] = [];
    
    for (const achievement of streakAchievements) {
      const alreadyEarned = await this.hasAchievement(userId, achievement.id);
      if (!alreadyEarned) {
        await this.awardAchievement(userId, achievement);
        earned.push(achievement);
      }
    }
    
    return earned;
  }

  private async hasAchievement(userId: string, achievementId: string): Promise<boolean> {
    const existing = await db
      .select()
      .from(userAchievements)
      .where(and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.achievementId, achievementId)
      ))
      .limit(1);
    
    return existing.length > 0;
  }

  private async awardAchievement(userId: string, achievement: StreakAchievement): Promise<void> {
    try {
      await db.insert(userAchievements).values({
        userId,
        achievementId: achievement.id,
        title: achievement.title,
        description: achievement.description,
        badgeIcon: achievement.badgeIcon,
        pointsAwarded: achievement.points,
        earnedAt: new Date()
      });

      // Award bonus points
      await db
        .update(userStats)
        .set({
          totalPoints: sql`${userStats.totalPoints} + ${achievement.points}`,
          updatedAt: new Date()
        })
        .where(eq(userStats.userId, userId));

      console.log(`🏆 Achievement earned: ${achievement.title} (+${achievement.points} points) by ${userId}`);
    } catch (error) {
      console.error('Error awarding achievement:', error);
    }
  }

  /**
   * Get user's current streak status
   */
  async getUserStreakStatus(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: Date | null;
    nextMilestone: StreakAchievement | null;
    daysUntilNextMilestone: number;
  }> {
    try {
      const userStat = await db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, userId))
        .limit(1);

      if (userStat.length === 0) {
        return {
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: null,
          nextMilestone: STREAK_ACHIEVEMENTS[0],
          daysUntilNextMilestone: 1
        };
      }

      const stats = userStat[0];
      const currentStreak = stats.currentStreak || 0;
      
      // Find next milestone
      const nextMilestone = STREAK_ACHIEVEMENTS.find(a => a.streakDays > currentStreak);
      const daysUntilNextMilestone = nextMilestone ? nextMilestone.streakDays - currentStreak : 0;

      return {
        currentStreak,
        longestStreak: stats.longestStreak || 0,
        lastActiveDate: stats.lastActiveDate,
        nextMilestone: nextMilestone || null,
        daysUntilNextMilestone
      };
    } catch (error) {
      console.error('Error getting user streak status:', error);
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        nextMilestone: null,
        daysUntilNextMilestone: 0
      };
    }
  }

  /**
   * Get leaderboard with streak emphasis
   */
  async getStreakLeaderboard(limit: number = 10): Promise<any[]> {
    try {
      const leaderboard = await db
        .select({
          userId: userStats.userId,
          username: users.username,
          totalPoints: userStats.totalPoints,
          level: userStats.level,
          currentStreak: userStats.currentStreak,
          longestStreak: userStats.longestStreak,
          totalChats: userStats.totalChats,
          totalMessages: userStats.totalMessages,
          lastActiveDate: userStats.lastActiveDate
        })
        .from(userStats)
        .leftJoin(users, eq(userStats.userId, users.id))
        .orderBy(desc(userStats.currentStreak), desc(userStats.totalPoints))
        .limit(limit);

      return leaderboard.map((user, index) => ({
        ...user,
        rank: index + 1,
        isStreakActive: this.isStreakActive(user.lastActiveDate)
      }));
    } catch (error) {
      console.error('Error fetching streak leaderboard:', error);
      return [];
    }
  }

  private isStreakActive(lastActiveDate: Date | null): boolean {
    if (!lastActiveDate) return false;
    
    const today = new Date();
    const lastActive = new Date(lastActiveDate);
    const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysDiff <= 1; // Active if logged in today or yesterday
  }

  /**
   * Send streak reminder notifications to inactive users
   */
  async sendStreakReminders(): Promise<void> {
    try {
      await emailNotificationService.sendDailyLoginReminders();
      console.log('📧 Streak reminder emails sent to inactive users');
    } catch (error) {
      console.error('Error sending streak reminders:', error);
    }
  }

  /**
   * Get streak analytics for management
   */
  async getStreakAnalytics(): Promise<{
    totalUsers: number;
    activeStreaks: number;
    averageStreak: number;
    maxStreak: number;
    usersWithWeekStreak: number;
    usersWithMonthStreak: number;
    streakRetentionRate: number;
  }> {
    try {
      const streakData = await db
        .select({
          totalUsers: sql<number>`COUNT(*)`,
          activeStreaks: sql<number>`COUNT(CASE WHEN ${userStats.currentStreak} > 0 THEN 1 END)`,
          averageStreak: sql<number>`AVG(${userStats.currentStreak})`,
          maxStreak: sql<number>`MAX(${userStats.longestStreak})`,
          usersWithWeekStreak: sql<number>`COUNT(CASE WHEN ${userStats.currentStreak} >= 7 THEN 1 END)`,
          usersWithMonthStreak: sql<number>`COUNT(CASE WHEN ${userStats.currentStreak} >= 30 THEN 1 END)`
        })
        .from(userStats);

      const data = streakData[0] || {};
      const streakRetentionRate = data.totalUsers > 0 ? (data.activeStreaks / data.totalUsers) * 100 : 0;

      return {
        totalUsers: data.totalUsers || 0,
        activeStreaks: data.activeStreaks || 0,
        averageStreak: Math.round(data.averageStreak || 0),
        maxStreak: data.maxStreak || 0,
        usersWithWeekStreak: data.usersWithWeekStreak || 0,
        usersWithMonthStreak: data.usersWithMonthStreak || 0,
        streakRetentionRate: Math.round(streakRetentionRate)
      };
    } catch (error) {
      console.error('Error getting streak analytics:', error);
      return {
        totalUsers: 0,
        activeStreaks: 0,
        averageStreak: 0,
        maxStreak: 0,
        usersWithWeekStreak: 0,
        usersWithMonthStreak: 0,
        streakRetentionRate: 0
      };
    }
  }
}

export const streakGamificationEngine = new StreakGamificationEngine();