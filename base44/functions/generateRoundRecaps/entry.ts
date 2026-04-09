import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ROUND_DATES = {
  1: '2026-04-09',
  2: '2026-04-10',
  3: '2026-04-11',
  4: '2026-04-12',
};

const ROUND_KEY = { 1: 'round_1', 2: 'round_2', 3: 'round_3', 4: 'round_4' };

function formatScoreToPar(s) {
  if (s == null) return '?';
  if (s === 0) return 'E';
  return s > 0 ? `+${s}` : `${s}`;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const body = await req.json().catch(() => ({}));
    const params = body.data || body;
    const roundNumber = params.round_number;
    const tournamentYear = params.tournament_year || 2026;
    const forceRegenerate = params.force_regenerate === true;

    if (!roundNumber || roundNumber < 1 || roundNumber > 4) {
      return Response.json({ error: 'round_number must be 1-4' }, { status: 400 });
    }

    // Find active pool
    const pools = await base44.asServiceRole.entities.Pool.filter({});
    const pool = pools.find(p => p.status === 'live' || p.status === 'complete') || pools[0];
    if (!pool) return Response.json({ error: 'No pool found' }, { status: 404 });

    const poolId = pool.id;
    const rKey = ROUND_KEY[roundNumber];

    // Fetch entries & golfers
    const [entries, golfers] = await Promise.all([
      base44.asServiceRole.entities.PoolEntry.filter({ pool_id: poolId }),
      base44.asServiceRole.entities.Golfer.filter({ pool_id: poolId }),
    ]);

    const golferMap = {};
    for (const g of golfers) golferMap[g.id] = g;

    // Check existing recaps
    const existingRecaps = await base44.asServiceRole.entities.RoundRecap.filter({
      pool_id: poolId,
      round_number: roundNumber,
      tournament_year: tournamentYear,
    });
    const existingByEntry = {};
    for (const r of existingRecaps) existingByEntry[r.entry_id] = r;

    // Calculate round scores for ranking
    const entryRoundScores = entries.map(entry => {
      const gA = golferMap[entry.golfer_a_id];
      const gB = golferMap[entry.golfer_b_id];
      const scoreA = gA?.[rKey] ?? null;
      const scoreB = gB?.[rKey] ?? null;
      const roundTotal = (scoreA ?? 0) + (scoreB ?? 0);
      const hasRoundData = scoreA != null || scoreB != null;
      return { ...entry, gA, gB, scoreA, scoreB, roundTotal, hasRoundData };
    }).sort((a, b) => a.roundTotal - b.roundTotal);

    // Assign round ranks
    entryRoundScores.forEach((e, i) => { e.roundRank = i + 1; });

    // Calculate overall standings for rank
    const overallStandings = entries.map(entry => {
      const gA = golferMap[entry.golfer_a_id];
      const gB = golferMap[entry.golfer_b_id];
      return { id: entry.id, total: (gA?.score_to_par ?? 0) + (gB?.score_to_par ?? 0) };
    }).sort((a, b) => a.total - b.total);
    const overallRankMap = {};
    overallStandings.forEach((e, i) => { overallRankMap[e.id] = i + 1; });

    // Previous round overall ranks for rank_change calculation
    let prevRankMap = {};
    if (roundNumber > 1) {
      const prevRKey = ROUND_KEY[roundNumber - 1];
      // Approximate previous overall by summing rounds up to previous
      const prevStandings = entries.map(entry => {
        const gA = golferMap[entry.golfer_a_id];
        const gB = golferMap[entry.golfer_b_id];
        let totalA = 0, totalB = 0;
        for (let r = 1; r < roundNumber; r++) {
          const k = ROUND_KEY[r];
          totalA += gA?.[k] ?? 0;
          totalB += gB?.[k] ?? 0;
        }
        return { id: entry.id, total: totalA + totalB };
      }).sort((a, b) => a.total - b.total);
      prevStandings.forEach((e, i) => { prevRankMap[e.id] = i + 1; });
    }

    let generated = 0, skipped = 0, errors = 0;

    for (const entry of entryRoundScores) {
      // Skip if already has recap and not forcing
      if (!forceRegenerate && existingByEntry[entry.id]) {
        skipped++;
        continue;
      }

      if (!entry.hasRoundData && !entry.gA && !entry.gB) {
        skipped++;
        continue;
      }

      const gA = entry.gA;
      const gB = entry.gB;

      const teamGolfers = [gA, gB].filter(Boolean);
      const teamSnapshot = teamGolfers.map(g => ({
        name: g.name,
        round_score: g[rKey],
        score_to_par: g.score_to_par,
        position: g.position,
        status: g.status,
        group: g.group,
      }));

      // Best and worst golfer for the round
      const golferRoundScores = teamGolfers.map(g => ({ name: g.name, score: g[rKey] ?? 999 }));
      golferRoundScores.sort((a, b) => a.score - b.score);
      const bestGolfer = golferRoundScores[0] ? { name: golferRoundScores[0].name, score: formatScoreToPar(golferRoundScores[0].score === 999 ? null : golferRoundScores[0].score) } : { name: 'N/A', score: '?' };
      const worstGolfer = golferRoundScores.length > 1 ? { name: golferRoundScores[golferRoundScores.length - 1].name, score: formatScoreToPar(golferRoundScores[golferRoundScores.length - 1].score === 999 ? null : golferRoundScores[golferRoundScores.length - 1].score) } : bestGolfer;

      const overallRank = overallRankMap[entry.id] || entries.length;
      const prevRank = prevRankMap[entry.id] || overallRank;
      const rankChange = prevRank - overallRank; // positive = improved

      // Build prompt
      const golferLines = teamGolfers.map(g =>
        `- ${g.name} (${g.group === 'A' ? 'Top Tier' : 'Bottom Tier'}): Round score ${formatScoreToPar(g[rKey])}, overall ${formatScoreToPar(g.score_to_par)}, position ${g.position || '?'}, status: ${g.status}`
      ).join('\n');

      const userPrompt = `Participant: ${entry.participant_name || entry.team_name || 'Unknown'}
Round: ${roundNumber} of 4
Round date: ${ROUND_DATES[roundNumber]}
Team for this round:
${golferLines}
Team total for round: ${formatScoreToPar(entry.roundTotal)}
Team rank for this round: ${entry.roundRank} of ${entries.length}
Overall leaderboard position: ${overallRank}
Rank change since yesterday: ${rankChange > 0 ? `+${rankChange} (improved)` : rankChange < 0 ? `${rankChange} (dropped)` : 'unchanged'}
Best golfer on team: ${bestGolfer.name} (${bestGolfer.score})
Worst golfer on team: ${worstGolfer.name} (${worstGolfer.score})

Generate the recap.`;

      const systemPrompt = `You are the snarky sportswriter behind "The Caddyshack Report," a daily fantasy golf recap column for the Cowtown Masters pool — a tight-knit Texas group of friends who've been ribbing each other about golf picks for years. Your voice is Bill Simmons meets Caddyshack meets a slightly mean group text. You ROAST bad picks, you mock lazy strategy, you celebrate brilliance with backhanded compliments, and you absolutely live to call out the guy in last place.

RULES:
- Affectionate, never cruel. These are friends. Punch the picks, not the person.
- Specific, not generic. Reference the actual golfers, the actual scores, the actual collapse.
- One running joke per recap is ideal — find the angle (the guy whose whole team missed the cut, the guy carried by ONE golfer, the guy who picked a legend who shot 78, etc.)
- Length: 200-350 words. Tight. No filler.
- Headline must be punchy and quotable — the kind of thing someone screenshots.
- Tone vary by performance:
  * Top 3 finishers: praise-heavy with light teasing ("the broken clock was right today")
  * Middle of pack: balanced shrug energy ("congrats on the participation trophy")
  * Bottom 3: full roast mode — this is the main event
  * Dead last: tragic comedy. Be merciless but loving.
- ALWAYS reference the best golfer and worst golfer by name with their score
- ALWAYS reference the rank change if meaningful (climbed 4 spots, dropped 6, etc.)
- End with a one-line zinger or prediction for tomorrow

Return ONLY valid JSON in this exact format:
{
  "headline": "string",
  "body": "string (200-350 words)",
  "tone": "roast_heavy" | "praise_heavy" | "balanced" | "tragic_comedy"
}

DO NOT include markdown, code fences, or commentary outside the JSON.`;

      try {
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
          model: 'claude_sonnet_4_6',
        });

        const recapData = {
          pool_id: poolId,
          entry_id: entry.id,
          participant_name: entry.participant_name || entry.team_name || 'Unknown',
          tournament_year: tournamentYear,
          round_number: roundNumber,
          round_date: ROUND_DATES[roundNumber],
          team_snapshot: teamSnapshot,
          team_total_to_par: entry.roundTotal,
          team_rank_for_round: entry.roundRank,
          overall_rank: overallRank,
          rank_change: rankChange,
          best_golfer: bestGolfer,
          worst_golfer: worstGolfer,
          recap_headline: llmResponse.headline,
          recap_body: llmResponse.body,
          recap_tone: llmResponse.tone,
          generated_at: new Date().toISOString(),
          generated_by: forceRegenerate ? 'manual' : 'automation',
        };

        // Update existing or create new
        if (existingByEntry[entry.id]) {
          await base44.asServiceRole.entities.RoundRecap.update(existingByEntry[entry.id].id, recapData);
        } else {
          await base44.asServiceRole.entities.RoundRecap.create(recapData);
        }
        generated++;
      } catch (e) {
        console.error(`Error generating recap for ${entry.participant_name}: ${e.message}`);
        errors++;
      }
    }

    // Send notification if this is an automation run and we generated recaps
    if (!forceRegenerate && generated > 0) {
      try {
        await base44.asServiceRole.entities.Notification.create({
          pool_id: poolId,
          type: 'round_finish',
          title: `📋 Caddyshack Report: Round ${roundNumber}`,
          message: `The Caddyshack Report for Round ${roundNumber} is live. Brace yourselves.`,
          read_by: [],
        });
      } catch (e) {
        console.error('Failed to create notification:', e.message);
      }
    }

    return Response.json({ generated, skipped, errors, round: roundNumber, pool_id: poolId });
  } catch (error) {
    console.error('generateRoundRecaps error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});