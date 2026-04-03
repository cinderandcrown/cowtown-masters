import React, { useState, useEffect } from 'react';

const MASTERS_START = new Date('2026-04-09T08:00:00-04:00'); // Thursday, Masters Round 1 tee time (EDT)

function getTimeLeft() {
  const now = new Date();
  const diff = MASTERS_START - now;
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function MastersCountdown() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!timeLeft) {
    return (
      <div className="animate-fade-in-up bg-black/30 backdrop-blur-md rounded-2xl border border-accent/30 px-5 py-3">
        <p className="text-sm font-black text-accent tracking-widest uppercase text-center">
          ⛳ The Masters is Underway!
        </p>
      </div>
    );
  }

  const units = [
    { label: 'DAYS', value: timeLeft.days },
    { label: 'HRS', value: timeLeft.hours },
    { label: 'MIN', value: timeLeft.minutes },
    { label: 'SEC', value: timeLeft.seconds },
  ];

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
      <p className="text-[10px] tracking-[0.3em] text-accent/80 font-bold uppercase text-center mb-2">
        Countdown to the Masters
      </p>
      <div className="flex items-center justify-center gap-2">
        {units.map((u, i) => (
          <React.Fragment key={u.label}>
            {i > 0 && <span className="text-accent/40 font-black text-lg mb-3">:</span>}
            <div className="flex flex-col items-center">
              <div className="bg-black/40 backdrop-blur-md rounded-xl border border-accent/20 w-16 h-16 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-black text-primary-foreground tabular-nums">
                  {String(u.value).padStart(2, '0')}
                </span>
              </div>
              <span className="text-[8px] tracking-[0.2em] text-primary-foreground/40 font-bold mt-1">
                {u.label}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}