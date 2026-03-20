import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Mock Masters.com leaderboard data (60-sec polling target)
// In production, this would call: https://www.pgatour.com/api/v1/leaderboard?tournamentId=401355556
const getMockMastersData = () => {
  const baseScores = {
    'Ludvig Åberg': { r1: -7, r2: -1, r3: 3, r4: -6, status: 'active' },
    'Jon Rahm': { r1: 0, r2: -6, r3: -6, r4: 1, status: 'active' },
    'Patrick Reed': { r1: -1, r2: -2, r3: -3, r4: -3, status: 'active' },
    'Scottie Scheffler': { r1: -4, r2: -1, r3: 0, r4: -3, status: 'active' },
    'Rory McIlroy': { r1: -11, r2: 3, r3: -2, r4: -1, status: 'active' },
    'Justin Rose': { r1: -7, r2: -1, r3: 3, r4: -6, status: 'active' },
    'Patrick Cantlay': { r1: 2, r2: -3, r3: -4, r4: 2, status: 'active' },
    'Dustin Johnson': { r1: 0, r2: -2, r3: 1, r4: 4, status: 'cut' },
    'Sungjae Im': { r1: -5, r2: -2, r3: 0, r4: 0, status: 'active' },
    'Collin Morikawa': { r1: -3, r2: -1, r3: 2, r4: -2, status: 'active' },
  };

  // Simulate minor score fluctuations (round in progress)
  return Object.entries(baseScores).map(([name, data]) => ({
    name,
    round_1: data.r1,
    round_2: data.r2,
    round_3: data.r3,
    round_4: data.r4,
    score_to_par: data.r1 + data.r2 + data.r3 + data.r4,
    actual_scores: [72 - data.r1, 72 - data.r2, 72 - data.r3, 72 - data.r4],
    status: data.status,
    thru: 'F',
  }));
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Check if user is authenticated (optional for backend, but good practice)
    // In production, use service role since this is server-triggered
    
    // Fetch active pools
    const pools = await base44.asServiceRole.entities.Pool.filter({ status: 'live' });
    
    if (pools.length === 0) {
      return Response.json({ updated: 0, message: 'No live pools to update' });
    }

    const poolId = pools[0].id; // Update first live pool

    // Get Masters leaderboard data (mock for now)
    const mastersData = getMockMastersData();

    // Update Golfer entities in Base44
    let updateCount = 0;
    for (const golfer of mastersData) {
      try {
        // Find golfer by name in this pool
        const existingGolfers = await base44.asServiceRole.entities.Golfer.filter({
          pool_id: poolId,
          name: golfer.name,
        });

        if (existingGolfers.length > 0) {
          // Update golfer scores
          await base44.asServiceRole.entities.Golfer.update(existingGolfers[0].id, {
            score_to_par: golfer.score_to_par,
            round_1: golfer.round_1,
            round_2: golfer.round_2,
            round_3: golfer.round_3,
            round_4: golfer.round_4,
            actual_scores: golfer.actual_scores,
            status: golfer.status,
            thru: golfer.thru,
          });
          updateCount++;
        }
      } catch (e) {
        console.error(`Failed to update ${golfer.name}:`, e.message);
      }
    }

    // Broadcast update via SSE (if clients are connected)
    // In production, this would trigger push notifications via Firebase/WebSocket
    console.log(`Updated ${updateCount} golfers for pool ${poolId}`);

    return Response.json({
      success: true,
      poolId,
      updated: updateCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Score polling error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});