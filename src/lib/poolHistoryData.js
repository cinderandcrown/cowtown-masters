// Centralized pool history data — used by HistoryTab and ParticipantProfile
export const POOL_HISTORY = {
  2025: {
    winner: 'Clay Coiller',
    winningScore: -15,
    entries: 23,
    standings: [
      { name: 'Clay Coiller', golferA: 'Ludvig Åberg', scoreA: -12, golferB: 'Patrick Reed', scoreB: -3, total: -15, rank: 1 },
    ],
  },
  2024: {
    winner: 'Will H.',
    winningScore: -5,
    entries: 32,
    standings: [
      { name: 'Will H.', golferA: 'Ludvig Åberg', scoreA: -7, golferB: 'Byeong Hun An', scoreB: 2, total: -5, rank: 1 },
    ],
  },
  2023: {
    winner: 'Charlie Brown',
    winningScore: -13,
    entries: 28,
    standings: [
      { name: 'Charlie Brown', golferA: 'Scottie Scheffler', scoreA: -10, golferB: 'Denny McCarthy', scoreB: -3, total: -13, rank: 1 },
    ],
  },
  2022: {
    winner: 'Nicholas Will',
    winningScore: -4,
    entries: 27,
    standings: [
      { name: 'Nicholas Will', golferA: 'Scottie Scheffler', scoreA: -10, golferB: 'Webb Simpson', scoreB: 6, total: -4, rank: 1 },
      { name: 'J. Pool', golferA: 'Cameron Smith', scoreA: -5, golferB: 'Talor Gooch', scoreB: 2, total: -3, rank: 2 },
      { name: 'C. Mitchell', golferA: 'Will Zalatoris', scoreA: -3, golferB: 'Lee Westwood', scoreB: 2, total: -1, rank: 3 },
      { name: 'G. Gomez', golferA: 'Justin Thomas', scoreA: -1, golferB: 'Kevin Na', scoreB: 2, total: 1, rank: 4 },
      { name: 'B. Watkins', golferA: 'Rory McIlroy', scoreA: -7, golferB: 'Christian Bezuidenhout', scoreB: 9, total: 2, rank: 5 },
      { name: 'R. Daniels', golferA: 'Dustin Johnson', scoreA: 1, golferB: 'Jason Kokrak', scoreB: 2, total: 3, rank: 6 },
      { name: 'S. Johnston', golferA: 'Shane Lowry', scoreA: -5, golferB: 'Justin Rose', scoreB: 8, total: 3, rank: 6 },
      { name: 'Longhair', golferA: 'Sam Burns', scoreA: 5, golferB: 'Sungae Im', scoreB: -1, total: 4, rank: 8 },
      { name: 'J. Vickers', golferA: 'Corey Connors', scoreA: -3, golferB: 'Luke List', scoreB: 8, total: 5, rank: 9 },
      { name: 'T. Page', golferA: 'Collin Morikawa', scoreA: -4, golferB: 'Cameron Young', scoreB: 10, total: 6, rank: 10 },
      { name: 'T. Ownings', golferA: 'Louis Oosthuizen', scoreA: 4, golferB: 'Harold Varner III', scoreB: 3, total: 7, rank: 11 },
      { name: 'W. Odom', golferA: 'Russell Henley', scoreA: 5, golferB: 'Sergio Garcia', scoreB: 3, total: 8, rank: 12 },
      { name: 'Z. Gordon', golferA: 'Hideki Matsuyama', scoreA: 2, golferB: 'Si Woo Kim', scoreB: 7, total: 9, rank: 13 },
      { name: 'A. Ardet', golferA: 'Joaquin Niemann', scoreA: 6, golferB: 'Tommy Fleetwood', scoreB: 3, total: 9, rank: 13 },
      { name: 'C. Costanza', golferA: 'Viktor Hovland', scoreA: 4, golferB: 'Abraham Ancer', scoreB: 7, total: 11, rank: 15 },
      { name: 'A. Thomas', golferA: 'Jon Rahm', scoreA: 4, golferB: 'Tom Hoge', scoreB: 7, total: 11, rank: 15 },
      { name: 'C. Brown', golferA: 'Jordan Spieth', scoreA: 6, golferB: 'Brian Harmon', scoreB: 5, total: 11, rank: 15 },
      { name: 'J. Fisher', golferA: 'Tony Finau', scoreA: 6, golferB: 'Gary Woodland', scoreB: 8, total: 14, rank: 18 },
      { name: 'J. Karr', golferA: 'Brooks Koepka', scoreA: 6, golferB: 'Billy Horschel', scoreB: 8, total: 14, rank: 18 },
      { name: 'Z. Hanson', golferA: 'Xander Schauffele', scoreA: 7, golferB: 'Kevin Kisner', scoreB: 9, total: 16, rank: 20 },
      { name: 'J. Tobias', golferA: 'Matthew Fitzpatrick', scoreA: 2, golferB: 'Thomas Pieters', scoreB: 15, total: 17, rank: 21 },
      { name: 'R. Downs', golferA: 'Bryson DeChambeau', scoreA: 12, golferB: 'Patrick Reed', scoreB: 6, total: 18, rank: 22 },
      { name: 'A. Tepe', golferA: 'Adam Scott', scoreA: 14, golferB: 'Marc Leishman', scoreB: 5, total: 19, rank: 23 },
      { name: 'M. Belew', golferA: 'Daniel Berger', scoreA: 15, golferB: 'Seamus Power', scoreB: 4, total: 19, rank: 23 },
      { name: 'J. Howard', golferA: 'Tiger Woods', scoreA: 13, golferB: 'Bubba Watson', scoreB: 7, total: 20, rank: 25 },
      { name: 'W. Hudson', golferA: 'Tyrrell Hatton', scoreA: 17, golferB: 'Robert MacIntyre', scoreB: 3, total: 20, rank: 25 },
      { name: 'C. Platt', golferA: 'Patrick Cantley', scoreA: 7, golferB: 'Max Homa', scoreB: 14, total: 21, rank: 27 },
    ],
  },
  2021: {
    winner: 'Zac Hansen',
    winningScore: -13,
    entries: 20,
    standings: [
      { name: 'Zac Hansen', golferA: 'Hideki Matsuyama', scoreA: -10, golferB: 'Phil Mickelson', scoreB: -3, total: -13, rank: 1 },
    ],
  },
};

// Helper: get all unique participant names across all years
export function getAllParticipants() {
  const names = new Set();
  for (const year of Object.values(POOL_HISTORY)) {
    for (const s of year.standings) {
      names.add(s.name);
    }
  }
  return Array.from(names).sort();
}

// Helper: get a participant's history across all years
export function getParticipantHistory(name) {
  const results = [];
  for (const [year, data] of Object.entries(POOL_HISTORY)) {
    const entry = data.standings.find(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );
    if (entry) {
      results.push({
        year: Number(year),
        ...entry,
        totalEntries: data.entries,
        isWinner: data.winner.toLowerCase() === name.toLowerCase(),
      });
    }
  }
  return results.sort((a, b) => b.year - a.year);
}