import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Calendar, Trophy, Zap, Target, TrendingUp } from "lucide-react";

interface UsageStats {
  userId: string;
  totalMessages: number;
  totalChats: number;
  currentStreak: number;
  longestStreak: number;
  averageRating: number;
  totalRatings: number;
  level: number;
  totalPoints: number;
  recentActivity: {
    messagesLast30Days: number;
    activeDaysLast30Days: number;
    dailyAverage: number;
  };
}

export function UsageMeter() {
  const { data: userStats, isLoading } = useQuery<UsageStats>({
    queryKey: ["/api/user/engagement"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: achievements } = useQuery({
    queryKey: ["/api/achievements/progress"],
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Loading Usage Stats...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userStats) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Usage Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Start using JACC to see your progress!</p>
        </CardContent>
      </Card>
    );
  }

  const levelProgress = ((userStats.totalPoints % 1000) / 1000) * 100;
  const nextLevelPoints = Math.ceil(userStats.totalPoints / 1000) * 1000;
  const pointsToNext = nextLevelPoints - userStats.totalPoints;

  const streakColor = userStats.currentStreak >= 7 ? "bg-green-500" : 
                     userStats.currentStreak >= 3 ? "bg-yellow-500" : "bg-gray-400";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Usage Tracker
          </div>
          <Badge variant="secondary" className="text-blue-600">
            Level {userStats.level}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Level Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Level Progress</span>
            <span>{pointsToNext} points to next level</span>
          </div>
          <Progress value={levelProgress} className="h-2" />
          <div className="text-xs text-gray-500 text-center">
            {userStats.totalPoints} / {nextLevelPoints} points
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-blue-700">
                {userStats.totalMessages}
              </div>
              <div className="text-sm text-blue-600">Messages</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <Calendar className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-700">
                {userStats.currentStreak}
              </div>
              <div className="text-sm text-green-600">Day Streak</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <Trophy className="w-8 h-8 text-purple-600" />
            <div>
              <div className="text-2xl font-bold text-purple-700">
                {userStats.averageRating > 0 ? userStats.averageRating.toFixed(1) : "N/A"}
              </div>
              <div className="text-sm text-purple-600">Avg Rating</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
            <Target className="w-8 h-8 text-orange-600" />
            <div>
              <div className="text-2xl font-bold text-orange-700">
                {userStats.totalChats}
              </div>
              <div className="text-sm text-orange-600">Total Chats</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Recent Activity (30 days)
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-lg font-semibold">{userStats.recentActivity.messagesLast30Days}</div>
              <div className="text-xs text-gray-600">Messages</div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-lg font-semibold">{userStats.recentActivity.activeDaysLast30Days}</div>
              <div className="text-xs text-gray-600">Active Days</div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-lg font-semibold">{userStats.recentActivity.dailyAverage}</div>
              <div className="text-xs text-gray-600">Daily Avg</div>
            </div>
          </div>
        </div>

        {/* Streak Indicator */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${streakColor}`} />
            <span className="text-sm font-medium">
              {userStats.currentStreak === 0 ? "Start your streak today!" :
               userStats.currentStreak === 1 ? "Great start! Keep it up!" :
               userStats.currentStreak < 7 ? `${userStats.currentStreak} days strong!` :
               "Amazing streak!"}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Best: {userStats.longestStreak} days
          </div>
        </div>
      </CardContent>
    </Card>
  );
}