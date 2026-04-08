import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Applies the hat draw assignments from the spreadsheet.
 * Matches participant names to entries and golfer names to golfer records,
 * then updates each entry with the correct golfer_a_id and golfer_b_id.
 */

const DRAW_ASSIGNMENTS = [
  { participant: 'Robert Carlyle', golferA: 'Ludvig Åberg', golferB: 'Sungjae Im' },
  { participant: 'Charlie Brown', golferA: 'Jon Rahm', golferB: 'Gary Woodland' },
  { participant: 'Austin and Chase', golferA: 'Jason Day', golferB: 'Aaron Rai' },
  { participant: 'Matt Fleske', golferA: 'Jordan Spieth', golferB: 'Casey Jarvis' },
  { participant: 'Jonathon Tobias', golferA: 'Tommy Fleetwood', golferB: 'Tom McKibbin' },
  { participant: 'Matt Powell', golferA: 'Rory McIlroy', golferB: 'Rasmus Højgaard' },
  { participant: 'James Pool', golferA: 'Si Woo Kim', golferB: 'Ben Griffin' },
  { participant: 'Cary Lott', golferA: 'Bryson DeChambeau', golferB: 'Sergio Garcia' },
  { participant: 'Mark Palmieri', golferA: 'Tyrrell Hatton', golferB: 'Nico Echavarria' },
  { participant: 'Jackson Vickers', golferA: 'Sepp Straka', golferB: 'Corey Conners' },
  { participant: 'John Dowling', golferA: 'Viktor Hovland', golferB: 'Ryan Gerard' },
  { participant: 'Nicholas Will', golferA: 'Robert MacIntyre', golferB: 'Jacob Bridgeman' },
  { participant: 'Daniel Kelley', golferA: 'Jake Knapp', golferB: 'Matt McCarty' },
  { participant: 'Andrew Audet', golferA: 'Scottie Scheffler', golferB: 'Ryan Fox' },
  { participant: 'Mitchell Belew', golferA: 'Hideki Matsuyama', golferB: 'Max Homa' },
  { participant: 'Corey Platt', golferA: 'Collin Morikawa', golferB: 'Harry Hall' },
  { participant: 'Gilbert Gamez', golferA: 'Xander Schauffele', golferB: 'Cameron Smith' },
  { participant: 'Thomas Owings', golferA: 'Justin Rose', golferB: 'Daniel Berger' },
  { participant: 'Howard Kane', golferA: 'Cameron Young', golferB: 'Dustin Johnson' },
  { participant: 'Joseph Cook', golferA: 'Chris Gotterup', golferB: 'Wyndham Clark' },
  { participant: 'Blake Watkins', golferA: 'Akshay Bhatia', golferB: 'Brian Harman' },
  { participant: 'Christopher Costanza', golferA: 'Patrick Cantlay', golferB: 'Kurt Kitayama' },
  { participant: 'Adam Tepe', golferA: 'Min Woo Lee', golferB: 'Harris English' },
  { participant: 'Zac Gordon', golferA: 'Matt Fitzpatrick', golferB: 'Marco Penge' },
  { participant: 'Tyler Page', golferA: 'Shane Lowry', golferB: 'Alex Norén' },
  { participant: 'Zac Hansen', golferA: 'Patrick Reed', golferB: 'Nicolai Højgaard' },
  { participant: 'Sanders Johnston', golferA: 'Adam Scott', golferB: 'Sam Burns' },
  { participant: 'Clay Collier', golferA: 'Justin Thomas', golferB: 'Keegan Bradley' },
  { participant: 'Colby Amescua', golferA: 'Brooks Koepka', golferB: 'J.J. Spaun' },
  { participant: 'Wes Odom', golferA: 'Russell Henley', golferB: 'Maverick McNealy' },
];

function normalize(name) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const poolId = '69bd9d27b34b8e72c31d7bf3';

    // Fetch all entries and golfers
    const entries = await base44.asServiceRole.entities.PoolEntry.filter({ pool_id: poolId });
    const golfers = await base44.asServiceRole.entities.Golfer.filter({ pool_id: poolId });

    // Build lookup maps by normalized name
    const entryMap = {};
    for (const e of entries) {
      entryMap[normalize(e.participant_name)] = e;
    }

    const golferMap = {};
    for (const g of golfers) {
      golferMap[normalize(g.name)] = g;
    }

    const results = [];
    const errors = [];

    for (const assignment of DRAW_ASSIGNMENTS) {
      const entry = entryMap[normalize(assignment.participant)];
      const golferA = golferMap[normalize(assignment.golferA)];
      const golferB = golferMap[normalize(assignment.golferB)];

      if (!entry) {
        errors.push(`Entry not found: "${assignment.participant}"`);
        continue;
      }
      if (!golferA) {
        errors.push(`Golfer A not found: "${assignment.golferA}"`);
        continue;
      }
      if (!golferB) {
        errors.push(`Golfer B not found: "${assignment.golferB}"`);
        continue;
      }

      // Update entry with golfer assignments
      await base44.asServiceRole.entities.PoolEntry.update(entry.id, {
        golfer_a_id: golferA.id,
        golfer_b_id: golferB.id,
      });

      // Mark golfers as drafted
      await base44.asServiceRole.entities.Golfer.update(golferA.id, {
        is_drafted: true,
        drafted_by: entry.id,
      });
      await base44.asServiceRole.entities.Golfer.update(golferB.id, {
        is_drafted: true,
        drafted_by: entry.id,
      });

      results.push({
        participant: assignment.participant,
        golferA: golferA.name,
        golferB: golferB.name,
      });
    }

    return Response.json({
      success: true,
      assigned: results.length,
      errors,
      assignments: results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});