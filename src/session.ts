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

// --- the website header said the member is an admin (it has an Admin Panel link) ---
let siteAdmin = false;
const adminListeners = new Set<(v: boolean) => void>();

export function setSiteAdmin(v: boolean): void {
  if (v === siteAdmin) return;
  siteAdmin = v;
  adminListeners.forEach((f) => f(v));
}

export function getSiteAdmin(): boolean {
  return siteAdmin;
}

export function subscribeSiteAdmin(f: (v: boolean) => void): () => void {
  adminListeners.add(f);
  return () => { adminListeners.delete(f); };
}
