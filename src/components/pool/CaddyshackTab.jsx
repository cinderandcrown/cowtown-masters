import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { ScrollText, RefreshCw, Loader2, Trophy } from 'lucide-react';
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

export default function CaddyshackTab({ poolId }) {
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

  const roundStatus = useMemo(() => {
    const todayStr = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; })();
    const roundDate = ROUND_DATES[activeRound];
    if (activeRound === 5 || !roundDate) return todayStr > '2026-04-12' ? 'complete' : 'not_started';
    if (todayStr < roundDate) return 'not_started';
    const rKey = `round_${activeRound}`;
    // Only consider golfers who have ANY tournament data (score, thru, or position)
    // Golfers with no data at all are not in the feed (withdrawn before tournament / not participating)
    const participatingGolfers = golfers.filter(g => g.status === 'active' && (g.round_1 != null || g.thru || g.position));
    if (participatingGolfers.length === 0) return 'not_started';
    const finished = participatingGolfers.filter(g => {
      if (g[rKey] == null) return false;
      const thru = (g.thru || '').toUpperCase();
      return thru === 'F' || thru === '18' || thru === 'FINISHED';
    });
    if (finished.length < participatingGolfers.length) return 'in_progress';
    return 'complete';
  }, [activeRound, golfers]);

  const golfersOnCourse = useMemo(() => {
    if (activeRound === 5) return 0;
    const rKey = `round_${activeRound}`;
    // Only count golfers who are actually participating in the tournament
    return golfers.filter(g => {
      if (g.status !== 'active') return false;
      // Skip golfers with no tournament data at all (not in feed)
      if (g.round_1 == null && !g.thru && !g.position) return false;
      const thru = (g.thru || '').toUpperCase();
      return g[rKey] == null || (thru !== 'F' && thru !== '18' && thru !== 'FINISHED');
    }).length;
  }, [activeRound, golfers]);

  const sortedRecaps = useMemo(() => {
    return [...recaps].sort((a, b) => (a.team_rank_for_round || 999) - (b.team_rank_for_round || 999));
  }, [recaps]);

  const isFinalTab = activeRound === 5;

  const handleRegenerate = async () => {
    setShowConfirm(false);
    setGenerating(true);
    try {
      const fn = isFinalTab ? 'generateTournamentRecaps' : 'generateRoundRecaps';
      const payload = isFinalTab
        ? { tournament_year: 2026, force_regenerate: true }
        : { round_number: activeRound, tournament_year: 2026, force_regenerate: true };
      await base44.functions.invoke(fn, payload);
      toast.success(isFinalTab ? 'Tournament reports regenerated!' : `Round ${activeRound} reports regenerated!`);
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
      const fn = isFinalTab ? 'generateTournamentRecaps' : 'generateRoundRecaps';
      const payload = isFinalTab
        ? { tournament_year: 2026, force_regenerate: false }
        : { round_number: activeRound, tournament_year: 2026, force_regenerate: false };
      await base44.functions.invoke(fn, payload);
      toast.success(isFinalTab ? 'Tournament reports generated!' : `Round ${activeRound} reports generated!`);
      refetch();
    } catch (e) {
      toast.error('Failed to generate: ' + (e.message || 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="px-3 pt-3 pb-4">
      {/* Page header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
          <ScrollText className="w-4.5 h-4.5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            The Caddyshack Report
          </h1>
          <p className="text-[10px] text-muted-foreground italic">Where your bad picks come to die</p>
        </div>
      </div>

      {/* Round tabs + admin */}
      <div className="flex items-center justify-between mb-4">
        <RecapRoundTabs activeRound={activeRound} onRoundChange={setActiveRound} />
        {isAdmin && (
          <div className="flex gap-1.5">
            {recaps.length === 0 && roundStatus === 'complete' && (
              <Button size="sm" onClick={handleGenerate} disabled={generating} className="text-xs font-bold gap-1">
                {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <ScrollText className="w-3 h-3" />}
                Generate
              </Button>
            )}
            {recaps.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => setShowConfirm(true)} disabled={generating} className="text-xs font-bold gap-1">
                {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Re-roll
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {generating && <RecapEmptyState roundNumber={activeRound} status="generating" />}

      {!generating && isLoading && (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
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
        <div className="space-y-3">
          {sortedRecaps.map(recap => (
            <RecapCard key={recap.id} recap={recap} totalEntries={entries.length} roundNumber={activeRound} />
          ))}
        </div>
      )}

      {/* Confirm dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', serif" }}>Regenerate {isFinalTab ? 'Tournament' : `Round ${activeRound}`} Reports?</DialogTitle>
            <DialogDescription>
              This will re-roll ALL {isFinalTab ? 'tournament' : `Round ${activeRound}`} recaps using AI. Current roasts will be replaced. Takes about 30-60 seconds.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button onClick={handleRegenerate}>Re-roll Reports</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}