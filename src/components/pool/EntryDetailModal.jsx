import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { formatScore, scoreColor } from '@/lib/scoreUtils';
import GolferDetailModal from '@/components/pool/GolferDetailModal';
import { Share2, Crown, TrendingUp } from 'lucide-react';
import { POOL_HISTORY } from '@/lib/poolHistoryData';

const MASTERS_PATCH = 'https://media.base44.com/images/public/69bd90cf71e1b676eaaeb41f/444bc63fb_AugustaGolfMasterGreenJacketPatch.png';

const NAME_ALIASES = {
  'will h.': 'will hudson', 'alex t.': 'alex thomas', 'charlie b.': 'charlie brown',
  'nick w.': 'nicholas will', 'n. will': 'nicholas will', 'c. brown': 'charlie brown',
  'clay': 'clay collier', 'sanders': 'sanders johnston', 's. johnston': 'sanders johnston',
  'chandler': 'chandler mitchell', 'c. mitchell': 'chandler mitchell',
  'zac': 'zac hansen', 'z. hanson': 'zac hansen', 'hanson': 'zac hansen',
  'w. hudson': 'will hudson',
};
const canonName = (n) => { const l = n.toLowerCase(); return NAME_ALIASES[l] || l; };

function getChampionYears(name) {
  const years = [];
  for (const [year, data] of Object.entries(POOL_HISTORY)) {
    if (canonName(data.winner) === canonName(name)) years.push(Number(year));
  }
  return years.length > 0 ? years : null;
}
import { fireGoldRain, fireMoneyZone, fireJackpot } from '@/lib/useConfetti';
import { hapticSuccess, hapticTripleBuzz } from '@/lib/haptics';
import { useEffect } from 'react';

export default function EntryDetailModal({ entry, open, onOpenChange, rank, totalEntries }) {
  const [selectedGolfer, setSelectedGolfer] = useState(null);

  const isLeader = rank === 1;
  const isMoneyZone = rank <= 3;

  // Fire effects when viewing leader's, money zone, or past champion's card
  const isPastChamp = entry ? !!getChampionYears(entry.participant_name) : false;
  useEffect(() => {
    if (!open || !entry) return;
    if (isLeader || isPastChamp) {
      fireJackpot();
      hapticTripleBuzz();
    } else if (isMoneyZone) {
      fireMoneyZone();
      hapticSuccess();
    }
  }, [open, isLeader, isMoneyZone, isPastChamp, entry]);

  if (!entry) return null;

  const golferA = entry.golferA;
  const golferB = entry.golferB;

  const GolferCard = ({ golfer, group }) => {
  if (!golfer) return <div className="flex-1 bg-muted/50 rounded-lg p-3 border border-dashed text-center text-xs text-muted-foreground">No {group === 'A' ? 'Top Tier' : 'Btm Tier'} golfer</div>;

    const rounds = [golfer.round_1, golfer.round_2, golfer.round_3, golfer.round_4];

    return (
      <div
        className={`flex-1 bg-card rounded-lg p-3 cursor-pointer hover:border-accent/40 hover:shadow-md transition-all active:scale-[0.98] ${group === 'A' ? 'border-l-[3px] border-l-primary border border-primary/20' : 'border-l-[3px] border-l-accent border border-accent/20'}`}
        onClick={() => setSelectedGolfer(golfer)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedGolfer(golfer); } }}
        aria-label={`View details for ${golfer.name}`}
      >
        <p className="text-sm font-bold text-foreground mb-1 hover:text-accent transition">{golfer.name}</p>
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
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card rounded-2xl max-w-sm w-full max-h-[85vh] overflow-y-auto p-0">
        <div className="space-y-4">
          {/* Hero Header */}
          <div className="bg-gradient-to-br from-[#0a3d0a] to-primary rounded-t-2xl p-5 text-center relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-20" />
            <div className="relative">
              {isLeader && (
                <Crown className="w-8 h-8 text-accent mx-auto mb-2 animate-bounce-in" />
              )}
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-3 ${
                isLeader ? 'bg-accent/20 border-accent/40' : isMoneyZone ? 'bg-white/15 border-accent/30' : 'bg-white/10 border-white/15'
              }`}>
                <span className={`text-[10px] font-bold tracking-widest ${
                  isLeader ? 'text-accent' : 'text-accent'
                }`}>
                  {isLeader ? '👑 LEADER' : isMoneyZone ? '💰 MONEY ZONE' : `#${rank || '?'} OF ${totalEntries || '?'}`}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {entry.team_name || entry.participant_name}
                </h2>
                {getChampionYears(entry.participant_name) && (
                  <img src={MASTERS_PATCH} alt="Past Champion" className="w-7 h-7 rounded-full flex-shrink-0" />
                )}
              </div>
              {entry.team_name && (
                <p className="text-xs text-primary-foreground/60 mb-1">{entry.participant_name}</p>
              )}
              {getChampionYears(entry.participant_name) && (
                <p className="text-[10px] font-bold text-accent tracking-widest uppercase mb-1">
                  🏆 Champion: {getChampionYears(entry.participant_name).join(', ')}
                </p>
              )}
              <div className={`text-4xl font-black ${entry.total_score < 0 ? 'text-red-400' : entry.total_score > 0 ? 'text-primary-foreground' : 'text-accent'}`}>{formatScore(entry.total_score)}</div>
              <p className="text-[10px] text-primary-foreground/50 mt-1">Combined Score to Par</p>
              <button
                onClick={() => {
                  const text = `${entry.team_name || entry.participant_name} is #${rank} with ${formatScore(entry.total_score)} in Cowtown Masters!`;
                  navigator.share ? navigator.share({ title: 'Cowtown Masters', text }) : navigator.clipboard.writeText(text);
                }}
                className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold text-accent bg-white/10 px-3 py-1.5 rounded-full border border-white/15 hover:bg-white/20 transition"
              >
                <Share2 className="w-3 h-3" /> Share Standing
              </button>
            </div>
          </div>

          {/* Golfer Cards */}
          <div className="flex gap-3 px-4">
            <GolferCard golfer={golferA} group="A" />
            <GolferCard golfer={golferB} group="B" />
          </div>

          {/* Round by Round Combined */}
          {golferA && golferB && (
            <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 mx-4 mb-4">
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