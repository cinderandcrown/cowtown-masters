import React from 'react';
import { formatScore, scoreColor } from '@/lib/scoreUtils';
import { Flame, Snowflake, TrendingDown, TrendingUp, Minus, Target, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine, Area, AreaChart } from 'recharts';



function HotColdIndicator({ golfer }) {
  const rounds = [golfer.round_1, golfer.round_2, golfer.round_3, golfer.round_4].filter(r => r != null);
  if (rounds.length === 0) return null;

  // Calculate momentum from recent rounds
  const recentRounds = rounds.slice(-3);
  const avg = recentRounds.reduce((a, b) => a + b, 0) / recentRounds.length;

  // Trend direction
  let trendDir = 0;
  if (recentRounds.length >= 2) {
    const last = recentRounds[recentRounds.length - 1];
    const prev = recentRounds[recentRounds.length - 2];
    trendDir = prev - last; // positive = improving (lower is better in golf)
  }

  // Composite score: lower avg + improving trend = hotter
  const heatScore = (-avg * 2) + (trendDir * 3);

  let status, label, color, bgColor, Icon, description;

  if (heatScore >= 6) {
    status = 'blazing'; label = 'BLAZING HOT'; color = 'text-red-500'; bgColor = 'bg-red-500/10 border-red-500/30'; Icon = Flame;
    description = 'On fire — elite scoring with improving trajectory';
  } else if (heatScore >= 2) {
    status = 'hot'; label = 'HOT'; color = 'text-orange-500'; bgColor = 'bg-orange-500/10 border-orange-500/30'; Icon = Flame;
    description = 'Playing well — solid scores and positive momentum';
  } else if (heatScore >= -2) {
    status = 'warm'; label = 'STEADY'; color = 'text-accent'; bgColor = 'bg-accent/10 border-accent/30'; Icon = Minus;
    description = 'Consistent — holding form with stable scoring';
  } else if (heatScore >= -6) {
    status = 'cool'; label = 'COOL'; color = 'text-blue-400'; bgColor = 'bg-blue-500/10 border-blue-500/30'; Icon = Snowflake;
    description = 'Struggling — scores trending in the wrong direction';
  } else {
    status = 'cold'; label = 'ICE COLD'; color = 'text-blue-600'; bgColor = 'bg-blue-600/10 border-blue-600/30'; Icon = Snowflake;
    description = 'In trouble — high scores with declining trajectory';
  }

  // Heat bar segments
  const segments = 5;
  const filled = status === 'blazing' ? 5 : status === 'hot' ? 4 : status === 'warm' ? 3 : status === 'cool' ? 2 : 1;

  return (
    <div className={`rounded-xl border p-3.5 ${bgColor}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <span className={`text-xs font-black tracking-widest uppercase ${color}`}>{label}</span>
        </div>
        <span className="text-[10px] text-muted-foreground font-bold">
          Based on {recentRounds.length} round{recentRounds.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Heat bar */}
      <div className="flex gap-1 mb-2">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-all ${
              i < filled
                ? status === 'blazing' || status === 'hot' ? 'bg-gradient-to-r from-orange-400 to-red-500'
                  : status === 'warm' ? 'bg-accent'
                  : 'bg-blue-500'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>

      {/* Detailed breakdown */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="text-center">
          <p className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase">Avg</p>
          <p className={`text-base font-black tabular-nums ${scoreColor(avg)}`}>{avg > 0 ? '+' : ''}{avg.toFixed(1)}</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase">Trend</p>
          <div className="flex items-center justify-center gap-1">
            {trendDir > 0 ? <TrendingDown className="w-3 h-3 text-red-600" /> : trendDir < 0 ? <TrendingUp className="w-3 h-3 text-foreground" /> : <Minus className="w-3 h-3 text-accent" />}
            <span className={`text-base font-black ${trendDir > 0 ? 'text-red-600' : trendDir < 0 ? 'text-foreground' : 'text-accent'}`}>
              {trendDir > 0 ? '↑' : trendDir < 0 ? '↓' : '—'}
            </span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase">Heat</p>
          <p className={`text-base font-black tabular-nums ${color}`}>{heatScore.toFixed(0)}</p>
        </div>
      </div>
    </div>
  );
}

function ScoringTrendChart({ golfer }) {
  const rounds = [
    { round: 'R1', score: golfer.round_1 },
    { round: 'R2', score: golfer.round_2 },
    { round: 'R3', score: golfer.round_3 },
    { round: 'R4', score: golfer.round_4 },
  ].filter(r => r.score != null);

  if (rounds.length === 0) return null;

  // Add cumulative data
  let cum = 0;
  const data = rounds.map(r => {
    cum += r.score;
    return { ...r, cumulative: cum };
  });

  return (
    <div>
      <h4 className="text-xs font-black text-primary tracking-widest uppercase mb-2 flex items-center gap-1.5">
        <BarChart3 className="w-3.5 h-3.5" /> Scoring Trend
      </h4>
      <div className="bg-muted/30 rounded-xl border border-border p-2">
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(162, 100%, 20%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(162, 100%, 20%)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="round" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} />
            <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} />
            <ReferenceLine y={0} stroke="hsl(var(--accent))" strokeDasharray="3 3" strokeWidth={1.5} />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '6px', fontSize: '11px', color: 'hsl(var(--foreground))' }}
              formatter={(value, name) => [formatScore(value), name === 'score' ? 'Round' : 'Cumulative']}
            />
            <Area type="monotone" dataKey="cumulative" stroke="hsl(162, 100%, 20%)" fill="url(#scoreGrad)" strokeWidth={2} />
            <Line type="monotone" dataKey="score" stroke="hsl(43, 100%, 41%)" strokeWidth={2.5} dot={{ fill: 'hsl(43, 100%, 41%)', r: 4, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded bg-accent" />
            <span className="text-[9px] text-muted-foreground font-bold">Round Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded bg-primary" />
            <span className="text-[9px] text-muted-foreground font-bold">Cumulative</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoricalPerformance({ golfer }) {
  const mh = golfer.masters_history;

  // Build chart data from the entity's masters_history.recent_results
  if (!mh || !mh.recent_results || mh.recent_results.length === 0) {
    return (
      <div className="bg-muted/30 rounded-xl border border-border p-4 text-center">
        <Target className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No historical Masters data available for this golfer.</p>
      </div>
    );
  }

  const history = [...mh.recent_results].sort((a, b) => a.year - b.year);

  const chartData = history.filter(h => h.score != null).map(h => ({
    year: h.year.toString(),
    score: h.score,
  }));

  const bestScore = mh.best_finish;
  const avgScore = mh.avg_score ? mh.avg_score - 72 : null; // convert stroke avg to relative-to-par

  return (
    <div>
      <h4 className="text-xs font-black text-primary tracking-widest uppercase mb-2 flex items-center gap-1.5">
        <Target className="w-3.5 h-3.5" /> Masters History
      </h4>

      {/* History chart */}
      {chartData.length > 1 && (
        <div className="bg-muted/30 rounded-xl border border-border p-2 mb-3">
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} />
              <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} reversed />
              <ReferenceLine y={0} stroke="hsl(var(--accent))" strokeDasharray="3 3" />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '6px', fontSize: '11px', color: 'hsl(var(--foreground))' }}
                formatter={(value) => [formatScore(value), 'Score']}
              />
              <Line type="monotone" dataKey="score" stroke="hsl(43, 100%, 41%)" strokeWidth={2.5} dot={{ fill: 'hsl(43, 100%, 41%)', r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Year-by-year results */}
      <div className="space-y-1.5">
        {history.map((h) => (
          <div key={h.year} className="flex items-center justify-between bg-card rounded-lg px-3 py-2 border border-border">
            <span className="text-xs font-bold text-foreground">{h.year}</span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground font-semibold">
                {h.finish === '1st' ? '🏆 Winner' : h.finish ? `Pos: ${h.finish}` : 'MC'}
              </span>
              <span className={`text-sm font-black tabular-nums ${scoreColor(h.score)}`}>
                {h.score != null ? formatScore(h.score) : 'CUT'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="bg-primary/5 rounded-lg p-2 border border-primary/10 text-center">
          <p className="text-[9px] font-bold text-muted-foreground tracking-widest">APPEARANCES</p>
          <p className="text-lg font-black text-foreground">{mh.appearances}</p>
        </div>
        <div className="bg-accent/5 rounded-lg p-2 border border-accent/10 text-center">
          <p className="text-[9px] font-bold text-muted-foreground tracking-widest">BEST</p>
          <p className="text-lg font-black text-accent">
            {bestScore || '—'}
          </p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2 border border-border text-center">
          <p className="text-[9px] font-bold text-muted-foreground tracking-widest">AVG SCORE</p>
          <p className="text-lg font-black text-foreground">
            {mh.avg_score ? mh.avg_score.toFixed(1) : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function GolferAnalyticsTab({ golfer }) {
  if (!golfer) return null;

  return (
    <div className="space-y-4">
      <HotColdIndicator golfer={golfer} />
      <ScoringTrendChart golfer={golfer} />
      <HistoricalPerformance golfer={golfer} />
    </div>
  );
}