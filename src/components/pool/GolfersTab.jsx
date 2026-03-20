import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const GOLFER_SCORES = [
  { id: '1', name: 'Justin Rose', total: -11, r1: -7, r2: -1, r3: 3, r4: -6, scores: [65, 71, 75, 66], group: 'B' },
  { id: '2', name: 'Rory McIlroy', total: -11, r1: 0, r2: -6, r3: -6, r4: 1, scores: [72, 66, 66, 73], group: 'A' },
  { id: '3', name: 'Patrick Reed', total: -9, r1: -1, r2: -2, r3: -3, r4: -3, scores: [71, 70, 69, 69], group: 'B' },
  { id: '4', name: 'Scottie Scheffler', total: -8, r1: -4, r2: -1, r3: 0, r4: -3, scores: [68, 71, 72, 69], group: 'A' },
];

const formatScore = (s) => (s === 0 ? 'E' : s > 0 ? `+${s}` : `${s}`);
const scoreColor = (s) => {
  if (s < 0) return 'text-red-600';
  if (s > 0) return 'text-primary';
  return 'text-accent';
};

export default function GolfersTab({ poolId }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const { data: golfers = [], isLoading } = useQuery({
    queryKey: ['poolGolfers', poolId],
    queryFn: async () => {
      const all = await base44.asServiceRole.entities.Golfer.list();
      return all.filter((g) => g.pool_id === poolId);
    },
    enabled: !!poolId,
  });

  const sorted = golfers
    .filter((g) => filter === 'all' || g.group === filter)
    .sort((a, b) => (a.score_to_par || 0) - (b.score_to_par || 0));

  return (
    <div className="px-3 pt-3 pb-6">
      {/* Filter Pills */}
      <div className="flex gap-2 mb-4 justify-center">
        {[
          { value: 'all', label: 'All Golfers' },
          { value: 'A', label: 'Group A' },
          { value: 'B', label: 'Group B' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
              filter === f.value
                ? 'bg-primary text-white border-primary'
                : 'bg-white border border-primary/20 text-foreground hover:border-primary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Golfer Cards */}
      <div className="space-y-2">
        {sorted.map((g, i) => (
          <div
            key={g.id}
            className={`grid grid-cols-[28px_1fr_repeat(4,36px)_44px] gap-1 px-3 py-2 rounded-lg border ${
              i < 3
                ? `bg-accent/10 border-accent/30`
                : 'bg-white border-primary/10 hover:bg-primary/5'
            } transition`}
          >
            <span className={`font-black text-center text-sm ${i === 0 ? 'text-accent' : i < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{g.name}</p>
              <span className={`text-xs font-bold tracking-widest ${g.group === 'A' ? 'text-primary' : 'text-accent'}`}>
                GRP {g.group}
              </span>
            </div>
            {[g.r1, g.r2, g.r3, g.r4].map((r, j) => (
              <span key={j} className={`text-center font-semibold text-xs ${scoreColor(r)}`}>
                {formatScore(r)}
              </span>
            ))}
            <span className={`text-center font-black text-sm ${scoreColor(g.total)} bg-accent/10 rounded px-1`}>
              {formatScore(g.total)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}