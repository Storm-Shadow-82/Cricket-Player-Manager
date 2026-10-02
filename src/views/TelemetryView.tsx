import React, { useState } from 'react';

interface TelemetryViewProps {
  onShowToast: (msg: string) => void;
}

interface StandingRow {
  team: string;
  p: number;
  w: number;
  l: number;
  pts: number;
  nrr: string;
}

const INITIAL_STANDINGS: StandingRow[] = [
  { team: 'Titans CC', p: 6, w: 5, l: 1, pts: 10, nrr: '+1.182' },
  { team: 'Metro Royals CC', p: 6, w: 4, l: 2, pts: 8, nrr: '+0.640' },
  { team: 'Coastal Hurricanes', p: 6, w: 3, l: 3, pts: 6, nrr: '+0.120' },
  { team: 'Kensington Knights', p: 6, w: 0, l: 6, pts: 0, nrr: '-1.942' },
];

const INITIAL_METRICS = {
  groupMeanRunRate: 7.42,
  spinWicketShare: '54.2%',
  boundaryDensity: '1 in 4.9 balls',
  titansPowerIndex: '#1',
};

export const TelemetryView: React.FC<TelemetryViewProps> = ({ onShowToast }) => {
  const [standings, setStandings] = useState<StandingRow[]>(INITIAL_STANDINGS);
  const [metrics, setMetrics] = useState(INITIAL_METRICS);
  const [isCleared, setIsCleared] = useState<boolean>(false);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);

  const handleResetTournamentData = () => {
    setStandings([]);
    setMetrics({
      groupMeanRunRate: 0,
      spinWicketShare: '0.0%',
      boundaryDensity: '0 in 0 balls',
      titansPowerIndex: 'N/A',
    });
    setIsCleared(true);
    setShowConfirmReset(false);
    onShowToast('Removed and reset all present tournament standings & telemetry data!');
  };

  const handleRestoreSampleData = () => {
    setStandings(INITIAL_STANDINGS);
    setMetrics(INITIAL_METRICS);
    setIsCleared(false);
    onShowToast('Restored sample tournament standings & telemetry dataset.');
  };

  const handleExportTelemetry = () => {
    const data = {
      tournament: isCleared ? 'Fresh Tournament (Cleared)' : 'Premier 25-Overs Championship 2025',
      group: 'Group A',
      metrics,
      standings,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tournament_telemetry_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Exported tournament telemetry dataset JSON report!');
  };

  return (
    <div className="flex flex-col w-full gap-6 pb-24 text-[#dde2f8]">
      {/* Telemetry Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#151b2b] p-5 rounded-xl border border-[#2f3445] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#10b981]/20 text-[#4edea3] border border-[#10b981]/30">
            <span className="material-symbols-outlined text-[24px]">query_stats</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#dde2f8]">Tournament Telemetry & League Aggregates</h1>
            <p className="text-xs text-[#bbcabf]">
              {isCleared ? 'Fresh Empty Tournament State • Ready for New Championship' : 'Premier 25-Overs Championship 2025 • Group A Phase Diagnostics'}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {!showConfirmReset ? (
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className="px-3.5 py-1.5 rounded-lg bg-[#ffb4ab]/15 text-[#ffb4ab] hover:bg-[#ffb4ab]/25 border border-[#ffb4ab]/30 font-bold flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Reset Tournament Data</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-[#191f2f] p-1.5 rounded-lg border border-[#ffb4ab]/50">
              <span className="text-[11px] text-[#ffb4ab] font-bold px-1">Confirm delete tournament data?</span>
              <button
                type="button"
                onClick={handleResetTournamentData}
                className="h-7 px-2.5 bg-[#ffb4ab] text-[#600004] text-xs font-bold rounded hover:brightness-110"
              >
                Yes, Reset All
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="h-7 px-2 bg-[#242a3a] text-[#dde2f8] text-xs rounded hover:bg-[#2f3445]"
              >
                Cancel
              </button>
            </div>
          )}

          {isCleared && (
            <button
              type="button"
              onClick={handleRestoreSampleData}
              className="px-3 py-1.5 rounded-lg bg-[#3198dc]/20 text-[#93ccff] hover:bg-[#3198dc]/30 border border-[#3198dc]/40 font-bold flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">restore</span>
              <span>Restore Sample Data</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportTelemetry}
            className="px-3 py-1.5 rounded-lg bg-[#242a3a] text-[#4edea3] hover:bg-[#2f3445] border border-[#10b981]/30 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export Telemetry JSON</span>
          </button>
        </div>
      </div>

      {/* Top Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
        <div className="bg-[#151b2b] p-4 rounded-xl border border-[#2f3445] flex flex-col justify-between">
          <span className="text-[10px] uppercase text-[#bbcabf] font-sans font-bold">Group Mean Run-Rate</span>
          <span className="text-2xl font-bold text-[#4edea3] my-1">
            {metrics.groupMeanRunRate > 0 ? `${metrics.groupMeanRunRate} rpo` : '0.00 rpo'}
          </span>
          <span className="text-[10px] text-[#93ccff] font-sans">
            {isCleared ? 'No active tournament data' : '+0.38 vs 2024 Season'}
          </span>
        </div>

        <div className="bg-[#151b2b] p-4 rounded-xl border border-[#2f3445] flex flex-col justify-between">
          <span className="text-[10px] uppercase text-[#bbcabf] font-sans font-bold">Spin Wicket Share</span>
          <span className="text-2xl font-bold text-[#ffb95f] my-1">{metrics.spinWicketShare}</span>
          <span className="text-[10px] text-[#ffb95f] font-sans">
            {isCleared ? 'Data cleared' : 'High turn on Pitch #2 & #4'}
          </span>
        </div>

        <div className="bg-[#151b2b] p-4 rounded-xl border border-[#2f3445] flex flex-col justify-between">
          <span className="text-[10px] uppercase text-[#bbcabf] font-sans font-bold">Boundary Density</span>
          <span className="text-2xl font-bold text-[#93ccff] my-1">{metrics.boundaryDensity}</span>
          <span className="text-[10px] text-[#4edea3] font-sans">
            {isCleared ? 'Data cleared' : '68.4% runs via boundaries'}
          </span>
        </div>

        <div className="bg-[#151b2b] p-4 rounded-xl border border-[#2f3445] flex flex-col justify-between">
          <span className="text-[10px] uppercase text-[#bbcabf] font-sans font-bold">Rank / Power Index</span>
          <span className="text-2xl font-bold text-[#4edea3] my-1">{metrics.titansPowerIndex}</span>
          <span className="text-[10px] text-[#4edea3] font-sans">
            {isCleared ? 'Cleared' : 'Net Run Rate +1.182'}
          </span>
        </div>
      </div>

      {/* Main Grid: Standings + Phase Efficiency Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* League Table (7 cols) */}
        <div className="lg:col-span-7 bg-[#151b2b] rounded-xl border border-[#2f3445] p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#242a3a]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffb95f] text-[20px]">emoji_events</span>
              <h2 className="font-bold text-sm text-[#dde2f8]">Group Championship Standings</h2>
            </div>
            <span className="text-[10px] text-[#4edea3] font-mono font-bold">
              {standings.length} Teams Registered
            </span>
          </div>

          <div className="overflow-x-auto">
            {standings.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center gap-3 bg-[#080e1d] rounded-xl border border-dashed border-[#2f3445] text-[#bbcabf]">
                <span className="material-symbols-outlined text-[36px] text-[#ffb4ab]">delete_sweep</span>
                <div className="flex flex-col">
                  <span className="font-bold text-[#dde2f8] text-sm">Tournament Data Cleared</span>
                  <span className="text-xs text-[#bbcabf] max-w-sm mt-1">
                    All present tournament standings and team aggregates have been removed. You can create a new match sheet or import external tournament scorecards to rebuild standings.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRestoreSampleData}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-[#242a3a] text-[#4edea3] hover:bg-[#2f3445] text-xs font-bold border border-[#10b981]/30"
                >
                  Restore Sample Tournament Data
                </button>
              </div>
            ) : (
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-[#080e1d] text-[#bbcabf] uppercase text-[10px] border-b border-[#2f3445]">
                    <th className="py-2 px-3">Team</th>
                    <th className="py-2 px-2 text-center">P</th>
                    <th className="py-2 px-2 text-center">W</th>
                    <th className="py-2 px-2 text-center">L</th>
                    <th className="py-2 px-2 text-center">Pts</th>
                    <th className="py-2 px-3 text-right">NRR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242a3a]">
                  {standings.map((st, idx) => (
                    <tr key={st.team} className={idx === 0 ? 'bg-[#10b981]/10 font-bold' : ''}>
                      <td className="py-2.5 px-3 text-[#dde2f8] flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-[#4edea3]' : 'bg-[#93ccff]'}`}></span>
                        {st.team}
                      </td>
                      <td className="py-2.5 px-2 text-center">{st.p}</td>
                      <td className="py-2.5 px-2 text-center text-[#4edea3]">{st.w}</td>
                      <td className="py-2.5 px-2 text-center">{st.l}</td>
                      <td className="py-2.5 px-2 text-center font-bold text-[#4edea3]">{st.pts}</td>
                      <td className="py-2.5 px-3 text-right text-[#4edea3]">{st.nrr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Phase Run-Rate Analysis (5 cols) */}
        <div className="lg:col-span-5 bg-[#151b2b] rounded-xl border border-[#2f3445] p-5 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#242a3a]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#93ccff] text-[20px]">bar_chart</span>
              <h2 className="font-bold text-sm text-[#dde2f8]">Phase Run-Rate Matrix</h2>
            </div>
            <span className="text-[10px] text-[#bbcabf] uppercase font-mono">3 Phase Splits</span>
          </div>

          {!isCleared ? (
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <div className="flex justify-between text-[#bbcabf] mb-1 font-mono">
                  <span>Powerplay (Overs 1 - 5)</span>
                  <span className="text-[#4edea3] font-bold">9.20 rpo</span>
                </div>
                <div className="w-full bg-[#191f2f] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#4edea3] h-full rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[#bbcabf] mb-1 font-mono">
                  <span>Middle Overs (Overs 6 - 19)</span>
                  <span className="text-[#ffb95f] font-bold">6.28 rpo</span>
                </div>
                <div className="w-full bg-[#191f2f] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#ffb95f] h-full rounded-full" style={{ width: '63%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[#bbcabf] mb-1 font-mono">
                  <span>Death Assault (Overs 20 - 25)</span>
                  <span className="text-[#4edea3] font-bold">11.60 rpo 🔥</span>
                </div>
                <div className="w-full bg-[#191f2f] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#4edea3] h-full rounded-full" style={{ width: '98%' }}></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-[#080e1d] rounded-xl border border-[#2f3445] text-center text-xs text-[#bbcabf]">
              Phase run-rate analytics reset to zero. Start logging or importing matches to calculate new phase matrices.
            </div>
          )}

          <div className="p-3 bg-[#191f2f] rounded border border-[#2f3445] text-[11px] text-[#bbcabf]">
            <span className="text-[#4edea3] font-bold">Tournament Control:</span> Use the "Reset Tournament Data" button above at any time to clear tournament records before commencing a new league session.
          </div>
        </div>
      </div>
    </div>
  );
};
