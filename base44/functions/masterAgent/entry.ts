import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const MASTERS_FEED_URL = 'https://www.masters.com/en_US/scores/feeds/2026/scores.json';
const ESPN_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard';

const PHASE_CONFIG = {
  idle:            { polling: null,  label: 'Idle' },
  pre_tournament:  { polling: 300,   label: 'Pre-Tournament' },
  live_round:      { polling: 60,    label: 'Live Round' },
  between_rounds:  { polling: 600,   label: 'Between Rounds' },
  cut_day:         { polling: 120,   label: 'Cut Day' },
  final_round:     { polling: 30,    label: 'Final Round' },
  post_tournament: { polling: null,  label: 'Post-Tournament' },
};

function normalizeName(name) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z\s]/g, '').toLowerCase().trim();
}

function parseScoreToPar(val) {
  if (val === 'E' || val === 0 || val === '0') return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') { const n = parseInt(val, 10); return isNaN(n) ? null : n; }
  return null;
}

async function detectPhase(espnData) {
  const events = espnData?.events || [];
  const mastersEvent = events.find(e =>
    e.name?.toLowerCase().includes('masters') || e.shortName?.toLowerCase().includes('masters')
  ) || events[0];

  if (!mastersEvent) return { phase: 'idle', event: null, detail: 'No tournament found on ESPN' };

  const competition = mastersEvent.competitions?.[0];
  const status = competition?.status || {};
  const statusType = status?.type?.name || '';
  const statusState = status?.type?.state || '';
  const round = competition?.status?.period || 0;

  let phase = 'idle';

  if (statusState === 'pre') {
    phase = 'pre_tournament';
  } else if (statusState === 'in') {
    if (round === 4) {
      phase = 'final_round';
    } else if (round === 2) {
      phase = 'cut_day';
    } else {
      phase = 'live_round';
    }
  } else if (statusState === 'post') {
    phase = 'post_tournament';
  } else if (statusType === 'STATUS_SCHEDULED') {
    phase = 'pre_tournament';
  } else if (statusType === 'STATUS_PLAY_COMPLETE' || statusType === 'STATUS_DELAYED') {
    phase = 'between_rounds';
  } else if (statusType === 'STATUS_FINAL') {
    phase = 'post_tournament';
  }

  return {
    phase,
    event: mastersEvent.name || 'Unknown',
    round,
    statusType,
    statusState,
    competitors: competition?.competitors?.length || 0,
    detail: `${mastersEvent.name} — Round ${round} — ${statusState || statusType}`,
  };
}

async function fetchAndUpdateScores(base44, poolId) {
  // Delegate to the unified fetchMastersScores function (Masters.com primary + ESPN fallback)
  const result = await base44.asServiceRole.functions.invoke('fetchMastersScores', {});
  return result?.data || { matched: 0, updated: 0, source: 'unknown' };
}

async function log(base44, poolId, action, detail, severity = 'info', metadata = null) {
  await base44.asServiceRole.entities.AgentLog.create({
    pool_id: poolId, action, detail, severity,
    ...(metadata ? { metadata } : {}),
  });
}

async function getPoolStats(base44, poolId) {
  const golfers = await base44.asServiceRole.entities.Golfer.filter({ pool_id: poolId });
  const entries = await base44.asServiceRole.entities.PoolEntry.filter({ pool_id: poolId });
  const totalGolfers = golfers.length;
  const scoredGolfers = golfers.filter(g => g.score_to_par != null && g.score_to_par !== 0 || g.round_1 != null).length;
  const activeGolfers = golfers.filter(g => g.status === 'active').length;
  const cutGolfers = golfers.filter(g => g.status === 'cut').length;
  const wdGolfers = golfers.filter(g => g.status === 'withdrawn' || g.status === 'disqualified').length;
  return { totalGolfers, scoredGolfers, activeGolfers, cutGolfers, wdGolfers, totalEntries: entries.length, entries, golfers };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const pools = await base44.asServiceRole.entities.Pool.filter({});
    const pool = pools[0];
    if (!pool) return Response.json({ error: 'No pool found' }, { status: 404 });
    const poolId = pool.id;

    // GET = status dashboard
    if (req.method === 'GET') {
      let espnData = null;
      let phaseInfo = { phase: 'idle', detail: 'ESPN not checked yet' };
      try {
        const espnRes = await fetch(ESPN_SCOREBOARD_URL);
        if (espnRes.ok) {
          espnData = await espnRes.json();
          phaseInfo = await detectPhase(espnData);
        }
      } catch (e) {
        phaseInfo = { phase: 'idle', detail: 'ESPN unreachable: ' + e.message };
      }

      const stats = await getPoolStats(base44, poolId);

      return Response.json({
        pool: { id: pool.id, name: pool.name, status: pool.status, year: pool.year },
        phase: phaseInfo.phase,
        phaseLabel: PHASE_CONFIG[phaseInfo.phase]?.label || phaseInfo.phase,
        phaseDetail: phaseInfo.detail,
        pollingInterval: PHASE_CONFIG[phaseInfo.phase]?.polling,
        phaseConfig: PHASE_CONFIG,
        stats: {
          totalGolfers: stats.totalGolfers,
          scoredGolfers: stats.scoredGolfers,
          activeGolfers: stats.activeGolfers,
          cutGolfers: stats.cutGolfers,
          wdGolfers: stats.wdGolfers,
          totalEntries: stats.totalEntries,
        },
        espnConnected: !!espnData,
      });
    }

    // POST = actions
    const body = await req.json();
    const action = body.action;

    if (action === 'status') {
      let espnOk = false;
      let phaseInfo = { phase: 'idle' };
      try {
        const res = await fetch(ESPN_SCOREBOARD_URL);
        espnOk = res.ok;
        if (espnOk) phaseInfo = await detectPhase(await res.json());
      } catch (_) { /* */ }

      const stats = await getPoolStats(base44, poolId);
      const logs = await base44.asServiceRole.entities.AgentLog.filter({ pool_id: poolId });
      const recentLogs = logs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 10);

      await log(base44, poolId, 'summary', 'Status report requested', 'info');

      return Response.json({
        pool: { id: pool.id, name: pool.name, status: pool.status },
        phase: phaseInfo.phase,
        phaseLabel: PHASE_CONFIG[phaseInfo.phase]?.label,
        pollingInterval: PHASE_CONFIG[phaseInfo.phase]?.polling,
        espnConnected: espnOk,
        stats: {
          totalGolfers: stats.totalGolfers,
          scoredGolfers: stats.scoredGolfers,
          activeGolfers: stats.activeGolfers,
          cutGolfers: stats.cutGolfers,
          wdGolfers: stats.wdGolfers,
          totalEntries: stats.totalEntries,
        },
        recentLogs,
      });
    }

    if (action === 'start') {
      await base44.asServiceRole.entities.Pool.update(poolId, { status: 'live' });
      const result = await fetchAndUpdateScores(base44, poolId);
      await base44.asServiceRole.entities.Notification.create({
        pool_id: poolId, type: 'leaderboard_change',
        title: '🟢 Tournament Agent Started',
        message: `Live scoring is now active. Matched ${result.matched} golfers from ESPN.`,
      });
      await log(base44, poolId, 'start', `Agent started. Pool set to live. Matched ${result.matched} golfers, updated ${result.updated}.`, 'info', result);
      return Response.json({ success: true, message: 'Agent started', scoreResult: result });
    }

    if (action === 'stop') {
      await base44.asServiceRole.entities.Pool.update(poolId, { status: 'setup' });
      await base44.asServiceRole.entities.Notification.create({
        pool_id: poolId, type: 'leaderboard_change',
        title: '🔴 Tournament Agent Stopped',
        message: 'Live scoring has been paused by the pool admin.',
      });
      await log(base44, poolId, 'stop', 'Agent stopped by admin. Pool status reset to setup.', 'warn');
      return Response.json({ success: true, message: 'Agent stopped, pool reset to setup' });
    }

    if (action === 'pollNow') {
      const result = await fetchAndUpdateScores(base44, poolId);
      await log(base44, poolId, 'pollNow', `Manual poll: matched ${result.matched}, updated ${result.updated}.`, 'info', result);
      return Response.json({ success: true, ...result });
    }

    if (action === 'diagnose') {
      const stats = await getPoolStats(base44, poolId);
      const checks = [];

      // Pool check
      checks.push({ name: 'Pool Entity', status: 'ok', detail: `${pool.name} — status: ${pool.status}` });

      // Golfer check
      checks.push({
        name: 'Golfer Records',
        status: stats.totalGolfers > 0 ? 'ok' : 'warn',
        detail: `${stats.totalGolfers} total, ${stats.scoredGolfers} scored, ${stats.cutGolfers} cut, ${stats.wdGolfers} WD/DQ`,
      });

      // ESPN check
      let espnStatus = 'error';
      let espnDetail = 'Failed to connect';
      try {
        const res = await fetch(ESPN_SCOREBOARD_URL);
        if (res.ok) {
          const data = await res.json();
          const phaseInfo = await detectPhase(data);
          espnStatus = 'ok';
          espnDetail = `Connected. ${phaseInfo.detail}`;
        } else {
          espnDetail = `HTTP ${res.status}`;
        }
      } catch (e) { espnDetail = e.message; }
      checks.push({ name: 'ESPN API', status: espnStatus, detail: espnDetail });

      // Entries check
      checks.push({
        name: 'Pool Entries',
        status: stats.totalEntries > 0 ? 'ok' : 'warn',
        detail: `${stats.totalEntries} participants`,
      });

      // Name matching check
      if (stats.totalGolfers > 0 && espnStatus === 'ok') {
        try {
          const espnRes = await fetch(ESPN_SCOREBOARD_URL);
          const espnData = await espnRes.json();
          const event = (espnData.events || []).find(e => e.name?.toLowerCase().includes('masters')) || (espnData.events || [])[0];
          const competitors = event?.competitions?.[0]?.competitors || [];
          const espnNames = new Set(competitors.map(c => normalizeName(c.athlete?.displayName || '')));
          const poolNames = stats.golfers.map(g => normalizeName(g.name));
          const matchedNames = poolNames.filter(n => espnNames.has(n));
          checks.push({
            name: 'Name Matching',
            status: matchedNames.length > poolNames.length * 0.7 ? 'ok' : 'warn',
            detail: `${matchedNames.length}/${poolNames.length} pool golfers matched to ESPN (${competitors.length} ESPN competitors)`,
          });
        } catch (_) {
          checks.push({ name: 'Name Matching', status: 'error', detail: 'Could not verify' });
        }
      }

      await log(base44, poolId, 'diagnose', `Diagnostics run: ${checks.filter(c => c.status === 'ok').length}/${checks.length} passed`, 'info', { checks });
      return Response.json({ success: true, checks });
    }

    if (action === 'summary') {
      const stats = await getPoolStats(base44, poolId);
      const entries = stats.entries;
      const golfers = stats.golfers;

      const golferMap = {};
      for (const g of golfers) golferMap[g.id] = g;

      const standings = entries.map(e => {
        const gA = golferMap[e.golfer_a_id];
        const gB = golferMap[e.golfer_b_id];
        const scoreA = gA?.score_to_par ?? 0;
        const scoreB = gB?.score_to_par ?? 0;
        const total = scoreA + scoreB;
        return {
          name: e.team_name || e.participant_name,
          golferA: gA?.name || '—',
          golferB: gB?.name || '—',
          scoreA, scoreB, total,
        };
      }).sort((a, b) => a.total - b.total);

      const lines = [`🏆 ${pool.name} — Leaderboard`, ''];
      standings.forEach((s, i) => {
        const score = s.total === 0 ? 'E' : (s.total > 0 ? '+' + s.total : s.total);
        lines.push(`${i + 1}. ${s.name} (${score}) — ${s.golferA} + ${s.golferB}`);
      });
      lines.push('');
      lines.push(`📊 ${stats.totalGolfers} golfers | ${stats.activeGolfers} active | ${stats.cutGolfers} cut`);

      const summaryText = lines.join('\n');
      await log(base44, poolId, 'summary', 'Leaderboard summary generated', 'info');
      return Response.json({ success: true, summary: summaryText, standings });
    }

    if (action === 'setPhase') {
      const newPhase = body.phase;
      if (!PHASE_CONFIG[newPhase]) {
        return Response.json({ error: 'Invalid phase: ' + newPhase }, { status: 400 });
      }
      await log(base44, poolId, 'phaseChange', `Manual phase override to: ${newPhase}`, 'warn', { phase: newPhase });
      return Response.json({ success: true, phase: newPhase, config: PHASE_CONFIG[newPhase] });
    }

    return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });

  } catch (error) {
    console.error('masterAgent error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});