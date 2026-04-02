import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, ChevronDown, ChevronUp, X, Users } from 'lucide-react';

export default function AddEntryForm({ poolId }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState([]);

  const { data: pool } = useQuery({
    queryKey: ['pool', poolId],
    queryFn: () => base44.entities.Pool.filter({ id: poolId }),
    enabled: !!poolId,
    select: (data) => data[0],
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['adminEntries', poolId],
    queryFn: () => base44.entities.PoolEntry.filter({ pool_id: poolId }),
    enabled: !!poolId,
  });

  const maxEntries = pool?.max_entries || 0;
  const atCapacity = maxEntries > 0 && entries.length >= maxEntries;

  const createEntry = useMutation({
    mutationFn: (data) => base44.entities.PoolEntry.create(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['adminEntries', poolId] });
      const previous = queryClient.getQueryData(['adminEntries', poolId]);
      queryClient.setQueryData(['adminEntries', poolId], (old = []) => [
        ...old,
        { ...newData, id: 'optimistic-' + Date.now(), created_date: new Date().toISOString() },
      ]);
      return { previous };
    },
    onError: (_err, _newData, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['adminEntries', poolId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEntries', poolId] });
    },
    onSuccess: () => {
      setName('');
      setTeamName('');
      setEmails([]);
      setEmailInput('');
      setOpen(false);
    },
  });

  const addEmail = () => {
    const trimmed = emailInput.trim();
    if (trimmed && !emails.includes(trimmed)) {
      setEmails([...emails, trimmed]);
      setEmailInput('');
    }
  };

  const removeEmail = (email) => {
    setEmails(emails.filter(e => e !== email));
  };

  const handleEmailKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && emailInput.trim()) {
      e.preventDefault();
      addEmail();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (atCapacity) return;

    const userId = emails.length > 0 ? emails.join(',') : 'manual';

    createEntry.mutate({
      pool_id: poolId,
      participant_name: name.trim(),
      team_name: teamName.trim() || null,
      user_id: userId,
      total_score: 0,
      score_a: 0,
      score_b: 0,
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
          <span className="font-bold text-sm text-foreground">Add Participant</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3 border-t border-primary/10 pt-3">
          {atCapacity && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-2 text-center">
              <p className="text-xs font-bold text-destructive">Pool Full — {maxEntries} max entries reached</p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Participant Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Smith" className="mt-1" />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" /> Team Name (optional)
            </label>
            <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder='e.g., "The Hackers"' className="mt-1" />
            <p className="text-[10px] text-muted-foreground mt-0.5">For groups splitting a single entry</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Team Member Emails</label>
            <div className="flex gap-1 mt-1">
              <Input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleEmailKeyDown}
                placeholder="Add email, press Enter"
                type="text"
                className="flex-1"
              />
              <Button type="button" onClick={addEmail} variant="outline" size="sm" className="px-3">
                <Plus className="w-3 h-3" />
              </Button>
            </div>

            {emails.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {emails.map((email) => (
                  <span key={email} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full border border-primary/20">
                    {email}
                    <button type="button" onClick={() => removeEmail(email)} className="hover:text-destructive transition">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {emails.length === 0 ? 'Add emails for each team member' : `${emails.length} member${emails.length > 1 ? 's' : ''}`}
            </p>
          </div>

          <Button type="submit" disabled={createEntry.isPending || atCapacity || !name.trim()} className="w-full bg-primary hover:bg-primary/90 text-white">
            {createEntry.isPending ? 'Adding...' : 'Add Participant'}
          </Button>
        </form>
      )}
    </div>
  );
}