'use client';

import { Users, Check } from 'lucide-react';
import { VisionMissionAccordion } from '@/components/candidates/vision-mission-accordion';

export interface CandidateItem {
  id: string;
  candidate_number: number;
  leader_name: string;
  vice_leader_name: string;
  vision: string;
  mission: string[];
  photo_url: string | null;
}

interface CandidateCardProps {
  candidate: CandidateItem;
  isSelected: boolean;
  onSelect: (candidate: CandidateItem) => void;
}

export function CandidateCard({
  candidate,
  isSelected,
  onSelect,
}: CandidateCardProps) {
  const numberStr = candidate.candidate_number.toString().padStart(2, '0');

  return (
    <div
      onClick={() => onSelect(candidate)}
      className={`group relative rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 cursor-pointer border ${
        isSelected
          ? 'bg-surface-container-high border-primary-container shadow-[0_0_0_2px_#EBBD1C] shadow-[0_12px_40px_-8px_rgba(235,189,28,0.25)]'
          : 'bg-surface-container border-outline-variant/30 hover:border-outline hover:shadow-lg'
      }`}
    >
      <div className="flex flex-col gap-4">
        {/* Header: Nomor Urut & Radio Indicator */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-primary-container/20 flex items-center justify-center">
              <span className="font-bebas text-3xl text-primary leading-none">
                {numberStr}
              </span>
            </div>
            <div>
              <span className="font-montserrat text-[11px] text-outline uppercase tracking-wider block font-semibold">
                Pasangan Calon
              </span>
              <h3 className="font-montserrat text-lg text-on-surface font-bold">
                Nomor Urut {numberStr}
              </h3>
            </div>
          </div>

          <div
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
              isSelected
                ? 'bg-primary-container border-primary-container text-on-primary'
                : 'border-outline bg-surface-container-highest text-transparent'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
        </div>

        {/* Foto Formal Pasangan Calon */}
        <div className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden bg-surface-container-high border border-outline-variant/30 flex flex-col items-center justify-center text-center p-4 select-none">
          {candidate.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={candidate.photo_url}
              alt={`Foto Pasangan Calon ${numberStr}`}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center text-outline mb-3">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <span className="font-montserrat text-sm font-bold text-on-surface">
                Foto Pasangan Calon {numberStr}
              </span>
              <span className="text-[11px] text-outline mt-1">
                Aset Resmi Verifikasi KPR HMIF
              </span>
            </>
          )}
        </div>

        {/* Informasi Nama Pemimpin & Wakil */}
        <div className="px-1 pt-1">
          <span className="text-[11px] text-primary font-bold uppercase tracking-wider block">
            Kandidat Pemimpin
          </span>
          <h4 className="font-montserrat text-lg font-bold text-on-surface leading-tight mt-1">
            {candidate.leader_name} &amp; {candidate.vice_leader_name}
          </h4>
          <p className="text-xs text-on-surface-variant mt-1">
            Calon Ketua &amp; Calon Wakil Ketua HMIF
          </p>
        </div>

        {/* Visi & Misi Accordion */}
        <VisionMissionAccordion
          vision={candidate.vision}
          mission={candidate.mission}
        />
      </div>

      {/* Footer Aksi Card */}
      <div className="pt-4 mt-3 border-t border-outline-variant/20 flex items-center justify-between">
        <span className="text-[11px] text-outline font-medium">
          {isSelected ? '✓ Terpilih' : 'Klik kartu untuk memilih'}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(candidate);
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
            isSelected
              ? 'bg-primary-container text-on-primary shadow-sm'
              : 'bg-surface-container-high text-on-surface hover:bg-surface-bright'
          }`}
        >
          {isSelected ? 'Pilihan Aktif' : `Pilih Paslon ${numberStr}`}
        </button>
      </div>
    </div>
  );
}
