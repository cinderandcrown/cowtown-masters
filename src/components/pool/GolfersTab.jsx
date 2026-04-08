import React, { useState } from 'react';
import GolferDetailModal from './GolferDetailModal';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { assignGroups } from '@/lib/groupUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { formatScore, scoreColor } from '@/lib/scoreUtils';
import { Flag, Search, ChevronDown, ChevronUp, UserX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MASTERS_WITHDRAWN_2026 } from '@/lib/mastersField2026';

function GolfersSkeleton() {
  return (
    <div className="px-3 pt-3 pb-0">
      {/* Header skeleton */}
      <div className="bg-gradient-to-r from-primary/80 to-secondary/80 rounded-t-xl px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-accent/30 animate-pulse" />
          <div className="h-4 w-28 rounded bg-white/20 animate-pulse" />
        </div>
        <div className="h-3 w-16 rounded bg-white/15 animate-pulse" />
      </div>
      {/* Search skeleton */}
      <div className="bg-card border-x border-primary/10 px-3 py-2">
        <div className="h-8 w-full rounded-md bg-muted/30 animate-pulse" />
      </div>
      {/* Filter pills skeleton */}
      <div className="flex gap-2 bg-card border-x border-primary/10 px-3 py-2">
        <div className="h-7 w-12 rounded-full bg-primary/20 animate-pulse" />
        <div className="h-7 w-20 rounded-full bg-muted animate-pulse" />
        <div className="h-7 w-24 rounded-full bg-muted animate-pulse" />
      </div>
      {/* Column header skeleton */}
      <div className="h-7 w-full bg-primary/5 border border-primary/10 animate-pulse" />
      {/* Row skeletons */}
      <div className="bg-card rounded-b-xl border-x border-b border-primary/10 overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[28px_1fr_36px_36px_36px_36px_44px] gap-1 px-3 py-1.5 border-b border-primary/5">
            <div className="h-5 w-5 rounded-full bg-muted animate-pulse mx-auto" />
            <div className="space-y-1">
              <div className="h-3.5 w-28 rounded bg-muted animate-pulse" />
              <div className="h-2.5 w-16 rounded bg-muted/50 animate-pulse" />
            </div>
            <div className="h-3.5 w-6 rounded bg-muted/40 animate-pulse mx-auto" />
            <div className="h-3.5 w-6 rounded bg-muted/40 animate-pulse mx-auto" />
            <div className="h-3.5 w-6 rounded bg-muted/40 animate-pulse mx-auto" />
            <div className="h-3.5 w-6 rounded bg-muted/40 animate-pulse mx-auto" />
            <div className="h-4 w-9 rounded bg-muted animate-pulse mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GolfersTab({ poolId }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedGolfer, setSelectedGolfer] = useState(null);

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

  if (isLoading) {
    return <GolfersSkeleton />;
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
    <div className="px-3 pt-3 pb-0">
      {/* TV-style header */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-t-xl px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-accent" />
          <span className="text-sm font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Tournament Field
          </span>
        </div>
        <span className="text-[10px] text-accent font-semibold">{sorted.length} GOLFERS</span>
      </div>

      {/* Search */}
      <div className="bg-card border-x border-primary/10 px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search golfers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-muted/30 border-0"
          />
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 bg-card border-x border-primary/10 px-3 py-2">
        {[
          { value: 'all', label: 'All' },
          { value: 'A', label: 'Top Tier' },
          { value: 'B', label: 'Bottom Tier' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              filter === f.value
                ? 'bg-primary text-white shadow-md shadow-primary/30'
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
        {withPosition.length === 0 && golfers.length === 0 && (
          <div className="py-10 text-center px-4">
            <Flag className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3 animate-pulse" />
            <p className="text-sm font-bold text-muted-foreground">Field Not Set</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Golfers will appear once the pool is initialized.</p>
          </div>
        )}
        {withPosition.length === 0 && golfers.length > 0 && (
          <div className="py-8 text-center px-4">
            <Search className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm font-bold text-muted-foreground">No golfers match this filter</p>
            <button
              onClick={() => { setFilter('all'); setSearch(''); }}
              className="mt-3 text-xs font-semibold text-primary bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary/20 transition"
            >
              Clear Filters
            </button>
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
              className={`animate-fade-in-up grid grid-cols-[28px_1fr_36px_36px_36px_36px_44px] gap-1 px-3 py-1.5 border-b border-primary/5 transition-all hover:bg-accent/5 cursor-pointer ${
                isCut || isWD ? 'opacity-40' : i < 3 ? 'bg-accent/5' : ''
              } ${!isCut && !isWD && i < 3 ? 'border-l-2 border-l-accent' : 'border-l-2 border-l-transparent'}`}
              style={{ animationDelay: `${Math.min(i * 40, 600)}ms` }}
            >
              {isTop5 && g.displayPos !== (withPosition[i - 1]?.displayPos) ? (
                <span className={`flex items-center justify-center text-[10px] font-black rounded-full w-5 h-5 mx-auto ${
                  g.displayPos === 1 ? 'bg-accent text-white' : 'bg-primary/10 text-primary'
                }`}>
                  {g.displayPos}
                </span>
              ) : (
                <span className={`text-center text-xs font-black tabular-nums ${i < 3 ? 'text-accent' : 'text-muted-foreground'}`}>
                  {isCut ? 'CUT' : isWD ? 'WD' : (g.displayPos === (withPosition[i - 1]?.displayPos) ? '' : g.displayPos)}
                </span>
              )}
              <div className="min-w-0">
                <p className={`text-xs font-semibold text-foreground truncate ${isCut || isWD ? 'line-through' : ''}`}>{g.name}</p>
                <div className="flex items-center gap-1">
                  <span className={`text-[9px] font-bold tracking-wider ${g.group === 'A' ? 'text-primary' : 'text-accent'}`}>
                    {g.group === 'A' ? 'TOP' : 'BTM'}
                  </span>
                  {g.betting_odds && <span className="text-[9px] text-muted-foreground">{g.betting_odds}</span>}
                  {g.masters_history?.wins > 0 && (
                    <span className="text-[8px] font-black text-accent bg-accent/15 px-1 rounded">🏆{g.masters_history.wins > 1 ? `×${g.masters_history.wins}` : ''}</span>
                  )}
                  {g.masters_history?.appearances > 0 && !g.masters_history?.wins && (
                    <span className="text-[8px] text-muted-foreground/70">{g.masters_history.appearances}x</span>
                  )}
                  {(!g.masters_history || g.masters_history.appearances === 0) && (
                    <span className="text-[8px] text-muted-foreground/50 italic">debut</span>
                  )}
                </div>
              </div>
              {[g.round_1, g.round_2, g.round_3, g.round_4].map((r, j) => (
                <span key={j} className={`text-center text-xs font-semibold tabular-nums ${scoreColor(r)}`}>
                  {formatScore(r)}
                </span>
              ))}
              <span className={`text-center font-black text-sm tabular-nums rounded px-0.5 ${scoreColor(g.round_1 == null && g.round_2 == null && g.round_3 == null && g.round_4 == null ? null : g.score_to_par)} ${(g.score_to_par || 0) < 0 ? 'bg-red-500/10' : ''}`}>
                {g.round_1 == null && g.round_2 == null && g.round_3 == null && g.round_4 == null ? '–' : formatScore(g.score_to_par)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Withdrawn Section */}
      <WithdrawnSection />

      <GolferDetailModal
        golfer={selectedGolfer}
        open={!!selectedGolfer}
        onOpenChange={(open) => !open && setSelectedGolfer(null)}
      />
    </div>
  );
}

function WithdrawnSection() {
  const [open, setOpen] = useState(false);

  if (!MASTERS_WITHDRAWN_2026 || MASTERS_WITHDRAWN_2026.length === 0) return null;

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2.5 border border-border hover:bg-muted/60 transition"
      >
        <div className="flex items-center gap-2">
          <UserX className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-bold text-muted-foreground tracking-wide uppercase">Not Competing This Year</span>
          <span className="text-[10px] text-muted-foreground/60 bg-muted rounded-full px-1.5 py-0.5">{MASTERS_WITHDRAWN_2026.length}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="mt-1.5 bg-card rounded-lg border border-border overflow-hidden">
          {MASTERS_WITHDRAWN_2026.map((g, i) => (
            <div
              key={g.name}
              className={`flex items-center justify-between px-3 py-2 ${i < MASTERS_WITHDRAWN_2026.length - 1 ? 'border-b border-border' : ''}`}
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground/70 line-through">{g.name}</p>
                {g.masters_history?.wins > 0 && (
                  <span className="text-[8px] font-black text-accent/50 bg-accent/10 px-1 rounded">🏆{g.masters_history.wins > 1 ? `×${g.masters_history.wins}` : ''}</span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground/50 italic flex-shrink-0 ml-2">{g.note}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}