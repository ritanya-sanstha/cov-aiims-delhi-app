/**
 * src/config/index.ts
 * Runtime access to the Register Artifact.
 * All components read from REGISTER — never hardcode colors, URLs, or names.
 */
import Constants from 'expo-constants';

export interface TabConfig {
  id: string;
  label: string;
  icon: string;
  /** Website page this tab loads. Omit for native tabs. */
  path?: string;
  /** True when the tab is a native screen, not a WebView */
  native?: boolean;
}

export interface MoreLink {
  label: string;
  /** Ionicons name */
  icon: string;
  /** Website page opened inside the app */
  path: string;
}

export interface InstituteRegister {
  institute: {
    name: string;
    shortName: string;
    code: string;
    tagline: string;
    description: string;
  };
  app: {
    appName: string;
    bundleId: string;
    androidPackage: string;
    versionCode: number;
    easProfileName: string;
  };
  website: {
    baseUrl: string;
    loginPath: string;
    homePath: string;
    /** Member-only page used at launch to tell if the user is logged in */
    authCheckPath: string;
    /** Page that has the website's own Sign Out button (opened in the app) */
    profilePath: string;
    /** Visible text of that button */
    signOutButtonText: string;
    /** Hide the website's own floating bottom bar (text must contain all of these) */
    hideSiteBottomNavMarkers?: string[];
    /** Shown as "Contact us" on the More screen (opens the mail app) */
    contactEmail?: string;
    allowedDomains: string[];
  };
  branding: {
    logoFile: string;
    primaryColor: string;
    accentColor: string;
    statusBarStyle: 'light' | 'dark';
    splashBg: string;
    helplineColor: string;
  };
  navigation: {
    tabs: TabConfig[];
    /** Pages listed on the native More screen */
    more: MoreLink[];
  };
  standard: {
    ritanyaTreeLogo: boolean;
    tagline1: string;
    tagline2: string;
    memberIdPrefix: string;
    memberIdInstCode: string;
    poweredBy: string;
  };
}

export const REGISTER: InstituteRegister =
  (Constants.expoConfig?.extra?.register as InstituteRegister) ?? {
    // Fallback for bare metro / local dev without REGISTER_FILE set
    institute: { name: 'COV – AIIMS Delhi', shortName: 'AIIMS Delhi', code: 'AD', tagline: 'Alumni Network', description: '' },
    app: { appName: 'AIIMS Delhi Alumni', bundleId: 'in.ritanyasanstha.aiimsdelhi', androidPackage: 'in.ritanyasanstha.aiimsdelhi', versionCode: 1, easProfileName: 'aiims-delhi' },
    website: { baseUrl: 'https://aiimsdelhi.ritanyasanstha.in', loginPath: '/login', homePath: '/', authCheckPath: '/profile', profilePath: '/profile', signOutButtonText: 'Sign Out', hideSiteBottomNavMarkers: ['mentors', 'jobs'], contactEmail: 'contact@ritanyasanstha.org', allowedDomains: ['aiimsdelhi.ritanyasanstha.in', 'ritanyasanstha.in'] },
    branding: { logoFile: 'aiims-delhi-logo.png', primaryColor: '#1B2B5E', accentColor: '#C9A84C', statusBarStyle: 'light', splashBg: '#1B2B5E', helplineColor: '#EF4444' },
    navigation: {
      tabs: [
        { id: 'home', label: 'Home', icon: 'home', path: '/' },
        { id: 'helpline', label: 'Helpline', icon: 'heart', path: '/gethelp' },
        { id: 'directory', label: 'Directory', icon: 'people', path: '/alumni' },
        { id: 'jobs', label: 'Jobs', icon: 'briefcase', path: '/jobs' },
        { id: 'more', label: 'More', icon: 'grid', native: true },
      ],
      more: [],
    },
    standard: { ritanyaTreeLogo: true, tagline1: 'One Family — Every Stage of Life', tagline2: 'Help Others Celebrate Life', memberIdPrefix: 'AB', memberIdInstCode: 'AD', poweredBy: 'Ritanya Sanstha' },
  };

/** Website path for a tab, from the register (never hardcode paths in screens) */
export function tabPath(id: string): string {
  const tab = REGISTER.navigation.tabs.find((t) => t.id === id);
  if (!tab?.path) throw new Error(`Tab "${id}" has no website path in register.navigation.tabs`);
  return tab.path;
}

/** Full URL for a website path */
export function siteUrl(path: string): string {
  const base = REGISTER.website.baseUrl.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
}

/** True if the given URL is within our allowed domain whitelist */
export function isAllowedUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return REGISTER.website.allowedDomains.some(
      (d) => hostname === d || hostname.endsWith(`.${d}`)
    );
  } catch {
    return false;
  }
}

/** True if this URL represents a logged-in page (not the login page) */
export function isLoggedInUrl(url: string): boolean {
  const loginPath = REGISTER.website.loginPath; // '/login'
  try {
    const { pathname } = new URL(url);
    return !pathname.startsWith(loginPath);
  } catch {
    return false;
  }
}
