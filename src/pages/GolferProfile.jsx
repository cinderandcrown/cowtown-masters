import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GolferHeader from '@/components/golfer/GolferHeader';
import ScoreChart from '@/components/golfer/ScoreChart';
import HoleByHole from '@/components/golfer/HoleByHole';
import PerformanceTrends from '@/components/golfer/PerformanceTrends';

export default function GolferProfile() {
  const { golferId, poolId } = useParams();
  const navigate = useNavigate();

  const { data: golfer, isLoading } = useQuery({
    queryKey: ['golfer', golferId],
    queryFn: async () => {
      const all = await base44.asServiceRole.entities.Golfer.list();
      return all.find((g) => g.id === golferId);
    },
    enabled: !!golferId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-card flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!golfer) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-card p-4 flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Golfer not found</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  const formatScore = (s) => (s === 0 ? 'E' : s > 0 ? `+${s}` : `${s}`);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-secondary to-primary border-b-2 border-accent px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            {golfer.name}
          </h1>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Golfer Header Card */}
        <GolferHeader golfer={golfer} />

        {/* Score Evolution Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-primary/10 p-4">
          <h2 className="text-lg font-bold text-foreground mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Score Progression
          </h2>
          <ScoreChart golfer={golfer} />
        </div>

        {/* Performance Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-primary/10 p-4">
          <h2 className="text-lg font-bold text-foreground mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Tournament Trends
          </h2>
          <PerformanceTrends golfer={golfer} />
        </div>

        {/* Hole-by-Hole Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-primary/10 p-4">
          <h2 className="text-lg font-bold text-foreground mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Round Details
          </h2>
          <HoleByHole golfer={golfer} />
        </div>
      </main>
    </div>
  );
}