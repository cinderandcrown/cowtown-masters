import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { getParticipantHistory } from '@/lib/poolHistoryData';
import ParticipantStats from '@/components/participant/ParticipantStats';
import ParticipantYearCard from '@/components/participant/ParticipantYearCard';
import CurrentYearPicks from '@/components/participant/CurrentYearPicks';

export default function ParticipantProfile() {
  const { name } = useParams();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(name);
  const history = getParticipantHistory(decodedName);
  const wins = history.filter((r) => r.isWinner).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-secondary to-primary border-b-2 border-accent px-4 py-3">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white/10 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              {decodedName}
            </h1>
            <p className="text-[10px] text-accent tracking-widest uppercase">
              {wins > 0 ? `${wins}x Champion` : 'Pool Participant'}
            </p>
          </div>
          {wins > 0 && <Trophy className="w-6 h-6 text-accent" />}
        </div>
      </header>

      <main className="max-w-md mx-auto px-3 pt-4 pb-12 space-y-4">
        <ParticipantStats history={history} />
        <CurrentYearPicks participantName={decodedName} />

        {history.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-primary tracking-widest uppercase">Past Results</h3>
            {history.map((result) => (
              <ParticipantYearCard key={result.year} result={result} />
            ))}
          </div>
        )}

        {history.length === 0 && (
          <div className="bg-card rounded-lg border border-border p-6 text-center">
            <p className="text-muted-foreground text-sm">No historical results found for this participant.</p>
          </div>
        )}
      </main>
    </div>
  );
}