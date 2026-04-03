import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const pools = await base44.asServiceRole.entities.Pool.filter({});
    const results = [];

    for (const pool of pools) {
      if (pool.status === 'complete') continue;

      const golfers = await base44.asServiceRole.entities.Golfer.filter({ pool_id: pool.id });
      const entries = await base44.asServiceRole.entities.PoolEntry.filter({ pool_id: pool.id });

      const replacements = [];

      // Find all withdrawn/DQ golfers that have been drafted
      const wdGolfers = golfers.filter(g =>
        (g.status === 'withdrawn' || g.status === 'disqualified') && g.is_drafted
      );

      for (const wdGolfer of wdGolfers) {
        // Find which entry has this golfer
        const entry = entries.find(e =>
          e.golfer_a_id === wdGolfer.id || e.golfer_b_id === wdGolfer.id
        );
        if (!entry) continue;

        const isGroupA = entry.golfer_a_id === wdGolfer.id;
        const group = wdGolfer.group;

        // Find best available replacement in same group (lowest odds = best)
        const availableInGroup = golfers.filter(g =>
          g.group === group &&
          g.status === 'active' &&
          !g.is_drafted &&
          g.id !== wdGolfer.id
        );

        // Sort by betting odds (parse "+1000" to 1000, lower = better)
        availableInGroup.sort((a, b) => {
          const oddsA = parseInt((a.betting_odds || '+999999').replace('+', ''));
          const oddsB = parseInt((b.betting_odds || '+999999').replace('+', ''));
          return oddsA - oddsB;
        });

        if (availableInGroup.length === 0) {
          replacements.push({
            entry: entry.participant_name,
            withdrawn: wdGolfer.name,
            replacement: null,
            reason: 'No available replacement in group ' + group
          });
          continue;
        }

        const replacement = availableInGroup[0];

        // Update the entry with the new golfer
        const entryUpdate = isGroupA
          ? { golfer_a_id: replacement.id }
          : { golfer_b_id: replacement.id };
        await base44.asServiceRole.entities.PoolEntry.update(entry.id, entryUpdate);

        // Mark old golfer as no longer drafted
        await base44.asServiceRole.entities.Golfer.update(wdGolfer.id, {
          is_drafted: false,
          drafted_by: null
        });

        // Mark new golfer as drafted
        await base44.asServiceRole.entities.Golfer.update(replacement.id, {
          is_drafted: true,
          drafted_by: entry.id
        });

        // Create a notification
        await base44.asServiceRole.entities.Notification.create({
          pool_id: pool.id,
          entry_id: entry.id,
          golfer_name: replacement.name,
          type: 'leaderboard_change',
          title: 'Golfer Replacement',
          message: `${wdGolfer.name} (${wdGolfer.status}) has been replaced by ${replacement.name} (${replacement.betting_odds}) for ${entry.participant_name}'s team.`,
          read_by: []
        });

        // Create a system chat message
        await base44.asServiceRole.entities.ChatMessage.create({
          pool_id: pool.id,
          user_name: 'System',
          message: `⚠️ Auto-Replacement: ${wdGolfer.name} (${wdGolfer.status.toUpperCase()}) → ${replacement.name} (${replacement.betting_odds}) for team "${entry.team_name || entry.participant_name}"`,
          message_type: 'system'
        });

        replacements.push({
          entry: entry.participant_name,
          withdrawn: wdGolfer.name,
          withdrawnOdds: wdGolfer.betting_odds,
          replacement: replacement.name,
          replacementOdds: replacement.betting_odds,
          group: group
        });
      }

      results.push({
        pool: pool.name,
        replacementsCount: replacements.length,
        replacements
      });
    }

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});