import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { assignGroups } from '@/lib/groupUtils';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shuffle, PenLine, Check, RotateCcw, Lock, ShieldAlert, Trophy, Users } from 'lucide-react';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function DrawTab({ poolId }) {
  const queryClient = useQueryClient();
  const { user } = useAuth() || {};
  const [drawMode, setDrawMode] = useState('random');
  const [phase, setPhase] = useState('ready');
  const [assignments, setAssignments] = useState([]);
  const [revealIndex, setRevealIndex] = useState(-1);
  const [currentFlash, setCurrentFlash] = useState(null);
  const [manualPicks, setManualPicks] = useState({});
  const [lockedEntries, setLockedEntries] = useState({});

  const { data: pool } = useQuery({
    queryKey: ['pool', poolId],
    queryFn: () => base44.entities.Pool.filter({ id: poolId }),
    enabled: !!poolId,
    select: (data) => data[0],
  });

  const isAdmin = user?.role === 'admin' || user?.email === pool?.admin_user_id || user?.email === pool?.created_by;

  const { data: entries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['poolEntries', poolId],
    queryFn: () => base44.entities.PoolEntry.filter({ pool_id: poolId }),
    enabled: !!poolId,
  });

  const { data: rawGolfers = [], isLoading: loadingGolfers } = useQuery({
    queryKey: ['poolGolfers', poolId],
    queryFn: () => base44.entities.Golfer.filter({ pool_id: poolId }),
    enabled: !!poolId,
  });

  const golfers = assignGroups(rawGolfers, entries.length);
  const groupA = golfers.filter(g => g.group === 'A');
  const groupB = golfers.filter(g => g.group === 'B');
  const alreadyDrawn = entries.length > 0 && entries.every(e => e.golfer_a_id && e.golfer_b_id);

  const saveMutation = useMutation({
    mutationFn: async (pairs) => {
      for (const pair of pairs) {
        await base44.entities.PoolEntry.update(pair.entryId, { golfer_a_id: pair.golferA.id, golfer_b_id: pair.golferB.id });
        await base44.entities.Golfer.update(pair.golferA.id, { is_drafted: true, drafted_by: pair.entryId });
        await base44.entities.Golfer.update(pair.golferB.id, { is_drafted: true, drafted_by: pair.entryId });
      }
    },
    onMutate: async (pairs) => {
      await queryClient.cancelQueries({ queryKey: ['poolEntries', poolId] });
      await queryClient.cancelQueries({ queryKey: ['poolGolfers', poolId] });
      const prevEntries = queryClient.getQueryData(['poolEntries', poolId]);
      const prevGolfers = queryClient.getQueryData(['poolGolfers', poolId]);
      queryClient.setQueryData(['poolEntries', poolId], (old = []) =>
        old.map(e => { const pair = pairs.find(p => p.entryId === e.id); return pair ? { ...e, golfer_a_id: pair.golferA.id, golfer_b_id: pair.golferB.id } : e; })
      );
      queryClient.setQueryData(['poolGolfers', poolId], (old = []) =>
        old.map(g => { const pair = pairs.find(p => p.golferA.id === g.id || p.golferB.id === g.id); return pair ? { ...g, is_drafted: true, drafted_by: pair.entryId } : g; })
      );
      return { prevEntries, prevGolfers };
    },
    onError: (_err, _pairs, context) => {
      if (context?.prevEntries) queryClient.setQueryData(['poolEntries', poolId], context.prevEntries);
      if (context?.prevGolfers) queryClient.setQueryData(['poolGolfers', poolId], context.prevGolfers);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['poolEntries', poolId] });
      queryClient.invalidateQueries({ queryKey: ['poolGolfers', poolId] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      for (const entry of entries) {
        if (entry.golfer_a_id || entry.golfer_b_id) {
          await base44.entities.PoolEntry.update(entry.id, { golfer_a_id: '', golfer_b_id: '' });
        }
      }
      for (const g of rawGolfers) {
        if (g.is_drafted) {
          await base44.entities.Golfer.update(g.id, { is_drafted: false, drafted_by: '' });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poolEntries', poolId] });
      queryClient.invalidateQueries({ queryKey: ['poolGolfers', poolId] });
      setPhase('ready');
      setAssignments([]);
      setManualPicks({});
      setLockedEntries({});
    },
  });

  const runDraw = () => {
    if (entries.length === 0) return;
    const shuffledA = shuffle(groupA);
    const shuffledB = shuffle(groupB);
    const pairs = entries.map((entry, i) => ({
      entryId: entry.id,
      participantName: entry.participant_name,
      golferA: shuffledA[i % shuffledA.length],
      golferB: shuffledB[i % shuffledB.length],
    }));
    setAssignments(pairs);
    setPhase('animating');
    let count = 0;
    const interval = setInterval(() => {
      setCurrentFlash({
        a: shuffledA[Math.floor(Math.random() * shuffledA.length)]?.name,
        b: shuffledB[Math.floor(Math.random() * shuffledB.length)]?.name,
      });
      count++;
      if (count > 20) {
        clearInterval(interval);
        setCurrentFlash(null);
        setPhase('revealing');
        setRevealIndex(0);
      }
    }, 100);
  };

  const revealNext = () => {
    if (revealIndex < assignments.length - 1) {
      setRevealIndex(prev => prev + 1);
    } else {
      setPhase('complete');
      saveMutation.mutate(assignments);
    }
  };

  // Manual draw helpers
  const usedGolferAIds = new Set(Object.values(manualPicks).map(p => p.golferAId).filter(Boolean));
  const usedGolferBIds = new Set(Object.values(manualPicks).map(p => p.golferBId).filter(Boolean));
  const dbDraftedIds = new Set(rawGolfers.filter(g => g.is_drafted).map(g => g.id));
  const availableGroupA = (entryId) => groupA.filter(g => (!usedGolferAIds.has(g.id) && !dbDraftedIds.has(g.id)) || manualPicks[entryId]?.golferAId === g.id);
  const availableGroupB = (entryId) => groupB.filter(g => (!usedGolferBIds.has(g.id) && !dbDraftedIds.has(g.id)) || manualPicks[entryId]?.golferBId === g.id);

  const updateManualPick = (entryId, field, value) => {
    setManualPicks(prev => ({ ...prev, [entryId]: { ...prev[entryId], [field]: value } }));
  };

  const lockEntry = async (entry) => {
    const pick = manualPicks[entry.id];
    if (!pick?.golferAId || !pick?.golferBId) return;
    const golferA = golfers.find(g => g.id === pick.golferAId);
    const golferB = golfers.find(g => g.id === pick.golferBId);
    if (!golferA || !golferB) return;
    await saveMutation.mutateAsync([{ entryId: entry.id, golferA, golferB }]);
    setLockedEntries(prev => ({ ...prev, [entry.id]: true }));
  };

  const allManualPicked = entries.every(e => manualPicks[e.id]?.golferAId && manualPicks[e.id]?.golferBId);

  const lockAllEntries = async () => {
    const pairs = entries.filter(e => !lockedEntries[e.id]).map(entry => {
      const pick = manualPicks[entry.id];
      return { entryId: entry.id, golferA: golfers.find(g => g.id === pick.golferAId), golferB: golfers.find(g => g.id === pick.golferBId) };
    }).filter(p => p.golferA && p.golferB);
    if (pairs.length > 0) {
      await saveMutation.mutateAsync(pairs);
      const newLocked = {};
      entries.forEach(e => { newLocked[e.id] = true; });
      setLockedEntries(newLocked);
    }
  };

  if (loadingEntries || loadingGolfers) {
    return (
      <div className="px-3 pt-3 pb-0">
        <div className="bg-gradient-to-br from-secondary to-primary rounded-xl p-5 mb-4 border border-accent/30 animate-pulse h-24" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 pt-3 pb-0">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0a3d0a] via-secondary to-primary rounded-xl p-5 mb-4 border border-accent/30 text-center relative overflow-hidden">
        <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-20" />
        <div className="relative">
          <Shuffle className="w-8 h-8 text-accent mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-primary-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            The Hat Draw
          </h2>
          <p className="text-xs text-accent/70">Assign golfers to your pool participants</p>
        </div>
      </div>

      {/* Already Drawn */}
      {alreadyDrawn && phase === 'ready' && (
        <div className="bg-card rounded-xl p-5 border border-border space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-2">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Draw Complete</h3>
            <p className="text-xs text-muted-foreground mt-1">All golfers assigned. Check the Teams tab to see matchups.</p>
          </div>
          <div className="space-y-1.5">
            {entries.map(e => {
              const gA = rawGolfers.find(g => g.id === e.golfer_a_id);
              const gB = rawGolfers.find(g => g.id === e.golfer_b_id);
              return (
                <div key={e.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 border border-border">
                  <span className="font-bold text-sm text-foreground">{e.participant_name}</span>
                  <div className="text-xs text-right">
                    <span className="text-primary font-semibold">{gA?.name || '—'}</span>
                    <span className="text-muted-foreground mx-1">&</span>
                    <span className="text-accent font-semibold">{gB?.name || '—'}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {isAdmin && (
            <Button onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending} variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/5">
              <RotateCcw className="w-4 h-4 mr-2" />
              {resetMutation.isPending ? 'Resetting...' : 'Reset Draw'}
            </Button>
          )}
        </div>
      )}

      {/* Non-admin: Draw Pending */}
      {!alreadyDrawn && phase === 'ready' && !isAdmin && (
        <div className="bg-card rounded-xl p-6 border border-border text-center space-y-4">
          <ShieldAlert className="w-8 h-8 mx-auto text-muted-foreground/40" />
          <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Draw Pending</h3>
          <p className="text-sm text-muted-foreground">The pool admin will run the draw. Check back soon!</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary/8 rounded-lg p-3 border border-primary/15">
              <p className="text-[9px] font-bold text-primary tracking-widest uppercase mb-1">TOP TIER</p>
              <p className="text-2xl font-black text-primary">{groupA.length}</p>
            </div>
            <div className="bg-accent/8 rounded-lg p-3 border border-accent/15">
              <p className="text-[9px] font-bold text-accent tracking-widest uppercase mb-1">BOTTOM TIER</p>
              <p className="text-2xl font-black text-accent">{groupB.length}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>{entries.length} participants waiting</span>
          </div>
        </div>
      )}

      {/* Admin Mode Selector */}
      {!alreadyDrawn && phase === 'ready' && isAdmin && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setDrawMode('random')}
              className={`flex flex-col items-center gap-1.5 p-3.5 rounded-xl border-2 transition-all ${
                drawMode === 'random' ? 'border-primary bg-primary/8 shadow-sm' : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <Shuffle className={`w-5 h-5 ${drawMode === 'random' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-xs font-bold ${drawMode === 'random' ? 'text-primary' : 'text-muted-foreground'}`}>Random Draw</span>
              <span className="text-[10px] text-muted-foreground">Animated hat draw</span>
            </button>
            <button
              onClick={() => setDrawMode('manual')}
              className={`flex flex-col items-center gap-1.5 p-3.5 rounded-xl border-2 transition-all ${
                drawMode === 'manual' ? 'border-accent bg-accent/8 shadow-sm' : 'border-border bg-card hover:border-accent/30'
              }`}
            >
              <PenLine className={`w-5 h-5 ${drawMode === 'manual' ? 'text-accent' : 'text-muted-foreground'}`} />
              <span className={`text-xs font-bold ${drawMode === 'manual' ? 'text-accent' : 'text-muted-foreground'}`}>Manual Entry</span>
              <span className="text-[10px] text-muted-foreground">Pick specific golfers</span>
            </button>
          </div>

          {drawMode === 'random' && (
            <div className="bg-card rounded-xl p-5 border border-border text-center space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/8 rounded-lg p-3 border border-primary/15">
                  <p className="text-[9px] font-bold text-primary tracking-widest uppercase mb-1">TOP TIER</p>
                  <p className="text-2xl font-black text-primary">{groupA.length}</p>
                </div>
                <div className="bg-accent/8 rounded-lg p-3 border border-accent/15">
                  <p className="text-[9px] font-bold text-accent tracking-widest uppercase mb-1">BOTTOM TIER</p>
                  <p className="text-2xl font-black text-accent">{groupB.length}</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {entries.length} participant{entries.length !== 1 ? 's' : ''} will each get one Top Tier and one Bottom Tier golfer.
              </p>

              {entries.length === 0 && (
                <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/15">
                  <p className="text-sm text-destructive font-semibold">Add participants first in the Admin panel</p>
                </div>
              )}

              <Button
                onClick={runDraw}
                disabled={entries.length === 0 || groupA.length < entries.length || groupB.length < entries.length || Object.keys(lockedEntries).length > 0}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl h-12"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Draw Names from the Hat
              </Button>

              {(groupA.length < entries.length || groupB.length < entries.length) && entries.length > 0 && (
                <p className="text-xs text-destructive">Need at least {entries.length} golfers in each tier (have {groupA.length} Top / {groupB.length} Bottom)</p>
              )}
            </div>
          )}

          {drawMode === 'manual' && (
            <div className="space-y-2.5">
              {entries.length === 0 && (
                <div className="bg-card rounded-xl p-6 border border-border text-center">
                  <p className="text-sm text-destructive font-semibold">Add participants first in the Admin panel</p>
                </div>
              )}

              {entries.map((entry) => {
                const isLocked = lockedEntries[entry.id];
                const pick = manualPicks[entry.id] || {};
                return (
                  <div key={entry.id} className={`bg-card rounded-xl border overflow-hidden transition-all ${isLocked ? 'border-green-500/30 bg-green-500/5' : 'border-border'}`}>
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/30">
                      <span className="font-bold text-sm text-foreground">{entry.participant_name}</span>
                      {isLocked && <span className="flex items-center gap-1 text-green-600 text-[10px] font-bold"><Lock className="w-3 h-3" /> Locked</span>}
                    </div>
                    <div className="p-3 space-y-2">
                      <div>
                        <label className="text-[9px] font-bold text-primary tracking-widest uppercase mb-1 block">TOP TIER</label>
                        <Select value={pick.golferAId || ''} onValueChange={(val) => updateManualPick(entry.id, 'golferAId', val)} disabled={isLocked}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select golfer..." /></SelectTrigger>
                          <SelectContent>
                            {availableGroupA(entry.id).map(g => (<SelectItem key={g.id} value={g.id}>{g.name} {g.betting_odds ? `(${g.betting_odds})` : ''}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-accent tracking-widest uppercase mb-1 block">BOTTOM TIER</label>
                        <Select value={pick.golferBId || ''} onValueChange={(val) => updateManualPick(entry.id, 'golferBId', val)} disabled={isLocked}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select golfer..." /></SelectTrigger>
                          <SelectContent>
                            {availableGroupB(entry.id).map(g => (<SelectItem key={g.id} value={g.id}>{g.name} {g.betting_odds ? `(${g.betting_odds})` : ''}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      {!isLocked && pick.golferAId && pick.golferBId && (
                        <Button onClick={() => lockEntry(entry)} disabled={saveMutation.isPending} size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white">
                          <Lock className="w-3 h-3 mr-1" /> Lock In
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {entries.length > 0 && (
                <Button onClick={lockAllEntries} disabled={!allManualPicked || saveMutation.isPending} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl h-12">
                  <Lock className="w-4 h-4 mr-2" />
                  {saveMutation.isPending ? 'Saving...' : 'Lock In All Assignments'}
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Animating Phase */}
      {phase === 'animating' && (
        <div className="text-center space-y-4 py-8">
          <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-br from-[#0a3d0a] to-primary border-4 border-accent/40 shadow-2xl flex flex-col items-center justify-center animate-pulse">
            <Shuffle className="w-12 h-12 text-accent mb-1" />
            {currentFlash && (
              <div className="text-xs text-primary-foreground font-semibold px-4 text-center">
                <p className="text-accent truncate">{currentFlash.a}</p>
                <p className="truncate">{currentFlash.b}</p>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground font-semibold">Drawing names...</p>
        </div>
      )}

      {/* Revealing Phase */}
      {phase === 'revealing' && (
        <div className="space-y-2.5">
          {assignments.slice(0, revealIndex + 1).map((pair, i) => (
            <div key={pair.entryId} className={`rounded-xl border overflow-hidden transition-all ${i === revealIndex ? 'border-accent/40 shadow-lg animate-score-flip' : 'border-border'}`}>
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="font-black text-primary text-sm">{i + 1}.</span>
                  <span className="font-bold text-foreground text-sm">{pair.participantName}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 p-2.5">
                <div className="bg-primary/8 rounded-lg p-2.5 border border-primary/15">
                  <p className="text-[9px] font-bold text-primary tracking-widest">TOP TIER</p>
                  <p className="text-sm font-bold text-foreground">{pair.golferA.name}</p>
                  <p className="text-[10px] text-muted-foreground">{pair.golferA.betting_odds || ''}</p>
                </div>
                <div className="bg-accent/8 rounded-lg p-2.5 border border-accent/15">
                  <p className="text-[9px] font-bold text-accent tracking-widest">BTM TIER</p>
                  <p className="text-sm font-bold text-foreground">{pair.golferB.name}</p>
                  <p className="text-[10px] text-muted-foreground">{pair.golferB.betting_odds || ''}</p>
                </div>
              </div>
            </div>
          ))}
          <Button onClick={revealNext} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl h-12">
            {revealIndex < assignments.length - 1 ? `Reveal Next (${revealIndex + 1}/${assignments.length})` : 'Save All Assignments'}
          </Button>
        </div>
      )}

      {/* Complete Phase */}
      {phase === 'complete' && (
        <div className="bg-card rounded-xl p-6 border border-border text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-accent" />
          </div>
          <h3 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Draw Complete!</h3>
          <p className="text-sm text-muted-foreground">
            {saveMutation.isPending ? 'Saving assignments...' : 'All golfers have been assigned. Check the Teams tab!'}
          </p>
          <div className="space-y-1.5">
            {assignments.map((pair) => (
              <div key={pair.entryId} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 border border-border">
                <span className="font-bold text-sm">{pair.participantName}</span>
                <div className="text-xs text-right">
                  <span className="text-primary font-semibold">{pair.golferA.name}</span>
                  <span className="text-muted-foreground mx-1">&</span>
                  <span className="text-accent font-semibold">{pair.golferB.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
