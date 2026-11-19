const POSTGRES_ERROR_CODE = /^[0-9A-Z]{5}$/;

const CONNECTION_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  '08000',
  '08001',
  '08003',
  '08004',
  '08006',
  '08007',
  '53300',
  '57P01',
  '57P02',
  '57P03',
]);

export function readErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined;
  }

  return typeof error.code === 'string' ? error.code : undefined;
}

export function isUniqueViolation(
  error: unknown,
  constraint = 'short_urls_code_key',
): boolean {
  if (readErrorCode(error) !== '23505') {
    return false;
  }

  return (
    typeof error === 'object' &&
    error !== null &&
    'constraint' in error &&
    error.constraint === constraint
  );
}

export function isDatabaseError(error: unknown): boolean {
  const code = readErrorCode(error);

  return (
    code !== undefined &&
    (CONNECTION_ERROR_CODES.has(code) || POSTGRES_ERROR_CODE.test(code))
  );
}

export function isConnectionError(error: unknown): boolean {
  const code = readErrorCode(error);

  return code !== undefined && CONNECTION_ERROR_CODES.has(code);
}
