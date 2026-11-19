import {
  handleSummary,
  options,
  createShortUrl,
  getRedirect,
} from './common.js';
import { randomRedirectCode } from './redirect-codes.js';

export { handleSummary, options };

export default function mixedWorkload() {
  if (Math.random() < 0.1) {
    createShortUrl();
    return;
  }

  getRedirect(randomRedirectCode());
}
