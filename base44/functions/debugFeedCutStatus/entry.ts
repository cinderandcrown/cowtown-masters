import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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

  // Collect all unique status values and newStatus values
  const statusValues = new Set();
  const newStatusValues = new Set();
  
  // Find players who seem to have missed the cut (high score, no R3 tee time, etc.)
  const cutIndicators = [];

  for (const p of players) {
    statusValues.add(p.status);
    newStatusValues.add(p.newStatus);
    
    const topar = parseInt(p.topar, 10);
    const hasR3TeaTime = p.round3?.teetime && p.round3.teetime !== '';
    const r3Status = p.round3?.roundStatus;
    
    // Show players with +5 or higher (likely cut at +4)
    if (!isNaN(topar) && topar >= 5) {
      cutIndicators.push({
        name: p.full_name,
        topar: p.topar,
        status: p.status,
        newStatus: p.newStatus,
        active: p.active,
        pos: p.pos,
        r3_teetime: p.round3?.teetime || 'none',
        r3_roundStatus: r3Status,
        r3_prior: p.round3?.prior,
        start: p.start,
        thru: p.thru,
        thruHistory: p.thruHistory,
      });
    }
  }

  return Response.json({
    total_players: players.length,
    unique_status_values: [...statusValues],
    unique_newStatus_values: [...newStatusValues],
    likely_cut_players: cutIndicators.slice(0, 20),
    statusRound: mastersData?.data?.statusRound,
    currentRound: mastersData?.data?.currentRound,
  });
});