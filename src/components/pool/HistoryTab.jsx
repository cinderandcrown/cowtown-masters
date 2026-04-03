import React from 'react';
import { Trophy, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const formatScore = (s) => (s === 0 ? 'E' : s > 0 ? `+${s}` : `${s}`);
const scoreColor = (s) => {
  if (s < 0) return 'text-red-600';
  if (s > 0) return 'text-primary';
  return 'text-accent';
};

export default function HistoryTab({ poolId }) {
  const { data: historyRecords = [] } = useQuery({
    queryKey: ['poolHistory', poolId],
    queryFn: () => base44.entities.PoolHistory.filter({ pool_id: poolId }),
    enabled: !!poolId,
  });

  const sortedHistory = [...historyRecords].sort((a, b) => (b.year || 0) - (a.year || 0));

  return (
    <div className="px-3 pt-3 pb-0 space-y-3">
      <div className="bg-gradient-to-br from-[#0a3d0a] to-primary rounded-xl p-4 border border-accent/30 text-center relative overflow-hidden mb-4">
        <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-30" />
        <div className="relative">
          <Trophy className="w-8 h-8 text-accent mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Champions Wall
          </h2>
          <p className="text-[10px] tracking-widest text-accent uppercase font-semibold mt-1">Past Victors</p>
        </div>
      </div>

      {sortedHistory.length === 0 && (
        <div className="bg-card rounded-xl p-8 border border-border text-center">
          <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">No Champions Yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Champions will be recorded after each tournament.</p>
        </div>
      )}

      {sortedHistory.map((record) => (
        <div key={record.id} className="bg-card rounded-lg p-4 border border-border shadow-sm hover:shadow-md transition">
          <div className="flex items-start gap-3">
            <div className="bg-gradient-to-br from-primary to-secondary rounded-lg px-3 py-1">
              <span className="text-accent font-black text-xl">{record.year}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-start gap-2">
                <Trophy className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-lg font-bold text-card-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {record.winner_name}
                  </span>
                  <p className="text-xs text-muted-foreground">{record.golfer_a_name} + {record.golfer_b_name}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              {record.winning_score != null && (
                <div className={`text-2xl font-black ${scoreColor(record.winning_score)}`}>{formatScore(record.winning_score)}</div>
              )}
              {record.total_entries && (
                <p className="text-xs text-muted-foreground mt-1">{record.total_entries} entries</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}