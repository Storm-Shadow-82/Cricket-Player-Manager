import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, hide button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop install button
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="h-8 px-3.5 bg-[#10b981]/20 text-[#4edea3] hover:bg-[#10b981]/30 border border-[#10b981]/40 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow"
        title="Install CRIC-TACTIC as a native app on your phone or desktop"
      >
        <span className="material-symbols-outlined text-[16px]">install_mobile</span>
        <span>Install PWA App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="h-8 px-3 bg-[#242a3a] text-[#dde2f8] hover:bg-[#2f3445] border border-[#2f3445] text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">apple</span>
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-sm rounded-xl bg-[#151b2b] p-6 shadow-2xl border border-[#2f3445] text-[#dde2f8]">
              <div className="flex items-center gap-2 pb-2 border-b border-[#242a3a] text-[#4edea3] font-bold">
                <span className="material-symbols-outlined text-[20px]">phone_iphone</span>
                <h3 className="text-base font-bold">Install CRIC-TACTIC on iPhone / iPad</h3>
              </div>
              <p className="mt-3 text-xs text-[#bbcabf] leading-relaxed">
                1. Tap the <strong>Share</strong> button in Safari toolbar at the bottom.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-[#4edea3] text-[#003824] py-2 text-xs font-bold hover:brightness-110"
              >
                Close Instructions
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
