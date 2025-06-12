import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Target, 
  BookOpen, 
  Award, 
  CheckCircle, 
  Lock, 
  Play, 
  Star,
  TrendingUp,
  Users,
  Calendar,
  Zap,
  Crown,
  Gift,
  ArrowRight,
  Clock,
  BarChart3
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface LearningModule {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  prerequisites: string[];
  skills: string[];
  xpReward: number;
  isCompleted: boolean;
  isUnlocked: boolean;
  completionDate?: string;
  score?: number;
}

interface Skill {
  id: string;
  name: string;
  category: string;
  level: number;
  maxLevel: number;
  xp: number;
  xpToNext: number;
  description: string;
  benefits: string[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  isUnlocked: boolean;
  unlockedDate?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  category: string;
  modules: string[];
  estimatedDuration: number;
  difficulty: string;
  completionRate: number;
  isStarted: boolean;
}

export default function LearningPathPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  
  const queryClient = useQueryClient();

  // Fetch learning data
  const { data: learningPaths = [] } = useQuery({
    queryKey: ['/api/learning/paths'],
    retry: false,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['/api/learning/modules'],
    retry: false,
  });

  const { data: skills = [] } = useQuery({
    queryKey: ['/api/learning/skills'],
    retry: false,
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ['/api/learning/achievements'],
    retry: false,
  });

  const { data: userProgress } = useQuery({
    queryKey: ['/api/learning/progress'],
    retry: false,
  });

  // Start learning module mutation
  const startModuleMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      return apiRequest(`/api/learning/modules/${moduleId}/start`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/learning/modules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/progress'] });
    }
  });

  // Complete learning module mutation
  const completeModuleMutation = useMutation({
    mutationFn: async ({ moduleId, score }: { moduleId: string; score: number }) => {
      return apiRequest(`/api/learning/modules/${moduleId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/learning/modules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/skills'] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/achievements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/progress'] });
    }
  });

  const totalXP = userProgress?.totalXP || 0;
  const currentLevel = Math.floor(totalXP / 1000) + 1;
  const xpForNextLevel = (currentLevel * 1000) - totalXP;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'uncommon': return 'bg-green-100 text-green-800 border-green-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Learning Path</h1>
          <p className="text-muted-foreground">
            Develop your sales skills through gamified learning experiences
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">Level {currentLevel}</div>
            <div className="text-sm text-gray-600">{totalXP} XP</div>
          </div>
          <div className="w-32">
            <Progress value={(1000 - xpForNextLevel) / 10} className="h-2" />
            <div className="text-xs text-gray-600 mt-1">{xpForNextLevel} XP to next level</div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="paths">Learning Paths</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Progress Summary */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total XP</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalXP}</div>
                <p className="text-xs text-muted-foreground">
                  Level {currentLevel} Sales Professional
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Modules Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {modules.filter((m: LearningModule) => m.isCompleted).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {modules.length} total modules
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Achievements</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {achievements.filter((a: Achievement) => a.isUnlocked).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {achievements.length} available
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modules.filter((m: LearningModule) => m.isCompleted).slice(0, 3).map((module: LearningModule) => (
                  <div key={module.id} className="flex items-center gap-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <div className="font-medium">{module.title}</div>
                      <div className="text-sm text-gray-600">Completed • +{module.xpReward} XP</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {module.category}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommended Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modules.filter((m: LearningModule) => m.isUnlocked && !m.isCompleted).slice(0, 4).map((module: LearningModule) => (
                  <div key={module.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                       onClick={() => setSelectedModule(module)}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{module.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                      </div>
                      <Badge className={getDifficultyColor(module.difficulty)}>
                        {module.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        {module.estimatedTime} min
                      </div>
                      <div className="flex items-center gap-1 text-blue-600">
                        <Star className="w-4 h-4" />
                        +{module.xpReward} XP
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Learning Paths Tab */}
        <TabsContent value="paths" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {learningPaths.map((path: LearningPath) => (
              <Card key={path.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedPath(path.id)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{path.name}</CardTitle>
                      <CardDescription>{path.description}</CardDescription>
                    </div>
                    <Badge variant="outline">{path.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{path.completionRate}%</span>
                    </div>
                    <Progress value={path.completionRate} className="h-2" />
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        {path.estimatedDuration} hours
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <BookOpen className="w-4 h-4" />
                        {path.modules.length} modules
                      </div>
                    </div>

                    <Button className="w-full" variant={path.isStarted ? "outline" : "default"}>
                      {path.isStarted ? "Continue" : "Start Path"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {skills.map((skill: Skill) => (
              <Card key={skill.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{skill.name}</CardTitle>
                      <CardDescription>{skill.description}</CardDescription>
                    </div>
                    <Badge variant="outline">{skill.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Level {skill.level}</span>
                      <span className="text-sm text-gray-600">{skill.xp} / {skill.xp + skill.xpToNext} XP</span>
                    </div>
                    <Progress value={(skill.xp / (skill.xp + skill.xpToNext)) * 100} className="h-2" />
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Benefits:</div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {skill.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement: Achievement) => (
              <Card key={achievement.id} 
                    className={`${achievement.isUnlocked ? '' : 'opacity-50'} border-2 ${getRarityColor(achievement.rarity)}`}>
                <CardHeader className="text-center">
                  <div className="mx-auto mb-2">
                    {achievement.isUnlocked ? (
                      <Trophy className="w-12 h-12 text-yellow-600" />
                    ) : (
                      <Lock className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <CardTitle className="text-lg">{achievement.title}</CardTitle>
                  <CardDescription>{achievement.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <Badge className={getRarityColor(achievement.rarity)}>
                      {achievement.rarity}
                    </Badge>
                    <div className="flex items-center gap-1 text-blue-600">
                      <Star className="w-4 h-4" />
                      +{achievement.xpReward} XP
                    </div>
                  </div>
                  {achievement.isUnlocked && achievement.unlockedDate && (
                    <div className="text-xs text-gray-600 mt-2">
                      Unlocked {new Date(achievement.unlockedDate).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-600" />
                Top Performers This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* This would be populated with real leaderboard data */}
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4" />
                  <p>Leaderboard data will be available once more users complete learning modules</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Module Details Modal */}
      {selectedModule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedModule.title}</CardTitle>
                  <CardDescription>{selectedModule.description}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedModule(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge className={getDifficultyColor(selectedModule.difficulty)}>
                  {selectedModule.difficulty}
                </Badge>
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-4 h-4" />
                  {selectedModule.estimatedTime} minutes
                </div>
                <div className="flex items-center gap-1 text-blue-600">
                  <Star className="w-4 h-4" />
                  +{selectedModule.xpReward} XP
                </div>
              </div>

              {selectedModule.prerequisites.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Prerequisites:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedModule.prerequisites.map(prereq => (
                      <Badge key={prereq} variant="outline">{prereq}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Skills You'll Learn:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedModule.skills.map(skill => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  className="flex-1"
                  onClick={() => {
                    startModuleMutation.mutate(selectedModule.id);
                    setSelectedModule(null);
                  }}
                  disabled={startModuleMutation.isPending || !selectedModule.isUnlocked}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {selectedModule.isCompleted ? 'Retake Module' : 'Start Learning'}
                </Button>
                <Button variant="outline" onClick={() => setSelectedModule(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}