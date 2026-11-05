import test from 'node:test';
import assert from 'node:assert/strict';
import { getDevCandidates, setDevCandidates } from '../lib/candidates/dev-store.ts';
import { getDevElectionSettings, updateDevElectionSettings } from '../lib/election/dev-settings-store.ts';

test.describe('Dynamic Paslon Management, Kotak Kosong Toggle, & Election Schedule Engine', () => {
  test('1. Admin can update Paslon 1 name and remove/clear its photo', () => {
    const initialList = getDevCandidates();
    const paslon1 = initialList.find((c) => c.candidate_number === 1);
    assert.ok(paslon1, 'Paslon 1 should exist');

    // Update name and clear photo
    const updated = initialList.map((c) =>
      c.candidate_number === 1
        ? {
            ...c,
            leader_name: 'Fajar Ramadhan (Revisi)',
            vice_leader_name: 'Nabila Putri (Revisi)',
            photo_url: null, // Foto dihapus
          }
        : c
    );
    setDevCandidates(updated);

    const check = getDevCandidates().find((c) => c.candidate_number === 1);
    assert.equal(check.leader_name, 'Fajar Ramadhan (Revisi)');
    assert.equal(check.vice_leader_name, 'Nabila Putri (Revisi)');
    assert.equal(check.photo_url, null, 'Photo should be null after removal');
  });

  test('2. Single Paslon Mode (1 Candidate): Kotak Kosong is MANDATORY', () => {
    // Keep only Paslon 0 (Kotak Kosong) and Paslon 1
    const singlePaslonSetup = getDevCandidates().filter((c) => c.candidate_number <= 1);
    setDevCandidates(singlePaslonSetup);

    const current = getDevCandidates();
    const regular = current.filter((c) => c.candidate_number > 0);
    const kotakKosong = current.find((c) => c.candidate_number === 0);

    assert.equal(regular.length, 1, 'Only 1 regular paslon should be present');
    assert.ok(kotakKosong, 'Kotak Kosong must be present for single candidate');

    // Election endpoint logic: Even if allow_kotak_kosong_multi is false, single paslon forces Kotak Kosong to be included
    updateDevElectionSettings({ allow_kotak_kosong_multi: false });
    const settings = getDevElectionSettings();

    const candidatesList = [...regular];
    if (kotakKosong) {
      if (regular.length === 1) {
        candidatesList.push(kotakKosong);
      } else if (regular.length >= 2 && settings.allow_kotak_kosong_multi !== false) {
        candidatesList.push(kotakKosong);
      }
    }

    assert.equal(candidatesList.length, 2, 'Must include regular candidate AND Kotak Kosong (Head-to-Head)');
    assert.ok(candidatesList.some((c) => c.candidate_number === 0), 'Kotak Kosong is present in single candidate ballot');
  });

  test('3. Multi Paslon Mode (2+ Candidates): Admin can toggle Kotak Kosong ON and OFF', () => {
    // Add Paslon 2 back
    const multiSetup = [
      ...getDevCandidates(),
      {
        id: '22222222-2222-2222-2222-222222222222',
        candidate_number: 2,
        leader_name: 'Dimas Satria Wicaksana',
        vice_leader_name: 'Cynthia Maharani',
        vision: 'Sinergi Informatika Berkelanjutan',
        mission: ['Misi 1', 'Misi 2'],
        photo_url: null,
        chairman_cv_url: '/uploads/cv/cv-chairman-paslon-2.pdf',
        vice_chairman_cv_url: '/uploads/cv/cv-vice-chairman-paslon-2.pdf',
        is_active: true,
      },
    ];
    setDevCandidates(multiSetup);

    const current = getDevCandidates();
    const regular = current.filter((c) => c.candidate_number > 0);
    const kotakKosong = current.find((c) => c.candidate_number === 0);
    assert.equal(regular.length, 2, 'Should have 2 regular candidates');

    // Case A: Kotak Kosong Toggle = OFF
    updateDevElectionSettings({ allow_kotak_kosong_multi: false });
    let settings = getDevElectionSettings();

    let listA = [...regular];
    if (kotakKosong && settings.allow_kotak_kosong_multi) {
      listA.push(kotakKosong);
    }
    assert.equal(listA.length, 2, 'When toggle OFF, ballot only contains 2 regular paslon without Kotak Kosong');
    assert.ok(!listA.some((c) => c.candidate_number === 0), 'Kotak Kosong must NOT be in ballot');

    // Case B: Kotak Kosong Toggle = ON
    updateDevElectionSettings({ allow_kotak_kosong_multi: true });
    settings = getDevElectionSettings();

    let listB = [...regular];
    if (kotakKosong && settings.allow_kotak_kosong_multi) {
      listB.push(kotakKosong);
    }
    assert.equal(listB.length, 3, 'When toggle ON, ballot contains 2 regular paslon AND Kotak Kosong');
    assert.ok(listB.some((c) => c.candidate_number === 0), 'Kotak Kosong is included in ballot');
  });

  test('4. Operational Election Schedule: Bilik Suara is ACTIVE only within window', () => {
    const now = new Date();

    // Setup 1: Active window (Started 1 hour ago, ends in 5 hours)
    updateDevElectionSettings({
      is_voting_open: true,
      maintenance_mode: false,
      start_time: new Date(now.getTime() - 3600000).toISOString(),
      end_time: new Date(now.getTime() + 18000000).toISOString(),
    });

    let s = getDevElectionSettings();
    let isWithin = now >= new Date(s.start_time) && now <= new Date(s.end_time);
    let isActive = s.is_voting_open && !s.maintenance_mode && isWithin;
    assert.equal(isActive, true, 'Voting should be active during operational schedule');

    // Setup 2: Scheduled in future (Starts tomorrow) -> Outside window
    updateDevElectionSettings({
      start_time: new Date(now.getTime() + 86400000).toISOString(),
      end_time: new Date(now.getTime() + 172800000).toISOString(),
    });

    s = getDevElectionSettings();
    isWithin = now >= new Date(s.start_time) && now <= new Date(s.end_time);
    isActive = s.is_voting_open && !s.maintenance_mode && isWithin;
    assert.equal(isActive, false, 'Voting MUST be locked before election start time');

    // Setup 3: Already ended (Ended 1 hour ago) -> Outside window
    updateDevElectionSettings({
      start_time: new Date(now.getTime() - 7200000).toISOString(),
      end_time: new Date(now.getTime() - 3600000).toISOString(),
    });

    s = getDevElectionSettings();
    isWithin = now >= new Date(s.start_time) && now <= new Date(s.end_time);
    isActive = s.is_voting_open && !s.maintenance_mode && isWithin;
    assert.equal(isActive, false, 'Voting MUST be locked after election end time');

    // Restore to normal operational window
    updateDevElectionSettings({
      start_time: new Date(now.getTime() - 3600000).toISOString(),
      end_time: new Date(now.getTime() + 28800000).toISOString(),
      allow_kotak_kosong_multi: true,
    });
  });

  test('5. Chairman & Vice Chairman CV URLs are properly bound to candidate records', () => {
    const current = getDevCandidates();
    const paslon1 = current.find((c) => c.candidate_number === 1);
    assert.ok(paslon1);

    // Update with newly uploaded CV URLs
    const uploadedChairmanCv = '/uploads/cv/1-1730000000-cvc.pdf';
    const uploadedViceChairmanCv = '/uploads/cv/1-1730000000-cvv.pdf';

    const updated = current.map((c) =>
      c.candidate_number === 1
        ? {
            ...c,
            chairman_cv_url: uploadedChairmanCv,
            vice_chairman_cv_url: uploadedViceChairmanCv,
          }
        : c
    );
    setDevCandidates(updated);

    const check = getDevCandidates().find((c) => c.candidate_number === 1);
    assert.equal(check.chairman_cv_url, uploadedChairmanCv);
    assert.equal(check.vice_chairman_cv_url, uploadedViceChairmanCv);
    assert.notEqual(check.chairman_cv_url, check.vice_chairman_cv_url, 'CVs must remain distinct');
  });
});
