import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Trophy, Users, Flag, Shuffle, MessageCircle, BookOpen, LogIn } from 'lucide-react';
import { useParticipant } from '@/lib/ParticipantContext';

const TABS = [
  { id: 'leaderboard', label: 'Board', Icon: Trophy },
  { id: 'teams', label: 'Teams', Icon: Users },
  { id: 'golfers', label: 'Golfers', Icon: Flag },
  { id: 'draw', label: 'Draw', Icon: Shuffle },
  { id: 'messages', label: 'Messages', Icon: MessageCircle },
  { id: 'rules', label: 'Rules', Icon: BookOpen },
];

function ParticipantBadge({ poolId }) {
  const navigate = useNavigate();
  let participantCtx;
  try {
    participantCtx = useParticipant();
  } catch {
    participantCtx = { isLoggedIn: false, participant: null, logout: () => {} };
  }
  const { isLoggedIn, participant, logout } = participantCtx;

  if (isLoggedIn) {
    return (
      <button
        onClick={logout}
        className="text-[10px] font-bold text-primary-foreground bg-white/15 rounded-lg px-2 py-1 border border-white/20 hover:bg-white/25 transition truncate max-w-[80px]"
        title={`Signed in as ${participant.participant_name}. Click to sign out.`}
      >
        {participant.participant_name}
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate(`/pool/${poolId}/login`)}
      className="p-1.5 hover:bg-white/10 rounded-lg transition"
      title="Sign in"
    >
      <LogIn className="w-4 h-4 text-primary-foreground" />
    </button>
  );
}

export function PoolHeader() {
  const { poolId } = useParams();
  const navigate = useNavigate();

  // Determine current round day based on tournament schedule (Thu-Sun)
  const day = new Date().getDay(); // 0=Sun, 4=Thu, 5=Fri, 6=Sat
  const roundInfo = day === 4 ? { round: 'R1', day: 'THU' }
    : day === 5 ? { round: 'R2', day: 'FRI' }
    : day === 6 ? { round: 'R3', day: 'SAT' }
    : day === 0 ? { round: 'R4', day: 'SUN' }
    : null;

  return (
    <header className="sticky top-0 z-40">
      {/* Main Header */}
      <div className="bg-gradient-to-r from-secondary to-primary border-b border-accent/40 px-4 py-3 md:py-4 relative overflow-hidden">
        <div className="absolute inset-0 animate-shimmer pointer-events-none" />
        <div className="max-w-md mx-auto flex items-center justify-between relative">
          <div className="flex items-center gap-2">
            <img src="https://media.base44.com/images/public/69bd90cf71e1b676eaaeb41f/1752bc3ba_CowtownMastersLogo.png" alt="Cowtown Masters" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                COWTOWN MASTERS
              </h1>
              <p className="text-[10px] tracking-[0.2em] text-accent/80 uppercase font-medium">A Tradition Unlike Any Other</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate(`/pool/${poolId}/admin`)}
              className="text-[10px] font-bold text-accent bg-accent/10 rounded-lg px-2 py-1 border border-accent/30 hover:bg-accent/20 transition"
            >
              Admin
            </button>
            <div className="flex items-center gap-1.5 bg-black/20 rounded-lg px-2 py-1 border border-red-500/30">
              <span className="text-[10px] font-black tracking-widest text-red-400 uppercase">LIVE</span>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-live-pulse" />
            </div>
            <ParticipantBadge poolId={poolId} />
          </div>
        </div>
      </div>

      {/* Tournament Status Banner */}
      <div className="bg-gradient-to-r from-primary via-secondary to-primary border-b-2 border-accent">
        <div className="max-w-md mx-auto flex items-center justify-center gap-3 px-4 py-1.5">
          {roundInfo ? (
            <>
              <span className="text-[10px] font-black tracking-widest text-accent">{roundInfo.round}</span>
              <span className="w-1 h-1 rounded-full bg-accent/40" />
              <span className="text-[10px] font-bold tracking-widest text-primary-foreground/70">{roundInfo.day}</span>
              <span className="w-1 h-1 rounded-full bg-accent/40" />
              <span className="text-[10px] font-semibold text-accent/70">The Masters Tournament</span>
            </>
          ) : (
            <>
              <span className="text-[10px] font-bold tracking-widest text-primary-foreground/70">TOURNAMENT</span>
              <span className="w-1 h-1 rounded-full bg-accent/40" />
              <span className="text-[10px] font-semibold text-accent/70">The Masters · Augusta National</span>
            </>
          )}
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
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all relative ${
              activeTab === tab.id
                ? 'text-accent'
                : 'text-primary-foreground/50 hover:text-primary-foreground/70'
            }`}
          >
            {activeTab === tab.id && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-accent" />
            )}
            <tab.Icon className={`w-5 h-5 transition-all ${activeTab === tab.id ? 'stroke-[2.5] scale-110' : 'stroke-[1.5]'}`} />
            <span className={`text-[9px] tracking-widest uppercase ${activeTab === tab.id ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
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