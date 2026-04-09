import React, { useState, useCallback, useEffect, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PoolLayout from '@/components/layout/PoolLayout';
import Leaderboard from '@/components/pool/Leaderboard.jsx';
import GolfersTab from '@/components/pool/GolfersTab.jsx';
import DrawTab from '@/components/pool/DrawTab.jsx';
import MessagingHub from '@/components/pool/MessagingHub.jsx';
import HistoryTab from '@/components/pool/HistoryTab';
import RulesTab from '@/components/pool/RulesTab';
import TeamsTab from '@/components/pool/TeamsTab';
import EntryDetailModal from '@/components/pool/EntryDetailModal';
import usePullToRefresh from '@/hooks/usePullToRefresh.jsx';
import AddToHomeScreen from '@/components/pool/AddToHomeScreen';
import ErrorBoundary from '@/components/ErrorBoundary';
import ScoreFlashOverlay from '@/components/pool/ScoreFlashOverlay';
import { Button } from '@/components/ui/button';
import GolferNewsTab from '@/components/pool/GolferNewsTab';
import CaddyshackTab from '@/components/pool/CaddyshackTab';

const VALID_TABS = ['leaderboard', 'teams', 'golfers', 'draw', 'messages', 'news', 'history', 'rules', 'caddyshack-report'];

export default function PoolDashboard() {
  const { poolId, activeTab: tabParam } = useParams();
  const navigate = useNavigate();
  const activeTab = VALID_TABS.includes(tabParam) ? tabParam : 'leaderboard';
  const [selectedEntry, setSelectedEntry] = useState(null);
  const queryClient = useQueryClient();

  const { data: pool, isError: poolError, refetch: refetchPool, isLoading: poolLoading } = useQuery({
    queryKey: ['pool', poolId],
    queryFn: () => base44.entities.Pool.filter({ id: poolId }),
    enabled: !!poolId,
    select: (data) => data[0],
    retry: 2,
  });

  // Redirect to /pool/:poolId/leaderboard if no valid tab
  useEffect(() => {
    if (!tabParam || !VALID_TABS.includes(tabParam)) {
      navigate(`/pool/${poolId}/leaderboard`, { replace: true });
    }
  }, [tabParam, poolId, navigate]);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['poolEntries', poolId] });
    await queryClient.invalidateQueries({ queryKey: ['poolGolfers', poolId] });
    await queryClient.invalidateQueries({ queryKey: ['chatMessages', poolId] });
    await queryClient.invalidateQueries({ queryKey: ['dmSent', poolId] });
    await queryClient.invalidateQueries({ queryKey: ['dmReceived', poolId] });
    await queryClient.invalidateQueries({ queryKey: ['notifications', poolId] });
  }, [queryClient, poolId]);

  const { pullProps, PullIndicator } = usePullToRefresh(handleRefresh);

  // Scroll to top on initial load
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  useEffect(() => {
    const tabNames = {
      leaderboard: 'Leaderboard',
      teams: 'Teams',
      golfers: 'Field',
      draw: 'Draw',
      messages: 'Smack Talk',
      news: 'News',
      rules: 'Rules',
      history: 'History',
      'caddyshack-report': 'Caddyshack Report',
    };
    document.title = `Cowtown Masters - ${tabNames[activeTab] || 'Pool'}`;
  }, [activeTab]);

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab]);

  const handleTabChange = useCallback((tab) => {
    navigate(`/pool/${poolId}/${tab}`);
  }, [navigate, poolId]);

  // Get golfers for score flash overlay
  const { data: flashGolfers = [] } = useQuery({
    queryKey: ['poolGolfers', poolId],
    queryFn: () => base44.entities.Golfer.filter({ pool_id: poolId }),
    enabled: !!poolId,
    refetchInterval: 60000,
    retry: 2,
  });

  if (poolError && !pool) {
    return (
      <PoolLayout>
        <div className="px-4 pt-20 pb-8 text-center">
          <div className="bg-card rounded-xl border border-destructive/20 p-8 max-w-sm mx-auto">
            <p className="text-lg font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Unable to Load Pool</p>
            <p className="text-sm text-muted-foreground mb-4">We couldn't reach the server. Check your connection and try again.</p>
            <Button onClick={() => refetchPool()} className="bg-primary text-white">Try Again</Button>
          </div>
        </div>
      </PoolLayout>
    );
  }

  return (
    <PoolLayout>
      <ScoreFlashOverlay poolId={poolId} golfers={flashGolfers} />
      <div {...pullProps} className="min-h-[60vh]">
        <PullIndicator />
        {activeTab === 'leaderboard' && (
          <ErrorBoundary fallbackMessage="Leaderboard couldn't load.">
            <AddToHomeScreen />
            <Leaderboard poolId={poolId} onSelectEntry={setSelectedEntry} />
          </ErrorBoundary>
        )}
        {activeTab === 'golfers' && (
          <ErrorBoundary fallbackMessage="Field data couldn't load.">
            <GolfersTab poolId={poolId} />
          </ErrorBoundary>
        )}
        {activeTab === 'draw' && (
          <ErrorBoundary fallbackMessage="Draw couldn't load.">
            <DrawTab poolId={poolId} />
          </ErrorBoundary>
        )}
        {activeTab === 'messages' && (
          <ErrorBoundary fallbackMessage="Chat couldn't load.">
            <MessagingHub poolId={poolId} />
          </ErrorBoundary>
        )}
        {activeTab === 'teams' && (
          <ErrorBoundary fallbackMessage="Teams couldn't load.">
            <TeamsTab poolId={poolId} />
          </ErrorBoundary>
        )}
        {activeTab === 'news' && (
          <ErrorBoundary fallbackMessage="News couldn't load.">
            <GolferNewsTab poolId={poolId} />
          </ErrorBoundary>
        )}
        {activeTab === 'history' && (
          <ErrorBoundary fallbackMessage="History couldn't load.">
            <HistoryTab poolId={poolId} />
          </ErrorBoundary>
        )}
        {activeTab === 'rules' && (
          <ErrorBoundary fallbackMessage="Rules couldn't load.">
            <RulesTab pool={pool} />
          </ErrorBoundary>
        )}
        {activeTab === 'caddyshack-report' && (
          <ErrorBoundary fallbackMessage="Caddyshack Report couldn't load.">
            <CaddyshackTab poolId={poolId} />
          </ErrorBoundary>
        )}
      </div>

      <EntryDetailModal
        entry={selectedEntry}
        open={!!selectedEntry}
        onOpenChange={(open) => !open && setSelectedEntry(null)}
        rank={selectedEntry?._rank}
        totalEntries={selectedEntry?._totalEntries}
      />
    </PoolLayout>
  );
}