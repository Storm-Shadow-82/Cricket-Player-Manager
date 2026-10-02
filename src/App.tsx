import React, { useState } from 'react';
import { ActiveTab, MatchSummary, BatterScore, BowlerScore, Player, LineupSlot, CoachProfile, MatchCategory, PastMatchLog, ArchivedMatchRecord, FallOfWicketItem, SyncedRecordVaultItem } from './types/cricket';
import {
  FRESH_MATCH,
  FRESH_BATTERS,
  FRESH_BOWLERS,
  CURRENT_MATCH,
  INITIAL_BATTERS,
  INITIAL_BOWLERS,
  PLAYERS_POOL,
  COACH_AVATAR
} from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { NewMatchModal } from './components/NewMatchModal';
import { UserSettingsModal } from './components/UserSettingsModal';
import { ImportScorecardModal } from './components/ImportScorecardModal';
import { LoginModal } from './components/LoginModal';
import { DataBackupModal } from './components/DataBackupModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { loadStateFromStorage, saveStateToStorage, STORAGE_KEYS } from './utils/storage';
import { computeDynamicImpactScore, recalculatePlayerStatsFromLogs } from './utils/cricket';

import { ScorecardView } from './views/ScorecardView';
import { MatchdayLiveView } from './views/MatchdayLiveView';
import { WorkbenchView } from './views/WorkbenchView';
import { SquadDossierView } from './views/SquadDossierView';
import { MatchReportView } from './views/MatchReportView';
import { TelemetryView } from './views/TelemetryView';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('scorecard-rapid-entry');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Setup Mode state (defaults to true for a clean first-time setup experience)
  const [isFreshSetup, setIsFreshSetup] = useState<boolean>(() =>
    loadStateFromStorage(STORAGE_KEYS.IS_FRESH_SETUP, true)
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Modals
  const [isNewMatchOpen, setIsNewMatchOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [isImportScorecardOpen, setIsImportScorecardOpen] = useState(false);
  const [isDataBackupOpen, setIsDataBackupOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() =>
    loadStateFromStorage(STORAGE_KEYS.IS_LOGGED_IN, true)
  );
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleLogout = () => {
    setIsLoggedIn(false);
    showToast('Logged out of Coach Account. Click "Log In" anytime to re-enter.');
  };

  const handleLogin = (profile: CoachProfile) => {
    setCoachProfile(profile);
    setIsLoggedIn(true);
    setIsLoginOpen(false);
    showToast(`Welcome back, ${profile.name}! Logged in as ${profile.role} (${profile.team}).`);
  };

  // Coach Profile State
  const [coachProfile, setCoachProfile] = useState<CoachProfile>(() =>
    loadStateFromStorage(STORAGE_KEYS.COACH_PROFILE, {
      name: 'Head Coach / Analyst',
      role: 'Head Analyst',
      team: 'My Team CC',
      avatarUrl: COACH_AVATAR,
    })
  );

  // App Match & Scorecard State (Loaded from localStorage for offline persistence)
  const [matchData, setMatchData] = useState<MatchSummary>(() =>
    loadStateFromStorage(STORAGE_KEYS.MATCH_DATA, FRESH_MATCH)
  );
  const [batters, setBatters] = useState<BatterScore[]>(() =>
    loadStateFromStorage(STORAGE_KEYS.BATTERS, FRESH_BATTERS)
  );
  const [bowlers, setBowlers] = useState<BowlerScore[]>(() =>
    loadStateFromStorage(STORAGE_KEYS.BOWLERS, FRESH_BOWLERS)
  );
  const [playersPool, setPlayersPool] = useState<Player[]>(() =>
    loadStateFromStorage(STORAGE_KEYS.PLAYERS_POOL, PLAYERS_POOL)
  );

  // Initial Lineup starters
  const [starters, setStarters] = useState<LineupSlot[]>(() =>
    loadStateFromStorage(STORAGE_KEYS.STARTERS, [])
  );

  // Archived Games Timeline (Game 1, Game 2, Game 3, ...)
  const [archivedMatches, setArchivedMatches] = useState<ArchivedMatchRecord[]>(() =>
    loadStateFromStorage(STORAGE_KEYS.ARCHIVED_MATCHES, [
      {
        id: 'game-1',
        gameLabel: 'Game 1',
        match: CURRENT_MATCH,
        batters: INITIAL_BATTERS,
        bowlers: INITIAL_BOWLERS,
        fowList: [
          { id: 'fow-1', wicketNum: 1, score: '24/1', batterName: 'Aaron Finch', over: '3.2' },
          { id: 'fow-2', wicketNum: 2, score: '68/2', batterName: 'Devdutt Padikkal', over: '8.4' },
          { id: 'fow-3', wicketNum: 3, score: '124/3', batterName: 'Steve Smith', over: '15.1' },
        ],
        createdAt: '2026-09-20',
      },
    ])
  );
  const [activeGameId, setActiveGameId] = useState<string>(() =>
    loadStateFromStorage(STORAGE_KEYS.ACTIVE_GAME_ID, 'game-1')
  );

  // All Records Vault (Master System Ledger for Recovery)
  const [allRecordsVault, setAllRecordsVault] = useState<SyncedRecordVaultItem[]>(() =>
    loadStateFromStorage(STORAGE_KEYS.ALL_RECORDS_VAULT, [
      {
        id: 'game-1',
        gameLabel: 'Game 1',
        match: CURRENT_MATCH,
        batters: INITIAL_BATTERS,
        bowlers: INITIAL_BOWLERS,
        syncedAt: '2026-09-20 12:00',
        isDeletedFromHistory: false,
        fowList: [
          { id: 'fow-1', wicketNum: 1, score: '24/1', batterName: 'Aaron Finch', over: '3.2' },
          { id: 'fow-2', wicketNum: 2, score: '68/2', batterName: 'Devdutt Padikkal', over: '8.4' },
          { id: 'fow-3', wicketNum: 3, score: '124/3', batterName: 'Steve Smith', over: '15.1' },
        ],
      },
    ])
  );

  // Auto-Save Effect Hooks for Offline PWA Storage
  React.useEffect(() => {
    saveStateToStorage(STORAGE_KEYS.MATCH_DATA, matchData);
  }, [matchData]);

  React.useEffect(() => {
    saveStateToStorage(STORAGE_KEYS.BATTERS, batters);
  }, [batters]);

  React.useEffect(() => {
    saveStateToStorage(STORAGE_KEYS.BOWLERS, bowlers);
  }, [bowlers]);

  React.useEffect(() => {
    saveStateToStorage(STORAGE_KEYS.ARCHIVED_MATCHES, archivedMatches);
  }, [archivedMatches]);

  React.useEffect(() => {
    saveStateToStorage(STORAGE_KEYS.PLAYERS_POOL, playersPool);
  }, [playersPool]);

  React.useEffect(() => {
    saveStateToStorage(STORAGE_KEYS.STARTERS, starters);
  }, [starters]);

  React.useEffect(() => {
    saveStateToStorage(STORAGE_KEYS.COACH_PROFILE, coachProfile);
  }, [coachProfile]);

  React.useEffect(() => {
    saveStateToStorage(STORAGE_KEYS.IS_FRESH_SETUP, isFreshSetup);
  }, [isFreshSetup]);

  React.useEffect(() => {
    saveStateToStorage(STORAGE_KEYS.ACTIVE_GAME_ID, activeGameId);
  }, [activeGameId]);

  React.useEffect(() => {
    saveStateToStorage(STORAGE_KEYS.IS_LOGGED_IN, isLoggedIn);
  }, [isLoggedIn]);

  React.useEffect(() => {
    saveStateToStorage(STORAGE_KEYS.ALL_RECORDS_VAULT, allRecordsVault);
  }, [allRecordsVault]);

  // Save/Update record in All Records Vault
  const saveToVault = (
    matchRecord: Partial<MatchSummary>,
    bList: BatterScore[],
    bwList: BowlerScore[],
    fows?: FallOfWicketItem[],
    label?: string
  ) => {
    const recordId = matchRecord.id || `M-RECORD-${Date.now().toString().slice(-4)}`;
    const vaultItem: SyncedRecordVaultItem = {
      id: recordId,
      gameLabel: label || matchRecord.round || `Game Record ${allRecordsVault.length + 1}`,
      match: matchRecord as MatchSummary,
      batters: bList,
      bowlers: bwList,
      syncedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      isDeletedFromHistory: false,
      fowList: fows,
    };

    setAllRecordsVault((prev) => {
      const idx = prev.findIndex((v) => v.id === recordId);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = vaultItem;
        return updated;
      }
      return [vaultItem, ...prev];
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Switch between Fresh Initial Setup and Full Demo Match
  const handleLoadDemoData = () => {
    setIsFreshSetup(false);
    setMatchData(CURRENT_MATCH);
    setBatters(INITIAL_BATTERS);
    setBowlers(INITIAL_BOWLERS);
    setCoachProfile({
      name: 'Coach Vance Miller',
      role: 'Head Analyst',
      team: 'Titans CC',
      avatarUrl: COACH_AVATAR,
    });
    showToast('Loaded full sample demo matchday dataset (Titans CC vs Metro Royals)!');
  };

  const handleResetToFreshSetup = () => {
    setIsFreshSetup(true);
    setMatchData(FRESH_MATCH);
    setBatters(FRESH_BATTERS);
    setBowlers(FRESH_BOWLERS);
    setStarters([]);
    showToast('Reset to Clean Setup Mode — ready for your initial match!');
  };

  const handleAddNewPlayerToPool = (newPlayer: Player) => {
    setPlayersPool((prev) => [newPlayer, ...prev]);
    showToast(`Added ${newPlayer.name} (#${newPlayer.jerseyNum}) to Squad Pool!`);
  };

  const handleClearScorecard = () => {
    setBatters((prev) =>
      prev.map((b) => ({
        ...b,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        sr: 0,
        dismissal: 'Yet to Bat',
        isNotOut: true,
      }))
    );
    setBowlers((prev) =>
      prev.map((bw) => ({
        ...bw,
        overs: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
        economy: 0,
        state: 'Available',
      }))
    );
    showToast('Cleared active match scorecard! Scores reset to zero.');
  };

  const handleDeleteCompleteMatch = () => {
    setIsFreshSetup(true);
    setMatchData(FRESH_MATCH);
    setBatters(FRESH_BATTERS);
    setBowlers(FRESH_BOWLERS);
    setStarters([]);
    showToast('Removed complete match data! Workspace reset to clean setup state.');
    setActiveTab('scorecard-rapid-entry');
  };

  // Auto-sync match scorecard figures into player squad dossiers & database
  const syncMatchToSquadDatabase = (
    battersList: BatterScore[],
    bowlersList: BowlerScore[],
    matchInfo: Partial<MatchSummary>
  ) => {
    const matchIdKey = matchInfo.id || `M-${Date.now().toString().slice(-4)}`;
    const opponentName = matchInfo.team2 || 'Opponent CC';
    const matchDate = matchInfo.date || new Date().toISOString().split('T')[0];

    setPlayersPool((prevPool) =>
      prevPool.map((player) => {
        const cleanPlayerName = player.name.toLowerCase().trim();

        // Find if this player batted in the match
        const matchedBatter = battersList.find((b) => {
          if ((b as any).playerId && (b as any).playerId === player.id) return true;
          const cleanBName = b.name.toLowerCase().trim();
          if (cleanBName === cleanPlayerName) return true;
          const bParts = cleanBName.split(' ');
          const pParts = cleanPlayerName.split(' ');
          if (bParts.length > 1 && pParts.length > 1 && bParts[bParts.length - 1] === pParts[pParts.length - 1]) return true;
          return cleanBName.includes(pParts[0]) || cleanPlayerName.includes(bParts[0]);
        });

        // Find if this player bowled in the match
        const matchedBowler = bowlersList.find((bw) => {
          const cleanBwName = bw.name.toLowerCase().trim();
          if (cleanBwName === cleanPlayerName) return true;
          const bwParts = cleanBwName.split(' ');
          const pParts = cleanPlayerName.split(' ');
          if (bwParts.length > 1 && pParts.length > 1 && bwParts[bwParts.length - 1] === pParts[pParts.length - 1]) return true;
          return cleanBwName.includes(pParts[0]) || cleanPlayerName.includes(bwParts[0]);
        });

        // If player didn't participate in this scorecard, leave unchanged
        if (!matchedBatter && !matchedBowler) return player;

        const newMatchLog: PastMatchLog = {
          id: `log-${matchIdKey}-${player.id}`,
          matchId: matchIdKey,
          opponent: opponentName,
          date: matchDate,
          category: matchInfo.category || 'Practice',
          runsScored: matchedBatter ? matchedBatter.runs : undefined,
          ballsFaced: matchedBatter ? matchedBatter.balls : undefined,
          fours: matchedBatter ? matchedBatter.fours : undefined,
          sixes: matchedBatter ? matchedBatter.sixes : undefined,
          isNotOut: matchedBatter ? matchedBatter.isNotOut : undefined,
          oversBowled: matchedBowler ? matchedBowler.overs : undefined,
          maidens: matchedBowler ? matchedBowler.maidens : undefined,
          runsConceded: matchedBowler ? matchedBowler.runs : undefined,
          wicketsTaken: matchedBowler ? matchedBowler.wickets : undefined,
        };

        const existingLogs = player.pastLogs || [];
        const existingIdx = existingLogs.findIndex(
          (log) => log.matchId === matchIdKey || (log.opponent === opponentName && log.date === matchDate)
        );

        let updatedLogs: PastMatchLog[];
        if (existingIdx !== -1) {
          // Replace existing match log (Idempotent update)
          updatedLogs = [...existingLogs];
          updatedLogs[existingIdx] = newMatchLog;
        } else {
          // Prepend new match log
          updatedLogs = [newMatchLog, ...existingLogs];
        }

        const updatedPlayer = recalculatePlayerStatsFromLogs(player, updatedLogs);

        // Keep starter lineup slots synced with updated player statistics
        setStarters((sPrev) =>
          sPrev.map((s) => (s.player.id === player.id ? { ...s, player: updatedPlayer } : s))
        );

        return updatedPlayer;
      })
    );
  };

  const handleFinalizeMatch = () => {
    syncMatchToSquadDatabase(batters, bowlers, matchData);

    const gameNum = archivedMatches.length + 1;
    const gameLabel = `Game ${gameNum}`;

    const newRecord: ArchivedMatchRecord = {
      id: matchData.id || `M-GAME-${gameNum}-${Date.now().toString().slice(-4)}`,
      gameLabel,
      match: matchData,
      batters,
      bowlers,
      fowList: [],
      createdAt: new Date().toISOString().split('T')[0],
    };

    setArchivedMatches((prev) => {
      if (prev.some((m) => m.id === newRecord.id)) {
        return prev.map((m) => (m.id === newRecord.id ? newRecord : m));
      }
      return [newRecord, ...prev];
    });

    saveToVault(matchData, batters, bowlers, [], gameLabel);

    showToast('Match figures finalized! Stats & performance logs auto-synced to Squad Database & Dossiers.');
    setActiveTab('match-history-archives');
  };

  const handleRestoreVaultRecord = (vaultItem: SyncedRecordVaultItem) => {
    setAllRecordsVault((prev) =>
      prev.map((v) => (v.id === vaultItem.id ? { ...v, isDeletedFromHistory: false } : v))
    );

    const newArchived: ArchivedMatchRecord = {
      id: vaultItem.id,
      gameLabel: vaultItem.gameLabel || 'Restored Game',
      match: vaultItem.match,
      batters: vaultItem.batters,
      bowlers: vaultItem.bowlers,
      fowList: vaultItem.fowList || [],
      createdAt: vaultItem.match.date || new Date().toISOString().split('T')[0],
    };

    setArchivedMatches((prev) => {
      const idx = prev.findIndex((m) => m.id === vaultItem.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = newArchived;
        return updated;
      }
      return [newArchived, ...prev];
    });

    syncMatchToSquadDatabase(vaultItem.batters, vaultItem.bowlers, vaultItem.match);
  };

  const handleExportAllRecords = () => {
    const blob = new Blob([JSON.stringify(allRecordsVault, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cric_tactic_all_records_vault_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported All Records Vault JSON backup file!');
  };

  const handleCreateMatchDraft = (data: {
    team1: string;
    opponent: string;
    category: MatchCategory;
    venue: string;
    pitch: string;
    overs: number;
    tacticalNotes: string;
  }) => {
    const newMatchSheet: MatchSummary = {
      id: `M-${Date.now().toString().slice(-4)}`,
      round: data.category === 'Practice' ? 'Practice Match' : `${data.category} Match`,
      tournament: data.category === 'Tournament' ? 'Premier 25-Overs Cup 2025' : `${data.category} Series`,
      category: data.category,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      venue: data.venue,
      pitchProfile: data.pitch,
      team1: data.team1,
      team1Score: '0/0',
      team1Overs: '0.0',
      team1Crr: 0.0,
      team2: data.opponent,
      team2Score: '0/0',
      team2Overs: '0.0',
      team2Crr: 0.0,
      toss: `${data.team1} elected to bat`,
      dlsPar: 160,
      maxBowlerQuota: data.overs === 25 ? 5.0 : Math.round(data.overs / 5),
      result: '1st Innings in Progress',
      potm: 'Pending',
      chiefImpact: 'Pending',
      tacticalNotes: data.tacticalNotes,
    };

    // If starting XI has players selected, populate batters from starting XI with ALL 0s!
    let newBatters: BatterScore[] = [];
    if (starters.length > 0) {
      newBatters = starters.map((slot, idx) => ({
        id: `draft-b-${slot.player.id}-${idx}`,
        number: idx + 1,
        name: slot.player.name,
        hand: slot.player.hand,
        isWk: slot.player.role === 'WK-BAT',
        dismissal: 'Yet to Bat',
        isNotOut: true,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        sr: 0,
        boundaryPct: 0,
        dotPct: 0,
      }));
    } else {
      // 11 clean empty batters with 0s
      newBatters = FRESH_BATTERS.map((b) => ({ ...b, runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0 }));
    }

    // 5 clean empty bowlers with 0s
    const newBowlers: BowlerScore[] = FRESH_BOWLERS.map((bw) => ({ ...bw, overs: 0, maidens: 0, runs: 0, wickets: 0, economy: 0 }));

    setMatchData(newMatchSheet);
    setBatters(newBatters);
    setBowlers(newBowlers);
    setIsFreshSetup(false);
    showToast(`New ${data.category} Match Draft created with pre-game strategy notes saved!`);
    setActiveTab('scorecard-rapid-entry');
  };

  const handleImportScorecardData = (importedData: {
    match: Partial<MatchSummary>;
    batters: BatterScore[];
    bowlers: BowlerScore[];
  }) => {
    setIsFreshSetup(false);

    const gameNum = archivedMatches.length + 1;
    const gameLabel = `Game ${gameNum}`;

    const newMatchSummary: MatchSummary = {
      ...CURRENT_MATCH,
      ...importedData.match,
      id: `M-GAME-${gameNum}-${Date.now().toString().slice(-4)}`,
      round: gameLabel,
    };

    // Auto-generate Fall of Wickets from extracted batters
    const generatedFow: FallOfWicketItem[] = [];
    let currentRuns = 0;
    let wCount = 0;
    (importedData.batters || []).forEach((b, idx) => {
      currentRuns += b.runs;
      if (!b.isNotOut && b.dismissal && !b.dismissal.toLowerCase().includes('not out')) {
        wCount++;
        generatedFow.push({
          id: `fow-imp-${wCount}-${Date.now()}`,
          wicketNum: wCount,
          score: `${currentRuns}/${wCount}`,
          batterName: b.name,
          over: `${Math.floor((idx + 1) * 1.8)}.${((idx * 2) % 5) + 1}`,
        });
      }
    });

    const newRecord: ArchivedMatchRecord = {
      id: newMatchSummary.id,
      gameLabel,
      match: newMatchSummary,
      batters: importedData.batters || [],
      bowlers: importedData.bowlers || [],
      fowList: generatedFow,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setArchivedMatches((prev) => [newRecord, ...prev]);
    setActiveGameId(newRecord.id);
    setMatchData(newMatchSummary);
    setBatters(importedData.batters || []);
    setBowlers(importedData.bowlers || []);

    // Sync match figures into Squad Database & Player Dossiers
    syncMatchToSquadDatabase(importedData.batters || [], importedData.bowlers || [], newMatchSummary);
    saveToVault(newMatchSummary, importedData.batters || [], importedData.bowlers || [], generatedFow, gameLabel);

    showToast(`Recorded PDF import as ${gameLabel}! Updated Squad Database & Dossiers.`);
    setActiveTab('match-history-archives');
  };

  const handleUpdateArchivedMatch = (updatedRecord: ArchivedMatchRecord) => {
    setArchivedMatches((prev) =>
      prev.map((m) => (m.id === updatedRecord.id ? updatedRecord : m))
    );
    if (updatedRecord.id === activeGameId) {
      setMatchData(updatedRecord.match);
      setBatters(updatedRecord.batters);
      setBowlers(updatedRecord.bowlers);
    }
  };

  const handleDeleteArchivedMatch = (gameId: string) => {
    const targetMatch = archivedMatches.find((m) => m.id === gameId);

    // 1. Remove from archived matches
    setArchivedMatches((prev) => {
      const filtered = prev.filter((m) => m.id !== gameId);
      if (filtered.length > 0 && activeGameId === gameId) {
        setActiveGameId(filtered[0].id);
      }
      return filtered;
    });

    // 2. Cascade delete match logs from every player's dossier & recalculate stats
    if (targetMatch) {
      const opponentName = targetMatch.match.team2;
      const matchDate = targetMatch.createdAt || targetMatch.match.date;

      setPlayersPool((prevPool) =>
        prevPool.map((player) => {
          const logs = player.pastLogs || [];
          const remainingLogs = logs.filter(
            (log) => log.matchId !== gameId && !(log.opponent === opponentName && log.date === matchDate)
          );

          // If logs length changed, recalculate
          if (remainingLogs.length !== logs.length) {
            const updatedPlayer = recalculatePlayerStatsFromLogs(player, remainingLogs);
            setStarters((sPrev) =>
              sPrev.map((s) => (s.player.id === player.id ? { ...s, player: updatedPlayer } : s))
            );
            return updatedPlayer;
          }
          return player;
        })
      );
    }

    showToast('Deleted game record & cascade removed performance stats from player dossiers!');
  };

  // Override mode - update player stats
  const handleSavePlayerOverride = (updatedPlayer: Player) => {
    setPlayersPool((prev) =>
      prev.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p))
    );

    // Also sync in starters if present
    setStarters((prev) =>
      prev.map((s) => (s.player.id === updatedPlayer.id ? { ...s, player: updatedPlayer } : s))
    );
  };

  // Sub-feature: Add Past Match Stats for Individual Player
  const handleRemovePlayerFromPool = (playerId: string) => {
    const playerToRemove = playersPool.find((p) => p.id === playerId);
    setPlayersPool((prev) => prev.filter((p) => p.id !== playerId));
    setStarters((prev) => prev.filter((s) => s.player.id !== playerId));
    showToast(`Removed ${playerToRemove?.name || 'Player'} from squad roster.`);
  };

  const handleClearAllPlayersPool = () => {
    setPlayersPool([]);
    setStarters([]);
    showToast('Removed all players from the squad pool roster!');
  };

  const handleRestoreDefaultSquadPool = () => {
    setPlayersPool(PLAYERS_POOL);
    setStarters([]);
    showToast('Restored default squad pool roster!');
  };

  const handleAddPastMatchLog = (playerId: string, log: PastMatchLog) => {
    setPlayersPool((prev) =>
      prev.map((p) => {
        if (p.id !== playerId) return p;

        const existingLogs = p.pastLogs || [];
        const updatedLogs = [log, ...existingLogs];
        const updatedPlayer = recalculatePlayerStatsFromLogs(p, updatedLogs);

        // Also update starters if in lineup
        setStarters((sPrev) =>
          sPrev.map((s) => (s.player.id === playerId ? { ...s, player: updatedPlayer } : s))
        );

        return updatedPlayer;
      })
    );

    const playerObj = playersPool.find((p) => p.id === playerId);
    showToast(`Logged past match performance against ${log.opponent} for ${playerObj?.name || 'player'}! Stats updated.`);
  };

  const handleDeployToXiFromDossier = (player: Player) => {
    const isAlreadyIn = starters.some((s) => s.player.id === player.id);
    if (isAlreadyIn) {
      showToast(`${player.name} is already in the starting XI!`);
    } else {
      if (starters.length >= 11) {
        setStarters((prev) => [
          ...prev.slice(0, 10),
          { slotNum: 11, player, assignedOvers: 0, note: 'Deployed from Dossier' },
        ]);
      } else {
        setStarters((prev) => [
          ...prev,
          { slotNum: prev.length + 1, player, assignedOvers: 0, note: 'Deployed from Dossier' },
        ]);
      }
      showToast(`${player.name} deployed into the Playing XI!`);
    }
    setActiveTab('playing-xi-workbench');
  };

  const handleSaveCoachProfile = (updated: CoachProfile) => {
    setCoachProfile(updated);
    showToast(`Coach Profile updated: ${updated.name} (${updated.team})`);
  };

  return (
    <div className="min-h-screen bg-[#0d1322] text-[#dde2f8] font-sans antialiased selection:bg-[#10b981] selection:text-[#003824]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#10b981] text-[#003824] px-4 py-2.5 rounded-lg shadow-2xl font-bold text-xs flex items-center gap-2 border border-[#4edea3] animate-bounce">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Operations Deck */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        coachProfile={coachProfile}
        onOpenSettings={() => setIsUserSettingsOpen(true)}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onExportPdf={() => {
          showToast('Preparing printable tactical PDF dossier...');
          window.print();
        }}
        onNewMatchDraft={() => setIsNewMatchOpen(true)}
        onOpenImportModal={() => setIsImportScorecardOpen(true)}
        onOpenBackupModal={() => setIsDataBackupOpen(true)}
        isCollapsed={isSidebarCollapsed}
      />

      {/* Main Content View Container */}
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        <main className="relative w-full pt-20 px-6 py-4 flex flex-col gap-4">
          {/* Welcome / Initial Setup Mode Banner */}
          <div className="w-full bg-[#151b2b] border border-[#2f3445] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#10b981]/20 text-[#4edea3] shrink-0 border border-[#10b981]/30">
                <span className="material-symbols-outlined text-[20px]">verified</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#dde2f8]">
                    {isFreshSetup ? 'Clean Initial Setup Mode Active' : 'Active Matchday Sheet Loaded'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#242a3a] text-[#4edea3] text-[10px] font-mono font-bold">
                    {matchData.category || 'Practice'} Match
                  </span>
                </div>
                <p className="text-[#bbcabf] text-[11px]">
                  {isFreshSetup
                    ? 'Scorecard ready for your first match setup. You can score a practice match or load sample demo data.'
                    : `Currently tracking ${matchData.team1} vs ${matchData.team2} (${matchData.venue}).`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {isFreshSetup ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsNewMatchOpen(true)}
                    className="h-8 px-3 rounded-lg bg-[#4edea3] text-[#003824] font-bold text-xs hover:brightness-110 flex items-center gap-1 shadow"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>+ New Match</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadDemoData}
                    className="h-8 px-3 rounded-lg bg-[#242a3a] text-[#93ccff] hover:bg-[#2f3445] font-semibold text-xs flex items-center gap-1 border border-[#3198dc]/30"
                  >
                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                    <span>Load Demo Data</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleResetToFreshSetup}
                  className="h-8 px-3 rounded-lg bg-[#242a3a] text-[#bbcabf] hover:text-[#dde2f8] font-semibold text-xs flex items-center gap-1 border border-[#2f3445]"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  <span>Reset to Fresh Setup</span>
                </button>
              )}
            </div>
          </div>

          {/* View Router */}
          {activeTab === 'matchday-live-scoring' && (
            <MatchdayLiveView
              playersPool={playersPool}
              onFinalizeMatch={(importedData) => {
                handleImportScorecardData({
                  match: importedData.match,
                  batters: importedData.batters,
                  bowlers: importedData.bowlers,
                });
              }}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'scorecard-rapid-entry' && (
            <ScorecardView
              match={matchData}
              batters={batters}
              setBatters={setBatters}
              bowlers={bowlers}
              setBowlers={setBowlers}
              onFinalizeMatch={handleFinalizeMatch}
              onClearScorecard={handleClearScorecard}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'playing-xi-workbench' && (
            <WorkbenchView
              playersPool={playersPool}
              starters={starters}
              setStarters={setStarters}
              onLockLineup={() => showToast('Matchday Lineup Locked & Published to League Dossier!')}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'squad-database-dossier' && (
            <SquadDossierView
              playersPool={playersPool}
              onDeployToXi={handleDeployToXiFromDossier}
              onComparePlayer={() => {
                setActiveTab('playing-xi-workbench');
                showToast('Switched to Workbench Compare Mode');
              }}
              onSavePlayerOverride={handleSavePlayerOverride}
              onAddPastMatchLog={handleAddPastMatchLog}
              onAddPlayerToPool={handleAddNewPlayerToPool}
              onRemovePlayerFromPool={handleRemovePlayerFromPool}
              onClearAllPlayersPool={handleClearAllPlayersPool}
              onRestoreDefaultSquadPool={handleRestoreDefaultSquadPool}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'match-history-archives' && (
            <MatchReportView
              archivedMatches={archivedMatches}
              activeGameId={activeGameId}
              onSelectGame={setActiveGameId}
              onUpdateArchivedMatch={handleUpdateArchivedMatch}
              onDeleteArchivedMatch={handleDeleteArchivedMatch}
              onOpenImportModal={() => setIsImportScorecardOpen(true)}
              onExportPdf={() => {
                showToast('Exporting Tactical Match Report PDF...');
                window.print();
              }}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'tournament-telemetry' && <TelemetryView onShowToast={showToast} />}
        </main>
      </div>

      {/* Modals */}
      <NewMatchModal
        isOpen={isNewMatchOpen}
        onClose={() => setIsNewMatchOpen(false)}
        onCreateMatch={handleCreateMatchDraft}
        onOpenImportModal={() => setIsImportScorecardOpen(true)}
      />

      <UserSettingsModal
        isOpen={isUserSettingsOpen}
        onClose={() => setIsUserSettingsOpen(false)}
        coachProfile={coachProfile}
        onSaveCoachProfile={handleSaveCoachProfile}
        allRecordsVault={allRecordsVault}
        onRestoreVaultRecord={handleRestoreVaultRecord}
        onExportAllRecords={handleExportAllRecords}
        onShowToast={showToast}
        onLogout={handleLogout}
      />

      <ImportScorecardModal
        isOpen={isImportScorecardOpen}
        onClose={() => setIsImportScorecardOpen(false)}
        playersPool={playersPool}
        coachProfile={coachProfile}
        onImportScorecard={handleImportScorecardData}
        onAddPlayerToPool={handleAddNewPlayerToPool}
        onShowToast={showToast}
      />

      <LoginModal
        isOpen={isLoginOpen || !isLoggedIn}
        onLogin={handleLogin}
      />

      <DataBackupModal
        isOpen={isDataBackupOpen}
        onClose={() => setIsDataBackupOpen(false)}
        onShowToast={showToast}
      />

      <OfflineIndicator />
    </div>
  );
}
