import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { GamificationProvider } from "@/hooks/useGamification";
import PWAStatus from "@/components/pwa-status";
import OfflineIndicator from "@/components/offline-indicator";
import ContextualHelp from "@/components/contextual-help";
import InteractiveTutorial from "@/components/interactive-tutorial";
import PWAInstallPrompt from "@/components/pwa-install-prompt";
import BottomNav from "@/components/bottom-nav";

import Landing from "@/pages/landing";
import HomeStable from "@/pages/home-stable";
import NotFound from "@/pages/not-found";
import AdminSettings from "@/pages/admin-settings";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminPanel from "@/pages/admin-panel";
import ISOAmpCalculator from "@/pages/iso-amp-calculator";
import PromptCustomization from "@/pages/prompt-customization";
import UserGuide from "@/pages/user-guide";
import DocumentsPage from "@/pages/documents-page";
import DocumentViewer from "@/pages/document-viewer";
import MerchantInsights from "@/pages/merchant-insights";

function Router() {
  // Temporarily bypass auth for testing - you can access the main app now
  const showMainApp = true;

  return (
    <Switch>
      {!showMainApp ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={HomeStable} />
          <Route path="/chat/:chatId" component={HomeStable} />
          <Route path="/calculator" component={ISOAmpCalculator} />
          <Route path="/iso-amp-calculator" component={ISOAmpCalculator} />
          <Route path="/guide" component={UserGuide} />
          <Route path="/documents" component={DocumentsPage} />
          <Route path="/documents/:documentId" component={DocumentViewer} />
          <Route path="/prompts" component={PromptCustomization} />
          <Route path="/merchant-insights" component={MerchantInsights} />
          <Route path="/admin" component={AdminPanel} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/settings" component={AdminSettings} />
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
      <Toaster />
      <PWAStatus />
      <OfflineIndicator />
      <div className="hidden md:block">
        <ContextualHelp />
      </div>
      <InteractiveTutorial />
      <PWAInstallPrompt />
      <Router />
      <BottomNav />
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
