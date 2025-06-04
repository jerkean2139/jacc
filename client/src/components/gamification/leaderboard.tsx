import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award, Crown, MessageSquare, Star, Calendar, Zap } from "lucide-react";

interface LeaderboardUser {
  rank: number;
  userId: string;
  score: number;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

export function Leaderboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('weekly');
  const [selectedMetric, setSelectedMetric] = useState('messages');

  const { data: leaderboard, isLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ["/api/leaderboard", { period: selectedPeriod, metric: selectedMetric }],
    refetchInterval: 60000, // Refresh every minute
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Trophy className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-orange-500" />;
      default:
        return <Award className="w-5 h-5 text-gray-300" />;
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'messages':
        return <MessageSquare className="w-4 h-4" />;
      case 'rating':
        return <Star className="w-4 h-4" />;
      case 'streak':
        return <Calendar className="w-4 h-4" />;
      case 'points':
        return <Zap className="w-4 h-4" />;
      default:
        return <Trophy className="w-4 h-4" />;
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'messages':
        return 'Messages';
      case 'rating':
        return 'Avg Rating';
      case 'streak':
        return 'Best Streak';
      case 'points':
        return 'Total Points';
      default:
        return 'Score';
    }
  };

  const formatScore = (score: number, metric: string) => {
    if (metric === 'rating') {
      return score.toFixed(1);
    }
    return score.toString();
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 2:
        return "bg-gray-100 text-gray-800 border-gray-200";
      case 3:
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            Loading Leaderboard...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-16" />
                </div>
                <div className="h-6 bg-gray-200 rounded w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Period Tabs */}
        <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="all_time">All Time</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Metric Tabs */}
        <Tabs value={selectedMetric} onValueChange={setSelectedMetric}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="messages" className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="rating" className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              Rating
            </TabsTrigger>
          </TabsList>
          <TabsList className="grid w-full grid-cols-2 mt-2">
            <TabsTrigger value="streak" className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Streak
            </TabsTrigger>
            <TabsTrigger value="points" className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Points
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Leaderboard List */}
        <div className="space-y-2">
          {leaderboard && leaderboard.length > 0 ? (
            leaderboard.map((user) => (
              <div
                key={user.userId}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-md ${
                  user.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-white hover:bg-gray-50'
                }`}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-8">
                  {user.rank <= 3 ? (
                    getRankIcon(user.rank)
                  ) : (
                    <Badge variant="outline" className={getRankBadgeColor(user.rank)}>
                      #{user.rank}
                    </Badge>
                  )}
                </div>

                {/* Avatar */}
                <Avatar className="w-10 h-10">
                  <AvatarImage 
                    src={user.profileImageUrl} 
                    alt={`${user.firstName} ${user.lastName}`} 
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    {getMetricIcon(selectedMetric)}
                    {getMetricLabel(selectedMetric)}
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {formatScore(user.score, selectedMetric)}
                  </div>
                  {selectedMetric === 'rating' && (
                    <div className="text-xs text-yellow-600">★★★★★</div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Rankings Yet</h3>
              <p className="text-gray-500">
                Start using JACC to see yourself on the leaderboard!
              </p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="pt-4 border-t text-center">
          <p className="text-xs text-gray-500">
            Rankings update every hour • {selectedPeriod.replace('_', ' ')} period
          </p>
        </div>
      </CardContent>
    </Card>
  );
}