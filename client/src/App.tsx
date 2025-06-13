import { Switch, Route } from "wouter";
import { lazy } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { GamificationProvider } from "@/hooks/useGamification";
import { DragDropProvider } from "@/components/drag-drop-provider";
import PWAStatus from "@/components/pwa-status";
import OfflineIndicator from "@/components/offline-indicator";
import ContextualHelp from "@/components/contextual-help";
import InteractiveTutorial from "@/components/interactive-tutorial";
import OnboardingWalkthrough from "@/components/onboarding-walkthrough";
import PWAInstallPrompt from "@/components/pwa-install-prompt";
import BottomNav from "@/components/bottom-nav";

import Landing from "@/pages/landing";
import LoginPage from "@/pages/login";
import HomeStable from "@/pages/home-stable";
import NotFound from "@/pages/not-found";
import AdminSettings from "@/pages/admin-settings";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminPanel from "@/pages/admin-panel";
import AdminTraining from "@/pages/admin-training";
import AIConfigurationPage from "@/pages/ai-configuration";
import SimpleAdminLogin from "@/pages/simple-admin-login";
import DevAdminPanel from "@/pages/dev-admin-panel";
import ISOAmpCalculator from "@/pages/iso-amp-calculator";
import PricingComparison from "@/pages/pricing-comparison";
import PricingManagement from "@/pages/pricing-management";
import PricingDemo from "@/pages/pricing-demo";
import PromptCustomization from "@/pages/prompt-customization";
import UserGuide from "@/pages/user-guide";
import DocumentsPage from "@/pages/documents-page";
import DocumentViewer from "@/pages/document-viewer";
import MerchantInsights from "@/pages/merchant-insights";
import GamificationPage from "@/pages/gamification-page";
import HelpPage from "@/pages/help";
import VendorIntelligenceDashboard from "@/pages/vendor-intelligence-dashboard";
import ISOHubIntegration from "@/pages/iso-hub-integration";
import ISOHub from "@/pages/iso-hub";
import AdminChatMonitoring from "@/pages/admin-chat-monitoring";
import LearningPathPage from "@/pages/learning-path";
import ChatTesting from "@/pages/chat-testing";
import DemoAdmin from "@/pages/demo-admin";
import UnifiedAdminPanel from "@/pages/unified-admin-panel";
import AdminControlCenter from "@/pages/admin-control-center";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!user ? (
        <>
          <Route path="/demo-admin" component={DemoAdmin} />
          <Route path="/admin-login" component={SimpleAdminLogin} />
          <Route path="/login" component={LoginPage} />
          <Route path="/" component={LoginPage} />
        </>
      ) : (
        <>
          <Route path="/login">
            {() => {
              window.location.href = '/';
              return null;
            }}
          </Route>
          <Route path="/" component={HomeStable} />
          <Route path="/chat/:chatId" component={HomeStable} />
          {/* ISO AMP Calculator routes disabled - coming soon */}
          {/* <Route path="/calculator" component={ISOAmpCalculator} /> */}
          {/* <Route path="/iso-amp-calculator" component={ISOAmpCalculator} /> */}
          <Route path="/pricing-comparison" component={PricingComparison} />

          <Route path="/guide" component={UserGuide} />
          {/* Documents only accessible to admin users */}
          {user?.role === 'admin' && (
            <>
              <Route path="/documents" component={DocumentsPage} />
              <Route path="/documents/:documentId" component={DocumentViewer} />
            </>
          )}
          <Route path="/prompts" component={PromptCustomization} />
          <Route path="/merchant-insights" component={MerchantInsights} />
          <Route path="/leaderboard" component={GamificationPage} />
          <Route path="/help" component={HelpPage} />
          <Route path="/learning" component={LearningPathPage} />
          <Route path="/vendor-intelligence" component={VendorIntelligenceDashboard} />
          <Route path="/competitive-intelligence" component={lazy(() => import("@/pages/competitive-intelligence-dashboard"))} />
          {/* ISO Hub - Hidden from regular users, accessible only to dev admin */}
          {user?.role === 'dev' && (
            <>
              <Route path="/iso-hub-integration" component={ISOHubIntegration} />
              <Route path="/iso-hub" component={ISOHub} />
            </>
          )}
          <Route path="/dev-admin" component={DevAdminPanel} />
          <Route path="/admin" component={AdminControlCenter} />
          <Route path="/admin-panel" component={AdminControlCenter} />
          <Route path="/admin/unified" component={UnifiedAdminPanel} />
          <Route path="/admin-new" component={AdminControlCenter} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/chat-monitoring" component={AdminChatMonitoring} />
          <Route path="/admin/settings" component={AdminSettings} />
          <Route path="/admin/training" component={AdminControlCenter} />
          <Route path="/admin-training" component={AdminControlCenter} />
          <Route path="/admin/ai-config" component={AIConfigurationPage} />
          <Route path="/admin/chat-testing" component={ChatTesting} />
          <Route path="/login" component={Landing} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user } = useAuth();
  
  return (
    <GamificationProvider userId={user?.id}>
      <DragDropProvider>
        <Toaster />
        <PWAStatus />
        <OfflineIndicator />
        <div className="hidden md:block">
          <ContextualHelp />
        </div>
        <InteractiveTutorial />
        <OnboardingWalkthrough />
        <PWAInstallPrompt />
        <Router />
        <BottomNav />
      </DragDropProvider>
    </GamificationProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
