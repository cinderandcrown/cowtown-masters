import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// In-memory store for SSE clients (in production, use Redis for multi-server setup)
const clients = new Map();

Deno.serve(async (req) => {
  // GET /scoreBroadcast?poolId=xxx — Subscribe to live score updates
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url);
      const poolId = url.searchParams.get('poolId');

      if (!poolId) {
        return Response.json({ error: 'poolId required' }, { status: 400 });
      }

      const base44 = createClientFromRequest(req);
      const user = await base44.auth.me();

      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Create SSE response stream
      const stream = new ReadableStream({
        start(controller) {
          const clientId = `${poolId}-${user.id}-${Date.now()}`;

          // Store this client
          if (!clients.has(poolId)) {
            clients.set(poolId, []);
          }
          clients.get(poolId).push({ clientId, controller });

          // Send initial connection message
          controller.enqueue(
            `data: ${JSON.stringify({ type: 'connected', poolId, timestamp: new Date().toISOString() })}\n\n`
          );

          // Cleanup on disconnect
          const cleanup = () => {
            const pool = clients.get(poolId) || [];
            const idx = pool.findIndex((c) => c.clientId === clientId);
            if (idx > -1) pool.splice(idx, 1);
            if (pool.length === 0) clients.delete(poolId);
          };

          req.signal?.addEventListener('abort', cleanup);
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      console.error('SSE subscribe error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  // POST /scoreBroadcast — Broadcast score updates to all clients
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { poolId, golfers } = body;

      if (!poolId || !golfers) {
        return Response.json({ error: 'poolId and golfers required' }, { status: 400 });
      }

      const pool = clients.get(poolId) || [];
      const message = JSON.stringify({ type: 'scoreUpdate', golfers, timestamp: new Date().toISOString() });

      // Broadcast to all connected clients
      let sent = 0;
      for (const client of pool) {
        try {
          client.controller.enqueue(`data: ${message}\n\n`);
          sent++;
        } catch (e) {
          console.error(`Failed to send to ${client.clientId}:`, e.message);
        }
      }

      return Response.json({ success: true, sent, total: pool.length, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Broadcast error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
});