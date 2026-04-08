import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useParticipant } from '@/lib/ParticipantContext';
import {
  Play, Square, Zap, RefreshCw, Calculator, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, XCircle, Loader2, FileText, Copy, RotateCcw,
  Radio, Wifi, WifiOff, Timer, Users, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import AutoPollingControl from '@/components/admin/AutoPollingControl';

const PHASE_BADGES = {
  idle: { color: 'bg-gray-400', text: 'Idle' },
  no_tournament: { color: 'bg-gray-400', text: 'No Event' },
  pre_tournament: { color: 'bg-blue-500', text: 'Pre-Tourney' },
  live_round: { color: 'bg-green-500 animate-pulse', text: 'LIVE' },
  between_rounds: { color: 'bg-yellow-500', text: 'Between Rounds' },
  cut_day: { color: 'bg-orange-500 animate-pulse', text: 'Cut Day' },
  final_round: { color: 'bg-red-500 animate-pulse', text: 'Final Round' },
  post_tournament: { color: 'bg-purple-500', text: 'Complete' },
};

function DiagnosticRow({ check }) {
  const Icon = check.status === 'ok' ? CheckCircle2 : check.status === 'warn' ? AlertTriangle : XCircle;
  const color = check.status === 'ok' ? 'text-green-600' : check.status === 'warn' ? 'text-yellow-600' : 'text-red-600';
  return (
    <div className="flex items-start gap-2 py-2">
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{check.name}</p>
        <p className="text-xs text-muted-foreground break-words">{check.detail}</p>
      </div>
    </div>
  );
}

export default function AgentDashboard({ poolId }) {
  const queryClient = useQueryClient();
  const { participant } = useParticipant();
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [diagnostics, setDiagnostics] = useState(null);
  const [summaryText, setSummaryText] = useState(null);
  const [lastPollResult, setLastPollResult] = useState(null);

  // Status query
  const { data: status, isLoading } = useQuery({
    queryKey: ['agentStatus', poolId],
    queryFn: async () => {
      const res = await base44.functions.invoke('masterAgent', { action: 'status', participant_email: participant?.email });
      return res.data;
    },
    refetchInterval: 30000,
  });

  // Generic action mutation
  const runAction = useMutation({
    mutationFn: async ({ action, ...rest }) => {
      const res = await base44.functions.invoke('masterAgent', { action, participant_email: participant?.email, ...rest });
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agentStatus', poolId] });
      queryClient.invalidateQueries({ queryKey: ['pool', poolId] });
      queryClient.invalidateQueries({ queryKey: ['adminGolfers', poolId] });
      queryClient.invalidateQueries({ queryKey: ['poolGolfers', poolId] });
      queryClient.invalidateQueries({ queryKey: ['poolEntries', poolId] });

      if (variables.action === 'pollNow') {
        setLastPollResult(data);
        toast.success(`Scores updated! ${data.updated || 0} golfers changed, ${data.entriesRecalculated || 0} entries recalculated.`);
      } else if (variables.action === 'start') {
        toast.success('Pool is now LIVE — scoring active!');
      } else if (variables.action === 'stop') {
        toast.success('Pool paused.');
      } else if (variables.action === 'recalculate') {
        toast.success(`${data.entriesUpdated || 0} entries recalculated.`);
      } else if (variables.action === 'resetScores') {
        toast.success(`${data.golfersReset || 0} golfer scores reset.`);
      }
    },
    onError: (err) => {
      toast.error('Action failed: ' + (err?.response?.data?.error || err.message));
    },
  });

  const handleDiagnose = useCallback(async () => {
    setShowDiagnostics(true);
    setDiagnostics(null);
    try {
      const res = await base44.functions.invoke('masterAgent', { action: 'diagnose', participant_email: participant?.email });
      setDiagnostics(res.data.checks);
    } catch (err) {
      setDiagnostics([{ name: 'Diagnostics Failed', status: 'error', detail: err?.response?.data?.error || err.message || 'Could not run diagnostics.' }]);
    }
  }, []);

  const handleSummary = useCallback(async () => {
    setShowSummary(true);
    setSummaryText(null);
    try {
      const res = await base44.functions.invoke('masterAgent', { action: 'summary', participant_email: participant?.email });
      setSummaryText(res.data.summary);
    } catch (err) {
      setSummaryText('⚠ Failed to generate summary: ' + (err?.response?.data?.error || err.message || 'Unknown error'));
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const phase = status?.phase || 'idle';
  const phaseBadge = PHASE_BADGES[phase] || PHASE_BADGES.idle;
  const stats = status?.stats || {};
  const poolStatus = status?.pool?.status || 'setup';
  const isLive = poolStatus === 'live';
  const isPending = runAction.isPending;

  return (
    <div className="space-y-3">
      {/* ── Status Header ── */}
      <div className="bg-card rounded-xl border border-primary/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${phaseBadge.color}`} />
            <div>
              <p className="text-sm font-bold text-foreground">{status?.phaseLabel || 'Unknown'}</p>
              <p className="text-[10px] text-muted-foreground">{status?.phaseDetail || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
              poolStatus === 'live' ? 'bg-green-500/15 text-green-600 animate-pulse' :
              poolStatus === 'complete' ? 'bg-purple-500/15 text-purple-600' :
              poolStatus === 'draft' ? 'bg-blue-500/15 text-blue-600' :
              'bg-muted text-muted-foreground'
            }`}>
              {poolStatus === 'live' ? '● LIVE' : poolStatus === 'complete' ? '✓ COMPLETE' : poolStatus === 'draft' ? '◉ DRAFT' : '○ SETUP'}
            </span>
          </div>
        </div>

        {/* Feed status */}
        <div className="flex gap-2 text-[10px]">
          <div className="flex items-center gap-1.5 bg-primary/5 rounded-lg px-2.5 py-1.5">
            {status?.espnConnected ? <Wifi className="w-3 h-3 text-green-600" /> : <WifiOff className="w-3 h-3 text-red-500" />}
            <span className="font-bold text-muted-foreground">ESPN</span>
            <span className={`font-black ${status?.espnConnected ? 'text-green-600' : 'text-red-500'}`}>
              {status?.espnConnected ? 'OK' : 'DOWN'}
            </span>
          </div>
          {status?.round && (
            <div className="flex items-center gap-1.5 bg-primary/5 rounded-lg px-2.5 py-1.5">
              <Radio className="w-3 h-3 text-accent" />
              <span className="font-bold text-muted-foreground">Round</span>
              <span className="font-black text-foreground">{status.round}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-5 gap-1.5">
        {[
          { label: 'Golfers', value: stats.totalGolfers ?? '—', icon: Activity },
          { label: 'Active', value: stats.activeGolfers ?? '—' },
          { label: 'Scored', value: stats.scoredGolfers ?? '—' },
          { label: 'Cut', value: stats.cutGolfers ?? '—' },
          { label: 'Entries', value: `${stats.draftedEntries ?? 0}/${stats.totalEntries ?? 0}`, icon: Users },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card rounded-lg border border-primary/10 p-2 text-center">
            <p className="text-lg font-black text-foreground tabular-nums">{value}</p>
            <p className="text-[8px] font-bold text-muted-foreground tracking-wider uppercase">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Primary Actions ── */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={() => runAction.mutate({ action: isLive ? 'stop' : 'start' })}
          disabled={isPending}
          className={`h-14 font-bold gap-2 text-white ${isLive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {isPending && ['start', 'stop'].includes(runAction.variables?.action)
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : isLive ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {isLive ? 'Stop Scoring' : 'Go Live'}
        </Button>

        <Button
          onClick={() => runAction.mutate({ action: 'pollNow' })}
          disabled={isPending}
          className="h-14 bg-accent hover:bg-accent/90 text-white font-bold gap-2"
        >
          {isPending && runAction.variables?.action === 'pollNow'
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <Zap className="w-5 h-5" />}
          Poll Scores Now
        </Button>
      </div>

      {/* ── Secondary Actions ── */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={() => runAction.mutate({ action: 'recalculate' })}
          disabled={isPending}
          className="gap-2 text-sm"
        >
          {isPending && runAction.variables?.action === 'recalculate'
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Calculator className="w-4 h-4" />}
          Recalc Entries
        </Button>

        <Button
          variant="outline"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['agentStatus', poolId] })}
          className="gap-2 text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Status
        </Button>
      </div>

      {/* ── Last Poll Result ── */}
      {lastPollResult && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
          <p className="text-xs font-bold text-green-800 dark:text-green-300">Last Poll Result</p>
          <div className="flex gap-3 mt-1 text-[10px] text-green-700 dark:text-green-400">
            <span>Source: <strong>{lastPollResult.source || '—'}</strong></span>
            <span>Matched: <strong>{lastPollResult.matched || 0}</strong></span>
            <span>Updated: <strong>{lastPollResult.updated || 0}</strong></span>
            <span>Entries: <strong>{lastPollResult.entriesRecalculated || 0}</strong></span>
          </div>
          {lastPollResult.message && (
            <p className="text-[10px] text-green-600 dark:text-green-500 mt-1">{lastPollResult.message}</p>
          )}
        </div>
      )}

      {/* ── Auto-Polling Control ── */}
      <AutoPollingControl />

      {/* ── Diagnostics ── */}
      <div className="bg-card rounded-xl border border-primary/10 overflow-hidden">
        <button
          onClick={() => showDiagnostics ? setShowDiagnostics(false) : handleDiagnose()}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition"
        >
          <span className="text-sm font-bold text-foreground">🔍 System Diagnostics</span>
          {showDiagnostics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showDiagnostics && (
          <div className="px-4 pb-3 border-t border-primary/5">
            {!diagnostics ? (
              <div className="flex items-center justify-center py-4 gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Running checks...
              </div>
            ) : (
              <div className="divide-y divide-primary/5">
                {diagnostics.map((check, i) => (
                  <DiagnosticRow key={i} check={check} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Leaderboard Summary ── */}
      <div className="bg-card rounded-xl border border-primary/10 overflow-hidden">
        <button
          onClick={() => showSummary ? setShowSummary(false) : handleSummary()}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition"
        >
          <span className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" /> Leaderboard Summary
          </span>
          {showSummary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showSummary && (
          <div className="px-4 pb-3 border-t border-primary/5">
            {!summaryText ? (
              <div className="flex items-center justify-center py-4 gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Generating...
              </div>
            ) : (
              <div className="relative">
                <pre className="text-xs text-foreground whitespace-pre-wrap font-mono bg-primary/5 rounded-lg p-3 mt-2 max-h-64 overflow-auto">
                  {summaryText}
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-3 right-2 text-xs gap-1"
                  onClick={() => { navigator.clipboard.writeText(summaryText).catch(() => {}); toast.success('Copied!'); }}
                >
                  <Copy className="w-3 h-3" /> Copy
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Danger Zone ── */}
      <div className="bg-card rounded-xl border border-destructive/20 p-3">
        <p className="text-[10px] font-bold text-destructive tracking-widest uppercase mb-2">Danger Zone</p>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-destructive/30 text-destructive hover:bg-destructive/5 gap-2"
          onClick={() => {
            if (window.confirm('Reset ALL golfer scores to zero? This cannot be undone.')) {
              runAction.mutate({ action: 'resetScores' });
            }
          }}
          disabled={isPending}
        >
          {isPending && runAction.variables?.action === 'resetScores'
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <RotateCcw className="w-4 h-4" />}
          Reset All Scores
        </Button>
      </div>
    </div>
  );
}