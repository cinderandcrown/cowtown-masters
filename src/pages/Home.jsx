import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Settings, Trophy, Shuffle, Tv, Flag, ChevronRight, Users, Sparkles, Zap, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';


export default function Home() {
  useEffect(() => { document.title = 'Cowtown Masters'; }, []);
  const navigate = useNavigate();
  const [showCreatePool, setShowCreatePool] = useState(false);
  const [showJoinPool, setShowJoinPool] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [poolName, setPoolName] = useState('Cowtown Masters 2026');
  const [poolYear, setPoolYear] = useState(2026);
  const [entryFee, setEntryFee] = useState(50);
  const [creating, setCreating] = useState(false);

  const { data: pools = [] } = useQuery({
    queryKey: ['pools'],
    queryFn: () => base44.entities.Pool.list(),
  });

  const handleCreatePool = async () => {
    if (!poolName.trim()) return;
    setCreating(true);
    const response = await base44.functions.invoke('initializePool', {
      poolName,
      year: poolYear,
      entryFee,
      maxEntries: 30,
    });
    setCreating(false);
    setShowCreatePool(false);
    if (response.data?.pool?.id) {
      navigate(`/pool/${response.data.pool.id}`);
    }
  };

  const handleJoinPool = () => {
    if (!inviteCode.trim()) return;
    const match = pools.find(p => p.invite_code === inviteCode.toUpperCase());
    if (match) {
      navigate(`/pool/${match.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Settings */}
      <div className="absolute top-4 right-4 z-10">
        <Link to="/account" className="p-2 rounded-full hover:bg-white/10 transition" aria-label="Account settings">
          <Settings className="w-5 h-5 text-primary-foreground/60" />
        </Link>
      </div>

      {/* Full-bleed Hero */}
      <div className="relative overflow-hidden min-h-[85vh] flex flex-col">
        {/* Layered background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a3d0a] via-primary to-secondary" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(232,168,56,0.15),transparent_60%)]" />
        <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-40" aria-hidden="true" />
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(255,255,255,0.5) 50px), repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(255,255,255,0.5) 50px)', backgroundSize: '50px 50px' }} aria-hidden="true" />

        {/* Content */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
          {/* Logo with glow */}
          <div className="animate-fade-in-up mb-8">
            <div className="relative">
              <div className="absolute inset-0 blur-2xl bg-accent/20 rounded-full scale-150" aria-hidden="true" />
              <div className="relative w-32 h-32 rounded-full bg-black/20 border-2 border-accent/50 flex items-center justify-center backdrop-blur-md shadow-2xl shadow-black/30 ring-1 ring-white/10">
                <img
                  src="https://media.base44.com/images/public/69bd90cf71e1b676eaaeb41f/1752bc3ba_CowtownMastersLogo.png"
                  alt="Cowtown Masters logo"
                  className="w-24 h-24 object-contain drop-shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* Title stack */}
          <div className="text-center mb-8">
            <p
              className="animate-fade-in-up text-[10px] tracking-[0.4em] text-accent/80 font-bold uppercase mb-3"
              style={{ animationDelay: '100ms' }}
            >
              Welcome to the
            </p>
            <h1
              className="animate-fade-in-up text-5xl md:text-6xl font-black text-primary-foreground leading-[0.9] mb-3"
              style={{ fontFamily: "'Playfair Display', serif", animationDelay: '150ms' }}
            >
              COWTOWN
              <br />
              <span className="text-accent">MASTERS</span>
            </h1>
            <div
              className="animate-fade-in-up flex items-center justify-center gap-3 mb-5"
              style={{ animationDelay: '250ms' }}
            >
              <span className="h-px w-10 bg-accent/40" aria-hidden="true" />
              <p className="text-[10px] tracking-[0.3em] text-primary-foreground/60 font-semibold uppercase">
                A Tradition Unlike Any Other
              </p>
              <span className="h-px w-10 bg-accent/40" aria-hidden="true" />
            </div>
            <p
              className="animate-fade-in-up text-sm text-primary-foreground/50 max-w-xs mx-auto leading-relaxed"
              style={{ animationDelay: '350ms' }}
            >
              The ultimate Masters golf pool experience. Hat draw, live leaderboards, and year-long bragging rights.
            </p>
          </div>

          {/* CTA Buttons */}
          <div
            className="animate-fade-in-up w-full max-w-xs space-y-3"
            style={{ animationDelay: '450ms' }}
          >
            <Button
              onClick={() => setShowCreatePool(true)}
              className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-black text-sm tracking-wide rounded-xl shadow-xl shadow-accent/30 transition-all hover:shadow-2xl hover:shadow-accent/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-5 h-5 mr-2" aria-hidden="true" />
              CREATE A POOL
            </Button>
            <Button
              onClick={() => setShowJoinPool(true)}
              className="w-full h-12 bg-white/10 hover:bg-white/20 text-primary-foreground font-bold text-sm border border-white/20 rounded-xl backdrop-blur-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              Join with Invite Code
            </Button>
          </div>
        </div>

        {/* Fade to content */}
        <div className="relative h-16 bg-gradient-to-b from-transparent to-background" />
      </div>

      {/* Your Pools Section */}
      <div className="relative z-10 px-4 max-w-md mx-auto w-full -mt-4">
        {pools.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Trophy className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-black text-foreground tracking-[0.15em] uppercase">Your Pools</h3>
            </div>
            <div className="space-y-2.5">
              {pools.map((pool, i) => (
                <Link
                  key={pool.id}
                  to={`/pool/${pool.id}`}
                  className="animate-fade-in-up flex items-center gap-3.5 bg-card rounded-2xl p-4 border border-border hover:border-primary/40 shadow-sm hover:shadow-lg transition-all group"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/20 group-hover:shadow-lg group-hover:shadow-primary/30 transition-all">
                    <Trophy className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{pool.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{pool.year}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      <span className="text-xs font-mono text-muted-foreground/70 tracking-wider">{pool.invite_code}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full tracking-wider uppercase ${
                      pool.status === 'live'
                        ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                        : pool.status === 'draft'
                        ? 'bg-accent/15 text-accent'
                        : pool.status === 'complete'
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {pool.status === 'live' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-pulse" />}
                      {pool.status?.toUpperCase()}
                    </span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Zap className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-black text-foreground tracking-[0.15em] uppercase">How It Works</h3>
          </div>
          <div className="space-y-0">
            {[
              { step: '01', Icon: Users, title: 'Gather Your Crew', desc: 'Invite friends, family, and rivals to join your pool.' },
              { step: '02', Icon: Shuffle, title: 'The Hat Draw', desc: 'Each entry gets a Top Tier and Bottom Tier golfer by random draw.' },
              { step: '03', Icon: Tv, title: 'Watch It Play Out', desc: 'Live leaderboard updates all four rounds of the Masters.' },
              { step: '04', Icon: Trophy, title: 'Collect the Glory', desc: 'Winner takes the pot and earns year-long bragging rights.' },
            ].map((item, i) => (
              <div
                key={i}
                className="animate-fade-in-up flex items-start gap-4 p-4 relative"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Connector line */}
                {i < 3 && (
                  <div className="absolute left-[27px] top-[52px] w-px h-[calc(100%-32px)] bg-border" aria-hidden="true" />
                )}
                <div className="w-[22px] h-[22px] rounded-full bg-accent/15 border-2 border-accent flex items-center justify-center flex-shrink-0 mt-0.5 relative z-10">
                  <span className="text-[8px] font-black text-accent">{item.step}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <item.Icon className="w-4 h-4 text-primary" aria-hidden="true" />
                    <h4 className="font-bold text-foreground text-sm">{item.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Flag className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-black text-foreground tracking-[0.15em] uppercase">Built for This</h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { Icon: Shuffle, title: 'Hat Draw', desc: 'Randomized & recorded', gradient: 'from-primary to-secondary', iconColor: 'text-accent' },
              { Icon: Tv, title: 'Live Scores', desc: 'Real-time leaderboard', gradient: 'from-red-700 to-red-900', iconColor: 'text-red-200' },
              { Icon: MessageCircle, title: 'Smack Talk', desc: 'Group chat & DMs', gradient: 'from-accent to-amber-700', iconColor: 'text-white' },
              { Icon: Flag, title: 'Full Field', desc: 'Top & Bottom Tier', gradient: 'from-emerald-700 to-emerald-900', iconColor: 'text-emerald-200' },
            ].map((f, i) => (
              <div
                key={i}
                className="animate-fade-in-up bg-card rounded-xl p-4 border border-border hover:border-primary/30 hover:shadow-md transition-all group"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                  <f.Icon className={`w-5 h-5 ${f.iconColor}`} aria-hidden="true" />
                </div>
                <h4 className="font-bold text-foreground text-sm mb-0.5">{f.title}</h4>
                <p className="text-[11px] text-muted-foreground leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA strip */}
        <div className="mb-6 bg-gradient-to-r from-primary to-secondary rounded-2xl p-5 border border-accent/20 text-center relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-30" aria-hidden="true" />
          <div className="relative">
            <p className="text-[10px] tracking-[0.3em] text-accent font-bold uppercase mb-1">Ready?</p>
            <p className="text-lg font-black text-primary-foreground mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              Start Your Pool Today
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowCreatePool(true)}
                className="flex-1 h-11 bg-accent hover:bg-accent/90 text-white font-bold rounded-lg shadow-lg shadow-accent/20"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Create
              </Button>
              <Button
                onClick={() => setShowJoinPool(true)}
                className="flex-1 h-11 bg-white/15 hover:bg-white/25 text-primary-foreground font-bold rounded-lg border border-white/20"
              >
                Join
              </Button>
            </div>
          </div>
        </div>

        {/* Footer attribution */}
        <div className="flex items-center justify-center gap-2 pb-6 pt-2">
          <span className="text-[10px] text-muted-foreground/40 tracking-wide">Created by</span>
          <a
            href="https://cinderandcrown.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:opacity-80 transition focus:outline-none focus:ring-2 focus:ring-accent rounded"
            aria-label="Visit Cinder and Crown website (opens in new tab)"
          >
            <svg width="14" height="14" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="flex-shrink-0">
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
            <span className="text-[10px] font-bold text-muted-foreground/60 tracking-wide">Cinder & Crown</span>
          </a>
        </div>
      </div>

      {/* Create Pool Dialog */}
      <Dialog open={showCreatePool} onOpenChange={setShowCreatePool}>
        <DialogContent className="bg-card rounded-2xl max-w-sm border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Create a Pool</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Pool Name</label>
              <Input value={poolName} onChange={(e) => setPoolName(e.target.value)} className="border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Year</label>
                <Input type="number" value={poolYear} onChange={(e) => setPoolYear(Number(e.target.value))} className="border-border" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Entry Fee ($)</label>
                <Input type="number" value={entryFee} onChange={(e) => setEntryFee(Number(e.target.value))} className="border-border" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">The full Masters field will be auto-loaded and split into equal Top Tier / Bottom Tier groups based on your entry count.</p>
            <div className="pt-2 flex gap-2">
              <Button variant="outline" onClick={() => setShowCreatePool(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleCreatePool} disabled={creating} className="flex-1 bg-primary hover:bg-primary/90 text-white">
                {creating ? 'Creating...' : 'Create Pool'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Pool Dialog */}
      <Dialog open={showJoinPool} onOpenChange={setShowJoinPool}>
        <DialogContent className="bg-card rounded-2xl max-w-sm border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Join a Pool</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Invite Code</label>
              <Input
                placeholder="e.g., COW26"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="border-border font-mono text-lg tracking-widest text-center"
                maxLength="6"
              />
            </div>
            <div className="pt-2 flex gap-2">
              <Button variant="outline" onClick={() => setShowJoinPool(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleJoinPool} className="flex-1 bg-primary hover:bg-primary/90 text-white">Join Pool</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
