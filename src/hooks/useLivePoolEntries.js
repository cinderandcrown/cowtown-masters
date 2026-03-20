import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useLivePoolEntries(poolId) {
  return useQuery({
    queryKey: ['poolEntries', poolId],
    queryFn: async () => {
      if (!poolId) return [];

      // Get all entries for this pool
      const entries = await base44.entities.PoolEntry.filter({ pool_id: poolId });

      // Calculate current scores from linked golfers
      const enrichedEntries = await Promise.all(
        entries.map(async (entry) => {
          let scoreA = 0, scoreB = 0;

          if (entry.golfer_a_id) {
            try {
              const golferA = await base44.entities.Golfer.get(entry.golfer_a_id);
              scoreA = golferA.score_to_par || 0;
            } catch (e) {
              console.error('Error fetching golfer A:', e);
            }
          }

          if (entry.golfer_b_id) {
            try {
              const golferB = await base44.entities.Golfer.get(entry.golfer_b_id);
              scoreB = golferB.score_to_par || 0;
            } catch (e) {
              console.error('Error fetching golfer B:', e);
            }
          }

          return {
            ...entry,
            score_a: scoreA,
            score_b: scoreB,
            total_score: scoreA + scoreB,
          };
        })
      );

      // Sort by total score (lowest wins)
      return enrichedEntries.sort((a, b) => a.total_score - b.total_score);
    },
    refetchInterval: 60000, // Refetch every 60 seconds
    enabled: !!poolId,
  });
}