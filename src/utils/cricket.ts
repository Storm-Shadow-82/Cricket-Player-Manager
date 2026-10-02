import { Player, PastMatchLog } from '../types/cricket';

/**
 * Dynamic Impact Score Calculator
 * Calculates player impact rating (10 - 99) based on lifetime batting and bowling metrics.
 * Baseline default is 50.
 */
export const normalizePlayerName = (rawName: string): string => {
  if (!rawName) return '';
  return rawName
    .toLowerCase()
    .replace(/\(c\)/g, '')
    .replace(/\(wk\)/g, '')
    .replace(/\(vc\)/g, '')
    .replace(/\bcapt\b/gi, '')
    .replace(/\bsir\b/gi, '')
    .replace(/\bmajor\b/gi, '')
    .replace(/\bmaj\b/gi, '')
    .replace(/\bofficer\d*\b/gi, '')
    .replace(/\bmd\b\.?/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
};

export const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = normalizePlayerName(str1);
  const s2 = normalizePlayerName(str2);

  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;

  const t1 = s1.split(/\s+/).filter((t) => t.length >= 2);
  const t2 = s2.split(/\s+/).filter((t) => t.length >= 2);

  let matches = 0;
  t1.forEach((w1) => {
    if (t2.some((w2) => w1 === w2 || (w1.length >= 3 && w2.length >= 3 && (w1.includes(w2) || w2.includes(w1))))) {
      matches++;
    }
  });

  if (matches > 0) {
    return Math.min(0.9, (matches / Math.max(t1.length, t2.length)) + 0.3);
  }

  return 0;
};

export const findMatchingSquadPlayer = (
  extractedName: string,
  pool: Player[]
): { player: Player; confidence: number } | undefined => {
  if (!extractedName || extractedName.startsWith('Batter ') || extractedName.startsWith('Bowler ')) return undefined;

  const cleanExtracted = extractedName.toLowerCase().trim();
  const normExtracted = normalizePlayerName(extractedName);

  if (!normExtracted) return undefined;

  // 1. Exact string match (100% confidence)
  let matched = pool.find((p) => p.name.toLowerCase().trim() === cleanExtracted);
  if (matched) return { player: matched, confidence: 1.0 };

  // 2. Normalized string match (95% confidence)
  matched = pool.find((p) => normalizePlayerName(p.name) === normExtracted);
  if (matched) return { player: matched, confidence: 0.95 };

  // 3. Substring match (85% confidence)
  matched = pool.find((p) => {
    const normSquad = normalizePlayerName(p.name);
    if (!normSquad || !normExtracted) return false;
    return normSquad.includes(normExtracted) || normExtracted.includes(normSquad);
  });
  if (matched) return { player: matched, confidence: 0.85 };

  // 4. Token & Similarity overlap match
  let bestMatch: Player | undefined;
  let bestScore = 0;

  pool.forEach((p) => {
    const sim = calculateSimilarity(extractedName, p.name);
    if (sim > bestScore) {
      bestScore = sim;
      bestMatch = p;
    }
  });

  if (bestMatch && bestScore >= 0.5) {
    return { player: bestMatch, confidence: Number(bestScore.toFixed(2)) };
  }

  return undefined;
};
export const computeDynamicImpactScore = (p: Partial<Player>): number => {
  const matches = p.matches || 0;
  if (matches <= 0) return 50; // Default baseline for new players

  let score = 50;

  // Batting Impact Component
  const avg = p.avg || 0;
  const sr = p.sr || 0;
  const fifties = p.fifties || 0;
  const hundreds = p.hundreds || 0;

  score += Math.min(22, avg * 0.45);
  if (sr > 100) {
    score += Math.min(15, (sr - 100) * 0.15);
  } else if (sr > 0 && sr < 100) {
    score -= Math.min(10, (100 - sr) * 0.1);
  }
  score += fifties * 2.5 + hundreds * 6;

  // Bowling Impact Component
  const wickets = p.wickets || 0;
  const econ = p.econ || 0;

  score += Math.min(20, wickets * 1.5);
  if (econ > 0 && econ < 7.5) {
    score += (7.5 - econ) * 2;
  } else if (econ > 7.5) {
    score -= (econ - 7.5) * 1.2;
  }

  return Math.min(99, Math.max(10, Math.round(score)));
};

/**
 * Recalculates player statistics from their pastLogs array.
 * Ensures idempotent updates and clean cascade deletion when match data is removed.
 */
export const recalculatePlayerStatsFromLogs = (
  player: Player,
  logs: PastMatchLog[]
): Player => {
  if (!logs || logs.length === 0) {
    return {
      ...player,
      matches: 0,
      runs: 0,
      avg: 0,
      sr: 0,
      fifties: 0,
      hundreds: 0,
      highScore: '0',
      overs: 0,
      wickets: 0,
      econ: 0,
      pastLogs: [],
      impactScore: 50,
    };
  }

  let totalMatches = logs.length;
  let totalRuns = 0;
  let totalBalls = 0;
  let fifties = 0;
  let hundreds = 0;
  let maxRunsNum = 0;
  let maxRunsNotOut = false;

  let totalOvers = 0;
  let totalWickets = 0;
  let totalRunsConceded = 0;

  logs.forEach((log) => {
    if (log.runsScored !== undefined && log.runsScored >= 0) {
      totalRuns += log.runsScored;
      totalBalls += log.ballsFaced || 0;

      if (log.runsScored >= 100) hundreds += 1;
      else if (log.runsScored >= 50) fifties += 1;

      if (log.runsScored > maxRunsNum) {
        maxRunsNum = log.runsScored;
        maxRunsNotOut = !!log.isNotOut;
      }
    }

    if (log.oversBowled !== undefined && log.oversBowled > 0) {
      totalOvers += log.oversBowled;
      totalWickets += log.wicketsTaken || 0;
      totalRunsConceded += log.runsConceded || 0;
    }
  });

  const avg = totalMatches > 0 ? Number((totalRuns / totalMatches).toFixed(1)) : 0;
  const sr = totalBalls > 0 ? Number(((totalRuns / totalBalls) * 100).toFixed(1)) : 0;
  const roundedOvers = Number(totalOvers.toFixed(1));
  const econ = roundedOvers > 0 ? Number((totalRunsConceded / roundedOvers).toFixed(2)) : 0;
  const highScore = totalRuns > 0 ? `${maxRunsNum}${maxRunsNotOut ? '*' : ''}` : '0';

  const updatedPlayer: Player = {
    ...player,
    matches: totalMatches,
    runs: totalRuns,
    avg,
    sr,
    fifties,
    hundreds,
    highScore,
    overs: roundedOvers,
    wickets: totalWickets,
    econ,
    pastLogs: logs,
    impactScore: 50,
  };

  updatedPlayer.impactScore = computeDynamicImpactScore(updatedPlayer);
  return updatedPlayer;
};
