import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import UserStatsDashboard from "@/components/user-stats-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Target, 
  Zap, 
  Star,
  Gift,
  TrendingUp,
  Crown,
  Medal
} from "lucide-react";

export default function AchievementsPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              Please log in to view your achievements
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Achievements & Progress</h1>
          <p className="text-muted-foreground">
            Track your journey and unlock rewards as you master JACC
          </p>
        </div>
      </div>

      {/* Gamification Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">How It Works</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Complete actions to earn points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Earn Points</p>
                <p className="text-xs text-green-600 dark:text-green-400">Messages, calculations, documents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Level Up</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">100 points = 1 level</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Medal className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Unlock Badges</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">Show off your expertise</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Categories Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Achievement Categories
          </CardTitle>
          <CardDescription>
            Discover different ways to earn achievements and level up your JACC mastery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-blue-600 border-blue-300">Chat</Badge>
              </div>
              <h4 className="font-semibold mb-1">Communication</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Send messages, have conversations, and engage with JACC AI
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                +1 point per message
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-green-600 border-green-300">Calculator</Badge>
              </div>
              <h4 className="font-semibold mb-1">Rate Analysis</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Perform rate calculations and financial analysis
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                +5 points per calculation
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-purple-600 border-purple-300">Documents</Badge>
              </div>
              <h4 className="font-semibold mb-1">Document Analysis</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Analyze documents and extract insights
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                +10 points per document
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-orange-600 border-orange-300">Social</Badge>
              </div>
              <h4 className="font-semibold mb-1">Client Proposals</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate client proposals and business documents
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                +25 points per proposal
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-yellow-600 border-yellow-300">Streaks</Badge>
              </div>
              <h4 className="font-semibold mb-1">Consistency</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use JACC regularly and maintain daily streaks
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                Streak bonuses
              </p>
            </div>

            <div className="p-4 border rounded-lg border-dashed">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-gray-600 border-gray-300">Hidden</Badge>
              </div>
              <h4 className="font-semibold mb-1">Secret Achievements</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Discover special achievements by exploring JACC features
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Surprise rewards!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Stats Dashboard */}
      <UserStatsDashboard userId={user.id} />

      {/* Tips Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Tips to Level Up Faster
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="font-medium">💬 Stay Active</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Regular conversations with JACC earn you consistent points and help maintain your streak.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">🧮 Use the Calculator</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Perform rate calculations to earn bonus points and unlock calculator-specific achievements.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">📄 Analyze Documents</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload and analyze documents for high-value points and document mastery badges.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">🎯 Create Proposals</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate client proposals for the highest point rewards and business achievements.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}