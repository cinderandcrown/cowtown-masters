import React, { useState, useCallback, useEffect, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
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

const VALID_TABS = ['leaderboard', 'teams', 'golfers', 'draw', 'messages', 'history', 'rules'];

export default function PoolDashboard() {
  const { poolId, activeTab: tabParam } = useParams();
  const navigate = useNavigate();
  const activeTab = VALID_TABS.includes(tabParam) ? tabParam : 'leaderboard';
  const [selectedEntry, setSelectedEntry] = useState(null);
  const queryClient = useQueryClient();

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
      rules: 'Rules',
      history: 'History',
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

  return (
    <PoolLayout>
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
        {activeTab === 'history' && (
          <ErrorBoundary fallbackMessage="History couldn't load.">
            <HistoryTab poolId={poolId} />
          </ErrorBoundary>
        )}
        {activeTab === 'rules' && (
          <ErrorBoundary fallbackMessage="Rules couldn't load.">
            <RulesTab poolId={poolId} />
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