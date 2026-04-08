import React from 'react';
import { DollarSign, Layers, Shuffle, Target, Scissors, AlertTriangle, Scale, Trophy, Info } from 'lucide-react';

const RULES = [
  {
    Icon: DollarSign,
    title: 'Entry Fee',
    items: [
      '$50 per golfer',
      'Each entry receives 2 golfers: 1 Top Tier + 1 Bottom Tier',
    ],
    highlight: 'Total per entry: $100',
  },
  {
    Icon: Layers,
    title: 'Golfer Tiers',
    items: [
      'Golfers are split into Top Tier and Bottom Tier based on Vegas odds.',
      'Example: 25 entries = 50 golfers total',
      'Top 25 = Top Tier',
      '26–50 = Bottom Tier',
    ],
  },
  {
    Icon: Shuffle,
    title: 'Random Draw',
    items: [
      'Golfers assigned via random draw (names out of a hat).',
      'Draw will be recorded and shared.',
      'Total golfers depends on number of paid entries.',
    ],
  },
  {
    Icon: Target,
    title: 'Scoring',
    items: [
      'Score = combined total of both golfers.',
    ],
    example: 'Morikawa -4, Fowler -3 → Total = -7',
  },
  {
    Icon: Scissors,
    title: 'Missed Cut Rule',
    items: [
      <>If a golfer misses the cut, you take their score at the <strong>END OF FRIDAY&apos;S ROUND</strong>.</>,
    ],
    example: 'Mickelson +7 (MC after Friday), Straka -7 → Total = 0',
  },
  {
    Icon: AlertTriangle,
    title: 'Withdrawal Rule',
    items: [
      <>If <strong>either</strong> of your golfers withdraws from the tournament, you will receive your money back.</>,
    ],
  },
  {
    Icon: Scale,
    title: 'Tie Breaker',
    items: [
      'Lowest individual score from either golfer.',
    ],
    example: 'Player A (-7, -3 = -10) vs Player B (-8, -2 = -10) — Player B wins with -8',
  },
  {
    Icon: Trophy,
    title: 'Payout',
    items: [
      '🥇 1st Place: 70% of final pot',
      '🥈 2nd Place: 20% of final pot',
      '🥉 3rd Place: 10% of final pot',
    ],
  },
];

export default function RulesTab() {
  return (
    <div className="px-3 pt-3 pb-0 space-y-3">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
          Masters Pool Rules
        </h2>
        <p className="text-sm text-muted-foreground">The Official Cowtown Masters Rules</p>
      </div>

      {RULES.map((rule, i) => (
        <div
          key={i}
          className={`animate-fade-in-up rounded-xl p-4 border hover:shadow-sm transition ${i % 3 === 0 ? 'bg-primary/8 border-primary/15' : i % 3 === 1 ? 'bg-muted/30 border-border' : 'bg-accent/8 border-accent/15'}`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <rule.Icon className="w-4 h-4 text-primary" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-foreground text-sm">{rule.title}</h3>
          </div>

          <ul className="space-y-1 ml-[42px]" role="list">
            {rule.items.map((item, j) => (
              <li key={j} className="text-xs text-muted-foreground leading-relaxed flex gap-1.5">
                <span className="text-primary/40 mt-0.5 flex-shrink-0" aria-hidden="true">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {rule.highlight && (
            <div className="ml-[42px] mt-2 inline-block bg-accent/15 text-accent font-bold text-xs px-2.5 py-1 rounded-md border border-accent/25">
              {rule.highlight}
            </div>
          )}

          {rule.example && (
            <div className="ml-[42px] mt-2 bg-primary/5 rounded-md px-2.5 py-1.5 border border-primary/10">
              <span className="text-[11px] font-bold text-primary/60 tracking-widest uppercase">Example</span>
              <p className="text-xs text-foreground font-medium">{rule.example}</p>
            </div>
          )}
        </div>
      ))}

      {/* Note */}
      <div className="animate-fade-in-up flex items-start gap-2.5 bg-accent/10 rounded-xl p-3 border border-accent/20" style={{ animationDelay: `${RULES.length * 60}ms` }}>
        <Info className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-foreground leading-relaxed">
          <strong>Note:</strong> Group sizes are dynamic — based on the number of paid entries. Both groups will always be equal in size.
        </p>
      </div>
    </div>
  );
}