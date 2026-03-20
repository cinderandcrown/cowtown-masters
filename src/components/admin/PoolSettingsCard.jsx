import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Copy, Check } from 'lucide-react';

export default function PoolSettingsCard({ pool, poolId }) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState(pool?.status || 'setup');

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

  return (
    <div className="bg-white rounded-xl border border-primary/10 p-4 mb-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Settings className="w-4 h-4 text-primary" />
        <h3 className="font-bold text-sm text-foreground">Pool Settings</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Invite Code</label>
          <div className="flex items-center gap-1 mt-1">
            <span className="font-mono text-lg font-bold tracking-widest text-primary">{pool?.invite_code || '—'}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyCode}>
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
            </Button>
          </div>
        </div>

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

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Entry Fee</label>
          <p className="text-sm font-bold mt-1">${pool?.entry_fee || 0}</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Max Entries</label>
          <p className="text-sm font-bold mt-1">{pool?.max_entries || '∞'}</p>
        </div>
      </div>
    </div>
  );
}