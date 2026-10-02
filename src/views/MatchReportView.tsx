import React, { useState } from 'react';
import { ArchivedMatchRecord, BatterScore, BowlerScore, FallOfWicketItem, MatchSummary } from '../types/cricket';

interface MatchReportViewProps {
  archivedMatches: ArchivedMatchRecord[];
  activeGameId: string;
  onSelectGame: (id: string) => void;
  onUpdateArchivedMatch: (updatedRecord: ArchivedMatchRecord) => void;
  onDeleteArchivedMatch: (gameId: string) => void;
  onOpenImportModal: () => void;
  onExportPdf: () => void;
  onShowToast: (msg: string) => void;
}

export const MatchReportView: React.FC<MatchReportViewProps> = ({
  archivedMatches,
  activeGameId,
  onSelectGame,
  onUpdateArchivedMatch,
  onDeleteArchivedMatch,
  onOpenImportModal,
  onExportPdf,
  onShowToast,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);

  // Editor Modal Tab ('header' | 'batting' | 'bowling' | 'fow')
  const [editorTab, setEditorTab] = useState<'header' | 'batting' | 'bowling' | 'fow'>('header');

  // Currently selected game object
  const currentRecord = archivedMatches.find((m) => m.id === activeGameId) || archivedMatches[0];

  // Editor Draft State
  const [editDraft, setEditDraft] = useState<ArchivedMatchRecord | null>(null);

  if (!currentRecord) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-[#151b2b] border border-[#2f3445] rounded-xl text-center gap-4 my-8">
        <span className="material-symbols-outlined text-[48px] text-[#3198dc]">history_edu</span>
        <div className="flex flex-col">
          <h3 className="font-bold text-lg text-[#dde2f8]">No Archived Games Recorded Yet</h3>
          <p className="text-xs text-[#bbcabf]">Import previous PDF match scorecards to start building your Game 1, Game 2, Game 3 archive timeline.</p>
        </div>
        <button
          type="button"
          onClick={onOpenImportModal}
          className="px-4 py-2 rounded-lg bg-[#4edea3] text-[#003824] font-bold text-xs hover:brightness-110 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">upload_file</span>
          <span>+ Import Previous Match PDF</span>
        </button>
      </div>
    );
  }

  // Open Editor
  const handleOpenEditor = () => {
    setEditDraft(JSON.parse(JSON.stringify(currentRecord)));
    setIsEditorOpen(true);
  };

  // Save Editor Changes
  const handleSaveEditor = () => {
    if (editDraft) {
      onUpdateArchivedMatch(editDraft);
      setIsEditorOpen(false);
      onShowToast(`Updated figures & Fall of Wickets for ${editDraft.gameLabel}!`);
    }
  };

  const match = currentRecord.match;
  const batters = currentRecord.batters || [];
  const bowlers = currentRecord.bowlers || [];
  const fowList = currentRecord.fowList || [];

  return (
    <div className="flex flex-col w-full gap-6 pb-24 text-[#dde2f8]">
      {/* GAME ARCHIVE SELECTOR STRIP */}
      <div className="w-full bg-[#151b2b] border border-[#2f3445] rounded-xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-[#bbcabf] uppercase tracking-wider shrink-0 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-[#4edea3]">sports_cricket</span>
            <span>Game Timeline:</span>
          </span>
          {archivedMatches.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectGame(m.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                activeGameId === m.id
                  ? 'bg-[#10b981]/20 text-[#4edea3] border-[#4edea3] ring-1 ring-[#4edea3]'
                  : 'bg-[#080e1d] text-[#bbcabf] border-[#2f3445] hover:border-[#3c4a42]'
              }`}
            >
              <span>{m.gameLabel}</span>
              <span className="text-[10px] opacity-70 font-mono">({m.match.team2 || 'VS'})</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onOpenImportModal}
          className="h-8 px-3.5 bg-[#3198dc]/20 text-[#93ccff] hover:bg-[#3198dc]/30 border border-[#3198dc]/40 text-xs font-bold rounded-lg flex items-center gap-1.5 shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">upload_file</span>
          <span>+ Import Previous Match PDF</span>
        </button>
      </div>

      {/* MATCH RESULT HEADER BANNER */}
      <div className="w-full bg-[#151b2b] border border-[#2f3445] rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-[#bbcabf]">
            <span className="px-2.5 py-0.5 rounded bg-[#4edea3] text-[#003824] font-extrabold uppercase text-[11px]">
              {currentRecord.gameLabel}
            </span>
            <span>•</span>
            <span>{match.venue}</span>
            <span>•</span>
            <span className="text-[#ffb95f] font-mono">{match.date}</span>
          </div>

          <h1 className="text-2xl font-extrabold text-[#4edea3] tracking-tight">{match.result.toUpperCase()}</h1>

          <div className="flex items-center gap-3 text-xs text-[#bbcabf] font-mono mt-1">
            <span>{match.team1}: <strong className="text-[#4edea3]">{match.team1Score || '0/0'}</strong> ({match.team1Overs || '0.0'} ov)</span>
            <span>{match.team2}: <strong className="text-[#93ccff]">{match.team2Score || '0/0'}</strong> ({match.team2Overs || '0.0'} ov)</span>
            <span>Toss: {match.toss}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Main Manual Edit Button requested by user */}
          <button
            type="button"
            onClick={handleOpenEditor}
            className="h-8 px-3.5 bg-[#4edea3] text-[#003824] text-xs font-bold rounded-lg shadow hover:brightness-110 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">edit_note</span>
            <span>Edit Game Record & Figures</span>
          </button>

          <button
            type="button"
            onClick={onExportPdf}
            className="h-8 px-3 bg-[#242a3a] text-[#dde2f8] hover:bg-[#2f3445] text-xs font-semibold rounded-lg flex items-center gap-1 border border-[#2f3445]"
          >
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            <span>Export PDF</span>
          </button>

          {!showConfirmDelete ? (
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="h-8 px-3 bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/30 text-xs font-semibold rounded-lg hover:bg-[#ffb4ab]/20 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              <span>Remove {currentRecord.gameLabel}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-[#191f2f] p-1 rounded-lg border border-[#ffb4ab]/50">
              <span className="text-[11px] text-[#ffb4ab] font-bold px-1">Delete {currentRecord.gameLabel}?</span>
              <button
                type="button"
                onClick={() => {
                  onDeleteArchivedMatch(currentRecord.id);
                  setShowConfirmDelete(false);
                }}
                className="h-7 px-2.5 bg-[#ffb4ab] text-[#600004] text-xs font-bold rounded hover:brightness-110"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="h-7 px-2 bg-[#242a3a] text-[#dde2f8] text-xs rounded hover:bg-[#2f3445]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FALL OF WICKETS (FOW) TIMELINE CARD */}
      <div className="bg-[#151b2b] rounded-xl border border-[#2f3445] p-5 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#242a3a]">
          <span className="font-bold text-sm text-[#dde2f8] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffb4ab]">timeline</span>
            <span>Fall of Wickets (FOW) Timeline</span>
          </span>
          <button
            type="button"
            onClick={handleOpenEditor}
            className="text-xs text-[#4edea3] hover:underline font-semibold flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">edit</span>
            <span>Edit Wickets</span>
          </button>
        </div>

        {fowList.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#bbcabf] bg-[#080e1d] rounded-lg border border-[#2f3445]">
            No Fall of Wickets entries logged. Click "Edit Game Record & Figures" above to add wicket breakdown.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 font-mono text-xs">
            {fowList.map((fow) => (
              <div key={fow.id} className="p-2.5 bg-[#080e1d] rounded-lg border border-[#2f3445] flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#ffb4ab] font-bold">Wicket #{fow.wicketNum}</span>
                  <span className="text-[10px] text-[#bbcabf]">{fow.over} ov</span>
                </div>
                <span className="font-bold text-[#dde2f8] text-sm">{fow.score}</span>
                <span className="text-[11px] text-[#bbcabf] truncate">{fow.batterName}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BATTING & BOWLING SCORECARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Batting Card */}
        <div className="bg-[#151b2b] rounded-xl border border-[#2f3445] p-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#242a3a]">
            <span className="font-bold text-sm text-[#dde2f8] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#4edea3]">sports_cricket</span>
              <span>Batting Scorecard Figures</span>
            </span>
            <span className="text-xs text-[#bbcabf] font-mono">{batters.length} Batters</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-[#191f2f] text-[#bbcabf] border-b border-[#2f3445] text-[10px]">
                  <th className="p-2">#</th>
                  <th className="p-2">Batter</th>
                  <th className="p-2 text-right">Runs</th>
                  <th className="p-2 text-right">Balls</th>
                  <th className="p-2 text-right">4s</th>
                  <th className="p-2 text-right">6s</th>
                  <th className="p-2 text-right">SR</th>
                  <th className="p-2">Dismissal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2f3445]">
                {batters.map((b) => (
                  <tr key={b.id} className="hover:bg-[#191f2f]/50">
                    <td className="p-2 text-[#bbcabf]">#{b.number}</td>
                    <td className="p-2 font-bold text-[#dde2f8]">{b.name}</td>
                    <td className="p-2 text-right font-bold text-[#4edea3]">{b.runs}</td>
                    <td className="p-2 text-right text-[#dde2f8]">{b.balls}</td>
                    <td className="p-2 text-right text-[#93ccff]">{b.fours}</td>
                    <td className="p-2 text-right text-[#ffb95f]">{b.sixes}</td>
                    <td className="p-2 text-right text-[#ffb95f]">{b.sr.toFixed(1)}</td>
                    <td className="p-2 text-[10px] text-[#bbcabf] truncate max-w-[120px]">{b.dismissal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bowling Card */}
        <div className="bg-[#151b2b] rounded-xl border border-[#2f3445] p-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#242a3a]">
            <span className="font-bold text-sm text-[#dde2f8] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#3198dc]">sports_score</span>
              <span>Bowling Attack Figures</span>
            </span>
            <span className="text-xs text-[#bbcabf] font-mono">{bowlers.length} Bowlers</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-[#191f2f] text-[#bbcabf] border-b border-[#2f3445] text-[10px]">
                  <th className="p-2">Bowler</th>
                  <th className="p-2 text-right">Overs</th>
                  <th className="p-2 text-right">Mdn</th>
                  <th className="p-2 text-right">Runs</th>
                  <th className="p-2 text-right">Wkts</th>
                  <th className="p-2 text-right">Econ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2f3445]">
                {bowlers.map((bw) => (
                  <tr key={bw.id} className="hover:bg-[#191f2f]/50">
                    <td className="p-2 font-bold text-[#dde2f8]">{bw.name}</td>
                    <td className="p-2 text-right text-[#dde2f8]">{bw.overs}</td>
                    <td className="p-2 text-right text-[#bbcabf]">{bw.maidens}</td>
                    <td className="p-2 text-right text-[#dde2f8]">{bw.runs}</td>
                    <td className="p-2 text-right font-bold text-[#4edea3]">{bw.wickets}</td>
                    <td className="p-2 text-right text-[#93ccff] font-bold">{bw.economy.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* GAME EDITOR MODAL / DRAWER */}
      {isEditorOpen && editDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-[#151b2b] border border-[#2f3445] rounded-xl shadow-2xl p-6 flex flex-col gap-5 text-[#dde2f8] my-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#242a3a]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30">
                  <span className="material-symbols-outlined text-[22px]">edit_note</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#dde2f8]">Edit Game Record: {editDraft.gameLabel}</h3>
                  <p className="text-xs text-[#bbcabf]">Manually fine-tune batting scores, bowling figures, and Fall of Wickets timeline.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-[#bbcabf] hover:text-[#dde2f8] p-1.5 rounded hover:bg-[#242a3a]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Subtab Bar */}
            <div className="flex border-b border-[#242a3a] gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setEditorTab('header')}
                className={`pb-2 px-3 border-b-2 transition-colors ${
                  editorTab === 'header' ? 'border-[#4edea3] text-[#4edea3]' : 'border-transparent text-[#bbcabf]'
                }`}
              >
                Match Header & Info
              </button>
              <button
                type="button"
                onClick={() => setEditorTab('batting')}
                className={`pb-2 px-3 border-b-2 transition-colors ${
                  editorTab === 'batting' ? 'border-[#4edea3] text-[#4edea3]' : 'border-transparent text-[#bbcabf]'
                }`}
              >
                Batting Scorecard ({editDraft.batters.length})
              </button>
              <button
                type="button"
                onClick={() => setEditorTab('bowling')}
                className={`pb-2 px-3 border-b-2 transition-colors ${
                  editorTab === 'bowling' ? 'border-[#4edea3] text-[#4edea3]' : 'border-transparent text-[#bbcabf]'
                }`}
              >
                Bowling Figures ({editDraft.bowlers.length})
              </button>
              <button
                type="button"
                onClick={() => setEditorTab('fow')}
                className={`pb-2 px-3 border-b-2 transition-colors ${
                  editorTab === 'fow' ? 'border-[#4edea3] text-[#4edea3]' : 'border-transparent text-[#bbcabf]'
                }`}
              >
                Fall of Wickets ({editDraft.fowList.length})
              </button>
            </div>

            {/* TAB 1: MATCH HEADER */}
            {editorTab === 'header' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="text-[#bbcabf]">Game Title / Number</label>
                  <input
                    type="text"
                    value={editDraft.gameLabel}
                    onChange={(e) => setEditDraft({ ...editDraft, gameLabel: e.target.value })}
                    className="h-8 px-2.5 bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#bbcabf]">Opponent Team</label>
                  <input
                    type="text"
                    value={editDraft.match.team2}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, match: { ...editDraft.match, team2: e.target.value } })
                    }
                    className="h-8 px-2.5 bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#bbcabf]">Venue</label>
                  <input
                    type="text"
                    value={editDraft.match.venue}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, match: { ...editDraft.match, venue: e.target.value } })
                    }
                    className="h-8 px-2.5 bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#bbcabf]">Match Date</label>
                  <input
                    type="text"
                    value={editDraft.match.date}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, match: { ...editDraft.match, date: e.target.value } })
                    }
                    className="h-8 px-2.5 bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8]"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-[#bbcabf]">Match Result</label>
                  <input
                    type="text"
                    value={editDraft.match.result}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, match: { ...editDraft.match, result: e.target.value } })
                    }
                    className="h-8 px-2.5 bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8]"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: BATTING TABLE */}
            {editorTab === 'batting' && (
              <div className="flex flex-col gap-3">
                <div className="max-h-64 overflow-y-auto border border-[#2f3445] rounded-xl bg-[#080e1d]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="bg-[#191f2f] text-[#bbcabf] border-b border-[#2f3445] text-[10px]">
                        <th className="p-2">Batter Name</th>
                        <th className="p-2 text-right">Runs</th>
                        <th className="p-2 text-right">Balls</th>
                        <th className="p-2 text-right">4s</th>
                        <th className="p-2 text-right">6s</th>
                        <th className="p-2">Dismissal</th>
                        <th className="p-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2f3445]">
                      {editDraft.batters.map((b, idx) => (
                        <tr key={b.id}>
                          <td className="p-2">
                            <input
                              type="text"
                              value={b.name}
                              onChange={(e) => {
                                const newB = [...editDraft.batters];
                                newB[idx].name = e.target.value;
                                setEditDraft({ ...editDraft, batters: newB });
                              }}
                              className="w-32 px-1.5 py-0.5 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#dde2f8]"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              value={b.runs}
                              onChange={(e) => {
                                const newB = [...editDraft.batters];
                                const r = Number(e.target.value);
                                newB[idx].runs = r;
                                newB[idx].sr = newB[idx].balls > 0 ? Number(((r / newB[idx].balls) * 100).toFixed(1)) : 0;
                                setEditDraft({ ...editDraft, batters: newB });
                              }}
                              className="w-12 h-6 px-1 bg-[#191f2f] text-right border border-[#2f3445] rounded text-[#4edea3] font-bold"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              value={b.balls}
                              onChange={(e) => {
                                const newB = [...editDraft.batters];
                                const balls = Number(e.target.value);
                                newB[idx].balls = balls;
                                newB[idx].sr = balls > 0 ? Number(((newB[idx].runs / balls) * 100).toFixed(1)) : 0;
                                setEditDraft({ ...editDraft, batters: newB });
                              }}
                              className="w-12 h-6 px-1 bg-[#191f2f] text-right border border-[#2f3445] rounded text-[#dde2f8]"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              value={b.fours}
                              onChange={(e) => {
                                const newB = [...editDraft.batters];
                                newB[idx].fours = Number(e.target.value);
                                setEditDraft({ ...editDraft, batters: newB });
                              }}
                              className="w-10 h-6 px-1 bg-[#191f2f] text-right border border-[#2f3445] rounded"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              value={b.sixes}
                              onChange={(e) => {
                                const newB = [...editDraft.batters];
                                newB[idx].sixes = Number(e.target.value);
                                setEditDraft({ ...editDraft, batters: newB });
                              }}
                              className="w-10 h-6 px-1 bg-[#191f2f] text-right border border-[#2f3445] rounded"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={b.dismissal}
                              onChange={(e) => {
                                const newB = [...editDraft.batters];
                                newB[idx].dismissal = e.target.value;
                                setEditDraft({ ...editDraft, batters: newB });
                              }}
                              className="w-28 px-1.5 py-0.5 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#bbcabf]"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const newB = editDraft.batters.filter((_, i) => i !== idx);
                                setEditDraft({ ...editDraft, batters: newB });
                              }}
                              className="text-[#ffb4ab] hover:text-[#ff8080]"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const newB: BatterScore = {
                      id: `b-man-${Date.now()}`,
                      number: editDraft.batters.length + 1,
                      name: `Batter #${editDraft.batters.length + 1}`,
                      hand: 'RHB',
                      dismissal: 'Out',
                      isNotOut: false,
                      runs: 0,
                      balls: 0,
                      fours: 0,
                      sixes: 0,
                      sr: 0,
                      boundaryPct: 0,
                      dotPct: 0,
                    };
                    setEditDraft({ ...editDraft, batters: [...editDraft.batters, newB] });
                  }}
                  className="px-3 py-1.5 rounded bg-[#242a3a] text-[#4edea3] hover:bg-[#2f3445] text-xs font-bold border border-[#10b981]/30 self-start flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>+ Add Batter Row</span>
                </button>
              </div>
            )}

            {/* TAB 3: BOWLING TABLE */}
            {editorTab === 'bowling' && (
              <div className="flex flex-col gap-3">
                <div className="max-h-64 overflow-y-auto border border-[#2f3445] rounded-xl bg-[#080e1d]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="bg-[#191f2f] text-[#bbcabf] border-b border-[#2f3445] text-[10px]">
                        <th className="p-2">Bowler Name</th>
                        <th className="p-2 text-right">Overs</th>
                        <th className="p-2 text-right">Maidens</th>
                        <th className="p-2 text-right">Runs</th>
                        <th className="p-2 text-right">Wickets</th>
                        <th className="p-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2f3445]">
                      {editDraft.bowlers.map((bw, idx) => (
                        <tr key={bw.id}>
                          <td className="p-2">
                            <input
                              type="text"
                              value={bw.name}
                              onChange={(e) => {
                                const newBw = [...editDraft.bowlers];
                                newBw[idx].name = e.target.value;
                                setEditDraft({ ...editDraft, bowlers: newBw });
                              }}
                              className="w-32 px-1.5 py-0.5 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#dde2f8]"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              step="0.1"
                              value={bw.overs}
                              onChange={(e) => {
                                const newBw = [...editDraft.bowlers];
                                const ov = Number(e.target.value);
                                newBw[idx].overs = ov;
                                newBw[idx].economy = ov > 0 ? Number((newBw[idx].runs / ov).toFixed(2)) : 0;
                                setEditDraft({ ...editDraft, bowlers: newBw });
                              }}
                              className="w-12 h-6 px-1 bg-[#191f2f] text-right border border-[#2f3445] rounded text-[#dde2f8]"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              value={bw.maidens}
                              onChange={(e) => {
                                const newBw = [...editDraft.bowlers];
                                newBw[idx].maidens = Number(e.target.value);
                                setEditDraft({ ...editDraft, bowlers: newBw });
                              }}
                              className="w-10 h-6 px-1 bg-[#191f2f] text-right border border-[#2f3445] rounded text-[#bbcabf]"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              value={bw.runs}
                              onChange={(e) => {
                                const newBw = [...editDraft.bowlers];
                                const r = Number(e.target.value);
                                newBw[idx].runs = r;
                                newBw[idx].economy = newBw[idx].overs > 0 ? Number((r / newBw[idx].overs).toFixed(2)) : 0;
                                setEditDraft({ ...editDraft, bowlers: newBw });
                              }}
                              className="w-12 h-6 px-1 bg-[#191f2f] text-right border border-[#2f3445] rounded text-[#dde2f8]"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              value={bw.wickets}
                              onChange={(e) => {
                                const newBw = [...editDraft.bowlers];
                                newBw[idx].wickets = Number(e.target.value);
                                setEditDraft({ ...editDraft, bowlers: newBw });
                              }}
                              className="w-10 h-6 px-1 bg-[#191f2f] text-right border border-[#2f3445] rounded text-[#4edea3] font-bold"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const newBw = editDraft.bowlers.filter((_, i) => i !== idx);
                                setEditDraft({ ...editDraft, bowlers: newBw });
                              }}
                              className="text-[#ffb4ab] hover:text-[#ff8080]"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const newBw: BowlerScore = {
                      id: `bw-man-${Date.now()}`,
                      name: `Bowler #${editDraft.bowlers.length + 1}`,
                      style: 'Right-arm Fast Medium',
                      overs: 4.0,
                      maidens: 0,
                      runs: 20,
                      wickets: 1,
                      economy: 5.0,
                      dots: 0,
                      quotaMax: 5.0,
                      state: 'Available',
                      colorTag: '#4edea3',
                    };
                    setEditDraft({ ...editDraft, bowlers: [...editDraft.bowlers, newBw] });
                  }}
                  className="px-3 py-1.5 rounded bg-[#242a3a] text-[#4edea3] hover:bg-[#2f3445] text-xs font-bold border border-[#10b981]/30 self-start flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>+ Add Bowler Row</span>
                </button>
              </div>
            )}

            {/* TAB 4: FALL OF WICKETS (FOW) TIMELINE EDITOR */}
            {editorTab === 'fow' && (
              <div className="flex flex-col gap-3">
                <div className="max-h-64 overflow-y-auto border border-[#2f3445] rounded-xl bg-[#080e1d]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="bg-[#191f2f] text-[#bbcabf] border-b border-[#2f3445] text-[10px]">
                        <th className="p-2">Wicket #</th>
                        <th className="p-2">Score (e.g. 24/1)</th>
                        <th className="p-2">Batter Out Name</th>
                        <th className="p-2">Over & Ball (e.g. 3.2)</th>
                        <th className="p-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2f3445]">
                      {editDraft.fowList.map((fow, idx) => (
                        <tr key={fow.id}>
                          <td className="p-2 text-[#ffb4ab] font-bold">
                            Wicket #{fow.wicketNum}
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={fow.score}
                              onChange={(e) => {
                                const newF = [...editDraft.fowList];
                                newF[idx].score = e.target.value;
                                setEditDraft({ ...editDraft, fowList: newF });
                              }}
                              className="w-20 px-1.5 py-0.5 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#dde2f8]"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={fow.batterName}
                              onChange={(e) => {
                                const newF = [...editDraft.fowList];
                                newF[idx].batterName = e.target.value;
                                setEditDraft({ ...editDraft, fowList: newF });
                              }}
                              className="w-36 px-1.5 py-0.5 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#dde2f8]"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={fow.over}
                              onChange={(e) => {
                                const newF = [...editDraft.fowList];
                                newF[idx].over = e.target.value;
                                setEditDraft({ ...editDraft, fowList: newF });
                              }}
                              className="w-16 px-1.5 py-0.5 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#dde2f8]"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const newF = editDraft.fowList.filter((_, i) => i !== idx);
                                setEditDraft({ ...editDraft, fowList: newF });
                              }}
                              className="text-[#ffb4ab] hover:text-[#ff8080]"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const wNum = editDraft.fowList.length + 1;
                    const newF: FallOfWicketItem = {
                      id: `fow-man-${Date.now()}`,
                      wicketNum: wNum,
                      score: `100/${wNum}`,
                      batterName: `Batter Name`,
                      over: `10.1`,
                    };
                    setEditDraft({ ...editDraft, fowList: [...editDraft.fowList, newF] });
                  }}
                  className="px-3 py-1.5 rounded bg-[#242a3a] text-[#4edea3] hover:bg-[#2f3445] text-xs font-bold border border-[#10b981]/30 self-start flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>+ Add Wicket Entry to Fall of Wickets</span>
                </button>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#242a3a]">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="h-8 px-4 rounded bg-[#242a3a] text-[#bbcabf] hover:bg-[#2f3445] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditor}
                className="h-8 px-5 rounded bg-[#4edea3] text-[#003824] text-xs font-bold hover:brightness-110 shadow flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>Save Game Record Edits</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
