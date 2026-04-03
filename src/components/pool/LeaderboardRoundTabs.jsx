import React from 'react';

const ROUNDS = [
  { id: 'total', label: 'Total' },
  { id: 'r1', label: 'R1' },
  { id: 'r2', label: 'R2' },
  { id: 'r3', label: 'R3' },
  { id: 'r4', label: 'R4' },
];

export default function LeaderboardRoundTabs({ activeRound, onRoundChange }) {
  // Determine current active round based on day of week (Thu=R1, Fri=R2, Sat=R3, Sun=R4)
  const day = new Date().getDay();
  const liveRound = day === 4 ? 'r1' : day === 5 ? 'r2' : day === 6 ? 'r3' : day === 0 ? 'r4' : null;

  return (
    <div className="flex gap-1 bg-primary/5 rounded-lg p-1 border border-primary/10">
      {ROUNDS.map((r) => (
        <button
          key={r.id}
          onClick={() => onRoundChange(r.id)}
          className={`flex-1 py-1.5 rounded-md text-[10px] font-bold tracking-wide uppercase transition-all relative ${
            activeRound === r.id
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {r.label}
          {liveRound === r.id && activeRound !== r.id && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>
      ))}
    </div>
  );
}