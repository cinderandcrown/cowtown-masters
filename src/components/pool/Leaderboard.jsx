import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, RefreshCw, Share2, Download, ChevronUp, ChevronDown, Minus, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatScore, scoreColor, enrichEntries, assignPositions } from '@/lib/scoreUtils';
import { useParticipant } from '@/lib/ParticipantContext';

function LeaderboardSkeleton() {
  return (
    <div className="px-3 pt-3 pb-0">
      <Skeleton className="h-10 w-full rounded-lg mb-3" />
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
      <div className="bg-card rounded-xl border border-primary/10 overflow-hidden">
        <Skeleton className="h-9 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-3 py-2.5 border-b border-primary/5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-8 rounded" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MovementBadge({ movement }) {
  if (!movement || movement === 0) return <Minus className="w-3 h-3 text-muted-foreground/40" />;
  if (movement > 0) return (
    <div className="flex items-center gap-0.5 text-green-600">
      <ChevronUp className="w-3 h-3" />
      <span className="text-[9px] font-bold">{movement}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-0.5 text-red-500">
      <ChevronDown className="w-3 h-3" />
      <span className="text-[9px] font-bold">{Math.abs(movement)}</span>
    </div>
  );
}

export default function Leaderboard({ poolId, onSelectEntry }) {
  const { participant } = useParticipant();
  const [showMyEntry, setShowMyEntry] = useState(false);

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
  if (isLoading) return <LeaderboardSkeleton />;

  const standings = assignPositions(enrichEntries(entries, golfers));

  const entryFee = pool?.entry_fee || 0;
  const totalPot = entryFee * standings.length;
  const payout = pool?.payout_structure || { first: 60, second: 25, third: 15 };

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;
  const timeAgo = lastUpdated ? Math.round((Date.now() - lastUpdated.getTime()) / 1000) : null;
  const timeAgoLabel = timeAgo != null
    ? timeAgo < 60 ? `${timeAgo}s ago` : `${Math.round(timeAgo / 60)}m ago`
    : '';

  // Find my entry
  const myEntryId = participant?.entry_id;
  const myEntry = myEntryId ? standings.find(e => e.id === myEntryId) : null;

  const handleExport = () => {
    const csv = [
      'Position,Player,Team,Golfer A,Score A,Golfer B,Score B,Total',
      ...standings.map(e =>
        `${e.displayRank},"${e.participant_name}","${e.team_name || ''}","${e.golferA?.name || 'TBD'}",${formatScore(e.score_a)},"${e.golferB?.name || 'TBD'}",${formatScore(e.score_b)},${formatScore(e.total_score)}`
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pool?.name || 'cowtown-masters'}-leaderboard.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const leader = standings[0];
    const text = myEntry
      ? `I'm ${myEntry.displayRank} in ${pool?.name || 'Cowtown Masters'}! Score: ${formatScore(myEntry.total_score)} | Leader: ${leader?.team_name || leader?.participant_name} (${formatScore(leader?.total_score)})`
      : `${pool?.name || 'Cowtown Masters'} Leaderboard | Leader: ${leader?.team_name || leader?.participant_name} (${formatScore(leader?.total_score)})`;
    try {
      if (navigator.share) {
        await navigator.share({ title: pool?.name || 'Cowtown Masters', text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch {}
  };

  return (
    <div className="px-3 pt-3 pb-0">
      {/* Prize Pot Banner */}
      {totalPot > 0 && (
        <div className="animate-fade-in-up flex items-center justify-between bg-gradient-to-r from-accent/10 to-accent/5 rounded-xl px-3.5 py-2.5 mb-3 border border-accent/25 relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-40" />
          <div className="flex items-center gap-2 relative">
            <Trophy className="w-4 h-4 text-accent" />
            <span className="text-[10px] font-black text-accent tracking-widest uppercase">Prize Pot</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold relative">
            <span className="text-accent text-base font-black">${totalPot}</span>
            <div className="flex gap-1.5">
              <span className="bg-accent/15 text-accent text-[10px] font-bold px-1.5 py-0.5 rounded">1st ${Math.round(totalPot * (payout.first ?? 60) / 100)}</span>
              <span className="bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">2nd ${Math.round(totalPot * (payout.second ?? 25) / 100)}</span>
              {(payout.third ?? 15) > 0 && (
                <span className="bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">3rd ${Math.round(totalPot * payout.third / 100)}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* My Entry Quick Card */}
      {myEntry && (
        <div
          className="animate-fade-in-up mb-3 bg-accent/8 rounded-xl p-3 border border-accent/20 cursor-pointer hover:border-accent/40 transition-all"
          onClick={() => onSelectEntry({ ...myEntry, _rank: myEntry.rank, _totalEntries: standings.length })}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4 text-accent" />
              <div>
                <p className="text-[10px] font-bold text-accent tracking-widest uppercase">Your Entry</p>
                <p className="text-sm font-bold text-foreground">{myEntry.team_name || myEntry.participant_name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-xl font-black tabular-nums ${scoreColor(myEntry.total_score)}`}>{formatScore(myEntry.total_score)}</p>
              <p className="text-[10px] font-bold text-muted-foreground">{myEntry.displayRank} of {standings.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Leader Hero */}
      {standings.length > 0 && (
        <div className="animate-fade-in-up bg-gradient-to-br from-[#0a3d0a] via-secondary to-primary rounded-xl p-4 mb-3 border border-accent/30 shadow-lg shadow-primary/15 relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-20" />
          <div className="flex items-start gap-3 mb-3 relative">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-bold tracking-widest text-accent uppercase">Pool Leader</p>
              <h2 className="text-xl font-bold text-primary-foreground leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                {standings[0].team_name || standings[0].participant_name}
              </h2>
              {standings[0].team_name && (
                <p className="text-[11px] text-primary-foreground/50">{standings[0].participant_name}</p>
              )}
            </div>
            <div className={`text-3xl font-black tabular-nums ${standings[0].total_score < 0 ? 'text-red-400' : standings[0].total_score > 0 ? 'text-primary-foreground' : 'text-accent'}`}>
              {formatScore(standings[0].total_score)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 relative">
            <div className="bg-white/8 rounded-lg p-2.5 border border-white/10">
              <p className="text-[9px] font-bold text-accent tracking-widest">TOP TIER</p>
              <p className="text-sm font-semibold text-primary-foreground truncate">{standings[0].golferA?.name || 'TBD'}</p>
              <p className={`text-lg font-bold tabular-nums ${standings[0].score_a < 0 ? 'text-red-400' : 'text-primary-foreground'}`}>{formatScore(standings[0].score_a)}</p>
            </div>
            <div className="bg-white/8 rounded-lg p-2.5 border border-white/10">
              <p className="text-[9px] font-bold text-accent tracking-widest">BOTTOM TIER</p>
              <p className="text-sm font-semibold text-primary-foreground truncate">{standings[0].golferB?.name || 'TBD'}</p>
              <p className={`text-lg font-bold tabular-nums ${standings[0].score_b < 0 ? 'text-red-400' : 'text-primary-foreground'}`}>{formatScore(standings[0].score_b)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions Row */}
      <div className="flex items-center gap-2 mb-2">
        <button onClick={handleShare} className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/8 px-2.5 py-1.5 rounded-lg border border-primary/15 hover:bg-primary/15 transition">
          <Share2 className="w-3 h-3" />
          Share
        </button>
        <button onClick={handleExport} className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted transition">
          <Download className="w-3 h-3" />
          Export
        </button>
        <div className="flex-1" />
        {lastUpdated && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>{timeAgoLabel}</span>
          </div>
        )}
      </div>

      {/* Pool Standings Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-secondary px-3 py-2 flex items-center justify-between">
          <span className="text-sm font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Pool Standings
          </span>
          <span className="text-[10px] text-accent font-semibold">{standings.length} ENTRIES</span>
        </div>

        <div className="grid grid-cols-[32px_1fr_48px_48px_48px] gap-0.5 px-3 py-1.5 border-b border-border bg-muted/30 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
          <span className="text-center">POS</span>
          <span>Player</span>
          <span className="text-center">A</span>
          <span className="text-center">B</span>
          <span className="text-center">Tot</span>
        </div>

        {standings.length === 0 && (
          <div className="py-10 text-center">
            <Trophy className="w-10 h-10 text-muted-foreground/15 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No entries yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Add participants in the Admin panel to get started</p>
          </div>
        )}

        {standings.map((entry, i) => {
          const isMyEntry = myEntryId && entry.id === myEntryId;
          const hasCut = entry.golferA?.status === 'cut' || entry.golferB?.status === 'cut';
          const hasWD = entry.golferA?.status === 'withdrawn' || entry.golferB?.status === 'withdrawn';
          return (
            <div
              key={entry.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectEntry({ ...entry, _rank: entry.rank, _totalEntries: standings.length })}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectEntry({ ...entry, _rank: entry.rank, _totalEntries: standings.length }); } }}
              aria-label={`${entry.team_name || entry.participant_name}, position ${entry.displayRank}`}
              className={`animate-fade-in-up grid grid-cols-[32px_1fr_48px_48px_48px] gap-0.5 px-3 py-2.5 border-b border-border/50 cursor-pointer hover:bg-accent/5 transition-all ${
                isMyEntry ? 'bg-accent/8 border-l-2 border-l-accent' : entry.rank === 1 ? 'bg-accent/5' : entry.rank <= 3 ? 'bg-primary/3' : ''
              }`}
              style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
            >
              {entry.rank <= 3 ? (
                <span className={`flex items-center justify-center text-[10px] font-black rounded-full w-6 h-6 mx-auto ${
                  entry.rank === 1 ? 'bg-accent text-white shadow-sm shadow-accent/30' : entry.rank === 2 ? 'bg-muted-foreground/20 text-muted-foreground' : 'bg-amber-600/20 text-amber-700'
                }`}>
                  {entry.displayRank}
                </span>
              ) : (
                <span className="text-center text-xs font-bold text-muted-foreground self-center tabular-nums">
                  {entry.displayRank}
                </span>
              )}
              <div className="min-w-0 self-center">
                <div className="flex items-center gap-1">
                  {isMyEntry && <Star className="w-3 h-3 text-accent flex-shrink-0" />}
                  <span className={`text-sm font-semibold text-foreground truncate ${isMyEntry ? 'text-accent' : ''}`}>
                    {entry.team_name || entry.participant_name}
                  </span>
                  {hasCut && <span className="text-[8px] font-bold text-destructive bg-destructive/10 px-1 rounded">CUT</span>}
                  {hasWD && <span className="text-[8px] font-bold text-orange-600 bg-orange-500/15 px-1 rounded">WD</span>}
                </div>
                <p className="text-[10px] text-muted-foreground truncate">
                  {entry.golferA?.name || 'TBD'} & {entry.golferB?.name || 'TBD'}
                </p>
              </div>
              <span className={`text-center font-bold text-xs tabular-nums self-center ${scoreColor(entry.score_a)}`}>{formatScore(entry.score_a)}</span>
              <span className={`text-center font-bold text-xs tabular-nums self-center ${scoreColor(entry.score_b)}`}>{formatScore(entry.score_b)}</span>
              <span className={`text-center font-black text-sm tabular-nums self-center ${scoreColor(entry.total_score)}`}>
                {formatScore(entry.total_score)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
