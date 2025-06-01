import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award, TrendingUp, MessageSquare, Calculator, FileText, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardUser {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  stats: {
    totalChats: number;
    totalMessages: number;
    calculationsPerformed: number;
    documentsAnalyzed: number;
    proposalsGenerated: number;
    currentStreak: number;
    longestStreak: number;
    totalPoints: number;
    level: number;
  };
  rank: number;
}

interface UserStatsCardProps {
  user: LeaderboardUser;
  currentUserId: string;
}

function UserStatsCard({ user, currentUserId }: UserStatsCardProps) {
  const isCurrentUser = user.id === currentUserId;
  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.username;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  const getLevelBadgeColor = (level: number) => {
    if (level >= 10) return "bg-purple-500 text-white";
    if (level >= 7) return "bg-blue-500 text-white";
    if (level >= 4) return "bg-green-500 text-white";
    return "bg-gray-500 text-white";
  };

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      isCurrentUser && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            {getRankIcon(user.rank)}
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.profileImageUrl} alt={displayName} />
              <AvatarFallback>
                {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium truncate">
                {displayName}
                {isCurrentUser && <span className="text-blue-600 ml-1">(You)</span>}
              </p>
              <Badge className={getLevelBadgeColor(user.stats.level)}>
                Level {user.stats.level}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <MessageSquare className="h-3 w-3" />
                <span>{user.stats.totalChats} chats</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calculator className="h-3 w-3" />
                <span>{user.stats.calculationsPerformed} calcs</span>
              </div>
              <div className="flex items-center space-x-1">
                <FileText className="h-3 w-3" />
                <span>{user.stats.documentsAnalyzed} docs</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className="h-3 w-3" />
                <span>{user.stats.currentStreak} streak</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-lg font-bold text-blue-600">
              {user.stats.totalPoints.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">points</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface LeaderboardProps {
  currentUserId: string;
  limit?: number;
  showCurrentUser?: boolean;
}

export function Leaderboard({ currentUserId, limit = 10, showCurrentUser = true }: LeaderboardProps) {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["/api/gamification/leaderboard", limit],
    refetchInterval: 30000, // Update every 30 seconds
  });

  const { data: currentUserStats } = useQuery({
    queryKey: ["/api/gamification/user-stats", currentUserId],
    enabled: showCurrentUser,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Leaderboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const topUsers = leaderboard?.slice(0, limit) || [];
  const currentUserInTop = showCurrentUser && currentUserStats && 
    topUsers.some(user => user.id === currentUserId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Leaderboard</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topUsers.map((user) => (
          <UserStatsCard 
            key={user.id} 
            user={user} 
            currentUserId={currentUserId}
          />
        ))}

        {showCurrentUser && currentUserStats && !currentUserInTop && (
          <>
            <div className="border-t pt-3">
              <p className="text-sm text-muted-foreground mb-2">Your Position:</p>
              <UserStatsCard 
                user={currentUserStats} 
                currentUserId={currentUserId}
              />
            </div>
          </>
        )}

        {topUsers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activity data yet. Start chatting to appear on the leaderboard!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default Leaderboard;