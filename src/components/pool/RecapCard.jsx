import React, { useRef, useState } from 'react';
import { Copy, Camera, TrendingUp, TrendingDown, Minus, Trash2, Star, Skull } from 'lucide-react';
import { toast } from 'sonner';
import { formatScore } from '@/lib/scoreUtils';
import html2canvas from 'html2canvas';

function RankBadge({ rank, totalEntries }) {
  if (rank === 1) return <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-black border border-accent/30">🏆 #1</span>;
  if (rank === 2) return <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-black border border-border">🥈 #2</span>;
  if (rank === 3) return <span className="px-2 py-0.5 rounded-full bg-amber-600/15 text-amber-600 text-[10px] font-black border border-amber-600/20">🥉 #3</span>;
  if (rank === totalEntries) return <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-black border border-destructive/20 flex items-center gap-1"><Trash2 className="w-2.5 h-2.5" /> Last</span>;
  return <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold border border-border">#{rank}</span>;
}

function RankChangeArrow({ change }) {
  if (change > 0) return <span className="flex items-center gap-0.5 text-green-600 font-bold text-sm"><TrendingUp className="w-3.5 h-3.5" />+{change}</span>;
  if (change < 0) return <span className="flex items-center gap-0.5 text-orange-500 font-bold text-sm"><TrendingDown className="w-3.5 h-3.5" />{change}</span>;
  return <span className="flex items-center gap-0.5 text-muted-foreground font-bold text-sm"><Minus className="w-3.5 h-3.5" />—</span>;
}

export default function RecapCard({ recap, totalEntries, roundNumber }) {
  const cardRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const handleCopy = () => {
    const text = `THE CADDYSHACK REPORT\nRound ${roundNumber} — ${recap.participant_name}\n\n${recap.recap_headline}\n\n${recap.recap_body}\n\nMVP: ${recap.best_golfer?.name} (${recap.best_golfer?.score})\nDisaster: ${recap.worst_golfer?.name} (${recap.worst_golfer?.score})`;
    navigator.clipboard.writeText(text);
    toast.success('Recap copied!');
  };

  const handleShareCard = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `caddyshack-r${roundNumber}-${recap.participant_name.replace(/\s/g, '-').toLowerCase()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Card saved as image!');
      });
    } catch {
      toast.error('Failed to export card');
    } finally {
      setExporting(false);
    }
  };

  const toneLabel = { roast_heavy: 'Roast', praise_heavy: 'Praise', balanced: 'Balanced', tragic_comedy: 'Tragic' }[recap.recap_tone] || '';

  return (
    <div ref={cardRef} className="bg-card rounded-xl border border-primary/10 overflow-hidden shadow-sm">
      {/* Top strip */}
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 px-4 py-2.5 flex items-center justify-between border-b border-primary/10">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-base font-bold text-foreground truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
            {recap.participant_name}
          </h3>
          <RankBadge rank={recap.team_rank_for_round} totalEntries={totalEntries} />
        </div>
        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest flex-shrink-0">{toneLabel}</span>
      </div>

      {/* Headline */}
      <div className="px-4 pt-3 pb-2">
        <h2 className="text-base font-black text-primary leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
          "{recap.recap_headline}"
        </h2>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-px mx-4 mb-3 bg-border rounded-lg overflow-hidden">
        <div className="bg-card p-2 text-center">
          <p className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase">Round</p>
          <p className="text-base font-black text-foreground tabular-nums">{formatScore(recap.team_total_to_par)}</p>
        </div>
        <div className="bg-card p-2 text-center">
          <p className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase">Move</p>
          <div className="flex justify-center mt-0.5"><RankChangeArrow change={recap.rank_change} /></div>
        </div>
        <div className="bg-card p-2 text-center">
          <p className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase">Overall</p>
          <p className="text-base font-black text-foreground tabular-nums">#{recap.overall_rank}</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-3">
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
          {recap.recap_body}
        </p>
      </div>

      {/* MVP / Disaster pills */}
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-bold px-2.5 py-1 rounded-full border border-green-500/20">
          <Star className="w-3 h-3" /> MVP: {recap.best_golfer?.name} ({recap.best_golfer?.score})
        </span>
        <span className="inline-flex items-center gap-1.5 bg-destructive/10 text-destructive text-xs font-bold px-2.5 py-1 rounded-full border border-destructive/20">
          <Skull className="w-3 h-3" /> Disaster: {recap.worst_golfer?.name} ({recap.worst_golfer?.score})
        </span>
      </div>

      {/* Actions */}
      <div className="px-4 py-2 border-t border-primary/10 flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg py-2 transition"
        >
          <Copy className="w-3.5 h-3.5" /> Copy
        </button>
        <button
          onClick={handleShareCard}
          disabled={exporting}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg py-2 transition disabled:opacity-50"
        >
          <Camera className="w-3.5 h-3.5" /> {exporting ? 'Saving...' : 'Share Card'}
        </button>
      </div>
    </div>
  );
}