import React, { useState } from 'react';
import { GreenJacketIcon } from '@/components/icons/GreenJacketIcon';

const POOL_ENTRIES = [
  { id: '1', name: 'Clay Coiller', golferA: 'Ludvig Åberg', scoreA: -6, golferB: 'Patrick Reed', scoreB: -9, total: -15 },
  { id: '2', name: 'Sanders Johnston', golferA: 'Jon Rahm', scoreA: -3, golferB: 'Sungjae Im', scoreB: -7, total: -10 },
  { id: '3', name: 'Charlie Brown', golferA: 'Patrick Cantlay', scoreA: 2, golferB: 'Justin Rose', scoreB: -11, total: -9 },
  { id: '4', name: 'Adam Teppe', golferA: 'Rory McIlroy', scoreA: -11, golferB: 'Dustin Johnson', scoreB: 3, total: -8 },
];

const formatScore = (s) => (s === 0 ? 'E' : s > 0 ? `+${s}` : `${s}`);
const scoreColor = (s) => {
  if (s < 0) return 'text-red-600';
  if (s > 0) return 'text-primary';
  return 'text-accent';
};

export default function Leaderboard({ onSelectEntry }) {
  const sorted = [...POOL_ENTRIES].sort((a, b) => a.total - b.total);

  return (
    <div className="px-3 pt-3 pb-6">
      {/* Leader Card */}
      <div className="bg-gradient-to-br from-secondary to-primary rounded-xl p-4 mb-4 border border-accent/30 shadow-lg">
        <div className="flex items-start gap-3 mb-3">
          <GreenJacketIcon size={32} />
          <div className="flex-1">
            <p className="text-xs font-bold tracking-widest text-accent uppercase">2025 Champion</p>
            <h2 className="text-2xl font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              {sorted[0].name}
            </h2>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-black ${scoreColor(sorted[0].total)}`}>
              {formatScore(sorted[0].total)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/10 rounded-lg p-2 border border-white/10">
            <p className="text-xs font-bold text-accent tracking-widest">GROUP A</p>
            <p className="text-sm font-semibold text-primary-foreground">{sorted[0].golferA}</p>
            <p className={`text-lg font-bold ${scoreColor(sorted[0].scoreA)}`}>{formatScore(sorted[0].scoreA)}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2 border border-white/10">
            <p className="text-xs font-bold text-accent tracking-widest">GROUP B</p>
            <p className="text-sm font-semibold text-primary-foreground">{sorted[0].golferB}</p>
            <p className={`text-lg font-bold ${scoreColor(sorted[0].scoreB)}`}>{formatScore(sorted[0].scoreB)}</p>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-xl shadow-sm border border-primary/10 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-secondary px-3 py-2">
          <span className="text-sm font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Pool Standings
          </span>
          <span className="float-right text-xs text-accent font-semibold">{sorted.length} ENTRIES</span>
        </div>

        <div className="grid grid-cols-[32px_1fr_60px_60px_56px] gap-2 px-3 py-2 border-b border-primary/10 bg-primary/5 text-xs font-bold text-primary uppercase tracking-wider">
          <span>#</span>
          <span>Name</span>
          <span className="text-center">GRP A</span>
          <span className="text-center">GRP B</span>
          <span className="text-center">TOT</span>
        </div>

        {sorted.map((entry, i) => (
          <div
            key={entry.id}
            onClick={() => onSelectEntry(entry)}
            className={`grid grid-cols-[32px_1fr_60px_60px_56px] gap-2 px-3 py-2.5 border-b border-primary/5 cursor-pointer hover:bg-accent/5 transition ${
              i === 0 ? 'bg-accent/10' : i < 3 ? 'bg-primary/5' : ''
            }`}
          >
            <span className={`font-black text-center ${i === 0 ? 'text-accent' : 'text-muted-foreground'}`}>
              {i === 0 ? '🏆' : i + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">{entry.name}</p>
              <p className="text-xs text-muted-foreground">{entry.golferA} · {entry.golferB}</p>
            </div>
            <span className={`text-center font-bold text-sm ${scoreColor(entry.scoreA)}`}>{formatScore(entry.scoreA)}</span>
            <span className={`text-center font-bold text-sm ${scoreColor(entry.scoreB)}`}>{formatScore(entry.scoreB)}</span>
            <span className={`text-center font-black text-lg ${scoreColor(entry.total)} bg-accent/10 rounded px-1`}>
              {formatScore(entry.total)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}