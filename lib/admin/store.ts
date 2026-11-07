import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { AdminRole } from '@/lib/supabase/types';

export interface AdminUserRecord {
  id: string;
  nim?: string;
  name: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'dev-admins.json');

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[AdminStore] Failed to create data directory:', err);
  }
}

const DEFAULT_ADMINS: AdminUserRecord[] = [
  {
    id: 'admin-super-marzhendo',
    nim: '999999999999',
    name: 'Marzhendo Galang (Superadmin)',
    email: 'marzhendogalangs@gmail.com',
    role: 'super_admin',
    is_active: true,
    created_at: '2026-11-04T00:00:00.000Z',
    updated_at: '2026-11-04T00:00:00.000Z',
  },
  {
    id: 'admin-kpr-ketua',
    nim: '103012300091',
    name: 'Ketua Panitia KPR',
    email: 'kpradmin@student.telkomuniversity.ac.id',
    role: 'kpr_admin',
    is_active: true,
    created_at: '2026-11-04T00:00:00.000Z',
    updated_at: '2026-11-04T00:00:00.000Z',
  },
  {
    id: 'admin-auditor-dpm',
    nim: '103012300092',
    name: 'Auditor Independen (DPM)',
    email: 'auditor@student.telkomuniversity.ac.id',
    role: 'auditor',
    is_active: true,
    created_at: '2026-11-04T00:00:00.000Z',
    updated_at: '2026-11-04T00:00:00.000Z',
  },
];

let inMemoryAdmins: AdminUserRecord[] | null = null;

export function getAllAdminUsers(): AdminUserRecord[] {
  ensureDataDir();
  try {
    if (fs.existsSync(STORE_PATH)) {
      const content = fs.readFileSync(STORE_PATH, 'utf-8');
      inMemoryAdmins = JSON.parse(content) as AdminUserRecord[];
      return inMemoryAdmins;
    }
  } catch (err) {
    console.warn('[AdminStore] Failed to read store file, using defaults:', err);
  }

  if (inMemoryAdmins !== null) {
    return inMemoryAdmins;
  }

  inMemoryAdmins = [...DEFAULT_ADMINS];
  saveAdminsStore(inMemoryAdmins);
  return inMemoryAdmins;
}

export function saveAdminsStore(admins: AdminUserRecord[]): void {
  inMemoryAdmins = admins;
  ensureDataDir();
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(admins, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[AdminStore] Failed to persist admins to disk:', err);
  }
}

export function findAdminByEmail(email: string): AdminUserRecord | null {
  const all = getAllAdminUsers();
  const clean = email.trim().toLowerCase();
  return all.find((a) => a.email.toLowerCase() === clean && a.is_active) || null;
}

export function addAdminUser(params: {
  name: string;
  email: string;
  nim?: string;
  role: AdminRole;
}): { success: boolean; admin?: AdminUserRecord; error?: string } {
  const all = getAllAdminUsers();
  const cleanEmail = params.email.trim().toLowerCase();

  if (all.some((a) => a.email.toLowerCase() === cleanEmail)) {
    return {
      success: false,
      error: `Email ${cleanEmail} sudah terdaftar sebagai pengelola/administrator.`,
    };
  }

  const now = new Date().toISOString();
  const newAdmin: AdminUserRecord = {
    id: `admin-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    nim: params.nim ? params.nim.trim() : undefined,
    name: params.name.trim(),
    email: cleanEmail,
    role: params.role,
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  const updated = [...all, newAdmin];
  saveAdminsStore(updated);

  // Sync ke Supabase admin_users jika live
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    import('@/lib/supabase/admin')
      .then(({ isSupabaseConfigured, createAdminClient }) => {
        if (isSupabaseConfigured()) {
          const adminSupabase = createAdminClient();
          adminSupabase.from('admin_users').insert({
            email: newAdmin.email,
            role: newAdmin.role,
            is_active: true,
            created_at: now,
            updated_at: now,
          }).then();
        }
      })
      .catch(() => {});
  }

  return { success: true, admin: newAdmin };
}

export function updateAdminRole(
  id: string,
  newRole: AdminRole
): { success: boolean; admin?: AdminUserRecord; error?: string } {
  const all = getAllAdminUsers();
  const index = all.findIndex((a) => a.id === id);

  if (index === -1) {
    return { success: false, error: 'Akun administrator tidak ditemukan.' };
  }

  const current = all[index];
  const updatedAdmin: AdminUserRecord = {
    ...current,
    role: newRole,
    updated_at: new Date().toISOString(),
  };

  all[index] = updatedAdmin;
  saveAdminsStore(all);

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    import('@/lib/supabase/admin')
      .then(({ isSupabaseConfigured, createAdminClient }) => {
        if (isSupabaseConfigured()) {
          const adminSupabase = createAdminClient();
          adminSupabase.from('admin_users').update({
            role: newRole,
            updated_at: updatedAdmin.updated_at,
          }).eq('email', current.email).then();
        }
      })
      .catch(() => {});
  }

  return { success: true, admin: updatedAdmin };
}

export function toggleAdminActive(
  id: string,
  isActive: boolean
): { success: boolean; admin?: AdminUserRecord; error?: string } {
  const all = getAllAdminUsers();
  const index = all.findIndex((a) => a.id === id);

  if (index === -1) {
    return { success: false, error: 'Akun administrator tidak ditemukan.' };
  }

  const current = all[index];
  const updatedAdmin: AdminUserRecord = {
    ...current,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  };

  all[index] = updatedAdmin;
  saveAdminsStore(all);

  return { success: true, admin: updatedAdmin };
}

export function deleteAdminUser(id: string): { success: boolean; error?: string } {
  const all = getAllAdminUsers();
  const target = all.find((a) => a.id === id);

  if (!target) {
    return { success: false, error: 'Akun administrator tidak ditemukan.' };
  }

  // Lindungi Superadmin utama agar tidak terhapus
  if (target.email === 'marzhendogalangs@gmail.com') {
    return { success: false, error: 'Akun Superadmin utama tidak dapat dihapus.' };
  }

  const updated = all.filter((a) => a.id !== id);
  saveAdminsStore(updated);

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    import('@/lib/supabase/admin')
      .then(({ isSupabaseConfigured, createAdminClient }) => {
        if (isSupabaseConfigured()) {
          const adminSupabase = createAdminClient();
          adminSupabase.from('admin_users').delete().eq('email', target.email).then();
        }
      })
      .catch(() => {});
  }

  return { success: true };
}
