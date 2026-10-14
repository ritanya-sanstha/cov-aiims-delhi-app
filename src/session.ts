/**
 * src/session.ts — where the website sent the user right after login.
 *
 * The Home tab shows that page, so it follows whatever the website treats as
 * the member landing page instead of a hardcoded path that may not exist.
 */
let landingUrl: string | null = null;

export function setLandingUrl(url: string): void {
  landingUrl = url;
}

export function clearLandingUrl(): void {
  landingUrl = null;
  resetSiteChrome(); // signed out: forget the previous member's photo and invite code
}

/** Path (+query) of the post-login landing page, or the given default. */
export function getHomePath(defaultPath: string): string {
  if (!landingUrl) return defaultPath;
  try {
    const u = new URL(landingUrl);
    return `${u.pathname}${u.search}`;
  } catch {
    return defaultPath;
  }
}

// --- who is signed in: admin link, profile photo / initials, unread alerts, invite code ---
// Filled from GET /api/app/v1/me when the website has it, else read from the website header (siteScripts).
export interface SiteChrome { admin: boolean; avatar: string; initials: string; unread: number; referralCode: string }
const EMPTY_CHROME: SiteChrome = { admin: false, avatar: '', initials: '', unread: 0, referralCode: '' };
let siteChrome: SiteChrome = EMPTY_CHROME;
const chromeListeners = new Set<(c: SiteChrome) => void>();

/** Merge new values into the current ones (a source that does not know a field leaves it alone). */
export function setSiteChrome(patch: Partial<SiteChrome>): void {
  const next = { ...siteChrome, ...patch };
  if ((Object.keys(next) as (keyof SiteChrome)[]).every((k) => next[k] === siteChrome[k])) return;
  siteChrome = next;
  chromeListeners.forEach((f) => f(next));
}

export function resetSiteChrome(): void {
  if (siteChrome === EMPTY_CHROME) return;
  siteChrome = EMPTY_CHROME;
  chromeListeners.forEach((f) => f(EMPTY_CHROME));
}

export function getSiteChrome(): SiteChrome {
  return siteChrome;
}

export function subscribeSiteChrome(f: (c: SiteChrome) => void): () => void {
  chromeListeners.add(f);
  return () => { chromeListeners.delete(f); };
}
