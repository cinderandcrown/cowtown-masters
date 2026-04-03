import React, { useState } from 'react';
import { Trophy, Calendar, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { POOL_HISTORY } from '@/lib/poolHistoryData';

const formatScore = (s) => (s === 0 ? 'E' : s > 0 ? `+${s}` : `${s}`);
const scoreColor = (s) => {
  if (s < 0) return 'text-red-600';
  if (s > 0) return 'text-primary';
  return 'text-accent';
};

export default function HistoryTab({ poolId }) {
  const years = Object.keys(POOL_HISTORY).sort((a, b) => Number(b) - Number(a));
  const [expandedYear, setExpandedYear] = useState(null);

  return (
    <div className="px-3 pt-3 pb-0 space-y-3">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0a3d0a] to-primary rounded-xl p-4 border border-accent/30 text-center relative overflow-hidden mb-4">
        <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-30" />
        <div className="relative">
          <Trophy className="w-8 h-8 text-accent mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Champions Wall
          </h2>
          <p className="text-[10px] tracking-widest text-accent uppercase font-semibold mt-1">Cowtown Masters Legacy</p>
        </div>
      </div>

      {years.length === 0 && (
        <div className="bg-card rounded-xl p-8 border border-border text-center">
          <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">No Champions Yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Champions will be recorded after each tournament.</p>
        </div>
      )}

      {years.map((year) => {
        const data = POOL_HISTORY[year];
        const isExpanded = expandedYear === year;
        const standings = data.standings || [];

        return (
          <div key={year} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            {/* Champion card */}
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-gradient-to-br from-primary to-secondary rounded-lg px-3 py-1 flex-shrink-0">
                  <span className="text-accent font-black text-xl">{year}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <Trophy className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-card-foreground truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {data.winner}
                      </p>
                      {standings[0] && (
                        <p className="text-xs text-muted-foreground">{standings[0].golferA} + {standings[0].golferB}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-2xl font-black ${scoreColor(data.winningScore)}`}>
                    {formatScore(data.winningScore)}
                  </div>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{data.entries}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expand toggle for full standings */}
            {standings.length > 1 && (
              <>
                <button
                  onClick={() => setExpandedYear(isExpanded ? null : year)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 border-t border-border bg-muted/30 hover:bg-muted/50 transition text-xs font-semibold text-muted-foreground"
                >
                  {isExpanded ? 'Hide' : 'View'} Full Standings
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Column headers */}
                    <div className="grid grid-cols-[28px_1fr_60px_60px_52px] gap-1 px-3 py-1.5 bg-primary/5 text-[9px] font-bold text-primary uppercase tracking-wider">
                      <span className="text-center">#</span>
                      <span>Name</span>
                      <span className="text-center">A</span>
                      <span className="text-center">B</span>
                      <span className="text-center">TOT</span>
                    </div>
                    {standings.map((s, i) => (
                      <div
                        key={`${year}-${i}`}
                        className={`grid grid-cols-[28px_1fr_60px_60px_52px] gap-1 px-3 py-1.5 border-b border-border/50 ${
                          i === 0 ? 'bg-accent/5' : ''
                        }`}
                      >
                        <span className={`text-center text-xs font-bold tabular-nums ${i === 0 ? 'text-accent' : 'text-muted-foreground'}`}>
                          {s.rank}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{s.name}</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-[10px] font-semibold ${scoreColor(s.scoreA)}`}>{formatScore(s.scoreA)}</p>
                          <p className="text-[8px] text-muted-foreground/60 truncate">{s.golferA}</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-[10px] font-semibold ${scoreColor(s.scoreB)}`}>{formatScore(s.scoreB)}</p>
                          <p className="text-[8px] text-muted-foreground/60 truncate">{s.golferB}</p>
                        </div>
                        <span className={`text-center text-xs font-black tabular-nums ${scoreColor(s.total)}`}>
                          {formatScore(s.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}