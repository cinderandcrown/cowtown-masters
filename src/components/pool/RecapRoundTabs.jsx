import React from 'react';
import { Lock } from 'lucide-react';

const ROUNDS = [
  { id: 1, label: 'R1', date: '2026-04-09' },
  { id: 2, label: 'R2', date: '2026-04-10' },
  { id: 3, label: 'R3', date: '2026-04-11' },
  { id: 4, label: 'R4', date: '2026-04-12' },
];

export default function RecapRoundTabs({ activeRound, onRoundChange }) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="flex gap-1.5">
      {ROUNDS.map(r => {
        const isFuture = r.date > todayStr;
        const isActive = activeRound === r.id;
        return (
          <button
            key={r.id}
            onClick={() => !isFuture && onRoundChange(r.id)}
            disabled={isFuture}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : isFuture
                ? 'bg-muted/50 text-muted-foreground/40 cursor-not-allowed'
                : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
            }`}
          >
            {r.label}
            {isFuture && <Lock className="w-3 h-3" />}
          </button>
        );
      })}
    </div>
  );
}