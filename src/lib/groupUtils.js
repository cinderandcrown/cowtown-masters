/**
 * Compute dynamic A/B groups based on participant count.
 * Group A = top N golfers by betting odds (lowest/best odds first), where N = entryCount.
 * Group B = everyone else.
 * 
 * Odds format: "+300", "+1600", etc. Lower number = better odds = Group A.
 */

function parseOdds(oddsStr) {
  if (!oddsStr) return 99999;
  const num = parseInt(oddsStr.replace('+', '').replace('-', ''), 10);
  return isNaN(num) ? 99999 : num;
}

export function assignGroups(golfers, entryCount) {
  if (!golfers || golfers.length === 0) return [];
  
  // Sort by betting odds (best/lowest first)
  const sorted = [...golfers].sort((a, b) => parseOdds(a.betting_odds) - parseOdds(b.betting_odds));
  
  // Top N = Group A, rest = Group B
  const groupSize = Math.max(1, entryCount || 0);
  
  return sorted.map((g, i) => ({
    ...g,
    group: i < groupSize ? 'A' : 'B',
  }));
}