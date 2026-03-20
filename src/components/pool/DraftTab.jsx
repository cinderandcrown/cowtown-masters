import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

const ALL_GOLFERS = [
  'Ludvig Åberg', 'Jon Rahm', 'Patrick Reed', 'Rory McIlroy', 'Dustin Johnson',
  'Scottie Scheffler', 'Patrick Cantlay', 'Collin Morikawa', 'Jordan Spieth',
  'Russell Henley', 'Tommy Fleetwood', 'Viktor Hovland', 'Tyrrell Hatton',
  'Joaquín Niemann', 'Sungjae Im', 'Bryson DeChambeau', 'Xander Schauffele',
  'Daniel Berger', 'Aaron Rai', 'Sahith Theegala', 'Brian Harman', 'Justin Thomas',
  'Keegan Bradley', 'Matt Fitzpatrick', 'Akshay Bhatia', 'Tony Finau',
  'Shane Lowry', 'Sergio Garcia', 'Wyndham Clark', 'Adam Scott',
];

export default function DraftTab() {
  const [phase, setPhase] = useState('setup');
  const [playerCount, setPlayerCount] = useState(24);
  const [groupA, setGroupA] = useState([]);
  const [groupB, setGroupB] = useState([]);
  const [drawn, setDrawn] = useState([]);
  const [currentDraw, setCurrentDraw] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [draftGroup, setDraftGroup] = useState('A');

  const setupDraft = () => {
    const shuffledA = ALL_GOLFERS.slice(0, playerCount).sort(() => Math.random() - 0.5);
    const shuffledB = ALL_GOLFERS.slice(playerCount, playerCount * 2).sort(() => Math.random() - 0.5);
    setGroupA(shuffledA);
    setGroupB(shuffledB);
    setPhase('drawing');
  };

  const drawName = () => {
    if (isAnimating) return;
    const pool = draftGroup === 'A' ? groupA : groupB;
    const remaining = pool.filter((g) => !drawn.includes(g));
    
    if (remaining.length === 0) {
      if (draftGroup === 'A') {
        setDraftGroup('B');
        return;
      }
      setPhase('complete');
      return;
    }

    setIsAnimating(true);
    let count = 0;
    const interval = setInterval(() => {
      setCurrentDraw(remaining[Math.floor(Math.random() * remaining.length)]);
      count++;
      if (count > 15) {
        clearInterval(interval);
        const pick = remaining[Math.floor(Math.random() * remaining.length)];
        setCurrentDraw(pick);
        setDrawn((prev) => [...prev, pick]);
        setIsAnimating(false);
      }
    }, 80);
  };

  return (
    <div className="px-3 pt-3 pb-6">
      <div className="bg-gradient-to-br from-secondary to-primary rounded-xl p-4 mb-4 border border-accent/30 text-center">
        <h2 className="text-2xl font-bold text-primary-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
          🎩 The Hat Draw
        </h2>
        <p className="text-xs tracking-widest text-accent uppercase font-semibold">Draft Simulator</p>
      </div>

      {phase === 'setup' && (
        <div className="bg-white rounded-xl p-6 border border-primary/10 text-center space-y-4">
          <p className="text-xl font-semibold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            How many players in your pool?
          </p>

          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setPlayerCount((p) => Math.max(4, p - 2))}
              className="w-12 h-12 rounded-full border-2 border-primary bg-white text-primary font-bold text-xl hover:bg-primary/5"
            >
              −
            </button>
            <span className="text-5xl font-black text-primary">{playerCount}</span>
            <button
              onClick={() => setPlayerCount((p) => Math.min(50, p + 2))}
              className="w-12 h-12 rounded-full border-2 border-primary bg-white text-primary font-bold text-xl hover:bg-primary/5"
            >
              +
            </button>
          </div>

          <p className="text-sm text-muted-foreground">{playerCount} golfers per group (A & B)</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
              <p className="text-xs font-bold text-primary tracking-widest uppercase mb-1">GROUP A</p>
              <p className="text-xs text-muted-foreground">Top {playerCount} favorites</p>
            </div>
            <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
              <p className="text-xs font-bold text-accent tracking-widest uppercase mb-1">GROUP B</p>
              <p className="text-xs text-muted-foreground">Next {playerCount} golfers</p>
            </div>
          </div>

          <Button
            onClick={setupDraft}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg"
          >
            Start the Draft 🎩
          </Button>
        </div>
      )}

      {phase === 'drawing' && (
        <div className="text-center space-y-4">
          <div
            className={`inline-block px-5 py-2 rounded-lg border ${
              draftGroup === 'A'
                ? 'bg-primary/15 border-primary/30'
                : 'bg-accent/15 border-accent/30'
            }`}
          >
            <span className={`text-xs font-bold tracking-widest ${draftGroup === 'A' ? 'text-primary' : 'text-accent'}`}>
              DRAWING GROUP {draftGroup}
            </span>
          </div>

          {/* The Hat */}
          <div
            onClick={drawName}
            className={`w-48 h-48 mx-auto rounded-full bg-gradient-radial from-secondary to-primary border-4 border-accent/50 shadow-2xl flex items-center justify-center cursor-pointer transition ${
              isAnimating ? 'scale-105' : 'scale-100 hover:scale-102'
            }`}
          >
            {currentDraw ? (
              <span className="text-center font-bold text-primary-foreground text-sm px-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                {currentDraw}
              </span>
            ) : (
              <span className="text-6xl">🎩</span>
            )}
          </div>

          <Button
            onClick={drawName}
            disabled={isAnimating}
            className="mx-auto bg-primary hover:bg-primary/90 text-white font-bold py-2 px-8 rounded-lg disabled:opacity-50"
          >
            {isAnimating ? 'Drawing...' : 'Draw from Hat'}
          </Button>

          {drawn.length > 0 && (
            <div className="bg-white rounded-lg p-3 border border-primary/10 text-left space-y-2">
              <p className="text-xs font-bold text-primary tracking-widest uppercase">Drawn ({drawn.length})</p>
              <div className="flex flex-wrap gap-2">
                {drawn.map((g, i) => (
                  <span key={g} className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
                    {i + 1}. {g}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'complete' && (
        <div className="bg-white rounded-xl p-8 border border-primary/10 text-center space-y-4">
          <div className="text-7xl">🎉</div>
          <h3 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Draft Complete!
          </h3>
          <p className="text-sm text-muted-foreground">All golfers have been assigned. May the best pool team win!</p>
          <Button
            onClick={() => {
              setPhase('setup');
              setDrawn([]);
              setCurrentDraw(null);
              setDraftGroup('A');
            }}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2 rounded-lg"
          >
            New Draft
          </Button>
        </div>
      )}
    </div>
  );
}