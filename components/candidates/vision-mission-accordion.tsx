'use client';

import { useState } from 'react';
import { ChevronDown, Flag } from 'lucide-react';

interface VisionMissionAccordionProps {
  vision: string;
  mission: string[];
}

export function VisionMissionAccordion({
  vision,
  mission,
}: VisionMissionAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/30">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="vision-mission-content"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-full min-h-[44px] flex items-center justify-between text-left text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-lg px-1"
      >
        <span className="flex items-center gap-2">
          <Flag className="w-3.5 h-3.5 text-primary" />
          <span>Visi &amp; Misi Utama</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-on-surface-variant transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div id="vision-mission-content" className="mt-2.5 pt-2.5 border-t border-outline-variant/30 text-xs text-on-surface-variant space-y-2">
          <div>
            <strong className="text-on-surface font-semibold block text-[11px] uppercase tracking-wider text-primary">
              Visi:
            </strong>
            <p className="mt-0.5 leading-relaxed">{vision}</p>
          </div>
          <div>
            <strong className="text-on-surface font-semibold block text-[11px] uppercase tracking-wider text-primary">
              Misi:
            </strong>
            <ul className="mt-1 list-disc list-inside space-y-1 leading-relaxed">
              {mission.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
