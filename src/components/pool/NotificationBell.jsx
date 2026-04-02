import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useParticipant } from '@/lib/ParticipantContext';
import NotificationPanel from './NotificationPanel';

export default function NotificationBell({ poolId }) {
  const [open, setOpen] = useState(false);
  const { participant } = useParticipant();
  const participantName = participant?.participant_name || '';

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', poolId],
    queryFn: () => base44.entities.Notification.filter({ pool_id: poolId }, '-created_date', 50),
    enabled: !!poolId,
    refetchInterval: 30000, // refresh every 30s
  });

  const unreadCount = notifications.filter(
    n => !n.read_by?.includes(participantName)
  ).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 hover:bg-white/10 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-accent"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-4 h-4 text-primary-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-live-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationPanel
          poolId={poolId}
          notifications={notifications}
          participantName={participantName}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}