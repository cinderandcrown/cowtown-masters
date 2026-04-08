/**
 * Win probability model for Cowtown Masters pool.
 * 
 * Pre-tournament: Uses combined golfer betting odds to derive team strength.
 * During tournament: Blends betting-odds prior with live scoring + remaining holes.
 * Post-tournament: Pure score comparison.
 */

// Approximate normal CDF (Abramowitz & Stegun)
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
 * Convert American odds string to implied probability (0-1).
 * e.g. "+600" → 0.143, "-150" → 0.6, "+200000" → ~0.0005
 */
function oddsToImpliedProb(oddsStr) {
  if (!oddsStr) return 0.001; // fallback: very low
  const n = parseInt(oddsStr.replace(/[^-+\d]/g, ''), 10);
  if (isNaN(n) || n === 0) return 0.001;
  if (n > 0) {
    // Underdog: +600 → 100/(600+100) = 0.143
    return 100 / (n + 100);
  }
  // Favorite: -150 → 150/(150+100) = 0.6
  return Math.abs(n) / (Math.abs(n) + 100);
}

/**
 * Calculate team implied probability from two golfers' betting odds.
 * We use the product of individual "finish well" probabilities as a proxy.
 * Better golfers (lower odds) = higher team strength.
 * 
 * We use a "top-10 equivalent" approach: a golfer with +600 Masters odds
 * has roughly a 14% chance to win, but much higher chance to finish top-10.
 * For team scoring, what matters is how well each golfer performs overall.
 */
function teamImpliedStrength(golferA, golferB) {
  const probA = oddsToImpliedProb(golferA?.betting_odds);
  const probB = oddsToImpliedProb(golferB?.betting_odds);
  // Use sqrt to convert "win prob" into a broader "performance quality" metric.
  // A golfer with 14% win chance performs well ~37% of the time.
  // This creates more meaningful spread between teams.
  const strengthA = Math.sqrt(probA);
  const strengthB = Math.sqrt(probB);
  return strengthA * strengthB;
}

function holesRemainingInRound(thru) {
  if (!thru || thru === '—' || thru === '-') return 18;
  if (thru === 'F' || thru === '18') return 0;
  const n = parseInt(thru, 10);
  if (isNaN(n)) return 0;
  return Math.max(0, 18 - n);
}

function totalHolesRemaining(golfer) {
  if (!golfer) return 72;
  if (golfer.status === 'cut' || golfer.status === 'withdrawn' || golfer.status === 'disqualified') return 0;

  const rounds = [golfer.round_1, golfer.round_2, golfer.round_3, golfer.round_4];
  let completedRounds = 0;
  for (const r of rounds) {
    if (r != null) completedRounds++;
  }

  const holesInRound = holesRemainingInRound(golfer.thru);

  if (holesInRound > 0) {
    const futureRounds = Math.max(0, 4 - completedRounds - 1);
    return holesInRound + (futureRounds * 18);
  }

  const futureRounds = Math.max(0, 4 - completedRounds);
  return futureRounds * 18;
}

/**
 * Calculate win probabilities for all entries.
 * 
 * Strategy:
 * - Pre-tournament (all 144 holes remaining, all scores 0): pure betting-odds based
 * - Mid-tournament: blend odds prior with live score differential
 * - Post-tournament (0 holes remaining): pure score comparison
 * 
 * The "blend" weights odds more heavily early and scoring more heavily late.
 */
export function calculateWinProbabilities(standings) {
  if (!standings || standings.length === 0) return {};

  const SIGMA_PER_HOLE = 0.20;
  const MAX_TEAM_HOLES = 144; // 72 per golfer × 2

  const teamData = standings.map(entry => {
    const holesA = totalHolesRemaining(entry.golferA);
    const holesB = totalHolesRemaining(entry.golferB);
    const totalHoles = holesA + holesB;
    const variance = totalHoles * SIGMA_PER_HOLE * SIGMA_PER_HOLE;
    const impliedStrength = teamImpliedStrength(entry.golferA, entry.golferB);

    return {
      id: entry.id,
      score: entry.total_score ?? 0,
      holesRemaining: totalHoles,
      sigma: Math.sqrt(variance),
      impliedStrength,
    };
  });

  const bestScore = Math.min(...teamData.map(t => t.score));
  const probabilities = {};

  // Tournament progress: 0 = hasn't started, 1 = complete
  const maxHolesInPool = Math.max(...teamData.map(t => t.holesRemaining));
  const progress = maxHolesInPool > 0 ? 1 - (maxHolesInPool / MAX_TEAM_HOLES) : 1;

  // If ALL teams have 0 holes remaining → tournament complete
  const allDone = teamData.every(t => t.holesRemaining === 0);
  if (allDone) {
    const winners = teamData.filter(t => t.score === bestScore);
    for (const t of teamData) {
      const pct = t.score === bestScore ? (100 / winners.length) : 0;
      probabilities[t.id] = { winPct: Math.round(pct * 10) / 10, odds: pctToOdds(pct) };
    }
    return probabilities;
  }

  // === Calculate odds-based probabilities ===
  const totalStrength = teamData.reduce((sum, t) => sum + t.impliedStrength, 0);
  const oddsProbs = teamData.map(t => totalStrength > 0 ? t.impliedStrength / totalStrength : 1 / teamData.length);

  // === Calculate score-based probabilities ===
  const scoreProbs = teamData.map((team, i) => {
    // If no variance anywhere (shouldn't happen mid-tournament), fall back
    if (team.sigma === 0 && teamData.every(t => t.sigma === 0)) {
      return team.score === bestScore ? 1 : 0;
    }

    let logProb = 0;
    for (let j = 0; j < teamData.length; j++) {
      if (i === j) continue;
      const other = teamData[j];
      const scoreDiff = other.score - team.score;
      const combinedSigma = Math.sqrt(team.sigma * team.sigma + other.sigma * other.sigma);

      if (combinedSigma === 0) {
        if (scoreDiff < 0) return 0;
        continue;
      }

      const p = normalCDF(scoreDiff / combinedSigma);
      if (p <= 0) return 0;
      logProb += Math.log(p);
    }
    return Math.exp(logProb);
  });

  const scoreProbTotal = scoreProbs.reduce((a, b) => a + b, 0);
  const normalizedScoreProbs = scoreProbs.map(p => scoreProbTotal > 0 ? p / scoreProbTotal : 1 / teamData.length);

  // === Blend based on tournament progress ===
  // Early tournament: lean heavily on odds (80% odds, 20% score)
  // Late tournament: lean heavily on scores (10% odds, 90% score)
  // The blend uses progress^1.5 to shift faster once scores are meaningful
  const scoreWeight = Math.pow(progress, 1.5) * 0.8 + 0.2; // ranges from 0.2 to 1.0
  const oddsWeight = 1 - scoreWeight;

  for (let i = 0; i < teamData.length; i++) {
    const blended = (oddsWeight * oddsProbs[i]) + (scoreWeight * normalizedScoreProbs[i]);
    const pct = blended * 100;
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
    return `-${Math.round((pct / (100 - pct)) * 100)}`;
  }
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