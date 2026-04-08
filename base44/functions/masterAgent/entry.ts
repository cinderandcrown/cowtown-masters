import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Master Agent — Central scoring controller for Cowtown Masters.
 * 
 * Actions (POST body { action, ... }):
 *   status      — Dashboard status (phase, stats, feed connectivity)
 *   pollNow     — Manually fetch & update scores from Masters.com/ESPN
 *   recalculate — Recalculate all entry totals from current golfer scores
 *   start       — Set pool to "live" + run first poll + recalc
 *   stop        — Set pool back to "setup"
 *   diagnose    — Run full system health check
 *   summary     — Generate text leaderboard for sharing
 *   resetScores — Zero out all golfer scores (pre-tournament reset)
 */

const ESPN_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard';

function normalizeName(name) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z\s]/g, '').toLowerCase().trim();
}

function formatScore(s) {
  if (s == null) return '—';
  return s === 0 ? 'E' : s > 0 ? `+${s}` : `${s}`;
}

// Detect tournament phase from ESPN data
function detectPhase(espnData) {
  const events = espnData?.events || [];
  const mastersEvent = events.find(e =>
    e.name?.toLowerCase().includes('masters') || e.shortName?.toLowerCase().includes('masters')
  );
  if (!mastersEvent) return { phase: 'no_tournament', detail: 'No Masters event on ESPN scoreboard' };

  const competition = mastersEvent.competitions?.[0];
  const status = competition?.status || {};
  const state = status?.type?.state || '';
  const typeName = status?.type?.name || '';
  const round = competition?.status?.period || 0;

  let phase = 'idle';
  if (state === 'pre' || typeName === 'STATUS_SCHEDULED') phase = 'pre_tournament';
  else if (state === 'in') {
    if (round === 4) phase = 'final_round';
    else if (round === 2) phase = 'cut_day';
    else phase = 'live_round';
  } else if (typeName === 'STATUS_PLAY_COMPLETE' || typeName === 'STATUS_DELAYED') phase = 'between_rounds';
  else if (state === 'post' || typeName === 'STATUS_FINAL') phase = 'post_tournament';

  return {
    phase,
    round,
    state,
    typeName,
    competitors: competition?.competitors?.length || 0,
    detail: `Round ${round} — ${state || typeName}`,
    eventName: mastersEvent.name,
  };
}

const PHASE_LABELS = {
  idle: 'Idle',
  no_tournament: 'No Tournament Found',
  pre_tournament: 'Pre-Tournament',
  live_round: 'Live Round',
  between_rounds: 'Between Rounds',
  cut_day: 'Cut Day (Friday)',
  final_round: 'Final Round (Sunday)',
  post_tournament: 'Tournament Complete',
};

// Recalculate all entry scores from golfer data
async function recalculateEntries(base44, poolId) {
  const golfers = await base44.asServiceRole.entities.Golfer.filter({ pool_id: poolId });
  const entries = await base44.asServiceRole.entities.PoolEntry.filter({ pool_id: poolId });
  const golferMap = {};
  for (const g of golfers) golferMap[g.id] = g;

  let updated = 0;
  for (const entry of entries) {
    const gA = golferMap[entry.golfer_a_id];
    const gB = golferMap[entry.golfer_b_id];
    if (!gA && !gB) continue;

    const scoreA = gA?.score_to_par ?? 0;
    const scoreB = gB?.score_to_par ?? 0;
    const total = scoreA + scoreB;

    if (entry.score_a !== scoreA || entry.score_b !== scoreB || entry.total_score !== total) {
      await base44.asServiceRole.entities.PoolEntry.update(entry.id, {
        score_a: scoreA,
        score_b: scoreB,
        total_score: total,
      });
      updated++;
    }
  }

  // Assign ranks
  const refreshed = await base44.asServiceRole.entities.PoolEntry.filter({ pool_id: poolId });
  const sorted = refreshed
    .filter(e => e.golfer_a_id && e.golfer_b_id)
    .sort((a, b) => (a.total_score ?? 999) - (b.total_score ?? 999));

  for (let i = 0; i < sorted.length; i++) {
    const rank = i === 0 ? 1 : (sorted[i].total_score === sorted[i - 1].total_score ? sorted[i - 1].rank : i + 1);
    if (sorted[i].rank !== rank) {
      await base44.asServiceRole.entities.PoolEntry.update(sorted[i].id, { rank });
    }
  }

  return { entriesUpdated: updated, totalEntries: entries.length };
}

async function getPoolStats(base44, poolId) {
  const golfers = await base44.asServiceRole.entities.Golfer.filter({ pool_id: poolId });
  const entries = await base44.asServiceRole.entities.PoolEntry.filter({ pool_id: poolId });
  const active = golfers.filter(g => g.status === 'active');
  const cut = golfers.filter(g => g.status === 'cut');
  const wd = golfers.filter(g => g.status === 'withdrawn' || g.status === 'disqualified');
  const scored = golfers.filter(g => g.round_1 != null);
  const drafted = entries.filter(e => e.golfer_a_id && e.golfer_b_id);

  return {
    totalGolfers: golfers.length,
    activeGolfers: active.length,
    scoredGolfers: scored.length,
    cutGolfers: cut.length,
    wdGolfers: wd.length,
    totalEntries: entries.length,
    draftedEntries: drafted.length,
    golfers,
    entries,
  };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // Auth: require platform admin OR pool admin (participant)
    const user = await base44.auth.me();
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'status';

    const pools = await base44.asServiceRole.entities.Pool.filter({});
    const pool = pools[0];
    if (!pool) return Response.json({ error: 'No pool found' }, { status: 404 });
    const poolId = pool.id;

    // Allow access if: platform admin, pool admin_user_id matches user email, or participant_email matches pool admin
    const isPlatformAdmin = user?.role === 'admin';
    const isPoolAdminByEmail = user?.email && (user.email === pool.admin_user_id || user.email === pool.created_by);
    const participantEmail = body.participant_email?.toLowerCase?.();
    const isPoolAdminByParticipant = participantEmail && (participantEmail === pool.admin_user_id?.toLowerCase?.() || participantEmail === pool.created_by?.toLowerCase?.());

    if (!isPlatformAdmin && !isPoolAdminByEmail && !isPoolAdminByParticipant) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // ─── STATUS ─────────────────────────────────────────
    if (action === 'status') {
      let phaseInfo = { phase: 'idle', detail: 'ESPN not checked' };
      let espnOk = false;
      try {
        const res = await fetch(ESPN_SCOREBOARD_URL);
        if (res.ok) {
          espnOk = true;
          phaseInfo = detectPhase(await res.json());
        }
      } catch (_) { /* ESPN down */ }

      const stats = await getPoolStats(base44, poolId);

      return Response.json({
        pool: { id: pool.id, name: pool.name, status: pool.status, year: pool.year },
        phase: phaseInfo.phase,
        phaseLabel: PHASE_LABELS[phaseInfo.phase] || phaseInfo.phase,
        phaseDetail: phaseInfo.detail,
        round: phaseInfo.round || null,
        espnConnected: espnOk,
        stats: {
          totalGolfers: stats.totalGolfers,
          activeGolfers: stats.activeGolfers,
          scoredGolfers: stats.scoredGolfers,
          cutGolfers: stats.cutGolfers,
          wdGolfers: stats.wdGolfers,
          totalEntries: stats.totalEntries,
          draftedEntries: stats.draftedEntries,
        },
      });
    }

    // ─── POLL NOW ───────────────────────────────────────
    if (action === 'pollNow') {
      const result = await base44.asServiceRole.functions.invoke('fetchMastersScores', { force: true });
      const scoreData = result?.data || {};

      // Auto-recalc entries after score update
      const recalc = await recalculateEntries(base44, poolId);

      return Response.json({
        success: true,
        source: scoreData.source,
        matched: scoreData.matched,
        updated: scoreData.updated,
        feedPlayers: scoreData.feed_players,
        entriesRecalculated: recalc.entriesUpdated,
        message: scoreData.message || null,
      });
    }

    // ─── RECALCULATE ENTRIES ────────────────────────────
    if (action === 'recalculate') {
      const result = await recalculateEntries(base44, poolId);
      return Response.json({
        success: true,
        ...result,
      });
    }

    // ─── START (go live) ────────────────────────────────
    if (action === 'start') {
      await base44.asServiceRole.entities.Pool.update(poolId, { status: 'live' });

      // Run initial score poll (force=true bypasses date gate for pre-tournament testing)
      const pollResult = await base44.asServiceRole.functions.invoke('fetchMastersScores', { force: true });
      const scoreData = pollResult?.data || {};

      // Recalc entries
      const recalc = await recalculateEntries(base44, poolId);

      // Notify
      await base44.asServiceRole.entities.Notification.create({
        pool_id: poolId,
        type: 'leaderboard_change',
        title: '🟢 Tournament Live!',
        message: `Live scoring activated. Matched ${scoreData.matched || 0} golfers.`,
        read_by: [],
      });

      return Response.json({
        success: true,
        message: 'Pool is now LIVE',
        scoreResult: scoreData,
        entriesRecalculated: recalc.entriesUpdated,
      });
    }

    // ─── STOP ───────────────────────────────────────────
    if (action === 'stop') {
      // If entries are drafted, go back to 'draft' not 'setup'
      const stopEntries = await base44.asServiceRole.entities.PoolEntry.filter({ pool_id: poolId });
      const hasDrafted = stopEntries.some(e => e.golfer_a_id && e.golfer_b_id);
      const newStatus = hasDrafted ? 'draft' : 'setup';
      await base44.asServiceRole.entities.Pool.update(poolId, { status: newStatus });
      await base44.asServiceRole.entities.Notification.create({
        pool_id: poolId,
        type: 'leaderboard_change',
        title: '🔴 Scoring Paused',
        message: 'Live scoring has been paused by the admin.',
        read_by: [],
      });
      return Response.json({ success: true, message: 'Pool paused (status: setup)' });
    }

    // ─── DIAGNOSE ───────────────────────────────────────
    if (action === 'diagnose') {
      const stats = await getPoolStats(base44, poolId);
      const checks = [];

      // Pool
      checks.push({ name: 'Pool', status: 'ok', detail: `${pool.name} — status: ${pool.status}` });

      // Golfers
      checks.push({
        name: 'Golfers',
        status: stats.totalGolfers > 0 ? 'ok' : 'error',
        detail: `${stats.totalGolfers} total (${stats.activeGolfers} active, ${stats.cutGolfers} cut, ${stats.wdGolfers} WD)`,
      });

      // Entries
      checks.push({
        name: 'Entries',
        status: stats.draftedEntries > 0 ? 'ok' : stats.totalEntries > 0 ? 'warn' : 'error',
        detail: `${stats.totalEntries} participants, ${stats.draftedEntries} with golfers assigned`,
      });

      // Score data
      checks.push({
        name: 'Score Data',
        status: stats.scoredGolfers > 0 ? 'ok' : 'warn',
        detail: `${stats.scoredGolfers} golfers have round data`,
      });

      // ESPN connectivity
      let espnDetail = 'Not checked';
      let espnStatus = 'warn';
      try {
        const res = await fetch(ESPN_SCOREBOARD_URL);
        if (res.ok) {
          const data = await res.json();
          const phaseInfo = detectPhase(data);
          espnStatus = phaseInfo.phase === 'no_tournament' ? 'warn' : 'ok';
          espnDetail = phaseInfo.phase === 'no_tournament'
            ? 'Connected but no Masters event found'
            : `Connected — ${phaseInfo.eventName} ${phaseInfo.detail}`;
        } else {
          espnStatus = 'error';
          espnDetail = `HTTP ${res.status}`;
        }
      } catch (e) {
        espnStatus = 'error';
        espnDetail = 'Unreachable: ' + e.message;
      }
      checks.push({ name: 'ESPN Feed', status: espnStatus, detail: espnDetail });

      // Masters.com feed
      let mastersStatus = 'warn';
      let mastersDetail = 'Not checked';
      try {
        const res = await fetch('https://www.masters.com/en_US/scores/feeds/2026/scores.json', {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          const playerData = data?.data?.player || data?.data?.players || data?.data;
          const count = playerData ? Object.keys(playerData).length : 0;
          mastersStatus = count > 0 ? 'ok' : 'warn';
          mastersDetail = count > 0 ? `Connected — ${count} players` : 'Connected but no player data yet (pre-tournament)';
        } else {
          mastersStatus = 'error';
          mastersDetail = `HTTP ${res.status}`;
        }
      } catch (e) {
        mastersStatus = 'error';
        mastersDetail = 'Unreachable: ' + e.message;
      }
      checks.push({ name: 'Masters.com Feed', status: mastersStatus, detail: mastersDetail });

      // Name matching
      if (stats.totalGolfers > 0) {
        try {
          const espnRes = await fetch(ESPN_SCOREBOARD_URL);
          if (espnRes.ok) {
            const espnData = await espnRes.json();
            const event = (espnData.events || []).find(e => e.name?.toLowerCase().includes('masters')) || (espnData.events || [])[0];
            const competitors = event?.competitions?.[0]?.competitors || [];
            const espnNames = new Set(competitors.map(c => normalizeName(c.athlete?.displayName || '')));
            const poolActive = stats.golfers.filter(g => g.status === 'active');
            const matched = poolActive.filter(g => espnNames.has(normalizeName(g.name)));
            const unmatched = poolActive.filter(g => !espnNames.has(normalizeName(g.name))).map(g => g.name);
            checks.push({
              name: 'Name Matching',
              status: matched.length > poolActive.length * 0.7 ? 'ok' : 'warn',
              detail: `${matched.length}/${poolActive.length} active golfers match ESPN data${unmatched.length > 0 ? `. Unmatched: ${unmatched.slice(0, 5).join(', ')}${unmatched.length > 5 ? '...' : ''}` : ''}`,
            });
          }
        } catch (_) {
          checks.push({ name: 'Name Matching', status: 'warn', detail: 'Could not verify' });
        }
      }

      return Response.json({ success: true, checks });
    }

    // ─── SUMMARY ────────────────────────────────────────
    if (action === 'summary') {
      const stats = await getPoolStats(base44, poolId);
      const golferMap = {};
      for (const g of stats.golfers) golferMap[g.id] = g;

      const standings = stats.entries
        .filter(e => e.golfer_a_id && e.golfer_b_id)
        .map(e => {
          const gA = golferMap[e.golfer_a_id];
          const gB = golferMap[e.golfer_b_id];
          return {
            name: e.team_name || e.participant_name,
            golferA: gA?.name || '—',
            golferB: gB?.name || '—',
            scoreA: gA?.score_to_par ?? 0,
            scoreB: gB?.score_to_par ?? 0,
            total: (gA?.score_to_par ?? 0) + (gB?.score_to_par ?? 0),
          };
        })
        .sort((a, b) => a.total - b.total);

      const lines = [`🏆 ${pool.name} Leaderboard`, ''];
      standings.forEach((s, i) => {
        lines.push(`${i + 1}. ${s.name} (${formatScore(s.total)}) — ${s.golferA} [${formatScore(s.scoreA)}] + ${s.golferB} [${formatScore(s.scoreB)}]`);
      });
      lines.push('');
      lines.push(`📊 ${stats.totalGolfers} golfers | ${stats.activeGolfers} active | ${stats.cutGolfers} cut | ${stats.wdGolfers} WD`);
      lines.push(`👥 ${stats.totalEntries} entries | ${stats.draftedEntries} drafted`);

      return Response.json({ success: true, summary: lines.join('\n') });
    }

    // ─── RESET SCORES ───────────────────────────────────
    if (action === 'resetScores') {
      const stats = await getPoolStats(base44, poolId);
      let reset = 0;
      for (const g of stats.golfers) {
        if (g.round_1 != null || g.score_to_par !== 0 || g.status !== 'active') {
          await base44.asServiceRole.entities.Golfer.update(g.id, {
            score_to_par: 0,
            round_1: null,
            round_2: null,
            round_3: null,
            round_4: null,
            actual_scores: [],
            status: g.status === 'cut' || g.status === 'disqualified' ? 'active' : g.status,
            position: null,
            thru: null,
          });
          reset++;
        }
      }
      // Also reset entry scores
      const recalc = await recalculateEntries(base44, poolId);
      return Response.json({ success: true, golfersReset: reset, entriesReset: recalc.entriesUpdated });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });

  } catch (error) {
    console.error('masterAgent error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});