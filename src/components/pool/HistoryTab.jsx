import React from 'react';
import { Trophy, TrendingUp, Hash, Calendar } from 'lucide-react';
import { POOL_HISTORY } from '@/lib/poolHistoryData';

const HISTORY = {};
for (const [year, data] of Object.entries(POOL_HISTORY)) {
  const winner = data.standings[0];
  HISTORY[year] = { winner: data.winner, score: data.winningScore, golferA: winner?.golferA, golferB: winner?.golferB, entries: data.entries };
}

const formatScore = (s) => (s === 0 ? 'E' : s > 0 ? `+${s}` : `${s}`);
const scoreColor = (s) => {
  if (s < 0) return 'text-red-600';
  if (s > 0) return 'text-foreground';
  return 'text-accent';
};

export default function HistoryTab() {
  const years = Object.entries(HISTORY).sort((a, b) => b[0] - a[0]);

  return (
    <div className="px-3 pt-3 pb-0 space-y-3">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0a3d0a] via-secondary to-primary rounded-xl p-5 border border-accent/30 text-center relative overflow-hidden">
        <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-20" />
        <div className="relative">
          <Trophy className="w-8 h-8 text-accent mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Champions Wall
          </h2>
          <p className="text-xs text-accent/70 mt-1">The legends of Cowtown Masters</p>
        </div>
      </div>

      {/* Champions */}
      {years.map(([year, data], i) => (
        <div
          key={year}
          className="animate-fade-in-up bg-card rounded-xl p-4 border border-border hover:border-primary/30 hover:shadow-sm transition-all"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-start gap-3">
            <div className="bg-gradient-to-br from-primary to-secondary rounded-lg px-2.5 py-1.5 flex-shrink-0">
              <span className="text-accent font-black text-lg">{year}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Trophy className="w-4 h-4 text-accent flex-shrink-0" />
                <span className="text-base font-bold text-foreground truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {data.winner}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">{data.golferA} + {data.golferB}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{data.entries} entries</span>
              </div>
            </div>
            <div className={`text-2xl font-black tabular-nums ${scoreColor(data.score)}`}>
              {formatScore(data.score)}
            </div>
          </div>
        </div>
      ))}

      {/* Pool Stats */}
      <div className="bg-gradient-to-br from-[#0a3d0a] to-primary rounded-xl p-4 border border-accent/30 relative overflow-hidden">
        <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-15" />
        <div className="relative">
          <h3 className="text-sm font-bold text-primary-foreground mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Pool Legacy
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Years', value: '5+', Icon: Calendar },
              { label: 'Entries', value: '130', Icon: Hash },
              { label: 'Best', value: '-15', Icon: TrendingUp },
              { label: 'Avg Size', value: '26', Icon: Trophy },
            ].map((s) => (
              <div key={s.label} className="bg-white/8 rounded-lg p-2.5 text-center border border-white/10">
                <div className="text-xl font-black text-primary-foreground tabular-nums">{s.value}</div>
                <div className="text-[8px] text-accent tracking-widest font-bold mt-0.5">{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
