import React, { useState } from 'react';
import { CoachProfile, SyncedRecordVaultItem } from '../types/cricket';
import { COACH_AVATAR } from '../data/mockData';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachProfile: CoachProfile;
  onSaveCoachProfile: (profile: CoachProfile) => void;
  allRecordsVault?: SyncedRecordVaultItem[];
  onRestoreVaultRecord?: (record: SyncedRecordVaultItem) => void;
  onExportAllRecords?: () => void;
  onShowToast?: (msg: string) => void;
  onLogout?: () => void;
}

const PRESET_AVATARS = [
  { name: 'Vance Miller', url: COACH_AVATAR },
  { name: 'Sarah Jenkins', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDayZnjVjOPBd2j8SmJuRzpSUzKXmSYceTzYjniwnmzFyD0-zOgXXCPUe0njmqKbb3Cj2JcKfPQZQmEl9OvWhkviJH7kTK-thh09upAvGtCpoKfQ-eAtHcHletpkNmfzsvzJjVcLcsXXvkv9d_jR39rC31hmy_ANgDieipI1o74AqUPHc1uWVnY_o_LbzDSGzWJWL4hKcKZS3fa8PrYIgnocAdVX6kwch7-GnPkeGhhO7WhRlDKNe29' },
  { name: 'Dev Analyst', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8pndOFFccEUKc6E4KZrY6hF7lY9NobgbXtoXCDCyFHnSI4hGcxN1JbNKgPYwjVXUASrqIHIbCJf-SWp9MfzL0LKqB4r246rvI3LfmnlWbJw4PZ6mjrv31NelqmmtP8D_Ikf6ksr5sBQpMUsszv4lhBHQlOwBVGoKmnmN15UhFNRsQPFcub52O-iJc5KeD6XeS8Gk1oL0RXWNP595zXdPqwtL4wjfGnFoHr0m45O1nISvCg4ffvgOL' },
  { name: 'Pro Tactician', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA19aZ94pLMW3hp7ZuBmNoJZ8E1ywNaII_zf7o-nwd2tqbby4hh7PTbtrdpqND8Xky3NOPkY0oW1VGyezdDlWvSYQtgpo-sTQakL30WjJzYWWiFzXhzUUBhyN7yi9JEt8t9fVyT5eTi7XY0uFR-mmkv9-Vy7FsF2ts9l_udcF4MiTcQ3SSrLmteAUY_cLgFtDdL532143056iFWoF6bs2mzNfMVK-ojOC-ugZqF67NAeuzRGxcy967-' },
];

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  coachProfile,
  onSaveCoachProfile,
  allRecordsVault = [],
  onRestoreVaultRecord,
  onExportAllRecords,
  onShowToast,
  onLogout,
}) => {
  const [name, setName] = useState(coachProfile.name);
  const [role, setRole] = useState(coachProfile.role);
  const [team, setTeam] = useState(coachProfile.team);
  const [avatarUrl, setAvatarUrl] = useState(coachProfile.avatarUrl);
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'all-records' | 'preferences'>('profile');
  const [selectedRecordDetailId, setSelectedRecordDetailId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCoachProfile({
      name,
      role,
      team,
      avatarUrl,
    });
    onClose();
  };

  const filteredVault = allRecordsVault.filter((rec) => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return true;
    return (
      rec.gameLabel?.toLowerCase().includes(q) ||
      rec.match.team1?.toLowerCase().includes(q) ||
      rec.match.team2?.toLowerCase().includes(q) ||
      rec.match.id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-[#151b2b] border border-[#2f3445] rounded-xl shadow-2xl p-6 flex flex-col gap-4 text-[#dde2f8] my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#242a3a]">
          <div className="flex items-center gap-3">
            <img
              src={avatarUrl || COACH_AVATAR}
              alt={name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-[#4edea3]"
            />
            <div>
              <h3 className="font-bold text-base text-[#dde2f8]">{name || 'Coach Profile'}</h3>
              <p className="text-xs text-[#bbcabf]">{team || 'Titans CC'} • {role || 'Head Analyst'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#bbcabf] hover:text-[#dde2f8] p-1 rounded hover:bg-[#242a3a]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-[#080e1d] rounded-lg border border-[#2f3445] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSubTab('profile')}
            className={`flex-1 py-1.5 rounded transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'profile'
                ? 'bg-[#4edea3] text-[#003824] font-bold shadow'
                : 'text-[#bbcabf] hover:text-[#dde2f8]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">badge</span>
            <span>Coach Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('all-records')}
            className={`flex-1 py-1.5 rounded transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'all-records'
                ? 'bg-[#4edea3] text-[#003824] font-bold shadow'
                : 'text-[#bbcabf] hover:text-[#dde2f8]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">inventory_2</span>
            <span>All Records Vault ({allRecordsVault.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('preferences')}
            className={`flex-1 py-1.5 rounded transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'preferences'
                ? 'bg-[#4edea3] text-[#003824] font-bold shadow'
                : 'text-[#bbcabf] hover:text-[#dde2f8]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Preferences</span>
          </button>
        </div>

        {/* SUBTAB 1: COACH PROFILE */}
        {activeSubTab === 'profile' && (
          <form onSubmit={handleSave} className="flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[#bbcabf] font-semibold">Coach Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Coach Vance Miller"
                  className="h-9 px-3 bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8] outline-none focus:border-[#4edea3]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[#bbcabf] font-semibold">Team / Franchise</label>
                  <input
                    type="text"
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    placeholder="e.g. Titans CC"
                    className="h-9 px-3 bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8] outline-none focus:border-[#4edea3]"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#bbcabf] font-semibold">Role / Title</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Head Analyst"
                    className="h-9 px-3 bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8] outline-none focus:border-[#4edea3]"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <label className="text-[#bbcabf] font-semibold">Coach Profile Photo</label>

                <div className="flex items-center gap-2 bg-[#080e1d] p-2.5 rounded-lg border border-[#2f3445]">
                  <img
                    src={avatarUrl || COACH_AVATAR}
                    alt="Coach Preview"
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-[#4edea3] shrink-0"
                  />
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-[#dde2f8]">Upload Custom Coach Photo</span>
                    <span className="text-[10px] text-[#bbcabf]">Select image file from local PC / phone</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (typeof reader.result === 'string') {
                            setAvatarUrl(reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="coach-avatar-file-input"
                  />
                  <label
                    htmlFor="coach-avatar-file-input"
                    className="h-8 px-3 rounded bg-[#242a3a] text-[#4edea3] hover:bg-[#2f3445] text-xs font-bold border border-[#10b981]/30 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    <span>Browse Local PC</span>
                  </label>
                </div>

                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-[10px] text-[#bbcabf]">Or Select Avatar Preset:</span>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_AVATARS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarUrl(preset.url)}
                        className={`p-1.5 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                          avatarUrl === preset.url
                            ? 'bg-[#10b981]/20 border-[#4edea3] ring-1 ring-[#4edea3]'
                            : 'bg-[#080e1d] border-[#2f3445] hover:border-[#3c4a42]'
                        }`}
                      >
                        <img src={preset.url} alt={preset.name} className="w-8 h-8 rounded-full object-cover" />
                        <span className="text-[9px] text-[#bbcabf] truncate w-full text-center">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#242a3a]">
              {onLogout ? (
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="h-8 px-3 rounded bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/30 hover:bg-[#ffb4ab]/20 font-bold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span>Log Out</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-8 px-4 rounded bg-[#242a3a] text-[#bbcabf] hover:bg-[#2f3445] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 rounded bg-[#4edea3] text-[#003824] font-bold hover:brightness-110 shadow"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </form>
        )}

        {/* SUBTAB 2: ALL RECORDS VAULT (RECOVERY LEDGER) */}
        {activeSubTab === 'all-records' && (
          <div className="flex flex-col gap-3 text-xs">
            <div className="p-3 bg-[#191f2f] rounded-lg border border-[#3198dc]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="font-bold text-[#dde2f8] text-xs flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#3198dc]">history_edu</span>
                  <span>All Records Vault & Master Data Ledger</span>
                </span>
                <span className="text-[11px] text-[#bbcabf]">
                  Immutable backup ledger of all synced matches. Accidental deletions can be restored anytime!
                </span>
              </div>

              {onExportAllRecords && (
                <button
                  type="button"
                  onClick={onExportAllRecords}
                  className="h-8 px-3 bg-[#3198dc]/20 text-[#93ccff] hover:bg-[#3198dc]/30 font-bold text-xs rounded-lg border border-[#3198dc]/40 flex items-center gap-1 shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Export Vault JSON</span>
                </button>
              )}
            </div>

            {/* Search Input */}
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search vault by opponent, game label, or match ID..."
              className="h-8 px-3 bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8] outline-none focus:border-[#4edea3]"
            />

            {/* List of Records in Vault */}
            <div className="max-h-72 overflow-y-auto flex flex-col gap-2 bg-[#080e1d] p-2.5 rounded-lg border border-[#2f3445]">
              {filteredVault.length === 0 ? (
                <div className="p-6 text-center text-[#bbcabf]">
                  No synced match records found in vault storage yet.
                </div>
              ) : (
                filteredVault.map((rec) => {
                  const isDeleted = rec.isDeletedFromHistory;
                  const isDetailOpen = selectedRecordDetailId === rec.id;

                  return (
                    <div
                      key={rec.id}
                      className={`p-3 rounded-lg border flex flex-col gap-2 transition-all ${
                        isDeleted
                          ? 'bg-[#1a1315] border-[#ffb4ab]/40'
                          : 'bg-[#151b2b] border-[#2f3445]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] shrink-0 ${
                              isDeleted
                                ? 'bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/30'
                                : 'bg-[#10b981]/20 text-[#4edea3] border border-[#10b981]/30'
                            }`}
                          >
                            {isDeleted ? 'DELETED (RESTOREABLE)' : 'ACTIVE IN HISTORY'}
                          </span>
                          <span className="font-bold text-[#dde2f8] truncate">
                            {rec.gameLabel || rec.id}: {rec.match.team1} vs {rec.match.team2}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {onRestoreVaultRecord && (
                            <button
                              type="button"
                              onClick={() => {
                                onRestoreVaultRecord(rec);
                                if (onShowToast) onShowToast(`Restored ${rec.gameLabel || rec.match.team2} record & re-synced player stats!`);
                              }}
                              className="h-7 px-2.5 rounded bg-[#4edea3] text-[#003824] font-extrabold text-[11px] hover:brightness-110 shadow flex items-center gap-1"
                              title="Restore deleted game data back to active Match History & re-sync player stats"
                            >
                              <span className="material-symbols-outlined text-[14px]">restore</span>
                              <span>Restore Record</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedRecordDetailId(isDetailOpen ? null : rec.id)}
                            className="p-1 rounded bg-[#242a3a] text-[#bbcabf] hover:text-[#dde2f8]"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {isDetailOpen ? 'expand_less' : 'expand_more'}
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between font-mono text-[11px] text-[#bbcabf]">
                        <span>Score: <strong className="text-[#dde2f8]">{rec.match.team1Score}</strong> vs <strong className="text-[#dde2f8]">{rec.match.team2Score}</strong></span>
                        <span>Date: {rec.match.date}</span>
                      </div>

                      {/* Expandable Breakdown Drawer */}
                      {isDetailOpen && (
                        <div className="mt-1 p-2.5 bg-[#080e1d] rounded border border-[#2f3445] text-[11px] flex flex-col gap-2 font-mono">
                          <div className="flex items-center justify-between border-b border-[#2f3445] pb-1 text-[#4edea3] font-bold">
                            <span>Batters ({rec.batters.length})</span>
                            <span>Runs (Balls)</span>
                          </div>
                          <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
                            {rec.batters.map((b) => (
                              <div key={b.id} className="flex justify-between text-[#dde2f8]">
                                <span>{b.name} ({b.dismissal})</span>
                                <span>{b.runs} ({b.balls}b)</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between border-b border-[#2f3445] pb-1 pt-1 text-[#93ccff] font-bold">
                            <span>Bowlers ({rec.bowlers.length})</span>
                            <span>Overs - Wkts - Runs</span>
                          </div>
                          <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                            {rec.bowlers.map((bw) => (
                              <div key={bw.id} className="flex justify-between text-[#dde2f8]">
                                <span>{bw.name}</span>
                                <span>{bw.overs}ov - {bw.wickets}w - {bw.runs}r</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#242a3a]">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-4 rounded bg-[#242a3a] text-[#bbcabf] hover:bg-[#2f3445] font-semibold"
              >
                Close Vault
              </button>
            </div>
          </div>
        )}

        {/* SUBTAB 3: TACTICAL PREFERENCES */}
        {activeSubTab === 'preferences' && (
          <div className="flex flex-col gap-3 text-xs">
            <div className="p-3 bg-[#191f2f] rounded border border-[#2f3445] flex items-center justify-between">
              <div>
                <div className="font-bold text-[#dde2f8]">CRIC-TACTIC Engine Version</div>
                <div className="text-[11px] text-[#bbcabf]">v2.4 Pro Analytics (Build 2026.09)</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#4edea3] font-bold text-[10px] uppercase">Active License</span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-bold text-[#bbcabf] uppercase text-[10px] tracking-wider">Tactical System Toggles</span>
              <label className="flex items-center justify-between p-2.5 rounded bg-[#080e1d] border border-[#242a3a] cursor-pointer">
                <span>Auto-sync match figures to Squad Database</span>
                <input type="checkbox" defaultChecked className="accent-[#4edea3]" />
              </label>
              <label className="flex items-center justify-between p-2.5 rounded bg-[#080e1d] border border-[#242a3a] cursor-pointer">
                <span>Highlight 50+ and 100+ milestones automatically</span>
                <input type="checkbox" defaultChecked className="accent-[#4edea3]" />
              </label>
              <label className="flex items-center justify-between p-2.5 rounded bg-[#080e1d] border border-[#242a3a] cursor-pointer">
                <span>Enable All Records Vault auto-backup</span>
                <input type="checkbox" defaultChecked className="accent-[#4edea3]" />
              </label>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#242a3a]">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-4 rounded bg-[#242a3a] text-[#bbcabf] hover:bg-[#2f3445] font-semibold"
              >
                Close Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
