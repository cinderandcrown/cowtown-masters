import React, { useState } from 'react';
import GolferDetailModal from './GolferDetailModal';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { assignGroups } from '@/lib/groupUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { formatScore, scoreColor } from '@/lib/scoreUtils';
import { Flag, Search } from 'lucide-react';

function GolfersSkeleton() {
  return (
    <div className="px-3 pt-3 pb-0">
      <Skeleton className="h-9 w-full rounded-t-xl" />
      <div className="flex gap-2 bg-card border-x border-border px-3 py-2">
        <Skeleton className="h-7 w-14 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      <div className="bg-card rounded-b-xl border-x border-b border-border overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-3 py-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-7" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-2.5 w-16" />
              </div>
              <Skeleton className="h-4 w-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GolfersTab({ poolId }) {
  const [filter, setFilter] = useState('all');
  const [selectedGolfer, setSelectedGolfer] = useState(null);
  const [search, setSearch] = useState('');

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
    .filter((g) => !search || g.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.score_to_par || 0) - (b.score_to_par || 0));

  if (isLoading) return <GolfersSkeleton />;

  let currentPos = 1;
  const withPosition = sorted.map((g, i) => {
    if (i > 0 && (g.score_to_par || 0) !== (sorted[i - 1].score_to_par || 0)) {
      currentPos = i + 1;
    }
    return { ...g, displayPos: currentPos };
  });

  return (
    <div className="px-3 pt-3 pb-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-t-xl px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-accent" />
          <span className="text-sm font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Tournament Field
          </span>
        </div>
        <span className="text-[10px] text-accent font-semibold">{sorted.length} GOLFERS</span>
      </div>

      {/* Search + Filter */}
      <div className="bg-card border-x border-border px-3 py-2 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search golfers..."
            className="w-full text-sm bg-muted/30 rounded-lg border border-border pl-8 pr-3 py-1.5 outline-none focus:border-primary/30 focus:bg-card transition placeholder:text-muted-foreground/40"
          />
        </div>
        <div className="flex gap-1.5">
          {[
            { value: 'all', label: 'All' },
            { value: 'A', label: 'Top Tier' },
            { value: 'B', label: 'Bottom Tier' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                filter === f.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[28px_1fr_32px_32px_32px_32px_40px] gap-0.5 px-3 py-1.5 border border-border bg-muted/30 text-[8px] font-bold text-muted-foreground uppercase tracking-wider">
        <span className="text-center">POS</span>
        <span>Player</span>
        <span className="text-center">R1</span>
        <span className="text-center">R2</span>
        <span className="text-center">R3</span>
        <span className="text-center">R4</span>
        <span className="text-center">TOT</span>
      </div>

      {/* Golfer rows */}
      <div className="bg-card rounded-b-xl border-x border-b border-border overflow-hidden">
        {withPosition.length === 0 && (
          <div className="py-10 text-center">
            <Flag className="w-10 h-10 text-muted-foreground/15 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No golfers found</p>
            {search && <p className="text-xs text-muted-foreground/70 mt-1">Try a different search</p>}
          </div>
        )}
        {withPosition.map((g, i) => {
          const isCut = g.status === 'cut';
          const isWD = g.status === 'withdrawn' || g.status === 'disqualified';
          const isTop5 = !isCut && !isWD && g.displayPos <= 5;

          return (
            <div
              key={g.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedGolfer(g)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedGolfer(g); } }}
              className={`animate-fade-in-up grid grid-cols-[28px_1fr_32px_32px_32px_32px_40px] gap-0.5 px-3 py-1.5 border-b border-border/50 transition-all hover:bg-accent/5 cursor-pointer ${
                isCut || isWD ? 'opacity-35' : i < 3 && !isCut && !isWD ? 'bg-accent/3' : ''
              } ${!isCut && !isWD && i < 3 ? 'border-l-2 border-l-accent' : 'border-l-2 border-l-transparent'}`}
              style={{ animationDelay: `${Math.min(i * 30, 500)}ms` }}
            >
              {isTop5 && g.displayPos !== (withPosition[i - 1]?.displayPos) ? (
                <span className={`flex items-center justify-center text-[9px] font-black rounded-full w-5 h-5 mx-auto ${
                  g.displayPos === 1 ? 'bg-accent text-white' : 'bg-primary/10 text-primary'
                }`}>
                  {g.displayPos}
                </span>
              ) : (
                <span className={`text-center text-[10px] font-bold tabular-nums ${i < 3 && !isCut && !isWD ? 'text-accent' : 'text-muted-foreground'}`}>
                  {isCut ? 'CUT' : isWD ? 'WD' : (g.displayPos === (withPosition[i - 1]?.displayPos) ? '' : g.displayPos)}
                </span>
              )}
              <div className="min-w-0 self-center">
                <p className={`text-xs font-semibold text-foreground truncate ${isCut || isWD ? 'line-through' : ''}`}>{g.name}</p>
                <div className="flex items-center gap-1">
                  <span className={`text-[8px] font-bold tracking-wider ${g.group === 'A' ? 'text-primary' : 'text-accent'}`}>
                    {g.group === 'A' ? 'TOP' : 'BTM'}
                  </span>
                  {g.betting_odds && <span className="text-[8px] text-muted-foreground">{g.betting_odds}</span>}
                </div>
              </div>
              {[g.round_1, g.round_2, g.round_3, g.round_4].map((r, j) => (
                <span key={j} className={`text-center text-[10px] font-semibold tabular-nums self-center ${scoreColor(r)}`}>
                  {formatScore(r)}
                </span>
              ))}
              <span className={`text-center font-black text-xs tabular-nums self-center ${scoreColor(g.score_to_par)}`}>
                {formatScore(g.score_to_par)}
              </span>
            </div>
          );
        })}
      </div>

      <GolferDetailModal
        golfer={selectedGolfer}
        open={!!selectedGolfer}
        onOpenChange={(open) => !open && setSelectedGolfer(null)}
      />
    </div>
  );
}
