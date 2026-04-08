import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, User, Users, Pencil, Check, X, Plus, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { parseTeamEmails } from '@/lib/scoreUtils';

export default function AdminEntryList({ poolId }) {
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ participant_name: '', team_name: '', emails: [] });
  const [emailInput, setEmailInput] = useState('');

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['adminEntries', poolId],
    queryFn: () => base44.entities.PoolEntry.filter({ pool_id: poolId }),
    enabled: !!poolId,
  });

  const deleteEntry = useMutation({
    mutationFn: (id) => base44.entities.PoolEntry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEntries', poolId] });
      toast.success('Entry deleted');
    },
    onError: (err) => toast.error('Failed to delete entry: ' + (err?.message || 'Unknown error')),
  });

  const resetPassword = useMutation({
    mutationFn: async (entryId) => {
      const auths = await base44.entities.ParticipantAuth.filter({ entry_id: entryId });
      await Promise.all(auths.map(a => base44.entities.ParticipantAuth.delete(a.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEntries', poolId] });
      toast.success('Password reset');
    },
    onError: (err) => toast.error('Failed to reset password: ' + (err?.message || 'Unknown error')),
  });

  const updateEntry = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PoolEntry.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEntries', poolId] });
      queryClient.invalidateQueries({ queryKey: ['poolEntries', poolId] });
      setEditingId(null);
      setEmailInput('');
      toast.success('Entry updated');
    },
    onError: (err) => toast.error('Failed to update entry: ' + (err?.message || 'Unknown error')),
  });

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setEditValues({
      participant_name: entry.participant_name || '',
      team_name: entry.team_name || '',
      emails: parseTeamEmails(entry.user_id),
    });
    setEmailInput('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEmailInput('');
  };

  const saveEdit = (id) => {
    if (!editValues.participant_name.trim()) return;
    updateEntry.mutate({
      id,
      data: {
        participant_name: editValues.participant_name.trim(),
        team_name: editValues.team_name.trim() || '',
        user_id: editValues.emails.length > 0 ? editValues.emails.join(',') : 'manual',
      },
    });
  };

  const addEditEmail = () => {
    const trimmed = emailInput.trim();
    if (trimmed && !editValues.emails.includes(trimmed)) {
      setEditValues({ ...editValues, emails: [...editValues.emails, trimmed] });
      setEmailInput('');
    }
  };

  const removeEditEmail = (email) => {
    setEditValues({ ...editValues, emails: editValues.emails.filter(e => e !== email) });
  };

  const handleEditEmailKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && emailInput.trim()) {
      e.preventDefault();
      addEditEmail();
    }
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-8 text-sm">Loading participants...</div>;
  }

  if (entries.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-primary/10 p-6 text-center">
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
      {entries.map((entry, i) => {
        const teamEmails = parseTeamEmails(entry.user_id);
        const isTeam = teamEmails.length > 1;
        const isEditing = editingId === entry.id;

        if (isEditing) {
          return (
            <div key={entry.id} className="bg-card rounded-lg px-3 py-3 border border-accent/30 animate-fade-in-up">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-accent tracking-widest uppercase">Editing</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => saveEdit(entry.id)}
                    disabled={updateEntry.isPending}
                  >
                    <Check className="w-4 h-4 text-green-600" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEdit}>
                    <X className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground mb-0.5 block">Name</label>
                  <Input
                    value={editValues.participant_name}
                    onChange={(e) => setEditValues({ ...editValues, participant_name: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground mb-0.5 block">Team Name</label>
                  <Input
                    value={editValues.team_name}
                    onChange={(e) => setEditValues({ ...editValues, team_name: e.target.value })}
                    className="h-8 text-sm"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground mb-0.5 block">Emails</label>
                  <div className="flex gap-1">
                    <Input
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyDown={handleEditEmailKeyDown}
                      placeholder="Add email, press Enter"
                      className="h-8 text-sm flex-1"
                    />
                    <Button type="button" onClick={addEditEmail} variant="outline" size="sm" className="h-8 px-2">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  {editValues.emails.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {editValues.emails.map((email) => (
                        <span key={email} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-primary/20">
                          {email}
                          <button type="button" onClick={() => removeEditEmail(email)} className="hover:text-destructive">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }

        return (
          <div key={entry.id} className="bg-card rounded-lg px-3 py-2.5 border border-primary/10 hover:border-accent/30 transition-all cursor-pointer group"
            onClick={() => startEdit(entry)}
          >
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold truncate">{entry.participant_name}</p>
                  {isTeam && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full border border-accent/20 flex-shrink-0">
                      <Users className="w-2.5 h-2.5" />
                      {teamEmails.length}
                    </span>
                  )}
                </div>
                {entry.team_name && (
                  <p className="text-[10px] text-accent font-semibold">{entry.team_name}</p>
                )}
                {teamEmails.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {teamEmails.map((email) => (
                      <span key={email} className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
                        {email}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right mr-1 flex-shrink-0">
                <span className={`text-sm font-bold ${
                  (entry.total_score || 0) < 0 ? 'text-red-600' : (entry.total_score || 0) > 0 ? 'text-primary' : 'text-accent'
                }`}>
                  {(entry.total_score || 0) === 0 ? 'E' : (entry.total_score > 0 ? '+' : '') + entry.total_score}
                </span>
              </div>
              <Pencil className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary flex-shrink-0 transition-colors" />
              {teamEmails.length > 0 && (
                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={(e) => { e.stopPropagation(); if (confirm(`Reset password for ${entry.participant_name}?`)) resetPassword.mutate(entry.id); }} title="Reset Password">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={(e) => { e.stopPropagation(); deleteEntry.mutate(entry.id); }} title="Delete">
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
