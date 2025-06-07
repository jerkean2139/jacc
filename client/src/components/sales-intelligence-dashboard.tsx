import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Clock, 
  DollarSign,
  Brain,
  Zap,
  Shield,
  Calendar,
  Users,
  Trophy,
  Bell,
  Eye,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Activity
} from 'lucide-react';

interface DealPrediction {
  dealId: string;
  closeProbability: number;
  predictedCloseDate: string;
  predictedValue: number;
  riskFactors: string[];
  accelerators: string[];
  recommendedActions: string[];
  confidence: number;
  prospectName?: string;
}

interface ProactiveAlert {
  id: string;
  type: 'opportunity' | 'risk' | 'follow-up' | 'competitive' | 'budget-cycle';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  suggestedAction: string;
  deadline?: string;
  prospectName?: string;
}

interface SalesIntelligenceDashboardProps {
  activeConversations: any[];
  isVisible: boolean;
  onToggle: () => void;
}

export default function SalesIntelligenceDashboard({ 
  activeConversations, 
  isVisible, 
  onToggle 
}: SalesIntelligenceDashboardProps) {
  const [selectedAlert, setSelectedAlert] = useState<ProactiveAlert | null>(null);
  const [dealPredictions, setDealPredictions] = useState<DealPrediction[]>([]);
  const [proactiveAlerts, setProactiveAlerts] = useState<ProactiveAlert[]>([]);

  // Fetch proactive alerts
  const { data: alertsData } = useQuery({
    queryKey: ['/api/sales-intelligence/alerts'],
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Fetch deal predictions
  const { data: predictionsData } = useQuery({
    queryKey: ['/api/sales-intelligence/predictions'],
    refetchInterval: 60000, // Update every minute
  });

  useEffect(() => {
    if (alertsData) {
      setProactiveAlerts(alertsData.alerts || []);
    }
  }, [alertsData]);

  useEffect(() => {
    if (predictionsData) {
      setDealPredictions(predictionsData.predictions || []);
    }
  }, [predictionsData]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Target className="h-4 w-4" />;
      case 'risk': return <AlertTriangle className="h-4 w-4" />;
      case 'follow-up': return <Clock className="h-4 w-4" />;
      case 'competitive': return <Shield className="h-4 w-4" />;
      case 'budget-cycle': return <DollarSign className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const totalPipelineValue = dealPredictions.reduce((sum, deal) => sum + (deal.predictedValue || 0), 0);
  const avgCloseProbability = dealPredictions.length > 0 
    ? dealPredictions.reduce((sum, deal) => sum + deal.closeProbability, 0) / dealPredictions.length 
    : 0;
  const highPriorityAlerts = proactiveAlerts.filter(alert => alert.priority === 'critical' || alert.priority === 'high').length;

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <Button
          onClick={onToggle}
          className="rounded-full h-12 w-12 shadow-lg bg-purple-600 hover:bg-purple-700 relative"
        >
          <Brain className="h-6 w-6" />
          {highPriorityAlerts > 0 && (
            <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
              {highPriorityAlerts}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 w-96 max-h-[calc(100vh-2rem)] z-40 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-sm">Sales Intelligence</h3>
          <Badge variant="outline" className="text-xs">
            AI-Powered
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onToggle} className="h-8 w-8 p-0">
          <Eye className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="max-h-96">
        <div className="p-3 space-y-4">
          {/* Pipeline Overview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy className="h-4 w-4 text-gold-600" />
                Pipeline Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Pipeline Value</p>
                  <p className="font-bold text-blue-600">
                    ${totalPipelineValue.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Avg Close Rate</p>
                  <p className="font-bold text-green-600">
                    {Math.round(avgCloseProbability)}%
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Active Deals</span>
                  <span>{dealPredictions.length}</span>
                </div>
                <Progress value={avgCloseProbability} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Critical Alerts */}
          {proactiveAlerts.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bell className="h-4 w-4 text-red-600" />
                  Priority Alerts
                  <Badge className="bg-red-500 text-white text-xs">
                    {proactiveAlerts.filter(a => a.priority === 'critical' || a.priority === 'high').length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {proactiveAlerts.slice(0, 3).map(alert => (
                  <div
                    key={alert.id}
                    className="p-2 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeIcon(alert.type)}
                      <span className="text-sm font-medium">{alert.title}</span>
                      <Badge className={`${getPriorityColor(alert.priority)} text-xs`}>
                        {alert.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {alert.message}
                    </p>
                    {alert.prospectName && (
                      <p className="text-xs text-blue-600 mt-1">
                        → {alert.prospectName}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Top Deal Predictions */}
          {dealPredictions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Deal Predictions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dealPredictions.slice(0, 3).map(deal => (
                  <div key={deal.dealId} className="p-2 border rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {deal.prospectName || `Deal ${deal.dealId.slice(-4)}`}
                      </span>
                      <div className="flex items-center gap-1">
                        {deal.closeProbability >= 70 ? 
                          <ArrowUp className="h-3 w-3 text-green-600" /> :
                          deal.closeProbability >= 40 ?
                          <Activity className="h-3 w-3 text-yellow-600" /> :
                          <ArrowDown className="h-3 w-3 text-red-600" />
                        }
                        <span className="text-xs font-bold">
                          {deal.closeProbability}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>${deal.predictedValue?.toLocaleString() || '0'}</span>
                      <span>{deal.predictedCloseDate}</span>
                    </div>
                    
                    <Progress value={deal.closeProbability} className="h-1 mt-1" />
                    
                    {deal.riskFactors.length > 0 && (
                      <div className="mt-1">
                        <p className="text-xs text-red-600">
                          Risk: {deal.riskFactors[0]}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                <Users className="h-3 w-3 mr-2" />
                Analyze Active Prospects
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                <Calendar className="h-3 w-3 mr-2" />
                Schedule Follow-ups
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                <Target className="h-3 w-3 mr-2" />
                Update Deal Stages
              </Button>
            </CardContent>
          </Card>

          {/* Market Intelligence */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                Market Pulse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Q4 budget cycles active</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Rate competition increasing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Digital payment adoption up 15%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 max-w-[90vw]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getTypeIcon(selectedAlert.type)}
                {selectedAlert.title}
                <Badge className={getPriorityColor(selectedAlert.priority)}>
                  {selectedAlert.priority}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm">{selectedAlert.message}</p>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-500">
                  <p className="text-sm font-medium mb-1">Suggested Action:</p>
                  <p className="text-sm">{selectedAlert.suggestedAction}</p>
                </div>
                
                {selectedAlert.deadline && (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <Clock className="h-4 w-4" />
                    <span>Deadline: {selectedAlert.deadline}</span>
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1">
                    Take Action
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedAlert(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}