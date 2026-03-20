import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Trash2, User } from 'lucide-react';

export default function AdminEntryList({ poolId }) {
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['adminEntries', poolId],
    queryFn: () => base44.entities.PoolEntry.filter({ pool_id: poolId }),
    enabled: !!poolId,
  });

  const deleteEntry = useMutation({
    mutationFn: (id) => base44.entities.PoolEntry.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminEntries', poolId] }),
  });

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-8 text-sm">Loading participants...</div>;
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-primary/10 p-6 text-center">
        <User className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No participants yet. Add someone above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <span className="text-xs font-bold tracking-widest text-primary mb-2 block">
        PARTICIPANTS ({entries.length})
      </span>
      {entries.map((entry, i) => (
        <div key={entry.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2.5 border border-primary/10">
          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{entry.participant_name}</p>
            {entry.user_id && entry.user_id !== 'manual' && (
              <p className="text-xs text-muted-foreground truncate">{entry.user_id}</p>
            )}
          </div>
          <div className="text-right mr-2">
            <span className={`text-sm font-bold ${
              (entry.total_score || 0) < 0 ? 'text-red-600' : (entry.total_score || 0) > 0 ? 'text-primary' : 'text-accent'
            }`}>
              {(entry.total_score || 0) === 0 ? 'E' : (entry.total_score > 0 ? '+' : '') + entry.total_score}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => deleteEntry.mutate(entry.id)}>
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );
}