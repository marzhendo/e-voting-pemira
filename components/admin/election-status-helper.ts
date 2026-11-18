import { ShieldAlert, Lock, Clock, Activity, type LucideIcon } from 'lucide-react';

export interface ElectionSystemStatus {
  label: string;
  shortLabel: string;
  badgeBg: string;
  icon: LucideIcon;
  scheduleCardText: string;
  scheduleCardBadge: string;
  isOperational: boolean;
}

export function formatDateTimeLocal(isoString: string): string {
  if (!isoString || !isoString.trim()) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

export function getElectionSystemStatus(params: {
  maintenanceMode: boolean;
  isVotingOpen: boolean;
  startTime: string;
  endTime: string;
}): ElectionSystemStatus {
  const { maintenanceMode, isVotingOpen, startTime, endTime } = params;

  if (maintenanceMode) {
    return {
      label: 'Mode Pemeliharaan Darurat',
      shortLabel: 'Pemeliharaan',
      badgeBg: 'bg-error/15 border-error/30 text-error',
      icon: ShieldAlert,
      scheduleCardText: 'Mode Pemeliharaan Aktif',
      scheduleCardBadge: 'bg-error/15 text-error border-error/30',
      isOperational: false,
    };
  }

  if (!isVotingOpen) {
    return {
      label: 'Pemilihan Ditutup Panitia',
      shortLabel: 'Ditutup Panitia',
      badgeBg: 'bg-surface-container border-outline-variant/40 text-on-surface-variant',
      icon: Lock,
      scheduleCardText: 'Ditutup Manual oleh Panitia',
      scheduleCardBadge: 'bg-surface-container-high text-on-surface-variant border-outline-variant/40',
      isOperational: false,
    };
  }

  const now = new Date();
  const start = startTime ? new Date(startTime) : new Date(NaN);
  const end = endTime ? new Date(endTime) : new Date(NaN);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      label: 'Memuat Jadwal Pemilihan...',
      shortLabel: 'Memuat...',
      badgeBg: 'bg-surface-container border-outline-variant/40 text-on-surface-variant',
      icon: Clock,
      scheduleCardText: 'Memuat Jadwal...',
      scheduleCardBadge: 'bg-surface-container-high text-on-surface-variant border-outline-variant/40',
      isOperational: false,
    };
  }

  if (now < start) {
    return {
      label: 'Menunggu Jadwal Pemilihan',
      shortLabel: 'Belum Dimulai',
      badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      icon: Clock,
      scheduleCardText: 'Belum Dimulai',
      scheduleCardBadge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      isOperational: false,
    };
  }

  if (now > end) {
    return {
      label: 'Jadwal Pemilihan Berakhir',
      shortLabel: 'Telah Berakhir',
      badgeBg: 'bg-surface-container border-outline-variant/40 text-on-surface-variant',
      icon: Lock,
      scheduleCardText: 'Telah Berakhir',
      scheduleCardBadge: 'bg-surface-container-high text-on-surface-variant border-outline-variant/40',
      isOperational: false,
    };
  }

  return {
    label: 'Pemilihan Berlangsung Aktif',
    shortLabel: 'Sedang Berlangsung',
    badgeBg: 'bg-primary/10 border-primary/30 text-primary',
    icon: Activity,
    scheduleCardText: 'Sedang Berlangsung',
    scheduleCardBadge: 'bg-primary/10 text-primary border-primary/30',
    isOperational: true,
  };
}
