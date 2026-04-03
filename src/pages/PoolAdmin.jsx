import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Trophy, ShieldAlert, Bot, Copy, Check, Share2 } from 'lucide-react';
import AdminGolferList from '@/components/admin/AdminGolferList.jsx';
import AgentDashboard from '@/components/admin/AgentDashboard';
import AdminEntryList from '@/components/admin/AdminEntryList';
import AddGolferForm from '@/components/admin/AddGolferForm';
import AddEntryForm from '@/components/admin/AddEntryForm';
import PoolSettingsCard from '@/components/admin/PoolSettingsCard';

function InviteCodeCard({ pool }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pool?.invite_code || '');
    } catch {
      const el = document.createElement('textarea');
      el.value = pool?.invite_code || '';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = `Join my Masters pool "${pool?.name}"!\n\nInvite Code: ${pool?.invite_code}\n\nDownload the app and enter the code to join!`;
    try {
      if (navigator.share) {
        await navigator.share({ title: pool?.name, text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  if (!pool?.invite_code) return null;

  return (
    <div className="bg-gradient-to-r from-primary/8 to-accent/8 rounded-xl p-4 border border-accent/20 mb-4">
      <p className="text-[10px] font-bold text-accent tracking-widest uppercase mb-2">Invite Code</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-card rounded-lg px-4 py-2.5 border border-border text-center">
          <span className="text-2xl font-black text-foreground tracking-[0.3em] font-mono">{pool.invite_code}</span>
        </div>
        <button
          onClick={handleCopy}
          className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 transition"
          aria-label="Copy invite code"
        >
          {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-primary" />}
        </button>
        <button
          onClick={handleShare}
          className="p-2.5 rounded-lg bg-accent/10 border border-accent/20 hover:bg-accent/20 transition"
          aria-label="Share invite"
        >
          <Share2 className="w-5 h-5 text-accent" />
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">Share this code with participants so they can join your pool</p>
    </div>
  );
}

export default function PoolAdmin() {
  const { poolId } = useParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('agent');

  useEffect(() => { document.title = 'Cowtown Masters - Admin'; }, []);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pool, isLoading: loadingPool } = useQuery({
    queryKey: ['pool', poolId],
    queryFn: () => base44.entities.Pool.filter({ id: poolId }),
    enabled: !!poolId,
    select: (data) => data[0],
  });

  const isAdmin = currentUser?.role === 'admin' || currentUser?.email === pool?.admin_user_id || currentUser?.email === pool?.created_by;

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
          <p className="text-sm text-muted-foreground mb-4">Only the pool creator can access admin settings.</p>
          <Button onClick={() => navigate(`/pool/${poolId}`)} className="bg-primary text-white">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Pool
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'agent', label: 'Agent', icon: <Bot className="w-4 h-4" /> },
    { id: 'golfers', label: 'Golfers', icon: <Trophy className="w-4 h-4" /> },
    { id: 'participants', label: 'Entries', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#0a3d0a] to-primary border-b-2 border-accent px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/pool/${poolId}`)} className="text-primary-foreground hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Admin Panel
            </h1>
            <p className="text-[10px] text-accent">{pool?.name || 'Pool'}</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 pb-8">
        {/* Invite Code Card */}
        <InviteCodeCard pool={pool} />

        {/* Pool Settings */}
        <PoolSettingsCard pool={pool} poolId={poolId} />

        {/* Tab Switcher */}
        <div className="flex gap-1.5 mb-4 bg-muted/30 rounded-xl p-1 border border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
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
        {activeSection === 'agent' && <AgentDashboard poolId={poolId} />}
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
