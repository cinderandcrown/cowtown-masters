import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const GOLFER_SCORES = {
  'Ludvig Åberg': { r1: -4, r2: 1, r3: -3, r4: 0, scores: [68, 73, 69, 72], total: -6 },
  'Patrick Reed': { r1: -1, r2: -2, r3: -3, r4: -3, scores: [71, 70, 69, 69], total: -9 },
  'Jon Rahm': { r1: 2, r2: -3, r3: -1, r4: -1, scores: [74, 69, 71, 71], total: -3 },
  'Sungjae Im': { r1: -1, r2: -2, r3: -1, r4: -3, scores: [71, 70, 71, 69], total: -7 },
  'Patrick Cantlay': { r1: 0, r2: -2, r3: 3, r4: 1, scores: [72, 70, 75, 73], total: 2 },
  'Justin Rose': { r1: -7, r2: -1, r3: 3, r4: -6, scores: [65, 71, 75, 66], total: -11 },
  'Rory McIlroy': { r1: 0, r2: -6, r3: -6, r4: 1, scores: [72, 66, 66, 73], total: -11 },
  'Dustin Johnson': { r1: 1, r2: 1, r3: 2, r4: -1, scores: [73, 73, 74, 71], total: 3 },
};

const formatScore = (s) => (s === 0 ? 'E' : s > 0 ? `+${s}` : `${s}`);
const scoreColor = (s) => {
  if (s < 0) return 'text-red-600';
  if (s > 0) return 'text-primary';
  return 'text-accent';
};

export default function EntryDetailModal({ entry, open, onOpenChange }) {
  if (!entry) return null;

  const golferA = GOLFER_SCORES[entry.golferA];
  const golferB = GOLFER_SCORES[entry.golferB];

  const GolferCard = ({ golfer, group, golferName }) => {
    if (!golfer) return <div className="flex-1">Data unavailable</div>;

    return (
      <div className="flex-1 bg-white rounded-lg p-3 border border-primary/20">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-xs font-bold tracking-widest ${group === 'A' ? 'text-primary' : 'text-accent'}`}>
            GROUP {group}
          </span>
          <span className={`text-lg font-black ${scoreColor(golfer.total)}`}>{formatScore(golfer.total)}</span>
        </div>
        <p className="text-sm font-bold text-foreground mb-3">{golferName}</p>
        <div className="grid grid-cols-4 gap-1">
          {['R1', 'R2', 'R3', 'R4'].map((r, i) => (
            <div key={r} className="text-center">
              <div className="text-xs text-muted-foreground mb-1">{r}</div>
              <div className={`text-sm font-black ${golfer.scores[i] < 72 ? 'text-red-600' : golfer.scores[i] > 72 ? 'text-primary' : 'text-accent'}`}>
                {golfer.scores[i]}
              </div>
              <div className={`text-xs font-bold ${scoreColor([golfer.r1, golfer.r2, golfer.r3, golfer.r4][i])}`}>
                {formatScore([golfer.r1, golfer.r2, golfer.r3, golfer.r4][i])}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white rounded-2xl max-w-sm w-full max-h-[85vh] overflow-y-auto">
        <div className="space-y-4 pt-4">
          {/* Rank Badge */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-full border border-accent/30 mb-3">
              <span className="text-xs font-bold tracking-widest text-accent">🏆 #1 OF 23</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              {entry.name}
            </h2>
            <div className={`text-4xl font-black ${scoreColor(entry.total)}`}>{formatScore(entry.total)}</div>
            <p className="text-xs text-muted-foreground mt-1">Combined Score to Par</p>
          </div>

          {/* Golfer Cards */}
          <div className="flex gap-3">
            <GolferCard golfer={golferA} group="A" golferName={entry.golferA} />
            <GolferCard golfer={golferB} group="B" golferName={entry.golferB} />
          </div>

          {/* Round by Round Combined */}
          {golferA && golferB && (
            <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
              <p className="text-xs font-bold text-primary tracking-widest uppercase mb-3">Round-by-Round Combined</p>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((i) => {
                  const combined = [golferA.r1, golferA.r2, golferA.r3, golferA.r4][i] + [golferB.r1, golferB.r2, golferB.r3, golferB.r4][i];
                  const running = [0, 1, 2, 3]
                    .slice(0, i + 1)
                    .reduce((sum, j) => sum + [golferA.r1, golferA.r2, golferA.r3, golferA.r4][j] + [golferB.r1, golferB.r2, golferB.r3, golferB.r4][j], 0);
                  return (
                    <div key={i} className="text-center p-2 bg-white rounded-lg border border-primary/10">
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