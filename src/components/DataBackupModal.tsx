import React, { useRef, useState } from 'react';
import { STORAGE_KEYS } from '../utils/storage';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  // Export all localStorage keys as a downloadable JSON file
  const handleExportBackup = () => {
    try {
      const backupData: Record<string, unknown> = {
        _exportDate: new Date().toISOString(),
        _app: 'CRIC-TACTIC Pro Analytics PWA',
        _version: '2.4.0',
      };

      Object.values(STORAGE_KEYS).forEach((key) => {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            backupData[key] = JSON.parse(item);
          } catch {
            backupData[key] = item;
          }
        }
      });

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cric-tactic-offline-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onShowToast('Successfully downloaded full offline JSON backup file!');
    } catch (err) {
      console.error('Backup export failed:', err);
      onShowToast('Failed to generate backup file.');
    }
  };

  // Restore backup from JSON file
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed._app || !parsed._app.includes('CRIC-TACTIC')) {
          onShowToast('Invalid backup file format. Expected CRIC-TACTIC JSON file.');
          return;
        }

        let restoredCount = 0;
        Object.values(STORAGE_KEYS).forEach((key) => {
          if (parsed[key] !== undefined) {
            localStorage.setItem(key, JSON.stringify(parsed[key]));
            restoredCount++;
          }
        });

        onShowToast(`Restored ${restoredCount} offline datasets! Reloading app...`);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (err) {
        console.error('Backup import failed:', err);
        onShowToast('Error reading JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  // Factory reset local storage
  const handleFactoryReset = () => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    onShowToast('Factory reset complete. Reloading clean initial state...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-[#151b2b] border border-[#2f3445] rounded-xl shadow-2xl p-6 flex flex-col gap-5 text-[#dde2f8]">
        <div className="flex items-center justify-between pb-3 border-b border-[#242a3a]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4edea3] text-[22px]">sd_card</span>
            <h2 className="text-lg font-bold">Offline Data Backup & Restore</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#bbcabf] hover:text-[#dde2f8] p-1 rounded hover:bg-[#242a3a]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p className="text-xs text-[#bbcabf] leading-relaxed">
          CRIC-TACTIC operates 100% offline. All match scorecards, archives, and player rosters are stored locally on this device. Use backup/restore to transfer data or safeguard records.
        </p>

        <div className="flex flex-col gap-3">
          {/* Export JSON Backup */}
          <button
            type="button"
            onClick={handleExportBackup}
            className="p-3 bg-[#080e1d] hover:bg-[#101728] border border-[#2f3445] hover:border-[#4edea3] rounded-lg flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#4edea3] text-[24px]">download</span>
              <div className="flex flex-col text-left">
                <span className="font-bold text-xs text-[#dde2f8] group-hover:text-[#4edea3]">Download JSON Data Backup</span>
                <span className="text-[10px] text-[#bbcabf]">Export all games, rosters, and scorecards to a single file</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-[#bbcabf]">chevron_right</span>
          </button>

          {/* Import JSON Backup */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-[#080e1d] hover:bg-[#101728] border border-[#2f3445] hover:border-[#93ccff] rounded-lg flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#93ccff] text-[24px]">upload_file</span>
              <div className="flex flex-col text-left">
                <span className="font-bold text-xs text-[#dde2f8] group-hover:text-[#93ccff]">Restore from JSON Backup File</span>
                <span className="text-[10px] text-[#bbcabf]">Import previously saved CRIC-TACTIC offline backup</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-[#bbcabf]">chevron_right</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportBackup}
            className="hidden"
          />

          {/* Factory Reset */}
          <div className="pt-2 border-t border-[#242a3a]">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="w-full py-2 bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/30 hover:bg-[#ffb4ab]/20 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span>Reset Local Offline Storage</span>
              </button>
            ) : (
              <div className="p-3 bg-[#ffb4ab]/15 border border-[#ffb4ab]/40 rounded-lg flex flex-col gap-2">
                <span className="text-xs text-[#ffb4ab] font-bold text-center">
                  Are you sure? This will wipe device storage and reset to default sample match.
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="flex-1 py-1.5 rounded bg-[#242a3a] text-xs font-semibold text-[#dde2f8]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleFactoryReset}
                    className="flex-1 py-1.5 rounded bg-[#ffb4ab] text-[#600004] text-xs font-bold"
                  >
                    Yes, Reset Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-[#242a3a]">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded bg-[#242a3a] text-[#dde2f8] hover:bg-[#2f3445] text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
