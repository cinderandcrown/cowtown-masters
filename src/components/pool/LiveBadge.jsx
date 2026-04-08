import React from 'react';
import { isOnCourse, getGolferLiveStatus } from '@/lib/winProbability';

/**
 * Small inline badge showing a golfer's live status:
 * - Pulsing green dot + "Thru X" when on course
 * - "F" when finished round
 * - "CUT" / "WD" for eliminated golfers
 */
export default function LiveBadge({ golfer }) {
  const status = getGolferLiveStatus(golfer);
  if (!status) return null;

  if (status.color === 'live') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-live-pulse flex-shrink-0" />
        {status.label}
      </span>
    );
  }

  if (status.color === 'finished') {
    return (
      <span className="text-[9px] font-bold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
        {status.label}
      </span>
    );
  }

  if (status.color === 'orange') {
    return (
      <span className="text-[9px] font-bold text-orange-600 bg-orange-500/15 px-1.5 py-0.5 rounded-full">
        {status.label}
      </span>
    );
  }

  return (
    <span className="text-[9px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">
      {status.label}
    </span>
  );
}