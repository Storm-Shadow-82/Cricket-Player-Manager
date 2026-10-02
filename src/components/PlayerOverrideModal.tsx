import React, { useState, useEffect, useRef } from 'react';
import { Player } from '../types/cricket';

interface PlayerOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  onSavePlayer: (updatedPlayer: Player) => void;
}

export const PlayerOverrideModal: React.FC<PlayerOverrideModalProps> = ({
  isOpen,
  onClose,
  player,
  onSavePlayer,
}) => {
  if (!isOpen || !player) return null;

  const [formData, setFormData] = useState<Player>({ ...player });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (player) {
      setFormData({ ...player });
    }
  }, [player]);

  const handleChange = (field: keyof Player, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Auto recalculate average if runs or matches changed
      if (field === 'runs' || field === 'matches') {
        const matches = field === 'matches' ? Number(value) : prev.matches;
        const runs = field === 'runs' ? Number(value) : prev.runs;
        updated.avg = matches > 0 ? Number((runs / matches).toFixed(1)) : 0;
      }

      // Auto recalculate econ if overs or runs changed for bowler
      if (field === 'overs' || field === 'wickets') {
        const overs = field === 'overs' ? Number(value) : prev.overs;
        if (overs > 0 && prev.runs > 0) {
          updated.econ = Number((prev.runs / overs).toFixed(2));
        }
      }

      return updated;
    });
  };

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          handleChange('photoUrl', reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePlayer(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#151b2b] border border-[#2f3445] rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col gap-5 text-xs text-[#dde2f8] my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#242a3a]">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#4edea3]/20 text-[#4edea3] material-symbols-outlined text-[20px]">
              edit_attributes
            </span>
            <div>
              <h2 className="font-bold text-base text-[#dde2f8]">Override Player Data Mode</h2>
              <p className="text-[11px] text-[#bbcabf]">Directly manipulate core profile, photo & career stats for {player.name}</p>
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
          {/* LOCAL PHOTO UPLOAD BANNER */}
          <div className="p-3.5 bg-[#080e1d] rounded-xl border border-[#2f3445] flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              <img
                src={formData.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={formData.name}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-[#4edea3] shadow-lg"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#4edea3] transition-opacity"
                title="Click to select image from PC"
              >
                <span className="material-symbols-outlined text-[22px]">photo_camera</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#4edea3] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">upload_file</span>
                  <span>Player Picture (Local Upload from PC)</span>
                </span>
                <span className="text-[10px] text-[#bbcabf]">JPG, PNG, WEBP</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLocalImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 px-3 rounded bg-[#4edea3] text-[#003824] font-bold text-xs hover:brightness-110 flex items-center gap-1.5 shadow"
                >
                  <span className="material-symbols-outlined text-[16px]">folder_open</span>
                  <span>Choose Local Image File</span>
                </button>

                <span className="text-[11px] text-[#bbcabf]">
                  {formData.photoUrl?.startsWith('data:')
                    ? '✓ Local image loaded from PC'
                    : 'Select any picture file from your device.'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#080e1d] p-3.5 rounded-xl border border-[#2f3445]">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-[#bbcabf]">Player Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="h-8 px-2.5 bg-[#191f2f] border border-[#2f3445] rounded-lg text-xs font-semibold text-[#dde2f8] outline-none focus:border-[#4edea3]"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-[#bbcabf]">Jersey #</label>
              <input
                type="number"
                value={formData.jerseyNum}
                onChange={(e) => handleChange('jerseyNum', Number(e.target.value))}
                className="h-8 px-2.5 bg-[#191f2f] border border-[#2f3445] rounded-lg text-xs font-bold text-[#4edea3] outline-none focus:border-[#4edea3]"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-[#bbcabf]">Role</label>
              <select
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value as any)}
                className="h-8 px-2 bg-[#191f2f] border border-[#2f3445] rounded-lg text-xs text-[#dde2f8] outline-none focus:border-[#4edea3]"
              >
                <option value="BATTER">BATTER</option>
                <option value="WK-BAT">WK-BAT</option>
                <option value="ALL-RND">ALL-RND</option>
                <option value="PACE SPEC">PACE SPEC</option>
                <option value="SPIN SPEC">SPIN SPEC</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-[#bbcabf]">Batting Hand</label>
              <select
                value={formData.hand}
                onChange={(e) => handleChange('hand', e.target.value as any)}
                className="h-8 px-2 bg-[#191f2f] border border-[#2f3445] rounded-lg text-xs text-[#dde2f8] outline-none"
              >
                <option value="RHB">RHB (Right Hand)</option>
                <option value="LHB">LHB (Left Hand)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-[#bbcabf]">Status Pool</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value as any)}
                className="h-8 px-2 bg-[#191f2f] border border-[#2f3445] rounded-lg text-xs text-[#dde2f8] outline-none"
              >
                <option value="active">Active Pool</option>
                <option value="bench">Bench</option>
                <option value="injured">Injured</option>
                <option value="guest">Guest</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-[#bbcabf]">Impact Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.impactScore}
                onChange={(e) => handleChange('impactScore', Number(e.target.value))}
                className="h-8 px-2.5 bg-[#191f2f] border border-[#2f3445] rounded-lg text-xs font-bold text-[#ffb95f] outline-none"
              />
            </div>
          </div>

          {/* Section 2: Batting Stats Override */}
          <div className="p-3.5 bg-[#080e1d] rounded-xl border border-[#2f3445] flex flex-col gap-2">
            <span className="font-bold text-xs text-[#4edea3]">Batting Career Override</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#bbcabf] font-sans">Matches</label>
                <input
                  type="number"
                  value={formData.matches}
                  onChange={(e) => handleChange('matches', Number(e.target.value))}
                  className="h-7 px-2 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#dde2f8]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#bbcabf] font-sans">Total Runs</label>
                <input
                  type="number"
                  value={formData.runs}
                  onChange={(e) => handleChange('runs', Number(e.target.value))}
                  className="h-7 px-2 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#dde2f8]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#bbcabf] font-sans">Strike Rate</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.sr}
                  onChange={(e) => handleChange('sr', Number(e.target.value))}
                  className="h-7 px-2 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#4edea3]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#bbcabf] font-sans">High Score</label>
                <input
                  type="text"
                  value={formData.highScore}
                  onChange={(e) => handleChange('highScore', e.target.value)}
                  className="h-7 px-2 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#dde2f8]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#bbcabf] font-sans">50s</label>
                <input
                  type="number"
                  value={formData.fifties}
                  onChange={(e) => handleChange('fifties', Number(e.target.value))}
                  className="h-7 px-2 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#dde2f8]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#bbcabf] font-sans">100s</label>
                <input
                  type="number"
                  value={formData.hundreds}
                  onChange={(e) => handleChange('hundreds', Number(e.target.value))}
                  className="h-7 px-2 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#dde2f8]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#bbcabf] font-sans">Powerplay SR</label>
                <input
                  type="number"
                  value={formData.powerplaySr}
                  onChange={(e) => handleChange('powerplaySr', Number(e.target.value))}
                  className="h-7 px-2 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#93ccff]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#bbcabf] font-sans">Death SR</label>
                <input
                  type="number"
                  value={formData.deathSr}
                  onChange={(e) => handleChange('deathSr', Number(e.target.value))}
                  className="h-7 px-2 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#4edea3]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Bowling Stats Override */}
          <div className="p-3.5 bg-[#080e1d] rounded-xl border border-[#2f3445] flex flex-col gap-2">
            <span className="font-bold text-xs text-[#93ccff]">Bowling Career Override</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#bbcabf] font-sans">Overs Bowled</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.overs}
                  onChange={(e) => handleChange('overs', Number(e.target.value))}
                  className="h-7 px-2 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#dde2f8]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#bbcabf] font-sans">Wickets</label>
                <input
                  type="number"
                  value={formData.wickets}
                  onChange={(e) => handleChange('wickets', Number(e.target.value))}
                  className="h-7 px-2 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#4edea3]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#bbcabf] font-sans">Economy</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.econ}
                  onChange={(e) => handleChange('econ', Number(e.target.value))}
                  className="h-7 px-2 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#ffb95f]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#bbcabf] font-sans">Best Bowling (BBI)</label>
                <input
                  type="text"
                  value={formData.bbi}
                  onChange={(e) => handleChange('bbi', e.target.value)}
                  className="h-7 px-2 bg-[#191f2f] border border-[#2f3445] rounded text-xs text-[#dde2f8]"
                />
              </div>
            </div>
          </div>

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
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>Save Player Overrides</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
