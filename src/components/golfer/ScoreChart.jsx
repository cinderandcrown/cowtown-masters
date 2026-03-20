import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatScore = (s) => (s === 0 ? 'E' : s > 0 ? `+${s}` : `${s}`);

export default function ScoreChart({ golfer }) {
  // Generate cumulative score data across rounds
  const data = [];
  let cumulativeScore = 0;

  const rounds = [
    { label: 'R1', score: golfer.round_1 },
    { label: 'R2', score: golfer.round_2 },
    { label: 'R3', score: golfer.round_3 },
    { label: 'R4', score: golfer.round_4 },
  ];

  rounds.forEach((round, idx) => {
    if (round.score !== 0 || idx === 0) {
      cumulativeScore += round.score;
      data.push({
        round: round.label,
        cumulative: cumulativeScore,
        roundScore: round.score,
      });
    }
  });

  // If no data, show placeholder
  if (data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-primary/5 rounded-lg border border-primary/10">
        <p className="text-muted-foreground text-sm">No round data available yet</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
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
          formatter={(value) => [formatScore(value), 'Cumulative']}
          labelFormatter={(label) => `Round: ${label}`}
        />
        <Line
          type="monotone"
          dataKey="cumulative"
          stroke="hsl(162, 100%, 20%)"
          strokeWidth={3}
          dot={{ fill: 'hsl(43, 100%, 41%)', r: 6 }}
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}