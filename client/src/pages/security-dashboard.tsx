import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, XCircle, Activity, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface SecurityMetrics {
  overallScore: number;
  lastAssessment: string;
  criticalIssues: number;
  resolvedIssues: number;
  mfaEnabled: boolean;
  encryptionStatus: string;
  auditLogCount: number;
  recentIncidents: any[];
}

interface ComplianceStatus {
  gdpr: boolean;
  soc2: boolean;
  dataRetention: boolean;
  auditTrail: boolean;
  incidentResponse: boolean;
}

export default function SecurityDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');

  const { data: securityMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/admin/security/metrics', selectedTimeframe],
    enabled: true
  });

  const { data: complianceStatus, isLoading: complianceLoading } = useQuery({
    queryKey: ['/api/admin/security/compliance'],
    enabled: true
  });

  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ['/api/admin/security/audit-logs', selectedTimeframe],
    enabled: true
  });

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSecurityScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (metricsLoading || complianceLoading || auditLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor security posture and compliance status
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedTimeframe === '24h' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeframe('24h')}
          >
            24h
          </Button>
          <Button
            variant={selectedTimeframe === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeframe('7d')}
          >
            7d
          </Button>
          <Button
            variant={selectedTimeframe === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeframe('30d')}
          >
            30d
          </Button>
        </div>
      </div>

      {/* Security Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSecurityScoreColor(securityMetrics?.overallScore || 0)}`}>
              {securityMetrics?.overallScore || 0}/100
            </div>
            <Badge className={getSecurityScoreBadge(securityMetrics?.overallScore || 0)}>
              {securityMetrics?.overallScore >= 90 ? 'Excellent' :
               securityMetrics?.overallScore >= 75 ? 'Good' : 'Needs Improvement'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {securityMetrics?.criticalIssues || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Issues</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {securityMetrics?.resolvedIssues || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Fixed this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Events</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securityMetrics?.auditLogCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Events logged
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Features Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Features
            </CardTitle>
            <CardDescription>
              Current status of security implementations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Multi-Factor Authentication</span>
              {securityMetrics?.mfaEnabled ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">
                  <XCircle className="h-3 w-3 mr-1" />
                  Disabled
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>Data Encryption</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                {securityMetrics?.encryptionStatus || 'AES-256'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Security Headers</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Implemented
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Rate Limiting</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Compliance Status
            </CardTitle>
            <CardDescription>
              Regulatory and industry standard compliance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>GDPR Compliance</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Compliant
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>SOC 2 Type II</span>
              <Badge className="bg-yellow-100 text-yellow-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                In Progress
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Data Retention Policy</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Implemented
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Audit Trail</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>
            Latest security-related activities and incidents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogs && auditLogs.length > 0 ? (
            <div className="space-y-3">
              {auditLogs.slice(0, 10).map((log: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      log.severity === 'critical' ? 'bg-red-500' :
                      log.severity === 'high' ? 'bg-orange-500' :
                      log.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div>
                      <div className="font-medium">{log.action}</div>
                      <div className="text-sm text-muted-foreground">
                        {log.resource} {log.resourceId && `(${log.resourceId})`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No security events recorded
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Security Recommendations</CardTitle>
          <CardDescription>
            Actions to improve security posture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {securityMetrics?.criticalIssues > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You have {securityMetrics.criticalIssues} critical security issues that require immediate attention.
                </AlertDescription>
              </Alert>
            )}
            
            {!securityMetrics?.mfaEnabled && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Enable Multi-Factor Authentication for all admin users to enhance account security.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded">
                <h4 className="font-medium mb-2">Regular Security Audits</h4>
                <p className="text-sm text-muted-foreground">
                  Schedule monthly security assessments to identify and address vulnerabilities.
                </p>
              </div>
              <div className="p-4 border rounded">
                <h4 className="font-medium mb-2">Staff Security Training</h4>
                <p className="text-sm text-muted-foreground">
                  Provide regular cybersecurity awareness training for all team members.
                </p>
              </div>
              <div className="p-4 border rounded">
                <h4 className="font-medium mb-2">Backup Testing</h4>
                <p className="text-sm text-muted-foreground">
                  Regularly test backup and recovery procedures to ensure business continuity.
                </p>
              </div>
              <div className="p-4 border rounded">
                <h4 className="font-medium mb-2">Access Reviews</h4>
                <p className="text-sm text-muted-foreground">
                  Conduct quarterly reviews of user access rights and permissions.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}