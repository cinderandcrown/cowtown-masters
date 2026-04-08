import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, ChevronDown, ChevronUp, Users } from 'lucide-react';

const MASTERS_PATCH = 'https://media.base44.com/images/public/69bd90cf71e1b676eaaeb41f/444bc63fb_AugustaGolfMasterGreenJacketPatch.png';

// Alias map: maps short/abbreviated names to their canonical full name
const NAME_ALIASES = {
  'will h.': 'will hudson',
  'alex t.': 'alex thomas',
  'charlie b.': 'charlie brown',
  'nick w.': 'nicholas will',
  'n. will': 'nicholas will',
  'c. brown': 'charlie brown',
  'brown jr.': 'charlie brown jr.',
  'clay': 'clay collier',
  'sanders': 'sanders johnston',
  's. johnston': 'sanders johnston',
  'chandler': 'chandler mitchell',
  'c. mitchell': 'chandler mitchell',
  'fleske': 'matthew fleske',
  'fisher': 'josh fisher',
  'j. fisher': 'josh fisher',
  'vickers': 'jake vickers',
  'j. vickers': 'jake vickers',
  'teppe': 'adam teppe',
  'a. tepe': 'adam teppe',
  'cole': 'cole platt',
  'c. platt': 'cole platt',
  'tobias': 'john tobias',
  'j. tobias': 'john tobias',
  'josh h.': 'josh howard',
  'j. howard': 'josh howard',
  'zac': 'zac hansen',
  'z. hanson': 'zac hansen',
  'karr': 'james karr',
  'j. karr': 'james karr',
  'billy': 'billy watkins',
  'b. watkins': 'billy watkins',
  'gray': 'gray gomez',
  'g. gomez': 'gray gomez',
  'ross': 'ross daniels',
  'r. daniels': 'ross daniels',
  'tate': 'tate ownings',
  't. ownings': 'tate ownings',
  'jake': 'jake vickers',
  'platt': 'cole platt',
  'mitchell jr.': 'chandler mitchell',
  'hanson': 'zac hansen',
  'odom': 'w. odom',
  'belew': 'm. belew',
  'downs': 'r. downs',
  'r. downs': 'r. downs',
  'w. hudson': 'will hudson',
};

function canonicalName(name) {
  const lower = name.toLowerCase();
  return NAME_ALIASES[lower] || lower;
}

// Build a set of all past champion canonical names and the years they won
function getPastChampions() {
  const champs = {};
  for (const [year, data] of Object.entries(POOL_HISTORY)) {
    const name = canonicalName(data.winner);
    if (!champs[name]) champs[name] = [];
    champs[name].push(Number(year));
  }
  return champs;
}
import { POOL_HISTORY } from '@/lib/poolHistoryData';
import { fireGoldRain, fireJackpot, fireMoneyZone } from '@/lib/useConfetti';
import { hapticTap, hapticSuccess, hapticDoubleTap } from '@/lib/haptics';
import { soundChampion, soundJackpot, soundShimmer } from '@/lib/sounds';

const formatScore = (s) => (s === 0 ? 'E' : s > 0 ? `+${s}` : `${s}`);
const scoreColor = (s) => {
  if (s < 0) return 'text-red-600';
  if (s > 0) return 'text-primary';
  return 'text-accent';
};

function ChampionCard({ year, data, isExpanded, onToggle, pastChampions }) {
  const standings = data.standings || [];
  const hasFullStandings = standings.length > 1;
  const currentYear = Number(year);

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden group">
      {/* Champion header — clickable */}
      <div
        className="p-4 cursor-pointer hover:bg-accent/5 transition-all active:scale-[0.995]"
        onClick={() => {
          hapticDoubleTap();
          onToggle();
          if (!isExpanded && data.winningScore <= -10) { fireJackpot(); soundJackpot(); }
          else if (!isExpanded) { fireMoneyZone(); soundChampion(); }
        }}
      >
        <div className="flex items-start gap-3">
          <div className="relative">
            <div className="bg-gradient-to-br from-primary to-secondary rounded-lg px-3 py-1.5 flex-shrink-0 shadow-md shadow-primary/20">
              <span className="text-accent font-black text-xl">{year}</span>
            </div>
            {data.winningScore <= -10 && (
              <span className="absolute -top-1 -right-1 text-xs">🔥</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <img src={MASTERS_PATCH} alt="Masters" className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-lg font-bold text-card-foreground truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {data.winner}
                </p>
                {standings[0] && (
                  <p className="text-xs text-muted-foreground">{standings[0].golferA} + {standings[0].golferB}</p>
                )}
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`text-2xl font-black ${scoreColor(data.winningScore)}`}>
              {formatScore(data.winningScore)}
            </div>
            <div className="flex items-center gap-1 justify-end mt-0.5">
              <Users className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{data.entries}</span>
              {hasFullStandings && (
                isExpanded
                  ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground ml-1" />
                  : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full standings — expandable */}
      {hasFullStandings && isExpanded && (
        <div className="border-t border-border">
          <div className="grid grid-cols-[28px_1fr_60px_60px_52px] gap-1 px-3 py-1.5 bg-primary/5 text-[9px] font-bold text-primary uppercase tracking-wider">
            <span className="text-center">#</span>
            <span>Name</span>
            <span className="text-center">A</span>
            <span className="text-center">B</span>
            <span className="text-center">TOT</span>
          </div>
          {standings.map((s, i) => (
            <div
              key={`${year}-${i}`}
              className={`animate-fade-in-up grid grid-cols-[28px_1fr_60px_60px_52px] gap-1 px-3 py-1.5 border-b border-border/50 ${
                i === 0 ? 'bg-accent/8' : i <= 2 ? 'bg-primary/3' : ''
              }`}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span className={`text-center text-xs font-bold tabular-nums ${
                i === 0 ? 'text-accent' : i <= 2 ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {i === 0 ? '🏆' : s.rank}
              </span>
              <div className="min-w-0 flex items-center gap-1">
                <p className={`text-xs font-semibold text-foreground truncate ${i === 0 ? 'font-black' : ''}`}>{s.name}</p>
                {pastChampions[canonicalName(s.name)]?.some(y => y !== currentYear) && (
                  <img src={MASTERS_PATCH} alt="Past Champion" className="w-4 h-4 rounded-full flex-shrink-0" title={`Champion: ${pastChampions[canonicalName(s.name)].filter(y => y !== currentYear).join(', ')}`} />
                )}
              </div>
              <div className="text-center">
                <p className={`text-[10px] font-semibold ${scoreColor(s.scoreA)}`}>{formatScore(s.scoreA)}</p>
                <p className="text-[8px] text-muted-foreground/60 truncate">{s.golferA}</p>
              </div>
              <div className="text-center">
                <p className={`text-[10px] font-semibold ${scoreColor(s.scoreB)}`}>{formatScore(s.scoreB)}</p>
                <p className="text-[8px] text-muted-foreground/60 truncate">{s.golferB}</p>
              </div>
              <span className={`text-center text-xs font-black tabular-nums ${scoreColor(s.total)}`}>
                {formatScore(s.total)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Hint for summary-only years */}
      {!hasFullStandings && (
        <div className="px-4 pb-3">
          <p className="text-[10px] text-muted-foreground/50 italic">Champion record only — full standings not available</p>
        </div>
      )}
    </div>
  );
}

export default function HistoryTab({ poolId }) {
  const years = Object.keys(POOL_HISTORY).sort((a, b) => Number(b) - Number(a));
  const [expandedYear, setExpandedYear] = useState(null);
  const pastChampions = getPastChampions();

  // Fire big celebration when entering champions wall
  useEffect(() => {
    const t1 = setTimeout(() => {
      fireGoldRain();
      soundChampion();
    }, 300);
    const t2 = setTimeout(() => {
      fireJackpot();
      soundJackpot();
    }, 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Count total wins per participant
  const winCounts = {};
  for (const [, data] of Object.entries(POOL_HISTORY)) {
    winCounts[data.winner] = (winCounts[data.winner] || 0) + 1;
  }
  const repeatWinners = Object.entries(winCounts).filter(([, c]) => c > 1);

  return (
    <div className="px-3 pt-3 pb-0 space-y-3">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0a3d0a] to-primary rounded-xl p-4 border border-accent/30 text-center relative overflow-hidden mb-2">
        <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-30" />
        <div className="relative">
          <Trophy className="w-8 h-8 text-accent mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Champions Wall
          </h2>
          <p className="text-[10px] tracking-widest text-accent uppercase font-semibold mt-1">Cowtown Masters Legacy</p>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="text-[10px] text-primary-foreground/50">{years.length} Tournaments</span>
            <span className="w-1 h-1 rounded-full bg-accent/40" />
            <span className="text-[10px] text-primary-foreground/50">{Object.keys(winCounts).length} Champions</span>
          </div>
        </div>
      </div>

      {/* Dynasty callout */}
      {repeatWinners.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {repeatWinners.map(([name, count]) => (
            <div key={name} className="flex-shrink-0 bg-accent/10 rounded-lg px-3 py-1.5 border border-accent/20">
              <p className="text-[10px] font-black text-accent tracking-widest uppercase">Dynasty</p>
              <p className="text-sm font-bold text-foreground">{name} <span className="text-accent">×{count}</span></p>
            </div>
          ))}
        </div>
      )}

      {years.length === 0 && (
        <div className="rounded-xl border-2 border-accent/30 bg-gradient-to-b from-accent/5 to-transparent p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-10" />
          <div className="relative">
            <Trophy className="w-14 h-14 text-accent/40 mx-auto mb-4 animate-pulse" />
            <h3 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Champions Wall
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Previous year winners and pool history will be displayed here after each tournament concludes.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="w-8 h-px bg-accent/30" />
              <Calendar className="w-4 h-4 text-accent/40" />
              <span className="w-8 h-px bg-accent/30" />
            </div>
          </div>
        </div>
      )}

      {years.map((year, i) => (
        <div key={year} className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
          <ChampionCard
            year={year}
            data={POOL_HISTORY[year]}
            isExpanded={expandedYear === year}
            onToggle={() => setExpandedYear(expandedYear === year ? null : year)}
            pastChampions={pastChampions}
          />
        </div>
      ))}
    </div>
  );
}