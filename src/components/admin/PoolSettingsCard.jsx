import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Copy, Check, Pencil, Save, X, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function PoolSettingsCard({ pool, poolId }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState(pool?.status || 'setup');
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editValues, setEditValues] = useState({
    entry_fee: pool?.entry_fee || 0,
    max_entries: pool?.max_entries || 0,
    payout_first: pool?.payout_structure?.first ?? 60,
    payout_second: pool?.payout_structure?.second ?? 25,
    payout_third: pool?.payout_structure?.third ?? 15,
    name: pool?.name || '',
    year: pool?.year || new Date().getFullYear(),
  });

  useEffect(() => {
    if (pool) {
      setStatus(pool.status || 'setup');
      setEditValues({
        entry_fee: pool.entry_fee || 0,
        max_entries: pool.max_entries || 0,
        payout_first: pool.payout_structure?.first || 60,
        payout_second: pool.payout_structure?.second || 25,
        payout_third: pool.payout_structure?.third || 15,
        name: pool.name || '',
        year: pool.year || new Date().getFullYear(),
      });
    }
  }, [pool]);

  const updatePool = useMutation({
    mutationFn: (data) => base44.entities.Pool.update(poolId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pool', poolId] }),
  });

  const handleCopyCode = () => {
    if (pool?.invite_code) {
      navigator.clipboard.writeText(pool.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    updatePool.mutate({ status: newStatus });
  };

  const handleSave = () => {
    updatePool.mutate({
      name: editValues.name,
      year: Number(editValues.year),
      entry_fee: Number(editValues.entry_fee),
      max_entries: Number(editValues.max_entries),
      payout_structure: {
        first: Number(editValues.payout_first),
        second: Number(editValues.payout_second),
        third: Number(editValues.payout_third),
      },
    });
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValues({
      entry_fee: pool?.entry_fee || 0,
      max_entries: pool?.max_entries || 0,
      payout_first: pool?.payout_structure?.first || 60,
      payout_second: pool?.payout_structure?.second || 25,
      payout_third: pool?.payout_structure?.third || 15,
      name: pool?.name || '',
      year: pool?.year || new Date().getFullYear(),
    });
  };

  const updateField = (field, value) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-card rounded-xl border border-primary/10 p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm text-foreground">Pool Settings</h3>
          {saved && (
            <span className="flex items-center gap-1 text-green-600 text-xs font-semibold">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
        </div>
        {!isEditing ? (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-7 px-2 text-xs text-muted-foreground hover:text-primary">
            <Pencil className="w-3 h-3 mr-1" /> Edit
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={handleCancel} className="h-7 px-2 text-xs text-muted-foreground">
              <X className="w-3 h-3 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} className="h-7 px-2 text-xs bg-primary text-white">
              <Save className="w-3 h-3 mr-1" /> Save
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Invite Code */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Invite Code</label>
          <div className="flex items-center gap-1 mt-1">
            <span className="font-mono text-lg font-bold tracking-widest text-primary">{pool?.invite_code || '—'}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyCode}>
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
            </Button>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Status</label>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="mt-1 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="setup">Setup</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Pool Name */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Pool Name</label>
          {isEditing ? (
            <Input value={editValues.name} onChange={(e) => updateField('name', e.target.value)} className="mt-1 h-8 text-sm" />
          ) : (
            <p className="text-sm font-bold mt-1">{pool?.name || '—'}</p>
          )}
        </div>

        {/* Year */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Year</label>
          {isEditing ? (
            <Input type="number" value={editValues.year} onChange={(e) => updateField('year', e.target.value)} className="mt-1 h-8 text-sm" />
          ) : (
            <p className="text-sm font-bold mt-1">{pool?.year || '—'}</p>
          )}
        </div>

        {/* Entry Fee */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Entry Fee</label>
          {isEditing ? (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm font-bold text-muted-foreground">$</span>
              <Input type="number" min="0" value={editValues.entry_fee} onChange={(e) => updateField('entry_fee', e.target.value)} className="h-8 text-sm" />
            </div>
          ) : (
            <p className="text-sm font-bold mt-1">${pool?.entry_fee || 0}</p>
          )}
        </div>

        {/* Max Entries */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Max Entries</label>
          {isEditing ? (
            <Input type="number" min="0" value={editValues.max_entries} onChange={(e) => updateField('max_entries', e.target.value)} placeholder="0 = unlimited" className="mt-1 h-8 text-sm" />
          ) : (
            <p className="text-sm font-bold mt-1">{pool?.max_entries || '∞'}</p>
          )}
        </div>
      </div>

      {/* Payout Structure */}
      {isEditing && (
        <div className="mt-3 pt-3 border-t border-primary/10">
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">Payout Structure (%)</label>
          <div className={`grid gap-2 ${Number(editValues.payout_third) > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div>
              <span className="text-[10px] font-bold text-accent">1st Place</span>
              <Input type="number" min="0" max="100" value={editValues.payout_first} onChange={(e) => updateField('payout_first', e.target.value)} className="h-8 text-sm mt-0.5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-primary">2nd Place</span>
              <Input type="number" min="0" max="100" value={editValues.payout_second} onChange={(e) => updateField('payout_second', e.target.value)} className="h-8 text-sm mt-0.5" />
            </div>
            {Number(editValues.payout_third) > 0 && (
              <div>
                <span className="text-[10px] font-bold text-muted-foreground">3rd Place</span>
                <Input type="number" min="0" max="100" value={editValues.payout_third} onChange={(e) => updateField('payout_third', e.target.value)} className="h-8 text-sm mt-0.5" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (Number(editValues.payout_third) > 0) {
                // Remove 3rd place — redistribute to 1st
                updateField('payout_first', Number(editValues.payout_first) + Number(editValues.payout_third));
                updateField('payout_third', 0);
              } else {
                // Add 3rd place — take 15 from 1st
                const takeFrom = Math.min(15, Number(editValues.payout_first));
                updateField('payout_first', Number(editValues.payout_first) - takeFrom);
                updateField('payout_third', takeFrom);
              }
            }}
            className="mt-2 text-[10px] font-semibold text-primary hover:text-primary/80 transition"
          >
            {Number(editValues.payout_third) > 0 ? '− Remove 3rd place payout' : '+ Add 3rd place payout'}
          </button>
          {Number(editValues.payout_first) + Number(editValues.payout_second) + Number(editValues.payout_third) !== 100 && (
            <p className="text-[10px] text-destructive mt-1">
              Payouts should total 100% (currently {Number(editValues.payout_first) + Number(editValues.payout_second) + Number(editValues.payout_third)}%)
            </p>
          )}
        </div>
      )}

      {!isEditing && pool?.payout_structure && (
        <div className="mt-3 pt-3 border-t border-primary/10">
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Payouts</label>
          <div className="flex gap-3 text-xs">
            <span className="text-accent font-bold">1st: {pool.payout_structure.first ?? 60}%</span>
            <span className="text-primary font-bold">2nd: {pool.payout_structure.second ?? 25}%</span>
            {(pool.payout_structure.third ?? 0) > 0 && (
              <span className="text-muted-foreground font-bold">3rd: {pool.payout_structure.third}%</span>
            )}
          </div>
        </div>
      )}

      {/* Delete Pool — only visible in edit mode */}
      {isEditing && (
        <div className="mt-4 pt-3 border-t border-destructive/20">
          <Button
            variant="ghost"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full h-9 text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete Pool
          </Button>
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-card rounded-2xl max-w-sm border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Pool
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete <strong>{pool?.name}</strong> and all associated data (golfers, entries, draft picks, chat messages). This cannot be undone.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={async () => {
                setDeleting(true);
                // Delete related entities
                const [golfers, entries, drafts, chats, dms, auths] = await Promise.all([
                  base44.entities.Golfer.filter({ pool_id: poolId }),
                  base44.entities.PoolEntry.filter({ pool_id: poolId }),
                  base44.entities.DraftPick.filter({ pool_id: poolId }),
                  base44.entities.ChatMessage.filter({ pool_id: poolId }),
                  base44.entities.DirectMessage.filter({ pool_id: poolId }),
                  base44.entities.ParticipantAuth.filter({ pool_id: poolId }),
                ]);
                await Promise.all([
                  ...golfers.map(g => base44.entities.Golfer.delete(g.id)),
                  ...entries.map(e => base44.entities.PoolEntry.delete(e.id)),
                  ...drafts.map(d => base44.entities.DraftPick.delete(d.id)),
                  ...chats.map(c => base44.entities.ChatMessage.delete(c.id)),
                  ...dms.map(d => base44.entities.DirectMessage.delete(d.id)),
                  ...auths.map(a => base44.entities.ParticipantAuth.delete(a.id)),
                ]);
                await base44.entities.Pool.delete(poolId);
                queryClient.invalidateQueries({ queryKey: ['pools'] });
                navigate('/');
              }}
              className="flex-1"
            >
              {deleting ? 'Deleting...' : 'Delete Forever'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}