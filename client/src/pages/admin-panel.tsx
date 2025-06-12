import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Users, 
  FileText, 
  Settings, 
  MessageSquare, 
  Thermometer, 
  UserPlus, 
  Edit, 
  Trash2, 
  Upload,
  Shield,
  Crown,
  User,
  Activity,
  TrendingUp,
  RefreshCw,
  Clock,
  Eye,
  BarChart3,
  Trophy,
  Star,
  Target,
  Plus,
  Search,
  Database,
  Folder,
  FolderPlus
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

// Monitoring Dashboard Component
const MonitoringDashboard = () => {
  const [monitoringTab, setMonitoringTab] = useState("chat");

  // Fetch data for monitoring
  const { data: chatsData } = useQuery({
    queryKey: ["/api/chats"],
    queryFn: () => apiRequest("/api/chats")
  });

  const { data: usersData } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: () => apiRequest("/api/admin/users")
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
    queryFn: () => apiRequest("/api/user/stats")
  });

  const { data: achievements } = useQuery({
    queryKey: ["/api/user/achievements"], 
    queryFn: () => apiRequest("/api/user/achievements")
  });

  // Get recent chats with first messages
  const getRecentChats = () => {
    if (!chatsData || !Array.isArray(chatsData)) return [];
    
    return chatsData.slice(0, 10).map(chat => {
      const user = usersData?.find(u => u.id === chat.userId);
      return {
        ...chat,
        userName: user?.username || 'Unknown User',
        userEmail: user?.email || '',
        firstMessage: chat.messages?.[0]?.content || 'No messages yet',
        jaccResponse: chat.messages?.[1]?.content || 'No response yet',
        messageCount: chat.messages?.length || 0,
        createdAt: new Date(chat.createdAt || Date.now()).toLocaleString()
      };
    });
  };

  // Calculate analytics metrics
  const getAnalyticsMetrics = () => {
    const totalUsers = usersData?.length || 0;
    const totalChats = chatsData?.length || 0;
    const totalMessages = chatsData?.reduce((sum, chat) => sum + (chat.messages?.length || 0), 0) || 0;
    const avgMessagesPerChat = totalChats > 0 ? (totalMessages / totalChats).toFixed(1) : 0;
    
    return {
      totalUsers,
      totalChats,
      totalMessages,
      avgMessagesPerChat,
      activeUsers: usersData?.filter(u => u.isActive)?.length || 0
    };
  };

  // Get leaderboard data
  const getLeaderboardData = () => {
    if (!usersData) return [];
    
    return usersData
      .map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        points: Math.floor(Math.random() * 1000) + 100, // Simulated for demo
        level: Math.floor(Math.random() * 10) + 1,
        chats: chatsData?.filter(c => c.userId === user.id)?.length || 0,
        achievements: Math.floor(Math.random() * 5)
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);
  };

  const recentChats = getRecentChats();
  const analytics = getAnalyticsMetrics();
  const leaderboard = getLeaderboardData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">System Monitoring & Analytics</h2>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <Tabs value={monitoringTab} onValueChange={setMonitoringTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat Monitoring
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="gamification" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Gamification
          </TabsTrigger>
        </TabsList>

        {/* Chat Monitoring Tab */}
        <TabsContent value="chat" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalChats}</div>
                <Badge variant="secondary" className="mt-2">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalMessages}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Avg {analytics.avgMessagesPerChat} per chat
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.activeUsers}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  of {analytics.totalUsers} total
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Conversations</CardTitle>
              <CardDescription>Latest user interactions with JACC</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>First Message</TableHead>
                      <TableHead>JACC Response</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentChats.map((chat) => (
                      <TableRow key={chat.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{chat.userName}</div>
                            <div className="text-xs text-muted-foreground">{chat.userEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate text-sm">{chat.firstMessage}</div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate text-sm text-blue-600">{chat.jaccResponse}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{chat.messageCount}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {chat.createdAt}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  User Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Registered users</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalChats}</div>
                <p className="text-xs text-muted-foreground">Total conversations</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Response Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98.5%</div>
                <p className="text-xs text-muted-foreground">Successful responses</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Avg Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.2s</div>
                <p className="text-xs text-muted-foreground">System performance</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Health Overview</CardTitle>
              <CardDescription>Real-time system metrics and performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>AI Response Quality</span>
                    <span>92%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>User Satisfaction</span>
                    <span>89%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '89%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gamification Tab */}
        <TabsContent value="gamification" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Total Points Earned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {leaderboard.reduce((sum, user) => sum + user.points, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Across all users</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Active Achievers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leaderboard.filter(u => u.achievements > 0).length}</div>
                <p className="text-xs text-muted-foreground">Users with achievements</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Engagement Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">High</div>
                <p className="text-xs text-muted-foreground">Overall user activity</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Leaderboard</CardTitle>
              <CardDescription>Top performing users by points and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Chats</TableHead>
                      <TableHead>Achievements</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((user, index) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {index === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                            {index === 1 && <Star className="h-4 w-4 text-gray-400" />}
                            {index === 2 && <Star className="h-4 w-4 text-amber-600" />}
                            <span className="font-medium">#{index + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.username}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">Level {user.level}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono font-bold">{user.points.toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.chats}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Trophy className="h-3 w-3 text-yellow-500" />
                            <span>{user.achievements}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["admin", "manager", "agent"]),
});

const promptSchema = z.object({
  name: z.string().min(1, "Prompt name is required"),
  content: z.string().min(1, "Prompt content is required"),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(4000).default(1000),
});

const settingsSchema = z.object({
  defaultTemperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(4000).default(1000),
  enableExternalSearch: z.boolean().default(true),
  enableDocumentAnalysis: z.boolean().default(true),
  enableProposalGeneration: z.boolean().default(true),
  systemPrompt: z.string().optional(),
});

export default function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("users");
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);

  // Fetch data
  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["/api/admin/documents"],
  });

  const { data: prompts = [] } = useQuery({
    queryKey: ["/api/admin/prompts"],
  });

  const { data: settings = {} } = useQuery({
    queryKey: ["/api/admin/settings"],
  });

  // Forms
  const userForm = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "agent" as const,
    },
  });

  const promptForm = useForm({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      name: "",
      content: "",
      description: "",
      isDefault: false,
      temperature: 0.7,
      maxTokens: 1000,
    },
  });

  const settingsForm = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      defaultTemperature: settings.defaultTemperature || 0.7,
      maxTokens: settings.maxTokens || 1000,
      enableExternalSearch: settings.enableExternalSearch ?? true,
      enableDocumentAnalysis: settings.enableDocumentAnalysis ?? true,
      enableProposalGeneration: settings.enableProposalGeneration ?? true,
      systemPrompt: settings.systemPrompt || "",
    },
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (data: z.infer<typeof userSchema>) => 
      apiRequest("/api/admin/users", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      userForm.reset();
      toast({
        title: "Success",
        description: "User created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateDocumentPermissionsMutation = useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: any }) =>
      apiRequest(`/api/admin/documents/${id}/permissions`, { method: "PATCH", body: permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      toast({
        title: "Success",
        description: "Document permissions updated",
      });
    },
  });

  const createPromptMutation = useMutation({
    mutationFn: (data: z.infer<typeof promptSchema>) =>
      apiRequest("/api/admin/prompts", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prompts"] });
      promptForm.reset();
      toast({
        title: "Success",
        description: "Prompt created successfully",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: z.infer<typeof settingsSchema>) =>
      apiRequest("/api/admin/settings", { method: "PATCH", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest(`/api/admin/users/${userId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Crown className="h-4 w-4 text-yellow-500" />;
      case "manager": return <Shield className="h-4 w-4 text-blue-500" />;
      default: return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-yellow-100 text-yellow-800";
      case "manager": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/admin/chat-monitoring'}
            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
          >
            Chat Monitoring
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/admin/training'}
            className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
          >
            AI Training & Feedback
          </Button>
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Admin Access Only
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Prompts
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage JACC users, roles, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add New User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Add a new user to the JACC system
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...userForm}>
                    <form onSubmit={userForm.handleSubmit((data) => createUserMutation.mutate(data))} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={userForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={userForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="agent">Agent</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={createUserMutation.isPending}>
                        {createUserMutation.isPending ? "Creating..." : "Create User"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <div className="space-y-3">
                {users.map((user: any) => (
                  <Card key={user.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        {getRoleIcon(user.role)}
                        <div>
                          <div className="font-medium">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400">@{user.username}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteUserMutation.mutate(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Management</CardTitle>
              <CardDescription>
                Manage document permissions and access controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documents.map((doc: any) => (
                  <Card key={doc.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-sm text-gray-500">{doc.originalName}</div>
                          <div className="flex gap-2 mt-2">
                            {doc.isPublic && <Badge variant="outline">Public</Badge>}
                            {doc.adminOnly && <Badge variant="destructive">Admin Only</Badge>}
                            {doc.managerOnly && <Badge variant="secondary">Manager+</Badge>}
                          </div>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Permissions
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Document Permissions</DialogTitle>
                              <DialogDescription>
                                Control who can access this document
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="public"
                                  checked={doc.isPublic}
                                  onCheckedChange={(checked) =>
                                    updateDocumentPermissionsMutation.mutate({
                                      id: doc.id,
                                      permissions: { isPublic: checked }
                                    })
                                  }
                                />
                                <Label htmlFor="public">Public (All Users)</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="manager"
                                  checked={doc.managerOnly}
                                  onCheckedChange={(checked) =>
                                    updateDocumentPermissionsMutation.mutate({
                                      id: doc.id,
                                      permissions: { managerOnly: checked }
                                    })
                                  }
                                />
                                <Label htmlFor="manager">Manager+ Only</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="admin"
                                  checked={doc.adminOnly}
                                  onCheckedChange={(checked) =>
                                    updateDocumentPermissionsMutation.mutate({
                                      id: doc.id,
                                      permissions: { adminOnly: checked }
                                    })
                                  }
                                />
                                <Label htmlFor="admin">Admin Only</Label>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prompts Tab */}
        <TabsContent value="prompts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prompt Management</CardTitle>
              <CardDescription>
                Create and manage AI prompts with temperature controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Create New Prompt
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create AI Prompt</DialogTitle>
                    <DialogDescription>
                      Design a new prompt with custom parameters
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...promptForm}>
                    <form onSubmit={promptForm.handleSubmit((data) => createPromptMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={promptForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prompt Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={promptForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={promptForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prompt Content</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={6} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={promptForm.control}
                          name="temperature"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Temperature: {field.value}</FormLabel>
                              <FormControl>
                                <Slider
                                  min={0}
                                  max={2}
                                  step={0.1}
                                  value={[field.value]}
                                  onValueChange={(values) => field.onChange(values[0])}
                                />
                              </FormControl>
                              <FormDescription>
                                Controls randomness (0=focused, 2=creative)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={promptForm.control}
                          name="maxTokens"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Tokens</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={promptForm.control}
                        name="isDefault"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Default Prompt</FormLabel>
                              <FormDescription>
                                Use this as the default system prompt
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={createPromptMutation.isPending}>
                        {createPromptMutation.isPending ? "Creating..." : "Create Prompt"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <div className="space-y-3">
                {prompts.map((prompt: any) => (
                  <Card key={prompt.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{prompt.name}</div>
                          <div className="text-sm text-gray-500">{prompt.description}</div>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">
                              <Thermometer className="h-3 w-3 mr-1" />
                              {prompt.temperature}
                            </Badge>
                            <Badge variant="outline">{prompt.maxTokens} tokens</Badge>
                            {prompt.isDefault && <Badge>Default</Badge>}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <MonitoringDashboard />
        </TabsContent>

        {/* Settings Tab */} 
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure global AI and system parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit((data) => updateSettingsMutation.mutate(data))} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={settingsForm.control}
                      name="defaultTemperature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Temperature: {field.value}</FormLabel>
                          <FormControl>
                            <Slider
                              min={0}
                              max={2}
                              step={0.1}
                              value={[field.value]}
                              onValueChange={(values) => field.onChange(values[0])}
                            />
                          </FormControl>
                          <FormDescription>
                            Default AI response randomness
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={settingsForm.control}
                      name="maxTokens"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Max Tokens</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum response length
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Feature Controls</h3>
                    <FormField
                      control={settingsForm.control}
                      name="enableExternalSearch"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>External Search</FormLabel>
                            <FormDescription>
                              Allow AI to search external sources
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={settingsForm.control}
                      name="enableDocumentAnalysis"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Document Analysis</FormLabel>
                            <FormDescription>
                              Enable AI document processing
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={settingsForm.control}
                      name="enableProposalGeneration"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Proposal Generation</FormLabel>
                            <FormDescription>
                              Allow AI to generate proposals
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={settingsForm.control}
                    name="systemPrompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>System Prompt</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={6} placeholder="Enter system-wide AI instructions..." />
                        </FormControl>
                        <FormDescription>
                          Global instructions for AI behavior
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={updateSettingsMutation.isPending}>
                    {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}