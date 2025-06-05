import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import * as LucideIcons from "lucide-react";
import { Trophy, X, Sparkles } from "lucide-react";
import type { Achievement, UserAchievement } from "@shared/schema";

interface AchievementNotificationProps {
  achievement: Achievement;
  userAchievement: UserAchievement;
  onDismiss: () => void;
}

export default function AchievementNotification({
  achievement,
  userAchievement,
  onDismiss
}: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  // Get the icon component dynamically
  const IconComponent = (LucideIcons as any)[achievement.icon] || LucideIcons.Award;

  const rarityColors = {
    common: "from-gray-500 to-gray-600",
    rare: "from-blue-500 to-blue-600", 
    epic: "from-purple-500 to-purple-600",
    legendary: "from-yellow-500 to-yellow-600"
  };

  const rarityBorderColors = {
    common: "border-gray-300",
    rare: "border-blue-300",
    epic: "border-purple-300", 
    legendary: "border-yellow-300"
  };

  useEffect(() => {
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          transition={{ 
            type: "spring", 
            stiffness: 500, 
            damping: 30,
            duration: 0.3
          }}
          className="fixed bottom-20 right-4 z-50 max-w-sm"
        >
          <Card className={`border-2 ${rarityBorderColors[achievement.rarity as keyof typeof rarityBorderColors]} shadow-lg`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Achievement Icon */}
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${rarityColors[achievement.rarity as keyof typeof rarityColors]} flex items-center justify-center flex-shrink-0`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm truncate">Achievement Unlocked!</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={handleDismiss}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <p className="font-medium text-base mb-1 text-gray-900 dark:text-gray-100">
                    {achievement.name}
                  </p>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {achievement.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {achievement.rarity}
                    </Badge>
                    <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                      <Sparkles className="w-3 h-3" />
                      <span className="text-xs font-medium">+{achievement.points}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}