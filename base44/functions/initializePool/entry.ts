import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Historical Masters data keyed by golfer name
const MASTERS_HISTORY = {
  'Scottie Scheffler': { appearances: 5, cuts_made: 5, wins: 2, top5s: 3, top10s: 4, top25s: 5, best_finish: '1st', best_finish_year: 2022, avg_finish: 5.4, avg_score: 70.1, recent_results: [{ year: 2025, finish: '1st', score: -12 }, { year: 2024, finish: '1st', score: -11 }, { year: 2023, finish: 'T10', score: -5 }] },
  'Rory McIlroy': { appearances: 17, cuts_made: 13, wins: 0, top5s: 6, top10s: 8, top25s: 11, best_finish: 'T2', best_finish_year: 2022, avg_finish: 18.5, avg_score: 71.8, recent_results: [{ year: 2025, finish: 'T6', score: -7 }, { year: 2024, finish: 'T22', score: 1 }, { year: 2023, finish: 'T16', score: -3 }] },
  'Jon Rahm': { appearances: 7, cuts_made: 6, wins: 1, top5s: 3, top10s: 5, top25s: 6, best_finish: '1st', best_finish_year: 2023, avg_finish: 10.2, avg_score: 70.8, recent_results: [{ year: 2025, finish: 'T5', score: -8 }, { year: 2024, finish: 'T45', score: 9 }, { year: 2023, finish: '1st', score: -12 }] },
  'Bryson DeChambeau': { appearances: 6, cuts_made: 5, wins: 0, top5s: 1, top10s: 2, top25s: 3, best_finish: 'T5', best_finish_year: 2025, avg_finish: 25.3, avg_score: 72.1, recent_results: [{ year: 2025, finish: 'T5', score: -8 }, { year: 2024, finish: 'T6', score: -5 }] },
  'Xander Schauffele': { appearances: 8, cuts_made: 7, wins: 0, top5s: 3, top10s: 4, top25s: 6, best_finish: 'T2', best_finish_year: 2019, avg_finish: 14.1, avg_score: 71.2, recent_results: [{ year: 2025, finish: 'T3', score: -10 }, { year: 2024, finish: 'T8', score: -5 }, { year: 2023, finish: 'T24', score: -1 }] },
  'Ludvig Åberg': { appearances: 2, cuts_made: 2, wins: 0, top5s: 1, top10s: 2, top25s: 2, best_finish: 'T2', best_finish_year: 2024, avg_finish: 6.5, avg_score: 70.5, recent_results: [{ year: 2025, finish: 'T11', score: -5 }, { year: 2024, finish: 'T2', score: -7 }] },
  'Collin Morikawa': { appearances: 5, cuts_made: 5, wins: 0, top5s: 2, top10s: 3, top25s: 4, best_finish: 'T3', best_finish_year: 2024, avg_finish: 13.2, avg_score: 71.3, recent_results: [{ year: 2025, finish: 'T3', score: -10 }, { year: 2024, finish: 'T3', score: -7 }, { year: 2023, finish: 'T16', score: -3 }] },
  'Hideki Matsuyama': { appearances: 12, cuts_made: 11, wins: 1, top5s: 4, top10s: 6, top25s: 9, best_finish: '1st', best_finish_year: 2021, avg_finish: 14.8, avg_score: 71.5, recent_results: [{ year: 2025, finish: 'T8', score: -6 }, { year: 2024, finish: 'T30', score: 2 }, { year: 2023, finish: 'T14', score: -4 }] },
  'Patrick Cantlay': { appearances: 7, cuts_made: 6, wins: 0, top5s: 1, top10s: 3, top25s: 5, best_finish: 'T3', best_finish_year: 2019, avg_finish: 17.1, avg_score: 71.6, recent_results: [{ year: 2025, finish: 'T14', score: -4 }, { year: 2024, finish: 'T9', score: -5 }, { year: 2023, finish: 'T30', score: 0 }] },
  'Viktor Hovland': { appearances: 5, cuts_made: 4, wins: 0, top5s: 1, top10s: 2, top25s: 3, best_finish: 'T4', best_finish_year: 2023, avg_finish: 19.6, avg_score: 72.0, recent_results: [{ year: 2025, finish: 'T18', score: -3 }, { year: 2023, finish: 'T4', score: -9 }] },
  'Tommy Fleetwood': { appearances: 7, cuts_made: 6, wins: 0, top5s: 1, top10s: 3, top25s: 5, best_finish: 'T4', best_finish_year: 2023, avg_finish: 18.3, avg_score: 71.7, recent_results: [{ year: 2025, finish: 'T14', score: -4 }, { year: 2024, finish: 'T11', score: -4 }, { year: 2023, finish: 'T4', score: -9 }] },
  'Shane Lowry': { appearances: 7, cuts_made: 5, wins: 0, top5s: 1, top10s: 2, top25s: 4, best_finish: 'T3', best_finish_year: 2025, avg_finish: 21.4, avg_score: 72.2, recent_results: [{ year: 2025, finish: 'T3', score: -10 }, { year: 2024, finish: 'T25', score: 0 }] },
  'Jordan Spieth': { appearances: 12, cuts_made: 11, wins: 1, top5s: 5, top10s: 7, top25s: 9, best_finish: '1st', best_finish_year: 2015, avg_finish: 11.5, avg_score: 70.9, recent_results: [{ year: 2025, finish: 'T14', score: -4 }, { year: 2024, finish: 'T38', score: 5 }, { year: 2023, finish: 'T30', score: 0 }] },
  'Justin Thomas': { appearances: 8, cuts_made: 7, wins: 0, top5s: 2, top10s: 3, top25s: 5, best_finish: '4th', best_finish_year: 2020, avg_finish: 16.1, avg_score: 71.4, recent_results: [{ year: 2025, finish: 'T22', score: -2 }, { year: 2024, finish: 'T16', score: -2 }, { year: 2023, finish: 'T24', score: -1 }] },
  'Patrick Reed': { appearances: 9, cuts_made: 7, wins: 1, top5s: 2, top10s: 3, top25s: 5, best_finish: '1st', best_finish_year: 2018, avg_finish: 17.6, avg_score: 71.5, recent_results: [{ year: 2025, finish: 'T30', score: -1 }, { year: 2024, finish: 'T36', score: 4 }, { year: 2023, finish: 'T16', score: -3 }] },
  'Brooks Koepka': { appearances: 8, cuts_made: 6, wins: 0, top5s: 2, top10s: 3, top25s: 5, best_finish: 'T2', best_finish_year: 2023, avg_finish: 17.5, avg_score: 71.6, recent_results: [{ year: 2025, finish: 'T22', score: -2 }, { year: 2024, finish: 'T45', score: 9 }, { year: 2023, finish: 'T2', score: -11 }] },
  'Justin Rose': { appearances: 16, cuts_made: 12, wins: 0, top5s: 4, top10s: 7, top25s: 10, best_finish: '2nd', best_finish_year: 2017, avg_finish: 16.7, avg_score: 71.5, recent_results: [{ year: 2025, finish: 'T45', score: 2 }, { year: 2024, finish: 'T30', score: 2 }, { year: 2023, finish: 'T14', score: -4 }] },
  'Tony Finau': { appearances: 7, cuts_made: 6, wins: 0, top5s: 2, top10s: 4, top25s: 5, best_finish: 'T5', best_finish_year: 2019, avg_finish: 16.3, avg_score: 71.5, recent_results: [{ year: 2025, finish: 'T14', score: -4 }, { year: 2024, finish: 'T14', score: -3 }, { year: 2023, finish: 'T10', score: -6 }] },
  'Adam Scott': { appearances: 22, cuts_made: 17, wins: 1, top5s: 5, top10s: 8, top25s: 13, best_finish: '1st', best_finish_year: 2013, avg_finish: 18.2, avg_score: 71.7, recent_results: [{ year: 2025, finish: 'T22', score: -2 }, { year: 2024, finish: 'T9', score: -5 }, { year: 2023, finish: 'T24', score: -1 }] },
  'Dustin Johnson': { appearances: 13, cuts_made: 11, wins: 1, top5s: 4, top10s: 6, top25s: 9, best_finish: '1st', best_finish_year: 2020, avg_finish: 13.4, avg_score: 71.1, recent_results: [{ year: 2025, finish: 'T45', score: 2 }, { year: 2024, finish: 'T30', score: 2 }, { year: 2023, finish: 'T42', score: 4 }] },
  'Cameron Smith': { appearances: 7, cuts_made: 6, wins: 0, top5s: 2, top10s: 3, top25s: 5, best_finish: 'T3', best_finish_year: 2020, avg_finish: 16.0, avg_score: 71.3, recent_results: [{ year: 2025, finish: 'T30', score: -1 }, { year: 2024, finish: 'T36', score: 4 }, { year: 2023, finish: 'T30', score: 0 }] },
  'Sergio Garcia': { appearances: 24, cuts_made: 21, wins: 1, top5s: 7, top10s: 11, top25s: 16, best_finish: '1st', best_finish_year: 2017, avg_finish: 15.3, avg_score: 71.3, recent_results: [{ year: 2025, finish: 'T45', score: 2 }, { year: 2024, finish: 'T36', score: 4 }, { year: 2023, finish: 'T30', score: 0 }] },
  'Phil Mickelson': { appearances: 30, cuts_made: 27, wins: 3, top5s: 11, top10s: 16, top25s: 22, best_finish: '1st', best_finish_year: 2010, avg_finish: 13.1, avg_score: 71.1, recent_results: [] },
  'Bubba Watson': { appearances: 15, cuts_made: 12, wins: 2, top5s: 4, top10s: 6, top25s: 9, best_finish: '1st', best_finish_year: 2014, avg_finish: 16.5, avg_score: 71.5, recent_results: [] },
  'Fred Couples': { appearances: 35, cuts_made: 25, wins: 1, top5s: 5, top10s: 10, top25s: 17, best_finish: '1st', best_finish_year: 1992, avg_finish: 19.7, avg_score: 71.8, recent_results: [] },
  'José María Olazábal': { appearances: 23, cuts_made: 17, wins: 2, top5s: 6, top10s: 8, top25s: 12, best_finish: '1st', best_finish_year: 1999, avg_finish: 18.1, avg_score: 71.6, recent_results: [] },
  'Ángel Cabrera': { appearances: 11, cuts_made: 7, wins: 1, top5s: 3, top10s: 4, top25s: 5, best_finish: '1st', best_finish_year: 2009, avg_finish: 22.0, avg_score: 72.2, recent_results: [{ year: 2013, finish: 'T2', score: -8 }] },
  'Vijay Singh': { appearances: 23, cuts_made: 16, wins: 0, top5s: 3, top10s: 5, top25s: 10, best_finish: 'T2', best_finish_year: 2003, avg_finish: 23.5, avg_score: 72.3, recent_results: [] },
  'Mike Weir': { appearances: 18, cuts_made: 11, wins: 1, top5s: 3, top10s: 5, top25s: 8, best_finish: '1st', best_finish_year: 2003, avg_finish: 24.2, avg_score: 72.3, recent_results: [] },
  'Charl Schwartzel': { appearances: 13, cuts_made: 9, wins: 1, top5s: 2, top10s: 4, top25s: 6, best_finish: '1st', best_finish_year: 2011, avg_finish: 22.5, avg_score: 72.0, recent_results: [] },
  'Danny Willett': { appearances: 8, cuts_made: 5, wins: 1, top5s: 1, top10s: 1, top25s: 3, best_finish: '1st', best_finish_year: 2016, avg_finish: 27.4, avg_score: 72.6, recent_results: [] },
  'Zach Johnson': { appearances: 16, cuts_made: 12, wins: 1, top5s: 3, top10s: 5, top25s: 9, best_finish: '1st', best_finish_year: 2007, avg_finish: 21.4, avg_score: 72.0, recent_results: [] },
  'Jason Day': { appearances: 13, cuts_made: 10, wins: 0, top5s: 2, top10s: 4, top25s: 7, best_finish: 'T2', best_finish_year: 2011, avg_finish: 19.3, avg_score: 71.8, recent_results: [{ year: 2025, finish: 'T36', score: 0 }, { year: 2024, finish: 'T22', score: 1 }, { year: 2023, finish: 'T42', score: 4 }] },
  'Tyrrell Hatton': { appearances: 6, cuts_made: 5, wins: 0, top5s: 0, top10s: 2, top25s: 3, best_finish: 'T6', best_finish_year: 2025, avg_finish: 22.3, avg_score: 72.2, recent_results: [{ year: 2025, finish: 'T6', score: -7 }, { year: 2024, finish: 'T16', score: -2 }] },
  'Haotong Li': { appearances: 3, cuts_made: 2, wins: 0, top5s: 0, top10s: 1, top25s: 1, best_finish: 'T3', best_finish_year: 2020, avg_finish: 23.3, avg_score: 72.3, recent_results: [{ year: 2020, finish: 'T3', score: -11 }] },
};

const MASTERS_FIELD = [
  { name: 'Scottie Scheffler', betting_odds: '+350', world_ranking: 1 },
  { name: 'Rory McIlroy', betting_odds: '+700', world_ranking: 2 },
  { name: 'Jon Rahm', betting_odds: '+1000', world_ranking: 3 },
  { name: 'Bryson DeChambeau', betting_odds: '+1000', world_ranking: 4 },
  { name: 'Xander Schauffele', betting_odds: '+1800', world_ranking: 5 },
  { name: 'Ludvig Åberg', betting_odds: '+1600', world_ranking: 6 },
  { name: 'Collin Morikawa', betting_odds: '+2200', world_ranking: 7 },
  { name: 'Hideki Matsuyama', betting_odds: '+3500', world_ranking: 8 },
  { name: 'Patrick Cantlay', betting_odds: '+2500', world_ranking: 9 },
  { name: 'Viktor Hovland', betting_odds: '+3000', world_ranking: 10 },
  { name: 'Tommy Fleetwood', betting_odds: '+3000', world_ranking: 11 },
  { name: 'Shane Lowry', betting_odds: '+3500', world_ranking: 12 },
  { name: 'Robert MacIntyre', betting_odds: '+3500', world_ranking: 13 },
  { name: 'Russell Henley', betting_odds: '+4000', world_ranking: 14 },
  { name: 'Matt Fitzpatrick', betting_odds: '+3000', world_ranking: 15 },
  { name: 'Sahith Theegala', betting_odds: '+4000', world_ranking: 16 },
  { name: 'Sungjae Im', betting_odds: '+4000', world_ranking: 17 },
  { name: 'Patrick Reed', betting_odds: '+3000', world_ranking: 18 },
  { name: 'Brian Harman', betting_odds: '+4000', world_ranking: 19 },
  { name: 'Keegan Bradley', betting_odds: '+4000', world_ranking: 20 },
  { name: 'Justin Thomas', betting_odds: '+3500', world_ranking: 21 },
  { name: 'Jordan Spieth', betting_odds: '+4000', world_ranking: 22 },
  { name: 'Brooks Koepka', betting_odds: '+4500', world_ranking: 23 },
  { name: 'Sam Burns', betting_odds: '+5000', world_ranking: 24 },
  { name: 'Cameron Young', betting_odds: '+4000', world_ranking: 25 },
  { name: 'Tony Finau', betting_odds: '+5000', world_ranking: 26 },
  { name: 'Corey Conners', betting_odds: '+5000', world_ranking: 27 },
  { name: 'Justin Rose', betting_odds: '+5000', world_ranking: 28 },
  { name: 'Tom Kim', betting_odds: '+5000', world_ranking: 29 },
  { name: 'Min Woo Lee', betting_odds: '+5000', world_ranking: 30 },
  { name: 'Aaron Rai', betting_odds: '+5000', world_ranking: 31 },
  { name: 'Wyndham Clark', betting_odds: '+8000', world_ranking: 32 },
  { name: 'Max Homa', betting_odds: '+5000', world_ranking: 33 },
  { name: 'Sepp Straka', betting_odds: '+6000', world_ranking: 34 },
  { name: 'Cameron Smith', betting_odds: '+6600', world_ranking: 35 },
  { name: 'Adam Scott', betting_odds: '+6600', world_ranking: 36 },
  { name: 'Jason Day', betting_odds: '+7000', world_ranking: 37 },
  { name: 'Si Woo Kim', betting_odds: '+7000', world_ranking: 38 },
  { name: 'Akshay Bhatia', betting_odds: '+5000', world_ranking: 39 },
  { name: 'Chris Kirk', betting_odds: '+7000', world_ranking: 40 },
  { name: 'Tyrrell Hatton', betting_odds: '+4500', world_ranking: 41 },
  { name: 'Nick Taylor', betting_odds: '+8000', world_ranking: 42 },
  { name: 'Harris English', betting_odds: '+7000', world_ranking: 43 },
  { name: 'Daniel Berger', betting_odds: '+6000', world_ranking: 44 },
  { name: 'Billy Horschel', betting_odds: '+8000', world_ranking: 45 },
  { name: 'Davis Thompson', betting_odds: '+6000', world_ranking: 46 },
  { name: 'Maverick McNealy', betting_odds: '+6000', world_ranking: 47 },
  { name: 'Chris Gotterup', betting_odds: '+4500', world_ranking: 48 },
  { name: 'Kurt Kitayama', betting_odds: '+7000', world_ranking: 49 },
  { name: 'Ben Griffin', betting_odds: '+7000', world_ranking: 50 },
  { name: 'Nicolai Hojgaard', betting_odds: '+5000', world_ranking: 51 },
  { name: 'Ryan Fox', betting_odds: '+6000', world_ranking: 52 },
  { name: 'J.J. Spaun', betting_odds: '+9000', world_ranking: 53 },
  { name: 'Jacob Bridgeman', betting_odds: '+8000', world_ranking: 54 },
  { name: 'Joaquín Niemann', betting_odds: '+5000', world_ranking: 55 },
  { name: 'Dustin Johnson', betting_odds: '+9000', world_ranking: 56 },
  { name: 'Michael Brennan', betting_odds: '+8000', world_ranking: 57 },
  { name: 'Denny McCarthy', betting_odds: '+8000', world_ranking: 58 },
  { name: 'Andrew Novak', betting_odds: '+9000', world_ranking: 59 },
  { name: 'Ryan Gerard', betting_odds: '+9000', world_ranking: 60 },
  { name: 'Alex Noren', betting_odds: '+10000', world_ranking: 61 },
  { name: 'Kristoffer Reitan', betting_odds: '+10000', world_ranking: 62 },
  { name: 'Sam Stevens', betting_odds: '+10000', world_ranking: 63 },
  { name: 'Max Greyserman', betting_odds: '+8000', world_ranking: 64 },
  { name: 'Nick Dunlap', betting_odds: '+7000', world_ranking: 65 },
  { name: 'Rasmus Hojgaard', betting_odds: '+8000', world_ranking: 66 },
  { name: 'Harry Hall', betting_odds: '+10000', world_ranking: 67 },
  { name: 'Sergio Garcia', betting_odds: '+10000', world_ranking: 68 },
  { name: 'Phil Mickelson', betting_odds: '+20000', world_ranking: 69 },
  { name: 'Nico Echavarria', betting_odds: '+10000', world_ranking: 70 },
  { name: 'Marco Penge', betting_odds: '+15000', world_ranking: 71 },
  { name: 'Carlos Ortiz', betting_odds: '+15000', world_ranking: 72 },
  { name: 'Davis Riley', betting_odds: '+10000', world_ranking: 73 },
  { name: 'Aldrich Potgieter', betting_odds: '+12000', world_ranking: 74 },
  { name: 'Sami Valimaki', betting_odds: '+12000', world_ranking: 75 },
  { name: 'Brian Campbell', betting_odds: '+15000', world_ranking: 76 },
  { name: 'Naoyuki Kataoka', betting_odds: '+20000', world_ranking: 77 },
  { name: 'Tom McKibbin', betting_odds: '+10000', world_ranking: 78 },
  { name: 'Casey Jarvis', betting_odds: '+20000', world_ranking: 79 },
  { name: 'Rasmus Neergaard-Petersen', betting_odds: '+15000', world_ranking: 80 },
  { name: 'Matt McCarty', betting_odds: '+12000', world_ranking: 81 },
  { name: 'Jake Knapp', betting_odds: '+8000', world_ranking: 82 },
  { name: 'Johnny Keefer', betting_odds: '+15000', world_ranking: 83 },
  { name: 'Michael Kim', betting_odds: '+15000', world_ranking: 84 },
  { name: 'Haotong Li', betting_odds: '+15000', world_ranking: 85 },
  { name: 'Bubba Watson', betting_odds: '+25000', world_ranking: 86 },
  { name: 'Charl Schwartzel', betting_odds: '+35000', world_ranking: 87 },
  { name: 'Zach Johnson', betting_odds: '+40000', world_ranking: 88 },
  { name: 'Danny Willett', betting_odds: '+50000', world_ranking: 89 },
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
      masters_history: MASTERS_HISTORY[g.name] || null,
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