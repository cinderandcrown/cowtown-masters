import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Cleanup: Remove golfers NOT in the 2026 Masters field,
 * remove duplicates (keep the one with correct canonical data),
 * and reset any stale score data on remaining golfers.
 */

const CANONICAL_FIELD = new Set([
  'Scottie Scheffler', 'Rory McIlroy', 'Jon Rahm', 'Bryson DeChambeau',
  'Xander Schauffele', 'Ludvig Åberg', 'Collin Morikawa', 'Hideki Matsuyama',
  'Patrick Cantlay', 'Viktor Hovland', 'Tommy Fleetwood', 'Shane Lowry',
  'Robert MacIntyre', 'Russell Henley', 'Matt Fitzpatrick', 'Sahith Theegala',
  'Sungjae Im', 'Patrick Reed', 'Brian Harman', 'Keegan Bradley',
  'Justin Thomas', 'Jordan Spieth', 'Brooks Koepka', 'Sam Burns',
  'Cameron Young', 'Tony Finau', 'Corey Conners', 'Justin Rose',
  'Tom Kim', 'Min Woo Lee', 'Aaron Rai', 'Wyndham Clark',
  'Max Homa', 'Sepp Straka', 'Cameron Smith', 'Adam Scott',
  'Jason Day', 'Si Woo Kim', 'Akshay Bhatia', 'Chris Kirk',
  'Tyrrell Hatton', 'Nick Taylor', 'Harris English', 'Daniel Berger',
  'Billy Horschel', 'Davis Thompson', 'Maverick McNealy', 'Chris Gotterup',
  'Kurt Kitayama', 'Ben Griffin', 'Nicolai Hojgaard', 'Ryan Fox',
  'J.J. Spaun', 'Jacob Bridgeman', 'Joaquín Niemann', 'Dustin Johnson',
  'Michael Brennan', 'Denny McCarthy', 'Andrew Novak', 'Ryan Gerard',
  'Alex Noren', 'Kristoffer Reitan', 'Sam Stevens', 'Max Greyserman',
  'Nick Dunlap', 'Rasmus Hojgaard', 'Harry Hall', 'Sergio Garcia',
  'Phil Mickelson', 'Nico Echavarria', 'Marco Penge', 'Carlos Ortiz',
  'Davis Riley', 'Aldrich Potgieter', 'Sami Valimaki', 'Brian Campbell',
  'Naoyuki Kataoka', 'Tom McKibbin', 'Casey Jarvis', 'Rasmus Neergaard-Petersen',
  'Matt McCarty', 'Jake Knapp', 'Johnny Keefer', 'Michael Kim',
  'Haotong Li', 'Bubba Watson', 'Charl Schwartzel', 'Zach Johnson',
  'Danny Willett',
]);

// Canonical odds + rankings (source of truth)
const CANONICAL_DATA = {
  'Scottie Scheffler': { betting_odds: '+350', world_ranking: 1 },
  'Rory McIlroy': { betting_odds: '+700', world_ranking: 2 },
  'Jon Rahm': { betting_odds: '+1000', world_ranking: 3 },
  'Bryson DeChambeau': { betting_odds: '+1000', world_ranking: 4 },
  'Xander Schauffele': { betting_odds: '+1800', world_ranking: 5 },
  'Ludvig Åberg': { betting_odds: '+1600', world_ranking: 6 },
  'Collin Morikawa': { betting_odds: '+2200', world_ranking: 7 },
  'Hideki Matsuyama': { betting_odds: '+3500', world_ranking: 8 },
  'Patrick Cantlay': { betting_odds: '+2500', world_ranking: 9 },
  'Viktor Hovland': { betting_odds: '+3000', world_ranking: 10 },
  'Tommy Fleetwood': { betting_odds: '+3000', world_ranking: 11 },
  'Shane Lowry': { betting_odds: '+3500', world_ranking: 12 },
  'Robert MacIntyre': { betting_odds: '+3500', world_ranking: 13 },
  'Russell Henley': { betting_odds: '+4000', world_ranking: 14 },
  'Matt Fitzpatrick': { betting_odds: '+3000', world_ranking: 15 },
  'Sahith Theegala': { betting_odds: '+4000', world_ranking: 16 },
  'Sungjae Im': { betting_odds: '+4000', world_ranking: 17 },
  'Patrick Reed': { betting_odds: '+3000', world_ranking: 18 },
  'Brian Harman': { betting_odds: '+4000', world_ranking: 19 },
  'Keegan Bradley': { betting_odds: '+4000', world_ranking: 20 },
  'Justin Thomas': { betting_odds: '+3500', world_ranking: 21 },
  'Jordan Spieth': { betting_odds: '+4000', world_ranking: 22 },
  'Brooks Koepka': { betting_odds: '+4500', world_ranking: 23 },
  'Sam Burns': { betting_odds: '+5000', world_ranking: 24 },
  'Cameron Young': { betting_odds: '+4000', world_ranking: 25 },
  'Tony Finau': { betting_odds: '+5000', world_ranking: 26 },
  'Corey Conners': { betting_odds: '+5000', world_ranking: 27 },
  'Justin Rose': { betting_odds: '+5000', world_ranking: 28 },
  'Tom Kim': { betting_odds: '+5000', world_ranking: 29 },
  'Min Woo Lee': { betting_odds: '+5000', world_ranking: 30 },
  'Aaron Rai': { betting_odds: '+5000', world_ranking: 31 },
  'Wyndham Clark': { betting_odds: '+8000', world_ranking: 32 },
  'Max Homa': { betting_odds: '+5000', world_ranking: 33 },
  'Sepp Straka': { betting_odds: '+6000', world_ranking: 34 },
  'Cameron Smith': { betting_odds: '+6600', world_ranking: 35 },
  'Adam Scott': { betting_odds: '+6600', world_ranking: 36 },
  'Jason Day': { betting_odds: '+7000', world_ranking: 37 },
  'Si Woo Kim': { betting_odds: '+7000', world_ranking: 38 },
  'Akshay Bhatia': { betting_odds: '+5000', world_ranking: 39 },
  'Chris Kirk': { betting_odds: '+7000', world_ranking: 40 },
  'Tyrrell Hatton': { betting_odds: '+4500', world_ranking: 41 },
  'Nick Taylor': { betting_odds: '+8000', world_ranking: 42 },
  'Harris English': { betting_odds: '+7000', world_ranking: 43 },
  'Daniel Berger': { betting_odds: '+6000', world_ranking: 44 },
  'Billy Horschel': { betting_odds: '+8000', world_ranking: 45 },
  'Davis Thompson': { betting_odds: '+6000', world_ranking: 46 },
  'Maverick McNealy': { betting_odds: '+6000', world_ranking: 47 },
  'Chris Gotterup': { betting_odds: '+4500', world_ranking: 48 },
  'Kurt Kitayama': { betting_odds: '+7000', world_ranking: 49 },
  'Ben Griffin': { betting_odds: '+7000', world_ranking: 50 },
  'Nicolai Hojgaard': { betting_odds: '+5000', world_ranking: 51 },
  'Ryan Fox': { betting_odds: '+6000', world_ranking: 52 },
  'J.J. Spaun': { betting_odds: '+9000', world_ranking: 53 },
  'Jacob Bridgeman': { betting_odds: '+8000', world_ranking: 54 },
  'Joaquín Niemann': { betting_odds: '+5000', world_ranking: 55 },
  'Dustin Johnson': { betting_odds: '+9000', world_ranking: 56 },
  'Michael Brennan': { betting_odds: '+8000', world_ranking: 57 },
  'Denny McCarthy': { betting_odds: '+8000', world_ranking: 58 },
  'Andrew Novak': { betting_odds: '+9000', world_ranking: 59 },
  'Ryan Gerard': { betting_odds: '+9000', world_ranking: 60 },
  'Alex Noren': { betting_odds: '+10000', world_ranking: 61 },
  'Kristoffer Reitan': { betting_odds: '+10000', world_ranking: 62 },
  'Sam Stevens': { betting_odds: '+10000', world_ranking: 63 },
  'Max Greyserman': { betting_odds: '+8000', world_ranking: 64 },
  'Nick Dunlap': { betting_odds: '+7000', world_ranking: 65 },
  'Rasmus Hojgaard': { betting_odds: '+8000', world_ranking: 66 },
  'Harry Hall': { betting_odds: '+10000', world_ranking: 67 },
  'Sergio Garcia': { betting_odds: '+10000', world_ranking: 68 },
  'Phil Mickelson': { betting_odds: '+20000', world_ranking: 69 },
  'Nico Echavarria': { betting_odds: '+10000', world_ranking: 70 },
  'Marco Penge': { betting_odds: '+15000', world_ranking: 71 },
  'Carlos Ortiz': { betting_odds: '+15000', world_ranking: 72 },
  'Davis Riley': { betting_odds: '+10000', world_ranking: 73 },
  'Aldrich Potgieter': { betting_odds: '+12000', world_ranking: 74 },
  'Sami Valimaki': { betting_odds: '+12000', world_ranking: 75 },
  'Brian Campbell': { betting_odds: '+15000', world_ranking: 76 },
  'Naoyuki Kataoka': { betting_odds: '+20000', world_ranking: 77 },
  'Tom McKibbin': { betting_odds: '+10000', world_ranking: 78 },
  'Casey Jarvis': { betting_odds: '+20000', world_ranking: 79 },
  'Rasmus Neergaard-Petersen': { betting_odds: '+15000', world_ranking: 80 },
  'Matt McCarty': { betting_odds: '+12000', world_ranking: 81 },
  'Jake Knapp': { betting_odds: '+8000', world_ranking: 82 },
  'Johnny Keefer': { betting_odds: '+15000', world_ranking: 83 },
  'Michael Kim': { betting_odds: '+15000', world_ranking: 84 },
  'Haotong Li': { betting_odds: '+15000', world_ranking: 85 },
  'Bubba Watson': { betting_odds: '+25000', world_ranking: 86 },
  'Charl Schwartzel': { betting_odds: '+35000', world_ranking: 87 },
  'Zach Johnson': { betting_odds: '+40000', world_ranking: 88 },
  'Danny Willett': { betting_odds: '+50000', world_ranking: 89 },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pools = await base44.asServiceRole.entities.Pool.filter({});
    const pool = pools[0];
    if (!pool) return Response.json({ error: 'No pool found' }, { status: 404 });

    const golfers = await base44.asServiceRole.entities.Golfer.filter({ pool_id: pool.id });
    console.log(`Total golfers in pool: ${golfers.length}`);

    const deleted = [];
    const kept = [];
    const fixed = [];
    const seenNames = new Set();

    // Sort by created_date ascending so we keep the FIRST (original) copy
    golfers.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

    for (const g of golfers) {
      // Step 1: Delete if not in canonical field
      if (!CANONICAL_FIELD.has(g.name)) {
        await base44.asServiceRole.entities.Golfer.delete(g.id);
        deleted.push(g.name);
        continue;
      }

      // Step 2: Delete duplicates (keep the first one)
      if (seenNames.has(g.name)) {
        await base44.asServiceRole.entities.Golfer.delete(g.id);
        deleted.push(`${g.name} (duplicate)`);
        continue;
      }

      seenNames.add(g.name);

      // Step 3: Fix odds, ranking, and clear stale scores
      const canonical = CANONICAL_DATA[g.name];
      const updateData = {};
      let needsUpdate = false;

      if (canonical && g.betting_odds !== canonical.betting_odds) {
        updateData.betting_odds = canonical.betting_odds;
        needsUpdate = true;
      }
      if (canonical && g.world_ranking !== canonical.world_ranking) {
        updateData.world_ranking = canonical.world_ranking;
        needsUpdate = true;
      }

      // Clear any stale score data
      if (g.round_1 != null) { updateData.round_1 = null; needsUpdate = true; }
      if (g.round_2 != null) { updateData.round_2 = null; needsUpdate = true; }
      if (g.round_3 != null) { updateData.round_3 = null; needsUpdate = true; }
      if (g.round_4 != null) { updateData.round_4 = null; needsUpdate = true; }
      if (g.score_to_par !== 0 && g.score_to_par != null) { updateData.score_to_par = 0; needsUpdate = true; }
      if (g.actual_scores && g.actual_scores.length > 0) { updateData.actual_scores = []; needsUpdate = true; }
      if (g.position != null) { updateData.position = null; needsUpdate = true; }
      if (g.thru != null) { updateData.thru = null; needsUpdate = true; }

      if (needsUpdate) {
        await base44.asServiceRole.entities.Golfer.update(g.id, updateData);
        fixed.push(g.name);
      }

      kept.push(g.name);
    }

    // Step 4: Check if any canonical golfers are MISSING
    const missing = [];
    for (const name of CANONICAL_FIELD) {
      if (!seenNames.has(name)) {
        missing.push(name);
      }
    }

    console.log(`Deleted: ${deleted.length}, Kept: ${kept.length}, Fixed: ${fixed.length}, Missing: ${missing.length}`);

    return Response.json({
      success: true,
      pool_id: pool.id,
      total_before: golfers.length,
      deleted: deleted.length,
      deleted_names: deleted,
      kept: kept.length,
      fixed: fixed.length,
      fixed_names: fixed,
      missing_from_field: missing,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});