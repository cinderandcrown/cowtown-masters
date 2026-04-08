import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const RSS_FEEDS = [
  {
    url: 'https://www.espn.com/espn/rss/golf/news',
    source: 'ESPN Golf',
  },
  {
    url: 'https://www.pgatour.com/rss/news.rss',
    source: 'PGA Tour',
  },
];

function extractItems(xml, source) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const getTag = (tag) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, 's'));
      return m ? m[1].trim() : '';
    };
    const title = getTag('title');
    const link = getTag('link') || getTag('guid');
    const description = getTag('description').replace(/<[^>]+>/g, '').slice(0, 300);
    const pubDate = getTag('pubDate');
    const imageMatch = block.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)
      || block.match(/<enclosure[^>]+url=["']([^"']+)["']/i)
      || block.match(/<media:content[^>]+url=["']([^"']+)["']/i)
      || block.match(/<image>\s*<url>([^<]+)<\/url>/);
    const image = imageMatch ? imageMatch[1] : null;

    if (title) {
      items.push({ title, link, description, pubDate, image, source });
    }
  }
  return items;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allItems = [];

    for (const feed of RSS_FEEDS) {
      try {
        const resp = await fetch(feed.url, {
          headers: { 'User-Agent': 'CowtownMasters/1.0' },
          signal: AbortSignal.timeout(8000),
        });
        if (resp.ok) {
          const xml = await resp.text();
          const items = extractItems(xml, feed.source);
          allItems.push(...items);
        }
      } catch (_e) {
        // Feed unavailable — skip silently
      }
    }

    // If RSS feeds returned nothing, use InvokeLLM for curated Masters news
    if (allItems.length === 0) {
      try {
        const llmResult = await base44.asServiceRole.integrations.invoke('Core', 'InvokeLLM', {
          prompt: `Provide 8-10 current news headlines about the 2026 Masters Tournament at Augusta National. For each, include a title, a 1-2 sentence summary, and if relevant note any injury updates, withdrawals, or notable performances. Focus on real, factual tournament news. Today's date is ${new Date().toISOString().split('T')[0]}.`,
          response_json_schema: {
            type: 'object',
            properties: {
              articles: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    category: { type: 'string', enum: ['tournament', 'injury', 'performance', 'general'] },
                  },
                },
              },
            },
          },
          add_context_from_internet: true,
        });

        if (llmResult?.articles) {
          for (const article of llmResult.articles) {
            allItems.push({
              title: article.title,
              link: '',
              description: article.description,
              pubDate: new Date().toUTCString(),
              image: null,
              source: 'Masters Update',
              category: article.category || 'general',
            });
          }
        }
      } catch (_e) {
        // LLM fallback failed
      }
    }

    // Sort by date (newest first), limit to 20
    allItems.sort((a, b) => {
      const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return db - da;
    });

    // Filter for golf/Masters relevance keywords
    const mastersKeywords = ['masters', 'augusta', 'golf', 'pga', 'tour', 'birdie', 'eagle', 'bogey', 'par', 'cut', 'round', 'green jacket', 'amen corner', 'tiger', 'scheffler', 'mcilroy', 'rahm', 'koepka', 'spieth', 'morikawa', 'woodland', 'hovland', 'cantlay', 'clark', 'aberg', 'injury', 'withdrawn', 'wd'];
    
    const relevant = allItems.filter(item => {
      const text = `${item.title} ${item.description}`.toLowerCase();
      return mastersKeywords.some(kw => text.includes(kw));
    });

    return Response.json({
      articles: (relevant.length > 3 ? relevant : allItems).slice(0, 20),
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});