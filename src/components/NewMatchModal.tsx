import React, { useState } from 'react';
import { MatchCategory } from '../types/cricket';

interface NewMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMatch: (data: {
    team1: string;
    opponent: string;
    category: MatchCategory;
    venue: string;
    pitch: string;
    overs: number;
    tacticalNotes: string;
  }) => void;
  onOpenImportModal?: () => void;
}

export const NewMatchModal: React.FC<NewMatchModalProps> = ({
  isOpen,
  onClose,
  onCreateMatch,
  onOpenImportModal,
}) => {
  const [team1, setTeam1] = useState('My Team CC');
  const [opponent, setOpponent] = useState('Coastal Hurricanes');
  const [category, setCategory] = useState<MatchCategory>('Practice');
  const [venue, setVenue] = useState('Main Stadium, Pitch #1');
  const [pitch, setPitch] = useState('Green / Pace Track');
  const [overs, setOvers] = useState(25);
  const [tacticalNotes, setTacticalNotes] = useState('Target 180+ total. Target opponent wrist spinner in overs 10-15. Preserve wickets in Powerplay.');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateMatch({
      team1: team1.trim() || 'My Team CC',
      opponent: opponent.trim() || 'Opponent CC',
      category,
      venue: venue.trim() || 'Stadium Pitch #1',
      pitch,
      overs,
      tacticalNotes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-[#151b2b] border border-[#2f3445] rounded-xl shadow-2xl p-6 flex flex-col gap-4 text-[#dde2f8] my-auto max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#242a3a]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#10b981]/20 text-[#4edea3] border border-[#10b981]/30">
              <span className="material-symbols-outlined text-[20px]">add_box</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-[#dde2f8]">Create New Match</h3>
              <p className="text-xs text-[#bbcabf]">Practice, Tournament, or Friendly Match Sheet</p>
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

        {/* External Import Banner */}
        {onOpenImportModal && (
          <div className="p-3 bg-[#191f2f] border border-[#3198dc]/30 rounded-lg flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined text-[#93ccff] text-[20px]">phone_android</span>
              <div className="flex flex-col">
                <span className="font-bold text-[#dde2f8]">Have an Android / CricHeroes Export?</span>
                <span className="text-[11px] text-[#bbcabf]">Import scorecard PDF, CSV or copied text directly.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenImportModal();
              }}
              className="px-3 py-1.5 rounded bg-[#3198dc]/20 text-[#93ccff] hover:bg-[#3198dc]/30 font-bold text-xs border border-[#3198dc]/40 shrink-0"
            >
              Import Scorecard
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          {/* Match Category / Type Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[#bbcabf] font-semibold">Match Category / Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'Practice', label: 'Practice / Intra-Squad', icon: 'sports_cricket' },
                { id: 'Tournament', label: 'Tournament Match', icon: 'emoji_events' },
                { id: 'Friendly', label: 'Friendly Warm-Up', icon: 'handshake' },
                { id: 'Bilateral', label: 'Bilateral Series', icon: 'flag' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id as MatchCategory)}
                  className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                    category === cat.id
                      ? 'bg-[#10b981]/20 text-[#4edea3] border-[#4edea3] font-bold'
                      : 'bg-[#080e1d] text-[#bbcabf] border-[#2f3445] hover:bg-[#191f2f]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                  <span className="text-[11px]">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Teams Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[#bbcabf] font-semibold">Your Team Name</label>
              <input
                type="text"
                value={team1}
                onChange={(e) => setTeam1(e.target.value)}
                placeholder="My Team CC"
                className="h-9 px-3 bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8] outline-none focus:border-[#4edea3]"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[#bbcabf] font-semibold">Opponent Team</label>
              <input
                type="text"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="Opponent CC"
                className="h-9 px-3 bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8] outline-none focus:border-[#4edea3]"
                required
              />
            </div>
          </div>

          {/* Venue */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[#bbcabf] font-semibold">Venue & Pitch Location</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Ground name & pitch #"
              className="h-9 px-3 bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8] outline-none focus:border-[#4edea3]"
              required
            />
          </div>

          {/* Pitch & Format Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[#bbcabf] font-semibold">Pitch Surface Profile</label>
              <select
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                className="h-9 px-2 bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8] outline-none focus:border-[#4edea3]"
              >
                <option value="Dry / Spin Track">Dry / Spin Track</option>
                <option value="Green / Pace Track">Green / Pace Track</option>
                <option value="Flat / Batting Track">Flat / Batting Track</option>
                <option value="Damp / Low Bounce">Damp / Low Bounce</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#bbcabf] font-semibold">Over Allocation</label>
              <select
                value={overs}
                onChange={(e) => setOvers(Number(e.target.value))}
                className="h-9 px-2 bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8] outline-none focus:border-[#4edea3]"
              >
                <option value={25}>25 Overs (Max 5.0/bowler)</option>
                <option value={20}>20 Overs (T20 Format)</option>
                <option value={50}>50 Overs (One-Day Format)</option>
              </select>
            </div>
          </div>

          {/* Match Remarks / Tactical Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[#bbcabf] font-semibold flex items-center justify-between">
              <span>Match Remarks / Tactical Notes (Pre-game Strategy)</span>
              <span className="text-[10px] text-[#4edea3]">Persisted in Match Summary</span>
            </label>
            <textarea
              rows={3}
              value={tacticalNotes}
              onChange={(e) => setTacticalNotes(e.target.value)}
              placeholder="Document pre-game strategy, target run rates, key matchups, bowling spell plans..."
              className="p-2.5 bg-[#080e1d] border border-[#2f3445] rounded text-[#dde2f8] outline-none focus:border-[#4edea3] resize-none"
            />
          </div>

          <div className="p-3 bg-[#191f2f] rounded border border-[#242a3a] text-[11px] text-[#bbcabf] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4edea3] text-[18px]">verified</span>
            <span>
              Initializes a fresh, clean scorecard ready for 1st Innings rapid entry with pre-game strategy saved.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#242a3a]">
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
              Initialize Match Sheet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
