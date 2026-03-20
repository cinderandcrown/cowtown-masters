import React from 'react';

const scoreColor = (s) => {
  if (s < 0) return 'text-red-600';
  if (s > 0) return 'text-primary';
  return 'text-accent';
};

const formatScore = (s) => (s === 0 ? 'E' : s > 0 ? `+${s}` : `${s}`);

const getPositionEmoji = (position) => {
  if (!position) return '⛳';
  if (position === '1') return '🥇';
  if (position.startsWith('T2')) return '🥈';
  if (position.startsWith('T3')) return '🥉';
  return '⛳';
};

export default function GolferHeader({ golfer }) {
  return (
    <div className="bg-gradient-to-br from-secondary to-primary rounded-xl p-6 border border-accent/30 text-primary-foreground">
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Current Score */}
        <div className="bg-white/10 rounded-lg p-4 border border-white/10 backdrop-blur">
          <p className="text-xs font-bold tracking-widest uppercase text-accent mb-1">Score to Par</p>
          <p className={`text-4xl font-black ${scoreColor(golfer.score_to_par)}`}>
            {formatScore(golfer.score_to_par)}
          </p>
          <p className="text-xs text-white/70 mt-1">{golfer.status === 'cut' ? 'Cut' : 'Active'}</p>
        </div>

        {/* Position */}
        <div className="bg-white/10 rounded-lg p-4 border border-white/10 backdrop-blur">
          <p className="text-xs font-bold tracking-widest uppercase text-accent mb-1">Position</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl">{getPositionEmoji(golfer.position)}</span>
            <p className="text-3xl font-black text-white">{golfer.position || '—'}</p>
          </div>
        </div>

        {/* Holes Completed */}
        <div className="bg-white/10 rounded-lg p-4 border border-white/10 backdrop-blur">
          <p className="text-xs font-bold tracking-widest uppercase text-accent mb-1">Thru</p>
          <p className="text-3xl font-black text-white">{golfer.thru || '—'}</p>
        </div>

        {/* Ranking */}
        <div className="bg-white/10 rounded-lg p-4 border border-white/10 backdrop-blur">
          <p className="text-xs font-bold tracking-widest uppercase text-accent mb-1">OWGR</p>
          <p className="text-3xl font-black text-white">#{golfer.world_ranking}</p>
        </div>
      </div>

      {/* Group & Odds */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/5 rounded px-3 py-2 border border-white/5">
          <p className="text-xs text-white/70">Group</p>
          <p className="text-sm font-bold text-white">Group {golfer.group}</p>
        </div>
        <div className="bg-white/5 rounded px-3 py-2 border border-white/5">
          <p className="text-xs text-white/70">Betting Odds</p>
          <p className="text-sm font-bold text-white">{golfer.betting_odds}</p>
        </div>
      </div>
    </div>
  );
}