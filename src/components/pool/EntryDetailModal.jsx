import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { formatScore, scoreColor } from '@/lib/scoreUtils';
import GolferDetailModal from '@/components/pool/GolferDetailModal';
import { Share2, Trophy } from 'lucide-react';

export default function EntryDetailModal({ entry, open, onOpenChange, rank, totalEntries }) {
  const [selectedGolfer, setSelectedGolfer] = useState(null);
  if (!entry) return null;

  const golferA = entry.golferA;
  const golferB = entry.golferB;

  const handleShare = async () => {
    const text = `${entry.team_name || entry.participant_name} is #${rank} in Cowtown Masters with a score of ${formatScore(entry.total_score)}!`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Cowtown Masters', text });
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch {}
  };

  const GolferCard = ({ golfer, group }) => {
    if (!golfer) return <div className="flex-1 bg-muted/30 rounded-lg p-3 border border-dashed border-muted-foreground/20 text-center text-xs text-muted-foreground">No golfer</div>;

    const rounds = [golfer.round_1, golfer.round_2, golfer.round_3, golfer.round_4];

    return (
      <div
        className={`flex-1 bg-card rounded-lg p-3 border cursor-pointer hover:border-accent/40 hover:shadow-md transition-all active:scale-[0.98] ${
          group === 'A' ? 'border-l-3 border-l-primary border-border' : 'border-l-3 border-l-accent border-border'
        }`}
        onClick={() => setSelectedGolfer(golfer)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedGolfer(golfer); } }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-[9px] font-bold tracking-widest ${group === 'A' ? 'text-primary' : 'text-accent'}`}>
            {group === 'A' ? 'TOP TIER' : 'BTM TIER'}
          </span>
          {golfer.status !== 'active' && (
            <span className="text-[8px] font-bold text-destructive uppercase">{golfer.status}</span>
          )}
        </div>
        <p className="text-sm font-bold text-foreground mb-2">{golfer.name}</p>
        <div className="grid grid-cols-4 gap-1">
          {['R1', 'R2', 'R3', 'R4'].map((r, i) => (
            <div key={r} className="text-center">
              <div className="text-[9px] text-muted-foreground mb-0.5">{r}</div>
              <div className={`text-xs font-black tabular-nums ${scoreColor(rounds[i])}`}>{formatScore(rounds[i])}</div>
            </div>
          ))}
        </div>
        <div className={`text-center mt-2 pt-2 border-t border-border text-lg font-black tabular-nums ${scoreColor(golfer.score_to_par)}`}>
          {formatScore(golfer.score_to_par)}
        </div>
      </div>
    );
  };

  const roundsA = [golferA?.round_1, golferA?.round_2, golferA?.round_3, golferA?.round_4];
  const roundsB = [golferB?.round_1, golferB?.round_2, golferB?.round_3, golferB?.round_4];

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card rounded-2xl max-w-sm w-full max-h-[85vh] overflow-y-auto p-0">
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-[#0a3d0a] via-secondary to-primary p-5 pt-8 relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-20" />
          <div className="relative text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/15 mb-3">
              {rank <= 3 && <Trophy className="w-3.5 h-3.5 text-accent" />}
              <span className="text-[10px] font-bold tracking-widest text-accent">
                #{rank || '?'} OF {totalEntries || '?'}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-primary-foreground mb-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
              {entry.team_name || entry.participant_name}
            </h2>
            {entry.team_name && (
              <p className="text-xs text-primary-foreground/50">{entry.participant_name}</p>
            )}
            <div className={`text-4xl font-black tabular-nums mt-2 ${scoreColor(entry.total_score)}`}>{formatScore(entry.total_score)}</div>
            <p className="text-[10px] text-primary-foreground/40 mt-0.5">Combined Score to Par</p>

            <button
              onClick={handleShare}
              className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold text-accent bg-accent/15 px-3 py-1 rounded-full border border-accent/25 hover:bg-accent/25 transition"
            >
              <Share2 className="w-3 h-3" />
              Share Standing
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Golfer Cards */}
          <div className="flex gap-2.5">
            <GolferCard golfer={golferA} group="A" />
            <GolferCard golfer={golferB} group="B" />
          </div>

          {/* Round by Round Combined */}
          {golferA && golferB && (
            <div className="bg-muted/20 rounded-xl p-3 border border-border">
              <p className="text-[10px] font-bold text-primary tracking-widest uppercase mb-2.5">Round-by-Round Combined</p>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((i) => {
                  const rA = roundsA[i] || 0;
                  const rB = roundsB[i] || 0;
                  const combined = rA + rB;
                  const running = [0, 1, 2, 3]
                    .slice(0, i + 1)
                    .reduce((sum, j) => (roundsA[j] || 0) + (roundsB[j] || 0) + sum, 0);
                  return (
                    <div key={i} className="text-center p-2 bg-card rounded-lg border border-border">
                      <div className="text-[9px] text-muted-foreground mb-0.5">R{i + 1}</div>
                      <div className={`text-base font-black tabular-nums ${scoreColor(combined)}`}>{formatScore(combined)}</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">Cum: {formatScore(running)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    {selectedGolfer && (
      <GolferDetailModal
        golfer={selectedGolfer}
        open={!!selectedGolfer}
        onOpenChange={(open) => !open && setSelectedGolfer(null)}
      />
    )}
    </>
  );
}
