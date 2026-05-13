import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Applies the hat draw assignments from a payload.
 * Matches participant names to entries and golfer names to golfer records,
 * then updates each entry with the correct golfer_a_id and golfer_b_id.
 * 
 * Payload: { poolId: string, assignments: [{ participant, golferA, golferB }] }
 */

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

    const body = await req.json();
    const { poolId, assignments } = body;

    if (!poolId || !assignments || !Array.isArray(assignments)) {
      return Response.json({ error: 'poolId and assignments array required' }, { status: 400 });
    }

    // Verify admin owns this pool
    const pool = await base44.asServiceRole.entities.Pool.get(poolId);
    if (!pool || pool.admin_user_id !== user.email) {
      return Response.json({ error: 'Forbidden: you do not own this pool' }, { status: 403 });
    }

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

    for (const assignment of assignments) {
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