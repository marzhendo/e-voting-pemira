export interface CandidateRecord {
  id: string;
  candidate_number: number;
  leader_name: string;
  vice_leader_name: string;
  vision: string;
  mission: string[];
  photo_url: string | null;
  chairman_cv_url?: string | null;
  vice_chairman_cv_url?: string | null;
  is_active: boolean;
  created_at?: string;
}

let DEV_CANDIDATES: CandidateRecord[] = [
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

export function getDevCandidates(): CandidateRecord[] {
  return DEV_CANDIDATES;
}

export function setDevCandidates(candidates: CandidateRecord[]) {
  DEV_CANDIDATES = candidates;
}
