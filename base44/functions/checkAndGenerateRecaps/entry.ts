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

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // Determine current round from date
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const roundNumber = ROUND_DATES[dateStr];

    if (!roundNumber) {
      return Response.json({ message: 'Not a Masters round day', date: dateStr });
    }

    // Find active pool
    const pools = await base44.asServiceRole.entities.Pool.filter({});
    const pool = pools.find(p => p.status === 'live' || p.status === 'complete');
    if (!pool) return Response.json({ message: 'No active pool' });

    const poolId = pool.id;
    const rKey = `round_${roundNumber}`;

    // Check if all golfers have finished the round
    const golfers = await base44.asServiceRole.entities.Golfer.filter({ pool_id: poolId });
    const activeGolfers = golfers.filter(g => g.status === 'active');
    
    // A golfer has finished the round if they have a round score and thru is 'F' or '18' or they have the next round's data
    const allFinished = activeGolfers.every(g => {
      const roundScore = g[rKey];
      if (roundScore == null) return false;
      // Check thru field — 'F' means finished for the day
      const thru = (g.thru || '').toUpperCase();
      return thru === 'F' || thru === '18' || thru === 'FINISHED';
    });

    if (!allFinished) {
      const onCourse = activeGolfers.filter(g => {
        const thru = (g.thru || '').toUpperCase();
        return g[rKey] == null || (thru !== 'F' && thru !== '18' && thru !== 'FINISHED');
      }).length;
      return Response.json({ 
        message: `Round ${roundNumber} not yet complete`, 
        golfers_still_on_course: onCourse,
        total_active: activeGolfers.length,
      });
    }

    // Check if recaps already exist
    const existingRecaps = await base44.asServiceRole.entities.RoundRecap.filter({
      pool_id: poolId,
      round_number: roundNumber,
      tournament_year: 2026,
    });

    if (existingRecaps.length > 0) {
      // If round 4 is done and recaps exist, check if tournament recaps need generating
      if (roundNumber === 4) {
        const tourneyRecaps = await base44.asServiceRole.entities.RoundRecap.filter({
          pool_id: poolId, round_number: 5, tournament_year: 2026,
        });
        if (tourneyRecaps.length === 0) {
          const tourneyResult = await base44.asServiceRole.functions.invoke('generateTournamentRecaps', {
            tournament_year: 2026, force_regenerate: false,
          });
          return Response.json({ message: 'Round 4 recaps exist, triggered tournament recaps', result: tourneyResult.data || tourneyResult });
        }
      }
      return Response.json({ message: `Recaps for round ${roundNumber} already exist`, count: existingRecaps.length });
    }

    // Trigger round generation
    const result = await base44.asServiceRole.functions.invoke('generateRoundRecaps', {
      round_number: roundNumber, tournament_year: 2026, force_regenerate: false,
    });

    // If this is round 4, also trigger tournament recaps
    if (roundNumber === 4) {
      try {
        await base44.asServiceRole.functions.invoke('generateTournamentRecaps', {
          tournament_year: 2026, force_regenerate: false,
        });
      } catch (e) { console.error('Tournament recap trigger error:', e.message); }
    }

    return Response.json({ message: `Triggered recap generation for round ${roundNumber}`, result: result.data || result });
  } catch (error) {
    console.error('checkAndGenerateRecaps error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});