import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Send, MessageCircle, AtSign, X } from 'lucide-react';
import ChatReactions from '@/components/pool/ChatReactions';
import { toast } from 'sonner';
import { hapticTap } from '@/lib/haptics';

const IDENTITY_KEY = (poolId) => `cowtown_chat_identity_${poolId}`;

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function renderMessageWithMentions(text) {
  const parts = text.split(/(@\[[^\]]+\])/g);
  return parts.map((part, i) => {
    const mentionMatch = part.match(/^@\[([^\]]+)\]$/);
    if (mentionMatch) {
      return (
        <span key={i} className="inline-flex items-center gap-0.5 bg-accent/20 text-accent font-bold text-xs px-1 py-0.5 rounded mx-0.5">
          @{mentionMatch[1]}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ChatTab({ poolId, participantIdentity }) {
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const [message, setMessage] = useState('');
  const [identity, setIdentity] = useState(() => {
    if (participantIdentity) return participantIdentity;
    return typeof window !== 'undefined' ? localStorage.getItem(IDENTITY_KEY(poolId)) || '' : '';
  });
  const [showIdentityPicker, setShowIdentityPicker] = useState(false);

  // Sync identity when participantIdentity prop changes (e.g., after login)
  useEffect(() => {
    if (participantIdentity) {
      setIdentity(participantIdentity);
      setShowIdentityPicker(false);
      localStorage.setItem(IDENTITY_KEY(poolId), participantIdentity);
    } else if (!identity) {
      // Only show picker if no participantIdentity AND no stored identity
      const stored = localStorage.getItem(IDENTITY_KEY(poolId));
      if (!stored) setShowIdentityPicker(true);
    }
  }, [participantIdentity]);
  const [showMentionPicker, setShowMentionPicker] = useState(false);

  const { data: entries = [] } = useQuery({
    queryKey: ['poolEntries', poolId],
    queryFn: () => base44.entities.PoolEntry.filter({ pool_id: poolId }),
    enabled: !!poolId,
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chatMessages', poolId],
    queryFn: async () => {
      const msgs = await base44.entities.ChatMessage.filter({ pool_id: poolId });
      return msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    },
    enabled: !!poolId,
    refetchInterval: 10000,
  });

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.ChatMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', poolId] });
      setMessage('');
      hapticTap();
    },
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const participantNames = useMemo(() =>
    entries.map(e => e.participant_name).filter(Boolean),
    [entries]
  );

  const entryByName = useMemo(() => {
    const map = {};
    entries.forEach(e => { if (e.participant_name) map[e.participant_name] = e; });
    return map;
  }, [entries]);

  const selectIdentity = (name) => {
    setIdentity(name);
    localStorage.setItem(IDENTITY_KEY(poolId), name);
    setShowIdentityPicker(false);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim() || !identity) return;

    sendMutation.mutate({
      pool_id: poolId,
      user_name: identity,
      message: message.trim(),
      created_date: new Date().toISOString(),
      message_type: 'chat',
    });
  };

  const insertMention = (name) => {
    setMessage(prev => prev + `@[${name}] `);
    setShowMentionPicker(false);
    inputRef.current?.focus();
  };

  // Identity Picker
  if (showIdentityPicker) {
    return (
      <div className="px-3 pt-3 pb-0">
        <div className="bg-gradient-to-br from-secondary to-primary rounded-xl p-4 mb-4 border border-accent/30 text-center">
          <MessageCircle className="w-8 h-8 text-accent mx-auto mb-2" />
          <h2 className="text-xl font-bold text-primary-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            Smack Talk
          </h2>
          <p className="text-xs text-accent">Who are you?</p>
        </div>

        <div className="bg-card rounded-xl border border-primary/10 p-4 space-y-2">
          <p className="text-sm text-muted-foreground text-center mb-3">Select your name to start talking trash</p>
          {participantNames.length === 0 && (
            <p className="text-sm text-destructive text-center">No participants yet. Add entries in the Admin panel first.</p>
          )}
          {participantNames.map((name, i) => {
            const entry = entryByName[name];
            const initial = name.charAt(0).toUpperCase();
            return (
              <button
                key={name}
                onClick={() => selectIdentity(name)}
                className="animate-fade-in-up w-full text-left px-4 py-3 rounded-lg border border-primary/10 hover:bg-primary/5 hover:border-primary/30 hover:scale-[1.01] hover:shadow-sm transition-all flex items-center gap-3"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-black text-primary-foreground">{initial}</span>
                </div>
                <div>
                  <span className="font-semibold text-sm text-foreground">{entry?.team_name || name}</span>
                  {entry?.team_name && (
                    <span className="block text-[10px] text-muted-foreground mt-0.5">{name}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Chat Header */}
      <div className="px-3 pt-3 pb-2">
        <div className="bg-gradient-to-r from-secondary to-primary rounded-xl px-4 py-2.5 border border-accent/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-accent" />
            <div>
              <h2 className="text-sm font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                Smack Talk
              </h2>
              <p className="text-[10px] text-accent">{messages.length} messages</p>
            </div>
          </div>
          <button
            onClick={() => setShowIdentityPicker(true)}
            className="flex items-center gap-1.5 text-[10px] text-accent bg-accent/10 px-2 py-1 rounded-full border border-accent/30 font-semibold"
          >
            <span className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center text-[8px] font-black text-accent">{identity.charAt(0).toUpperCase()}</span>
            {entryByName[identity]?.team_name || identity}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {isLoading && (
          <div className="text-center py-8 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className="w-3/5 h-12 rounded-2xl bg-primary/5 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="text-center py-12 animate-fade-in-up">
            <MessageCircle className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3 animate-pulse" />
            <p className="text-sm font-semibold text-muted-foreground">No smack talk yet</p>
            <p className="text-xs text-muted-foreground mt-1">Be the first to fire a shot</p>
          </div>
        )}

        {messages.map((msg, msgIdx) => {
          const isMe = msg.user_name === identity;
          const isSystem = msg.message_type === 'system';
          const prevMsg = msgIdx > 0 ? messages[msgIdx - 1] : null;
          const sameAsPrev = prevMsg && prevMsg.user_name === msg.user_name && prevMsg.message_type !== 'system';

          if (isSystem) {
            return (
              <div key={msg.id} className="text-center py-1">
                <span className="text-[10px] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                  {msg.message}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end animate-slide-in-right' : 'justify-start animate-slide-in-left'} ${!sameAsPrev && msgIdx > 0 ? 'mt-2' : ''}`}>
              {!isMe && !sameAsPrev && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 mr-1.5 mt-4">
                  <span className="text-[8px] font-black text-primary-foreground">{(msg.user_name || '?').charAt(0).toUpperCase()}</span>
                </div>
              )}
              {!isMe && sameAsPrev && <div className="w-6 mr-1.5 flex-shrink-0" />}
              <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && !sameAsPrev && (
                  <p className="text-[10px] font-bold text-primary ml-0.5 mb-0.5">
                    {entryByName[msg.user_name]?.team_name || msg.user_name}
                  </p>
                )}
                <div className={`rounded-2xl px-3 py-2 ${
                  isMe
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-card border border-primary/10 text-foreground rounded-bl-md'
                }`}>
                  <p className="text-sm">{renderMessageWithMentions(msg.message)}</p>
                </div>
                <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'flex-row-reverse mr-2' : 'ml-0.5'}`}>
                  <p className="text-[9px] text-muted-foreground">
                    {msg.created_date ? timeAgo(msg.created_date) : ''}
                  </p>
                </div>
                <div className={`${isMe ? 'flex justify-end' : ''}`}>
                  <ChatReactions message={msg} identity={identity} poolId={poolId} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mention Picker */}
      {showMentionPicker && (
        <div className="px-3 pb-1">
          <div className="bg-card rounded-lg border border-accent/30 shadow-lg p-2 max-h-32 overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-accent tracking-widest uppercase">Mention someone</span>
              <button onClick={() => setShowMentionPicker(false)} className="min-h-8 min-w-8 flex items-center justify-center hover:bg-muted rounded transition" aria-label="Close mention picker">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
            {participantNames.filter(n => n !== identity).map((name) => (
              <button
                key={name}
                onClick={() => insertMention(name)}
                className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-accent/10 transition font-medium"
              >
                @{name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="px-3 pb-3 pt-1">
        <form onSubmit={handleSend} className="flex items-center gap-2 bg-card rounded-xl border border-primary/10 px-2 py-1.5 shadow-sm focus-within:border-primary/30 focus-within:shadow-md focus-within:shadow-primary/10 transition-all">
          <button
            type="button"
            onClick={() => setShowMentionPicker(!showMentionPicker)}
            className="p-1.5 rounded-lg hover:bg-accent/10 transition flex-shrink-0"
            aria-label="Mention a participant"
          >
            <AtSign className="w-4 h-4 text-accent" />
          </button>
          <input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Talk your trash..."
            maxLength={500}
            aria-label="Chat message"
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/50"
          />
          <span className="text-[9px] text-muted-foreground flex-shrink-0">{message.length}/500</span>
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