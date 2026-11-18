import { resolveUserIdentity, type IdentityResolutionResult } from './voter';
import { isProductionEnvironment } from '@/lib/security/env';

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
    id: 'voter-tester-marzhendo',
    name: 'Marzhendo (Tester Real Email)',
    email: 'marzhendo03@gmail.com',
    nim: '103012400099',
    role: 'voter',
    generation: 2024,
    description: 'Akun pemilih terdaftar DPT dengan email riil marzhendo03@gmail.com untuk uji coba OTP & SMTP.',
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
    name: 'Marzhendo Galang (Superadmin)',
    email: 'marzhendogalangs@gmail.com',
    nim: '999999999999',
    role: 'super_admin',
    description: 'Akun Superadmin resmi dengan hak akses penuh sistem dan maintenance darurat.',
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
 * Dummy authentication is strictly prohibited when APP_ENV is 'production'.
 * In non-production environments (development, staging, test), ENABLE_DUMMY_AUTH must be 'true'.
 */
export function isDummyAuthAllowed(): boolean {
  if (isProductionEnvironment()) {
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

  // Coba jalankan alur database Supabase hanya jika kredensial terkonfigurasi nyata
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id') &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder');

  if (isSupabaseConfigured) {
    try {
      const hexObjectId = Buffer.from(account.id).toString('hex').slice(0, 12).padStart(12, '0');
      const dbResult = await resolveUserIdentity({
        email: account.email,
        name: account.name,
        entraTenantId: '00000000-0000-0000-0000-000000000001',
        entraObjectId: `00000000-0000-0000-0000-${hexObjectId}`,
      });

      if (dbResult.success || dbResult.code === 'ALREADY_VOTED' || dbResult.code === 'NOT_FOUND') {
        return dbResult;
      }
    } catch (err) {
      console.warn('[DummyAuth] Database offline or unreachable, falling back to in-memory mock account:', err);
    }
  }

  // MOCK FALLBACK (Khusus pengujian dev lokal tanpa database Supabase):
  if (account.id === 'unregistered') {
    return {
      success: false,
      code: 'NOT_FOUND',
      message: 'Akun Anda tidak terdaftar dalam Daftar Pemilih Tetap (DPT) resmi KEMA HMIF.',
    };
  }

  const isDpt = account.role === 'voter';
  const hasVoted = account.id === 'voter2';

  return {
    success: true,
    code: hasVoted ? 'ALREADY_VOTED' : 'ELIGIBLE',
    message: 'Login simulasi berhasil (Mode Pengujian Lokal).',
    user: {
      id: `mock-${account.id}`,
      email: account.email,
      name: account.name,
      nim: account.nim,
      role: account.role,
      isDptVerified: isDpt,
      hasVoted,
      generation: account.generation || 2023,
      entraTenantId: '00000000-0000-0000-0000-000000000001',
      entraObjectId: `00000000-0000-0000-0000-${account.id.padEnd(12, '0')}`,
    },
  };
}
