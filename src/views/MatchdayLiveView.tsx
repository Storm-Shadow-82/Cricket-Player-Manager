import React, { useState } from 'react';
import { Player, MatchSummary, BatterScore, BowlerScore, MatchCategory } from '../types/cricket';

interface MatchdayLiveViewProps {
  playersPool: Player[];
  onFinalizeMatch: (data: {
    match: Partial<MatchSummary>;
    batters: BatterScore[];
    bowlers: BowlerScore[];
  }) => void;
  onShowToast: (msg: string) => void;
}

interface BallRecord {
  id: string;
  overNum: number;
  ballNumInOver: number;
  runs: number;
  isBoundary4: boolean;
  isBoundary6: boolean;
  isWicket: boolean;
  wicketType?: string;
  batterIndex: number;
  bowlerIndex: number;
  extraType: 'wd' | 'nb' | 'lb' | 'b' | 'none';
  extraRuns: number;
  displayLabel: string;
  prevStrikerIndex: number;
  prevNonStrikerIndex: number;
}

export const MatchdayLiveView: React.FC<MatchdayLiveViewProps> = ({
  playersPool,
  onFinalizeMatch,
  onShowToast,
}) => {
  // Mode: 'setup' | 'live'
  const [mode, setMode] = useState<'setup' | 'live'>('setup');

  // SETUP STATE
  const [team1Name, setTeam1Name] = useState('My Team CC');
  const [team2Name, setTeam2Name] = useState('Coastal Hurricanes');
  const [matchCategory, setCategory] = useState<MatchCategory>('Practice');
  const [venue, setVenue] = useState('Main Cricket Stadium, Pitch #1');
  const [maxOvers, setMaxOvers] = useState(20);

  // XI Selection
  const [selectedXiIds, setSelectedXiIds] = useState<string[]>(
    playersPool.slice(0, 11).map((p) => p.id)
  );
  const [bowlerName, setBowlerName] = useState<string>('Opponent Bowler 1');

  // LIVE MATCH ENGINE STATE
  const [totalRuns, setTotalRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [legalBallsCount, setLegalBallsCount] = useState(0);
  const [totalExtras, setTotalExtras] = useState(0);

  // Active Batters
  const [liveBatters, setLiveBatters] = useState<
    (BatterScore & { playerId?: string })[]
  >([]);
  const [activeStrikerIndex, setActiveStrikerIndex] = useState<number>(0);
  const [activeNonStrikerIndex, setActiveStrikerIndexNon] = useState<number>(1);

  // Active Bowlers
  const [liveBowlers, setLiveBowlers] = useState<BowlerScore[]>([]);
  const [activeBowlerIndex, setActiveBowlerIndex] = useState<number>(0);

  // Ball History for Undo
  const [ballHistory, setBallHistory] = useState<BallRecord[]>([]);

  // Modals
  const [isWicketModalOpen, setIsWicketModalOpen] = useState(false);
  const [selectedWicketType, setSelectedWicketType] = useState('Bowled');
  const [selectedNextBatterIndex, setSelectedNextBatterIndex] = useState<number>(-1);

  const [isChangeBowlerOpen, setIsChangeBowlerOpen] = useState(false);
  const [newBowlerInputName, setNewBowlerInputName] = useState('');

  // AI XI Recommendation Handler
  const handleAiRecommendXi = () => {
    const sorted = [...playersPool].sort((a, b) => b.impactScore - a.impactScore);
    const top11 = sorted.slice(0, 11).map((p) => p.id);
    setSelectedXiIds(top11);
    onShowToast('AI selected top 11 balanced starters based on impact score & roles!');
  };

  // Start Live Match Engine
  const handleStartLiveMatch = () => {
    if (selectedXiIds.length < 2) {
      onShowToast('Please select at least 2 batters for your team XI.');
      return;
    }

    const xiPlayers = playersPool.filter((p) => selectedXiIds.includes(p.id));
    const bList: (BatterScore & { playerId?: string })[] = xiPlayers.map((p, i) => ({
      id: `live-b-${i + 1}`,
      playerId: p.id,
      number: i + 1,
      name: p.name,
      hand: p.hand,
      dismissal: i < 2 ? 'Not Out' : 'Yet to Bat',
      isNotOut: i < 2,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      sr: 0,
      boundaryPct: 0,
      dotPct: 0,
    }));

    const bwList: BowlerScore[] = [
      {
        id: 'live-bw-1',
        name: bowlerName || 'Opponent Bowler 1',
        style: 'Right-arm Fast Medium',
        overs: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
        economy: 0,
        dots: 0,
        quotaMax: Math.ceil(maxOvers / 5),
        state: 'Available',
        colorTag: '#4edea3',
      },
    ];

    setLiveBatters(bList);
    setLiveBowlers(bwList);
    setActiveStrikerIndex(0);
    setActiveStrikerIndexNon(1);
    setActiveBowlerIndex(0);

    setTotalRuns(0);
    setWickets(0);
    setLegalBallsCount(0);
    setTotalExtras(0);
    setBallHistory([]);
    setMode('live');
    onShowToast(`Match Started! 1st Innings (${team1Name} Batting) initialized.`);
  };

  // Calculated Overs string e.g. "4.2"
  const completedOversNum = Math.floor(legalBallsCount / 6);
  const ballsInCurrentOverNum = legalBallsCount % 6;
  const currentOversStr = `${completedOversNum}.${ballsInCurrentOverNum}`;

  const currentCrr =
    legalBallsCount > 0
      ? Number(((totalRuns / (legalBallsCount / 6))).toFixed(2))
      : 0.0;

  // Record a Ball
  const handleScoreBall = (
    runs: number,
    isWicket = false,
    extraType: 'wd' | 'nb' | 'lb' | 'b' | 'none' = 'none',
    extraRuns = 0,
    chosenNextBatterIndex?: number
  ) => {
    const isLegalBall = extraType !== 'wd' && extraType !== 'nb';
    const runsForBatter = extraType === 'wd' || extraType === 'nb' ? runs : runs;
    const totalBallRuns = runs + extraRuns;

    let ballLabel = `${totalBallRuns}`;
    if (isWicket) ballLabel = 'W';
    else if (extraType === 'wd') ballLabel = `${totalBallRuns}wd`;
    else if (extraType === 'nb') ballLabel = `${totalBallRuns}nb`;
    else if (extraType === 'lb') ballLabel = `${totalBallRuns}lb`;
    else if (extraType === 'b') ballLabel = `${totalBallRuns}b`;

    const newBallRecord: BallRecord = {
      id: `ball-${Date.now()}`,
      overNum: completedOversNum,
      ballNumInOver: ballsInCurrentOverNum + (isLegalBall ? 1 : 0),
      runs: runsForBatter,
      isBoundary4: runs === 4 && extraType === 'none',
      isBoundary6: runs === 6 && extraType === 'none',
      isWicket,
      wicketType: isWicket ? selectedWicketType : undefined,
      batterIndex: activeStrikerIndex,
      bowlerIndex: activeBowlerIndex,
      extraType,
      extraRuns,
      displayLabel: ballLabel,
      prevStrikerIndex: activeStrikerIndex,
      prevNonStrikerIndex: activeNonStrikerIndex,
    };

    setBallHistory((prev) => [newBallRecord, ...prev]);

    // Update Totals
    setTotalRuns((prev) => prev + totalBallRuns);
    if (extraType !== 'none') {
      setTotalExtras((prev) => prev + (extraType === 'wd' || extraType === 'nb' ? 1 + extraRuns : extraRuns));
    }

    if (isLegalBall) {
      setLegalBallsCount((prev) => prev + 1);
    }

    // Update Batter Stats
    setLiveBatters((prev) =>
      prev.map((b, idx) => {
        if (idx === activeStrikerIndex) {
          const newRuns = b.runs + runsForBatter;
          const newBalls = b.balls + (isLegalBall ? 1 : 0);
          const new4s = b.fours + (runs === 4 && extraType === 'none' ? 1 : 0);
          const new6s = b.sixes + (runs === 6 && extraType === 'none' ? 1 : 0);
          const newSr = newBalls > 0 ? Number(((newRuns / newBalls) * 100).toFixed(1)) : 0;
          return {
            ...b,
            runs: newRuns,
            balls: newBalls,
            fours: new4s,
            sixes: new6s,
            sr: newSr,
            dismissal: isWicket ? selectedWicketType : b.dismissal,
            isNotOut: !isWicket,
          };
        }
        return b;
      })
    );

    // Update Bowler Stats
    setLiveBowlers((prev) =>
      prev.map((bw, idx) => {
        if (idx === activeBowlerIndex) {
          const addLegal = isLegalBall ? 1 : 0;
          const totalBowlerBalls = Math.floor(bw.overs) * 6 + Math.round((bw.overs % 1) * 10) + addLegal;
          const newOvers = Number((Math.floor(totalBowlerBalls / 6) + (totalBowlerBalls % 6) / 10).toFixed(1));
          const newRunsConceded = bw.runs + totalBallRuns;
          const newWickets = bw.wickets + (isWicket ? 1 : 0);
          const totalOversDec = Math.floor(totalBowlerBalls / 6) + (totalBowlerBalls % 6) / 6;
          const newEcon = totalOversDec > 0 ? Number((newRunsConceded / totalOversDec).toFixed(2)) : 0;

          return {
            ...bw,
            overs: newOvers,
            runs: newRunsConceded,
            wickets: newWickets,
            economy: newEcon,
          };
        }
        return bw;
      })
    );

    // Handle Wicket & Next Batter Selection
    if (isWicket) {
      setWickets((prev) => prev + 1);

      // Determine next batter
      let incomingIndex = chosenNextBatterIndex;
      if (incomingIndex === undefined || incomingIndex < 0) {
        incomingIndex = liveBatters.findIndex(
          (b, idx) => idx !== activeStrikerIndex && idx !== activeNonStrikerIndex && b.dismissal === 'Yet to Bat'
        );
      }

      if (incomingIndex !== -1 && incomingIndex !== undefined) {
        setLiveBatters((prev) =>
          prev.map((b, idx) => (idx === incomingIndex ? { ...b, dismissal: 'Not Out', isNotOut: true } : b))
        );
        setActiveStrikerIndex(incomingIndex);
        onShowToast(`Wicket fell! ${liveBatters[incomingIndex]?.name || 'Next batter'} came to the crease.`);
      } else {
        onShowToast('All Out! Innings Concluded.');
      }
    } else {
      // Strike rotation on odd runs
      if (runsForBatter % 2 !== 0) {
        setActiveStrikerIndex(activeNonStrikerIndex);
        setActiveStrikerIndexNon(activeStrikerIndex);
      }
    }

    // End of Over strike rotation
    if (isLegalBall && (legalBallsCount + 1) % 6 === 0) {
      setActiveStrikerIndex((prevS) => {
        const currentNonS = activeNonStrikerIndex;
        setActiveStrikerIndexNon(prevS);
        return currentNonS;
      });
      setIsChangeBowlerOpen(true);
    }
  };

  // UNDO LAST BALL FUNCTIONALITY
  const handleUndoLastBall = () => {
    if (ballHistory.length === 0) {
      onShowToast('No balls to undo!');
      return;
    }

    const lastBall = ballHistory[0];
    const remainingHistory = ballHistory.slice(1);
    setBallHistory(remainingHistory);

    const isLegalBall = lastBall.extraType !== 'wd' && lastBall.extraType !== 'nb';
    const totalBallRuns = lastBall.runs + lastBall.extraRuns;

    // Revert Totals
    setTotalRuns((prev) => Math.max(0, prev - totalBallRuns));
    if (lastBall.extraType !== 'none') {
      const extraDeduction = lastBall.extraType === 'wd' || lastBall.extraType === 'nb' ? 1 + lastBall.extraRuns : lastBall.extraRuns;
      setTotalExtras((prev) => Math.max(0, prev - extraDeduction));
    }

    if (isLegalBall) {
      setLegalBallsCount((prev) => Math.max(0, prev - 1));
    }

    if (lastBall.isWicket) {
      setWickets((prev) => Math.max(0, prev - 1));
    }

    // Revert Batter Stats
    setLiveBatters((prev) =>
      prev.map((b, idx) => {
        if (idx === lastBall.batterIndex) {
          const newRuns = Math.max(0, b.runs - lastBall.runs);
          const newBalls = Math.max(0, b.balls - (isLegalBall ? 1 : 0));
          const new4s = Math.max(0, b.fours - (lastBall.isBoundary4 ? 1 : 0));
          const new6s = Math.max(0, b.sixes - (lastBall.isBoundary6 ? 1 : 0));
          const newSr = newBalls > 0 ? Number(((newRuns / newBalls) * 100).toFixed(1)) : 0;
          return {
            ...b,
            runs: newRuns,
            balls: newBalls,
            fours: new4s,
            sixes: new6s,
            sr: newSr,
            dismissal: 'Not Out',
            isNotOut: true,
          };
        }
        return b;
      })
    );

    // Revert Bowler Stats
    setLiveBowlers((prev) =>
      prev.map((bw, idx) => {
        if (idx === lastBall.bowlerIndex) {
          const addLegal = isLegalBall ? 1 : 0;
          const totalBowlerBalls = Math.max(0, Math.floor(bw.overs) * 6 + Math.round((bw.overs % 1) * 10) - addLegal);
          const newOvers = Number((Math.floor(totalBowlerBalls / 6) + (totalBowlerBalls % 6) / 10).toFixed(1));
          const newRunsConceded = Math.max(0, bw.runs - totalBallRuns);
          const newWickets = Math.max(0, bw.wickets - (lastBall.isWicket ? 1 : 0));
          const totalOversDec = Math.floor(totalBowlerBalls / 6) + (totalBowlerBalls % 6) / 6;
          const newEcon = totalOversDec > 0 ? Number((newRunsConceded / totalOversDec).toFixed(2)) : 0;

          return {
            ...bw,
            overs: newOvers,
            runs: newRunsConceded,
            wickets: newWickets,
            economy: newEcon,
          };
        }
        return bw;
      })
    );

    // Revert Active Strikers
    setActiveStrikerIndex(lastBall.prevStrikerIndex);
    setActiveStrikerIndexNon(lastBall.prevNonStrikerIndex);

    onShowToast(`Undid last ball (${lastBall.displayLabel}) successfully!`);
  };

  // Add / Switch Bowler
  const handleConfirmChangeBowler = () => {
    if (!newBowlerInputName.trim()) return;
    const existingIdx = liveBowlers.findIndex(
      (bw) => bw.name.toLowerCase().trim() === newBowlerInputName.toLowerCase().trim()
    );

    if (existingIdx !== -1) {
      setActiveBowlerIndex(existingIdx);
    } else {
      const newBw: BowlerScore = {
        id: `live-bw-${liveBowlers.length + 1}`,
        name: newBowlerInputName.trim(),
        style: 'Right-arm Medium',
        overs: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
        economy: 0,
        dots: 0,
        quotaMax: Math.ceil(maxOvers / 5),
        state: 'Available',
        colorTag: '#93ccff',
      };
      setLiveBowlers([...liveBowlers, newBw]);
      setActiveBowlerIndex(liveBowlers.length);
    }
    setNewBowlerInputName('');
    setIsChangeBowlerOpen(false);
    onShowToast(`Switched bowler to ${newBowlerInputName.trim()}`);
  };

  // Finalize & Apply Match to Squad Pool & Dossiers
  const handleFinishMatch = () => {
    const matchSummary: Partial<MatchSummary> = {
      id: `M-LIVE-${Date.now().toString().slice(-4)}`,
      team1: team1Name,
      team1Score: `${totalRuns}/${wickets}`,
      team1Overs: currentOversStr,
      team2: team2Name,
      team2Score: '0/0',
      team2Overs: '0.0',
      category: matchCategory,
      venue,
      result: `${team1Name} scored ${totalRuns}/${wickets} in ${currentOversStr} overs.`,
      date: new Date().toISOString().split('T')[0],
    };

    onFinalizeMatch({
      match: matchSummary,
      batters: liveBatters,
      bowlers: liveBowlers,
    });

    onShowToast('Match concluded & finalized! Updated Squad Database & Dossier statistics.');
  };

  const striker = liveBatters[activeStrikerIndex];
  const nonStriker = liveBatters[activeNonStrikerIndex];
  const currentBowler = liveBowlers[activeBowlerIndex];

  // Available "Yet to Bat" batters for Wicket Modal
  const availableNextBatters = liveBatters
    .map((b, idx) => ({ ...b, originalIndex: idx }))
    .filter(
      (b) =>
        b.originalIndex !== activeStrikerIndex &&
        b.originalIndex !== activeNonStrikerIndex &&
        b.dismissal === 'Yet to Bat'
    );

  return (
    <div className="flex flex-col gap-6 text-[#dde2f8]">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#151b2b] p-4 rounded-xl border border-[#2f3445] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#4edea3]/20 text-[#4edea3] border border-[#10b981]/30">
            <span className="material-symbols-outlined text-[24px]">sports_cricket</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#dde2f8]">Matchday Live Ball-by-Ball Scoring Engine</h2>
            <p className="text-xs text-[#bbcabf]">Real-time Android-style scoring & automatic squad dossier sync</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mode === 'live' && (
            <>
              <button
                type="button"
                onClick={handleUndoLastBall}
                disabled={ballHistory.length === 0}
                className="h-8 px-3 bg-[#e29100]/20 text-[#ffb95f] hover:bg-[#e29100]/30 font-bold text-xs rounded-lg border border-[#e29100]/40 flex items-center gap-1 shadow disabled:opacity-40"
                title="Undo last recorded ball"
              >
                <span className="material-symbols-outlined text-[16px]">undo</span>
                <span>Undo Last Ball</span>
              </button>

              <button
                type="button"
                onClick={handleFinishMatch}
                className="h-8 px-4 bg-[#10b981] text-[#003824] font-extrabold text-xs rounded-lg hover:brightness-110 flex items-center gap-1.5 shadow"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Finish & Sync Match</span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setMode(mode === 'setup' ? 'live' : 'setup')}
            className="h-8 px-3.5 bg-[#242a3a] text-[#bbcabf] hover:text-[#dde2f8] font-bold text-xs rounded-lg border border-[#2f3445]"
          >
            {mode === 'setup' ? 'Go to Live Deck' : 'Match Setup'}
          </button>
        </div>
      </div>

      {/* MODE 1: SETUP WIZARD */}
      {mode === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-[#151b2b] p-5 rounded-xl border border-[#2f3445] flex flex-col gap-4 text-xs">
            <h3 className="font-bold text-sm text-[#4edea3] flex items-center gap-1.5 border-b border-[#242a3a] pb-2">
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span>1. Match Info & Format Setup</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[#bbcabf]">Your Team Name</label>
                <input
                  type="text"
                  value={team1Name}
                  onChange={(e) => setTeam1Name(e.target.value)}
                  className="h-9 px-3 bg-[#080e1d] border border-[#2f3445] rounded font-semibold text-[#dde2f8] outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[#bbcabf]">Opponent Team</label>
                <input
                  type="text"
                  value={team2Name}
                  onChange={(e) => setTeam2Name(e.target.value)}
                  className="h-9 px-3 bg-[#080e1d] border border-[#2f3445] rounded font-semibold text-[#dde2f8] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[#bbcabf]">Venue & Ground</label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="h-9 px-3 bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8] outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[#bbcabf]">Overs Allocation</label>
                <select
                  value={maxOvers}
                  onChange={(e) => setMaxOvers(Number(e.target.value))}
                  className="h-9 px-2 bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8] outline-none"
                >
                  <option value={20}>20 Overs (T20 Format)</option>
                  <option value={25}>25 Overs (Premier Cup)</option>
                  <option value={50}>50 Overs (ODI Format)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1 pt-2 border-t border-[#242a3a]">
              <label className="text-[#bbcabf] font-semibold">Opening Bowler Name</label>
              <input
                type="text"
                value={bowlerName}
                onChange={(e) => setBowlerName(e.target.value)}
                placeholder="Opponent Bowler 1"
                className="h-9 px-3 bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8] outline-none"
              />
            </div>
          </div>

          {/* XI Selector */}
          <div className="lg:col-span-5 bg-[#151b2b] p-5 rounded-xl border border-[#2f3445] flex flex-col gap-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#242a3a] pb-2">
              <h3 className="font-bold text-sm text-[#4edea3] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">groups</span>
                <span>2. Select Playing XI ({selectedXiIds.length}/11)</span>
              </h3>
              <button
                type="button"
                onClick={handleAiRecommendXi}
                className="px-2.5 py-1 rounded bg-[#3198dc]/20 text-[#93ccff] hover:bg-[#3198dc]/30 font-bold text-[11px] border border-[#3198dc]/40 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                <span>AI Recommend XI</span>
              </button>
            </div>

            <div className="max-h-52 overflow-y-auto flex flex-col gap-1.5 bg-[#080e1d] p-2.5 rounded-lg border border-[#2f3445]">
              {playersPool.map((p) => {
                const isSel = selectedXiIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={`p-2 rounded flex items-center justify-between cursor-pointer transition-colors ${
                      isSel ? 'bg-[#10b981]/20 border border-[#4edea3]/40 text-[#4edea3]' : 'bg-[#151b2b] text-[#bbcabf]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedXiIds([...selectedXiIds, p.id]);
                          else setSelectedXiIds(selectedXiIds.filter((id) => id !== p.id));
                        }}
                        className="accent-[#4edea3]"
                      />
                      <span className="font-bold text-xs">{p.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#bbcabf]">{p.role}</span>
                  </label>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleStartLiveMatch}
              className="w-full py-2.5 rounded-lg bg-[#4edea3] text-[#003824] font-extrabold text-xs hover:brightness-110 shadow-lg flex items-center justify-center gap-1.5 mt-auto"
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              <span>Start Live Ball-by-Ball Match →</span>
            </button>
          </div>
        </div>
      )}

      {/* MODE 2: LIVE BALL-BY-BALL SCORING DECK */}
      {mode === 'live' && (
        <div className="flex flex-col gap-6">
          {/* Main Scoreboard Display */}
          <div className="bg-[#151b2b] p-6 rounded-2xl border border-[#2f3445] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-[#4edea3] font-bold uppercase tracking-wider">
                {team1Name} Innings • {matchCategory}
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-extrabold text-[#dde2f8] font-mono">
                  {totalRuns}/{wickets}
                </span>
                <span className="text-base text-[#bbcabf] font-mono">
                  ({currentOversStr} / {maxOvers}.0 ov)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 font-mono text-xs">
              <div className="flex flex-col text-center">
                <span className="text-[#bbcabf]">Current Run Rate</span>
                <span className="text-lg font-bold text-[#4edea3]">{currentCrr}</span>
              </div>
              <div className="h-8 w-px bg-[#2f3445]" />
              <div className="flex flex-col text-center">
                <span className="text-[#bbcabf]">Extras</span>
                <span className="text-lg font-bold text-[#ffb95f]">{totalExtras}</span>
              </div>
            </div>
          </div>

          {/* Live Telemetry & Match Diagnostics Panel */}
          <div className="p-4 bg-[#151b2b] rounded-xl border border-[#2f3445] flex flex-col gap-3 text-xs shadow-lg">
            <span className="font-bold text-[#4edea3] text-xs flex items-center justify-between border-b border-[#242a3a] pb-2">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">analytics</span>
                <span>Live Matchday Telemetry & DLS Par Diagnostics</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#4edea3] font-mono text-[10px] border border-[#10b981]/30">
                LIVE TELEMETRY ACTIVE
              </span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="p-2.5 bg-[#080e1d] rounded-lg border border-[#2f3445] flex flex-col gap-1">
                <span className="text-[10px] text-[#bbcabf]">Projected Total (at {currentCrr} CRR)</span>
                <span className="text-base font-extrabold text-[#4edea3]">
                  {Math.round(currentCrr * maxOvers)} Runs
                </span>
              </div>

              <div className="p-2.5 bg-[#080e1d] rounded-lg border border-[#2f3445] flex flex-col gap-1">
                <span className="text-[10px] text-[#bbcabf]">Current Partnership</span>
                <span className="text-base font-extrabold text-[#dde2f8]">
                  {(striker?.runs || 0) + (nonStriker?.runs || 0)} ({ (striker?.balls || 0) + (nonStriker?.balls || 0) }b)
                </span>
              </div>

              <div className="p-2.5 bg-[#080e1d] rounded-lg border border-[#2f3445] flex flex-col gap-1">
                <span className="text-[10px] text-[#bbcabf]">Live DLS Par ({currentOversStr} ov, {wickets} Wkts)</span>
                <span className="text-base font-extrabold text-[#ffb95f]">
                  {Math.max(0, Math.floor((totalRuns * (100 - wickets * 8)) / 100))} Runs
                </span>
              </div>

              <div className="p-2.5 bg-[#080e1d] rounded-lg border border-[#2f3445] flex flex-col gap-1">
                <span className="text-[10px] text-[#bbcabf]">Boundary Density</span>
                <span className="text-base font-extrabold text-[#93ccff]">
                  {(striker?.fours || 0) + (nonStriker?.fours || 0) + (striker?.sixes || 0) + (nonStriker?.sixes || 0)} Boundaries
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Batters */}
            <div className="bg-[#151b2b] p-4 rounded-xl border border-[#2f3445] flex flex-col gap-3">
              <span className="font-bold text-xs text-[#4edea3] flex items-center justify-between">
                <span>Active Batters</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveStrikerIndex(activeNonStrikerIndex);
                    setActiveStrikerIndexNon(activeStrikerIndex);
                    onShowToast('Rotated Strike!');
                  }}
                  className="px-2 py-0.5 rounded bg-[#242a3a] text-[#dde2f8] text-[10px] font-bold hover:bg-[#2f3445]"
                >
                  ⇄ Swap Strike
                </button>
              </span>

              <div className="flex flex-col gap-2 font-mono text-xs">
                {striker && (
                  <div className="p-2.5 bg-[#080e1d] rounded-lg border border-[#4edea3]/40 flex items-center justify-between">
                    <span className="font-bold text-[#4edea3]">
                      * {striker.name} (Striker)
                    </span>
                    <span className="font-extrabold text-[#dde2f8]">
                      {striker.runs} ({striker.balls}b) • {striker.fours}x4 {striker.sixes}x6
                    </span>
                  </div>
                )}

                {nonStriker && (
                  <div className="p-2.5 bg-[#080e1d] rounded-lg border border-[#2f3445] flex items-center justify-between">
                    <span className="font-semibold text-[#bbcabf]">
                      {nonStriker.name}
                    </span>
                    <span className="text-[#dde2f8]">
                      {nonStriker.runs} ({nonStriker.balls}b) • {nonStriker.fours}x4 {nonStriker.sixes}x6
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Active Bowler */}
            <div className="bg-[#151b2b] p-4 rounded-xl border border-[#2f3445] flex flex-col gap-3">
              <span className="font-bold text-xs text-[#93ccff] flex items-center justify-between">
                <span>Current Bowler</span>
                <button
                  type="button"
                  onClick={() => setIsChangeBowlerOpen(true)}
                  className="px-2 py-0.5 rounded bg-[#3198dc]/20 text-[#93ccff] text-[10px] font-bold hover:bg-[#3198dc]/30 border border-[#3198dc]/40"
                >
                  Change Bowler
                </button>
              </span>

              {currentBowler && (
                <div className="p-2.5 bg-[#080e1d] rounded-lg border border-[#2f3445] flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-[#dde2f8]">{currentBowler.name}</span>
                  <span className="text-[#4edea3]">
                    {currentBowler.overs} ov • {currentBowler.runs} runs • {currentBowler.wickets} wkts
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Recent Balls Bar & Undo Action */}
          <div className="p-3 bg-[#080e1d] rounded-xl border border-[#2f3445] flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-[#bbcabf] shrink-0">Recent Balls:</span>
              {ballHistory.length === 0 ? (
                <span className="text-xs text-[#bbcabf]/60 font-mono">No balls bowled yet. Use keypad below!</span>
              ) : (
                ballHistory.slice(0, 12).map((b) => (
                  <span
                    key={b.id}
                    className={`h-7 px-2.5 rounded-full font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                      b.isWicket
                        ? 'bg-[#ffb4ab] text-[#600004]'
                        : b.isBoundary6
                        ? 'bg-[#ffb95f] text-[#3d2400]'
                        : b.isBoundary4
                        ? 'bg-[#93ccff] text-[#003258]'
                        : 'bg-[#242a3a] text-[#dde2f8]'
                    }`}
                  >
                    {b.displayLabel}
                  </span>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={handleUndoLastBall}
              disabled={ballHistory.length === 0}
              className="h-8 px-3 bg-[#e29100]/20 text-[#ffb95f] hover:bg-[#e29100]/30 font-bold text-xs rounded-lg border border-[#e29100]/40 flex items-center gap-1 shrink-0 disabled:opacity-40"
              title="Undo last recorded ball"
            >
              <span className="material-symbols-outlined text-[16px]">undo</span>
              <span>Undo</span>
            </button>
          </div>

          {/* Keypad Scoring Controls */}
          <div className="bg-[#151b2b] p-5 rounded-2xl border border-[#2f3445] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#dde2f8]">Ball Scoring Keypad</span>
              <button
                type="button"
                onClick={handleUndoLastBall}
                disabled={ballHistory.length === 0}
                className="text-xs text-[#ffb95f] hover:underline flex items-center gap-1 disabled:opacity-40 font-semibold"
              >
                <span className="material-symbols-outlined text-[14px]">undo</span>
                <span>Undo Last Ball</span>
              </button>
            </div>

            {/* Runs Row */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 font-mono font-extrabold text-sm">
              <button
                type="button"
                onClick={() => handleScoreBall(0)}
                className="py-3 rounded-xl bg-[#242a3a] hover:bg-[#2f3445] text-[#dde2f8] border border-[#2f3445]"
              >
                0 (Dot)
              </button>
              <button
                type="button"
                onClick={() => handleScoreBall(1)}
                className="py-3 rounded-xl bg-[#242a3a] hover:bg-[#2f3445] text-[#dde2f8] border border-[#2f3445]"
              >
                1
              </button>
              <button
                type="button"
                onClick={() => handleScoreBall(2)}
                className="py-3 rounded-xl bg-[#242a3a] hover:bg-[#2f3445] text-[#dde2f8] border border-[#2f3445]"
              >
                2
              </button>
              <button
                type="button"
                onClick={() => handleScoreBall(3)}
                className="py-3 rounded-xl bg-[#242a3a] hover:bg-[#2f3445] text-[#dde2f8] border border-[#2f3445]"
              >
                3
              </button>
              <button
                type="button"
                onClick={() => handleScoreBall(4)}
                className="py-3 rounded-xl bg-[#3198dc]/20 hover:bg-[#3198dc]/30 text-[#93ccff] border border-[#3198dc]/40"
              >
                4 (FOUR)
              </button>
              <button
                type="button"
                onClick={() => handleScoreBall(6)}
                className="py-3 rounded-xl bg-[#ffb95f]/20 hover:bg-[#ffb95f]/30 text-[#ffb95f] border border-[#ffb95f]/40"
              >
                6 (SIX)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (availableNextBatters.length > 0) {
                    setSelectedNextBatterIndex(availableNextBatters[0].originalIndex);
                  }
                  setIsWicketModalOpen(true);
                }}
                className="py-3 rounded-xl bg-[#ffb4ab]/20 hover:bg-[#ffb4ab]/30 text-[#ffb4ab] border border-[#ffb4ab]/40 col-span-2 sm:col-span-1"
              >
                WICKET!
              </button>
            </div>

            {/* Extras Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs font-bold pt-2 border-t border-[#242a3a]">
              <button
                type="button"
                onClick={() => handleScoreBall(0, false, 'wd', 0)}
                className="py-2.5 rounded-lg bg-[#080e1d] hover:bg-[#191f2f] text-[#ffb95f] border border-[#2f3445]"
              >
                + Wide (1wd)
              </button>
              <button
                type="button"
                onClick={() => handleScoreBall(0, false, 'nb', 0)}
                className="py-2.5 rounded-lg bg-[#080e1d] hover:bg-[#191f2f] text-[#ffb95f] border border-[#2f3445]"
              >
                + No Ball (1nb)
              </button>
              <button
                type="button"
                onClick={() => handleScoreBall(1, false, 'lb', 0)}
                className="py-2.5 rounded-lg bg-[#080e1d] hover:bg-[#191f2f] text-[#93ccff] border border-[#2f3445]"
              >
                + Leg Bye (1lb)
              </button>
              <button
                type="button"
                onClick={() => handleScoreBall(1, false, 'b', 0)}
                className="py-2.5 rounded-lg bg-[#080e1d] hover:bg-[#191f2f] text-[#93ccff] border border-[#2f3445]"
              >
                + Bye (1b)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WICKET & NEXT BATTER SELECTION MODAL */}
      {isWicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#151b2b] border border-[#2f3445] rounded-xl p-5 w-full max-w-md flex flex-col gap-4 text-xs">
            <h3 className="font-bold text-sm text-[#ffb4ab] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">gavel</span>
              <span>Record Wicket & Select Next Batter</span>
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#bbcabf] font-semibold">Dismissal Type</label>
              <select
                value={selectedWicketType}
                onChange={(e) => setSelectedWicketType(e.target.value)}
                className="h-9 px-3 bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8] outline-none"
              >
                <option value="Bowled">Bowled</option>
                <option value="Caught">Caught</option>
                <option value="LBW">LBW</option>
                <option value="Run Out">Run Out</option>
                <option value="Stumped">Stumped</option>
                <option value="Hit Wicket">Hit Wicket</option>
              </select>
            </div>

            {/* Select Next Batter Option */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-[#242a3a]">
              <label className="text-[#4edea3] font-bold flex items-center justify-between">
                <span>Select Next Incoming Batter:</span>
                <span className="text-[10px] text-[#bbcabf]">({availableNextBatters.length} Available)</span>
              </label>

              {availableNextBatters.length === 0 ? (
                <div className="p-3 bg-[#080e1d] rounded border border-[#2f3445] text-[#ffb4ab] text-center font-bold">
                  All 11 batters have batted (Innings Concluded).
                </div>
              ) : (
                <select
                  value={selectedNextBatterIndex}
                  onChange={(e) => setSelectedNextBatterIndex(Number(e.target.value))}
                  className="h-9 px-3 bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8] outline-none font-bold"
                >
                  {availableNextBatters.map((b) => (
                    <option key={b.id} value={b.originalIndex}>
                      #{b.number} {b.name} ({b.hand})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#242a3a]">
              <button
                type="button"
                onClick={() => setIsWicketModalOpen(false)}
                className="h-8 px-3 rounded bg-[#242a3a] text-[#bbcabf]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsWicketModalOpen(false);
                  handleScoreBall(0, true, 'none', 0, selectedNextBatterIndex >= 0 ? selectedNextBatterIndex : undefined);
                }}
                className="h-8 px-4 rounded bg-[#ffb4ab] text-[#600004] font-bold"
              >
                Confirm Wicket & Bring In Batter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE BOWLER MODAL */}
      {isChangeBowlerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#151b2b] border border-[#2f3445] rounded-xl p-5 w-full max-w-sm flex flex-col gap-4 text-xs">
            <h3 className="font-bold text-sm text-[#4edea3] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">sports_cricket</span>
              <span>Select Next Bowler for New Over</span>
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#bbcabf]">Enter or Select Bowler Name</label>
              <input
                type="text"
                value={newBowlerInputName}
                onChange={(e) => setNewBowlerInputName(e.target.value)}
                placeholder="e.g. Opponent Bowler 2"
                className="h-9 px-3 bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8] outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {liveBowlers.map((bw) => (
                <button
                  key={bw.id}
                  type="button"
                  onClick={() => setNewBowlerInputName(bw.name)}
                  className="px-2.5 py-1 rounded bg-[#080e1d] border border-[#2f3445] text-[11px] text-[#dde2f8] hover:border-[#4edea3]"
                >
                  {bw.name} ({bw.overs}ov)
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#242a3a]">
              <button
                type="button"
                onClick={() => setIsChangeBowlerOpen(false)}
                className="h-8 px-3 rounded bg-[#242a3a] text-[#bbcabf]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmChangeBowler}
                className="h-8 px-4 rounded bg-[#4edea3] text-[#003824] font-bold"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
