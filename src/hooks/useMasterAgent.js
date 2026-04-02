import { useState, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Hook to interact with the Master Agent backend function.
 * Provides methods to start/stop automations, poll scores,
 * run diagnostics, and fetch agent status.
 */
export function useMasterAgent() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollingRef = useRef(null);

  const callAgent = useCallback(async (action, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await base44.functions.invoke('masterAgent', {
        action,
        params,
      });
      setStatus(result);
      return result;
    } catch (err) {
      const msg = err?.message || 'Agent request failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await base44.functions.invoke('masterAgent', {
        action: 'status',
      });
      setStatus(result);
      return result;
    } catch (err) {
      setError(err?.message || 'Failed to fetch agent status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const start = useCallback(() => callAgent('start'), [callAgent]);
  const stop = useCallback(() => callAgent('stop'), [callAgent]);
  const pollNow = useCallback(() => callAgent('pollNow'), [callAgent]);
  const diagnose = useCallback(() => callAgent('diagnose'), [callAgent]);
  const summary = useCallback(() => callAgent('summary'), [callAgent]);
  const setPhase = useCallback((phase) => callAgent('setPhase', { phase }), [callAgent]);

  // Auto-polling: start periodic status checks
  const startAutoRefresh = useCallback((intervalMs = 30000) => {
    stopAutoRefresh();
    pollingRef.current = setInterval(() => {
      fetchStatus().catch(() => {});
    }, intervalMs);
  }, [fetchStatus]);

  const stopAutoRefresh = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  return {
    status,
    loading,
    error,
    fetchStatus,
    start,
    stop,
    pollNow,
    diagnose,
    summary,
    setPhase,
    startAutoRefresh,
    stopAutoRefresh,
  };
}
