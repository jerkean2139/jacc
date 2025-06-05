import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AchievementNotification from "@/components/achievement-notification";
import type { UserStats, Achievement, UserAchievement } from "@shared/schema";

interface GamificationContextType {
  userStats: UserStats | undefined;
  achievements: (UserAchievement & { achievement: Achievement })[] | undefined;
  trackAction: (action: string) => Promise<void>;
  isLoading: boolean;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

interface GamificationProviderProps {
  children: ReactNode;
  userId?: string;
}

export function GamificationProvider({ children, userId }: GamificationProviderProps) {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    achievement: Achievement;
    userAchievement: UserAchievement;
  }>>([]);
  
  const queryClient = useQueryClient();

  // Fetch user stats
  const { data: userStats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
    enabled: !!userId
  });

  // Fetch user achievements
  const { data: achievements, isLoading: achievementsLoading } = useQuery<(UserAchievement & { achievement: Achievement })[]>({
    queryKey: ["/api/user/achievements"],
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
      
      if (!response.ok) {
        throw new Error("Failed to track action");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Check for new achievements
      if (data.newAchievements && data.newAchievements.length > 0) {
        data.newAchievements.forEach((userAchievement: UserAchievement) => {
          // Find the achievement details
          const achievement = achievements?.find(a => a.achievementId === userAchievement.achievementId)?.achievement;
          if (achievement) {
            // Show notification for new achievement
            const notificationId = Math.random().toString(36).substr(2, 9);
            setNotifications(prev => [...prev, {
              id: notificationId,
              achievement,
              userAchievement
            }]);
          }
        });
      }
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/achievements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/achievements/progress"] });
    }
  });

  const trackAction = async (action: string) => {
    if (!userId) return;
    await trackActionMutation.mutateAsync(action);
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const contextValue: GamificationContextType = {
    userStats,
    achievements,
    trackAction,
    isLoading: statsLoading || achievementsLoading
  };

  return (
    <GamificationContext.Provider value={contextValue}>
      {children}
      
      {/* Achievement Notifications */}
      {notifications.map((notification) => (
        <AchievementNotification
          key={notification.id}
          achievement={notification.achievement}
          userAchievement={notification.userAchievement}
          onDismiss={() => dismissNotification(notification.id)}
        />
      ))}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error("useGamification must be used within a GamificationProvider");
  }
  return context;
}