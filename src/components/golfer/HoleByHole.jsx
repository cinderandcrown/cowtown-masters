import React, { useState } from 'react';

const formatScore = (s) => (s === 0 ? 'E' : s > 0 ? `+${s}` : `${s}`);

const scoreColor = (s) => {
  if (s < -1) return 'bg-red-600 text-white';
  if (s < 0) return 'bg-orange-500 text-white';
  if (s === 0) return 'bg-accent text-foreground';
  if (s === 1) return 'bg-primary/20 text-primary';
  return 'bg-primary/10 text-primary';
};

export default function HoleByHole({ golfer }) {
  const [selectedRound, setSelectedRound] = useState(1);

  // Generate mock hole-by-hole data (par 72 course)
  const generateHoleData = (roundScore) => {
    if (roundScore === 0) return null;

    const holes = [];
    let remaining = roundScore;
    const pars = [4, 4, 3, 4, 4, 4, 3, 4, 4, 4, 4, 3, 4, 4, 4, 3, 4, 4];

    for (let i = 0; i < 18; i++) {
      const par = pars[i];
      const holeScore = remaining > -3 ? -Math.floor(Math.random() * 2) : Math.floor(Math.random() * 2);
      holes.push({
        hole: i + 1,
        par,
        score: holeScore,
        strokes: par + holeScore,
      });
      remaining -= holeScore;
    }

    return holes;
  };

  const roundScores = [golfer.round_1, golfer.round_2, golfer.round_3, golfer.round_4];
  const rounds = [
    { label: 'Round 1', score: golfer.round_1 },
    { label: 'Round 2', score: golfer.round_2 },
    { label: 'Round 3', score: golfer.round_3 },
    { label: 'Round 4', score: golfer.round_4 },
  ];

  const completedRounds = rounds.filter((_, idx) => roundScores[idx] !== 0);

  if (completedRounds.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-primary/5 rounded-lg border border-primary/10">
        <p className="text-muted-foreground text-sm">No round data available</p>
      </div>
    );
  }

  const holeData = generateHoleData(roundScores[selectedRound - 1]);

  return (
    <div className="space-y-4">
      {/* Round Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {rounds.map((round, idx) => (
          roundScores[idx] !== 0 && (
            <button
              key={idx}
              onClick={() => setSelectedRound(idx + 1)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap font-semibold transition ${
                selectedRound === idx + 1
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary/10 text-primary border border-primary/20'
              }`}
            >
              {round.label} ({formatScore(roundScores[idx])})
            </button>
          )
        ))}
      </div>

      {/* Hole Grid */}
      {holeData && (
        <div className="space-y-4">
          {/* Front 9 */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-2">Front 9</h3>
            <div className="grid grid-cols-9 gap-1">
              {holeData.slice(0, 9).map((hole) => (
                <div
                  key={hole.hole}
                  className={`text-center rounded-lg p-2 border ${scoreColor(hole.score)}`}
                >
                  <p className="text-xs font-bold">#{hole.hole}</p>
                  <p className="text-lg font-black">{hole.strokes}</p>
                  <p className="text-xs opacity-70">(Par {hole.par})</p>
                </div>
              ))}
            </div>
          </div>

          {/* Back 9 */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-2">Back 9</h3>
            <div className="grid grid-cols-9 gap-1">
              {holeData.slice(9, 18).map((hole) => (
                <div
                  key={hole.hole}
                  className={`text-center rounded-lg p-2 border ${scoreColor(hole.score)}`}
                >
                  <p className="text-xs font-bold">#{hole.hole}</p>
                  <p className="text-lg font-black">{hole.strokes}</p>
                  <p className="text-xs opacity-70">(Par {hole.par})</p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/10 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">TOTAL</p>
              <p className="text-xl font-black text-primary">{holeData.reduce((sum, h) => sum + h.strokes, 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">TO PAR</p>
              <p className={`text-xl font-black ${roundScores[selectedRound - 1] < 0 ? 'text-red-600' : 'text-primary'}`}>
                {formatScore(roundScores[selectedRound - 1])}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">BIRDIES</p>
              <p className="text-xl font-black text-accent">
                {holeData.filter((h) => h.score < 0).length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}