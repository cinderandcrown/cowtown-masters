/**
 * Shared score formatting and calculation utilities for Cowtown Masters.
 */

export const formatScore = (s) =>
  s == null ? '–' : s === 0 ? 'E' : s > 0 ? `+${s}` : `${s}`;

export const scoreColor = (s) => {
  if (s == null) return 'text-muted-foreground';
  if (s < 0) return 'text-red-600';
  if (s > 0) return 'text-foreground';
  return 'text-accent';
};

/** Build a { [id]: golfer } lookup map from a golfer array. */
export function buildGolferMap(golfers) {
  const map = {};
  for (const g of golfers) map[g.id] = g;
  return map;
}

/** Convert American odds string to implied probability (0-1). */
function oddsToProb(oddsStr) {
  if (!oddsStr) return 0.001;
  const n = parseInt(oddsStr.replace(/[^-+\d]/g, ''), 10);
  if (isNaN(n) || n === 0) return 0.001;
  return n > 0 ? 100 / (n + 100) : Math.abs(n) / (Math.abs(n) + 100);
}

/** Enrich entries with golfer scores and sort by total (lowest wins).
 *  Withdrawn/DQ golfers use their last recorded score_to_par (fallback 0).
 *  Entries with no drafted golfers sort to the bottom.
 *  Pre-tournament (all scores 0): sorts by combined betting odds (best team first). */
export function enrichEntries(entries, golfers) {
  const golferMap = buildGolferMap(golfers);

  const enriched = entries
    .map((entry) => {
      const golferA = entry.golfer_a_id ? golferMap[entry.golfer_a_id] : null;
      const golferB = entry.golfer_b_id ? golferMap[entry.golfer_b_id] : null;
      const hasDraft = !!(entry.golfer_a_id || entry.golfer_b_id);
      const scoreA = golferA ? (golferA.score_to_par ?? 0) : 0;
      const scoreB = golferB ? (golferB.score_to_par ?? 0) : 0;
      // Combined implied probability from betting odds (higher = stronger team)
      const impliedStrength = (Math.sqrt(oddsToProb(golferA?.betting_odds)) * Math.sqrt(oddsToProb(golferB?.betting_odds))) || 0;
      return {
        ...entry,
        golferA,
        golferB,
        score_a: scoreA,
        score_b: scoreB,
        total_score: scoreA + scoreB,
        _hasDraft: hasDraft,
        _impliedStrength: impliedStrength,
      };
    });

  // Detect if tournament has started: any golfer has a non-zero score or round data
  const tourneyStarted = golfers.some(g =>
    (g.score_to_par != null && g.score_to_par !== 0) ||
    g.round_1 != null || g.round_2 != null || g.round_3 != null || g.round_4 != null
  );

  return enriched.sort((a, b) => {
    // Undrafted entries always sort last
    if (a._hasDraft && !b._hasDraft) return -1;
    if (!a._hasDraft && b._hasDraft) return 1;
    // If scores differ, sort by score (lowest wins)
    if (a.total_score !== b.total_score) return a.total_score - b.total_score;
    // Pre-tournament tiebreaker: sort by combined betting odds strength (best team first)
    if (!tourneyStarted) return b._impliedStrength - a._impliedStrength;
    return 0;
  });
}

/** Assign tie-aware positions (T1, T2, etc.) to a sorted standings array. */
export function assignPositions(standings) {
  if (standings.length === 0) return standings;

  let currentPos = 1;
  return standings.map((entry, i) => {
    if (i > 0 && entry.total_score !== standings[i - 1].total_score) {
      currentPos = i + 1;
    }
    const isTied =
      (i > 0 && entry.total_score === standings[i - 1].total_score) ||
      (i < standings.length - 1 && entry.total_score === standings[i + 1].total_score);
    return {
      ...entry,
      rank: currentPos,
      displayRank: isTied ? `T${currentPos}` : `${currentPos}`,
    };
  });
}

/** Parse team emails from a user_id field (comma-separated). */
export function parseTeamEmails(userId) {
  if (!userId || userId === 'manual') return [];
  return userId.split(',').map((e) => e.trim()).filter(Boolean);
}