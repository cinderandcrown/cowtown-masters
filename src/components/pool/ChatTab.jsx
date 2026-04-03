import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Send, MessageCircle, AtSign, X, Smile } from 'lucide-react';

const IDENTITY_KEY = (poolId) => `cowtown_chat_identity_${poolId}`;

const REACTIONS = ['fire', 'laugh', 'clap', 'skull'];
const REACTION_EMOJI = { fire: '\uD83D\uDD25', laugh: '\uD83D\uDE02', clap: '\uD83D\uDC4F', skull: '\uD83D\uDC80' };

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
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
  const [showIdentityPicker, setShowIdentityPicker] = useState(!identity && !participantIdentity);

  useEffect(() => {
    if (participantIdentity && participantIdentity !== identity) {
      setIdentity(participantIdentity);
      setShowIdentityPicker(false);
      localStorage.setItem(IDENTITY_KEY(poolId), participantIdentity);
    }
  }, [participantIdentity]);

  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');

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
    },
  });

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
    setMentionFilter('');
    inputRef.current?.focus();
  };

  const filteredMentions = participantNames
    .filter(n => n !== identity)
    .filter(n => !mentionFilter || n.toLowerCase().includes(mentionFilter.toLowerCase()));

  // Identity Picker - cleaner design
  if (showIdentityPicker) {
    return (
      <div className="px-3 pt-3 pb-0">
        <div className="bg-gradient-to-br from-secondary to-primary rounded-xl p-5 mb-4 border border-accent/30 text-center">
          <MessageCircle className="w-8 h-8 text-accent mx-auto mb-2" />
          <h2 className="text-xl font-bold text-primary-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            Smack Talk
          </h2>
          <p className="text-xs text-primary-foreground/60">Select your name to start talking trash</p>
        </div>

        <div className="space-y-1.5">
          {participantNames.length === 0 && (
            <div className="bg-card rounded-xl border border-destructive/20 p-6 text-center">
              <p className="text-sm text-destructive font-semibold">No participants yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add entries in the Admin panel first</p>
            </div>
          )}
          {participantNames.map((name, i) => {
            const entry = entryByName[name];
            return (
              <button
                key={name}
                onClick={() => selectIdentity(name)}
                className="animate-fade-in-up w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all text-left"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">{name[0].toUpperCase()}</span>
                </div>
                <div>
                  <span className="font-semibold text-sm text-foreground">{entry?.team_name || name}</span>
                  {entry?.team_name && <span className="block text-[10px] text-muted-foreground">{name}</span>}
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
        <div className="bg-gradient-to-r from-secondary to-primary rounded-xl px-4 py-2 border border-accent/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-accent" />
            <div>
              <h2 className="text-sm font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Smack Talk</h2>
              <p className="text-[9px] text-accent">{messages.length} messages</p>
            </div>
          </div>
          <button
            onClick={() => setShowIdentityPicker(true)}
            className="flex items-center gap-1.5 text-[10px] text-accent bg-accent/10 px-2 py-1 rounded-full border border-accent/30 font-semibold hover:bg-accent/20 transition"
          >
            <div className="w-4 h-4 rounded-full bg-accent/30 flex items-center justify-center">
              <span className="text-[8px] font-bold text-accent">{(entryByName[identity]?.team_name || identity || '?')[0].toUpperCase()}</span>
            </div>
            {entryByName[identity]?.team_name || identity}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
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
          <div className="text-center py-16 animate-fade-in-up">
            <MessageCircle className="w-12 h-12 text-muted-foreground/15 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No smack talk yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Be the first to fire a shot</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe = msg.user_name === identity;
          const isSystem = msg.message_type === 'system';
          const showAvatar = !isMe && (idx === 0 || messages[idx - 1]?.user_name !== msg.user_name);

          if (isSystem) {
            return (
              <div key={msg.id} className="text-center py-1">
                <span className="text-[10px] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">{msg.message}</span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${showAvatar && !isMe ? 'mt-3' : ''}`}>
              <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                {showAvatar && !isMe && (
                  <div className="flex items-center gap-1.5 ml-1 mb-0.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <span className="text-[8px] font-bold text-white">{(msg.user_name || '?')[0].toUpperCase()}</span>
                    </div>
                    <p className="text-[10px] font-bold text-primary">{entryByName[msg.user_name]?.team_name || msg.user_name}</p>
                  </div>
                )}
                <div className={`rounded-2xl px-3 py-2 ${
                  isMe
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-card border border-border text-foreground rounded-bl-md'
                }`}>
                  <p className="text-sm leading-relaxed">{renderMessageWithMentions(msg.message)}</p>
                </div>
                <p className={`text-[9px] text-muted-foreground/50 mt-0.5 ${isMe ? 'text-right mr-2' : 'ml-2'}`}>
                  {msg.created_date ? timeAgo(msg.created_date) : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mention Picker */}
      {showMentionPicker && (
        <div className="px-3 pb-1">
          <div className="bg-card rounded-xl border border-accent/20 shadow-lg p-2 max-h-36 overflow-y-auto">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[10px] font-bold text-accent tracking-widest uppercase">Mention</span>
              <button onClick={() => { setShowMentionPicker(false); setMentionFilter(''); }}>
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
            {filteredMentions.map((name) => (
              <button
                key={name}
                onClick={() => insertMention(name)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm hover:bg-accent/10 transition text-left"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">{name[0].toUpperCase()}</span>
                </div>
                <span className="font-medium">{entryByName[name]?.team_name || name}</span>
              </button>
            ))}
            {filteredMentions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">No participants found</p>
            )}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="px-3 pb-3 pt-1">
        <form onSubmit={handleSend} className="flex items-center gap-1.5 bg-card rounded-xl border border-border px-2 py-1.5 shadow-sm focus-within:border-primary/30 focus-within:shadow-md transition-all">
          <button
            type="button"
            onClick={() => setShowMentionPicker(!showMentionPicker)}
            className="p-1.5 rounded-lg hover:bg-accent/10 transition flex-shrink-0"
            aria-label="Mention someone"
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
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/40"
          />
          <span className="text-[9px] text-muted-foreground/40 flex-shrink-0 tabular-nums">{message.length}/500</span>
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
