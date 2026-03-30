import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Trophy, RefreshCw } from 'lucide-react';
import { formatScore, scoreColor, enrichEntries, assignPositions, parseTeamEmails } from '@/lib/scoreUtils';

export default function Leaderboard({ poolId, onSelectEntry }) {
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
    return <div className="px-3 pt-3 pb-6 text-center text-muted-foreground">Loading leaderboard...</div>;
  }

  const standings = assignPositions(enrichEntries(entries, golfers));

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
    <div className="px-3 pt-3 pb-6">
      {/* Prize Pot Banner */}
      {totalPot > 0 && (
        <div className="flex items-center justify-between bg-accent/10 rounded-lg px-3 py-2 mb-3 border border-accent/30">
          <span className="text-xs font-bold text-accent tracking-widest uppercase">Prize Pot</span>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="text-foreground">${totalPot}</span>
            <span className="text-muted-foreground">1st ${Math.round(totalPot * (payout.first || 60) / 100)}</span>
            <span className="text-muted-foreground">2nd ${Math.round(totalPot * (payout.second || 25) / 100)}</span>
            <span className="text-muted-foreground">3rd ${Math.round(totalPot * (payout.third || 15) / 100)}</span>
          </div>
        </div>
      )}

      {/* Leader Hero */}
      {standings.length > 0 && (
        <div className="bg-gradient-to-br from-secondary to-primary rounded-xl p-4 mb-4 border border-accent/30 shadow-lg">
          <div className="flex items-start gap-3 mb-3">
            <Trophy className="w-7 h-7 text-accent flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] font-bold tracking-widest text-accent uppercase">Pool Leader</p>
              <h2 className="text-xl font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                {standings[0].participant_name}
              </h2>
              {standings[0].team_name && (
                <p className="text-xs text-accent/70">{standings[0].team_name}</p>
              )}
            </div>
            <div className={`text-3xl font-black tabular-nums ${standings[0].total_score < 0 ? 'text-red-400' : standings[0].total_score > 0 ? 'text-primary-foreground' : 'text-accent'}`}>
              {formatScore(standings[0].total_score)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/10 rounded-lg p-2 border border-white/10">
              <p className="text-[10px] font-bold text-accent tracking-widest">GROUP A</p>
              <p className="text-sm font-semibold text-primary-foreground truncate">{standings[0].golferA?.name || 'TBD'}</p>
              <p className={`text-lg font-bold tabular-nums ${standings[0].score_a < 0 ? 'text-red-400' : 'text-primary-foreground'}`}>{formatScore(standings[0].score_a)}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-2 border border-white/10">
              <p className="text-[10px] font-bold text-accent tracking-widest">GROUP B</p>
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
          <span className="text-[10px] text-accent font-semibold">{standings.length} ENTRIES</span>
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
          <div className="py-8 text-center text-muted-foreground text-sm">
            <p>No entries yet</p>
            <p className="text-xs mt-1">Add participants in the Admin panel</p>
          </div>
        )}

        {standings.map((entry, i) => {
          const hasCut = entry.golferA?.status === 'cut' || entry.golferB?.status === 'cut';
          const hasWD = entry.golferA?.status === 'withdrawn' || entry.golferB?.status === 'withdrawn';
          return (
            <div
              key={entry.id}
              onClick={() => onSelectEntry({ ...entry, _rank: entry.rank, _totalEntries: standings.length })}
              className={`grid grid-cols-[36px_1fr_56px_56px_52px] gap-1 px-3 py-2 border-b border-primary/5 cursor-pointer hover:bg-accent/5 transition ${
                entry.rank === 1 ? 'bg-accent/10' : entry.rank <= 3 ? 'bg-primary/5' : ''
              }`}
            >
              <span className={`text-center text-xs font-black ${entry.rank === 1 ? 'text-accent' : entry.rank <= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                {entry.displayRank}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <Link to={`/participant/${encodeURIComponent(entry.participant_name)}`} onClick={(e) => e.stopPropagation()} className="text-sm font-semibold text-foreground hover:text-accent truncate transition">{entry.participant_name}</Link>
                  {hasCut && <span className="text-[8px] font-bold text-destructive bg-destructive/10 px-1 rounded">CUT</span>}
                  {hasWD && <span className="text-[8px] font-bold text-orange-600 bg-orange-100 px-1 rounded">WD</span>}
                </div>
                <p className="text-[10px] text-muted-foreground truncate">
                  {entry.golferA?.name || 'TBD'} &amp; {entry.golferB?.name || 'TBD'}
                </p>
                {entry.team_name && (
                  <p className="text-[9px] text-accent/70 truncate">{entry.team_name}</p>
                )}
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

      {/* Last Updated */}
      {lastUpdated && (
        <div className="flex items-center justify-center gap-2 mt-3 text-[10px] text-muted-foreground">
          <RefreshCw className="w-3 h-3" />
          <span>Scores updated {timeAgoLabel}</span>
        </div>
      )}
    </div>
  );
}