import { useEffect, useState, useCallback, useRef } from 'react';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 5000;
const MAX_DELAY_MS = 60000;

export function useScoreUpdates(poolId) {
  const [golfers, setGolfers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const retryCountRef = useRef(0);

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
          retryCountRef.current = 0; // Reset on successful connection
        });

        eventSource.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'scoreUpdate') {
              setGolfers(data.golfers || []);
              setLastUpdate(data.timestamp);
              setError(null);
            }
          } catch {
            // Ignore unparseable messages
          }
        });

        eventSource.addEventListener('error', () => {
          setIsConnected(false);
          eventSource?.close();

          if (retryCountRef.current < MAX_RETRIES) {
            const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCountRef.current), MAX_DELAY_MS);
            retryCountRef.current += 1;
            setError(`Connection lost. Retrying in ${Math.round(delay / 1000)}s...`);
            reconnectTimeout = setTimeout(connect, delay);
          } else {
            setError('Live scores unavailable. Pull to refresh for latest scores.');
          }
        });
      } catch (e) {
        setError(e.message);
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
      const response = await fetch(`/functions/scorePolling`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      await response.json();
    } catch {
      // Silently fail — scores will update on next poll cycle
    }
  }, []);

  return { golfers, isConnected, lastUpdate, error, refetch };
}