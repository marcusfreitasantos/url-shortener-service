import {
  SHORT_CODE_LENGTH,
  createShortUrlSchema,
  shortCodeSchema,
} from './short-url.schema.js';

function messageOf(result: {
  success: boolean;
  error?: { issues: { message: string }[] };
}) {
  return result.success
    ? undefined
    : result.error?.issues.map((issue) => issue.message);
}

describe('shortCodeSchema', () => {
  it('accepts a code of the configured length', () => {
    expect(SHORT_CODE_LENGTH).toBe(12);
    expect(shortCodeSchema.parse('Ab3_-xyz0123')).toBe('Ab3_-xyz0123');
  });

  it('rejects codes with the wrong length or characters', () => {
    expect(messageOf(shortCodeSchema.safeParse('short'))).toEqual([
      'O código informado é inválido.',
    ]);
    expect(messageOf(shortCodeSchema.safeParse('abcdefghij123'))).toEqual([
      'O código informado é inválido.',
    ]);
    expect(messageOf(shortCodeSchema.safeParse('abc defghij1'))).toEqual([
      'O código informado é inválido.',
    ]);
  });
});

describe('createShortUrlSchema', () => {
  it('trims a valid http or https address', () => {
    expect(
      createShortUrlSchema.parse({
        url: '  https://example.com/a  ',
        extra: true,
      }),
    ).toEqual({ url: 'https://example.com/a' });
  });

  it('requires the url field', () => {
    expect(messageOf(createShortUrlSchema.safeParse({}))).toEqual([
      'O campo "url" é obrigatório.',
    ]);
    expect(messageOf(createShortUrlSchema.safeParse({ url: '   ' }))).toEqual([
      'O campo "url" é obrigatório.',
    ]);
  });

  it('rejects addresses that are not http or https', () => {
    expect(
      messageOf(createShortUrlSchema.safeParse({ url: 'javascript:alert(1)' })),
    ).toEqual(['O campo "url" deve ser um endereço http ou https.']);
    expect(
      messageOf(createShortUrlSchema.safeParse({ url: 'ftp://example.com' })),
    ).toEqual(['O campo "url" deve ser um endereço http ou https.']);
  });
});
