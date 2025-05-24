import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import PWAStatus from "@/components/pwa-status";
import OfflineIndicator from "@/components/offline-indicator";
import ContextualHelp from "@/components/contextual-help";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import AdminSettings from "@/pages/admin-settings";
import AdminDashboard from "@/pages/admin-dashboard";
import ISOAmpCalculator from "@/pages/iso-amp-calculator";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/calculator" component={ISOAmpCalculator} />
          <Route path="/admin" component={AdminSettings} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
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
        <ContextualHelp />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
