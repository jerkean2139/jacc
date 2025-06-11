import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Database, 
  Settings, 
  TestTube,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

export default function DevAdminPanel() {
  const [showHiddenFeatures, setShowHiddenFeatures] = useState(false);

  const hiddenFeatures = [
    {
      name: "ISO Hub Integration",
      path: "/iso-hub-integration",
      description: "Authentication and user sync with ISO Hub platform",
      status: "Complete",
      lastUpdated: "2025-06-11"
    },
    {
      name: "Statement Analysis",
      path: "/iso-hub",
      description: "OCR-powered merchant statement processing",
      status: "Needs Accuracy Fixes",
      lastUpdated: "2025-06-11"
    }
  ];

  const mainFeatures = [
    {
      name: "User Management",
      path: "/admin",
      description: "Standard admin panel for user and system management"
    },
    {
      name: "AI Configuration", 
      path: "/admin/ai-config",
      description: "Configure AI models and processing parameters"
    },
    {
      name: "Training Dashboard",
      path: "/admin/training",
      description: "Manage training materials and user progress"
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Development Admin Panel
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Access development features and hidden functionality
        </p>
      </div>

      {/* Main Admin Features */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Production Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mainFeatures.map((feature) => (
            <Card key={feature.name} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  {feature.name}
                </CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={feature.path}>
                  <Button className="w-full">Access Feature</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator className="my-8" />

      {/* Hidden V2 Features Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Version 2.0 Features (Hidden)</h2>
          <Button
            variant="outline"
            onClick={() => setShowHiddenFeatures(!showHiddenFeatures)}
            className="flex items-center gap-2"
          >
            {showHiddenFeatures ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showHiddenFeatures ? 'Hide' : 'Show'} Hidden Features
          </Button>
        </div>

        {showHiddenFeatures && (
          <>
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                  Development Features Only
                </h3>
              </div>
              <p className="text-amber-700 dark:text-amber-300 text-sm">
                These features are hidden from regular users and are only accessible to development team.
                ISO Hub functionality is complete but needs accuracy improvements before production release.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hiddenFeatures.map((feature) => (
                <Card key={feature.name} className="border-dashed">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {feature.name}
                      <Badge 
                        variant={feature.status === "Complete" ? "default" : "destructive"}
                        className="ml-auto"
                      >
                        {feature.status === "Complete" ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 mr-1" />
                        )}
                        {feature.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-gray-500">
                        Last Updated: {feature.lastUpdated}
                      </div>
                      <Link href={feature.path}>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          disabled={feature.status !== "Complete"}
                        >
                          <TestTube className="w-4 h-4 mr-2" />
                          {feature.status === "Complete" ? "Test Feature" : "Under Development"}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                ISO Hub Implementation Status
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>✅ OCR pipeline operational with GraphicsMagick and Tesseract</li>
                <li>✅ Real merchant data extraction from PDF statements</li>
                <li>✅ Authentication flow with ISO Hub platform</li>
                <li>⚠️ Data accuracy issues need resolution</li>
                <li>⚠️ AI analysis requires improved prompts</li>
                <li>📋 Documented in VERSION_2_FEATURES.md</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}