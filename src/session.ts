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
