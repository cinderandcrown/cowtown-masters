/**
 * Calculates win probability for each entry based on current scores
 * and remaining holes. Uses a simple statistical model based on
 * strokes behind the leader and holes remaining.
 *
 * Model: Each remaining hole has ~0.2 strokes standard deviation.
 * We use a normal distribution approximation to estimate the probability
 * that each team can finish with the best score.
 */

// Approximate normal CDF using Abramowitz and Stegun
function normalCDF(x) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

/**
 * Parse holes remaining for a golfer from their "thru" field.
 * "F" or "18" = finished round, null/"—" = hasn't started
 * A number 1-17 means they're on the course with (18 - thru) holes left in current round.
 */
function holesRemainingInRound(thru) {
  if (!thru || thru === '—' || thru === '-') return 18; // hasn't started
  if (thru === 'F' || thru === '18') return 0; // finished
  const n = parseInt(thru, 10);
  if (isNaN(n)) return 0;
  return Math.max(0, 18 - n);
}

/**
 * Estimate total holes remaining for a golfer in the tournament.
 * Uses round scores to determine which round they're in.
 */
function totalHolesRemaining(golfer) {
  if (!golfer) return 72; // no golfer assigned
  if (golfer.status === 'cut' || golfer.status === 'withdrawn' || golfer.status === 'disqualified') return 0;

  // Count completed rounds
  const rounds = [golfer.round_1, golfer.round_2, golfer.round_3, golfer.round_4];
  let completedRounds = 0;
  for (const r of rounds) {
    if (r != null) completedRounds++;
  }

  const holesInRound = holesRemainingInRound(golfer.thru);

  // If they have holes remaining in current round, they're in round (completedRounds + 1)
  // unless thru=F, meaning they just finished a round
  if (holesInRound > 0) {
    // Currently playing: remaining = holes in this round + future rounds * 18
    const futureRounds = Math.max(0, 4 - completedRounds - 1);
    return holesInRound + (futureRounds * 18);
  }

  // Finished current round or between rounds
  const futureRounds = Math.max(0, 4 - completedRounds);
  return futureRounds * 18;
}

/**
 * Calculate win probabilities for all entries.
 * 
 * @param {Array} standings - entries with golferA, golferB, total_score
 * @returns {Object} map of entry.id -> { winPct, odds }
 */
export function calculateWinProbabilities(standings) {
  if (!standings || standings.length === 0) return {};

  // Standard deviation per hole (empirical: ~0.18-0.22 for PGA tour)
  const SIGMA_PER_HOLE = 0.20;

  // Calculate holes remaining per team (sum of both golfers)
  const teamData = standings.map(entry => {
    const holesA = totalHolesRemaining(entry.golferA);
    const holesB = totalHolesRemaining(entry.golferB);
    const totalHoles = holesA + holesB;
    // Team variance = sum of individual variances
    const variance = totalHoles * SIGMA_PER_HOLE * SIGMA_PER_HOLE;
    return {
      id: entry.id,
      score: entry.total_score ?? 0,
      holesRemaining: totalHoles,
      sigma: Math.sqrt(variance),
    };
  });

  const bestScore = Math.min(...teamData.map(t => t.score));
  const probabilities = {};

  // If tournament is complete (all holes = 0), leader wins 100%
  const allDone = teamData.every(t => t.holesRemaining === 0);
  if (allDone) {
    const winners = teamData.filter(t => t.score === bestScore);
    for (const t of teamData) {
      const pct = t.score === bestScore ? (100 / winners.length) : 0;
      probabilities[t.id] = { winPct: Math.round(pct * 10) / 10, odds: pctToOdds(pct) };
    }
    return probabilities;
  }

  // Monte Carlo-inspired analytical approach:
  // For each team, calculate P(team finishes with lowest score)
  // Using pairwise comparison with combined variance
  const rawProbs = teamData.map((team, i) => {
    if (team.holesRemaining === 0 && team.score > bestScore) {
      // Already finished and behind — very low but not zero if others have variance
      // They can still win if leaders collapse
    }

    let logProb = 0;
    for (let j = 0; j < teamData.length; j++) {
      if (i === j) continue;
      const other = teamData[j];
      const scoreDiff = other.score - team.score; // positive = other is worse
      const combinedSigma = Math.sqrt(team.sigma * team.sigma + other.sigma * other.sigma);

      if (combinedSigma === 0) {
        // Both done, pure score comparison
        if (scoreDiff < 0) return 0; // other beat us
        continue;
      }

      // P(team beats other) = P(team_final < other_final)
      const p = normalCDF(scoreDiff / combinedSigma);
      if (p <= 0) return 0;
      logProb += Math.log(p);
    }
    return Math.exp(logProb);
  });

  // Normalize probabilities
  const total = rawProbs.reduce((a, b) => a + b, 0);
  for (let i = 0; i < teamData.length; i++) {
    const pct = total > 0 ? (rawProbs[i] / total) * 100 : 0;
    const rounded = Math.round(pct * 10) / 10;
    probabilities[teamData[i].id] = {
      winPct: rounded,
      odds: pctToOdds(rounded),
    };
  }

  return probabilities;
}

function pctToOdds(pct) {
  if (pct <= 0) return '—';
  if (pct >= 99.5) return '-10000';
  if (pct >= 50) {
    // Favorite: negative American odds
    return `-${Math.round((pct / (100 - pct)) * 100)}`;
  }
  // Underdog: positive American odds
  return `+${Math.round(((100 - pct) / pct) * 100)}`;
}

/**
 * Check if a golfer is currently on the course
 */
export function isOnCourse(golfer) {
  if (!golfer) return false;
  if (golfer.status !== 'active') return false;
  const thru = golfer.thru;
  if (!thru || thru === '—' || thru === '-' || thru === 'F' || thru === '18') return false;
  const n = parseInt(thru, 10);
  return !isNaN(n) && n > 0 && n < 18;
}

/**
 * Get a display label for golfer's current status
 */
export function getGolferLiveStatus(golfer) {
  if (!golfer) return null;
  if (golfer.status === 'cut') return { label: 'CUT', color: 'destructive' };
  if (golfer.status === 'withdrawn') return { label: 'WD', color: 'orange' };
  if (golfer.status === 'disqualified') return { label: 'DQ', color: 'destructive' };
  if (isOnCourse(golfer)) return { label: `Thru ${golfer.thru}`, color: 'live' };
  if (golfer.thru === 'F') return { label: 'F', color: 'finished' };
  return null;
}