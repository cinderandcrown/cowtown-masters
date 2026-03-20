import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { assignGroups } from '@/lib/groupUtils';
import { Button } from '@/components/ui/button';

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
  const [phase, setPhase] = useState('ready'); // ready | animating | revealing | complete
  const [assignments, setAssignments] = useState([]);
  const [revealIndex, setRevealIndex] = useState(-1);
  const [currentFlash, setCurrentFlash] = useState(null);

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

  const alreadyDrawn = entries.some(e => e.golfer_a_id && e.golfer_b_id);

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

    // Animate shuffle then reveal
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
      // All revealed — save to database
      setPhase('complete');
      saveMutation.mutate(assignments);
    }
  };

  const isLoading = loadingEntries || loadingGolfers;

  if (isLoading) {
    return <div className="px-3 pt-3 pb-6 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="px-3 pt-3 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-secondary to-primary rounded-xl p-4 mb-4 border border-accent/30 text-center">
        <h2 className="text-2xl font-bold text-primary-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
          🎩 The Hat Draw
        </h2>
        <p className="text-xs tracking-widest text-accent uppercase font-semibold">Random Golfer Assignment</p>
      </div>

      {/* Already drawn state */}
      {alreadyDrawn && phase === 'ready' && (
        <div className="bg-white rounded-xl p-6 border border-primary/10 space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Draw Complete
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Golfers have already been assigned. Check the Teams tab to see matchups.</p>
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
        </div>
      )}

      {/* Ready to draw */}
      {!alreadyDrawn && phase === 'ready' && (
        <div className="bg-white rounded-xl p-6 border border-primary/10 text-center space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
              <p className="text-xs font-bold text-primary tracking-widest uppercase mb-1">GROUP A</p>
              <p className="text-2xl font-black text-primary">{groupA.length}</p>
              <p className="text-xs text-muted-foreground">Favorites</p>
            </div>
            <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
              <p className="text-xs font-bold text-accent tracking-widest uppercase mb-1">GROUP B</p>
              <p className="text-2xl font-black text-accent">{groupB.length}</p>
              <p className="text-xs text-muted-foreground">Longshots</p>
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
            🎩 Draw Names from the Hat
          </Button>

          {(groupA.length < entries.length || groupB.length < entries.length) && entries.length > 0 && (
            <p className="text-xs text-destructive">
              Not enough golfers. Need at least {entries.length} in each group, but have {groupA.length} A / {groupB.length} B.
            </p>
          )}
        </div>
      )}

      {/* Animating shuffle */}
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

      {/* Revealing one at a time */}
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
              ? `🎩 Reveal Next (${revealIndex + 1}/${assignments.length})`
              : '✅ Save All Assignments'}
          </Button>
        </div>
      )}

      {/* Complete */}
      {phase === 'complete' && (
        <div className="bg-white rounded-xl p-6 border border-primary/10 text-center space-y-4">
          <div className="text-6xl">🎉</div>
          <h3 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Draw Complete!
          </h3>
          <p className="text-sm text-muted-foreground">
            {saveMutation.isPending ? 'Saving assignments...' : 'All golfers have been assigned. Check the Teams tab!'}
          </p>
          <div className="space-y-2">
            {assignments.map((pair, i) => (
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