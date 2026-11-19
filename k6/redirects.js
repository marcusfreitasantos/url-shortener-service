import { handleSummary, options, getRedirect } from './common.js';
import { randomRedirectCode } from './redirect-codes.js';

export { handleSummary, options };

export default function redirects() {
  getRedirect(randomRedirectCode());
}
