import React, { useState, useEffect, useRef } from 'react';
import { firePop } from '@/lib/useConfetti';
import { hapticSuccess } from '@/lib/haptics';

// Casino-style score change overlay — flashes briefly when scores update
export default function ScoreFlashOverlay({ poolId, golfers }) {
  const [flash, setFlash] = useState(null);
  const prevScoresRef = React.useRef({});

  useEffect(() => {
    if (!golfers || golfers.length === 0) return;

    const prevScores = prevScoresRef.current;
    const newScores = {};
    let bestChange = null;

    for (const g of golfers) {
      newScores[g.id] = g.score_to_par || 0;
      const prev = prevScores[g.id];
      if (prev !== undefined && prev !== newScores[g.id]) {
        const diff = newScores[g.id] - prev;
        if (diff < 0 && (!bestChange || diff < bestChange.diff)) {
          bestChange = { name: g.name, diff, newScore: newScores[g.id] };
        }
      }
    }

    prevScoresRef.current = newScores;

    if (bestChange && bestChange.diff <= -1) {
      const label = bestChange.diff <= -2 ? '🦅 EAGLE!' : '🐦 BIRDIE!';
      setFlash({ label, name: bestChange.name, score: bestChange.newScore });
      hapticSuccess();
      if (bestChange.diff <= -2) firePop();
      setTimeout(() => setFlash(null), 3000);
    }
  }, [golfers]);

  if (!flash) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-up pointer-events-none">
      <div className="bg-gradient-to-r from-accent via-yellow-500 to-accent text-white px-6 py-3 rounded-2xl shadow-2xl shadow-accent/40 border border-white/20">
        <p className="text-lg font-black text-center tracking-wide">{flash.label}</p>
        <p className="text-sm font-bold text-center text-white/80">{flash.name}</p>
      </div>
    </div>
  );
}