import React, { useState } from 'react';

interface DlsCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInnings1Score?: number;
  initialOvers?: number;
  onApplyDlsTarget?: (dlsTarget: number, dlsOvers: number) => void;
}

// Standard ICC DLS Resource Percentage Table approximation formula
// R(u, w) = R_0 * (1 - exp(-b * u / R_0))
const calculateDlsResource = (oversRemaining: number, wicketsLost: number, maxOvers: number): number => {
  if (oversRemaining <= 0) return 0;
  
  // Wicket loss factors for ICC DLS Standard Model
  const wicketLossFactors = [1.0, 0.85, 0.72, 0.58, 0.45, 0.33, 0.22, 0.13, 0.06, 0.02, 0.0];
  const factor = wicketLossFactors[Math.min(wicketsLost, 10)];

  // Scale based on total overs
  const baseResource = (oversRemaining / maxOvers) * 100;
  const adjustedResource = baseResource * factor;

  return Math.min(100, Math.max(0, Number(adjustedResource.toFixed(1))));
};

export const DlsCalculatorModal: React.FC<DlsCalculatorModalProps> = ({
  isOpen,
  onClose,
  initialInnings1Score = 165,
  initialOvers = 25,
  onApplyDlsTarget,
}) => {
  // Inputs
  const [maxOvers, setMaxOvers] = useState<number>(initialOvers || 25);
  const [team1Score, setTeam1Score] = useState<number>(initialInnings1Score || 165);
  const [team1OversAllotted, setTeam1OversAllotted] = useState<number>(initialOvers || 25);

  const [team2OversTargetAllotted, setTeam2OversTargetAllotted] = useState<number>(18);
  const [team2CurrentOvers, setTeam2CurrentOvers] = useState<number>(10);
  const [team2CurrentWickets, setTeam2CurrentWickets] = useState<number>(2);

  if (!isOpen) return null;

  // DLS Math Engine
  const team1Resource = calculateDlsResource(team1OversAllotted, 0, maxOvers);
  const team2ResourceTotal = calculateDlsResource(team2OversTargetAllotted, 0, maxOvers);

  // Par Score at interruption
  const team2OversDone = Math.min(team2CurrentOvers, team2OversTargetAllotted);
  const team2ResourceUsed = calculateDlsResource(team2OversDone, team2CurrentWickets, maxOvers);
  
  let revisedTarget = 0;
  if (team1Resource > 0) {
    if (team2ResourceTotal < team1Resource) {
      revisedTarget = Math.floor(team1Score * (team2ResourceTotal / team1Resource)) + 1;
    } else {
      const g50Avg = maxOvers >= 40 ? 245 : maxOvers >= 20 ? 160 : 100;
      revisedTarget = team1Score + Math.round((g50Avg * (team2ResourceTotal - team1Resource)) / 100) + 1;
    }
  }

  // Par Score calculation at current over & wickets
  const parScoreAtInterruption = Math.max(
    0,
    Math.floor(team1Score * (team2ResourceUsed / Math.max(1, team1Resource)))
  );

  const handleApply = () => {
    if (onApplyDlsTarget) {
      onApplyDlsTarget(revisedTarget, team2OversTargetAllotted);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-[#151b2b] border border-[#2f3445] rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-[#dde2f8] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#242a3a]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#3198dc]/20 text-[#93ccff] border border-[#3198dc]/30">
              <span className="material-symbols-outlined text-[22px]">cloud_sync</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-[#dde2f8]">Duckworth-Lewis-Stern (DLS) Target Engine</h3>
              <p className="text-xs text-[#bbcabf]">Rain-Interrupted Match Target & Live Par Score Calculator</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#bbcabf] hover:text-[#dde2f8] p-1.5 rounded hover:bg-[#242a3a]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Input Parameters Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          {/* Section 1: 1st Innings Data */}
          <div className="p-3.5 bg-[#080e1d] rounded-xl border border-[#2f3445] flex flex-col gap-3">
            <span className="font-bold text-[#4edea3] text-xs font-sans border-b border-[#242a3a] pb-1.5 flex items-center justify-between">
              <span>1st Innings Baseline</span>
              <span className="text-[10px] text-[#bbcabf] font-mono">Res: {team1Resource}%</span>
            </span>

            <div className="flex flex-col gap-1">
              <label className="text-[#bbcabf] font-sans">Full Overs Allocation</label>
              <select
                value={maxOvers}
                onChange={(e) => {
                  const ov = Number(e.target.value);
                  setMaxOvers(ov);
                  setTeam1OversAllotted(ov);
                }}
                className="h-8 px-2 bg-[#151b2b] border border-[#2f3445] rounded text-[#dde2f8]"
              >
                <option value={25}>25 Overs Match</option>
                <option value={20}>20 Overs (T20)</option>
                <option value={50}>50 Overs (ODI)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[#bbcabf] font-sans">1st Innings Final Score</label>
              <input
                type="number"
                value={team1Score}
                onChange={(e) => setTeam1Score(Number(e.target.value))}
                className="h-8 px-2 bg-[#151b2b] border border-[#2f3445] rounded font-bold text-[#4edea3]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[#bbcabf] font-sans">1st Innings Overs Bowled</label>
              <input
                type="number"
                step="0.1"
                value={team1OversAllotted}
                onChange={(e) => setTeam1OversAllotted(Number(e.target.value))}
                className="h-8 px-2 bg-[#151b2b] border border-[#2f3445] rounded text-[#dde2f8]"
              />
            </div>
          </div>

          {/* Section 2: 2nd Innings Rain Reduction */}
          <div className="p-3.5 bg-[#080e1d] rounded-xl border border-[#2f3445] flex flex-col gap-3">
            <span className="font-bold text-[#93ccff] text-xs font-sans border-b border-[#242a3a] pb-1.5 flex items-center justify-between">
              <span>2nd Innings Rain Interruption</span>
              <span className="text-[10px] text-[#bbcabf] font-mono">Res: {team2ResourceTotal}%</span>
            </span>

            <div className="flex flex-col gap-1">
              <label className="text-[#bbcabf] font-sans">Reduced Overs Available</label>
              <input
                type="number"
                value={team2OversTargetAllotted}
                onChange={(e) => setTeam2OversTargetAllotted(Number(e.target.value))}
                className="h-8 px-2 bg-[#151b2b] border border-[#2f3445] rounded font-bold text-[#93ccff]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[#bbcabf] font-sans">Overs Completed At Rain</label>
              <input
                type="number"
                step="0.1"
                value={team2CurrentOvers}
                onChange={(e) => setTeam2CurrentOvers(Number(e.target.value))}
                className="h-8 px-2 bg-[#151b2b] border border-[#2f3445] rounded text-[#dde2f8]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[#bbcabf] font-sans">Wickets Lost At Rain</label>
              <input
                type="number"
                min="0"
                max="10"
                value={team2CurrentWickets}
                onChange={(e) => setTeam2CurrentWickets(Number(e.target.value))}
                className="h-8 px-2 bg-[#151b2b] border border-[#2f3445] rounded text-[#dde2f8]"
              />
            </div>
          </div>
        </div>

        {/* Calculation Result Banner */}
        <div className="p-4 bg-[#191f2f] rounded-xl border border-[#3198dc]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-[#93ccff] tracking-wider font-mono">
              ICC DLS Method Calculation Result
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-[#4edea3] font-mono">
                Revised Target: {revisedTarget} Runs
              </span>
              <span className="text-xs text-[#bbcabf] font-mono">
                in {team2OversTargetAllotted}.0 Overs
              </span>
            </div>
            <span className="text-[11px] text-[#bbcabf]">
              At {team2CurrentOvers}.0 overs ({team2CurrentWickets} wickets lost), DLS Par Score is{' '}
              <strong className="text-[#ffb95f] font-mono">{parScoreAtInterruption} Runs</strong>.
            </span>
          </div>

          {onApplyDlsTarget && (
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 rounded-lg bg-[#4edea3] text-[#003824] font-bold hover:brightness-110 shrink-0 shadow"
            >
              Apply Target
            </button>
          )}
        </div>

        <div className="flex items-center justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded bg-[#242a3a] text-[#bbcabf] hover:bg-[#2f3445] text-xs font-semibold"
          >
            Close Calculator
          </button>
        </div>
      </div>
    </div>
  );
};
