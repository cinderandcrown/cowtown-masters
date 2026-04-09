import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { ScrollText, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import RecapCard from '@/components/pool/RecapCard';
import RecapRoundTabs from '@/components/pool/RecapRoundTabs';
import RecapEmptyState from '@/components/pool/RecapEmptyState';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const ROUND_DATES = { 1: '2026-04-09', 2: '2026-04-10', 3: '2026-04-11', 4: '2026-04-12' };

function getCurrentRound() {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  for (let r = 4; r >= 1; r--) {
    if (todayStr >= ROUND_DATES[r]) return r;
  }
  return 1;
}

export default function CaddyshackReport() {
  const { poolId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const [activeRound, setActiveRound] = useState(getCurrentRound());
  const [showConfirm, setShowConfirm] = useState(false);
  const [generating, setGenerating] = useState(false);

  const { data: pool } = useQuery({
    queryKey: ['pool', poolId],
    queryFn: () => base44.entities.Pool.filter({ id: poolId }),
    enabled: !!poolId,
    select: d => d[0],
  });

  const { data: recaps = [], isLoading, refetch } = useQuery({
    queryKey: ['roundRecaps', poolId, activeRound],
    queryFn: () => base44.entities.RoundRecap.filter({ pool_id: poolId, round_number: activeRound, tournament_year: 2026 }),
    enabled: !!poolId,
  });

  const { data: golfers = [] } = useQuery({
    queryKey: ['poolGolfers', poolId],
    queryFn: () => base44.entities.Golfer.filter({ pool_id: poolId }),
    enabled: !!poolId,
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['poolEntries', poolId],
    queryFn: () => base44.entities.PoolEntry.filter({ pool_id: poolId }),
    enabled: !!poolId,
  });

  const isAdmin = user?.role === 'admin' || user?.email === pool?.admin_user_id || user?.email === pool?.created_by;

  // Determine empty state status
  const roundStatus = useMemo(() => {
    const todayStr = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; })();
    const roundDate = ROUND_DATES[activeRound];
    if (todayStr < roundDate) return 'not_started';

    const rKey = `round_${activeRound}`;
    const activeG = golfers.filter(g => g.status === 'active');
    const finished = activeG.filter(g => {
      if (g[rKey] == null) return false;
      const thru = (g.thru || '').toUpperCase();
      return thru === 'F' || thru === '18' || thru === 'FINISHED';
    });
    if (finished.length < activeG.length && activeG.length > 0) return 'in_progress';
    return 'complete';
  }, [activeRound, golfers]);

  const golfersOnCourse = useMemo(() => {
    const rKey = `round_${activeRound}`;
    return golfers.filter(g => {
      if (g.status !== 'active') return false;
      const thru = (g.thru || '').toUpperCase();
      return g[rKey] == null || (thru !== 'F' && thru !== '18' && thru !== 'FINISHED');
    }).length;
  }, [activeRound, golfers]);

  const sortedRecaps = useMemo(() => {
    return [...recaps].sort((a, b) => (a.team_rank_for_round || 999) - (b.team_rank_for_round || 999));
  }, [recaps]);

  const handleRegenerate = async () => {
    setShowConfirm(false);
    setGenerating(true);
    try {
      await base44.functions.invoke('generateRoundRecaps', {
        round_number: activeRound,
        tournament_year: 2026,
        force_regenerate: true,
      });
      toast.success(`Round ${activeRound} reports regenerated!`);
      refetch();
    } catch (e) {
      toast.error('Failed to regenerate: ' + (e.message || 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await base44.functions.invoke('generateRoundRecaps', {
        round_number: activeRound,
        tournament_year: 2026,
        force_regenerate: false,
      });
      toast.success(`Round ${activeRound} reports generated!`);
      refetch();
    } catch (e) {
      toast.error('Failed to generate: ' + (e.message || 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1510] to-[#0a0a0a] border-b border-[#d4a574]/20 px-4 pt-5 pb-4">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(`/pool/${poolId}/leaderboard`)} className="flex items-center gap-1.5 text-[#d4a574]/60 text-xs font-bold mb-3 hover:text-[#d4a574] transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Pool
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-[#d4a574]/10 flex items-center justify-center border border-[#d4a574]/20">
              <ScrollText className="w-5 h-5 text-[#d4a574]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                The Caddyshack Report
              </h1>
              <p className="text-xs text-[#d4a574]/50 font-medium italic">Where your bad picks come to die</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Round tabs + admin actions */}
        <div className="flex items-center justify-between mb-4">
          <RecapRoundTabs activeRound={activeRound} onRoundChange={setActiveRound} />
          {isAdmin && (
            <div className="flex gap-1.5">
              {recaps.length === 0 && roundStatus === 'complete' && (
                <Button
                  size="sm"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="bg-[#d4a574] text-black hover:bg-[#c49564] text-xs font-bold gap-1"
                >
                  {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <ScrollText className="w-3 h-3" />}
                  Generate
                </Button>
              )}
              {recaps.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowConfirm(true)}
                  disabled={generating}
                  className="border-[#d4a574]/30 text-[#d4a574] hover:bg-[#d4a574]/10 text-xs font-bold gap-1"
                >
                  {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Re-roll
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Loading */}
        {generating && (
          <RecapEmptyState roundNumber={activeRound} status="generating" />
        )}

        {/* Content */}
        {!generating && isLoading && (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 text-[#d4a574] animate-spin mx-auto" />
          </div>
        )}

        {!generating && !isLoading && sortedRecaps.length === 0 && (
          <RecapEmptyState
            roundNumber={activeRound}
            status={roundStatus === 'complete' ? 'no_reports' : roundStatus}
            golfersOnCourse={golfersOnCourse}
          />
        )}

        {!generating && !isLoading && sortedRecaps.length > 0 && (
          <div className="space-y-4">
            {sortedRecaps.map(recap => (
              <RecapCard
                key={recap.id}
                recap={recap}
                totalEntries={entries.length}
                roundNumber={activeRound}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-[#111] border-[#d4a574]/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Regenerate Round {activeRound}?</DialogTitle>
            <DialogDescription className="text-white/50">
              This will re-roll ALL recaps for Round {activeRound} using AI. The current roasts will be replaced. This takes about 30-60 seconds.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="border-white/20 text-white/60 hover:text-white">Cancel</Button>
            <Button onClick={handleRegenerate} className="bg-[#d4a574] text-black hover:bg-[#c49564] font-bold">🔄 Re-roll Reports</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}