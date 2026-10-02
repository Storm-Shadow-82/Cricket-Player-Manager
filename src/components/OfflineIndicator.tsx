import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-[#ffb95f] text-[#3d2400] px-4 py-2 text-xs font-bold shadow-2xl border border-[#ffb95f]/40 animate-bounce">
      <span className="h-2.5 w-2.5 rounded-full bg-[#3d2400] animate-ping" />
      <span className="material-symbols-outlined text-[18px]">wifi_off</span>
      <span>Offline PWA Mode — Match data is saved locally to device storage!</span>
    </div>
  );
};
