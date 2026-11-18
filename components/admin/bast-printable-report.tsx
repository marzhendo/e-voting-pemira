'use client';

import Image from 'next/image';
import type { TallyItem, GenerationTurnout } from './types';

interface BastPrintableReportProps {
  totalDpt: number;
  totalVotes: number;
  turnoutPercentage: number;
  generationData: GenerationTurnout[];
  tallyData: TallyItem[];
  bastQrDataUrl: string | null;
  bastIntegrityHash: string;
}

export function BastPrintableReport({
  totalDpt,
  totalVotes,
  turnoutPercentage,
  generationData,
  tallyData,
  bastQrDataUrl,
  bastIntegrityHash,
}: BastPrintableReportProps) {
  const currentDateFormatted = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
  }).format(new Date());

  const currentTimeFormatted =
    new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    }).format(new Date()) + ' WIB';

  const sortedCandidates = [...tallyData].sort((a, b) => b.voteCount - a.voteCount);
  const leadingCandidate = sortedCandidates[0];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* KOP SURAT RESMI */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b-4 border-double border-black">
        <div className="w-20 h-20 shrink-0 flex items-center justify-center">
          <Image
            src="/assets/img/hmif-logo.png"
            alt="Logo HMIF"
            width={72}
            height={72}
            priority
            className="object-contain"
          />
        </div>
        <div className="flex-1 text-center font-sans">
          <div className="text-xs sm:text-sm font-bold tracking-wider uppercase text-gray-900">
            KOMISI PEMILIHAN RAYA (KPR)
          </div>
          <div className="text-sm sm:text-base font-extrabold tracking-wide uppercase text-black">
            HIMPUNAN MAHASISWA INFORMATIKA (HMIF)
          </div>
          <div className="text-xs sm:text-sm font-bold tracking-wider uppercase text-gray-900">
            TELKOM UNIVERSITY PURWOKERTO
          </div>
          <p className="text-[10px] text-gray-600 mt-1 leading-tight">
            Sekretariat: Gedung Student Center Lt. 2, Jl. D.I. Panjaitan No. 128, Purwokerto 53147
            <br />
            Laman Resmi: pemirahmif.com • Surel: kpr.hmif@student.telkomuniversity.ac.id
          </p>
        </div>
        <div className="w-20 h-20 shrink-0 hidden sm:block" />
      </div>

      {/* JUDUL DOKUMEN */}
      <div className="text-center space-y-1 pt-2 font-sans">
        <div className="text-sm sm:text-base font-bold underline uppercase tracking-wide">
          BERITA ACARA REKAPITULASI DAN PENETAPAN HASIL PEROLEHAN SUARA
        </div>
        <p className="text-xs font-semibold text-gray-800">
          PEMILIHAN RAYA KETUA DAN WAKIL KETUA HMIF PERIODE 2026/2027
        </p>
        <p className="text-[11px] font-mono text-gray-600">
          Nomor: 009/BA-KPR/HMIF/XI/2026
        </p>
      </div>

      {/* PARAGRAF PEMBUKA */}
      <p suppressHydrationWarning className="text-justify leading-relaxed text-xs sm:text-[13px]">
        Pada hari ini, <strong>{currentDateFormatted}</strong> pukul {currentTimeFormatted}, bertempat di Sekretariat Komisi Pemilihan Raya (KPR) HMIF Telkom University Purwokerto, telah diselesaikan rekapitulasi akhir penghitungan suara elektronik (<em>E-Voting</em>) Pemira HMIF 2026/2027 yang diselenggarakan berasaskan Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil (LUBER JURDIL) dengan rincian sebagai berikut:
      </p>

      {/* BAGIAN I: DATA PARTISIPASI PEMILIH */}
      <div className="space-y-2">
        <h4 className="font-bold font-sans text-xs uppercase tracking-wider text-gray-900">
          I. DATA PARTISIPASI DAN DAFTAR PEMILIH TETAP (DPT)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-sans">
          <div className="p-2.5 border border-gray-300 rounded bg-gray-50">
            <span className="text-[10px] text-gray-600 block">Total DPT Terdaftar:</span>
            <span className="font-bold text-sm text-black font-mono">{totalDpt} Mahasiswa</span>
          </div>
          <div className="p-2.5 border border-gray-300 rounded bg-gray-50">
            <span className="text-[10px] text-gray-600 block">Total Suara Masuk:</span>
            <span className="font-bold text-sm text-black font-mono">{totalVotes} Suara</span>
          </div>
          <div className="p-2.5 border border-gray-300 rounded bg-gray-50">
            <span className="text-[10px] text-gray-600 block">Tingkat Partisipasi (Turnout):</span>
            <span className="font-bold text-sm text-black font-mono">{turnoutPercentage}%</span>
          </div>
        </div>

        {generationData.length > 0 && (
          <table className="w-full text-xs font-sans border-collapse border border-gray-300 mt-2">
            <thead>
              <tr className="bg-gray-100 text-gray-800">
                <th className="border border-gray-300 p-1.5 text-center w-12">No.</th>
                <th className="border border-gray-300 p-1.5 text-left">Angkatan Mahasiswa</th>
                <th className="border border-gray-300 p-1.5 text-center">Jumlah DPT</th>
                <th className="border border-gray-300 p-1.5 text-center">Suara Digunakan</th>
                <th className="border border-gray-300 p-1.5 text-center">Partisipasi (%)</th>
              </tr>
            </thead>
            <tbody>
              {generationData.map((gen, idx) => (
                <tr key={gen.generation} className="text-gray-900">
                  <td className="border border-gray-300 p-1.5 text-center">{idx + 1}</td>
                  <td className="border border-gray-300 p-1.5 font-medium">Informatika Angkatan {gen.generation}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-mono">{gen.totalVoters}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-mono">{gen.votedCount}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-mono">{gen.turnoutPercentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* BAGIAN II: REKAPITULASI HASIL PEROLEHAN SUARA */}
      <div className="space-y-2 pt-2">
        <h4 className="font-bold font-sans text-xs uppercase tracking-wider text-gray-900">
          II. HASIL PEROLEHAN SUARA PASANGAN CALON
        </h4>
        <table className="w-full text-xs font-sans border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100 text-gray-800">
              <th className="border border-gray-300 p-2 text-center w-12">No.</th>
              <th className="border border-gray-300 p-2 text-center w-16">No. Urut</th>
              <th className="border border-gray-300 p-2 text-left">Nama Pasangan Calon / Opsi</th>
              <th className="border border-gray-300 p-2 text-center w-28">Perolehan Suara</th>
              <th className="border border-gray-300 p-2 text-center w-24">Persentase</th>
            </tr>
          </thead>
          <tbody>
            {tallyData.map((cand, idx) => (
              <tr key={cand.candidateId} className="text-gray-900">
                <td className="border border-gray-300 p-2 text-center">{idx + 1}</td>
                <td className="border border-gray-300 p-2 text-center font-bold font-mono">
                  {cand.candidateNumber === 0 ? '-' : cand.candidateNumber.toString().padStart(2, '0')}
                </td>
                <td className="border border-gray-300 p-2 font-medium">
                  {cand.candidateNumber === 0
                    ? 'Kotak Kosong (Abstain Sah)'
                    : `${cand.leaderName} & ${cand.viceLeaderName}`}
                </td>
                <td className="border border-gray-300 p-2 text-center font-mono font-bold">
                  {cand.voteCount} Suara
                </td>
                <td className="border border-gray-300 p-2 text-center font-mono font-bold">
                  {cand.percentage}%
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-bold text-gray-900">
              <td colSpan={3} className="border border-gray-300 p-2 text-right">
                TOTAL SUARA SAH MASUK:
              </td>
              <td className="border border-gray-300 p-2 text-center font-mono">
                {totalVotes} Suara
              </td>
              <td className="border border-gray-300 p-2 text-center font-mono">
                100%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* BAGIAN III: KETETAPAN DAN PENJAMINAN KEAMANAN */}
      <div className="space-y-1.5 pt-2 text-justify text-xs sm:text-[13px]">
        <h4 className="font-bold font-sans text-xs uppercase tracking-wider text-gray-900">
          III. KETETAPAN DAN INTEGRITAS SISTEM
        </h4>
        <p>
          Berdasarkan hasil rekapitulasi suara di atas, pasangan calon{' '}
          <strong>
            {leadingCandidate
              ? leadingCandidate.candidateNumber === 0
                ? 'Kotak Kosong'
                : `${leadingCandidate.leaderName} & ${leadingCandidate.viceLeaderName}`
              : '-'}
          </strong>{' '}
          memperoleh akumulasi suara tertinggi sejumlah{' '}
          <strong>{leadingCandidate ? leadingCandidate.voteCount : 0} suara</strong> (
          {leadingCandidate ? leadingCandidate.percentage : 0}%).
        </p>
        <p className="text-[11px] text-gray-600 italic">
          Seluruh surat suara telah diverifikasi secara kriptografis dan disimpan secara anonim tanpa rekaman identitas pemilih ke surat suara (*Ballot Secrecy*), sesuai ketetapan Komisi Pemilihan Raya HMIF Telkom University Purwokerto.
        </p>
      </div>

      {/* SEGEL DIGITAL & VERIFIKASI QR PUBLIK */}
      <div className="my-3 p-3 sm:p-4 border border-dashed border-gray-400 rounded-lg bg-gray-50 flex flex-col sm:flex-row items-center gap-4">
        <div className="shrink-0 bg-white p-1.5 border border-gray-300 rounded shadow-xs flex items-center justify-center">
          {bastQrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bastQrDataUrl}
              alt="QR Verifikasi Berita Acara"
              className="w-24 h-24 object-contain"
            />
          ) : (
            <div className="w-24 h-24 bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 font-sans">
              QR Kode
            </div>
          )}
        </div>
        <div className="flex-1 text-left space-y-1 font-sans">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
              Integritas Terverifikasi Kriptografis
            </span>
            <span className="text-[10px] text-gray-500 font-mono">HMIF-E-VOTE-2026</span>
          </div>
          <p className="text-[11px] text-gray-700 leading-snug">
            Pindai kode QR untuk menguji keabsahan Berita Acara ini secara publik di portal resmi Pemira HMIF. Nilai hash di bawah ini mengunci jumlah DPT dan perolehan suara sah saat dokumen ini diterbitkan.
          </p>
          <div className="pt-1">
            <span className="text-[9px] text-gray-500 font-bold block uppercase tracking-wide">
              SHA-256 Digital Signature:
            </span>
            <code className="text-[10px] font-mono font-bold text-gray-900 bg-gray-200/80 px-2 py-0.5 rounded break-all select-all block mt-0.5">
              {bastIntegrityHash || 'MENGHITUNG INTEGRITAS TANDA TANGAN DIGITAL...'}
            </code>
          </div>
        </div>
      </div>

      {/* BAGIAN IV: TANDA TANGAN PIHAK-PIHAK */}
      <div className="pt-6 font-sans text-xs">
        <p suppressHydrationWarning className="text-right text-gray-700 mb-6">
          Purwokerto, {currentDateFormatted}
        </p>
        <div className="grid grid-cols-2 gap-y-10 gap-x-8 text-center">
          <div>
            <p className="font-bold text-gray-800">Ketua Panitia KPR HMIF</p>
            <div className="h-14 flex items-center justify-center">
              <span className="text-[10px] text-gray-400 italic">( Tanda Tangan &amp; Cap )</span>
            </div>
            <p className="font-bold underline text-black">Marzhendo Galang Saputra</p>
            <p className="text-[11px] text-gray-600">NIM. 103112400102</p>
          </div>

          <div>
            <p className="font-bold text-gray-800">Sekretaris KPR HMIF</p>
            <div className="h-14 flex items-center justify-center">
              <span className="text-[10px] text-gray-400 italic">( Tanda Tangan )</span>
            </div>
            <p className="font-bold underline text-black">Siti Nurhaliza</p>
            <p className="text-[11px] text-gray-600">NIM. 103012400015</p>
          </div>

          <div>
            <p className="font-bold text-gray-800">Saksi Paslon 01</p>
            <div className="h-14 flex items-center justify-center">
              <span className="text-[10px] text-gray-400 italic">( Tanda Tangan )</span>
            </div>
            <p className="font-bold underline text-black">( ........................................ )</p>
            <p className="text-[11px] text-gray-600">Saksi Mandat Resmi</p>
          </div>

          <div>
            <p className="font-bold text-gray-800">Pengawas Pemira / DPM</p>
            <div className="h-14 flex items-center justify-center">
              <span className="text-[10px] text-gray-400 italic">( Tanda Tangan )</span>
            </div>
            <p className="font-bold underline text-black">( ........................................ )</p>
            <p className="text-[11px] text-gray-600">Dewan Perwakilan Mahasiswa</p>
          </div>
        </div>
      </div>
    </div>
  );
}
