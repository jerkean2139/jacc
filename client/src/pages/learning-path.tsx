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
  estimatedTime: number;
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
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Learning Path
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-lg mt-2">
                Develop your sales skills through gamified learning experiences
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  Level {currentLevel}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{totalXP} XP</div>
              </div>
              <div className="w-40">
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(((1000 - xpForNextLevel) / 1000) * 100)}%</span>
                </div>
                <Progress value={(1000 - xpForNextLevel) / 10} className="h-3" />
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                  {xpForNextLevel} XP to next level
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-2">
            <TabsList className="grid w-full grid-cols-5 bg-slate-50 dark:bg-slate-700">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600">Overview</TabsTrigger>
              <TabsTrigger value="paths" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600">Learning Paths</TabsTrigger>
              <TabsTrigger value="skills" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600">Skills</TabsTrigger>
              <TabsTrigger value="achievements" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600">Achievements</TabsTrigger>
              <TabsTrigger value="leaderboard" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600">Leaderboard</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Progress Summary */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Total XP</CardTitle>
                  <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalXP}</div>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Level {currentLevel} Sales Professional
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Modules Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {modules.filter((m: LearningModule) => m.isCompleted).length}
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    of {modules.length} total modules
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">Achievements</CardTitle>
                  <Trophy className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {achievements.filter((a: Achievement) => a.isUnlocked).length}
                  </div>
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    of {achievements.length} available
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {modules.filter((m: LearningModule) => m.isCompleted).slice(0, 3).map((module: LearningModule) => (
                    <div key={module.id} className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{module.title}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Completed • +{module.xpReward} XP</div>
                      </div>
                      <Badge variant="outline" className={getDifficultyColor(module.difficulty)}>
                        {module.category}
                      </Badge>
                    </div>
                  ))}
                  {modules.filter((m: LearningModule) => m.isCompleted).length === 0 && (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Complete your first learning module to see activity here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recommended Next Steps */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  Recommended Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modules.filter((m: LearningModule) => m.isUnlocked && !m.isCompleted).slice(0, 4).map((module: LearningModule) => (
                    <div key={module.id} 
                         className="border rounded-xl p-4 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors border-slate-200 dark:border-slate-600"
                         onClick={() => setSelectedModule(module)}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 dark:text-slate-100">{module.title}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{module.description}</p>
                        </div>
                        <Badge className={getDifficultyColor(module.difficulty)}>
                          {module.difficulty}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Clock className="w-4 h-4" />
                          {module.estimatedTime} min
                        </div>
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
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
                <Card key={path.id} className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600"
                      onClick={() => setSelectedPath(path.id)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-slate-900 dark:text-slate-100">{path.name}</CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">{path.description}</CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">{path.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Progress</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{path.completionRate}%</span>
                      </div>
                      <Progress value={path.completionRate} className="h-2" />
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <Clock className="w-4 h-4" />
                          {path.estimatedDuration} hours
                        </div>
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
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
                <Card key={skill.id} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-slate-900 dark:text-slate-100">{skill.name}</CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">{skill.description}</CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">{skill.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Level {skill.level}</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">{skill.xp} / {skill.xp + skill.xpToNext} XP</span>
                      </div>
                      <Progress value={(skill.xp / (skill.xp + skill.xpToNext)) * 100} className="h-2" />
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Benefits:</div>
                        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                          {skill.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
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
                      className={`${achievement.isUnlocked ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50 opacity-60'} border-2 ${getRarityColor(achievement.rarity)} transition-all duration-200`}>
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-2">
                      {achievement.isUnlocked ? (
                        <Trophy className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
                      ) : (
                        <Lock className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                    <CardTitle className="text-lg text-slate-900 dark:text-slate-100">{achievement.title}</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">{achievement.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="flex items-center justify-center gap-4 text-sm">
                      <Badge className={getRarityColor(achievement.rarity)}>
                        {achievement.rarity}
                      </Badge>
                      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <Star className="w-4 h-4" />
                        +{achievement.xpReward} XP
                      </div>
                    </div>
                    {achievement.isUnlocked && achievement.unlockedDate && (
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-2">
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
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  Top Performers This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Leaderboard Coming Soon</p>
                    <p>Complete learning modules to see how you rank against other sales reps</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Module Details Modal */}
        {selectedModule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl text-slate-900 dark:text-slate-100">{selectedModule.title}</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">{selectedModule.description}</CardDescription>
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
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                    <Clock className="w-4 h-4" />
                    {selectedModule.estimatedTime} minutes
                  </div>
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <Star className="w-4 h-4" />
                    +{selectedModule.xpReward} XP
                  </div>
                </div>

                {selectedModule.prerequisites.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-slate-900 dark:text-slate-100">Prerequisites:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedModule.prerequisites.map(prereq => (
                        <Badge key={prereq} variant="outline">{prereq}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2 text-slate-900 dark:text-slate-100">Skills You'll Learn:</h4>
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
    </div>
  );
}