import React, { useState, useEffect, useCallback } from 'react';
import { useMasterAgent } from '@/hooks/useMasterAgent';
import { Button } from '@/components/ui/button';
import {
  Bot,
  Play,
  Square,
  RefreshCw,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Radio,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const PHASE_STYLES = {
  idle: { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-gray-400' },
  pre_tournament: { bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500' },
  live_round: { bg: 'bg-green-500/10', text: 'text-green-600', dot: 'bg-green-500 animate-pulse' },
  between_rounds: { bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-500' },
  cut_day: { bg: 'bg-orange-500/10', text: 'text-orange-600', dot: 'bg-orange-500 animate-pulse' },
  final_round: { bg: 'bg-red-500/10', text: 'text-red-600', dot: 'bg-red-500 animate-pulse' },
  post_tournament: { bg: 'bg-purple-500/10', text: 'text-purple-600', dot: 'bg-purple-500' },
};

function DiagnosticItem({ check }) {
  const icon = check.status === 'pass'
    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
    : check.status === 'warn'
      ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
      : <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;

  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-background/50">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-semibold">{check.name}</span>
      </div>
      <span className="text-[10px] text-muted-foreground">{check.detail}</span>
    </div>
  );
}

export default function AgentDashboard({ poolId }) {
  const {
    status: agentStatus,
    loading,
    error,
    fetchStatus,
    start,
    stop,
    pollNow,
    diagnose,
    summary,
  } = useMasterAgent();

  const [diagnostics, setDiagnostics] = useState(null);
  const [summaryText, setSummaryText] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [actionResult, setActionResult] = useState(null);

  // Fetch status on mount
  useEffect(() => {
    fetchStatus().catch(() => {});
  }, [fetchStatus]);

  const handleAction = useCallback(async (actionFn, label) => {
    try {
      const result = await actionFn();
      setActionResult({ type: 'success', message: `${label} completed`, timestamp: new Date().toLocaleTimeString() });
      return result;
    } catch {
      setActionResult({ type: 'error', message: `${label} failed`, timestamp: new Date().toLocaleTimeString() });
    }
  }, []);

  const handleDiagnose = useCallback(async () => {
    const result = await handleAction(diagnose, 'Diagnostics');
    if (result) setDiagnostics(result);
  }, [diagnose, handleAction]);

  const handleSummary = useCallback(async () => {
    const result = await handleAction(summary, 'Summary');
    if (result?.summary) setSummaryText(result.summary);
  }, [summary, handleAction]);

  const phase = agentStatus?.phase?.current || 'idle';
  const phaseStyle = PHASE_STYLES[phase] || PHASE_STYLES.idle;
  const phaseLabel = agentStatus?.phase?.label || 'Idle';
  const phaseDetail = agentStatus?.phase?.detail || '';
  const pollingInterval = agentStatus?.config?.scorePollingInterval;
  const poolStats = agentStatus?.pool?.stats;

  return (
    <div className="bg-card rounded-xl border border-primary/10 p-4 mb-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm text-foreground">Master Agent</h3>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${phaseStyle.bg} ${phaseStyle.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${phaseStyle.dot}`} />
            {phaseLabel}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="h-7 px-2 text-xs text-muted-foreground"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {/* Phase Description */}
      <p className="text-xs text-muted-foreground mb-3">{agentStatus?.phase?.description || 'Loading agent status...'}</p>
      {phaseDetail && (
        <p className="text-[10px] text-muted-foreground/70 -mt-2 mb-3 italic">{phaseDetail}</p>
      )}

      {/* Quick Stats */}
      {poolStats && (
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="bg-background/50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-primary">{poolStats.total_golfers}</p>
            <p className="text-[9px] text-muted-foreground font-semibold">Golfers</p>
          </div>
          <div className="bg-background/50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-green-600">{poolStats.scored_golfers}</p>
            <p className="text-[9px] text-muted-foreground font-semibold">Scored</p>
          </div>
          <div className="bg-background/50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-accent">{poolStats.total_entries}</p>
            <p className="text-[9px] text-muted-foreground font-semibold">Entries</p>
          </div>
          <div className="bg-background/50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-red-500">{poolStats.cut_golfers}</p>
            <p className="text-[9px] text-muted-foreground font-semibold">Cut</p>
          </div>
        </div>
      )}

      {/* Automation Config */}
      {pollingInterval && (
        <div className="flex items-center gap-3 mb-3 text-[10px]">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3 h-3" /> Polling: <strong>{pollingInterval}s</strong>
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Radio className="w-3 h-3" /> Alerts: <strong>{agentStatus?.config?.alertsEnabled ? 'ON' : 'OFF'}</strong>
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Zap className="w-3 h-3" /> Broadcast: <strong>{agentStatus?.config?.broadcastEnabled ? 'ON' : 'OFF'}</strong>
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-3">
        {phase === 'idle' || phase === 'pre_tournament' ? (
          <Button
            size="sm"
            onClick={() => handleAction(start, 'Start')}
            disabled={loading}
            className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
          >
            <Play className="w-3 h-3 mr-1" /> Start Agent
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction(stop, 'Stop')}
            disabled={loading}
            className="h-8 px-3 text-xs border-red-300 text-red-600 hover:bg-red-50"
          >
            <Square className="w-3 h-3 mr-1" /> Stop
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction(pollNow, 'Score Poll')}
          disabled={loading}
          className="h-8 px-3 text-xs"
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> Poll Now
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction(fetchStatus, 'Refresh')}
          disabled={loading}
          className="h-8 px-3 text-xs"
        >
          <Activity className="w-3 h-3 mr-1" /> Refresh
        </Button>
      </div>

      {/* Action Result */}
      {actionResult && (
        <div className={`text-[10px] px-2 py-1 rounded mb-2 ${actionResult.type === 'success' ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'}`}>
          {actionResult.message} at {actionResult.timestamp}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-[10px] px-2 py-1 rounded mb-2 bg-red-500/10 text-red-700">
          <AlertTriangle className="w-3 h-3 inline mr-1" />{error}
        </div>
      )}

      {/* Expanded Section */}
      {expanded && (
        <div className="border-t border-primary/10 pt-3 mt-2 space-y-3">
          {/* Diagnostics */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground">System Diagnostics</span>
              <Button size="sm" variant="ghost" onClick={handleDiagnose} disabled={loading} className="h-6 px-2 text-[10px]">
                Run Check
              </Button>
            </div>
            {diagnostics?.checks ? (
              <div className="space-y-1">
                {diagnostics.checks.map((check, i) => (
                  <DiagnosticItem key={i} check={check} />
                ))}
                <p className="text-[10px] text-muted-foreground mt-1">
                  Overall: <strong className={diagnostics.overall === 'healthy' ? 'text-green-600' : 'text-red-600'}>
                    {diagnostics.overall}
                  </strong> — {diagnostics.passing} pass, {diagnostics.warnings} warn, {diagnostics.failing} fail
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground italic">Click "Run Check" to run diagnostics</p>
            )}
          </div>

          {/* Leaderboard Summary */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground">Leaderboard Summary</span>
              <Button size="sm" variant="ghost" onClick={handleSummary} disabled={loading} className="h-6 px-2 text-[10px]">
                <FileText className="w-3 h-3 mr-1" /> Generate
              </Button>
            </div>
            {summaryText ? (
              <pre className="text-[10px] bg-background/50 rounded-lg p-3 whitespace-pre-wrap font-mono text-foreground overflow-x-auto">
                {summaryText}
              </pre>
            ) : (
              <p className="text-[10px] text-muted-foreground italic">Click "Generate" to create a leaderboard summary</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
