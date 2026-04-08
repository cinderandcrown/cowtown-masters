import React, { useState, useEffect } from 'react';
import { Smartphone, X } from 'lucide-react';

export default function AddToHomeScreen() {
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running as PWA / home screen app
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(!!standalone);

    // Check if user dismissed before
    const wasDismissed = localStorage.getItem('cowtown_aths_dismissed');
    if (wasDismissed) setDismissed(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('cowtown_aths_dismissed', 'true');
  };

  // Don't show if already installed or dismissed
  if (isStandalone || dismissed) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  // Only show on mobile
  if (!isIOS && !isAndroid) return null;

  return (
    <div className="mx-3 mt-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl px-4 py-3 border border-border animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground">Add to Home Screen</p>
          <p className="text-[10px] text-muted-foreground">
            {isIOS ? 'Tap Share → Add to Home Screen' : 'Tap ⋮ → Add to Home Screen'}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-muted rounded-full transition flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}