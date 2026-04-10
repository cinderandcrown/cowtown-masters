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

// Map of common nickname/alias → canonical feed name
// Normalized (no accents, lowercase) pool name → normalized feed name
const NAME_ALIASES = {
  'nico echavarria': 'nicolas echavarria',
  'sam stevens': 'samuel stevens',
  'johnny keefer': 'john keefer',
};

function normalizeName(name) {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z\s]/g, '')
    .toLowerCase()
    .trim();
  return NAME_ALIASES[base] || base;
}

// Parse Masters.com feed format
// The feed returns { data: { player: { ... } } } with player objects keyed by ID
// Each player has: first_name, last_name, status, today, thru, topar, 
// round1, round2, round3, round4 (scores), etc.
function parseMastersFeed(feedData) {
  const players = feedData?.data?.player || feedData?.data?.players || {};
  const pars = feedData?.data?.pars || {};
  const scoreMap = {};

  // Masters feed can be an object keyed by player ID or an array
  const playerList = Array.isArray(players) ? players : Object.values(players);

  // Build par totals per round for calculating round score-to-par from hole-by-hole scores
  const roundPars = {};
  for (const rKey of ['round1', 'round2', 'round3', 'round4']) {
    const parArr = pars[rKey];
    if (Array.isArray(parArr) && parArr.length > 0) {
      roundPars[rKey] = parArr; // array of par per hole
    }
  }

  for (const p of playerList) {
    const firstName = p.first_name || p.firstName || '';
    const lastName = p.last_name || p.lastName || '';
    const displayName = p.full_name || p.fullName || `${firstName} ${lastName}`;
    const normalized = normalizeName(displayName);

    if (!normalized) continue;

    // Parse round data from the nested round objects
    // Masters.com format: round1: { fantasy: -3, total: 69, scores: [4,3,4,...], roundStatus: "Finished" }
    // fantasy = round score to par, total = round strokes
    const roundKeys = ['round1', 'round2', 'round3', 'round4'];
    const roundsToPar = [];
    const actualScores = [];

    for (const rKey of roundKeys) {
      const roundObj = p[rKey];
      if (roundObj && typeof roundObj === 'object') {
        const isFinished = roundObj.roundStatus === 'Finished';
        const isPre = roundObj.roundStatus === 'Pre' || roundObj.roundStatus === 'Not Started';
        const hasScores = Array.isArray(roundObj.scores) && roundObj.scores.some(s => s != null && s > 0);
        
        // Skip rounds that haven't started yet
        if (isPre || (!isFinished && !hasScores && roundObj.fantasy == null)) {
          roundsToPar.push(null);
        } else if (isFinished && roundObj.fantasy != null) {
          // Finished round — use fantasy (score to par) directly
          roundsToPar.push(parseScoreToPar(roundObj.fantasy));
        } else if (hasScores && roundPars[rKey]) {
          // In-progress round — calculate score to par from hole-by-hole scores vs par
          const scores = roundObj.scores;
          const parHoles = roundPars[rKey];
          let rScore = 0;
          let holesPlayed = 0;
          for (let h = 0; h < scores.length; h++) {
            if (scores[h] != null && parHoles[h] != null) {
              rScore += scores[h] - parHoles[h];
              holesPlayed++;
            }
          }
          roundsToPar.push(holesPlayed > 0 ? rScore : null);
        } else if (roundObj.fantasy != null && parseScoreToPar(roundObj.fantasy) !== 0) {
          // Round has a non-zero fantasy score — use it
          roundsToPar.push(parseScoreToPar(roundObj.fantasy));
        } else {
          roundsToPar.push(null);
        }

        // Actual strokes for the round — only for played rounds
        if (!isPre && roundObj.total != null && Number(roundObj.total) > 0) {
          actualScores.push(Number(roundObj.total));
        } else if (isFinished && hasScores) {
          const sum = roundObj.scores.filter(s => s != null).reduce((a, b) => a + b, 0);
          if (sum > 0) actualScores.push(sum);
        }
      } else {
        // Fallback: flat field (unlikely in masters.com feed but safe)
        roundsToPar.push(parseScoreToPar(roundObj));
      }
    }

    // Total score to par — use topar field from feed as primary
    const topar = parseScoreToPar(p.topar || p.to_par || p.total);

    // Status mapping
    let status = 'active';
    const pStatus = (p.status || '').toUpperCase();
    // Masters.com status: 'F' = finished, 'A' = active/playing, 'C' = cut, 'W' = withdrawn
    if (pStatus === 'C' || pStatus === 'CUT' || pStatus === 'MC') status = 'cut';
    else if (pStatus === 'W' || pStatus === 'WD' || pStatus === 'WITHDRAWN') status = 'withdrawn';
    else if (pStatus === 'DQ' || pStatus === 'DISQUALIFIED') status = 'disqualified';

    // Position
    const position = p.pos || p.position || p.place || null;

    // Thru
    const thru = p.thru || p.today_thru || null;

    // Calculate cumulative score only from rounds actually played
    const playedRounds = roundsToPar.filter(r => r != null);
    const calculatedTotal = playedRounds.length > 0 ? playedRounds.reduce((a, b) => a + b, 0) : null;

    scoreMap[normalized] = {
      score_to_par: topar ?? calculatedTotal ?? 0,
      round_1: roundsToPar[0] ?? null,
      round_2: roundsToPar[1] ?? null,
      round_3: roundsToPar[2] ?? null,
      round_4: roundsToPar[3] ?? null,
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
    // 2026 Masters Round 1 tees off Thursday April 9, ~8am ET (12:00 UTC)
    const MASTERS_START = new Date('2026-04-09T12:00:00Z');
    // Parse force flag from request body (may be nested under SDK wrapper)
    let force = false;
    try {
      const rawBody = await req.text();
      if (rawBody) {
        const parsed = JSON.parse(rawBody);
        force = parsed?.force === true || parsed?.data?.force === true;
      }
    } catch (_) { /* no body or not JSON */ }
    // Also check URL param as fallback
    const url = new URL(req.url);
    if (url.searchParams.get('force') === 'true') force = true;

    if (!force && new Date() < MASTERS_START) {
      return Response.json({
        message: 'Pre-tournament: scoring starts April 9. Use force=true to override.',
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
    const unmatchedGolfers = [];

    for (const golfer of golfers) {
      const normalized = normalizeName(golfer.name);
      const data = scoreMap[normalized];

      if (!data) {
        unmatchedGolfers.push({ name: golfer.name, normalized });
      }

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

    // Auto-recalculate entry scores after golfer updates
    let entriesUpdated = 0;
    if (updated > 0) {
      const entries = await base44.asServiceRole.entities.PoolEntry.filter({ pool_id: poolId });
      const golferMap = {};
      const allGolfers = await base44.asServiceRole.entities.Golfer.filter({ pool_id: poolId });
      for (const g of allGolfers) golferMap[g.id] = g;

      for (const entry of entries) {
        const gA = golferMap[entry.golfer_a_id];
        const gB = golferMap[entry.golfer_b_id];
        if (!gA && !gB) continue;
        const scoreA = gA?.score_to_par ?? 0;
        const scoreB = gB?.score_to_par ?? 0;
        const total = scoreA + scoreB;
        if (entry.score_a !== scoreA || entry.score_b !== scoreB || entry.total_score !== total) {
          await base44.asServiceRole.entities.PoolEntry.update(entry.id, {
            score_a: scoreA, score_b: scoreB, total_score: total,
          });
          entriesUpdated++;
        }
      }
      console.log(`Recalculated ${entriesUpdated} entries`);
    }

    return Response.json({
      source,
      tournament: tournamentName,
      feed_players: Object.keys(scoreMap).length,
      pool_golfers: golfers.length,
      matched,
      updated,
      entries_updated: entriesUpdated,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Score fetch error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});