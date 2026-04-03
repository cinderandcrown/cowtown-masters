import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ScoringAlertBanner({ poolId }) {
  const [alert, setAlert] = useState(null);
  const [visible, setVisible] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', poolId],
    queryFn: () => base44.entities.Notification.filter({ pool_id: poolId }),
    enabled: !!poolId,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
    const age = Date.now() - new Date(latest.created_date).getTime();
    if (age < 60000 && latest.id !== alert?.id) {
      const emoji = latest.type === 'eagle' ? '🦅' : latest.type === 'birdie' ? '🐦' : '📢';
      setAlert({ ...latest, emoji });
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  if (!visible || !alert) return null;

  return (
    <div className="mx-3 mt-2 animate-fade-in-up">
      <div className="bg-gradient-to-r from-accent/15 to-primary/10 rounded-xl px-3 py-2 border border-accent/30 flex items-center gap-2">
        <span className="text-lg">{alert.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground truncate">{alert.title}</p>
          <p className="text-[10px] text-muted-foreground truncate">{alert.message}</p>
        </div>
      </div>
    </div>
  );
}