import { ShortCodeCollisionError } from './short-code-collision.error.js';

describe('ShortCodeCollisionError', () => {
  it('exposes a stable name and message', () => {
    const error = new ShortCodeCollisionError();

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ShortCodeCollisionError');
    expect(error.message).toBe('Short code collision');
  });
});
