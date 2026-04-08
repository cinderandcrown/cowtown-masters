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

/** Get a golfer's effective score, treating null/undefined as 0 (pre-tournament). */
function getGolferScore(golfer) {
  if (!golfer) return 0;
  if (golfer.status === 'withdrawn' || golfer.status === 'disqualified') {
    // Use their last recorded score, or 0 if they never started
    return golfer.score_to_par ?? 0;
  }
  return golfer.score_to_par ?? 0;
}

/** Check if an entry has at least one drafted golfer. */
function hasDraftedGolfers(entry) {
  return !!(entry.golfer_a_id || entry.golfer_b_id);
}

/** Enrich entries with golfer scores and sort by total (lowest wins). */
export function enrichEntries(entries, golfers) {
  const golferMap = buildGolferMap(golfers);

  return entries
    .map((entry) => {
      const golferA = entry.golfer_a_id ? golferMap[entry.golfer_a_id] : null;
      const golferB = entry.golfer_b_id ? golferMap[entry.golfer_b_id] : null;
      const scoreA = getGolferScore(golferA);
      const scoreB = getGolferScore(golferB);
      return {
        ...entry,
        golferA,
        golferB,
        score_a: scoreA,
        score_b: scoreB,
        total_score: scoreA + scoreB,
        hasDraft: hasDraftedGolfers(entry),
      };
    })
    .sort((a, b) => {
      // Undrafted entries sort to the bottom
      if (a.hasDraft && !b.hasDraft) return -1;
      if (!a.hasDraft && b.hasDraft) return 1;
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
