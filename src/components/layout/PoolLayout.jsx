import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GreenJacketIcon } from '@/components/icons/GreenJacketIcon';

const TABS = [
  { id: 'leaderboard', label: 'Board', icon: '🏆' },
  { id: 'teams', label: 'Teams', icon: '👥' },
  { id: 'golfers', label: 'Golfers', icon: '⛳' },
  { id: 'draft', label: 'Draft', icon: '🎩' },
  { id: 'history', label: 'History', icon: '📊' },
  { id: 'rules', label: 'Rules', icon: '📋' },
];

export function PoolHeader() {
  const { poolId } = useParams();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-secondary to-primary border-b-2 border-accent px-4 py-3 md:py-4">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GreenJacketIcon size={32} />
          <div>
            <h1 className="text-xl font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              COWTOWN MASTERS
            </h1>
            <p className="text-xs tracking-widest text-accent uppercase">A Tradition Unlike Any Other</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/pool/${poolId}/admin`)}
            className="text-xs font-bold text-accent bg-accent/10 rounded-lg px-2 py-1 border border-accent/30 hover:bg-accent/20 transition"
          >
            ⚙️ Admin
          </button>
          <div className="flex items-center gap-2 bg-accent/10 rounded-lg px-2 py-1 border border-accent/30">
            <span className="text-xs font-bold tracking-widest text-accent uppercase">LIVE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
          </div>
        </div>
      </div>
    </header>
  );
}

export function PoolBottomNav({ activeTab, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-secondary to-primary border-t border-accent/30 backdrop-blur-lg">
      <div className="max-w-md mx-auto flex justify-around px-2 py-2 pb-[env(safe-area-inset-bottom,1rem)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all ${
              activeTab === tab.id
                ? 'text-accent scale-110'
                : 'text-primary-foreground/60 hover:text-primary-foreground/80'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-[10px] font-semibold tracking-wider uppercase">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export default function PoolLayout({ activeTab, onChange, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-sand">
      <PoolHeader />
      <main className="max-w-md mx-auto pb-32 px-0">
        {children}
      </main>
      <PoolBottomNav activeTab={activeTab} onChange={onChange} />
    </div>
  );
}