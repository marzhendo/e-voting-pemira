import fs from 'fs';
import path from 'path';

export interface VoterRecord {
  id: string;
  nim: string;
  name: string;
  email: string;
  generation: number;
  has_voted: boolean;
  updated_at?: string;
  created_at?: string;
}

const DEFAULT_VOTERS: VoterRecord[] = [
  {
    id: 'voter-1',
    nim: '103012300001',
    name: 'Ahmad Rizky Pratama',
    email: 'voter1@student.telkomuniversity.ac.id',
    generation: 2023,
    has_voted: false,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'voter-2',
    nim: '103012300002',
    name: 'Budi Santoso',
    email: 'voter2@student.telkomuniversity.ac.id',
    generation: 2023,
    has_voted: false,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'voter-3',
    nim: '103012400003',
    name: 'Citra Dewi Lestari',
    email: 'voter3@student.telkomuniversity.ac.id',
    generation: 2024,
    has_voted: false,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'voter-4',
    nim: '103012400004',
    name: 'Dimas Wicaksono',
    email: 'dimasw@student.telkomuniversity.ac.id',
    generation: 2024,
    has_voted: false,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'voter-5',
    nim: '103012500005',
    name: 'Fadhil Muhammad',
    email: 'fadhilm@student.telkomuniversity.ac.id',
    generation: 2025,
    has_voted: false,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'voter-6',
    nim: '103012600006',
    name: 'Siti Nurhaliza',
    email: 'sitinur@student.telkomuniversity.ac.id',
    generation: 2026,
    has_voted: false,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'voter-tester-marzhendo',
    nim: '103012400099',
    name: 'Marzhendo',
    email: 'marzhendo03@gmail.com',
    generation: 2024,
    has_voted: false,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'voter-tester-galang',
    nim: '103112400102',
    name: 'Penguji Sistem KPR (Galang)',
    email: 'marzhendogalang@student.telkomuniversity.ac.id',
    generation: 2024,
    has_voted: false,
    updated_at: new Date().toISOString(),
  },
];

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'dev-voters.json');

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[DptStore] Failed to create data directory:', err);
  }
}

let inMemoryVoters: VoterRecord[] | null = null;

export function getAllVoters(): VoterRecord[] {
  if (inMemoryVoters !== null) {
    return inMemoryVoters;
  }

  ensureDataDir();
  try {
    if (fs.existsSync(STORE_PATH)) {
      const content = fs.readFileSync(STORE_PATH, 'utf-8');
      inMemoryVoters = JSON.parse(content) as VoterRecord[];
      return inMemoryVoters;
    }
  } catch (err) {
    console.warn('[DptStore] Failed to read store file, using defaults:', err);
  }

  inMemoryVoters = [...DEFAULT_VOTERS];
  saveVotersStore(inMemoryVoters);
  return inMemoryVoters;
}

export function saveVotersStore(voters: VoterRecord[]): void {
  inMemoryVoters = voters;
  ensureDataDir();
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(voters, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[DptStore] Failed to persist voters to disk:', err);
  }
}

export function queryVoters(params?: {
  search?: string;
  generation?: string | number;
  status?: 'voted' | 'not_voted' | 'all' | null;
  limit?: number;
  offset?: number;
}): { voters: VoterRecord[]; total: number } {
  const all = getAllVoters();
  let filtered = [...all];

  if (params?.search && params.search.trim()) {
    const q = params.search.trim().toLowerCase();
    filtered = filtered.filter(
      (v) =>
        v.nim.toLowerCase().includes(q) ||
        v.name.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q)
    );
  }

  if (params?.generation && params.generation !== 'all') {
    const gen = Number(params.generation);
    if (!isNaN(gen)) {
      filtered = filtered.filter((v) => v.generation === gen);
    }
  }

  if (params?.status === 'voted') {
    filtered = filtered.filter((v) => v.has_voted);
  } else if (params?.status === 'not_voted') {
    filtered = filtered.filter((v) => !v.has_voted);
  }

  filtered.sort((a, b) => a.nim.localeCompare(b.nim));

  const total = filtered.length;
  const offset = params?.offset || 0;
  const limit = params?.limit || 50;
  const paged = filtered.slice(offset, offset + limit);

  return { voters: paged, total };
}

export function findVoterByIdentifier(identifier: string): VoterRecord | null {
  const all = getAllVoters();
  const clean = identifier.trim().toLowerCase();
  return (
    all.find(
      (v) =>
        v.nim.toLowerCase() === clean ||
        v.email.toLowerCase() === clean ||
        (clean === 'voter1' && v.nim === '103012300001') ||
        (clean === 'voter2' && v.nim === '103012300002') ||
        (clean === 'voter3' && v.nim === '103012400003')
    ) || null
  );
}

export function importVotersBatch(
  rows: Array<{ nim: string; name: string; email: string; generation: number }>
): { insertedCount: number; total: number } {
  const current = getAllVoters();
  const existingNims = new Set(current.map((v) => v.nim.trim()));
  const existingEmails = new Set(current.map((v) => v.email.trim().toLowerCase()));

  const newRecords: VoterRecord[] = [];

  for (const row of rows) {
    const nim = row.nim.trim();
    const email = row.email.trim().toLowerCase();

    // Jika sudah ada, lewati atau update
    if (existingNims.has(nim) || existingEmails.has(email)) {
      continue;
    }

    existingNims.add(nim);
    existingEmails.add(email);
    newRecords.push({
      id: `voter-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      nim,
      name: row.name.trim(),
      email,
      generation: Number(row.generation),
      has_voted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  const updated = [...current, ...newRecords];
  saveVotersStore(updated);
  return { insertedCount: newRecords.length, total: updated.length };
}

export function addSingleVoter(voter: {
  nim: string;
  name: string;
  email: string;
  generation: number;
}): { success: boolean; voter?: VoterRecord; error?: string } {
  const current = getAllVoters();
  const nim = voter.nim.trim();
  const email = voter.email.trim().toLowerCase();

  if (current.some((v) => v.nim.trim() === nim)) {
    return { success: false, error: `NIM ${nim} sudah terdaftar dalam DPT.` };
  }
  if (current.some((v) => v.email.trim().toLowerCase() === email)) {
    return { success: false, error: `Email ${email} sudah terdaftar dalam DPT.` };
  }

  const newVoter: VoterRecord = {
    id: `voter-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    nim,
    name: voter.name.trim(),
    email,
    generation: Number(voter.generation),
    has_voted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  saveVotersStore([...current, newVoter]);
  return { success: true, voter: newVoter };
}

export function markVoterAsVoted(identifier: string): boolean {
  const current = getAllVoters();
  const clean = identifier.trim().toLowerCase();
  let found = false;

  const updated = current.map((v) => {
    if (v.nim.toLowerCase() === clean || v.email.toLowerCase() === clean) {
      found = true;
      return { ...v, has_voted: true, updated_at: new Date().toISOString() };
    }
    return v;
  });

  if (found) {
    saveVotersStore(updated);
  }
  return found;
}

export function resetVotersStore(): void {
  inMemoryVoters = [...DEFAULT_VOTERS];
  saveVotersStore(inMemoryVoters);
}
