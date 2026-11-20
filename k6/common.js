import http from 'k6/http';
import { check } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

export const baseUrl = (__ENV.BASE_URL || 'http://host.docker.internal:3000').replace(
  /\/$/,
  '',
);
export const targetUrl = 'https://example.com/k6-load-test';

const profile = __ENV.K6_PROFILE || 'baseline';
const duration = __ENV.K6_DURATION || '1m';
const rate = positiveInteger('K6_RATE', 20);
const preAllocatedVUs = positiveInteger('K6_VUS', 10);
const configuredMaxVUs = optionalPositiveInteger('K6_MAX_VUS');

export const options = {
  summaryTrendStats: [
    'avg',
    'min',
    'med',
    'max',
    'p(90)',
    'p(95)',
    'p(99)',
    'p(99.9)',
    'count',
  ],
  scenarios: {
    [profile]: arrivalScenario(),
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

function positiveInteger(name, fallback) {
  const raw = __ENV[name];
  const value = raw === undefined || raw === '' ? fallback : Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return value;
}

function optionalPositiveInteger(name) {
  const raw = __ENV[name];
  if (raw === undefined || raw === '') {
    return undefined;
  }
  return positiveInteger(name);
}

function maxVUs(fallback) {
  return Math.max(preAllocatedVUs, configuredMaxVUs ?? fallback);
}

function arrivalScenario() {
  if (profile === 'baseline') {
    return {
      executor: 'constant-arrival-rate',
      duration,
      rate,
      timeUnit: '1s',
      preAllocatedVUs,
      maxVUs: maxVUs(Math.max(preAllocatedVUs, rate * 2)),
    };
  }

  if (profile === 'breakpoint') {
    return {
      executor: 'ramping-arrival-rate',
      startRate: Math.max(1, Math.floor(rate / 4)),
      timeUnit: '1s',
      preAllocatedVUs,
      maxVUs: maxVUs(Math.max(preAllocatedVUs, rate * 8)),
      stages: [
        { target: rate, duration },
        { target: rate * 2, duration },
        { target: rate * 4, duration },
        { target: rate * 8, duration },
      ],
    };
  }

  throw new Error(
    `K6_PROFILE must be "baseline" or "breakpoint". Received "${profile}".`,
  );
}

export function handleSummary(data) {
  const summary = textSummary(data, { indent: ' ', enableColors: false });
  const scenario = `${__ENV.K6_SCENARIO || 'create-urls'}-${profile}`.replace(
    /[^a-zA-Z0-9_-]/g,
    '-',
  );
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  const outputPath = `/results/${scenario}-${timestamp}-summary`;

  return {
    stdout: summary,
    [`${outputPath}.txt`]: summary,
    [`${outputPath}.json`]: JSON.stringify(data, null, 2),
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
