import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Triggered by Golfer entity update automation.
 * Detects birdies/eagles (round score improvements) and round finishes,
 * then creates Notification records for participants who drafted that golfer.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data, old_data } = body;
    if (!data || !old_data) {
      return Response.json({ message: 'No data to compare' });
    }

    const golferId = event.entity_id;
    const poolId = data.pool_id;
    if (!poolId) {
      return Response.json({ message: 'No pool_id on golfer' });
    }

    const notifications = [];
    const golferName = data.name || 'Unknown Golfer';

    // Detect score improvements (birdie/eagle) by comparing score_to_par
    const oldScore = old_data.score_to_par ?? 0;
    const newScore = data.score_to_par ?? 0;
    const scoreDrop = oldScore - newScore;

    if (scoreDrop >= 2) {
      // Eagle or better
      notifications.push({
        pool_id: poolId,
        golfer_name: golferName,
        type: 'eagle',
        title: `🦅 EAGLE! ${golferName}`,
        message: `${golferName} just made an eagle! Now at ${newScore === 0 ? 'E' : newScore > 0 ? '+' + newScore : newScore} for the tournament.`,
        read_by: [],
      });
    } else if (scoreDrop === 1) {
      // Birdie
      notifications.push({
        pool_id: poolId,
        golfer_name: golferName,
        type: 'birdie',
        title: `🐦 Birdie! ${golferName}`,
        message: `${golferName} drops one with a birdie! Now at ${newScore === 0 ? 'E' : newScore > 0 ? '+' + newScore : newScore} for the tournament.`,
        read_by: [],
      });
    }

    // Detect round finish (thru changes to 'F' or '18')
    const oldThru = old_data.thru;
    const newThru = data.thru;
    if (newThru && (newThru === 'F' || newThru === '18') && oldThru !== 'F' && oldThru !== '18') {
      // Determine which round just finished
      const rounds = [data.round_1, data.round_2, data.round_3, data.round_4];
      const completedRounds = rounds.filter(r => r !== null && r !== undefined).length;
      const roundScore = rounds[completedRounds - 1];
      const scoreStr = roundScore === 0 ? 'E' : roundScore > 0 ? '+' + roundScore : '' + roundScore;

      notifications.push({
        pool_id: poolId,
        golfer_name: golferName,
        type: 'round_finish',
        title: `🏁 Round ${completedRounds} Complete: ${golferName}`,
        message: `${golferName} finishes Round ${completedRounds} at ${scoreStr}. Tournament total: ${newScore === 0 ? 'E' : newScore > 0 ? '+' + newScore : newScore}.`,
        read_by: [],
      });
    }

    // Create notification records (pool-wide only, no per-entry duplicates)
    if (notifications.length > 0) {
      await base44.asServiceRole.entities.Notification.bulkCreate(notifications);
      console.log(`Created ${notifications.length} notifications for ${golferName}`);
    }

    return Response.json({ created: notifications.length, golfer: golferName });
  } catch (error) {
    console.error('Alert generation error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});