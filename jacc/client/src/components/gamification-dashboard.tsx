import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Trophy, 
  MessageSquare, 
  Calculator, 
  FileText, 
  Zap, 
  Star,
  TrendingUp,
  Target,
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserStats {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  totalChats: number;
  totalMessages: number;
  calculationsPerformed: number;
  documentsAnalyzed: number;
  proposalsGenerated: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  level: number;
  rank: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  subtitle?: string;
  color?: string;
}

function StatCard({ title, value, icon, subtitle, color = "blue" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "p-2 rounded-lg",
            color === "blue" && "bg-blue-100 dark:bg-blue-900",
            color === "green" && "bg-green-100 dark:bg-green-900",
            color === "yellow" && "bg-yellow-100 dark:bg-yellow-900",
            color === "purple" && "bg-purple-100 dark:bg-purple-900"
          )}>
            {icon}
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold">{value.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">{title}</div>
            {subtitle && (
              <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface LeaderboardEntryProps {
  user: UserStats;
  currentUserId: string;
  position: number;
}

function LeaderboardEntry({ user, currentUserId, position }: LeaderboardEntryProps) {
  const isCurrentUser = user.id === currentUserId;
  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.username;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Award className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Star className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  return (
    <div className={cn(
      "flex items-center space-x-3 p-3 rounded-lg transition-colors",
      isCurrentUser ? "bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800" : "hover:bg-gray-50 dark:hover:bg-gray-800"
    )}>
      <div className="flex items-center space-x-2">
        {getRankIcon(position)}
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.profileImageUrl} alt={displayName} />
          <AvatarFallback className="text-xs">
            {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium truncate">
            {displayName}
            {isCurrentUser && <span className="text-blue-600 ml-1">(You)</span>}
          </span>
          <Badge variant="secondary" className="text-xs">
            Level {user.level}
          </Badge>
        </div>
        <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
          <span>{user.totalChats} chats</span>
          <span>{user.currentStreak} streak</span>
        </div>
      </div>
      
      <div className="text-right">
        <div className="text-sm font-bold text-blue-600">
          {user.totalPoints.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground">points</div>
      </div>
    </div>
  );
}

interface GamificationDashboardProps {
  currentUserId: string;
}

export function GamificationDashboard({ currentUserId }: GamificationDashboardProps) {
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/gamification/user-stats", currentUserId],
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ["/api/gamification/leaderboard", 10],
    refetchInterval: 30000,
  });

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 rounded w-16 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!userStats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Start Your Journey</h3>
          <p className="text-muted-foreground">
            Begin chatting with JACC to start earning points and climbing the leaderboard!
          </p>
        </CardContent>
      </Card>
    );
  }

  const progressToNextLevel = ((userStats.totalPoints % 100) / 100) * 100;
  const pointsToNextLevel = 100 - (userStats.totalPoints % 100);

  return (
    <div className="space-y-6">
      {/* Personal Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Chat Sessions"
          value={userStats.totalChats || 0}
          icon={<MessageSquare className="h-4 w-4 text-blue-600" />}
          subtitle={`${userStats.totalMessages || 0} total messages`}
          color="blue"
        />
        <StatCard 
          title="Documents Analyzed"
          value={userStats.documentsAnalyzed || 0}
          icon={<FileText className="h-4 w-4 text-green-600" />}
          subtitle="Knowledge base searches"
          color="green"
        />
        <StatCard 
          title="Calculations Made"
          value={userStats.calculationsPerformed || 0}
          icon={<Calculator className="h-4 w-4 text-purple-600" />}
          subtitle="Processing rates & savings"
          color="purple"
        />
        <StatCard 
          title="Current Streak"
          value={userStats.currentStreak || 0}
          icon={<Zap className="h-4 w-4 text-yellow-600" />}
          subtitle={`Best: ${userStats.longestStreak || 0} days`}
          color="yellow"
        />
      </div>

      {/* Level Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Level Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">Level {userStats.level || 1}</div>
                <div className="text-sm text-muted-foreground">
                  {userStats.totalPoints || 0} total points
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">Rank #{userStats.rank || 'N/A'}</div>
                <div className="text-xs text-muted-foreground">Global ranking</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to Level {(userStats.level || 1) + 1}</span>
                <span>{pointsToNextLevel} points needed</span>
              </div>
              <Progress value={progressToNextLevel} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Leaderboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboardLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-3 p-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : leaderboard && leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.slice(0, 10).map((user: any, index: number) => (
                <LeaderboardEntry 
                  key={user.id} 
                  user={user} 
                  currentUserId={currentUserId}
                  position={index + 1}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Be the first to appear on the leaderboard!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default GamificationDashboard;