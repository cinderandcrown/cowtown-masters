import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Trophy, ShieldAlert, Radio, Copy, Share2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { hapticTap } from '@/lib/haptics';
import AdminGolferList from '@/components/admin/AdminGolferList.jsx';
import AgentDashboard from '@/components/admin/AgentDashboard';
import AdminEntryList from '@/components/admin/AdminEntryList';
import AddGolferForm from '@/components/admin/AddGolferForm';
import AddEntryForm from '@/components/admin/AddEntryForm';
import PoolSettingsCard from '@/components/admin/PoolSettingsCard';
import AdminExcelDownloads from '@/components/admin/AdminExcelDownloads';
import { useParticipant } from '@/lib/ParticipantContext';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function PoolAdmin() {
  const { poolId } = useParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('agent');
  const [copied, setCopied] = useState(false);

  useEffect(() => { document.title = 'Cowtown Masters - Admin'; }, []);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: 2,
  });

  const { data: pool, isLoading: loadingPool } = useQuery({
    queryKey: ['pool', poolId],
    queryFn: () => base44.entities.Pool.filter({ id: poolId }),
    enabled: !!poolId,
    select: (data) => data[0],
    retry: 2,
  });

  const { isLoggedIn: participantLoggedIn, participant } = useParticipant();

  const isAdmin = currentUser?.role === 'admin' || currentUser?.email === pool?.admin_user_id || currentUser?.email === pool?.created_by || (participantLoggedIn && participant?.email && (participant.email === pool?.admin_user_id || participant.email === pool?.created_by));

  if (loadingPool) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="bg-card rounded-xl border border-destructive/20 p-6 max-w-sm w-full text-center">
          <ShieldAlert className="w-10 h-10 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-bold text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Admin Access Only</h2>
          <p className="text-sm text-muted-foreground mb-4">You don't have permission to manage this pool. Only the pool creator can access admin settings.</p>
          <Button onClick={() => navigate(`/pool/${poolId}`)} className="bg-primary text-white">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Pool
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'agent', label: 'Scoring', icon: <Radio className="w-4 h-4" /> },
    { id: 'golfers', label: 'Golfers', icon: <Trophy className="w-4 h-4" /> },
    { id: 'participants', label: 'Entries', icon: <Users className="w-4 h-4" /> },
  ];

  const handleCopyCode = async () => {
    if (pool?.invite_code) {
      await navigator.clipboard.writeText(pool.invite_code);
      setCopied(true);
      hapticTap();
      toast.success('Invite code copied!');
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleSharePool = async () => {
    const url = `${window.location.origin}/pool/${poolId}`;
    if (navigator.share) {
      navigator.share({ title: pool?.name || 'Cowtown Masters Pool', url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Pool link copied!');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#0a3d0a] to-primary border-b-2 border-accent px-4 py-3">
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
        {/* Invite Code Card */}
        {pool?.invite_code && (
          <div className="bg-card rounded-xl border border-border p-4 mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-1">Invite Code</p>
              <p className="text-2xl font-black font-mono tracking-[0.2em] text-foreground">{pool.invite_code}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopyCode}>
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSharePool}>
                <Share2 className="w-3.5 h-3.5" /> Share
              </Button>
            </div>
          </div>
        )}

        {/* Pool Settings */}
        <PoolSettingsCard pool={pool} poolId={poolId} />

        {/* Tab Switcher */}
        <div className="flex bg-muted/30 rounded-xl p-1 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                activeSection === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeSection === 'agent' && (
          <ErrorBoundary fallbackMessage="Scoring dashboard couldn't load. Try refreshing.">
            <AgentDashboard poolId={poolId} />
          </ErrorBoundary>
        )}
        {activeSection === 'golfers' && (
          <ErrorBoundary fallbackMessage="Golfer management couldn't load. Try refreshing.">
            <div className="space-y-4">
              <AdminExcelDownloads poolId={poolId} />
              <AddGolferForm poolId={poolId} />
              <AdminGolferList poolId={poolId} />
            </div>
          </ErrorBoundary>
        )}
        {activeSection === 'participants' && (
          <ErrorBoundary fallbackMessage="Entry management couldn't load. Try refreshing.">
            <div className="space-y-4">
              <AddEntryForm poolId={poolId} />
              <AdminEntryList poolId={poolId} />
            </div>
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}