import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const formatScore = (s) => (s == null ? '–' : s === 0 ? 'E' : s > 0 ? `+${s}` : `${s}`);
const scoreColor = (s) => {
  if (s == null) return 'text-muted-foreground';
  if (s < 0) return 'text-red-600';
  if (s > 0) return 'text-foreground';
  return 'text-accent';
};

export default function CurrentYearPicks({ participantName }) {
  const { data: entries = [] } = useQuery({
    queryKey: ['allEntries'],
    queryFn: () => base44.entities.PoolEntry.list(),
  });

  const { data: golfers = [] } = useQuery({
    queryKey: ['allGolfers'],
    queryFn: () => base44.entities.Golfer.list(),
  });

  const golferMap = {};
  for (const g of golfers) golferMap[g.id] = g;

  const currentEntry = entries.find(
    (e) => e.participant_name?.toLowerCase() === participantName?.toLowerCase()
  );

  if (!currentEntry) {
    return (
      <div className="bg-card rounded-lg border border-border p-4 text-center text-muted-foreground text-sm">
        No current year entry found for this participant.
      </div>
    );
  }

  const gA = currentEntry.golfer_a_id ? golferMap[currentEntry.golfer_a_id] : null;
  const gB = currentEntry.golfer_b_id ? golferMap[currentEntry.golfer_b_id] : null;
  const scoreA = gA?.score_to_par ?? null;
  const scoreB = gB?.score_to_par ?? null;
  const total = (scoreA ?? 0) + (scoreB ?? 0);

  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-primary tracking-widest uppercase">2026 Picks</h3>
        <span className={`text-2xl font-black tabular-nums ${scoreColor(total)}`}>
          {formatScore(total)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <p className="text-[10px] font-bold text-primary tracking-widest mb-0.5">GROUP A</p>
          <p className="text-sm font-semibold text-foreground truncate">{gA?.name || 'TBD'}</p>
          <p className={`text-lg font-bold tabular-nums ${scoreColor(scoreA)}`}>{formatScore(scoreA)}</p>
          {gA?.position && <p className="text-[10px] text-muted-foreground">Pos: {gA.position}</p>}
        </div>
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <p className="text-[10px] font-bold text-primary tracking-widest mb-0.5">GROUP B</p>
          <p className="text-sm font-semibold text-foreground truncate">{gB?.name || 'TBD'}</p>
          <p className={`text-lg font-bold tabular-nums ${scoreColor(scoreB)}`}>{formatScore(scoreB)}</p>
          {gB?.position && <p className="text-[10px] text-muted-foreground">Pos: {gB.position}</p>}
        </div>
      </div>
    </div>
  );
}