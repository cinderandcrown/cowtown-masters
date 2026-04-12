import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Generates a full-tournament recap for every participant after Round 4.
 * Stored as round_number=5 in RoundRecap entity.
 */

const ROUND_KEY = { 1: 'round_1', 2: 'round_2', 3: 'round_3', 4: 'round_4' };

function fmt(s) {
  if (s == null) return '?';
  if (s === 0) return 'E';
  return s > 0 ? `+${s}` : `${s}`;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const body = await req.json().catch(() => ({}));
    const params = body.data || body;
    const tournamentYear = params.tournament_year || 2026;
    const forceRegenerate = params.force_regenerate === true;

    const pools = await base44.asServiceRole.entities.Pool.filter({});
    const pool = pools.find(p => p.status === 'live' || p.status === 'complete') || pools[0];
    if (!pool) return Response.json({ error: 'No pool found' }, { status: 404 });

    const poolId = pool.id;

    const [entries, golfers] = await Promise.all([
      base44.asServiceRole.entities.PoolEntry.filter({ pool_id: poolId }),
      base44.asServiceRole.entities.Golfer.filter({ pool_id: poolId }),
    ]);

    const golferMap = {};
    for (const g of golfers) golferMap[g.id] = g;

    // Check existing tournament recaps (stored as round_number=5)
    const existingRecaps = await base44.asServiceRole.entities.RoundRecap.filter({
      pool_id: poolId, round_number: 5, tournament_year: tournamentYear,
    });
    const existingByEntry = {};
    for (const r of existingRecaps) existingByEntry[r.entry_id] = r;

    // Build overall standings
    const standings = entries.map(entry => {
      const gA = golferMap[entry.golfer_a_id];
      const gB = golferMap[entry.golfer_b_id];
      const total = (gA?.score_to_par ?? 0) + (gB?.score_to_par ?? 0);
      return { ...entry, gA, gB, total };
    }).sort((a, b) => a.total - b.total);

    standings.forEach((e, i) => { e.finalRank = i + 1; });

    // Round-by-round ranks for trajectory
    const roundRanks = {};
    for (let r = 1; r <= 4; r++) {
      const rKey = ROUND_KEY[r];
      const sorted = [...entries].map(e => {
        const gA = golferMap[e.golfer_a_id];
        const gB = golferMap[e.golfer_b_id];
        let cumA = 0, cumB = 0;
        for (let rr = 1; rr <= r; rr++) {
          cumA += gA?.[ROUND_KEY[rr]] ?? 0;
          cumB += gB?.[ROUND_KEY[rr]] ?? 0;
        }
        return { id: e.id, total: cumA + cumB };
      }).sort((a, b) => a.total - b.total);
      sorted.forEach((e, i) => {
        if (!roundRanks[e.id]) roundRanks[e.id] = {};
        roundRanks[e.id][r] = i + 1;
      });
    }

    let generated = 0, skipped = 0, errors = 0;

    const toProcess = standings.filter(entry => {
      if (!forceRegenerate && existingByEntry[entry.id]) { skipped++; return false; }
      return true;
    });

    const BATCH_SIZE = 5;
    for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
      const batch = toProcess.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(batch.map(async (entry) => {
      const gA = entry.gA;
      const gB = entry.gB;
      const teamGolfers = [gA, gB].filter(Boolean);

      const teamSnapshot = teamGolfers.map(g => ({
        name: g.name, group: g.group, status: g.status, position: g.position,
        score_to_par: g.score_to_par,
        round_1: g.round_1, round_2: g.round_2, round_3: g.round_3, round_4: g.round_4,
      }));

      const golferScores = teamGolfers.map(g => ({ name: g.name, score: g.score_to_par ?? 0 }));
      golferScores.sort((a, b) => a.score - b.score);
      const bestGolfer = golferScores[0] || { name: 'N/A', score: 0 };
      const worstGolfer = golferScores[golferScores.length - 1] || bestGolfer;

      const ranks = roundRanks[entry.id] || {};
      const trajectory = [1, 2, 3, 4].map(r => `R${r}: #${ranks[r] || '?'}`).join(' \u2192 ');

      let bestRound = null, worstRound = null;
      for (const g of teamGolfers) {
        for (let r = 1; r <= 4; r++) {
          const sc = g[ROUND_KEY[r]];
          if (sc == null) continue;
          if (!bestRound || sc < bestRound.score) bestRound = { golfer: g.name, round: r, score: sc };
          if (!worstRound || sc > worstRound.score) worstRound = { golfer: g.name, round: r, score: sc };
        }
      }

      const golferLines = teamGolfers.map(g =>
        `- ${g.name} (${g.group === 'A' ? 'Top Tier' : 'Bottom Tier'}): R1 ${fmt(g.round_1)}, R2 ${fmt(g.round_2)}, R3 ${fmt(g.round_3)}, R4 ${fmt(g.round_4)} | Total: ${fmt(g.score_to_par)} | Position: ${g.position || '?'} | Status: ${g.status}`
      ).join('\n');

      const userPrompt = `Participant: ${entry.participant_name || entry.team_name || 'Unknown'}
Tournament: 2026 Masters (all 4 rounds complete)

Team performance:
${golferLines}

Team combined total: ${fmt(entry.total)}
Final pool ranking: #${entry.finalRank} of ${standings.length}
Ranking trajectory: ${trajectory}
${bestRound ? `Best individual round: ${bestRound.golfer} shot ${fmt(bestRound.score)} in Round ${bestRound.round}` : ''}
${worstRound ? `Worst individual round: ${worstRound.golfer} shot ${fmt(worstRound.score)} in Round ${worstRound.round}` : ''}
Tournament MVP: ${bestGolfer.name} (${fmt(bestGolfer.score)} total)
Tournament Disaster: ${worstGolfer.name} (${fmt(worstGolfer.score)} total)

Generate the full tournament recap.`;

      const systemPrompt = `You are the snarky sportswriter behind "The Caddyshack Report," writing the FINAL TOURNAMENT RECAP for the Cowtown Masters pool \u2014 a tight-knit Texas friend group. This is the big one: the season finale, the full four-round retrospective. Your voice is Bill Simmons meets Caddyshack meets a roast at the 19th hole.

This is NOT a single-round recap. This covers their ENTIRE tournament arc \u2014 the highs, the lows, the collapses, the comebacks, the steady mediocrity. Tell the story of their week.

RULES:
- Affectionate, never cruel. Punch the picks, not the person.
- Reference ALL FOUR ROUNDS. Call out their trajectory \u2014 did they start hot and collapse? Steady the whole way? Rally on Sunday?
- Reference specific golfers, specific rounds, specific scores. No generic fluff.
- If they won the pool, give them their moment but immediately undercut it with something funny.
- If they finished last, this is the eulogy. Make it legendary.
- If a golfer got cut, missed the weekend, or withdrew \u2014 that\u2019s comedy gold, USE IT.
- Length: 250-400 words. This is the finale, you get a little more room.
- Headline should feel like a season finale episode title \u2014 dramatic, funny, quotable.
- End with a \u201cfinal verdict\u201d one-liner that sums up their entire tournament in one sentence.

Return ONLY valid JSON:
{
  "headline": "string",
  "body": "string (250-400 words)",
  "tone": "roast_heavy" | "praise_heavy" | "balanced" | "tragic_comedy"
}`;

        const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `${systemPrompt}\n\n---\n\n${userPrompt}`,
          response_json_schema: {
            type: 'object',
            properties: {
              headline: { type: 'string' },
              body: { type: 'string' },
              tone: { type: 'string', enum: ['roast_heavy', 'praise_heavy', 'balanced', 'tragic_comedy'] },
            },
            required: ['headline', 'body', 'tone'],
          },
        });

        const recapData = {
          pool_id: poolId,
          entry_id: entry.id,
          participant_name: entry.participant_name || entry.team_name || 'Unknown',
          tournament_year: tournamentYear,
          round_number: 5,
          round_date: '2026-04-12',
          team_snapshot: teamSnapshot,
          team_total_to_par: entry.total,
          team_rank_for_round: entry.finalRank,
          overall_rank: entry.finalRank,
          rank_change: (roundRanks[entry.id]?.[3] || entry.finalRank) - entry.finalRank,
          best_golfer: { name: bestGolfer.name, score: fmt(bestGolfer.score) },
          worst_golfer: { name: worstGolfer.name, score: fmt(worstGolfer.score) },
          recap_headline: llmResponse.headline,
          recap_body: llmResponse.body,
          recap_tone: llmResponse.tone,
          generated_at: new Date().toISOString(),
          generated_by: forceRegenerate ? 'manual' : 'automation',
        };

        if (existingByEntry[entry.id]) {
          await base44.asServiceRole.entities.RoundRecap.update(existingByEntry[entry.id].id, recapData);
        } else {
          await base44.asServiceRole.entities.RoundRecap.create(recapData);
        }
        return 'ok';
      }));

      for (const r of results) {
        if (r.status === 'fulfilled') generated++;
        else { errors++; console.error('Tournament recap batch error:', r.reason?.message); }
      }
    }

    if (!forceRegenerate && generated > 0) {
      try {
        await base44.asServiceRole.entities.Notification.create({
          pool_id: poolId,
          type: 'round_finish',
          title: 'The Caddyshack Report: Tournament Recap',
          message: 'The final tournament recaps are live. Your full-week roast awaits.',
          read_by: [],
        });
      } catch (e) { console.error('Notification error:', e.message); }
    }

    return Response.json({ generated, skipped, errors, type: 'tournament', pool_id: poolId });
  } catch (error) {
    console.error('generateTournamentRecaps error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});