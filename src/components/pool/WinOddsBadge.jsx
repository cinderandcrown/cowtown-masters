import React from 'react';
import { TrendingUp } from 'lucide-react';

/**
 * Displays win probability as a compact badge with American odds.
 * Highlights the favorite with a gold accent.
 */
export default function WinOddsBadge({ winPct, odds }) {
  if (winPct == null || winPct <= 0) {
    return (
      <span className="text-[9px] font-bold text-muted-foreground/50 tabular-nums">
        —
      </span>
    );
  }

  const isFavorite = winPct >= 20;
  const isLongshot = winPct < 5;

  return (
    <div className="flex flex-col items-end gap-0">
      <span className={`text-[10px] font-black tabular-nums leading-tight ${
        isFavorite ? 'text-accent' : isLongshot ? 'text-muted-foreground/60' : 'text-foreground/70'
      }`}>
        {winPct >= 1 ? `${Math.round(winPct)}%` : '<1%'}
      </span>
      <span className={`text-[8px] font-bold tabular-nums leading-tight ${
        isFavorite ? 'text-accent/70' : 'text-muted-foreground/50'
      }`}>
        {odds}
      </span>
    </div>
  );
}