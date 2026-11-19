import fs from 'fs';
import path from 'path';

export interface ElectionSettingsRecord {
  id: number;
  is_voting_open: boolean;
  maintenance_mode: boolean;
  start_time: string;
  end_time: string;
  allow_kotak_kosong_multi: boolean;
  updated_at?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_STORE_PATH = path.join(DATA_DIR, 'dev-settings.json');

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[DevSettingsStore] Gagal membuat direktori data:', err);
  }
}

// In-memory dev fallback when Supabase is not configured or in local development
const DEFAULT_SETTINGS: ElectionSettingsRecord = {
  id: 1,
  is_voting_open: true,
  maintenance_mode: false,
  start_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  end_time: new Date(Date.now() + 28800000).toISOString(),   // 8 hours from now
  allow_kotak_kosong_multi: true,
  updated_at: new Date().toISOString(),
};

let inMemorySettings: ElectionSettingsRecord | null = null;

export function getDevElectionSettings(): ElectionSettingsRecord {
  ensureDataDir();
  try {
    if (fs.existsSync(SETTINGS_STORE_PATH)) {
      const raw = fs.readFileSync(SETTINGS_STORE_PATH, 'utf-8');
      inMemorySettings = JSON.parse(raw) as ElectionSettingsRecord;
      return inMemorySettings;
    }
  } catch (err) {
    console.warn('[DevSettingsStore] Gagal membaca dev-settings.json, menggunakan in-memory default:', err);
  }

  if (inMemorySettings !== null) {
    return inMemorySettings;
  }

  inMemorySettings = { ...DEFAULT_SETTINGS };
  saveDevSettings(inMemorySettings);
  return inMemorySettings;
}

function saveDevSettings(settings: ElectionSettingsRecord): void {
  ensureDataDir();
  try {
    fs.writeFileSync(SETTINGS_STORE_PATH, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[DevSettingsStore] Gagal menyimpan dev-settings.json:', err);
  }
}

export function updateDevElectionSettings(updates: Partial<ElectionSettingsRecord>): ElectionSettingsRecord {
  const current = getDevElectionSettings();
  inMemorySettings = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  saveDevSettings(inMemorySettings);
  return inMemorySettings;
}
