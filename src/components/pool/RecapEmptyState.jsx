import React from 'react';
import { Clock, Loader2, CircleDashed } from 'lucide-react';

export default function RecapEmptyState({ roundNumber, status, golfersOnCourse }) {
  if (status === 'not_started') {
    return (
      <div className="text-center py-16 px-6">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-7 h-7 text-primary/40" />
        </div>
        <h3 className="text-base font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Round {roundNumber} Hasn't Teed Off Yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          The roasts are loading… check back once the round begins.
        </p>
      </div>
    );
  }

  if (status === 'in_progress') {
    return (
      <div className="text-center py-16 px-6">
        <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <CircleDashed className="w-7 h-7 text-green-500 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <h3 className="text-base font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Round {roundNumber} Still In Progress
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          The Caddyshack Report drops when the last putt falls.
        </p>
        {golfersOnCourse > 0 && (
          <p className="text-xs text-primary mt-3 font-bold">{golfersOnCourse} golfer{golfersOnCourse !== 1 ? 's' : ''} still on course</p>
        )}
      </div>
    );
  }

  if (status === 'generating') {
    return (
      <div className="text-center py-16 px-6">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
        <h3 className="text-base font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Generating Reports…
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Our snarky writers are crafting your roasts. This takes about a minute.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-16 px-6">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <Clock className="w-7 h-7 text-muted-foreground/40" />
      </div>
      <h3 className="text-base font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
        No Reports Yet
      </h3>
      <p className="text-sm text-muted-foreground">Reports will appear after the round is complete.</p>
    </div>
  );
}