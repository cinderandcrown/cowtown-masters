import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import PoolLayout from '@/components/layout/PoolLayout';
import Leaderboard from '@/components/pool/Leaderboard';
import GolfersTab from '@/components/pool/GolfersTab';
import DraftTab from '@/components/pool/DraftTab';
import HistoryTab from '@/components/pool/HistoryTab';
import RulesTab from '@/components/pool/RulesTab';
import EntryDetailModal from '@/components/pool/EntryDetailModal';

export default function PoolDashboard() {
  const { poolId } = useParams();
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [selectedEntry, setSelectedEntry] = useState(null);

  return (
    <PoolLayout activeTab={activeTab} onChange={setActiveTab}>
      {activeTab === 'leaderboard' && <Leaderboard onSelectEntry={setSelectedEntry} />}
      {activeTab === 'golfers' && <GolfersTab />}
      {activeTab === 'draft' && <DraftTab />}
      {activeTab === 'history' && <HistoryTab />}
      {activeTab === 'rules' && <RulesTab />}

      <EntryDetailModal entry={selectedEntry} open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)} />
    </PoolLayout>
  );
}