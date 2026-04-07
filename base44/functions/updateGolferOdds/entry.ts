import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Updates all golfer odds in the active pool based on latest BetMGM odds (April 4, 2026).
 * Also adds new golfers and marks removed ones as withdrawn.
 */

const LATEST_ODDS = {
  'Scottie Scheffler': '+500',
  'Bryson DeChambeau': '+1000',
  'Jon Rahm': '+1100',
  'Rory McIlroy': '+1100',
  'Xander Schauffele': '+1400',
  'Ludvig Åberg': '+1600',
  'Cameron Young': '+2200',
  'Matt Fitzpatrick': '+2200',
  'Tommy Fleetwood': '+2200',
  'Collin Morikawa': '+3000',
  'Brooks Koepka': '+3300',
  'Justin Rose': '+3300',
  'Patrick Reed': '+3300',
  'Robert MacIntyre': '+3300',
  'Hideki Matsuyama': '+3500',
  'Jordan Spieth': '+3500',
  'Min Woo Lee': '+4000',
  'Viktor Hovland': '+4000',
  'Chris Gotterup': '+5000',
  'Akshay Bhatia': '+5500',
  'Justin Thomas': '+5500',
  'Russell Henley': '+5500',
  'Patrick Cantlay': '+6000',
  'Sepp Straka': '+6000',
  'Tyrrell Hatton': '+6000',
  'Adam Scott': '+6600',
  'Corey Conners': '+6600',
  'Jason Day': '+6600',
  'Si Woo Kim': '+6600',
  'Jake Knapp': '+6600',
  'Sam Burns': '+6600',
  'Shane Lowry': '+6600',
  'Cameron Smith': '+8000',
  'Nicolai Hojgaard': '+8000',
  'Jacob Bridgeman': '+8000',
  'Marco Penge': '+9000',
  'Gary Woodland': '+9000',
  'Harris English': '+10000',
  'Maverick McNealy': '+10000',
  'Sungjae Im': '+10000',
  'Max Homa': '+10000',
  'Daniel Berger': '+12500',
  'J.J. Spaun': '+12500',
  'Ben Griffin': '+12500',
  'Kurt Kitayama': '+12500',
  'Dustin Johnson': '+15000',
  'Keegan Bradley': '+15000',
  'Rasmus Hojgaard': '+15000',
  'Wyndham Clark': '+15000',
  'Ryan Fox': '+15000',
  'Ryan Gerard': '+15000',
  'Casey Jarvis': '+15000',
  'Aaron Rai': '+17500',
  'Brian Harman': '+17500',
  'Matt McCarty': '+17500',
  'Sergio Garcia': '+17500',
  'Alex Noren': '+17500',
  'Max Greyserman': '+20000',
  'Harry Hall': '+20000',
  'Tom McKibbin': '+20000',
  'Carlos Ortiz': '+22500',
  'Nick Taylor': '+25000',
  'Nico Echavarria': '+25000',
  'Haotong Li': '+25000',
  'Johnny Keefer': '+25000',
  'Rasmus Neergaard-Petersen': '+25000',
  'Sam Stevens': '+25000',
  'Michael Kim': '+30000',
  'Aldrich Potgieter': '+30000',
  'Andrew Novak': '+30000',
  'Kristoffer Reitan': '+30000',
  'Michael Brennan': '+30000',
  'Bubba Watson': '+35000',
  'Sami Valimaki': '+35000',
  'Charl Schwartzel': '+40000',
  'Davis Riley': '+40000',
  'Zach Johnson': '+50000',
  'Brian Campbell': '+75000',
  'Danny Willett': '+75000',
  'Naoyuki Kataoka': '+100000',
  'Fifa Laopakdee': '+100000',
  'Mason Howell': '+100000',
  'Ethan Fang': '+150000',
  'Brandon Holtz': '+200000',
  'Jackson Herrington': '+200000',
  'Mateo Pulcini': '+200000',
};

// Players no longer in the 2026 field
const REMOVED_PLAYERS = [
  'Tony Finau', 'Tom Kim', 'Nick Dunlap', 'Phil Mickelson',
  'Sahith Theegala', 'Davis Thompson', 'Billy Horschel',
  'Denny McCarthy', 'Chris Kirk', 'Joaquín Niemann',
];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Find the active pool
    const pools = await base44.asServiceRole.entities.Pool.filter({});
    const pool = pools[0];
    if (!pool) {
      return Response.json({ error: 'No pool found' }, { status: 404 });
    }

    const poolId = pool.id;
    const golfers = await base44.asServiceRole.entities.Golfer.filter({ pool_id: poolId });

    let updated = 0;
    let withdrawn = 0;
    let added = 0;

    // Build name→golfer map
    const golferMap = {};
    for (const g of golfers) {
      golferMap[g.name.toLowerCase()] = g;
    }

    // Update existing golfer odds
    for (const [name, odds] of Object.entries(LATEST_ODDS)) {
      const key = name.toLowerCase();
      const existing = golferMap[key];
      if (existing) {
        if (existing.betting_odds !== odds) {
          await base44.asServiceRole.entities.Golfer.update(existing.id, { betting_odds: odds });
          updated++;
        }
      } else {
        // Add new golfer
        await base44.asServiceRole.entities.Golfer.create({
          pool_id: poolId,
          name: name,
          betting_odds: odds,
          group: 'B',
          status: 'active',
          score_to_par: 0,
        });
        added++;
      }
    }

    // Mark removed players as withdrawn
    for (const name of REMOVED_PLAYERS) {
      const key = name.toLowerCase();
      const existing = golferMap[key];
      if (existing && existing.status !== 'withdrawn') {
        await base44.asServiceRole.entities.Golfer.update(existing.id, { status: 'withdrawn' });
        withdrawn++;
      }
    }

    return Response.json({
      message: 'Odds updated successfully',
      updated,
      added,
      withdrawn,
      total_golfers: golfers.length + added,
    });
  } catch (error) {
    console.error('Error updating odds:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});