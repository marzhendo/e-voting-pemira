'use client';

import { FileText, Printer, X } from 'lucide-react';
import { Portal } from '@/components/ui/portal';
import { BastPrintableReport } from '../bast-printable-report';
import type { GenerationTurnout, TallyItem } from '../types';

export interface BastPreviewModalProps {
  isOpen: boolean;
  totalDpt: number;
  totalVotes: number;
  turnoutPercentage: number;
  generationData: GenerationTurnout[];
  tallyData: TallyItem[];
  bastQrDataUrl: string;
  bastIntegrityHash: string;
  onClose: () => void;
}

export function BastPreviewModal({
  isOpen,
  totalDpt,
  totalVotes,
  turnoutPercentage,
  generationData,
  tallyData,
  bastQrDataUrl,
  bastIntegrityHash,
  onClose,
}: BastPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl bg-white text-black rounded-2xl shadow-2xl overflow-hidden my-auto border border-gray-300 flex flex-col max-h-[90vh]"
        >
          {/* Controls Bar Atas */}
          <div className="bg-gray-100 px-6 py-3.5 border-b border-gray-300 flex items-center justify-between text-gray-800 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              <span className="font-bold text-sm">Pratinjau Berita Acara Rekapitulasi Suara (BAST)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Dokumen Paper Preview */}
          <div className="p-8 sm:p-12 overflow-y-auto font-serif text-[13px] leading-relaxed text-black bg-white">
            <BastPrintableReport
              totalDpt={totalDpt}
              totalVotes={totalVotes}
              turnoutPercentage={turnoutPercentage}
              generationData={generationData}
              tallyData={tallyData}
              bastQrDataUrl={bastQrDataUrl}
              bastIntegrityHash={bastIntegrityHash}
            />
          </div>

          {/* Controls Bar Bawah */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 shrink-0">
            <span>Dokumen sah Komisi Pemilihan Raya HMIF Telkom University Purwokerto</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium cursor-pointer"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
