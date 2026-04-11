import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const MASTERS_FEED_URL = 'https://www.masters.com/en_US/scores/feeds/2026/scores.json';
  const mastersRes = await fetch(MASTERS_FEED_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
  });
  const mastersData = await mastersRes.json();
  const players = mastersData?.data?.player || [];

  // Build feed map
  const feedCutPlayers = {};
  for (const p of players) {
    if (p.status === 'C') {
      feedCutPlayers[normalizeName(p.full_name)] = {
        name: p.full_name,
        topar: p.topar,
        status: p.status,
        newStatus: p.newStatus,
      };
    }
  }

  // Check pool golfers
  const pools = await base44.asServiceRole.entities.Pool.filter({});
  const pool = pools.find(p => p.status === 'live' || p.status === 'complete') || pools[0];
  const golfers = await base44.asServiceRole.entities.Golfer.filter({ pool_id: pool.id });

  const mismatches = [];
  const correctlyCut = [];
  const notInFeed = [];

  for (const g of golfers) {
    const normalized = normalizeName(g.name);
    const feedData = feedCutPlayers[normalized];

    if (feedData && g.status !== 'cut') {
      mismatches.push({
        pool_name: g.name,
        pool_status: g.status,
        feed_status: 'C',
        feed_topar: feedData.topar,
        is_drafted: g.is_drafted,
        drafted_by: g.drafted_by,
      });
    } else if (feedData && g.status === 'cut') {
      correctlyCut.push({ name: g.name });
    }
  }

  return Response.json({
    feed_cut_count: Object.keys(feedCutPlayers).length,
    pool_golfers: golfers.length,
    mismatches_count: mismatches.length,
    mismatches,
    correctly_cut: correctlyCut.length,
    feed_cut_names: Object.values(feedCutPlayers).map(p => p.name),
  });
});