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
  setSiteChrome(EMPTY_CHROME); // signed out: forget the previous member's photo
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

// --- who the website header says is signed in (admin link, profile photo / initials) ---
export interface SiteChrome { admin: boolean; avatar: string; initials: string }
const EMPTY_CHROME: SiteChrome = { admin: false, avatar: '', initials: '' };
let siteChrome: SiteChrome = EMPTY_CHROME;
const chromeListeners = new Set<(c: SiteChrome) => void>();

export function setSiteChrome(c: SiteChrome): void {
  if (c.admin === siteChrome.admin && c.avatar === siteChrome.avatar && c.initials === siteChrome.initials) return;
  siteChrome = c;
  chromeListeners.forEach((f) => f(c));
}

export function getSiteChrome(): SiteChrome {
  return siteChrome;
}

export function subscribeSiteChrome(f: (c: SiteChrome) => void): () => void {
  chromeListeners.add(f);
  return () => { chromeListeners.delete(f); };
}
