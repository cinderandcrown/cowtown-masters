import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Newspaper, ExternalLink, Clock, AlertTriangle, RefreshCw, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getCategoryBadge(article) {
  const text = `${article.title} ${article.description}`.toLowerCase();
  if (article.category === 'injury' || text.includes('injury') || text.includes('withdrawn') || text.includes('withdrawal'))
    return { label: 'INJURY', color: 'bg-red-500/15 text-red-600' };
  if (article.category === 'performance' || text.includes('eagle') || text.includes('hole-in-one') || text.includes('ace'))
    return { label: 'HIGHLIGHT', color: 'bg-accent/15 text-accent' };
  if (text.includes('cut') || text.includes('missed cut'))
    return { label: 'CUT LINE', color: 'bg-orange-500/15 text-orange-600' };
  if (text.includes('leader') || text.includes('first place') || text.includes('leads'))
    return { label: 'LEADERBOARD', color: 'bg-primary/15 text-primary' };
  return null;
}

function NewsCard({ article, onOpen }) {
  const badge = getCategoryBadge(article);
  return (
    <div
      role={article.link ? 'button' : undefined}
      tabIndex={article.link ? 0 : undefined}
      onClick={() => article.link && onOpen(article)}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && article.link) { e.preventDefault(); onOpen(article); } }}
      className={`block bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-md transition-all ${article.link ? 'cursor-pointer' : ''}`}
    >
      {article.image && (
        <div className="h-36 bg-muted overflow-hidden">
          <img src={article.image} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}
      <div className="p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">{article.title}</h3>
          {article.link && <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />}
        </div>
        {article.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{article.description}</p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {badge && (
            <span className={`text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded ${badge.color}`}>
              {badge.label}
            </span>
          )}
          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{article.source}</span>
          {article.pubDate && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="w-2.5 h-2.5" />
              {timeAgo(article.pubDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function NewsSkeleton() {
  return (
    <div className="px-3 pt-3 space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl border border-border p-3 space-y-2">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function GolferNewsTab({ poolId }) {
  const [openArticle, setOpenArticle] = useState(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['golferNews', poolId],
    queryFn: async () => {
      const res = await base44.functions.invoke('fetchGolfNews', {});
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
    refetchInterval: 10 * 60 * 1000, // auto-refresh every 10 min
    retry: 1,
  });

  const articles = data?.articles || [];

  if (isLoading) return <NewsSkeleton />;

  return (
    <div className="px-3 pt-3 pb-0">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0a3d0a] to-primary rounded-xl p-4 mb-4 border border-accent/30 text-center relative overflow-hidden">
        <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-30" />
        <div className="relative flex items-center justify-center gap-2 mb-1">
          <Newspaper className="w-5 h-5 text-accent" />
          <h2 className="text-2xl font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Golfer News
          </h2>
        </div>
        <p className="text-xs tracking-widest text-accent uppercase font-semibold relative">Masters Updates & Injury Reports</p>
      </div>

      {/* Refresh bar */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-muted-foreground">
          {data?.fetchedAt ? `Updated ${timeAgo(data.fetchedAt)}` : 'Fetching latest news...'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Refresh
        </Button>
      </div>

      {/* Error state */}
      {isError && articles.length === 0 && (
        <div className="bg-card rounded-xl border border-destructive/20 p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
          <p className="text-sm font-bold text-foreground">Unable to load news</p>
          <p className="text-xs text-muted-foreground">Check your connection and try again.</p>
          <Button onClick={() => refetch()} size="sm" className="bg-primary text-white">
            Try Again
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isError && articles.length === 0 && (
        <div className="bg-card rounded-xl border border-border p-6 text-center space-y-3">
          <Newspaper className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-bold text-foreground">No news available yet</p>
          <p className="text-xs text-muted-foreground">News feeds will populate as the tournament approaches and during play.</p>
        </div>
      )}

      {/* Articles */}
      <div className="space-y-3">
        {articles.map((article, i) => (
          <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(i * 60, 400)}ms` }}>
            <NewsCard article={article} onOpen={setOpenArticle} />
          </div>
        ))}
      </div>

      {/* Article Modal */}
      <Dialog open={!!openArticle} onOpenChange={(open) => !open && setOpenArticle(null)}>
        <DialogContent className="max-w-3xl w-[95vw] h-[85vh] p-0 gap-0 overflow-hidden">
          {openArticle && (
            <>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card">
                <div className="flex-1 min-w-0 mr-3">
                  <h3 className="text-sm font-bold text-foreground truncate">{openArticle.title}</h3>
                  <p className="text-[11px] text-muted-foreground">{openArticle.source}</p>
                </div>
                <a
                  href={openArticle.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline flex-shrink-0"
                >
                  Open <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <iframe
                src={openArticle.link}
                title={openArticle.title}
                className="w-full flex-1 border-0"
                style={{ height: 'calc(85vh - 52px)' }}
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}