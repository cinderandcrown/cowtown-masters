import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';


export default function Home() {
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
    <div className="relative min-h-screen bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center px-4 pb-12">
      {/* Account Link */}
      <div className="absolute top-4 right-4 z-10">
        <Link to="/account" className="p-2 rounded-full hover:bg-muted/50 transition">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </Link>
      </div>

      {/* Hero */}
      <div className="text-center mb-10 mt-8">
        <div className="mb-4 flex justify-center">
          <img src="https://media.base44.com/images/public/69bd90cf71e1b676eaaeb41f/1752bc3ba_CowtownMastersLogo.png" alt="Cowtown Masters" className="w-36 h-36 object-contain" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          COWTOWN MASTERS
        </h1>
        <p className="text-sm tracking-widest text-accent uppercase mb-4">A Tradition Unlike Any Other</p>
        <p className="text-muted-foreground max-w-sm mx-auto text-sm">
          The ultimate Masters pool experience. Full field, hat draw, live TV-style leaderboard.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 gap-3 mb-8 w-full max-w-sm">
        {[
          { icon: '🎩', title: 'Hat Draw', desc: 'Random assignment' },
          { icon: '📺', title: 'Live Scoreboard', desc: 'TV-style leaderboard' },
          { icon: '🏆', title: 'Pool Standings', desc: 'Real-time rankings' },
          { icon: '⛳', title: 'Full Field', desc: '70+ golfers loaded' },
        ].map((f, i) => (
          <div key={i} className="bg-card rounded-lg p-3 border border-primary/20 shadow-sm text-center">
            <div className="text-2xl mb-1">{f.icon}</div>
            <h3 className="font-bold text-primary text-xs">{f.title}</h3>
            <p className="text-[10px] text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Active Pools */}
      {pools.length > 0 && (
        <div className="w-full max-w-sm mb-6 space-y-2">
          <h3 className="text-xs font-bold text-primary tracking-widest uppercase text-center mb-2">Your Pools</h3>
          {pools.map((pool) => (
            <Link
              key={pool.id}
              to={`/pool/${pool.id}`}
              className="flex items-center justify-between bg-card rounded-lg p-3 border border-primary/20 shadow-sm hover:shadow-md transition"
            >
              <div>
                <p className="font-bold text-foreground text-sm">{pool.name}</p>
                <p className="text-xs text-muted-foreground">{pool.year} · {pool.invite_code}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                pool.status === 'live' ? 'bg-red-100 text-red-700' : pool.status === 'draft' ? 'bg-accent/20 text-accent' : 'bg-primary/10 text-primary'
              }`}>
                {pool.status?.toUpperCase()}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <Button onClick={() => setShowCreatePool(true)} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3">
          ✨ Create a Pool
        </Button>
        <Button onClick={() => setShowJoinPool(true)} variant="outline" className="w-full border-2 border-primary text-primary font-bold py-3">
          🔗 Join with Code
        </Button>
      </div>

      {/* Create Pool Dialog */}
      <Dialog open={showCreatePool} onOpenChange={setShowCreatePool}>
        <DialogContent className="bg-card rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">Create a Pool</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="block text-xs font-semibold mb-1">Pool Name</label>
              <Input value={poolName} onChange={(e) => setPoolName(e.target.value)} className="border-primary/30" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Year</label>
                <Input type="number" value={poolYear} onChange={(e) => setPoolYear(Number(e.target.value))} className="border-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Entry Fee ($)</label>
                <Input type="number" value={entryFee} onChange={(e) => setEntryFee(Number(e.target.value))} className="border-primary/30" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">The full 2026 Masters field (~70 golfers) will be auto-loaded.</p>
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
        <DialogContent className="bg-card rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">Join a Pool</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="block text-xs font-semibold mb-1">Invite Code</label>
              <Input
                placeholder="e.g., ABC123"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="border-primary/30 font-mono text-lg tracking-widest"
                maxLength="6"
              />
            </div>
            <div className="pt-2 flex gap-2">
              <Button variant="outline" onClick={() => setShowJoinPool(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleJoinPool} className="flex-1 bg-primary hover:bg-primary/90 text-white">Join</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}