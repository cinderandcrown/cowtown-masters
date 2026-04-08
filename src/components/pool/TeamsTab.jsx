import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

import { Users, Star } from 'lucide-react';
import { useParticipant } from '@/lib/ParticipantContext';
import GolferDetailModal from '@/components/pool/GolferDetailModal';
import { formatScore, scoreColor, parseTeamEmails } from '@/lib/scoreUtils';

function GolferCard({ golfer, group, onTap }) {
  if (!golfer) {
    return (
      <div className="bg-muted/50 rounded-xl p-3 border border-dashed border-muted-foreground/30 text-center">
        <p className="text-xs text-muted-foreground">TBD — Awaiting Draft</p>
      </div>
    );
  }

  return (
    <div
      className={`bg-card rounded-xl p-3 shadow-sm cursor-pointer hover:border-primary/30 hover:shadow-md transition-all active:scale-[0.98] ${group === 'A' ? 'border-l-4 border-l-primary border border-primary/10' : 'border-l-4 border-l-accent border border-accent/15'}`}
      onClick={() => onTap && onTap(golfer)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap && onTap(golfer); } }}
      aria-label={`View details for ${golfer.name}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-bold tracking-widest ${group === 'A' ? 'text-primary' : 'text-accent'}`}>
          {group === 'A' ? 'TOP' : 'BTM'}
        </span>
        {golfer.position && (
          <span className="text-xs font-semibold text-muted-foreground">Pos: {golfer.position}</span>
        )}
      </div>
      <p className="text-sm font-bold text-foreground truncate" title={golfer.name}>{golfer.name}</p>
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

function TeamCard({ entry, golferA, golferB, rank, onGolferTap, isMyTeam }) {
  const totalScore = (golferA?.score_to_par || 0) + (golferB?.score_to_par || 0);

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden transition-all ${
      isMyTeam ? 'border-accent/40 bg-accent/5 ring-1 ring-accent/20 shadow-md' : rank === 1 ? 'border-accent/40 bg-accent/5 shadow-accent/20 shadow-md' : rank <= 3 ? 'border-primary/20 bg-primary/5' : 'border-primary/10 bg-card hover:shadow-md'
    }`}>
      {/* Team Header */}
      <div className={`flex items-center justify-between px-4 py-3 ${
        rank === 1 ? 'bg-gradient-to-r from-secondary to-primary' : 'bg-primary/5'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`font-black text-lg ${rank === 1 ? 'text-accent' : rank <= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            #{rank}
          </span>
          <div>
            <p className={`font-bold flex items-center gap-1.5 ${rank === 1 ? 'text-primary-foreground text-lg' : 'text-foreground'}`}>
              {isMyTeam && <Star className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
              <span className="truncate">{entry.team_name || entry.participant_name}</span>
            </p>
            {entry.team_name && (
              <p className={`text-xs truncate ${rank === 1 ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{entry.participant_name}</p>
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
        <GolferCard golfer={golferA} group="A" onTap={onGolferTap} />
        <GolferCard golfer={golferB} group="B" onTap={onGolferTap} />
      </div>
    </div>
  );
}

export default function TeamsTab({ poolId }) {
  const [selectedGolfer, setSelectedGolfer] = useState(null);
  const { isLoggedIn, participant } = useParticipant();
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
      <div className="px-3 pt-3 pb-0 space-y-3">
        <div className="text-center mb-2">
          <div className="h-6 w-40 mx-auto bg-primary/10 rounded animate-pulse" />
          <div className="h-3 w-48 mx-auto mt-2 bg-primary/5 rounded animate-pulse" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-primary/10 overflow-hidden" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-center justify-between px-4 py-3 bg-primary/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                <div className="space-y-1">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-16 bg-muted/50 animate-pulse rounded" />
                </div>
              </div>
              <div className="h-8 w-14 bg-muted animate-pulse rounded-lg" />
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-primary/10 p-3 space-y-2">
                <div className="h-3 w-12 bg-primary/10 animate-pulse rounded" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="flex gap-2 mt-1">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-3 w-8 bg-muted/50 animate-pulse rounded" />
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-primary/5">
                  <div className="h-3 w-12 bg-muted/50 animate-pulse rounded" />
                  <div className="h-5 w-10 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="rounded-lg border border-accent/10 p-3 space-y-2">
                <div className="h-3 w-12 bg-accent/10 animate-pulse rounded" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="flex gap-2 mt-1">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-3 w-8 bg-muted/50 animate-pulse rounded" />
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-accent/5">
                  <div className="h-3 w-12 bg-muted/50 animate-pulse rounded" />
                  <div className="h-5 w-10 bg-muted animate-pulse rounded" />
                </div>
              </div>
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
    <div className="px-3 pt-3 pb-0 space-y-3">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          Team Standings
        </h2>
        <p className="text-xs text-muted-foreground">{teams.length} teams · Combined score-to-par</p>
      </div>

      {teams.length === 0 && (
        <div className="bg-gradient-to-br from-[#0a3d0a] to-primary rounded-xl p-8 text-center relative overflow-hidden border border-accent/30 shadow-lg shadow-primary/20">
          <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-20" />
          <div className="relative">
            <Users className="w-14 h-14 text-accent mx-auto mb-4 animate-pulse" />
            <h3 className="text-2xl font-bold text-primary-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Teams Await
            </h3>
            <p className="text-sm text-primary-foreground/70 max-w-xs mx-auto leading-relaxed">
              Run the hat draw to assign golfers and see your team matchups come to life.
            </p>
          </div>
        </div>
      )}

      {teams.map((team, i) => (
        <div key={team.entry.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
          <TeamCard
            entry={team.entry}
            golferA={team.golferA}
            golferB={team.golferB}
            rank={i + 1}
            onGolferTap={setSelectedGolfer}
            isMyTeam={isLoggedIn && team.entry.id === participant?.entry_id}
          />
        </div>
      ))}

      <GolferDetailModal
        golfer={selectedGolfer}
        open={!!selectedGolfer}
        onOpenChange={(open) => !open && setSelectedGolfer(null)}
      />
    </div>
  );
}