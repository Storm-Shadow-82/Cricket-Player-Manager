import React from 'react';
import { ActiveTab, CoachProfile } from '../types/cricket';
import { LOGO_URL } from '../data/mockData';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  coachProfile: CoachProfile;
  onOpenSettings: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  onOpenLogin: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  coachProfile,
  onOpenSettings,
  isCollapsed,
  setIsCollapsed,
  isLoggedIn,
  onLogout,
  onOpenLogin,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'matchday-live-scoring', label: 'Matchday Live Scoring', icon: 'sports_cricket' },
    { id: 'scorecard-rapid-entry', label: 'Scorecard & Rapid Entry', icon: 'edit_note' },
    { id: 'playing-xi-workbench', label: 'Playing XI Workbench', icon: 'groups' },
    { id: 'squad-database-dossier', label: 'Squad Database & Dossier', icon: 'badge' },
    { id: 'match-history-archives', label: 'Match History & Archives', icon: 'history_edu' },
    { id: 'tournament-telemetry', label: 'Tournament Telemetry', icon: 'query_stats' },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-[#151b2b] z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-[#242a3a] transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col">
        {/* Logo Header */}
        <div className="h-16 px-3 flex items-center justify-between bg-[#080e1d] border-b border-[#2f3445]">
          <div className="flex items-center gap-2 overflow-hidden">
            <img 
              src={LOGO_URL} 
              alt="CRIC-TACTIC Logo" 
              className="h-8 w-8 object-contain rounded bg-[#0d1322] p-0.5 border border-[#3c4a42] shrink-0"
            />
            {!isCollapsed && (
              <div className="flex flex-col leading-tight truncate">
                <span className="text-sm font-bold text-[#dde2f8] tracking-tight truncate">CRIC-TACTIC</span>
                <span className="text-[10px] text-[#4edea3] uppercase font-semibold tracking-wider">v2.4 Pro</span>
              </div>
            )}
          </div>
          <button 
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="text-[#bbcabf] hover:text-[#dde2f8] p-1.5 rounded hover:bg-[#191f2f] transition-colors shrink-0"
            title={isCollapsed ? 'Expand Deck' : 'Collapse Deck'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isCollapsed ? 'menu' : 'menu_open'}
            </span>
          </button>
        </div>

        {/* Section Title */}
        <div className="px-4 py-3">
          <span className="text-[10px] uppercase text-[#bbcabf] font-semibold tracking-wider px-1">
            {isCollapsed ? 'Deck' : 'Operations Deck'}
          </span>
        </div>

        {/* Navigation items */}
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left font-medium ${
                  isCollapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-[#10b981] text-[#003824] font-semibold shadow-md'
                    : 'text-[#bbcabf] hover:bg-[#242a3a] hover:text-[#dde2f8]'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] shrink-0 ${isActive ? 'text-[#003824]' : 'text-[#bbcabf]'}`}>
                  {item.icon}
                </span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile Card */}
      <div className={`p-2 m-2 bg-[#191f2f] rounded-lg border border-[#2f3445] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-2 overflow-hidden">
          <img 
            src={isLoggedIn ? coachProfile.avatarUrl : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
            alt={coachProfile.name} 
            className={`w-8 h-8 rounded-full object-cover shrink-0 ring-1 ${isLoggedIn ? 'ring-[#4edea3]' : 'ring-[#bbcabf]'}`}
          />
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="text-xs text-[#dde2f8] font-semibold truncate">
                {isLoggedIn ? coachProfile.name : 'Guest User'}
              </span>
              <span className="text-[10px] text-[#bbcabf] truncate">
                {isLoggedIn ? `${coachProfile.team} • ${coachProfile.role}` : 'Logged Out'}
              </span>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <div className="flex items-center gap-1 shrink-0">
            {isLoggedIn ? (
              <>
                <button 
                  type="button"
                  onClick={onOpenSettings}
                  className="text-[#bbcabf] hover:text-[#dde2f8] p-1.5 rounded hover:bg-[#242a3a] transition-colors"
                  title="Coach Profile Settings"
                >
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                </button>
                <button 
                  type="button"
                  onClick={onLogout}
                  className="text-[#ffb4ab] hover:text-[#ff8080] hover:bg-[#ffb4ab]/10 p-1.5 rounded transition-colors"
                  title="Log Out of Coach Account"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="px-2.5 py-1 rounded bg-[#4edea3] text-[#003824] text-[11px] font-bold hover:brightness-110 flex items-center gap-1 shadow"
              >
                <span className="material-symbols-outlined text-[14px]">login</span>
                <span>Log In</span>
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
