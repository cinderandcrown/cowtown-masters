import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { assignGroups } from '@/lib/groupUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Pencil, X, Check } from 'lucide-react';

export default function AdminGolferList({ poolId }) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const { data: rawGolfers = [], isLoading } = useQuery({
    queryKey: ['adminGolfers', poolId],
    queryFn: () => base44.entities.Golfer.filter({ pool_id: poolId }),
    enabled: !!poolId,
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['poolEntries', poolId],
    queryFn: () => base44.entities.PoolEntry.filter({ pool_id: poolId }),
    enabled: !!poolId,
  });

  const golfers = assignGroups(rawGolfers, entries.length);

  const updateGolfer = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Golfer.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminGolfers', poolId] });
      setEditingId(null);
    },
  });

  const deleteGolfer = useMutation({
    mutationFn: (id) => base44.entities.Golfer.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminGolfers', poolId] }),
  });

  const startEdit = (golfer) => {
    setEditingId(golfer.id);
    setEditData({ name: golfer.name, score_to_par: golfer.score_to_par || 0, betting_odds: golfer.betting_odds || '' });
  };

  const saveEdit = (id) => {
    updateGolfer.mutate({ id, data: { ...editData, score_to_par: Number(editData.score_to_par) } });
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-8 text-sm">Loading golfers...</div>;
  }

  const groupA = golfers.filter((g) => g.group === 'A');
  const groupB = golfers.filter((g) => g.group === 'B');

  const renderGroup = (label, list, color) => (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-bold tracking-widest ${color}`}>{label}</span>
        <span className="text-xs text-muted-foreground">({list.length} golfers)</span>
      </div>
      {list.length === 0 ? (
        <p className="text-xs text-muted-foreground bg-white rounded-lg p-3 border border-primary/10">No golfers in this group yet.</p>
      ) : (
        <div className="space-y-1">
          {list.map((g) => (
            <div key={g.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-primary/10">
              {editingId === g.id ? (
                <>
                  <Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="h-7 text-sm flex-1" />
                  <Input value={editData.score_to_par} onChange={(e) => setEditData({ ...editData, score_to_par: e.target.value })} type="number" className="h-7 text-sm w-16" />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => saveEdit(g.id)}>
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}>
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-sm font-semibold flex-1 truncate">{g.name}</span>
                  <span className="text-xs text-muted-foreground">{g.betting_odds || '—'}</span>
                  <span className={`text-xs font-bold w-10 text-center ${(g.score_to_par || 0) < 0 ? 'text-red-600' : (g.score_to_par || 0) > 0 ? 'text-primary' : 'text-accent'}`}>
                    {(g.score_to_par || 0) === 0 ? 'E' : (g.score_to_par > 0 ? '+' : '') + g.score_to_par}
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(g)}>
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteGolfer.mutate(g.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground text-center">
        Groups are dynamic: Top {entries.length || 0} golfer{entries.length !== 1 ? 's' : ''} by odds → Group A, rest → Group B
      </p>
      {renderGroup('GROUP A — Favorites', groupA, 'text-primary')}
      {renderGroup('GROUP B — Longshots', groupB, 'text-accent')}
    </div>
  );
}