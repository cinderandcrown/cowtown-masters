import React from 'react';

const RULES = [
  {
    icon: '👥',
    title: 'The Pool',
    desc: 'Each participant pays the entry fee and receives two golfers: one from Group A (favorites) and one from Group B (longshots).',
  },
  {
    icon: '📊',
    title: 'Group Split',
    desc: 'Golfers are divided into A & B groups based on pre-tournament betting odds. The top half by odds go to Group A, the rest to Group B.',
  },
  {
    icon: '🎩',
    title: 'The Hat Draw',
    desc: 'Names are drawn from a hat — first Group A picks, then Group B. Pure luck of the draw. No trading, no swaps.',
  },
  {
    icon: '⛳',
    title: 'Scoring',
    desc: 'Your total score = Group A golfer's final score to par + Group B golfer's final score to par. Lowest combined score wins.',
  },
  {
    icon: '✂️',
    title: 'Missed Cuts',
    desc: 'If your golfer misses the cut, their score at the cut line carries through all 4 rounds. They earn no improvement from the weekend.',
  },
  {
    icon: '💰',
    title: 'Payouts',
    desc: 'Prize pool is split among top finishers. Exact payout structure is set before tournament week.',
  },
  {
    icon: '🏆',
    title: 'The Green Jacket',
    desc: 'The winner gets eternal bragging rights and their name on the Cowtown Champions Wall.',
  },
];

export default function RulesTab() {
  return (
    <div className="px-3 pt-3 pb-6 space-y-3">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
          How It Works
        </h2>
        <p className="text-sm text-muted-foreground">The Official Cowtown Masters Rules</p>
      </div>

      {RULES.map((rule, i) => (
        <div
          key={i}
          className="bg-white rounded-lg p-4 border border-primary/10 hover:border-primary/30 hover:shadow-sm transition flex gap-3"
        >
          <span className="text-3xl flex-shrink-0 filter drop-shadow">{rule.icon}</span>
          <div>
            <h4 className="font-bold text-foreground text-sm mb-1">{rule.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{rule.desc}</p>
          </div>
        </div>
      ))}

      <div className="bg-gradient-to-br from-secondary to-primary rounded-xl p-4 border border-accent/30 mt-6">
        <p className="text-sm text-primary-foreground font-semibold text-center">
          Questions? Ask your pool admin for details on entry fees & payout structure.
        </p>
      </div>
    </div>
  );
}