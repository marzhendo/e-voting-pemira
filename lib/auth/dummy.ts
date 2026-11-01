import { resolveUserIdentity, type IdentityResolutionResult } from './voter';

export interface DummyAccount {
  id: string;
  name: string;
  email: string;
  nim?: string;
  role: 'voter' | 'kpr_admin' | 'auditor' | 'super_admin';
  description: string;
  generation?: number;
}

export const DUMMY_ACCOUNTS: DummyAccount[] = [
  {
    id: 'voter1',
    name: 'Ahmad Rizky Pratama',
    email: 'voter1@student.telkomuniversity.ac.id',
    nim: '103012300001',
    role: 'voter',
    generation: 2023,
    description: 'Pemilih sah angkatan 2023 yang BELUM menggunakan hak suara (Happy Path).',
  },
  {
    id: 'voter2',
    name: 'Budi Santoso',
    email: 'voter2@student.telkomuniversity.ac.id',
    nim: '103012300002',
    role: 'voter',
    generation: 2023,
    description: 'Pemilih sah yang SUDAH mencoblos sebelumnya (Uji penolakan double-voting).',
  },
  {
    id: 'voter3',
    name: 'Citra Dewi Lestari',
    email: 'voter3@student.telkomuniversity.ac.id',
    nim: '103012400003',
    role: 'voter',
    generation: 2024,
    description: 'Pemilih sah angkatan 2024 untuk pengujian konkurensi (Race Condition).',
  },
  {
    id: 'unregistered',
    name: 'Mahasiswa Luar DPT',
    email: 'unregistered@student.telkomuniversity.ac.id',
    nim: '103012399999',
    role: 'voter',
    description: 'Akun mahasiswa yang TIDAK TERDAFTAR dalam DPT resmi (Uji batasan whitelist).',
  },
  {
    id: 'superadmin',
    name: 'Koordinator IT / Superadmin',
    email: 'superadmin@student.telkomuniversity.ac.id',
    role: 'super_admin',
    description: 'Hak akses tertinggi untuk konfigurasi sistem dan maintenance darurat.',
  },
  {
    id: 'kpradmin',
    name: 'Ketua Panitia KPR',
    email: 'kpradmin@student.telkomuniversity.ac.id',
    role: 'kpr_admin',
    description: 'Penyelenggara Pemira untuk manajemen jadwal, kandidat, dan impor DPT.',
  },
  {
    id: 'auditor',
    name: 'Pengawas / Auditor Independen',
    email: 'auditor@student.telkomuniversity.ac.id',
    role: 'auditor',
    description: 'Peran read-only untuk audit log dan rekapitulasi akhir.',
  },
];

/**
 * Checks whether dummy authentication is permitted.
 * 
 * STRICT INVARIANT:
 * Dummy authentication is strictly prohibited in production environments.
 * Must fail-closed if NODE_ENV or APP_ENV is 'production'.
 */
export function isDummyAuthAllowed(): boolean {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.APP_ENV === 'production';

  if (isProduction) {
    return false;
  }

  return process.env.ENABLE_DUMMY_AUTH === 'true';
}

/**
 * Simulates authentication with a synthetic mock account and exercises
 * the identical server-side DPT/RBAC identity resolution.
 */
export async function authenticateDummyUser(accountId: string): Promise<IdentityResolutionResult> {
  if (!isDummyAuthAllowed()) {
    return {
      success: false,
      code: 'ERROR',
      message: 'Akses ditolak: Autentikasi dummy dilarang keras aktif pada lingkungan produksi.',
    };
  }

  const account = DUMMY_ACCOUNTS.find((acc) => acc.id === accountId);
  if (!account) {
    return {
      success: false,
      code: 'NOT_FOUND',
      message: 'Akun dummy pengujian tidak ditemukan.',
    };
  }

  // Menjalankan alur resolusi identitas server-side yang sama persis dengan Microsoft Entra
  return resolveUserIdentity({
    email: account.email,
    name: account.name,
    entraTenantId: '00000000-0000-0000-0000-000000000001',
    entraObjectId: `00000000-0000-0000-0000-${account.id.padEnd(12, '0')}`,
  });
}
