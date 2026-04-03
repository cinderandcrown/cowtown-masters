import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Star, Trophy } from 'lucide-react';
import GolferDetailModal from '@/components/pool/GolferDetailModal';
import { formatScore, scoreColor, parseTeamEmails } from '@/lib/scoreUtils';
import { useParticipant } from '@/lib/ParticipantContext';

function GolferMiniCard({ golfer, group, onTap }) {
  if (!golfer) {
    return (
      <div className="flex-1 bg-muted/30 rounded-lg p-2.5 border border-dashed border-muted-foreground/20 text-center">
        <p className="text-[10px] text-muted-foreground">No golfer drafted</p>
      </div>
    );
  }

  const statusBadge = golfer.status === 'cut' ? 'CUT' : golfer.status === 'withdrawn' ? 'WD' : null;

  return (
    <div
      className={`flex-1 bg-card rounded-lg p-2.5 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] ${
        group === 'A' ? 'border-l-3 border-l-primary border border-border' : 'border-l-3 border-l-accent border border-border'
      }`}
      onClick={() => onTap && onTap(golfer)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap && onTap(golfer); } }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[9px] font-bold tracking-widest ${group === 'A' ? 'text-primary' : 'text-accent'}`}>
          {group === 'A' ? 'TOP' : 'BTM'}
        </span>
        {statusBadge && (
          <span className={`text-[8px] font-bold px-1 rounded ${golfer.status === 'cut' ? 'text-destructive bg-destructive/10' : 'text-orange-600 bg-orange-500/10'}`}>
            {statusBadge}
          </span>
        )}
      </div>
      <p className="text-xs font-bold text-foreground truncate">{golfer.name}</p>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-muted-foreground">
          {golfer.thru ? `Thru ${golfer.thru}` : golfer.position || ''}
        </span>
        <span className={`text-base font-black tabular-nums ${scoreColor(golfer.score_to_par)}`}>
          {formatScore(golfer.score_to_par)}
        </span>
      </div>
    </div>
  );
}

function TeamCard({ entry, golferA, golferB, rank, isMyEntry, onGolferTap }) {
  const totalScore = (golferA?.score_to_par || 0) + (golferB?.score_to_par || 0);

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${
      isMyEntry ? 'border-accent/40 bg-accent/5 shadow-md ring-1 ring-accent/20' :
      rank === 1 ? 'border-accent/30 bg-accent/3 shadow-md shadow-accent/10' :
      rank <= 3 ? 'border-primary/20 bg-primary/3' :
      'border-border bg-card hover:shadow-sm'
    }`}>
      {/* Team Header */}
      <div className={`flex items-center justify-between px-3.5 py-2.5 ${
        rank === 1 ? 'bg-gradient-to-r from-[#0a3d0a] to-primary' : 'bg-muted/30'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={`font-black text-sm flex-shrink-0 ${rank === 1 ? 'text-accent' : rank <= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            #{rank}
          </span>
          {isMyEntry && <Star className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
          <div className="min-w-0">
            <p className={`font-bold text-sm truncate ${rank === 1 ? 'text-primary-foreground' : 'text-foreground'}`}>
              {entry.team_name || entry.participant_name}
            </p>
            {entry.team_name && (
              <p className={`text-[10px] truncate ${rank === 1 ? 'text-primary-foreground/50' : 'text-muted-foreground'}`}>{entry.participant_name}</p>
            )}
            {(() => {
              const teamEmails = parseTeamEmails(entry.user_id);
              return teamEmails.length > 1 ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <Users className={`w-3 h-3 ${rank === 1 ? 'text-accent/50' : 'text-muted-foreground'}`} />
                  <span className={`text-[9px] ${rank === 1 ? 'text-primary-foreground/50' : 'text-muted-foreground'}`}>{teamEmails.length} members</span>
                </div>
              ) : null;
            })()}
          </div>
        </div>
        <div className={`text-xl font-black tabular-nums px-2.5 py-1 rounded-lg ${
          rank === 1 ? 'bg-white/10' : 'bg-primary/8'
        } ${scoreColor(totalScore)}`}>
          {formatScore(totalScore)}
        </div>
      </div>

      {/* Golfer Cards */}
      <div className="p-2.5 flex gap-2">
        <GolferMiniCard golfer={golferA} group="A" onTap={onGolferTap} />
        <GolferMiniCard golfer={golferB} group="B" onTap={onGolferTap} />
      </div>
    </div>
  );
}

export default function TeamsTab({ poolId }) {
  const [selectedGolfer, setSelectedGolfer] = useState(null);
  const { participant } = useParticipant();

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
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border overflow-hidden">
            <div className="h-14 bg-muted/30 animate-pulse" />
            <div className="p-2.5 flex gap-2">
              <div className="flex-1 h-20 rounded-lg bg-muted/30 animate-pulse" />
              <div className="flex-1 h-20 rounded-lg bg-muted/30 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const golferMap = {};
  for (const g of rawGolfers) golferMap[g.id] = g;

  const teams = entries.map((entry) => {
    const golferA = entry.golfer_a_id ? golferMap[entry.golfer_a_id] : null;
    const golferB = entry.golfer_b_id ? golferMap[entry.golfer_b_id] : null;
    const totalScore = (golferA?.score_to_par || 0) + (golferB?.score_to_par || 0);
    return { entry, golferA, golferB, totalScore };
  }).sort((a, b) => a.totalScore - b.totalScore);

  return (
    <div className="px-3 pt-3 pb-0 space-y-2.5">
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          Team Standings
        </h2>
        <p className="text-xs text-muted-foreground">{teams.length} teams · Combined score to par</p>
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground/15 mx-auto mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">No teams yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Run the hat draw to assign golfers to teams</p>
        </div>
      )}

      {teams.map((team, i) => (
        <div key={team.entry.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(i * 60, 400)}ms` }}>
          <TeamCard
            entry={team.entry}
            golferA={team.golferA}
            golferB={team.golferB}
            rank={i + 1}
            isMyEntry={participant?.entry_id === team.entry.id}
            onGolferTap={setSelectedGolfer}
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
