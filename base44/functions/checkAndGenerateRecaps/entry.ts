import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Scheduled automation function: checks if the current round is complete
 * and triggers recap generation if no recaps exist yet.
 */

const ROUND_DATES = {
  '2026-04-09': 1,
  '2026-04-10': 2,
  '2026-04-11': 3,
  '2026-04-12': 4,
};

const ROUND_DATES_REVERSE = {
  1: '2026-04-09',
  2: '2026-04-10',
  3: '2026-04-11',
  4: '2026-04-12',
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // Determine which rounds could have been played by now
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Find all rounds on or before today
    const roundsToCheck = [];
    for (const [date, round] of Object.entries(ROUND_DATES)) {
      if (date <= dateStr) roundsToCheck.push(round);
    }

    if (roundsToCheck.length === 0) {
      return Response.json({ message: 'Not a Masters round day yet', date: dateStr });
    }

    // Find active pool
    const pools = await base44.asServiceRole.entities.Pool.filter({});
    const pool = pools.find(p => p.status === 'live' || p.status === 'complete');
    if (!pool) return Response.json({ message: 'No active pool' });

    const poolId = pool.id;

    // Fetch golfers once
    const golfers = await base44.asServiceRole.entities.Golfer.filter({ pool_id: poolId });
    const activeGolfers = golfers.filter(g => g.status === 'active' && (g.round_1 != null || g.thru || g.position));
    // Include cut golfers for completed rounds — they have valid round data
    const allScoredGolfers = golfers.filter(g => (g.round_1 != null || g.thru || g.position));

    if (allScoredGolfers.length === 0) {
      return Response.json({ message: 'No participating golfers found yet' });
    }

    const results = [];

    // Check each round that should have been played
    for (const roundNumber of roundsToCheck.sort((a, b) => a - b)) {
      const rKey = `round_${roundNumber}`;

      // For past rounds, check if data exists (most golfers have round scores)
      // For the current round, check thru status
      const isToday = ROUND_DATES_REVERSE[roundNumber] === dateStr;

      // Check if the round is complete
      // For active golfers: need round score and thru=F
      // For cut golfers: only rounds 1-2 matter (they don't play 3-4)
      const golfersForRound = roundNumber <= 2 ? allScoredGolfers : activeGolfers;

      const allFinished = golfersForRound.every(g => {
        const roundScore = g[rKey];
        if (roundScore == null) {
          // Cut golfers won't have R3/R4 scores — that's expected
          if (g.status === 'cut' && roundNumber > 2) return true;
          return false;
        }
        if (!isToday) return true; // Past round with score = finished
        const thru = (g.thru || '').toUpperCase();
        return thru === 'F' || thru === '18' || thru === 'FINISHED';
      });

      if (!allFinished) {
        if (isToday) {
          const onCourse = golfersForRound.filter(g => {
            if (g.status === 'cut' && roundNumber > 2) return false;
            const thru = (g.thru || '').toUpperCase();
            return g[rKey] == null || (thru !== 'F' && thru !== '18' && thru !== 'FINISHED');
          }).length;
          results.push({ round: roundNumber, status: 'in_progress', golfers_on_course: onCourse });
        } else {
          results.push({ round: roundNumber, status: 'incomplete_data' });
        }
        continue;
      }

      // Check if recaps already exist
      const existingRecaps = await base44.asServiceRole.entities.RoundRecap.filter({
        pool_id: poolId,
        round_number: roundNumber,
        tournament_year: 2026,
      });

      if (existingRecaps.length > 0) {
        results.push({ round: roundNumber, status: 'already_exists', count: existingRecaps.length });

        // If round 4 is done, check tournament recaps
        if (roundNumber === 4) {
          const tourneyRecaps = await base44.asServiceRole.entities.RoundRecap.filter({
            pool_id: poolId, round_number: 5, tournament_year: 2026,
          });
          if (tourneyRecaps.length === 0) {
            await base44.asServiceRole.functions.invoke('generateTournamentRecaps', {
              tournament_year: 2026, force_regenerate: false,
            });
            results.push({ round: 'tournament', status: 'triggered' });
          }
        }
        continue;
      }

      // Generate recaps for this round
      const result = await base44.asServiceRole.functions.invoke('generateRoundRecaps', {
        round_number: roundNumber, tournament_year: 2026, force_regenerate: false,
      });
      results.push({ round: roundNumber, status: 'generated', result: result.data || result });

      // If round 4, also trigger tournament recaps
      if (roundNumber === 4) {
        try {
          await base44.asServiceRole.functions.invoke('generateTournamentRecaps', {
            tournament_year: 2026, force_regenerate: false,
          });
          results.push({ round: 'tournament', status: 'triggered' });
        } catch (e) { console.error('Tournament recap trigger error:', e.message); }
      }
    }

    return Response.json({ pool_id: poolId, rounds_checked: roundsToCheck, results });
  } catch (error) {
    console.error('checkAndGenerateRecaps error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});