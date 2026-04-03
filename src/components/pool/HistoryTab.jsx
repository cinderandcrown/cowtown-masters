import React from 'react';
import { Trophy, Calendar, Hash, TrendingUp } from 'lucide-react';
import { POOL_HISTORY } from '@/lib/poolHistoryData';

const HISTORY = {};
for (const [year, data] of Object.entries(POOL_HISTORY)) {
  const winner = data.standings[0];
  HISTORY[year] = { winner: data.winner, score: data.winningScore, golferA: winner?.golferA, golferB: winner?.golferB, entries: data.entries };
}

const formatScore = (s) => (s === 0 ? 'E' : s > 0 ? `+${s}` : `${s}`);
const scoreColor = (s) => {
  if (s < 0) return 'text-red-600';
  if (s > 0) return 'text-primary';
  return 'text-accent';
};

export default function HistoryTab() {
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

      {Object.entries(HISTORY)
        .sort((a, b) => b[0] - a[0])
        .map(([year, data]) => (
          <div key={year} className="bg-card rounded-lg p-4 border border-border shadow-sm hover:shadow-md transition">
            <div className="flex items-start gap-3">
              <div className="bg-gradient-to-br from-primary to-secondary rounded-lg px-3 py-1">
                <span className="text-accent font-black text-xl">{year}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-start gap-2">
                  <Trophy className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-lg font-bold text-card-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {data.winner}
                    </span>
                    <p className="text-xs text-muted-foreground">{data.golferA} + {data.golferB}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-black ${scoreColor(data.score)}`}>{formatScore(data.score)}</div>
                <p className="text-xs text-muted-foreground mt-1">{data.entries} entries</p>
              </div>
            </div>
          </div>
        ))}

      {/* Pool Stats */}
      <div className="bg-gradient-to-br from-secondary to-primary rounded-xl p-4 border border-accent/30 mt-6">
        <h3 className="text-lg font-bold text-primary-foreground mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
          Pool Legacy
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Years Running', value: '5+', Icon: Calendar },
            { label: 'Total Entries', value: '130', Icon: Hash },
            { label: 'Best Score', value: '-15', Icon: TrendingUp },
            { label: 'Avg Pool Size', value: '26', Icon: Trophy },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-lg p-3 text-center border border-white/10">
              <s.Icon className="w-4 h-4 text-accent mx-auto mb-1" />
              <div className="text-2xl font-black text-primary-foreground">{s.value}</div>
              <div className="text-xs text-accent tracking-widest font-semibold mt-1">{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}