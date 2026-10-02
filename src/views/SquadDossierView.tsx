import React, { useState } from 'react';
import { Player, PastMatchLog } from '../types/cricket';
import { PlayerOverrideModal } from '../components/PlayerOverrideModal';
import { QuickPastMatchLogModal } from '../components/QuickPastMatchLogModal';
import { NewPlayerModal } from '../components/NewPlayerModal';

interface SquadDossierViewProps {
  playersPool: Player[];
  onDeployToXi: (player: Player) => void;
  onComparePlayer: (player: Player) => void;
  onSavePlayerOverride: (updatedPlayer: Player) => void;
  onAddPastMatchLog: (playerId: string, log: PastMatchLog) => void;
  onAddPlayerToPool: (newPlayer: Player) => void;
  onRemovePlayerFromPool: (playerId: string) => void;
  onClearAllPlayersPool: () => void;
  onRestoreDefaultSquadPool: () => void;
  onShowToast: (msg: string) => void;
}

export const SquadDossierView: React.FC<SquadDossierViewProps> = ({
  playersPool,
  onDeployToXi,
  onComparePlayer,
  onSavePlayerOverride,
  onAddPastMatchLog,
  onAddPlayerToPool,
  onRemovePlayerFromPool,
  onClearAllPlayersPool,
  onRestoreDefaultSquadPool,
  onShowToast,
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player>(playersPool[0]);
  const [statusTab, setStatusTab] = useState<'all' | 'active' | 'bench' | 'injured'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [timeframe, setTimeframe] = useState<'all' | 'last3' | 'last5' | 'spin'>('last3');
  const [showConfirmRemove, setShowConfirmRemove] = useState<boolean>(false);
  const [showConfirmClearPool, setShowConfirmClearPool] = useState<boolean>(false);

  // Modals
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState<boolean>(false);
  const [isPastLogModalOpen, setIsPastLogModalOpen] = useState<boolean>(false);
  const [isNewPlayerModalOpen, setIsNewPlayerModalOpen] = useState<boolean>(false);

  // Keep selected player synced if updated in parent pool
  const currentSelected = playersPool.find((p) => p.id === selectedPlayer?.id) || playersPool[0] || selectedPlayer;

  const filteredPlayers = playersPool.filter((p) => {
    const matchesStatus =
      statusTab === 'all'
        ? true
        : statusTab === 'active'
        ? p.status === 'active'
        : statusTab === 'bench'
        ? p.status === 'bench'
        : p.status === 'injured';

    const matchesRole =
      roleFilter === 'all'
        ? true
        : roleFilter === 'batters'
        ? p.role === 'BATTER'
        : roleFilter === 'wk'
        ? p.role === 'WK-BAT'
        : roleFilter === 'ar'
        ? p.role === 'ALL-RND'
        : p.role === 'PACE SPEC' || p.role === 'SPIN SPEC';

    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.jerseyNum.toString().includes(searchQuery);

    return matchesStatus && matchesRole && matchesSearch;
  });

  // Export Squad CSV logic
  const handleExportCsv = () => {
    const headers = ['Jersey', 'Name', 'Role', 'Hand', 'Status', 'Matches', 'Runs', 'Avg', 'SR', 'Overs', 'Wickets', 'Econ', 'ImpactScore'];
    const rows = playersPool.map((p) => [
      p.jerseyNum,
      `"${p.name}"`,
      p.role,
      p.hand,
      p.status,
      p.matches,
      p.runs,
      p.avg.toFixed(1),
      p.sr.toFixed(1),
      p.overs,
      p.wickets,
      p.econ.toFixed(2),
      p.impactScore,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `squad_dossier_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Exported full squad dataset to CSV file!');
  };

  return (
    <div className="flex flex-col w-full gap-6 pb-24 text-[#dde2f8]">
      {/* Top Quick Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#151b2b] p-4 rounded-xl border border-[#2f3445]">
        <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
          <div>Squad Pool: <strong className="text-[#dde2f8]">{playersPool.length} Athletes</strong></div>
          <div>Mean SR: <strong className="text-[#4edea3]">144.2</strong></div>
          <div>Mean Econ: <strong className="text-[#93ccff]">7.18 rpo</strong></div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold flex-wrap">
          <button
            type="button"
            onClick={() => setIsNewPlayerModalOpen(true)}
            className="h-8 px-3 rounded-lg bg-[#4edea3] text-[#003824] hover:brightness-110 font-bold flex items-center gap-1.5 transition-colors shadow"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>+ Add Player to Pool</span>
          </button>

          {!showConfirmClearPool ? (
            <button
              type="button"
              onClick={() => setShowConfirmClearPool(true)}
              className="h-8 px-3 rounded-lg bg-[#ffb4ab]/15 text-[#ffb4ab] hover:bg-[#ffb4ab]/25 border border-[#ffb4ab]/30 flex items-center gap-1.5 transition-colors font-bold"
              title="Remove all players from squad pool"
            >
              <span className="material-symbols-outlined text-[16px]">group_remove</span>
              <span>Clear Entire Squad Pool</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-[#191f2f] p-1 rounded-lg border border-[#ffb4ab]/50">
              <span className="text-[11px] text-[#ffb4ab] font-bold px-1">Clear all {playersPool.length} players?</span>
              <button
                type="button"
                onClick={() => {
                  onClearAllPlayersPool();
                  setShowConfirmClearPool(false);
                }}
                className="h-7 px-2.5 bg-[#ffb4ab] text-[#600004] text-xs font-bold rounded hover:brightness-110"
              >
                Yes, Clear All
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmClearPool(false)}
                className="h-7 px-2 bg-[#242a3a] text-[#dde2f8] text-xs rounded hover:bg-[#2f3445]"
              >
                Cancel
              </button>
            </div>
          )}

          {playersPool.length === 0 && (
            <button
              type="button"
              onClick={onRestoreDefaultSquadPool}
              className="h-8 px-3 rounded-lg bg-[#3198dc]/20 text-[#93ccff] hover:bg-[#3198dc]/30 border border-[#3198dc]/40 flex items-center gap-1.5 font-bold"
            >
              <span className="material-symbols-outlined text-[16px]">restore</span>
              <span>Restore Squad Roster</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCsv}
            className="h-8 px-3 rounded-lg bg-[#242a3a] text-[#93ccff] hover:bg-[#2f3445] border border-[#3198dc]/30 flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export Squad CSV</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Table (7 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          <div className="bg-[#151b2b] p-4 rounded-xl border border-[#2f3445] flex flex-col gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold pb-1">
              {[
                { id: 'all', label: 'All Squad' },
                { id: 'active', label: 'Active Pool' },
                { id: 'bench', label: 'Bench' },
                { id: 'injured', label: 'Injured' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setStatusTab(t.id as any)}
                  className={`px-3 py-1 rounded transition-colors whitespace-nowrap ${
                    statusTab === t.id ? 'bg-[#4edea3] text-[#003824] font-bold' : 'bg-[#191f2f] text-[#bbcabf]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search squad..."
              className="w-full h-8 px-3 bg-[#080e1d] text-[#dde2f8] placeholder:text-[#bbcabf]/70 rounded-lg text-xs outline-none border border-[#2f3445]"
            />
          </div>

          {/* Table */}
          <div className="bg-[#151b2b] rounded-xl border border-[#2f3445] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#080e1d] text-[#bbcabf] font-semibold uppercase text-[10px] border-b border-[#2f3445]">
                    <th className="py-2.5 px-3 w-8 text-center">#</th>
                    <th className="py-2.5 px-3 min-w-[150px]">Player</th>
                    <th className="py-2.5 px-2 text-center">Role</th>
                    <th className="py-2.5 px-2 text-right">Runs</th>
                    <th className="py-2.5 px-2 text-right">Avg</th>
                    <th className="py-2.5 px-2 text-right text-[#4edea3]">SR</th>
                    <th className="py-2.5 px-2 text-right text-[#4edea3]">Wkts</th>
                    <th className="py-2.5 px-3 text-center">Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2f3445] font-mono">
                  {playersPool.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 px-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-3 text-[#bbcabf]">
                          <span className="material-symbols-outlined text-[40px] text-[#ffb4ab]">group_off</span>
                          <div className="flex flex-col">
                            <span className="font-bold text-[#dde2f8] text-sm">Squad Pool is Completely Empty</span>
                            <span className="text-xs text-[#bbcabf] max-w-sm mt-1">
                              All players have been removed from the squad roster. You can register new players or restore the default squad roster.
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => setIsNewPlayerModalOpen(true)}
                              className="px-3.5 py-1.5 rounded-lg bg-[#4edea3] text-[#003824] hover:brightness-110 text-xs font-bold"
                            >
                              + Register New Player
                            </button>
                            <button
                              type="button"
                              onClick={onRestoreDefaultSquadPool}
                              className="px-3.5 py-1.5 rounded-lg bg-[#242a3a] text-[#93ccff] hover:bg-[#2f3445] text-xs font-bold border border-[#3198dc]/30"
                            >
                              Restore Squad Roster
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#bbcabf]">
                        No players found matching your filters. Click "+ Add Player to Pool" above to create one!
                      </td>
                    </tr>
                  ) : (
                    filteredPlayers.map((p) => {
                      const isSelected = currentSelected?.id === p.id;
                      return (
                        <tr
                          key={p.id}
                          onClick={() => setSelectedPlayer(p)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#191f2f] font-bold' : 'hover:bg-[#191f2f]/60'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center text-[#bbcabf]">#{p.jerseyNum}</td>
                          <td className="py-2.5 px-3 font-sans">
                            <div className="flex items-center gap-2">
                              <img src={p.photoUrl} alt={p.name} className="w-7 h-7 rounded-full object-cover bg-[#2f3445]" />
                              <span className={isSelected ? 'text-[#4edea3]' : 'text-[#dde2f8]'}>{p.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className="px-1.5 py-0.5 rounded bg-[#242a3a] text-[#93ccff] text-[10px]">
                              {p.role}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right text-[#dde2f8]">{p.runs}</td>
                          <td className="py-2.5 px-2 text-right text-[#dde2f8]">{p.avg.toFixed(1)}</td>
                          <td className="py-2.5 px-2 text-right text-[#4edea3] font-bold">{p.sr.toFixed(1)}</td>
                          <td className="py-2.5 px-2 text-right text-[#4edea3]">{p.wickets > 0 ? p.wickets : '-'}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#4edea3] text-[10px] font-bold">
                              {p.impactScore} ★
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Dossier Side Panel (5 cols) */}
        {currentSelected && (
          <div className="xl:col-span-5 flex flex-col gap-4">
            <div className="bg-[#151b2b] rounded-xl border border-[#2f3445] p-5 shadow-xl flex flex-col gap-4 text-xs">
              {/* Player Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#242a3a]">
                <div className="flex items-center gap-3">
                  <div className="relative group shrink-0">
                    <img src={currentSelected.photoUrl} alt={currentSelected.name} className="w-14 h-14 rounded-xl object-cover ring-2 ring-[#4edea3]" />
                    <label
                      htmlFor={`dossier-photo-upload-${currentSelected.id}`}
                      className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[#4edea3] transition-opacity cursor-pointer text-[10px] font-bold"
                      title="Upload local photo from PC"
                    >
                      <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                      <span>Change</span>
                    </label>
                    <input
                      id={`dossier-photo-upload-${currentSelected.id}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              onSavePlayerOverride({
                                ...currentSelected,
                                photoUrl: reader.result,
                              });
                              onShowToast(`Updated ${currentSelected.name}'s photo from local PC file!`);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-[#dde2f8] truncate">{currentSelected.name}</h3>
                      <span className="px-1.5 py-0.5 rounded bg-[#10b981]/20 text-[#4edea3] text-[10px] font-bold">#{currentSelected.jerseyNum}</span>
                    </div>
                    <span className="text-xs text-[#bbcabf]">{currentSelected.role} • {currentSelected.hand}</span>
                    <span className="text-[11px] text-[#ffb95f] mt-0.5">{currentSelected.country}</span>
                  </div>
                </div>

                {/* Individual Player Actions */}
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsOverrideModalOpen(true)}
                    className="px-2.5 py-1 rounded bg-[#e29100]/20 text-[#ffb95f] hover:bg-[#e29100] hover:text-[#2a1700] text-[11px] font-bold flex items-center gap-1 border border-[#e29100]/40"
                    title="Directly manipulate/override stats"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    <span>Override Data</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPastLogModalOpen(true)}
                    className="px-2.5 py-1 rounded bg-[#242a3a] text-[#4edea3] hover:bg-[#4edea3] hover:text-[#003824] text-[11px] font-bold flex items-center gap-1 border border-[#10b981]/40"
                    title="Quick input stats from previous individual matches"
                  >
                    <span className="material-symbols-outlined text-[14px]">post_add</span>
                    <span>+ Quick Past Match</span>
                  </button>

                  {/* Remove from Squad Button */}
                  {!showConfirmRemove ? (
                    <button
                      type="button"
                      onClick={() => setShowConfirmRemove(true)}
                      className="px-2.5 py-1 rounded bg-[#ffb4ab]/15 text-[#ffb4ab] hover:bg-[#ffb4ab]/25 text-[11px] font-bold flex items-center gap-1 border border-[#ffb4ab]/30 transition-colors"
                      title="Remove player from squad pool"
                    >
                      <span className="material-symbols-outlined text-[14px]">person_remove</span>
                      <span>Remove from Squad</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 bg-[#191f2f] p-1 rounded border border-[#ffb4ab]/50">
                      <span className="text-[10px] text-[#ffb4ab] font-bold px-1">Confirm?</span>
                      <button
                        type="button"
                        onClick={() => {
                          onRemovePlayerFromPool(currentSelected.id);
                          setShowConfirmRemove(false);
                        }}
                        className="h-6 px-2 bg-[#ffb4ab] text-[#600004] text-[10px] font-bold rounded hover:brightness-110"
                      >
                        Yes, Remove
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowConfirmRemove(false)}
                        className="h-6 px-1.5 bg-[#242a3a] text-[#dde2f8] text-[10px] rounded hover:bg-[#2f3445]"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeframe selector */}
              <div className="flex items-center gap-1 p-1 bg-[#080e1d] rounded-lg border border-[#2f3445] font-semibold text-[11px]">
                {['all', 'last3', 'last5', 'spin'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTimeframe(t as any)}
                    className={`flex-1 py-1 rounded capitalize text-center ${
                      timeframe === t ? 'bg-[#4edea3] text-[#003824] font-bold' : 'text-[#bbcabf]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Baseline Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5 font-mono">
                <div className="p-3 bg-[#191f2f] rounded-lg border border-[#2f3445]">
                  <span className="text-[10px] text-[#bbcabf] block uppercase">Matches Played</span>
                  <span className="text-lg font-bold text-[#dde2f8]">{currentSelected.matches}</span>
                </div>
                <div className="p-3 bg-[#191f2f] rounded-lg border border-[#2f3445]">
                  <span className="text-[10px] text-[#bbcabf] block uppercase">Career Runs</span>
                  <span className="text-lg font-bold text-[#dde2f8]">{currentSelected.runs}</span>
                </div>
                <div className="p-3 bg-[#191f2f] rounded-lg border border-[#2f3445]">
                  <span className="text-[10px] text-[#bbcabf] block uppercase">Season Avg</span>
                  <span className="text-lg font-bold text-[#dde2f8]">{currentSelected.avg.toFixed(1)}</span>
                </div>
                <div className="p-3 bg-[#191f2f] rounded-lg border border-[#2f3445]">
                  <span className="text-[10px] text-[#bbcabf] block uppercase">Strike Rate</span>
                  <span className="text-lg font-bold text-[#4edea3]">{currentSelected.sr.toFixed(1)}</span>
                </div>
              </div>

              {/* Phase Breakdown */}
              <div className="p-3 bg-[#191f2f] rounded-xl border border-[#2f3445] flex flex-col gap-2">
                <span className="font-bold text-xs text-[#dde2f8]">25-Over Phase Strike Rates</span>
                <div className="flex flex-col gap-1.5 font-mono text-[11px]">
                  <div className="flex justify-between"><span>Powerplay (1-5):</span> <strong className="text-[#93ccff]">SR {currentSelected.powerplaySr}</strong></div>
                  <div className="flex justify-between"><span>Middle Phase (6-19):</span> <strong className="text-[#ffb95f]">SR {currentSelected.middleSr}</strong></div>
                  <div className="flex justify-between"><span>Death Assault (20-25):</span> <strong className="text-[#4edea3]">SR {currentSelected.deathSr} 🔥</strong></div>
                </div>
              </div>

              {/* Past Match Performance Logs */}
              {currentSelected.pastLogs && currentSelected.pastLogs.length > 0 && (
                <div className="p-3 bg-[#080e1d] rounded-xl border border-[#2f3445] flex flex-col gap-2">
                  <span className="font-bold text-xs text-[#4edea3] flex items-center justify-between">
                    <span>Logged Past Performances ({currentSelected.pastLogs.length})</span>
                    <span className="text-[10px] font-mono text-[#bbcabf]">Manual Match Log</span>
                  </span>
                  <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto font-mono text-[11px]">
                    {currentSelected.pastLogs.map((log) => (
                      <div key={log.id} className="p-2 rounded bg-[#191f2f] border border-[#2f3445] flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#dde2f8]">{log.opponent}</span>
                          <span className="text-[10px] text-[#bbcabf]">{log.date} • {log.category}</span>
                        </div>
                        <div className="text-right">
                          {log.runsScored !== undefined && (
                            <div className="text-[#4edea3] font-bold">
                              {log.runsScored}{log.isNotOut ? '*' : ''} ({log.ballsFaced}b)
                            </div>
                          )}
                          {log.wicketsTaken !== undefined && (
                            <div className="text-[#93ccff] font-bold">
                              {log.wicketsTaken}/{log.runsConceded} ({log.oversBowled}ov)
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onComparePlayer(currentSelected)}
                  className="flex-1 h-9 rounded-lg bg-[#242a3a] text-[#dde2f8] hover:bg-[#2f3445] font-semibold border border-[#2f3445]"
                >
                  Compare Player
                </button>
                <button
                  type="button"
                  onClick={() => onDeployToXi(currentSelected)}
                  className="flex-1 h-9 rounded-lg bg-[#4edea3] text-[#003824] font-bold shadow hover:brightness-110"
                >
                  Deploy into XI
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Override Player Modal */}
      {currentSelected && (
        <PlayerOverrideModal
          isOpen={isOverrideModalOpen}
          onClose={() => setIsOverrideModalOpen(false)}
          player={currentSelected}
          onSavePlayer={(updated) => {
            onSavePlayerOverride(updated);
            onShowToast(`Successfully overridden player data for ${updated.name}!`);
          }}
        />
      )}

      {/* Quick Past Match Log Modal */}
      {currentSelected && (
        <QuickPastMatchLogModal
          isOpen={isPastLogModalOpen}
          onClose={() => setIsPastLogModalOpen(false)}
          player={currentSelected}
          onAddPastMatchLog={(playerId, log) => {
            onAddPastMatchLog(playerId, log);
          }}
        />
      )}

      {/* Add New Player Modal */}
      <NewPlayerModal
        isOpen={isNewPlayerModalOpen}
        onClose={() => setIsNewPlayerModalOpen(false)}
        onAddPlayer={(newPlayer) => {
          onAddPlayerToPool(newPlayer);
          setSelectedPlayer(newPlayer);
        }}
      />
    </div>
  );
};
