import React from 'react';
import { Trophy } from 'lucide-react';

const formatScore = (s) => (s == null ? '–' : s === 0 ? 'E' : s > 0 ? `+${s}` : `${s}`);
const scoreColor = (s) => {
  if (s == null) return 'text-muted-foreground';
  if (s < 0) return 'text-red-600';
  if (s > 0) return 'text-foreground';
  return 'text-accent';
};

export default function ParticipantYearCard({ result }) {
  return (
    <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-primary to-secondary rounded-lg px-2.5 py-0.5">
            <span className="text-accent font-black text-lg">{result.year}</span>
          </div>
          {result.isWinner && <Trophy className="w-5 h-5 text-accent" />}
        </div>
        <div className="text-right">
          <span className={`text-2xl font-black tabular-nums ${scoreColor(result.total)}`}>
            {formatScore(result.total)}
          </span>
          <p className="text-[10px] text-muted-foreground">
            {result.rank}/{result.totalEntries}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
          <p className="text-[10px] font-bold text-primary tracking-widest mb-0.5">GROUP A</p>
          <p className="text-sm font-semibold text-foreground truncate">{result.golferA}</p>
          <p className={`text-base font-bold tabular-nums ${scoreColor(result.scoreA)}`}>{formatScore(result.scoreA)}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
          <p className="text-[10px] font-bold text-primary tracking-widest mb-0.5">GROUP B</p>
          <p className="text-sm font-semibold text-foreground truncate">{result.golferB}</p>
          <p className={`text-base font-bold tabular-nums ${scoreColor(result.scoreB)}`}>{formatScore(result.scoreB)}</p>
        </div>
      </div>
    </div>
  );
}