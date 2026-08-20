export type QrPayloadType =
  | { type: 'IDENTITY'; registrationNumber: string; rawPayload: string }
  | { type: 'GYM_LOCATION'; gymId: string; branchId?: string; rawPayload: string }
  | { type: 'INVALID'; reason: string; rawPayload: string };

/**
 * Explicit, centralized QR parser for GYM-CRM ecosystem.
 *
 * Supported Protocols:
 * 1. IDENTITY: GYMCRM:1:<registrationNumber> (e.g. GYMCRM:1:REG-100001)
 * 2. GYM_LOCATION: JSON payload containing { gymId, branchId? } or raw gym UUID
 */
export function parseGymCrmQr(rawInput?: string | null): QrPayloadType {
  if (!rawInput || typeof rawInput !== 'string') {
    return { type: 'INVALID', reason: 'Empty or invalid QR code', rawPayload: rawInput || '' };
  }

  const trimmed = rawInput.trim();

  // 1. Person Identity QR protocol: GYMCRM:1:<registrationNumber>
  if (trimmed.startsWith('GYMCRM:1:')) {
    const parts = trimmed.split(':');
    const registrationNumber = parts[2]?.trim();

    if (registrationNumber && /^REG-[A-Z0-9_-]+$/i.test(registrationNumber)) {
      return {
        type: 'IDENTITY',
        registrationNumber: registrationNumber.toUpperCase(),
        rawPayload: trimmed,
      };
    }

    return {
      type: 'INVALID',
      reason: 'Malformed registration identity in QR code',
      rawPayload: trimmed,
    };
  }

  // 2. Gym Counter / Location JSON QR
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && parsed.gymId && typeof parsed.gymId === 'string' && parsed.gymId.trim() !== '') {
        return {
          type: 'GYM_LOCATION',
          gymId: parsed.gymId.trim(),
          branchId: typeof parsed.branchId === 'string' ? parsed.branchId.trim() : undefined,
          rawPayload: trimmed,
        };
      }
    } catch {
      return {
        type: 'INVALID',
        reason: 'Malformed JSON gym payload in QR code',
        rawPayload: trimmed,
      };
    }
  }

  // 3. Fallback for raw gym UUID / hex string
  if (/^[a-fA-F0-9]{24}$/.test(trimmed) || /^[0-9a-fA-F-]{36}$/.test(trimmed)) {
    return {
      type: 'GYM_LOCATION',
      gymId: trimmed,
      rawPayload: trimmed,
    };
  }

  // 4. Invalid / Unsupported payload
  return {
    type: 'INVALID',
    reason: 'Unsupported QR code format',
    rawPayload: trimmed,
  };
}
