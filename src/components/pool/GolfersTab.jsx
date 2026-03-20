import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { assignGroups } from '@/lib/groupUtils';

const formatScore = (s) => (s == null ? '–' : s === 0 ? 'E' : s > 0 ? `+${s}` : `${s}`);
const scoreColor = (s) => {
  if (s == null) return 'text-muted-foreground';
  if (s < 0) return 'text-red-600';
  if (s > 0) return 'text-foreground';
  return 'text-accent';
};

export default function GolfersTab({ poolId }) {
  const [filter, setFilter] = useState('all');

  const { data: rawGolfers = [], isLoading } = useQuery({
    queryKey: ['poolGolfers', poolId],
    queryFn: () => base44.entities.Golfer.filter({ pool_id: poolId }),
    enabled: !!poolId,
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['poolEntries', poolId],
    queryFn: () => base44.entities.PoolEntry.filter({ pool_id: poolId }),
    enabled: !!poolId,
  });

  const golfers = assignGroups(rawGolfers, entries.length);

  const sorted = golfers
    .filter((g) => filter === 'all' || g.group === filter)
    .sort((a, b) => (a.score_to_par || 0) - (b.score_to_par || 0));

  if (isLoading) {
    return <div className="px-3 pt-3 pb-6 text-center text-muted-foreground">Loading golfers...</div>;
  }

  // Position calculation
  let currentPos = 1;
  const withPosition = sorted.map((g, i) => {
    if (i > 0 && (g.score_to_par || 0) !== (sorted[i - 1].score_to_par || 0)) {
      currentPos = i + 1;
    }
    return { ...g, displayPos: currentPos };
  });

  return (
    <div className="px-3 pt-3 pb-6">
      {/* TV-style header */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-t-xl px-3 py-2 flex items-center justify-between">
        <span className="text-sm font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          ⛳ Tournament Leaderboard
        </span>
        <span className="text-[10px] text-accent font-semibold">{sorted.length} GOLFERS</span>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 bg-card border-x border-primary/10 px-3 py-2">
        {[
          { value: 'all', label: 'All' },
          { value: 'A', label: 'Group A' },
          { value: 'B', label: 'Group B' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              filter === f.value
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:bg-primary/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[28px_1fr_36px_36px_36px_36px_44px] gap-1 px-3 py-1.5 border border-primary/10 bg-primary/5 text-[9px] font-bold text-primary uppercase tracking-wider">
        <span className="text-center">POS</span>
        <span>Player</span>
        <span className="text-center">R1</span>
        <span className="text-center">R2</span>
        <span className="text-center">R3</span>
        <span className="text-center">R4</span>
        <span className="text-center">TOT</span>
      </div>

      {/* Golfer rows */}
      <div className="bg-card rounded-b-xl border-x border-b border-primary/10 overflow-hidden">
        {withPosition.length === 0 && (
          <div className="py-8 text-center text-muted-foreground text-sm">No golfers found</div>
        )}
        {withPosition.map((g, i) => {
          const isCut = g.status === 'cut';
          const isWD = g.status === 'withdrawn' || g.status === 'disqualified';

          return (
            <div
              key={g.id}
              className={`grid grid-cols-[28px_1fr_36px_36px_36px_36px_44px] gap-1 px-3 py-1.5 border-b border-primary/5 ${
                isCut || isWD ? 'opacity-50' : i < 3 ? 'bg-accent/5' : ''
              }`}
            >
              <span className={`text-center text-xs font-black tabular-nums ${i < 3 ? 'text-accent' : 'text-muted-foreground'}`}>
                {isCut ? 'CUT' : isWD ? 'WD' : (g.displayPos === (withPosition[i - 1]?.displayPos) ? '' : g.displayPos)}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{g.name}</p>
                <div className="flex items-center gap-1">
                  <span className={`text-[9px] font-bold tracking-wider ${g.group === 'A' ? 'text-primary' : 'text-accent'}`}>
                    GRP {g.group}
                  </span>
                  {g.betting_odds && <span className="text-[9px] text-muted-foreground">{g.betting_odds}</span>}
                </div>
              </div>
              {[g.round_1, g.round_2, g.round_3, g.round_4].map((r, j) => (
                <span key={j} className={`text-center text-xs font-semibold tabular-nums ${scoreColor(r)}`}>
                  {formatScore(r)}
                </span>
              ))}
              <span className={`text-center font-black text-sm tabular-nums ${scoreColor(g.score_to_par)}`}>
                {formatScore(g.score_to_par)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}