/**
 * Helper to safely extract client IP behind Google Cloud Run reverse proxy.
 * Cloud Run load balancer rotates internal IPs dynamically, so request.socket / client.host
 * cannot be relied upon. The real client IP is always the first address in X-Forwarded-For.
 */
export function getClientIp(input: Headers | { headers: Headers }): string {
  const headers = 'headers' in input ? input.headers : input;
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '127.0.0.1';
}
