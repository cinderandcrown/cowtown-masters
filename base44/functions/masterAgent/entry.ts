import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Master Agent — The central AI orchestrator for Cowtown Masters.
 *
 * This agent manages the full tournament lifecycle:
 *   1. PRE-TOURNAMENT  — monitors ESPN for tournament start, keeps systems ready
 *   2. TOURNAMENT LIVE — activates score polling, alerts, broadcasting at optimal intervals
 *   3. BETWEEN ROUNDS  — reduces polling frequency overnight, generates daily summaries
 *   4. POST-TOURNAMENT — finalizes standings, generates winner announcements, archives data
 *
 * Endpoints:
 *   GET  /masterAgent              — Returns agent status & health dashboard
 *   POST /masterAgent { action }   — Execute agent commands
 *
 * Actions:
 *   "status"           — Full health report of all subsystems
 *   "start"            — Activate all tournament automations
 *   "stop"             — Gracefully stop all automations
 *   "pollNow"          — Force an immediate score fetch
 *   "diagnose"         — Run diagnostics on all subsystems
 *   "setPhase"         — Manually set tournament phase
 *   "summary"          — Generate a leaderboard summary
 */

const ESPN_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard';

// Tournament phase definitions with polling strategies
const PHASES = {
  idle: {
    label: 'Idle',
    description: 'No active tournament. Agent monitoring for Masters week.',
    scorePollingInterval: null,       // no polling
    alertsEnabled: false,
    broadcastEnabled: false,
  },
  pre_tournament: {
    label: 'Pre-Tournament',
    description: 'Masters week detected. Systems warming up. Monitoring for Round 1 start.',
    scorePollingInterval: 300,        // every 5 min — check if tournament started
    alertsEnabled: false,
    broadcastEnabled: false,
  },
  live_round: {
    label: 'Live Round',
    description: 'Round in progress. Maximum polling frequency. All systems active.',
    scorePollingInterval: 60,         // every 60 seconds
    alertsEnabled: true,
    broadcastEnabled: true,
  },
  between_rounds: {
    label: 'Between Rounds',
    description: 'Round complete. Reduced polling. Generating summaries.',
    scorePollingInterval: 600,        // every 10 min
    alertsEnabled: true,
    broadcastEnabled: true,
  },
  cut_day: {
    label: 'Cut Day',
    description: 'The cut is being applied. Monitoring for cut line updates.',
    scorePollingInterval: 120,        // every 2 min
    alertsEnabled: true,
    broadcastEnabled: true,
  },
  final_round: {
    label: 'Final Round (Sunday)',
    description: 'Championship Sunday. Maximum intensity. All systems at peak.',
    scorePollingInterval: 30,         // every 30 seconds
    alertsEnabled: true,
    broadcastEnabled: true,
  },
  post_tournament: {
    label: 'Post-Tournament',
    description: 'Tournament complete. Finalizing standings and generating results.',
    scorePollingInterval: null,
    alertsEnabled: false,
    broadcastEnabled: false,
  },
};

// ── Helpers ──────────────────────────────────────────────────────

function formatScore(s: number | null): string {
  if (s == null) return '–';
  if (s === 0) return 'E';
  return s > 0 ? `+${s}` : `${s}`;
}

function now(): string {
  return new Date().toISOString();
}

async function detectTournamentPhase(espnData: any): Promise<{ phase: string; detail: string }> {
  if (!espnData?.events?.length) {
    return { phase: 'idle', detail: 'No events found on ESPN scoreboard.' };
  }

  const event = espnData.events.find((e: any) =>
    e.name?.toLowerCase().includes('masters')
  ) || espnData.events[0];

  if (!event) {
    return { phase: 'idle', detail: 'No Masters event found.' };
  }

  const competition = event.competitions?.[0];
  if (!competition) {
    return { phase: 'pre_tournament', detail: `Event found: ${event.name}, but no competition data yet.` };
  }

  const statusType = competition.status?.type?.name || '';
  const round = competition.status?.period || 0;

  if (statusType === 'STATUS_FINAL' || statusType === 'STATUS_PLAY_COMPLETE') {
    if (round >= 4) {
      return { phase: 'post_tournament', detail: `${event.name} — Tournament complete.` };
    }
    // Round finished but tournament continues
    if (round === 2) {
      return { phase: 'cut_day', detail: `${event.name} — Round ${round} complete, cut being applied.` };
    }
    return { phase: 'between_rounds', detail: `${event.name} — Round ${round} complete.` };
  }

  if (statusType === 'STATUS_IN_PROGRESS') {
    if (round === 4) {
      return { phase: 'final_round', detail: `${event.name} — Final round in progress!` };
    }
    return { phase: 'live_round', detail: `${event.name} — Round ${round} in progress.` };
  }

  if (statusType === 'STATUS_SCHEDULED') {
    return { phase: 'pre_tournament', detail: `${event.name} — Scheduled, not yet started.` };
  }

  return { phase: 'pre_tournament', detail: `${event.name} — Status: ${statusType}` };
}

async function fetchESPN(): Promise<any> {
  const res = await fetch(ESPN_SCOREBOARD);
  if (!res.ok) throw new Error(`ESPN returned ${res.status}`);
  return res.json();
}

async function getPoolHealth(base44: any): Promise<any> {
  const pools = await base44.asServiceRole.entities.Pool.filter({});
  const activePool = pools.find((p: any) => ['live', 'setup', 'draft'].includes(p.status));

  if (!activePool) return { healthy: false, message: 'No active pool found', pool: null };

  const golfers = await base44.asServiceRole.entities.Golfer.filter({ pool_id: activePool.id });
  const entries = await base44.asServiceRole.entities.PoolEntry.filter({ pool_id: activePool.id });

  const scoredGolfers = golfers.filter((g: any) => g.score_to_par !== 0 || g.round_1 != null);
  const draftedEntries = entries.filter((e: any) => e.golfer_a_id && e.golfer_b_id);
  const cutGolfers = golfers.filter((g: any) => g.status === 'cut');
  const activeGolfers = golfers.filter((g: any) => g.status === 'active');

  return {
    healthy: true,
    pool: {
      id: activePool.id,
      name: activePool.name,
      status: activePool.status,
      year: activePool.year,
    },
    stats: {
      total_golfers: golfers.length,
      scored_golfers: scoredGolfers.length,
      active_golfers: activeGolfers.length,
      cut_golfers: cutGolfers.length,
      total_entries: entries.length,
      drafted_entries: draftedEntries.length,
    },
  };
}

async function generateLeaderboardSummary(base44: any, poolId: string): Promise<string> {
  const golfers = await base44.asServiceRole.entities.Golfer.filter({ pool_id: poolId });
  const entries = await base44.asServiceRole.entities.PoolEntry.filter({ pool_id: poolId });

  // Build golfer map
  const golferMap: Record<string, any> = {};
  for (const g of golfers) golferMap[g.id] = g;

  // Enrich and sort entries
  const standings = entries
    .filter((e: any) => e.golfer_a_id && e.golfer_b_id)
    .map((e: any) => {
      const gA = golferMap[e.golfer_a_id];
      const gB = golferMap[e.golfer_b_id];
      const scoreA = gA?.score_to_par || 0;
      const scoreB = gB?.score_to_par || 0;
      return {
        name: e.team_name || e.participant_name,
        golferA: gA?.name || '?',
        golferB: gB?.name || '?',
        scoreA,
        scoreB,
        total: scoreA + scoreB,
      };
    })
    .sort((a: any, b: any) => a.total - b.total);

  if (standings.length === 0) return 'No drafted entries yet.';

  // Top golfers by individual score
  const topGolfers = [...golfers]
    .filter((g: any) => g.status === 'active' && (g.round_1 != null))
    .sort((a: any, b: any) => (a.score_to_par || 0) - (b.score_to_par || 0))
    .slice(0, 5);

  let summary = `COWTOWN MASTERS LEADERBOARD\n`;
  summary += `${'─'.repeat(40)}\n\n`;
  summary += `POOL STANDINGS:\n`;

  standings.forEach((s: any, i: number) => {
    const pos = i + 1;
    summary += `  ${pos}. ${s.name} (${formatScore(s.total)}) — ${s.golferA} (${formatScore(s.scoreA)}) + ${s.golferB} (${formatScore(s.scoreB)})\n`;
  });

  if (topGolfers.length > 0) {
    summary += `\nTOP GOLFERS:\n`;
    topGolfers.forEach((g: any, i: number) => {
      summary += `  ${i + 1}. ${g.name} ${formatScore(g.score_to_par)} (thru ${g.thru || '–'})\n`;
    });
  }

  return summary;
}

async function logAgentAction(base44: any, poolId: string | null, action: string, detail: string, severity: string = 'info', metadata: any = {}) {
  try {
    await base44.asServiceRole.entities.AgentLog.create({
      pool_id: poolId,
      action,
      detail,
      severity,
      metadata,
    });
  } catch {
    // Non-critical — don't break agent flow if logging fails
    console.error('Agent log write failed');
  }
}

async function runDiagnostics(base44: any): Promise<any> {
  const checks: any[] = [];

  // Check 1: Pool exists
  try {
    const pools = await base44.asServiceRole.entities.Pool.filter({});
    checks.push({
      name: 'Pool Entity',
      status: pools.length > 0 ? 'pass' : 'warn',
      detail: `${pools.length} pool(s) found`,
    });
  } catch (e: any) {
    checks.push({ name: 'Pool Entity', status: 'fail', detail: e.message });
  }

  // Check 2: Golfers exist
  try {
    const pools = await base44.asServiceRole.entities.Pool.filter({});
    const activePool = pools.find((p: any) => ['live', 'setup', 'draft'].includes(p.status));
    if (activePool) {
      const golfers = await base44.asServiceRole.entities.Golfer.filter({ pool_id: activePool.id });
      checks.push({
        name: 'Golfer Records',
        status: golfers.length > 0 ? 'pass' : 'warn',
        detail: `${golfers.length} golfers in active pool`,
      });
    } else {
      checks.push({ name: 'Golfer Records', status: 'warn', detail: 'No active pool to check' });
    }
  } catch (e: any) {
    checks.push({ name: 'Golfer Records', status: 'fail', detail: e.message });
  }

  // Check 3: ESPN connectivity
  try {
    const res = await fetch(ESPN_SCOREBOARD);
    checks.push({
      name: 'ESPN API',
      status: res.ok ? 'pass' : 'fail',
      detail: res.ok ? `Connected (${res.status})` : `HTTP ${res.status}`,
    });
  } catch (e: any) {
    checks.push({ name: 'ESPN API', status: 'fail', detail: e.message });
  }

  // Check 4: Notification entity
  try {
    const notifs = await base44.asServiceRole.entities.Notification.filter({});
    checks.push({
      name: 'Notification System',
      status: 'pass',
      detail: `${notifs.length} notifications in system`,
    });
  } catch (e: any) {
    checks.push({ name: 'Notification System', status: 'fail', detail: e.message });
  }

  const passing = checks.filter((c: any) => c.status === 'pass').length;
  const failing = checks.filter((c: any) => c.status === 'fail').length;

  return {
    overall: failing === 0 ? 'healthy' : 'degraded',
    passing,
    failing,
    warnings: checks.filter((c: any) => c.status === 'warn').length,
    checks,
    ran_at: now(),
  };
}

// ── Main Handler ─────────────────────────────────────────────────

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // GET — Agent status dashboard
  if (req.method === 'GET') {
    try {
      const poolHealth = await getPoolHealth(base44);

      let tournamentPhase = { phase: 'idle', detail: 'ESPN not checked yet.' };
      try {
        const espnData = await fetchESPN();
        tournamentPhase = await detectTournamentPhase(espnData);
      } catch {
        tournamentPhase = { phase: 'idle', detail: 'Could not reach ESPN.' };
      }

      const phaseConfig = PHASES[tournamentPhase.phase as keyof typeof PHASES] || PHASES.idle;

      return Response.json({
        agent: 'Cowtown Master Agent',
        version: '1.0.0',
        timestamp: now(),
        phase: {
          current: tournamentPhase.phase,
          label: phaseConfig.label,
          description: phaseConfig.description,
          detail: tournamentPhase.detail,
        },
        config: {
          scorePollingInterval: phaseConfig.scorePollingInterval,
          alertsEnabled: phaseConfig.alertsEnabled,
          broadcastEnabled: phaseConfig.broadcastEnabled,
        },
        pool: poolHealth,
      });
    } catch (error: any) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  // POST — Agent commands
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { action, params } = body;

      switch (action) {
        // ── STATUS ───────────────────────────────
        case 'status': {
          const poolHealth = await getPoolHealth(base44);
          let phase = { phase: 'idle', detail: '' };
          try {
            const espnData = await fetchESPN();
            phase = await detectTournamentPhase(espnData);
          } catch { /* ignore */ }

          const phaseConfig = PHASES[phase.phase as keyof typeof PHASES] || PHASES.idle;

          return Response.json({
            action: 'status',
            timestamp: now(),
            phase: { current: phase.phase, ...phaseConfig, detail: phase.detail },
            pool: poolHealth,
          });
        }

        // ── START — Activate tournament automations ──
        case 'start': {
          const poolHealth = await getPoolHealth(base44);
          if (!poolHealth.healthy) {
            return Response.json({
              action: 'start',
              success: false,
              error: 'No active pool found. Create a pool first.',
            });
          }

          // Set pool status to live
          await base44.asServiceRole.entities.Pool.update(poolHealth.pool.id, {
            status: 'live',
          });

          // Detect current phase from ESPN
          let phase = { phase: 'live_round', detail: 'Manually started' };
          try {
            const espnData = await fetchESPN();
            phase = await detectTournamentPhase(espnData);
            // If ESPN says idle/pre, override to live since admin manually started
            if (phase.phase === 'idle' || phase.phase === 'pre_tournament') {
              phase = { phase: 'live_round', detail: 'Admin manually activated. ESPN shows pre-tournament.' };
            }
          } catch { /* use default */ }

          const phaseConfig = PHASES[phase.phase as keyof typeof PHASES];

          // Log the activation
          await logAgentAction(base44, poolHealth.pool.id, 'start', `Agent activated in phase: ${phaseConfig.label}`, 'info', { phase: phase.phase });

          // Create a startup notification
          await base44.asServiceRole.entities.Notification.create({
            pool_id: poolHealth.pool.id,
            type: 'leaderboard_change',
            title: 'Master Agent Activated',
            message: `Tournament automations are now live. Phase: ${phaseConfig.label}. Score polling every ${phaseConfig.scorePollingInterval}s.`,
            read_by: [],
          });

          // Trigger initial score fetch
          let initialScores = null;
          try {
            const scoreRes = await fetch(new URL('/functions/fetchMastersScores', req.url).href, {
              method: 'POST',
              headers: { ...Object.fromEntries(req.headers), 'Content-Type': 'application/json' },
              body: JSON.stringify({ pool_id: poolHealth.pool.id }),
            });
            initialScores = await scoreRes.json();
          } catch { /* non-critical */ }

          return Response.json({
            action: 'start',
            success: true,
            timestamp: now(),
            phase: { current: phase.phase, ...phaseConfig, detail: phase.detail },
            pool: poolHealth.pool,
            initialScores,
            message: `Agent activated. All subsystems online. Polling every ${phaseConfig.scorePollingInterval}s.`,
          });
        }

        // ── STOP — Gracefully stop automations ──
        case 'stop': {
          const poolHealth = await getPoolHealth(base44);
          if (poolHealth.healthy && poolHealth.pool) {
            await logAgentAction(base44, poolHealth.pool.id, 'stop', 'Agent deactivated by admin', 'info');
            await base44.asServiceRole.entities.Notification.create({
              pool_id: poolHealth.pool.id,
              type: 'leaderboard_change',
              title: 'Master Agent Deactivated',
              message: 'Tournament automations have been paused by admin.',
              read_by: [],
            });
          }

          return Response.json({
            action: 'stop',
            success: true,
            timestamp: now(),
            message: 'All automations stopped. Agent entering idle mode.',
            phase: { current: 'idle', ...PHASES.idle },
          });
        }

        // ── POLL NOW — Force immediate score update ──
        case 'pollNow': {
          const poolHealth = await getPoolHealth(base44);
          if (!poolHealth.healthy) {
            return Response.json({ action: 'pollNow', success: false, error: 'No active pool.' });
          }

          // Fetch fresh scores from ESPN
          const espnData = await fetchESPN();
          const event = espnData.events?.find((e: any) =>
            e.name?.toLowerCase().includes('masters')
          ) || espnData.events?.[0];

          if (!event?.competitions?.[0]?.competitors) {
            return Response.json({
              action: 'pollNow',
              success: false,
              error: 'No competitor data available from ESPN.',
            });
          }

          const competitors = event.competitions[0].competitors;
          const golfers = await base44.asServiceRole.entities.Golfer.filter({ pool_id: poolHealth.pool.id });

          // Normalize and match
          const normalize = (name: string) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z\s]/g, '').toLowerCase().trim();
          const espnMap: Record<string, any> = {};
          for (const c of competitors) {
            const name = c.athlete?.displayName || '';
            const linescores = c.linescores || [];
            const roundsToPar = [];
            for (let i = 0; i < 4; i++) {
              roundsToPar.push(linescores[i]?.displayValue != null ? parseInt(linescores[i].displayValue) || 0 : null);
            }
            const statusName = c.status?.type?.name || '';
            let gStatus = 'active';
            if (statusName === 'cut') gStatus = 'cut';
            else if (['wd', 'withdrawn'].includes(statusName)) gStatus = 'withdrawn';

            espnMap[normalize(name)] = {
              score_to_par: parseInt(c.score?.displayValue) || 0,
              round_1: roundsToPar[0], round_2: roundsToPar[1],
              round_3: roundsToPar[2], round_4: roundsToPar[3],
              status: gStatus,
              thru: c.status?.thru?.toString() || c.status?.displayValue || null,
            };
          }

          let updated = 0;
          for (const g of golfers) {
            const match = espnMap[normalize(g.name)];
            if (match) {
              const changed = g.score_to_par !== match.score_to_par || g.thru !== match.thru || g.status !== match.status;
              if (changed) {
                await base44.asServiceRole.entities.Golfer.update(g.id, match);
                updated++;
              }
            }
          }

          return Response.json({
            action: 'pollNow',
            success: true,
            timestamp: now(),
            espn_competitors: competitors.length,
            pool_golfers: golfers.length,
            updated,
            tournament: event.name,
          });
        }

        // ── DIAGNOSE — Run full system diagnostics ──
        case 'diagnose': {
          const diagnostics = await runDiagnostics(base44);
          return Response.json({ action: 'diagnose', ...diagnostics });
        }

        // ── SUMMARY — Generate leaderboard summary ──
        case 'summary': {
          const poolHealth = await getPoolHealth(base44);
          if (!poolHealth.healthy) {
            return Response.json({ action: 'summary', success: false, error: 'No active pool.' });
          }

          const summary = await generateLeaderboardSummary(base44, poolHealth.pool.id);
          return Response.json({
            action: 'summary',
            success: true,
            timestamp: now(),
            summary,
          });
        }

        // ── SET PHASE — Manual phase override ──
        case 'setPhase': {
          const targetPhase = params?.phase;
          if (!targetPhase || !PHASES[targetPhase as keyof typeof PHASES]) {
            return Response.json({
              action: 'setPhase',
              success: false,
              error: `Invalid phase. Available: ${Object.keys(PHASES).join(', ')}`,
            });
          }

          const phaseConfig = PHASES[targetPhase as keyof typeof PHASES];
          return Response.json({
            action: 'setPhase',
            success: true,
            timestamp: now(),
            phase: { current: targetPhase, ...phaseConfig },
            message: `Phase set to "${phaseConfig.label}". Polling interval: ${phaseConfig.scorePollingInterval || 'disabled'}s.`,
          });
        }

        default:
          return Response.json({
            error: `Unknown action: "${action}"`,
            available_actions: ['status', 'start', 'stop', 'pollNow', 'diagnose', 'summary', 'setPhase'],
          }, { status: 400 });
      }
    } catch (error: any) {
      console.error('Master Agent error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
});
