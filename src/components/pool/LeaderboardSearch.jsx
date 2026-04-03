import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

export default function LeaderboardSearch({ value, onChange }) {
  const [expanded, setExpanded] = useState(false);

  if (!expanded && !value) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="p-1.5 hover:bg-primary/10 rounded-lg transition"
        aria-label="Search entries"
      >
        <Search className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-muted/30 rounded-lg px-2 py-1 border border-primary/10">
      <Search className="w-3 h-3 text-muted-foreground flex-shrink-0" />
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search..."
        className="bg-transparent text-xs outline-none w-24 placeholder:text-muted-foreground/50"
      />
      {value && (
        <button onClick={() => { onChange(''); setExpanded(false); }} className="p-0.5">
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}