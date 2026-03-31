import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, UserPlus, Trophy } from 'lucide-react';
import AdminGolferList from '@/components/admin/AdminGolferList.jsx';
import AdminEntryList from '@/components/admin/AdminEntryList';
import AddGolferForm from '@/components/admin/AddGolferForm';
import AddEntryForm from '@/components/admin/AddEntryForm';
import PoolSettingsCard from '@/components/admin/PoolSettingsCard';

export default function PoolAdmin() {
  const { poolId } = useParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('golfers');

  useEffect(() => { document.title = 'Cowtown Masters - Admin'; }, []);

  const { data: pool, isLoading: loadingPool } = useQuery({
    queryKey: ['pool', poolId],
    queryFn: () => base44.entities.Pool.filter({ id: poolId }),
    enabled: !!poolId,
    select: (data) => data[0],
  });

  if (loadingPool) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'golfers', label: 'Golfers', icon: <Trophy className="w-4 h-4" /> },
    { id: 'participants', label: 'Participants', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-secondary to-primary border-b-2 border-accent px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/pool/${poolId}`)} className="text-primary-foreground hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Admin Panel
            </h1>
            <p className="text-xs text-accent">{pool?.name || 'Pool'}</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 pb-8">
        {/* Pool Settings */}
        <PoolSettingsCard pool={pool} poolId={poolId} />

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
                activeSection === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-card border border-primary/20 text-foreground hover:border-primary'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeSection === 'golfers' && (
          <div className="space-y-4">
            <AddGolferForm poolId={poolId} />
            <AdminGolferList poolId={poolId} />
          </div>
        )}
        {activeSection === 'participants' && (
          <div className="space-y-4">
            <AddEntryForm poolId={poolId} />
            <AdminEntryList poolId={poolId} />
          </div>
        )}
      </div>
    </div>
  );
}