import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  ArrowRight, 
  Users, 
  Settings, 
  Calculator,
  MessageSquare,
  FileText,
  Mic,
  Download,
  Shield,
  Zap,
  Target,
  TrendingUp,
  ArrowLeft,
  Home,
  Clock,
  Database,
  Globe,
  Lock,
  Upload,
  Search,
  Brain,
  BarChart3,
  UserCheck,
  Monitor
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

export default function UserGuide() {
  const [activeRole, setActiveRole] = useState('sales-agent');
  const [location, navigate] = useLocation();

  // Get current user data to determine role-based visibility
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
    enabled: true
  });

  const handleGoBack = () => {
    // Navigate back to home or previous page
    navigate('/');
  };

  const allRoles = {
    'sales-agent': {
      name: 'Sales Agent',
      icon: Target,
      color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      description: 'Front-line sales representatives using JACC for merchant services'
    },
    'client-admin': {
      name: 'Client Admin',
      icon: Settings,
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      description: 'Business administrators managing team access and configurations'
    },
    'dev-admin': {
      name: 'System Admin',
      icon: Shield,
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      description: 'Technical administrators with full system access'
    }
  };

  // Filter roles based on user permissions
  const getUserVisibleRoles = () => {
    if (!user) return { 'sales-agent': allRoles['sales-agent'] };
    
    const userRole = user.role;
    
    // Regular sales agents only see their own guide
    if (userRole === 'sales-agent') {
      return { 'sales-agent': allRoles['sales-agent'] };
    }
    
    // Admins can see all roles
    if (userRole === 'client-admin' || userRole === 'dev-admin') {
      return allRoles;
    }
    
    // Default to sales agent view
    return { 'sales-agent': allRoles['sales-agent'] };
  };

  const roles = getUserVisibleRoles();

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoBack}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
        <span>/</span>
        <span className="text-foreground font-medium">User Guide</span>
      </div>
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold">Tracer User Guide</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Complete onboarding and training guide for Tracer Co Card's AI-powered merchant services assistant
        </p>
      </div>
      {/* Role Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Select Your Role
          </CardTitle>
          <CardDescription>
            Choose your role to see relevant onboarding steps and features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(roles).map(([key, role]) => {
              const IconComponent = role.icon;
              return (
                <Card 
                  key={key}
                  className={`cursor-pointer transition-all ${
                    activeRole === key ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' : 'hover:shadow-md'
                  }`}
                  onClick={() => setActiveRole(key)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-3">
                      <div className={`p-2 rounded-lg ${role.color}`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">{role.name}</h3>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {/* Role-Specific Content */}
      <Tabs defaultValue="getting-started" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="tips">Tips & Tricks</TabsTrigger>
        </TabsList>

        {/* Getting Started */}
        <TabsContent value="getting-started">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-green-600" />
                Getting Started with JACC
              </CardTitle>
              <CardDescription>
                Your first steps to becoming productive with the AI-powered merchant services assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  <strong>Welcome to JACC!</strong> Your AI-powered assistant for merchant services, rate calculations, and sales support.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">What is JACC?</h3>
                <p className="text-muted-foreground">JACC  is Tracer Co Card's comprehensive AI-powered Assistant that combines:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span>AI-powered chat assistant</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-green-600" />
                      <span>Real-time rate calculations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <span>Document management</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-orange-600" />
                      <span>Voice conversations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-red-600" />
                      <span>Savings projections</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-indigo-600" />
                      <span>Proposal generation</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">System Requirements</h3>
                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    Works on most modern devices (2019+). Chrome, Safari, or Edge recommended.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onboarding */}
        <TabsContent value="onboarding">
          {activeRole === 'sales-agent' && <SalesAgentOnboarding />}
          {activeRole === 'client-admin' && <ClientAdminOnboarding />}
          {activeRole === 'dev-admin' && <DevAdminOnboarding />}
        </TabsContent>



        {/* Tips & Tricks */}
        <TabsContent value="tips">
          <Card>
            <CardHeader>
              <CardTitle>Tips & Tricks for {roles[activeRole].name}</CardTitle>
              <CardDescription>
                Pro tips to maximize your productivity with JACC
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeRole === 'sales-agent' && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">Rate Calculator Pro Tips</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Use voice input for faster data entry during calls</li>
                      <li>• Save common business profiles for quick calculations</li>
                      <li>• Generate proposals directly from rate comparisons</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Chat Assistant Tips</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Ask specific questions about rates, equipment, or compliance</li>
                      <li>• Use voice commands for hands-free operation</li>
                      <li>• Reference documents by name for instant information</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeRole === 'client-admin' && (
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">Team Management</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Monitor agent activity through the dashboard</li>
                      <li>• Set up automated training reminders</li>
                      <li>• Customize system prompts for your business needs</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeRole === 'dev-admin' && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2">System Optimization</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Monitor API usage and performance metrics</li>
                      <li>• Regular backup of Q&A knowledge base</li>
                      <li>• Test new features in development mode first</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sales Agent Onboarding Component
function SalesAgentOnboarding() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            Sales Agent Onboarding
          </CardTitle>
          <CardDescription>
            Complete these steps to get started with Tracer as a sales agent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">1</span>
              </div>
              <div>
                <h3 className="font-semibold">Account Access</h3>
                <p className="text-muted-foreground text-sm">Log in with your Tracer Co Card credentials. Contact your administrator if you need access.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">2</span>
              </div>
              <div>
                <h3 className="font-semibold">Learn JACC's Search Capabilities</h3>
                <p className="text-muted-foreground text-sm">JACC searches in this order: FAQ Knowledge Base → Document Center → Web Search</p>
                <div className="mt-3 space-y-2">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Step-by-Step: How to Ask JACC Questions</h4>
                    <ol className="text-xs space-y-1 text-muted-foreground">
                      <li>1. Type your question in the chat box (e.g., "What are Clover's processing rates?")</li>
                      <li>2. JACC first searches the FAQ Knowledge Base for instant answers</li>
                      <li>3. If not found, JACC searches your Document Center (contracts, rate sheets, guides)</li>
                      <li>4. If still not found, JACC searches the web and adds "Nothing found in JACC Memory"</li>
                      <li>5. All answers show sources so you know where information came from</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">3</span>
              </div>
              <div>
                <h3 className="font-semibold">Master AI Prompts for Better Responses</h3>
                <p className="text-muted-foreground text-sm">Learn basic prompting techniques to get better results from JACC.</p>
                <div className="mt-3 space-y-2">
                  <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Coming Soon - Learn Basic Prompting</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Watch this video to learn how to write better prompts for AI assistants:
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => window.open('https://youtu.be/HqY4bd0wlXw?si=c431nFAmSFA3PDX8', '_blank')}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Watch: Basic AI Prompting Guide
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">4</span>
              </div>
              <div>
                <h3 className="font-semibold">Access Your Document Center</h3>
                <p className="text-muted-foreground text-sm">Find processor contracts, rate sheets, and training materials instantly.</p>
                <div className="mt-3 space-y-2">
                  <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Step-by-Step: Using Document Center</h4>
                    <ol className="text-xs space-y-1 text-muted-foreground">
                      <li>1. Click "Document Center" in the sidebar or bottom navigation</li>
                      <li>2. Browse by folders: Admin (40), Clearent (18), MiCamp (13), etc.</li>
                      <li>3. Use the search bar to find specific documents quickly</li>
                      <li>4. Click any document to view or download it</li>
                      <li>5. Documents are organized by processor and content type</li>
                      <li>6. Ask JACC about any document: "What does the Clover contract say about rates?"</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">5</span>
              </div>
              <div>
                <h3 className="font-semibold">Practice with Real Sales Scenarios</h3>
                <p className="text-muted-foreground text-sm">Test JACC with actual prospect questions to build confidence.</p>
                <div className="mt-3 space-y-2">
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Example Questions to Try:</h4>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• "What are the best POS systems for restaurants?"</li>
                      <li>• "Compare Clover vs Square processing rates"</li>
                      <li>• "What compliance requirements do I need to mention?"</li>
                      <li>• "How do I handle rate objections from merchants?"</li>
                      <li>• "What's included in the Shift4 equipment package?"</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">6</span>
              </div>
              <div>
                <h3 className="font-semibold">Access Marketing & Sales Helpers</h3>
                <p className="text-muted-foreground text-sm">Get expert-level marketing strategies and sales techniques from JACC.</p>
                <div className="mt-3 space-y-2">
                  <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Ask JACC for Marketing Help:</h4>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• "Help me create a marketing strategy for restaurants"</li>
                      <li>• "Write a cold outbound email for retail merchants"</li>
                      <li>• "Create a flyer idea for POS system benefits"</li>
                      <li>• "Help me handle pricing objections professionally"</li>
                      <li>• "What's the best way to approach new prospects?"</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start Checklist</CardTitle>
          <CardDescription>Essential tasks for your first day with JACC</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Log in successfully and access main dashboard</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Test voice features and microphone permissions</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Run one practice rate calculation</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Ask the AI assistant a merchant services question</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Generate one sample proposal</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Client Admin Onboarding Component
function ClientAdminOnboarding() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Client Admin Onboarding
        </CardTitle>
        <CardDescription>
          Complete setup and management guide for client administrators
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">1</span>
            </div>
            <div>
              <h3 className="font-semibold">Access Admin Control Center</h3>
              <p className="text-muted-foreground text-sm">Navigate to Settings → Admin Control Center for full management capabilities.</p>
              <div className="mt-3 space-y-2">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Admin Dashboard Overview:</h4>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Q&A Knowledge Base - Manage FAQ entries and responses</li>
                    <li>• Document Center - Upload, organize, and manage documents</li>
                    <li>• Chat Review & Training - Monitor conversations and train AI</li>
                    <li>• Settings - Configure AI behavior, user management, and system performance</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">2</span>
            </div>
            <div>
              <h3 className="font-semibold">Set Up Document Management</h3>
              <p className="text-muted-foreground text-sm">Organize and upload documents for your sales team to access through JACC.</p>
              <div className="mt-3 space-y-2">
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Document Setup Process:</h4>
                  <ol className="text-xs space-y-1 text-muted-foreground">
                    <li>1. Create folders by processor (Clover, Square, Shift4, etc.)</li>
                    <li>2. Upload rate sheets, contracts, and training materials</li>
                    <li>3. Set permissions (admin-only or all-users access)</li>
                    <li>4. Use website URL scraper for external documentation</li>
                    <li>5. Test document search functionality with sample queries</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">3</span>
            </div>
            <div>
              <h3 className="font-semibold">Configure User Management</h3>
              <p className="text-muted-foreground text-sm">Set up user roles, permissions, and notification preferences.</p>
              <div className="mt-3 space-y-2">
                <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">User Management Tasks:</h4>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Configure default user roles (sales-agent, client-admin)</li>
                    <li>• Set session timeout preferences</li>
                    <li>• Enable/disable MFA requirements</li>
                    <li>• Configure email notification settings</li>
                    <li>• Monitor active user sessions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">4</span>
            </div>
            <div>
              <h3 className="font-semibold">Monitor AI Performance</h3>
              <p className="text-muted-foreground text-sm">Use Chat Review Center to track AI responses and make corrections.</p>
              <div className="mt-3 space-y-2">
                <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">AI Monitoring Workflow:</h4>
                  <ol className="text-xs space-y-1 text-muted-foreground">
                    <li>1. Review recent chat conversations for accuracy</li>
                    <li>2. Test AI responses with sample queries</li>
                    <li>3. Submit corrections when responses need improvement</li>
                    <li>4. Monitor training analytics for response quality trends</li>
                    <li>5. Update FAQ entries based on common questions</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Admin Quick Start Checklist</CardTitle>
        <CardDescription>Essential setup tasks for new client administrators</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span>Access admin control center successfully</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span>Upload initial document set (rate sheets, contracts)</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span>Create FAQ entries for common questions</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span>Test AI responses and submit first correction</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span>Configure user notification preferences</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
  );
}

// Dev Admin Onboarding Component
function DevAdminOnboarding() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            System Admin Onboarding
          </CardTitle>
          <CardDescription>
            Complete technical setup and system management guide for development administrators
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">1</span>
              </div>
              <div>
                <h3 className="font-semibold">System Access & Configuration</h3>
                <p className="text-muted-foreground text-sm">Set up full system access and configure core system settings.</p>
                <div className="mt-3 space-y-2">
                  <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">System Setup Tasks:</h4>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Configure database connections and schema</li>
                      <li>• Set up AI service integrations (Claude, OpenAI, Pinecone)</li>
                      <li>• Configure authentication and session management</li>
                      <li>• Test all API endpoints and service connections</li>
                      <li>• Monitor system performance and memory usage</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">2</span>
              </div>
              <div>
                <h3 className="font-semibold">AI System Management</h3>
                <p className="text-muted-foreground text-sm">Configure AI behavior, prompts, and response quality settings.</p>
                <div className="mt-3 space-y-2">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">AI Configuration Areas:</h4>
                    <ol className="text-xs space-y-1 text-muted-foreground">
                      <li>1. System prompts for document search and response formatting</li>
                      <li>2. AI personality and behavior settings</li>
                      <li>3. Custom prompt templates for specific use cases</li>
                      <li>4. User-specific prompt overrides and customizations</li>
                      <li>5. Response quality monitoring and training corrections</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">3</span>
              </div>
              <div>
                <h3 className="font-semibold">Performance Monitoring</h3>
                <p className="text-muted-foreground text-sm">Set up comprehensive system monitoring and performance optimization.</p>
                <div className="mt-3 space-y-2">
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Monitoring Setup:</h4>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Database response time monitoring</li>
                      <li>• AI service status and response quality tracking</li>
                      <li>• Memory usage and garbage collection optimization</li>
                      <li>• User session management and timeout configuration</li>
                      <li>• Real-time system health dashboards</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">4</span>
              </div>
              <div>
                <h3 className="font-semibold">Security & Compliance</h3>
                <p className="text-muted-foreground text-sm">Implement security measures and maintain compliance standards.</p>
                <div className="mt-3 space-y-2">
                  <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Security Checklist:</h4>
                    <ol className="text-xs space-y-1 text-muted-foreground">
                      <li>1. Configure MFA requirements and user authentication</li>
                      <li>2. Set up role-based access control (RBAC)</li>
                      <li>3. Monitor and audit user activity logs</li>
                      <li>4. Implement data backup and recovery procedures</li>
                      <li>5. Regular security updates and vulnerability assessments</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Admin Quick Start Checklist</CardTitle>
          <CardDescription>Critical setup tasks for system administrators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <span>Verify all database connections and API integrations</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <span>Configure AI system prompts and behavior settings</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <span>Set up performance monitoring dashboards</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <span>Implement security measures and user access controls</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <span>Test system backup and recovery procedures</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Feature Components (simplified for brevity)
