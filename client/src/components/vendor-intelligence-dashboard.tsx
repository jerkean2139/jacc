import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Globe,
  Eye,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  RefreshCw,
  TrendingUp,
  ExternalLink,
  Bell,
  Activity,
  Search,
  Filter,
  Download
} from "lucide-react";

interface VendorStats {
  totalVendors: number;
  totalDocuments: number;
  recentChanges: number;
  lastScan: string;
  isMonitoring: boolean;
}

interface VendorSite {
  id: string;
  name: string;
  baseUrl: string;
  active: boolean;
  crawlFrequency: string;
  lastScan?: string;
  documentsFound: number;
  status: 'active' | 'inactive' | 'error';
}

interface DocumentChange {
  id: string;
  documentTitle: string;
  vendorName: string;
  changeType: 'new' | 'updated' | 'removed';
  detectedAt: string;
  url: string;
  changes: {
    added: string[];
    removed: string[];
    modified: string[];
  };
}

export default function VendorIntelligenceDashboard() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [showOnlyChanges, setShowOnlyChanges] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vendor stats
  const { data: stats, isLoading: statsLoading } = useQuery<VendorStats>({
    queryKey: ['/api/vendor-intelligence/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch vendor list
  const { data: vendors = [], isLoading: vendorsLoading } = useQuery<VendorSite[]>({
    queryKey: ['/api/vendor-intelligence/vendors'],
  });

  // Fetch recent changes
  const { data: recentChanges = [], isLoading: changesLoading } = useQuery<DocumentChange[]>({
    queryKey: ['/api/vendor-intelligence/changes'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Start/Stop monitoring mutation
  const toggleMonitoring = useMutation({
    mutationFn: async (start: boolean) => {
      return apiRequest(`/api/vendor-intelligence/${start ? 'start' : 'stop'}`, {
        method: 'POST'
      });
    },
    onSuccess: (_, start) => {
      setIsMonitoring(start);
      toast({
        title: start ? "Monitoring Started" : "Monitoring Stopped",
        description: start 
          ? "Real-time vendor intelligence is now active"
          : "Vendor monitoring has been paused"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-intelligence/stats'] });
    }
  });

  // Manual scan mutation
  const triggerScan = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/vendor-intelligence/scan', {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "Manual Scan Started",
        description: "Checking all vendor sites for document changes"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-intelligence'] });
    }
  });

  // Toggle vendor active status
  const toggleVendor = useMutation({
    mutationFn: async ({ vendorId, active }: { vendorId: string; active: boolean }) => {
      return apiRequest(`/api/vendor-intelligence/vendors/${vendorId}`, {
        method: 'PATCH',
        body: JSON.stringify({ active })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-intelligence/vendors'] });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'new': return <FileText className="h-4 w-4 text-green-600" />;
      case 'updated': return <RefreshCw className="h-4 w-4 text-blue-600" />;
      case 'removed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <FileText className="h-4 w-4" />;
    }
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

  return (
    <div className="space-y-6">
      {/* Header with Dev Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <h3 className="font-semibold text-yellow-800">Development Feature</h3>
        </div>
        <p className="text-yellow-700 mt-1">
          This Real-Time Intelligence system is in development. It monitors vendor sites for document changes
          but is hidden from production deployment until ready.
        </p>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monitoring Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${stats?.isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-2xl font-bold">
                    {stats?.isMonitoring ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vendors Monitored</p>
                <p className="text-2xl font-bold">{stats?.totalVendors || 0}</p>
                <p className="text-xs text-gray-500">
                  Processors • Gateways • POS Systems
                </p>
              </div>
              <Globe className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Documents Tracked</p>
                <p className="text-2xl font-bold">{stats?.totalDocuments || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Changes</p>
                <p className="text-2xl font-bold">{stats?.recentChanges || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Vendor Intelligence Control Panel
          </CardTitle>
          <CardDescription>
            Manage real-time monitoring of vendor documentation sites
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="monitoring-toggle">Real-Time Monitoring</Label>
              <p className="text-sm text-gray-600">
                Automatically scan vendor sites for document changes
              </p>
            </div>
            <Switch
              id="monitoring-toggle"
              checked={stats?.isMonitoring || false}
              onCheckedChange={(checked) => toggleMonitoring.mutate(checked)}
              disabled={toggleMonitoring.isPending}
            />
          </div>

          <Separator />

          <div className="flex items-center gap-4">
            <Button
              onClick={() => triggerScan.mutate()}
              disabled={triggerScan.isPending}
              className="flex items-center gap-2"
            >
              {triggerScan.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Manual Scan
            </Button>

            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>

            <div className="ml-auto text-sm text-gray-600">
              Last scan: {stats?.lastScan ? formatTimeAgo(stats.lastScan) : 'Never'}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor Sites */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Monitored Vendors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {vendors.map((vendor) => (
                  <div key={vendor.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(vendor.status)}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{vendor.name}</p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              vendor.companyType === 'processor' ? 'border-blue-200 text-blue-700' :
                              vendor.companyType === 'gateway' ? 'border-purple-200 text-purple-700' :
                              'border-green-200 text-green-700'
                            }`}
                          >
                            {vendor.companyType?.toUpperCase() || 'PROCESSOR'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{vendor.documentsFound} documents tracked</p>
                        <p className="text-xs text-gray-500">
                          Priority {vendor.priority || 1} • {vendor.crawlFrequency || 'daily'} scans
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={vendor.active ? "default" : "secondary"}>
                        {vendor.active ? "Active" : "Paused"}
                      </Badge>
                      <Switch
                        checked={vendor.active}
                        onCheckedChange={(checked) => 
                          toggleVendor.mutate({ vendorId: vendor.id, active: checked })
                        }
                        size="sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Changes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Changes
              </CardTitle>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {recentChanges.length > 0 ? (
                  recentChanges.map((change) => (
                    <div key={change.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getChangeTypeIcon(change.changeType)}
                          <div>
                            <p className="font-medium text-sm">{change.documentTitle}</p>
                            <p className="text-xs text-gray-600">{change.vendorName}</p>
                          </div>
                        </div>
                        <Badge variant={
                          change.changeType === 'new' ? 'default' :
                          change.changeType === 'updated' ? 'secondary' : 'destructive'
                        }>
                          {change.changeType}
                        </Badge>
                      </div>
                      
                      {change.changeType === 'updated' && (
                        <div className="text-xs space-y-1">
                          {change.changes.added.length > 0 && (
                            <p className="text-green-600">+{change.changes.added.length} additions</p>
                          )}
                          {change.changes.removed.length > 0 && (
                            <p className="text-red-600">-{change.changes.removed.length} deletions</p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatTimeAgo(change.detectedAt)}</span>
                        <Button variant="ghost" size="sm" className="h-auto p-1">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent changes detected</p>
                    <p className="text-sm">Vendor sites are being monitored</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Implementation Status */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Roadmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Core monitoring infrastructure</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Database schema for vendor tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span>Web scraping and change detection</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <span>Vendor API integrations</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <span>Team notification system</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <span>Document categorization AI</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}