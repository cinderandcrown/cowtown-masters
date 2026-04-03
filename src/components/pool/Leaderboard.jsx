import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { base44 } from '@/api/base44Client';
import { Trophy, RefreshCw, Star, Share2, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useParticipant } from '@/lib/ParticipantContext';
import { Button } from '@/components/ui/button';
import { formatScore, scoreColor, enrichEntries, assignPositions } from '@/lib/scoreUtils';

function LeaderboardSkeleton() {
  return (
    <div className="px-3 pt-3 pb-0">
      {/* Prize pot skeleton */}
      <Skeleton className="h-10 w-full rounded-lg mb-3" />
      {/* Hero card skeleton */}
      <div className="bg-gradient-to-br from-secondary to-primary rounded-xl p-4 mb-4 border border-accent/30">
        <div className="flex items-start gap-3 mb-3">
          <Skeleton className="w-7 h-7 rounded bg-white/10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20 bg-white/10" />
            <Skeleton className="h-6 w-40 bg-white/10" />
          </div>
          <Skeleton className="h-9 w-14 rounded bg-white/10" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-16 rounded-lg bg-white/10" />
          <Skeleton className="h-16 rounded-lg bg-white/10" />
        </div>
      </div>
      {/* Table skeleton */}
      <div className="bg-card rounded-xl border border-primary/10 overflow-hidden">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-7 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-3 py-2 border-b border-primary/5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-8 rounded" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-5 w-10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Leaderboard({ poolId, onSelectEntry }) {
  const { isLoggedIn, participant } = useParticipant();

  const { data: pool } = useQuery({
    queryKey: ['pool', poolId],
    queryFn: () => base44.entities.Pool.filter({ id: poolId }),
    enabled: !!poolId,
    select: (data) => data[0],
  });

  const { data: entries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['poolEntries', poolId],
    queryFn: () => base44.entities.PoolEntry.filter({ pool_id: poolId }),
    enabled: !!poolId,
  });

  const { data: golfers = [], isLoading: loadingGolfers, dataUpdatedAt } = useQuery({
    queryKey: ['poolGolfers', poolId],
    queryFn: () => base44.entities.Golfer.filter({ pool_id: poolId }),
    enabled: !!poolId,
    refetchInterval: 60000,
  });

  const isLoading = loadingEntries || loadingGolfers;

  if (isLoading) {
    return <LeaderboardSkeleton />;
  }

  const standings = assignPositions(enrichEntries(entries, golfers));

  const myEntry = isLoggedIn ? standings.find(s => s.id === participant?.entry_id) : null;

  const handleShare = async () => {
    if (!myEntry) return;
    const text = `I'm #${myEntry.displayRank} in the Cowtown Masters pool with ${formatScore(myEntry.total_score)}!`;
    if (navigator.share) {
      navigator.share({ title: 'Cowtown Masters', text });
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const handleExport = () => {
    const header = 'Rank,Player,Team,Golfer A,Score A,Golfer B,Score B,Total';
    const rows = standings.map(s => 
      `${s.displayRank},"${s.participant_name}","${s.team_name || ''}","${s.golferA?.name || 'TBD'}",${s.score_a},"${s.golferB?.name || 'TBD'}",${s.score_b},${s.total_score}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cowtown-masters-standings.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Prize pot calculation
  const entryFee = pool?.entry_fee || 0;
  const totalPot = entryFee * standings.length;
  const payout = pool?.payout_structure || { first: 60, second: 25, third: 15 };

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;
  const timeAgo = lastUpdated
    ? Math.round((Date.now() - lastUpdated.getTime()) / 1000)
    : null;
  const timeAgoLabel = timeAgo != null
    ? timeAgo < 60 ? `${timeAgo}s ago` : `${Math.round(timeAgo / 60)}m ago`
    : '';

  return (
    <div className="px-3 pt-3 pb-0">
      {/* Prize Pot Banner */}
      {totalPot > 0 && (
        <div className="animate-fade-in-up flex items-center justify-between bg-gradient-to-r from-accent/15 via-accent/10 to-accent/15 rounded-xl px-3 py-2.5 mb-3 border border-accent/30 relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
          <div className="flex items-center gap-2 relative">
            <Trophy className="w-4 h-4 text-accent" />
            <span className="text-[10px] font-black text-accent tracking-widest uppercase">Prize Pot</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-bold relative">
            <span className="text-accent text-sm font-black">${totalPot}</span>
            <span className="text-muted-foreground/80 text-[10px]">1st ${Math.round(totalPot * (payout.first ?? 60) / 100)}</span>
            <span className="text-muted-foreground/60 text-[10px]">2nd ${Math.round(totalPot * (payout.second ?? 25) / 100)}</span>
            {(payout.third ?? 15) > 0 && (
              <span className="text-muted-foreground/60 text-[10px]">3rd ${Math.round(totalPot * payout.third / 100)}</span>
            )}
          </div>
        </div>
      )}

      {/* Your Entry Quick Card */}
      {myEntry && (
        <div className="animate-fade-in-up flex items-center gap-3 bg-accent/8 rounded-xl px-3 py-2.5 mb-3 border border-accent/25">
          <Star className="w-4 h-4 text-accent flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{myEntry.team_name || myEntry.participant_name}</p>
            <p className="text-[10px] text-muted-foreground">#{myEntry.displayRank} of {standings.length}</p>
          </div>
          <span className={`text-lg font-black tabular-nums ${scoreColor(myEntry.total_score)}`}>{formatScore(myEntry.total_score)}</span>
          <button onClick={handleShare} className="p-1.5 hover:bg-accent/10 rounded-lg transition" aria-label="Share standing">
            <Share2 className="w-3.5 h-3.5 text-accent" />
          </button>
        </div>
      )}

      {/* Leader Hero */}
      {standings.length > 0 && (
        <div className="animate-fade-in-up bg-gradient-to-br from-secondary to-primary rounded-xl p-4 mb-4 border border-accent/30 shadow-lg shadow-primary/20 relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
          <div className="flex items-start gap-3 mb-3 relative">
            <Trophy className="w-7 h-7 text-accent flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] font-bold tracking-widest text-accent uppercase">Pool Leader</p>
              <h2 className="text-xl font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                {standings[0].team_name || standings[0].participant_name}
              </h2>
              {standings[0].team_name && (
                <p className="text-xs text-primary-foreground/60">{standings[0].participant_name}</p>
              )}
            </div>
            <div className={`text-3xl font-black tabular-nums ${standings[0].total_score < 0 ? 'text-red-400' : standings[0].total_score > 0 ? 'text-primary-foreground' : 'text-accent'}`}>
              {formatScore(standings[0].total_score)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 relative">
            <div className="bg-white/10 rounded-lg p-2 border border-white/10">
              <p className="text-[10px] font-bold text-accent tracking-widest">TOP TIER</p>
              <p className="text-sm font-semibold text-primary-foreground truncate">{standings[0].golferA?.name || 'TBD'}</p>
              <p className={`text-lg font-bold tabular-nums ${standings[0].score_a < 0 ? 'text-red-400' : 'text-primary-foreground'}`}>{formatScore(standings[0].score_a)}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-2 border border-white/10">
              <p className="text-[10px] font-bold text-accent tracking-widest">BTM TIER</p>
              <p className="text-sm font-semibold text-primary-foreground truncate">{standings[0].golferB?.name || 'TBD'}</p>
              <p className={`text-lg font-bold tabular-nums ${standings[0].score_b < 0 ? 'text-red-400' : 'text-primary-foreground'}`}>{formatScore(standings[0].score_b)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Pool Standings Table */}
      <div className="bg-card rounded-xl shadow-sm border border-primary/10 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-secondary px-3 py-2 flex items-center justify-between">
          <span className="text-sm font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Pool Standings
          </span>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="p-1 hover:bg-white/10 rounded transition" aria-label="Export CSV">
              <Download className="w-3.5 h-3.5 text-accent" />
            </button>
            <span className="text-[10px] text-accent font-semibold">{standings.length} ENTRIES</span>
          </div>
        </div>

        {/* Header */}
        <div className="grid grid-cols-[36px_1fr_56px_56px_52px] gap-1 px-3 py-1.5 border-b border-primary/10 bg-primary/5 text-[10px] font-bold text-primary uppercase tracking-wider">
          <span className="text-center">POS</span>
          <span>Player</span>
          <span className="text-center">A</span>
          <span className="text-center">B</span>
          <span className="text-center">Tot</span>
        </div>

        {/* Rows */}
        {standings.length === 0 && (
          <div className="py-10 text-center">
            <Trophy className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No entries yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add participants in the Admin panel</p>
          </div>
        )}

        {standings.map((entry, i) => {
          const hasCut = entry.golferA?.status === 'cut' || entry.golferB?.status === 'cut';
          const hasWD = entry.golferA?.status === 'withdrawn' || entry.golferB?.status === 'withdrawn';
          return (
            <div
              key={entry.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectEntry({ ...entry, _rank: entry.rank, _totalEntries: standings.length })}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectEntry({ ...entry, _rank: entry.rank, _totalEntries: standings.length }); } }}
              aria-label={`View details for ${entry.team_name || entry.participant_name}, position ${entry.displayRank}`}
              className={`animate-fade-in-up grid grid-cols-[36px_1fr_56px_56px_52px] gap-1 px-3 py-2 border-b border-primary/5 cursor-pointer hover:bg-accent/5 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent ${
                myEntry?.id === entry.id ? 'bg-accent/8 border-l-2 border-l-accent' : entry.rank === 1 ? 'bg-accent/10' : entry.rank <= 3 ? 'bg-primary/5' : ''
              }`}
              style={{ animationDelay: `${Math.min(i * 50, 500)}ms` }}
            >
              {entry.rank <= 3 ? (
                <span className={`flex items-center justify-center text-xs font-black rounded-full w-7 h-7 mx-auto ${
                  entry.rank === 1 ? 'bg-accent text-white' : entry.rank === 2 ? 'bg-muted text-muted-foreground' : 'bg-amber-600/80 text-white'
                }`}>
                  {entry.displayRank}
                </span>
              ) : (
                <span className="text-center text-xs font-black text-muted-foreground self-center">
                  {entry.displayRank}
                </span>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  {myEntry?.id === entry.id && <Star className="w-3 h-3 text-accent flex-shrink-0" />}
                  <span className="text-sm font-semibold text-foreground truncate">
                    {entry.team_name || entry.participant_name}
                  </span>
                  {hasCut && <span className="text-[8px] font-bold text-destructive bg-destructive/10 px-1 rounded">CUT</span>}
                  {hasWD && <span className="text-[8px] font-bold text-orange-600 bg-orange-500/15 px-1 rounded">WD</span>}
                </div>
                {entry.team_name && (
                  <p className="text-[10px] text-muted-foreground truncate">{entry.participant_name}</p>
                )}
                <p className="text-[10px] text-muted-foreground truncate">
                  {entry.golferA?.name || 'TBD'} &amp; {entry.golferB?.name || 'TBD'}
                </p>
              </div>
              <span className={`text-center font-bold text-xs tabular-nums self-center rounded px-1 py-0.5 ${scoreColor(entry.score_a)} ${entry.score_a < 0 ? 'bg-red-500/10' : ''}`}>{formatScore(entry.score_a)}</span>
              <span className={`text-center font-bold text-xs tabular-nums self-center rounded px-1 py-0.5 ${scoreColor(entry.score_b)} ${entry.score_b < 0 ? 'bg-red-500/10' : ''}`}>{formatScore(entry.score_b)}</span>
              <span className={`text-center font-black text-sm tabular-nums self-center rounded px-1 py-0.5 ${scoreColor(entry.total_score)} ${entry.total_score < 0 ? 'bg-red-500/10' : ''}`}>
                {formatScore(entry.total_score)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="animate-fade-in-up flex items-center justify-center gap-2 mt-3 text-[10px] text-muted-foreground/70">
          <RefreshCw className="w-3 h-3" />
          <span>Scores updated {timeAgoLabel}</span>
          <span className="w-1 h-1 rounded-full bg-green-500" />
        </div>
      )}
    </div>
  );
}