import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, CloudOff, CheckCircle } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [pendingSync, setPendingSync] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
      setPendingSync(true);
      
      // Hide sync indicator after a moment
      setTimeout(() => setPendingSync(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      
      // Auto-hide the offline message after 5 seconds
      setTimeout(() => setShowOfflineMessage(false), 5000);
    };

    const handleDataSynced = () => {
      setPendingSync(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('pwa-data-synced', handleDataSynced);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pwa-data-synced', handleDataSynced);
    };
  }, []);

  return (
    <>
      {/* Connection Status Badge - Hidden on Mobile */}
      <div className="hidden md:block fixed top-4 left-4 z-40">
        <Badge 
          variant={isOnline ? "default" : "destructive"}
          className="flex items-center space-x-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-lg"
        >
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              <span>Offline</span>
            </>
          )}
        </Badge>
      </div>

      {/* Offline Mode Alert */}
      {showOfflineMessage && (
        <div className="fixed top-16 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
          <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 shadow-lg">
            <CloudOff className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  You're now offline
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Don't worry! JACC works offline. Your messages will be saved and synced when you're back online.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Data Sync Indicator */}
      {pendingSync && (
        <div className="fixed top-16 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
          <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 shadow-lg">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Syncing your data...
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your offline messages are being uploaded.
                  </p>
                </div>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
}