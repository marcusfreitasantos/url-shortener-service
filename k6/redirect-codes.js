import { SharedArray } from 'k6/data';

const redirectCodes = new SharedArray('redirect codes', () => {
  const codes = JSON.parse(
    open(__ENV.REDIRECT_CODES_FILE || './data/redirect-codes.json'),
  );

  if (
    !Array.isArray(codes) ||
    codes.length === 0 ||
    codes.some((code) => typeof code !== 'string' || code.length === 0)
  ) {
    throw new Error(
      'Redirect code data must be a non-empty JSON array of strings. Run k6/seed-redirects.mjs first.',
    );
  }

  return codes;
});

export function randomRedirectCode() {
  return redirectCodes[Math.floor(Math.random() * redirectCodes.length)];
}
