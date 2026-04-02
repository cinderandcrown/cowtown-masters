import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { formatScore, scoreColor } from '@/lib/scoreUtils';
import { TrendingDown, TrendingUp, Minus, BarChart3, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import GolferAnalyticsTab from './GolferAnalyticsTab';

function RoundRow({ label, scoreToPar, strokes, isComplete }) {
  return (
    <div className={`flex items-center justify-between py-2.5 px-3 ${isComplete ? '' : 'opacity-50'}`}>
      <span className="text-xs font-bold text-muted-foreground w-10">{label}</span>
      <div className="flex-1 flex items-center gap-3 justify-end">
        {strokes != null && (
          <span className="text-xs text-muted-foreground tabular-nums">{strokes} strokes</span>
        )}
        <span className={`text-sm font-black tabular-nums w-12 text-right ${scoreColor(scoreToPar)}`}>
          {formatScore(scoreToPar)}
        </span>
      </div>
    </div>
  );
}

function ProgressBar({ scoreToPar }) {
  if (scoreToPar == null) return null;
  // Map score to a visual bar: -10 to +10 range
  const clamped = Math.max(-10, Math.min(10, scoreToPar));
  const pct = ((clamped + 10) / 20) * 100;
  const isUnder = scoreToPar < 0;
  const isOver = scoreToPar > 0;

  return (
    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-accent/50 z-10" />
      <div
        className={`absolute top-0 bottom-0 rounded-full transition-all ${isUnder ? 'bg-red-500' : isOver ? 'bg-primary' : 'bg-accent'}`}
        style={{
          left: isUnder ? `${pct}%` : '50%',
          width: isUnder ? `${50 - pct}%` : `${pct - 50}%`,
        }}
      />
    </div>
  );
}

export default function GolferDetailModal({ golfer, open, onOpenChange }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!golfer) return null;

  const rounds = [
    { label: 'R1', score: golfer.round_1, strokes: golfer.actual_scores?.[0] },
    { label: 'R2', score: golfer.round_2, strokes: golfer.actual_scores?.[1] },
    { label: 'R3', score: golfer.round_3, strokes: golfer.actual_scores?.[2] },
    { label: 'R4', score: golfer.round_4, strokes: golfer.actual_scores?.[3] },
  ];

  // Cumulative score per round
  const cumulative = rounds.reduce((acc, r, i) => {
    const prev = i > 0 ? acc[i - 1] : 0;
    acc.push(prev + (r.score || 0));
    return acc;
  }, []);

  const completedRounds = rounds.filter(r => r.score != null).length;
  const trend = completedRounds >= 2
    ? (rounds[completedRounds - 1].score || 0) - (rounds[completedRounds - 2].score || 0)
    : null;

  const TrendIcon = trend != null
    ? trend < 0 ? TrendingDown : trend > 0 ? TrendingUp : Minus
    : null;

  const statusLabel = {
    active: null,
    cut: 'MISSED CUT',
    withdrawn: 'WITHDRAWN',
    disqualified: 'DISQUALIFIED',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card rounded-2xl max-w-sm w-full max-h-[85vh] overflow-y-auto p-0" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{golfer.name} Details</DialogTitle>
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-secondary to-primary p-5 pt-8 relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-30" />
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${golfer.group === 'A' ? 'text-accent' : 'text-accent/70'}`}>
                  Group {golfer.group} · {golfer.betting_odds || '—'}
                </p>
                <h2 className="text-2xl font-bold text-primary-foreground leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {golfer.name}
                </h2>
                {golfer.position && (
                  <p className="text-xs text-primary-foreground/60 mt-1">
                    Position: {golfer.position} {golfer.thru ? `· Thru ${golfer.thru}` : ''}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className={`text-4xl font-black tabular-nums ${golfer.score_to_par < 0 ? 'text-red-400' : golfer.score_to_par > 0 ? 'text-primary-foreground' : 'text-accent'}`}>
                  {formatScore(golfer.score_to_par)}
                </div>
                <p className="text-[10px] text-primary-foreground/50 mt-0.5">TO PAR</p>
              </div>
            </div>

            {/* Status badge */}
            {golfer.status !== 'active' && statusLabel[golfer.status] && (
              <div className="inline-block bg-destructive/20 text-destructive-foreground text-[10px] font-black tracking-widest px-3 py-1 rounded-full border border-destructive/30 mb-2">
                {statusLabel[golfer.status]}
              </div>
            )}

            {/* Progress bar */}
            <ProgressBar scoreToPar={golfer.score_to_par} />
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 pt-3 flex gap-2 border-b border-border pb-3">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
              activeTab === 'overview'
                ? 'bg-primary text-white'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
              activeTab === 'analytics'
                ? 'bg-primary text-white'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Analytics
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'analytics' ? (
          <div className="p-4">
            <GolferAnalyticsTab golfer={golfer} />
          </div>
        ) : (
        <div className="p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black text-primary tracking-widest uppercase">Round Scores</h3>
              {TrendIcon && (
                <div className={`flex items-center gap-1 text-[10px] font-bold ${trend < 0 ? 'text-red-600' : trend > 0 ? 'text-foreground' : 'text-accent'}`}>
                  <TrendIcon className="w-3 h-3" />
                  {trend < 0 ? 'Improving' : trend > 0 ? 'Fading' : 'Steady'}
                </div>
              )}
            </div>

            <div className="bg-muted/30 rounded-xl border border-border overflow-hidden divide-y divide-border">
              {rounds.map((r, i) => (
                <RoundRow
                  key={r.label}
                  label={r.label}
                  scoreToPar={r.score}
                  strokes={r.strokes}
                  isComplete={r.score != null}
                />
              ))}
            </div>
          </div>

          {/* Cumulative Progress */}
          {completedRounds > 0 && (
            <div>
              <h3 className="text-xs font-black text-primary tracking-widest uppercase mb-2">Cumulative Progress</h3>
              <div className="grid grid-cols-4 gap-2">
                {rounds.map((r, i) => (
                  <div
                    key={r.label}
                    className={`text-center p-2 rounded-lg border ${r.score != null ? 'bg-card border-border' : 'bg-muted/20 border-transparent opacity-40'}`}
                  >
                    <div className="text-[10px] text-muted-foreground mb-1">{r.label}</div>
                    <div className={`text-lg font-black tabular-nums ${scoreColor(cumulative[i])}`}>
                      {r.score != null ? formatScore(cumulative[i]) : '–'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* World Ranking + Odds */}
          <div className="grid grid-cols-2 gap-2">
            {golfer.world_ranking && (
              <div className="bg-primary/5 rounded-lg p-3 border border-primary/10 text-center">
                <div className="text-[10px] text-primary font-bold tracking-widest uppercase mb-1">World Rank</div>
                <div className="text-xl font-black text-foreground">#{golfer.world_ranking}</div>
              </div>
            )}
            {golfer.betting_odds && (
              <div className="bg-accent/5 rounded-lg p-3 border border-accent/10 text-center">
                <div className="text-[10px] text-accent font-bold tracking-widest uppercase mb-1">Odds</div>
                <div className="text-xl font-black text-foreground">{golfer.betting_odds}</div>
              </div>
            )}
          </div>

          {/* Round Score Chart */}
          {completedRounds > 0 && (
            <div>
              <h3 className="text-xs font-black text-primary tracking-widest uppercase mb-2">Round Performance</h3>
              <div className="bg-muted/30 rounded-xl border border-border p-2">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={rounds.filter(r => r.score != null).map(r => ({ round: r.label, score: r.score }))} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="round" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '6px', fontSize: '12px', color: 'hsl(var(--foreground))' }}
                      formatter={(value) => [formatScore(value), 'To Par']}
                    />
                    <Bar dataKey="score" fill="hsl(162, 100%, 20%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Stats row */}
          {completedRounds > 0 && (() => {
            const roundScores = rounds.filter(r => r.score != null).map(r => r.score);
            const avg = (roundScores.reduce((a, b) => a + b, 0) / roundScores.length).toFixed(1);
            const best = Math.min(...roundScores);
            const worst = Math.max(...roundScores);
            return (
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-primary/5 rounded-lg p-2.5 border border-primary/10 text-center">
                  <div className="text-[10px] text-muted-foreground font-bold mb-0.5">AVG</div>
                  <div className="text-lg font-black text-primary">{avg}</div>
                </div>
                <div className="bg-accent/5 rounded-lg p-2.5 border border-accent/10 text-center">
                  <div className="text-[10px] text-muted-foreground font-bold mb-0.5">BEST</div>
                  <div className="text-lg font-black text-red-600">{formatScore(best)}</div>
                </div>
                <div className="bg-destructive/5 rounded-lg p-2.5 border border-destructive/10 text-center">
                  <div className="text-[10px] text-muted-foreground font-bold mb-0.5">WORST</div>
                  <div className="text-lg font-black text-primary">{formatScore(worst)}</div>
                </div>
              </div>
            );
          })()}
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}