import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Key, 
  Users, 
  Database,
  Settings,
  Link as LinkIcon,
  RefreshCw
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ISOHubStatus {
  connected: boolean;
  lastSync: string;
  userCount: number;
  authMethod: string;
  errors: string[];
}

interface IntegrationTest {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
}

export default function ISOHubIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testToken, setTestToken] = useState('');
  const [testCredentials, setTestCredentials] = useState({ email: '', password: '' });

  const { data: integrationStatus, isLoading } = useQuery({
    queryKey: ['/api/iso-hub/status'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: testResults } = useQuery({
    queryKey: ['/api/iso-hub/test-results'],
    refetchInterval: 60000 // Refresh every minute
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await fetch(`/api/auth/iso-hub/verify?token=${encodeURIComponent(token)}`);
      if (!response.ok) {
        throw new Error('Token verification failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection Test Successful",
        description: "ISO Hub integration is working properly"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/iso-hub/test-results'] });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Test Failed",
        description: error.message || "Unable to verify ISO Hub connection",
        variant: "destructive"
      });
    }
  });

  const testLoginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      return apiRequest('/api/auth/iso-hub/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
    },
    onSuccess: () => {
      toast({
        title: "Login Test Successful",
        description: "ISO Hub credentials authentication working"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/iso-hub/test-results'] });
    },
    onError: (error: any) => {
      toast({
        title: "Login Test Failed",
        description: error.message || "Invalid credentials or connection issue",
        variant: "destructive"
      });
    }
  });

  const syncUsersMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/iso-hub/sync-users', { method: 'POST' });
    },
    onSuccess: () => {
      toast({
        title: "User Sync Completed",
        description: "Successfully synchronized users from ISO Hub"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/iso-hub/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "User Sync Failed",
        description: error.message || "Unable to sync users from ISO Hub",
        variant: "destructive"
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <RefreshCw className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ISO Hub Integration</h1>
          <p className="text-muted-foreground">
            Manage and monitor the connection between JACC and ISO Hub systems
          </p>
        </div>
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/iso-hub/status'] })}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Connection Status</p>
                <p className="text-lg font-bold">
                  {integrationStatus?.connected ? (
                    <span className="text-green-600">Connected</span>
                  ) : (
                    <span className="text-red-600">Disconnected</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Synced Users</p>
                <p className="text-lg font-bold">{integrationStatus?.userCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Auth Method</p>
                <p className="text-lg font-bold">{integrationStatus?.authMethod || 'SSO'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Last Sync</p>
                <p className="text-sm">
                  {integrationStatus?.lastSync 
                    ? new Date(integrationStatus.lastSync).toLocaleString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Alerts */}
      {integrationStatus?.errors && integrationStatus.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Integration Issues Detected:</strong>
            <ul className="mt-2 list-disc list-inside">
              {integrationStatus.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Integration Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Available Integration Methods
              </CardTitle>
              <CardDescription>
                Choose how users will access JACC from ISO Hub
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">URL Parameter</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Direct link with authentication token
                  </p>
                  <code className="text-xs bg-gray-100 p-2 rounded block">
                    ?auth_token={'{token}'}
                  </code>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">PostMessage API</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Embedded iframe communication
                  </p>
                  <code className="text-xs bg-gray-100 p-2 rounded block">
                    window.postMessage(...)
                  </code>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Direct SSO</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Server-to-server authentication
                  </p>
                  <code className="text-xs bg-gray-100 p-2 rounded block">
                    POST /api/auth/iso-hub/sso
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Integration Tests</CardTitle>
              <CardDescription>
                Automated tests verify integration functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults?.length > 0 ? (
                <div className="space-y-3">
                  {testResults.map((test: IntegrationTest, index: number) => (
                    <div key={index} className={`p-3 rounded-lg border ${getStatusColor(test.status)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(test.status)}
                          <span className="font-medium">{test.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {new Date(test.timestamp).toLocaleTimeString()}
                        </Badge>
                      </div>
                      <p className="text-sm mt-1">{test.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No test results available. Run tests manually to verify integration.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Token Testing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Token Authentication Test
                </CardTitle>
                <CardDescription>
                  Test authentication with an ISO Hub token
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="testToken">ISO Hub Token</Label>
                  <Input
                    id="testToken"
                    type="password"
                    placeholder="Enter ISO Hub authentication token"
                    value={testToken}
                    onChange={(e) => setTestToken(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => testConnectionMutation.mutate(testToken)}
                  disabled={!testToken.trim() || testConnectionMutation.isPending}
                  className="w-full"
                >
                  {testConnectionMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  Test Token Authentication
                </Button>
              </CardContent>
            </Card>

            {/* Credentials Testing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Credentials Authentication Test
                </CardTitle>
                <CardDescription>
                  Test login with ISO Hub credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="testEmail">Email</Label>
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder="user@example.com"
                    value={testCredentials.email}
                    onChange={(e) => setTestCredentials(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="testPassword">Password</Label>
                  <Input
                    id="testPassword"
                    type="password"
                    placeholder="Enter password"
                    value={testCredentials.password}
                    onChange={(e) => setTestCredentials(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                <Button
                  onClick={() => testLoginMutation.mutate(testCredentials)}
                  disabled={!testCredentials.email || !testCredentials.password || testLoginMutation.isPending}
                  className="w-full"
                >
                  {testLoginMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Users className="h-4 w-4 mr-2" />
                  )}
                  Test Credentials Login
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* User Synchronization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                User Synchronization
              </CardTitle>
              <CardDescription>
                Sync user accounts between ISO Hub and JACC
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Sync All Users</h4>
                  <p className="text-sm text-muted-foreground">
                    Import all user accounts from ISO Hub and update existing ones
                  </p>
                </div>
                <Button
                  onClick={() => syncUsersMutation.mutate()}
                  disabled={syncUsersMutation.isPending}
                  variant="outline"
                >
                  {syncUsersMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4 mr-2" />
                  )}
                  Sync Users
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Integration Configuration
              </CardTitle>
              <CardDescription>
                Configure how ISO Hub integrates with JACC
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Role Mapping</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>ISO Hub Role ID 1</span>
                      <span className="font-medium">JACC Admin</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>ISO Hub Role ID 2</span>
                      <span className="font-medium">JACC Manager</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>ISO Hub Role ID 3</span>
                      <span className="font-medium">JACC Agent</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>Default</span>
                      <span className="font-medium">JACC User</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Security Settings</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>Token Expiration</span>
                      <span className="font-medium">24 hours</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>Encryption</span>
                      <span className="font-medium">AES-256-GCM</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>CORS Policy</span>
                      <span className="font-medium">Restricted</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>Audit Logging</span>
                      <span className="font-medium">Enabled</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Integration Documentation
              </CardTitle>
              <CardDescription>
                Implementation guides and API references
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Frontend Integration</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Add JACC to your ISO Hub frontend
                  </p>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Guide
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">API Reference</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Complete API documentation
                  </p>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Docs
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Security Guidelines</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Best practices for secure integration
                  </p>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Guide
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Troubleshooting</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Common issues and solutions
                  </p>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Guide
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}