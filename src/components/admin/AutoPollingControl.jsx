import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Timer, Play, Square, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const AUTOMATION_ID = '69bd9ffeeb89f2505ecfb15d'; // "Auto-fetch Masters Scores" automation

export default function AutoPollingControl() {
  const [loading, setLoading] = useState(true);
  const [automationActive, setAutomationActive] = useState(false);
  const [interval, setIntervalVal] = useState(5);
  const [toggling, setToggling] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      // We can't query automations from frontend SDK directly.
      // Use a lightweight poll to check if the automation is running.
      // For now, we'll track state locally after toggle.
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Since we can't directly query automation status from frontend,
  // we'll show controls and let the admin manage via toggle
  return (
    <div className="bg-card rounded-xl border border-primary/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Timer className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Auto-Polling Schedule</span>
      </div>

      <div className="bg-primary/5 rounded-lg p-3 mb-3">
        <p className="text-xs text-muted-foreground mb-1">
          The <strong>"Auto-fetch Masters Scores"</strong> automation runs every 5 minutes when active.
        </p>
        <p className="text-xs text-muted-foreground">
          It polls Masters.com and ESPN to keep golfer scores current during the tournament.
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs mb-3">
        <span className="text-muted-foreground">Status:</span>
        <span className="font-bold text-foreground">
          Managed via the Base44 Dashboard → Automations
        </span>
      </div>

      <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
        <p className="text-xs font-bold text-accent mb-1">⚡ Quick Guide</p>
        <ul className="text-[10px] text-muted-foreground space-y-1">
          <li>• <strong>Before tournament:</strong> Keep automation OFF to save credits</li>
          <li>• <strong>Round 1-4 (Thu-Sun):</strong> Turn automation ON for live scoring</li>
          <li>• <strong>Between rounds:</strong> Can leave ON (scores won't change)</li>
          <li>• <strong>After tournament:</strong> Turn OFF</li>
          <li>• <strong>Manual updates:</strong> Use "Poll Scores Now" button above anytime</li>
        </ul>
      </div>

      <p className="text-[10px] text-muted-foreground mt-2">
        💡 The automation is already configured. Use the "Poll Scores Now" button above for on-demand updates, 
        or enable the scheduled automation in Dashboard → Automations for hands-free 5-minute polling.
      </p>
    </div>
  );
}