import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import DragDropDocuments from '@/components/drag-drop-documents';
import { 
  ArrowLeft, 
  FolderOpen, 
  FileText, 
  Move, 
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Link } from 'wouter';

// Demo/Tutorial component
function DragDropTutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    {
      title: "Welcome to Drag & Drop Organization",
      description: "Organize your documents by dragging them between folders with visual feedback.",
      icon: <FolderOpen className="h-8 w-8 text-blue-500" />,
      content: "This new feature allows you to intuitively organize documents by simply dragging them from one location to another."
    },
    {
      title: "Dragging Documents",
      description: "Click and drag any document to move it to a different folder.",
      icon: <Move className="h-8 w-8 text-green-500" />,
      content: "Documents will show visual feedback when being dragged, including rotation and shadow effects."
    },
    {
      title: "Visual Feedback",
      description: "See real-time feedback as you drag items around the interface.",
      icon: <CheckCircle2 className="h-8 w-8 text-purple-500" />,
      content: "Folders will highlight when you hover over them with a document, showing drop zones and feedback."
    }
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Quick Tutorial
        </CardTitle>
        <CardDescription>
          Learn how to use the new drag-and-drop document organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {steps[currentStep].icon}
            <div>
              <h3 className="font-medium">{steps[currentStep].title}</h3>
              <p className="text-sm text-gray-600">{steps[currentStep].description}</p>
            </div>
          </div>
          <Badge variant="outline">
            {currentStep + 1} of {steps.length}
          </Badge>
        </div>
        
        <p className="text-sm text-gray-700 mb-4">
          {steps[currentStep].content}
        </p>
        
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          <Button 
            onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
            disabled={currentStep === steps.length - 1}
          >
            {currentStep === steps.length - 1 ? 'Done' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Feature highlights component
function FeatureHighlights() {
  const features = [
    {
      icon: <Move className="h-5 w-5 text-blue-500" />,
      title: "Intuitive Dragging",
      description: "Simply click and drag documents to move them between folders"
    },
    {
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      title: "Visual Feedback",
      description: "Real-time visual cues show drop zones and movement status"
    },
    {
      icon: <FolderOpen className="h-5 w-5 text-purple-500" />,
      title: "Smart Organization",
      description: "Automatically updates folder counts and document assignments"
    },
    {
      icon: <AlertCircle className="h-5 w-5 text-orange-500" />,
      title: "Error Prevention",
      description: "Built-in validation prevents invalid moves and data loss"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {features.map((feature, index) => (
        <Card key={index} className="text-center">
          <CardContent className="pt-6">
            <div className="flex justify-center mb-3">
              {feature.icon}
            </div>
            <h3 className="font-medium mb-2">{feature.title}</h3>
            <p className="text-sm text-gray-600">{feature.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function DragDropDocsPage() {
  const { user } = useAuth();
  const [showTutorial, setShowTutorial] = useState(true);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-2">Authentication Required</h2>
              <p className="text-gray-600">Please log in to access document organization</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/consolidated-admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Drag & Drop Document Organization</h1>
            <p className="text-gray-600">
              Organize your documents with intuitive drag-and-drop functionality
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="default">
            New Feature
          </Badge>
          <Badge variant="outline">
            {user.username}
          </Badge>
        </div>
      </div>

      {/* Tutorial Section */}
      {showTutorial && (
        <div className="relative">
          <DragDropTutorial />
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => setShowTutorial(false)}
          >
            ×
          </Button>
        </div>
      )}

      {/* Feature Highlights */}
      <FeatureHighlights />

      {/* Main Content Tabs */}
      <Tabs defaultValue="organize" className="space-y-6">
        <TabsList>
          <TabsTrigger value="organize" className="flex items-center gap-2">
            <Move className="h-4 w-4" />
            Organize Documents
          </TabsTrigger>
          <TabsTrigger value="help" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Help & Tips
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organize">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Organization Interface
              </CardTitle>
              <CardDescription>
                Drag documents between folders to organize your files. 
                Changes are saved automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DragDropDocuments />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="help">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>How to Use</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">1. Select a Document</h4>
                  <p className="text-sm text-gray-600">
                    Click and hold on any document card to start dragging
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">2. Drag to Target</h4>
                  <p className="text-sm text-gray-600">
                    Drag the document over a folder or the unassigned area
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">3. Drop to Move</h4>
                  <p className="text-sm text-gray-600">
                    Release the mouse to move the document to the new location
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Visual Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Document Dragging</h4>
                  <p className="text-sm text-gray-600">
                    Documents rotate and show shadow effects when being dragged
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Folder Highlighting</h4>
                  <p className="text-sm text-gray-600">
                    Folders highlight blue when you hover over them with a document
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Success Notifications</h4>
                  <p className="text-sm text-gray-600">
                    Green checkmark appears when documents are moved successfully
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Pro Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Expand folders first to see their contents before dropping documents</li>
              <li>• Use the "Expand All" button to quickly open all folders</li>
              <li>• Documents in the unassigned area can be moved to any folder</li>
              <li>• All changes are saved automatically - no need to click save</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}