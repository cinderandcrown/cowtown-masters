import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageCircle, AtSign, X } from 'lucide-react';

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

export default function ChatTab({ poolId }) {
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const [message, setMessage] = useState('');
  const [identity, setIdentity] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem(IDENTITY_KEY(poolId)) || '' : ''
  );
  const [showIdentityPicker, setShowIdentityPicker] = useState(!identity);
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
      <div className="px-3 pt-3 pb-6">
        <div className="bg-gradient-to-br from-secondary to-primary rounded-xl p-4 mb-4 border border-accent/30 text-center">
          <MessageCircle className="w-8 h-8 text-accent mx-auto mb-2" />
          <h2 className="text-xl font-bold text-primary-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            Smack Talk
          </h2>
          <p className="text-xs text-accent">Who are you?</p>
        </div>

        <div className="bg-white rounded-xl border border-primary/10 p-4 space-y-2">
          <p className="text-sm text-muted-foreground text-center mb-3">Select your name to start talking trash</p>
          {participantNames.length === 0 && (
            <p className="text-sm text-destructive text-center">No participants yet. Add entries in the Admin panel first.</p>
          )}
          {participantNames.map((name) => (
            <button
              key={name}
              onClick={() => selectIdentity(name)}
              className="w-full text-left px-4 py-3 rounded-lg border border-primary/10 hover:bg-primary/5 hover:border-primary/30 transition font-semibold text-sm"
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
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
            className="text-[10px] text-accent bg-accent/10 px-2 py-1 rounded-full border border-accent/30 font-semibold"
          >
            {identity}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {isLoading && (
          <div className="text-center text-muted-foreground text-sm py-8">Loading messages...</div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No smack talk yet</p>
            <p className="text-xs text-muted-foreground mt-1">Be the first to fire a shot</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.user_name === identity;
          const isSystem = msg.message_type === 'system';

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
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && (
                  <p className="text-[10px] font-bold text-primary ml-2 mb-0.5">{msg.user_name}</p>
                )}
                <div className={`rounded-2xl px-3 py-2 ${
                  isMe
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-white border border-primary/10 text-foreground rounded-bl-md'
                }`}>
                  <p className="text-sm">{renderMessageWithMentions(msg.message)}</p>
                </div>
                <p className={`text-[9px] text-muted-foreground mt-0.5 ${isMe ? 'text-right mr-2' : 'ml-2'}`}>
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
          <div className="bg-white rounded-lg border border-accent/30 shadow-lg p-2 max-h-32 overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-accent tracking-widest uppercase">Mention someone</span>
              <button onClick={() => setShowMentionPicker(false)}>
                <X className="w-3 h-3 text-muted-foreground" />
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
        <form onSubmit={handleSend} className="flex items-center gap-2 bg-white rounded-xl border border-primary/10 px-2 py-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setShowMentionPicker(!showMentionPicker)}
            className="p-1.5 rounded-lg hover:bg-accent/10 transition flex-shrink-0"
          >
            <AtSign className="w-4 h-4 text-accent" />
          </button>
          <input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Talk your trash..."
            maxLength={500}
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
