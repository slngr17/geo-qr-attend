/**
 * Calculates the distance between two coordinates in meters using the Haversine formula.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function generateClassCode(length = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function signQRPayload(sessionId: string, classId: string): string {
  // Simple "signature" for demo purposes. 
  // In production, this should be a JWT or HMAC signed by the server.
  const timestamp = Date.now();
  const secret = 'attendance-secret';
  return btoa(JSON.stringify({ sessionId, classId, timestamp, sig: btoa(`${sessionId}-${timestamp}-${secret}`).slice(0, 10) }));
}

export function verifyQRPayload(payload: string): { sessionId: string; classId: string; timestamp: number } | null {
  try {
    const data = JSON.parse(atob(payload));
    // Check expiration (e.g., 1 hour)
    const ONE_HOUR = 60 * 60 * 1000;
    if (Date.now() - data.timestamp > ONE_HOUR) return null;
    return data;
  } catch (e) {
    return null;
  }
}