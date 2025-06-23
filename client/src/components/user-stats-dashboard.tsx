import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trophy,
  Star,
  TrendingUp,
  MessageCircle,
  Calculator,
  FileText,
  Calendar,
  Award,
  Target,
  Zap,
  Crown
} from "lucide-react";
import AchievementBadge from "./achievement-badge";
import { LeaderboardWidget } from "./leaderboard-widget";
import { cn } from "@/lib/utils";
import type { UserStats, Achievement, UserAchievement } from "@shared/schema";

interface UserStatsDashboardProps {
  userId?: string;
  compact?: boolean;
}

interface AchievementProgress {
  achievement: Achievement;
  unlocked: boolean;
  progress: number;
  requirement: any;
}

export default function UserStatsDashboard({ userId, compact = false }: UserStatsDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();

  // Fetch user stats
  const { data: userStats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
    enabled: !!userId
  });

  // Fetch user achievements
  const { data: userAchievements, isLoading: achievementsLoading } = useQuery<(UserAchievement & { achievement: Achievement })[]>({
    queryKey: ["/api/user/achievements"],
    enabled: !!userId
  });

  // Fetch achievement progress
  const { data: achievementProgress, isLoading: progressLoading } = useQuery<AchievementProgress[]>({
    queryKey: ["/api/achievements/progress"],
    enabled: !!userId
  });

  // Track action mutation
  const trackActionMutation = useMutation({
    mutationFn: async (action: string) => {
      const response = await fetch("/api/user/track-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/achievements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/achievements/progress"] });
    }
  });

  if (statsLoading || achievementsLoading || progressLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!userStats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">No stats available</p>
        </CardContent>
      </Card>
    );
  }

  const calculateLevel = (totalPoints: number) => Math.floor(totalPoints / 100) + 1;
  const calculateLevelProgress = (totalPoints: number) => (totalPoints % 100);
  
  const unlockedAchievements = achievementProgress?.filter(ap => ap.unlocked) || [];
  const recentAchievements = userAchievements?.slice(0, 3) || [];

  if (compact) {
    return (
      <div className="space-y-4">
        {/* Level & Points */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Level</p>
                  <p className="text-2xl font-bold">{calculateLevel(userStats.totalPoints || 0)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Points</p>
                <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                  {userStats.totalPoints || 0}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>Progress to Level {calculateLevel(userStats.totalPoints || 0) + 1}</span>
                <span>{calculateLevelProgress(userStats.totalPoints || 0)}/100</span>
              </div>
              <Progress value={calculateLevelProgress(userStats.totalPoints || 0)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {recentAchievements.map((ua) => (
                  <AchievementBadge
                    key={ua.id}
                    achievement={ua.achievement}
                    unlocked={true}
                    userAchievement={ua}
                    size="sm"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Messages</p>
                <p className="text-xl font-semibold">{userStats.totalMessages || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Calculator className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Calculations</p>
                <p className="text-xl font-semibold">{userStats.calculationsPerformed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Documents</p>
                <p className="text-xl font-semibold">{userStats.documentsAnalyzed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Streak</p>
                <p className="text-xl font-semibold">{userStats.currentStreak || 0} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Level Progress
          </CardTitle>
          <CardDescription>
            Earn points by using JACC features to level up!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {calculateLevel(userStats.totalPoints || 0)}
                </span>
              </div>
              <div>
                <p className="text-lg font-semibold">Level {calculateLevel(userStats.totalPoints || 0)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {userStats.totalPoints || 0} total points
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
              {calculateLevelProgress(userStats.totalPoints || 0)}/100 XP
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to Level {calculateLevel(userStats.totalPoints || 0) + 1}</span>
              <span>{calculateLevelProgress(userStats.totalPoints || 0)}%</span>
            </div>
            <Progress value={calculateLevelProgress(userStats.totalPoints || 0)} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="unlocked">Unlocked ({unlockedAchievements.length})</TabsTrigger>
          <TabsTrigger value="all">All Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Achievement Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {unlockedAchievements.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Unlocked</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {achievementProgress?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.round(((unlockedAchievements.length) / (achievementProgress?.length || 1)) * 100)}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Complete</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {userStats.totalPoints || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Points</p>
                </div>
              </div>

              {recentAchievements.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Recent Achievements</h4>
                  <div className="flex gap-3">
                    {recentAchievements.map((ua) => (
                      <AchievementBadge
                        key={ua.id}
                        achievement={ua.achievement}
                        unlocked={true}
                        userAchievement={ua}
                        size="md"
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agent Leaderboard */}
          <LeaderboardWidget showFullLeaderboard={false} maxEntries={5} />
        </TabsContent>

        <TabsContent value="unlocked">
          <Card>
            <CardHeader>
              <CardTitle>Unlocked Achievements</CardTitle>
              <CardDescription>
                Congratulations on your achievements!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {unlockedAchievements.map((ap) => {
                    const userAchievement = userAchievements?.find(ua => ua.achievementId === ap.achievement.id);
                    return (
                      <AchievementBadge
                        key={ap.achievement.id}
                        achievement={ap.achievement}
                        unlocked={true}
                        userAchievement={userAchievement}
                        size="md"
                      />
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Achievements</CardTitle>
              <CardDescription>
                Track your progress towards unlocking all achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {achievementProgress?.map((ap) => {
                    const userAchievement = userAchievements?.find(ua => ua.achievementId === ap.achievement.id);
                    return (
                      <AchievementBadge
                        key={ap.achievement.id}
                        achievement={ap.achievement}
                        unlocked={ap.unlocked}
                        progress={ap.progress}
                        userAchievement={userAchievement}
                        size="md"
                      />
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}