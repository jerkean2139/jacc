import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  RefreshCw,
  Clock,
  Eye,
  BarChart3,
  Activity,
  Trophy,
  Star,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatMonitoringData {
  chatId: string;
  chatTitle: string;
  userId: string;
  username: string;
  userEmail: string;
  firstName: string | null;
  lastName: string | null;
  chatCreatedAt: string;
  chatUpdatedAt: string;
  firstUserMessage: {
    id: string;
    content: string;
    createdAt: string;
  } | null;
  firstAssistantMessage: {
    id: string;
    content: string;
    createdAt: string;
  } | null;
  totalMessages: number;
}

interface ChatAnalytics {
  totalChats: number;
  totalMessages: number;
  activeUsers: number;
  userEngagement: Array<{
    userId: string;
    username: string;
    chatCount: number;
    lastActive: string;
  }>;
}

interface GamificationData {
  leaderboard: Array<{
    userId: string;
    username: string;
    points: number;
    level: number;
    rank: number;
    badges: string[];
  }>;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedBy: number;
    totalUsers: number;
  }>;
  stats: {
    totalPoints: number;
    totalBadges: number;
    activeParticipants: number;
    averageLevel: number;
  };
}

export default function AdminChatMonitoring() {
  const [dateRange, setDateRange] = useState("7d");
  const [selectedTab, setSelectedTab] = useState("monitoring");
  const { toast } = useToast();

  // Fetch chat monitoring data
  const { data: chatData, isLoading: chatLoading, refetch: refetchChats } = useQuery({
    queryKey: ["/api/admin/chat-monitoring"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch chat analytics
  const { data: analyticsData, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ["/api/admin/chat-analytics", dateRange],
    refetchInterval: 30000,
  });

  // Fetch gamification data
  const { data: gamificationData, isLoading: gamificationLoading, refetch: refetchGamification } = useQuery({
    queryKey: ["/api/admin/gamification-analytics"],
    refetchInterval: 30000,
  });

  const handleRefresh = () => {
    refetchChats();
    refetchAnalytics();
    refetchGamification();
    toast({
      title: "Data Refreshed",
      description: "All monitoring data has been updated."
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const getUserDisplayName = (chat: ChatMonitoringData) => {
    if (chat.firstName && chat.lastName) {
      return `${chat.firstName} ${chat.lastName}`;
    }
    return chat.username;
  };

  const chatMonitoringData: ChatMonitoringData[] = chatData?.data || [];
  const analytics: ChatAnalytics = analyticsData?.analytics || {
    totalChats: 0,
    totalMessages: 0,
    activeUsers: 0,
    userEngagement: []
  };
  const gamification: GamificationData = gamificationData?.data || {
    leaderboard: [],
    achievements: [],
    stats: {
      totalPoints: 0,
      totalBadges: 0,
      activeParticipants: 0,
      averageLevel: 0
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chat Monitoring Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor user conversations and JACC's first responses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monitoring">Chat Monitoring</TabsTrigger>
          <TabsTrigger value="analytics">Analytics Overview</TabsTrigger>
          <TabsTrigger value="gamification">Gamification</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalChats}</div>
                <p className="text-xs text-muted-foreground">
                  Conversations in selected period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalMessages}</div>
                <p className="text-xs text-muted-foreground">
                  Messages exchanged
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Unique users chatting
                </p>
              </CardContent>
            </Card>
          </div>

          {/* User Engagement Table */}
          <Card>
            <CardHeader>
              <CardTitle>User Engagement Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Chat Count</TableHead>
                    <TableHead>Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.userEngagement.map((user, index) => (
                    <TableRow key={user.userId}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.chatCount}</TableCell>
                      <TableCell>{formatDate(user.lastActive)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gamification" className="space-y-6">
          {/* Gamification Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{gamification.stats.totalPoints}</div>
                <p className="text-xs text-muted-foreground">
                  Points earned by all users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{gamification.stats.totalBadges}</div>
                <p className="text-xs text-muted-foreground">
                  Total badges unlocked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Participants</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{gamification.stats.activeParticipants}</div>
                <p className="text-xs text-muted-foreground">
                  Users earning points
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Level</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{gamification.stats.averageLevel.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  Across all users
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  User Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {gamificationLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Badges</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gamification.leaderboard.map((user) => (
                        <TableRow key={user.userId}>
                          <TableCell className="font-medium">#{user.rank}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>
                            <Badge variant="outline">Level {user.level}</Badge>
                          </TableCell>
                          <TableCell>{user.points}</TableCell>
                          <TableCell>{user.badges.length}</TableCell>
                        </TableRow>
                      ))}
                      {gamification.leaderboard.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium">No gamification data yet</h3>
                            <p className="text-muted-foreground">Users will appear here as they earn points and achievements.</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Achievement Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {gamification.achievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{achievement.icon}</div>
                          <div>
                            <h4 className="font-medium">{achievement.name}</h4>
                            <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{achievement.unlockedBy}/{achievement.totalUsers}</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round((achievement.unlockedBy / achievement.totalUsers) * 100)}% unlocked
                          </div>
                        </div>
                      </div>
                    ))}
                    {gamification.achievements.length === 0 && (
                      <div className="text-center py-8">
                        <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No achievements configured</h3>
                        <p className="text-muted-foreground">Set up achievements to track user progress and engagement.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          {/* Chat Monitoring Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{chatMonitoringData.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users with First Messages</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {chatMonitoringData.filter(chat => chat.firstUserMessage).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">JACC Responses</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {chatMonitoringData.filter(chat => chat.firstAssistantMessage).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Messages per Chat</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {chatMonitoringData.length > 0 
                    ? Math.round(chatMonitoringData.reduce((sum, chat) => sum + chat.totalMessages, 0) / chatMonitoringData.length)
                    : 0
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Details Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                First Messages & JACC Responses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chatLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {chatMonitoringData.map((chat) => (
                      <Card key={chat.chatId} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{getUserDisplayName(chat)}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {chat.userEmail} • Started: {formatDate(chat.chatCreatedAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{chat.totalMessages} messages</Badge>
                              <Badge variant={chat.firstAssistantMessage ? "default" : "secondary"}>
                                {chat.firstAssistantMessage ? "Responded" : "Pending"}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* First User Message */}
                          {chat.firstUserMessage ? (
                            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Users className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-blue-600">First User Message</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(chat.firstUserMessage.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm">{chat.firstUserMessage.content}</p>
                            </div>
                          ) : (
                            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                              <span className="text-sm text-muted-foreground">No user message yet</span>
                            </div>
                          )}

                          {/* First JACC Response */}
                          {chat.firstAssistantMessage ? (
                            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-green-600">JACC's First Response</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(chat.firstAssistantMessage.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm">{truncateText(chat.firstAssistantMessage.content, 200)}</p>
                            </div>
                          ) : chat.firstUserMessage ? (
                            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-yellow-600" />
                                <span className="text-sm text-yellow-600 font-medium">Awaiting JACC response</span>
                              </div>
                            </div>
                          ) : null}
                        </CardContent>
                      </Card>
                    ))}

                    {chatMonitoringData.length === 0 && (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No conversations yet</h3>
                        <p className="text-muted-foreground">Chat monitoring data will appear here as users interact with JACC.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}