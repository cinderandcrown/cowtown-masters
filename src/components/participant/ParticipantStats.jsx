import React from 'react';

export default function ParticipantStats({ history }) {
  if (!history.length) return null;

  const wins = history.filter((r) => r.isWinner).length;
  const bestFinish = Math.min(...history.map((r) => r.rank));
  const bestScore = Math.min(...history.map((r) => r.total));
  const avgScore = (history.reduce((sum, r) => sum + r.total, 0) / history.length).toFixed(1);

  const stats = [
    { label: 'Years Played', value: history.length },
    { label: 'Wins', value: wins },
    { label: 'Best Finish', value: bestFinish === 1 ? '1st' : bestFinish === 2 ? '2nd' : bestFinish === 3 ? '3rd' : `${bestFinish}th` },
    { label: 'Best Score', value: bestScore === 0 ? 'E' : bestScore > 0 ? `+${bestScore}` : `${bestScore}` },
  ];

  return (
    <div className="bg-gradient-to-br from-secondary to-primary rounded-xl p-4 border border-accent/30">
      <h3 className="text-sm font-bold text-accent tracking-widest uppercase mb-3">Career Stats</h3>
      <div className="grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-xl font-black text-primary-foreground">{s.value}</div>
            <div className="text-[9px] text-accent tracking-wider font-semibold mt-0.5">{s.label.toUpperCase()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}