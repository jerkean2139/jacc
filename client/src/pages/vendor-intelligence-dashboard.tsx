import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  RefreshCw, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Search,
  Filter,
  Calendar,
  Activity,
  Shield,
  Zap
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface VendorIntelligenceUpdate {
  id: string;
  vendorName: string;
  updateType: string;
  content: string;
  sourceUrl: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  actionRequired: boolean;
  createdAt: string;
}

interface ScheduleInfo {
  nextScheduledRun: string;
  runFrequency: string;
  status: string;
}

export default function VendorIntelligenceDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [impactFilter, setImpactFilter] = useState<string>('all');

  // Fetch vendor intelligence updates
  const { data: updates = [], isLoading: updatesLoading } = useQuery({
    queryKey: ['/api/vendor-intelligence/updates'],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Fetch scheduler information
  const { data: scheduleInfo } = useQuery<ScheduleInfo>({
    queryKey: ['/api/vendor-intelligence/schedule'],
  });

  // Manual crawl mutation
  const manualCrawlMutation = useMutation({
    mutationFn: () => apiRequest('/api/vendor-intelligence/manual-crawl', {
      method: 'POST'
    }),
    onSuccess: (data) => {
      toast({
        title: "Manual Crawl Completed",
        description: `Found ${data.updatesFound} updates, ${data.highPriorityUpdates?.length || 0} require attention`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-intelligence/updates'] });
    },
    onError: (error) => {
      toast({
        title: "Crawl Failed",
        description: "Failed to perform manual vendor intelligence crawl",
        variant: "destructive",
      });
    },
  });

  const filteredUpdates = updates.filter((update: VendorIntelligenceUpdate) => {
    if (selectedVendor && update.vendorName !== selectedVendor) return false;
    if (impactFilter !== 'all' && update.impact !== impactFilter) return false;
    return true;
  });

  const highPriorityUpdates = updates.filter((update: VendorIntelligenceUpdate) => 
    update.actionRequired || update.impact === 'high'
  );

  const vendorList = [...new Set(updates.map((update: VendorIntelligenceUpdate) => update.vendorName))];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUpdateTypeIcon = (type: string) => {
    switch (type) {
      case 'pricing': return <TrendingUp className="w-4 h-4" />;
      case 'feature': return <Zap className="w-4 h-4" />;
      case 'acquisition': return <Shield className="w-4 h-4" />;
      case 'partnership': return <Activity className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vendor Intelligence Dashboard</h1>
          <p className="text-gray-600">Monitor competitive landscape and vendor developments</p>
        </div>
        <Button
          onClick={() => manualCrawlMutation.mutate()}
          disabled={manualCrawlMutation.isPending}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${manualCrawlMutation.isPending ? 'animate-spin' : ''}`} />
          {manualCrawlMutation.isPending ? 'Crawling...' : 'Manual Crawl'}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Updates</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{updates.length}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{highPriorityUpdates.length}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendors Monitored</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendorList.length}</div>
            <p className="text-xs text-muted-foreground">Active monitoring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Crawl</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {scheduleInfo?.nextScheduledRun ? 
                new Date(scheduleInfo.nextScheduledRun).toLocaleDateString() : 
                'Loading...'
              }
            </div>
            <p className="text-xs text-muted-foreground">{scheduleInfo?.runFrequency || 'Weekly'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Vendor</label>
            <select 
              value={selectedVendor || ''} 
              onChange={(e) => setSelectedVendor(e.target.value || null)}
              className="border rounded px-3 py-2"
            >
              <option value="">All Vendors</option>
              {vendorList.map(vendor => (
                <option key={vendor} value={vendor}>{vendor}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Impact Level</label>
            <select 
              value={impactFilter} 
              onChange={(e) => setImpactFilter(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="all">All Levels</option>
              <option value="high">High Impact</option>
              <option value="medium">Medium Impact</option>
              <option value="low">Low Impact</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Intelligence Updates */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Updates</TabsTrigger>
          <TabsTrigger value="high-priority">High Priority</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Changes</TabsTrigger>
          <TabsTrigger value="features">Feature Updates</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Intelligence Updates</CardTitle>
              <CardDescription>
                Latest competitive intelligence gathered from vendor monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {filteredUpdates.map((update: VendorIntelligenceUpdate) => (
                    <div key={update.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getUpdateTypeIcon(update.updateType)}
                          <div>
                            <h4 className="font-semibold">{update.vendorName}</h4>
                            <p className="text-sm text-gray-600 capitalize">{update.updateType} Update</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getImpactColor(update.impact)}>
                            {update.impact.toUpperCase()} IMPACT
                          </Badge>
                          {update.actionRequired && (
                            <Badge variant="destructive">ACTION REQUIRED</Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-gray-700">{update.content}</p>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span>Confidence: {Math.round(update.confidence * 100)}%</span>
                          <span>{new Date(update.createdAt).toLocaleDateString()}</span>
                        </div>
                        {update.sourceUrl && (
                          <a 
                            href={update.sourceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Source
                          </a>
                        )}
                      </div>
                    </div>
                  ))}

                  {filteredUpdates.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No intelligence updates match the current filters
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high-priority">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                High Priority Updates
              </CardTitle>
              <CardDescription>
                Updates requiring immediate attention or action
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {highPriorityUpdates.map((update: VendorIntelligenceUpdate) => (
                  <div key={update.id} className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-red-800">{update.vendorName}</h4>
                      <Badge variant="destructive">{update.updateType.toUpperCase()}</Badge>
                    </div>
                    <p className="text-red-700 mb-2">{update.content}</p>
                    <div className="text-sm text-red-600">
                      {new Date(update.createdAt).toLocaleDateString()} • Confidence: {Math.round(update.confidence * 100)}%
                    </div>
                  </div>
                ))}

                {highPriorityUpdates.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No high priority updates at this time
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Intelligence</CardTitle>
              <CardDescription>Competitive pricing changes and rate updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {updates
                  .filter((update: VendorIntelligenceUpdate) => update.updateType === 'pricing')
                  .map((update: VendorIntelligenceUpdate) => (
                    <div key={update.id} className="border rounded p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{update.vendorName}</h4>
                        <Badge className={getImpactColor(update.impact)}>{update.impact}</Badge>
                      </div>
                      <p className="text-gray-700 mb-2">{update.content}</p>
                      <div className="text-sm text-gray-500">
                        {new Date(update.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Updates</CardTitle>
              <CardDescription>New product features and capability announcements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {updates
                  .filter((update: VendorIntelligenceUpdate) => update.updateType === 'feature')
                  .map((update: VendorIntelligenceUpdate) => (
                    <div key={update.id} className="border rounded p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{update.vendorName}</h4>
                        <Badge className={getImpactColor(update.impact)}>{update.impact}</Badge>
                      </div>
                      <p className="text-gray-700 mb-2">{update.content}</p>
                      <div className="text-sm text-gray-500">
                        {new Date(update.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}