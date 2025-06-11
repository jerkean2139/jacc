import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  announcements: string[];
  announceToScreenReader: (message: string) => void;
  isHighContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [reducedMotion, setReducedMotion] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    const savedContrast = localStorage.getItem('accessibility-high-contrast');
    const savedFontSize = localStorage.getItem('accessibility-font-size');
    const savedMotion = localStorage.getItem('accessibility-reduced-motion');

    if (savedContrast) setIsHighContrast(JSON.parse(savedContrast));
    if (savedFontSize) setFontSize(savedFontSize as 'small' | 'medium' | 'large');
    if (savedMotion) setReducedMotion(JSON.parse(savedMotion));

    // Detect system preference for reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches && !savedMotion) {
      setReducedMotion(true);
    }
  }, []);

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast mode
    if (isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Font size adjustments
    root.setAttribute('data-font-size', fontSize);

    // Reduced motion
    if (reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Save preferences
    localStorage.setItem('accessibility-high-contrast', JSON.stringify(isHighContrast));
    localStorage.setItem('accessibility-font-size', fontSize);
    localStorage.setItem('accessibility-reduced-motion', JSON.stringify(reducedMotion));
  }, [isHighContrast, fontSize, reducedMotion]);

  const announceToScreenReader = (message: string) => {
    setAnnouncements(prev => [...prev, message]);
    // Remove announcement after a short delay
    setTimeout(() => {
      setAnnouncements(prev => prev.slice(1));
    }, 1000);
  };

  const setHighContrast = (enabled: boolean) => {
    setIsHighContrast(enabled);
    announceToScreenReader(enabled ? 'High contrast mode enabled' : 'High contrast mode disabled');
  };

  const setFontSizeWithAnnouncement = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
    announceToScreenReader(`Font size changed to ${size}`);
  };

  const setReducedMotionWithAnnouncement = (enabled: boolean) => {
    setReducedMotion(enabled);
    announceToScreenReader(enabled ? 'Reduced motion enabled' : 'Reduced motion disabled');
  };

  return (
    <AccessibilityContext.Provider value={{
      announcements,
      announceToScreenReader,
      isHighContrast,
      setHighContrast,
      fontSize,
      setFontSize: setFontSizeWithAnnouncement,
      reducedMotion,
      setReducedMotion: setReducedMotionWithAnnouncement
    }}>
      {children}
      {/* Screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcements.map((announcement, index) => (
          <div key={index}>{announcement}</div>
        ))}
      </div>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}