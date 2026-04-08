import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { assignGroups } from '@/lib/groupUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminGolferList({ poolId }) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [expandedGroup, setExpandedGroup] = useState('A');

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
      queryClient.invalidateQueries({ queryKey: ['poolGolfers', poolId] });
      setEditingId(null);
      toast.success('Golfer updated');
    },
    onError: (err) => toast.error('Failed to update golfer: ' + (err?.message || 'Unknown error')),
  });

  const startEdit = (golfer) => {
    setEditingId(golfer.id);
    setEditData({
      betting_odds: golfer.betting_odds || '',
      score_to_par: golfer.score_to_par || 0,
      round_1: golfer.round_1,
      round_2: golfer.round_2,
      round_3: golfer.round_3,
      round_4: golfer.round_4,
      status: golfer.status || 'active',
    });
  };

  const saveEdit = (id) => {
    const total = [editData.round_1, editData.round_2, editData.round_3, editData.round_4]
      .filter(r => r != null)
      .reduce((sum, r) => sum + r, 0);
    updateGolfer.mutate({
      id,
      data: {
        ...editData,
        betting_odds: editData.betting_odds || '',
        round_1: editData.round_1 != null ? Number(editData.round_1) : null,
        round_2: editData.round_2 != null ? Number(editData.round_2) : null,
        round_3: editData.round_3 != null ? Number(editData.round_3) : null,
        round_4: editData.round_4 != null ? Number(editData.round_4) : null,
        score_to_par: total,
      },
    });
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-8 text-sm">Loading golfers...</div>;
  }

  const groupA = golfers.filter(g => g.group === 'A');
  const groupB = golfers.filter(g => g.group === 'B');

  const renderGroup = (label, list, color, groupKey) => {
    const isExpanded = expandedGroup === groupKey;
    return (
      <div className="bg-card rounded-xl border border-primary/10 overflow-hidden">
        <button
          onClick={() => setExpandedGroup(isExpanded ? null : groupKey)}
          className="w-full flex items-center justify-between px-4 py-3 bg-primary/5 hover:bg-primary/10 transition"
        >
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold tracking-widest ${color}`}>{label}</span>
            <span className="text-xs text-muted-foreground">({list.length})</span>
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {isExpanded && (
          <div className="divide-y divide-primary/5">
            {list.map((g) => (
              <div key={g.id} className="px-3 py-2">
                {editingId === g.id ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{g.name}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => saveEdit(g.id)}>
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}>
                          <X className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {['round_1', 'round_2', 'round_3', 'round_4'].map((key, j) => (
                        <div key={key}>
                          <label className="text-[10px] font-semibold text-muted-foreground">R{j + 1}</label>
                          <Input
                            type="number"
                            value={editData[key] ?? ''}
                            onChange={(e) => setEditData({ ...editData, [key]: e.target.value === '' ? null : Number(e.target.value) })}
                            className="h-7 text-xs"
                            placeholder="—"
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground">Betting Odds</label>
                      <Input
                        value={editData.betting_odds}
                        onChange={(e) => setEditData({ ...editData, betting_odds: e.target.value })}
                        className="h-7 text-xs"
                        placeholder="+1400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground">Status</label>
                      <Select value={editData.status} onValueChange={(v) => setEditData({ ...editData, status: v })}>
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="cut">Cut</SelectItem>
                          <SelectItem value="withdrawn">Withdrawn</SelectItem>
                          <SelectItem value="disqualified">Disqualified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{g.name}</p>
                      <div className="flex gap-2 text-[10px] text-muted-foreground">
                        <span>{g.betting_odds}</span>
                        {g.status !== 'active' && <span className="text-destructive font-bold uppercase">{g.status}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 text-[10px] text-muted-foreground tabular-nums">
                      {[g.round_1, g.round_2, g.round_3, g.round_4].map((r, j) => (
                        <span key={j} className="w-6 text-center">{r != null ? (r > 0 ? `+${r}` : r === 0 ? 'E' : r) : '–'}</span>
                      ))}
                    </div>
                    <span className={`text-xs font-black w-8 text-center tabular-nums ${(g.score_to_par || 0) < 0 ? 'text-red-600' : (g.score_to_par || 0) > 0 ? 'text-foreground' : 'text-accent'}`}>
                      {(g.score_to_par || 0) === 0 ? 'E' : (g.score_to_par > 0 ? '+' : '') + g.score_to_par}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(g)}>
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground text-center">
        {rawGolfers.length} golfers · Top {entries.length || '—'} by odds → Group A
      </p>
      {renderGroup('GROUP A — Favorites', groupA, 'text-primary', 'A')}
      {renderGroup('GROUP B — Longshots', groupB, 'text-accent', 'B')}
    </div>
  );
}