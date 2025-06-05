import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import type { Achievement, UserAchievement } from "@shared/schema";

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
  progress?: number;
  userAchievement?: UserAchievement;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
}

const rarityColors = {
  common: "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600",
  rare: "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600",
  epic: "bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-600",
  legendary: "bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-600"
};

const rarityGlow = {
  common: "",
  rare: "shadow-lg shadow-blue-500/20",
  epic: "shadow-lg shadow-purple-500/20", 
  legendary: "shadow-lg shadow-yellow-500/20 animate-pulse"
};

export default function AchievementBadge({
  achievement,
  unlocked,
  progress = 0,
  userAchievement,
  size = "md",
  showProgress = true
}: AchievementBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Get the icon component dynamically
  const IconComponent = (LucideIcons as any)[achievement.icon] || LucideIcons.Award;
  
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16", 
    lg: "w-20 h-20"
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  const badgeContent = (
    <div className="relative">
      <Card className={cn(
        "transition-all duration-300 hover:scale-105 cursor-pointer",
        sizeClasses[size],
        rarityColors[achievement.rarity as keyof typeof rarityColors],
        unlocked && rarityGlow[achievement.rarity as keyof typeof rarityGlow],
        !unlocked && "opacity-50 grayscale"
      )}>
        <CardContent className="p-2 flex items-center justify-center h-full">
          <IconComponent 
            className={cn(
              iconSizes[size],
              unlocked ? "text-current" : "text-gray-400"
            )}
          />
        </CardContent>
      </Card>
      
      {/* Progress indicator for unlocked achievements */}
      {showProgress && !unlocked && progress > 0 && (
        <div className="absolute -bottom-1 left-0 right-0 px-1">
          <Progress value={progress} className="h-1" />
        </div>
      )}
      
      {/* Rarity indicator */}
      <Badge
        variant="outline"
        className={cn(
          "absolute -top-1 -right-1 text-xs px-1 py-0",
          rarityColors[achievement.rarity as keyof typeof rarityColors]
        )}
      >
        {achievement.rarity}
      </Badge>

      {/* Points indicator */}
      {unlocked && (
        <Badge
          variant="secondary"
          className="absolute -bottom-1 -left-1 text-xs px-1 py-0"
        >
          +{achievement.points}
        </Badge>
      )}
    </div>
  );

  if (size === "sm") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badgeContent}
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-semibold">{achievement.name}</p>
              <p className="text-sm text-muted-foreground">{achievement.description}</p>
              {!unlocked && progress > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Progress: {progress}%
                </p>
              )}
              {unlocked && userAchievement && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Unlocked {new Date(userAchievement.unlockedAt!).toLocaleDateString()}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Dialog open={showDetails} onOpenChange={setShowDetails}>
      <DialogTrigger asChild>
        {badgeContent}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn(
              "p-3 rounded-lg",
              rarityColors[achievement.rarity as keyof typeof rarityColors]
            )}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{achievement.name}</h3>
              <Badge variant="outline" className="text-xs">
                {achievement.rarity} • {achievement.category}
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription className="text-left">
            {achievement.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Achievement Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={unlocked ? "default" : "secondary"}>
              {unlocked ? "Unlocked" : "Locked"}
            </Badge>
          </div>
          
          {/* Points */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Points:</span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              +{achievement.points}
            </span>
          </div>
          
          {/* Progress (for locked achievements) */}
          {!unlocked && progress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progress:</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          {/* Unlock Date (for unlocked achievements) */}
          {unlocked && userAchievement && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Unlocked:</span>
              <span className="text-sm text-muted-foreground">
                {new Date(userAchievement.unlockedAt!).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}
          
          {/* Requirement Info */}
          <div className="pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              Category: {achievement.category} • Rarity: {achievement.rarity}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}