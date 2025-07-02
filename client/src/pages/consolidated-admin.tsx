import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { 
  Settings, Database, MessageSquare, FileText, Users, Activity,
  BarChart3, Search, Plus, Edit, Trash2, Eye, Download, Move
} from 'lucide-react';

// Import working components
import FAQManager from './faq-manager';
import MyDocumentsPage from './my-documents-page';

// Quick stats component for dashboard overview
function QuickStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">FAQ Entries</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">51</div>
          <p className="text-xs text-muted-foreground">+1 from last session</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Documents</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">143</div>
          <p className="text-xs text-muted-foreground">Across 30 folders</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">10</div>
          <p className="text-xs text-muted-foreground">Sales agents</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Status</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <Badge variant="default" className="bg-green-500">Online</Badge>
          </div>
          <p className="text-xs text-muted-foreground">All systems operational</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Navigation shortcuts component
function QuickActions() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            FAQ Management
          </CardTitle>
          <CardDescription>
            Create, edit, and organize knowledge base entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Manage 51 FAQ entries with search and URL scraping
          </p>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Center
          </CardTitle>
          <CardDescription>
            Upload and organize merchant services documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            143 documents organized in 30 folders with full CRUD
          </p>
        </CardContent>
      </Card>
      
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer border-blue-200 bg-blue-50"
        onClick={() => window.location.href = '/drag-drop-docs'}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Move className="h-5 w-5 text-blue-600" />
            Drag & Drop
            <Badge variant="default" className="ml-auto text-xs">New</Badge>
          </CardTitle>
          <CardDescription>
            Organize documents with drag-and-drop interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Visual document organization with real-time feedback
          </p>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat Reviews
          </CardTitle>
          <CardDescription>
            Review and train AI conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            105 conversations ready for review and training
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConsolidatedAdmin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">Administrator access required</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Control Center</h1>
          <p className="text-muted-foreground">
            Manage JACC system components and configuration
          </p>
        </div>
        <Badge variant="outline">
          {user.username} - Administrator
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Q&A Knowledge
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <QuickStats />
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <QuickActions />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system changes and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">FAQ entry created</p>
                    <p className="text-xs text-muted-foreground">Welcome to TEST 1 - Just now</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">System initialization complete</p>
                    <p className="text-xs text-muted-foreground">All services operational - 15 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Document integration updated</p>
                    <p className="text-xs text-muted-foreground">143 documents across 30 folders - 1 hour ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle>FAQ Knowledge Base Management</CardTitle>
              <CardDescription>
                Manage frequently asked questions and knowledge base entries
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <FAQManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Personal Document Management</CardTitle>
              <CardDescription>
                Organize and manage your personal documents and folders
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <MyDocumentsPage />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure system parameters and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-3">AI Configuration</h4>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Primary AI Model</p>
                        <p className="text-xs text-muted-foreground">Claude 4.0 Sonnet</p>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Search Database</p>
                        <p className="text-xs text-muted-foreground">Pinecone Vector DB</p>
                      </div>
                      <Badge variant="default">Connected</Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold mb-3">Database Status</h4>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">PostgreSQL Database</p>
                        <p className="text-xs text-muted-foreground">Neon Cloud</p>
                      </div>
                      <Badge variant="default">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Session Store</p>
                        <p className="text-xs text-muted-foreground">Database-backed</p>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Quick Actions</h4>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm">
                      <Search className="h-4 w-4 mr-2" />
                      Test Search
                    </Button>
                    <Button variant="outline" size="sm">
                      <Database className="h-4 w-4 mr-2" />
                      Check DB
                    </Button>
                    <Button variant="outline" size="sm">
                      <Activity className="h-4 w-4 mr-2" />
                      System Health
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}