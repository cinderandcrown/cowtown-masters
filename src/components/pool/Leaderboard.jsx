import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Trophy } from 'lucide-react';

const formatScore = (s) => (s == null ? '–' : s === 0 ? 'E' : s > 0 ? `+${s}` : `${s}`);
const scoreColor = (s) => {
  if (s == null) return 'text-muted-foreground';
  if (s < 0) return 'text-red-600';
  if (s > 0) return 'text-foreground';
  return 'text-accent';
};

export default function Leaderboard({ poolId, onSelectEntry }) {
  const { data: entries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['poolEntries', poolId],
    queryFn: () => base44.entities.PoolEntry.filter({ pool_id: poolId }),
    enabled: !!poolId,
  });

  const { data: golfers = [], isLoading: loadingGolfers } = useQuery({
    queryKey: ['poolGolfers', poolId],
    queryFn: () => base44.entities.Golfer.filter({ pool_id: poolId }),
    enabled: !!poolId,
    refetchInterval: 60000,
  });

  const isLoading = loadingEntries || loadingGolfers;

  if (isLoading) {
    return <div className="px-3 pt-3 pb-6 text-center text-muted-foreground">Loading leaderboard...</div>;
  }

  // Build golfer map
  const golferMap = {};
  for (const g of golfers) golferMap[g.id] = g;

  // Enrich entries with golfer data
  const standings = entries.map((entry) => {
    const gA = entry.golfer_a_id ? golferMap[entry.golfer_a_id] : null;
    const gB = entry.golfer_b_id ? golferMap[entry.golfer_b_id] : null;
    const scoreA = gA?.score_to_par || 0;
    const scoreB = gB?.score_to_par || 0;
    return {
      ...entry,
      golferA: gA,
      golferB: gB,
      score_a: scoreA,
      score_b: scoreB,
      total_score: scoreA + scoreB,
    };
  }).sort((a, b) => a.total_score - b.total_score);

  return (
    <div className="px-3 pt-3 pb-6">
      {/* Leader Hero */}
      {standings.length > 0 && (
        <div className="bg-gradient-to-br from-secondary to-primary rounded-xl p-4 mb-4 border border-accent/30 shadow-lg">
          <div className="flex items-start gap-3 mb-3">
            <Trophy className="w-7 h-7 text-accent flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] font-bold tracking-widest text-accent uppercase">🏆 Pool Leader</p>
              <h2 className="text-xl font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                {standings[0].participant_name}
              </h2>
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
        <div className="grid grid-cols-[32px_1fr_56px_56px_52px] gap-1 px-3 py-1.5 border-b border-primary/10 bg-primary/5 text-[10px] font-bold text-primary uppercase tracking-wider">
          <span className="text-center">#</span>
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

        {standings.map((entry, i) => (
          <div
            key={entry.id}
            onClick={() => onSelectEntry(entry)}
            className={`grid grid-cols-[32px_1fr_56px_56px_52px] gap-1 px-3 py-2 border-b border-primary/5 cursor-pointer hover:bg-accent/5 transition ${
              i === 0 ? 'bg-accent/10' : i < 3 ? 'bg-primary/5' : ''
            }`}
          >
            <span className={`text-center text-xs font-black ${i === 0 ? 'text-accent' : i < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              {i + 1}
            </span>
            <div className="min-w-0">
              <Link to={`/participant/${encodeURIComponent(entry.participant_name)}`} onClick={(e) => e.stopPropagation()} className="text-sm font-semibold text-foreground hover:text-accent truncate transition">{entry.participant_name}</Link>
              <p className="text-[10px] text-muted-foreground truncate">
                {entry.golferA?.name || 'TBD'} &amp; {entry.golferB?.name || 'TBD'}
              </p>
            </div>
            <span className={`text-center font-bold text-xs tabular-nums self-center ${scoreColor(entry.score_a)}`}>{formatScore(entry.score_a)}</span>
            <span className={`text-center font-bold text-xs tabular-nums self-center ${scoreColor(entry.score_b)}`}>{formatScore(entry.score_b)}</span>
            <span className={`text-center font-black text-sm tabular-nums self-center ${scoreColor(entry.total_score)}`}>
              {formatScore(entry.total_score)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}