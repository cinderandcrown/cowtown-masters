import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Fetches live Masters scores from ESPN's public leaderboard API
 * and updates all golfer records in the pool.
 * 
 * Can be called manually (POST with pool_id) or by a scheduled automation.
 */

const ESPN_LEADERBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard';

function parseScoreToPar(val) {
  if (val === 'E' || val === 0 || val === '0') return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const n = parseInt(val, 10);
    return isNaN(n) ? null : n;
  }
  return null;
}

function normalizeName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z\s]/g, '')
    .toLowerCase()
    .trim();
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // Find the active pool
    const pools = await base44.asServiceRole.entities.Pool.filter({});
    const pool = pools.find(p => p.status === 'live' || p.status === 'setup' || p.status === 'draft');
    
    if (!pool) {
      return Response.json({ message: 'No active pool found' }, { status: 200 });
    }

    const poolId = pool.id;

    // Fetch ESPN leaderboard
    const espnRes = await fetch(ESPN_LEADERBOARD_URL);
    if (!espnRes.ok) {
      return Response.json({ error: 'ESPN API returned ' + espnRes.status }, { status: 502 });
    }

    const espnData = await espnRes.json();

    // Find the Masters tournament from the events
    const events = espnData?.events || [];
    const mastersEvent = events.find(e => 
      e.name?.toLowerCase().includes('masters') || 
      e.shortName?.toLowerCase().includes('masters')
    ) || events[0]; // fallback to current event

    if (!mastersEvent) {
      return Response.json({ message: 'No active tournament found on ESPN', updated: 0 });
    }

    const competition = mastersEvent.competitions?.[0];
    if (!competition) {
      return Response.json({ message: 'No competition data found', updated: 0 });
    }

    const competitors = competition.competitors || [];
    console.log(`Found ${competitors.length} competitors from ESPN for: ${mastersEvent.name}`);

    // Build a lookup map by normalized name
    const espnMap = {};
    for (const c of competitors) {
      const athlete = c.athlete || {};
      const name = athlete.displayName || athlete.shortName || '';
      const normalized = normalizeName(name);
      
      const linescores = c.linescores || [];
      const roundScores = [];
      for (let i = 0; i < 4; i++) {
        if (linescores[i] && linescores[i].value !== undefined) {
          roundScores.push(linescores[i].value);
        } else {
          roundScores.push(null);
        }
      }

      // Round-level score to par (linescores have displayValue relative to par)
      const roundsToPar = [];
      for (let i = 0; i < 4; i++) {
        if (linescores[i] && linescores[i].displayValue !== undefined) {
          roundsToPar.push(parseScoreToPar(linescores[i].displayValue));
        } else {
          roundsToPar.push(null);
        }
      }

      const status_detail = c.status?.type?.name || '';
      let golferStatus = 'active';
      if (status_detail === 'cut') golferStatus = 'cut';
      else if (status_detail === 'wd' || status_detail === 'withdrawn') golferStatus = 'withdrawn';
      else if (status_detail === 'dq' || status_detail === 'disqualified') golferStatus = 'disqualified';

      espnMap[normalized] = {
        score_to_par: parseScoreToPar(c.score?.displayValue) || parseScoreToPar(c.statistics?.[0]?.displayValue) || 0,
        round_1: roundsToPar[0],
        round_2: roundsToPar[1],
        round_3: roundsToPar[2],
        round_4: roundsToPar[3],
        actual_scores: roundScores.filter(s => s !== null),
        status: golferStatus,
        position: c.status?.position?.displayName || c.sortOrder?.toString() || null,
        thru: c.status?.thru?.toString() || c.status?.displayValue || null,
      };
    }

    // Fetch all golfers in the pool
    const golfers = await base44.asServiceRole.entities.Golfer.filter({ pool_id: poolId });
    console.log(`Matching ${golfers.length} pool golfers against ESPN data...`);

    let updated = 0;
    let matched = 0;

    for (const golfer of golfers) {
      const normalized = normalizeName(golfer.name);
      const espnData = espnMap[normalized];

      if (espnData) {
        matched++;
        // Only update if something changed
        const hasChanged =
          golfer.score_to_par !== espnData.score_to_par ||
          golfer.round_1 !== espnData.round_1 ||
          golfer.round_2 !== espnData.round_2 ||
          golfer.round_3 !== espnData.round_3 ||
          golfer.round_4 !== espnData.round_4 ||
          golfer.status !== espnData.status ||
          golfer.position !== espnData.position ||
          golfer.thru !== espnData.thru;

        if (hasChanged) {
          await base44.asServiceRole.entities.Golfer.update(golfer.id, espnData);
          updated++;
        }
      }
    }

    console.log(`Matched: ${matched}, Updated: ${updated}`);

    return Response.json({
      tournament: mastersEvent.name,
      espn_competitors: competitors.length,
      pool_golfers: golfers.length,
      matched,
      updated,
    });

  } catch (error) {
    console.error('Score fetch error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});