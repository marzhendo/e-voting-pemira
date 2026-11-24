export interface SendPinPayload {
  to: string;
  voterName: string;
  nim: string;
  pin: string;
}

export interface SendVoterPasswordPayload {
  to: string;
  voterName: string;
  nim: string;
  password: string;
  loginUrl?: string;
  subject?: string;
  headline?: string;
  bodyText?: string;
}

export interface SendBroadcastPayload {
  to: string;
  voterName: string;
  nim: string;
  subject: string;
  headline: string;
  bodyText: string;
  ctaText?: string;
  ctaUrl?: string;
}

export interface MailDeliveryResult {
  success: boolean;
  messageId?: string;
  isDevFallback?: boolean;
  error?: string;
}

export interface MailService {
  sendLoginPin(payload: SendPinPayload): Promise<MailDeliveryResult>;
  sendVoterPassword(payload: SendVoterPasswordPayload): Promise<MailDeliveryResult>;
  sendBroadcastEmail(payload: SendBroadcastPayload): Promise<MailDeliveryResult>;
}
