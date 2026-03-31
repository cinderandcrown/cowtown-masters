import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Settings, Trophy, Shuffle, Tv, Flag, ChevronRight, Users, Sparkles } from 'lucide-react';
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
        <Link to="/account" className="p-2 rounded-full hover:bg-muted/50 transition" aria-label="Account settings">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </Link>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-secondary via-primary to-secondary" />
        <div className="absolute inset-0 animate-shimmer pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />

        <div className="relative px-4 pt-12 pb-20 flex flex-col items-center text-center">
          {/* Logo */}
          <div className="animate-fade-in-up mb-6">
            <div className="w-28 h-28 rounded-full bg-white/10 border-2 border-accent/40 flex items-center justify-center backdrop-blur-sm shadow-lg shadow-black/20">
              <img
                src="https://media.base44.com/images/public/69bd90cf71e1b676eaaeb41f/1752bc3ba_CowtownMastersLogo.png"
                alt="Cowtown Masters logo"
                className="w-20 h-20 object-contain"
              />
            </div>
          </div>

          {/* Title */}
          <h1
            className="animate-fade-in-up text-4xl md:text-5xl font-black text-primary-foreground tracking-tight mb-2"
            style={{ fontFamily: "'Playfair Display', serif", animationDelay: '100ms' }}
          >
            COWTOWN MASTERS
          </h1>
          <p
            className="animate-fade-in-up text-xs tracking-[0.3em] text-accent font-bold uppercase mb-4"
            style={{ animationDelay: '200ms' }}
          >
            A Tradition Unlike Any Other
          </p>
          <p
            className="animate-fade-in-up text-sm text-primary-foreground/60 max-w-xs mx-auto leading-relaxed"
            style={{ animationDelay: '300ms' }}
          >
            The ultimate Masters golf pool. Random draw, live scoring, and bragging rights that last all year.
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 -mt-8 relative z-10 px-4 max-w-md mx-auto w-full">

        {/* Active Pools */}
        {pools.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[10px] font-black text-primary tracking-[0.2em] uppercase mb-2 px-1">Your Pools</h3>
            <div className="space-y-2">
              {pools.map((pool, i) => (
                <Link
                  key={pool.id}
                  to={`/pool/${pool.id}`}
                  className="animate-fade-in-up flex items-center gap-3 bg-card rounded-xl p-4 border border-border hover:border-primary/40 shadow-sm hover:shadow-md transition-all group"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm truncate">{pool.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{pool.year}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      <span className="text-[10px] font-mono text-muted-foreground tracking-wider">{pool.invite_code}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full tracking-wider uppercase ${
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
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Feature Cards */}
        <div className="mb-6">
          <h3 className="text-[10px] font-black text-primary tracking-[0.2em] uppercase mb-2 px-1">Features</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { Icon: Shuffle, title: 'Hat Draw', desc: 'Pure luck of the draw', color: 'from-primary to-secondary' },
              { Icon: Tv, title: 'Live Scoring', desc: 'ESPN-style leaderboard', color: 'from-red-600 to-red-800' },
              { Icon: Users, title: 'Smack Talk', desc: 'Built-in group chat', color: 'from-accent to-amber-600' },
              { Icon: Flag, title: 'Full Field', desc: '90+ Masters golfers', color: 'from-emerald-600 to-emerald-800' },
            ].map((f, i) => (
              <div
                key={i}
                className="animate-fade-in-up bg-card rounded-xl p-3.5 border border-border hover:border-primary/30 hover:shadow-md transition-all group"
                style={{ animationDelay: `${(i + pools.length) * 60}ms` }}
              >
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${f.color} flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform`}>
                  <f.Icon className="w-4.5 h-4.5 text-white" aria-hidden="true" />
                </div>
                <h4 className="font-bold text-foreground text-sm mb-0.5">{f.title}</h4>
                <p className="text-[11px] text-muted-foreground leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-2.5 mb-8">
          <Button
            onClick={() => setShowCreatePool(true)}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-bold py-3 h-12 rounded-xl shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
          >
            <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
            Create a Pool
          </Button>
          <Button
            onClick={() => setShowJoinPool(true)}
            variant="outline"
            className="w-full border-2 border-primary/30 text-primary font-bold py-3 h-12 rounded-xl hover:bg-primary/5 hover:border-primary/50 transition-all"
          >
            Join with Invite Code
          </Button>
        </div>

        {/* Footer attribution */}
        <div className="flex items-center justify-center gap-2 pb-8">
          <span className="text-[10px] text-muted-foreground/50 tracking-wide">Created by</span>
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
            <span className="text-[10px] font-bold text-accent/70 tracking-wide">Cinder & Crown</span>
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
            <p className="text-xs text-muted-foreground">The full 2026 Masters field (~90 golfers) will be auto-loaded.</p>
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
