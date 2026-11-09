-- ==============================================================================
-- Migration: 00007_optimized_tally_rpc.sql
-- Description: High-performance server-side aggregation for election tally and turnout
-- Features:
--   1. Replaces full table downloads of ballots and voters_whitelist
--   2. Executes COUNT(*) GROUP BY in single atomic SQL transaction (<5ms)
--   3. Returns compact JSON payload (~500 bytes) instead of megabytes of raw rows
--   4. Execution revoked from PUBLIC/anon/authenticated; granted ONLY to service_role
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_election_tally_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_total_votes BIGINT := 0;
    v_total_dpt BIGINT := 0;
    v_total_voted_dpt BIGINT := 0;
    v_overall_turnout NUMERIC := 0;
    v_settings RECORD;
    v_is_closed BOOLEAN := FALSE;
    v_tally JSONB := '[]'::jsonb;
    v_by_generation JSONB := '[]'::jsonb;
BEGIN
    -- 1. Baca pengaturan pemilihan
    SELECT is_voting_open, start_time, end_time, maintenance_mode, allow_kotak_kosong_multi
    INTO v_settings
    FROM public.election_settings
    WHERE id = 1;

    IF FOUND THEN
        v_is_closed := NOT v_settings.is_voting_open OR (NOW() > v_settings.end_time);
    END IF;

    -- 2. Hitung total surat suara
    SELECT COUNT(*) INTO v_total_votes FROM public.ballots;

    -- 3. Agregasi suara per kandidat langsung di SQL (LEFT JOIN GROUP BY)
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'candidateId', c.id,
                'candidateNumber', c.candidate_number,
                'leaderName', c.leader_name,
                'viceLeaderName', c.vice_leader_name,
                'voteCount', COALESCE(b.cnt, 0),
                'percentage', CASE 
                    WHEN v_total_votes > 0 THEN ROUND((COALESCE(b.cnt, 0)::NUMERIC / v_total_votes) * 100, 2)
                    ELSE 0 
                END
            ) ORDER BY c.candidate_number ASC
        ),
        '[]'::jsonb
    ) INTO v_tally
    FROM public.candidates c
    LEFT JOIN (
        SELECT candidate_id, COUNT(*) AS cnt
        FROM public.ballots
        GROUP BY candidate_id
    ) b ON c.id = b.candidate_id
    WHERE c.is_active = TRUE;

    -- 4. Hitung partisipasi DPT secara agregat
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE has_voted = TRUE)
    INTO v_total_dpt, v_total_voted_dpt
    FROM public.voters_whitelist;

    IF v_total_dpt > 0 THEN
        v_overall_turnout := ROUND((v_total_voted_dpt::NUMERIC / v_total_dpt) * 100, 2);
    END IF;

    -- 5. Hitung breakdown per angkatan (Cohorts)
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'generation', cohort.generation,
                'totalVoters', cohort.total_voters,
                'votedCount', cohort.voted_count,
                'turnoutPercentage', cohort.turnout_percentage
            ) ORDER BY cohort.generation ASC
        ),
        '[]'::jsonb
    ) INTO v_by_generation
    FROM (
        SELECT 
            generation,
            COUNT(*) AS total_voters,
            COUNT(*) FILTER (WHERE has_voted = TRUE) AS voted_count,
            CASE 
                WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE has_voted = TRUE)::NUMERIC / COUNT(*)) * 100, 2)
                ELSE 0 
            END AS turnout_percentage
        FROM public.voters_whitelist
        GROUP BY generation
    ) cohort;

    RETURN jsonb_build_object(
        'success', true,
        'timestamp', NOW(),
        'electionSettings', jsonb_build_object(
            'isVotingOpen', COALESCE(v_settings.is_voting_open, false),
            'isClosed', v_is_closed,
            'maintenanceMode', COALESCE(v_settings.maintenance_mode, false),
            'startTime', v_settings.start_time,
            'endTime', v_settings.end_time,
            'allowKotakKosongMulti', COALESCE(v_settings.allow_kotak_kosong_multi, true)
        ),
        'turnout', jsonb_build_object(
            'totalDpt', v_total_dpt,
            'totalVotesRecorded', v_total_votes,
            'totalVotersParticipated', v_total_voted_dpt,
            'turnoutPercentage', v_overall_turnout,
            'byGeneration', v_by_generation
        ),
        'tally', v_tally
    );
END;
$$;

-- Batasi hak akses eksekusi hanya untuk service_role
REVOKE EXECUTE ON FUNCTION public.get_election_tally_summary() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_election_tally_summary() TO service_role;
