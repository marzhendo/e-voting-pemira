import fs from 'fs';
import path from 'path';

export interface CandidateItem {
  id: string;
  candidate_number: number;
  leader_name: string;
  vice_leader_name: string;
  vision: string;
  mission: string[];
  photo_url?: string | null;
  chairman_cv_url?: string | null;
  vice_chairman_cv_url?: string | null;
  is_active: boolean;
  created_at?: string;
}

export type CandidateRecord = CandidateItem;

const DEFAULT_CANDIDATES: CandidateItem[] = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    candidate_number: 0,
    leader_name: 'Kotak Kosong',
    vice_leader_name: 'Kolom Kosong',
    vision: 'Saluran aspirasi resmi bagi pemilih yang memilih untuk tidak menentukan pasangan calon.',
    mission: ['Mewadahi hak suara pemilih tanpa menentukan pasangan calon terdaftar.'],
    photo_url: null,
    chairman_cv_url: null,
    vice_chairman_cv_url: null,
    is_active: true,
  },
  {
    id: '11111111-1111-1111-1111-111111111111',
    candidate_number: 1,
    leader_name: 'Arya Narendra Putra',
    vice_leader_name: 'Rayhan Al-Fayeed',
    vision: 'Mewujudkan HMIF sebagai wadah kolaborasi mahasiswa Informatika yang aktif, solutif, dan berdampak nyata.',
    mission: [
      'Mendorong kegiatan akademik dan pengembangan skill mahasiswa yang aplikatif.',
      'Membangun komunikasi terbuka antara mahasiswa, himpunan, dan program studi.',
      'Memperluas jejaring dan kolaborasi dengan komunitas teknologi serta alumni.',
    ],
    photo_url: null,
    chairman_cv_url: '/assets/docs/cv-paslon-1-chairman.pdf',
    vice_chairman_cv_url: '/assets/docs/cv-paslon-1-vice-chairman.pdf',
    is_active: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    candidate_number: 2,
    leader_name: 'Dimas Satria Wicaksana',
    vice_leader_name: 'Cynthia Maharani',
    vision: 'Membangun HMIF yang inklusif, profesional, dan responsif terhadap kebutuhan mahasiswa Informatika.',
    mission: [
      'Meningkatkan partisipasi aktif mahasiswa dalam program kerja himpunan.',
      'Menyediakan wadah eksplorasi minat dan bakat di bidang teknologi informasi.',
      'Mewujudkan layanan advokasi mahasiswa yang transparan dan terpercaya.',
    ],
    photo_url: null,
    chairman_cv_url: '/assets/docs/cv-paslon-2-chairman.pdf',
    vice_chairman_cv_url: '/assets/docs/cv-paslon-2-vice-chairman.pdf',
    is_active: true,
  },
];

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'dev-candidates.json');

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[CandidatesStore] Failed to create data directory:', err);
  }
}

let inMemoryCandidates: CandidateItem[] | null = null;

export function getCandidatesStore(): CandidateItem[] {
  if (inMemoryCandidates !== null) {
    return inMemoryCandidates;
  }

  ensureDataDir();
  try {
    if (fs.existsSync(STORE_PATH)) {
      const content = fs.readFileSync(STORE_PATH, 'utf-8');
      inMemoryCandidates = JSON.parse(content) as CandidateItem[];
      return inMemoryCandidates;
    }
  } catch (err) {
    console.warn('[CandidatesStore] Failed to read store file, using defaults:', err);
  }

  inMemoryCandidates = [...DEFAULT_CANDIDATES];
  saveCandidatesStore(inMemoryCandidates);
  return inMemoryCandidates;
}

export function saveCandidatesStore(candidates: CandidateItem[]): void {
  inMemoryCandidates = candidates;
  ensureDataDir();
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(candidates, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[CandidatesStore] Failed to persist candidates to disk:', err);
  }
}

export function getDevCandidates(): CandidateRecord[] {
  return getCandidatesStore();
}

export function setDevCandidates(candidates: CandidateRecord[]): void {
  saveCandidatesStore(candidates);
}

export function addCandidateToStore(candidateData: Omit<CandidateItem, 'id'>): CandidateItem {
  const current = getCandidatesStore();
  const newCandidate: CandidateItem = {
    ...candidateData,
    id: `cand-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    created_at: new Date().toISOString(),
  };

  const updated = [...current.filter((c) => c.candidate_number !== newCandidate.candidate_number), newCandidate].sort(
    (a, b) => a.candidate_number - b.candidate_number
  );
  saveCandidatesStore(updated);
  return newCandidate;
}

export function updateCandidateInStore(id: string, updates: Partial<CandidateItem>): CandidateItem | null {
  const current = getCandidatesStore();
  const exists = current.find((c) => c.id === id);
  if (!exists) return null;

  const updated = current.map((c) => (c.id === id ? { ...c, ...updates } : c));
  saveCandidatesStore(updated);
  return updated.find((c) => c.id === id) || null;
}

export function deleteCandidateFromStore(id: string): boolean {
  const current = getCandidatesStore();
  const filtered = current.filter((c) => c.id !== id);
  if (filtered.length === current.length) return false;

  saveCandidatesStore(filtered);
  return true;
}

export function resetCandidatesStore(): void {
  inMemoryCandidates = [...DEFAULT_CANDIDATES];
  saveCandidatesStore(inMemoryCandidates);
}
