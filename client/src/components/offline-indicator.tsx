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

      {/* Offline Mode Alert - Compact */}
      {showOfflineMessage && (
        <div className="fixed bottom-36 right-4 z-50 w-72">
          <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 shadow-lg">
            <CloudOff className="h-4 w-4" />
            <AlertDescription>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Offline mode - messages will sync when reconnected
              </p>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Data Sync Indicator - Compact */}
      {pendingSync && (
        <div className="fixed bottom-36 right-4 z-50 w-72">
          <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 shadow-lg">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Syncing data...
                </p>
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-green-600 border-t-transparent"></div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
}