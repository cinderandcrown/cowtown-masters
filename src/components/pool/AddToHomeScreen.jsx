import React, { useState, useEffect } from 'react';
import { Smartphone, X, Download } from 'lucide-react';

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
    <div className="mx-3 mt-3 bg-gradient-to-r from-primary to-secondary rounded-xl p-4 border border-accent/30 relative overflow-hidden animate-fade-in-up">
      <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-30" />
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded-full transition z-10"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4 text-primary-foreground/60" />
      </button>
      <div className="relative flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0 border border-accent/30">
          <Smartphone className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Stay in the Action! 📱
          </h4>
          <p className="text-xs text-primary-foreground/70 mt-1 leading-relaxed">
            Add Cowtown Masters to your home screen for instant access to live scores and alerts during the tournament.
          </p>
          <div className="mt-2.5 bg-black/20 rounded-lg p-2.5 border border-white/10">
            {isIOS ? (
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-accent flex-shrink-0" />
                <p className="text-[11px] text-primary-foreground/80">
                  Tap <span className="font-bold text-accent">Share</span> →{' '}
                  <span className="font-bold text-accent">Add to Home Screen</span>
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-accent flex-shrink-0" />
                <p className="text-[11px] text-primary-foreground/80">
                  Tap <span className="font-bold text-accent">⋮ Menu</span> →{' '}
                  <span className="font-bold text-accent">Add to Home Screen</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}