import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { formatScore, scoreColor } from '@/lib/scoreUtils';

export default function EntryDetailModal({ entry, open, onOpenChange, rank, totalEntries }) {
  if (!entry) return null;

  const golferA = entry.golferA;
  const golferB = entry.golferB;

  const GolferCard = ({ golfer, group }) => {
    if (!golfer) return <div className="flex-1 bg-muted/50 rounded-lg p-3 border border-dashed text-center text-xs text-muted-foreground">No Group {group} golfer</div>;

    const rounds = [golfer.round_1, golfer.round_2, golfer.round_3, golfer.round_4];

    return (
      <div className="flex-1 bg-card rounded-lg p-3 border border-primary/20">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-xs font-bold tracking-widest ${group === 'A' ? 'text-primary' : 'text-accent'}`}>
            GROUP {group}
          </span>
          <span className={`text-lg font-black ${scoreColor(golfer.score_to_par)}`}>{formatScore(golfer.score_to_par)}</span>
        </div>
        <p className="text-sm font-bold text-foreground mb-1">{golfer.name}</p>
        {golfer.status !== 'active' && (
          <span className="text-[10px] font-bold text-destructive uppercase">{golfer.status}</span>
        )}
        <div className="grid grid-cols-4 gap-1 mt-2">
          {['R1', 'R2', 'R3', 'R4'].map((r, i) => (
            <div key={r} className="text-center">
              <div className="text-xs text-muted-foreground mb-1">{r}</div>
              <div className={`text-sm font-black ${scoreColor(rounds[i])}`}>
                {formatScore(rounds[i])}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const roundsA = [golferA?.round_1, golferA?.round_2, golferA?.round_3, golferA?.round_4];
  const roundsB = [golferB?.round_1, golferB?.round_2, golferB?.round_3, golferB?.round_4];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card rounded-2xl max-w-sm w-full max-h-[85vh] overflow-y-auto">
        <div className="space-y-4 pt-4">
          {/* Rank Badge */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-full border border-accent/30 mb-3">
              <span className="text-xs font-bold tracking-widest text-accent">
                {rank === 1 ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏌️'} #{rank || '?'} OF {totalEntries || '?'}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              {entry.participant_name}
            </h2>
            {entry.team_name && (
              <p className="text-xs text-muted-foreground mb-1">{entry.team_name}</p>
            )}
            <div className={`text-4xl font-black ${scoreColor(entry.total_score)}`}>{formatScore(entry.total_score)}</div>
            <p className="text-xs text-muted-foreground mt-1">Combined Score to Par</p>
          </div>

          {/* Golfer Cards */}
          <div className="flex gap-3">
            <GolferCard golfer={golferA} group="A" />
            <GolferCard golfer={golferB} group="B" />
          </div>

          {/* Round by Round Combined */}
          {golferA && golferB && (
            <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
              <p className="text-xs font-bold text-primary tracking-widest uppercase mb-3">Round-by-Round Combined</p>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((i) => {
                  const rA = roundsA[i] || 0;
                  const rB = roundsB[i] || 0;
                  const combined = rA + rB;
                  const running = [0, 1, 2, 3]
                    .slice(0, i + 1)
                    .reduce((sum, j) => (roundsA[j] || 0) + (roundsB[j] || 0) + sum, 0);
                  return (
                    <div key={i} className="text-center p-2 bg-card rounded-lg border border-primary/10">
                      <div className="text-xs text-muted-foreground mb-1">R{i + 1}</div>
                      <div className={`text-lg font-black ${scoreColor(combined)}`}>{formatScore(combined)}</div>
                      <div className="text-xs text-muted-foreground mt-1">Cum: {formatScore(running)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
