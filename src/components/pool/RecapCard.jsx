import React, { useRef, useState } from 'react';
import { Share2, Copy, Camera, TrendingUp, TrendingDown, Minus, Trophy, Trash2, Star, Skull } from 'lucide-react';
import { toast } from 'sonner';
import { formatScore } from '@/lib/scoreUtils';
import html2canvas from 'html2canvas';

function RankBadge({ rank, totalEntries }) {
  if (rank === 1) return <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-black border border-yellow-500/30">🏆 #1</span>;
  if (rank === 2) return <span className="px-2 py-0.5 rounded-full bg-gray-400/20 text-gray-300 text-xs font-black border border-gray-400/30">🥈 #2</span>;
  if (rank === 3) return <span className="px-2 py-0.5 rounded-full bg-amber-700/20 text-amber-500 text-xs font-black border border-amber-600/30">🥉 #3</span>;
  if (rank === totalEntries) return <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-xs font-black border border-red-500/30 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Cellar Dweller</span>;
  return <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-xs font-bold border border-white/10">#{rank}</span>;
}

function RankChangeArrow({ change }) {
  if (change > 0) return <span className="flex items-center gap-0.5 text-green-400 font-bold text-sm"><TrendingUp className="w-3.5 h-3.5" />+{change}</span>;
  if (change < 0) return <span className="flex items-center gap-0.5 text-orange-400 font-bold text-sm"><TrendingDown className="w-3.5 h-3.5" />{change}</span>;
  return <span className="flex items-center gap-0.5 text-white/40 font-bold text-sm"><Minus className="w-3.5 h-3.5" />—</span>;
}

export default function RecapCard({ recap, totalEntries, roundNumber }) {
  const cardRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const handleCopy = () => {
    const text = `📋 THE CADDYSHACK REPORT\nRound ${roundNumber} — ${recap.participant_name}\n\n${recap.recap_headline}\n\n${recap.recap_body}\n\n🌟 MVP: ${recap.best_golfer?.name} (${recap.best_golfer?.score})\n💀 Disaster: ${recap.worst_golfer?.name} (${recap.worst_golfer?.score})\n\ncowtownmasters.base44.app`;
    navigator.clipboard.writeText(text);
    toast.success('Recap copied to clipboard!');
  };

  const handleShareCard = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        useCORS: true,
      });
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

  const toneLabel = { roast_heavy: '🔥 Roast', praise_heavy: '👏 Praise', balanced: '⚖️ Balanced', tragic_comedy: '💀 Tragic' }[recap.recap_tone] || '';

  return (
    <div
      ref={cardRef}
      className="bg-[#111] rounded-xl border border-[#d4a574]/20 overflow-hidden shadow-lg shadow-black/30"
    >
      {/* Top strip */}
      <div className="bg-gradient-to-r from-[#1a1a1a] to-[#0d0d0d] px-4 py-3 flex items-center justify-between border-b border-[#d4a574]/15">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-lg font-bold text-white truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
            {recap.participant_name}
          </h3>
          <RankBadge rank={recap.team_rank_for_round} totalEntries={totalEntries} />
        </div>
        <span className="text-[10px] text-[#d4a574]/60 font-bold uppercase tracking-widest flex-shrink-0">{toneLabel}</span>
      </div>

      {/* Headline */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xl font-black text-[#d4a574] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
          "{recap.recap_headline}"
        </h2>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-px mx-4 mb-3 bg-[#d4a574]/10 rounded-lg overflow-hidden">
        <div className="bg-[#0a0a0a] p-2.5 text-center">
          <p className="text-[9px] font-bold text-[#d4a574]/50 tracking-widest uppercase">Round</p>
          <p className="text-lg font-black text-white tabular-nums">{formatScore(recap.team_total_to_par)}</p>
        </div>
        <div className="bg-[#0a0a0a] p-2.5 text-center">
          <p className="text-[9px] font-bold text-[#d4a574]/50 tracking-widest uppercase">Move</p>
          <div className="flex justify-center mt-0.5"><RankChangeArrow change={recap.rank_change} /></div>
        </div>
        <div className="bg-[#0a0a0a] p-2.5 text-center">
          <p className="text-[9px] font-bold text-[#d4a574]/50 tracking-widest uppercase">Overall</p>
          <p className="text-lg font-black text-white tabular-nums">#{recap.overall_rank}</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-3">
        <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {recap.recap_body}
        </p>
      </div>

      {/* MVP / Disaster pills */}
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 bg-green-900/30 text-green-400 text-xs font-bold px-2.5 py-1 rounded-full border border-green-500/20">
          <Star className="w-3 h-3" /> MVP: {recap.best_golfer?.name} ({recap.best_golfer?.score})
        </span>
        <span className="inline-flex items-center gap-1.5 bg-red-900/30 text-red-400 text-xs font-bold px-2.5 py-1 rounded-full border border-red-500/20">
          <Skull className="w-3 h-3" /> Disaster: {recap.worst_golfer?.name} ({recap.worst_golfer?.score})
        </span>
      </div>

      {/* Actions */}
      <div className="px-4 py-2.5 border-t border-[#d4a574]/10 flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-[#d4a574] bg-[#d4a574]/10 hover:bg-[#d4a574]/20 rounded-lg py-2 transition"
        >
          <Copy className="w-3.5 h-3.5" /> Copy
        </button>
        <button
          onClick={handleShareCard}
          disabled={exporting}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-[#d4a574] bg-[#d4a574]/10 hover:bg-[#d4a574]/20 rounded-lg py-2 transition disabled:opacity-50"
        >
          <Camera className="w-3.5 h-3.5" /> {exporting ? 'Saving...' : 'Share Card'}
        </button>
      </div>
    </div>
  );
}