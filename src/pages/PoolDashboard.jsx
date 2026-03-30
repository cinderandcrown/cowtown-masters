import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import PoolLayout from '@/components/layout/PoolLayout';
import Leaderboard from '@/components/pool/Leaderboard.jsx';
import GolfersTab from '@/components/pool/GolfersTab.jsx';
import DrawTab from '@/components/pool/DrawTab.jsx';
import ChatTab from '@/components/pool/ChatTab.jsx';
import HistoryTab from '@/components/pool/HistoryTab';
import RulesTab from '@/components/pool/RulesTab';
import TeamsTab from '@/components/pool/TeamsTab';
import EntryDetailModal from '@/components/pool/EntryDetailModal';
import usePullToRefresh from '@/hooks/usePullToRefresh.jsx';

export default function PoolDashboard() {
  const { poolId } = useParams();
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['poolEntries', poolId] });
    await queryClient.invalidateQueries({ queryKey: ['poolGolfers', poolId] });
    await queryClient.invalidateQueries({ queryKey: ['chatMessages', poolId] });
  }, [queryClient, poolId]);

  const { pullProps, PullIndicator } = usePullToRefresh(handleRefresh);

  return (
    <PoolLayout activeTab={activeTab} onChange={setActiveTab}>
      <div {...pullProps} className="min-h-[60vh]">
        <PullIndicator />
        {activeTab === 'leaderboard' && <Leaderboard poolId={poolId} onSelectEntry={setSelectedEntry} />}
        {activeTab === 'golfers' && <GolfersTab poolId={poolId} />}
        {activeTab === 'draw' && <DrawTab poolId={poolId} />}
        {activeTab === 'chat' && <ChatTab poolId={poolId} />}
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