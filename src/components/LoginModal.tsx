import React, { useState } from 'react';
import { CoachProfile } from '../types/cricket';
import { COACH_AVATAR, LOGO_URL } from '../data/mockData';

interface LoginModalProps {
  isOpen: boolean;
  onLogin: (profile: CoachProfile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onLogin }) => {
  const [userId, setUserId] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId.trim().toLowerCase() === 'admin' && password.trim().toLowerCase() === 'admin') {
      setErrorMsg('');
      onLogin({
        name: 'Admin Coach',
        role: 'Head Administrator',
        team: 'Titans CC',
        avatarUrl: COACH_AVATAR,
      });
    } else {
      setErrorMsg('Invalid credentials. Please use User ID: admin & Password: admin');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-sm bg-[#151b2b] border border-[#2f3445] rounded-xl shadow-2xl p-6 flex flex-col gap-5 text-[#dde2f8]">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2 pb-3 border-b border-[#242a3a]">
          <img
            src={LOGO_URL}
            alt="CRIC-TACTIC"
            className="w-12 h-12 object-contain rounded bg-[#0d1322] p-1 border border-[#3c4a42]"
          />
          <h2 className="text-xl font-extrabold text-[#dde2f8]">CRIC-TACTIC Log In</h2>
          <p className="text-xs text-[#bbcabf]">Enter your User ID and Password to sign in.</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-[#ffb4ab]/20 border border-[#ffb4ab]/40 rounded text-[11px] text-[#ffb4ab] font-semibold text-center">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[#bbcabf] font-semibold">User ID</label>
            <input
              type="text"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="admin"
              className="h-10 px-3 bg-[#080e1d] border border-[#2f3445] rounded-lg text-sm text-[#dde2f8] outline-none focus:border-[#4edea3] font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[#bbcabf] font-semibold">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin"
              className="h-10 px-3 bg-[#080e1d] border border-[#2f3445] rounded-lg text-sm text-[#dde2f8] outline-none focus:border-[#4edea3] font-mono"
            />
          </div>

          <div className="p-2 bg-[#080e1d] border border-[#2f3445] rounded text-[10px] text-[#bbcabf] font-mono text-center">
            Default credentials: <strong className="text-[#4edea3]">admin / admin</strong>
          </div>

          <button
            type="submit"
            className="mt-1 h-10 w-full rounded-lg bg-[#4edea3] text-[#003824] font-bold text-sm hover:brightness-110 shadow flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">login</span>
            <span>Log In</span>
          </button>
        </form>
      </div>
    </div>
  );
};
