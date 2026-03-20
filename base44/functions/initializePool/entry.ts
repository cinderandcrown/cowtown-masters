import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const MASTERS_FIELD = [
  { name: 'Scottie Scheffler', betting_odds: '+400', world_ranking: 1 },
  { name: 'Ludvig Åberg', betting_odds: '+1200', world_ranking: 2 },
  { name: 'Jon Rahm', betting_odds: '+1400', world_ranking: 3 },
  { name: 'Xander Schauffele', betting_odds: '+1600', world_ranking: 4 },
  { name: 'Rory McIlroy', betting_odds: '+2000', world_ranking: 5 },
  { name: 'Victor Hovland', betting_odds: '+2200', world_ranking: 6 },
  { name: 'Hideki Matsuyama', betting_odds: '+2000', world_ranking: 7 },
  { name: 'Patrick Cantlay', betting_odds: '+2500', world_ranking: 8 },
  { name: 'Brian Harman', betting_odds: '+2500', world_ranking: 9 },
  { name: 'Wyndham Clark', betting_odds: '+2800', world_ranking: 10 },
  { name: 'Brooks Koepka', betting_odds: '+2800', world_ranking: 11 },
  { name: 'Collin Morikawa', betting_odds: '+2800', world_ranking: 12 },
  { name: 'Matt Fitzpatrick', betting_odds: '+3000', world_ranking: 13 },
  { name: 'Russell Henley', betting_odds: '+3000', world_ranking: 14 },
  { name: 'Tommy Fleetwood', betting_odds: '+3500', world_ranking: 15 },
  { name: 'Shane Lowry', betting_odds: '+3500', world_ranking: 16 },
  { name: 'Robert MacIntyre', betting_odds: '+3500', world_ranking: 17 },
  { name: 'Sungjae Im', betting_odds: '+3500', world_ranking: 18 },
  { name: 'Sahith Theegala', betting_odds: '+3800', world_ranking: 19 },
  { name: 'Patrick Reed', betting_odds: '+4000', world_ranking: 20 },
  { name: 'Aaron Rai', betting_odds: '+4000', world_ranking: 21 },
  { name: 'Cameron Smith', betting_odds: '+4000', world_ranking: 22 },
  { name: 'Joaquín Niemann', betting_odds: '+4200', world_ranking: 23 },
  { name: 'Max Homa', betting_odds: '+4500', world_ranking: 24 },
  { name: 'Justin Rose', betting_odds: '+4500', world_ranking: 25 },
  { name: 'Tony Finau', betting_odds: '+4500', world_ranking: 26 },
  { name: 'Daniel Berger', betting_odds: '+4800', world_ranking: 27 },
  { name: 'Sam Burns', betting_odds: '+4800', world_ranking: 28 },
  { name: 'Justin Thomas', betting_odds: '+5000', world_ranking: 29 },
  { name: 'Dustin Johnson', betting_odds: '+5000', world_ranking: 30 },
  { name: 'Keegan Bradley', betting_odds: '+5200', world_ranking: 31 },
  { name: 'Jordan Spieth', betting_odds: '+5500', world_ranking: 32 },
  { name: 'Cameron Young', betting_odds: '+5500', world_ranking: 33 },
  { name: 'Corey Conners', betting_odds: '+5500', world_ranking: 34 },
  { name: 'Min Woo Lee', betting_odds: '+5500', world_ranking: 35 },
  { name: 'Adam Scott', betting_odds: '+6000', world_ranking: 36 },
  { name: 'Tom Kim', betting_odds: '+6000', world_ranking: 37 },
  { name: 'Chris Kirk', betting_odds: '+6000', world_ranking: 38 },
  { name: 'Denny McCarthy', betting_odds: '+6500', world_ranking: 39 },
  { name: 'Jason Day', betting_odds: '+6500', world_ranking: 40 },
  { name: 'Billy Horschel', betting_odds: '+7000', world_ranking: 41 },
  { name: 'Sepp Straka', betting_odds: '+7000', world_ranking: 42 },
  { name: 'Si Woo Kim', betting_odds: '+7000', world_ranking: 43 },
  { name: 'Taylor Moore', betting_odds: '+7500', world_ranking: 44 },
  { name: 'Akshay Bhatia', betting_odds: '+7500', world_ranking: 45 },
  { name: 'Nick Dunlap', betting_odds: '+8000', world_ranking: 46 },
  { name: 'Phil Mickelson', betting_odds: '+8000', world_ranking: 47 },
  { name: 'Tiger Woods', betting_odds: '+8000', world_ranking: 48 },
  { name: 'Sergio Garcia', betting_odds: '+8500', world_ranking: 49 },
  { name: 'Tyrrell Hatton', betting_odds: '+8500', world_ranking: 50 },
  { name: 'Byeong Hun An', betting_odds: '+9000', world_ranking: 51 },
  { name: 'Davis Thompson', betting_odds: '+9000', world_ranking: 52 },
  { name: 'Stephan Jaeger', betting_odds: '+9500', world_ranking: 53 },
  { name: 'Erik van Rooyen', betting_odds: '+10000', world_ranking: 54 },
  { name: 'Luke List', betting_odds: '+10000', world_ranking: 55 },
  { name: 'Taylor Pendrith', betting_odds: '+10000', world_ranking: 56 },
  { name: 'J.T. Poston', betting_odds: '+10000', world_ranking: 57 },
  { name: 'Nick Taylor', betting_odds: '+11000', world_ranking: 58 },
  { name: 'Kevin Yu', betting_odds: '+11000', world_ranking: 59 },
  { name: 'Harris English', betting_odds: '+12000', world_ranking: 60 },
  { name: 'Lucas Glover', betting_odds: '+12000', world_ranking: 61 },
  { name: 'Mackenzie Hughes', betting_odds: '+12000', world_ranking: 62 },
  { name: 'Bubba Watson', betting_odds: '+15000', world_ranking: 63 },
  { name: 'Rickie Fowler', betting_odds: '+15000', world_ranking: 65 },
  { name: 'Charl Schwartzel', betting_odds: '+15000', world_ranking: 66 },
  { name: 'Webb Simpson', betting_odds: '+20000', world_ranking: 67 },
  { name: 'Zach Johnson', betting_odds: '+20000', world_ranking: 68 },
  { name: 'Danny Willett', betting_odds: '+20000', world_ranking: 69 },
  { name: 'Vijay Singh', betting_odds: '+25000', world_ranking: 70 },
  { name: 'Fred Couples', betting_odds: '+30000', world_ranking: 71 },
  { name: 'Mike Weir', betting_odds: '+30000', world_ranking: 72 },
  { name: 'Jose Maria Olazabal', betting_odds: '+50000', world_ranking: 74 },
  { name: 'Tiger Woods', betting_odds: '+8000', world_ranking: 48 },
];

// Deduplicate by name
const UNIQUE_FIELD = [];
const seen = new Set();
for (const g of MASTERS_FIELD) {
  if (!seen.has(g.name)) {
    seen.add(g.name);
    UNIQUE_FIELD.push(g);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { poolName, year, entryFee, maxEntries } = await req.json();

    // Create the pool
    const pool = await base44.asServiceRole.entities.Pool.create({
      name: poolName || 'Cowtown Masters 2026',
      year: year || 2026,
      status: 'setup',
      entry_fee: entryFee || 50,
      payout_structure: { first: 60, second: 25, third: 15 },
      admin_user_id: user.email,
      invite_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      max_entries: maxEntries || 30,
      golfers_per_group: Math.floor((maxEntries || 30) / 2),
    });

    // Bulk create all golfers (group assignment is dynamic based on entry count)
    const golferRecords = UNIQUE_FIELD.map((g) => ({
      pool_id: pool.id,
      name: g.name,
      group: 'A', // Will be reassigned dynamically by frontend
      betting_odds: g.betting_odds,
      world_ranking: g.world_ranking,
      score_to_par: 0,
      round_1: null,
      round_2: null,
      round_3: null,
      round_4: null,
      status: 'active',
      is_drafted: false,
    }));

    // BulkCreate in batches of 25
    let totalCreated = 0;
    for (let i = 0; i < golferRecords.length; i += 25) {
      const batch = golferRecords.slice(i, i + 25);
      const created = await base44.asServiceRole.entities.Golfer.bulkCreate(batch);
      totalCreated += created.length;
    }

    return Response.json({
      success: true,
      pool: {
        id: pool.id,
        name: pool.name,
        invite_code: pool.invite_code,
      },
      golfers_created: totalCreated,
    });
  } catch (error) {
    console.error('Pool initialization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});