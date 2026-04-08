import React, { useState, useEffect } from 'react';

const MASTERS_START = new Date('2026-04-09T08:00:00-04:00'); // Thursday, Masters Round 1 tee time (EDT)
const MASTERS_END = new Date('2026-04-12T20:00:00-04:00'); // Sunday evening (EDT)

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

function getTournamentStatus() {
  const now = new Date();
  if (now < MASTERS_START) return 'upcoming';
  if (now <= MASTERS_END) return 'live';
  return 'complete';
}

export default function MastersCountdown() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);
  const [status, setStatus] = useState(getTournamentStatus);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft());
      setStatus(getTournamentStatus());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (status === 'complete') {
    return (
      <div className="animate-fade-in-up bg-black/30 backdrop-blur-md rounded-2xl border border-accent/30 px-5 py-3">
        <p className="text-sm font-black text-accent tracking-widest uppercase text-center">
          The Masters Has Concluded
        </p>
      </div>
    );
  }

  if (status === 'live') {
    return (
      <div className="animate-fade-in-up bg-black/30 backdrop-blur-md rounded-2xl border border-accent/30 px-5 py-3 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <p className="text-sm font-black text-accent tracking-widest uppercase">
            The Masters is LIVE
          </p>
        </div>
        <p className="text-[11px] text-primary-foreground/60">Augusta National Golf Club</p>
      </div>
    );
  }

  if (!timeLeft) return null;

  const units = [
    { label: 'DAYS', value: timeLeft.days },
    { label: 'HRS', value: timeLeft.hours },
    { label: 'MIN', value: timeLeft.minutes },
    { label: 'SEC', value: timeLeft.seconds },
  ];

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
      <p className="text-[11px] tracking-[0.3em] text-accent/80 font-bold uppercase text-center mb-2">
        {timeLeft.days <= 1 ? 'Tournament Starts Thursday' : 'Countdown to the Masters'}
      </p>
      <div className="flex items-center justify-center gap-1.5">
        {units.map((u, i) => (
          <React.Fragment key={u.label}>
            {i > 0 && <span className="text-accent/40 font-black text-base mb-3">:</span>}
            <div className="flex flex-col items-center">
              <div className="bg-black/40 backdrop-blur-md rounded-xl border border-accent/20 w-14 h-14 flex items-center justify-center shadow-lg">
                <span className="text-xl font-black text-primary-foreground tabular-nums">
                  {String(u.value).padStart(2, '0')}
                </span>
              </div>
              <span className="text-[11px] tracking-[0.2em] text-primary-foreground/50 font-bold mt-1">
                {u.label}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}