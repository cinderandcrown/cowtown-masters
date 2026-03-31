import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { assignGroups } from '@/lib/groupUtils';
import { Users } from 'lucide-react';
import { formatScore, scoreColor, parseTeamEmails } from '@/lib/scoreUtils';

function GolferCard({ golfer, group }) {
  if (!golfer) {
    return (
      <div className="bg-muted/50 rounded-lg p-3 border border-dashed border-muted-foreground/30 text-center">
        <p className="text-xs text-muted-foreground">No Group {group} golfer drafted</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg p-3 shadow-sm ${group === 'A' ? 'border-l-4 border-l-primary border border-primary/10' : 'border-l-4 border-l-accent border border-accent/15'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-bold tracking-widest ${group === 'A' ? 'text-primary' : 'text-accent'}`}>
          GRP {group}
        </span>
        {golfer.position && (
          <span className="text-xs font-semibold text-muted-foreground">Pos: {golfer.position}</span>
        )}
      </div>
      <p className="text-sm font-bold text-foreground truncate">{golfer.name}</p>
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex gap-2">
          {[golfer.round_1, golfer.round_2, golfer.round_3, golfer.round_4].map((r, i) => (
            <span key={i} className={`text-xs font-semibold ${scoreColor(r)}`}>
              R{i + 1}: {formatScore(r)}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-primary/10">
        <span className="text-xs text-muted-foreground">
          {golfer.thru ? `Thru ${golfer.thru}` : ''}
          {golfer.status !== 'active' && (
            <span className="ml-1 text-destructive font-bold uppercase">{golfer.status}</span>
          )}
        </span>
        <span className={`text-lg font-black ${scoreColor(golfer.score_to_par)}`}>
          {formatScore(golfer.score_to_par)}
        </span>
      </div>
    </div>
  );
}

function TeamCard({ entry, golferA, golferB, rank }) {
  const totalScore = (golferA?.score_to_par || 0) + (golferB?.score_to_par || 0);

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden transition-all ${
      rank === 1 ? 'border-accent/40 bg-accent/5 shadow-accent/20 shadow-md' : rank <= 3 ? 'border-primary/20 bg-primary/5' : 'border-primary/10 bg-white hover:shadow-md'
    }`}>
      {/* Team Header */}
      <div className={`flex items-center justify-between px-4 py-3 ${
        rank === 1 ? 'bg-gradient-to-r from-secondary to-primary' : 'bg-primary/5'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`font-black text-lg ${rank === 1 ? 'text-accent' : rank <= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            {rank === 1 ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
          </span>
          <div>
            <p className={`font-bold ${rank === 1 ? 'text-primary-foreground text-lg' : 'text-foreground'}`}>
              {entry.team_name || entry.participant_name}
            </p>
            {entry.team_name && (
              <p className={`text-xs ${rank === 1 ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{entry.participant_name}</p>
            )}
            {(() => {
              const teamEmails = parseTeamEmails(entry.user_id);
              return teamEmails.length > 1 ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <Users className={`w-3 h-3 ${rank === 1 ? 'text-accent/50' : 'text-muted-foreground'}`} />
                  <span className={`text-[10px] ${rank === 1 ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                    {teamEmails.length} members
                  </span>
                </div>
              ) : null;
            })()}
          </div>
        </div>
        <div className={`text-2xl font-black ${rank === 1 ? scoreColor(totalScore) : scoreColor(totalScore)} bg-accent/10 rounded-lg px-3 py-1`}>
          {formatScore(totalScore)}
        </div>
      </div>

      {/* Golfer Cards */}
      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <GolferCard golfer={golferA} group="A" />
        <GolferCard golfer={golferB} group="B" />
      </div>
    </div>
  );
}

export default function TeamsTab({ poolId }) {
  const { data: entries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['poolEntries', poolId],
    queryFn: () => base44.entities.PoolEntry.filter({ pool_id: poolId }),
    enabled: !!poolId,
  });

  const { data: rawGolfers = [], isLoading: loadingGolfers } = useQuery({
    queryKey: ['poolGolfers', poolId],
    queryFn: () => base44.entities.Golfer.filter({ pool_id: poolId }),
    enabled: !!poolId,
  });

  if (loadingEntries || loadingGolfers) {
    return (
      <div className="px-3 pt-3 pb-6 space-y-3">
        <div className="text-center mb-2">
          <div className="h-6 w-40 mx-auto bg-primary/10 rounded animate-pulse" />
          <div className="h-3 w-48 mx-auto mt-2 bg-primary/5 rounded animate-pulse" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-primary/10 overflow-hidden">
            <div className="h-16 bg-primary/5 animate-pulse" />
            <div className="p-3 grid grid-cols-2 gap-2">
              <div className="h-24 rounded-lg bg-muted/50 animate-pulse" />
              <div className="h-24 rounded-lg bg-muted/50 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Build golfer lookup by ID
  const golferMap = {};
  for (const g of rawGolfers) {
    golferMap[g.id] = g;
  }

  // Build ranked team list
  const teams = entries.map((entry) => {
    const golferA = entry.golfer_a_id ? golferMap[entry.golfer_a_id] : null;
    const golferB = entry.golfer_b_id ? golferMap[entry.golfer_b_id] : null;
    const totalScore = (golferA?.score_to_par || 0) + (golferB?.score_to_par || 0);
    return { entry, golferA, golferB, totalScore };
  }).sort((a, b) => a.totalScore - b.totalScore);

  return (
    <div className="px-3 pt-3 pb-6 space-y-3">
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          Team Standings
        </h2>
        <p className="text-xs text-muted-foreground">{teams.length} teams · Combined score-to-par</p>
      </div>

      {teams.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-lg mb-1">No teams yet</p>
          <p className="text-sm">Participants need to draft golfers first</p>
        </div>
      )}

      {teams.map((team, i) => (
        <div key={team.entry.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
          <TeamCard
            entry={team.entry}
            golferA={team.golferA}
            golferB={team.golferB}
            rank={i + 1}
          />
        </div>
      ))}
    </div>
  );
}