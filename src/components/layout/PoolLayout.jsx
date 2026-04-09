import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { Trophy, Users, Flag, Shuffle, MessageCircle, BookOpen, LogIn, LogOut, Pencil, Check, X, ArrowLeft, MoreHorizontal, Share2, Copy, Link2, Moon, Sun, Newspaper } from 'lucide-react';
import { useTheme } from '@/lib/ThemeProvider';
import { toast } from 'sonner';
import { hapticTap } from '@/lib/haptics';
import { soundTap } from '@/lib/sounds';
import NotificationBell from '@/components/pool/NotificationBell';
import { useParticipant } from '@/lib/ParticipantContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const TABS = [
  { id: 'leaderboard', label: 'Board', Icon: Trophy },
  { id: 'teams', label: 'Teams', Icon: Users },
  { id: 'golfers', label: 'Field', Icon: Flag },
  { id: 'draw', label: 'Draw', Icon: Shuffle },
  { id: 'messages', label: 'Smack', Icon: MessageCircle },
  { id: 'more', label: 'More', Icon: MoreHorizontal },
];

function ParticipantBadge({ poolId }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPanel, setShowPanel] = useState(false);
  const [editingTeamName, setEditingTeamName] = useState(false);
  const [teamNameValue, setTeamNameValue] = useState('');
  const panelRef = useRef(null);

  const { isLoggedIn, participant, logout } = useParticipant();

  // Reactively fetch entries so team name updates are reflected
  const { data: entries = [] } = useQuery({
    queryKey: ['poolEntries', poolId],
    queryFn: () => base44.entities.PoolEntry.filter({ pool_id: poolId }),
    enabled: !!poolId && isLoggedIn,
  });

  const myEntry = entries.find(e => e.id === participant?.entry_id);

  // Close panel on Escape key
  useEffect(() => {
    if (!showPanel) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setShowPanel(false);
        setEditingTeamName(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showPanel]);

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

  const initials = (participant?.participant_name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (isLoggedIn) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowPanel(!showPanel)}
          aria-expanded={showPanel}
          aria-haspopup="dialog"
          aria-label={`Account menu for ${participant.participant_name}`}
          className="flex items-center gap-1.5 text-[10px] font-bold text-primary-foreground bg-white/15 rounded-lg px-2 py-1 border border-white/20 hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 transition truncate max-w-[100px] sm:max-w-[120px]"
        >
          <span className="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center text-[8px] font-black text-accent flex-shrink-0">{initials}</span>
          <span className="hidden sm:inline">{displayTeamName}</span>
        </button>

        {showPanel && (
          <>
            <div
              className="fixed inset-0 z-[60]"
              onClick={() => { setShowPanel(false); setEditingTeamName(false); }}
              aria-hidden="true"
            />
            <div
              ref={panelRef}
              role="dialog"
              aria-label="Account settings"
              className="fixed right-3 top-14 z-[70] w-64 bg-card rounded-xl shadow-xl border border-border overflow-hidden animate-fade-in-up"
            >
              <div className="px-4 py-3 bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border">
                <p className="text-sm font-bold text-foreground">{participant.participant_name}</p>
                <p className="text-xs text-muted-foreground">{participant.email}</p>
              </div>

              <div className="px-4 py-3 border-b border-border bg-card">
                <div className="flex items-center justify-between mb-1.5">
                  <label id="team-name-label" className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Team Name</label>
                  {!editingTeamName && (
                    <button
                      onClick={() => {
                        setTeamNameValue(myEntry?.team_name || '');
                        setEditingTeamName(true);
                      }}
                      aria-label="Edit team name"
                      className="p-1 hover:bg-muted rounded transition focus:outline-none focus:ring-2 focus:ring-primary"
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
                      className="h-8 text-sm flex-1 bg-card"
                      aria-labelledby="team-name-label"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => updateTeamName.mutate(teamNameValue)}
                      disabled={updateTeamName.isPending}
                      aria-label="Save team name"
                    >
                      <Check className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => setEditingTeamName(false)}
                      aria-label="Cancel editing"
                    >
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
                className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-destructive/10 transition flex items-center gap-2 bg-card focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
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
      className="flex items-center gap-1.5 text-[10px] font-bold text-primary-foreground bg-white/15 rounded-lg px-2.5 py-1.5 border border-white/20 hover:bg-white/25 transition focus:outline-none focus:ring-2 focus:ring-accent"
      aria-label="Sign in to your account"
    >
      <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
      Sign In
    </button>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-1.5 hover:bg-white/10 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-accent"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4 text-accent" /> : <Moon className="w-4 h-4 text-primary-foreground/70" />}
    </button>
  );
}

export function PoolHeader() {
  const { poolId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const { isLoggedIn, participant } = useParticipant();

  const { data: pool } = useQuery({
    queryKey: ['pool', poolId],
    queryFn: () => base44.entities.Pool.filter({ id: poolId }),
    enabled: !!poolId,
    select: (data) => data[0],
  });

  const isLive = pool?.status === 'live';

  // Determine current round day based on 2026 Masters schedule (Apr 9-12)
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const roundInfo = dateStr === '2026-04-09' ? { round: 'R1', day: 'THU' }
    : dateStr === '2026-04-10' ? { round: 'R2', day: 'FRI' }
    : dateStr === '2026-04-11' ? { round: 'R3', day: 'SAT' }
    : dateStr === '2026-04-12' ? { round: 'R4', day: 'SUN' }
    : null;

  return (
    <header className="sticky top-0 z-40" role="banner">
      {/* Main Header */}
      <div className="bg-gradient-to-r from-[#0a3d0a] to-primary border-b border-accent/40 px-4 py-3 md:py-4 relative overflow-hidden">
        <div className="absolute inset-0 animate-shimmer pointer-events-none" aria-hidden="true" />
        <div className="max-w-lg mx-auto flex items-center justify-between relative">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/');
                }
              }}
              className="min-h-11 min-w-11 flex items-center justify-center hover:bg-white/10 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-accent flex-shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-primary-foreground" />
            </button>
            <img src="https://media.base44.com/images/public/69bd90cf71e1b676eaaeb41f/1752bc3ba_CowtownMastersLogo.png" alt="Cowtown Masters logo" className="w-8 h-8 object-contain flex-shrink-0" />
            <div className="min-w-0 hidden sm:block">
              <h1 className="text-xl font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                COWTOWN MASTERS
              </h1>
              <p className="text-[10px] tracking-[0.2em] text-accent uppercase font-medium" aria-label="Tagline: A Tradition Unlike Any Other">A Tradition Unlike Any Other</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <ThemeToggle />
            <NotificationBell poolId={poolId} />
            {(user?.role === 'admin' || user?.email === pool?.admin_user_id || user?.email === pool?.created_by || (isLoggedIn && participant?.email && (participant.email === pool?.admin_user_id || participant.email === pool?.created_by))) && (
              <button
                onClick={() => navigate(`/pool/${poolId}/admin`)}
                className="text-[10px] font-bold text-accent bg-accent/10 rounded-lg px-2 py-1 border border-accent/30 hover:bg-accent/20 transition focus:outline-none focus:ring-2 focus:ring-accent"
                aria-label="Open admin panel"
              >
                Admin
              </button>
            )}
            <ParticipantBadge poolId={poolId} />
          </div>
        </div>
      </div>

      {/* Tournament Status Banner */}
      <div className="bg-gradient-to-r from-primary via-secondary to-primary border-b-2 border-accent" role="status" aria-label="Tournament round information">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-2 px-4 py-1">
          {isLive && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-live-pulse" aria-hidden="true" />
              <span className="text-[10px] font-black tracking-widest text-red-400 uppercase">LIVE</span>
              <span className="w-1 h-1 rounded-full bg-accent/40" aria-hidden="true" />
            </>
          )}
          {pool?.status === 'complete' && (
            <>
              <span className="text-[10px] font-black tracking-widest text-accent uppercase">FINAL</span>
              <span className="w-1 h-1 rounded-full bg-accent/40" aria-hidden="true" />
            </>
          )}
          {roundInfo ? (
            <>
              <span className="text-[10px] font-black tracking-widest text-accent">{roundInfo.round}</span>
              <span className="w-1 h-1 rounded-full bg-accent/40" aria-hidden="true" />
              <span className="text-[10px] font-bold tracking-widest text-primary-foreground/70">{roundInfo.day}</span>
              <span className="w-1 h-1 rounded-full bg-accent/40" aria-hidden="true" />
              <span className="text-[10px] font-semibold text-accent/70">The Masters Tournament</span>
            </>
          ) : (
            <>
              <span className="text-[10px] font-bold tracking-widest text-primary-foreground/70">TOURNAMENT</span>
              <span className="w-1 h-1 rounded-full bg-accent/40" aria-hidden="true" />
              <span className="text-[10px] font-semibold text-accent/70">The Masters · Augusta National</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function PoolBottomNav({ poolId }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const navigate = useNavigate();
  const { data: pool } = useQuery({
    queryKey: ['pool', poolId],
    queryFn: () => base44.entities.Pool.filter({ id: poolId }),
    enabled: !!poolId,
    select: (data) => data[0],
  });

  const handleCopyInvite = async () => {
    if (pool?.invite_code) {
      await navigator.clipboard.writeText(pool.invite_code);
      hapticTap();
      toast.success('Invite code copied!');
    }
  };

  const handleSharePool = async () => {
    const url = `${window.location.origin}/pool/${poolId}`;
    if (navigator.share) {
      navigator.share({ title: pool?.name || 'Cowtown Masters Pool', url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Pool link copied!');
    }
  };

  const MORE_ITEMS = [
    { id: 'news', label: 'Golfer News', Icon: Newspaper },
    { id: 'history', label: 'Champions Wall', Icon: Trophy },
    { id: 'rules', label: 'Pool Rules', Icon: BookOpen },
  ];

  return (
    <>
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-secondary to-primary border-t border-accent/30 backdrop-blur-lg" role="navigation" aria-label="Pool navigation">
      <div className="max-w-lg mx-auto grid grid-cols-6 px-1 py-1 pb-[env(safe-area-inset-bottom,1.5rem)]">
        {TABS.map((tab) => (
          tab.id === 'more' ? (
            <button
              key="more"
              onClick={() => setMoreOpen(true)}
              aria-label="More options"
              className="flex flex-col items-center justify-center gap-0.5 py-2 min-h-[48px] rounded-lg transition-all text-primary-foreground/50 hover:text-primary-foreground/70 active:text-primary-foreground/90"
            >
              <tab.Icon className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
              <span className="text-[9px] tracking-wide uppercase font-medium">{tab.label}</span>
            </button>
          ) : (
          <NavLink
            key={tab.id}
            to={`/pool/${poolId}/${tab.id}`}
            replace
            onClick={() => soundTap()}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-2 min-h-[48px] rounded-lg transition-all relative focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 ${
                isActive
                  ? 'text-accent'
                  : 'text-primary-foreground/50 hover:text-primary-foreground/70 active:text-primary-foreground/90'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-accent" aria-hidden="true" />
                )}
                <tab.Icon className={`w-5 h-5 transition-all ${isActive ? 'stroke-[2.5] scale-110' : 'stroke-[1.5]'}`} aria-hidden="true" />
                <span className={`text-[9px] tracking-wide uppercase ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
              </>
            )}
          </NavLink>
          )
        ))}
      </div>
    </nav>

    <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader className="pb-3">
          <SheetTitle style={{ fontFamily: "'Playfair Display', serif" }}>More</SheetTitle>
        </SheetHeader>
        <div className="space-y-1">
          {MORE_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => { setMoreOpen(false); navigate(`/pool/${poolId}/${item.id}`); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <item.Icon className="w-4.5 h-4.5 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-2 px-1">Share Pool</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={handleCopyInvite}>
              <Copy className="w-3.5 h-3.5" /> Copy Invite Code
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={handleSharePool}>
              <Link2 className="w-3.5 h-3.5" /> Share Link
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}

function CinderCrownFooter() {
  return (
    <footer className="bg-gradient-to-r from-secondary to-primary border-t border-accent/20 py-3 pb-20 px-4" role="contentinfo">
      <div className="max-w-md mx-auto flex items-center justify-center gap-2">
        <span className="text-[10px] text-primary-foreground/50 tracking-wide">© {new Date().getFullYear()} Created by</span>
        <a
          href="https://cinderandcrown.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:opacity-80 transition focus:outline-none focus:ring-2 focus:ring-accent rounded"
          aria-label="Visit Cinder and Crown website (opens in new tab)"
        >
          <svg width="18" height="18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="flex-shrink-0">
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
          <span className="text-[11px] font-bold text-accent tracking-wide">Cinder & Crown</span>
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
      <main id="main-content" className="max-w-lg mx-auto px-0 w-full pb-28" role="main">
        <div className="animate-fade-in-up">
          {children}
        </div>
      </main>
      <CinderCrownFooter />
      <PoolBottomNav poolId={poolId} />
    </div>
  );
}