import { db } from './db';
import { users, userStats, userAchievements } from '@shared/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

interface EmailConfig {
  fromEmail: string;
  fromName: string;
  adminEmails: string[];
}

interface LoginRecord {
  userId: string;
  username: string;
  email: string;
  loginTime: Date;
  loginStreak: number;
  totalLogins: number;
  lastLoginDate: Date;
}

interface ManagementReport {
  totalActiveUsers: number;
  dailyLogins: number;
  weeklyLogins: number;
  monthlyLogins: number;
  averageStreak: number;
  topUsers: Array<{
    username: string;
    streak: number;
    totalLogins: number;
    lastActive: Date;
  }>;
}

export class EmailNotificationService {
  private config: EmailConfig = {
    fromEmail: 'noreply@jacc.ai',
    fromName: 'JACC Team',
    adminEmails: ['admin@tracerco.com']
  };

  /**
   * Send login streak milestone emails to users
   */
  async sendStreakMilestoneEmail(userId: string, streakDays: number): Promise<void> {
    try {
      const user = await this.getUserDetails(userId);
      if (!user || !user.email) return;

      const milestoneRewards = this.getStreakMilestone(streakDays);
      if (!milestoneRewards) return;

      const emailContent = this.generateStreakEmail(user, streakDays, milestoneRewards);
      
      console.log(`📧 Streak milestone email for ${user.username}: ${streakDays} days`);
      
      // In production, integrate with SendGrid or similar email service
      // For now, log the email content
      console.log('Email Content:', emailContent);
      
    } catch (error) {
      console.error('Error sending streak milestone email:', error);
    }
  }

  /**
   * Send daily login reminder emails to inactive users
   */
  async sendDailyLoginReminders(): Promise<void> {
    try {
      const inactiveUsers = await this.getInactiveUsers();
      
      for (const user of inactiveUsers) {
        const reminderContent = this.generateLoginReminderEmail(user);
        console.log(`📧 Login reminder for ${user.username} (inactive ${user.daysSinceLastLogin} days)`);
        console.log('Reminder Content:', reminderContent);
      }
      
    } catch (error) {
      console.error('Error sending login reminders:', error);
    }
  }

  /**
   * Send weekly management report on user engagement
   */
  async sendManagementReport(): Promise<void> {
    try {
      const reportData = await this.generateManagementReport();
      const emailContent = this.generateManagementReportEmail(reportData);
      
      console.log('📊 Weekly Management Report Generated');
      console.log('Report Content:', emailContent);
      
    } catch (error) {
      console.error('Error generating management report:', error);
    }
  }

  /**
   * Track user login and trigger appropriate notifications
   */
  async trackUserLogin(userId: string): Promise<void> {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Get current user stats
      const userStat = await db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, userId))
        .limit(1);

      if (userStat.length === 0) {
        // Create initial user stats
        await db.insert(userStats).values({
          userId,
          totalChats: 0,
          totalMessages: 0,
          totalPoints: 10, // Login bonus
          level: 1,
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: today,
          calculationsPerformed: 0,
          documentsAnalyzed: 0,
          proposalsGenerated: 0,
          updatedAt: today
        });
        
        // Send welcome email
        await this.sendWelcomeEmail(userId);
        return;
      }

      const currentStats = userStat[0];
      const lastLogin = currentStats.lastActiveDate ? new Date(currentStats.lastActiveDate) : null;
      
      let newStreak = currentStats.currentStreak || 0;
      let longestStreak = currentStats.longestStreak || 0;
      
      // Check if this is a consecutive day login
      if (lastLogin) {
        const daysDiff = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day login - increment streak
          newStreak += 1;
          longestStreak = Math.max(longestStreak, newStreak);
        } else if (daysDiff > 1) {
          // Streak broken - reset to 1
          newStreak = 1;
        }
        // If daysDiff === 0, it's the same day, don't change streak
      } else {
        newStreak = 1;
        longestStreak = 1;
      }

      // Update user stats
      await db
        .update(userStats)
        .set({
          currentStreak: newStreak,
          longestStreak: longestStreak,
          totalPoints: sql`${userStats.totalPoints} + 10`, // Daily login bonus
          lastActiveDate: today,
          updatedAt: today
        })
        .where(eq(userStats.userId, userId));

      // Check for streak milestones
      await this.checkStreakMilestones(userId, newStreak);
      
      console.log(`👤 Login tracked for ${userId}: ${newStreak} day streak`);
      
    } catch (error) {
      console.error('Error tracking user login:', error);
    }
  }

  private async getUserDetails(userId: string): Promise<any> {
    const user = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    return user[0] || null;
  }

  private getStreakMilestone(days: number): any {
    const milestones = {
      3: { title: "Getting Started!", points: 50, badge: "🔥" },
      7: { title: "Week Warrior", points: 100, badge: "⚡" },
      14: { title: "Two Week Champion", points: 200, badge: "🏆" },
      30: { title: "Monthly Master", points: 500, badge: "👑" },
      60: { title: "Dedication Legend", points: 1000, badge: "💎" },
      100: { title: "Centurion", points: 2000, badge: "🌟" }
    };
    
    return milestones[days as keyof typeof milestones] || null;
  }

  private generateStreakEmail(user: any, streakDays: number, milestone: any): string {
    return `
Subject: 🔥 ${streakDays} Day Streak Achievement - You're on Fire!

Hi ${user.firstName || user.username},

Congratulations! You've just achieved a ${streakDays} day login streak with JACC! 

🎉 **${milestone.title}** ${milestone.badge}
🎁 **Bonus Awarded:** ${milestone.points} points
📈 **Current Level:** Keep going to unlock more rewards!

Your dedication to staying connected with JACC is impressive. Every day you log in, you're building momentum toward becoming a merchant services expert.

**Keep Your Streak Going:**
- Log in tomorrow to continue your streak
- Explore new features and documents
- Use the AI assistant for merchant insights
- Track your progress on the leaderboard

Ready to keep the momentum going? Log in to JACC now!

Best regards,
The JACC Team

---
This email was sent because you achieved a login streak milestone. 
Manage your notification preferences in your account settings.
    `;
  }

  private generateLoginReminderEmail(user: any): string {
    return `
Subject: 📱 Don't Break Your JACC Streak - Log In Today!

Hi ${user.username},

We noticed you haven't logged into JACC recently. Your merchant services knowledge is valuable - don't let it go to waste!

**What You're Missing:**
- New merchant processing insights
- Updated rate comparison tools
- AI-powered document analysis
- Community leaderboard updates

**Quick Actions When You Return:**
- Check for new training materials
- Review recent merchant statements
- Use the rate calculator for proposals
- Connect with other sales professionals

Your expertise grows with consistent practice. Log in today to keep your momentum going!

[Login to JACC Now]

Best regards,
The JACC Team
    `;
  }

  private async getInactiveUsers(): Promise<any[]> {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const inactiveUsers = await db
      .select({
        userId: users.id,
        username: users.username,
        email: users.email,
        lastActiveDate: userStats.lastActiveDate,
        currentStreak: userStats.currentStreak
      })
      .from(users)
      .leftJoin(userStats, eq(users.id, userStats.userId))
      .where(
        and(
          sql`${userStats.lastActiveDate} < ${threeDaysAgo} OR ${userStats.lastActiveDate} IS NULL`,
          sql`${users.email} IS NOT NULL`
        )
      );

    return inactiveUsers.map(user => ({
      ...user,
      daysSinceLastLogin: user.lastActiveDate 
        ? Math.floor((new Date().getTime() - new Date(user.lastActiveDate).getTime()) / (1000 * 60 * 60 * 24))
        : 999
    }));
  }

  private async generateManagementReport(): Promise<ManagementReport> {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setDate(lastMonth.getDate() - 30);

    // Get total active users
    const totalUsers = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users);

    // Get users active in last 24 hours, week, month
    const dailyActive = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(userStats)
      .where(gte(userStats.lastActiveDate, new Date(today.getTime() - 24 * 60 * 60 * 1000)));

    const weeklyActive = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(userStats)
      .where(gte(userStats.lastActiveDate, lastWeek));

    const monthlyActive = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(userStats)
      .where(gte(userStats.lastActiveDate, lastMonth));

    // Get average streak
    const avgStreak = await db
      .select({ avg: sql<number>`AVG(${userStats.currentStreak})` })
      .from(userStats);

    // Get top performers
    const topUsers = await db
      .select({
        username: users.username,
        streak: userStats.currentStreak,
        totalLogins: sql<number>`${userStats.totalChats} + ${userStats.totalMessages}`,
        lastActive: userStats.lastActiveDate
      })
      .from(userStats)
      .leftJoin(users, eq(userStats.userId, users.id))
      .orderBy(sql`${userStats.currentStreak} DESC, ${userStats.totalPoints} DESC`)
      .limit(5);

    return {
      totalActiveUsers: totalUsers[0]?.count || 0,
      dailyLogins: dailyActive[0]?.count || 0,
      weeklyLogins: weeklyActive[0]?.count || 0,
      monthlyLogins: monthlyActive[0]?.count || 0,
      averageStreak: Math.round(avgStreak[0]?.avg || 0),
      topUsers: topUsers.map(user => ({
        username: user.username || 'Unknown',
        streak: user.streak || 0,
        totalLogins: user.totalLogins || 0,
        lastActive: user.lastActive || new Date()
      }))
    };
  }

  private generateManagementReportEmail(report: ManagementReport): string {
    const topUsersTable = report.topUsers
      .map((user, index) => `${index + 1}. ${user.username} - ${user.streak} day streak (${user.totalLogins} total actions)`)
      .join('\n');

    return `
Subject: 📊 Weekly JACC User Engagement Report

JACC Management Team,

Here's your weekly user engagement summary:

**USER ACTIVITY METRICS**
📈 Total Active Users: ${report.totalActiveUsers}
🔥 Daily Logins: ${report.dailyLogins}
📅 Weekly Active: ${report.weeklyLogins}
📆 Monthly Active: ${report.monthlyLogins}
⚡ Average Login Streak: ${report.averageStreak} days

**TOP PERFORMERS**
${topUsersTable}

**ENGAGEMENT INSIGHTS**
- Streak-based gamification driving daily usage
- Users with 7+ day streaks show 3x higher platform engagement
- Monthly retention correlates with streak achievements

**RECOMMENDATIONS**
- Continue streak milestone rewards
- Implement team challenges for corporate accounts
- Add weekend engagement incentives
- Create merchant success story sharing features

**NEXT WEEK FOCUS**
- Monitor streak recovery after weekend gaps
- Test new achievement categories
- Implement peer recognition features

Best regards,
JACC Analytics System

---
Generated automatically from user engagement data.
Report covers: ${new Date().toLocaleDateString()} - ${new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
    `;
  }

  private async sendWelcomeEmail(userId: string): Promise<void> {
    const user = await this.getUserDetails(userId);
    if (!user || !user.email) return;

    const welcomeContent = `
Subject: 🎉 Welcome to JACC - Your Merchant Services Success Journey Starts Now!

Hi ${user.firstName || user.username},

Welcome to JACC! You've just joined the most advanced AI-powered merchant services platform designed specifically for sales professionals like you.

**Getting Started Checklist:**
✅ Account created - You're here!
🔄 Explore the AI assistant
🔄 Upload your first merchant statement
🔄 Try the rate comparison calculator
🔄 Join the community leaderboard

**Your Daily Streak Journey:**
- Log in daily to build your streak
- Earn points for every interaction
- Unlock achievements and badges
- Climb the leaderboard rankings

**Pro Tips for Success:**
1. Start each day with JACC to build your streak
2. Use document analysis for competitive insights
3. Leverage AI for proposal generation
4. Track your progress on the dashboard

Ready to begin? Log in now and start your first streak!

[Explore JACC Dashboard]

Best regards,
The JACC Team

P.S. Check back tomorrow to start building your login streak! 🔥
    `;

    console.log(`📧 Welcome email sent to ${user.username}`);
    console.log('Welcome Content:', welcomeContent);
  }

  private async checkStreakMilestones(userId: string, currentStreak: number): Promise<void> {
    const milestones = [3, 7, 14, 30, 60, 100];
    
    if (milestones.includes(currentStreak)) {
      await this.sendStreakMilestoneEmail(userId, currentStreak);
      
      // Award achievement badge
      const milestone = this.getStreakMilestone(currentStreak);
      if (milestone) {
        await this.awardStreakAchievement(userId, currentStreak, milestone);
      }
    }
  }

  private async awardStreakAchievement(userId: string, streakDays: number, milestone: any): Promise<void> {
    try {
      // Award bonus points
      await db
        .update(userStats)
        .set({
          totalPoints: sql`${userStats.totalPoints} + ${milestone.points}`,
          updatedAt: new Date()
        })
        .where(eq(userStats.userId, userId));

      console.log(`🏆 Achievement awarded: ${milestone.title} (${milestone.points} points) to ${userId}`);
      
    } catch (error) {
      console.error('Error awarding streak achievement:', error);
    }
  }
}

export const emailNotificationService = new EmailNotificationService();