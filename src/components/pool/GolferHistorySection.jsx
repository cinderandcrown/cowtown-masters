import React from 'react';
import { Trophy, Award, Scissors, TrendingUp, Calendar, Target } from 'lucide-react';
import { formatScore, scoreColor } from '@/lib/scoreUtils';

export default function GolferHistorySection({ history }) {
  if (!history || history.appearances === 0) {
    return (
      <div className="text-center py-6">
        <Calendar className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm font-semibold text-muted-foreground">Masters Debut</p>
        <p className="text-xs text-muted-foreground/70">No prior Masters history</p>
      </div>
    );
  }

  const {
    appearances, cuts_made, wins, top5s, top10s, top25s,
    best_finish, best_finish_year, avg_finish, avg_score,
    recent_results = [],
  } = history;

  const cutPct = appearances > 0 ? Math.round((cuts_made / appearances) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Key Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-primary/5 rounded-lg p-2.5 border border-primary/10 text-center">
          <div className="text-[10px] text-primary font-bold tracking-widest uppercase mb-0.5">Starts</div>
          <div className="text-xl font-black text-foreground">{appearances}</div>
        </div>
        <div className="bg-accent/5 rounded-lg p-2.5 border border-accent/10 text-center">
          <div className="text-[10px] text-accent font-bold tracking-widest uppercase mb-0.5">Cuts</div>
          <div className="text-xl font-black text-foreground">{cuts_made}</div>
          <div className="text-[9px] text-muted-foreground">{cutPct}%</div>
        </div>
        <div className="bg-primary/5 rounded-lg p-2.5 border border-primary/10 text-center">
          <div className="text-[10px] text-primary font-bold tracking-widest uppercase mb-0.5">Avg Fin</div>
          <div className="text-xl font-black text-foreground">{avg_finish ? avg_finish.toFixed(0) : '—'}</div>
        </div>
      </div>

      {/* Best Finish + Wins */}
      {best_finish && (
        <div className="flex items-center gap-3 bg-gradient-to-r from-accent/10 to-accent/5 rounded-xl px-4 py-3 border border-accent/20">
          <Trophy className="w-5 h-5 text-accent flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[10px] font-bold text-accent tracking-widest uppercase">Best Finish</p>
            <p className="text-lg font-black text-foreground">{best_finish}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{best_finish_year}</p>
            {wins > 0 && (
              <p className="text-xs font-bold text-accent">{wins} 🏆 {wins > 1 ? 'wins' : 'win'}</p>
            )}
          </div>
        </div>
      )}

      {/* Top Finishes Breakdown */}
      <div className="bg-muted/30 rounded-xl border border-border overflow-hidden">
        <div className="px-3 py-2 border-b border-border bg-primary/5">
          <h4 className="text-[10px] font-black text-primary tracking-widest uppercase flex items-center gap-1.5">
            <Award className="w-3 h-3" />
            Finish Breakdown
          </h4>
        </div>
        <div className="grid grid-cols-4 divide-x divide-border">
          {[
            { label: 'Wins', value: wins, color: 'text-accent' },
            { label: 'Top 5', value: top5s, color: 'text-primary' },
            { label: 'Top 10', value: top10s, color: 'text-foreground' },
            { label: 'Top 25', value: top25s, color: 'text-muted-foreground' },
          ].map((stat) => (
            <div key={stat.label} className="text-center py-2.5">
              <div className={`text-lg font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-[9px] text-muted-foreground font-bold uppercase">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Average Score */}
      {avg_score && (
        <div className="flex items-center gap-3 bg-muted/20 rounded-lg px-3 py-2.5 border border-border">
          <Target className="w-4 h-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Avg Score at Augusta</p>
          </div>
          <span className="text-lg font-black text-foreground tabular-nums">{avg_score.toFixed(1)}</span>
        </div>
      )}

      {/* Recent Results */}
      {recent_results.length > 0 && (
        <div>
          <h4 className="text-[10px] font-black text-primary tracking-widest uppercase mb-2 flex items-center gap-1.5 px-1">
            <TrendingUp className="w-3 h-3" />
            Recent Masters Results
          </h4>
          <div className="space-y-1.5">
            {recent_results.map((r, i) => (
              <div
                key={r.year}
                className="flex items-center justify-between bg-card rounded-lg px-3 py-2 border border-border animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-muted-foreground tabular-nums w-10">{r.year}</span>
                  <span className={`text-sm font-bold ${r.finish ? 'text-foreground' : 'text-destructive/70'}`}>
                    {r.finish || 'MC'}
                  </span>
                </div>
                {r.score != null ? (
                  <span className={`text-sm font-black tabular-nums ${scoreColor(r.score)}`}>
                    {formatScore(r.score)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}