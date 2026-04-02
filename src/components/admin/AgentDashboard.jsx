import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Play, Square, RefreshCw, Zap, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, XCircle, Loader2, FileText } from 'lucide-react';

const PHASE_COLORS = {
  idle: 'bg-gray-400',
  pre_tournament: 'bg-blue-500',
  live_round: 'bg-green-500 animate-pulse',
  between_rounds: 'bg-yellow-500',
  cut_day: 'bg-orange-500 animate-pulse',
  final_round: 'bg-red-500 animate-pulse',
  post_tournament: 'bg-purple-500',
};

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-card rounded-xl border border-primary/10 p-3 text-center">
      <p className="text-2xl font-black text-foreground tabular-nums">{value}</p>
      <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground/60">{sub}</p>}
    </div>
  );
}

function DiagnosticCheck({ check }) {
  const Icon = check.status === 'ok' ? CheckCircle2 : check.status === 'warn' ? AlertTriangle : XCircle;
  const color = check.status === 'ok' ? 'text-green-600' : check.status === 'warn' ? 'text-yellow-600' : 'text-red-600';
  return (
    <div className="flex items-start gap-2 py-2">
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
      <div>
        <p className="text-sm font-semibold text-foreground">{check.name}</p>
        <p className="text-xs text-muted-foreground">{check.detail}</p>
      </div>
    </div>
  );
}

export default function AgentDashboard({ poolId }) {
  const queryClient = useQueryClient();
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [diagnostics, setDiagnostics] = useState(null);
  const [summaryText, setSummaryText] = useState(null);

  const { data: status, isLoading } = useQuery({
    queryKey: ['agentStatus', poolId],
    queryFn: async () => {
      const res = await base44.functions.invoke('masterAgent', { action: 'status' });
      return res.data;
    },
    refetchInterval: 30000,
  });

  const runAction = useMutation({
    mutationFn: async ({ action, ...rest }) => {
      const res = await base44.functions.invoke('masterAgent', { action, ...rest });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentStatus', poolId] });
      queryClient.invalidateQueries({ queryKey: ['pool', poolId] });
      queryClient.invalidateQueries({ queryKey: ['adminGolfers', poolId] });
      queryClient.invalidateQueries({ queryKey: ['poolGolfers', poolId] });
    },
  });

  const handleDiagnose = async () => {
    setShowDiagnostics(true);
    setDiagnostics(null);
    const res = await base44.functions.invoke('masterAgent', { action: 'diagnose' });
    setDiagnostics(res.data.checks);
  };

  const handleSummary = async () => {
    setShowSummary(true);
    setSummaryText(null);
    const res = await base44.functions.invoke('masterAgent', { action: 'summary' });
    setSummaryText(res.data.summary);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const phase = status?.phase || 'idle';
  const phaseLabel = status?.phaseLabel || 'Idle';
  const pollingInterval = status?.pollingInterval;
  const stats = status?.stats || {};
  const isLive = status?.pool?.status === 'live';

  return (
    <div className="space-y-4">
      {/* Phase Indicator */}
      <div className="bg-card rounded-xl border border-primary/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className={`w-3 h-3 rounded-full ${PHASE_COLORS[phase] || 'bg-gray-400'}`} />
            <div>
              <p className="text-sm font-bold text-foreground">{phaseLabel}</p>
              <p className="text-[10px] text-muted-foreground">{status?.phaseDetail}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Pool</p>
            <p className={`text-xs font-black ${isLive ? 'text-red-500' : 'text-foreground'}`}>
              {status?.pool?.status?.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Polling Config */}
        <div className="flex gap-3 text-[10px]">
          <div className="flex items-center gap-1.5 bg-primary/5 rounded-lg px-2.5 py-1.5">
            <span className="font-bold text-muted-foreground">Polling:</span>
            <span className="font-black text-foreground">
              {pollingInterval ? `${pollingInterval}s` : 'OFF'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-primary/5 rounded-lg px-2.5 py-1.5">
            <span className="font-bold text-muted-foreground">ESPN:</span>
            <span className={`font-black ${status?.espnConnected ? 'text-green-600' : 'text-red-500'}`}>
              {status?.espnConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        <StatCard label="Golfers" value={stats.totalGolfers ?? '—'} />
        <StatCard label="Scored" value={stats.scoredGolfers ?? '—'} />
        <StatCard label="Entries" value={stats.totalEntries ?? '—'} />
        <StatCard label="Cut" value={stats.cutGolfers ?? '—'} sub={stats.wdGolfers ? `${stats.wdGolfers} WD` : null} />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {!isLive ? (
          <Button
            onClick={() => runAction.mutate({ action: 'start' })}
            disabled={runAction.isPending}
            className="h-12 bg-green-600 hover:bg-green-700 text-white font-bold gap-2"
          >
            {runAction.isPending && runAction.variables?.action === 'start'
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Play className="w-4 h-4" />}
            Start Agent
          </Button>
        ) : (
          <Button
            onClick={() => runAction.mutate({ action: 'stop' })}
            disabled={runAction.isPending}
            className="h-12 bg-red-600 hover:bg-red-700 text-white font-bold gap-2"
          >
            {runAction.isPending && runAction.variables?.action === 'stop'
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Square className="w-4 h-4" />}
            Stop Agent
          </Button>
        )}
        <Button
          onClick={() => runAction.mutate({ action: 'pollNow' })}
          disabled={runAction.isPending}
          className="h-12 bg-accent hover:bg-accent/90 text-white font-bold gap-2"
        >
          {runAction.isPending && runAction.variables?.action === 'pollNow'
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Zap className="w-4 h-4" />}
          Poll Now
        </Button>
      </div>

      {/* Refresh */}
      <Button
        variant="outline"
        onClick={() => queryClient.invalidateQueries({ queryKey: ['agentStatus', poolId] })}
        className="w-full gap-2 text-sm"
      >
        <RefreshCw className="w-4 h-4" />
        Refresh Status
      </Button>

      {/* Poll Result */}
      {runAction.isSuccess && runAction.variables?.action === 'pollNow' && runAction.data && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-sm">
          <p className="font-bold text-green-800 dark:text-green-300">Poll Complete</p>
          <p className="text-xs text-green-700 dark:text-green-400 mt-1">
            Matched {runAction.data.matched}/{runAction.data.pool_golfers} golfers · Updated {runAction.data.updated}
          </p>
        </div>
      )}

      {runAction.isSuccess && runAction.variables?.action === 'start' && runAction.data && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-sm">
          <p className="font-bold text-green-800 dark:text-green-300">Agent Started</p>
          <p className="text-xs text-green-700 dark:text-green-400 mt-1">
            Pool set to live. Matched {runAction.data.scoreResult?.matched} golfers, updated {runAction.data.scoreResult?.updated}.
          </p>
        </div>
      )}

      {/* Diagnostics */}
      <div className="bg-card rounded-xl border border-primary/10 overflow-hidden">
        <button
          onClick={() => showDiagnostics ? setShowDiagnostics(false) : handleDiagnose()}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition"
        >
          <span className="text-sm font-bold text-foreground">🔍 Diagnostics</span>
          {showDiagnostics ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {showDiagnostics && (
          <div className="px-4 pb-3 border-t border-primary/5">
            {!diagnostics ? (
              <div className="flex items-center justify-center py-4 gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Running diagnostics...
              </div>
            ) : (
              <div className="divide-y divide-primary/5">
                {diagnostics.map((check, i) => (
                  <DiagnosticCheck key={i} check={check} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Generator */}
      <div className="bg-card rounded-xl border border-primary/10 overflow-hidden">
        <button
          onClick={() => showSummary ? setShowSummary(false) : handleSummary()}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition"
        >
          <span className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" /> Leaderboard Summary
          </span>
          {showSummary ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {showSummary && (
          <div className="px-4 pb-3 border-t border-primary/5">
            {!summaryText ? (
              <div className="flex items-center justify-center py-4 gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Generating summary...
              </div>
            ) : (
              <div className="relative">
                <pre className="text-xs text-foreground whitespace-pre-wrap font-mono bg-primary/5 rounded-lg p-3 mt-2 max-h-64 overflow-auto">
                  {summaryText}
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-3 right-2 text-xs"
                  onClick={() => navigator.clipboard.writeText(summaryText)}
                >
                  Copy
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}