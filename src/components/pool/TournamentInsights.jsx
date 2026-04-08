import React, { useMemo, useState } from 'react';
import { BarChart3, Gem, Scissors, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { formatScore, scoreColor } from '@/lib/scoreUtils';

function PopularGolfersSection({ entries, golfers }) {
  // Count how many entries drafted each golfer
  const golferPickCounts = useMemo(() => {
    const counts = {};
    for (const entry of entries) {
      if (entry.golfer_a_id) {
        counts[entry.golfer_a_id] = (counts[entry.golfer_a_id] || 0) + 1;
      }
      if (entry.golfer_b_id) {
        counts[entry.golfer_b_id] = (counts[entry.golfer_b_id] || 0) + 1;
      }
    }
    return counts;
  }, [entries]);

  // Detect if tournament has started
  const tourneyStarted = golfers.some(g =>
    (g.score_to_par != null && g.score_to_par !== 0) ||
    g.round_1 != null
  );

  // Top performing golfers sorted by score (or odds pre-tournament), with pick counts (only drafted golfers)
  const topGolfers = useMemo(() => {
    return golfers
      .filter(g => g.status === 'active' && g.is_drafted)
      .sort((a, b) => {
        if (tourneyStarted) return (a.score_to_par ?? 99) - (b.score_to_par ?? 99);
        // Pre-tournament: sort by betting odds (favorites first)
        const oddsA = parseInt((a.betting_odds || '+999999').replace(/[^-+\d]/g, ''), 10) || 999999;
        const oddsB = parseInt((b.betting_odds || '+999999').replace(/[^-+\d]/g, ''), 10) || 999999;
        return oddsA - oddsB;
      })
      .slice(0, 8)
      .map(g => ({
        ...g,
        pickCount: golferPickCounts[g.id] || 0,
      }));
  }, [golfers, golferPickCounts, tourneyStarted]);

  if (topGolfers.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] font-black text-primary tracking-widest uppercase">Top Golfer Ownership</span>
      </div>
      <div className="space-y-1">
        {topGolfers.map((g) => {
          const pct = entries.length > 0 ? Math.round((g.pickCount / entries.length) * 100) : 0;
          return (
            <div key={g.id} className="flex items-center gap-2">
              <span className={`text-xs font-black tabular-nums w-10 text-right ${scoreColor(g.score_to_par)}`}>
                {formatScore(g.score_to_par)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-semibold text-foreground truncate">{g.name}</span>
                    {g.betting_odds && (
                      <span className="text-[9px] font-bold text-accent/70 bg-accent/10 px-1 py-0.5 rounded flex-shrink-0">
                        {g.betting_odds}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground flex-shrink-0 ml-2">
                    {`${g.pickCount} pick${g.pickCount !== 1 ? 's' : ''}`}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/60 rounded-full transition-all"
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
              </div>
              <span className="text-[11px] font-bold text-muted-foreground tabular-nums w-8 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BestValueSection({ standings, golfers }) {
  // "Best value" = entry with best rank relative to their golfers' combined world ranking
  // Higher combined world ranking (worse odds) but low score = great value
  const bestValue = useMemo(() => {
    if (standings.length === 0) return null;

    const scored = standings
      .filter(e => e.golferA && e.golferB && e._hasDraft)
      .map(e => {
        const combinedRank = (e.golferA.world_ranking || 999) + (e.golferB.world_ranking || 999);
        return { ...e, combinedRank };
      })
      .sort((a, b) => {
        // Value = good score from high-ranked (worse odds) golfers
        // Lower total_score is better, higher combinedRank means worse seeded = more value
        const valueA = a.total_score - (a.combinedRank / 50);
        const valueB = b.total_score - (b.combinedRank / 50);
        return valueA - valueB;
      });

    return scored[0] || null;
  }, [standings]);

  if (!bestValue) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Gem className="w-3.5 h-3.5 text-accent" />
        <span className="text-[11px] font-black text-accent tracking-widest uppercase">Best Value Team</span>
      </div>
      <div className="bg-accent/8 rounded-xl p-3 border border-accent/20">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold text-foreground truncate">{bestValue.team_name || bestValue.participant_name}</span>
          <span className={`text-sm font-black tabular-nums ${scoreColor(bestValue.total_score)}`}>
            {formatScore(bestValue.total_score)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="truncate">{bestValue.golferA?.name} (#{bestValue.golferA?.world_ranking || '—'})</span>
          <span className="text-muted-foreground">&</span>
          <span className="truncate">{bestValue.golferB?.name} (#{bestValue.golferB?.world_ranking || '—'})</span>
        </div>
        <p className="text-[11px] text-accent font-semibold mt-1">
          Ranked #{bestValue.displayRank} with combined world ranking of {bestValue.combinedRank}
        </p>
      </div>
    </div>
  );
}

function CutLineSection({ standings, golfers }) {
  // Find golfers near the projected cut line
  // Masters cuts top 50 + ties after Round 2
  const activeGolfers = golfers.filter(g => g.status === 'active' && g.score_to_par != null);
  const sortedByScore = [...activeGolfers].sort((a, b) => (a.score_to_par ?? 99) - (b.score_to_par ?? 99));

  const cutPosition = Math.min(50, sortedByScore.length);
  const cutScore = sortedByScore[cutPosition - 1]?.score_to_par;

  if (cutScore == null || activeGolfers.length < 10) return null;

  // Entries with at least one golfer within 2 strokes of the cut line
  const bubbleEntries = standings.filter(e => {
    const gA = e.golferA;
    const gB = e.golferB;
    if (!gA && !gB) return false;
    const aOnBubble = gA?.status === 'active' && gA.score_to_par != null && Math.abs(gA.score_to_par - cutScore) <= 2;
    const bOnBubble = gB?.status === 'active' && gB.score_to_par != null && Math.abs(gB.score_to_par - cutScore) <= 2;
    return aOnBubble || bOnBubble;
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Scissors className="w-3.5 h-3.5 text-destructive" />
        <span className="text-[11px] font-black text-destructive tracking-widest uppercase">Cut-Line Watch</span>
        <span className="text-[11px] font-bold text-muted-foreground">
          Projected cut: {formatScore(cutScore)}
        </span>
      </div>
      {bubbleEntries.length === 0 ? (
        <p className="text-xs text-muted-foreground">No entries currently on the bubble.</p>
      ) : (
        <div className="space-y-1.5">
          {bubbleEntries.slice(0, 5).map((entry) => {
            const gA = entry.golferA;
            const gB = entry.golferB;
            const aBubble = gA?.status === 'active' && gA.score_to_par != null && Math.abs(gA.score_to_par - cutScore) <= 2;
            const bBubble = gB?.status === 'active' && gB.score_to_par != null && Math.abs(gB.score_to_par - cutScore) <= 2;
            return (
              <div key={entry.id} className="flex items-center gap-2 bg-destructive/5 rounded-lg px-3 py-2 border border-destructive/15">
                <span className="text-xs font-black text-muted-foreground w-6 text-center">{entry.displayRank}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{entry.team_name || entry.participant_name}</p>
                  <div className="flex items-center gap-1 text-[11px]">
                    {aBubble && (
                      <span className="text-destructive font-semibold truncate">
                        ⚠ {gA.name} ({formatScore(gA.score_to_par)})
                      </span>
                    )}
                    {aBubble && bBubble && <span className="text-muted-foreground">·</span>}
                    {bBubble && (
                      <span className="text-destructive font-semibold truncate">
                        ⚠ {gB.name} ({formatScore(gB.score_to_par)})
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-xs font-black tabular-nums ${scoreColor(entry.total_score)}`}>
                  {formatScore(entry.total_score)}
                </span>
              </div>
            );
          })}
          {bubbleEntries.length > 5 && (
            <p className="text-[11px] text-muted-foreground text-center">+{bubbleEntries.length - 5} more on the bubble</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function TournamentInsights({ standings, entries, golfers }) {
  const [expanded, setExpanded] = useState(false);

  // Show as long as there are golfers in the pool
  if (golfers.length === 0) return null;

  const hasDraftedEntries = entries.some(e => e.golfer_a_id || e.golfer_b_id);

  return (
    <div className="animate-fade-in-up bg-card rounded-xl border border-border overflow-hidden mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Tournament Insights
          </h3>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-5 border-t border-border pt-3">
          <PopularGolfersSection entries={entries} golfers={golfers} />
          <BestValueSection standings={standings} golfers={golfers} />
          <CutLineSection standings={standings} golfers={golfers} />
        </div>
      )}
    </div>
  );
}