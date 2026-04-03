import React, { useState, useEffect } from 'react';

const MASTERS_START = new Date('2026-04-09T08:00:00-04:00');

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
      <div className="animate-fade-in-up bg-black/20 backdrop-blur-md rounded-xl border border-accent/30 px-5 py-2.5">
        <p className="text-sm font-black text-accent tracking-widest uppercase text-center">
          The Masters is Underway
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
      <p className="text-[9px] tracking-[0.3em] text-accent/60 font-bold uppercase text-center mb-2">
        Countdown to the Masters
      </p>
      <div className="flex items-center justify-center gap-1.5">
        {units.map((u, i) => (
          <React.Fragment key={u.label}>
            {i > 0 && <span className="text-accent/30 font-black text-base mb-4">:</span>}
            <div className="flex flex-col items-center">
              <div className="bg-black/30 backdrop-blur-md rounded-lg border border-accent/15 w-14 h-14 flex items-center justify-center shadow-lg">
                <span className="text-xl font-black text-primary-foreground tabular-nums">
                  {String(u.value).padStart(2, '0')}
                </span>
              </div>
              <span className="text-[7px] tracking-[0.2em] text-primary-foreground/30 font-bold mt-1">
                {u.label}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
