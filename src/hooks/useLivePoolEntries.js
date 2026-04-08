import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { enrichEntries, assignPositions } from '@/lib/scoreUtils';

export function useLivePoolEntries(poolId) {
  return useQuery({
    queryKey: ['livePoolEntries', poolId],
    queryFn: async () => {
      if (!poolId) return [];

      // Fetch entries and golfers in parallel (2 queries instead of 2 + 2*N)
      const [entries, golfers] = await Promise.all([
        base44.entities.PoolEntry.filter({ pool_id: poolId }),
        base44.entities.Golfer.filter({ pool_id: poolId }),
      ]);

      return assignPositions(enrichEntries(entries, golfers));
    },
    refetchInterval: 60000,
    enabled: !!poolId,
    retry: 2,
    retryDelay: 1000,
  });
}
