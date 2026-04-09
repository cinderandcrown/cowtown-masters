import React from 'react';
import { X, Bird, Flag, Trophy, Bell } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import moment from 'moment';

const ICON_MAP = {
  birdie: { Icon: Bird, bg: 'bg-green-500/15', color: 'text-green-600' },
  eagle: { Icon: Trophy, bg: 'bg-amber-500/15', color: 'text-amber-600' },
  round_finish: { Icon: Flag, bg: 'bg-blue-500/15', color: 'text-blue-600' },
  leaderboard_change: { Icon: Trophy, bg: 'bg-primary/15', color: 'text-primary' },
};

export default function NotificationPanel({ poolId, notifications, participantName, onClose }) {
  const queryClient = useQueryClient();

  const markRead = useMutation({
    mutationFn: async (notif) => {
      const readBy = notif.read_by || [];
      if (!readBy.includes(participantName) && participantName) {
        await base44.entities.Notification.update(notif.id, {
          read_by: [...readBy, participantName],
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', poolId] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!participantName) return;
      const unread = notifications.filter(n => !n.read_by?.includes(participantName));
      const updates = unread.map(n =>
        base44.entities.Notification.update(n.id, {
          read_by: [...(n.read_by || []), participantName],
        }).catch(() => {}) // ignore individual failures
      );
      await Promise.all(updates);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', poolId] }),
    onError: () => {},
  });

  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <div className="fixed right-2 top-14 z-[70] w-80 max-h-[70vh] bg-card rounded-xl shadow-2xl border border-border overflow-hidden animate-fade-in-up flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border">
          <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Notifications
          </h3>
          <div className="flex items-center gap-2">
            {participantName && notifications.some(n => !n.read_by?.includes(participantName)) && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-[10px] font-bold text-primary hover:text-primary/80 transition"
              >
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-muted rounded transition">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Alerts will appear here during the tournament</p>
            </div>
          ) : (
            notifications.map((n) => {
              const isRead = n.read_by?.includes(participantName);
              const { Icon, bg, color } = ICON_MAP[n.type] || ICON_MAP.leaderboard_change;

              return (
                <button
                  key={n.id}
                  onClick={() => !isRead && markRead.mutate(n)}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition flex gap-3 ${
                    !isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${!isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{n.message}</p>
                    <p className="text-[9px] text-muted-foreground/50 mt-1">{moment.utc(n.created_date).fromNow()}</p>
                  </div>
                  {!isRead && (
                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}