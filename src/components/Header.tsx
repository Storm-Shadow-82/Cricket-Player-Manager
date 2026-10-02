import React, { useRef } from 'react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onExportPdf: () => void;
  onNewMatchDraft: () => void;
  onOpenImportModal?: () => void;
  onOpenBackupModal?: () => void;
  isCollapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onExportPdf,
  onNewMatchDraft,
  onOpenImportModal,
  onOpenBackupModal,
  isCollapsed,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-[#0d1322]/95 backdrop-blur-md border-b border-[#242a3a] z-40 flex items-center justify-between px-6 transition-all duration-300 ${
        isCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Left Breadcrumb & League Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 text-xs text-[#bbcabf] truncate">
          <span className="hover:text-[#dde2f8] transition-colors cursor-pointer hidden sm:inline">Premier 25-Overs Cup</span>
          <span className="material-symbols-outlined text-[14px] text-[#2f3445] hidden sm:inline">chevron_right</span>
          <span className="text-[#dde2f8] font-semibold truncate">Matchday 06</span>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-[#10b981]/15 text-[#4edea3] text-[11px] font-semibold border border-[#10b981]/30 hidden lg:inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
          25-Over Rules
        </span>
      </div>

      {/* Right Actions & Search */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Search input */}
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-2.5 text-[#bbcabf] text-[18px]">search</span>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players, matches..."
            className="w-40 sm:w-56 h-8 pl-8 pr-7 bg-[#080e1d] text-[#dde2f8] placeholder:text-[#bbcabf]/70 rounded text-xs outline-none focus:ring-1 focus:ring-[#4edea3] border border-[#2f3445] transition-all"
          />
          <kbd className="hidden sm:inline-flex absolute right-2 px-1.5 py-0.5 rounded bg-[#1f2638] text-[#bbcabf] text-[10px] font-mono border border-[#2f3445]">
            /
          </kbd>
        </div>

        {/* PWA Install App Prompt */}
        <PWAInstallButton />

        {/* Offline Backup Button */}
        {onOpenBackupModal && (
          <button
            type="button"
            onClick={onOpenBackupModal}
            className="h-8 px-2.5 rounded-lg bg-[#151b2b] text-[#bbcabf] hover:text-[#4edea3] hover:bg-[#1f2638] text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#2f3445]"
            title="Offline JSON Backup & Restore"
          >
            <span className="material-symbols-outlined text-[16px]">sd_card</span>
            <span className="hidden xl:inline">Backup</span>
          </button>
        )}

        {/* Buttons */}
        {onOpenImportModal && (
          <button
            type="button"
            onClick={onOpenImportModal}
            className="h-8 px-3 rounded-lg bg-[#191f2f] text-[#4edea3] hover:bg-[#242a3a] text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#10b981]/30"
            title="Import Scorecard PDF / Text / CricHeroes Export"
          >
            <span className="material-symbols-outlined text-[16px]">file_upload</span>
            <span className="hidden lg:inline">Import External</span>
          </button>
        )}

        <button
          type="button"
          onClick={onExportPdf}
          className="h-8 px-3 rounded-lg bg-[#151b2b] text-[#93ccff] hover:bg-[#1f2638] text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#3198dc]/30"
          title="Export Dossier PDF"
        >
          <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
          <span className="hidden md:inline">PDF Report</span>
        </button>

        <button
          type="button"
          onClick={onNewMatchDraft}
          className="h-8 px-3.5 rounded-lg bg-[#4edea3] text-[#003824] text-xs font-bold hover:brightness-110 flex items-center gap-1.5 transition-all shadow"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span className="hidden sm:inline">New Match</span>
        </button>
      </div>
    </header>
  );
};
