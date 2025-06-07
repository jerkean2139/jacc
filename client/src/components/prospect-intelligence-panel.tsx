import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain, 
  Building, 
  Users, 
  Target, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Eye,
  Search,
  Plus,
  Edit,
  Star,
  Award,
  Zap,
  Shield,
  Lightbulb
} from 'lucide-react';

interface ProspectProfile {
  id: string;
  companyName: string;
  industry: string;
  decisionMaker: string;
  businessModel: string;
  revenue: string;
  painPoints: string[];
  previousInteractions: string[];
  competitiveIntel: string[];
  personalDetails: string[];
  preferredCommunication: string;
  urgency: 'low' | 'medium' | 'high';
  budget: string;
  timeline: string;
  stakeholders: string[];
}

interface DealIntelligence {
  competitorAnalysis: string[];
  priceAnchoring: string[];
  valueProposition: string[];
  objectionHandling: string[];
  closingStrategy: string[];
  followUpPlan: string[];
}

interface ProspectIntelligencePanelProps {
  isOpen: boolean;
  onClose: () => void;
  prospectName?: string;
  conversationHistory: string[];
}

export default function ProspectIntelligencePanel({ 
  isOpen, 
  onClose, 
  prospectName, 
  conversationHistory 
}: ProspectIntelligencePanelProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<ProspectProfile | null>(null);
  const [dealIntel, setDealIntel] = useState<DealIntelligence | null>(null);
  const [opportunities, setOpportunities] = useState<string[]>([]);
  const [strategicGuidance, setStrategicGuidance] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchCompany, setSearchCompany] = useState('');

  useEffect(() => {
    if (isOpen && prospectName && conversationHistory.length > 0) {
      analyzeProspect();
    }
  }, [isOpen, prospectName, conversationHistory]);

  const analyzeProspect = async () => {
    if (!prospectName) return;
    
    setIsAnalyzing(true);
    
    try {
      // Build prospect profile
      const profileResponse = await fetch('/api/donna-ai/build-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          companyName: prospectName,
          conversationData: conversationHistory
        })
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
        
        // Generate deal intelligence
        const intelResponse = await fetch('/api/donna-ai/deal-intelligence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            profile: profileData,
            dealStage: 'discovery'
          })
        });
        
        if (intelResponse.ok) {
          const intelData = await intelResponse.json();
          setDealIntel(intelData);
        }
        
        // Identify opportunities
        const opportunitiesResponse = await fetch('/api/donna-ai/opportunities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            conversationText: conversationHistory.join('\n'),
            profile: profileData
          })
        });
        
        if (opportunitiesResponse.ok) {
          const oppData = await opportunitiesResponse.json();
          setOpportunities(oppData.opportunities || []);
        }
        
        // Get strategic guidance
        const guidanceResponse = await fetch('/api/donna-ai/strategic-guidance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            conversationHistory,
            currentMessage: conversationHistory[conversationHistory.length - 1],
            profile: profileData
          })
        });
        
        if (guidanceResponse.ok) {
          const guidanceData = await guidanceResponse.json();
          setStrategicGuidance(guidanceData);
        }
      }
    } catch (error) {
      console.error('Error analyzing prospect:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-purple-600" />
              <div>
                <CardTitle className="text-xl">Prospect Intelligence</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {prospectName || 'Advanced Sales Intelligence & Strategy'}
                </p>
              </div>
              {profile && (
                <Badge className={`${getUrgencyColor(profile.urgency)} text-white`}>
                  {profile.urgency.toUpperCase()} PRIORITY
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isAnalyzing && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Analyzing...</span>
                </div>
              )}
              <Button variant="ghost" onClick={onClose}>
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-5 rounded-none border-b">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="intelligence">Deal Intel</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="search">Research</TabsTrigger>
          </TabsList>

          <div className="max-h-[calc(90vh-140px)] overflow-y-auto">
            <TabsContent value="profile" className="mt-0">
              <div className="p-6 space-y-6">
                {profile ? (
                  <>
                    {/* Company Overview */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building className="h-5 w-5" />
                          Company Profile
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Industry</Label>
                          <p className="text-sm">{profile.industry}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Business Model</Label>
                          <p className="text-sm">{profile.businessModel}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Revenue</Label>
                          <p className="text-sm">{profile.revenue}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Decision Maker</Label>
                          <p className="text-sm">{profile.decisionMaker}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Pain Points */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                          Pain Points & Challenges
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {profile.painPoints.map((pain, index) => (
                            <div key={index} className="flex items-start gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                              <span className="text-sm">{pain}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Stakeholders & Timeline */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Stakeholders
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            {profile.stakeholders.map((stakeholder, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {stakeholder}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Timeline & Budget
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <Label className="text-xs">Timeline</Label>
                            <p className="text-sm">{profile.timeline}</p>
                          </div>
                          <div>
                            <Label className="text-xs">Budget</Label>
                            <p className="text-sm">{profile.budget}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Personal Details */}
                    {profile.personalDetails.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-600" />
                            Personal Connection Points
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            {profile.personalDetails.map((detail, index) => (
                              <div key={index} className="text-sm p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                                {detail}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Start a conversation to build prospect intelligence
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="intelligence" className="mt-0">
              <div className="p-6 space-y-6">
                {dealIntel ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-blue-600" />
                          Competitive Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {dealIntel.competitorAnalysis.map((item, index) => (
                            <div key={index} className="text-sm p-2 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                              {item}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          Price Anchoring Strategy
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {dealIntel.priceAnchoring.map((item, index) => (
                            <div key={index} className="text-sm p-2 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                              {item}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-purple-600" />
                          Value Proposition
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {dealIntel.valueProposition.map((item, index) => (
                            <div key={index} className="text-sm p-2 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20">
                              {item}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                          Objection Handling
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {dealIntel.objectionHandling.map((item, index) => (
                            <div key={index} className="text-sm p-2 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20">
                              {item}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Deal intelligence will appear after prospect analysis
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="opportunities" className="mt-0">
              <div className="p-6 space-y-4">
                {opportunities.length > 0 ? (
                  opportunities.map((opportunity, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium mb-1">Opportunity #{index + 1}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{opportunity}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Continue the conversation to identify sales opportunities
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="strategy" className="mt-0">
              <div className="p-6 space-y-6">
                {strategicGuidance ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-red-600" />
                          Next Best Action
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
                          <p className="font-medium text-red-900 dark:text-red-100">
                            {strategicGuidance.nextBestAction}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-blue-600" />
                          Strategic Questions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {strategicGuidance.strategicQuestions.map((question: string, index: number) => (
                            <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-500">
                              <p className="text-sm">{question}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-purple-600" />
                          Power Moves
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {strategicGuidance.powerMoves.map((move: string, index: number) => (
                            <div key={index} className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded border-l-4 border-purple-500">
                              <p className="text-sm">{move}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-green-600" />
                          Risk Mitigation
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {strategicGuidance.riskMitigation.map((risk: string, index: number) => (
                            <div key={index} className="p-3 bg-green-50 dark:bg-green-900/20 rounded border-l-4 border-green-500">
                              <p className="text-sm">{risk}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Strategic guidance will appear after conversation analysis
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="search" className="mt-0">
              <div className="p-6 space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Research company or prospect..."
                    value={searchCompany}
                    onChange={(e) => setSearchCompany(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={() => analyzeProspect()}>
                    <Search className="h-4 w-4 mr-2" />
                    Research
                  </Button>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Prospect Research Tools</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Building className="h-4 w-4 mr-2" />
                      Company Background Research
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Industry Analysis
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Decision Maker Profiling
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="h-4 w-4 mr-2" />
                      Competitive Intelligence
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}