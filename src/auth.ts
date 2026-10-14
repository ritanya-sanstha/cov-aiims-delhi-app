/**
 * src/auth.ts — ask the website whether the member is really signed in.
 *
 * Fetches a member-only page (REGISTER.website.authCheckPath). Not signed in →
 * the website redirects to /login. The session cookie lives in the system
 * cookie jar shared with every WebView, so this sees the same login as the pages.
 */
import { REGISTER, siteUrl } from './config';

export async function isLoggedIn(timeoutMs = 5000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(siteUrl(REGISTER.website.authCheckPath), {
      method: 'GET',
      redirect: 'follow',
      credentials: 'include',
      headers: { Accept: 'text/html' },
      signal: controller.signal,
    });
    const finalUrl = res.url ?? '';
    // A 404/5xx (e.g. page not deployed) must not count as "logged in".
    return res.ok && !finalUrl.includes(REGISTER.website.loginPath);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
