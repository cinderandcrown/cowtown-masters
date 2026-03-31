import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send } from 'lucide-react';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DMConversation({ poolId, currentUser, otherUser, onBack }) {
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const [message, setMessage] = useState('');

  // Fetch messages between these two users
  const { data: sentToThem = [] } = useQuery({
    queryKey: ['dmThread', poolId, currentUser, otherUser, 'sent'],
    queryFn: () => base44.entities.DirectMessage.filter({
      pool_id: poolId,
      sender_name: currentUser,
      receiver_name: otherUser,
    }),
    enabled: !!poolId && !!currentUser && !!otherUser,
    refetchInterval: 5000,
  });

  const { data: receivedFromThem = [] } = useQuery({
    queryKey: ['dmThread', poolId, currentUser, otherUser, 'received'],
    queryFn: () => base44.entities.DirectMessage.filter({
      pool_id: poolId,
      sender_name: otherUser,
      receiver_name: currentUser,
    }),
    enabled: !!poolId && !!currentUser && !!otherUser,
    refetchInterval: 5000,
  });

  const messages = useMemo(() =>
    [...sentToThem, ...receivedFromThem].sort((a, b) => new Date(a.created_date) - new Date(b.created_date)),
    [sentToThem, receivedFromThem]
  );

  // Mark received messages as read
  useEffect(() => {
    const unread = receivedFromThem.filter(m => !m.is_read);
    for (const msg of unread) {
      base44.entities.DirectMessage.update(msg.id, { is_read: true }).catch(() => {});
    }
    if (unread.length > 0) {
      queryClient.invalidateQueries({ queryKey: ['dmReceived', poolId, currentUser] });
    }
  }, [receivedFromThem]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.DirectMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dmThread', poolId, currentUser, otherUser] });
      queryClient.invalidateQueries({ queryKey: ['dmSent', poolId, currentUser] });
      setMessage('');
      inputRef.current?.focus();
    },
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMutation.mutate({
      pool_id: poolId,
      sender_name: currentUser,
      receiver_name: otherUser,
      message: message.trim(),
      created_date: new Date().toISOString(),
      is_read: false,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Conversation Header */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-3 bg-card rounded-xl border border-primary/10 px-3 py-2.5">
          <button onClick={onBack} className="p-1 hover:bg-muted rounded-lg transition">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">{otherUser.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{otherUser}</p>
            <p className="text-[10px] text-muted-foreground">{messages.length} messages</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 && (
          <div className="text-center py-12 animate-fade-in-up">
            <p className="text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">Send the first message to {otherUser}</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_name === currentUser;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end animate-slide-in-right' : 'justify-start animate-slide-in-left'}`}>
              <div className={`max-w-[80%]`}>
                <div className={`rounded-2xl px-3 py-2 ${
                  isMe
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-card border border-primary/10 text-foreground rounded-bl-md'
                }`}>
                  <p className="text-sm">{msg.message}</p>
                </div>
                <p className={`text-[9px] text-muted-foreground mt-0.5 ${isMe ? 'text-right mr-2' : 'ml-2'}`}>
                  {msg.created_date ? timeAgo(msg.created_date) : ''}
                  {isMe && msg.is_read && <span className="ml-1 text-accent">read</span>}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-1">
        <form onSubmit={handleSend} className="flex items-center gap-2 bg-card rounded-xl border border-primary/10 px-3 py-1.5 shadow-sm focus-within:border-primary/30 focus-within:shadow-md focus-within:shadow-primary/10 transition-all">
          <input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Message ${otherUser}...`}
            maxLength={500}
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/50"
            autoFocus
          />
          <Button
            type="submit"
            disabled={!message.trim() || sendMutation.isPending}
            size="icon"
            className="h-8 w-8 bg-primary hover:bg-primary/90 rounded-lg flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
