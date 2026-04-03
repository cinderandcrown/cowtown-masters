import React, { useState, useEffect } from 'react';
import { Smartphone, X, Share } from 'lucide-react';

export default function AddToHomeScreen() {
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(!!standalone);
    const wasDismissed = localStorage.getItem('cowtown_aths_dismissed');
    if (wasDismissed) setDismissed(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('cowtown_aths_dismissed', 'true');
  };

  if (isStandalone || dismissed) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  if (!isIOS && !isAndroid) return null;

  return (
    <div className="mx-3 mt-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-3.5 border border-accent/20 relative animate-fade-in-up">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-muted rounded-full transition z-10"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/15">
          <Smartphone className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 pr-4">
          <h4 className="text-sm font-bold text-foreground">Add to Home Screen</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
            {isIOS
              ? <>Tap <strong className="text-primary">Share</strong> then <strong className="text-primary">Add to Home Screen</strong></>
              : <>Tap <strong className="text-primary">Menu (\u22EE)</strong> then <strong className="text-primary">Add to Home Screen</strong></>
            }
          </p>
        </div>
      </div>
    </div>
  );
}
