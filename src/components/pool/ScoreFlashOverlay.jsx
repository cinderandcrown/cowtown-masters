import React, { useState, useEffect, useRef } from 'react';
import { fireBirdie, fireEagle } from '@/lib/useConfetti';
import { hapticSuccess, hapticTripleBuzz } from '@/lib/haptics';
import { soundBirdie, soundEagle } from '@/lib/sounds';

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
      const isEagle = bestChange.diff <= -2;
      const label = isEagle ? '🦅 EAGLE!' : '🐦 BIRDIE!';
      setFlash({ label, name: bestChange.name, score: bestChange.newScore, isEagle });
      if (isEagle) {
        hapticTripleBuzz();
        fireEagle();
        soundEagle();
      } else {
        hapticSuccess();
        fireBirdie();
        soundBirdie();
      }
      setTimeout(() => setFlash(null), 4000);
    }
  }, [golfers]);

  if (!flash) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in pointer-events-none">
      <div className={`px-8 py-4 rounded-2xl shadow-2xl border border-white/30 text-center ${
        flash.isEagle
          ? 'bg-gradient-to-r from-yellow-500 via-accent to-yellow-500 shadow-yellow-500/50'
          : 'bg-gradient-to-r from-primary via-secondary to-primary shadow-primary/40'
      }`}>
        <p className="text-2xl font-black text-white tracking-wider animate-pulse">{flash.label}</p>
        <p className="text-sm font-bold text-white/90 mt-1">{flash.name}</p>
        <p className="text-[10px] text-white/60 mt-0.5 tracking-widest uppercase">
          {flash.isEagle ? '2 under on the hole!' : 'Dropped a shot!'}
        </p>
      </div>
    </div>
  );
}