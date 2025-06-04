import { Switch, Route } from "wouter";
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
import ISOAmpCalculator from "@/pages/iso-amp-calculator";
import PromptCustomization from "@/pages/prompt-customization";
import UserGuide from "@/pages/user-guide";
import DocumentsPage from "@/pages/documents-page";
import DocumentViewer from "@/pages/document-viewer";
import MerchantInsights from "@/pages/merchant-insights";
import GamificationPage from "@/pages/gamification-page";

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
          <Route path="/calculator" component={ISOAmpCalculator} />
          <Route path="/iso-amp-calculator" component={ISOAmpCalculator} />
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
          <Route path="/admin" component={AdminPanel} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/settings" component={AdminSettings} />
          <Route path="/admin/training" component={AdminTraining} />
          <Route path="/admin/ai-config" component={AIConfigurationPage} />
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
