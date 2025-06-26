// Production deployment utilities to clean up console warnings

export function suppressDevelopmentWarnings() {
  if (import.meta.env.PROD) {
    // Suppress React DevTools warning in production
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      const message = args.join(' ');
      if (message.includes('React DevTools') || 
          message.includes('beforeinstallprompt') ||
          message.includes('popup flags')) {
        return; // Suppress these warnings in production
      }
      originalConsoleWarn.apply(console, args);
    };

    // Suppress React DevTools info messages
    const originalConsoleInfo = console.info;
    console.info = (...args) => {
      const message = args.join(' ');
      if (message.includes('React DevTools')) {
        return; // Suppress React DevTools info in production
      }
      originalConsoleInfo.apply(console, args);
    };
  }
}

export function handlePWAInstallPrompt() {
  // Properly handle PWA install prompt to prevent console errors
  let deferredPrompt: any = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
  });

  return {
    canInstall: () => !!deferredPrompt,
    showInstallPrompt: async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        return outcome;
      }
      return null;
    }
  };
}