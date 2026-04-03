// Centralized pool history data — used by HistoryTab and ParticipantProfile
// Full standings data from spreadsheets where available; summary-only for older years
export const POOL_HISTORY = {
  2025: {
    winner: 'Clay Collier',
    winningScore: -15,
    entries: 23,
    standings: [
      { name: 'Clay Collier', golferA: 'Ludvig Åberg', scoreA: -9, golferB: 'Patrick Reed', scoreB: -6, total: -15, rank: 1 },
      { name: 'Sanders Johnston', golferA: 'Jon Rahm', scoreA: -7, golferB: 'Sungjae Im', scoreB: -3, total: -10, rank: 2 },
      { name: 'Charlie Brown', golferA: 'Patrick Cantlay', scoreA: -11, golferB: 'Justin Rose', scoreB: 2, total: -9, rank: 3 },
      { name: 'Adam Teppe', golferA: 'Rory McIlroy', scoreA: 3, golferB: 'Dustin Johnson', scoreB: -11, total: -8, rank: 4 },
      { name: 'Matthew Fleske', golferA: 'Collin Morikawa', scoreA: -1, golferB: 'Aaron Rai', scoreB: -3, total: -4, rank: 5 },
      { name: 'Chandler Mitchell', golferA: 'Hideki Matsuyama', scoreA: -6, golferB: 'Bubba Watson', scoreB: 3, total: -3, rank: 6 },
      { name: 'Zac Hansen', golferA: 'Tommy Fleetwood', scoreA: -1, golferB: 'Justin Thomas', scoreB: -2, total: -3, rank: 6 },
      { name: 'Nicholas Will', golferA: 'Brooks Koepka', scoreA: 0, golferB: 'Sam Burns', scoreB: -2, total: -2, rank: 8 },
      { name: 'Cole Platt', golferA: 'Bryson DeChambeau', scoreA: -7, golferB: 'Brian Harman', scoreB: 6, total: -1, rank: 9 },
      { name: 'Will Hudson', golferA: 'Scottie Scheffler', scoreA: -12, golferB: 'Tony Finau', scoreB: 12, total: 0, rank: 10 },
      { name: 'Josh Fisher', golferA: 'Shane Lowry', scoreA: -8, golferB: 'Cameron Smith', scoreB: 9, total: 1, rank: 11 },
      { name: 'Alex Thomas', golferA: 'Xander Schauffele', scoreA: -3, golferB: 'Sergio Garcia', scoreB: 5, total: 2, rank: 12 },
      { name: 'Gray Gomez', golferA: 'Viktor Hovland', scoreA: -3, golferB: 'Adam Scott', scoreB: 6, total: 3, rank: 13 },
      { name: 'John Tobias', golferA: 'Jordan Spieth', scoreA: -2, golferB: 'Russell Henley', scoreB: 7, total: 5, rank: 14 },
      { name: 'Jake Vickers', golferA: 'Matt Fitzpatrick', scoreA: 5, golferB: 'Corey Conners', scoreB: 1, total: 6, rank: 15 },
      { name: 'Andy', golferA: 'Robert MacIntyre', scoreA: 7, golferB: 'Jason Day', scoreB: 0, total: 7, rank: 16 },
      { name: 'Billy Watkins', golferA: 'Justin Rose', scoreA: -11, golferB: 'Wyndham Clark', scoreB: 19, total: 8, rank: 17 },
      { name: 'Tate Ownings', golferA: 'Patrick Reed', scoreA: -6, golferB: 'Tyrrell Hatton', scoreB: 15, total: 9, rank: 18 },
      { name: 'James Karr', golferA: 'Cameron Young', scoreA: 5, golferB: 'Tom Kim', scoreB: 5, total: 10, rank: 19 },
      { name: 'Charlie Brown Jr.', golferA: 'Sahith Theegala', scoreA: 4, golferB: 'Max Homa', scoreB: 7, total: 11, rank: 20 },
      { name: 'Ross Daniels', golferA: 'Keegan Bradley', scoreA: 0, golferB: 'Phil Mickelson', scoreB: 12, total: 12, rank: 21 },
      { name: 'Nick W.', golferA: 'Ludvig Åberg', scoreA: -9, golferB: 'Min Woo Lee', scoreB: 22, total: 13, rank: 22 },
      { name: 'Josh Howard', golferA: 'Dustin Johnson', scoreA: -11, golferB: 'Daniel Berger', scoreB: 25, total: 14, rank: 23 },
    ],
  },
  2024: {
    winner: 'Will Hudson',
    winningScore: -5,
    entries: 32,
    standings: [
      { name: 'Will Hudson', golferA: 'Ludvig Åberg', scoreA: -7, golferB: 'Byeong Hun An', scoreB: 2, total: -5, rank: 1 },
      { name: 'Alex T.', golferA: 'Max Homa', scoreA: -4, golferB: 'Nicolai Højgaard', scoreB: 2, total: -2, rank: 2 },
      { name: 'Charlie B.', golferA: 'Scottie Scheffler', scoreA: -11, golferB: 'Denny McCarthy', scoreB: 9, total: -2, rank: 2 },
      { name: 'Nick W.', golferA: 'Bryson DeChambeau', scoreA: -6, golferB: 'Adam Scott', scoreB: 4, total: -2, rank: 2 },
      { name: 'Andy', golferA: 'Patrick Reed', scoreA: -3, golferB: 'Matthieu Pavon', scoreB: 1, total: -2, rank: 2 },
      { name: 'Sanders', golferA: 'Collin Morikawa', scoreA: -6, golferB: 'Harris English', scoreB: 5, total: -1, rank: 6 },
      { name: 'Clay', golferA: 'Russell Henley', scoreA: -2, golferB: 'Brian Harman', scoreB: 1, total: -1, rank: 6 },
      { name: 'Chandler', golferA: 'Tommy Fleetwood', scoreA: -4, golferB: 'Matt McCarty', scoreB: 4, total: 0, rank: 8 },
      { name: 'Fleske', golferA: 'Shane Lowry', scoreA: -3, golferB: 'Sungjae Im', scoreB: 4, total: 1, rank: 9 },
      { name: 'Fisher', golferA: 'Viktor Hovland', scoreA: -3, golferB: 'Brooks Koepka', scoreB: 5, total: 2, rank: 10 },
      { name: 'Vickers', golferA: 'Robert MacIntyre', scoreA: -3, golferB: 'Jason Day', scoreB: 6, total: 3, rank: 11 },
      { name: 'Teppe', golferA: 'Patrick Cantlay', scoreA: -3, golferB: 'Will Zalatoris', scoreB: 7, total: 4, rank: 12 },
      { name: 'Cole', golferA: 'Rory McIlroy', scoreA: -7, golferB: 'Cam Davis', scoreB: 12, total: 5, rank: 13 },
      { name: 'Tobias', golferA: 'Hideki Matsuyama', scoreA: -2, golferB: 'Min Woo Lee', scoreB: 8, total: 6, rank: 14 },
      { name: 'N. Will', golferA: 'Xander Schauffele', scoreA: -2, golferB: 'Cameron Smith', scoreB: 9, total: 7, rank: 15 },
      { name: 'Josh H.', golferA: 'Jordan Spieth', scoreA: -5, golferB: 'J.J. Spaun', scoreB: 13, total: 8, rank: 16 },
      { name: 'Zac', golferA: 'Tony Finau', scoreA: -2, golferB: 'Tiger Woods', scoreB: 12, total: 10, rank: 17 },
      { name: 'Karr', golferA: 'Justin Thomas', scoreA: -1, golferB: 'Phil Mickelson', scoreB: 12, total: 11, rank: 18 },
      { name: 'Billy', golferA: 'Jon Rahm', scoreA: 3, golferB: 'Akshay Bhatia', scoreB: 9, total: 12, rank: 19 },
      { name: 'Gray', golferA: 'Dustin Johnson', scoreA: 7, golferB: 'Sam Burns', scoreB: 6, total: 13, rank: 20 },
      { name: 'Ross', golferA: 'Cameron Young', scoreA: 5, golferB: 'Corey Conners', scoreB: 9, total: 14, rank: 21 },
      { name: 'Tate', golferA: 'Justin Rose', scoreA: 4, golferB: 'Sergio Garcia', scoreB: 11, total: 15, rank: 22 },
      { name: 'Jake', golferA: 'Matt Fitzpatrick', scoreA: 4, golferB: 'Bubba Watson', scoreB: 12, total: 16, rank: 23 },
      { name: 'Odom', golferA: 'Sahith Theegala', scoreA: 5, golferB: 'Nick Dunlap', scoreB: 12, total: 17, rank: 24 },
      { name: 'Belew', golferA: 'Sam Burns', scoreA: 6, golferB: 'Si Woo Kim', scoreB: 12, total: 18, rank: 25 },
      { name: 'Downs', golferA: 'Keegan Bradley', scoreA: 5, golferB: 'Danny Willett', scoreB: 14, total: 19, rank: 26 },
      { name: 'Hanson', golferA: 'Wyndham Clark', scoreA: 7, golferB: 'Chris Kirk', scoreB: 13, total: 20, rank: 27 },
      { name: 'Brown Jr.', golferA: 'Adam Scott', scoreA: 4, golferB: 'Joaquín Niemann', scoreB: 17, total: 21, rank: 28 },
      { name: 'Platt', golferA: 'Tom Kim', scoreA: 8, golferB: 'Max Homa', scoreB: 14, total: 22, rank: 29 },
      { name: 'Mitchell Jr.', golferA: 'Brian Harman', scoreA: 1, golferB: 'Charl Schwartzel', scoreB: 22, total: 23, rank: 30 },
      { name: 'Costanza', golferA: 'Daniel Berger', scoreA: 12, golferB: 'Tyrrell Hatton', scoreB: 12, total: 24, rank: 31 },
      { name: 'Page', golferA: 'Cameron Smith', scoreA: 9, golferB: 'Zach Johnson', scoreB: 18, total: 27, rank: 32 },
    ],
  },
  2023: {
    winner: 'Matthew Fleske',
    winningScore: -14,
    entries: 28,
    standings: [
      { name: 'Matthew Fleske', golferA: 'Jon Rahm', scoreA: -12, golferB: 'Justin Rose', scoreB: -2, total: -14, rank: 1 },
      { name: 'Larry W.', golferA: 'Collin Morikawa', scoreA: -4, golferB: 'Sahith Theegala', scoreB: -5, total: -9, rank: 2 },
      { name: 'Zac Hansen', golferA: 'Viktor Hovland', scoreA: -6, golferB: 'Keegan Bradley', scoreB: -1, total: -7, rank: 3 },
      { name: 'Charlie Brown', golferA: 'Scottie Scheffler', scoreA: -4, golferB: 'Denny McCarthy', scoreB: -3, total: -7, rank: 3 },
      { name: 'Blake W.', golferA: 'Brian Harman', scoreA: 2, golferB: 'Phil Mickelson', scoreB: -8, total: -6, rank: 5 },
      { name: 'Clifton M.', golferA: 'Patrick Cantlay', scoreA: -3, golferB: 'Chris Kirk', scoreB: -1, total: -4, rank: 6 },
      { name: 'Joseph C.', golferA: 'Brooks Koepka', scoreA: -8, golferB: 'Erik van Rooyen', scoreB: 5, total: -3, rank: 7 },
      { name: 'Adam Teppe', golferA: 'Jordan Spieth', scoreA: -7, golferB: 'K. Kiyama', scoreB: 5, total: -2, rank: 8 },
      { name: 'Andy', golferA: 'Patrick Reed', scoreA: -7, golferB: 'Matthieu Pavon', scoreB: 5, total: -2, rank: 8 },
      { name: 'Mark P.', golferA: 'Shane Lowry', scoreA: -2, golferB: 'Tiger Woods', scoreB: 5, total: 3, rank: 10 },
      { name: 'David S.', golferA: 'Cameron Young', scoreA: -6, golferB: 'Sepp Straka', scoreB: 5, total: -1, rank: 11 },
      { name: 'Clay Collier', golferA: 'Matt Fitzpatrick', scoreA: -4, golferB: 'Danny Willett', scoreB: 5, total: 1, rank: 12 },
      { name: 'Doug I.', golferA: 'Corey Conners', scoreA: 3, golferB: 'Sungjae Im', scoreB: -2, total: 1, rank: 12 },
      { name: 'Gilbert G.', golferA: 'K. Chaffee', scoreA: 5, golferB: 'Gary Woodland', scoreB: -3, total: 2, rank: 14 },
      { name: 'Howard', golferA: 'Tommy Fleetwood', scoreA: 2, golferB: 'Adam Hadwin', scoreB: 1, total: 3, rank: 15 },
      { name: 'Chandler Mitchell', golferA: 'Hideki Matsuyama', scoreA: -2, golferB: 'Nick Taylor', scoreB: 5, total: 3, rank: 15 },
      { name: 'Jonny D.', golferA: 'J. Atkinson', scoreA: 5, golferB: 'Tom Kim', scoreB: -2, total: 3, rank: 15 },
      { name: 'James P.', golferA: 'Tony Finau', scoreA: 0, golferB: 'A. Hurranca', scoreB: 5, total: 5, rank: 18 },
      { name: 'Corey P.', golferA: 'Cameron Smith', scoreA: 5, golferB: 'Ryan Fox', scoreB: 0, total: 5, rank: 18 },
      { name: 'Daniel K.', golferA: 'Sam Burns', scoreA: 1, golferB: 'Emiliano Grillo', scoreB: 5, total: 6, rank: 20 },
      { name: 'Johnny T.', golferA: 'Tyrrell Hatton', scoreA: 3, golferB: 'Harris English', scoreB: 5, total: 8, rank: 21 },
      { name: 'Jackson V.', golferA: 'Will Zalatoris', scoreA: 4, golferB: 'Charl Schwartzel', scoreB: 5, total: 9, rank: 22 },
      { name: 'Nicholas Will', golferA: 'Bryson DeChambeau', scoreA: 5, golferB: 'Adam Scott', scoreB: 5, total: 10, rank: 23 },
      { name: 'Robert L.', golferA: 'Wyndham Clark', scoreA: 5, golferB: 'M. Olsen', scoreB: 5, total: 10, rank: 23 },
      { name: 'Tyler P.', golferA: 'Rory McIlroy', scoreA: 5, golferB: 'Bubba Watson', scoreB: 5, total: 10, rank: 23 },
      { name: 'Zack H.', golferA: 'Dustin Johnson', scoreA: 5, golferB: 'Abraham Ancer', scoreB: 5, total: 10, rank: 23 },
      { name: 'Will Hudson', golferA: 'Ludvig Åberg', scoreA: 5, golferB: 'B. Hun An', scoreB: 5, total: 10, rank: 23 },
      { name: 'Alex Thomas', golferA: 'Max Homa', scoreA: 5, golferB: 'N. Ogard', scoreB: 5, total: 10, rank: 23 },
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
      { name: 'Longhair', golferA: 'Sam Burns', scoreA: 5, golferB: 'Sungjae Im', scoreB: -1, total: 4, rank: 8 },
      { name: 'J. Vickers', golferA: 'Corey Conners', scoreA: -3, golferB: 'Luke List', scoreB: 8, total: 5, rank: 9 },
      { name: 'T. Page', golferA: 'Collin Morikawa', scoreA: -4, golferB: 'Cameron Young', scoreB: 10, total: 6, rank: 10 },
      { name: 'T. Ownings', golferA: 'Louis Oosthuizen', scoreA: 4, golferB: 'Harold Varner III', scoreB: 3, total: 7, rank: 11 },
      { name: 'W. Odom', golferA: 'Russell Henley', scoreA: 5, golferB: 'Sergio Garcia', scoreB: 3, total: 8, rank: 12 },
      { name: 'Z. Gordon', golferA: 'Hideki Matsuyama', scoreA: 2, golferB: 'Si Woo Kim', scoreB: 7, total: 9, rank: 13 },
      { name: 'A. Ardet', golferA: 'Joaquin Niemann', scoreA: 6, golferB: 'Tommy Fleetwood', scoreB: 3, total: 9, rank: 13 },
      { name: 'C. Costanza', golferA: 'Viktor Hovland', scoreA: 4, golferB: 'Abraham Ancer', scoreB: 7, total: 11, rank: 15 },
      { name: 'A. Thomas', golferA: 'Jon Rahm', scoreA: 4, golferB: 'Tom Hoge', scoreB: 7, total: 11, rank: 15 },
      { name: 'C. Brown', golferA: 'Jordan Spieth', scoreA: 6, golferB: 'Brian Harman', scoreB: 5, total: 11, rank: 15 },
      { name: 'J. Fisher', golferA: 'Tony Finau', scoreA: 6, golferB: 'Gary Woodland', scoreB: 8, total: 14, rank: 18 },
      { name: 'J. Karr', golferA: 'Brooks Koepka', scoreA: 6, golferB: 'Billy Horschel', scoreB: 8, total: 14, rank: 18 },
      { name: 'Z. Hanson', golferA: 'Xander Schauffele', scoreA: 7, golferB: 'Kevin Kisner', scoreB: 9, total: 16, rank: 20 },
      { name: 'J. Tobias', golferA: 'Matthew Fitzpatrick', scoreA: 2, golferB: 'Thomas Pieters', scoreB: 15, total: 17, rank: 21 },
      { name: 'R. Downs', golferA: 'Bryson DeChambeau', scoreA: 12, golferB: 'Patrick Reed', scoreB: 6, total: 18, rank: 22 },
      { name: 'A. Tepe', golferA: 'Adam Scott', scoreA: 14, golferB: 'Marc Leishman', scoreB: 5, total: 19, rank: 23 },
      { name: 'M. Belew', golferA: 'Daniel Berger', scoreA: 15, golferB: 'Seamus Power', scoreB: 4, total: 19, rank: 23 },
      { name: 'J. Howard', golferA: 'Tiger Woods', scoreA: 13, golferB: 'Bubba Watson', scoreB: 7, total: 20, rank: 25 },
      { name: 'W. Hudson', golferA: 'Tyrrell Hatton', scoreA: 17, golferB: 'Robert MacIntyre', scoreB: 3, total: 20, rank: 25 },
      { name: 'C. Platt', golferA: 'Patrick Cantlay', scoreA: 7, golferB: 'Max Homa', scoreB: 14, total: 21, rank: 27 },
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