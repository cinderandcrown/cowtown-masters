import React from 'react';
import { DollarSign, Layers, Shuffle, Target, Scissors, AlertTriangle, Scale, Trophy, Info } from 'lucide-react';

const RULES = [
  {
    Icon: DollarSign,
    title: 'Entry Fee',
    items: ['$50 per golfer', 'Each entry receives 2 golfers: 1 Top Tier + 1 Bottom Tier'],
    highlight: 'Total per entry: $100',
  },
  {
    Icon: Layers,
    title: 'Golfer Tiers',
    items: ['Golfers are split into Top Tier and Bottom Tier based on Vegas odds.', 'Example: 25 entries = 50 golfers total', 'Top 25 = Top Tier, 26\u201350 = Bottom Tier'],
  },
  {
    Icon: Shuffle,
    title: 'Random Draw',
    items: ['Golfers assigned via random draw (names out of a hat).', 'Draw is recorded and shared with all participants.', 'Total golfers depends on number of paid entries.'],
  },
  {
    Icon: Target,
    title: 'Scoring',
    items: ['Score = combined total of both golfers\u2019 scores to par.'],
    example: 'Morikawa -4, Fowler -3 \u2192 Total = -7',
  },
  {
    Icon: Scissors,
    title: 'Missed Cut Rule',
    items: [<>If a golfer misses the cut, you take their score at the <strong>end of Friday&apos;s round</strong>.</>],
    example: 'Mickelson +7 (MC after Friday), Straka -7 \u2192 Total = 0',
  },
  {
    Icon: AlertTriangle,
    title: 'Withdrawal Rule',
    items: [<>If <strong>either</strong> of your golfers withdraws from the tournament, you will receive your money back.</>],
  },
  {
    Icon: Scale,
    title: 'Tie Breaker',
    items: ['Lowest individual score from either golfer.'],
    example: 'Player A (-7, -3 = -10) vs Player B (-8, -2 = -10) \u2014 Player B wins with -8',
  },
  {
    Icon: Trophy,
    title: 'Payout',
    items: ['1st Place: 60% of final pot', '2nd Place: 25% of final pot', '3rd Place: 15% of final pot'],
  },
];

export default function RulesTab() {
  return (
    <div className="px-3 pt-3 pb-0 space-y-2.5">
      <div className="text-center mb-3">
        <h2 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
          Pool Rules
        </h2>
        <p className="text-xs text-muted-foreground">The Official Cowtown Masters Rules</p>
      </div>

      {RULES.map((rule, i) => (
        <div
          key={i}
          className="animate-fade-in-up bg-card rounded-xl p-3.5 border border-border hover:border-primary/20 transition"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
              <rule.Icon className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-bold text-foreground text-sm">{rule.title}</h3>
          </div>

          <ul className="space-y-1 ml-[42px]">
            {rule.items.map((item, j) => (
              <li key={j} className="text-xs text-muted-foreground leading-relaxed flex gap-1.5">
                <span className="text-primary/30 mt-0.5 flex-shrink-0">\u2022</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {rule.highlight && (
            <div className="ml-[42px] mt-2 inline-block bg-accent/10 text-accent font-bold text-xs px-2.5 py-1 rounded-md border border-accent/20">
              {rule.highlight}
            </div>
          )}

          {rule.example && (
            <div className="ml-[42px] mt-2 bg-muted/30 rounded-md px-2.5 py-1.5 border border-border">
              <span className="text-[9px] font-bold text-primary/60 tracking-widest uppercase">Example</span>
              <p className="text-xs text-foreground font-medium">{rule.example}</p>
            </div>
          )}
        </div>
      ))}

      <div className="animate-fade-in-up flex items-start gap-2.5 bg-accent/8 rounded-xl p-3 border border-accent/15" style={{ animationDelay: `${RULES.length * 50}ms` }}>
        <Info className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
        <p className="text-xs text-foreground leading-relaxed">
          <strong>Note:</strong> Group sizes are dynamic based on the number of paid entries. Both tiers will always be equal in size.
        </p>
      </div>
    </div>
  );
}
