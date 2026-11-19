import {
  isConnectionError,
  isDatabaseError,
  isUniqueViolation,
  readErrorCode,
} from './database-error.js';

describe('readErrorCode', () => {
  it('reads a string code from an error-like value', () => {
    expect(readErrorCode({ code: '23505' })).toBe('23505');
  });

  it('ignores values that do not carry a string code', () => {
    expect(readErrorCode(null)).toBeUndefined();
    expect(readErrorCode('23505')).toBeUndefined();
    expect(readErrorCode({ message: 'failed' })).toBeUndefined();
    expect(readErrorCode({ code: 23505 })).toBeUndefined();
  });
});

describe('isUniqueViolation', () => {
  it('matches the short code unique constraint', () => {
    expect(
      isUniqueViolation({
        code: '23505',
        constraint: 'short_urls_code_key',
      }),
    ).toBe(true);
  });

  it('accepts a caller-supplied constraint name', () => {
    expect(
      isUniqueViolation(
        { code: '23505', constraint: 'short_urls_pkey' },
        'short_urls_pkey',
      ),
    ).toBe(true);
  });

  it('rejects other constraints, codes, and shapes', () => {
    expect(
      isUniqueViolation({
        code: '23505',
        constraint: 'short_urls_pkey',
      }),
    ).toBe(false);
    expect(
      isUniqueViolation({
        code: '23502',
        constraint: 'short_urls_code_key',
      }),
    ).toBe(false);
    expect(isUniqueViolation({ code: '23505' })).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});

describe('isDatabaseError', () => {
  it('recognizes postgres sqlstate and driver connection codes', () => {
    expect(isDatabaseError({ code: '23502' })).toBe(true);
    expect(isDatabaseError({ code: '42P01' })).toBe(true);
    expect(isDatabaseError({ code: 'ECONNREFUSED' })).toBe(true);
  });

  it('ignores application errors', () => {
    expect(isDatabaseError(new Error('Short code collision'))).toBe(false);
    expect(isDatabaseError({ code: 'not-a-db-code' })).toBe(false);
    expect(isDatabaseError({ code: '2350' })).toBe(false);
  });
});

describe('isConnectionError', () => {
  it('matches driver and postgres connection failures', () => {
    expect(isConnectionError({ code: 'ECONNREFUSED' })).toBe(true);
    expect(isConnectionError({ code: 'ETIMEDOUT' })).toBe(true);
    expect(isConnectionError({ code: '57P01' })).toBe(true);
  });

  it('does not treat query failures as connection failures', () => {
    expect(isConnectionError({ code: '23505' })).toBe(false);
    expect(isConnectionError({ code: '42P01' })).toBe(false);
    expect(isConnectionError({})).toBe(false);
  });
});
