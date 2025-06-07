import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  Activity, 
  Eye, 
  AlertTriangle, 
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Zap,
  Clock,
  DollarSign
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, LineChart as RechartsLineChart, Line } from 'recharts';

interface IntelligenceUpdate {
  id: string;
  vendorName: string;
  updateType: string;
  content: string;
  sourceUrl: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionRequired: boolean;
  createdAt: string;
  dataFreshness: string;
}

interface VendorMetrics {
  name: string;
  marketShare: number;
  growthRate: number;
  customerSatisfaction: number;
  pricingTrend: 'up' | 'down' | 'stable';
  recentUpdates: number;
  threatLevel: 'high' | 'medium' | 'low';
}

export default function CompetitiveIntelligenceDashboard() {
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [impactFilter, setImpactFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('7d');

  const { data: updates, isLoading, refetch } = useQuery({
    queryKey: ['/api/vendor-intelligence/updates'],
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  const { data: vendorMetrics } = useQuery({
    queryKey: ['/api/vendor-intelligence/metrics'],
    refetchInterval: 600000 // Refresh every 10 minutes
  });

  const { data: marketTrends } = useQuery({
    queryKey: ['/api/vendor-intelligence/trends', timeRange],
    refetchInterval: 900000 // Refresh every 15 minutes
  });

  const mockVendorMetrics: VendorMetrics[] = [
    {
      name: 'Stripe',
      marketShare: 28.5,
      growthRate: 12.3,
      customerSatisfaction: 4.6,
      pricingTrend: 'down',
      recentUpdates: 5,
      threatLevel: 'high'
    },
    {
      name: 'Square',
      marketShare: 18.2,
      growthRate: 8.7,
      customerSatisfaction: 4.3,
      pricingTrend: 'stable',
      recentUpdates: 3,
      threatLevel: 'medium'
    },
    {
      name: 'PayPal',
      marketShare: 22.1,
      growthRate: 5.4,
      customerSatisfaction: 4.1,
      pricingTrend: 'up',
      recentUpdates: 2,
      threatLevel: 'medium'
    },
    {
      name: 'TracerPay',
      marketShare: 8.3,
      growthRate: 15.2,
      customerSatisfaction: 4.7,
      pricingTrend: 'down',
      recentUpdates: 8,
      threatLevel: 'low'
    }
  ];

  const mockTrendData = [
    { month: 'Jan', Stripe: 25, Square: 20, PayPal: 24, TracerPay: 6 },
    { month: 'Feb', Stripe: 26, Square: 19, PayPal: 23, TracerPay: 7 },
    { month: 'Mar', Stripe: 27, Square: 18, PayPal: 22, TracerPay: 7.5 },
    { month: 'Apr', Stripe: 28, Square: 18, PayPal: 22, TracerPay: 8 },
    { month: 'May', Stripe: 28.5, Square: 18.2, PayPal: 22.1, TracerPay: 8.3 }
  ];

  const filteredUpdates = updates?.filter((update: IntelligenceUpdate) => {
    const vendorMatch = selectedVendor === 'all' || update.vendorName.toLowerCase() === selectedVendor.toLowerCase();
    const impactMatch = impactFilter === 'all' || update.impact === impactFilter;
    return vendorMatch && impactMatch;
  }) || [];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getThreatColor = (threat: string) => {
    switch (threat) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Competitive Intelligence Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Real-time market intelligence and vendor monitoring
          </p>
        </div>
        <Button onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Updates</p>
                <p className="text-2xl font-bold">{filteredUpdates.length}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">High Priority</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredUpdates.filter((u: IntelligenceUpdate) => u.impact === 'high').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Action Required</p>
                <p className="text-2xl font-bold text-orange-600">
                  {filteredUpdates.filter((u: IntelligenceUpdate) => u.actionRequired).length}
                </p>
              </div>
              <Target className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Strategic items</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Live Sources</p>
                <p className="text-2xl font-bold text-green-600">12</p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Monitoring active</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Market Overview</TabsTrigger>
          <TabsTrigger value="updates">Intelligence Feed</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Analysis</TabsTrigger>
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Market Share Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Market Share Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Tooltip formatter={(value) => [`${value}%`, 'Market Share']} />
                    <RechartsPieChart data={mockVendorMetrics.map((vendor, index) => ({
                      name: vendor.name,
                      value: vendor.marketShare,
                      fill: COLORS[index % COLORS.length]
                    }))}>
                      {mockVendorMetrics.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </RechartsPieChart>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Growth Rate Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Growth Rate Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockVendorMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, 'Growth Rate']} />
                    <Bar dataKey="growthRate" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Threat Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>Competitive Threat Assessment</CardTitle>
              <CardDescription>
                Analysis of competitive positioning and threat levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {mockVendorMetrics.map((vendor) => (
                  <div key={vendor.name} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{vendor.name}</h3>
                      <Badge className={getThreatColor(vendor.threatLevel)}>
                        {vendor.threatLevel} threat
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Market Share:</span>
                        <span className="font-medium">{vendor.marketShare}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Growth Rate:</span>
                        <span className="font-medium">{vendor.growthRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Satisfaction:</span>
                        <span className="font-medium">{vendor.customerSatisfaction}/5</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Recent Updates:</span>
                        <span className="font-medium">{vendor.recentUpdates}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="updates" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vendors</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="tracerpay">TracerPay</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={impactFilter} onValueChange={setImpactFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select impact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Impact Levels</SelectItem>
                    <SelectItem value="high">High Impact</SelectItem>
                    <SelectItem value="medium">Medium Impact</SelectItem>
                    <SelectItem value="low">Low Impact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Intelligence Updates Feed */}
          <div className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    <span>Loading intelligence updates...</span>
                  </div>
                </CardContent>
              </Card>
            ) : filteredUpdates.length > 0 ? (
              filteredUpdates.map((update: IntelligenceUpdate) => (
                <Card key={update.id} className="transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-lg">{update.vendorName}</div>
                        <Badge className={getImpactColor(update.impact)}>
                          {update.impact} impact
                        </Badge>
                        {update.actionRequired && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            Action Required
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {update.dataFreshness}
                      </div>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {update.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Confidence: {Math.round((update.confidence || 0.85) * 100)}%</span>
                        <span>Type: {update.updateType}</span>
                      </div>
                      {update.sourceUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={update.sourceUrl} target="_blank" rel="noopener noreferrer">
                            View Source
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No intelligence updates match your current filters.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockVendorMetrics.map((vendor) => (
              <Card key={vendor.name}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {vendor.name}
                    <Badge className={getThreatColor(vendor.threatLevel)}>
                      {vendor.threatLevel} threat
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">Market Share</span>
                      </div>
                      <p className="text-xl font-bold text-blue-600">{vendor.marketShare}%</p>
                    </div>
                    
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">Growth Rate</span>
                      </div>
                      <p className="text-xl font-bold text-green-600">{vendor.growthRate}%</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Customer Satisfaction</span>
                      <span className="font-medium">{vendor.customerSatisfaction}/5.0</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(vendor.customerSatisfaction / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Pricing Trend</span>
                    <div className="flex items-center gap-1">
                      {vendor.pricingTrend === 'up' && <TrendingUp className="w-4 h-4 text-red-500" />}
                      {vendor.pricingTrend === 'down' && <TrendingUp className="w-4 h-4 text-green-500 rotate-180" />}
                      {vendor.pricingTrend === 'stable' && <div className="w-4 h-0.5 bg-gray-400" />}
                      <span className="capitalize">{vendor.pricingTrend}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Recent Updates</span>
                    <Badge variant="outline">{vendor.recentUpdates} updates</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                Market Share Trends
              </CardTitle>
              <CardDescription>
                5-month trend analysis of major payment processors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RechartsLineChart data={mockTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, 'Market Share']} />
                  <Line type="monotone" dataKey="Stripe" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="Square" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="PayPal" stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="TracerPay" stroke="#10b981" strokeWidth={2} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Market Leaders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockVendorMetrics
                    .sort((a, b) => b.marketShare - a.marketShare)
                    .map((vendor, index) => (
                      <div key={vendor.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <span>{vendor.name}</span>
                        </div>
                        <span className="font-semibold">{vendor.marketShare}%</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fastest Growing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockVendorMetrics
                    .sort((a, b) => b.growthRate - a.growthRate)
                    .map((vendor, index) => (
                      <div key={vendor.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span>{vendor.name}</span>
                        </div>
                        <span className="font-semibold text-green-600">+{vendor.growthRate}%</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockVendorMetrics
                    .sort((a, b) => b.customerSatisfaction - a.customerSatisfaction)
                    .map((vendor) => (
                      <div key={vendor.name} className="flex items-center justify-between">
                        <span>{vendor.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold">{vendor.customerSatisfaction}</span>
                          <span className="text-yellow-500">★</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}