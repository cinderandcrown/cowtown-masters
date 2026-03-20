import { useEffect, useState, useCallback } from 'react';

export function useScoreUpdates(poolId) {
  const [golfers, setGolfers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!poolId) return;

    let eventSource = null;
    let reconnectTimeout = null;

    const connect = () => {
      try {
        // Connect to SSE endpoint
        const url = `/scoreBroadcast?poolId=${encodeURIComponent(poolId)}`;
        eventSource = new EventSource(url);

        eventSource.addEventListener('open', () => {
          setIsConnected(true);
          setError(null);
        });

        eventSource.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'connected') {
              console.log('SSE connected to pool:', poolId);
            } else if (data.type === 'scoreUpdate') {
              // Update golfer data
              setGolfers(data.golfers || []);
              setLastUpdate(data.timestamp);
              setError(null);
            }
          } catch (e) {
            console.error('Failed to parse SSE message:', e);
          }
        });

        eventSource.addEventListener('error', (e) => {
          console.error('SSE connection error:', e);
          setIsConnected(false);
          setError('Connection lost. Reconnecting...');
          eventSource?.close();

          // Auto-reconnect after 5 seconds
          reconnectTimeout = setTimeout(connect, 5000);
        });
      } catch (e) {
        console.error('SSE setup error:', e);
        setError(e.message);
      }
    };

    connect();

    // Cleanup on unmount
    return () => {
      eventSource?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [poolId]);

  const refetch = useCallback(async () => {
    try {
      // For testing: manually trigger a score update
      const response = await fetch(`/functions/scorePolling`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      console.log('Manual refetch:', data);
    } catch (e) {
      console.error('Refetch error:', e);
    }
  }, []);

  return { golfers, isConnected, lastUpdate, error, refetch };
}