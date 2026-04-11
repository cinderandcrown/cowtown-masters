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

  // Find players with status "N" who have NO R3 tee time (possible cut that feed didn't flag)
  const suspiciousCut = [];
  const statusNWithR3 = [];
  
  for (const p of players) {
    const hasR3Tee = p.round3?.teetime && p.round3.teetime.trim() !== '';
    const r3Status = p.round3?.roundStatus;
    
    if (p.status === 'N' && !hasR3Tee && r3Status === 'Pre') {
      suspiciousCut.push({
        name: p.full_name,
        topar: p.topar,
        pos: p.pos,
        status: p.status,
        newStatus: p.newStatus,
        r3_teetime: p.round3?.teetime || 'none',
        r3_roundStatus: r3Status,
        start: p.start,
      });
    }
  }

  // Also check: pool golfers marked active who are NOT in the feed at all
  const pools = await base44.asServiceRole.entities.Pool.filter({});
  const pool = pools.find(p => p.status === 'live') || pools[0];
  const golfers = await base44.asServiceRole.entities.Golfer.filter({ pool_id: pool.id, status: 'active' });
  
  const feedNames = new Set(players.map(p => normalizeName(p.full_name)));
  const unmatchedActive = golfers
    .filter(g => !feedNames.has(normalizeName(g.name)) && g.round_1 != null)
    .map(g => ({ name: g.name, score: g.score_to_par, round_1: g.round_1, round_2: g.round_2 }));

  return Response.json({
    suspicious_not_cut: suspiciousCut,
    active_not_in_feed: unmatchedActive,
  });
});