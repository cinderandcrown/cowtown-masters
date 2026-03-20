import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { poolName, maxEntries = 24 } = await req.json();

    // Create 2026 Pool
    const pool = await base44.asServiceRole.entities.Pool.create({
      name: poolName || 'Cowtown Masters 2026',
      year: 2026,
      status: 'live',
      entry_fee: 50,
      payout_structure: { first: 60, second: 25, third: 15 },
      admin_user_id: user.email,
      invite_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      max_entries: maxEntries,
      golfers_per_group: maxEntries / 2,
    });

    // Create Golfers for 2026 Masters
    const golfersData = [
      { name: 'Ludvig Åberg', group: 'A', betting_odds: '+1200', world_ranking: 2 },
      { name: 'Jon Rahm', group: 'A', betting_odds: '+1400', world_ranking: 3 },
      { name: 'Scottie Scheffler', group: 'A', betting_odds: '+400', world_ranking: 1 },
      { name: 'Rory McIlroy', group: 'A', betting_odds: '+2000', world_ranking: 5 },
      { name: 'Patrick Cantlay', group: 'A', betting_odds: '+2500', world_ranking: 8 },
      { name: 'Collin Morikawa', group: 'A', betting_odds: '+2800', world_ranking: 12 },
      { name: 'Tommy Fleetwood', group: 'A', betting_odds: '+3500', world_ranking: 15 },
      { name: 'Xander Schauffele', group: 'A', betting_odds: '+1600', world_ranking: 4 },
      { name: 'Victor Hovland', group: 'A', betting_odds: '+2200', world_ranking: 6 },
      { name: 'Hideki Matsuyama', group: 'A', betting_odds: '+2000', world_ranking: 7 },
      { name: 'Russell Henley', group: 'A', betting_odds: '+3000', world_ranking: 14 },
      { name: 'Brian Harman', group: 'A', betting_odds: '+2500', world_ranking: 9 },
      { name: 'Patrick Reed', group: 'B', betting_odds: '+4000', world_ranking: 20 },
      { name: 'Sungjae Im', group: 'B', betting_odds: '+3500', world_ranking: 18 },
      { name: 'Justin Rose', group: 'B', betting_odds: '+4500', world_ranking: 25 },
      { name: 'Dustin Johnson', group: 'B', betting_odds: '+5000', world_ranking: 30 },
      { name: 'Jordan Spieth', group: 'B', betting_odds: '+5500', world_ranking: 32 },
      { name: 'Aaron Rai', group: 'B', betting_odds: '+4000', world_ranking: 21 },
      { name: 'Sahith Theegala', group: 'B', betting_odds: '+3800', world_ranking: 19 },
      { name: 'Joaquín Niemann', group: 'B', betting_odds: '+4200', world_ranking: 23 },
      { name: 'Tony Finau', group: 'B', betting_odds: '+4500', world_ranking: 26 },
      { name: 'Justin Thomas', group: 'B', betting_odds: '+5000', world_ranking: 29 },
      { name: 'Daniel Berger', group: 'B', betting_odds: '+4800', world_ranking: 27 },
      { name: 'Keegan Bradley', group: 'B', betting_odds: '+5200', world_ranking: 31 },
    ];

    const createdGolfers = await base44.asServiceRole.entities.Golfer.bulkCreate(
      golfersData.map((g) => ({
        pool_id: pool.id,
        ...g,
        score_to_par: 0,
        round_1: 0,
        round_2: 0,
        round_3: 0,
        round_4: 0,
        status: 'active',
        is_drafted: false,
      }))
    );

    return Response.json({
      success: true,
      pool: {
        id: pool.id,
        name: pool.name,
        invite_code: pool.invite_code,
      },
      golfers: createdGolfers.length,
      message: `Pool initialized with ${createdGolfers.length} golfers. 2026 tournament ready!`,
    });
  } catch (error) {
    console.error('Pool initialization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});