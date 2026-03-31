import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';

export default function AddGolferForm({ poolId }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [odds, setOdds] = useState('');
  const [ranking, setRanking] = useState('');

  const createGolfer = useMutation({
    mutationFn: (data) => base44.entities.Golfer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminGolfers', poolId] });
      setName('');
      setOdds('');
      setRanking('');
      setOpen(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    createGolfer.mutate({
      pool_id: poolId,
      name: name.trim(),
      group: 'A',
      betting_odds: odds || undefined,
      world_ranking: ranking ? Number(ranking) : undefined,
      score_to_par: 0,
      status: 'active',
    });
  };

  return (
    <div className="bg-card rounded-xl border border-primary/10 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition"
      >
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm text-foreground">Add Golfer</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3 border-t border-primary/10 pt-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Golfer Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Scottie Scheffler" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Odds</label>
              <Input value={odds} onChange={(e) => setOdds(e.target.value)} placeholder="+1400" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Ranking</label>
              <Input type="number" value={ranking} onChange={(e) => setRanking(e.target.value)} placeholder="1" className="mt-1" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Group is assigned automatically based on odds and participant count.</p>
          <Button type="submit" disabled={createGolfer.isPending} className="w-full bg-primary hover:bg-primary/90 text-white">
            {createGolfer.isPending ? 'Adding...' : 'Add Golfer'}
          </Button>
        </form>
      )}
    </div>
  );
}