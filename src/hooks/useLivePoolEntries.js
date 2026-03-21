import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useLivePoolEntries(poolId) {
  return useQuery({
    queryKey: ['poolEntries', poolId],
    queryFn: async () => {
      if (!poolId) return [];

      // Fetch entries and all golfers in parallel (2 requests instead of N+1)
      const [entries, golfers] = await Promise.all([
        base44.entities.PoolEntry.filter({ pool_id: poolId }),
        base44.entities.Golfer.filter({ pool_id: poolId }),
      ]);

      // Build a lookup map for O(1) golfer access
      const golferMap = {};
      for (const g of golfers) golferMap[g.id] = g;

      // Enrich entries with scores from the golfer map
      const enrichedEntries = entries.map((entry) => {
        const scoreA = entry.golfer_a_id ? (golferMap[entry.golfer_a_id]?.score_to_par || 0) : 0;
        const scoreB = entry.golfer_b_id ? (golferMap[entry.golfer_b_id]?.score_to_par || 0) : 0;
        return {
          ...entry,
          score_a: scoreA,
          score_b: scoreB,
          total_score: scoreA + scoreB,
        };
      });

      // Sort by total score (lowest wins)
      return enrichedEntries.sort((a, b) => a.total_score - b.total_score);
    },
    refetchInterval: 60000,
    enabled: !!poolId,
  });
}