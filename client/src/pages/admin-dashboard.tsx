import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Settings, 
  Download, 
  Calendar,
  BarChart3,
  Activity,
  Clock,
  Eye,
  Filter,
  RefreshCw,
  Wifi,
  WifiOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import VendorIntelligenceDashboard from "@/components/vendor-intelligence-dashboard";
import DocumentApprovalWorkflow from "@/components/document-approval-workflow";
import WhatsHappeningDashboard from "@/components/whats-happening-dashboard";

interface UserAnalytics {
  id: string;
  username: string;
  email: string;
  role: string;
  totalSessions: number;
  totalMessages: number;
  totalPrompts: number;
  lastActivity: string;
  firstMessage: string;
  mostUsedPrompts: Array<{ name: string; count: number; category: string }>;
  avgSessionLength: number;
}

interface PromptAnalytics {
  id: string;
  name: string;
  category: string;
  totalUses: number;
  uniqueUsers: number;
  avgExecutionTime: number;
  successRate: number;
  lastUsed: string;
}

interface SessionData {
  id: string;
  userId: string;
  username: string;
  sessionStart: string;
  sessionEnd: string;
  firstMessage: string;
  messageCount: number;
  promptsUsed: number;
  duration: number;
  ipAddress: string;
}

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState("7d");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  // Monitor online/offline status for admin dashboard
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch admin analytics data
  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/analytics", dateRange, selectedUser],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: userAnalytics } = useQuery({
    queryKey: ["/api/admin/user-analytics", dateRange],
  });

  const { data: promptAnalytics } = useQuery({
    queryKey: ["/api/admin/prompt-analytics", dateRange],
  });

  const { data: sessionData } = useQuery({
    queryKey: ["/api/admin/sessions", dateRange],
  });

  const { data: adminSettings } = useQuery({
    queryKey: ["/api/admin/settings"],
  });

  const downloadReport = async (type: string) => {
    try {
      const response = await fetch(`/api/admin/export/${type}?range=${dateRange}&user=${selectedUser}`, {
        method: "GET",
      });
      
      if (!response.ok) throw new Error("Failed to generate report");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jacc-${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Report Downloaded",
        description: `${type} analytics report has been downloaded successfully.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate the report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      
      toast({
        title: "Setting Updated",
        description: "Admin setting has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update setting. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading admin dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor user activity, prompt usage, and system performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* System Status Indicator */}
          <Badge 
            variant={isOnline ? "default" : "destructive"}
            className="flex items-center space-x-1"
          >
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{isOnline ? 'System Online' : 'System Offline'}</span>
          </Badge>
          
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
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.newUsersThisPeriod || 0} this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.activeSessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.avgSessionLength || 0}min avg length
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalMessages || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.messagesPerUser || 0} per user avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prompts Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalPrompts || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.promptGrowth || 0}% vs last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
          <TabsTrigger value="prompts">Prompt Usage</TabsTrigger>
          <TabsTrigger value="monitoring">Chat Monitoring</TabsTrigger>
          <TabsTrigger value="sessions">Session Logs</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
          <TabsTrigger value="document-approvals">Document Approvals</TabsTrigger>
          <TabsTrigger value="whats-happening">What's Happening</TabsTrigger>
          {/* Development Only - Hidden in Production */}
          {import.meta.env.DEV && (
            <TabsTrigger value="vendor-intelligence">Real-Time Intelligence</TabsTrigger>
          )}
        </TabsList>

        {/* User Analytics Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">User Activity & Engagement</h3>
            <Button onClick={() => downloadReport("users")} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Users CSV
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead>Prompts Used</TableHead>
                    <TableHead>First Message</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Top Prompts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userAnalytics?.map((user: UserAnalytics) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === "dev-admin" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.totalSessions}</TableCell>
                      <TableCell>{user.totalMessages}</TableCell>
                      <TableCell>{user.totalPrompts}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate text-sm" title={user.firstMessage}>
                          {user.firstMessage || "No messages yet"}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(user.lastActivity).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {user.mostUsedPrompts?.slice(0, 2).map((prompt, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-medium">{prompt.name}</span>
                              <span className="text-muted-foreground"> ({prompt.count}x)</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prompt Analytics Tab */}
        <TabsContent value="prompts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Prompt Usage Statistics</h3>
            <Button onClick={() => downloadReport("prompts")} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Prompts CSV
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prompt Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Total Uses</TableHead>
                    <TableHead>Unique Users</TableHead>
                    <TableHead>Avg Execution</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Popularity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promptAnalytics?.map((prompt: PromptAnalytics) => (
                    <TableRow key={prompt.id}>
                      <TableCell className="font-medium">{prompt.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{prompt.category}</Badge>
                      </TableCell>
                      <TableCell>{prompt.totalUses}</TableCell>
                      <TableCell>{prompt.uniqueUsers}</TableCell>
                      <TableCell>{prompt.avgExecutionTime}ms</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${prompt.successRate}%` }}
                            />
                          </div>
                          <span className="text-sm">{prompt.successRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(prompt.lastUsed).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < Math.floor(prompt.totalUses / 10) ? "bg-blue-500" : "bg-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">First Query & Response Monitoring</h3>
            <Button onClick={() => downloadReport("monitoring")} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Monitoring CSV
            </Button>
          </div>

          {/* Chat Monitoring Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total First Interactions</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">New chats monitored</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">Admin reviewed responses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--ms</div>
                <p className="text-xs text-muted-foreground">AI response speed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Awaiting admin review</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent First Interactions</CardTitle>
              <CardDescription>
                Track first user queries and AI responses for each new chat
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No monitoring data yet</h3>
                <p className="text-sm">
                  Start a new chat conversation to see first queries and AI responses appear here for accuracy review.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.href = '/'}
                >
                  Go to Chat Interface
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Session Logs Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">User Session Logs</h3>
            <Button onClick={() => downloadReport("sessions")} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Sessions CSV
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Session Start</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>First Message</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead>Prompts</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionData?.map((session: SessionData) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.username}</TableCell>
                      <TableCell>{new Date(session.sessionStart).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.round(session.duration / 60)}min
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate text-sm" title={session.firstMessage}>
                          {session.firstMessage || "No activity"}
                        </div>
                      </TableCell>
                      <TableCell>{session.messageCount}</TableCell>
                      <TableCell>{session.promptsUsed}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {session.ipAddress}
                      </TableCell>
                      <TableCell>
                        <Badge variant={session.sessionEnd ? "secondary" : "default"}>
                          {session.sessionEnd ? "Completed" : "Active"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">System Configuration</h3>
            <Badge variant="outline">Admin Access Required</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="max-sessions">Max Concurrent Sessions</Label>
                  <Input
                    id="max-sessions"
                    type="number"
                    defaultValue={adminSettings?.maxSessions || 100}
                    onChange={(e) => updateSetting("max_sessions", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    defaultValue={adminSettings?.sessionTimeout || 30}
                    onChange={(e) => updateSetting("session_timeout", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="max-message-length">Max Message Length</Label>
                  <Input
                    id="max-message-length"
                    type="number"
                    defaultValue={adminSettings?.maxMessageLength || 2000}
                    onChange={(e) => updateSetting("max_message_length", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ai-model">Default AI Model</Label>
                  <Select defaultValue={adminSettings?.defaultModel || "claude-3-7-sonnet-20250219"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="max-tokens">Max Response Tokens</Label>
                  <Input
                    id="max-tokens"
                    type="number"
                    defaultValue={adminSettings?.maxTokens || 2048}
                    onChange={(e) => updateSetting("max_tokens", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="system-prompt">System Prompt Override</Label>
                  <Textarea
                    id="system-prompt"
                    placeholder="Override default system prompt..."
                    defaultValue={adminSettings?.systemPromptOverride || ""}
                    onChange={(e) => updateSetting("system_prompt_override", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="rate-limit">Rate Limit (requests/hour)</Label>
                  <Input
                    id="rate-limit"
                    type="number"
                    defaultValue={adminSettings?.rateLimit || 60}
                    onChange={(e) => updateSetting("rate_limit", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="allowed-domains">Allowed Domains</Label>
                  <Textarea
                    id="allowed-domains"
                    placeholder="domain1.com, domain2.com"
                    defaultValue={adminSettings?.allowedDomains || ""}
                    onChange={(e) => updateSetting("allowed_domains", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analytics Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="retention-days">Data Retention (days)</Label>
                  <Input
                    id="retention-days"
                    type="number"
                    defaultValue={adminSettings?.dataRetentionDays || 90}
                    onChange={(e) => updateSetting("data_retention_days", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="export-format">Default Export Format</Label>
                  <Select defaultValue={adminSettings?.exportFormat || "csv"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Document Approvals Tab */}
        <TabsContent value="document-approvals" className="space-y-4">
          <DocumentApprovalWorkflow />
        </TabsContent>

        {/* What's Happening Tab */}
        <TabsContent value="whats-happening" className="space-y-4">
          <WhatsHappeningDashboard />
        </TabsContent>

        {/* Vendor Intelligence Tab - Development Only */}
        {import.meta.env.DEV && (
          <TabsContent value="vendor-intelligence" className="space-y-4">
            <VendorIntelligenceDashboard />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}