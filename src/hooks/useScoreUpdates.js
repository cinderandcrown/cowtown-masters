import { useEffect, useState, useCallback, useRef } from 'react';

const BACKOFF_SCHEDULE = [5000, 10000, 20000, 40000, 60000];
const MAX_RETRIES = 5;

export function useScoreUpdates(poolId) {
  const [golfers, setGolfers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const retryCount = useRef(0);

  useEffect(() => {
    if (!poolId) return;

    let eventSource = null;
    let reconnectTimeout = null;

    const connect = () => {
      try {
        const url = `/scoreBroadcast?poolId=${encodeURIComponent(poolId)}`;
        eventSource = new EventSource(url);

        eventSource.addEventListener('open', () => {
          setIsConnected(true);
          setError(null);
          retryCount.current = 0;
        });

        eventSource.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'scoreUpdate') {
              setGolfers(data.golfers || []);
              setLastUpdate(data.timestamp);
              setError(null);
            }
          } catch (_) { /* ignore parse errors */ }
        });

        eventSource.addEventListener('error', () => {
          setIsConnected(false);
          eventSource?.close();

          if (retryCount.current >= MAX_RETRIES) {
            setError('Live scores unavailable. Pull to refresh for latest scores.');
            return;
          }

          const delay = BACKOFF_SCHEDULE[retryCount.current] || 60000;
          retryCount.current += 1;
          setError('Connection lost. Reconnecting...');
          reconnectTimeout = setTimeout(connect, delay);
        });
      } catch (_) {
        setError('Live scores unavailable. Pull to refresh for latest scores.');
      }
    };

    connect();

    return () => {
      eventSource?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [poolId]);

  const refetch = useCallback(async () => {
    try {
      await fetch(`/functions/scorePolling`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (_) { /* silent */ }
  }, []);

  return { golfers, isConnected, lastUpdate, error, refetch };
}