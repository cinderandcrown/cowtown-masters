import React from 'react';
import { Trophy } from 'lucide-react';

const HISTORY = {
  2025: { winner: 'Clay Coiller', score: -15, golferA: 'Ludvig Åberg', golferB: 'Patrick Reed', entries: 23 },
  2024: { winner: 'Will H.', score: -5, golferA: 'Ludvig Åberg', golferB: 'Byeong Hun An', entries: 32 },
  2022: { winner: 'TBD', score: 0, golferA: 'N/A', golferB: 'N/A', entries: 27 },
};

const formatScore = (s) => (s === 0 ? 'E' : s > 0 ? `+${s}` : `${s}`);
const scoreColor = (s) => {
  if (s < 0) return 'text-red-600';
  if (s > 0) return 'text-primary';
  return 'text-accent';
};

export default function HistoryTab() {
  return (
    <div className="px-3 pt-3 pb-6 space-y-3">
      <h2 className="text-2xl font-bold text-foreground text-center mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
        Champions Wall
      </h2>

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
                    <p className="text-lg font-bold text-card-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {data.winner}
                    </p>
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
          📊 Pool Stats
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Years Running', value: '3+' },
            { label: 'Total Entries', value: '82' },
            { label: 'Best Score', value: '-15' },
            { label: 'Avg Pool Size', value: '27' },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-lg p-3 text-center border border-white/10">
              <div className="text-2xl font-black text-primary-foreground">{s.value}</div>
              <div className="text-xs text-accent tracking-widest font-semibold mt-1">{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}