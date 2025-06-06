import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, TrendingUp, MessageSquare, Users, Timer } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ChatMonitoringData {
  id: string;
  chatId: string;
  userId: string;
  firstUserQuery: string;
  aiResponse: string;
  responseTime: number;
  tokensUsed: number;
  model: string;
  confidence: number;
  timestamp: Date;
  isAccurate: boolean | null;
  adminNotes: string | null;
}

interface AccuracyStats {
  total: number;
  accurate: number;
  inaccurate: number;
  pending: number;
  averageResponseTime: number;
  averageConfidence: number;
}

export default function ChatMonitoring() {
  const [selectedInteraction, setSelectedInteraction] = useState<ChatMonitoringData | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: monitoringData = [], isLoading } = useQuery({
    queryKey: ['/api/admin/chat-monitoring'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: stats } = useQuery<AccuracyStats>({
    queryKey: ['/api/admin/chat-monitoring/stats'],
    refetchInterval: 30000,
  });

  const ratingMutation = useMutation({
    mutationFn: async ({ id, isAccurate, notes }: { id: string; isAccurate: boolean; notes: string }) => {
      return await apiRequest(`/api/admin/chat-monitoring/${id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAccurate, adminNotes: notes })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat-monitoring'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat-monitoring/stats'] });
      setSelectedInteraction(null);
      setAdminNotes('');
    }
  });

  const handleRateInteraction = (isAccurate: boolean) => {
    if (!selectedInteraction) return;
    
    ratingMutation.mutate({
      id: selectedInteraction.id,
      isAccurate,
      notes: adminNotes
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading monitoring data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chat Monitoring</h1>
          <p className="text-muted-foreground">Track first queries and AI response accuracy</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total > 0 ? Math.round((stats.accurate / (stats.accurate + stats.inaccurate)) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.accurate} accurate, {stats.inaccurate} inaccurate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats.averageResponseTime)}ms</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monitoring Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>First Interactions</CardTitle>
          <CardDescription>
            Review first queries and AI responses for accuracy assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monitoringData.map((interaction: ChatMonitoringData) => (
              <Card key={interaction.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{interaction.model}</Badge>
                      <Badge variant="secondary">
                        {interaction.responseTime}ms
                      </Badge>
                      <Badge variant="outline">
                        Confidence: {Math.round(interaction.confidence * 100)}%
                      </Badge>
                      {interaction.isAccurate === true && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Accurate
                        </Badge>
                      )}
                      {interaction.isAccurate === false && (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inaccurate
                        </Badge>
                      )}
                      {interaction.isAccurate === null && (
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(interaction.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">User Query:</h4>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                        {interaction.firstUserQuery}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2">AI Response:</h4>
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm max-h-32 overflow-y-auto">
                        {interaction.aiResponse}
                      </div>
                    </div>
                  </div>

                  {interaction.adminNotes && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Admin Notes:</h4>
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg text-sm">
                        {interaction.adminNotes}
                      </div>
                    </div>
                  )}

                  {interaction.isAccurate === null && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setSelectedInteraction(interaction)}
                        variant="outline"
                      >
                        Rate Response
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {monitoringData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No monitoring data available. Start a new chat to see first interactions appear here.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rating Modal */}
      {selectedInteraction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle>Rate AI Response Accuracy</CardTitle>
              <CardDescription>
                Evaluate the quality and accuracy of this AI response
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">User Query:</h4>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                    {selectedInteraction.firstUserQuery}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">AI Response:</h4>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm max-h-40 overflow-y-auto">
                    {selectedInteraction.aiResponse}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Admin Notes (Optional):
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about the response quality, accuracy, or suggestions for improvement..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedInteraction(null);
                    setAdminNotes('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleRateInteraction(false)}
                  disabled={ratingMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Inaccurate
                </Button>
                <Button
                  onClick={() => handleRateInteraction(true)}
                  disabled={ratingMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accurate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}