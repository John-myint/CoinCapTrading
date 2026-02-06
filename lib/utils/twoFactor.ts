import crypto from 'crypto';

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${raw.substring(0, 4)}-${raw.substring(4, 8)}`);
  }
  return codes;
}

export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export function hashBackupCodes(codes: string[]): string[] {
  return codes.map(hashBackupCode);
}

export function consumeBackupCode(hashedCodes: string[] = [], plainCode: string) {
  const normalized = plainCode.trim().toUpperCase();
  const hashed = hashBackupCode(normalized);
  if (!hashedCodes.includes(hashed)) {
    return { matched: false, nextCodes: hashedCodes };
  }
  return {
    matched: true,
    nextCodes: hashedCodes.filter((code) => code !== hashed),
  };
}
