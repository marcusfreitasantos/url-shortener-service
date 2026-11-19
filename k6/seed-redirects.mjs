import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const count = Number(process.argv[2]);
if (!Number.isSafeInteger(count) || count < 1) {
  throw new Error('Usage: node k6/seed-redirects.mjs <positive-count>');
}

const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
);
const url = new URL(`${baseUrl}/api/short-urls/list`);
url.searchParams.set('limit', String(count));

const response = await fetch(url);
if (!response.ok) {
  throw new Error(
    `Fetching seed URLs returned HTTP ${response.status}`,
  );
}

const result = await response.json();
if (!result || !Array.isArray(result.data)) {
  throw new Error('The API response does not contain a URL list');
}

const codes = result.data.map((shortUrl, index) => {
  if (
    !shortUrl ||
    typeof shortUrl.code !== 'string' ||
    shortUrl.code.length === 0
  ) {
    throw new Error(`Seed URL ${index + 1} has no short code`);
  }

  return shortUrl.code;
});

if (codes.length !== count) {
  throw new Error(
    `Requested ${count} URLs, but the API returned ${codes.length}`,
  );
}

if (new Set(codes).size !== codes.length) {
  throw new Error('The API returned duplicate short codes while seeding');
}

const dataDirectory = fileURLToPath(new URL('./data/', import.meta.url));
const outputPath = join(dataDirectory, 'redirect-codes.json');
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(codes, null, 2)}\n`);

console.log(`Saved ${codes.length} existing URL codes to ${outputPath}`);
