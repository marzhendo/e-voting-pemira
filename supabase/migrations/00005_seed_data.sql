-- ==============================================================================
-- Migration: 00005_seed_data.sql
-- Description: Initial synthetic seed data for development and testing
-- Warning: DO NOT run this file with synthetic data in a production environment!
-- ==============================================================================

-- 1. PENGATURAN PEMILIHAN AWAL
INSERT INTO public.election_settings (id, is_voting_open, start_time, end_time, maintenance_mode)
VALUES (
    1,
    TRUE,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '7 days',
    FALSE
)
ON CONFLICT (id) DO UPDATE SET
    is_voting_open = EXCLUDED.is_voting_open,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    maintenance_mode = EXCLUDED.maintenance_mode;

-- 2. KANDIDAT PASLON DAN KOTAK KOSONG
INSERT INTO public.candidates (candidate_number, leader_name, vice_leader_name, vision, mission, photo_url, is_active)
VALUES
    (
        0,
        'Kotak Kosong',
        'Tidak Memilih Calon Manapun',
        'Opsi sah bila pemilih memutuskan untuk tidak memberikan suara kepada seluruh pasangan calon terdaftar.',
        ARRAY['Menjaga prinsip kebebasan berekspresi dan hak pilih demokratis mahasiswa.'],
        '/candidates/kotak-kosong.svg',
        TRUE
    ),
    (
        1,
        'Arif Hidayat',
        'Sarah Azzahra',
        'Mewujudkan HMIF yang sinergis, inovatif, dan berdaya saing global berbasis teknologi masa depan.',
        ARRAY[
            'Optimalisasi program kerja inovasi berbasis teknologi.',
            'Peningkatan prestasi akademik dan non-akademik mahasiswa Informatika.',
            'Transparansi penuh dalam advokasi dan pelayanan kemahasiswaan.'
        ],
        '/candidates/paslon-1.webp',
        TRUE
    ),
    (
        2,
        'Bima Wicaksono',
        'Dinda Kirana',
        'Membangun HMIF yang adaptif, kolaboratif, dan inklusif bagi seluruh rumpun angkatan.',
        ARRAY[
            'Penguatan jejaring kolaborasi dengan alumni dan industri teknologi.',
            'Pemberdayaan riset dan pengembangan software open-source mahasiswa.',
            'Kaderisasi kepemimpinan berintegritas dan berwawasan luas.'
        ],
        '/candidates/paslon-2.webp',
        TRUE
    )
ON CONFLICT (candidate_number) DO NOTHING;

-- 3. DPT SINTETIS UNTUK DEVELOPMENT & TESTING
INSERT INTO public.voters_whitelist (nim, email, name, generation, has_voted)
VALUES
    ('103012300001', 'voter1@student.telkomuniversity.ac.id', 'Ahmad Rizky Pratama', 2023, FALSE),
    ('103012300002', 'voter2@student.telkomuniversity.ac.id', 'Budi Santoso', 2023, TRUE),
    ('103012400003', 'voter3@student.telkomuniversity.ac.id', 'Citra Dewi Lestari', 2024, FALSE),
    ('103012400004', 'voter4@student.telkomuniversity.ac.id', 'Dimas Aditya', 2024, FALSE),
    ('103012500005', 'voter5@student.telkomuniversity.ac.id', 'Eka Putri Maharani', 2025, FALSE),
    ('103012600006', 'voter6@student.telkomuniversity.ac.id', 'Fajar Nugraha', 2026, FALSE)
ON CONFLICT (nim) DO NOTHING;

-- 4. DAFTAR ADMINISTRATOR BOOTSTRAP UNTUK DEVELOPMENT & TESTING
INSERT INTO public.admin_users (email, role, is_active, created_by)
VALUES
    ('superadmin@student.telkomuniversity.ac.id', 'super_admin', TRUE, 'SYSTEM_BOOTSTRAP'),
    ('kpradmin@student.telkomuniversity.ac.id', 'kpr_admin', TRUE, 'SYSTEM_BOOTSTRAP'),
    ('auditor@student.telkomuniversity.ac.id', 'auditor', TRUE, 'SYSTEM_BOOTSTRAP')
ON CONFLICT (email) DO NOTHING;
