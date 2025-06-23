import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Users, MessageSquare, Activity } from 'lucide-react';

interface LeaderboardAgent {
  rank: number;
  username: string;
  email: string;
  role: string;
  totalChats: number;
  totalMessages: number;
  userQueries: number;
  aiResponses: number;
  lastActivity: string;
  joinedDate: string;
  activityScore: number;
}

interface LeaderboardWidgetProps {
  showFullLeaderboard?: boolean;
  maxEntries?: number;
}

export function LeaderboardWidget({ showFullLeaderboard = false, maxEntries = 5 }: LeaderboardWidgetProps) {
  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['/api/leaderboard'],
    refetchInterval: 60000, // Refresh every minute
  });

  const agents = (leaderboardData && typeof leaderboardData === 'object' && 'leaderboard' in leaderboardData && Array.isArray((leaderboardData as any).leaderboard)) ? (leaderboardData as any).leaderboard : [];
  const displayAgents = showFullLeaderboard ? agents : agents.slice(0, maxEntries);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Agent Activity Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading leaderboard...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!agents.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Agent Activity Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No Activity Data Yet</p>
            <p className="text-sm">Agent chat activity will appear here once conversations begin</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          Agent Activity Leaderboard
        </CardTitle>
        {!showFullLeaderboard && (
          <div className="text-sm text-gray-600">
            Top {maxEntries} most active agents
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        {showFullLeaderboard && (
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {agents.reduce((sum: number, agent: LeaderboardAgent) => sum + agent.totalChats, 0)}
              </div>
              <div className="text-xs text-gray-500">Total Chats</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {agents.reduce((sum: number, agent: LeaderboardAgent) => sum + agent.userQueries, 0)}
              </div>
              <div className="text-xs text-gray-500">User Queries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {agents.reduce((sum: number, agent: LeaderboardAgent) => sum + agent.aiResponses, 0)}
              </div>
              <div className="text-xs text-gray-500">AI Responses</div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {displayAgents.map((agent: LeaderboardAgent, index: number) => (
            <div 
              key={agent.username} 
              className={`flex items-center justify-between p-3 border rounded-lg transition-all hover:shadow-sm ${
                index === 0 ? 'bg-yellow-50 border-yellow-200' :
                index === 1 ? 'bg-gray-50 border-gray-200' :
                index === 2 ? 'bg-orange-50 border-orange-200' :
                'bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-yellow-200 text-yellow-800' :
                  index === 1 ? 'bg-gray-200 text-gray-800' :
                  index === 2 ? 'bg-orange-200 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {agent.rank}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{agent.username}</span>
                    <Badge variant="outline" className="text-xs">
                      {agent.role}
                    </Badge>
                    {index < 3 && (
                      <div className="flex items-center gap-1">
                        {index === 0 && <Trophy className="h-3 w-3 text-yellow-600" />}
                        {index === 1 && <Medal className="h-3 w-3 text-gray-600" />}
                        {index === 2 && <Award className="h-3 w-3 text-orange-600" />}
                      </div>
                    )}
                  </div>
                  
                  {showFullLeaderboard && (
                    <>
                      <div className="text-xs text-gray-600">{agent.email}</div>
                      {agent.lastActivity && (
                        <div className="text-xs text-gray-500">
                          Last active: {new Date(agent.lastActivity).toLocaleDateString()}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                {showFullLeaderboard ? (
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="text-center">
                      <div className="font-bold">{agent.totalChats}</div>
                      <div className="text-gray-500">Chats</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{agent.userQueries}</div>
                      <div className="text-gray-500">Queries</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{agent.aiResponses}</div>
                      <div className="text-gray-500">Responses</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="font-bold text-blue-600">{agent.totalMessages}</div>
                    <div className="text-xs text-gray-500">Messages</div>
                  </div>
                )}
                
                <div className="mt-1">
                  <div className="font-bold text-xs text-purple-600">{agent.activityScore} pts</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {!showFullLeaderboard && agents.length > maxEntries && (
          <div className="text-center mt-4 pt-4 border-t">
            <span className="text-sm text-gray-500">
              +{agents.length - maxEntries} more agents
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}