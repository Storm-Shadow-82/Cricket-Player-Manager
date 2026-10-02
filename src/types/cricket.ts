export type ActiveTab = 
  | 'matchday-live-scoring'
  | 'scorecard-rapid-entry'
  | 'playing-xi-workbench'
  | 'squad-database-dossier'
  | 'match-history-archives'
  | 'tournament-telemetry';

export type PitchType = 'dry' | 'green' | 'flat' | 'damp';

export type MatchCategory = 'Tournament' | 'Practice' | 'Friendly' | 'Bilateral';

export interface CoachProfile {
  name: string;
  role: string;
  team: string;
  avatarUrl: string;
}

export interface BatterScore {
  id: string;
  number: number;
  name: string;
  hand: 'RHB' | 'LHB';
  isWk?: boolean;
  isCaptain?: boolean;
  isPotm?: boolean;
  dismissal: string;
  isNotOut: boolean;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  sr: number;
  boundaryPct: number;
  dotPct: number;
}

export interface BowlerScore {
  id: string;
  name: string;
  style: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
  dots: number;
  quotaMax: number;
  state: 'Quota Maxed' | 'Available' | 'Exceeded';
  colorTag: string;
}

export interface PastMatchLog {
  id: string;
  matchId?: string;
  opponent: string;
  date: string;
  category: MatchCategory;
  runsScored?: number;
  ballsFaced?: number;
  fours?: number;
  sixes?: number;
  isNotOut?: boolean;
  oversBowled?: number;
  maidens?: number;
  runsConceded?: number;
  wicketsTaken?: number;
}

export interface Player {
  id: string;
  jerseyNum: number;
  name: string;
  photoUrl: string;
  role: 'BATTER' | 'WK-BAT' | 'ALL-RND' | 'PACE SPEC' | 'SPIN SPEC';
  hand: 'RHB' | 'LHB';
  bowlingStyle?: string;
  country: string;
  status: 'active' | 'bench' | 'injured' | 'guest';
  isOverseas: boolean;
  impactScore: number;
  matches: number;
  runs: number;
  highScore: string;
  avg: number;
  sr: number;
  fifties: number;
  hundreds: number;
  overs: number;
  wickets: number;
  bbi: string;
  econ: number;
  catches: number;
  stumpings: number;
  recentForm: string;
  // Dossier details
  powerplaySr: number;
  middleSr: number;
  deathSr: number;
  drySpinAvg: number;
  drySpinSr: number;
  greenPaceAvg: number;
  greenPaceSr: number;
  flatBatAvg: number;
  flatBatSr: number;
  vulnerabilities?: {
    vsOffSpin?: { label: string; avg: number; sr: number; status: 'dominant' | 'stable' | 'vulnerable' };
    vsLeftArmOrthodox?: { label: string; avg: number; sr: number; status: 'dominant' | 'stable' | 'vulnerable' };
    vsHighPaceShort?: { label: string; avg: number; sr: number; status: 'dominant' | 'stable' | 'vulnerable' };
  };
  pastLogs?: PastMatchLog[];
}

export interface LineupSlot {
  slotNum: number;
  player: Player;
  assignedOvers: number;
  note: string;
}

export interface MatchSummary {
  id: string;
  round: string;
  tournament: string;
  category: MatchCategory;
  date: string;
  venue: string;
  pitchProfile: string;
  team1: string;
  team1Score: string;
  team1Overs: string;
  team1Crr: number;
  team2: string;
  team2Score: string;
  team2Overs: string;
  team2Crr: number;
  toss: string;
  dlsPar: number;
  maxBowlerQuota: number;
  result: string;
  potm: string;
  chiefImpact: string;
  tacticalNotes?: string;
}

export interface FallOfWicketItem {
  id: string;
  wicketNum: number;
  score: string;
  batterName: string;
  over: string;
}

export interface ArchivedMatchRecord {
  id: string;
  gameLabel: string;
  match: MatchSummary;
  batters: BatterScore[];
  bowlers: BowlerScore[];
  fowList: FallOfWicketItem[];
  createdAt: string;
}

export interface SyncedRecordVaultItem {
  id: string;
  gameLabel: string;
  match: MatchSummary;
  batters: BatterScore[];
  bowlers: BowlerScore[];
  syncedAt: string;
  isDeletedFromHistory?: boolean;
  fowList?: FallOfWicketItem[];
}
