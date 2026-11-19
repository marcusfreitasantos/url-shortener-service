import { z } from 'zod';

export const SHORT_CODE_LENGTH = 12;

export const shortCodeSchema = z
  .string()
  .regex(
    new RegExp(`^[A-Za-z0-9_-]{${SHORT_CODE_LENGTH}}$`),
    'O código informado é inválido.',
  );

export const createShortUrlSchema = z.object({
  url: z
    .string({ error: 'O campo "url" é obrigatório.' })
    .trim()
    .min(1, 'O campo "url" é obrigatório.')
    .pipe(
      z.url({
        protocol: /^https?$/,
        error: 'O campo "url" deve ser um endereço http ou https.',
      }),
    ),
});

export type CreateShortUrl = z.infer<typeof createShortUrlSchema>;
