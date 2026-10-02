import React, { useState } from 'react';
import { Player, PastMatchLog, MatchCategory } from '../types/cricket';

interface QuickPastMatchLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  onAddPastMatchLog: (playerId: string, log: PastMatchLog) => void;
}

export const QuickPastMatchLogModal: React.FC<QuickPastMatchLogModalProps> = ({
  isOpen,
  onClose,
  player,
  onAddPastMatchLog,
}) => {
  if (!isOpen || !player) return null;

  const [opponent, setOpponent] = useState('Royal Strikers CC');
  const [matchCategory, setMatchCategory] = useState<MatchCategory>('Practice');
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);

  // Batting Stats
  const [didBat, setDidBat] = useState(true);
  const [runsScored, setRunsScored] = useState(38);
  const [ballsFaced, setBallsFaced] = useState(24);
  const [fours, setFours] = useState(4);
  const [sixes, setSixes] = useState(2);
  const [isNotOut, setIsNotOut] = useState(false);

  // Bowling Stats
  const [didBowl, setDidBowl] = useState(player.role === 'PACE SPEC' || player.role === 'SPIN SPEC' || player.role === 'ALL-RND');
  const [oversBowled, setOversBowled] = useState(4.0);
  const [maidens, setMaidens] = useState(0);
  const [runsConceded, setRunsConceded] = useState(28);
  const [wicketsTaken, setWicketsTaken] = useState(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const log: PastMatchLog = {
      id: `log-${Date.now()}`,
      opponent,
      date: matchDate,
      category: matchCategory,
      ...(didBat
        ? {
            runsScored: Number(runsScored),
            ballsFaced: Number(ballsFaced),
            fours: Number(fours),
            sixes: Number(sixes),
            isNotOut,
          }
        : {}),
      ...(didBowl
        ? {
            oversBowled: Number(oversBowled),
            maidens: Number(maidens),
            runsConceded: Number(runsConceded),
            wicketsTaken: Number(wicketsTaken),
          }
        : {}),
    };

    onAddPastMatchLog(player.id, log);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#151b2b] border border-[#2f3445] rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-5 text-xs text-[#dde2f8]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#242a3a]">
          <div className="flex items-center gap-2.5">
            <img src={player.photoUrl} alt={player.name} className="w-10 h-10 rounded-lg object-cover ring-1 ring-[#4edea3]" />
            <div>
              <h2 className="font-bold text-base text-[#dde2f8]">Quick Log Past Match Stats</h2>
              <p className="text-[11px] text-[#bbcabf]">Record individual match figures for {player.name} without full scorecard</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#bbcabf] hover:text-[#dde2f8] hover:bg-[#242a3a]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Match Context */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#080e1d] p-3.5 rounded-xl border border-[#2f3445]">
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[10px] uppercase font-bold text-[#bbcabf]">Opponent Team</label>
              <input
                type="text"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="Opponent name"
                className="h-8 px-2.5 bg-[#191f2f] border border-[#2f3445] rounded-lg text-xs text-[#dde2f8] outline-none focus:border-[#4edea3]"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-[#bbcabf]">Match Type</label>
              <select
                value={matchCategory}
                onChange={(e) => setMatchCategory(e.target.value as MatchCategory)}
                className="h-8 px-2 bg-[#191f2f] border border-[#2f3445] rounded-lg text-xs text-[#dde2f8] outline-none"
              >
                <option value="Practice">Practice</option>
                <option value="Tournament">Tournament</option>
                <option value="Friendly">Friendly</option>
                <option value="Bilateral">Bilateral</option>
              </select>
            </div>
          </div>

          {/* Batting Input Section */}
          <div className="p-3.5 bg-[#080e1d] rounded-xl border border-[#2f3445] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#4edea3] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">sports_cricket</span>
                <span>Batting Performance</span>
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-[#bbcabf]">
                <input
                  type="checkbox"
                  checked={didBat}
                  onChange={(e) => setDidBat(e.target.checked)}
                  className="accent-[#4edea3]"
                />
                <span>Player Batted</span>
              </label>
            </div>

            {didBat && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono pt-1">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#bbcabf] font-sans">Runs</label>
                  <input
                    type="number"
                    min="0"
                    value={runsScored}
                    onChange={(e) => setRunsScored(Number(e.target.value))}
                    className="h-8 px-2 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#dde2f8] font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#bbcabf] font-sans">Balls</label>
                  <input
                    type="number"
                    min="1"
                    value={ballsFaced}
                    onChange={(e) => setBallsFaced(Number(e.target.value))}
                    className="h-8 px-2 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#dde2f8]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#bbcabf] font-sans">4s</label>
                  <input
                    type="number"
                    min="0"
                    value={fours}
                    onChange={(e) => setFours(Number(e.target.value))}
                    className="h-8 px-2 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#dde2f8]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#bbcabf] font-sans">6s</label>
                  <input
                    type="number"
                    min="0"
                    value={sixes}
                    onChange={(e) => setSixes(Number(e.target.value))}
                    className="h-8 px-2 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#ffb95f]"
                  />
                </div>
                <div className="flex flex-col gap-1 col-span-2 sm:col-span-1 justify-end">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-[#4edea3] h-8 bg-[#191f2f] px-2 rounded border border-[#2f3445]">
                    <input
                      type="checkbox"
                      checked={isNotOut}
                      onChange={(e) => setIsNotOut(e.target.checked)}
                      className="accent-[#4edea3]"
                    />
                    <span>Not Out*</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Bowling Input Section */}
          <div className="p-3.5 bg-[#080e1d] rounded-xl border border-[#2f3445] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#93ccff] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">sports_baseball</span>
                <span>Bowling Performance</span>
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-[#bbcabf]">
                <input
                  type="checkbox"
                  checked={didBowl}
                  onChange={(e) => setDidBowl(e.target.checked)}
                  className="accent-[#3198dc]"
                />
                <span>Player Bowled</span>
              </label>
            </div>

            {didBowl && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono pt-1">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#bbcabf] font-sans">Overs</label>
                  <input
                    type="number"
                    step="0.1"
                    value={oversBowled}
                    onChange={(e) => setOversBowled(Number(e.target.value))}
                    className="h-8 px-2 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#dde2f8]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#bbcabf] font-sans">Maidens</label>
                  <input
                    type="number"
                    value={maidens}
                    onChange={(e) => setMaidens(Number(e.target.value))}
                    className="h-8 px-2 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#dde2f8]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#bbcabf] font-sans">Runs Conceded</label>
                  <input
                    type="number"
                    value={runsConceded}
                    onChange={(e) => setRunsConceded(Number(e.target.value))}
                    className="h-8 px-2 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#dde2f8]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#bbcabf] font-sans">Wickets Taken</label>
                  <input
                    type="number"
                    value={wicketsTaken}
                    onChange={(e) => setWicketsTaken(Number(e.target.value))}
                    className="h-8 px-2 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#4edea3] font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg bg-[#242a3a] text-[#dde2f8] font-semibold hover:bg-[#2f3445]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-5 rounded-lg bg-[#4edea3] text-[#003824] font-bold shadow hover:brightness-110 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">add_task</span>
              <span>Log Past Match Performance</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
