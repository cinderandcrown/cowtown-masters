import React, { useState } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { Trophy, Users, Flag, Shuffle, MoreHorizontal, MessageCircle, BookOpen, Clock, Share2, LogIn, LogOut, Pencil, Check, X, ArrowLeft, Copy, QrCode, ExternalLink } from 'lucide-react';
import NotificationBell from '@/components/pool/NotificationBell';
import { useParticipant } from '@/lib/ParticipantContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const TABS = [
  { id: 'leaderboard', label: 'Board', Icon: Trophy },
  { id: 'teams', label: 'Teams', Icon: Users },
  { id: 'golfers', label: 'Field', Icon: Flag },
  { id: 'draw', label: 'Draw', Icon: Shuffle },
  { id: 'more', label: 'More', Icon: MoreHorizontal },
];

const MORE_ITEMS = [
  { id: 'messages', label: 'Smack Talk', desc: 'Group chat & direct messages', Icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'history', label: 'Champions Wall', desc: 'Past winners & pool stats', Icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'rules', label: 'Pool Rules', desc: 'Scoring, payouts & tiebreakers', Icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
];

function ParticipantBadge({ poolId }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPanel, setShowPanel] = useState(false);
  const [editingTeamName, setEditingTeamName] = useState(false);
  const [teamNameValue, setTeamNameValue] = useState('');

  const { isLoggedIn, participant, logout } = useParticipant();

  const { data: entries = [] } = useQuery({
    queryKey: ['poolEntries', poolId],
    queryFn: () => base44.entities.PoolEntry.filter({ pool_id: poolId }),
    enabled: !!poolId && isLoggedIn,
  });

  const myEntry = entries.find(e => e.id === participant?.entry_id);

  const updateTeamName = useMutation({
    mutationFn: async (newTeamName) => {
      if (!participant?.entry_id) return;
      await base44.entities.PoolEntry.update(participant.entry_id, { team_name: newTeamName.trim() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poolEntries', poolId] });
      queryClient.invalidateQueries({ queryKey: ['adminEntries', poolId] });
      setEditingTeamName(false);
    },
  });

  const displayTeamName = myEntry?.team_name || participant?.participant_name;

  if (isLoggedIn) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowPanel(!showPanel)}
          aria-expanded={showPanel}
          aria-label={`Account menu for ${participant.participant_name}`}
          className="flex items-center gap-1.5 text-[10px] font-bold text-primary-foreground bg-white/15 rounded-lg px-2.5 py-1.5 border border-white/20 hover:bg-white/25 transition truncate max-w-[120px]"
        >
          <div className="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0">
            <span className="text-[8px] font-black text-accent">{(displayTeamName || '?')[0].toUpperCase()}</span>
          </div>
          <span className="truncate">{displayTeamName}</span>
        </button>

        {showPanel && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => { setShowPanel(false); setEditingTeamName(false); }} />
            <div
              role="dialog"
              aria-label="Account settings"
              className="fixed right-3 top-14 z-[70] w-72 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-fade-in-up"
            >
              <div className="px-4 py-3.5 bg-gradient-to-r from-primary/8 to-accent/8 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <span className="text-sm font-black text-accent">{(participant.participant_name || '?')[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{participant.participant_name}</p>
                    <p className="text-[11px] text-muted-foreground">{participant.email}</p>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Team Name</label>
                  {!editingTeamName && (
                    <button
                      onClick={() => { setTeamNameValue(myEntry?.team_name || ''); setEditingTeamName(true); }}
                      aria-label="Edit team name"
                      className="p-1 hover:bg-muted rounded transition"
                    >
                      <Pencil className="w-3.5 h-3.5 text-primary" />
                    </button>
                  )}
                </div>
                {editingTeamName ? (
                  <div className="flex gap-1.5">
                    <Input
                      value={teamNameValue}
                      onChange={(e) => setTeamNameValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') updateTeamName.mutate(teamNameValue); }}
                      placeholder="e.g. The Outlaws"
                      className="h-8 text-sm flex-1"
                      autoFocus
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateTeamName.mutate(teamNameValue)} disabled={updateTeamName.isPending}>
                      <Check className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingTeamName(false)}>
                      <X className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-foreground">
                    {myEntry?.team_name || <span className="text-muted-foreground/60 italic">Not set</span>}
                  </p>
                )}
              </div>

              <button
                onClick={() => { logout(); setShowPanel(false); }}
                className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-destructive/10 transition flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => navigate(`/pool/${poolId}/login`)}
      className="flex items-center gap-1.5 text-[10px] font-bold text-primary-foreground bg-white/10 rounded-lg px-2.5 py-1.5 border border-white/15 hover:bg-white/20 transition"
      aria-label="Sign in"
    >
      <LogIn className="w-3.5 h-3.5" />
      Sign In
    </button>
  );
}

export function PoolHeader() {
  const { poolId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth() || {};

  const { data: pool } = useQuery({
    queryKey: ['pool', poolId],
    queryFn: () => base44.entities.Pool.filter({ id: poolId }),
    enabled: !!poolId,
    select: (data) => data[0],
  });

  const isLive = pool?.status === 'live';

  const day = new Date().getDay();
  const roundInfo = day === 4 ? { round: 'R1', day: 'THU' }
    : day === 5 ? { round: 'R2', day: 'FRI' }
    : day === 6 ? { round: 'R3', day: 'SAT' }
    : day === 0 ? { round: 'R4', day: 'SUN' }
    : null;

  return (
    <header className="sticky top-0 z-40" role="banner">
      <div className="bg-gradient-to-r from-[#0a3d0a] via-primary to-secondary border-b border-accent/40 px-4 py-2.5 relative overflow-hidden">
        <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-20" />
        <div className="max-w-lg mx-auto flex items-center justify-between relative">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
              className="p-1.5 hover:bg-white/10 rounded-lg transition"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4 text-primary-foreground" />
            </button>
            <img src="https://media.base44.com/images/public/69bd90cf71e1b676eaaeb41f/1752bc3ba_CowtownMastersLogo.png" alt="" className="w-7 h-7 object-contain" />
            <div>
              <h1 className="text-lg font-bold text-primary-foreground leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                COWTOWN <span className="text-accent">MASTERS</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <NotificationBell poolId={poolId} />
            {(user?.role === 'admin' || user?.email === pool?.admin_user_id || user?.email === pool?.created_by) && (
              <button
                onClick={() => navigate(`/pool/${poolId}/admin`)}
                className="text-[10px] font-bold text-accent bg-accent/15 rounded-lg px-2 py-1 border border-accent/30 hover:bg-accent/25 transition"
              >
                Admin
              </button>
            )}
            {isLive && (
              <div className="flex items-center gap-1 bg-red-500/20 rounded-lg px-2 py-1 border border-red-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-live-pulse" />
                <span className="text-[9px] font-black tracking-widest text-red-400">LIVE</span>
              </div>
            )}
            {pool?.status === 'complete' && (
              <div className="bg-accent/15 rounded-lg px-2 py-1 border border-accent/30">
                <span className="text-[9px] font-black tracking-widest text-accent">FINAL</span>
              </div>
            )}
            <ParticipantBadge poolId={poolId} />
          </div>
        </div>
      </div>

      {/* Tournament Status - slimmer */}
      {(isLive || roundInfo) && (
        <div className="bg-gradient-to-r from-primary via-secondary to-primary border-b border-accent/30">
          <div className="max-w-lg mx-auto flex items-center justify-center gap-2.5 px-4 py-1">
            {roundInfo ? (
              <>
                <span className="text-[9px] font-black tracking-widest text-accent">{roundInfo.round}</span>
                <span className="w-0.5 h-0.5 rounded-full bg-accent/40" />
                <span className="text-[9px] font-bold tracking-wider text-primary-foreground/60">{roundInfo.day}</span>
                <span className="w-0.5 h-0.5 rounded-full bg-accent/40" />
                <span className="text-[9px] font-semibold text-accent/60">Augusta National Golf Club</span>
              </>
            ) : (
              <span className="text-[9px] font-semibold text-accent/60">The Masters Tournament · Augusta National</span>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MoreSheet({ poolId }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: pool } = useQuery({
    queryKey: ['pool', poolId],
    queryFn: () => base44.entities.Pool.filter({ id: poolId }),
    enabled: !!poolId,
    select: (data) => data[0],
  });
  const [copied, setCopied] = useState(false);

  const handleCopyInvite = async () => {
    const code = pool?.invite_code || '';
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.origin + `/pool/${poolId}/leaderboard`;
    const shareData = {
      title: pool?.name || 'Cowtown Masters Pool',
      text: `Join my Masters pool! Use invite code: ${pool?.invite_code || ''}`,
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex flex-col items-center justify-center gap-0.5 py-2 min-h-[48px] rounded-lg transition-all relative text-primary-foreground/50 hover:text-primary-foreground/70">
          <MoreHorizontal className="w-5 h-5 stroke-[1.5]" />
          <span className="text-[9px] tracking-wide uppercase font-medium">More</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl border-t-2 border-accent/30 pb-8 max-h-[80vh]">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
            More Options
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-2 mt-2">
          {MORE_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => { setOpen(false); navigate(`/pool/${poolId}/${item.id}`); }}
              className="w-full flex items-center gap-3.5 p-3.5 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all text-left group"
            >
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <item.Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Share & Invite Section */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-2.5">Share Pool</p>
          <div className="flex gap-2">
            <button
              onClick={handleCopyInvite}
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/15 hover:bg-primary/10 transition text-sm font-semibold text-primary"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : pool?.invite_code || 'Code'}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/15 transition text-sm font-semibold text-accent"
            >
              <Share2 className="w-4 h-4" />
              Share Link
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function PoolBottomNav({ poolId }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-[#0a3d0a] to-primary border-t border-accent/30 backdrop-blur-lg" role="navigation" aria-label="Pool navigation">
      <div className="max-w-lg mx-auto grid grid-cols-5 px-2 py-1 pb-[env(safe-area-inset-bottom,0.5rem)]">
        {TABS.map((tab) => (
          tab.id === 'more' ? (
            <MoreSheet key={tab.id} poolId={poolId} />
          ) : (
            <NavLink
              key={tab.id}
              to={`/pool/${poolId}/${tab.id}`}
              replace
              aria-label={tab.label}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-2 min-h-[48px] rounded-lg transition-all relative ${
                  isActive
                    ? 'text-accent'
                    : 'text-primary-foreground/50 hover:text-primary-foreground/70'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-accent" />
                  )}
                  <tab.Icon className={`w-5 h-5 transition-all ${isActive ? 'stroke-[2.5] scale-110' : 'stroke-[1.5]'}`} />
                  <span className={`text-[9px] tracking-wide uppercase ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
                </>
              )}
            </NavLink>
          )
        ))}
      </div>
    </nav>
  );
}

function CinderCrownFooter() {
  return (
    <footer className="bg-gradient-to-r from-[#0a3d0a] to-primary border-t border-accent/20 py-3 pb-20 px-4">
      <div className="max-w-lg mx-auto flex items-center justify-center gap-2">
        <span className="text-[10px] text-primary-foreground/40 tracking-wide">© {new Date().getFullYear()}</span>
        <a
          href="https://cinderandcrown.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:opacity-80 transition"
          aria-label="Cinder and Crown"
        >
          <svg width="14" height="14" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
            <path d="M38 22L42 16L46 20L50 12L54 20L58 16L62 22" stroke="#E8A838" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M50 28C50 28 44 35 42 42C40 49 42 58 50 68C58 58 60 49 58 42C56 35 50 28 50 28Z" fill="#6B1D2A"/>
            <path d="M42 42C42 42 30 32 22 30C26 36 28 44 32 50C36 56 42 58 42 58C40 52 40 46 42 42Z" fill="#6B1D2A"/>
            <path d="M32 50C32 50 24 40 18 38C22 44 24 50 28 54C30 56 32 56 32 56" fill="#E8A838" opacity="0.85"/>
            <path d="M58 42C58 42 70 32 78 30C74 36 72 44 68 50C64 56 58 58 58 58C60 52 60 46 58 42Z" fill="#6B1D2A"/>
            <path d="M68 50C68 50 76 40 82 38C78 44 76 50 72 54C70 56 68 56 68 56" fill="#E8A838" opacity="0.85"/>
            <path d="M50 68C50 68 46 78 44 88L50 82L56 88C54 78 50 68 50 68Z" fill="#6B1D2A"/>
            <path d="M50 72C50 72 48 80 47 86L50 82L53 86C52 80 50 72 50 72Z" fill="#E8A838" opacity="0.7"/>
            <ellipse cx="50" cy="34" rx="3" ry="4" fill="#E8A838"/>
          </svg>
          <span className="text-[10px] font-bold text-accent/70 tracking-wide">Cinder & Crown</span>
        </a>
      </div>
    </footer>
  );
}

export default function PoolLayout({ children }) {
  const { poolId } = useParams();
  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:bg-card focus:text-primary focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-bold">
        Skip to main content
      </a>
      <PoolHeader />
      <main id="main-content" className="max-w-lg mx-auto px-0 w-full pb-20" role="main">
        {children}
      </main>
      <CinderCrownFooter />
      <PoolBottomNav poolId={poolId} />
    </div>
  );
}
