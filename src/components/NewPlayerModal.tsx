import React, { useState, useRef } from 'react';
import { Player } from '../types/cricket';

interface NewPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlayer: (newPlayer: Player) => void;
}

export const NewPlayerModal: React.FC<NewPlayerModalProps> = ({
  isOpen,
  onClose,
  onAddPlayer,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [jerseyNum, setJerseyNum] = useState<number>(7);
  const [role, setRole] = useState<'BATTER' | 'WK-BAT' | 'ALL-RND' | 'PACE SPEC' | 'SPIN SPEC'>('BATTER');
  const [hand, setHand] = useState<'RHB' | 'LHB'>('RHB');
  const [bowlingStyle, setBowlingStyle] = useState('Right-arm Medium');
  const [country, setCountry] = useState('Local Club');
  const [photoUrl, setPhotoUrl] = useState<string>('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPlayer: Player = {
      id: `p-custom-${Date.now()}`,
      jerseyNum,
      name: name.trim(),
      photoUrl,
      role,
      hand,
      bowlingStyle,
      country,
      status: 'active',
      isOverseas: false,
      impactScore: 50,
      matches: 0,
      runs: 0,
      highScore: '0',
      avg: 0,
      sr: 0,
      fifties: 0,
      hundreds: 0,
      overs: 0,
      wickets: 0,
      bbi: '0/0',
      econ: 0,
      catches: 0,
      stumpings: 0,
      recentForm: 'New Athlete',
      powerplaySr: 120,
      middleSr: 115,
      deathSr: 135,
      drySpinAvg: 0,
      drySpinSr: 0,
      greenPaceAvg: 0,
      greenPaceSr: 0,
      flatBatAvg: 0,
      flatBatSr: 0,
      pastLogs: [],
    };

    onAddPlayer(newPlayer);
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#151b2b] border border-[#2f3445] rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-5 text-xs text-[#dde2f8]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#242a3a]">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#4edea3]/20 text-[#4edea3] material-symbols-outlined text-[20px]">
              person_add
            </span>
            <div>
              <h2 className="font-bold text-base text-[#dde2f8]">Add Player to Squad Pool</h2>
              <p className="text-[11px] text-[#bbcabf]">Register a new athlete in your team roster</p>
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
          {/* LOCAL PHOTO UPLOAD */}
          <div className="p-3 bg-[#080e1d] rounded-xl border border-[#2f3445] flex items-center gap-3">
            <img
              src={photoUrl}
              alt="Preview"
              className="w-14 h-14 rounded-full object-cover ring-2 ring-[#4edea3] shrink-0"
            />
            <div className="flex flex-col gap-1.5 w-full">
              <span className="font-bold text-xs text-[#4edea3]">Upload Local Picture from PC</span>
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
                className="h-7 px-3 rounded bg-[#4edea3] text-[#003824] font-bold text-xs hover:brightness-110 flex items-center gap-1 shadow self-start"
              >
                <span className="material-symbols-outlined text-[15px]">folder_open</span>
                <span>Select Image File</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-[#bbcabf]">Player Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. David Miller"
              className="h-9 px-3 bg-[#080e1d] border border-[#2f3445] rounded-lg text-xs font-semibold text-[#dde2f8] outline-none focus:border-[#4edea3]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-[#bbcabf]">Jersey Number</label>
              <input
                type="number"
                min="1"
                max="999"
                value={jerseyNum}
                onChange={(e) => setJerseyNum(Number(e.target.value))}
                className="h-9 px-3 bg-[#080e1d] border border-[#2f3445] rounded-lg text-xs font-bold text-[#4edea3] outline-none"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-[#bbcabf]">Batting Hand</label>
              <select
                value={hand}
                onChange={(e) => setHand(e.target.value as any)}
                className="h-9 px-2 bg-[#080e1d] border border-[#2f3445] rounded-lg text-xs text-[#dde2f8] outline-none"
              >
                <option value="RHB">RHB (Right Hand)</option>
                <option value="LHB">LHB (Left Hand)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-[#bbcabf]">Primary Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="h-9 px-2 bg-[#080e1d] border border-[#2f3445] rounded-lg text-xs text-[#dde2f8] outline-none"
              >
                <option value="BATTER">BATTER</option>
                <option value="WK-BAT">WK-BAT</option>
                <option value="ALL-RND">ALL-RND</option>
                <option value="PACE SPEC">PACE SPEC</option>
                <option value="SPIN SPEC">SPIN SPEC</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-[#bbcabf]">Bowling Style</label>
              <input
                type="text"
                value={bowlingStyle}
                onChange={(e) => setBowlingStyle(e.target.value)}
                placeholder="e.g. Right-arm Fast"
                className="h-9 px-3 bg-[#080e1d] border border-[#2f3445] rounded-lg text-xs text-[#dde2f8] outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
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
              <span className="material-symbols-outlined text-[18px]">check</span>
              <span>Add to Squad Pool</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
