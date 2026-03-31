import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, MessageSquare, ChevronRight, Circle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import DMConversation from '@/components/pool/DMConversation';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function DMInbox({ poolId, currentUser, conversation, onOpenConversation, onBack }) {
  const [search, setSearch] = useState('');

  const { data: entries = [] } = useQuery({
    queryKey: ['poolEntries', poolId],
    queryFn: () => base44.entities.PoolEntry.filter({ pool_id: poolId }),
    enabled: !!poolId,
  });

  // Fetch all DMs involving current user
  const { data: sentMessages = [] } = useQuery({
    queryKey: ['dmSent', poolId, currentUser],
    queryFn: () => base44.entities.DirectMessage.filter({ pool_id: poolId, sender_name: currentUser }),
    enabled: !!poolId && !!currentUser,
    refetchInterval: 10000,
  });

  const { data: receivedMessages = [] } = useQuery({
    queryKey: ['dmReceived', poolId, currentUser],
    queryFn: () => base44.entities.DirectMessage.filter({ pool_id: poolId, receiver_name: currentUser }),
    enabled: !!poolId && !!currentUser,
    refetchInterval: 10000,
  });

  const allMessages = useMemo(() =>
    [...sentMessages, ...receivedMessages].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)),
    [sentMessages, receivedMessages]
  );

  // Build conversation list — group by the other person
  const conversations = useMemo(() => {
    const convMap = {};
    for (const msg of allMessages) {
      const otherPerson = msg.sender_name === currentUser ? msg.receiver_name : msg.sender_name;
      if (!convMap[otherPerson]) {
        convMap[otherPerson] = {
          name: otherPerson,
          lastMessage: msg,
          unreadCount: 0,
        };
      }
      if (msg.receiver_name === currentUser && !msg.is_read) {
        convMap[otherPerson].unreadCount++;
      }
    }
    return Object.values(convMap).sort((a, b) =>
      new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date)
    );
  }, [allMessages, currentUser]);

  // All participants for starting new conversations
  const participants = useMemo(() =>
    entries
      .map(e => e.participant_name)
      .filter(n => n && n !== currentUser),
    [entries, currentUser]
  );

  const filteredConversations = search.trim()
    ? conversations.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  const filteredNewContacts = search.trim()
    ? participants.filter(p =>
        p.toLowerCase().includes(search.toLowerCase()) &&
        !conversations.some(c => c.name === p)
      )
    : [];

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  // If a conversation is open, show the thread
  if (conversation) {
    return (
      <DMConversation
        poolId={poolId}
        currentUser={currentUser}
        otherUser={conversation}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Search Bar */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="pl-10 h-9 text-sm bg-white"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
        {filteredConversations.length === 0 && !search.trim() && (
          <div className="text-center py-12 animate-fade-in-up">
            <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No conversations yet</p>
            <p className="text-xs text-muted-foreground mt-1">Search for a participant to start a DM</p>
          </div>
        )}

        {filteredConversations.map((conv, i) => (
          <button
            key={conv.name}
            onClick={() => onOpenConversation(conv.name)}
            className="animate-fade-in-up w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-primary/10 hover:bg-accent/5 hover:shadow-sm transition-all text-left"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">{conv.name.charAt(0).toUpperCase()}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground truncate">{conv.name}</span>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{timeAgo(conv.lastMessage.created_date)}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {conv.lastMessage.sender_name === currentUser ? 'You: ' : ''}
                {conv.lastMessage.message}
              </p>
            </div>

            {/* Unread badge */}
            {conv.unreadCount > 0 ? (
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                {conv.unreadCount}
              </span>
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
            )}
          </button>
        ))}

        {/* New contacts from search */}
        {filteredNewContacts.length > 0 && (
          <>
            <div className="pt-2 pb-1">
              <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Start new conversation</span>
            </div>
            {filteredNewContacts.map((name, i) => (
              <button
                key={name}
                onClick={() => onOpenConversation(name)}
                className="animate-fade-in-up w-full flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-dashed border-primary/15 hover:bg-accent/5 hover:border-accent/30 transition-all text-left"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-muted-foreground font-bold text-sm">{name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-foreground">{name}</span>
                  <p className="text-[10px] text-muted-foreground">Tap to message</p>
                </div>
                <MessageSquare className="w-4 h-4 text-accent flex-shrink-0" />
              </button>
            ))}
          </>
        )}

        {search.trim() && filteredConversations.length === 0 && filteredNewContacts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No participants found matching "{search}"
          </div>
        )}
      </div>
    </div>
  );
}
