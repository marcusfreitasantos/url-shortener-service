import http from 'k6/http';
import { check } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

export const baseUrl = (__ENV.BASE_URL || 'http://host.docker.internal:3000').replace(
  /\/$/,
  '',
);
export const targetUrl = 'https://example.com/k6-load-test';

export const options = {
  vus: Number(__ENV.K6_VUS || 10),
  duration: __ENV.K6_DURATION || '10s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

export function handleSummary(data) {
  const summary = textSummary(data, { indent: ' ', enableColors: false });
  const scenario = (__ENV.K6_SCENARIO || 'create-urls').replace(
    /[^a-zA-Z0-9_-]/g,
    '-',
  );
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  return {
    stdout: summary,
    [`/results/${scenario}-${timestamp}-summary.txt`]: summary,
  };
}

export function createShortUrl() {
  const response = http.post(
    `${baseUrl}/api/short-urls`,
    JSON.stringify({ url: targetUrl }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'POST /api/short-urls' },
    },
  );
  const created = check(response, {
    'short URL creation returns 201': (result) => result.status === 201,
  });

  if (!created) {
    return;
  }

  const shortUrl = response.json('shortUrl');
  const shortCode =
    typeof shortUrl === 'string'
      ? shortUrl.split('/').filter(Boolean).pop()
      : undefined;
  check(shortCode, {
    'creation response contains a short code': (code) =>
      typeof code === 'string' && code.length > 0,
  });
}

export function getRedirect(shortCode) {
  const response = http.get(`${baseUrl}/${shortCode}`, {
    redirects: 0,
    tags: { name: 'GET /:code' },
  });
  check(response, {
    'short URL redirects with 302': (result) => result.status === 302,
    'redirect points to the original URL': (result) =>
      result.headers.Location === targetUrl,
  });
}
