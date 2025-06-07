import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bell,
  TrendingUp,
  Calendar,
  ExternalLink,
  Filter,
  Star,
  AlertCircle,
  Zap,
  Newspaper,
  Megaphone,
  DollarSign,
  Shield,
  Sparkles
} from "lucide-react";

interface VendorNews {
  id: string;
  vendorName: string;
  title: string;
  summary: string;
  url: string;
  newsType: string;
  importance: number;
  publishedAt: string;
  detectedAt: string;
  tags: string[];
}

export default function WhatsHappeningDashboard() {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterImportance, setFilterImportance] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("week");

  // Fetch vendor news
  const { data: allNews = [], isLoading } = useQuery<VendorNews[]>({
    queryKey: ['/api/vendor-news', { timeRange, filterType, filterImportance }],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const getNewsTypeIcon = (type: string) => {
    switch (type) {
      case 'product_announcement': return <Megaphone className="h-4 w-4 text-blue-600" />;
      case 'rate_change': return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'policy_update': return <Shield className="h-4 w-4 text-purple-600" />;
      case 'promotion': return <Star className="h-4 w-4 text-yellow-600" />;
      case 'blog_post': return <Sparkles className="h-4 w-4 text-pink-600" />;
      default: return <Newspaper className="h-4 w-4 text-gray-600" />;
    }
  };

  const getImportanceBadge = (importance: number) => {
    if (importance >= 9) return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
    if (importance >= 7) return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
    if (importance >= 5) return <Badge className="bg-blue-100 text-blue-800">Medium</Badge>;
    return <Badge variant="secondary">Low</Badge>;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Recently';
  };

  // Filter news based on selected criteria
  const filteredNews = allNews.filter(news => {
    if (filterType !== "all" && news.newsType !== filterType) return false;
    if (filterImportance !== "all") {
      const minImportance = parseInt(filterImportance);
      if (news.importance < minImportance) return false;
    }
    return true;
  });

  // Group news by category
  const criticalNews = filteredNews.filter(news => news.importance >= 9);
  const highImportanceNews = filteredNews.filter(news => news.importance >= 7 && news.importance < 9);
  const recentNews = filteredNews.filter(news => {
    const publishedDate = new Date(news.publishedAt);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    return publishedDate > threeDaysAgo;
  });

  const newsStats = {
    total: filteredNews.length,
    critical: criticalNews.length,
    high: highImportanceNews.length,
    thisWeek: recentNews.length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading industry updates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-blue-600" />
            What's Happening
          </h1>
          <p className="text-muted-foreground">
            Industry updates and news from payment processors, POS systems, and gateways
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notify Me
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Updates</p>
                <p className="text-2xl font-bold">{newsStats.total}</p>
              </div>
              <Newspaper className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">{newsStats.critical}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-orange-600">{newsStats.high}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-green-600">{newsStats.thisWeek}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="News Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="product_announcement">Product Announcements</SelectItem>
                <SelectItem value="rate_change">Rate Changes</SelectItem>
                <SelectItem value="policy_update">Policy Updates</SelectItem>
                <SelectItem value="promotion">Promotions</SelectItem>
                <SelectItem value="blog_post">Blog Posts</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterImportance} onValueChange={setFilterImportance}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Importance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="9">Critical (9+)</SelectItem>
                <SelectItem value="7">High (7+)</SelectItem>
                <SelectItem value="5">Medium (5+)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Last 24h</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* News Feed */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Updates</TabsTrigger>
          <TabsTrigger value="critical">Critical</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {filteredNews.length > 0 ? (
                filteredNews.map((news) => (
                  <Card key={news.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getNewsTypeIcon(news.newsType)}
                            <h3 className="font-semibold text-lg">{news.title}</h3>
                            {getImportanceBadge(news.importance)}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            From: <span className="font-medium">{news.vendorName}</span>
                          </p>
                          
                          <p className="text-gray-700 mb-3 line-clamp-2">{news.summary}</p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {news.tags?.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Published: {formatTimeAgo(news.publishedAt)}</span>
                              <Button variant="ghost" size="sm" asChild>
                                <a href={news.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Newspaper className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">No Updates Found</h3>
                    <p className="text-gray-600">No news matches your current filters.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="critical">
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {criticalNews.length > 0 ? (
                criticalNews.map((news) => (
                  <Card key={news.id} className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{news.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">From: {news.vendorName}</p>
                          <p className="text-gray-700 mb-3">{news.summary}</p>
                          <div className="flex items-center justify-between">
                            <Badge className="bg-red-100 text-red-800">Critical</Badge>
                            <Button variant="ghost" size="sm" asChild>
                              <a href={news.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View Details
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">No Critical Updates</h3>
                    <p className="text-gray-600">No critical news items at this time.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="recent">
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {recentNews.length > 0 ? (
                recentNews.map((news) => (
                  <Card key={news.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getNewsTypeIcon(news.newsType)}
                            <h3 className="font-semibold">{news.title}</h3>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              New
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">From: {news.vendorName}</p>
                          <p className="text-gray-700 text-sm">{news.summary}</p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTimeAgo(news.publishedAt)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">No Recent Updates</h3>
                    <p className="text-gray-600">No news in the last 3 days.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}