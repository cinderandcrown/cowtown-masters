import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { hapticTap } from '@/lib/haptics';

const EMOJIS = ['🔥', '👏', '😂', '💀', '🏌️'];

export default function ChatReactions({ message, identity, poolId }) {
  const queryClient = useQueryClient();
  const reactions = message.reactions || {};

  const mutation = useMutation({
    mutationFn: async ({ emoji }) => {
      const current = { ...reactions };
      const users = current[emoji] || [];
      if (users.includes(identity)) {
        current[emoji] = users.filter(u => u !== identity);
        if (current[emoji].length === 0) delete current[emoji];
      } else {
        current[emoji] = [...users, identity];
      }
      await base44.entities.ChatMessage.update(message.id, { reactions: current });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', poolId] });
    },
  });

  const hasAnyReactions = Object.keys(reactions).length > 0;

  return (
    <div className="flex items-center gap-0.5 mt-0.5 flex-wrap">
      {/* Show existing reactions first */}
      {Object.entries(reactions).map(([emoji, users]) => (
        <button
          key={emoji}
          onClick={() => { hapticTap(); mutation.mutate({ emoji }); }}
          className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full border transition ${
            users.includes(identity)
              ? 'bg-accent/15 border-accent/30 text-accent'
              : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'
          }`}
        >
          <span>{emoji}</span>
          <span className="font-bold">{users.length}</span>
        </button>
      ))}
      {/* Add reaction picker */}
      <div className={`flex items-center gap-0.5 ${hasAnyReactions ? '' : 'opacity-0 group-hover:opacity-100'} transition`}>
        {EMOJIS.filter(e => !reactions[e]).map((emoji) => (
          <button
            key={emoji}
            onClick={() => { hapticTap(); mutation.mutate({ emoji }); }}
            className="text-[10px] px-1 py-0.5 rounded hover:bg-muted/50 transition opacity-40 hover:opacity-100"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}