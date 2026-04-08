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

/** Enrich entries with golfer scores and sort by total (lowest wins).
 *  Withdrawn/DQ golfers use their last recorded score_to_par (fallback 0).
 *  Entries with no drafted golfers sort to the bottom. */
export function enrichEntries(entries, golfers) {
  const golferMap = buildGolferMap(golfers);

  return entries
    .map((entry) => {
      const golferA = entry.golfer_a_id ? golferMap[entry.golfer_a_id] : null;
      const golferB = entry.golfer_b_id ? golferMap[entry.golfer_b_id] : null;
      const hasDraft = !!(entry.golfer_a_id || entry.golfer_b_id);
      // Use last recorded score_to_par regardless of status (wd/dq keep their score)
      const scoreA = golferA ? (golferA.score_to_par ?? 0) : 0;
      const scoreB = golferB ? (golferB.score_to_par ?? 0) : 0;
      return {
        ...entry,
        golferA,
        golferB,
        score_a: scoreA,
        score_b: scoreB,
        total_score: scoreA + scoreB,
        _hasDraft: hasDraft,
      };
    })
    .sort((a, b) => {
      // Undrafted entries always sort last
      if (a._hasDraft && !b._hasDraft) return -1;
      if (!a._hasDraft && b._hasDraft) return 1;
      return a.total_score - b.total_score;
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