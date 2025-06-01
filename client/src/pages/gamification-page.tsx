import { useAuth } from "@/hooks/useAuth";
import GamificationDashboard from "@/components/gamification-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, Users, Target } from "lucide-react";

export default function GamificationPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Welcome to JACC Gamification</h2>
            <p className="text-muted-foreground mb-4">
              Track your progress, compete with other users, and level up your merchant services expertise.
            </p>
            <p className="text-sm text-muted-foreground">
              Start chatting to begin earning points and climbing the leaderboard!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <Trophy className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Your Progress</h1>
          <p className="text-muted-foreground">
            Track your activity and compete with other users
          </p>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <h3 className="font-semibold">Level Up</h3>
            <p className="text-sm text-muted-foreground">
              Gain points through chat sessions and document analysis
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <h3 className="font-semibold">Compete</h3>
            <p className="text-sm text-muted-foreground">
              See how you rank against other JACC users
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <h3 className="font-semibold">Achieve</h3>
            <p className="text-sm text-muted-foreground">
              Unlock achievements and maintain streaks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <GamificationDashboard currentUserId={user.id} />
    </div>
  );
}