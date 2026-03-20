import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';

export default function AddEntryForm({ poolId }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const createEntry = useMutation({
    mutationFn: (data) => base44.entities.PoolEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEntries', poolId] });
      setName('');
      setEmail('');
      setOpen(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    createEntry.mutate({
      pool_id: poolId,
      participant_name: name.trim(),
      user_id: email.trim() || 'manual',
      total_score: 0,
      score_a: 0,
      score_b: 0,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-primary/10 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition"
      >
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm text-foreground">Add Participant</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3 border-t border-primary/10 pt-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Participant Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Smith" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Email (optional)</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" type="email" className="mt-1" />
          </div>
          <Button type="submit" disabled={createEntry.isPending} className="w-full bg-primary hover:bg-primary/90 text-white">
            {createEntry.isPending ? 'Adding...' : 'Add Participant'}
          </Button>
        </form>
      )}
    </div>
  );
}