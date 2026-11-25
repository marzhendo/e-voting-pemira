export type BroadcastTargetGroup =
  | 'all'
  | 'not_voted'
  | 'voted'
  | 'failed_email'
  | 'uncontacted'
  | 'pending_unvoted';

export interface BroadcastTargetCandidate {
  nim: string;
  name: string;
  email: string;
  generation: number;
  has_voted: boolean;
  last_email_status?: 'sent' | 'failed' | string | null;
  last_email_sent_at?: string | null;
}

export interface DeliveryStatsSummary {
  total: number;
  sent: number;
  failed: number;
  uncontacted: number;
  pendingUnvoted: number;
}

/**
 * Computes mutually exclusive delivery status totals (`sent + failed + uncontacted === total`)
 * alongside `pendingUnvoted` (unvoted voters whose last delivery is not `'sent'`).
 */
export function computeDeliveryStats(
  voters: ReadonlyArray<BroadcastTargetCandidate>,
  generation = 'all'
): DeliveryStatsSummary {
  const scoped =
    generation === 'all'
      ? voters
      : voters.filter((v) => String(v.generation) === generation);

  let sent = 0;
  let failed = 0;
  let uncontacted = 0;
  let pendingUnvoted = 0;

  for (const voter of scoped) {
    if (voter.last_email_status === 'sent') {
      sent++;
    } else if (voter.last_email_status === 'failed') {
      failed++;
    } else {
      uncontacted++;
    }

    if (!voter.has_voted && voter.last_email_status !== 'sent') {
      pendingUnvoted++;
    }
  }

  return {
    total: scoped.length,
    sent,
    failed,
    uncontacted,
    pendingUnvoted,
  };
}

export function matchesBroadcastTargetGroup(
  voter: BroadcastTargetCandidate,
  targetGroup: BroadcastTargetGroup
): boolean {
  switch (targetGroup) {
    case 'not_voted':
      return !voter.has_voted;
    case 'voted':
      return voter.has_voted;
    case 'failed_email':
      return voter.last_email_status === 'failed';
    case 'uncontacted':
      return !voter.last_email_status;
    case 'pending_unvoted':
      return !voter.has_voted && voter.last_email_status !== 'sent';
    case 'all':
    default:
      return true;
  }
}

export function filterBroadcastRecipients<T extends BroadcastTargetCandidate>(
  voters: ReadonlyArray<T>,
  options: {
    targetGroup: BroadcastTargetGroup;
    generation?: string;
    lastNim?: string;
  }
): T[] {
  const { targetGroup, generation = 'all', lastNim } = options;

  const filtered = voters.filter((voter) => {
    if (generation !== 'all' && String(voter.generation) !== generation) {
      return false;
    }
    if (!matchesBroadcastTargetGroup(voter, targetGroup)) {
      return false;
    }
    if (lastNim && voter.nim <= lastNim) {
      return false;
    }
    return true;
  });

  return filtered.sort((a, b) => a.nim.localeCompare(b.nim));
}
