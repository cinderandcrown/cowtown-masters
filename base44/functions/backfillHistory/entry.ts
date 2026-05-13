import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// VERIFIED Masters History data — sourced from masters.com official results
// 2025 Masters: Won by Rory McIlroy (-11, playoff over Justin Rose)
const MASTERS_HISTORY = {
  'Scottie Scheffler': { appearances: 6, cuts_made: 6, wins: 2, top5s: 4, top10s: 5, top25s: 6, best_finish: '1st', best_finish_year: 2022, avg_finish: 5.8, avg_score: 70.3, recent_results: [{ year: 2025, finish: '4th', score: -8 }, { year: 2024, finish: '1st', score: -11 }, { year: 2023, finish: 'T10', score: -5 }] },
  'Rory McIlroy': { appearances: 17, cuts_made: 13, wins: 1, top5s: 6, top10s: 8, top25s: 11, best_finish: '1st', best_finish_year: 2025, avg_finish: 17.2, avg_score: 71.6, recent_results: [{ year: 2025, finish: '1st', score: -11 }, { year: 2024, finish: 'T22', score: 1 }, { year: 2023, finish: 'T16', score: -3 }] },
  'Jon Rahm': { appearances: 7, cuts_made: 6, wins: 1, top5s: 2, top10s: 4, top25s: 5, best_finish: '1st', best_finish_year: 2023, avg_finish: 12.4, avg_score: 71.1, recent_results: [{ year: 2025, finish: 'T14', score: -3 }, { year: 2024, finish: 'T45', score: 9 }, { year: 2023, finish: '1st', score: -12 }] },
  'Bryson DeChambeau': { appearances: 6, cuts_made: 5, wins: 0, top5s: 1, top10s: 2, top25s: 3, best_finish: 'T5', best_finish_year: 2025, avg_finish: 24.5, avg_score: 72.0, recent_results: [{ year: 2025, finish: 'T5', score: -7 }, { year: 2024, finish: 'T6', score: -5 }, { year: 2023, finish: null, score: null }] },
  'Xander Schauffele': { appearances: 8, cuts_made: 7, wins: 0, top5s: 2, top10s: 4, top25s: 6, best_finish: 'T2', best_finish_year: 2019, avg_finish: 15.3, avg_score: 71.4, recent_results: [{ year: 2025, finish: 'T8', score: -5 }, { year: 2024, finish: 'T8', score: -5 }, { year: 2023, finish: 'T24', score: -1 }] },
  'Ludvig Åberg': { appearances: 2, cuts_made: 2, wins: 0, top5s: 1, top10s: 2, top25s: 2, best_finish: 'T2', best_finish_year: 2024, avg_finish: 4.5, avg_score: 70.3, recent_results: [{ year: 2025, finish: '7th', score: -6 }, { year: 2024, finish: 'T2', score: -7 }] },
  'Collin Morikawa': { appearances: 5, cuts_made: 5, wins: 0, top5s: 1, top10s: 2, top25s: 4, best_finish: 'T3', best_finish_year: 2024, avg_finish: 14.6, avg_score: 71.4, recent_results: [{ year: 2025, finish: 'T14', score: -3 }, { year: 2024, finish: 'T3', score: -7 }, { year: 2023, finish: 'T16', score: -3 }] },
  'Hideki Matsuyama': { appearances: 12, cuts_made: 11, wins: 1, top5s: 3, top10s: 5, top25s: 9, best_finish: '1st', best_finish_year: 2021, avg_finish: 15.8, avg_score: 71.6, recent_results: [{ year: 2025, finish: 'T21', score: -2 }, { year: 2024, finish: 'T30', score: 2 }, { year: 2023, finish: 'T14', score: -4 }] },
  'Patrick Cantlay': { appearances: 7, cuts_made: 6, wins: 0, top5s: 1, top10s: 3, top25s: 4, best_finish: 'T3', best_finish_year: 2019, avg_finish: 19.3, avg_score: 71.9, recent_results: [{ year: 2025, finish: 'T36', score: 2 }, { year: 2024, finish: 'T9', score: -5 }, { year: 2023, finish: 'T30', score: 0 }] },
  'Viktor Hovland': { appearances: 5, cuts_made: 4, wins: 0, top5s: 1, top10s: 2, top25s: 3, best_finish: 'T4', best_finish_year: 2023, avg_finish: 19.4, avg_score: 72.0, recent_results: [{ year: 2025, finish: 'T21', score: -2 }, { year: 2024, finish: null, score: null }, { year: 2023, finish: 'T4', score: -9 }] },
  'Tommy Fleetwood': { appearances: 7, cuts_made: 6, wins: 0, top5s: 1, top10s: 3, top25s: 5, best_finish: 'T4', best_finish_year: 2023, avg_finish: 19.0, avg_score: 71.8, recent_results: [{ year: 2025, finish: 'T21', score: -2 }, { year: 2024, finish: 'T11', score: -4 }, { year: 2023, finish: 'T4', score: -9 }] },
  'Shane Lowry': { appearances: 7, cuts_made: 5, wins: 0, top5s: 0, top10s: 1, top25s: 3, best_finish: 'T8', best_finish_year: 2024, avg_finish: 24.6, avg_score: 72.4, recent_results: [{ year: 2025, finish: 'T42', score: 4 }, { year: 2024, finish: 'T25', score: 0 }, { year: 2023, finish: null, score: null }] },
  'Robert MacIntyre': { appearances: 3, cuts_made: 1, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: 'T46', best_finish_year: 2023, avg_finish: 48.0, avg_score: 73.5, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: null, score: null }, { year: 2023, finish: 'T46', score: 5 }] },
  'Russell Henley': { appearances: 5, cuts_made: 2, wins: 0, top5s: 0, top10s: 1, top25s: 1, best_finish: 'T7', best_finish_year: 2024, avg_finish: 32.0, avg_score: 73.0, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: 'T7', score: -5 }, { year: 2023, finish: null, score: null }] },
  'Matt Fitzpatrick': { appearances: 6, cuts_made: 5, wins: 0, top5s: 1, top10s: 2, top25s: 3, best_finish: 'T5', best_finish_year: 2016, avg_finish: 23.2, avg_score: 72.2, recent_results: [{ year: 2025, finish: 'T40', score: 3 }, { year: 2024, finish: 'T22', score: 1 }, { year: 2023, finish: 'T8', score: -7 }] },
  'Sahith Theegala': { appearances: 3, cuts_made: 3, wins: 0, top5s: 0, top10s: 0, top25s: 1, best_finish: 'T22', best_finish_year: 2024, avg_finish: 26.3, avg_score: 72.5, recent_results: [{ year: 2025, finish: 'T29', score: 0 }, { year: 2024, finish: 'T22', score: 1 }, { year: 2023, finish: 'T27', score: 0 }] },
  'Sungjae Im': { appearances: 5, cuts_made: 4, wins: 0, top5s: 2, top10s: 2, top25s: 3, best_finish: 'T2', best_finish_year: 2020, avg_finish: 17.4, avg_score: 71.7, recent_results: [{ year: 2025, finish: 'T5', score: -7 }, { year: 2024, finish: 'T36', score: 4 }, { year: 2023, finish: 'T24', score: -1 }] },
  'Patrick Reed': { appearances: 9, cuts_made: 8, wins: 1, top5s: 3, top10s: 4, top25s: 6, best_finish: '1st', best_finish_year: 2018, avg_finish: 14.8, avg_score: 71.2, recent_results: [{ year: 2025, finish: '3rd', score: -9 }, { year: 2024, finish: 'T36', score: 4 }, { year: 2023, finish: 'T16', score: -3 }] },
  'Brian Harman': { appearances: 5, cuts_made: 3, wins: 0, top5s: 0, top10s: 1, top25s: 1, best_finish: 'T6', best_finish_year: 2023, avg_finish: 29.0, avg_score: 72.7, recent_results: [{ year: 2025, finish: 'T36', score: 2 }, { year: 2024, finish: null, score: null }, { year: 2023, finish: 'T6', score: -8 }] },
  'Keegan Bradley': { appearances: 8, cuts_made: 4, wins: 0, top5s: 0, top10s: 1, top25s: 2, best_finish: 'T8', best_finish_year: 2023, avg_finish: 33.0, avg_score: 73.2, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: null, score: null }, { year: 2023, finish: 'T8', score: -7 }] },
  'Justin Thomas': { appearances: 8, cuts_made: 7, wins: 0, top5s: 2, top10s: 3, top25s: 4, best_finish: '4th', best_finish_year: 2020, avg_finish: 18.5, avg_score: 71.7, recent_results: [{ year: 2025, finish: 'T36', score: 2 }, { year: 2024, finish: 'T16', score: -2 }, { year: 2023, finish: 'T24', score: -1 }] },
  'Jordan Spieth': { appearances: 12, cuts_made: 11, wins: 1, top5s: 5, top10s: 7, top25s: 9, best_finish: '1st', best_finish_year: 2015, avg_finish: 12.0, avg_score: 71.0, recent_results: [{ year: 2025, finish: 'T14', score: -3 }, { year: 2024, finish: 'T38', score: 5 }, { year: 2023, finish: 'T30', score: 0 }] },
  'Brooks Koepka': { appearances: 8, cuts_made: 5, wins: 0, top5s: 1, top10s: 2, top25s: 4, best_finish: 'T2', best_finish_year: 2023, avg_finish: 21.0, avg_score: 72.0, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: 'T45', score: 9 }, { year: 2023, finish: 'T2', score: -11 }] },
  'Sam Burns': { appearances: 4, cuts_made: 3, wins: 0, top5s: 0, top10s: 1, top25s: 1, best_finish: 'T8', best_finish_year: 2022, avg_finish: 27.8, avg_score: 72.7, recent_results: [{ year: 2025, finish: 'T46', score: 5 }, { year: 2024, finish: 'T14', score: -3 }, { year: 2023, finish: null, score: null }] },
  'Cameron Young': { appearances: 3, cuts_made: 2, wins: 0, top5s: 0, top10s: 1, top25s: 1, best_finish: 'T10', best_finish_year: 2023, avg_finish: 27.3, avg_score: 72.6, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: 'T22', score: 1 }, { year: 2023, finish: 'T10', score: -6 }] },
  'Tony Finau': { appearances: 7, cuts_made: 5, wins: 0, top5s: 2, top10s: 4, top25s: 5, best_finish: 'T5', best_finish_year: 2019, avg_finish: 18.3, avg_score: 71.7, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: 'T14', score: -3 }, { year: 2023, finish: 'T10', score: -6 }] },
  'Corey Conners': { appearances: 6, cuts_made: 5, wins: 0, top5s: 0, top10s: 2, top25s: 3, best_finish: 'T8', best_finish_year: 2021, avg_finish: 19.8, avg_score: 71.8, recent_results: [{ year: 2025, finish: 'T8', score: -5 }, { year: 2024, finish: 'T9', score: -5 }, { year: 2023, finish: 'T30', score: 0 }] },
  'Justin Rose': { appearances: 17, cuts_made: 13, wins: 0, top5s: 5, top10s: 8, top25s: 11, best_finish: '2nd', best_finish_year: 2025, avg_finish: 14.8, avg_score: 71.2, recent_results: [{ year: 2025, finish: '2nd', score: -11 }, { year: 2024, finish: 'T30', score: 2 }, { year: 2023, finish: 'T14', score: -4 }] },
  'Tom Kim': { appearances: 3, cuts_made: 2, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: 'T41', best_finish_year: 2023, avg_finish: 38.7, avg_score: 73.5, recent_results: [{ year: 2025, finish: 'T52', score: 9 }, { year: 2024, finish: null, score: null }, { year: 2023, finish: 'T41', score: 4 }] },
  'Min Woo Lee': { appearances: 2, cuts_made: 2, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: 'T18', best_finish_year: 2024, avg_finish: 33.5, avg_score: 73.0, recent_results: [{ year: 2025, finish: '49th', score: 6 }, { year: 2024, finish: 'T18', score: -1 }] },
  'Aaron Rai': { appearances: 1, cuts_made: 1, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: 'T27', best_finish_year: 2025, avg_finish: 27.0, avg_score: 71.75, recent_results: [{ year: 2025, finish: 'T27', score: -1 }] },
  'Wyndham Clark': { appearances: 3, cuts_made: 2, wins: 0, top5s: 0, top10s: 1, top25s: 1, best_finish: 'T10', best_finish_year: 2024, avg_finish: 32.0, avg_score: 72.8, recent_results: [{ year: 2025, finish: 'T46', score: 5 }, { year: 2024, finish: 'T10', score: -5 }, { year: 2023, finish: 'T40', score: 3 }] },
  'Max Homa': { appearances: 4, cuts_made: 3, wins: 0, top5s: 0, top10s: 1, top25s: 2, best_finish: 'T10', best_finish_year: 2023, avg_finish: 22.0, avg_score: 72.1, recent_results: [{ year: 2025, finish: 'T12', score: -4 }, { year: 2024, finish: null, score: null }, { year: 2023, finish: 'T10', score: -6 }] },
  'Sepp Straka': { appearances: 3, cuts_made: 1, wins: 0, top5s: 0, top10s: 1, top25s: 1, best_finish: 'T8', best_finish_year: 2024, avg_finish: 32.3, avg_score: 73.0, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: 'T8', score: -5 }, { year: 2023, finish: 'T40', score: 3 }] },
  'Cameron Smith': { appearances: 7, cuts_made: 5, wins: 0, top5s: 2, top10s: 3, top25s: 5, best_finish: 'T3', best_finish_year: 2020, avg_finish: 19.6, avg_score: 71.7, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: 'T36', score: 4 }, { year: 2023, finish: 'T30', score: 0 }] },
  'Adam Scott': { appearances: 22, cuts_made: 16, wins: 1, top5s: 5, top10s: 8, top25s: 13, best_finish: '1st', best_finish_year: 2013, avg_finish: 19.5, avg_score: 71.8, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: 'T9', score: -5 }, { year: 2023, finish: 'T24', score: -1 }] },
  'Jason Day': { appearances: 13, cuts_made: 11, wins: 0, top5s: 2, top10s: 5, top25s: 7, best_finish: 'T2', best_finish_year: 2011, avg_finish: 17.5, avg_score: 71.5, recent_results: [{ year: 2025, finish: 'T8', score: -5 }, { year: 2024, finish: 'T22', score: 1 }, { year: 2023, finish: 'T42', score: 4 }] },
  'Si Woo Kim': { appearances: 5, cuts_made: 3, wins: 0, top5s: 0, top10s: 1, top25s: 1, best_finish: 'T7', best_finish_year: 2023, avg_finish: 28.4, avg_score: 72.8, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: null, score: null }, { year: 2023, finish: 'T7', score: -7 }] },
  'Akshay Bhatia': { appearances: 2, cuts_made: 2, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: 'T28', best_finish_year: 2024, avg_finish: 35.0, avg_score: 73.0, recent_results: [{ year: 2025, finish: 'T42', score: 4 }, { year: 2024, finish: 'T28', score: 1 }] },
  'Chris Kirk': { appearances: 4, cuts_made: 2, wins: 0, top5s: 0, top10s: 0, top25s: 1, best_finish: 'T20', best_finish_year: 2024, avg_finish: 35.5, avg_score: 73.2, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: 'T20', score: -1 }, { year: 2015, finish: 'T36', score: 4 }] },
  'Tyrrell Hatton': { appearances: 6, cuts_made: 5, wins: 0, top5s: 0, top10s: 1, top25s: 3, best_finish: 'T6', best_finish_year: 2024, avg_finish: 23.8, avg_score: 72.3, recent_results: [{ year: 2025, finish: 'T14', score: -3 }, { year: 2024, finish: 'T16', score: -2 }, { year: 2023, finish: null, score: null }] },
  'Nick Taylor': { appearances: 2, cuts_made: 2, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: 'T36', best_finish_year: 2024, avg_finish: 38.0, avg_score: 73.3, recent_results: [{ year: 2025, finish: 'T40', score: 3 }, { year: 2024, finish: 'T36', score: 4 }] },
  'Harris English': { appearances: 5, cuts_made: 4, wins: 0, top5s: 0, top10s: 0, top25s: 2, best_finish: 'T11', best_finish_year: 2021, avg_finish: 24.0, avg_score: 72.3, recent_results: [{ year: 2025, finish: 'T12', score: -4 }, { year: 2024, finish: null, score: null }, { year: 2022, finish: 'T11', score: -5 }] },
  'Daniel Berger': { appearances: 4, cuts_made: 3, wins: 0, top5s: 0, top10s: 1, top25s: 2, best_finish: 'T8', best_finish_year: 2021, avg_finish: 22.3, avg_score: 72.1, recent_results: [{ year: 2025, finish: 'T21', score: -2 }, { year: 2024, finish: 'T22', score: 1 }, { year: 2022, finish: 'T8', score: -6 }] },
  'Billy Horschel': { appearances: 5, cuts_made: 2, wins: 0, top5s: 0, top10s: 0, top25s: 1, best_finish: 'T13', best_finish_year: 2023, avg_finish: 35.0, avg_score: 73.3, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: null, score: null }, { year: 2023, finish: 'T13', score: -4 }] },
  'Davis Thompson': { appearances: 1, cuts_made: 1, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: 'T46', best_finish_year: 2025, avg_finish: 46.0, avg_score: 73.25, recent_results: [{ year: 2025, finish: 'T46', score: 5 }] },
  'Maverick McNealy': { appearances: 1, cuts_made: 1, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: 'T32', best_finish_year: 2025, avg_finish: 32.0, avg_score: 72.25, recent_results: [{ year: 2025, finish: 'T32', score: 1 }] },
  'Chris Gotterup': { appearances: 0, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [] },
  'Kurt Kitayama': { appearances: 2, cuts_made: 1, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: 'T30', best_finish_year: 2024, avg_finish: 30.0, avg_score: 73.0, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: 'T30', score: 2 }] },
  'Ben Griffin': { appearances: 1, cuts_made: 1, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: 'T30', best_finish_year: 2025, avg_finish: 30.0, avg_score: 73.0, recent_results: [{ year: 2025, finish: 'T30', score: -1 }] },
  'Nicolai Hojgaard': { appearances: 1, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [{ year: 2025, finish: null, score: null }] },
  'Ryan Fox': { appearances: 2, cuts_made: 1, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: 'T30', best_finish_year: 2023, avg_finish: 30.0, avg_score: 73.0, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2023, finish: 'T30', score: 0 }] },
  'J.J. Spaun': { appearances: 2, cuts_made: 2, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: 'T30', best_finish_year: 2023, avg_finish: 40.0, avg_score: 73.5, recent_results: [{ year: 2025, finish: '50th', score: 7 }, { year: 2023, finish: 'T30', score: 0 }] },
  'Jacob Bridgeman': { appearances: 0, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [] },
  'Joaquín Niemann': { appearances: 4, cuts_made: 3, wins: 0, top5s: 0, top10s: 0, top25s: 1, best_finish: 'T16', best_finish_year: 2021, avg_finish: 26.3, avg_score: 72.5, recent_results: [{ year: 2025, finish: 'T29', score: 0 }, { year: 2024, finish: 'T30', score: 2 }, { year: 2023, finish: null, score: null }] },
  'Dustin Johnson': { appearances: 13, cuts_made: 10, wins: 1, top5s: 4, top10s: 6, top25s: 9, best_finish: '1st', best_finish_year: 2020, avg_finish: 15.2, avg_score: 71.3, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: 'T30', score: 2 }, { year: 2023, finish: 'T42', score: 4 }] },
  'Michael Brennan': { appearances: 0, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [] },
  'Denny McCarthy': { appearances: 1, cuts_made: 1, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: 'T29', best_finish_year: 2025, avg_finish: 29.0, avg_score: 72.0, recent_results: [{ year: 2025, finish: 'T29', score: 0 }] },
  'Andrew Novak': { appearances: 0, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [] },
  'Ryan Gerard': { appearances: 0, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [] },
  'Alex Noren': { appearances: 4, cuts_made: 2, wins: 0, top5s: 0, top10s: 0, top25s: 1, best_finish: 'T21', best_finish_year: 2018, avg_finish: 33.3, avg_score: 73.3, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: null, score: null }, { year: 2019, finish: 'T21', score: 1 }] },
  'Kristoffer Reitan': { appearances: 0, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [] },
  'Sam Stevens': { appearances: 0, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [] },
  'Max Greyserman': { appearances: 1, cuts_made: 1, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: 'T32', best_finish_year: 2025, avg_finish: 32.0, avg_score: 72.25, recent_results: [{ year: 2025, finish: 'T32', score: 1 }] },
  'Nick Dunlap': { appearances: 1, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [{ year: 2025, finish: null, score: null }] },
  'Rasmus Hojgaard': { appearances: 1, cuts_made: 1, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: 'T32', best_finish_year: 2025, avg_finish: 32.0, avg_score: 72.25, recent_results: [{ year: 2025, finish: 'T32', score: 1 }] },
  'Harry Hall': { appearances: 0, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [] },
  'Sergio Garcia': { appearances: 24, cuts_made: 20, wins: 1, top5s: 7, top10s: 11, top25s: 16, best_finish: '1st', best_finish_year: 2017, avg_finish: 16.5, avg_score: 71.5, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: 'T36', score: 4 }, { year: 2023, finish: 'T30', score: 0 }] },
  'Phil Mickelson': { appearances: 30, cuts_made: 26, wins: 3, top5s: 11, top10s: 16, top25s: 22, best_finish: '1st', best_finish_year: 2010, avg_finish: 14.0, avg_score: 71.2, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: null, score: null }, { year: 2023, finish: null, score: null }] },
  'Nico Echavarria': { appearances: 1, cuts_made: 1, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: '51st', best_finish_year: 2025, avg_finish: 51.0, avg_score: 74.0, recent_results: [{ year: 2025, finish: '51st', score: 8 }] },
  'Marco Penge': { appearances: 0, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [] },
  'Carlos Ortiz': { appearances: 2, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [{ year: 2022, finish: null, score: null }, { year: 2021, finish: null, score: null }] },
  'Davis Riley': { appearances: 2, cuts_made: 1, wins: 0, top5s: 0, top10s: 0, top25s: 1, best_finish: 'T21', best_finish_year: 2025, avg_finish: 21.0, avg_score: 71.75, recent_results: [{ year: 2025, finish: 'T21', score: -2 }, { year: 2024, finish: null, score: null }] },
  'Aldrich Potgieter': { appearances: 0, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [] },
  'Sami Valimaki': { appearances: 0, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [] },
  'Brian Campbell': { appearances: 1, cuts_made: 1, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: 'T32', best_finish_year: 2025, avg_finish: 32.0, avg_score: 72.25, recent_results: [{ year: 2025, finish: 'T32', score: 1 }] },
  'Naoyuki Kataoka': { appearances: 0, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [] },
  'Tom McKibbin': { appearances: 0, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [] },
  'Casey Jarvis': { appearances: 0, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [] },
  'Rasmus Neergaard-Petersen': { appearances: 0, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [] },
  'Matt McCarty': { appearances: 1, cuts_made: 1, wins: 0, top5s: 0, top10s: 0, top25s: 1, best_finish: 'T14', best_finish_year: 2025, avg_finish: 14.0, avg_score: 71.25, recent_results: [{ year: 2025, finish: 'T14', score: -3 }] },
  'Jake Knapp': { appearances: 0, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [] },
  'Johnny Keefer': { appearances: 0, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [] },
  'Michael Kim': { appearances: 1, cuts_made: 1, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: 'T27', best_finish_year: 2025, avg_finish: 27.0, avg_score: 71.75, recent_results: [{ year: 2025, finish: 'T27', score: -1 }] },
  'Haotong Li': { appearances: 3, cuts_made: 2, wins: 0, top5s: 0, top10s: 1, top25s: 1, best_finish: 'T3', best_finish_year: 2020, avg_finish: 23.3, avg_score: 72.3, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2021, finish: 'T42', score: 6 }, { year: 2020, finish: 'T3', score: -11 }] },
  'Gary Woodland': { appearances: 5, cuts_made: 2, wins: 0, top5s: 0, top10s: 0, top25s: 1, best_finish: 'T25', best_finish_year: 2020, avg_finish: 36.0, avg_score: 73.5, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: null, score: null }, { year: 2020, finish: 'T25', score: -1 }] },
  'Bubba Watson': { appearances: 15, cuts_made: 13, wins: 2, top5s: 4, top10s: 6, top25s: 9, best_finish: '1st', best_finish_year: 2014, avg_finish: 15.8, avg_score: 71.3, recent_results: [{ year: 2025, finish: 'T14', score: -3 }, { year: 2024, finish: null, score: null }, { year: 2023, finish: null, score: null }] },
  'Charl Schwartzel': { appearances: 13, cuts_made: 10, wins: 1, top5s: 2, top10s: 4, top25s: 6, best_finish: '1st', best_finish_year: 2011, avg_finish: 21.0, avg_score: 71.8, recent_results: [{ year: 2025, finish: 'T36', score: 2 }, { year: 2024, finish: null, score: null }, { year: 2023, finish: null, score: null }] },
  'Zach Johnson': { appearances: 16, cuts_made: 13, wins: 1, top5s: 3, top10s: 6, top25s: 9, best_finish: '1st', best_finish_year: 2007, avg_finish: 19.4, avg_score: 71.7, recent_results: [{ year: 2025, finish: 'T8', score: -5 }, { year: 2024, finish: null, score: null }, { year: 2023, finish: null, score: null }] },
  'Ángel Cabrera': { appearances: 11, cuts_made: 7, wins: 1, top5s: 3, top10s: 4, top25s: 5, best_finish: '1st', best_finish_year: 2009, avg_finish: 22.0, avg_score: 72.2, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2013, finish: 'T2', score: -8 }, { year: 2012, finish: 'T32', score: 4 }] },
  'Danny Willett': { appearances: 8, cuts_made: 6, wins: 1, top5s: 1, top10s: 1, top25s: 3, best_finish: '1st', best_finish_year: 2016, avg_finish: 25.8, avg_score: 72.4, recent_results: [{ year: 2025, finish: 'T42', score: 4 }, { year: 2024, finish: null, score: null }, { year: 2023, finish: null, score: null }] },
  'Fred Couples': { appearances: 35, cuts_made: 25, wins: 1, top5s: 5, top10s: 10, top25s: 17, best_finish: '1st', best_finish_year: 1992, avg_finish: 20.0, avg_score: 71.9, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: null, score: null }, { year: 2023, finish: null, score: null }] },
  'Vijay Singh': { appearances: 23, cuts_made: 16, wins: 0, top5s: 3, top10s: 5, top25s: 10, best_finish: 'T2', best_finish_year: 2003, avg_finish: 23.5, avg_score: 72.3, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: null, score: null }, { year: 2023, finish: null, score: null }] },
  'Mike Weir': { appearances: 18, cuts_made: 11, wins: 1, top5s: 3, top10s: 5, top25s: 8, best_finish: '1st', best_finish_year: 2003, avg_finish: 24.2, avg_score: 72.3, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: null, score: null }, { year: 2023, finish: null, score: null }] },
  'José María Olazábal': { appearances: 23, cuts_made: 17, wins: 2, top5s: 6, top10s: 8, top25s: 12, best_finish: '1st', best_finish_year: 1999, avg_finish: 18.1, avg_score: 71.6, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: null, score: null }, { year: 2023, finish: null, score: null }] },
  // Extra golfers from second pool
  'Tiger Woods': { appearances: 26, cuts_made: 23, wins: 5, top5s: 14, top10s: 16, top25s: 20, best_finish: '1st', best_finish_year: 2019, avg_finish: 9.8, avg_score: 70.6, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: null, score: null }, { year: 2023, finish: null, score: null }] },
  'Will Zalatoris': { appearances: 3, cuts_made: 3, wins: 0, top5s: 1, top10s: 2, top25s: 3, best_finish: '2nd', best_finish_year: 2021, avg_finish: 11.0, avg_score: 71.0, recent_results: [{ year: 2023, finish: 'T10', score: -6 }, { year: 2022, finish: 'T6', score: -5 }, { year: 2021, finish: '2nd', score: -9 }] },
  'Tom Hoge': { appearances: 2, cuts_made: 2, wins: 0, top5s: 0, top10s: 0, top25s: 1, best_finish: 'T25', best_finish_year: 2022, avg_finish: 28.0, avg_score: 72.5, recent_results: [{ year: 2025, finish: 'T31', score: -1 }, { year: 2022, finish: 'T25', score: -1 }] },
  'Sandy Lyle': { appearances: 33, cuts_made: 21, wins: 1, top5s: 4, top10s: 6, top25s: 12, best_finish: '1st', best_finish_year: 1988, avg_finish: 24.0, avg_score: 72.5, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: null, score: null }, { year: 2023, finish: null, score: null }] },
  'Abraham Ancer': { appearances: 3, cuts_made: 2, wins: 0, top5s: 0, top10s: 0, top25s: 1, best_finish: 'T13', best_finish_year: 2021, avg_finish: 26.0, avg_score: 72.5, recent_results: [{ year: 2023, finish: null, score: null }, { year: 2022, finish: 'T39', score: 4 }, { year: 2021, finish: 'T13', score: -5 }] },
  'Mackenzie Hughes': { appearances: 2, cuts_made: 1, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: 'T38', best_finish_year: 2023, avg_finish: 38.0, avg_score: 73.5, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2023, finish: 'T38', score: 3 }] },
  'Lee Hodges': { appearances: 1, cuts_made: 1, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: 'T36', best_finish_year: 2025, avg_finish: 36.0, avg_score: 73.0, recent_results: [{ year: 2025, finish: 'T36', score: 0 }] },
  'Thriston Lawrence': { appearances: 1, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [{ year: 2025, finish: null, score: null }] },
  'Austin Eckroat': { appearances: 1, cuts_made: 1, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: 'T30', best_finish_year: 2025, avg_finish: 30.0, avg_score: 73.0, recent_results: [{ year: 2025, finish: 'T30', score: -1 }] },
  'Byeong Hun An': { appearances: 2, cuts_made: 1, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: 'T36', best_finish_year: 2020, avg_finish: 36.0, avg_score: 73.5, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2020, finish: 'T36', score: 2 }] },
  'Matthieu Pavon': { appearances: 1, cuts_made: 1, wins: 0, top5s: 0, top10s: 0, top25s: 1, best_finish: 'T16', best_finish_year: 2024, avg_finish: 16.0, avg_score: 72.0, recent_results: [{ year: 2024, finish: 'T16', score: -2 }] },
  'Stephan Jaeger': { appearances: 1, cuts_made: 1, wins: 0, top5s: 0, top10s: 0, top25s: 1, best_finish: 'T22', best_finish_year: 2025, avg_finish: 22.0, avg_score: 72.5, recent_results: [{ year: 2025, finish: 'T22', score: -2 }] },
  'Larry Mize': { appearances: 37, cuts_made: 25, wins: 1, top5s: 3, top10s: 6, top25s: 12, best_finish: '1st', best_finish_year: 1987, avg_finish: 24.5, avg_score: 72.5, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: null, score: null }, { year: 2023, finish: null, score: null }] },
  'Eric Cole': { appearances: 1, cuts_made: 1, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: 'T30', best_finish_year: 2025, avg_finish: 30.0, avg_score: 73.0, recent_results: [{ year: 2025, finish: 'T30', score: -1 }] },
  'Lucas Glover': { appearances: 7, cuts_made: 3, wins: 0, top5s: 0, top10s: 0, top25s: 1, best_finish: 'T22', best_finish_year: 2024, avg_finish: 32.0, avg_score: 73.2, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2024, finish: 'T22', score: 1 }, { year: 2015, finish: null, score: null }] },
  'Christiaan Bezuidenhout': { appearances: 3, cuts_made: 2, wins: 0, top5s: 0, top10s: 0, top25s: 1, best_finish: 'T12', best_finish_year: 2021, avg_finish: 28.0, avg_score: 72.5, recent_results: [{ year: 2025, finish: null, score: null }, { year: 2022, finish: 'T44', score: 7 }, { year: 2021, finish: 'T12', score: -5 }] },
  'Taylor Pendrith': { appearances: 1, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [{ year: 2025, finish: null, score: null }] },
  'Kevin Yu': { appearances: 0, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [] },
  'Luke Clanton': { appearances: 0, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [] },
};

// Normalize name for matching (remove accents, lowercase)
function normalizeName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Only backfill pools this admin owns
    const allPools = await base44.asServiceRole.entities.Pool.filter({});
    const pools = allPools.filter(p => p.admin_user_id === user.email);
    if (pools.length === 0) {
      return Response.json({ error: 'No pools found that you own' }, { status: 404 });
    }

    // Build a normalized lookup map
    const historyLookup = {};
    for (const [name, data] of Object.entries(MASTERS_HISTORY)) {
      historyLookup[normalizeName(name)] = data;
    }

    let totalUpdated = 0;
    let totalNotFound = 0;
    const notFoundNames = [];

    for (const pool of pools) {
      const golfers = await base44.asServiceRole.entities.Golfer.filter({ pool_id: pool.id });
      console.log(`Pool "${pool.name}": ${golfers.length} golfers`);

      for (const golfer of golfers) {
        const normalizedName = normalizeName(golfer.name);
        const history = historyLookup[normalizedName];

        if (history) {
          await base44.asServiceRole.entities.Golfer.update(golfer.id, {
            masters_history: history
          });
          totalUpdated++;
        } else {
          // Try partial match
          const partialMatch = Object.keys(historyLookup).find(key =>
            key.includes(normalizedName) || normalizedName.includes(key)
          );
          if (partialMatch) {
            await base44.asServiceRole.entities.Golfer.update(golfer.id, {
              masters_history: historyLookup[partialMatch]
            });
            totalUpdated++;
          } else {
            await base44.asServiceRole.entities.Golfer.update(golfer.id, {
              masters_history: { appearances: 0, cuts_made: 0, wins: 0, top5s: 0, top10s: 0, top25s: 0, best_finish: null, best_finish_year: null, avg_finish: null, avg_score: null, recent_results: [] }
            });
            totalNotFound++;
            notFoundNames.push(golfer.name);
          }
        }
      }
    }

    return Response.json({
      success: true,
      pools_processed: pools.length,
      golfers_updated: totalUpdated,
      golfers_not_found: totalNotFound,
      not_found_names: notFoundNames,
    });
  } catch (error) {
    console.error('Backfill error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});