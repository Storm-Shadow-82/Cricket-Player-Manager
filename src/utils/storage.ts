// LocalStorage persistence utility for offline PWA operation

const STORAGE_KEYS = {
  MATCH_DATA: 'cric_tactic_match_data_v2',
  BATTERS: 'cric_tactic_batters_v2',
  BOWLERS: 'cric_tactic_bowlers_v2',
  ARCHIVED_MATCHES: 'cric_tactic_archived_matches_v2',
  PLAYERS_POOL: 'cric_tactic_players_pool_v2',
  STARTERS: 'cric_tactic_starters_v2',
  COACH_PROFILE: 'cric_tactic_coach_profile_v2',
  IS_FRESH_SETUP: 'cric_tactic_is_fresh_setup_v2',
  ACTIVE_GAME_ID: 'cric_tactic_active_game_id_v2',
  IS_LOGGED_IN: 'cric_tactic_is_logged_in_v2',
  ALL_RECORDS_VAULT: 'cric_tactic_all_records_vault_v2',
};

export function saveStateToStorage<T>(key: string, value: T): void {
  try {
    const jsonValue = JSON.stringify(value);
    localStorage.setItem(key, jsonValue);
  } catch (err) {
    console.warn(`[PWA Storage] Error saving state for key "${key}":`, err);
  }
}

export function loadStateFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item !== null) {
      return JSON.parse(item) as T;
    }
  } catch (err) {
    console.warn(`[PWA Storage] Error loading state for key "${key}":`, err);
  }
  return defaultValue;
}

export { STORAGE_KEYS };
