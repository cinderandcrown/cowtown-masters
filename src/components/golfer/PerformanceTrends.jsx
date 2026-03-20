import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formatScore = (s) => (s === 0 ? 'E' : s > 0 ? `+${s}` : `${s}`);

export default function PerformanceTrends({ golfer }) {
  // Round-by-round comparison data
  const data = [
    { round: 'R1', score: golfer.round_1 || 0 },
    { round: 'R2', score: golfer.round_2 || 0 },
    { round: 'R3', score: golfer.round_3 || 0 },
    { round: 'R4', score: golfer.round_4 || 0 },
  ];

  // Calculate statistics
  const roundScores = [golfer.round_1, golfer.round_2, golfer.round_3, golfer.round_4].filter((s) => s !== 0);
  const avgRound = roundScores.length > 0 ? (roundScores.reduce((a, b) => a + b, 0) / roundScores.length).toFixed(1) : '—';
  const bestRound = roundScores.length > 0 ? Math.min(...roundScores) : '—';
  const worstRound = roundScores.length > 0 ? Math.max(...roundScores) : '—';

  return (
    <div className="space-y-4">
      {/* Statistics Grid */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
          <p className="text-xs text-muted-foreground font-semibold mb-1">AVG ROUND</p>
          <p className={`text-2xl font-black ${avgRound === '—' ? 'text-muted-foreground' : 'text-primary'}`}>
            {avgRound}
          </p>
        </div>
        <div className="bg-accent/5 rounded-lg p-3 border border-accent/10">
          <p className="text-xs text-muted-foreground font-semibold mb-1">BEST</p>
          <p className={`text-2xl font-black ${bestRound === '—' ? 'text-muted-foreground' : 'text-red-600'}`}>
            {formatScore(bestRound)}
          </p>
        </div>
        <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/10">
          <p className="text-xs text-muted-foreground font-semibold mb-1">WORST</p>
          <p className={`text-2xl font-black ${worstRound === '—' ? 'text-muted-foreground' : 'text-primary'}`}>
            {formatScore(worstRound)}
          </p>
        </div>
      </div>

      {/* Chart */}
      {roundScores.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="round"
              stroke="#999"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#999"
              style={{ fontSize: '12px' }}
              label={{ value: 'Score to Par', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '8px',
              }}
              formatter={(value) => formatScore(value)}
              labelFormatter={(label) => `${label}`}
            />
            <Bar
              dataKey="score"
              fill="hsl(162, 100%, 20%)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="w-full h-64 flex items-center justify-center bg-primary/5 rounded-lg border border-primary/10">
          <p className="text-muted-foreground text-sm">Waiting for round data...</p>
        </div>
      )}
    </div>
  );
}