import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Download, 
  Activity,
  Clock,
  RefreshCw,
  FileText,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState("7d");
  const { toast } = useToast();

  // Simplified analytics using existing data
  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/simple-analytics", dateRange],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const downloadReport = async (type: string) => {
    try {
      const response = await fetch(`/api/admin/export-simple/${type}?range=${dateRange}`, {
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading admin analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Analytics</h1>
          <p className="text-muted-foreground">
            Monitor user activity, message patterns, and system usage
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
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
              +{analytics?.newUsers || 0} new this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalChats || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.avgChatsPerUser || 0} avg per user
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalMessages || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.avgMessagesPerChat || 0} avg per chat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalDocuments || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.documentsPerUser || 0} avg per user
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Activity</TabsTrigger>
          <TabsTrigger value="chats">Chat Analysis</TabsTrigger>
          <TabsTrigger value="messages">Message Logs</TabsTrigger>
          <TabsTrigger value="prompts">Prompt Usage</TabsTrigger>
        </TabsList>

        {/* User Activity Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">User Activity Overview</h3>
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
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Total Chats</TableHead>
                    <TableHead>Total Messages</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics?.users?.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "dev-admin" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.chatCount}</TableCell>
                      <TableCell>{user.messageCount}</TableCell>
                      <TableCell>{user.documentCount}</TableCell>
                      <TableCell>{user.lastActivity ? new Date(user.lastActivity).toLocaleDateString() : 'Never'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Analysis Tab */}
        <TabsContent value="chats" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Chat Session Analysis</h3>
            <Button onClick={() => downloadReport("chats")} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Chats CSV
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chat Title</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>First Message</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics?.chats?.map((chat: any) => (
                    <TableRow key={chat.id}>
                      <TableCell className="font-medium">{chat.title}</TableCell>
                      <TableCell>{chat.username}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate text-sm" title={chat.firstMessage}>
                          {chat.firstMessage || "No messages"}
                        </div>
                      </TableCell>
                      <TableCell>{chat.messageCount}</TableCell>
                      <TableCell>{new Date(chat.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(chat.updatedAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Message Logs Tab */}
        <TabsContent value="messages" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Recent Message Activity</h3>
            <Button onClick={() => downloadReport("messages")} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Messages CSV
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Chat</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Message Content</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics?.recentMessages?.map((message: any) => (
                    <TableRow key={message.id}>
                      <TableCell>{message.username}</TableCell>
                      <TableCell className="max-w-xs truncate">{message.chatTitle}</TableCell>
                      <TableCell>
                        <Badge variant={message.role === "user" ? "default" : "secondary"}>
                          {message.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate text-sm" title={message.content}>
                          {message.content}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(message.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prompt Usage Tab */}
        <TabsContent value="prompts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Custom Prompt Usage</h3>
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
                    <TableHead>Creator</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Writing Style</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics?.prompts?.map((prompt: any) => (
                    <TableRow key={prompt.id}>
                      <TableCell className="font-medium">{prompt.name}</TableCell>
                      <TableCell>{prompt.username}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{prompt.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{prompt.writingStyle}</TableCell>
                      <TableCell>{new Date(prompt.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(prompt.updatedAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}