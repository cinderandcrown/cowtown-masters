import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Fetches live Masters scores from masters.com JSON feed (primary)
 * with ESPN as fallback. Updates all golfer records in the active pool.
 * 
 * Masters.com feed: https://www.masters.com/en_US/scores/feeds/{year}/scores.json
 * ESPN fallback:    https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard
 */

const MASTERS_FEED_URL = 'https://www.masters.com/en_US/scores/feeds/2026/scores.json';
const ESPN_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard';

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

// Parse Masters.com feed format
// The feed returns { data: { player: { ... } } } with player objects keyed by ID
// Each player has: first_name, last_name, status, today, thru, topar, 
// round1, round2, round3, round4 (scores), etc.
function parseMastersFeed(feedData) {
  const players = feedData?.data?.player || feedData?.data?.players || {};
  const scoreMap = {};

  // Masters feed can be an object keyed by player ID or an array
  const playerList = Array.isArray(players) ? players : Object.values(players);

  for (const p of playerList) {
    const firstName = p.first_name || p.firstName || '';
    const lastName = p.last_name || p.lastName || '';
    const displayName = p.display_name || p.displayName || `${firstName} ${lastName}`;
    const normalized = normalizeName(displayName);

    if (!normalized) continue;

    // Parse round scores to par
    const round1 = parseScoreToPar(p.round1 || p.round1_to_par);
    const round2 = parseScoreToPar(p.round2 || p.round2_to_par);
    const round3 = parseScoreToPar(p.round3 || p.round3_to_par);
    const round4 = parseScoreToPar(p.round4 || p.round4_to_par);

    // Parse actual stroke scores
    const actualScores = [];
    for (const key of ['round1_strokes', 'round1Score', 'r1']) {
      if (p[key] != null) { actualScores.push(Number(p[key])); break; }
    }
    for (const key of ['round2_strokes', 'round2Score', 'r2']) {
      if (p[key] != null) { actualScores.push(Number(p[key])); break; }
    }
    for (const key of ['round3_strokes', 'round3Score', 'r3']) {
      if (p[key] != null) { actualScores.push(Number(p[key])); break; }
    }
    for (const key of ['round4_strokes', 'round4Score', 'r4']) {
      if (p[key] != null) { actualScores.push(Number(p[key])); break; }
    }

    // Total score to par
    const topar = parseScoreToPar(p.topar || p.to_par || p.total);

    // Status mapping
    let status = 'active';
    const pStatus = (p.status || '').toLowerCase();
    if (pStatus === 'cut' || pStatus === 'mc') status = 'cut';
    else if (pStatus === 'wd' || pStatus === 'withdrawn') status = 'withdrawn';
    else if (pStatus === 'dq' || pStatus === 'disqualified') status = 'disqualified';

    // Position
    const position = p.pos || p.position || p.place || null;

    // Thru
    const thru = p.thru || p.today_thru || null;

    scoreMap[normalized] = {
      score_to_par: topar ?? (round1 || 0) + (round2 || 0) + (round3 || 0) + (round4 || 0),
      round_1: round1,
      round_2: round2,
      round_3: round3,
      round_4: round4,
      actual_scores: actualScores.length > 0 ? actualScores : undefined,
      status,
      position: position ? String(position) : null,
      thru: thru ? String(thru) : null,
    };
  }

  return scoreMap;
}

// Parse ESPN feed (existing logic)
function parseESPNFeed(espnData) {
  const events = espnData?.events || [];
  const mastersEvent = events.find(e =>
    e.name?.toLowerCase().includes('masters') || e.shortName?.toLowerCase().includes('masters')
  ) || events[0];

  if (!mastersEvent) return { scoreMap: {}, tournament: null };

  const competition = mastersEvent.competitions?.[0];
  if (!competition) return { scoreMap: {}, tournament: mastersEvent.name };

  const competitors = competition.competitors || [];
  const scoreMap = {};

  for (const c of competitors) {
    const athlete = c.athlete || {};
    const name = athlete.displayName || athlete.shortName || '';
    const normalized = normalizeName(name);
    const linescores = c.linescores || [];

    const roundsToPar = [];
    const roundScores = [];
    for (let i = 0; i < 4; i++) {
      roundsToPar.push(linescores[i]?.displayValue !== undefined ? parseScoreToPar(linescores[i].displayValue) : null);
      roundScores.push(linescores[i]?.value !== undefined ? linescores[i].value : null);
    }

    const sd = c.status?.type?.name || '';
    let golferStatus = 'active';
    if (sd === 'cut') golferStatus = 'cut';
    else if (sd === 'wd' || sd === 'withdrawn') golferStatus = 'withdrawn';
    else if (sd === 'dq' || sd === 'disqualified') golferStatus = 'disqualified';

    scoreMap[normalized] = {
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

  return { scoreMap, tournament: mastersEvent.name };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // Hard gate: do NOT poll before the Masters actually starts
    // 2026 Masters Round 1 tees off Thursday April 10, ~8am ET (12:00 UTC)
    const MASTERS_START = new Date('2026-04-10T12:00:00Z');
    if (new Date() < MASTERS_START) {
      return Response.json({
        message: 'Masters has not started yet. Polling disabled until April 10.',
        starts: MASTERS_START.toISOString(),
        updated: 0,
      });
    }

    // Find the active pool
    const pools = await base44.asServiceRole.entities.Pool.filter({});
    const pool = pools.find(p => p.status === 'live' || p.status === 'draft' || p.status === 'setup');

    if (!pool) {
      return Response.json({ message: 'No active pool found' }, { status: 200 });
    }

    const poolId = pool.id;
    let source = null;
    let scoreMap = {};
    let tournamentName = 'Masters 2026';

    // Primary: Try Masters.com feed
    try {
      const mastersRes = await fetch(MASTERS_FEED_URL, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      });

      if (mastersRes.ok) {
        const mastersData = await mastersRes.json();
        const playerData = mastersData?.data?.player || mastersData?.data?.players || mastersData?.data;

        // Check if there's actual player data (feed returns empty {} pre-tournament)
        const hasPlayers = playerData && typeof playerData === 'object' && Object.keys(playerData).length > 0;

        if (hasPlayers) {
          scoreMap = parseMastersFeed(mastersData);
          source = 'masters.com';
          console.log(`Masters.com feed: ${Object.keys(scoreMap).length} players parsed`);
        } else {
          console.log('Masters.com feed returned empty data (pre-tournament), trying ESPN fallback...');
        }
      } else {
        console.log(`Masters.com feed returned ${mastersRes.status}, trying ESPN fallback...`);
      }
    } catch (e) {
      console.log(`Masters.com feed error: ${e.message}, trying ESPN fallback...`);
    }

    // Fallback: ESPN — but ONLY if the event is actually the Masters
    if (Object.keys(scoreMap).length === 0) {
      try {
        const espnRes = await fetch(ESPN_SCOREBOARD_URL);
        if (espnRes.ok) {
          const espnData = await espnRes.json();
          // Only use ESPN data if it's actually the Masters tournament
          const mastersEvent = (espnData?.events || []).find(e =>
            e.name?.toLowerCase().includes('masters') || e.shortName?.toLowerCase().includes('masters')
          );
          if (mastersEvent) {
            const result = parseESPNFeed(espnData);
            scoreMap = result.scoreMap;
            tournamentName = result.tournament || tournamentName;
            source = 'espn';
            console.log(`ESPN fallback: ${Object.keys(scoreMap).length} players parsed`);
          } else {
            console.log('ESPN scoreboard does not contain a Masters event — skipping');
          }
        }
      } catch (e) {
        console.log(`ESPN fallback error: ${e.message}`);
      }
    }

    if (Object.keys(scoreMap).length === 0) {
      return Response.json({
        message: 'No score data available from any source',
        sources_tried: ['masters.com', 'espn'],
        updated: 0,
      });
    }

    // Fetch all golfers in the pool and update
    const golfers = await base44.asServiceRole.entities.Golfer.filter({ pool_id: poolId });
    console.log(`Matching ${golfers.length} pool golfers against ${source} data...`);

    let updated = 0;
    let matched = 0;

    for (const golfer of golfers) {
      const normalized = normalizeName(golfer.name);
      const data = scoreMap[normalized];

      if (data) {
        matched++;
        const hasChanged =
          golfer.score_to_par !== data.score_to_par ||
          golfer.round_1 !== data.round_1 ||
          golfer.round_2 !== data.round_2 ||
          golfer.round_3 !== data.round_3 ||
          golfer.round_4 !== data.round_4 ||
          golfer.status !== data.status ||
          golfer.position !== data.position ||
          golfer.thru !== data.thru;

        if (hasChanged) {
          const updateData = { ...data };
          // Only include actual_scores if we have them
          if (!updateData.actual_scores || updateData.actual_scores.length === 0) {
            delete updateData.actual_scores;
          }
          await base44.asServiceRole.entities.Golfer.update(golfer.id, updateData);
          updated++;
        }
      }
    }

    console.log(`Source: ${source} | Matched: ${matched} | Updated: ${updated}`);

    return Response.json({
      source,
      tournament: tournamentName,
      feed_players: Object.keys(scoreMap).length,
      pool_golfers: golfers.length,
      matched,
      updated,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Score fetch error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});