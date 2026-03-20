import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { GreenJacketIcon } from '@/components/icons/GreenJacketIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Home() {
  const navigate = useNavigate();
  const [showCreatePool, setShowCreatePool] = useState(false);
  const [showJoinPool, setShowJoinPool] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [poolName, setPoolName] = useState('');
  const [poolYear, setPoolYear] = useState(new Date().getFullYear());

  const { data: pools = [] } = useQuery({
    queryKey: ['pools'],
    queryFn: () => base44.entities.Pool.list(),
  });

  const handleCreatePool = () => {
    if (poolName.trim()) {
      // TODO: Create pool via Base44 API
      navigate(`/pool/new?name=${poolName}&year=${poolYear}`);
    }
  };

  const handleJoinPool = () => {
    if (inviteCode.trim()) {
      // TODO: Join pool via invite code
      navigate(`/pool/join?code=${inviteCode}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-sand flex flex-col items-center justify-center px-4 pb-12">
      {/* Hero Section */}
      <div className="text-center mb-12 mt-8">
        <div className="mb-4 flex justify-center">
          <GreenJacketIcon size={80} />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          COWTOWN MASTERS
        </h1>
        <p className="text-sm tracking-widest text-accent uppercase mb-4">A Tradition Unlike Any Other</p>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Transform your Masters pool from spreadsheets to a live, real-time leaderboard experience. Draft golfers, track scores, celebrate wins.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 w-full max-w-md">
        <div className="bg-white rounded-lg p-4 border border-primary/20 shadow-sm">
          <div className="text-2xl mb-2">🎩</div>
          <h3 className="font-bold text-primary text-sm">Hat Draw Draft</h3>
          <p className="text-xs text-muted-foreground">Random golfer assignment</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-primary/20 shadow-sm">
          <div className="text-2xl mb-2">📊</div>
          <h3 className="font-bold text-primary text-sm">Live Leaderboard</h3>
          <p className="text-xs text-muted-foreground">Real-time score updates</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-primary/20 shadow-sm">
          <div className="text-2xl mb-2">🏆</div>
          <h3 className="font-bold text-primary text-sm">Champions Wall</h3>
          <p className="text-xs text-muted-foreground">Pool history & stats</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-primary/20 shadow-sm">
          <div className="text-2xl mb-2">⛳</div>
          <h3 className="font-bold text-primary text-sm">Group A & B Split</h3>
          <p className="text-xs text-muted-foreground">Favorites vs longshots</p>
        </div>
      </div>

      {/* Active Pools */}
      {pools.length > 0 && (
        <div className="w-full max-w-md mb-6 space-y-2">
          <h3 className="text-sm font-bold text-primary tracking-widest uppercase text-center mb-3">Active Pools</h3>
          {pools.map((pool) => (
            <Link
              key={pool.id}
              to={`/pool/${pool.id}`}
              className="flex items-center justify-between bg-white rounded-lg p-4 border border-primary/20 shadow-sm hover:shadow-md hover:border-primary/40 transition"
            >
              <div>
                <p className="font-bold text-foreground">{pool.name}</p>
                <p className="text-xs text-muted-foreground">{pool.year} · Code: {pool.invite_code}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                pool.status === 'live' ? 'bg-red-100 text-red-700' : pool.status === 'draft' ? 'bg-accent/20 text-accent' : 'bg-primary/10 text-primary'
              }`}>
                {pool.status?.toUpperCase()}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* CTA Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-md">
        <Button
          onClick={() => setShowCreatePool(true)}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-md"
        >
          ✨ Create a Pool
        </Button>
        <Button
          onClick={() => setShowJoinPool(true)}
          variant="outline"
          className="w-full border-2 border-primary text-primary font-bold py-3 rounded-lg"
        >
          🔗 Join with Code
        </Button>
      </div>

      {/* Create Pool Dialog */}
      <Dialog open={showCreatePool} onOpenChange={setShowCreatePool}>
        <DialogContent className="bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Create a Pool</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Pool Name</label>
              <Input
                placeholder="Cowtown Masters 2026"
                value={poolName}
                onChange={(e) => setPoolName(e.target.value)}
                className="border-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Year</label>
              <Input
                type="number"
                value={poolYear}
                onChange={(e) => setPoolYear(Number(e.target.value))}
                className="border-primary/30"
              />
            </div>
            <div className="pt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreatePool(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePool}
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Pool Dialog */}
      <Dialog open={showJoinPool} onOpenChange={setShowJoinPool}>
        <DialogContent className="bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Join a Pool</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Invite Code</label>
              <Input
                placeholder="e.g., ABC123"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="border-primary/30 font-mono text-lg tracking-widest"
                maxLength="6"
              />
              <p className="text-xs text-muted-foreground mt-2">Ask your pool admin for the invite code</p>
            </div>
            <div className="pt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowJoinPool(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleJoinPool}
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
              >
                Join
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}