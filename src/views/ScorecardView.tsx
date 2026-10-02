import React, { useState, useEffect } from 'react';
import { BatterScore, BowlerScore, MatchSummary } from '../types/cricket';
import { MatchQuickStatsWidget } from '../components/MatchQuickStatsWidget';
import { DlsCalculatorModal } from '../components/DlsCalculatorModal';

interface ScorecardViewProps {
  match: MatchSummary;
  batters: BatterScore[];
  setBatters: React.Dispatch<React.SetStateAction<BatterScore[]>>;
  bowlers: BowlerScore[];
  setBowlers: React.Dispatch<React.SetStateAction<BowlerScore[]>>;
  onFinalizeMatch: () => void;
  onClearScorecard: () => void;
  onShowToast: (msg: string) => void;
}

export const ScorecardView: React.FC<ScorecardViewProps> = ({
  match,
  batters,
  setBatters,
  bowlers,
  setBowlers,
  onFinalizeMatch,
  onClearScorecard,
  onShowToast,
}) => {
  const [activeInnings, setActiveInnings] = useState<1 | 2>(1);
  const [activePitch, setActivePitch] = useState<string>('Dry / Spin Track');
  const [penaltyAdj, setPenaltyAdj] = useState<number>(0);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('Draft saved just now');
  const [isDlsModalOpen, setIsDlsModalOpen] = useState<boolean>(false);

  // Extras - default to 0 for active/fresh matches, or demo extras for demo match
  const [extras, setExtras] = useState(() =>
    match.id === 'M06' ? { b: 1, lb: 4, w: 7, nb: 2 } : { b: 0, lb: 0, w: 0, nb: 0 }
  );

  // Sync extras whenever match ID changes
  useEffect(() => {
    if (match.id === 'M06') {
      setExtras({ b: 1, lb: 4, w: 7, nb: 2 });
    } else {
      setExtras({ b: 0, lb: 0, w: 0, nb: 0 });
      setPenaltyAdj(0);
    }
  }, [match.id]);

  const totalBatterRuns = batters.reduce((sum, b) => sum + (Number(b.runs) || 0), 0);
  const totalExtras = extras.b + extras.lb + extras.w + extras.nb + penaltyAdj;
  const grandTotal = totalBatterRuns + totalExtras;
  const wicketsCount = batters.filter((b) => !b.isNotOut && b.dismissal !== 'Yet to Bat').length;

  // Dynamic overs calculation from bowling figures
  const totalOversBowled = bowlers.reduce((sum, bw) => sum + (Number(bw.overs) || 0), 0);
  const currentRunRate = totalOversBowled > 0 ? Number((grandTotal / totalOversBowled).toFixed(2)) : 0.0;

  const pitchProfiles = [
    { id: 'Dry / Spin Track', label: 'Dry / Spin Track', icon: 'grain' },
    { id: 'Green / Pace Track', label: 'Green / Pace Track', icon: 'grass' },
    { id: 'Flat / Batting Track', label: 'Flat / Batting Track', icon: 'straighten' },
    { id: 'Damp / Low Bounce', label: 'Damp / Low Bounce', icon: 'water_drop' },
  ];

  const handleResetScorecard = () => {
    setExtras({ b: 0, lb: 0, w: 0, nb: 0 });
    setPenaltyAdj(0);
    onClearScorecard();
  };

  const handleBatterChange = (id: string, field: keyof BatterScore, val: any) => {
    setBatters((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const updated = { ...b, [field]: val };
          if (field === 'runs' || field === 'balls' || field === 'fours' || field === 'sixes') {
            const runs = field === 'runs' ? Number(val) : b.runs;
            const balls = field === 'balls' ? Number(val) : b.balls;
            const fours = field === 'fours' ? Number(val) : b.fours;
            const sixes = field === 'sixes' ? Number(val) : b.sixes;
            updated.sr = balls > 0 ? Number(((runs / balls) * 100).toFixed(1)) : 0;
            if (balls > 0) {
              const boundaryRuns = (fours * 4) + (sixes * 6);
              updated.boundaryPct = Number(((boundaryRuns / (runs || 1)) * 100).toFixed(1));
            }
          }
          return updated;
        }
        return b;
      })
    );
    setSaveStatus('Draft saved just now');
  };

  const handleBowlerChange = (id: string, field: keyof BowlerScore, val: any) => {
    setBowlers((prev) =>
      prev.map((bw) => {
        if (bw.id === id) {
          const updated = { ...bw, [field]: val };
          if (field === 'runs' || field === 'overs') {
            const overs = field === 'overs' ? Number(val) : bw.overs;
            const runs = field === 'runs' ? Number(val) : bw.runs;
            updated.economy = overs > 0 ? Number((runs / overs).toFixed(2)) : 0;
          }
          return updated;
        }
        return bw;
      })
    );
    setSaveStatus('Draft saved just now');
  };

  const handleAddGuestPlayer = () => {
    const newNum = batters.length + 1;
    const newGuest: BatterScore = {
      id: `guest-${Date.now()}`,
      number: newNum,
      name: `Batter #${newNum}`,
      hand: 'RHB',
      dismissal: 'Yet to Bat',
      isNotOut: true,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      sr: 0,
      boundaryPct: 0,
      dotPct: 0,
    };
    setBatters([...batters, newGuest]);
    onShowToast(`Added new Batter #${newNum} to scorecard!`);
  };

  const handleRemoveBatter = (id: string) => {
    setBatters((prev) => prev.filter((b) => b.id !== id));
    onShowToast('Removed batter from scorecard.');
  };

  const handleAddBowler = () => {
    const newNum = bowlers.length + 1;
    const newBowler: BowlerScore = {
      id: `bw-${Date.now()}`,
      name: `Bowler #${newNum}`,
      style: 'Right-Arm Medium',
      overs: 0,
      maidens: 0,
      runs: 0,
      wickets: 0,
      economy: 0,
      dots: 0,
      quotaMax: 5.0,
      state: 'Available',
      colorTag: 'blue',
    };
    setBowlers([...bowlers, newBowler]);
    onShowToast(`Added Bowler #${newNum} to scorecard!`);
  };

  const handleRemoveBowler = (id: string) => {
    setBowlers((prev) => prev.filter((b) => b.id !== id));
    onShowToast('Removed bowler from bowling scorecard.');
  };

  return (
    <div className="flex flex-col w-full gap-6 pb-24 text-[#dde2f8]">
      {/* MATCH QUICK-STATS WIDGET */}
      <MatchQuickStatsWidget
        match={match}
        batters={batters}
        bowlers={bowlers}
        grandTotal={grandTotal}
        wicketsCount={wicketsCount}
      />

      {/* MATCH HEADER CARD */}
      <div className="flex flex-col gap-4 bg-[#151b2b] border border-[#2f3445] rounded-xl p-5 shadow-lg">
        {/* Top Info */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap text-xs text-[#bbcabf]">
              <span className="px-2.5 py-0.5 rounded bg-[#10b981]/20 text-[#4edea3] font-bold uppercase tracking-wider">
                {match.round}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#242a3a] text-[#93ccff] font-bold text-[10px] uppercase">
                {match.category || 'Practice'} Match
              </span>
              <span>•</span>
              <span>{match.date}</span>
              <span>•</span>
              <span>{match.venue}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#dde2f8]">
              {match.team1} <span className="text-[#bbcabf] font-normal">vs</span> {match.team2}
            </h1>
          </div>

          {/* Toss & Format & Reset Scorecard */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-[#191f2f] border border-[#2f3445] text-[#ffb95f] font-medium flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">monetization_on</span>
              <span>Toss: {match.toss}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsDlsModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[#3198dc]/20 text-[#93ccff] hover:bg-[#3198dc]/30 border border-[#3198dc]/40 font-semibold flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">cloud_sync</span>
              <span>DLS Target Engine</span>
            </button>
            <button
              type="button"
              onClick={handleResetScorecard}
              className="px-3 py-1.5 rounded-lg bg-[#242a3a] text-[#ffb4ab] hover:bg-[#ffb4ab]/20 border border-[#ffb4ab]/30 font-semibold flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Reset Scorecard</span>
            </button>
          </div>
        </div>

        {/* Tactical Notes / Pre-game Strategy */}
        {match.tacticalNotes && (
          <div className="p-3 bg-[#191f2f] border border-[#2f3445] rounded-lg text-xs flex flex-col gap-1">
            <div className="flex items-center gap-1.5 font-bold text-[#4edea3]">
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              <span>Match Remarks & Pre-Game Tactical Strategy</span>
            </div>
            <p className="text-[#dde2f8] font-sans leading-relaxed">{match.tacticalNotes}</p>
          </div>
        )}

        {/* Pitch Profiles & Metrics */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 border-t border-[#242a3a]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#bbcabf] font-semibold mr-1">Pitch Profile:</span>
            {pitchProfiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setActivePitch(p.id);
                  onShowToast(`Selected pitch profile: ${p.label}`);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activePitch === p.id
                    ? 'bg-[#10b981] text-[#003824] shadow font-bold'
                    : 'bg-[#191f2f] text-[#bbcabf] hover:text-[#dde2f8] border border-[#2f3445]'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-[#bbcabf]">
            <div>DLS Par: <strong className="text-[#dde2f8]">{match.dlsPar}</strong></div>
            <div className="h-3 w-px bg-[#2f3445]"></div>
            <div>Bowler Quota: <strong className="text-[#4edea3]">{match.maxBowlerQuota.toFixed(1)} Overs Max</strong></div>
          </div>
        </div>

        {/* Innings Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setActiveInnings(1)}
            className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
              activeInnings === 1
                ? 'bg-[#191f2f] border-[#4edea3] shadow-md'
                : 'bg-[#080e1d] border-[#2f3445] hover:bg-[#151b2b]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-[#4edea3]"></span>
              <div>
                <div className="font-bold text-sm text-[#dde2f8]">1st Innings: {match.team1}</div>
                <div className="text-xs text-[#4edea3]">{match.result}</div>
              </div>
            </div>
            <div className="text-right font-mono">
              <div className="text-lg font-bold text-[#4edea3]">{grandTotal}/{wicketsCount}</div>
              <div className="text-[11px] text-[#bbcabf]">
                {totalOversBowled.toFixed(1)} Ov ({currentRunRate.toFixed(2)})
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveInnings(2)}
            className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
              activeInnings === 2
                ? 'bg-[#191f2f] border-[#93ccff] shadow-md'
                : 'bg-[#080e1d] border-[#2f3445] hover:bg-[#151b2b]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-[#93ccff]"></span>
              <div>
                <div className="font-bold text-sm text-[#dde2f8]">2nd Innings: {match.team2}</div>
                <div className="text-xs text-[#bbcabf]">Target: {grandTotal + 1} Runs</div>
              </div>
            </div>
            <div className="text-right font-mono">
              <div className="text-lg font-bold text-[#dde2f8]">{match.team2Score || '0/0'}</div>
              <div className="text-[11px] text-[#bbcabf]">{match.team2Overs || '0.0'} Ov</div>
            </div>
          </button>
        </div>
      </div>

      {/* BATTING SCORECARD */}
      <div className="flex flex-col bg-[#151b2b] border border-[#2f3445] rounded-xl shadow-lg overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 bg-[#191f2f] gap-3 border-b border-[#2f3445]">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#4edea3] text-[22px]">sports_cricket</span>
            <div>
              <h2 className="font-bold text-sm text-[#dde2f8]">{activeInnings === 1 ? match.team1 : match.team2} Batting Order</h2>
              <p className="text-xs text-[#bbcabf]">{activeInnings}st Innings • 25 Overs Allocation</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddGuestPlayer}
            className="h-8 px-3 rounded-lg bg-[#242a3a] text-[#4edea3] hover:bg-[#2f3445] font-semibold text-xs flex items-center gap-1.5 transition-colors border border-[#10b981]/30 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>+ Add Batter</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#080e1d] text-[#bbcabf] font-semibold uppercase text-[10px] border-b border-[#2f3445]">
                <th className="py-2.5 px-3 w-8 text-center">#</th>
                <th className="py-2.5 px-3 min-w-[150px]">Batter</th>
                <th className="py-2.5 px-3 min-w-[140px]">Dismissal Mode</th>
                <th className="py-2.5 px-2 text-right">Runs</th>
                <th className="py-2.5 px-2 text-right">Balls</th>
                <th className="py-2.5 px-2 text-right">4s</th>
                <th className="py-2.5 px-2 text-right">6s</th>
                <th className="py-2.5 px-2 text-right text-[#4edea3]">SR</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2f3445] font-mono">
              {batters.map((b) => (
                <tr key={b.id} className="hover:bg-[#191f2f]/60 transition-colors">
                  <td className="py-2.5 px-3 text-center text-[#bbcabf]">{b.number}</td>
                  <td className="py-2.5 px-3 font-sans font-semibold text-[#dde2f8]">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={b.name}
                        onChange={(e) => handleBatterChange(b.id, 'name', e.target.value)}
                        className="w-full px-2 py-0.5 bg-[#080e1d] border border-[#2f3445] rounded text-xs text-[#dde2f8]"
                      />
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span>{b.name}</span>
                        {b.isWk && <span className="px-1 py-0.2 rounded bg-[#3198dc]/20 text-[#93ccff] text-[9px] font-bold">WK</span>}
                        {b.isPotm && <span className="px-1 py-0.2 rounded bg-[#ffb95f]/20 text-[#ffb95f] text-[9px] font-bold">★ POTM</span>}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={b.dismissal}
                        onChange={(e) => handleBatterChange(b.id, 'dismissal', e.target.value)}
                        className="w-full px-2 py-0.5 bg-[#080e1d] border border-[#2f3445] rounded text-xs text-[#bbcabf]"
                      />
                    ) : (
                      <span className={b.isNotOut ? 'text-[#4edea3] font-semibold' : 'text-[#bbcabf]'}>
                        {b.dismissal}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold text-[#dde2f8]">
                    {isEditMode ? (
                      <input
                        type="number"
                        min="0"
                        value={b.runs}
                        onChange={(e) => handleBatterChange(b.id, 'runs', e.target.value)}
                        className="w-12 h-6 px-1 bg-[#080e1d] text-right text-[#4edea3] font-bold border border-[#2f3445] rounded outline-none"
                      />
                    ) : (
                      b.runs
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right text-[#bbcabf]">
                    {isEditMode ? (
                      <input
                        type="number"
                        min="0"
                        value={b.balls}
                        onChange={(e) => handleBatterChange(b.id, 'balls', e.target.value)}
                        className="w-12 h-6 px-1 bg-[#080e1d] text-right text-[#dde2f8] border border-[#2f3445] rounded outline-none"
                      />
                    ) : (
                      b.balls
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right text-[#bbcabf]">
                    {isEditMode ? (
                      <input
                        type="number"
                        min="0"
                        value={b.fours}
                        onChange={(e) => handleBatterChange(b.id, 'fours', e.target.value)}
                        className="w-10 h-6 px-1 bg-[#080e1d] text-right border border-[#2f3445] rounded outline-none"
                      />
                    ) : (
                      b.fours
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right text-[#bbcabf]">
                    {isEditMode ? (
                      <input
                        type="number"
                        min="0"
                        value={b.sixes}
                        onChange={(e) => handleBatterChange(b.id, 'sixes', e.target.value)}
                        className="w-10 h-6 px-1 bg-[#080e1d] text-right border border-[#2f3445] rounded outline-none"
                      />
                    ) : (
                      b.sixes
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right text-[#4edea3] font-bold">{b.sr.toFixed(1)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveBatter(b.id)}
                      className="text-[#bbcabf] hover:text-[#ffb4ab] p-0.5"
                      title="Delete batter"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Extras & Total Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between px-5 py-3.5 bg-[#191f2f] gap-4 border-t border-[#2f3445]">
          <div className="flex items-center gap-3 flex-wrap text-xs">
            <span className="font-bold text-[#dde2f8]">
              Extras: {totalExtras} (b {extras.b}, lb {extras.lb}, w {extras.w}, nb {extras.nb})
            </span>
            <div className="flex items-center gap-1.5 ml-2">
              <label className="text-[#bbcabf]">Penalty Adj:</label>
              <input
                type="number"
                value={penaltyAdj}
                onChange={(e) => setPenaltyAdj(Number(e.target.value))}
                className="w-12 h-6 px-1 bg-[#080e1d] text-[#dde2f8] text-center rounded border border-[#2f3445] text-xs outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 self-start md:self-auto font-mono">
            <div className="text-right">
              <span className="text-[10px] text-[#bbcabf] block uppercase font-semibold">Score</span>
              <span className="text-2xl text-[#4edea3] font-bold">{grandTotal}/{wicketsCount}</span>
            </div>
            <div className="text-left border-l border-[#2f3445] pl-3">
              <span className="text-xs text-[#dde2f8] font-bold block">{totalOversBowled.toFixed(1)} Ov</span>
              <span className="text-xs text-[#ffb95f]">RR: {currentRunRate.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOWLING SCORECARD */}
      <div className="flex flex-col bg-[#151b2b] border border-[#2f3445] rounded-xl shadow-lg overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 bg-[#191f2f] gap-3 border-b border-[#2f3445]">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#93ccff] text-[22px]">sports_baseball</span>
            <div>
              <h2 className="font-bold text-sm text-[#dde2f8]">Bowling Attack Performance</h2>
              <p className="text-xs text-[#bbcabf]">Opposition Bowlers vs {match.team1}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddBowler}
            className="h-8 px-3 rounded-lg bg-[#242a3a] text-[#93ccff] hover:bg-[#2f3445] font-semibold text-xs flex items-center gap-1.5 transition-colors border border-[#3198dc]/30 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>+ Add Bowler</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#080e1d] text-[#bbcabf] font-semibold uppercase text-[10px] border-b border-[#2f3445]">
                <th className="py-2.5 px-3 min-w-[150px]">Bowler Name</th>
                <th className="py-2.5 px-3">Style</th>
                <th className="py-2.5 px-2 text-right">Overs</th>
                <th className="py-2.5 px-2 text-right">Maidens</th>
                <th className="py-2.5 px-2 text-right">Runs</th>
                <th className="py-2.5 px-2 text-right text-[#4edea3]">Wickets</th>
                <th className="py-2.5 px-2 text-right text-[#93ccff]">Econ</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2f3445] font-mono">
              {bowlers.map((bw) => (
                <tr key={bw.id} className="hover:bg-[#191f2f]/60 transition-colors">
                  <td className="py-2.5 px-3 font-sans font-semibold text-[#dde2f8]">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={bw.name}
                        onChange={(e) => handleBowlerChange(bw.id, 'name', e.target.value)}
                        className="w-full px-2 py-0.5 bg-[#080e1d] border border-[#2f3445] rounded text-xs text-[#dde2f8]"
                      />
                    ) : (
                      bw.name
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-[#bbcabf]">{bw.style}</td>
                  <td className="py-2.5 px-2 text-right text-[#dde2f8]">
                    {isEditMode ? (
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={bw.overs}
                        onChange={(e) => handleBowlerChange(bw.id, 'overs', e.target.value)}
                        className="w-12 h-6 px-1 bg-[#080e1d] text-right border border-[#2f3445] rounded outline-none"
                      />
                    ) : (
                      bw.overs.toFixed(1)
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right text-[#bbcabf]">{bw.maidens}</td>
                  <td className="py-2.5 px-2 text-right text-[#dde2f8]">
                    {isEditMode ? (
                      <input
                        type="number"
                        min="0"
                        value={bw.runs}
                        onChange={(e) => handleBowlerChange(bw.id, 'runs', e.target.value)}
                        className="w-12 h-6 px-1 bg-[#080e1d] text-right border border-[#2f3445] rounded outline-none"
                      />
                    ) : (
                      bw.runs
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold text-[#4edea3]">
                    {isEditMode ? (
                      <input
                        type="number"
                        min="0"
                        value={bw.wickets}
                        onChange={(e) => handleBowlerChange(bw.id, 'wickets', e.target.value)}
                        className="w-10 h-6 px-1 bg-[#080e1d] text-right text-[#4edea3] border border-[#2f3445] rounded outline-none"
                      />
                    ) : (
                      bw.wickets
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right text-[#93ccff] font-bold">{bw.economy.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveBowler(bw.id)}
                      className="text-[#bbcabf] hover:text-[#ffb4ab] p-0.5"
                      title="Delete bowler"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* STICKY ACTION FOOTER */}
      <div className="sticky bottom-0 left-0 right-0 bg-[#080e1d]/95 backdrop-blur-md border-t border-[#2f3445] z-40 px-6 py-3 shadow-2xl flex items-center justify-between gap-4 flex-wrap rounded-xl mt-4">
        <div className="flex items-center gap-2 text-xs text-[#bbcabf]">
          <span className="material-symbols-outlined text-[18px] text-[#4edea3]">cloud_done</span>
          <span>{saveStatus}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIsEditMode(!isEditMode);
              onShowToast(isEditMode ? 'Exited Scorecard Edit Mode' : 'Entered Scorecard Edit Mode — click numbers to modify');
            }}
            className={`h-9 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              isEditMode
                ? 'bg-[#e29100]/20 text-[#ffb95f] border-[#e29100]'
                : 'bg-[#242a3a] text-[#93ccff] border-[#3198dc]/30 hover:bg-[#2f3445]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{isEditMode ? 'lock_open' : 'edit_note'}</span>
            <span>{isEditMode ? 'Editing Mode' : 'Edit Mode'}</span>
          </button>

          <button
            type="button"
            onClick={onFinalizeMatch}
            className="h-9 px-4 rounded-lg bg-[#4edea3] text-[#003824] text-xs font-bold hover:brightness-110 flex items-center gap-1.5 shadow transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">sync_saved_locally</span>
            <span>Finalize & Auto-Sync Stats</span>
          </button>
        </div>
      </div>

      <DlsCalculatorModal
        isOpen={isDlsModalOpen}
        onClose={() => setIsDlsModalOpen(false)}
        initialInnings1Score={grandTotal}
        initialOvers={match.category === 'Practice' ? 25 : 20}
        onApplyDlsTarget={(dlsTarget, dlsOvers) => {
          onShowToast(`Applied DLS Revised Target: ${dlsTarget} runs off ${dlsOvers}.0 overs!`);
        }}
      />
    </div>
  );
};
