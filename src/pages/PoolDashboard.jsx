import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import PoolLayout from '@/components/layout/PoolLayout';
import Leaderboard from '@/components/pool/Leaderboard';
import GolfersTab from '@/components/pool/GolfersTab';
import DrawTab from '@/components/pool/DrawTab.jsx';
import HistoryTab from '@/components/pool/HistoryTab';
import RulesTab from '@/components/pool/RulesTab';
import TeamsTab from '@/components/pool/TeamsTab';
import EntryDetailModal from '@/components/pool/EntryDetailModal';

export default function PoolDashboard() {
  const { poolId } = useParams();
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [selectedEntry, setSelectedEntry] = useState(null);

  return (
    <PoolLayout activeTab={activeTab} onChange={setActiveTab}>
      {activeTab === 'leaderboard' && <Leaderboard poolId={poolId} onSelectEntry={setSelectedEntry} />}
      {activeTab === 'golfers' && <GolfersTab poolId={poolId} />}
      {activeTab === 'draw' && <DrawTab poolId={poolId} />}
      {activeTab === 'teams' && <TeamsTab poolId={poolId} />}
      {activeTab === 'history' && <HistoryTab poolId={poolId} />}
      {activeTab === 'rules' && <RulesTab poolId={poolId} />}

      <EntryDetailModal entry={selectedEntry} open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)} />
    </PoolLayout>
  );
}