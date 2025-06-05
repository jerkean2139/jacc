import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useGamification } from "@/hooks/useGamification";
import { Trophy, Star, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProgressIndicator() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { userStats, recentAchievements } = useGamification();

  if (!userStats) return null;

  const levelProgress = (userStats.totalPoints % 100);
  const currentLevel = Math.floor(userStats.totalPoints / 100) + 1;
  const nextLevelPoints = currentLevel * 100;

  return (
    <Card className="w-full max-w-sm mx-auto bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Level {currentLevel}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{userStats.totalPoints} points</span>
            <span>{nextLevelPoints} points</span>
          </div>
          <Progress value={levelProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {100 - levelProgress} points to next level
          </p>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Messages</span>
                  </div>
                  <p className="text-lg font-bold text-blue-600">{userStats.messagesCount}</p>
                </div>
                
                <div className="text-center p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Calculations</span>
                  </div>
                  <p className="text-lg font-bold text-green-600">{userStats.calculationsCount}</p>
                </div>
              </div>

              {recentAchievements && recentAchievements.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Recent Achievements</p>
                  <div className="space-y-1">
                    {recentAchievements.slice(0, 3).map((achievement) => (
                      <Badge 
                        key={achievement.id} 
                        variant="secondary" 
                        className="w-full justify-start text-xs"
                      >
                        <Trophy className="h-3 w-3 mr-1" />
                        {achievement.achievement.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}