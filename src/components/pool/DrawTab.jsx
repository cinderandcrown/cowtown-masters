import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { assignGroups } from '@/lib/groupUtils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shuffle, PenLine, Check, RotateCcw, Lock } from 'lucide-react';

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
  const [drawMode, setDrawMode] = useState('random');
  const [phase, setPhase] = useState('ready');
  const [assignments, setAssignments] = useState([]);
  const [revealIndex, setRevealIndex] = useState(-1);
  const [currentFlash, setCurrentFlash] = useState(null);

  // Manual assignment state
  const [manualPicks, setManualPicks] = useState({});
  const [lockedEntries, setLockedEntries] = useState({});

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
        await base44.entities.PoolEntry.update(pair.entryId, {
          golfer_a_id: pair.golferA.id,
          golfer_b_id: pair.golferB.id,
        });
        await base44.entities.Golfer.update(pair.golferA.id, {
          is_drafted: true,
          drafted_by: pair.entryId,
        });
        await base44.entities.Golfer.update(pair.golferB.id, {
          is_drafted: true,
          drafted_by: pair.entryId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poolEntries', poolId] });
      queryClient.invalidateQueries({ queryKey: ['poolGolfers', poolId] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      for (const entry of entries) {
        if (entry.golfer_a_id || entry.golfer_b_id) {
          await base44.entities.PoolEntry.update(entry.id, {
            golfer_a_id: '',
            golfer_b_id: '',
          });
        }
      }
      for (const g of rawGolfers) {
        if (g.is_drafted) {
          await base44.entities.Golfer.update(g.id, {
            is_drafted: false,
            drafted_by: '',
          });
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

  // --- Random Draw Logic ---
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

  // --- Manual Draw Logic ---
  const usedGolferAIds = new Set(
    Object.values(manualPicks).map(p => p.golferAId).filter(Boolean)
  );
  const usedGolferBIds = new Set(
    Object.values(manualPicks).map(p => p.golferBId).filter(Boolean)
  );

  // Also exclude golfers already drafted in DB (from partial draws)
  const dbDraftedIds = new Set(rawGolfers.filter(g => g.is_drafted).map(g => g.id));

  const availableGroupA = (entryId) =>
    groupA.filter(g =>
      (!usedGolferAIds.has(g.id) && !dbDraftedIds.has(g.id)) || manualPicks[entryId]?.golferAId === g.id
    );
  const availableGroupB = (entryId) =>
    groupB.filter(g =>
      (!usedGolferBIds.has(g.id) && !dbDraftedIds.has(g.id)) || manualPicks[entryId]?.golferBId === g.id
    );

  const updateManualPick = (entryId, field, value) => {
    setManualPicks(prev => ({
      ...prev,
      [entryId]: { ...prev[entryId], [field]: value },
    }));
  };

  const lockEntry = async (entry) => {
    const pick = manualPicks[entry.id];
    if (!pick?.golferAId || !pick?.golferBId) return;
    const golferA = golfers.find(g => g.id === pick.golferAId);
    const golferB = golfers.find(g => g.id === pick.golferBId);
    if (!golferA || !golferB) return;

    await saveMutation.mutateAsync([{
      entryId: entry.id,
      golferA,
      golferB,
    }]);
    setLockedEntries(prev => ({ ...prev, [entry.id]: true }));
  };

  const allManualPicked = entries.every(e =>
    manualPicks[e.id]?.golferAId && manualPicks[e.id]?.golferBId
  );

  const lockAllEntries = async () => {
    const pairs = entries
      .filter(e => !lockedEntries[e.id])
      .map(entry => {
        const pick = manualPicks[entry.id];
        return {
          entryId: entry.id,
          golferA: golfers.find(g => g.id === pick.golferAId),
          golferB: golfers.find(g => g.id === pick.golferBId),
        };
      })
      .filter(p => p.golferA && p.golferB);
    if (pairs.length > 0) {
      await saveMutation.mutateAsync(pairs);
      const newLocked = {};
      entries.forEach(e => { newLocked[e.id] = true; });
      setLockedEntries(newLocked);
    }
  };

  const isLoading = loadingEntries || loadingGolfers;

  if (isLoading) {
    return <div className="px-3 pt-3 pb-0 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="px-3 pt-3 pb-0">
      {/* Header */}
      <div className="bg-gradient-to-br from-secondary to-primary rounded-xl p-4 mb-4 border border-accent/30 text-center">
        <h2 className="text-2xl font-bold text-primary-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
          The Hat Draw
        </h2>
        <p className="text-xs tracking-widest text-accent uppercase font-semibold">Golfer Assignment</p>
      </div>

      {/* Already Drawn State */}
      {alreadyDrawn && phase === 'ready' && (
        <div className="bg-card rounded-xl p-6 border border-primary/10 space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-2">
              <Check className="w-10 h-10 mx-auto text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Draw Complete
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Golfers have been assigned. Check the Teams tab to see matchups.</p>
          </div>
          <div className="space-y-2">
            {entries.map(e => {
              const gA = rawGolfers.find(g => g.id === e.golfer_a_id);
              const gB = rawGolfers.find(g => g.id === e.golfer_b_id);
              return (
                <div key={e.id} className="flex items-center justify-between bg-primary/5 rounded-lg px-3 py-2 border border-primary/10">
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
          <Button
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
            variant="outline"
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/5"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {resetMutation.isPending ? 'Resetting...' : 'Reset Draw'}
          </Button>
        </div>
      )}

      {/* Mode Selector (only if not already drawn) */}
      {!alreadyDrawn && phase === 'ready' && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setDrawMode('random')}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                drawMode === 'random'
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-primary/20 bg-card hover:border-primary/40'
              }`}
            >
              <Shuffle className={`w-6 h-6 ${drawMode === 'random' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-xs font-bold ${drawMode === 'random' ? 'text-primary' : 'text-muted-foreground'}`}>
                Random Draw
              </span>
              <span className="text-[10px] text-muted-foreground">Hat draw animation</span>
            </button>
            <button
              onClick={() => setDrawMode('manual')}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                drawMode === 'manual'
                  ? 'border-accent bg-accent/10 shadow-md'
                  : 'border-accent/20 bg-card hover:border-accent/40'
              }`}
            >
              <PenLine className={`w-6 h-6 ${drawMode === 'manual' ? 'text-accent' : 'text-muted-foreground'}`} />
              <span className={`text-xs font-bold ${drawMode === 'manual' ? 'text-accent' : 'text-muted-foreground'}`}>
                Manual Entry
              </span>
              <span className="text-[10px] text-muted-foreground">Pick specific golfers</span>
            </button>
          </div>

          {/* Random Draw Ready State */}
          {drawMode === 'random' && (
            <div className="bg-card rounded-xl p-6 border border-primary/10 text-center space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                  <p className="text-xs font-bold text-primary tracking-widest uppercase mb-1">GROUP A</p>
                  <p className="text-2xl font-black text-primary">{groupA.length}</p>
                  <p className="text-xs text-muted-foreground">Top Tier</p>
                </div>
                <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
                  <p className="text-xs font-bold text-accent tracking-widest uppercase mb-1">GROUP B</p>
                  <p className="text-2xl font-black text-accent">{groupB.length}</p>
                  <p className="text-xs text-muted-foreground">Bottom Tier</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {entries.length} participants will each be randomly assigned one Group A and one Group B golfer.
              </p>

              {entries.length === 0 && (
                <p className="text-sm text-destructive font-semibold">Add participants first in the Admin panel.</p>
              )}

              <Button
                onClick={runDraw}
                disabled={entries.length === 0 || groupA.length < entries.length || groupB.length < entries.length}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Draw Names from the Hat
              </Button>

              {(groupA.length < entries.length || groupB.length < entries.length) && entries.length > 0 && (
                <p className="text-xs text-destructive">
                  Not enough golfers. Need at least {entries.length} in each group, but have {groupA.length} A / {groupB.length} B.
                </p>
              )}
            </div>
          )}

          {/* Manual Assignment Mode */}
          {drawMode === 'manual' && (
            <div className="space-y-3">
              {entries.length === 0 && (
                <div className="bg-card rounded-xl p-6 border border-primary/10 text-center">
                  <p className="text-sm text-destructive font-semibold">Add participants first in the Admin panel.</p>
                </div>
              )}

              {entries.map((entry) => {
                const isLocked = lockedEntries[entry.id];
                const pick = manualPicks[entry.id] || {};

                return (
                  <div
                    key={entry.id}
                    className={`bg-card rounded-xl border overflow-hidden transition-all ${
                      isLocked ? 'border-green-500/30 bg-green-500/10' : 'border-primary/10'
                    }`}
                  >
                    <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5">
                      <span className="font-bold text-sm text-foreground">{entry.participant_name}</span>
                      {isLocked && (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-bold">
                          <Lock className="w-3 h-3" /> Locked In
                        </span>
                      )}
                    </div>

                    <div className="p-3 space-y-2">
                      <div>
                        <label className="text-[10px] font-bold text-primary tracking-widest uppercase mb-1 block">
                          GROUP A — Top Tier
                        </label>
                        <Select
                          value={pick.golferAId || ''}
                          onValueChange={(val) => updateManualPick(entry.id, 'golferAId', val)}
                          disabled={isLocked}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select Group A golfer..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableGroupA(entry.id).map(g => (
                              <SelectItem key={g.id} value={g.id}>
                                {g.name} {g.betting_odds ? `(${g.betting_odds})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-accent tracking-widest uppercase mb-1 block">
                          GROUP B — Bottom Tier
                        </label>
                        <Select
                          value={pick.golferBId || ''}
                          onValueChange={(val) => updateManualPick(entry.id, 'golferBId', val)}
                          disabled={isLocked}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select Group B golfer..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableGroupB(entry.id).map(g => (
                              <SelectItem key={g.id} value={g.id}>
                                {g.name} {g.betting_odds ? `(${g.betting_odds})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {!isLocked && pick.golferAId && pick.golferBId && (
                        <Button
                          onClick={() => lockEntry(entry)}
                          disabled={saveMutation.isPending}
                          size="sm"
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Lock className="w-3 h-3 mr-1" />
                          Lock In
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {entries.length > 0 && (
                <Button
                  onClick={lockAllEntries}
                  disabled={!allManualPicked || saveMutation.isPending}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg"
                >
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
        <div className="text-center space-y-4">
          <div className="w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-secondary to-primary border-4 border-accent/50 shadow-2xl flex flex-col items-center justify-center">
            <span className="text-5xl mb-1">🎩</span>
            {currentFlash && (
              <div className="text-xs text-primary-foreground font-semibold px-4 text-center animate-pulse">
                <p className="text-accent">{currentFlash.a}</p>
                <p>{currentFlash.b}</p>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground font-semibold">Shuffling names...</p>
        </div>
      )}

      {/* Revealing Phase */}
      {phase === 'revealing' && (
        <div className="space-y-3">
          {assignments.slice(0, revealIndex + 1).map((pair, i) => (
            <div
              key={pair.entryId}
              className={`rounded-xl border overflow-hidden transition-all ${
                i === revealIndex ? 'border-accent/40 shadow-lg animate-score-flip' : 'border-primary/10'
              }`}
            >
              <div className="flex items-center justify-between px-4 py-3 bg-primary/5">
                <div className="flex items-center gap-2">
                  <span className="font-black text-primary">{i + 1}.</span>
                  <span className="font-bold text-foreground">{pair.participantName}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 p-3">
                <div className="bg-primary/10 rounded-lg p-2 border border-primary/20">
                  <p className="text-xs font-bold text-primary tracking-widest">GRP A</p>
                  <p className="text-sm font-bold text-foreground">{pair.golferA.name}</p>
                  <p className="text-xs text-muted-foreground">{pair.golferA.betting_odds || ''}</p>
                </div>
                <div className="bg-accent/10 rounded-lg p-2 border border-accent/20">
                  <p className="text-xs font-bold text-accent tracking-widest">GRP B</p>
                  <p className="text-sm font-bold text-foreground">{pair.golferB.name}</p>
                  <p className="text-xs text-muted-foreground">{pair.golferB.betting_odds || ''}</p>
                </div>
              </div>
            </div>
          ))}

          <Button
            onClick={revealNext}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg"
          >
            {revealIndex < assignments.length - 1
              ? `Reveal Next (${revealIndex + 1}/${assignments.length})`
              : 'Save All Assignments'}
          </Button>
        </div>
      )}

      {/* Complete Phase */}
      {phase === 'complete' && (
        <div className="bg-card rounded-xl p-6 border border-primary/10 text-center space-y-4">
          <div className="text-6xl">🎉</div>
          <h3 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Draw Complete!
          </h3>
          <p className="text-sm text-muted-foreground">
            {saveMutation.isPending ? 'Saving assignments...' : 'All golfers have been assigned. Check the Teams tab!'}
          </p>
          <div className="space-y-2">
            {assignments.map((pair) => (
              <div key={pair.entryId} className="flex items-center justify-between bg-primary/5 rounded-lg px-3 py-2 border border-primary/10">
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
