import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import PWAStatus from "@/components/pwa-status";
import OfflineIndicator from "@/components/offline-indicator";
import ContextualHelp from "@/components/contextual-help";
import InteractiveTutorial from "@/components/interactive-tutorial";
import PWAInstallPrompt from "@/components/pwa-install-prompt";
import BottomNav from "@/components/bottom-nav";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import AdminSettings from "@/pages/admin-settings";
import AdminDashboard from "@/pages/admin-dashboard";
import ISOAmpCalculator from "@/pages/iso-amp-calculator";
import UserGuide from "@/pages/user-guide";

function Router() {
  // Temporarily bypass auth for testing - you can access the main app now
  const showMainApp = true;

  return (
    <Switch>
      {!showMainApp ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/calculator" component={ISOAmpCalculator} />
          <Route path="/guide" component={UserGuide} />
          <Route path="/admin" component={AdminSettings} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/login" component={Landing} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
