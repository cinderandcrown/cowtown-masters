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

const VALID_TABS = ['leaderboard', 'teams', 'golfers', 'draw', 'messages', 'history', 'rules'];

export default function PoolDashboard() {
  const { poolId, activeTab: tabParam } = useParams();
  const navigate = useNavigate();
  const activeTab = VALID_TABS.includes(tabParam) ? tabParam : 'leaderboard';
  const [selectedEntry, setSelectedEntry] = useState(null);
  const queryClient = useQueryClient();

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

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const tabNames = {
      leaderboard: 'Leaderboard',
      teams: 'Teams',
      golfers: 'Field',
      draw: 'Draw',
      messages: 'Smack Talk',
      rules: 'Rules',
      history: 'Champions',
    };
    document.title = `Cowtown Masters - ${tabNames[activeTab] || 'Pool'}`;
  }, [activeTab]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  return (
    <PoolLayout>
      <div {...pullProps} className="min-h-[60vh]">
        <PullIndicator />
        {activeTab === 'leaderboard' && (
          <>
            <AddToHomeScreen />
            <Leaderboard poolId={poolId} onSelectEntry={setSelectedEntry} />
          </>
        )}
        {activeTab === 'golfers' && <GolfersTab poolId={poolId} />}
        {activeTab === 'draw' && <DrawTab poolId={poolId} />}
        {activeTab === 'messages' && <MessagingHub poolId={poolId} />}
        {activeTab === 'teams' && <TeamsTab poolId={poolId} />}
        {activeTab === 'history' && <HistoryTab poolId={poolId} />}
        {activeTab === 'rules' && <RulesTab poolId={poolId} />}
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
