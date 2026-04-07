import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { assignGroups } from '@/lib/groupUtils';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function generateCSV(headers, rows) {
  const escape = (val) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [headers.map(escape).join(',')];
  for (const row of rows) {
    lines.push(row.map(escape).join(','));
  }
  return lines.join('\n');
}

function downloadCSV(filename, csvContent) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminExcelDownloads({ poolId }) {
  const [updatingOdds, setUpdatingOdds] = useState(false);

  const { data: rawGolfers = [] } = useQuery({
    queryKey: ['adminGolfers', poolId],
    queryFn: () => base44.entities.Golfer.filter({ pool_id: poolId }),
    enabled: !!poolId,
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['adminEntries', poolId],
    queryFn: () => base44.entities.PoolEntry.filter({ pool_id: poolId }),
    enabled: !!poolId,
  });

  const golfers = assignGroups(rawGolfers, entries.length);

  const handleDownloadGolfers = () => {
    const groupA = golfers.filter(g => g.group === 'A').sort((a, b) => {
      const aOdds = parseInt(a.betting_odds) || 99999;
      const bOdds = parseInt(b.betting_odds) || 99999;
      return aOdds - bOdds;
    });
    const groupB = golfers.filter(g => g.group === 'B').sort((a, b) => {
      const aOdds = parseInt(a.betting_odds) || 99999;
      const bOdds = parseInt(b.betting_odds) || 99999;
      return aOdds - bOdds;
    });

    const headers = ['#', 'Group', 'Golfer Name', 'Betting Odds', 'Status'];
    const rows = [];

    rows.push(['', '', '--- TOP TIER (Group A) ---', '', '']);
    groupA.forEach((g, i) => {
      rows.push([i + 1, 'A - Top Tier', g.name, g.betting_odds || '', g.status || 'active']);
    });

    rows.push(['', '', '', '', '']);
    rows.push(['', '', '--- BOTTOM TIER (Group B) ---', '', '']);
    groupB.forEach((g, i) => {
      rows.push([i + 1, 'B - Bottom Tier', g.name, g.betting_odds || '', g.status || 'active']);
    });

    const csv = generateCSV(headers, rows);
    downloadCSV('Masters_2026_Golfers_Field.csv', csv);
    toast.success('Golfer field downloaded!');
  };

  const handleDownloadDrawSheet = () => {
    const groupA = golfers.filter(g => g.group === 'A').sort((a, b) => {
      const aOdds = parseInt(a.betting_odds) || 99999;
      const bOdds = parseInt(b.betting_odds) || 99999;
      return aOdds - bOdds;
    });
    const groupB = golfers.filter(g => g.group === 'B').sort((a, b) => {
      const aOdds = parseInt(a.betting_odds) || 99999;
      const bOdds = parseInt(b.betting_odds) || 99999;
      return aOdds - bOdds;
    });

    // Sheet 1: Participants with blank columns for drawn golfers
    const headers = ['#', 'Participant Name', 'Top Tier Pick (Group A)', 'Bottom Tier Pick (Group B)', 'Notes'];
    const rows = [];

    entries.forEach((e, i) => {
      rows.push([i + 1, e.participant_name, '', '', '']);
    });

    // Add blank rows for extra space
    rows.push(['', '', '', '', '']);
    rows.push(['', '', '', '', '']);
    rows.push(['', '--- TOP TIER GOLFERS (cut these out for hat) ---', '', '', '']);
    groupA.forEach((g, i) => {
      rows.push([i + 1, g.name, g.betting_odds, '', '']);
    });

    rows.push(['', '', '', '', '']);
    rows.push(['', '--- BOTTOM TIER GOLFERS (cut these out for hat) ---', '', '', '']);
    groupB.forEach((g, i) => {
      rows.push([i + 1, g.name, g.betting_odds, '', '']);
    });

    const csv = generateCSV(headers, rows);
    downloadCSV('Masters_2026_Hat_Draw_Sheet.csv', csv);
    toast.success('Draw sheet downloaded!');
  };

  const handleUpdateOdds = async () => {
    setUpdatingOdds(true);
    try {
      const res = await base44.functions.invoke('updateGolferOdds', {});
      toast.success(`Odds updated! ${res.data.updated} changed, ${res.data.added} added, ${res.data.withdrawn} withdrawn`);
    } catch (err) {
      toast.error('Failed to update odds');
    } finally {
      setUpdatingOdds(false);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <FileSpreadsheet className="w-4 h-4 text-primary" />
        <span className="text-xs font-bold tracking-widest text-primary uppercase">Downloads & Tools</span>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2"
        onClick={handleDownloadGolfers}
      >
        <Download className="w-4 h-4" />
        Download Golfer Field (CSV)
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2"
        onClick={handleDownloadDrawSheet}
      >
        <Download className="w-4 h-4" />
        Download Hat Draw Sheet (CSV)
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2 border-accent/30 text-accent hover:bg-accent/5"
        onClick={handleUpdateOdds}
        disabled={updatingOdds}
      >
        {updatingOdds ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
        {updatingOdds ? 'Updating...' : 'Update Odds to Latest (BetMGM Apr 4)'}
      </Button>

      <p className="text-[10px] text-muted-foreground">
        CSV files open in Excel, Google Sheets, etc. Print the draw sheet, cut out golfer names, and draw from a hat!
      </p>
    </div>
  );
}