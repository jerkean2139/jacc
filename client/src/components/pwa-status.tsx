import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Download, RefreshCw } from 'lucide-react';

export default function PWAStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installAvailable, setInstallAvailable] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleOnlineStatus = (event: any) => {
      setIsOnline(event.detail.online);
    };

    const handleInstallAvailable = () => {
      setInstallAvailable(true);
      setShowInstallPrompt(true);
    };

    const handleAppUpdate = () => {
      setUpdateAvailable(true);
    };

    const handleDataSynced = () => {
      // Show brief sync notification
      console.log('Data synced successfully');
    };

    // Set up event listeners
    window.addEventListener('pwa-online-status', handleOnlineStatus);
    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-app-update', handleAppUpdate);
    window.addEventListener('pwa-data-synced', handleDataSynced);

    // Check initial install availability
    if ((window as any).deferredPrompt) {
      setInstallAvailable(true);
      setShowInstallPrompt(true);
    }

    return () => {
      window.removeEventListener('pwa-online-status', handleOnlineStatus);
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-app-update', handleAppUpdate);
      window.removeEventListener('pwa-data-synced', handleDataSynced);
    };
  }, []);

  const handleInstallApp = async () => {
    const deferredPrompt = (window as any).deferredPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('PWA install prompt outcome:', outcome);
      (window as any).deferredPrompt = null;
      setInstallAvailable(false);
      setShowInstallPrompt(false);
    }
  };

  const handleAppUpdate = () => {
    window.location.reload();
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 hidden md:block">

      {/* Install App Prompt */}
      {installAvailable && showInstallPrompt && (
        <Alert className="w-80 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <Download className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">Install JACC app for offline access</span>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowInstallPrompt(false)}
              >
                Later
              </Button>
              <Button 
                size="sm"
                onClick={handleInstallApp}
              >
                Install
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* App Update Available */}
      {updateAvailable && (
        <Alert className="w-80 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <RefreshCw className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">New version available</span>
            <Button 
              size="sm"
              onClick={handleAppUpdate}
            >
              Update
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Offline Mode Notice */}
      {!isOnline && (
        <Alert className="w-80 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            <div className="text-sm">
              <p className="font-medium">You're offline</p>
              <p className="text-xs text-muted-foreground mt-1">
                You can still use JACC! Your data will sync when you're back online.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}