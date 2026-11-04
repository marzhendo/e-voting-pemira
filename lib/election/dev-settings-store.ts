export interface ElectionSettingsRecord {
  id: number;
  is_voting_open: boolean;
  maintenance_mode: boolean;
  start_time: string;
  end_time: string;
  updated_at?: string;
}

// In-memory dev fallback when Supabase is not configured or in local development
let DEV_SETTINGS: ElectionSettingsRecord = {
  id: 1,
  is_voting_open: true,
  maintenance_mode: false,
  start_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  end_time: new Date(Date.now() + 28800000).toISOString(),   // 8 hours from now
  updated_at: new Date().toISOString(),
};

export function getDevElectionSettings(): ElectionSettingsRecord {
  return DEV_SETTINGS;
}

export function updateDevElectionSettings(updates: Partial<ElectionSettingsRecord>): ElectionSettingsRecord {
  DEV_SETTINGS = {
    ...DEV_SETTINGS,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  return DEV_SETTINGS;
}
